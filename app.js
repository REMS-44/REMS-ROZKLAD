
const KEY="remsScheduleData_v09";
const OLD_KEYS=["remsScheduleData_v08","remsScheduleData_v07","remsScheduleData_v06","remsScheduleData_v051","remsScheduleData_v04","remsScheduleData_v02","remsScheduleData_v01"];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clone=x=>JSON.parse(JSON.stringify(x));
const UI_PAGE_KEY="remsUiPage_v1";
const UI_TIMETABLE_GROUP_KEY="remsUiTimetableGroup_v1";
const UI_WORKLOAD_GROUP_KEY="remsUiWorkloadGroup_v1";
function rememberWorkloadGroup(group){
  try{if(group)sessionStorage.setItem(UI_WORKLOAD_GROUP_KEY,group);else sessionStorage.removeItem(UI_WORKLOAD_GROUP_KEY);}catch(e){}
}
function rememberedWorkloadGroup(){
  try{return sessionStorage.getItem(UI_WORKLOAD_GROUP_KEY)||"";}catch(e){return"";}
}
function localTodayISO(){
  const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function rememberPage(page){
  try{sessionStorage.setItem(UI_PAGE_KEY,page);}catch(e){}
}
function rememberedPage(){
  try{return sessionStorage.getItem(UI_PAGE_KEY)||"";}catch(e){return"";}
}
function rememberTimetableGroup(group){
  try{if(group)sessionStorage.setItem(UI_TIMETABLE_GROUP_KEY,group);else sessionStorage.removeItem(UI_TIMETABLE_GROUP_KEY);}catch(e){}
}
function rememberedTimetableGroup(){
  try{return sessionStorage.getItem(UI_TIMETABLE_GROUP_KEY)||"";}catch(e){return"";}
}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function uid(arr){
  // Timestamp-based numeric IDs drastically reduce collisions when several users create records simultaneously.
  const base=Date.now()*1000+Math.floor(Math.random()*1000);
  const max=arr.length?Math.max(...arr.map(x=>Number(x.id)||0)):0;
  return Math.max(base,max+1);
}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}
function fmtHours(v){const n=num(v);return Number.isInteger(n)?String(n):n.toFixed(2).replace(/0+$/,"").replace(/\.$/,"");}
function formatDate(s){if(!s)return"—";const[y,m,d]=s.split("-");return`${d}.${m}.${y}`}
function monthLabel(s){if(!s)return"";const [y,m]=s.split("-");const names=["","Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];return `${names[Number(m)]} ${y}`}
function academicYearBounds(){
  const raw=String(db?.academicYear||window.REMS_INITIAL_DATA?.academicYear||"");
  const years=raw.match(/(\d{4}).*?(\d{4})/);
  let startYear,endYear;
  if(years){startYear=Number(years[1]);endYear=Number(years[2]);}
  else{const now=new Date(),y=now.getFullYear(),m=now.getMonth()+1;startYear=m>=9?y:y-1;endYear=startYear+1;}
  return {start:`${startYear}-09-01`,end:`${endYear}-06-30`,minMonth:`${startYear}-09`,maxMonth:`${endYear}-06`,startYear,endYear};
}
function semesterDateBounds(semester){
  const y=academicYearBounds(),n=Number(semester);
  if(Number.isFinite(n)&&n>0)return n%2===1?{start:`${y.startYear}-09-01`,end:`${y.startYear}-12-31`}:{start:`${y.endYear}-01-01`,end:`${y.endYear}-06-30`};
  return {start:y.start,end:y.end};
}
function dateInBounds(date,bounds=academicYearBounds()){return !!date&&date>=bounds.start&&date<=bounds.end;}
function clampDate(date,bounds=academicYearBounds()){if(!date||date<bounds.start)return bounds.start;if(date>bounds.end)return bounds.end;return date;}
function currentAcademicDate(){return clampDate(localTodayISO());}
function dateAttrs(bounds=academicYearBounds()){return `min="${bounds.start}" max="${bounds.end}"`;}
function academicMonthAllowed(month){const b=academicYearBounds();return !!month&&month>=b.minMonth&&month<=b.maxMonth;}
function clampAcademicMonth(month){const b=academicYearBounds();if(!month||month<b.minMonth)return b.minMonth;if(month>b.maxMonth)return b.maxMonth;return month;}
function academicDateMessage(bounds=academicYearBounds()){return `${formatDate(bounds.start)} — ${formatDate(bounds.end)}`;}
function timeOverlap(aStart,aEnd,bStart,bEnd){return aStart<bEnd&&aEnd>bStart}
function normIdentity(v){return String(v||"").trim().replace(/\s+/g," ").toLowerCase();}
function resolvedScheduleDiscipline(item,state=db){
  if(item?.disciplineId!==null&&item?.disciplineId!==undefined&&String(item.disciplineId)!==""){
    const exact=(state?.disciplines||[]).find(d=>Number(d.id)===Number(item.disciplineId));
    if(exact)return exact;
  }
  const name=normIdentity(item?.discipline),group=normIdentity(item?.group);
  if(!name)return null;
  const matches=(state?.disciplines||[]).filter(d=>normIdentity(d.name)===name&&(!group||normIdentity(d.group)===group));
  return matches.length===1?matches[0]:null;
}
function resolvedScheduleGroup(item,state=db){
  const d=resolvedScheduleDiscipline(item,state);
  if(d?.group)return d.group;
  const direct=normIdentity(item?.group);
  if(direct){
    const g=(state?.groups||[]).find(x=>normIdentity(x.code)===direct);
    return g?.code||String(item.group||"").trim();
  }
  return "";
}
function resolvedScheduleTeacherId(item,state=db){
  if(item?.teacherId!==null&&item?.teacherId!==undefined&&String(item.teacherId)!==""){
    const exact=(state?.teachers||[]).find(t=>Number(t.id)===Number(item.teacherId));
    if(exact)return exact.id;
  }
  const key=normIdentity(item?.teacher);
  if(!key)return null;
  const matches=(state?.teachers||[]).filter(t=>{
    const variants=[t.name,t.shortName,[t.shortName,t.name].filter(Boolean).join(" ")].map(normIdentity).filter(Boolean);
    return variants.includes(key);
  });
  return matches.length===1?matches[0].id:null;
}
function repairScheduleLinks(state){
  let changed=0;
  (state?.schedule||[]).forEach(item=>{
    const d=resolvedScheduleDiscipline(item,state);
    if(d){
      if(Number(item.disciplineId)!==Number(d.id)){item.disciplineId=d.id;changed++;}
      if(item.discipline!==d.name){item.discipline=d.name;changed++;}
      if(d.group&&item.group!==d.group){item.group=d.group;changed++;}
    }else{
      const g=resolvedScheduleGroup(item,state);
      if(g&&g!==item.group){item.group=g;changed++;}
    }
    const tid=resolvedScheduleTeacherId(item,state);
    if(tid&&Number(item.teacherId)!==Number(tid)){item.teacherId=tid;changed++;}
    if(tid){
      const t=(state.teachers||[]).find(x=>Number(x.id)===Number(tid));
      const label=t?(t.shortName||t.name||""):"";
      if(label&&item.teacher!==label){item.teacher=label;changed++;}
    }
    if(item.pairId!==null&&item.pairId!==undefined&&String(item.pairId)!==""){
      const pair=(state.bellSchedule||[]).find(p=>String(p.id)===String(item.pairId));
      if(pair){
        if(pair.start&&item.start!==pair.start){item.start=pair.start;changed++;}
        if(pair.end&&item.end!==pair.end){item.end=pair.end;changed++;}
      }
    }
  });
  return changed;
}

function migrate(old){
  const fresh=clone(window.REMS_INITIAL_DATA);
  if(!old||typeof old!=="object") return fresh;
  fresh.groups=old.groups||fresh.groups;
  fresh.students=old.students||fresh.students;
  fresh.rooms=(old.rooms||fresh.rooms||[]).map((r,i)=>({id:r.id||i+1,name:r.name||"",status:r.status||"active",note:r.note||"",showInGrid:r.showInGrid!==false,gridOrder:Number.isFinite(Number(r.gridOrder))?Number(r.gridOrder):i+1}));
  fresh.roomBookings=(old.roomBookings||[]).map((b,i)=>({...b,id:b.id||i+1,kind:b.kind||"Бронювання",title:b.title||"",date:b.date||"",pairId:b.pairId||null,start:b.start||"",end:b.end||"",room:b.room||"",group:b.group||"",teacherId:b.teacherId||null,teacher:b.teacher||"",showInTimetable:b.showInTimetable===true,note:b.note||""}));
  fresh.academicYear=old.academicYear||fresh.academicYear;
  fresh.semester=old.semester||fresh.semester;
  fresh.bellSchedule=old.bellSchedule||fresh.bellSchedule||[];
  fresh.lessonTypes=(old.lessonTypes||fresh.lessonTypes).map((x,i)=>typeof x==="string"?{
    id:i+1,name:x,countMode:"manual",defaultUnit:1,description:""
  }:{...x,id:x.id||i+1});
  fresh.lessonTypes.forEach(lt=>{const n=normIdentity(lt.name);if(["лекція","семінар","практичне","лабораторне"].includes(n)){lt.countMode="academic_pair";lt.defaultUnit=2;if(!lt.description)lt.description="Аудиторні години; 2 академічні години = 1 пара";}});
  fresh.teachers=(old.teachers||[]).map((t,i)=>({
    id:t.id||i+1,
    scope:t.scope||"department",
    name:t.name||"",
    shortName:t.shortName||"",
    position:t.position||"",
    academicTitle:t.academicTitle||"",
    degree:t.degree||"",
    honoraryTitle:t.honoraryTitle||"",
    employmentType:t.employmentType||"",
    rate:t.rate??"",
    teachingNormPerRate:t.teachingNormPerRate??"",
    employmentStart:t.employmentStart||"",
    employmentEnd:t.employmentEnd||"",
    phone:t.phone||"",
    email:t.email||"",
    unavailableRules:t.unavailableRules||t.unavailableSlots?.map(s=>({kind:"weekday",day:s.day,start:s.start,end:s.end}))||[],
    preferredRules:t.preferredRules||t.preferredSlots?.map(s=>({kind:"weekday",day:s.day,start:s.start,end:s.end}))||[],
    maxPerDay:t.maxPerDay||"",
    maxConsecutive:t.maxConsecutive||"",
    note:t.note||"",
    photo:t.photo||"",
    status:t.status||"active"
  }));
  fresh.disciplines=(old.disciplines||[]).map((d,i)=>({
    ...d,
    id:d.id||i+1,name:d.name||"",course:d.course||"",group:d.group||"",
    semester:d.semester||fresh.semester,academicYear:d.academicYear||fresh.academicYear,
    teacherIds:d.teacherIds||[],teacherLoads:d.teacherLoads||{},
    controlForm:d.controlForm||"Немає",color:d.color||"#8b5cf6",
    hours:d.hours||{},note:d.note||"",status:d.status||"active",
    sourceCurriculumId:d.sourceCurriculumId||null,sourceComponentId:d.sourceComponentId||null,
    planMeta:d.planMeta||{}
  }));
  fresh.curricula=old.curricula||fresh.curricula||[];
  fresh.schemaVersion=13;
  fresh.schedule=(old.schedule||[]).map((s,i)=>{
    let teacherId=s.teacherId||null;
    if(!teacherId && s.teacher){
      const t=fresh.teachers.find(x=>(x.shortName||x.name)===s.teacher);
      if(t) teacherId=t.id;
    }
    let disciplineId=s.disciplineId||null;
    if(!disciplineId && s.discipline){
      const d=fresh.disciplines.find(x=>x.name===s.discipline&&(!x.group||x.group===s.group));
      if(d) disciplineId=d.id;
    }
    const lt=fresh.lessonTypes.find(x=>x.name===s.type);
    return {
      id:s.id||i+1,date:s.date||"",start:s.start||"",end:s.end||"",
      pairId:s.pairId||fresh.bellSchedule.find(p=>p.start===s.start&&p.end===s.end)?.id||null,group:s.group||"",
      disciplineId,discipline:s.discipline||"",type:s.type||"",coverage:s.coverage||"Вся група",
      students:s.students||"",teacherId,teacher:s.teacher||"",room:s.room||"",
      workloadHours:s.workloadHours??lt?.defaultUnit??1,note:s.note||"",repeatBatchId:s.repeatBatchId||null
    };
  });
  repairScheduleLinks(fresh);
  return fresh;
}
function loadData(){
  try{
    const cur=localStorage.getItem(KEY);
    if(cur)return migrate(JSON.parse(cur));
    for(const k of OLD_KEYS){
      const old=localStorage.getItem(k);
      if(old){
        const m=migrate(JSON.parse(old));
        localStorage.setItem(KEY,JSON.stringify(m));
        return m;
      }
    }
  }catch(e){}
  return clone(window.REMS_INITIAL_DATA);
}
let db=loadData(), currentPage="home";
normalizeCurricula();
function save(){
  repairScheduleLinks(db);
  db.schemaVersion=13;
  localStorage.setItem(KEY,JSON.stringify(db));
  renderCurrent();
  document.dispatchEvent(new CustomEvent("rems-rendered"));
  if(window.REMS_CLOUD?.configured){
    if(window.REMS_CLOUD.canWrite?.()) window.REMS_CLOUD.schedulePush(clone(db));
    else window.REMS_CLOUD.rejectLocalEdit?.();
  }
}
window.REMS_GET_STATE=()=>clone(db);
window.REMS_MIGRATE_STATE=(state)=>migrate(state);
window.REMS_CURRENT_PAGE=()=>currentPage;
window.REMS_APPLY_REMOTE_STATE=(remote)=>{
  const rawSchedule=new Map((remote?.schedule||[]).map(x=>[String(x.id),x]));
  db=migrate(remote);
  const repaired=repairScheduleLinks(db);
  const needsCloudRepair=repaired>0||db.schedule.some(x=>{
    const raw=rawSchedule.get(String(x.id));
    return raw&&(String(raw.group||"")!==String(x.group||"")||Number(raw.teacherId||0)!==Number(x.teacherId||0)||Number(raw.disciplineId||0)!==Number(x.disciplineId||0));
  });
  db.schemaVersion=13;
  normalizeCurricula();
  localStorage.setItem(KEY,JSON.stringify(db));
  renderCurrent();
  document.dispatchEvent(new CustomEvent("rems-rendered"));
  if(needsCloudRepair&&window.REMS_CLOUD?.canWrite?.()){
    setTimeout(()=>window.REMS_CLOUD?.schedulePush?.(clone(db)),350);
  }
};
function groupStudentCount(code){return db.students.filter(s=>s.group===code&&s.status!=="archived").length;}
function groupCourse(code){return db.groups.find(g=>g.code===code)?.course||"";}
function lessonTypeByName(name){return db.lessonTypes.find(x=>x.name===name);}
function teacherDisplay(t){return t?.shortName||t?.name||"";}
function teacherById(id){return db.teachers.find(t=>Number(t.id)===Number(id));}
function disciplineById(id){return db.disciplines.find(d=>Number(d.id)===Number(id));}
function departmentTeachers(){return db.teachers.filter(t=>t.scope!=="external"&&t.status!=="archived");}
function externalTeachers(){return db.teachers.filter(t=>t.scope==="external"&&t.status!=="archived");}
function totalDisciplineHours(d){return Object.values(d.hours||{}).reduce((a,b)=>a+num(b),0);}
function teacherNames(ids=[]){return ids.map(id=>teacherDisplay(teacherById(id))).filter(Boolean).join(", ");}
function kpi(label,value){return `<div class="card kpi"><div class="label">${label}</div><div class="value">${value}</div></div>`;}
function groupOptions(selected=""){return db.groups.slice().sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`<option value="${esc(g.code)}" ${g.code===selected?"selected":""}>${esc(g.code)} · ${g.course} курс</option>`).join("");}
function departmentTeacherOptions(ids=[]){return departmentTeachers().map(t=>`<option value="${t.id}" ${ids.map(Number).includes(Number(t.id))?"selected":""}>${esc(teacherDisplay(t))}</option>`).join("");}
function formatMode(m){return ({academic_pair:"Аудиторні / парами",contingent:"За контингентом",per_student:"Індивідуально кожному",fixed:"Фіксовані години",manual:"Ручний підрахунок"})[m]||m;}

const meta={
  home:["Головна","Кафедральний пульт розкладу"],
  schedule:["Складання розкладу","Розподілені години → дати, пари та аудиторії"],
  timetable:["Розклад","Готовий календар занять конкретної групи"],
  mySchedule:["Мій розклад","Індивідуальний календар викладача"],
  groups:["Групи і студенти","Групи, курси та склад студентів"],
  students:["Групи і студенти","Групи, курси та склад студентів"],
  rooms:["Аудиторії","Сітка зайнятості та довідник приміщень"],
  roomGrid:["Аудиторії","Зайнятість, вільні слоти та бронювання"],
  teachers:["Викладачі","Профілі, кадрові дані та картки навантаження"],
  curricula:["Навчальні плани","Першоджерело дисциплін, годин і навантаження"],
  disciplines:["Навантаження","Розподіл дисциплін і годин між викладачами"],
  lessonTypes:["Види занять","Правила підрахунку годин"],
  users:["Користувачі","Облікові записи та права доступу"],
  settings:["Налаштування","Навчальний рік, семестр і резервні копії"]
};
$$(".nav-btn").forEach(b=>b.onclick=()=>go(b.dataset.page,{focusCurrentCalendar:true}));
$("#modalClose").onclick=closeModal;
$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
function focusCalendarOnCurrentDate(page){
  const today=currentAcademicDate();
  if(page==="timetable"){
    timetableState.month=clampAcademicMonth(today.slice(0,7));
  }
  if(page==="roomGrid"){
    roomGridState.date=today;
    roomGridState.month=today.slice(0,7);
  }
}
function go(p,options={}){
  const cloudRole=window.REMS_CLOUD?.role?.();
  if(cloudRole==="teacher"&&p!=="mySchedule")p="mySchedule";
  if(!meta[p]||!$("#page-"+p))p=cloudRole==="teacher"?"mySchedule":"home";
  const enteringDifferentPage=p!==currentPage;
  if(options.focusCurrentCalendar===true||(enteringDifferentPage&&["timetable","roomGrid"].includes(p))){
    focusCalendarOnCurrentDate(p);
  }
  currentPage=p;
  rememberPage(p);
  try{
    const wanted="#"+p;
    if(location.hash!==wanted)history.replaceState(null,"",location.pathname+location.search+wanted);
  }catch(e){}
  const sidebarPage=({students:"groups",rooms:"roomGrid",lessonTypes:"settings",users:"settings"})[p]||p;
  $$(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===sidebarPage));
  $$(".page").forEach(x=>x.classList.remove("active"));
  $("#page-"+p).classList.add("active");
  $("#pageTitle").textContent=meta[p][0];
  $("#pageSubtitle").textContent=meta[p][1];
  renderCurrent();
}
function renderCurrent(){
  ({home:renderHome,schedule:renderSchedule,timetable:renderTimetable,mySchedule:renderMySchedule,groups:renderGroups,students:renderStudents,rooms:renderRooms,roomGrid:renderRoomGrid,teachers:renderTeachers,curricula:renderCurricula,disciplines:renderDisciplines,lessonTypes:renderLessonTypes,users:renderUsers,settings:renderSettings}[currentPage])();
  document.dispatchEvent(new CustomEvent("rems-rendered"));
}
function openModal(html,wide=false){$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden");$("#modal").querySelector(".modal-card").classList.toggle("modal-wide",wide);}
function closeModal(){$("#modal").classList.add("hidden");$("#modalBody").innerHTML="";}

function renderHome(){
  const today=localTodayISO();
  const todays=db.schedule.filter(x=>x.date===today).sort((a,b)=>a.start.localeCompare(b.start));
  $("#page-home").innerHTML=`
    <div class="grid-kpi">
      ${kpi("Груп",db.groups.length)}
      ${kpi("Студентів",db.students.filter(x=>x.status!=="archived").length)}
      ${kpi("Викладачів кафедри",departmentTeachers().length)}
      ${kpi("Дисциплін кафедри",db.disciplines.filter(x=>x.status!=="archived").length)}
    </div>
    <div class="card section">
      <div class="section-head"><h2>${esc(db.academicYear)} · ${db.semester} семестр</h2><button class="secondary" onclick="go('settings')">Змінити</button></div>
      <div class="group-grid">${db.groups.slice().sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`<div class="group-card"><b>${esc(g.code)}</b><p>${g.course} курс · ${groupStudentCount(g.code)} студентів</p></div>`).join("")}</div>
    </div>
    <div class="card section">
      <div class="section-head"><h2>Сьогодні</h2><button class="secondary" onclick="go('timetable',{focusCurrentCalendar:true})">Відкрити розклад →</button></div>
      ${todays.length?miniSchedule(todays):`<div class="empty">На сьогодні занять ще немає.</div>`}
    </div>`;
}
function miniSchedule(rows){
  return `<div class="table-wrap"><table><thead><tr><th>Пара</th><th>Група</th><th>Дисципліна</th><th>Викладач</th><th>Аудиторія</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(pairDisplay(x))}</b>${pairTimeDisplay(x)?`<div class="small">${esc(pairTimeDisplay(x))}</div>`:""}</td><td>${esc(x.group)}</td><td>${esc(x.discipline||"—")}</td><td>${esc(x.teacher||"—")}</td><td><b>${esc(x.room||"—")}</b></td></tr>`).join("")}</tbody></table></div>`;
}

/* Groups */
function renderGroups(){
  $("#page-groups").innerHTML=`
    <div class="card section">
      <div class="section-head"><div><h2>Групи</h2><div class="small">Курси, шифри груп і кількість студентів.</div></div><button class="primary" onclick="addGroup()">+ Додати групу</button></div>
      <div class="table-wrap"><table><thead><tr><th>Курс</th><th>Група</th><th>Студентів</th><th></th></tr></thead><tbody>
        ${db.groups.slice().sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`<tr><td>${g.course}</td><td><b>${esc(g.code)}</b></td><td>${groupStudentCount(g.code)}</td><td class="actions"><button onclick="showGroupStudents('${esc(g.code)}')">Студенти</button><button onclick="editGroup(${g.id})">Редагувати</button><button onclick="deleteGroup(${g.id})">Видалити</button></td></tr>`).join("")}
      </tbody></table></div>
    </div>
    <div class="card section">
      <div class="section-head"><div><h2>Студенти</h2><div class="small">Усі студенти тепер працюють у цій самій вкладці.</div></div><button class="primary" onclick="addStudent()">+ Додати студента</button></div>
      <div class="toolbar"><input id="studentSearch" placeholder="Пошук…"><select id="studentGroupFilter"><option value="">Усі групи</option>${groupOptions()}</select></div>
      <div id="studentTable"></div>
    </div>`;
  $("#studentSearch").oninput=renderStudentTable;
  $("#studentGroupFilter").onchange=renderStudentTable;
  renderStudentTable();
}
function showGroupStudents(code){
  const select=$("#studentGroupFilter");
  if(select){
    select.value=code;
    renderStudentTable();
    select.scrollIntoView({behavior:"smooth",block:"center"});
  }
}
function addGroup(){
  openModal(`<h2>Нова група</h2><form id="f" class="form-grid"><label>Курс<select id="gc">${[1,2,3,4,5,6].map(x=>`<option>${x}</option>`).join("")}</select></label><label>Шифр<input id="gn" required></label><div class="wide"><button class="primary">Додати</button></div></form>`);
  $("#f").onsubmit=e=>{e.preventDefault();const c=$("#gn").value.trim();if(!c)return;if(db.groups.some(g=>g.code.toLowerCase()===c.toLowerCase()))return alert("Така група вже є.");db.groups.push({id:uid(db.groups),course:+$("#gc").value,code:c});closeModal();save();};
}
function editGroup(id){
  const g=db.groups.find(x=>x.id===id);
  openModal(`<h2>Редагувати групу</h2><form id="f" class="form-grid"><label>Курс<select id="gc">${[1,2,3,4,5,6].map(x=>`<option ${x===g.course?"selected":""}>${x}</option>`).join("")}</select></label><label>Шифр<input id="gn" value="${esc(g.code)}" required></label><div class="wide"><button class="primary">Зберегти</button></div></form>`);
  $("#f").onsubmit=e=>{e.preventDefault();const old=g.code,neu=$("#gn").value.trim();g.course=+$("#gc").value;g.code=neu;db.students.forEach(s=>{if(s.group===old)s.group=neu});db.schedule.forEach(s=>{if(s.group===old)s.group=neu});db.disciplines.forEach(d=>{if(d.group===old)d.group=neu});closeModal();save();};
}
function deleteGroup(id){
  const g=db.groups.find(x=>x.id===id);if(groupStudentCount(g.code))return alert("Спочатку переведіть або видаліть студентів.");
  if(confirm(`Видалити ${g.code}?`)){db.groups=db.groups.filter(x=>x.id!==id);save();}
}

/* Students */
function renderStudents(){go("groups");}
function renderStudentTable(){
  const q=($("#studentSearch")?.value||"").toLowerCase(),gf=$("#studentGroupFilter")?.value||"";
  const rows=db.students.filter(s=>s.status!=="archived"&&(!q||s.name.toLowerCase().includes(q))&&(!gf||s.group===gf)).sort((a,b)=>a.group.localeCompare(b.group)||a.name.localeCompare(b.name));
  $("#studentTable").innerHTML=`<div class="table-wrap"><table><thead><tr><th>ПІБ</th><th>Група</th><th>Курс</th><th></th></tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.group)}</td><td>${groupCourse(s.group)}</td><td class="actions"><button onclick="editStudent(${s.id})">Редагувати</button><button onclick="deleteStudent(${s.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div><div class="small" style="margin-top:10px">Показано: ${rows.length}</div>`;
}
function addStudent(){
  openModal(`<h2>Новий студент</h2><form id="f" class="form-grid"><label class="wide">ПІБ<input id="sn" required></label><label>Група<select id="sg">${groupOptions()}</select></label><div class="wide"><button class="primary">Додати</button></div></form>`);
  $("#f").onsubmit=e=>{e.preventDefault();db.students.push({id:uid(db.students),name:$("#sn").value.trim(),group:$("#sg").value,status:"active",note:""});closeModal();save();};
}
function editStudent(id){
  const s=db.students.find(x=>x.id===id);
  openModal(`<h2>Редагувати студента</h2><form id="f" class="form-grid"><label class="wide">ПІБ<input id="sn" value="${esc(s.name)}" required></label><label>Група<select id="sg">${groupOptions(s.group)}</select></label><div class="wide"><button class="primary">Зберегти</button></div></form>`);
  $("#f").onsubmit=e=>{e.preventDefault();s.name=$("#sn").value.trim();s.group=$("#sg").value;closeModal();save();};
}
function deleteStudent(id){const s=db.students.find(x=>x.id===id);if(confirm(`Видалити ${s.name}?`)){db.students=db.students.filter(x=>x.id!==id);save();}}

