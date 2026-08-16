import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, deleteUser } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  onSnapshot, writeBatch, runTransaction, serverTimestamp, query, where
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const ARRAY_COLLECTIONS=["groups","students","rooms","teachers","curricula","disciplines","lessonTypes"];
const SCHEDULE_COLLECTION="schedule";
const ROOM_BOOKINGS_COLLECTION="roomBookings";
const LOCAL_DATA_KEYS=["remsScheduleData_v09","remsScheduleData_v08","remsScheduleData_v07","remsScheduleData_v06","remsScheduleData_v051","remsScheduleData_v04","remsScheduleData_v02","remsScheduleData_v01"];

function recoveryScore(st){
  if(!st||typeof st!=="object")return -1;
  const n=k=>Array.isArray(st[k])?st[k].length:0;
  return n("students")*4+n("teachers")*4+n("disciplines")*3+n("schedule")*3+n("roomBookings")*3+n("rooms")*2+n("groups")*2+n("curricula")*2+n("lessonTypes");
}
function recoverySummary(st){
  if(!st)return "локальної копії не знайдено";
  const n=k=>Array.isArray(st[k])?st[k].length:0;
  return `${n("students")} студентів · ${n("teachers")} викладачів · ${n("rooms")} аудиторій · ${n("disciplines")} дисциплін · ${n("schedule")} занять · ${n("roomBookings")} бронювань`;
}
function bestLocalRecoveryState(){
  const candidates=[];
  try{const cur=window.REMS_GET_STATE?.();if(cur)candidates.push({source:"поточний браузер",state:cur});}catch(_){}
  for(const key of LOCAL_DATA_KEYS){
    try{const raw=localStorage.getItem(key);if(!raw)continue;let st=JSON.parse(raw);st=window.REMS_MIGRATE_STATE?.(st)||st;candidates.push({source:key,state:st});}catch(_){}
  }
  candidates.sort((a,b)=>recoveryScore(b.state)-recoveryScore(a.state));
  return candidates[0]||null;
}
const WORKSPACE=window.REMS_FIREBASE_WORKSPACE_ID||"main";
const CONFIG_OVERRIDE_KEY="REMS_FIREBASE_CONFIG_OVERRIDE";
const clean=x=>JSON.parse(JSON.stringify(x));
function canonicalValue(v){
  if(Array.isArray(v))return v.map(canonicalValue);
  if(v&&typeof v==="object"){
    const out={};
    Object.keys(v).sort().forEach(k=>{out[k]=canonicalValue(v[k]);});
    return out;
  }
  return v;
}
const eq=(a,b)=>JSON.stringify(canonicalValue(a))===JSON.stringify(canonicalValue(b));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function configFromStorage(){
  try{return JSON.parse(localStorage.getItem(CONFIG_OVERRIDE_KEY)||"null");}catch(e){return null;}
}
const config={...(window.REMS_FIREBASE_CONFIG||{}),...(configFromStorage()||{})};
const configured=Boolean(config.apiKey&&config.projectId&&config.appId);
let app=null,auth=null,fire=null,user=null,profile=null,remoteState=null,liveState=null;
let unsubs=[],profileUnsub=null,pushTimer=null,pendingPush=null,pushing=false,rejecting=false;
let cloudReconnectTimer=null,cloudReconnectPromise=null,lastCloudError=null,lastCloudErrorAt=0;
let cloudWasOnline=false,cloudAuthGeneration=0;

let lastCatalogChangeId="";
let catalogRefreshBusy=false;
let catalogRefreshQueued=null;
let hiddenSuspendTimer=null;
let realtimeSuspended=false;
const HIDDEN_SUSPEND_MS=10*60*1000;

window.REMS_CLOUD={
  configured,
  canWrite:()=>{
    if(profile?.enabled===false)return false;
    if(profile?.role==="admin")return true;
    if(profile?.role==="dispatcher")return ["schedule","timetable","roomGrid","home"].includes(window.REMS_CURRENT_PAGE?.());
    return false;
  },
  schedulePush,
  rejectLocalEdit,
  reload:reloadRemote,
  signOut:()=>auth?signOut(auth):Promise.resolve(),
  saveConfigOverride,
  clearConfigOverride,
  uploadLocal:()=>uploadWholeState(window.REMS_GET_STATE?.()),
  role:()=>profile?.role||null,
  email:()=>user?.email||null,
  teacherId:()=>profile?.teacherId??null,
  profile:()=>profile?clean(profile):null,
  renderUsersPage,
  listUsers:listUserProfiles,
  createUser:createManagedUser,
  updateUser:updateManagedUser,
  sendPasswordReset:sendManagedPasswordReset,
  reconnect:()=>manualCloudReconnect(),
  acceptScheduleBaseline:(schedule)=>{
    if(!remoteState||pushing||pendingPush)return false;
    remoteState.schedule=clean(schedule||[]);
    if(liveState)liveState.schedule=clean(schedule||[]);
    return true;
  },
  retryPending:()=>{
    if(!pendingPush)return false;
    clearTimeout(pushTimer);
    pushTimer=setTimeout(flushPush,10);
    return true;
  }
};

function roleLabel(r){return ({admin:"Адміністратор",dispatcher:"Диспетчер",teacher:"Викладач",viewer:"Перегляд"})[r]||r||"—";}
function setSidebar(status,text,sub){
  const dot=document.querySelector("#cloudStatusDot"),t=document.querySelector("#cloudStatusText"),u=document.querySelector("#cloudUserText");
  if(dot)dot.className=`cloud-dot ${status}`;
  if(t)t.textContent=text;
  if(u)u.textContent=sub||"";
}
function toast(message,type="ok",timeout=4200){
  let wrap=document.querySelector("#cloudToasts");
  if(!wrap){wrap=document.createElement("div");wrap.id="cloudToasts";wrap.className="cloud-toasts";document.body.appendChild(wrap);}
  const el=document.createElement("div");el.className=`cloud-toast ${type}`;el.textContent=message;wrap.appendChild(el);
  setTimeout(()=>el.remove(),timeout);
}