/* Rooms */
function roomAreaTabs(active="grid"){
  return `<div class="subtabs"><button class="${active==="grid"?"active":""}" onclick="go('roomGrid',{focusCurrentCalendar:false})">Сітка зайнятості</button><button class="${active==="directory"?"active":""}" onclick="go('rooms')">Довідник аудиторій</button></div>`;
}
function activeRooms(){return db.rooms.filter(r=>r.status!=="archived");}
function roomOrderValue(r){const n=Number(r.gridOrder);return Number.isFinite(n)?n:999999;}
function gridRooms(){return activeRooms().filter(r=>r.showInGrid!==false).slice().sort((a,b)=>roomOrderValue(a)-roomOrderValue(b)||a.name.localeCompare(b.name,"uk",{numeric:true}));}
function roomGridPosition(id){
  const idx=gridRooms().findIndex(r=>Number(r.id)===Number(id));
  return idx>=0?idx+1:null;
}
function normalizeRoomGridOrder(){
  gridRooms().forEach((r,i)=>r.gridOrder=i+1);
}
function moveRoomGrid(id,dir){
  const rooms=gridRooms(),idx=rooms.findIndex(r=>Number(r.id)===Number(id));
  if(idx<0)return;
  const to=idx+Number(dir);
  if(to<0||to>=rooms.length)return;
  [rooms[idx],rooms[to]]=[rooms[to],rooms[idx]];
  rooms.forEach((r,i)=>r.gridOrder=i+1);
  save();
}
function placeRoomAtPosition(room,position){
  if(!room||room.showInGrid===false)return;
  const rooms=gridRooms().filter(r=>Number(r.id)!==Number(room.id));
  let pos=Math.max(1,Math.min(Number(position)||rooms.length+1,rooms.length+1));
  rooms.splice(pos-1,0,room);
  rooms.forEach((r,i)=>r.gridOrder=i+1);
}
function renderRooms(){
  const rows=activeRooms().slice().sort((a,b)=>{
    if((a.showInGrid!==false)!==(b.showInGrid!==false))return a.showInGrid===false?1:-1;
    return roomOrderValue(a)-roomOrderValue(b)||a.name.localeCompare(b.name,"uk",{numeric:true});
  });
  $("#page-rooms").innerHTML=`${roomAreaTabs("directory")}<div class="card section">
    <div class="section-head"><div><h2>Довідник аудиторій</h2><div class="small">Порядок тут = порядок колонок у сітці зайнятості. Пріоритетні аудиторії можна підняти на початок.</div></div><div class="actions"><button class="primary" onclick="openRoomModal()">+ Додати аудиторію</button></div></div>
    <div class="table-wrap"><table><thead><tr><th>Порядок</th><th>Аудиторія</th><th>У сітці кафедри</th><th>Примітка</th><th></th></tr></thead><tbody>
      ${rows.map(r=>{
        const pos=roomGridPosition(r.id);
        return `<tr>
          <td>${r.showInGrid!==false?`<div class="room-order-control"><button ${pos===1?"disabled":""} onclick="moveRoomGrid(${r.id},-1)">↑</button><b>${pos}</b><button ${pos===gridRooms().length?"disabled":""} onclick="moveRoomGrid(${r.id},1)">↓</button></div>`:"—"}</td>
          <td><b>${esc(r.name)}</b></td>
          <td><label class="room-grid-toggle"><input type="checkbox" ${r.showInGrid!==false?"checked":""} onchange="toggleRoomGrid(${r.id},this.checked)"><span>${r.showInGrid!==false?"ПОКАЗУЄТЬСЯ":"ПРИХОВАНА"}</span></label></td>
          <td>${esc(r.note||"—")}</td>
          <td class="actions"><button onclick="openRoomModal(${r.id})">Редагувати</button><button onclick="deleteRoom(${r.id})">Видалити</button></td>
        </tr>`;
      }).join("")}
    </tbody></table></div>
    <div class="notice">Стрілки ↑ ↓ змінюють порядок колонок у «Сітці зайнятості». Приховані аудиторії в сітку не потрапляють.</div>
  </div>`;
}
function openRoomModal(id=null){
  const r=id?db.rooms.find(x=>Number(x.id)===Number(id)):{name:"",status:"active",note:"",showInGrid:true,gridOrder:gridRooms().length+1};
  const currentPos=id?roomGridPosition(id):(gridRooms().length+1);
  openModal(`<h2>${id?"Редагувати":"Нова"} аудиторія</h2><form id="roomForm" class="form-grid">
    <label>Номер / назва<input id="roomName" value="${esc(r.name||"")}" required></label>
    <label>Позиція в сітці<input id="roomGridOrder" type="number" min="1" max="${Math.max(1,gridRooms().length+(id?0:1))}" value="${esc(currentPos||gridRooms().length+1)}"></label>
    <label class="wide check-label"><span>Сітка кафедри</span><span class="check-inline"><input id="roomGridFlag" type="checkbox" ${r.showInGrid!==false?"checked":""}> Показувати у сітці зайнятості</span></label>
    <label class="wide">Примітка<textarea id="roomNote" rows="3">${esc(r.note||"")}</textarea></label>
    <div class="wide"><button class="primary">Зберегти</button></div>
  </form>`);
  $("#roomForm").onsubmit=e=>{
    e.preventDefault();
    const name=$("#roomName").value.trim();if(!name)return;
    const duplicate=db.rooms.some(x=>Number(x.id)!==Number(id)&&x.status!=="archived"&&x.name.toLowerCase()===name.toLowerCase());
    if(duplicate)return alert("Така аудиторія вже є.");
    const requestedPos=Number($("#roomGridOrder").value)||gridRooms().length+1;
    const obj={name,note:$("#roomNote").value.trim(),showInGrid:$("#roomGridFlag").checked,status:"active",gridOrder:r.gridOrder??gridRooms().length+1};
    let savedRoom;
    if(id){Object.assign(r,obj);savedRoom=r;}
    else{savedRoom={id:uid(db.rooms),...obj};db.rooms.push(savedRoom);}
    if(savedRoom.showInGrid!==false)placeRoomAtPosition(savedRoom,requestedPos);
    else normalizeRoomGridOrder();
    closeModal();save();
  };
}
function addRoom(){openRoomModal();}
function editRoom(id){openRoomModal(id);}
function toggleRoomGrid(id,checked){
  const r=db.rooms.find(x=>Number(x.id)===Number(id));if(!r)return;
  r.showInGrid=!!checked;
  if(r.showInGrid){r.gridOrder=gridRooms().length+1;normalizeRoomGridOrder();}
  else normalizeRoomGridOrder();
  save();
}
function deleteRoom(id){
  const r=db.rooms.find(x=>Number(x.id)===Number(id));if(!r)return;
  const used=db.schedule.some(x=>x.room===r.name)||db.roomBookings.some(x=>x.room===r.name);
  if(used&&!confirm(`Аудиторія ${r.name} уже використовується у заняттях або бронюваннях. Видалити її з довідника? Існуючі записи залишаться.`))return;
  if(!used&&!confirm(`Видалити аудиторію ${r.name}?`))return;
  db.rooms=db.rooms.filter(x=>Number(x.id)!==Number(id));normalizeRoomGridOrder();save();
}

/* Room occupancy grid */
let roomGridState={date:null,month:null};
const ROOM_BOOKING_KINDS=["Репетиція","Майстер-клас","Зустріч","Додаткова пара","Захід","Бронювання","Інше"];
function roomBookingById(id){return db.roomBookings.find(x=>Number(x.id)===Number(id));}
function roomEvents(date,room,pairId){
  const schedule=db.schedule.filter(x=>x.date===date&&x.room===room&&String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId)).map(x=>({source:"schedule",data:x}));
  const bookings=db.roomBookings.filter(x=>x.date===date&&x.room===room&&String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId)).map(x=>({source:"booking",data:x}));
  return [...schedule,...bookings];
}
function roomBookingLabel(b){return b.title||b.kind||"Бронювання";}
function roomEventCard(ev){
  const x=ev.data;
  if(ev.source==="schedule"){
    const d=disciplineById(x.disciplineId),color=d?.color||"#8b5cf6";
    return `<button class="room-event room-event-lesson" style="--event-color:${esc(color)}" onclick="event.stopPropagation();openLessonModal(${x.id})"><span class="room-event-badge">ЗАНЯТТЯ</span><b>${esc(x.group||"—")}</b><span>${esc(x.discipline||"—")}</span><small>${esc(x.teacher||"—")}</small></button>`;
  }
  return `<button class="room-event room-event-booking" onclick="event.stopPropagation();openRoomBookingModal(${x.id})"><span class="room-event-badge">${esc((x.kind||"БРОНЮВАННЯ").toUpperCase())}</span><b>${esc(x.group||roomBookingLabel(x))}</b><span>${esc(x.group?roomBookingLabel(x):(x.teacher||""))}</span>${x.teacher&&x.group?`<small>${esc(x.teacher)}</small>`:""}</button>`;
}
function roomGridDateLabel(date){const d=new Date(date+"T12:00:00");return d.toLocaleDateString("uk-UA",{weekday:"long",day:"numeric",month:"long",year:"numeric"});}
function monthDays(month){const [y,m]=month.split("-").map(Number),last=new Date(y,m,0).getDate();return Array.from({length:last},(_,i)=>`${y}-${String(m).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`);}
function roomMonthStrip(){
  return `<div class="room-month-strip">${monthDays(roomGridState.month).map(d=>{const date=new Date(d+"T12:00:00"),day=date.getDay(),wk=["Нд","Пн","Вт","Ср","Чт","Пт","Сб"][day];return `<button class="room-day-chip ${d===roomGridState.date?"active":""} ${day===0||day===6?"weekend":""}" onclick="selectRoomGridDate('${d}')"><span>${wk}</span><b>${Number(d.slice(8))}</b></button>`;}).join("")}</div>`;
}
function renderRoomGrid(){
  roomGridState.date=clampDate(roomGridState.date||currentAcademicDate());roomGridState.month=clampAcademicMonth((roomGridState.month||roomGridState.date.slice(0,7)));if(roomGridState.date.slice(0,7)!==roomGridState.month)roomGridState.date=clampDate(`${roomGridState.month}-01`);
  const rooms=gridRooms(),pairs=bellPairs();
  $("#page-roomGrid").innerHTML=`${roomAreaTabs("grid")}<div class="card section room-grid-shell"><div class="section-head"><div><h2>Зайнятість аудиторій</h2><div class="small">Заняття підтягуються автоматично з розкладу. Репетиції, зустрічі та інші бронювання додаються прямо тут.</div></div><div class="actions"><button class="secondary" onclick="shiftRoomGridDate(-1)">← День</button><button class="secondary" onclick="roomGridToday()">Поточний навчальний день</button><button class="secondary" onclick="shiftRoomGridDate(1)">День →</button><button class="primary" onclick="openRoomBookingModal()">+ Бронювання</button></div></div>
    <div class="room-grid-toolbar"><label>Місяць<input id="roomGridMonth" type="month" min="${academicYearBounds().minMonth}" max="${academicYearBounds().maxMonth}" value="${esc(roomGridState.month)}"></label><label>Дата<input id="roomGridDate" type="date" ${dateAttrs()} value="${esc(roomGridState.date)}"></label><div class="room-date-title">${esc(roomGridDateLabel(roomGridState.date))}</div><button class="secondary" onclick="go('rooms')">Довідник аудиторій</button></div>
    ${roomMonthStrip()}
    ${rooms.length?`<div class="room-grid-wrap"><div class="room-grid" style="--room-count:${rooms.length}"><div class="rg-corner">Пара</div>${rooms.map(r=>`<div class="rg-room"><b>${esc(r.name)}</b><span>${esc(r.note||"")}</span></div>`).join("")}${pairs.map(pair=>`<div class="rg-pair"><b>${pair.id}</b><span>пара</span><small>${esc(pair.start||"")}<br>${esc(pair.end||"")}</small></div>${rooms.map(r=>{const events=roomEvents(roomGridState.date,r.name,pair.id);return `<div class="rg-cell ${events.length?"occupied":"free"}" onclick="if(event.target===this)openRoomBookingModal(null,{date:'${roomGridState.date}',pairId:${JSON.stringify(pair.id)},room:'${esc(r.name)}'})">${events.length?events.map(roomEventCard).join(""):`<button class="room-free" onclick="event.stopPropagation();openRoomBookingModal(null,{date:'${roomGridState.date}',pairId:${JSON.stringify(pair.id)},room:'${esc(r.name)}'})">Вільна</button>`}</div>`;}).join("")}`).join("")}</div></div>`:`<div class="empty">Немає аудиторій, позначених «Показувати у сітці кафедри». Відкрий «Аудиторії» та увімкни потрібні.</div>`}
    <div class="room-grid-legend"><span><i class="legend-dot lesson"></i> заняття з розкладу</span><span><i class="legend-dot booking"></i> окреме бронювання</span><span><i class="legend-dot free"></i> вільна аудиторія</span></div>
  </div>`;
  $("#roomGridMonth").onchange=e=>{const m=clampAcademicMonth(e.target.value);roomGridState.month=m;const day=roomGridState.date.slice(8);const max=new Date(Number(m.slice(0,4)),Number(m.slice(5,7)),0).getDate();roomGridState.date=clampDate(`${m}-${String(Math.min(Number(day),max)).padStart(2,"0")}`);renderRoomGrid();};
  $("#roomGridDate").onchange=e=>{if(e.target.value)selectRoomGridDate(e.target.value);};
  requestAnimationFrame(()=>document.querySelector(".room-day-chip.active")?.scrollIntoView({behavior:"auto",block:"nearest",inline:"center"}));
}
function selectRoomGridDate(date){roomGridState.date=clampDate(date);roomGridState.month=roomGridState.date.slice(0,7);renderRoomGrid();}
function shiftRoomGridDate(days){const next=addDays(roomGridState.date,days);if(dateInBounds(next))selectRoomGridDate(next);}
function roomGridToday(){selectRoomGridDate(currentAcademicDate());}
function bookingConflicts(item,ignoreId=null){
  const conflicts=[];
  db.schedule.forEach(x=>{if(x.date!==item.date)return;const sameSlot=item.pairId&&x.pairId?String(item.pairId)===String(x.pairId):timeOverlap(item.start,item.end,x.start,x.end);if(!sameSlot)return;if(item.room&&x.room===item.room)conflicts.push(`Аудиторія ${item.room} вже зайнята заняттям ${x.group||""} ${x.discipline||""}.`);if(item.group&&x.group===item.group)conflicts.push(`Група ${item.group} уже має заняття.`);if(item.teacherId&&Number(x.teacherId)===Number(item.teacherId))conflicts.push(`Викладач ${item.teacher||""} уже має заняття.`);});
  db.roomBookings.forEach(x=>{if(Number(x.id)===Number(ignoreId)||x.date!==item.date)return;const sameSlot=item.pairId&&x.pairId?String(item.pairId)===String(x.pairId):timeOverlap(item.start,item.end,x.start,x.end);if(!sameSlot)return;if(item.room&&x.room===item.room)conflicts.push(`Аудиторія ${item.room} вже заброньована: ${roomBookingLabel(x)}.`);if(item.group&&x.group===item.group)conflicts.push(`Для групи ${item.group} уже є бронювання.`);if(item.teacherId&&Number(x.teacherId)===Number(item.teacherId))conflicts.push(`У викладача ${item.teacher||""} уже є бронювання.`);});
  return [...new Set(conflicts)];
}
function openRoomBookingModal(id=null,preset={}){
  const b=id?roomBookingById(id):{kind:"Репетиція",title:"",date:clampDate(preset.date||roomGridState.date||localTodayISO()),pairId:preset.pairId||bellPairs()[0]?.id||null,room:preset.room||gridRooms()[0]?.name||activeRooms()[0]?.name||"",group:"",teacherId:null,teacher:"",showInTimetable:false,note:""};
  if(!b)return;
  openModal(`<h2>${id?"Редагувати":"Нове"} бронювання аудиторії</h2><div class="notice">Цей запис блокує аудиторію. Він не впливає на навчальне навантаження викладача.</div><form id="roomBookingForm" class="form-grid"><label>Тип<select id="rbKind">${ROOM_BOOKING_KINDS.map(k=>`<option ${k===b.kind?"selected":""}>${esc(k)}</option>`).join("")}</select></label><label>Назва<input id="rbTitle" value="${esc(b.title||"")}" placeholder="Напр. Репетиція показу"></label><label>Дата<input id="rbDate" type="date" ${dateAttrs()} value="${esc(clampDate(b.date))}" required></label><label>Пара<select id="rbPair">${pairOptions(b.pairId)}</select></label><label>Аудиторія<select id="rbRoom">${activeRooms().slice().sort((a,c)=>a.name.localeCompare(c.name,"uk",{numeric:true})).map(r=>`<option ${r.name===b.room?"selected":""}>${esc(r.name)}</option>`).join("")}</select></label><label>Група (необов’язково)<select id="rbGroup"><option value="">— без групи —</option>${groupOptions(b.group||"")}</select></label><label>Викладач / відповідальний (необов’язково)<select id="rbTeacher"><option value="">—</option>${activeTeacherOptions(b.teacherId)}</select></label><label class="check-label"><span>Основний розклад</span><span class="check-inline"><input id="rbShow" type="checkbox" ${b.showInTimetable?"checked":""}> Показувати в календарі обраної групи</span></label><label class="wide">Примітка<textarea id="rbNote" rows="3">${esc(b.note||"")}</textarea></label><div id="rbConflict" class="wide"></div><div class="wide actions"><button class="primary">${id?"Зберегти":"Забронювати"}</button>${id?`<button type="button" class="danger" onclick="deleteRoomBooking(${b.id})">Видалити бронювання</button>`:""}</div></form>`,true);
  const preview=()=>{const pair=pairById($("#rbPair").value),tid=Number($("#rbTeacher").value)||null,t=teacherById(tid),item={id:b.id,date:$("#rbDate").value,pairId:$("#rbPair").value,start:pair?.start||"",end:pair?.end||"",room:$("#rbRoom").value,group:$("#rbGroup").value,teacherId:tid,teacher:teacherDisplay(t)};const cs=bookingConflicts(item,id);$("#rbConflict").innerHTML=cs.length?`<div class="conflict"><b>Конфлікт:</b><br>${cs.map(esc).join("<br>")}</div>`:`<div class="ok-box">Час вільний.</div>`;};
  ["rbDate","rbPair","rbRoom","rbGroup","rbTeacher"].forEach(x=>$("#"+x).onchange=preview);preview();
  $("#roomBookingForm").onsubmit=e=>{e.preventDefault();if(!dateInBounds($("#rbDate").value))return alert(`Дата має бути в межах навчального року: ${academicDateMessage()}.`);const pair=pairById($("#rbPair").value),tid=Number($("#rbTeacher").value)||null,t=teacherById(tid),obj={kind:$("#rbKind").value,title:$("#rbTitle").value.trim(),date:$("#rbDate").value,pairId:$("#rbPair").value,start:pair?.start||"",end:pair?.end||"",room:$("#rbRoom").value,group:$("#rbGroup").value,teacherId:tid,teacher:teacherDisplay(t),showInTimetable:$("#rbShow").checked,note:$("#rbNote").value.trim()};const cs=bookingConflicts(obj,id);if(cs.length)return alert("Не можна зберегти через конфлікт:\n\n"+cs.join("\n"));if(id)Object.assign(b,obj);else db.roomBookings.push({id:uid(db.roomBookings),...obj});roomGridState.date=obj.date;closeModal();save();if(currentPage==="roomGrid")renderRoomGrid();};
}
function deleteRoomBooking(id){const b=roomBookingById(id);if(!b)return;if(confirm(`Видалити бронювання «${roomBookingLabel(b)}»?`)){db.roomBookings=db.roomBookings.filter(x=>Number(x.id)!==Number(id));closeModal();save();if(currentPage==="roomGrid")renderRoomGrid();}}

/* Availability rules */
function ruleRow(rule={}){
  const r={kind:rule.kind||"weekday",day:rule.day??1,date:rule.date||"",dateFrom:rule.dateFrom||"",dateTo:rule.dateTo||"",start:rule.start||"09:00",end:rule.end||"18:00"};
  return `<div class="availability-row" data-rule>
    <select data-kind>
      <option value="weekday" ${r.kind==="weekday"?"selected":""}>День тижня</option>
      <option value="date" ${r.kind==="date"?"selected":""}>Конкретна дата</option>
      <option value="range" ${r.kind==="range"?"selected":""}>Період дат</option>
    </select>
    <select data-day>${db.weekDays.map(d=>`<option value="${d.id}" ${Number(r.day)===Number(d.id)?"selected":""}>${esc(d.name)}</option>`).join("")}</select>
    <input data-date type="date" value="${esc(r.date)}">
    <input data-from type="date" value="${esc(r.dateFrom)}">
    <input data-to type="date" value="${esc(r.dateTo)}">
    <input data-start type="time" value="${esc(r.start)}">
    <input data-end type="time" value="${esc(r.end)}">
    <button type="button" class="danger rule-remove">×</button>
  </div>`;
}
function addRule(containerId){
  const c=$("#"+containerId),d=document.createElement("div");d.innerHTML=ruleRow({});c.appendChild(d.firstElementChild);bindRuleRows();
}
function bindRuleRows(){
  $$("[data-rule]").forEach(row=>{
    const update=()=>{
      const k=row.querySelector("[data-kind]").value;
      row.querySelector("[data-day]").style.display=k==="weekday"?"":"none";
      row.querySelector("[data-date]").style.display=k==="date"?"":"none";
      row.querySelector("[data-from]").style.display=k==="range"?"":"none";
      row.querySelector("[data-to]").style.display=k==="range"?"":"none";
    };
    row.querySelector("[data-kind]").onchange=update;
    row.querySelector(".rule-remove").onclick=()=>row.remove();
    update();
  });
}
function readRules(containerId){
  return [...document.querySelectorAll(`#${containerId} [data-rule]`)].map(row=>({
    kind:row.querySelector("[data-kind]").value,
    day:+row.querySelector("[data-day]").value,
    date:row.querySelector("[data-date]").value,
    dateFrom:row.querySelector("[data-from]").value,
    dateTo:row.querySelector("[data-to]").value,
    start:row.querySelector("[data-start]").value,
    end:row.querySelector("[data-end]").value
  })).filter(r=>r.start&&r.end&&r.end>r.start);
}
function weekdayId(dateStr){return new Date(dateStr+"T12:00:00").getDay();}
function ruleApplies(rule,dateStr){
  if(rule.kind==="weekday")return Number(rule.day)===weekdayId(dateStr);
  if(rule.kind==="date")return rule.date===dateStr;
  if(rule.kind==="range")return !!rule.dateFrom&&!!rule.dateTo&&dateStr>=rule.dateFrom&&dateStr<=rule.dateTo;
  return false;
}
function ruleTimeMatches(rule,start,end){return timeOverlap(start,end,rule.start,rule.end);}