function cloudErrorCode(e){
  return String(e?.code||"unknown").replace(/^firestore\//,"");
}
function cloudErrorStep(e){
  return e?.remsStep?String(e.remsStep):"";
}
function cloudErrorSummary(e){
  const code=cloudErrorCode(e),step=cloudErrorStep(e);
  return `${code}${step?` · ${step}`:""}`;
}
function markCloudStep(e,step){
  try{e.remsStep=step;}catch(_){}
  return e;
}
async function cloudReadStep(step,fn){
  try{return await fn();}
  catch(e){throw markCloudStep(e,step);}
}
function clearCloudReconnectTimer(){
  if(cloudReconnectTimer){clearTimeout(cloudReconnectTimer);cloudReconnectTimer=null;}
}
function cloudStopDataListeners(){
  unsubs.forEach(fn=>{try{fn();}catch(_){}});
  unsubs=[];
}
function cloudRetryDelay(attempt){
  return [0,700,1800,4000][Math.min(attempt,3)];
}
function cloudIsSignedInGeneration(generation){
  return !!user&&generation===cloudAuthGeneration;
}
async function refreshOwnProfileAndToken(forceToken=false){
  if(!user||!fire)throw new Error("Немає активного користувача Firebase.");
  if(forceToken){
    await user.getIdToken(true);
  }
  const snap=await cloudReadStep("профіль користувача",()=>getDoc(doc(fire,"users",user.uid)));
  if(!snap.exists()){
    const err=new Error("Профіль користувача не знайдено.");
    err.code="REMS_ACCESS_NOT_PROVISIONED";
    throw err;
  }
  const fresh=snap.data();
  if(fresh.enabled===false){
    const err=new Error("Доступ цього облікового запису заблоковано.");
    err.code="REMS_ACCESS_DISABLED";
    throw err;
  }
  profile=fresh;
  updateAdminUi();
  return fresh;
}
function scheduleCloudReconnect(error=null,source="connection",delayMs=12000){
  if(error){
    lastCloudError=error;
    lastCloudErrorAt=Date.now();
  }
  if(!configured||!auth?.currentUser)return;
  if(cloudReconnectPromise||cloudReconnectTimer)return;

  const email=auth.currentUser.email||user?.email||"";
  const detail=error?cloudErrorSummary(error):"";
  setSidebar("error","Тимчасово офлайн",`${email}${detail?` · ${detail}`:""} · повторю автоматично`);

  cloudReconnectTimer=setTimeout(()=>{
    cloudReconnectTimer=null;
    manualCloudReconnect(true);
  },Math.max(500,delayMs));
}
async function manualCloudReconnect(silent=false){
  if(!configured||!auth?.currentUser)return false;
  clearCloudReconnectTimer();
  if(cloudReconnectPromise)return cloudReconnectPromise;

  const generation=cloudAuthGeneration;
  cloudReconnectPromise=(async()=>{
    setSidebar("syncing","Відновлення зв’язку…",auth.currentUser?.email||"Firebase");
    try{
      const ok=await connectCloudDataWithRetry(generation,{silent,maxAttempts:4,forceFirstRefresh:true});
      return ok;
    }finally{
      cloudReconnectPromise=null;
    }
  })();
  return cloudReconnectPromise;
}
function showLogin(){
  let o=document.querySelector("#cloudAuthOverlay");
  if(!o){o=document.createElement("div");o.id="cloudAuthOverlay";o.className="cloud-auth-overlay";document.body.appendChild(o);}
  o.innerHTML=`<div class="cloud-auth-card"><div class="brand-mark cloud-auth-logo">Р</div><h2>РЕМС-Розклад</h2><p>Увійдіть, щоб працювати зі спільною базою кафедри.</p><form id="cloudLoginForm"><label>Email<input id="cloudEmail" type="email" autocomplete="username" required></label><label>Пароль<input id="cloudPassword" type="password" autocomplete="current-password" required></label><button class="primary" type="submit">Увійти</button><div id="cloudLoginError" class="cloud-error"></div></form><div class="small">Облікові записи створюються адміністратором у Firebase Authentication.</div></div>`;
  o.classList.remove("hidden");
  o.querySelector("#cloudLoginForm").onsubmit=async e=>{
    e.preventDefault();const err=o.querySelector("#cloudLoginError");err.textContent="";
    try{await signInWithEmailAndPassword(auth,o.querySelector("#cloudEmail").value.trim(),o.querySelector("#cloudPassword").value);}
    catch(ex){err.textContent=humanAuthError(ex);}
  };
}
function hideLogin(){document.querySelector("#cloudAuthOverlay")?.classList.add("hidden");}
function showAccessBlocked(message){
  let o=document.querySelector("#cloudAuthOverlay");
  if(!o){o=document.createElement("div");o.id="cloudAuthOverlay";o.className="cloud-auth-overlay";document.body.appendChild(o);}
  o.innerHTML=`<div class="cloud-auth-card"><div class="brand-mark cloud-auth-logo">Р</div><h2>Доступ обмежено</h2><p>${escapeHtml(message||"Цей обліковий запис не має доступу до РЕМС-Розкладу.")}</p><button class="primary" id="blockedSignOut">Вийти</button></div>`;
  o.classList.remove("hidden");
  o.querySelector("#blockedSignOut").onclick=()=>signOut(auth);
}
function updateAdminUi(){
  const teacherMode=profile?.role==="teacher";
  document.body.classList.toggle("teacher-portal-mode",teacherMode);
  const teacherNav=document.querySelector("#teacherScheduleNav");
  if(teacherNav)teacherNav.style.display=teacherMode?"":"none";
  window.REMS_APPLY_ROLE_ACCESS?.();
  if(window.REMS_CURRENT_PAGE?.()==="users"&&profile?.role!=="admin"){
    const mount=document.querySelector("#page-users");
    if(mount)mount.innerHTML=`<div class="card section"><div class="empty">Керування користувачами доступне лише адміністратору.</div></div>`;
  }
}
function humanAuthError(e){
  const c=e?.code||"";
  if(c.includes("invalid-credential"))return "Неправильний email або пароль.";
  if(c.includes("too-many-requests"))return "Забагато спроб. Спробуйте трохи пізніше.";
  if(c.includes("network-request-failed"))return "Немає зв’язку з Firebase.";
  return "Не вдалося увійти: "+(e?.message||c);
}

function saveConfigOverride(raw){
  try{
    let value=raw;
    if(typeof raw==="string"){
      const txt=raw.trim().replace(/^const\s+firebaseConfig\s*=\s*/,"").replace(/;\s*$/,"");
      // Accept JSON or the common Firebase object with unquoted keys.
      try{value=JSON.parse(txt);}catch(_){
        const pairs={};
        for(const m of txt.matchAll(/(apiKey|authDomain|projectId|storageBucket|messagingSenderId|appId)\s*:\s*["']([^"']*)["']/g))pairs[m[1]]=m[2];
        value=pairs;
      }
    }
    if(!value?.apiKey||!value?.projectId||!value?.appId)throw new Error("Неповна конфігурація");
    localStorage.setItem(CONFIG_OVERRIDE_KEY,JSON.stringify(value));location.reload();
  }catch(e){alert("Не вдалося прочитати конфігурацію Firebase. Скопіюйте весь об’єкт firebaseConfig.");}
}
function clearConfigOverride(){localStorage.removeItem(CONFIG_OVERRIDE_KEY);location.reload();}

async function ensureProfile(u){
  const uref=doc(fire,"users",u.uid),bref=doc(fire,"system","bootstrap");
  const [us,bs]=await Promise.all([getDoc(uref),getDoc(bref)]);
  if(us.exists())return us.data();
  if(!bs.exists()){
    const p={email:u.email||"",displayName:u.displayName||"",role:"admin",enabled:true,createdAt:new Date().toISOString()};
    await setDoc(uref,p);
    await setDoc(bref,{adminUid:u.uid,createdAt:serverTimestamp()});
    toast("Перший користувач став адміністратором системи.","ok",7000);
    return p;
  }
  const err=new Error("Цей обліковий запис ще не доданий адміністратором РЕМС-Розкладу.");
  err.code="REMS_ACCESS_NOT_PROVISIONED";
  throw err;
}

function collRef(name){return collection(fire,"workspaces",WORKSPACE,name);}
function itemRef(name,id){return doc(fire,"workspaces",WORKSPACE,name,String(id));}
function settingsRef(){return doc(fire,"workspaces",WORKSPACE,"settings","main");}
function catalogSignalRef(){return doc(fire,"workspaces",WORKSPACE,"meta","catalog");}

async function loadRemoteState({includeDynamic=true}={}){
  const settingsSnap=await cloudReadStep("settings",()=>getDoc(settingsRef()));
  if(!settingsSnap.exists())return null;

  const base=clean(window.REMS_INITIAL_DATA||{});
  const settings=settingsSnap.data();
  Object.assign(base,settings);

  // Static reference data is read ONCE on connection.
  // It is no longer kept alive by seven separate snapshot listeners.
  for(const name of ARRAY_COLLECTIONS){
    const snap=await cloudReadStep(name,()=>getDocs(collRef(name)));
    base[name]=snap.docs.map(d=>d.data()).sort(sortById);
  }

  if(includeDynamic){
    const ss=await cloudReadStep(SCHEDULE_COLLECTION,()=>getDocs(collRef(SCHEDULE_COLLECTION)));
    base.schedule=ss.docs.map(d=>d.data()).sort(sortById);

    const bs=await cloudReadStep(ROOM_BOOKINGS_COLLECTION,()=>getDocs(collRef(ROOM_BOOKINGS_COLLECTION)));
    base.roomBookings=bs.docs.map(d=>d.data()).sort(sortById);
  }else{
    // Keep the currently visible dynamic data until realtime initial snapshots arrive.
    const current=window.REMS_GET_STATE?.()||remoteState||{};
    base.schedule=clean(current.schedule||[]);
    base.roomBookings=clean(current.roomBookings||[]);
  }

  base.weekDays=clean(window.REMS_INITIAL_DATA?.weekDays||base.weekDays||[]);
  return base;
}
function sortById(a,b){const an=Number(a.id),bn=Number(b.id);if(Number.isFinite(an)&&Number.isFinite(bn))return an-bn;return String(a.id).localeCompare(String(b.id));}

async function uploadWholeState(state,sourceLabel="поточний браузер") {
  if(!state||!profile||profile.role!=="admin")return alert("Початкові дані може завантажити лише адміністратор.");
  unsubs.forEach(f=>f());unsubs=[];
  setSidebar("syncing","Завантаження…",user.email||"");
  const st=clean(window.REMS_MIGRATE_STATE?.(state)||state);st.schemaVersion=15;
  try{
    let step=0;const total=ARRAY_COLLECTIONS.length+3;
    for(const name of ARRAY_COLLECTIONS){
      step++;setSidebar("syncing",`Завантаження ${step}/${total}…`,`${user.email||""} · ${name}`);
      await replaceCollection(name,st[name]||[]);
    }
    step++;setSidebar("syncing",`Завантаження ${step}/${total}…`,`${user.email||""} · schedule`);
    await replaceSchedule(st.schedule||[]);
    step++;setSidebar("syncing",`Завантаження ${step}/${total}…`,`${user.email||""} · roomBookings`);
    await replaceRoomBookings(st.roomBookings||[]);
    // Settings are written last: an incomplete bootstrap is not marked as ready.
    step++;setSidebar("syncing",`Завантаження ${step}/${total}…`,`${user.email||""} · settings`);
    await setDoc(settingsRef(),settingsPart(st));
    try{await publishCatalogSignal(ARRAY_COLLECTIONS);}catch(e){console.warn("Catalog signal after restore failed",e);}
    remoteState=clean(st);
    liveState=clean(st);
    window.REMS_APPLY_REMOTE_STATE?.(st);
    subscribeRealtime();
    setSidebar("online","Онлайн",`${user.email} · ${roleLabel(profile.role)}`);
    toast(`Хмару відновлено з локальної копії: ${recoverySummary(st)}.`,`ok`,8000);
    renderCloudSettings();
  }catch(e){
    console.error("Cloud upload failed",e);
    setSidebar("error","Помилка завантаження",user?.email||"");
    toast(`Хмару не перезаписано повністю. Помилка: ${e?.code||e?.message||e}`,"error",12000);
    subscribeRealtime();
    throw e;
  }
}

async function replaceCollection(name,items){
  const snap=await getDocs(collRef(name));
  const ops=[];
  snap.docs.forEach(d=>ops.push({type:"delete",ref:d.ref}));
  items.forEach(it=>ops.push({type:"set",ref:itemRef(name,it.id),data:clean(it)}));
  await commitOps(ops);
}
async function replaceSchedule(items){
  const snap=await getDocs(collRef(SCHEDULE_COLLECTION));
  for(const d of snap.docs)await deleteScheduleLesson(d.id);
  for(const it of items)await writeScheduleLesson(clean(it));
}
async function replaceRoomBookings(items){
  const snap=await getDocs(collRef(ROOM_BOOKINGS_COLLECTION));
  for(const d of snap.docs)await deleteRoomBookingCloud(d.id);
  for(const it of items)await writeRoomBookingCloud(clean(it));
}
async function commitOps(ops){
  for(let i=0;i<ops.length;i+=8){
    const batch=writeBatch(fire);
    for(const op of ops.slice(i,i+8))op.type==="delete"?batch.delete(op.ref):batch.set(op.ref,op.data);
    await batch.commit();
  }
}


function collectionChanged(name,oldState,newState){
  return !eq(oldState?.[name]||[],newState?.[name]||[]);
}
async function publishCatalogSignal(collectionsChanged=[]){
  if(!fire||!user||!collectionsChanged.length)return;
  const changeId=`${user.uid}:${Date.now()}:${Math.random().toString(36).slice(2,7)}`;
  lastCatalogChangeId=changeId;
  await setDoc(catalogSignalRef(),{
    changeId,
    collections:[...new Set(collectionsChanged.filter(x=>ARRAY_COLLECTIONS.includes(x)))],
    updatedAt:serverTimestamp()
  });
}
async function refreshCatalogCollections(names=ARRAY_COLLECTIONS){
  if(!fire||!liveState)return;

  const requested=[...new Set((names||ARRAY_COLLECTIONS).filter(x=>ARRAY_COLLECTIONS.includes(x)))];
  if(!requested.length)return;

  if(catalogRefreshBusy){
    catalogRefreshQueued=[...new Set([...(catalogRefreshQueued||[]),...requested])];
    return;
  }

  catalogRefreshBusy=true;
  try{
    for(const name of requested){
      const snap=await cloudReadStep(`оновлення ${name}`,()=>getDocs(collRef(name)));
      liveState[name]=snap.docs.map(d=>d.data()).sort(sortById);
    }

    if(!pendingPush&&!pushing){
      remoteState=clean(liveState);
      window.REMS_APPLY_REMOTE_STATE?.(remoteState);
    }
  }catch(e){
    console.error("Catalog refresh failed",e);
    scheduleCloudReconnect(markCloudStep(e,"оновлення довідників"),"catalog-refresh",4000);
  }finally{
    catalogRefreshBusy=false;
    const queued=catalogRefreshQueued;
    catalogRefreshQueued=null;
    if(queued?.length)setTimeout(()=>refreshCatalogCollections(queued),100);
  }
}

function settingsPart(st){return clean({schemaVersion:15,academicYear:st.academicYear,semester:st.semester,bellSchedule:st.bellSchedule||[]});}
function stateMap(items=[]){const m=new Map();for(const x of items)m.set(String(x.id),x);return m;}
function schedulePush(state){
  if(!configured||!user||!profile||!["admin","dispatcher"].includes(profile.role))return;
  pendingPush=clean(state);clearTimeout(pushTimer);pushTimer=setTimeout(flushPush,250);
}
async function flushPush(){
  if(pushing||!pendingPush||!remoteState)return;
  pushing=true;const wanted=pendingPush;pendingPush=null;
  setSidebar("syncing","Синхронізація…",`${user.email} · ${roleLabel(profile.role)}`);
  try{
    const changedCatalog=[];

    if(profile.role==="admin"){
      const desiredSettings=settingsPart(wanted),oldSettings=settingsPart(remoteState);
      if(!eq(desiredSettings,oldSettings))await setDoc(settingsRef(),desiredSettings);

      for(const name of ARRAY_COLLECTIONS){
        if(!collectionChanged(name,remoteState,wanted))continue;
        await syncCollection(name,remoteState[name]||[],wanted[name]||[]);
        changedCatalog.push(name);
      }
    }

    await syncSchedule(remoteState.schedule||[],wanted.schedule||[]);
    await syncRoomBookings(remoteState.roomBookings||[],wanted.roomBookings||[]);

    // One shared baseline for listeners + writes.
    // This prevents an old listener closure from restoring an older teachers /
    // disciplines / groups snapshot after a successful local save.
    remoteState=clean(wanted);
    liveState=clean(wanted);
    window.REMS_APPLY_REMOTE_STATE?.(remoteState);

    // Static changes are rare. One tiny signal tells other open clients which
    // reference collections to refresh; no permanent listener per collection.
    if(changedCatalog.length){
      try{await publishCatalogSignal(changedCatalog);}
      catch(e){console.warn("Catalog signal failed",e);}
    }

    setSidebar("online","Онлайн",`${user.email} · ${roleLabel(profile.role)}`);
  }catch(e){
    console.error("REMS cloud write failed",e);

    const isConflict=String(e?.message||e).startsWith("REMS_CONFLICT:");
    const summary=cloudErrorSummary(e);

    if(isConflict){
      setSidebar("error","Конфлікт у розкладі",`${user.email||""} · ${summary}`);
      toast(String(e.message).slice(14),"error",10000);
      // Logical collision: restore the actual server schedule.
      await reloadRemote();
    }else{
      // Firebase/network/rules problem: KEEP the user's local state.
      // Never replace it with an older server copy.
      if(!pendingPush)pendingPush=wanted;

      // Some schedule writes may already have succeeded before the error.
      // Reuse snapshots already received from Firestore so the next retry
      // doesn't unnecessarily write the successful rows again.
      if(liveState&&remoteState){
        remoteState.schedule=clean(liveState.schedule||remoteState.schedule||[]);
        remoteState.roomBookings=clean(liveState.roomBookings||remoteState.roomBookings||[]);
      }

      const code=cloudErrorCode(e);
      const title=
        code==="permission-denied"?"Немає дозволу Firebase":
        code==="resource-exhausted"?"Ліміт Firebase":
        "Не синхронізовано";

      setSidebar("error",title,`${user.email||""} · ${summary}`);

      const extra=code==="resource-exhausted"
        ?" Не натискай багато разів зберегти: локальні зміни збережені, а наступна зміна спробує синхронізацію знову."
        :"";

      toast(
        `Зміни залишилися у цьому браузері, але ще не записані у Firebase. Помилка: ${summary}.${extra} Дані не повертаю до старої версії.`,
        "error",
        15000
      );
    }
  }finally{
    pushing=false;
    // No rapid retry loop. The next user save retries the newest local state.
  }
}
async function syncCollection(name,oldItems,newItems){
  const old=stateMap(oldItems),neu=stateMap(newItems),ops=[];
  for(const [id,item] of neu)if(!old.has(id)||!eq(old.get(id),item))ops.push({type:"set",ref:itemRef(name,id),data:clean(item)});
  for(const [id] of old)if(!neu.has(id))ops.push({type:"delete",ref:itemRef(name,id)});
  if(!ops.length)return;
  try{await commitOps(ops);}
  catch(e){throw markCloudStep(e,`${name} · ${ops.length} змін`);}
}
async function syncSchedule(oldItems,newItems){
  const old=stateMap(oldItems),neu=stateMap(newItems);
  for(const [id,item] of neu){
    if(!old.has(id)||!eq(old.get(id),item)){
      try{await writeScheduleLesson(clean(item));}
      catch(e){throw markCloudStep(e,`розклад · запис ${id} · ${item.date||"без дати"} · ${item.discipline||"без дисципліни"}`);}
    }
  }
  for(const [id] of old){
    if(!neu.has(id)){
      try{await deleteScheduleLesson(id);}
      catch(e){throw markCloudStep(e,`розклад · видалення ${id}`);}
    }
  }
}

async function syncRoomBookings(oldItems,newItems){
  const old=stateMap(oldItems),neu=stateMap(newItems);
  for(const [id,item] of neu){
    if(!old.has(id)||!eq(old.get(id),item)){
      try{await writeRoomBookingCloud(clean(item));}
      catch(e){throw markCloudStep(e,`аудиторії · бронювання ${id}`);}
    }
  }
  for(const [id] of old){
    if(!neu.has(id)){
      try{await deleteRoomBookingCloud(id);}
      catch(e){throw markCloudStep(e,`аудиторії · видалення бронювання ${id}`);}
    }
  }
}

function slotKey(x){
  // Individual / consultation records occupy exactly half a pair.
  // They MUST NOT receive the same cloud lock for both halves.
  if(x?.specialSchedule){
    return `time-${x.start||""}-${x.end||""}`;
  }
  return x?.pairId?`pair-${x.pairId}`:`time-${x.start||""}-${x.end||""}`;
}
function lockSpecs(x){
  if(!x?.date)return[];
  const key=slotKey(x),specs=[];

  if(x.specialSchedule){
    // Different students of the same group may work in parallel.
    // Lock the concrete student, teacher and room — not the whole group.
    if(x.studentId)specs.push(["student",String(x.studentId)]);
    if(x.room)specs.push(["room",x.room]);
    if(x.teacherId||x.teacher)specs.push(["teacher",String(x.teacherId||x.teacher)]);
  }else{
    const groups=[...(Array.isArray(x.audienceGroups)?x.audienceGroups:[]),x.group||""]
      .map(v=>String(v||"").trim()).filter(Boolean)
      .filter((v,i,a)=>a.findIndex(z=>z.toLowerCase()===v.toLowerCase())===i);
    groups.forEach(g=>specs.push(["group",g]));
    if(x.room)specs.push(["room",x.room]);
    if(x.teacherId||x.teacher)specs.push(["teacher",String(x.teacherId||x.teacher)]);
  }

  return specs.map(([kind,res])=>({kind,res,id:`${kind}__${encodeURIComponent(res)}__${x.date}__${encodeURIComponent(key)}`}));
}
async function writeScheduleLesson(lesson){
  const lref=itemRef(SCHEDULE_COLLECTION,lesson.id);
  await runTransaction(fire,async tx=>{
    const oldSnap=await tx.get(lref),oldLesson=oldSnap.exists()?oldSnap.data():null;
    const oldLocks=lockSpecs(oldLesson),newLocks=lockSpecs(lesson),all=new Map();
    [...oldLocks,...newLocks].forEach(x=>all.set(x.id,x));
    const lockSnaps=new Map();
    for(const [id] of all){const r=itemRef("locks",id);lockSnaps.set(id,{ref:r,snap:await tx.get(r)});}
    for(const l of newLocks){
      const ls=lockSnaps.get(l.id).snap;
      if(ls.exists()&&String(ls.data().ownerKey||(`schedule:${ls.data().ownerLessonId}`))!==`schedule:${lesson.id}`){
        const label=l.kind==="room"?`Аудиторія ${l.res}`:l.kind==="group"?`Група ${l.res}`:l.kind==="student"?`Студент`:`Викладач`;
        throw new Error(`REMS_CONFLICT:${label} уже зайнята/зайнятий ${lesson.date}, ${lesson.pairId?lesson.pairId+" пара":(lesson.start+"–"+lesson.end)}. Зміна не збережена.`);
      }
    }
    const newIds=new Set(newLocks.map(x=>x.id));
    const oldIds=new Set(oldLocks.map(x=>x.id));

    for(const l of oldLocks){
      if(newIds.has(l.id))continue;
      const item=lockSnaps.get(l.id);
      if(item.snap.exists()&&String(item.snap.data().ownerKey||(`schedule:${item.snap.data().ownerLessonId}`))===`schedule:${lesson.id}`){
        tx.delete(item.ref);
      }
    }

    for(const l of newLocks){
      const holder=lockSnaps.get(l.id);
      const owner=holder.snap.exists()
        ?String(holder.snap.data().ownerKey||(`schedule:${holder.snap.data().ownerLessonId}`))
        :"";

      // If this lesson already owned the same lock before the edit,
      // do not spend another Firestore write just to refresh updatedAt.
      if(oldIds.has(l.id)&&owner===`schedule:${lesson.id}`)continue;

      tx.set(holder.ref,{
        ownerKey:`schedule:${lesson.id}`,
        ownerType:"schedule",
        ownerId:String(lesson.id),
        ownerLessonId:String(lesson.id),
        kind:l.kind,
        resource:l.res,
        date:lesson.date,
        slot:slotKey(lesson),
        updatedAt:serverTimestamp()
      });
    }

    tx.set(lref,clean(lesson));
  });
}
async function deleteScheduleLesson(id){
  const lref=itemRef(SCHEDULE_COLLECTION,id);
  await runTransaction(fire,async tx=>{
    const snap=await tx.get(lref);if(!snap.exists())return;
    const locks=lockSpecs(snap.data()),lockSnaps=[];
    for(const l of locks){const ref=itemRef("locks",l.id);lockSnaps.push({ref,snap:await tx.get(ref)});}
    for(const x of lockSnaps)if(x.snap.exists()&&String(x.snap.data().ownerKey||(`schedule:${x.snap.data().ownerLessonId}`))===`schedule:${id}`)tx.delete(x.ref);
    tx.delete(lref);
  });
}

async function writeRoomBookingCloud(booking){
  const bref=itemRef(ROOM_BOOKINGS_COLLECTION,booking.id),owner=`roomBooking:${booking.id}`;
  await runTransaction(fire,async tx=>{
    const oldSnap=await tx.get(bref),oldBooking=oldSnap.exists()?oldSnap.data():null;
    const oldLocks=lockSpecs(oldBooking),newLocks=lockSpecs(booking),all=new Map();
    [...oldLocks,...newLocks].forEach(x=>all.set(x.id,x));
    const lockSnaps=new Map();
    for(const [id] of all){const r=itemRef("locks",id);lockSnaps.set(id,{ref:r,snap:await tx.get(r)});}
    for(const l of newLocks){const ls=lockSnaps.get(l.id).snap;if(ls.exists()){const existing=String(ls.data().ownerKey||(`schedule:${ls.data().ownerLessonId}`));if(existing!==owner){const label=l.kind==="room"?`Аудиторія ${l.res}`:l.kind==="group"?`Група ${l.res}`:l.kind==="student"?`Студент`:`Викладач`;throw new Error(`REMS_CONFLICT:${label} уже зайнята/зайнятий ${booking.date}, ${booking.pairId?booking.pairId+" пара":(booking.start+"–"+booking.end)}. Бронювання не збережено.`);}}}
    const newIds=new Set(newLocks.map(x=>x.id));
    const oldIds=new Set(oldLocks.map(x=>x.id));

    for(const l of oldLocks){
      if(newIds.has(l.id))continue;
      const item=lockSnaps.get(l.id),
        existing=item.snap.exists()?String(item.snap.data().ownerKey||(`schedule:${item.snap.data().ownerLessonId}`)):"";
      if(existing===owner)tx.delete(item.ref);
    }

    for(const l of newLocks){
      const holder=lockSnaps.get(l.id);
      const existing=holder.snap.exists()
        ?String(holder.snap.data().ownerKey||(`schedule:${holder.snap.data().ownerLessonId}`))
        :"";
      if(oldIds.has(l.id)&&existing===owner)continue;

      tx.set(holder.ref,{
        ownerKey:owner,
        ownerType:"roomBooking",
        ownerId:String(booking.id),
        kind:l.kind,
        resource:l.res,
        date:booking.date,
        slot:slotKey(booking),
        updatedAt:serverTimestamp()
      });
    }

    tx.set(bref,clean(booking));
  });
}
async function deleteRoomBookingCloud(id){
  const bref=itemRef(ROOM_BOOKINGS_COLLECTION,id),owner=`roomBooking:${id}`;
  await runTransaction(fire,async tx=>{const snap=await tx.get(bref);if(!snap.exists())return;const locks=lockSpecs(snap.data()),lockSnaps=[];for(const l of locks){const ref=itemRef("locks",l.id);lockSnaps.push({ref,snap:await tx.get(ref)});}for(const x of lockSnaps){const existing=x.snap.exists()?String(x.snap.data().ownerKey||(`schedule:${x.snap.data().ownerLessonId}`)):"";if(existing===owner)tx.delete(x.ref);}tx.delete(bref);});
}

function subscribeTeacherPortal(){
  unsubs.forEach(f=>f());unsubs=[];
  const teacherId=profile?.teacherId??null;
  const feed={teacherId,schedule:[],roomBookings:[],academicYear:"",bellSchedule:[]};
  const apply=()=>{
    window.REMS_SET_TEACHER_FEED?.(clean(feed));
    cloudWasOnline=true;
    lastCloudError=null;
    clearCloudReconnectTimer();
    setSidebar("online","Онлайн",`${user?.email||""} · ${roleLabel(profile?.role)}`);
  };
  unsubs.push(onSnapshot(settingsRef(),snap=>{
    if(snap.exists()){const s=snap.data();feed.academicYear=s.academicYear||"";feed.bellSchedule=s.bellSchedule||[];}
    apply();
  },cloudErr));
  if(!teacherId){apply();return;}
  const scheduleQuery=query(collRef(SCHEDULE_COLLECTION),where("teacherId","==",Number(teacherId)));
  const bookingsQuery=query(collRef(ROOM_BOOKINGS_COLLECTION),where("teacherId","==",Number(teacherId)));
  unsubs.push(onSnapshot(scheduleQuery,snap=>{feed.schedule=snap.docs.map(d=>d.data()).sort(sortById);apply();},cloudErr));
  unsubs.push(onSnapshot(bookingsQuery,snap=>{feed.roomBookings=snap.docs.map(d=>d.data()).sort(sortById);apply();},cloudErr));
}
function subscribeRealtime({baseState=null,waitForDynamic=false}={}){
  unsubs.forEach(f=>f());unsubs=[];
  realtimeSuspended=false;

  liveState=clean(baseState||remoteState||window.REMS_INITIAL_DATA||{});

  let scheduleReady=!waitForDynamic;
  let bookingsReady=!waitForDynamic;
  let initialResolved=false;
  let resolveInitial=()=>{};
  const initialPromise=new Promise(resolve=>{resolveInitial=resolve;});

  let catalogPrimed=false;

  const maybeResolveInitial=()=>{
    if(initialResolved||!scheduleReady||!bookingsReady)return;
    initialResolved=true;
    resolveInitial(true);
  };

  const apply=()=>{
    if(!scheduleReady||!bookingsReady)return;

    remoteState=clean(liveState);

    if(pendingPush||pushing){
      setSidebar("syncing","Синхронізація…",`${user.email} · ${roleLabel(profile.role)}`);
      maybeResolveInitial();
      return;
    }

    window.REMS_APPLY_REMOTE_STATE?.(remoteState);
    cloudWasOnline=true;
    lastCloudError=null;
    clearCloudReconnectTimer();
    setSidebar("online","Онлайн",`${user.email} · ${roleLabel(profile.role)}`);
    maybeResolveInitial();
  };

  // 1) settings — one tiny document
  unsubs.push(onSnapshot(settingsRef(),snap=>{
    if(snap.exists()){
      Object.assign(liveState,snap.data());
      apply();
    }
  },cloudErr));

  // 2) ONE signal replaces 7 static collection snapshot listeners.
  unsubs.push(onSnapshot(catalogSignalRef(),snap=>{
    const data=snap.exists()?snap.data():{};
    const changeId=String(data.changeId||"");

    // First snapshot is only a baseline: static data was already loaded once.
    if(!catalogPrimed){
      catalogPrimed=true;
      lastCatalogChangeId=changeId;
      return;
    }

    if(!changeId||changeId===lastCatalogChangeId)return;
    lastCatalogChangeId=changeId;

    const names=Array.isArray(data.collections)&&data.collections.length
      ?data.collections
      :ARRAY_COLLECTIONS;

    if(pendingPush||pushing){
      catalogRefreshQueued=[...new Set([...(catalogRefreshQueued||[]),...names])];
      return;
    }

    refreshCatalogCollections(names);
  },cloudErr));

  // 3) schedule — genuinely realtime
  unsubs.push(onSnapshot(collRef(SCHEDULE_COLLECTION),snap=>{
    liveState.schedule=snap.docs.map(d=>d.data()).sort(sortById);
    scheduleReady=true;
    apply();
  },cloudErr));

  // 4) room bookings — genuinely realtime for conflicts
  unsubs.push(onSnapshot(collRef(ROOM_BOOKINGS_COLLECTION),snap=>{
    liveState.roomBookings=snap.docs.map(d=>d.data()).sort(sortById);
    bookingsReady=true;
    apply();
  },cloudErr));

  maybeResolveInitial();
  return initialPromise;
}
function cloudErr(e){
  console.error("Firestore listener error",e);
  const summary=cloudErrorSummary(e);
  cloudStopDataListeners();
  setSidebar("error","Немає синхронізації",`${user?.email||""} · ${summary}`);
  toast(`Синхронізація зупинилась (${summary}). Пробую відновити автоматично…`,"error",7000);
  scheduleCloudReconnect(e,"listener",1500);
}
async function reloadRemote(){
  if(!fire)return;
  const r=await loadRemoteState();
  if(r){
    remoteState=clean(r);
    liveState=clean(r);
    window.REMS_APPLY_REMOTE_STATE?.(r);
  }
}
function rejectLocalEdit(){
  if(rejecting)return;rejecting=true;
  toast("Цей обліковий запис має режим перегляду. Зміни не збережено.","error",6000);
  setTimeout(async()=>{await reloadRemote();rejecting=false;},100);
}


function roleHelp(r){
  return ({
    admin:"Повний доступ до всіх даних і керування користувачами.",
    dispatcher:"Може складати та редагувати розклад; інші дані — перегляд.",
    teacher:"Бачить тільки власний індивідуальний розклад.",
    viewer:"Тільки перегляд, без редагування."
  })[r]||"";
}
function userRoleOptions(selected){
  return ["admin","dispatcher","teacher","viewer"].map(r=>`<option value="${r}" ${r===selected?"selected":""}>${roleLabel(r)}</option>`).join("");
}
function fmtUserDate(v){
  if(!v)return"—";
  const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString("uk-UA");
}
function secureTempPassword(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes=new Uint32Array(16);crypto.getRandomValues(bytes);
  let out="Aa7!";
  for(let i=0;i<12;i++)out+=chars[bytes[i]%chars.length];
  return out;
}
async function listUserProfiles(){
  if(!user||profile?.role!=="admin")throw new Error("Доступ лише адміністратору.");
  const snap=await getDocs(collection(fire,"users"));
  return snap.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>(a.displayName||a.email||"").localeCompare(b.displayName||b.email||"","uk"));
}
async function createManagedUser({email,displayName,role="viewer",teacherId=null,sendReset=true}){
  if(profile?.role!=="admin")throw new Error("Доступ лише адміністратору.");
  email=String(email||"").trim().toLowerCase();displayName=String(displayName||"").trim();
  if(!email)throw new Error("Вкажіть email.");
  const secondaryName=`rems-user-create-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const secondaryApp=initializeApp(config,secondaryName),secondaryAuth=getAuth(secondaryApp);
  let cred=null,profileWritten=false,resetSent=false,resetError=null;
  try{
    const tempPassword=secureTempPassword();
    cred=await createUserWithEmailAndPassword(secondaryAuth,email,tempPassword);
    if(displayName)await updateProfile(cred.user,{displayName});
    await setDoc(doc(fire,"users",cred.user.uid),{
      email,displayName,role,teacherId:role==="teacher"&&teacherId?Number(teacherId):null,enabled:true,
      createdAt:new Date().toISOString(),createdBy:user.uid
    });
    profileWritten=true;
    if(sendReset){
      try{auth.useDeviceLanguage?.();await sendPasswordResetEmail(auth,email);resetSent=true;}
      catch(e){resetError=e;}
    }
    await signOut(secondaryAuth);
    return {uid:cred.user.uid,email,resetSent,resetError};
  }catch(e){
    if(cred?.user&&!profileWritten){try{await deleteUser(cred.user);}catch(_){}}
    throw e;
  }finally{
    try{await deleteApp(secondaryApp);}catch(_){}
  }
}
async function updateManagedUser(uid,patch){
  if(profile?.role!=="admin")throw new Error("Доступ лише адміністратору.");
  if(String(uid)===String(user.uid)&&(patch.role&&patch.role!=="admin"||patch.enabled===false)){
    throw new Error("Не можна заблокувати або забрати роль адміністратора у власного активного акаунта.");
  }
  await setDoc(doc(fire,"users",uid),{...clean(patch),updatedAt:new Date().toISOString(),updatedBy:user.uid},{merge:true});
}
async function sendManagedPasswordReset(email){
  if(profile?.role!=="admin")throw new Error("Доступ лише адміністратору.");
  auth.useDeviceLanguage?.();
  await sendPasswordResetEmail(auth,email);
}
function humanUserError(e){
  const c=e?.code||"";
  if(c.includes("email-already-in-use"))return"Користувач із такою поштою вже існує у Firebase Authentication.";
  if(c.includes("invalid-email"))return"Некоректна електронна адреса.";
  if(c.includes("weak-password"))return"Firebase не прийняв тимчасовий пароль.";
  if(c.includes("too-many-requests"))return"Забагато операцій. Спробуйте трохи пізніше.";
  if(c.includes("permission-denied"))return"Firestore не дозволив операцію. Перевірте, чи опубліковані правила v0.9.5.";
  return e?.message||c||"Невідома помилка.";
}
function managedTeacherOptions(selected=""){
  const teachers=(window.REMS_GET_STATE?.()?.teachers||[]).filter(t=>t.scope!=="external"&&t.status!=="archived").slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"","uk"));
  return `<option value="">— не прив’язано —</option>`+teachers.map(t=>`<option value="${escapeHtml(t.id)}" ${String(t.id)===String(selected)?"selected":""}>${escapeHtml(t.name||t.shortName||"Викладач")}</option>`).join("");
}
function managedTeacherName(id){
  if(!id)return"—";
  const t=(window.REMS_GET_STATE?.()?.teachers||[]).find(x=>String(x.id)===String(id));
  return t?.name||t?.shortName||"Не знайдено";
}
function openCreateUserModal(){
  if(profile?.role!=="admin")return;
  const html=`<h2>Новий користувач</h2>
    <div class="notice">Для ролі «Викладач» обов’язково вибери, до якого викладача прив’язати акаунт. Він бачитиме тільки свій розклад.</div>
    <form id="cloudCreateUserForm" class="form-grid">
      <label class="wide">ПІБ<input id="cuName" placeholder="Прізвище Ім’я По батькові" required></label>
      <label class="wide">Email<input id="cuEmail" type="email" placeholder="name@example.com" required></label>
      <label>Роль<select id="cuRole">${userRoleOptions("viewer")}</select></label>
      <label id="cuTeacherWrap" style="display:none">Прив’язати до викладача<select id="cuTeacher">${managedTeacherOptions()}</select></label>
      <label class="wide check-label"><span>Після створення</span><span class="check-inline"><input id="cuReset" type="checkbox" checked> Надіслати лист для встановлення власного пароля</span></label>
      <div class="wide small" id="cuRoleHelp">${roleHelp("viewer")}</div>
      <div class="wide"><button class="primary" id="cuSubmit">Створити користувача</button></div>
    </form>`;
  window.openModal?.(html);
  const roleEl=document.querySelector("#cuRole"),teacherWrap=document.querySelector("#cuTeacherWrap"),teacherEl=document.querySelector("#cuTeacher");
  const refreshRole=()=>{document.querySelector("#cuRoleHelp").textContent=roleHelp(roleEl.value);teacherWrap.style.display=roleEl.value==="teacher"?"":"none";};
  roleEl.onchange=refreshRole;refreshRole();
  document.querySelector("#cloudCreateUserForm").onsubmit=async e=>{
    e.preventDefault();
    if(roleEl.value==="teacher"&&!teacherEl.value)return alert("Для ролі «Викладач» обери конкретного викладача.");
    const btn=document.querySelector("#cuSubmit");btn.disabled=true;btn.textContent="Створення…";
    try{
      const result=await createManagedUser({
        displayName:document.querySelector("#cuName").value,
        email:document.querySelector("#cuEmail").value,
        role:roleEl.value,
        teacherId:roleEl.value==="teacher"?teacherEl.value:null,
        sendReset:document.querySelector("#cuReset").checked
      });
      window.closeModal?.();
      if(result.resetSent)toast(`Користувача створено. На ${result.email} надіслано лист для встановлення пароля.`,"ok",8000);
      else toast(`Користувача створено, але лист для пароля не надіслано. Скористайтеся кнопкою «Пароль».`,"error",9000);
      renderUsersPage(document.querySelector("#usersCloudMount")||document.querySelector("#page-users"));
    }catch(err){
      alert("Не вдалося створити користувача: "+humanUserError(err));
      btn.disabled=false;btn.textContent="Створити користувача";
    }
  };
}
async function renderUsersPage(mount=document.querySelector("#usersCloudMount")||document.querySelector("#page-users")){
  if(!mount)return;
  updateAdminUi();
  if(!configured){mount.innerHTML=`<div class="card section"><div class="empty">Firebase не підключено.</div></div>`;return;}
  if(!user){mount.innerHTML=`<div class="card section"><div class="empty">Спочатку увійдіть у систему.</div></div>`;return;}
  if(profile?.role!=="admin"){mount.innerHTML=`<div class="card section"><div class="empty">Керування користувачами доступне лише адміністратору.</div></div>`;return;}
  mount.innerHTML=`<div class="card section"><div class="section-head"><div><h2>Користувачі системи</h2><div class="small">Кожна людина входить під власною поштою та має окрему роль.</div></div><button class="primary" id="addSystemUser">+ Додати користувача</button></div><div class="empty">Завантаження…</div></div>`;
  mount.querySelector("#addSystemUser").onclick=openCreateUserModal;
  try{
    const rows=await listUserProfiles();
    mount.innerHTML=`<div class="card section">
      <div class="section-head"><div><h2>Користувачі системи</h2><div class="small">${rows.length} облікових записів · викладач прив’язується до конкретного профілю викладача</div></div><button class="primary" id="addSystemUser">+ Додати користувача</button></div>
      <div class="user-role-guide">
        <span><b>Адміністратор</b> — усе</span><span><b>Диспетчер</b> — розклад</span><span><b>Викладач</b> — тільки свій розклад</span><span><b>Перегляд</b> — без редагування</span>
      </div>
      <div class="table-wrap"><table class="users-table"><thead><tr><th>Користувач</th><th>Email</th><th>Роль</th><th>Прив’язка до викладача</th><th>Статус</th><th></th></tr></thead><tbody>
      ${rows.map(x=>{
        const self=String(x.uid)===String(user.uid);
        return `<tr data-user-row="${escapeHtml(x.uid)}">
          <td><b>${escapeHtml(x.displayName||"Без імені")}</b>${self?` <span class="badge ok">ВИ</span>`:""}</td>
          <td>${escapeHtml(x.email||"—")}</td>
          <td><select data-user-role="${escapeHtml(x.uid)}" ${self?"disabled":""}>${userRoleOptions(x.role||"viewer")}</select><div class="small">${escapeHtml(roleHelp(x.role||"viewer"))}</div></td>
          <td><select data-teacher-link="${escapeHtml(x.uid)}">${managedTeacherOptions(x.teacherId||"")}</select>${x.role==="teacher"&&!x.teacherId?`<div class="small bad-text">Потрібно вибрати викладача</div>`:""}</td>
          <td><span class="badge ${x.enabled===false?"bad":"ok"}">${x.enabled===false?"ЗАБЛОКОВАНО":"АКТИВНИЙ"}</span></td>
          <td class="actions">
            <button data-action="rename" data-uid="${escapeHtml(x.uid)}">ПІБ</button>
            <button data-action="reset" data-email="${escapeHtml(x.email||"")}">Пароль</button>
            ${self?"":`<button data-action="toggle" data-uid="${escapeHtml(x.uid)}" data-enabled="${x.enabled===false?"0":"1"}">${x.enabled===false?"Увімкнути":"Заблокувати"}</button>`}
          </td>
        </tr>`;
      }).join("")}
      </tbody></table></div>
      <div class="notice">Для ролі «Викладач» Firestore віддає тільки записи розкладу, де збігається прив’язаний викладач.</div>
    </div>`;
    mount.querySelector("#addSystemUser").onclick=openCreateUserModal;
    mount.querySelectorAll("[data-user-role]").forEach(sel=>sel.onchange=async()=>{
      const row=rows.find(x=>x.uid===sel.dataset.userRole),old=row?.role||"viewer";
      const teacherSelect=mount.querySelector(`[data-teacher-link="${CSS.escape(sel.dataset.userRole)}"]`);
      if(sel.value==="teacher"&&!teacherSelect?.value){alert("Спочатку обери викладача у колонці «Прив’язка до викладача».");sel.value=old;return;}
      try{
        await updateManagedUser(sel.dataset.userRole,{role:sel.value,teacherId:sel.value==="teacher"?Number(teacherSelect.value):null});
        toast("Роль змінено.","ok");renderUsersPage(mount);
      }catch(e){alert(humanUserError(e));sel.value=old;}
    });
    mount.querySelectorAll("[data-teacher-link]").forEach(sel=>sel.onchange=async()=>{
      const row=rows.find(x=>x.uid===sel.dataset.teacherLink);
      try{
        await updateManagedUser(sel.dataset.teacherLink,{teacherId:sel.value?Number(sel.value):null});
        toast("Прив’язку до викладача оновлено.","ok");renderUsersPage(mount);
      }catch(e){alert(humanUserError(e));sel.value=row?.teacherId||"";}
    });
    mount.querySelectorAll("[data-action]").forEach(btn=>btn.onclick=async()=>{
      const action=btn.dataset.action;
      try{
        if(action==="rename"){
          const row=rows.find(x=>String(x.uid)===String(btn.dataset.uid));
          const name=prompt("ПІБ користувача:",row?.displayName||"");if(name===null)return;
          await updateManagedUser(btn.dataset.uid,{displayName:name.trim()});toast("ПІБ оновлено.","ok");renderUsersPage(mount);
        }
        if(action==="reset"){
          if(!btn.dataset.email)return alert("У користувача немає email.");
          if(!confirm(`Надіслати на ${btn.dataset.email} лист для зміни пароля?`))return;
          await sendManagedPasswordReset(btn.dataset.email);toast("Лист для зміни пароля надіслано.","ok",7000);
        }
        if(action==="toggle"){
          const enable=btn.dataset.enabled==="0";
          if(!confirm(enable?"Повернути користувачу доступ?":"Заблокувати доступ цього користувача до спільної бази?"))return;
          await updateManagedUser(btn.dataset.uid,{enabled:enable});toast(enable?"Доступ увімкнено.":"Доступ заблоковано.","ok");renderUsersPage(mount);
        }
      }catch(e){alert(humanUserError(e));}
    });
  }catch(e){
    mount.innerHTML=`<div class="card section"><div class="empty">Не вдалося завантажити користувачів: ${escapeHtml(humanUserError(e))}</div></div>`;
  }
}
function subscribeOwnProfile(){
  if(profileUnsub){profileUnsub();profileUnsub=null;}
  if(!user)return;
  profileUnsub=onSnapshot(doc(fire,"users",user.uid),snap=>{
    if(!snap.exists()){
      unsubs.forEach(f=>f());unsubs=[];
      profile=null;updateAdminUi();setSidebar("error","Немає доступу",user.email||"");
      showAccessBlocked("Ваш профіль доступу видалено. Зверніться до адміністратора.");
      return;
    }
    const next=snap.data(),wasRole=profile?.role,wasTeacherId=profile?.teacherId;
    profile=next;updateAdminUi();
    if(profile.enabled===false){
      unsubs.forEach(f=>f());unsubs=[];
      setSidebar("offline","Доступ заблоковано",user.email||"");
      showAccessBlocked("Адміністратор заблокував доступ цього облікового запису.");
      return;
    }
    if(!document.querySelector("#cloudAuthOverlay")?.classList.contains("hidden"))hideLogin();
    setSidebar("online","Онлайн",`${user.email} · ${roleLabel(profile.role)}`);
    renderCloudSettings();
    if(window.REMS_CURRENT_PAGE?.()==="users")renderUsersPage();
    if(wasRole&&(wasRole!==profile.role||String(wasTeacherId||"")!==String(profile.teacherId||""))){
      toast("Права доступу оновлено. Перезавантажую…","ok",2500);
      setTimeout(()=>location.reload(),500);
    }
  },e=>{
    console.error("Profile listener",e);
    scheduleCloudReconnect(markCloudStep(e,"профіль користувача"),"profile-listener",1500);
  });
}


function renderCloudSettings(){
  const mount=document.querySelector("#cloudSettingsMount");if(!mount)return;
  if(!configured){
    mount.innerHTML=`<div class="card section cloud-settings"><div class="section-head"><div><h2>Спільна онлайн-база</h2><div class="small">Firebase ще не підключено. Поки що цей браузер працює локально.</div></div><span class="badge warn">НЕ ПІДКЛЮЧЕНО</span></div><p>Після створення Firebase-проєкту встав сюди весь об’єкт <b>firebaseConfig</b>. Це тимчасовий спосіб для тесту; потім конфігурацію можна записати у файл <code>firebase-config.js</code>.</p><textarea id="firebaseConfigPaste" class="config-paste" placeholder='const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "...", ... };'></textarea><div class="actions"><button class="primary" id="firebaseConfigSave">Підключити на цьому комп’ютері</button></div></div>`;
    mount.querySelector("#firebaseConfigSave").onclick=()=>saveConfigOverride(mount.querySelector("#firebaseConfigPaste").value);
    return;
  }
  const realtimeCount=unsubs.length+(profileUnsub?1:0);
  mount.innerHTML=`<div class="card section cloud-settings"><div class="section-head"><div><h2>Спільна онлайн-база</h2><div class="small">Cloud Firestore · робочий простір ${WORKSPACE}</div></div><span class="badge ok">ОНЛАЙН</span></div><div class="cloud-account"><div><b>${escapeHtml(user?.email||"—")}</b><span>${roleLabel(profile?.role)}</span></div><div class="actions">${profile?.role==="admin"?`<button class="secondary" id="cloudManageUsers">Користувачі</button><button class="secondary" id="cloudUploadLocal">Відновити хмару з найповнішої локальної копії</button>`:""}<button class="secondary" id="cloudSignOut">Вийти</button></div></div><div class="cloud-economy-status"><div><b>Економний realtime</b><span>${realtimeCount} активних слухачів разом із профілем</span></div><div><b>Живі дані</b><span>розклад · аудиторії · налаштування</span></div><div><b>Довідники</b><span>оновлюються тільки після сигналу про реальну зміну</span></div></div><p class="small">Усі зміни автоматично синхронізуються. Фонові вкладки після 10 хвилин призупиняють realtime і відновлюють його після повернення.</p></div>`;
  mount.querySelector("#cloudSignOut").onclick=()=>signOut(auth);
  const manage=mount.querySelector("#cloudManageUsers");if(manage)manage.onclick=()=>window.go?.("users");
  const up=mount.querySelector("#cloudUploadLocal");if(up)up.onclick=async()=>{
    const best=bestLocalRecoveryState();
    if(!best)return alert("Не знайдено локальної копії для відновлення.");
    const msg=`Знайдено найповнішу локальну копію (${best.source}):\n${recoverySummary(best.state)}.\n\nВона повністю замінить дані у хмарі. Продовжити?`;
    if(!confirm(msg))return;
    up.disabled=true;up.textContent="Завантаження…";
    try{await uploadWholeState(best.state,best.source);}catch(_){}
    finally{renderCloudSettings();}
  };
}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
document.addEventListener("rems-rendered",renderCloudSettings);
function clearHiddenSuspendTimer(){
  if(hiddenSuspendTimer){clearTimeout(hiddenSuspendTimer);hiddenSuspendTimer=null;}
}
function scheduleHiddenSuspend(){
  clearHiddenSuspendTimer();
  if(!document.hidden||!user)return;

  hiddenSuspendTimer=setTimeout(()=>{
    hiddenSuspendTimer=null;
    if(!document.hidden||!user)return;

    cloudStopDataListeners();
    realtimeSuspended=true;
    setSidebar("offline","Фоновий режим",`${user.email||""} · realtime призупинено`);
  },HIDDEN_SUSPEND_MS);
}
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){
    scheduleHiddenSuspend();
    return;
  }

  clearHiddenSuspendTimer();

  if(realtimeSuspended&&user){
    realtimeSuspended=false;
    manualCloudReconnect(true);
  }
});
window.addEventListener("beforeunload",()=>{
  clearHiddenSuspendTimer();
  cloudStopDataListeners();
});




async function connectCloudDataWithRetry(generation,{silent=false,maxAttempts=4,forceFirstRefresh=false}={}){
  let lastError=null;

  for(let attempt=0;attempt<maxAttempts;attempt++){
    if(!cloudIsSignedInGeneration(generation))return false;
    const delay=cloudRetryDelay(attempt);
    if(delay)await sleep(delay);
    if(!cloudIsSignedInGeneration(generation))return false;

    try{
      const forceToken=forceFirstRefresh||attempt>0;
      await refreshOwnProfileAndToken(forceToken);

      if(profile?.role==="teacher"){
        cloudStopDataListeners();
        subscribeTeacherPortal();
        cloudWasOnline=true;
        lastCloudError=null;
        clearCloudReconnectTimer();
        setSidebar("online","Онлайн",`${user.email} · ${roleLabel(profile.role)}`);
        renderCloudSettings();
        if(!silent&&lastError)toast("З’єднання з Firebase відновлено.","ok",4500);
        return true;
      }

      setSidebar(
        "syncing",
        attempt?`Повторне підключення ${attempt+1}/${maxAttempts}…`:"Завантаження…",
        `${user.email} · ${roleLabel(profile.role)}`
      );

      // Static collections are loaded once.
      // Schedule + room bookings arrive from the first realtime snapshots,
      // so we no longer pay for the same dynamic documents twice on connect.
      const r=await loadRemoteState({includeDynamic:false});
      if(!cloudIsSignedInGeneration(generation))return false;

      if(!r){
        if(profile.role!=="admin"){
          const err=new Error("Спільну базу ще не ініціалізовано.");
          err.code="REMS_DATABASE_NOT_INITIALIZED";
          throw err;
        }
        await uploadWholeState(window.REMS_GET_STATE?.());
      }else{
        remoteState=clean(r);
        liveState=clean(r);
        cloudStopDataListeners();
        await subscribeRealtime({baseState:r,waitForDynamic:true});
      }

      cloudWasOnline=true;
      lastCloudError=null;
      clearCloudReconnectTimer();
      setSidebar("online","Онлайн",`${user.email} · ${roleLabel(profile.role)}`);
      renderCloudSettings();
      if(lastError||attempt>0)toast("З’єднання з Firebase відновлено.","ok",4500);
      else if(!silent)toast("Спільну базу підключено.","ok",3500);
      return true;
    }catch(e){
      lastError=e;
      lastCloudError=e;
      lastCloudErrorAt=Date.now();
      console.error(`Firebase connect attempt ${attempt+1}/${maxAttempts}`,e);

      if(e?.code==="REMS_ACCESS_NOT_PROVISIONED"||e?.code==="REMS_ACCESS_DISABLED"){
        throw e;
      }

      const summary=cloudErrorSummary(e);
      setSidebar(
        "syncing",
        attempt<maxAttempts-1?"Повторюю підключення…":"Тимчасово офлайн",
        `${user?.email||""} · ${summary}`
      );
    }
  }

  if(lastError){
    const summary=cloudErrorSummary(lastError);
    setSidebar("error","Тимчасово офлайн",`${user?.email||""} · ${summary} · автоповтор`);
    if(!silent){
      toast(`Firebase не відповів (${summary}). Дані не видаляються — повторю підключення автоматично.`,"error",9000);
    }
    scheduleCloudReconnect(lastError,"initial-load",12000);
  }
  return false;
}

async function initialize(){
  if(!configured){
    setSidebar("local","Локальний режим","Firebase не підключено");
    renderCloudSettings();
    return;
  }

  try{
    app=initializeApp(config);
    auth=getAuth(app);
    fire=getFirestore(app);
    setSidebar("syncing","Підключення…","Firebase");

    const sidebar=document.querySelector("#cloudSidebar");
    if(sidebar){
      sidebar.title="Якщо синхронізація червона — натисніть тут для повторного підключення.";
      sidebar.style.cursor="pointer";
      sidebar.onclick=()=>{
        if(user&&lastCloudError)manualCloudReconnect(false);
      };
    }

    window.addEventListener("online",()=>{
      if(user)manualCloudReconnect(true);
    });

    onAuthStateChanged(auth,async u=>{
      cloudAuthGeneration++;
      const generation=cloudAuthGeneration;

      clearCloudReconnectTimer();
      cloudStopDataListeners();
      if(profileUnsub){try{profileUnsub();}catch(_){} profileUnsub=null;}

      user=u;
      profile=null;
      remoteState=null;
      lastCloudError=null;
      cloudWasOnline=false;
      updateAdminUi();

      if(!u){
        setSidebar("offline","Потрібен вхід","Спільна база");
        showLogin();
        renderCloudSettings();
        return;
      }

      hideLogin();

      try{
        profile=await ensureProfile(u);
        if(!cloudIsSignedInGeneration(generation))return;

        if(profile.enabled===false){
          showAccessBlocked("Адміністратор заблокував доступ цього облікового запису.");
          setSidebar("offline","Доступ заблоковано",u.email||"");
          return;
        }

        updateAdminUi();
        subscribeOwnProfile();

        const ok=await connectCloudDataWithRetry(generation,{
          silent:false,
          maxAttempts:4,
          forceFirstRefresh:false
        });

        if(!ok&&cloudIsSignedInGeneration(generation)){
          renderCloudSettings();
        }
      }catch(e){
        console.error("Firebase initialization for user failed",e);

        if(e?.code==="REMS_ACCESS_NOT_PROVISIONED"){
          setSidebar("offline","Немає доступу",u.email||"");
          showAccessBlocked(e.message);
          return;
        }
        if(e?.code==="REMS_ACCESS_DISABLED"){
          setSidebar("offline","Доступ заблоковано",u.email||"");
          showAccessBlocked(e.message);
          return;
        }

        lastCloudError=e;
        const summary=cloudErrorSummary(e);
        setSidebar("error","Тимчасово офлайн",`${u.email||""} · ${summary}`);
        toast(`Не вдалося підключитися (${summary}). Повторю автоматично.`,"error",8000);
        scheduleCloudReconnect(e,"auth-initialize",12000);
      }
    });
  }catch(e){
    console.error(e);
    setSidebar("error","Помилка конфігурації","Firebase");
    toast("Firebase не вдалося ініціалізувати.","error",8000);
  }
}
initialize();