/* Teachers + workload */
function explicitTeacherLoad(d,teacherId){
  return d?.teacherLoads?.[teacherId]||d?.teacherLoads?.[String(teacherId)]||null;
}
function teacherPlannedHours(t){
  if(t.scope==="external")return 0;
  return db.disciplines.filter(d=>d.status!=="archived").reduce((total,d)=>{
    const load=explicitTeacherLoad(d,t.id);
    return total+(load?Object.values(load).reduce((a,b)=>a+num(b),0):0);
  },0);
}
function teacherAuditoriumPlannedHours(t){
  if(t.scope==="external")return 0;
  return db.disciplines.filter(d=>d.status!=="archived").reduce((total,d)=>{
    const load=explicitTeacherLoad(d,t.id);
    if(!load)return total;
    return total+auditoriumLessonTypes().reduce((a,lt)=>a+num(load[lt.id]),0);
  },0);
}
function teacherScheduledHours(t){
  if(t.scope==="external")return 0;
  return db.schedule.filter(s=>Number(resolvedScheduleTeacherId(s,db))===Number(t.id)&&s.disciplineId).reduce((a,s)=>a+num(s.workloadHours),0);
}
function teacherAuditoriumScheduledHours(t){
  if(t.scope==="external")return 0;
  const audNames=new Set(auditoriumLessonTypes().map(lt=>normIdentity(lt.name)));
  return db.schedule.filter(s=>Number(resolvedScheduleTeacherId(s,db))===Number(t.id)&&s.disciplineId&&audNames.has(normIdentity(s.type))).reduce((a,s)=>a+num(s.workloadHours),0);
}
function teacherTargetHours(t){
  const rate=num(t.rate),norm=num(t.teachingNormPerRate);
  return rate&&norm?rate*norm:0;
}
function teacherEmploymentText(t){
  if(t.scope==="external")return "Зовнішній викладач";
  if(!t.employmentStart&&!t.employmentEnd)return "Період роботи не вказано";
  return `${t.employmentStart?formatDate(t.employmentStart):"…"} — ${t.employmentEnd?formatDate(t.employmentEnd):"дотепер"}`;
}
function renderTeachers(){
  const dep=departmentTeachers().slice().sort((a,b)=>a.name.localeCompare(b.name));
  const ext=externalTeachers().slice().sort((a,b)=>a.name.localeCompare(b.name));
  $("#page-teachers").innerHTML=`
    <div class="card section">
      <div class="section-head">
        <h2>Викладачі кафедри</h2>
        <div class="actions"><button class="primary" onclick="openTeacherModal()">+ Викладач кафедри</button><button class="secondary" onclick="openExternalTeacherModal()">+ Зовнішній викладач</button></div>
      </div>
      ${dep.length?`<div class="teacher-grid">${dep.map(teacherCard).join("")}</div>`:`<div class="empty">Викладачів кафедри ще немає.</div>`}
    </div>
    <div class="card section">
      <div class="section-head"><h2>Зовнішні / загальноосвітні викладачі</h2><span class="small">Вони використовуються в розкладі, але не входять до кафедральної картки навантаження.</span></div>
      ${ext.length?`<div class="table-wrap"><table><thead><tr><th>ПІБ</th><th>Коротке ім’я</th><th>Примітка</th><th></th></tr></thead><tbody>${ext.map(t=>`<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.shortName||"—")}</td><td>${esc(t.note||"—")}</td><td class="actions"><button onclick="openExternalTeacherModal(${t.id})">Редагувати</button><button onclick="deleteTeacher(${t.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Зовнішніх викладачів ще немає.</div>`}
    </div>`;
}
function teacherCard(t){
  return `<div class="teacher-card teacher-card-compact">
    <div class="teacher-compact-main">
      <div><h3>${esc(t.name)}</h3><div class="teacher-compact-tags"><span class="badge ok">${esc(t.employmentType||"—")}</span><span class="rate-chip">${t.rate!==""?esc(t.rate):"—"} ставки</span></div></div>
      <div class="actions teacher-actions"><button onclick="openTeacherSchedule(${t.id})">Розклад</button><button onclick="openTeacherWorkload(${t.id})">Картка навантаження</button><button onclick="openTeacherModal(${t.id})">Редагувати</button><button onclick="deleteTeacher(${t.id})">Видалити</button></div>
    </div>
  </div>`;
}
function openExternalTeacherModal(id=null){
  const t=id?teacherById(id):{scope:"external",name:"",shortName:"",note:"",status:"active"};
  openModal(`<h2>${id?"Редагувати":"Новий"} зовнішній викладач</h2><div class="notice">Цей викладач буде доступний у розкладі, але його кафедральне навантаження не рахується.</div><form id="etf" class="form-grid"><label class="wide">ПІБ<input id="etn" value="${esc(t.name)}" required></label><label>Коротке ім’я<input id="ets" value="${esc(t.shortName||"")}"></label><label class="wide">Примітка<textarea id="etnote" rows="3">${esc(t.note||"")}</textarea></label><div class="wide"><button class="primary">Зберегти</button></div></form>`);
  $("#etf").onsubmit=e=>{e.preventDefault();const obj={scope:"external",name:$("#etn").value.trim(),shortName:$("#ets").value.trim(),note:$("#etnote").value.trim(),status:"active"};if(id)Object.assign(t,obj);else db.teachers.push({id:uid(db.teachers),...obj});closeModal();save();};
}
function openTeacherModal(id=null){
  const t=id?teacherById(id):{
    scope:"department",name:"",shortName:"",position:"",academicTitle:"",degree:"",honoraryTitle:"",
    employmentType:"Штатний",rate:"1",teachingNormPerRate:"",employmentStart:"",employmentEnd:"",
    phone:"",email:"",unavailableRules:[],preferredRules:[],maxPerDay:"",maxConsecutive:"",note:"",photo:"",status:"active"
  };
  openModal(`<h2>${id?"Редагувати":"Новий"} викладач кафедри</h2><form id="tf" class="form-grid">
    <label class="wide">ПІБ<input id="tn" value="${esc(t.name)}" required></label>
    <label>Коротке ім’я для розкладу<input id="ts" value="${esc(t.shortName||"")}" placeholder="Фішер В.М."></label>
    <label>Посада<select id="tp"><option value="">—</option>${db.teacherPositions.map(v=>`<option ${v===t.position?"selected":""}>${esc(v)}</option>`).join("")}<option value="__other__" ${t.position&&!db.teacherPositions.includes(t.position)?"selected":""}>Інше…</option></select><input id="tpOther" value="${esc(t.position&&!db.teacherPositions.includes(t.position)?t.position:"")}" placeholder="Своя посада" style="display:${t.position&&!db.teacherPositions.includes(t.position)?"":"none"};margin-top:6px"></label>
    <label>Вчене звання<select id="ta"><option value="">—</option>${db.academicTitles.map(v=>`<option ${v===t.academicTitle?"selected":""}>${esc(v)}</option>`).join("")}<option value="__other__" ${t.academicTitle&&!db.academicTitles.includes(t.academicTitle)?"selected":""}>Інше…</option></select><input id="taOther" value="${esc(t.academicTitle&&!db.academicTitles.includes(t.academicTitle)?t.academicTitle:"")}" placeholder="Своє звання" style="display:${t.academicTitle&&!db.academicTitles.includes(t.academicTitle)?"":"none"};margin-top:6px"></label>
    <label>Науковий ступінь<select id="td"><option value="">—</option>${db.academicDegrees.map(v=>`<option ${v===t.degree?"selected":""}>${esc(v)}</option>`).join("")}<option value="__other__" ${t.degree&&!db.academicDegrees.includes(t.degree)?"selected":""}>Інше…</option></select><input id="tdOther" value="${esc(t.degree&&!db.academicDegrees.includes(t.degree)?t.degree:"")}" placeholder="Свій ступінь" style="display:${t.degree&&!db.academicDegrees.includes(t.degree)?"":"none"};margin-top:6px"></label>
    <label>Почесне звання<select id="th"><option value="">—</option>${db.honoraryTitles.map(v=>`<option ${v===t.honoraryTitle?"selected":""}>${esc(v)}</option>`).join("")}<option value="__other__" ${t.honoraryTitle&&!db.honoraryTitles.includes(t.honoraryTitle)?"selected":""}>Інше…</option></select><input id="thOther" value="${esc(t.honoraryTitle&&!db.honoraryTitles.includes(t.honoraryTitle)?t.honoraryTitle:"")}" placeholder="Своє почесне звання" style="display:${t.honoraryTitle&&!db.honoraryTitles.includes(t.honoraryTitle)?"":"none"};margin-top:6px"></label>
    <label>Тип зайнятості<select id="te">${db.employmentTypes.map(v=>`<option ${v===t.employmentType?"selected":""}>${esc(v)}</option>`).join("")}</select></label>
    <label>Обсяг ставки<input id="tr" type="number" min="0" step="0.01" value="${esc(t.rate)}" placeholder="1 / 0.5 / 0.25"></label>
    <label>Норма навчальних годин на 1 ставку<input id="tnorm" type="number" min="0" step="0.01" value="${esc(t.teachingNormPerRate)}" placeholder="Вводиться за правилами університету"></label>
    <label>Дата прийому / початку роботи<input id="tstart" type="date" value="${esc(t.employmentStart)}"></label>
    <label>Дата завершення роботи / контракту<input id="tend" type="date" value="${esc(t.employmentEnd)}"></label>
    <label>Телефон<input id="tph" value="${esc(t.phone||"")}"></label>
    <label>E-mail<input id="tem" type="email" value="${esc(t.email||"")}"></label>
    <label class="wide">Фото — посилання (необов’язково)<input id="tphoto" value="${esc(t.photo||"")}"></label>

    <div class="wide availability-box">
      <div class="section-head compact"><div><b>Недоступний час</b><div class="small">Можна задати день тижня, конкретну дату або період дат.</div></div><button type="button" class="secondary" onclick="addRule('unavailableRules')">+ Додати</button></div>
      <div id="unavailableRules" class="rule-list">${(t.unavailableRules||[]).map(ruleRow).join("")}</div>
    </div>

    <div class="wide availability-box">
      <div class="section-head compact"><div><b>Бажаний час</b><div class="small">Використовується як підказка зараз і для майбутнього автоматичного підбору.</div></div><button type="button" class="secondary" onclick="addRule('preferredRules')">+ Додати</button></div>
      <div id="preferredRules" class="rule-list">${(t.preferredRules||[]).map(ruleRow).join("")}</div>
    </div>

    <label>Максимум занять на день<input id="tmax" type="number" min="0" value="${esc(t.maxPerDay||"")}"></label>
    <label>Максимум занять підряд<input id="tcon" type="number" min="0" value="${esc(t.maxConsecutive||"")}"></label>
    <label class="wide">Примітка<textarea id="tnote" rows="3">${esc(t.note||"")}</textarea></label>
    <div class="wide"><button class="primary">${id?"Зберегти":"Додати"}</button></div>
  </form>`,true);
  [["tp","tpOther"],["ta","taOther"],["td","tdOther"],["th","thOther"]].forEach(([s,i])=>{$("#"+s).onchange=()=>{$("#"+i).style.display=$("#"+s).value==="__other__"?"":"none"};});
  bindRuleRows();
  $("#tf").onsubmit=e=>{
    e.preventDefault();
    const pick=(sid,oid)=>$("#"+sid).value==="__other__"?$("#"+oid).value.trim():$("#"+sid).value;
    const obj={
      scope:"department",name:$("#tn").value.trim(),shortName:$("#ts").value.trim(),
      position:pick("tp","tpOther"),academicTitle:pick("ta","taOther"),degree:pick("td","tdOther"),honoraryTitle:pick("th","thOther"),
      employmentType:$("#te").value,rate:$("#tr").value,teachingNormPerRate:$("#tnorm").value,
      employmentStart:$("#tstart").value,employmentEnd:$("#tend").value,phone:$("#tph").value.trim(),email:$("#tem").value.trim(),photo:$("#tphoto").value.trim(),
      unavailableRules:readRules("unavailableRules"),preferredRules:readRules("preferredRules"),
      maxPerDay:$("#tmax").value,maxConsecutive:$("#tcon").value,note:$("#tnote").value.trim(),status:"active"
    };
    if(id)Object.assign(t,obj);else db.teachers.push({id:uid(db.teachers),...obj});
    closeModal();save();
  };
}
function deleteTeacher(id){
  const t=teacherById(id);if(!t)return;
  if(confirm(`Видалити ${t.name}?`)){
    db.teachers=db.teachers.filter(x=>Number(x.id)!==Number(id));
    db.disciplines.forEach(d=>{
      d.teacherIds=(d.teacherIds||[]).filter(x=>Number(x)!==Number(id));
      if(d.teacherLoads){delete d.teacherLoads[id];delete d.teacherLoads[String(id)];}
    });
    db.schedule.forEach(s=>{if(Number(s.teacherId)===Number(id)){s.teacherId=null;s.teacher="";}});
    save();
  }
}
function plannedForDisciplineTeacher(d,teacherId){
  const load=explicitTeacherLoad(d,teacherId);
  return load?Object.values(load).reduce((a,b)=>a+num(b),0):0;
}
function plannedTypeForTeacher(teacherId,typeId){
  return db.disciplines.filter(d=>d.status!=="archived").reduce((total,d)=>{
    const load=explicitTeacherLoad(d,teacherId);
    return total+(load?num(load[typeId]):0);
  },0);
}
function scheduledForTeacherType(teacherId,typeName){
  return db.schedule.filter(s=>Number(s.teacherId)===Number(teacherId)&&s.disciplineId&&s.type===typeName).reduce((a,s)=>a+num(s.workloadHours),0);
}
function openTeacherWorkload(id){
  const t=teacherById(id);if(!t||t.scope==="external")return;

  const disciplines=db.disciplines
    .filter(d=>d.status!=="archived"&&plannedForDisciplineTeacher(d,id)>0)
    .sort((a,b)=>(a.course||99)-(b.course||99)||String(a.group||"").localeCompare(String(b.group||""),"uk")||a.name.localeCompare(b.name,"uk"));

  const totalAllocated=teacherPlannedHours(t);
  const auditoriumAllocated=teacherAuditoriumPlannedHours(t);
  const auditoriumScheduled=teacherAuditoriumScheduledHours(t);
  const auditoriumRemaining=Math.max(0,auditoriumAllocated-auditoriumScheduled);

  const discRows=disciplines.map(d=>{
    const load=explicitTeacherLoad(d,id)||{};
    const typeParts=db.lessonTypes
      .filter(lt=>num(load[lt.id])>0)
      .map(lt=>`${esc(lt.name)} — ${fmtHours(load[lt.id])}`)
      .join(" · ");
    const aud=auditoriumLessonTypes().reduce((a,lt)=>a+num(load[lt.id]),0);
    const scheduled=db.schedule
      .filter(x=>Number(resolvedScheduleTeacherId(x,db))===Number(id)&&Number(x.disciplineId)===Number(d.id)&&isAuditoriumPairType(lessonTypeByName(x.type)))
      .reduce((a,x)=>a+num(x.workloadHours),0);
    return `<tr>
      <td><b>${esc(d.name)}</b></td>
      <td>${esc(d.group||"—")}</td>
      <td><div class="workload-type-breakdown">${typeParts||"—"}</div></td>
      <td>${fmtHours(aud)}</td>
      <td>${fmtHours(scheduled)}</td>
      <td><b>${fmtHours(Math.max(0,aud-scheduled))}</b></td>
    </tr>`;
  }).join("");

  const typeRows=db.lessonTypes.map(lt=>{
    const allocated=plannedTypeForTeacher(id,lt.id);
    if(allocated<=0)return "";
    const scheduled=isAuditoriumPairType(lt)?scheduledForTeacherType(id,lt.name):0;
    return `<tr><td>${esc(lt.name)}</td><td>${fmtHours(allocated)}</td><td>${isAuditoriumPairType(lt)?fmtHours(scheduled):"—"}</td><td>${isAuditoriumPairType(lt)?fmtHours(Math.max(0,allocated-scheduled)):"не розставляється"}</td></tr>`;
  }).join("");

  openModal(`<div class="workload-card">
    <div class="workload-title">
      <div><h2>Навантаження викладача</h2><h3>${esc(t.name)}</h3></div>
      <span class="badge ok">${esc(db.academicYear)}</span>
    </div>
    <div class="grid-kpi workload-kpi lean-workload-kpi">
      ${kpi("Розподілено всього",fmtHours(totalAllocated)+" год")}
      ${kpi("Аудиторних до розкладу",fmtHours(auditoriumAllocated)+" год")}
      ${kpi("Виставлено в розклад",fmtHours(auditoriumScheduled)+" год")}
      ${kpi("Залишилось розставити",fmtHours(auditoriumRemaining)+" год")}
    </div>
    <div class="notice">Картка рахує тільки години, які ти <b>реально розподілив цьому викладачу</b> у «Навантаженні». Автоматичного приписування всього плану більше немає.</div>
    <h3>Розподіл за дисциплінами</h3>
    ${discRows?`<div class="table-wrap"><table><thead><tr><th>Дисципліна</th><th>Група</th><th>Що розподілено</th><th>Ауд. годин</th><th>У розкладі</th><th>Залишок</th></tr></thead><tbody>${discRows}</tbody></table></div>`:`<div class="empty">Цьому викладачу ще не розподілено годин.</div>`}
    <h3>За видами роботи</h3>
    ${typeRows?`<div class="table-wrap"><table><thead><tr><th>Вид роботи</th><th>Розподілено</th><th>У розкладі</th><th>Залишок до розкладу</th></tr></thead><tbody>${typeRows}</tbody></table></div>`:`<div class="empty">Години ще не розподілені.</div>`}
  </div>`,true);
}

/* Lesson types */
function renderLessonTypes(){
  $("#page-lessonTypes").innerHTML=`<div class="card section"><div class="section-head"><h2>Види занять</h2><button class="primary" onclick="openLessonTypeModal()">+ Додати вид</button></div><div class="notice">Правило підрахунку можна змінити для будь-якого виду.</div>${db.lessonTypes.map(x=>`<div class="mode-card"><div><b>${esc(x.name)}</b><p>${formatMode(x.countMode)}${x.defaultUnit?` · базове значення: ${esc(x.defaultUnit)}`:""}${x.description?` · ${esc(x.description)}`:""}</p></div><div class="actions"><button onclick="openLessonTypeModal(${x.id})">Редагувати</button><button onclick="deleteLessonType(${x.id})">Видалити</button></div></div>`).join("")}</div>`;
}
function openLessonTypeModal(id=null){
  const x=id?db.lessonTypes.find(v=>v.id===id):{name:"",countMode:"manual",defaultUnit:1,description:""};
  openModal(`<h2>${id?"Редагувати":"Новий"} вид заняття</h2><form id="ltf" class="form-grid"><label class="wide">Назва<input id="ltn" value="${esc(x.name)}" required></label><label>Правило підрахунку<select id="ltm"><option value="academic_pair" ${x.countMode==="academic_pair"?"selected":""}>Аудиторні / парами</option><option value="contingent" ${x.countMode==="contingent"?"selected":""}>За контингентом</option><option value="per_student" ${x.countMode==="per_student"?"selected":""}>Індивідуально кожному студенту</option><option value="fixed" ${x.countMode==="fixed"?"selected":""}>Фіксована кількість годин</option><option value="manual" ${x.countMode==="manual"?"selected":""}>Ручний підрахунок</option></select></label><label>Базове значення<input id="ltu" type="number" min="0" step="0.01" value="${esc(x.defaultUnit||1)}"></label><label class="wide">Пояснення / примітка<textarea id="ltd" rows="3">${esc(x.description||"")}</textarea></label><div class="wide"><button class="primary">Зберегти</button></div></form>`);
  $("#ltf").onsubmit=e=>{e.preventDefault();const obj={name:$("#ltn").value.trim(),countMode:$("#ltm").value,defaultUnit:+$("#ltu").value||0,description:$("#ltd").value.trim()};if(id)Object.assign(x,obj);else db.lessonTypes.push({id:uid(db.lessonTypes),...obj});closeModal();save();};
}
function deleteLessonType(id){const x=db.lessonTypes.find(v=>v.id===id);if(confirm(`Видалити вид «${x.name}»?`)){db.lessonTypes=db.lessonTypes.filter(v=>v.id!==id);save();}}

/* Disciplines + teacher load distribution */


function curriculumById(id){return (db.curricula||[]).find(c=>Number(c.id)===Number(id));}
function curriculumComponent(c,componentId){return c?.components?.find(x=>Number(x.id)===Number(componentId));}
function scopeLabel(scope){return scope==="external"?"Не кафедральне":scope==="department"?"Кафедральне":"Інше";}
function nextLocalId(arr=[]){return arr.length?Math.max(...arr.map(x=>Number(x.id)||0))+1:1;}
function ensureCurriculumShape(c){
  c.components=c.components||[];
  let nextComp=nextLocalId(c.components);
  c.components.forEach(comp=>{
    if(!comp.id)comp.id=nextComp++;
    comp.section=comp.section||"Обов’язкові";
    comp.category=comp.category||"Інший блок";
    comp.scope=comp.scope||"department";
    comp.rows=comp.rows||[];
    let nextRow=nextLocalId(comp.rows);
    comp.rows.forEach(r=>{if(!r.id)r.id=nextRow++;});
  });
  if(!Array.isArray(c.blocks)){
    c.blocks=[];
    const seen=new Set();
    c.components.forEach(comp=>{
      const key=comp.section+"||"+comp.category;
      if(!seen.has(key)){seen.add(key);c.blocks.push({id:nextLocalId(c.blocks),section:comp.section,name:comp.category,order:c.blocks.length+1});}
    });
  }
  c.blocks.forEach((b,i)=>{if(!b.id)b.id=i+1;if(!b.section)b.section="Обов’язкові";if(!b.name)b.name="Новий блок";if(!b.order)b.order=i+1;});
  c.semesterWeeks=c.semesterWeeks||{};
  c.applicableGroups=c.applicableGroups||[];
  return c;
}
function normalizeCurricula(){
  db.curricula=db.curricula||[];
  db.curricula.forEach(ensureCurriculumShape);
  (db.disciplines||[]).forEach(d=>{
    if(!d.sourceCurriculumId||!d.sourceComponentId||d.sourceRowId)return;
    const c=curriculumById(d.sourceCurriculumId),comp=curriculumComponent(c,d.sourceComponentId);
    const r=comp?.rows?.find(x=>Number(x.semester)===Number(d.semester));
    if(r)d.sourceRowId=r.id;
  });
}
function curriculumTotalsFromRows(c){
  ensureCurriculumShape(c);
  const rows=(c.components||[]).flatMap(x=>x.rows||[]);
  const sum=k=>rows.reduce((a,r)=>a+num(r[k]),0);
  return {credits:sum("credits"),totalHours:sum("totalHours"),auditoriumHours:sum("auditoriumHours"),auditoriumPlanHours:sum("auditoriumPlanHours"),lecture:sum("lecture"),seminar:sum("seminar"),practical:sum("practical"),laboratory:sum("laboratory"),individual:sum("individual"),selfStudy:sum("selfStudy"),practice:sum("practice")};
}
function planRowToHours(r){
  const byName={};
  db.lessonTypes.forEach(lt=>{
    if(lt.name==="Лекція")byName[lt.id]=num(r.lecture);
    else if(lt.name==="Семінар")byName[lt.id]=num(r.seminar);
    else if(lt.name==="Практичне")byName[lt.id]=num(r.practical);
    else if(lt.name==="Лабораторне")byName[lt.id]=num(r.laboratory);
    else if(lt.name==="Індивідуальне")byName[lt.id]=num(r.individual);
    else byName[lt.id]=0;
  });
  return byName;
}
function scaleTeacherLoadsToPlan(d,newHours){
  // The working plan is the source of total hours, but the teacher split is an explicit decision.
  // Never silently rescale or erase that split when the plan changes.
  d.teacherLoads=d.teacherLoads||{};
  const ids=new Set([...(d.teacherIds||[]).map(String),...Object.keys(d.teacherLoads||{})]);
  ids.forEach(tid=>{
    d.teacherLoads[tid]=d.teacherLoads[tid]||{};
    db.lessonTypes.forEach(lt=>{
      if(d.teacherLoads[tid][lt.id]===undefined)d.teacherLoads[tid][lt.id]=0;
    });
  });
}
function syncLinkedDiscipline(d,c,comp,r){
  const newHours=planRowToHours(r);
  scaleTeacherLoadsToPlan(d,newHours);
  Object.assign(d,{name:comp.name,course:c.course,semester:Number(r.semester),academicYear:c.academicYear,controlForm:r.control||"Немає",hours:newHours,sourceRowId:r.id,planMeta:{credits:num(r.credits),totalHours:num(r.totalHours),auditoriumHours:num(r.auditoriumHours),auditoriumPlanHours:num(r.auditoriumPlanHours),selfStudy:num(r.selfStudy),practice:num(r.practice),weekly:num(r.weekly)}});
  db.schedule.filter(s=>Number(s.disciplineId)===Number(d.id)).forEach(s=>{s.discipline=d.name;});
}
function syncAllCurriculumLinks(c){
  ensureCurriculumShape(c);
  (c.components||[]).forEach(comp=>(comp.rows||[]).forEach(r=>{
    db.disciplines.filter(d=>Number(d.sourceCurriculumId)===Number(c.id)&&Number(d.sourceComponentId)===Number(comp.id)&&(Number(d.sourceRowId)===Number(r.id)||(!d.sourceRowId&&Number(d.semester)===Number(r.semester)))).forEach(d=>syncLinkedDiscipline(d,c,comp,r));
  }));
}
function renderCurricula(){
  const plans=db.curricula||[];
  plans.forEach(ensureCurriculumShape);
  $("#page-curricula").innerHTML=`<div class="card section">
    <div class="section-head"><div><h2>Робочі навчальні плани</h2><span class="small">План є першоджерелом: зміни тут автоматично оновлюють активовані дисципліни та навантаження.</span></div><button class="primary" onclick="openCurriculumMetaModal()">+ Новий план</button></div>
    ${plans.length?`<div class="curriculum-grid">${plans.map(c=>{const t=curriculumTotalsFromRows(c);return `<div class="curriculum-card"><div class="curriculum-title"><div><span class="badge ok">${c.course||"—"} курс</span><h3>${esc(c.program||"Без назви")}</h3><div class="small">${esc(c.academicYear||"")} · ${esc(c.studyForm||"")} форма</div></div><div class="actions"><button class="primary" onclick="openCurriculum(${c.id})">Відкрити</button><button onclick="openCurriculumMetaModal(${c.id})">Редагувати</button></div></div><div class="curriculum-kpis"><div><b>${fmtHours(t.credits)}</b><span>кредитів</span></div><div><b>${fmtHours(t.totalHours)}</b><span>загальних годин</span></div><div><b>${fmtHours(t.auditoriumHours)}</b><span>аудиторних</span></div><div><b>${fmtHours(t.selfStudy)}</b><span>самостійних</span></div></div><div class="small" style="margin-top:12px">Групи: ${esc((c.applicableGroups||[]).join(", ")||"—")}</div></div>`;}).join("")}</div>`:`<div class="empty">Планів ще немає.</div>`}
  </div>`;
}
function openCurriculumMetaModal(id=null){
  const existing=id?curriculumById(id):null;
  const c=existing?clone(existing):{id:null,academicYear:db.academicYear,course:1,specialty:"026 Сценічне мистецтво",program:"Режисура естради і шоу",degree:"Бакалавр сценічного мистецтва",studyForm:"Денна",semesterWeeks:{},applicableGroups:[],components:[],blocks:[]};
  ensureCurriculumShape(c);
  openModal(`<h2>${id?"Редагувати":"Новий"} робочий навчальний план</h2><form id="cmf" class="form-grid">
    <label>Навчальний рік<input id="cmy" value="${esc(c.academicYear||"")}" required></label><label>Курс<select id="cmc">${[1,2,3,4,5,6].map(x=>`<option ${Number(c.course)===x?"selected":""}>${x}</option>`).join("")}</select></label>
    <label class="wide">Спеціальність<input id="cmspec" value="${esc(c.specialty||"")}"></label><label class="wide">Освітня програма<input id="cmprog" value="${esc(c.program||"")}" required></label>
    <label>Кваліфікація<input id="cmdeg" value="${esc(c.degree||"")}"></label><label>Форма навчання<input id="cmform" value="${esc(c.studyForm||"")}"></label>
    <label class="wide">Групи, до яких застосовується план<select id="cmgroups" multiple size="${Math.min(8,Math.max(3,db.groups.length))}">${db.groups.slice().sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`<option value="${esc(g.code)}" ${(c.applicableGroups||[]).includes(g.code)?"selected":""}>${esc(g.code)} · ${g.course} курс</option>`).join("")}</select></label>
    <div class="wide"><b>Кількість навчальних тижнів за семестрами</b><div class="weeks-grid">${[1,2,3,4,5,6,7,8,9,10].map(s=>`<label>${s} сем.<input class="cmweek" data-sem="${s}" type="number" min="0" step="1" value="${esc(c.semesterWeeks?.[s]||c.semesterWeeks?.[String(s)]||"")}"></label>`).join("")}</div></div>
    <div class="wide modal-footer-actions"><button class="primary">Зберегти</button>${id?`<button type="button" class="danger" onclick="deleteCurriculum(${id})">Видалити план</button>`:""}</div>
  </form>`,true);
  $("#cmf").onsubmit=e=>{e.preventDefault();const weeks={};$$('.cmweek').forEach(i=>{if(i.value!=="")weeks[i.dataset.sem]=num(i.value);});const obj={academicYear:$("#cmy").value.trim(),course:+$("#cmc").value,specialty:$("#cmspec").value.trim(),program:$("#cmprog").value.trim(),degree:$("#cmdeg").value.trim(),studyForm:$("#cmform").value.trim(),applicableGroups:[...$("#cmgroups").selectedOptions].map(o=>o.value),semesterWeeks:weeks};if(existing){Object.assign(existing,obj);syncAllCurriculumLinks(existing);}else{db.curricula.push({id:uid(db.curricula),...obj,components:[],blocks:[]});}closeModal();save();};
}
function deleteCurriculum(id){
  const c=curriculumById(id);if(!c)return;const linked=db.disciplines.filter(d=>Number(d.sourceCurriculumId)===Number(id));const linkedIds=new Set(linked.map(d=>Number(d.id)));const scheduled=db.schedule.filter(s=>linkedIds.has(Number(s.disciplineId)));
  if(scheduled.length)return alert(`Не можна видалити план: у розкладі є ${scheduled.length} пов’язаних занять. Спочатку видаліть або перенесіть їх.`);
  if(!confirm(`Видалити навчальний план «${c.program}», а також ${linked.length} створених із нього записів навантаження?`))return;
  db.disciplines=db.disciplines.filter(d=>Number(d.sourceCurriculumId)!==Number(id));db.curricula=db.curricula.filter(x=>Number(x.id)!==Number(id));closeModal();save();
}
function curriculumBlocks(c){ensureCurriculumShape(c);return c.blocks.slice().sort((a,b)=>(a.order||0)-(b.order||0));}
function activatedGroupsForPlanRow(c,comp,r){return (c.applicableGroups||[]).filter(group=>db.disciplines.some(d=>Number(d.sourceCurriculumId)===Number(c.id)&&Number(d.sourceComponentId)===Number(comp.id)&&(Number(d.sourceRowId)===Number(r.id)||(!d.sourceRowId&&Number(d.semester)===Number(r.semester)))&&d.group===group&&d.status!=="archived"));}
function openCurriculum(id){
  const c=curriculumById(id);if(!c)return;ensureCurriculumShape(c);const totals=curriculumTotalsFromRows(c),blocks=curriculumBlocks(c);
  const sections=[...new Set(blocks.map(b=>b.section))];
  let body="";
  sections.forEach(section=>{
    body+=`<div class="curriculum-section-head"><h3>${esc(section)}</h3><button class="secondary" onclick="openCurriculumBlockModal(${c.id},null,'${esc(section)}')">+ Блок</button></div>`;
    blocks.filter(b=>b.section===section).forEach(block=>{
      const comps=c.components.filter(x=>x.section===block.section&&x.category===block.name);
      body+=`<div class="plan-block"><div class="plan-block-head"><div><h4>${esc(block.name)}</h4><div class="small">${comps.length} дисциплін</div></div><div class="actions"><button class="primary" onclick="openCurriculumComponentModal(${c.id},null,${block.id})">+ Дисципліна</button><button onclick="openCurriculumBlockModal(${c.id},${block.id})">Редагувати блок</button></div></div>`;
      if(!comps.length)body+=`<div class="empty compact-empty">У цьому блоці ще немає дисциплін.</div>`;
      comps.forEach(comp=>{
        body+=`<div class="plan-compact-item"><div class="plan-compact-name"><div><b>${esc(comp.name)}</b> <span class="badge ${comp.scope==="department"?"ok":"warn"}">${scopeLabel(comp.scope)}</span></div><div class="actions"><button onclick="openCurriculumComponentModal(${c.id},${comp.id},${block.id})">Редагувати</button><button onclick="deleteCurriculumComponent(${c.id},${comp.id})">Видалити</button></div></div>`;
        (comp.rows||[]).sort((a,b)=>num(a.semester)-num(b.semester)).forEach(r=>{const active=activatedGroupsForPlanRow(c,comp,r);body+=`<div class="plan-sem-row"><div class="plan-sem-main"><span class="semester-chip">${r.semester} семестр</span><span>${esc(r.control||"—")}</span><b>${fmtHours(r.totalHours)} год</b><span>${fmtHours(r.credits)} кред.</span></div><div class="plan-sem-actions">${active.length?`<span class="badge ok">У навантаженні: ${esc(active.join(", "))}</span>`:""}${comp.scope==="department"?`<button class="primary" onclick="createLoadFromPlan(${c.id},${comp.id},${r.id})">У навантаження</button>`:""}</div></div><details class="plan-details"><summary>Показати години</summary><div class="plan-summary"><span>Аудиторні <b>${fmtHours(r.auditoriumHours)}</b>${num(r.auditoriumPlanHours)!==num(r.auditoriumHours)?` / план ${fmtHours(r.auditoriumPlanHours)}`:""}</span><span>Лекції <b>${fmtHours(r.lecture)}</b></span><span>Семінари <b>${fmtHours(r.seminar)}</b></span><span>Практичні <b>${fmtHours(r.practical)}</b></span><span>Лабораторні <b>${fmtHours(r.laboratory)}</b></span><span>Індивідуальні <b>${fmtHours(r.individual)}</b></span><span>Самостійні <b>${fmtHours(r.selfStudy)}</b></span>${r.practice?`<span>Практика <b>${fmtHours(r.practice)}</b></span>`:""}<span>На тиждень <b>${r.weekly||"—"}</b></span></div>${r.note?`<div class="small">${esc(r.note)}</div>`:""}</details>`;});
        body+=`</div>`;
      });
      body+=`</div>`;
    });
  });
  if(!blocks.length)body=`<div class="empty">У плані ще немає блоків. Створіть перший блок.</div>`;
  openModal(`<div class="curriculum-detail"><div class="workload-title"><div><h2>Робочий план · ${c.course} курс</h2><h3>${esc(c.program)}</h3><div class="small">${esc(c.specialty)} · ${esc(c.degree)} · ${esc(c.academicYear)}</div></div><div class="actions"><button class="primary" onclick="openCurriculumBlockModal(${c.id})">+ Блок</button><button onclick="openCurriculumMetaModal(${c.id})">Редагувати план</button></div></div><div class="grid-kpi workload-kpi" style="margin-top:16px">${kpi("Кредити",fmtHours(totals.credits))}${kpi("Усього годин",fmtHours(totals.totalHours))}${kpi("Аудиторні",fmtHours(totals.auditoriumHours))}${kpi("Самостійні",fmtHours(totals.selfStudy))}</div><div class="notice success-notice"><b>План редагований.</b> Якщо змінити назву, контроль або години вже активованої дисципліни, зміни автоматично переходять у «Дисципліни / навантаження», картки викладачів і розклад.</div>${body}</div>`,true);
}
function openCurriculumBlockModal(curriculumId,blockId=null,presetSection=""){
  const c=curriculumById(curriculumId);if(!c)return;ensureCurriculumShape(c);const b=blockId?c.blocks.find(x=>Number(x.id)===Number(blockId)):null;
  openModal(`<h2>${b?"Редагувати":"Новий"} блок навчального плану</h2><form id="cbf" class="form-grid"><label class="wide">Розділ<input id="cbsec" value="${esc(b?.section||presetSection||"Обов’язкові")}" placeholder="Напр. Обов’язкові"></label><label class="wide">Назва блоку<input id="cbname" value="${esc(b?.name||"")}" placeholder="Напр. Освітні компоненти професійної та практичної підготовки" required></label><div class="wide modal-footer-actions"><button class="primary">Зберегти</button>${b?`<button type="button" class="danger" onclick="deleteCurriculumBlock(${c.id},${b.id})">Видалити блок</button>`:""}</div></form>`);
  $("#cbf").onsubmit=e=>{e.preventDefault();const section=$("#cbsec").value.trim()||"Інше",name=$("#cbname").value.trim();if(b){const oldSec=b.section,oldName=b.name;b.section=section;b.name=name;c.components.filter(x=>x.section===oldSec&&x.category===oldName).forEach(x=>{x.section=section;x.category=name;});}else c.blocks.push({id:nextLocalId(c.blocks),section,name,order:c.blocks.length+1});closeModal();save();openCurriculum(c.id);};
}
function deleteCurriculumBlock(curriculumId,blockId){const c=curriculumById(curriculumId),b=c?.blocks?.find(x=>Number(x.id)===Number(blockId));if(!c||!b)return;const count=c.components.filter(x=>x.section===b.section&&x.category===b.name).length;if(count)return alert(`У блоці є ${count} дисциплін. Спочатку перенесіть або видаліть їх.`);if(confirm(`Видалити блок «${b.name}»?`)){c.blocks=c.blocks.filter(x=>Number(x.id)!==Number(blockId));closeModal();save();openCurriculum(c.id);}}
function curriculumRowEditor(r={}){
  const row={id:r.id||"",semester:r.semester||1,control:r.control||"Немає",credits:r.credits||0,totalHours:r.totalHours||0,auditoriumHours:r.auditoriumHours||0,auditoriumPlanHours:r.auditoriumPlanHours??r.auditoriumHours??0,lecture:r.lecture||0,seminar:r.seminar||0,practical:r.practical||0,laboratory:r.laboratory||0,individual:r.individual||0,selfStudy:r.selfStudy||0,practice:r.practice||0,weekly:r.weekly||0,note:r.note||""};
  const nf=(k,label)=>`<label>${label}<input data-rfield="${k}" type="number" min="0" step="0.01" value="${esc(row[k])}"></label>`;
  return `<div class="curriculum-row-editor" data-crow data-rowid="${esc(row.id)}"><div class="curriculum-row-editor-head"><b>Семестровий рядок</b><button type="button" class="danger small-btn" onclick="this.closest('[data-crow]').remove()">Видалити рядок</button></div><div class="curriculum-row-grid"><label>Семестр<select data-rfield="semester">${[1,2,3,4,5,6,7,8,9,10].map(s=>`<option ${Number(row.semester)===s?"selected":""}>${s}</option>`).join("")}</select></label><label>Форма контролю<select data-rfield="control">${db.controlForms.map(v=>`<option ${v===row.control?"selected":""}>${esc(v)}</option>`).join("")} ${!db.controlForms.includes(row.control)?`<option selected>${esc(row.control)}</option>`:""}</select></label>${nf("credits","Кредити")}${nf("totalHours","Загальний обсяг")}${nf("auditoriumHours","Аудиторні за видами")}${nf("auditoriumPlanHours","Планові аудиторні")}${nf("lecture","Лекції")}${nf("seminar","Семінари")}${nf("practical","Практичні")}${nf("laboratory","Лабораторні")}${nf("individual","Індивідуальні")}${nf("selfStudy","Самостійна робота")}${nf("practice","Практика")}${nf("weekly","Годин / тиждень")}<label class="wide-row">Примітка<input data-rfield="note" value="${esc(row.note)}"></label></div></div>`;
}
function addCurriculumRow(){const box=$("#curriculumRows");box.insertAdjacentHTML('beforeend',curriculumRowEditor({semester:1,control:"Немає"}));}
function readCurriculumRows(comp){
  let next=nextLocalId(comp?.rows||[]);
  return [...document.querySelectorAll('[data-crow]')].map(card=>{let rid=Number(card.dataset.rowid)||next++;const get=k=>card.querySelector(`[data-rfield="${k}"]`)?.value??"";return {id:rid,semester:+get('semester'),control:get('control'),credits:num(get('credits')),totalHours:num(get('totalHours')),auditoriumHours:num(get('auditoriumHours')),auditoriumPlanHours:num(get('auditoriumPlanHours')),lecture:num(get('lecture')),seminar:num(get('seminar')),practical:num(get('practical')),laboratory:num(get('laboratory')),individual:num(get('individual')),selfStudy:num(get('selfStudy')),practice:num(get('practice')),weekly:num(get('weekly')),note:get('note').trim()};});
}
function openCurriculumComponentModal(curriculumId,componentId=null,blockId=null){
  const c=curriculumById(curriculumId);if(!c)return;ensureCurriculumShape(c);const comp=componentId?curriculumComponent(c,componentId):null;const selectedBlock=comp?c.blocks.find(b=>b.section===comp.section&&b.name===comp.category):c.blocks.find(b=>Number(b.id)===Number(blockId));
  if(!c.blocks.length)return alert("Спочатку створіть блок навчального плану.");
  openModal(`<h2>${comp?"Редагувати":"Нова"} дисципліна в навчальному плані</h2><form id="ccf"><div class="form-grid"><label class="wide">Назва дисципліни<input id="ccname" value="${esc(comp?.name||"")}" required></label><label>Тип<select id="ccscope"><option value="department" ${comp?.scope!=="external"?"selected":""}>Кафедральна</option><option value="external" ${comp?.scope==="external"?"selected":""}>Не кафедральна / загальноосвітня</option></select></label><label>Блок<select id="ccblock">${c.blocks.map(b=>`<option value="${b.id}" ${Number(b.id)===Number(selectedBlock?.id)?"selected":""}>${esc(b.section)} → ${esc(b.name)}</option>`).join("")}</select></label></div><div class="section-head compact" style="margin-top:18px"><div><b>Семестри та години</b><div class="small">Можна змінювати всі цифри або додати ще один семестр.</div></div><button type="button" class="secondary" onclick="addCurriculumRow()">+ Семестр</button></div><div id="curriculumRows">${(comp?.rows?.length?comp.rows:[{semester:1,control:"Немає"}]).map(curriculumRowEditor).join("")}</div><div class="modal-footer-actions"><button class="primary">Зберегти дисципліну</button></div></form>`,true);
  $("#ccf").onsubmit=e=>{e.preventDefault();const rows=readCurriculumRows(comp);if(!rows.length)return alert("Додайте хоча б один семестровий рядок.");const sems=rows.map(r=>r.semester);if(new Set(sems).size!==sems.length)return alert("У межах однієї дисципліни не може бути два однакові семестрові рядки.");const b=c.blocks.find(x=>Number(x.id)===Number($("#ccblock").value));const oldRowIds=new Set((comp?.rows||[]).map(r=>Number(r.id)));const newRowIds=new Set(rows.map(r=>Number(r.id)));const removed=[...oldRowIds].filter(id=>!newRowIds.has(id));for(const rid of removed){const linked=db.disciplines.filter(d=>Number(d.sourceCurriculumId)===Number(c.id)&&Number(d.sourceComponentId)===Number(comp.id)&&Number(d.sourceRowId)===Number(rid));const ids=new Set(linked.map(d=>Number(d.id)));if(db.schedule.some(s=>ids.has(Number(s.disciplineId))))return alert("Не можна видалити семестровий рядок, бо для нього вже є заняття в розкладі. Спочатку видаліть ці заняття.");db.disciplines=db.disciplines.filter(d=>!ids.has(Number(d.id)));}
    const obj={name:$("#ccname").value.trim(),scope:$("#ccscope").value,section:b.section,category:b.name,rows};if(comp){Object.assign(comp,obj);}else c.components.push({id:nextLocalId(c.components),...obj});syncAllCurriculumLinks(c);closeModal();save();openCurriculum(c.id);};
}
function deleteCurriculumComponent(curriculumId,componentId){
  const c=curriculumById(curriculumId),comp=curriculumComponent(c,componentId);if(!c||!comp)return;const linked=db.disciplines.filter(d=>Number(d.sourceCurriculumId)===Number(c.id)&&Number(d.sourceComponentId)===Number(comp.id));const ids=new Set(linked.map(d=>Number(d.id)));const scheduled=db.schedule.filter(s=>ids.has(Number(s.disciplineId)));if(scheduled.length)return alert(`Не можна видалити дисципліну: у розкладі є ${scheduled.length} пов’язаних занять.`);if(!confirm(`Видалити «${comp.name}» із навчального плану і ${linked.length} пов’язаних записів навантаження?`))return;db.disciplines=db.disciplines.filter(d=>!ids.has(Number(d.id)));c.components=c.components.filter(x=>Number(x.id)!==Number(componentId));save();openCurriculum(c.id);
}
function createLoadFromPlan(curriculumId,componentId,rowId){
  const c=curriculumById(curriculumId),comp=curriculumComponent(c,componentId);ensureCurriculumShape(c);const r=comp?.rows?.find(x=>Number(x.id)===Number(rowId));if(!c||!comp||!r)return;const availableGroups=(c.applicableGroups||[]).filter(g=>db.groups.some(x=>x.code===g));
  openModal(`<h2>Створити дисципліну з робочого плану</h2><div class="notice"><b>${esc(comp.name)}</b> · ${r.semester} семестр · ${esc(r.control)}</div><form id="planLoadForm" class="form-grid"><label class="wide">Для яких груп<select id="plGroups" multiple size="${Math.max(2,availableGroups.length)}">${availableGroups.map(g=>`<option value="${esc(g)}" selected>${esc(g)} · ${groupStudentCount(g)} студентів</option>`).join("")}</select><span class="small">Ctrl/⌘ + клік — вибір окремих груп.</span></label><div class="wide"><b>З плану буде перенесено</b><div class="plan-summary" style="margin-top:8px"><span>Лекції ${fmtHours(r.lecture)}</span><span>Семінари ${fmtHours(r.seminar)}</span><span>Практичні ${fmtHours(r.practical)}</span><span>Лабораторні ${fmtHours(r.laboratory)}</span><span>Індивідуальні ${fmtHours(r.individual)}</span></div></div><div class="wide"><button class="primary">Створити в «Дисципліни / навантаження»</button></div></form>`);
  $("#planLoadForm").onsubmit=e=>{e.preventDefault();const groups=[...$("#plGroups").selectedOptions].map(o=>o.value);if(!groups.length)return alert("Оберіть хоча б одну групу.");const created=[],skipped=[];groups.forEach(group=>{const exists=db.disciplines.some(d=>Number(d.sourceCurriculumId)===Number(c.id)&&Number(d.sourceComponentId)===Number(comp.id)&&Number(d.sourceRowId)===Number(r.id)&&d.group===group);if(exists){skipped.push(group);return;}db.disciplines.push({id:uid(db.disciplines),name:comp.name,course:c.course,group,semester:Number(r.semester),academicYear:c.academicYear,teacherIds:[],teacherLoads:{},controlForm:r.control,color:"#8b5cf6",hours:planRowToHours(r),note:"",status:"active",sourceCurriculumId:c.id,sourceComponentId:comp.id,sourceRowId:r.id,planMeta:{credits:r.credits,totalHours:r.totalHours,auditoriumHours:r.auditoriumHours,auditoriumPlanHours:r.auditoriumPlanHours,selfStudy:r.selfStudy,practice:r.practice,weekly:r.weekly}});created.push(group);});save();closeModal();alert(`Створено: ${created.length}${skipped.length?`. Уже існувало: ${skipped.join(", ")}`:""}`);go("disciplines");};
}

function isAuditoriumPairType(lt){
  if(!lt)return false;
  if(lt.countMode==="academic_pair")return true;
  const name=normIdentity(lt.name);
  return ["лекція", "семінар", "практичне", "лабораторне"].includes(name);
}
function auditoriumLessonTypes(){return db.lessonTypes.filter(isAuditoriumPairType);}
function disciplinePlannedTypes(d){return db.lessonTypes.filter(lt=>num(d?.hours?.[lt.id])>0);}
function disciplineAuditoriumPlan(d){return db.lessonTypes.filter(isAuditoriumPairType).reduce((a,lt)=>a+num(d?.hours?.[lt.id]),0);}
function disciplineAllocatedForType(d,typeId){
  return Object.values(d?.teacherLoads||{}).reduce((a,load)=>a+num(load?.[typeId]),0);
}
function explicitlyAllocatedTeacherIds(d){
  return Object.entries(d?.teacherLoads||{})
    .filter(([tid,load])=>teacherById(Number(tid))&&Object.values(load||{}).some(v=>num(v)>0))
    .map(([tid])=>Number(tid));
}
function explicitlyAllocatedTeacherNames(d){
  return explicitlyAllocatedTeacherIds(d).map(id=>teacherDisplay(teacherById(id))).filter(Boolean).join(", ");
}
function disciplineAuditoriumAllocated(d){
  return db.lessonTypes.filter(isAuditoriumPairType).reduce((a,lt)=>a+disciplineAllocatedForType(d,lt.id),0);
}
function disciplineAllocationBadge(d){
  const plan=disciplineAuditoriumPlan(d),allocated=disciplineAuditoriumAllocated(d);
  if(plan<=0)return `<span class="badge">НЕМАЄ АУД. ПАР</span>`;
  const cls=allocated>plan+0.001?"bad":Math.abs(allocated-plan)<=0.001?"ok":"warn";
  const text=allocated>plan+0.001?"ПЕРЕРОЗПОДІЛЕНО":Math.abs(allocated-plan)<=0.001?"РОЗПОДІЛЕНО":"Є ЗАЛИШОК";
  return `<span class="badge ${cls}">${text}</span><div class="small">${fmtHours(allocated)} / ${fmtHours(plan)} ауд. год</div>`;
}
function renderDisciplines(){
  const rows=db.disciplines.filter(d=>d.status!=="archived").sort((a,b)=>(a.course||99)-(b.course||99)||a.name.localeCompare(b.name));
  $("#page-disciplines").innerHTML=`<div class="card section"><div class="section-head"><div><h2>Навантаження</h2><div class="small">1. Активуй дисципліну з навчального плану. 2. Тут розподіли її години між усіма викладачами, які її читають.</div></div><button class="primary" onclick="openDisciplineModal()">+ Додати дисципліну</button></div>
  <div class="notice">Розподіл накопичувальний: можна спочатку зберегти години одного викладача, потім відкрити дисципліну й додати другого або третього. Попередній розподіл не стирається.</div>
  ${rows.length?`<div class="table-wrap"><table><thead><tr><th>Дисципліна</th><th>Група</th><th>Сем.</th><th>Викладачі</th><th>Розподіл аудиторних</th><th>Контроль</th><th></th></tr></thead><tbody>${rows.map(d=>`<tr>
    <td><span class="color-dot" style="background:${esc(d.color||"#8b5cf6")}"></span><b>${esc(d.name)}</b><div class="small">${esc(d.academicYear||"")}</div></td>
    <td>${esc(d.group||"—")}</td><td>${d.semester||"—"}</td>
    <td>${esc(explicitlyAllocatedTeacherNames(d)||"—")}</td>
    <td>${disciplineAllocationBadge(d)}</td>
    <td>${esc(d.controlForm||"—")}</td>
    <td class="actions"><button class="primary-inline" onclick="openDisciplineModal(${d.id})">Розподілити години</button><button onclick="deleteDiscipline(${d.id})">Видалити</button></td>
  </tr>`).join("")}</tbody></table></div>`:`<div class="empty">Активованих дисциплін ще немає.</div>`}</div>`;
}
let disciplineAllocationDraft={};
let disciplineAllocationId=null;
function cloneAllocationLoads(d){
  const out={};
  const ids=new Set([...(d?.teacherIds||[]).map(String),...Object.keys(d?.teacherLoads||{})]);
  ids.forEach(tid=>{
    if(!teacherById(Number(tid)))return;
    out[tid]={};
    db.lessonTypes.forEach(lt=>out[tid][lt.id]=num((d?.teacherLoads?.[tid]||d?.teacherLoads?.[Number(tid)]||{})[lt.id]));
  });
  return out;
}
function captureAllocationDraft(){
  $$('[data-allocation-teacher]').forEach(card=>{
    const tid=String(card.dataset.allocationTeacher);
    disciplineAllocationDraft[tid]=disciplineAllocationDraft[tid]||{};
    card.querySelectorAll('[data-allocation-hour]').forEach(inp=>disciplineAllocationDraft[tid][inp.dataset.type]=num(inp.value));
  });
}
function allocationDraftTotal(typeId,excludeTid=null){
  return Object.entries(disciplineAllocationDraft||{}).reduce((sum,[tid,load])=>String(tid)===String(excludeTid)?sum:sum+num(load?.[typeId]),0);
}
function allocationSummaryHtml(d){
  const types=disciplinePlannedTypes(d);
  if(!types.length)return `<div class="empty">У плані немає годин для розподілу.</div>`;
  return `<div class="allocation-summary-grid">${types.map(lt=>{
    const plan=num(d.hours?.[lt.id]),allocated=allocationDraftTotal(lt.id),remaining=plan-allocated;
    const cls=remaining<-.001?"bad":Math.abs(remaining)<=.001?"ok":"warn";
    return `<div class="allocation-summary-item"><span>${esc(lt.name)}</span><b>${fmtHours(allocated)} / ${fmtHours(plan)}</b><small class="${cls}">${remaining<-.001?`перевищено ${fmtHours(-remaining)}`:`залишилось ${fmtHours(Math.max(0,remaining))}`} год</small></div>`;
  }).join("")}</div>`;
}
function refreshAllocationSummary(d){
  captureAllocationDraft();
  const box=$("#allocationSummary");if(box)box.innerHTML=allocationSummaryHtml(d);
}
function allocationTeacherPickerHtml(){
  const used=new Set(Object.keys(disciplineAllocationDraft||{}).map(String));
  const rows=departmentTeachers().filter(t=>!used.has(String(t.id)));
  return `<option value="">— обрати викладача —</option>${rows.map(t=>`<option value="${t.id}">${esc(teacherDisplay(t))}</option>`).join("")}`;
}
function renderAllocationEditor(d){
  const box=$("#teacherAllocation");if(!box)return;
  const ids=Object.keys(disciplineAllocationDraft||{}).filter(tid=>teacherById(Number(tid))).sort((a,b)=>teacherDisplay(teacherById(Number(a))).localeCompare(teacherDisplay(teacherById(Number(b))),"uk"));
  const types=disciplinePlannedTypes(d);
  box.innerHTML=ids.length?ids.map(tid=>{
    const t=teacherById(Number(tid)),load=disciplineAllocationDraft[tid]||{};
    const scheduledTotal=types.reduce((a,lt)=>a+scheduledLoad(d.id,Number(tid),lt.name),0);
    return `<div class="allocation-card progressive-allocation" data-allocation-teacher="${tid}">
      <div class="allocation-card-head"><div><b>${esc(teacherDisplay(t))}</b><div class="small">${scheduledTotal?`У розкладі вже ${fmtHours(scheduledTotal)} год`:`Ще немає виставлених занять`}</div></div><div class="actions"><button type="button" class="secondary" onclick="fillTeacherWithRemaining(${tid})">Заповнити залишком</button><button type="button" class="danger" onclick="removeAllocationTeacher(${tid})">Прибрати</button></div></div>
      <div class="hours-grid">${types.map(lt=>{const used=scheduledLoad(d.id,Number(tid),lt.name);return `<label>${esc(lt.name)}<input data-allocation-hour data-type="${lt.id}" type="number" min="${fmtHours(used)}" step="0.01" value="${esc(load[lt.id]||0)}"><span class="small">план дисципліни ${fmtHours(d.hours?.[lt.id])}${used?` · вже в розкладі ${fmtHours(used)}`:""}</span></label>`;}).join("")}</div>
    </div>`;
  }).join(""):`<div class="empty">Викладачів ще не додано. Обери першого викладача нижче.</div>`;
  const picker=$("#allocationTeacherPicker");if(picker)picker.innerHTML=allocationTeacherPickerHtml();
  $$('#teacherAllocation [data-allocation-hour]').forEach(inp=>inp.oninput=()=>refreshAllocationSummary(d));
  const sum=$("#allocationSummary");if(sum)sum.innerHTML=allocationSummaryHtml(d);
}
function addAllocationTeacher(){
  captureAllocationDraft();
  const tid=Number($("#allocationTeacherPicker")?.value);if(!tid)return alert("Оберіть викладача.");
  if(disciplineAllocationDraft[String(tid)])return;
  disciplineAllocationDraft[String(tid)]={};db.lessonTypes.forEach(lt=>disciplineAllocationDraft[String(tid)][lt.id]=0);
  renderAllocationEditor(disciplineById(disciplineAllocationId)||window.__disciplineDraft);
}
function removeAllocationTeacher(tid){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;if(!d)return;
  captureAllocationDraft();
  const scheduled=db.lessonTypes.reduce((a,lt)=>a+scheduledLoad(d.id,Number(tid),lt.name),0);
  if(scheduled>0)return alert(`Цього викладача не можна прибрати: у розкладі вже виставлено ${fmtHours(scheduled)} год. Спочатку перенеси або видали ці заняття.`);
  delete disciplineAllocationDraft[String(tid)];renderAllocationEditor(d);
}
function fillTeacherWithRemaining(tid){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;if(!d)return;
  captureAllocationDraft();
  const key=String(tid);disciplineAllocationDraft[key]=disciplineAllocationDraft[key]||{};
  disciplinePlannedTypes(d).forEach(lt=>{
    const other=allocationDraftTotal(lt.id,key),plan=num(d.hours?.[lt.id]),alreadyScheduled=scheduledLoad(d.id,Number(tid),lt.name);
    disciplineAllocationDraft[key][lt.id]=Math.max(alreadyScheduled,Math.max(0,plan-other));
  });
  renderAllocationEditor(d);
}
function validateAllocationDraft(d){
  captureAllocationDraft();
  const errors=[];
  disciplinePlannedTypes(d).forEach(lt=>{
    const plan=num(d.hours?.[lt.id]),allocated=allocationDraftTotal(lt.id);
    if(allocated>plan+.001)errors.push(`${lt.name}: розподілено ${fmtHours(allocated)} год при плані ${fmtHours(plan)}.`);
  });
  Object.entries(disciplineAllocationDraft).forEach(([tid,load])=>{
    db.lessonTypes.forEach(lt=>{
      const used=scheduledLoad(d.id,Number(tid),lt.name);
      if(num(load?.[lt.id])+0.001<used)errors.push(`${teacherDisplay(teacherById(Number(tid)))} · ${lt.name}: у розкладі вже ${fmtHours(used)} год, тому навантаження не можна зменшити до ${fmtHours(load?.[lt.id])}.`);
    });
  });
  return errors;
}
function openDisciplineModal(id=null){
  const d=id?disciplineById(id):{id:null,name:"",course:"",group:"",semester:db.semester,academicYear:db.academicYear,teacherIds:[],teacherLoads:{},controlForm:"Немає",color:"#8b5cf6",hours:{},note:"",status:"active"};
  const fromPlan=!!d.sourceCurriculumId,lock=fromPlan?'disabled':'',ro=fromPlan?'readonly':'';
  disciplineAllocationId=id;window.__disciplineDraft=d;disciplineAllocationDraft=cloneAllocationLoads(d);
  const hours=db.lessonTypes.map(t=>`<label>${esc(t.name)}<input class="dh" data-type="${t.id}" type="number" min="0" step="0.01" value="${esc(d.hours?.[t.id]||0)}" ${ro}></label>`).join("");
  openModal(`<h2>${id?"Навантаження дисципліни":"Нова дисципліна кафедри"}</h2>${fromPlan?`<div class="notice success-notice"><b>${esc(d.name)}</b> створена з робочого плану. Загальні години тут не змінюються — ти тільки розподіляєш їх між викладачами.</div>`:""}<form id="df" class="form-grid">
    <label class="wide">Назва дисципліни<input id="dn" value="${esc(d.name)}" required ${ro}></label>
    <label>Група<select id="dg" ${lock}><option value="">—</option>${groupOptions(d.group)}</select></label>
    <label>Курс<select id="dc" ${lock}><option value="">—</option>${[1,2,3,4,5,6].map(x=>`<option ${Number(d.course)===x?"selected":""}>${x}</option>`).join("")}</select></label>
    <label>Навчальний рік<input id="dy" value="${esc(d.academicYear||db.academicYear)}" ${ro}></label>
    <label>Семестр<select id="ds" ${lock}>${[1,2,3,4,5,6,7,8,9,10].map(x=>`<option ${Number(d.semester)===x?"selected":""}>${x}</option>`).join("")}</select></label>
    <label>Форма контролю<select id="dctrl" ${lock}>${db.controlForms.map(v=>`<option ${v===d.controlForm?"selected":""}>${esc(v)}</option>`).join("")}</select></label>
    <label>Колір<input id="dcolor" type="color" value="${esc(d.color||"#8b5cf6")}"></label>
    <div class="wide"><b>Години за робочим планом</b><div class="hours-grid" style="margin-top:8px">${hours}</div></div>
    <div class="wide allocation-section">
      <div class="section-head compact"><div><b>Розподіл між викладачами</b><div class="small">Додавай викладачів по одному. Можна зберігати частковий розподіл і повернутися до нього пізніше.</div></div></div>
      <div id="allocationSummary"></div>
      <div id="teacherAllocation"></div>
      <div class="allocation-add-teacher"><select id="allocationTeacherPicker"></select><button type="button" class="primary-inline" id="allocationAddTeacher">+ Додати викладача</button></div>
    </div>
    <label class="wide">Примітка<textarea id="dnote" rows="3">${esc(d.note||"")}</textarea></label>
    <div class="wide"><button class="primary">Зберегти навантаження</button></div>
  </form>`,true);
  if(!fromPlan)$("#dg").onchange=()=>{const g=db.groups.find(x=>x.code===$("#dg").value);if(g)$("#dc").value=g.course;};
  renderAllocationEditor(d);$("#allocationAddTeacher").onclick=addAllocationTeacher;
  $("#df").onsubmit=e=>{
    e.preventDefault();
    const hs={};$$('.dh').forEach(i=>hs[i.dataset.type]=num(i.value));
    if(!fromPlan)d.hours=hs;
    const errors=validateAllocationDraft(d);if(errors.length)return alert("Перевір розподіл:\n\n"+errors.join("\n"));
    const ids=Object.keys(disciplineAllocationDraft).map(Number).filter(id=>{
      if(!teacherById(id))return false;
      const load=disciplineAllocationDraft[String(id)]||{};
      return Object.values(load).some(v=>num(v)>0);
    });
    const teacherLoads={};ids.forEach(tid=>{teacherLoads[tid]={};db.lessonTypes.forEach(lt=>teacherLoads[tid][lt.id]=num(disciplineAllocationDraft[String(tid)]?.[lt.id]));});
    const obj=fromPlan?{teacherIds:ids,teacherLoads,color:$("#dcolor").value,note:$("#dnote").value.trim(),status:"active"}:{name:$("#dn").value.trim(),group:$("#dg").value,course:+$("#dc").value||"",academicYear:$("#dy").value.trim(),semester:+$("#ds").value,teacherIds:ids,teacherLoads,controlForm:$("#dctrl").value,color:$("#dcolor").value,hours:hs,note:$("#dnote").value.trim(),status:"active"};
    if(id)Object.assign(d,obj);else db.disciplines.push({id:uid(db.disciplines),...obj});
    disciplineAllocationId=null;disciplineAllocationDraft={};delete window.__disciplineDraft;closeModal();save();
  };
}

function deleteDiscipline(id){const d=disciplineById(id);if(confirm(`Видалити «${d.name}»?`)){db.disciplines=db.disciplines.filter(x=>x.id!==id);db.schedule.forEach(s=>{if(Number(s.disciplineId)===Number(id))s.disciplineId=null;});save();}}

/* Schedule */
function lessonTypeIdByName(name){return lessonTypeByName(name)?.id||null;}
function disciplineTypePlan(d,typeName){const id=lessonTypeIdByName(typeName);return id?num(d?.hours?.[id]):0;}
function teacherTypePlan(d,teacherId,typeName){
  if(!d||!teacherId)return 0;
  const id=lessonTypeIdByName(typeName);if(!id)return 0;
  const load=explicitTeacherLoad(d,teacherId);
  return load?num(load[id]):0;
}
function scheduledLoad(disciplineId,teacherId,typeName,ignoreId=null){
  return db.schedule.filter(s=>s.id!==ignoreId&&Number(s.disciplineId)===Number(disciplineId)&&Number(s.teacherId)===Number(teacherId)&&s.type===typeName).reduce((a,s)=>a+num(s.workloadHours),0);
}
function remainingLoad(d,teacherId,typeName,ignoreId=null){return teacherTypePlan(d,teacherId,typeName)-scheduledLoad(d.id,teacherId,typeName,ignoreId);}
function allocatedTeachersForType(d,typeName){
  return explicitlyAllocatedTeacherIds(d).map(teacherById).filter(t=>t&&teacherTypePlan(d,t.id,typeName)>0);
}
function schedulableTypes(d){return db.lessonTypes.filter(lt=>isAuditoriumPairType(lt)&&disciplineTypePlan(d,lt.name)>0);}
function bellPairs(){return (db.bellSchedule||[]).slice().sort((a,b)=>Number(a.id)-Number(b.id));}
function pairById(id){return bellPairs().find(p=>String(p.id)===String(id));}
function pairIdForTimes(start,end){return bellPairs().find(p=>p.start===start&&p.end===end)?.id||null;}
function pairForLesson(x){return pairById(x?.pairId)||pairById(pairIdForTimes(x?.start,x?.end));}
function pairOptions(selected=null,includeCustom=false){
  const rows=bellPairs().map(p=>`<option value="${esc(p.id)}" ${String(p.id)===String(selected)?"selected":""}>${p.id} пара${p.start&&p.end?` · ${esc(p.start)}–${esc(p.end)}`:""}</option>`).join("");
  return rows+(includeCustom?`<option value="__custom__" ${selected==="__custom__"?"selected":""}>Інший час</option>`:"");
}
function pairDisplay(x){const p=pairForLesson(x);return p?`${p.id} пара`:(x.start&&x.end?`${x.start}–${x.end}`:"—");}
function pairTimeDisplay(x){const p=pairForLesson(x);return p&&p.start&&p.end?`${p.start}–${p.end}`:(x.start&&x.end?`${x.start}–${x.end}`:"");}
function activeTeacherOptions(selected=null){return db.teachers.filter(t=>t.status!=="archived").map(t=>`<option value="${t.id}" ${Number(t.id)===Number(selected)?"selected":""}>${esc(teacherDisplay(t))}</option>`).join("");}
function workloadTeacherRowsForGroup(group){
  const rows=[];
  db.disciplines.filter(d=>d.status!=="archived"&&normIdentity(d.group)===normIdentity(group)).forEach(d=>{
    explicitlyAllocatedTeacherIds(d).forEach(teacherId=>{
      const t=teacherById(teacherId);if(!t)return;
      const types=schedulableTypes(d).map(lt=>{
        const planned=teacherTypePlan(d,t.id,lt.name);if(planned<=0)return null;
        const scheduled=scheduledLoad(d.id,t.id,lt.name);
        return {lt,planned,scheduled,remaining:Math.max(0,planned-scheduled)};
      }).filter(Boolean);
      if(!types.length)return;
      rows.push({d,t,types,planned:types.reduce((a,x)=>a+x.planned,0),scheduled:types.reduce((a,x)=>a+x.scheduled,0),remaining:types.reduce((a,x)=>a+x.remaining,0)});
    });
  });
  return rows;
}
function groupsWithDistributedAuditoriumLoad(){
  return db.groups.filter(g=>workloadTeacherRowsForGroup(g.code).length>0);
}
function bestWorkloadGroup(){
  const remembered=rememberedWorkloadGroup();
  if(remembered&&workloadTeacherRowsForGroup(remembered).length>0)return remembered;
  const loaded=groupsWithDistributedAuditoriumLoad();
  if(loaded.length)return loaded[0].code;
  const activated=db.disciplines.find(d=>d.status!=="archived"&&d.group);
  return activated?.group||db.groups[0]?.code||"";
}
function workloadGroupOptions(selected){
  const loaded=groupsWithDistributedAuditoriumLoad();
  const loadedSet=new Set(loaded.map(g=>g.code));
  const rest=db.groups.filter(g=>!loadedSet.has(g.code));
  const opt=g=>`<option value="${esc(g.code)}" ${g.code===selected?"selected":""}>${esc(g.code)} · ${g.course} курс</option>`;
  return `${loaded.length?`<optgroup label="Є розподілене навантаження">${loaded.map(opt).join("")}</optgroup>`:""}${rest.length?`<optgroup label="Ще без розподіленого навантаження">${rest.map(opt).join("")}</optgroup>`:""}`;
}
function currentWorkloadGroup(){
  return $("#workloadGroup")?.value||bestWorkloadGroup();
}
function workloadTypeSummary(types){
  return `<div class="integrated-load-types">${types.map(x=>`<div class="integrated-load-type"><b>${esc(x.lt.name)}</b><span>${fmtHours(x.scheduled)} / ${fmtHours(x.planned)} год</span><small>зал. ${fmtHours(x.remaining)}</small></div>`).join("")}</div>`;
}
function renderWorkloadToSchedule(group){
  const rows=workloadTeacherRowsForGroup(group);
  const unallocated=db.disciplines.filter(d=>d.status!=="archived"&&normIdentity(d.group)===normIdentity(group)).flatMap(d=>schedulableTypes(d).map(lt=>({d,lt,plan:disciplineTypePlan(d,lt.name),allocated:disciplineAllocatedForType(d,lt.id)}))).filter(x=>x.plan-x.allocated>0.001);
  if(!rows.length)return `<div class="empty">Для ${esc(group)} ще немає розподіленого аудиторного навантаження. Спочатку відкрий «Навантаження» і розподіли години між викладачами.</div>`;
  const warning=unallocated.length?`<div class="notice warn-notice"><b>Ще не все розподілено між викладачами:</b> ${unallocated.map(x=>`${esc(x.d.name)} · ${esc(x.lt.name)} — ${fmtHours(x.plan-x.allocated)} год`).join("; ")}</div>`:"";
  return `${warning}<div class="table-wrap"><table class="integrated-load-table"><thead><tr><th>Дисципліна</th><th>Сем.</th><th>Викладач</th><th>Розподілене навантаження</th><th>Усього</th><th>Залишок</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.d.name)}</b><div class="small">${esc(x.d.group)}</div></td><td>${x.d.semester||"—"}</td><td><b>${esc(teacherDisplay(x.t))}</b></td><td>${workloadTypeSummary(x.types)}</td><td><b>${fmtHours(x.scheduled)} / ${fmtHours(x.planned)}</b><div class="small">виставлено / розподілено</div></td><td><span class="badge ${x.remaining<=0?"ok":"warn"}">${fmtHours(x.remaining)} год</span></td><td class="actions"><button class="${x.remaining>0?"primary-inline":"secondary"}" onclick="openDisciplineTeacherScheduler(${x.d.id},${x.t.id})">${x.remaining>0?"Розставити навантаження":"Переглянути календар"}</button></td></tr>`).join("")}</tbody></table></div>`;
}
function renderSchedule(){
  const defaultGroup=bestWorkloadGroup();
  const loadedGroups=groupsWithDistributedAuditoriumLoad();
  $("#page-schedule").innerHTML=`<div class="card section">
    <div class="section-head">
      <div><h2>Складання розкладу</h2><div class="small">Тут з’являються години, які ти вже явно розподілив між викладачами у «Навантаженні».</div></div>
      <div class="actions"><button class="secondary" onclick="openBulkScheduleModal(currentWorkloadGroup())">⇉ За правилом</button><button class="primary" onclick="openLessonModal(null,{group:currentWorkloadGroup()})">+ Одне заняття</button></div>
    </div>
    <div class="workflow-status-strip">
      <div><span>Груп із розподіленим аудиторним навантаженням</span><b>${loadedGroups.length}</b></div>
      <div class="workflow-group-picker"><label>Група<select id="workloadGroup">${workloadGroupOptions(defaultGroup)}</select></label></div>
    </div>
    <div id="workloadScheduleBox"></div>
  </div>
  <div class="card section"><div class="section-head"><h2>Виставлені заняття</h2><button class="secondary" onclick="go('timetable')">Відкрити календар →</button></div><div class="toolbar"><input id="scheduleSearch" placeholder="Група, дисципліна, аудиторія…"><select id="scheduleGroup"><option value="">Усі групи</option>${groupOptions()}</select></div><div id="scheduleTable"></div></div>`;
  const draw=()=>{
    const group=$("#workloadGroup").value;
    rememberWorkloadGroup(group);
    $("#workloadScheduleBox").innerHTML=renderWorkloadToSchedule(group);
  };
  $("#workloadGroup").onchange=draw;draw();
  $("#scheduleSearch").oninput=renderScheduleTable;$("#scheduleGroup").onchange=renderScheduleTable;renderScheduleTable();
}
function renderScheduleTable(){
  if(!$("#scheduleTable"))return;const q=($("#scheduleSearch")?.value||"").toLowerCase(),gf=$("#scheduleGroup")?.value||"";
  const rows=db.schedule.filter(x=>dateInBounds(x.date)&&(!gf||x.group===gf)&&(!q||JSON.stringify(x).toLowerCase().includes(q))).slice().sort((a,b)=>(a.date+(pairForLesson(a)?.id||99)).localeCompare(b.date+(pairForLesson(b)?.id||99)));
  $("#scheduleTable").innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Дата</th><th>Пара</th><th>Група</th><th>Дисципліна</th><th>Вид</th><th>Облік. год.</th><th>Аудиторія</th><th>Викладач</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${formatDate(x.date)}</td><td><b>${esc(pairDisplay(x))}</b>${pairTimeDisplay(x)?`<div class="small">${esc(pairTimeDisplay(x))}</div>`:""}</td><td>${esc(x.group)}</td><td>${esc(x.discipline||"—")}${x.disciplineId?"":` <span class="badge warn">ІНША</span>`}</td><td>${esc(x.type||"—")}</td><td>${fmtHours(x.workloadHours)}</td><td><b>${esc(x.room||"—")}</b></td><td>${esc(x.teacher||"—")}</td><td class="actions"><button onclick="openLessonModal(${x.id})">Редагувати</button><button onclick="deleteLesson(${x.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Занять поки немає.</div>`;
}
function conflictsFor(item,ignore=null,extra=[]){
  const sameSlot=x=>x.date===item.date&&(item.pairId&&x.pairId?String(item.pairId)===String(x.pairId):timeOverlap(item.start,item.end,x.start,x.end));
  const lessonConflicts=db.schedule.concat(extra||[]).filter(x=>x.id!==ignore&&sameSlot(x)).filter(x=>(item.room&&x.room===item.room)||(item.group&&normIdentity(x.group)===normIdentity(item.group))||(item.teacherId&&Number(resolvedScheduleTeacherId(x,db))===Number(item.teacherId)));
  const bookingConflicts=db.roomBookings.filter(x=>sameSlot(x)).filter(x=>(item.room&&x.room===item.room)||(item.group&&x.group&&normIdentity(x.group)===normIdentity(item.group))||(item.teacherId&&x.teacherId&&Number(x.teacherId)===Number(item.teacherId))).map(x=>({...x,discipline:x.title||x.kind||"Бронювання"}));
  return [...lessonConflicts,...bookingConflicts];
}
function teacherAvailabilityInfo(item,ignoreId=null){
  const warnings=[],notes=[];const t=teacherById(item.teacherId);
  if(!t||t.scope==="external"||!item.date)return{warnings,notes};
  if(t.employmentStart&&item.date<t.employmentStart)warnings.push(`Дата заняття раніше дати початку роботи викладача (${formatDate(t.employmentStart)}).`);
  if(t.employmentEnd&&item.date>t.employmentEnd)warnings.push(`Дата заняття пізніше дати завершення роботи / контракту (${formatDate(t.employmentEnd)}).`);
  if(item.start&&item.end){
    (t.unavailableRules||[]).filter(r=>ruleApplies(r,item.date)&&ruleTimeMatches(r,item.start,item.end)).forEach(()=>warnings.push("Викладач позначив цю пару як недоступну."));
    const applicablePref=(t.preferredRules||[]).filter(r=>ruleApplies(r,item.date));
    if(applicablePref.length){const ok=applicablePref.some(r=>ruleTimeMatches(r,item.start,item.end));notes.push(ok?"Пара входить до бажаного інтервалу викладача.":"На цю дату є бажані інтервали викладача, але вибрана пара до них не входить.");}
  }
  const dayLessons=db.schedule.filter(x=>x.id!==ignoreId&&Number(x.teacherId)===Number(t.id)&&x.date===item.date);
  if(t.maxPerDay&&dayLessons.length+1>Number(t.maxPerDay))warnings.push(`Перевищено максимум занять викладача на день: ${t.maxPerDay}.`);
  return{warnings,notes};
}
function disciplineOptionsForGroup(group,selectedId=null,includeCustom=true){
  const rows=db.disciplines.filter(d=>d.status!=="archived"&&normIdentity(d.group)===normIdentity(group)).sort((a,b)=>(a.semester||0)-(b.semester||0)||a.name.localeCompare(b.name));
  return `<option value="">—</option>${rows.map(d=>`<option value="${d.id}" ${Number(d.id)===Number(selectedId)?"selected":""}>${esc(d.name)} · ${d.semester} сем.</option>`).join("")}${includeCustom?`<option value="__custom__">Інша / загальноосвітня…</option>`:""}`;
}
function populateLessonFormFromLoad(state={}){
  const did=$("#ldi").value;$("#ldiCustom").style.display=did==="__custom__"?"":"none";
  const d=did&&did!=="__custom__"?disciplineById(Number(did)):null;
  if(!d){
    $("#lt").innerHTML=db.lessonTypes.map(v=>`<option ${v.name===state.type?"selected":""}>${esc(v.name)}</option>`).join("");
    $("#ltea").innerHTML=`<option value="">—</option>${activeTeacherOptions(state.teacherId)}`;$("#ltea").disabled=false;renderLoadHint();return;
  }
  const types=schedulableTypes(d);$("#lt").innerHTML=types.map(v=>`<option ${v.name===state.type?"selected":""}>${esc(v.name)}</option>`).join("");
  if(state.type&&types.some(v=>v.name===state.type))$("#lt").value=state.type;refreshTeachersAndLoad(state.teacherId||null);
}
function refreshTeachersAndLoad(preferredTeacherId=null){
  const did=$("#ldi").value,d=did&&did!=="__custom__"?disciplineById(Number(did)):null,type=$("#lt").value;
  if(!d){$("#ltea").innerHTML=`<option value="">—</option>${activeTeacherOptions(preferredTeacherId)}`;$("#ltea").disabled=false;renderLoadHint();return;}
  const teachers=allocatedTeachersForType(d,type);$("#ltea").innerHTML=`<option value="">—</option>${teachers.map(t=>`<option value="${t.id}" ${Number(t.id)===Number(preferredTeacherId)?"selected":""}>${esc(teacherDisplay(t))}</option>`).join("")}`;
  if(preferredTeacherId&&teachers.some(t=>Number(t.id)===Number(preferredTeacherId)))$("#ltea").value=preferredTeacherId;else if(teachers.length===1)$("#ltea").value=teachers[0].id;
  $("#ltea").disabled=teachers.length===1;const lt=lessonTypeByName(type),tid=$("#ltea").value?Number($("#ltea").value):null;
  if(tid){const rem=remainingLoad(d,tid,type,currentEditingLessonId);$("#lwh").value=Math.max(0,Math.min(num(lt?.defaultUnit||1),rem||num(lt?.defaultUnit||1)));}renderLoadHint();
}
let currentEditingLessonId=null;
function renderLoadHint(){
  const box=$("#loadHint");if(!box)return;const did=$("#ldi").value,d=did&&did!=="__custom__"?disciplineById(Number(did)):null;
  if(!d){box.innerHTML=`<div class="notice">Зовнішня / загальноосвітня дисципліна. Вона не списує кафедральне навантаження.</div>`;return;}
  const type=$("#lt").value,tid=$("#ltea").value?Number($("#ltea").value):null,teachers=allocatedTeachersForType(d,type);
  if(!teachers.length){box.innerHTML=`<div class="conflict">Для виду «${esc(type)}» ще не розподілено викладача.</div>`;return;}
  if(!tid){box.innerHTML=`<div class="notice">Оберіть викладача.</div>`;return;}
  const plan=teacherTypePlan(d,tid,type),used=scheduledLoad(d.id,tid,type,currentEditingLessonId),rem=plan-used;
  box.innerHTML=`<div class="load-hint-grid"><div><span>План</span><b>${fmtHours(plan)} год</b></div><div><span>Виставлено</span><b>${fmtHours(used)} год</b></div><div><span>Залишок</span><b>${fmtHours(rem)} год</b></div></div>`;
}
function lessonItemFromValues({date,pairId,start,end,group,disciplineId,discipline,type,workloadHours,coverage,students,teacherId,room,note,repeatBatchId=null}){
  const d=disciplineId?disciplineById(Number(disciplineId)):null;
  const t=teacherById(teacherId),pair=pairById(pairId);
  return {date,pairId:pairId&&pairId!=="__custom__"?Number(pairId):null,start:pair?.start||start||"",end:pair?.end||end||"",group:d?.group||group,disciplineId:d?Number(d.id):(disciplineId?Number(disciplineId):null),discipline:d?.name||discipline,type,workloadHours:num(workloadHours),coverage,students:students||"",teacherId:teacherId?Number(teacherId):null,teacher:t?teacherDisplay(t):"",room:room||"",note:note||"",repeatBatchId};
}
function openLessonModal(id=null,preset={}){
  currentEditingLessonId=id;const existing=id?db.schedule.find(s=>s.id===id):null;
  const today=clampDate(localTodayISO()),firstPair=bellPairs()[0];
  const x=existing||{date:clampDate(preset.date||today),pairId:preset.pairId||firstPair?.id||null,start:firstPair?.start||"",end:firstPair?.end||"",group:preset.group||(currentPage==="schedule"?bestWorkloadGroup():db.groups[0]?.code)||"",disciplineId:preset.disciplineId||null,discipline:"",type:preset.type||"",workloadHours:2,coverage:"Вся група",students:"",teacherId:preset.teacherId||null,teacher:"",room:"",note:""};
  const matchedPair=x.pairId||pairIdForTimes(x.start,x.end),pairSelected=matchedPair||"__custom__";
  openModal(`<h2>${id?"Редагувати заняття":"Додати заняття"}</h2><form id="lf" class="form-grid">
    <label>Група<select id="lg">${groupOptions(x.group)}</select></label><label>Дисципліна<select id="ldi">${disciplineOptionsForGroup(x.group,x.disciplineId,true)}</select><input id="ldiCustom" style="display:${x.disciplineId?"none":""};margin-top:6px" placeholder="Назва дисципліни" value="${esc(!x.disciplineId?(x.discipline||""):"")}"></label>
    <label>Вид заняття<select id="lt"></select></label><label>Викладач<select id="ltea"></select></label><div id="loadHint" class="wide"></div>
    <label>Дата<input id="ld" type="date" ${dateAttrs()} value="${esc(clampDate(x.date))}" required></label><label>Пара<select id="lpair">${pairOptions(pairSelected,true)}</select></label>
    <div id="customTimeBox" class="wide form-grid" style="display:${pairSelected==="__custom__"?"grid":"none"}"><label>Початок<input id="ls" type="time" value="${esc(x.start||"")}"></label><label>Кінець<input id="le" type="time" value="${esc(x.end||"")}"></label></div>
    <label>Аудиторія<select id="lr"><option value="">—</option>${db.rooms.filter(r=>r.status!=="archived").map(r=>`<option ${r.name===x.room?"selected":""}>${esc(r.name)}</option>`).join("")}</select></label><label>Годин у навантаження<input id="lwh" type="number" min="0.01" step="0.01" value="${esc(x.workloadHours||2)}"></label>
    <label>Охоплення<select id="lc">${db.coverageTypes.map(v=>`<option ${v===x.coverage?"selected":""}>${esc(v)}</option>`).join("")}</select></label><label>Студент(и) / підгрупа<input id="lst" value="${esc(x.students||"")}"></label>
    <label class="wide">Примітка<input id="ln" value="${esc(x.note||"")}"></label><div id="conflictBox" class="wide"></div><div class="wide"><button class="primary">${id?"Зберегти":"Додати"}</button></div>
  </form>`,true);
  populateLessonFormFromLoad({type:x.type,teacherId:x.teacherId});
  if(x.disciplineId)$("#ldi").value=x.disciplineId;else if(x.discipline)$("#ldi").value="__custom__";
  if(!x.disciplineId&&x.discipline)$("#ldiCustom").value=x.discipline;
  const applyLessonDateBounds=()=>{const did=$("#ldi").value,d=did&&did!=="__custom__"?disciplineById(Number(did)):null,b=d?semesterDateBounds(d.semester):academicYearBounds(),input=$("#ld");input.min=b.start;input.max=b.end;if(!dateInBounds(input.value,b))input.value=clampDate(input.value,b);};
  applyLessonDateBounds();
  const readLesson=()=>{const did=$("#ldi").value,disciplineId=did&&did!=="__custom__"?Number(did):null,d=disciplineById(disciplineId),tid=$("#ltea").value?Number($("#ltea").value):null,pv=$("#lpair").value;return lessonItemFromValues({date:$("#ld").value,pairId:pv,start:$("#ls")?.value,end:$("#le")?.value,group:$("#lg").value,disciplineId,discipline:did==="__custom__"?$("#ldiCustom").value.trim():(d?.name||""),type:$("#lt").value,workloadHours:$("#lwh").value,coverage:$("#lc").value,students:$("#lst").value.trim(),teacherId:tid,room:$("#lr").value,note:$("#ln").value.trim()});};
  const check=()=>{const item=readLesson(),cs=conflictsFor(item,id),info=teacherAvailabilityInfo(item,id);let html="";if(cs.length)html+=`<div class="conflict"><b>Конфлікт:</b> ${cs.map(c=>`${esc(c.group)} · ${esc(pairDisplay(c))} · ${esc(c.room||"без ауд.")}`).join("; ")}</div>`;if(info.warnings.length)html+=`<div class="conflict">${info.warnings.map(esc).join("<br>")}</div>`;if(info.notes.length)html+=`<div class="notice">${info.notes.map(esc).join("<br>")}</div>`;$("#conflictBox").innerHTML=html;};
  $("#lg").onchange=()=>{$("#ldi").innerHTML=disciplineOptionsForGroup($("#lg").value,null,true);populateLessonFormFromLoad({});check();};$("#ldi").onchange=()=>{populateLessonFormFromLoad({});applyLessonDateBounds();check();};$("#lt").onchange=()=>{refreshTeachersAndLoad(null);check();};$("#ltea").onchange=()=>{renderLoadHint();check();};
  $("#lpair").onchange=()=>{$("#customTimeBox").style.display=$("#lpair").value==="__custom__"?"grid":"none";check();};["ld","lr","lwh"].forEach(k=>$("#"+k).onchange=check);check();
  $("#lf").onsubmit=e=>{e.preventDefault();const item=readLesson();if(!item.discipline)return alert("Вкажіть дисципліну.");const d0=item.disciplineId?disciplineById(item.disciplineId):null,b0=d0?semesterDateBounds(d0.semester):academicYearBounds();if(!dateInBounds(item.date,b0))return alert(`Дата має бути в межах ${d0?`${d0.semester} семестру`:`навчального року`}: ${academicDateMessage(b0)}.`);if(!item.pairId&&(!item.start||!item.end||item.end<=item.start))return alert("Оберіть пару або коректний час.");const d=item.disciplineId?disciplineById(item.disciplineId):null;if(d){if(!item.teacherId)return alert("Потрібно вибрати викладача з розподіленого навантаження.");const rem=remainingLoad(d,item.teacherId,item.type,id);if(item.workloadHours>rem+0.0001)return alert(`Недостатньо розподілених годин. Залишок у ${teacherDisplay(teacherById(item.teacherId))}: ${fmtHours(rem)} год. Зміни розподіл у «Навантаженні» або зменш години цього заняття.`);}const cs=conflictsFor(item,id),info=teacherAvailabilityInfo(item,id);if((cs.length||info.warnings.length)&&!confirm("Є конфлікт або обмеження викладача. Все одно зберегти?"))return;if(id)Object.assign(db.schedule.find(s=>s.id===id),item);else db.schedule.push({id:uid(db.schedule),...item});currentEditingLessonId=null;closeModal();save();};
}
/* Integrated calendar planner */
let disciplinePlannerState={disciplineId:null,teacherId:null,month:null,date:null};
function schedulerMonthBounds(month){const [y,m]=month.split("-").map(Number),last=String(new Date(y,m,0,12,0,0).getDate()).padStart(2,"0");return {start:`${y}-${String(m).padStart(2,"0")}-01`,end:`${y}-${String(m).padStart(2,"0")}-${last}`};}
function schedulerMonthsForDiscipline(d){const b=semesterDateBounds(d.semester);return academicMonthTabs().filter(m=>{const mb=schedulerMonthBounds(m.value);return mb.end>=b.start&&mb.start<=b.end;});}
function schedulerCurrentMonth(d){return clampDate(currentAcademicDate(),semesterDateBounds(d.semester)).slice(0,7);}
function schedulerDateForMonth(d,month,preferred=null){const b=semesterDateBounds(d.semester),mb=schedulerMonthBounds(month);if(preferred&&preferred.slice(0,7)===month&&dateInBounds(preferred,b))return preferred;const today=currentAcademicDate();if(today.slice(0,7)===month&&dateInBounds(today,b))return today;return mb.start<b.start?b.start:mb.start;}
function plannerTypes(d,teacherId){return schedulableTypes(d).map(lt=>{const planned=teacherTypePlan(d,teacherId,lt.name);if(planned<=0)return null;const scheduled=scheduledLoad(d.id,teacherId,lt.name);return {lt,planned,scheduled,remaining:Math.max(0,planned-scheduled)};}).filter(Boolean);}
function plannerDefaultUnit(typeName,remaining){const lt=lessonTypeByName(typeName),unit=isAuditoriumPairType(lt)?2:num(lt?.defaultUnit||1);return Math.max(0,Math.min(unit,remaining));}
function plannerScheduleForDate(date){return db.schedule.filter(x=>x.date===date);}
function plannerTeacherEvents(date,teacherId){return plannerScheduleForDate(date).filter(x=>Number(resolvedScheduleTeacherId(x,db))===Number(teacherId));}
function plannerGroupEvents(date,group){return plannerScheduleForDate(date).filter(x=>normIdentity(resolvedScheduleGroup(x,db))===normIdentity(group));}
function plannerOwnEvents(date,d,teacherId){return plannerScheduleForDate(date).filter(x=>Number(x.disciplineId)===Number(d.id)&&Number(resolvedScheduleTeacherId(x,db))===Number(teacherId));}
function plannerEventPair(x){return x.pairId?`${x.pairId} пара`:(x.start||x.end?`${x.start||""}${x.start&&x.end?"–":""}${x.end||""}`:"без №");}
function plannerMonthOwnCount(month,d,t){return db.schedule.filter(x=>String(x.date||"").slice(0,7)===month&&Number(x.disciplineId)===Number(d.id)&&Number(resolvedScheduleTeacherId(x,db))===Number(t.id)).length;}
function plannerMonthTabsHtml(d,t){return `<div class="scheduler-month-tabs">${schedulerMonthsForDiscipline(d).map(m=>{const c=plannerMonthOwnCount(m.value,d,t);return `<button class="${m.value===disciplinePlannerState.month?"active":""}" onclick="setDisciplinePlannerMonth('${m.value}')"><span>${esc(m.label)}</span>${c?`<b>${c}</b>`:""}</button>`;}).join("")}</div>`;}
function plannerCalendarDayHtml(date,d,t){const inMonth=date.slice(0,7)===disciplinePlannerState.month,b=semesterDateBounds(d.semester),allowed=inMonth&&dateInBounds(date,b),own=allowed?plannerOwnEvents(date,d,t.id):[],te=allowed?plannerTeacherEvents(date,t.id):[],ge=allowed?plannerGroupEvents(date,d.group):[],day=Number(date.slice(8,10)),selected=date===disciplinePlannerState.date,today=date===localTodayISO();const otherT=te.filter(x=>!own.includes(x)),otherG=ge.filter(x=>!own.includes(x)&&!otherT.includes(x));return `<button type="button" class="scheduler-day ${inMonth?"":"outside-month"} ${allowed?"":"disabled"} ${selected?"selected":""} ${today?"today":""}" ${allowed?`onclick="selectDisciplinePlannerDate('${date}')"`:"disabled"}><div class="scheduler-day-head"><b>${day}</b>${today?`<span>сьогодні</span>`:""}</div><div class="scheduler-day-body">${own.slice(0,3).map(x=>`<div class="scheduler-own-event"><b>${esc(plannerEventPair(x))}</b><span>${esc(x.type||"")}</span><small>${esc(x.room||"без ауд.")}</small></div>`).join("")}${own.length>3?`<div class="scheduler-more">+${own.length-3} своїх</div>`:""}${otherT.length?`<div class="scheduler-busy teacher">Викладач зайнятий: ${otherT.length}</div>`:""}${otherG.length?`<div class="scheduler-busy group">Група зайнята: ${otherG.length}</div>`:""}</div></button>`;}
function plannerOccupancyCell(x,mode){if(!x)return `<span class="planner-free">вільно</span>`;const counterpart=mode==="teacher"?(x.group||"—"):(x.teacher||"—");return `<div class="planner-occupied"><b>${esc(counterpart)}</b><span>${esc(x.discipline||x.type||"Заняття")}</span><small>${esc(x.room?`ауд. ${x.room}`:"без ауд.")}</small></div>`;}
function plannerDayOccupancyHtml(d,t,date){const te=plannerTeacherEvents(date,t.id),ge=plannerGroupEvents(date,d.group);return `<div class="planner-occupancy"><h4>Що вже є ${formatDate(date)}</h4><div class="table-wrap"><table><thead><tr><th>Пара</th><th>${esc(teacherDisplay(t))}</th><th>${esc(d.group)}</th></tr></thead><tbody>${bellPairs().map(p=>{const a=te.find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(p.id)),g=ge.find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(p.id));return `<tr><td><b>${esc(p.id)} пара</b><div class="small">${esc(p.start)}–${esc(p.end)}</div></td><td>${plannerOccupancyCell(a,"teacher")}</td><td>${plannerOccupancyCell(g,"group")}</td></tr>`;}).join("")}</tbody></table></div></div>`;}
function plannerPairBusyInfo(date,pairId,d,t){const teacher=plannerTeacherEvents(date,t.id).find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId)),group=plannerGroupEvents(date,d.group).find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId));return {teacher,group};}
function plannerPairOptions(date,d,t,selected=null){return bellPairs().map(p=>{const b=plannerPairBusyInfo(date,p.id,d,t),why=[b.teacher?"викладач зайнятий":"",b.group?"група зайнята":""].filter(Boolean).join(", ");return `<option value="${esc(p.id)}" ${String(selected)===String(p.id)?"selected":""} ${why?"disabled":""}>${esc(p.id)} пара · ${esc(p.start)}–${esc(p.end)}${why?` · ${esc(why)}`:""}</option>`;}).join("");}
function plannerRoomBusy(date,pairId,room){return db.schedule.some(x=>x.date===date&&x.room===room&&String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId))||db.roomBookings.some(x=>x.date===date&&x.room===room&&String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId));}
function plannerRoomOptions(date,pairId,selected=""){const rooms=(typeof gridRooms==="function"?gridRooms():db.rooms.filter(r=>r.status!=="archived"));return `<option value="">— обери аудиторію —</option>`+rooms.map(r=>{const busy=plannerRoomBusy(date,pairId,r.name);return `<option value="${esc(r.name)}" ${r.name===selected?"selected":""} ${busy&&r.name!==selected?"disabled":""}>${esc(r.name)}${busy?" · зайнята":""}</option>`;}).join("");}
function plannerAvailableTypeOptions(d,t,selected=null){return plannerTypes(d,t.id).map(x=>`<option value="${esc(x.lt.name)}" ${x.lt.name===selected?"selected":""} ${x.remaining<=0?"disabled":""}>${esc(x.lt.name)} · залишок ${fmtHours(x.remaining)} год</option>`).join("");}
function plannerNextFreePair(date,d,t){return bellPairs().find(p=>{const b=plannerPairBusyInfo(date,p.id,d,t);return !b.teacher&&!b.group;})?.id||bellPairs()[0]?.id||null;}
function plannerNewRowHtml(d,t,index,typeName=null,pairId=null){const types=plannerTypes(d,t.id).filter(x=>x.remaining>0),selectedType=typeName||(types[0]?.lt.name||""),rem=types.find(x=>x.lt.name===selectedType)?.remaining||0,selectedPair=pairId||plannerNextFreePair(disciplinePlannerState.date,d,t),hours=plannerDefaultUnit(selectedType,rem);return `<div class="planner-entry-row" data-planner-entry><div class="planner-entry-number">${index+1}</div><label>Вид заняття<select data-planner-type>${plannerAvailableTypeOptions(d,t,selectedType)}</select></label><label>Пара<select data-planner-pair>${plannerPairOptions(disciplinePlannerState.date,d,t,selectedPair)}</select></label><label>Аудиторія<select data-planner-room>${plannerRoomOptions(disciplinePlannerState.date,selectedPair)}</select></label><div class="planner-entry-hours"><span>Списується</span><b data-planner-hours>${fmtHours(hours)} год</b></div><button type="button" class="danger small-btn" data-planner-remove>×</button></div>`;}
function bindPlannerEntryRow(row,d,t){const type=row.querySelector("[data-planner-type]"),pair=row.querySelector("[data-planner-pair]"),room=row.querySelector("[data-planner-room]"),hours=row.querySelector("[data-planner-hours]");const refreshHours=()=>{const stat=plannerTypes(d,t.id).find(x=>x.lt.name===type.value);hours.textContent=`${fmtHours(plannerDefaultUnit(type.value,stat?.remaining||0))} год`;};const refreshRoom=()=>{const old=room.value;room.innerHTML=plannerRoomOptions(disciplinePlannerState.date,pair.value,old);};type.onchange=refreshHours;pair.onchange=refreshRoom;row.querySelector("[data-planner-remove]").onclick=()=>{row.remove();renumberPlannerEntries();};refreshHours();refreshRoom();}
function renumberPlannerEntries(){$$("[data-planner-entry]").forEach((r,i)=>{const n=r.querySelector(".planner-entry-number");if(n)n.textContent=i+1;});}
function addPlannerEntry(){const d=disciplineById(disciplinePlannerState.disciplineId),t=teacherById(disciplinePlannerState.teacherId);if(!d||!t)return;const box=$("#plannerEntries"),i=$$("[data-planner-entry]").length;box.insertAdjacentHTML("beforeend",plannerNewRowHtml(d,t,i));bindPlannerEntryRow(box.lastElementChild,d,t);}
function plannerTypeSummaryHtml(d,t){return `<div class="planner-load-summary">${plannerTypes(d,t.id).map(x=>`<div class="planner-load-card"><span>${esc(x.lt.name)}</span><b>${fmtHours(x.remaining)} год</b><small>${fmtHours(x.scheduled)} виставлено з ${fmtHours(x.planned)}</small></div>`).join("")}</div>`;}
function renderDisciplinePlannerModal(){const d=disciplineById(disciplinePlannerState.disciplineId),t=teacherById(disciplinePlannerState.teacherId);if(!d||!t)return;const b=semesterDateBounds(d.semester),months=schedulerMonthsForDiscipline(d);if(!disciplinePlannerState.month||!months.some(x=>x.value===disciplinePlannerState.month))disciplinePlannerState.month=schedulerCurrentMonth(d);if(!disciplinePlannerState.date||disciplinePlannerState.date.slice(0,7)!==disciplinePlannerState.month||!dateInBounds(disciplinePlannerState.date,b))disciplinePlannerState.date=schedulerDateForMonth(d,disciplinePlannerState.month,disciplinePlannerState.date);const days=calendarMonthDays(disciplinePlannerState.month),weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Нд"],totalRemaining=plannerTypes(d,t.id).reduce((a,x)=>a+x.remaining,0);openModal(`<div class="discipline-planner"><div class="allocation-scheduler-head"><div><h2>Розставити навантаження</h2><h3>${esc(d.name)}</h3><div class="small"><b>${esc(teacherDisplay(t))}</b> · ${esc(d.group)} · ${d.semester} семестр</div></div><span class="badge ${totalRemaining>0?"warn":"ok"}">${totalRemaining>0?`Залишок ${fmtHours(totalRemaining)} год`:"Навантаження розставлено"}</span></div>${plannerTypeSummaryHtml(d,t)}${plannerMonthTabsHtml(d,t)}<div class="scheduler-calendar-wrap"><div class="scheduler-weekdays">${weekdays.map(x=>`<div>${x}</div>`).join("")}</div><div class="scheduler-calendar">${days.map(date=>plannerCalendarDayHtml(date,d,t)).join("")}</div></div><div class="scheduler-selected-date"><div class="scheduler-selected-title"><div><span>Вибрана дата</span><h3>${formatDate(disciplinePlannerState.date)} · ${esc(weekdayNameForDate(disciplinePlannerState.date))}</h3></div><span class="small">Натисни інший день у календарі, щоб перейти на нього.</span></div>${plannerDayOccupancyHtml(d,t,disciplinePlannerState.date)}${totalRemaining>0?`<div class="planner-add-section"><div class="section-head"><div><h4>Додати заняття цього дня</h4><div class="small">Можна поставити кілька пар різних видів за один раз.</div></div><button type="button" class="secondary" id="plannerAddEntry">+ Ще одна пара</button></div><form id="plannerDateForm"><div id="plannerEntries">${plannerNewRowHtml(d,t,0)}</div><div class="planner-extra"><label>Охоплення<select id="plannerCoverage">${db.coverageTypes.map(v=>`<option>${esc(v)}</option>`).join("")}</select></label><label>Примітка<input id="plannerNote" placeholder="необов’язково"></label></div><div id="plannerConflictMessage"></div><div class="planner-save-row"><button class="primary">Зберегти заняття на ${formatDate(disciplinePlannerState.date)}</button></div></form></div>`:`<div class="notice"><b>Усі розподілені аудиторні години цього викладача за цією дисципліною вже стоять у розкладі.</b></div>`}</div></div>`,true);if(totalRemaining>0){$$("[data-planner-entry]").forEach(r=>bindPlannerEntryRow(r,d,t));$("#plannerAddEntry").onclick=addPlannerEntry;$("#plannerDateForm").onsubmit=e=>savePlannerDateEntries(e,d,t);}}
function openDisciplineTeacherScheduler(disciplineId,teacherId,state={}){const d=disciplineById(disciplineId),t=teacherById(teacherId);if(!d||!t)return;disciplinePlannerState={disciplineId:Number(disciplineId),teacherId:Number(teacherId),month:state.month||schedulerCurrentMonth(d),date:state.date||null};disciplinePlannerState.date=schedulerDateForMonth(d,disciplinePlannerState.month,state.date||null);renderDisciplinePlannerModal();}
function setDisciplinePlannerMonth(month){const d=disciplineById(disciplinePlannerState.disciplineId);if(!d||!schedulerMonthsForDiscipline(d).some(x=>x.value===month))return;disciplinePlannerState.month=month;disciplinePlannerState.date=schedulerDateForMonth(d,month,null);renderDisciplinePlannerModal();}
function selectDisciplinePlannerDate(date){const d=disciplineById(disciplinePlannerState.disciplineId);if(!d||!dateInBounds(date,semesterDateBounds(d.semester)))return;disciplinePlannerState.date=date;disciplinePlannerState.month=date.slice(0,7);renderDisciplinePlannerModal();}
function savePlannerDateEntries(e,d,t){e.preventDefault();const rows=$$("[data-planner-entry]");if(!rows.length)return alert("Додай хоча б одну пару.");const date=disciplinePlannerState.date,byType={},draft=[],problems=[];rows.forEach((row,i)=>{const type=row.querySelector("[data-planner-type]").value,pairId=row.querySelector("[data-planner-pair]").value,room=row.querySelector("[data-planner-room]").value;if(!type||!pairId||!room){problems.push(`Рядок ${i+1}: обери вид, пару й аудиторію.`);return;}const stat=plannerTypes(d,t.id).find(x=>x.lt.name===type),used=byType[type]||0,available=Math.max(0,(stat?.remaining||0)-used),hours=plannerDefaultUnit(type,available);if(hours<=0){problems.push(`${type}: години вже вичерпані.`);return;}byType[type]=used+hours;const item=lessonItemFromValues({date,pairId,group:d.group,disciplineId:d.id,discipline:d.name,type,workloadHours:hours,coverage:$("#plannerCoverage").value,teacherId:t.id,room,note:$("#plannerNote").value.trim(),repeatBatchId:`P${Date.now()}`}),cs=conflictsFor(item,null,draft),info=teacherAvailabilityInfo(item,null);if(cs.length){problems.push(`${pairDisplay(item)} · ${type}: конфлікт.`);return;}if(info.warnings.length){problems.push(`${pairDisplay(item)} · ${type}: ${info.warnings.join(" ")}`);return;}draft.push(item);});if(problems.length){$("#plannerConflictMessage").innerHTML=`<div class="conflict"><b>Не можу зберегти:</b><br>${problems.map(esc).join("<br>")}</div>`;return;}draft.forEach(item=>db.schedule.push({id:uid(db.schedule),...item}));const keep={month:disciplinePlannerState.month,date:disciplinePlannerState.date};save();openDisciplineTeacherScheduler(d.id,t.id,keep);}
function openAllocationScheduler(disciplineId,typeName,teacherId){openDisciplineTeacherScheduler(disciplineId,teacherId);}
function addDays(dateStr,days){const d=new Date(dateStr+"T12:00:00");d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
function datesForPattern(pattern,from,to,weekday,specific,bounds=academicYearBounds()){if(pattern==="dates")return [...new Set((specific||"").split(/[\s,;]+/).map(x=>x.trim()).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&dateInBounds(x,bounds)))].sort();const result=[];if(!from||!to)return result;let d=from;while(d<=to){if(dateInBounds(d,bounds)&&weekdayId(d)===Number(weekday))result.push(d);d=addDays(d,1);}return pattern==="biweekly"?result.filter((_,i)=>i%2===0):result;}
function openBulkScheduleModal(presetGroup=null){
  const group=presetGroup||bestWorkloadGroup();openModal(`<h2>Розставити за правилом</h2><div class="notice">Для випадків, коли одна й та сама пара повторюється щотижня або через тиждень.</div><form id="bf" class="form-grid"><label>Група<select id="bg">${groupOptions(group)}</select></label><label>Дисципліна<select id="bd">${disciplineOptionsForGroup(group,null,false)}</select></label><label>Вид заняття<select id="bt"></select></label><label>Викладач<select id="btea"></select></label><div id="bulkLoadHint" class="wide"></div><label>Повторення<select id="bpattern"><option value="weekly">Щотижня</option><option value="biweekly">Через тиждень</option><option value="dates">Конкретні дати</option></select></label><label>День тижня<select id="bweekday">${db.weekDays.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join("")}</select></label><label>Від<input id="bfrom" type="date" ${dateAttrs()}></label><label>До<input id="bto" type="date" ${dateAttrs()}></label><label id="bdatesLabel" class="wide" style="display:none">Конкретні дати<textarea id="bdates" rows="3" placeholder="2026-09-03, 2026-09-10, 2026-09-24"></textarea></label><label>Пара<select id="bpair">${pairOptions(bellPairs()[0]?.id||null,false)}</select></label><label>Аудиторія<select id="br"><option value="">—</option>${db.rooms.filter(r=>r.status!=="archived").map(r=>`<option>${esc(r.name)}</option>`).join("")}</select></label><label>Годин за заняття<input id="bwh" type="number" min="0.01" step="0.01" value="2"></label><label>Охоплення<select id="bc">${db.coverageTypes.map(v=>`<option>${esc(v)}</option>`).join("")}</select></label><label class="wide">Примітка<input id="bn"></label><div class="wide"><button class="primary">Створити повтори</button></div></form>`,true);
  const refreshDisc=()=>{$("#bd").innerHTML=disciplineOptionsForGroup($("#bg").value,null,false);refreshType();};const refreshType=()=>{const d=disciplineById(Number($("#bd").value)),types=d?schedulableTypes(d):[];$("#bt").innerHTML=types.map(x=>`<option>${esc(x.name)}</option>`).join("");const b=d?semesterDateBounds(d.semester):academicYearBounds();["#bfrom","#bto"].forEach(id=>{const el=$(id);el.min=b.start;el.max=b.end;if(el.value&&!dateInBounds(el.value,b))el.value="";});refreshTeacher();};const refreshTeacher=()=>{const d=disciplineById(Number($("#bd").value)),type=$("#bt").value,teachers=d?allocatedTeachersForType(d,type):[];$("#btea").innerHTML=teachers.map(t=>`<option value="${t.id}">${esc(teacherDisplay(t))}</option>`).join("");const lt=lessonTypeByName(type);$("#bwh").value=lt?.defaultUnit||1;bulkHint();};const bulkHint=()=>{const d=disciplineById(Number($("#bd").value)),tid=Number($("#btea").value),type=$("#bt").value;if(!d||!tid){$("#bulkLoadHint").innerHTML=`<div class="conflict">Спочатку має бути розподілене навантаження.</div>`;return;}const p=teacherTypePlan(d,tid,type),used=scheduledLoad(d.id,tid,type),r=p-used;$("#bulkLoadHint").innerHTML=`<div class="load-hint-grid"><div><span>План</span><b>${fmtHours(p)} год</b></div><div><span>Виставлено</span><b>${fmtHours(used)} год</b></div><div><span>Залишок</span><b>${fmtHours(r)} год</b></div></div>`;};
  $("#bg").onchange=refreshDisc;$("#bd").onchange=refreshType;$("#bt").onchange=refreshTeacher;$("#btea").onchange=bulkHint;$("#bpattern").onchange=()=>{const dates=$("#bpattern").value==="dates";$("#bdatesLabel").style.display=dates?"":"none";$("#bweekday").disabled=dates;$("#bfrom").disabled=dates;$("#bto").disabled=dates;};refreshDisc();
  $("#bf").onsubmit=e=>{e.preventDefault();const d=disciplineById(Number($("#bd").value)),tid=Number($("#btea").value),type=$("#bt").value;if(!d||!tid)return alert("Немає розподіленого навантаження.");let rem=remainingLoad(d,tid,type,null);if(rem<=0)return alert("Години вже вичерпані.");const bounds=semesterDateBounds(d.semester),dates=datesForPattern($("#bpattern").value,$("#bfrom").value,$("#bto").value,$("#bweekday").value,$("#bdates").value,bounds);if(!dates.length)return alert("Не знайдено дат.");const unit=num($("#bwh").value),valid=[],blocked=[],batchId=`B${Date.now()}`;for(const date of dates){if(rem<=0.0001)break;const wh=Math.min(unit,rem),item=lessonItemFromValues({date,pairId:$("#bpair").value,group:$("#bg").value,disciplineId:d.id,discipline:d.name,type,workloadHours:wh,coverage:$("#bc").value,teacherId:tid,room:$("#br").value,note:$("#bn").value.trim(),repeatBatchId:batchId}),cs=conflictsFor(item,null,valid),info=teacherAvailabilityInfo(item,null);if(cs.length||info.warnings.length){blocked.push(date);continue;}valid.push(item);rem-=wh;}if(!valid.length)return alert("Усі дати мають конфлікти.");if(blocked.length&&!confirm(`${blocked.length} дат буде пропущено через конфлікти. Продовжити?`))return;valid.forEach(item=>db.schedule.push({id:uid(db.schedule),...item}));closeModal();save();go("schedule");};
}
function deleteLesson(id){if(confirm("Видалити заняття? Години автоматично повернуться у залишок навантаження.")){db.schedule=db.schedule.filter(x=>x.id!==id);save();}}

/* Group timetable calendar — monthly, fed by the same db.schedule as scheduling and teacher calendars */
let timetableState={group:rememberedTimetableGroup()||null,month:null};
function normGroup(v){return normIdentity(v);}
function scheduleLessonsForGroup(group){
  const key=normGroup(group);
  return db.schedule.filter(x=>normGroup(resolvedScheduleGroup(x,db))===key&&dateInBounds(x.date));
}
function timetableBookingsForGroup(group){
  const key=normGroup(group);
  return db.roomBookings.filter(x=>x.showInTimetable&&normGroup(x.group)===key&&dateInBounds(x.date));
}
function timetableDatesForGroup(group){
  return [...new Set([...scheduleLessonsForGroup(group).map(x=>x.date),...timetableBookingsForGroup(group).map(x=>x.date)].filter(Boolean))].sort();
}
function bestTimetableGroup(){
  const remembered=rememberedTimetableGroup();
  if(remembered&&db.groups.some(g=>normGroup(g.code)===normGroup(remembered)))return remembered;
  const candidates=db.groups.map(g=>({code:g.code,count:scheduleLessonsForGroup(g.code).length})).sort((a,b)=>b.count-a.count);
  return candidates[0]?.code||db.groups[0]?.code||"";
}
function groupCurrentMonth(){return clampAcademicMonth(currentAcademicDate().slice(0,7));}
function groupMonthEventCount(group,month){
  return [...scheduleLessonsForGroup(group),...timetableBookingsForGroup(group)].filter(x=>String(x.date||"").slice(0,7)===month).length;
}
function groupMonthTabsHtml(group){
  return `<div class="teacher-month-tabs group-month-tabs">${academicMonthTabs().map(m=>{const count=groupMonthEventCount(group,m.value);return `<button class="${m.value===timetableState.month?"active":""}" onclick="setGroupTimetableMonth('${m.value}')"><span>${esc(m.label)}</span>${count?`<b>${count}</b>`:""}</button>`;}).join("")}</div>`;
}
function groupEventsForDate(group,date){
  const lessons=scheduleLessonsForGroup(group).filter(x=>x.date===date).map(x=>({source:"schedule",data:x}));
  const bookings=timetableBookingsForGroup(group).filter(x=>x.date===date).map(x=>({source:"booking",data:x}));
  return [...lessons,...bookings].sort((a,b)=>{const ap=Number(a.data.pairId),bp=Number(b.data.pairId);if(Number.isFinite(ap)&&Number.isFinite(bp)&&ap!==bp)return ap-bp;return String(a.data.start||"99:99").localeCompare(String(b.data.start||"99:99"));});
}
function groupMonthEventCard(ev){
  const x=ev.data,pair=x.pairId?`${x.pairId} пара`:(x.start||x.end?`${x.start||""}${x.start&&x.end?"–":""}${x.end||""}`:"без № пари");
  if(ev.source==="schedule")return `<button class="group-month-event" onclick="openLessonModal(${x.id})"><div class="teacher-month-event-top"><b>${esc(pair)}</b><strong>${x.room?`ауд. ${esc(x.room)}`:"—"}</strong></div><span class="group-month-discipline">${esc(x.discipline||"Заняття")}</span><span class="group-month-teacher">${esc(x.teacher||"—")}</span>${x.type?`<small>${esc(x.type)}</small>`:""}</button>`;
  return `<button class="group-month-event booking" onclick="openRoomBookingModal(${x.id})"><div class="teacher-month-event-top"><b>${esc(pair)}</b><strong>${x.room?`ауд. ${esc(x.room)}`:"—"}</strong></div><span class="group-month-discipline">${esc(x.title||roomBookingLabel(x))}</span><span class="group-month-teacher">${esc(x.teacher||x.kind||"")}</span></button>`;
}
function setGroupTimetableMonth(month){if(!academicMonthTabs().some(x=>x.value===month))return;timetableState.month=month;renderTimetable();}
function shiftGroupTimetableMonth(delta){const months=academicMonthTabs(),idx=months.findIndex(x=>x.value===timetableState.month),next=months[idx+Number(delta)];if(next)setGroupTimetableMonth(next.value);}
function timetableToday(){setGroupTimetableMonth(groupCurrentMonth());}
function renderTimetable(){
  if(!timetableState.group||!db.groups.some(g=>normGroup(g.code)===normGroup(timetableState.group))){timetableState.group=bestTimetableGroup();rememberTimetableGroup(timetableState.group);}
  if(!timetableState.month||!academicMonthAllowed(timetableState.month))timetableState.month=groupCurrentMonth();
  const group=timetableState.group,month=timetableState.month,days=calendarMonthDays(month),months=academicMonthTabs(),idx=months.findIndex(x=>x.value===month),info=months[idx];
  const monthCount=groupMonthEventCount(group,month),total=scheduleLessonsForGroup(group).length;
  const weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Нд"],today=localTodayISO();
  $("#page-timetable").innerHTML=`<div class="teacher-month-page group-month-page">
    <div class="card section teacher-month-header">
      <div class="section-head"><div><h2>Розклад групи</h2><div class="small">Усі виставлені заняття беруться безпосередньо зі «Складання розкладу».</div></div></div>
      <div class="toolbar group-month-groupbar"><label>Група<select id="timetableGroup">${groupOptions(group)}</select></label><div class="ready-count"><b>${total}</b><span>занять групи у базі</span></div></div>
      ${groupMonthTabsHtml(group)}
      <div class="teacher-month-toolbar"><button class="secondary" ${idx<=0?"disabled":""} onclick="shiftGroupTimetableMonth(-1)">← Попередній</button><div class="teacher-month-title"><b>${esc(info?.label||monthLabel(month))}</b><span>${monthCount} подій у місяці · ${esc(db.academicYear)}</span></div><button class="secondary" onclick="timetableToday()">Актуальний місяць</button><button class="secondary" ${idx>=months.length-1?"disabled":""} onclick="shiftGroupTimetableMonth(1)">Наступний →</button></div>
    </div>
    <div class="card section teacher-month-calendar-card"><div class="teacher-month-weekdays">${weekdays.map(w=>`<div>${w}</div>`).join("")}</div><div class="teacher-month-calendar">${days.map(date=>{const inMonth=date.slice(0,7)===month,inAcademic=dateInBounds(date),events=inAcademic?groupEventsForDate(group,date):[],day=Number(date.slice(8,10)),isToday=date===today;return `<div class="teacher-month-day ${inMonth?"":"outside-month"} ${isToday?"today":""}"><div class="teacher-month-day-head"><b>${day}</b>${isToday?`<span>сьогодні</span>`:""}</div><div class="teacher-month-day-events">${events.length?events.map(groupMonthEventCard).join(""):(inMonth?`<div class="teacher-month-free">—</div>`:"")}</div></div>`;}).join("")}</div></div>
    <div class="notice">Це не окрема копія розкладу: кожне заняття тут — той самий запис, який одночасно бачить сітка аудиторій і індивідуальний розклад викладача.</div>
  </div>`;
  $("#timetableGroup").onchange=e=>{timetableState.group=e.target.value;rememberTimetableGroup(timetableState.group);timetableState.month=groupCurrentMonth();renderTimetable();};
}
/* Individual teacher schedule — monthly view */
let teacherScheduleFeed={teacherId:null,schedule:[],roomBookings:[],academicYear:"",bellSchedule:[]};
let teacherScheduleState={teacherId:null,month:null};

function calendarMonthDays(month){
  const [y,m]=month.split("-").map(Number),first=new Date(y,m-1,1,12,0,0),last=new Date(y,m,0,12,0,0);
  const firstDow=(first.getDay()+6)%7,lastDow=(last.getDay()+6)%7,startDate=new Date(first),endDate=new Date(last);
  startDate.setDate(first.getDate()-firstDow);endDate.setDate(last.getDate()+(6-lastDow));
  const days=[],d=new Date(startDate);while(d<=endDate){days.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);d.setDate(d.getDate()+1);}return days;
}
function academicMonthTabs(){
  const b=academicYearBounds();
  const names=["","Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];
  return [
    ...[9,10,11,12].map(m=>({value:`${b.startYear}-${String(m).padStart(2,"0")}`,label:names[m]})),
    ...[1,2,3,4,5,6].map(m=>({value:`${b.endYear}-${String(m).padStart(2,"0")}`,label:names[m]}))
  ];
}
function teacherCurrentMonth(){
  return clampAcademicMonth(currentAcademicDate().slice(0,7));
}
function teacherMonthAllowed(month){
  return academicMonthTabs().some(x=>x.value===month);
}
function teacherMonthDays(month){return calendarMonthDays(month);}
function teacherScheduleTeacherName(id){
  const local=teacherById(id);
  if(local)return local.name||teacherDisplay(local);
  return window.REMS_CLOUD?.profile?.()?.displayName||window.REMS_CLOUD?.email?.()||"Викладач";
}
function teacherPortalTeacherId(){
  if(window.REMS_CLOUD?.role?.()==="teacher")return Number(window.REMS_CLOUD?.teacherId?.()||teacherScheduleFeed.teacherId)||null;
  return Number(teacherScheduleState.teacherId)||null;
}
function teacherScheduleSource(){
  const role=window.REMS_CLOUD?.role?.();
  const teacherId=teacherPortalTeacherId();
  if(role==="teacher"){
    return {
      teacherId,
      schedule:teacherScheduleFeed.schedule||[],
      roomBookings:teacherScheduleFeed.roomBookings||[],
      bellSchedule:teacherScheduleFeed.bellSchedule?.length?teacherScheduleFeed.bellSchedule:db.bellSchedule,
      academicYear:teacherScheduleFeed.academicYear||db.academicYear
    };
  }
  return {
    teacherId,
    schedule:db.schedule.filter(x=>Number(resolvedScheduleTeacherId(x,db))===Number(teacherId)),
    roomBookings:db.roomBookings.filter(x=>Number(x.teacherId)===Number(teacherId)),
    bellSchedule:db.bellSchedule,
    academicYear:db.academicYear
  };
}
function teacherEventPairLabel(x,source){
  if(x?.pairId!==null&&x?.pairId!==undefined&&String(x.pairId)!=="")return `${x.pairId} пара`;
  const p=(source.bellSchedule||[]).find(p=>p.start===x?.start&&p.end===x?.end);
  if(p)return `${p.id} пара`;
  if(x?.start||x?.end)return `${x.start||""}${x.start&&x.end?"–":""}${x.end||""}`;
  return "без № пари";
}
function teacherEventsForDate(source,date){
  const lessons=(source.schedule||[]).filter(x=>x.date===date).map(x=>({source:"schedule",data:x}));
  const bookings=(source.roomBookings||[]).filter(x=>x.date===date).map(x=>({source:"booking",data:x}));
  return [...lessons,...bookings].sort((a,b)=>{
    const ax=a.data,bx=b.data;
    const ap=Number(ax.pairId),bp=Number(bx.pairId);
    if(Number.isFinite(ap)&&Number.isFinite(bp)&&ap!==bp)return ap-bp;
    if(Number.isFinite(ap)!==Number.isFinite(bp))return Number.isFinite(ap)?-1:1;
    return String(ax.start||"99:99").localeCompare(String(bx.start||"99:99"));
  });
}
function teacherMonthEventCount(source,month){
  return [...(source.schedule||[]),...(source.roomBookings||[])].filter(x=>String(x.date||"").slice(0,7)===month).length;
}
function teacherMonthTabsHtml(source){
  return `<div class="teacher-month-tabs">${academicMonthTabs().map(m=>{
    const count=teacherMonthEventCount(source,m.value);
    return `<button class="${m.value===teacherScheduleState.month?"active":""}" onclick="setTeacherMonth('${m.value}')">
      <span>${esc(m.label)}</span>${count?`<b>${count}</b>`:""}
    </button>`;
  }).join("")}</div>`;
}
function teacherMonthEventCard(ev,source){
  const x=ev.data;
  const pair=teacherEventPairLabel(x,source);
  if(ev.source==="schedule"){
    return `<div class="teacher-month-event">
      <div class="teacher-month-event-top"><b>${esc(pair)}</b><strong>${x.room?`ауд. ${esc(x.room)}`:"—"}</strong></div>
      <span class="teacher-month-group">${esc(x.group||"—")}</span>
      <span class="teacher-month-discipline">${esc(x.discipline||"Заняття")}</span>
      ${x.type?`<small>${esc(x.type)}</small>`:""}
    </div>`;
  }
  return `<div class="teacher-month-event booking">
    <div class="teacher-month-event-top"><b>${esc(pair)}</b><strong>${x.room?`ауд. ${esc(x.room)}`:"—"}</strong></div>
    <span class="teacher-month-group">${esc(x.group||x.kind||"Подія")}</span>
    <span class="teacher-month-discipline">${esc(x.title||roomBookingLabel(x))}</span>
    ${x.kind?`<small>${esc(x.kind)}</small>`:""}
  </div>`;
}
function setTeacherMonth(month){
  if(!teacherMonthAllowed(month))return;
  teacherScheduleState.month=month;
  renderMySchedule();
}
function shiftTeacherMonth(delta){
  const months=academicMonthTabs(),idx=months.findIndex(x=>x.value===teacherScheduleState.month);
  const next=months[idx+Number(delta)];
  if(next)setTeacherMonth(next.value);
}
function teacherMonthToday(){
  setTeacherMonth(teacherCurrentMonth());
}
function openTeacherSchedule(id){
  teacherScheduleState.teacherId=Number(id);
  teacherScheduleState.month=teacherCurrentMonth();
  go("mySchedule",{focusCurrentCalendar:false});
}
window.REMS_SET_TEACHER_FEED=(feed)=>{
  teacherScheduleFeed={
    teacherId:feed?.teacherId??null,
    schedule:feed?.schedule||[],
    roomBookings:feed?.roomBookings||[],
    academicYear:feed?.academicYear||db.academicYear,
    bellSchedule:feed?.bellSchedule||[]
  };
  if(window.REMS_CLOUD?.role?.()==="teacher")teacherScheduleState.teacherId=teacherScheduleFeed.teacherId;
  if(!teacherScheduleState.month||!teacherMonthAllowed(teacherScheduleState.month))teacherScheduleState.month=teacherCurrentMonth();
  if(currentPage==="mySchedule")renderMySchedule();
};

function renderMySchedule(){
  const role=window.REMS_CLOUD?.role?.();
  if(role==="teacher")teacherScheduleState.teacherId=teacherPortalTeacherId();
  const source=teacherScheduleSource(),teacherId=source.teacherId;

  if(!teacherId){
    $("#page-mySchedule").innerHTML=`<div class="card section"><div class="empty"><b>Акаунт ще не прив’язаний до викладача.</b><br>Адміністратор має відкрити «Налаштування → Користувачі та доступ» і вибрати викладача для цього акаунта.</div>${role==="teacher"?`<div class="actions" style="justify-content:center;margin-top:16px"><button class="secondary" onclick="window.REMS_CLOUD?.signOut?.()">Вийти</button></div>`:""}</div>`;
    return;
  }

  if(!teacherScheduleState.month||!teacherMonthAllowed(teacherScheduleState.month))teacherScheduleState.month=teacherCurrentMonth();

  const month=teacherScheduleState.month;
  const monthDays=teacherMonthDays(month);
  const monthCount=teacherMonthEventCount(source,month);
  const totalCount=(source.schedule||[]).length+(source.roomBookings||[]).length;
  const name=teacherScheduleTeacherName(teacherId);
  const today=localTodayISO();
  const weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Нд"];
  const monthInfo=academicMonthTabs().find(x=>x.value===month);
  const months=academicMonthTabs();
  const monthIndex=months.findIndex(x=>x.value===month);

  $("#pageTitle").textContent=role==="teacher"?"Мій розклад":"Розклад викладача";
  $("#pageSubtitle").textContent=name;

  $("#page-mySchedule").innerHTML=`<div class="teacher-month-page">
    <div class="card section teacher-month-header">
      <div class="section-head">
        <div>
          <h2>${esc(name)}</h2>
          <div class="small">Індивідуальний розклад · ${esc(source.academicYear||db.academicYear)}</div>
        </div>
        <div class="actions">
          ${role!=="teacher"?`<button class="secondary" onclick="go('teachers')">← До викладачів</button>`:""}
          ${role==="teacher"?`<button class="secondary" onclick="window.REMS_CLOUD?.signOut?.()">Вийти</button>`:""}
        </div>
      </div>

      ${teacherMonthTabsHtml(source)}

      <div class="teacher-month-toolbar">
        <button class="secondary" ${monthIndex<=0?"disabled":""} onclick="shiftTeacherMonth(-1)">← Попередній</button>
        <div class="teacher-month-title">
          <b>${esc(monthInfo?.label||monthLabel(month))}</b>
          <span>${monthCount} подій у місяці · ${totalCount} у навчальному році</span>
        </div>
        <button class="secondary" onclick="teacherMonthToday()">Актуальний місяць</button>
        <button class="secondary" ${monthIndex>=months.length-1?"disabled":""} onclick="shiftTeacherMonth(1)">Наступний →</button>
      </div>
    </div>

    <div class="card section teacher-month-calendar-card">
      <div class="teacher-month-weekdays">
        ${weekdays.map(w=>`<div>${w}</div>`).join("")}
      </div>
      <div class="teacher-month-calendar">
        ${monthDays.map(date=>{
          const inMonth=date.slice(0,7)===month;
          const inAcademic=dateInBounds(date);
          const events=inAcademic?teacherEventsForDate(source,date):[];
          const day=Number(date.slice(8,10));
          const isToday=date===today;
          return `<div class="teacher-month-day ${inMonth?"":"outside-month"} ${isToday?"today":""}">
            <div class="teacher-month-day-head">
              <b>${day}</b>
              ${isToday?`<span>сьогодні</span>`:""}
            </div>
            <div class="teacher-month-day-events">
              ${events.length?events.map(ev=>teacherMonthEventCard(ev,source)).join(""):(inMonth?`<div class="teacher-month-free">—</div>`:"")}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>

    <div class="notice teacher-live-note">Розклад оновлюється автоматично після змін у загальному розкладі. Липень і серпень не використовуються.</div>
  </div>`;
}
window.REMS_APPLY_ROLE_ACCESS=()=>{
  const role=window.REMS_CLOUD?.role?.();
  document.body.classList.toggle("teacher-portal-mode",role==="teacher");
  const nav=$("#teacherScheduleNav");
  if(nav)nav.style.display=role==="teacher"?"":"none";
  if(role==="teacher"){
    teacherScheduleState.teacherId=teacherPortalTeacherId();
    if(!teacherScheduleState.month)teacherScheduleState.month=teacherCurrentMonth();
    if(currentPage!=="mySchedule")go("mySchedule",{focusCurrentCalendar:false});
    else renderMySchedule();
  }
};

/* Settings */
function renderBellRows(){return bellPairs().map(p=>`<div class="bell-row" data-bell-row data-id="${esc(p.id)}"><div class="bell-number">${esc(p.id)} пара</div><input data-bstart type="time" value="${esc(p.start||"")}"><span>—</span><input data-bend type="time" value="${esc(p.end||"")}"><button class="danger small-btn" onclick="removeBellPair(${JSON.stringify(p.id)})">×</button></div>`).join("");}
function renderUsers(){
  const mount=$("#page-users");
  if(window.REMS_CLOUD?.renderUsersPage) window.REMS_CLOUD.renderUsersPage(mount);
  else mount.innerHTML=`<div class="card section"><div class="empty">Підключення модуля користувачів…</div></div>`;
}

function renderSettings(){
  $("#page-settings").innerHTML=`<div class="card section">
    <div class="section-head"><div><h2>Системні довідники</h2><div class="small">Речі, які потрібні рідше, більше не займають місце в основному меню.</div></div></div>
    <div class="settings-shortcuts">
      <button class="settings-shortcut" onclick="go('lessonTypes')"><b>Види занять і правила годин</b><span>Лекції, практичні, іспити, індивідуальні та правила підрахунку.</span></button>
      <button class="settings-shortcut" onclick="go('users')"><b>Користувачі та доступ</b><span>Облікові записи, ролі та блокування доступу.</span></button>
    </div>
  </div>
  <div class="settings-grid"><div class="card settings-card"><h3>Навчальний період</h3><label>Навчальний рік<input id="setYear" value="${esc(db.academicYear)}"></label><label style="margin-top:10px">Семестр<select id="setSem"><option ${db.semester===1?"selected":""}>1</option><option ${db.semester===2?"selected":""}>2</option></select></label><div class="small" style="margin-top:10px"><b>Календар року:</b> ${academicDateMessage()}<br><b>І семестр:</b> ${academicDateMessage(semesterDateBounds(1))}<br><b>ІІ семестр:</b> ${academicDateMessage(semesterDateBounds(2))}<br>Липень і серпень у розкладах не використовуються.</div><button class="primary" style="margin-top:12px" onclick="savePeriod()">Зберегти</button></div><div class="card settings-card"><h3>Резервна копія</h3><p class="small">Експорт усієї бази одним JSON-файлом.</p><button class="primary" onclick="exportData()">Експорт даних</button></div><div class="card settings-card"><h3>Імпорт</h3><p class="small">Відновити дані з резервної копії.</p><button class="secondary" onclick="document.querySelector('#importFile').click()">Імпортувати</button></div><div class="card settings-card"><h3>Скидання</h3><p class="small">Повернути початкові дані версії 0.9.</p><button class="danger" onclick="resetData()">Скинути дані</button></div></div>
  <div id="cloudSettingsMount"></div>
  <div class="card section"><div class="section-head"><div><h2>Розклад дзвінків</h2><div class="small">У складанні розкладу ти вибираєш номер пари. Час використовується автоматично для перевірки конфліктів і доступності викладачів.</div></div><button class="secondary" onclick="addBellPair()">+ Додати пару</button></div><div class="bell-editor"><div class="bell-head"><span>Пара</span><span>Початок</span><span></span><span>Кінець</span><span></span></div>${renderBellRows()}</div><button class="primary" style="margin-top:12px" onclick="saveBellSchedule()">Зберегти дзвінки</button></div>`;
}
function saveBellSchedule(){db.bellSchedule=$$("[data-bell-row]").map(r=>({id:Number(r.dataset.id),start:r.querySelector("[data-bstart]").value,end:r.querySelector("[data-bend]").value})).sort((a,b)=>a.id-b.id);db.schedule.forEach(s=>{if(s.pairId){const p=pairById(s.pairId);if(p){s.start=p.start;s.end=p.end;}}});db.roomBookings.forEach(b=>{if(b.pairId){const p=pairById(b.pairId);if(p){b.start=p.start;b.end=p.end;}}});save();alert("Розклад дзвінків збережено. Усі заняття з номерами пар оновлено автоматично.");}
function addBellPair(){const next=bellPairs().length?Math.max(...bellPairs().map(p=>Number(p.id)||0))+1:1;db.bellSchedule.push({id:next,start:"",end:""});save();}
function removeBellPair(id){if((db.schedule.some(s=>String(s.pairId)===String(id))||db.roomBookings.some(b=>String(b.pairId)===String(id)))&&!confirm("На цій парі вже є заняття. Видалити пару з довідника? Самі заняття не видаляться."))return;db.bellSchedule=db.bellSchedule.filter(p=>String(p.id)!==String(id));save();}
function savePeriod(){db.academicYear=$("#setYear").value.trim();db.semester=+$("#setSem").value;save();alert("Збережено.");}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`REMS-ROZKLAD-backup-${localTodayISO()}.json`;a.click();URL.revokeObjectURL(a.href);}
$("#importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=migrate(JSON.parse(r.result));save();alert("Дані імпортовано.");}catch(err){alert("Не вдалося прочитати файл.");}};r.readAsText(f);e.target.value="";};
function resetData(){if(confirm("Повернути початкові дані?")){db=clone(window.REMS_INITIAL_DATA);save();go("home");}}

const startPage=(()=>{
  const rawHash=(location.hash||"").replace(/^#/,"");
  const hash=rawHash==="students"?"groups":rawHash;
  if(meta[hash]&&$("#page-"+hash))return hash;
  const saved=rememberedPage();
  if(meta[saved]&&$("#page-"+saved))return saved;
  return "home";
})();
go(startPage,{focusCurrentCalendar:["timetable","roomGrid","mySchedule"].includes(startPage)});

window.addEventListener("hashchange",()=>{
  const p=(location.hash||"").replace(/^#/,"");
  if(meta[p]&&p!==currentPage)go(p,{focusCurrentCalendar:["timetable","roomGrid","mySchedule"].includes(p)});
});
