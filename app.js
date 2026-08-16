
const KEY="remsScheduleData_v09";
const OLD_KEYS=["remsScheduleData_v08","remsScheduleData_v07","remsScheduleData_v06","remsScheduleData_v051","remsScheduleData_v04","remsScheduleData_v02","remsScheduleData_v01"];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clone=x=>JSON.parse(JSON.stringify(x));
const UI_PAGE_KEY="remsUiPage_v1";
const UI_TIMETABLE_GROUP_KEY="remsUiTimetableGroup_v1";
const UI_WORKLOAD_GROUP_KEY="remsUiWorkloadGroup_v1";
const UI_TEACHER_VIEW_KEY="remsUiTeacherView_v1";
const UI_LOAD_PAGE_GROUP_KEY="remsUiLoadPageGroup_v1";
const UI_LOAD_PAGE_FILTER_KEY="remsUiLoadPageFilter_v1";
const UI_LOAD_PAGE_SEMESTER_KEY="remsUiLoadPageSemester_v1";
function rememberWorkloadGroup(group){
  try{if(group)sessionStorage.setItem(UI_WORKLOAD_GROUP_KEY,group);else sessionStorage.removeItem(UI_WORKLOAD_GROUP_KEY);}catch(e){}
}
function rememberedWorkloadGroup(){
  try{return sessionStorage.getItem(UI_WORKLOAD_GROUP_KEY)||"";}catch(e){return"";}
}
function rememberTeacherView(id){
  try{if(id)sessionStorage.setItem(UI_TEACHER_VIEW_KEY,String(id));else sessionStorage.removeItem(UI_TEACHER_VIEW_KEY);}catch(e){}
}
function rememberedTeacherView(){
  try{return Number(sessionStorage.getItem(UI_TEACHER_VIEW_KEY))||null;}catch(e){return null;}
}
function rememberLoadPageState(){
  try{
    if(loadPageState.group)sessionStorage.setItem(UI_LOAD_PAGE_GROUP_KEY,loadPageState.group);
    else sessionStorage.removeItem(UI_LOAD_PAGE_GROUP_KEY);
    sessionStorage.setItem(UI_LOAD_PAGE_FILTER_KEY,loadPageState.filter||"all");
    sessionStorage.setItem(UI_LOAD_PAGE_SEMESTER_KEY,String(loadPageState.semester||"all"));
  }catch(e){}
}
function rememberedLoadPageState(){
  try{
    return {
      group:sessionStorage.getItem(UI_LOAD_PAGE_GROUP_KEY)||"",
      filter:sessionStorage.getItem(UI_LOAD_PAGE_FILTER_KEY)||"all",
      semester:sessionStorage.getItem(UI_LOAD_PAGE_SEMESTER_KEY)||"all"
    };
  }catch(e){
    return {group:"",filter:"all",semester:"all"};
  }
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
function weekdayNameForDate(date){
  if(!date)return "";
  return new Date(date+"T12:00:00").toLocaleDateString("uk-UA",{weekday:"short"}).replace(".","");
}
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
function uniqueStrings(values=[]){
  const seen=new Set(),out=[];
  (values||[]).forEach(v=>{
    const raw=String(v||"").trim(),key=normIdentity(raw);
    if(raw&&!seen.has(key)){seen.add(key);out.push(raw);}
  });
  return out;
}
function scheduleAudienceGroups(item){
  return uniqueStrings([...(Array.isArray(item?.audienceGroups)?item.audienceGroups:[]),item?.group||""]);
}
function scheduleIncludesGroup(item,group){
  const key=normIdentity(group);
  return !!key&&scheduleAudienceGroups(item).some(g=>normIdentity(g)===key);
}
function scheduleAudienceLabel(item){
  const groups=scheduleAudienceGroups(item);
  return groups.length?groups.join(" + "):(item?.group||"");
}
function scheduleGroupsOverlap(a,b){
  const A=new Set(scheduleAudienceGroups(a).map(normIdentity));
  return scheduleAudienceGroups(b).some(g=>A.has(normIdentity(g)));
}
function scheduleDisciplineIds(item){
  return [...new Set([...(Array.isArray(item?.disciplineIds)?item.disciplineIds:[]),item?.disciplineId].map(Number).filter(Boolean))];
}
function scheduleCoversDiscipline(item,disciplineId){
  return scheduleDisciplineIds(item).includes(Number(disciplineId));
}
function isReadyExternalScheduleItem(item){
  return !!item&&!item.specialSchedule&&(item.scheduleSource==="ready_external"||item.workloadHours===0||item.workloadHours==="0");
}

function resolvedScheduleDiscipline(item,state=db){
  if(isReadyExternalScheduleItem(item))return null;
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
  const audiences=scheduleAudienceGroups(item);
  if(audiences.length)return audiences[0];
  const d=resolvedScheduleDiscipline(item,state);
  if(d?.group)return d.group;
  const direct=normIdentity(item?.group);
  if(direct){
    const g=(state?.groups||[]).find(x=>normIdentity(x.code)===direct);
    return g?.code||String(item.group||"").trim();
  }
  return "";
}
function teacherMatchByText(text,state=db){
  const key=normIdentity(text);
  if(!key)return null;

  const matches=(state?.teachers||[]).filter(t=>{
    if(t.status==="archived")return false;
    return [t.name,t.shortName]
      .map(normIdentity)
      .filter(Boolean)
      .includes(key);
  });

  return matches.length===1?matches[0]:null;
}
function ensureReadyExternalTeacher(text,state=db){
  const name=String(text||"").trim();
  if(!name)return null;

  const existing=teacherMatchByText(name,state);
  if(existing)return existing;

  state.teachers=state.teachers||[];
  const t={
    id:uid(state.teachers),
    scope:"external",
    name,
    shortName:"",
    note:"Автоматично додано з готового розкладу",
    autoCreatedFromReady:true,
    status:"active"
  };
  state.teachers.push(t);
  return t;
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
    const ready=isReadyExternalScheduleItem(item);

    if(ready){
      if(item.scheduleSource!=="ready_external"){item.scheduleSource="ready_external";changed++;}
      if(item.disciplineId!==null&&item.disciplineId!==undefined){item.disciplineId=null;changed++;}
      if((item.disciplineIds||[]).length){item.disciplineIds=[];changed++;}
      if(item.teacher){
        let linked=teacherMatchByText(item.teacher,state);
        if(!linked){linked=ensureReadyExternalTeacher(item.teacher,state);if(linked)changed++;}
        if(linked&&Number(item.teacherId)!==Number(linked.id)){item.teacherId=linked.id;changed++;}
      }
    }

    const audiences=scheduleAudienceGroups(item);
    if(!Array.isArray(item.audienceGroups)||JSON.stringify(item.audienceGroups)!==JSON.stringify(audiences)){
      item.audienceGroups=audiences;changed++;
    }
    if(audiences.length&&item.group!==audiences[0]){item.group=audiences[0];changed++;}

    if(!ready){
      const d=resolvedScheduleDiscipline(item,state);
      if(d){
        if(Number(item.disciplineId)!==Number(d.id)){item.disciplineId=d.id;changed++;}
        if(item.discipline!==d.name){item.discipline=d.name;changed++;}
        if(!item.audienceGroups.length&&d.group){item.group=d.group;item.audienceGroups=[d.group];changed++;}
        const dids=scheduleDisciplineIds(item);
        if(!dids.includes(Number(d.id))){dids.unshift(Number(d.id));item.disciplineIds=[...new Set(dids)];changed++;}
        else if(!Array.isArray(item.disciplineIds)){item.disciplineIds=dids;changed++;}
      }else{
        const g=resolvedScheduleGroup(item,state);
        if(g&&!item.group){item.group=g;item.audienceGroups=uniqueStrings([g,...item.audienceGroups]);changed++;}
      }
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
        let desiredStart=pair.start||"",desiredEnd=pair.end||"";
        if(item.specialSchedule&&item.specialHalf&&pair.start&&pair.end){
          const toMin=v=>{const [h,m]=String(v).split(":").map(Number);return h*60+m;};
          const toTime=v=>`${String(Math.floor(v/60)).padStart(2,"0")}:${String(v%60).padStart(2,"0")}`;
          const a=toMin(pair.start),b=toMin(pair.end),mid=Math.round((a+b)/2);
          if(Number(item.specialHalf)===2){desiredStart=toTime(mid);desiredEnd=toTime(b);}
          else{desiredStart=toTime(a);desiredEnd=toTime(mid);}
        }
        if(desiredStart&&item.start!==desiredStart){item.start=desiredStart;changed++;}
        if(desiredEnd&&item.end!==desiredEnd){item.end=desiredEnd;changed++;}
      }
    }
  });
  return changed;
}

function curriculumSeedKey(c){
  return [
    normIdentity(c?.academicYear||""),
    String(Number(c?.course)||""),
    normIdentity(c?.program||"")
  ].join("|");
}
function mergeSeedCurricula(existing=[],seed=[]){
  const result=clone(existing||[]);
  const keys=new Set(result.map(curriculumSeedKey));
  (seed||[]).forEach(c=>{
    const key=curriculumSeedKey(c);
    if(!keys.has(key)){
      result.push(clone(c));
      keys.add(key);
    }
  });
  return result;
}

function groupSeedKey(g){
  return normIdentity(g?.code||"");
}
function studentSeedKey(s){
  return [normIdentity(s?.group||""),normIdentity(s?.name||"")].join("|");
}
function mergeSeedGroups(existing=[],seed=[]){
  const result=clone(existing||[]);
  const keys=new Set(result.map(groupSeedKey));
  (seed||[]).forEach(g=>{
    const key=groupSeedKey(g);
    if(key&&!keys.has(key)){
      result.push(clone(g));
      keys.add(key);
    }
  });
  return result;
}
function mergeSeedStudents(existing=[],seed=[]){
  const result=clone(existing||[]);
  const keys=new Set(result.map(studentSeedKey));
  (seed||[]).forEach(s=>{
    const key=studentSeedKey(s);
    if(key&&!keys.has(key)){
      result.push(clone(s));
      keys.add(key);
    }
  });
  return result;
}

function migrate(old){
  const fresh=clone(window.REMS_INITIAL_DATA);
  if(!old||typeof old!=="object") return fresh;
  fresh.groups=mergeSeedGroups(old.groups||[],fresh.groups||[]);
  fresh.students=mergeSeedStudents(old.students||[],fresh.students||[]);
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
    ...t,
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
    teacherIds:d.teacherIds||[],teacherLoads:d.teacherLoads||{},teacherStudentLoads:d.teacherStudentLoads||{},
    controlForm:d.controlForm||"Немає",color:d.color||"#8b5cf6",
    hours:d.hours||{},extraHours:d.extraHours||{},note:d.note||"",status:d.status||"active",
    sourceCurriculumId:d.sourceCurriculumId||null,sourceComponentId:d.sourceComponentId||null,
    planMeta:d.planMeta||{}
  }));
  fresh.curricula=mergeSeedCurricula(old.curricula||[],fresh.curricula||[]);
  fresh.schemaVersion=15;
  fresh.schedule=(old.schedule||[]).map((s,i)=>{
    const ready=isReadyExternalScheduleItem(s);
    let teacherId=s.teacherId||null;
    if(!teacherId&&s.teacher){
      const t=fresh.teachers.find(x=>normIdentity(x.shortName||x.name)===normIdentity(s.teacher)||normIdentity(x.name)===normIdentity(s.teacher));
      if(t)teacherId=t.id;
    }
    let disciplineId=ready?null:(s.disciplineId||null);
    if(!ready&&!disciplineId&&s.discipline){
      const d=fresh.disciplines.find(x=>normIdentity(x.name)===normIdentity(s.discipline)&&(!x.group||normIdentity(x.group)===normIdentity(s.group)));
      if(d)disciplineId=d.id;
    }
    const lt=fresh.lessonTypes.find(x=>x.name===s.type);
    const out={
      id:s.id||i+1,date:s.date||"",start:s.start||"",end:s.end||"",
      pairId:s.pairId||fresh.bellSchedule.find(p=>p.start===s.start&&p.end===s.end)?.id||null,
      group:s.group||"",
      disciplineId,discipline:s.discipline||"",type:s.type||"",coverage:s.coverage||"Вся група",
      students:s.students||"",studentId:s.studentId||null,teacherId,teacher:s.teacher||"",room:s.room||"",
      workloadHours:s.workloadHours??lt?.defaultUnit??1,note:s.note||"",repeatBatchId:s.repeatBatchId||null,
      specialSchedule:s.specialSchedule===true,specialKind:s.specialKind||"",specialHalf:s.specialHalf||null,
      scheduleSource:ready?"ready_external":(s.scheduleSource||"")
    };

    // v1.6 fields are kept only on records that actually have/use them.
    // Legacy rows therefore do not all become "changed" after an upgrade.
    if(Array.isArray(s.audienceGroups)&&s.audienceGroups.length){
      out.audienceGroups=uniqueStrings(s.audienceGroups);
      if(!out.group)out.group=out.audienceGroups[0]||"";
    }
    if(Array.isArray(s.disciplineIds)&&s.disciplineIds.length){
      out.disciplineIds=ready?[]:[...new Set(s.disciplineIds.map(Number).filter(Boolean))];
    }
    if(s.sourceCurriculumId!==undefined&&s.sourceCurriculumId!==null)out.sourceCurriculumId=s.sourceCurriculumId;
    if(s.sourceComponentId!==undefined&&s.sourceComponentId!==null)out.sourceComponentId=s.sourceComponentId;
    if(s.sourceSemester!==undefined&&s.sourceSemester!==null)out.sourceSemester=s.sourceSemester;
    if(s.sourcePlanRef)out.sourcePlanRef=s.sourcePlanRef;

    // Preserve future/custom fields without inventing empty v1.6 values.
    for(const [k,v] of Object.entries(s)){
      if(!(k in out)&&v!==undefined)out[k]=v;
    }
    return out;
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
  db.schemaVersion=15;
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
  const remoteCurriculumKeys=new Set((remote?.curricula||[]).map(curriculumSeedKey));
  const remoteGroupKeys=new Set((remote?.groups||[]).map(groupSeedKey));
  const remoteStudentKeys=new Set((remote?.students||[]).map(studentSeedKey));
  db=migrate(remote);
  const addedSeedCurriculum=(db.curricula||[]).some(c=>!remoteCurriculumKeys.has(curriculumSeedKey(c)));
  const addedSeedGroup=(db.groups||[]).some(g=>!remoteGroupKeys.has(groupSeedKey(g)));
  const addedSeedStudent=(db.students||[]).some(s=>!remoteStudentKeys.has(studentSeedKey(s)));
  const repaired=repairScheduleLinks(db);
  const needsCloudRepair=addedSeedCurriculum||addedSeedGroup||addedSeedStudent||repaired>0||db.schedule.some(x=>{
    const raw=rawSchedule.get(String(x.id));
    return raw&&(String(raw.group||"")!==String(x.group||"")||Number(raw.teacherId||0)!==Number(x.teacherId||0)||Number(raw.disciplineId||0)!==Number(x.disciplineId||0));
  });
  db.schemaVersion=15;
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
function kpiIcon(label){return ({"Груп":"◉","Студентів":"✦","Викладачів кафедри":"♟","Дисциплін кафедри":"◇"})[label]||"•";}
function kpi(label,value){return `<div class="card kpi studio-kpi"><div class="kpi-icon">${kpiIcon(label)}</div><div class="kpi-copy"><div class="label">${label}</div><div class="value">${value}</div></div><span class="kpi-line"></span></div>`;}
function groupOptions(selected=""){return db.groups.slice().sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`<option value="${esc(g.code)}" ${g.code===selected?"selected":""}>${esc(g.code)} · ${g.course} курс</option>`).join("");}
function sortedGroups(){
  return db.groups.slice().sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code,"uk"));
}
function groupSwitchButtonHtml(g,selected,onclick,badge=""){
  const active=normIdentity(g.code)===normIdentity(selected);
  const safe=String(g.code).replaceAll("\\","\\\\").replaceAll("'","\\'");
  return `<button type="button"
    class="group-switch-btn course-${esc(g.course)} ${active?"active":""}"
    onclick="${onclick}('${safe}')">
      <span class="group-switch-meta">${esc(g.course)} КУРС</span>
      <span class="group-switch-main">${esc(g.code)}</span>
      ${badge!==""?`<span class="group-switch-count">${esc(badge)}</span>`:""}
    </button>`;
}
function groupSwitchRowHtml({selected="",onclick,includeAll=false,allLabel="Усі групи",badgeFn=null,groups=null,extraClass=""}){
  const list=(groups||sortedGroups());
  return `<div class="group-switch-wrap ${extraClass}">
    <div class="group-switch-row">
      ${includeAll?`<button type="button" class="group-switch-btn all ${!selected?"active":""}" onclick="${onclick}('')">
        <span class="group-switch-meta">ФІЛЬТР</span>
        <span class="group-switch-main">${esc(allLabel)}</span>
        <span class="group-switch-count">${list.length}</span>
      </button>`:""}
      ${list.map(g=>groupSwitchButtonHtml(g,selected,onclick,badgeFn?badgeFn(g):"")).join("")}
    </div>
  </div>`;
}
function departmentTeacherOptions(ids=[]){return departmentTeachers().map(t=>`<option value="${t.id}" ${ids.map(Number).includes(Number(t.id))?"selected":""}>${esc(teacherDisplay(t))}</option>`).join("");}
function formatMode(m){return ({academic_pair:"Аудиторні / парами",contingent:"За контингентом",per_student:"Індивідуально кожному",fixed:"Фіксовані години",manual:"Ручний підрахунок"})[m]||m;}

const meta={
  home:["Головна","Кафедральний пульт розкладу"],
  schedule:["Складання розкладу","Розподілені години → дати, пари та аудиторії"],
  specialSchedule:["Індивідуальні та консультації","Окремі розклади студентів по одній академічній годині"],
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
  bellSchedule:["Розклад дзвінків","Номери пар та час їх початку і завершення"],
  settings:["Налаштування","Навчальний рік, системні довідники та резервні копії"]
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
  if(cloudRole&&cloudRole!=="teacher"&&p==="mySchedule"&&!teacherPortalTeacherId())p="teachers";
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
  const sidebarPage=({students:"groups",rooms:"roomGrid",lessonTypes:"settings",users:"settings",bellSchedule:"settings"})[p]||p;
  $$(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===sidebarPage));
  $$(".page").forEach(x=>x.classList.remove("active"));
  $("#page-"+p).classList.add("active");
  $("#pageTitle").textContent=meta[p][0];
  $("#pageSubtitle").textContent=meta[p][1];
  renderCurrent();
}
function renderCurrent(){
  ({home:renderHome,schedule:renderSchedule,specialSchedule:renderSpecialSchedule,timetable:renderTimetable,mySchedule:renderMySchedule,groups:renderGroups,students:renderStudents,rooms:renderRooms,roomGrid:renderRoomGrid,teachers:renderTeachers,curricula:renderCurricula,disciplines:renderDisciplines,lessonTypes:renderLessonTypes,users:renderUsers,bellSchedule:renderBellSchedule,settings:renderSettings}[currentPage])();
  document.dispatchEvent(new CustomEvent("rems-rendered"));
}
function openModal(html,wide=false){
  $("#modalBody").innerHTML=html;
  $("#modal").classList.remove("hidden");
  const card=$("#modal").querySelector(".modal-card");
  card.classList.remove("planner-modal-card");
  card.classList.toggle("modal-wide",wide);
}
let plannerActionParentScroll=0;

function ensurePlannerActionModal(){
  let layer=$("#plannerActionModal");
  if(layer)return layer;

  layer=document.createElement("div");
  layer.id="plannerActionModal";
  layer.className="planner-action-modal hidden";
  layer.innerHTML=`
    <div class="planner-action-card">
      <button type="button" class="planner-action-close" aria-label="Закрити">×</button>
      <div id="plannerActionBody"></div>
    </div>`;
  document.body.appendChild(layer);

  layer.addEventListener("click",e=>{
    if(e.target===layer)closePlannerActionModal();
  });
  layer.querySelector(".planner-action-close").onclick=closePlannerActionModal;
  return layer;
}
function openPlannerActionModal(html,wide=false){
  const parent=$("#modal .modal-card");
  plannerActionParentScroll=parent?.scrollTop||0;

  const layer=ensurePlannerActionModal();
  $("#plannerActionBody").innerHTML=html;
  layer.classList.remove("hidden");
  layer.querySelector(".planner-action-card").classList.toggle("wide",!!wide);
  document.body.classList.add("planner-action-open");
}
function closePlannerActionModal(){
  const layer=$("#plannerActionModal");
  if(!layer)return;
  layer.classList.add("hidden");
  const body=$("#plannerActionBody");
  if(body)body.innerHTML="";
  document.body.classList.remove("planner-action-open");
}
function restorePlannerScroll(){
  requestAnimationFrame(()=>{
    const card=$("#modal .modal-card");
    if(card)card.scrollTop=plannerActionParentScroll||0;
  });
}
function refreshPlannerAfterAction(d,t){
  const keep={
    month:disciplinePlannerState.month,
    date:disciplinePlannerState.date,
    entryMode:null
  };
  closePlannerActionModal();
  save();
  openDisciplineTeacherScheduler(d.id,t.id,keep);
  restorePlannerScroll();
}
function closeModal(){
  closePlannerActionModal();
  $("#modal").classList.add("hidden");
  $("#modalBody").innerHTML="";
}

function renderHome(){
  const today=localTodayISO();
  const todays=db.schedule.filter(x=>x.date===today).sort((a,b)=>a.start.localeCompare(b.start));
  const dateObj=new Date(today+"T12:00:00");
  const dateDay=dateObj.toLocaleDateString("uk-UA",{day:"2-digit"});
  const dateMonth=dateObj.toLocaleDateString("uk-UA",{month:"long"});
  const activeDisciplines=db.disciplines.filter(x=>x.status!=="archived").length;
  const groups=db.groups.slice().sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code));

  $("#page-home").innerHTML=`
    <div class="home-stage">
      <div class="home-stage-copy">
        <span class="home-stage-kicker">НАВЧАЛЬНИЙ СЕЗОН</span>
        <h2>${esc(db.academicYear)}</h2>
        <p>${db.semester} семестр · система планування кафедри режисури естради і шоу</p>
        <div class="home-stage-actions"><button class="primary" onclick="go('schedule')">Складати розклад →</button><button class="secondary" onclick="go('timetable',{focusCurrentCalendar:true})">Дивитися календар</button></div>
      </div>
      <div class="home-stage-date"><span>СЬОГОДНІ</span><b>${esc(dateDay)}</b><strong>${esc(dateMonth)}</strong><small>${todays.length} занять у базі на сьогодні</small></div>
      <div class="home-stage-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>

    <div class="grid-kpi">
      ${kpi("Груп",db.groups.length)}
      ${kpi("Студентів",db.students.filter(x=>x.status!=="archived").length)}
      ${kpi("Викладачів кафедри",departmentTeachers().length)}
      ${kpi("Дисциплін кафедри",activeDisciplines)}
    </div>

    <div class="card section home-groups-section">
      <div class="section-head"><div><span class="section-kicker">СТРУКТУРА</span><h2>Навчальні групи</h2><div class="small">Кожен курс має свій візуальний акцент — так легше орієнтуватися в системі.</div></div><button class="secondary" onclick="go('groups')">Групи і студенти →</button></div>
      <div class="group-grid">${groups.map(g=>`<div class="group-card course-${g.course}"><span class="group-card-course">${g.course} КУРС</span><b>${esc(g.code)}</b><p><strong>${groupStudentCount(g.code)}</strong> студентів</p><span class="group-card-glow"></span></div>`).join("")}</div>
    </div>

    <div class="card section home-today-section">
      <div class="section-head"><div><span class="section-kicker">СЬОГОДНІ</span><h2>Сьогодні</h2><div class="small">Оперативний зріз розкладу на поточну дату.</div></div><button class="secondary" onclick="go('timetable',{focusCurrentCalendar:true})">Відкрити розклад →</button></div>
      ${todays.length?miniSchedule(todays):`<div class="empty studio-empty"><b>Сьогодні тихо</b><span>На поточну дату занять ще немає.</span></div>`}
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
      <div class="student-filter-head">
        <input id="studentSearch" placeholder="Пошук студентів…">
      </div>
      <input id="studentGroupFilter" type="hidden" value="">
      <div id="studentGroupButtons">
        ${groupSwitchRowHtml({
          selected:"",
          onclick:"setStudentGroupFilter",
          includeAll:true,
          badgeFn:g=>String(groupStudentCount(g.code)),
          extraClass:"student-group-switch"
        })}
      </div>
      <div id="studentTable"></div>
    </div>`;
  $("#studentSearch").oninput=renderStudentTable;
  renderStudentTable();
}
function setStudentGroupFilter(code){
  const input=$("#studentGroupFilter");
  if(input)input.value=code||"";
  const wrap=$("#studentGroupButtons");
  if(wrap){
    wrap.innerHTML=groupSwitchRowHtml({
      selected:code||"",
      onclick:"setStudentGroupFilter",
      includeAll:true,
      badgeFn:g=>String(groupStudentCount(g.code)),
      extraClass:"student-group-switch"
    });
  }
  renderStudentTable();
}
function showGroupStudents(code){
  setStudentGroupFilter(code);
  $("#studentGroupButtons")?.scrollIntoView({behavior:"smooth",block:"center"});
}
function addGroup(){
  openModal(`<h2>Нова група</h2><form id="f" class="form-grid"><label>Курс<select id="gc">${[1,2,3,4,5,6].map(x=>`<option>${x}</option>`).join("")}</select></label><label>Шифр<input id="gn" required></label><div class="wide"><button class="primary">Додати</button></div></form>`);
  $("#f").onsubmit=e=>{e.preventDefault();const c=$("#gn").value.trim();if(!c)return;if(db.groups.some(g=>g.code.toLowerCase()===c.toLowerCase()))return alert("Така група вже є.");db.groups.push({id:uid(db.groups),course:+$("#gc").value,code:c});closeModal();save();};
}
function editGroup(id){
  const g=db.groups.find(x=>x.id===id);
  openModal(`<h2>Редагувати групу</h2><form id="f" class="form-grid"><label>Курс<select id="gc">${[1,2,3,4,5,6].map(x=>`<option ${x===g.course?"selected":""}>${x}</option>`).join("")}</select></label><label>Шифр<input id="gn" value="${esc(g.code)}" required></label><div class="wide"><button class="primary">Зберегти</button></div></form>`);
  $("#f").onsubmit=e=>{e.preventDefault();const old=g.code,neu=$("#gn").value.trim();g.course=+$("#gc").value;g.code=neu;db.students.forEach(s=>{if(s.group===old)s.group=neu});db.schedule.forEach(s=>{
    if(s.group===old)s.group=neu;
    if(Array.isArray(s.audienceGroups))s.audienceGroups=s.audienceGroups.map(g=>g===old?neu:g);
  });db.disciplines.forEach(d=>{if(d.group===old)d.group=neu});closeModal();save();};
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
function specialRoomGridKindLabel(x){
  if(x?.specialKind==="consult_bachelor")return "КОНСУЛЬТАЦІЯ БАКАЛАВРА";
  if(x?.specialKind==="consult_master")return "КОНСУЛЬТАЦІЯ МАГІСТРА";
  return "ІНДИВІДУАЛЬНЕ ЗАНЯТТЯ";
}

function roomEventCard(ev){
  const x=ev.data;
  if(ev.source==="schedule"){
    if(x.specialSchedule){
      return `<button class="room-event room-event-lesson room-event-special subject-colored" style="${scheduleColorVars(x)}" onclick="event.stopPropagation();openSpecialEventFromRoom(${x.id})"><span class="room-event-badge room-event-special-kind">${esc(specialRoomGridKindLabel(x))}</span><b>${esc(specialStudentName(x))}</b><span>${esc(x.discipline||"—")}</span><small>${esc(x.teacher||"—")} · ${esc(x.start||"")}–${esc(x.end||"")}</small></button>`;
    }
    return `<button class="room-event room-event-lesson subject-colored" style="${scheduleColorVars(x)}" onclick="event.stopPropagation();openLessonModal(${x.id})"><span class="room-event-badge">ЗАНЯТТЯ</span><b>${esc(scheduleAudienceLabel(x)||"—")}</b><span>${esc(x.discipline||"—")}</span><small>${esc(x.teacher||"—")}</small></button>`;
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
function readyAcademicHours(x){
  if(x?.specialSchedule)return num(x.workloadHours||1);
  return 2;
}
function externalTeacherScheduleRows(t){
  return db.schedule
    .filter(x=>!x.specialSchedule&&dateInBounds(x.date))
    .filter(x=>{
      const tid=resolvedScheduleTeacherId(x,db);
      if(tid&&Number(tid)===Number(t.id))return true;
      return normIdentity(x.teacher)===normIdentity(teacherDisplay(t))
        ||normIdentity(x.teacher)===normIdentity(t.name);
    });
}
function externalTeacherStats(t){
  const rows=externalTeacherScheduleRows(t);
  const disciplines=[...new Set(rows.map(x=>x.discipline).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"uk"));
  const groups=[...new Set(rows.flatMap(x=>scheduleAudienceGroups(x)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"uk"));
  const hours=rows.reduce((sum,x)=>sum+readyAcademicHours(x),0);
  return {rows,disciplines,groups,pairs:rows.length,hours};
}
function externalTeacherCard(t){
  const s=externalTeacherStats(t);
  return `<article class="external-teacher-card">
    <div class="external-teacher-card-main">
      <div>
        <span class="external-teacher-kicker">ЗОВНІШНІЙ / ІНША КАФЕДРА</span>
        <h3>${esc(t.name)}</h3>
        ${t.shortName?`<small>${esc(t.shortName)}</small>`:""}
      </div>
      <div class="external-teacher-kpis">
        <div><b>${s.pairs}</b><span>пар</span></div>
        <div><b>${fmtHours(s.hours)}</b><span>акад. год</span></div>
      </div>
    </div>

    <div class="external-teacher-facts">
      <div><span>Дисципліни</span><b>${esc(s.disciplines.join(" · ")||"ще немає")}</b></div>
      <div><span>Групи</span><b>${esc(s.groups.join(" · ")||"—")}</b></div>
    </div>

    <div class="external-teacher-actions">
      <button onclick="openTeacherSchedule(${t.id})">Розклад</button>
      <button onclick="openExternalTeacherModal(${t.id})">Редагувати</button>
      <button class="quiet-danger" onclick="deleteTeacher(${t.id})">Видалити</button>
    </div>
  </article>`;
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
    <div class="card section external-teachers-section">
      <div class="section-head">
        <div>
          <h2>Зовнішні / загальноосвітні викладачі</h2>
          <span class="small">Фактичні дані з готового розкладу. Вони не входять до кафедральної картки навантаження.</span>
        </div>
        <button class="secondary" onclick="openExternalTeacherModal()">+ Додати вручну</button>
      </div>
      ${ext.length?`<div class="external-teacher-grid">${ext.map(externalTeacherCard).join("")}</div>`:`<div class="empty">Зовнішніх викладачів ще немає. Вони також створюються автоматично, коли ти вводиш нове ПІБ у «Готових парах».</div>`}
    </div>`;
}
function teacherAvailabilitySummary(t){
  const unavailable=(t.unavailableRules||[]).length;
  const preferred=(t.preferredRules||[]).length;
  const parts=[];
  if(unavailable)parts.push(`не можна: ${unavailable}`);
  if(preferred)parts.push(`бажано: ${preferred}`);
  if(t.maxPerDay)parts.push(`до ${t.maxPerDay}/день`);
  if(t.maxConsecutive)parts.push(`до ${t.maxConsecutive} підряд`);
  return parts.length?parts.join(" · "):"обмеження не задані";
}
function teacherCard(t){
  return `<div class="teacher-card teacher-card-compact">
    <div class="teacher-compact-main">
      <div>
        <h3>${esc(t.name)}</h3>
        <div class="teacher-compact-tags">
          <span class="badge ok">${esc(t.employmentType||"—")}</span>
          <span class="rate-chip">${t.rate!==""?esc(t.rate):"—"} ставки</span>
        </div>
        <div class="teacher-availability-summary">${esc(teacherAvailabilitySummary(t))}</div>
      </div>
      <div class="actions teacher-actions">
        <button onclick="openTeacherSchedule(${t.id})">Розклад</button>
        <button onclick="openTeacherWorkload(${t.id})">Картка навантаження</button>
        <button class="availability-action" onclick="openTeacherAvailabilityModal(${t.id})">Доступність</button>
        <button onclick="openTeacherModal(${t.id})">Редагувати</button>
        <button onclick="deleteTeacher(${t.id})">Видалити</button>
      </div>
    </div>
  </div>`;
}
function openExternalTeacherModal(id=null){
  const t=id?teacherById(id):{scope:"external",name:"",shortName:"",note:"",status:"active"};
  openModal(`<h2>${id?"Редагувати":"Новий"} зовнішній викладач</h2><div class="notice">Цей викладач буде доступний у розкладі, але його кафедральне навантаження не рахується.</div><form id="etf" class="form-grid"><label class="wide">ПІБ<input id="etn" value="${esc(t.name)}" required></label><label>Коротке ім’я<input id="ets" value="${esc(t.shortName||"")}"></label><label class="wide">Примітка<textarea id="etnote" rows="3">${esc(t.note||"")}</textarea></label><div class="wide"><button class="primary">Зберегти</button></div></form>`);
  $("#etf").onsubmit=e=>{e.preventDefault();const obj={scope:"external",name:$("#etn").value.trim(),shortName:$("#ets").value.trim(),note:$("#etnote").value.trim(),status:"active"};if(id)Object.assign(t,obj);else db.teachers.push({id:uid(db.teachers),...obj});closeModal();save();};
}
function openTeacherAvailabilityModal(id){
  const t=teacherById(id);
  if(!t)return;

  openModal(`<div class="teacher-availability-modal">
    <div class="allocation-scheduler-head">
      <div>
        <h2>Доступність викладача</h2>
        <h3>${esc(t.name)}</h3>
        <div class="small">Ці правила система враховує під час складання розкладу.</div>
      </div>
    </div>

    <form id="teacherAvailabilityForm">
      <div class="availability-section unavailable">
        <div class="section-head compact">
          <div>
            <b>Не можна ставити</b>
            <div class="small">Жорстке обмеження: день тижня, конкретна дата або період дат + час.</div>
          </div>
          <button type="button" class="secondary" onclick="addRule('availabilityUnavailableRules')">+ Додати</button>
        </div>
        <div id="availabilityUnavailableRules" class="rule-list">${(t.unavailableRules||[]).map(ruleRow).join("")}</div>
        ${(t.unavailableRules||[]).length?"" : `<div class="availability-empty">Немає заборонених днів або годин.</div>`}
      </div>

      <div class="availability-section preferred">
        <div class="section-head compact">
          <div>
            <b>Бажано ставити</b>
            <div class="small">Система підкаже ці дні й години як зручні для викладача.</div>
          </div>
          <button type="button" class="secondary" onclick="addRule('availabilityPreferredRules')">+ Додати</button>
        </div>
        <div id="availabilityPreferredRules" class="rule-list">${(t.preferredRules||[]).map(ruleRow).join("")}</div>
        ${(t.preferredRules||[]).length?"" : `<div class="availability-empty">Бажаний час не задано.</div>`}
      </div>

      <div class="availability-limits">
        <label>Максимум пар на день
          <input id="availabilityMaxPerDay" type="number" min="0" value="${esc(t.maxPerDay||"")}" placeholder="наприклад 4">
        </label>
        <label>Максимум пар підряд
          <input id="availabilityMaxConsecutive" type="number" min="0" value="${esc(t.maxConsecutive||"")}" placeholder="наприклад 3">
        </label>
      </div>

      <div class="availability-legend">
        <span class="preferred">Бажано — система підсвічує як зручний час</span>
        <span class="neutral">Можна — звичайний час</span>
        <span class="blocked">Не можна — система не дає зберегти без виправлення</span>
      </div>

      <div class="modal-footer-actions">
        <button class="primary">Зберегти доступність</button>
      </div>
    </form>
  </div>`,true);

  bindRuleRows();

  $("#teacherAvailabilityForm").onsubmit=e=>{
    e.preventDefault();
    t.unavailableRules=readRules("availabilityUnavailableRules");
    t.preferredRules=readRules("availabilityPreferredRules");
    t.maxPerDay=$("#availabilityMaxPerDay").value;
    t.maxConsecutive=$("#availabilityMaxConsecutive").value;
    closeModal();
    save();
  };
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
function settingsBackBar(title,subtitle=""){
  return `<div class="settings-backbar">
    <button type="button" class="settings-back-button" onclick="go('settings')">
      <span>←</span>
      <div>
        <b>Повернутися до налаштувань</b>
        <small>головний екран налаштувань</small>
      </div>
    </button>
    <div class="settings-back-context">
      <span>НАЛАШТУВАННЯ</span>
      <h2>${esc(title)}</h2>
      ${subtitle?`<p>${esc(subtitle)}</p>`:""}
    </div>
  </div>`;
}

function renderLessonTypes(){
  $("#page-lessonTypes").innerHTML=`${settingsBackBar("Види занять і правила годин","Лекції, практичні, лабораторні, іспити та правила підрахунку навантаження.")}
  <div class="card section settings-subpage-card">
    <div class="section-head"><div><h2>Види занять</h2><div class="small">Правило підрахунку можна змінити для будь-якого виду.</div></div><button class="primary" onclick="openLessonTypeModal()">+ Додати вид</button></div>
    ${db.lessonTypes.map(x=>`<div class="mode-card"><div><b>${esc(x.name)}</b><p>${formatMode(x.countMode)}${x.defaultUnit?` · базове значення: ${esc(x.defaultUnit)}`:""}${x.description?` · ${esc(x.description)}`:""}</p></div><div class="actions"><button onclick="openLessonTypeModal(${x.id})">Редагувати</button><button onclick="deleteLessonType(${x.id})">Видалити</button></div></div>`).join("")}
  </div>`;
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
  $("#planLoadForm").onsubmit=e=>{e.preventDefault();const groups=[...$("#plGroups").selectedOptions].map(o=>o.value);if(!groups.length)return alert("Оберіть хоча б одну групу.");const created=[],skipped=[];groups.forEach(group=>{const exists=db.disciplines.some(d=>Number(d.sourceCurriculumId)===Number(c.id)&&Number(d.sourceComponentId)===Number(comp.id)&&Number(d.sourceRowId)===Number(r.id)&&d.group===group);if(exists){skipped.push(group);return;}db.disciplines.push({id:uid(db.disciplines),name:comp.name,course:c.course,group,semester:Number(r.semester),academicYear:c.academicYear,teacherIds:[],teacherLoads:{},teacherStudentLoads:{},controlForm:r.control,color:"#8b5cf6",hours:planRowToHours(r),note:"",status:"active",sourceCurriculumId:c.id,sourceComponentId:comp.id,sourceRowId:r.id,planMeta:{credits:r.credits,totalHours:r.totalHours,auditoriumHours:r.auditoriumHours,auditoriumPlanHours:r.auditoriumPlanHours,selfStudy:r.selfStudy,practice:r.practice,weekly:r.weekly}});created.push(group);});save();closeModal();alert(`Створено: ${created.length}${skipped.length?`. Уже існувало: ${skipped.join(", ")}`:""}`);go("disciplines");};
}

let disciplineExtraDraft=null;
let disciplineStudentAllocationDraft=null;
function disciplineBaseHoursById(d,typeId){return num(d?.hours?.[typeId]);}
function disciplineExtraHoursById(d,typeId){
  const source=(window.__disciplineDraft===d&&disciplineExtraDraft!==null)?disciplineExtraDraft:(d?.extraHours||{});
  return num(source?.[typeId]);
}
function lessonTypeById(typeId){
  return db.lessonTypes.find(lt=>String(lt.id)===String(typeId))||null;
}
function isPerStudentTypeId(typeId){
  const lt=lessonTypeById(typeId);
  if(!lt)return false;
  return lt.countMode==="per_student"
    ||normIdentity(lt.name||"").includes("консультац");
}
function disciplineUnitHoursById(d,typeId){
  return disciplineBaseHoursById(d,typeId)+disciplineExtraHoursById(d,typeId);
}
function disciplineTotalHoursById(d,typeId){
  const unit=disciplineUnitHoursById(d,typeId);
  return isPerStudentTypeId(typeId)?unit*groupStudentCount(d?.group):unit;
}
function perStudentUnitHours(d,typeId){
  return isPerStudentTypeId(typeId)?disciplineUnitHoursById(d,typeId):0;
}
function studentAllocationSource(d){
  return (window.__disciplineDraft===d&&disciplineStudentAllocationDraft!==null)
    ?disciplineStudentAllocationDraft
    :(d?.teacherStudentLoads||{});
}
function studentAssignmentKeyExists(d,teacherId,typeId){
  const source=studentAllocationSource(d);
  const byTeacher=source?.[String(teacherId)]||source?.[Number(teacherId)];
  return !!byTeacher&&Object.prototype.hasOwnProperty.call(byTeacher,String(typeId));
}
function persistedStudentAssignmentExists(d,teacherId,typeId){
  const byTeacher=d?.teacherStudentLoads?.[String(teacherId)]||d?.teacherStudentLoads?.[Number(teacherId)];
  return !!byTeacher&&Object.prototype.hasOwnProperty.call(byTeacher,String(typeId));
}
function persistedAssignedStudentIds(d,teacherId,typeId){
  const byTeacher=d?.teacherStudentLoads?.[String(teacherId)]||d?.teacherStudentLoads?.[Number(teacherId)]||{};
  if(!Object.prototype.hasOwnProperty.call(byTeacher,String(typeId)))return [];
  return [...new Set((byTeacher[String(typeId)]||[]).map(Number).filter(Boolean))];
}
function scheduledHintStudentIds(d,teacherId,typeId){
  const lt=lessonTypeById(typeId);
  if(!lt)return [];
  return [...new Set(
    db.schedule
      .filter(x=>x.specialSchedule
        &&Number(x.disciplineId)===Number(d?.id)
        &&Number(x.teacherId)===Number(teacherId)
        &&x.type===lt.name
        &&x.studentId)
      .map(x=>Number(x.studentId))
  )];
}
function legacyPerStudentTarget(d,teacherId,typeId){
  const unit=perStudentUnitHours(d,typeId);
  const load=explicitTeacherLoad(d,teacherId);
  const hours=num(load?.[typeId]);
  if(unit<=0||hours<=0)return {hours,count:0};
  return {hours,count:Math.max(0,Math.round(hours/unit))};
}

function assignedStudentIds(d,teacherId,typeId){
  if(window.__disciplineDraft===d&&disciplineStudentAllocationDraft!==null){
    const byTeacher=disciplineStudentAllocationDraft?.[String(teacherId)]||{};
    if(Object.prototype.hasOwnProperty.call(byTeacher,String(typeId))){
      return [...new Set((byTeacher[String(typeId)]||[]).map(Number).filter(Boolean))];
    }
  }

  if(persistedStudentAssignmentExists(d,teacherId,typeId)){
    return persistedAssignedStudentIds(d,teacherId,typeId);
  }

  // Legacy entries are NOT a completed assignment.
  // They are only preselected hints when the administrator opens the picker.
  return scheduledHintStudentIds(d,teacherId,typeId);
}
function assignedStudents(d,teacherId,typeId){
  const ids=new Set(assignedStudentIds(d,teacherId,typeId));
  return studentsForGroup(d.group).filter(s=>ids.has(Number(s.id)));
}
function assignedStudentTeacherId(d,typeId,studentId,excludeTeacherId=null){
  const source=studentAllocationSource(d);
  const teacherIds=new Set([
    ...Object.keys(source||{}).map(Number),
    ...(d?.teacherIds||[]).map(Number)
  ]);
  for(const tid of teacherIds){
    if(excludeTeacherId!==null&&Number(tid)===Number(excludeTeacherId))continue;
    if(assignedStudentIds(d,tid,typeId).includes(Number(studentId)))return Number(tid);
  }
  return null;
}
function individualStudentLimit(d,lt){
  if(!d||!lt||!isPerStudentTypeId(lt.id))return 0;
  return perStudentUnitHours(d,lt.id);
}
function individualStudentUsage(d,t,lt,studentId,ignoreId=null){
  const limit=individualStudentLimit(d,lt);
  const used=scheduledStudentLoad(d.id,t.id,lt.name,studentId,ignoreId);
  return {
    limit,
    used,
    remaining:Math.max(0,limit-used),
    meetings:used,
    maxMeetings:limit,
    complete:limit>0&&used>=limit-.001
  };
}

function scheduledStudentLoad(disciplineId,teacherId,typeName,studentId,ignoreId=null){
  return db.schedule
    .filter(s=>s.id!==ignoreId
      &&Number(s.disciplineId)===Number(disciplineId)
      &&Number(s.teacherId)===Number(teacherId)
      &&s.type===typeName
      &&Number(s.studentId)===Number(studentId))
    .reduce((a,s)=>a+num(s.workloadHours),0);
}
function disciplineExtraHoursRowsHtml(d){
  const extra=disciplineExtraDraft||{},ids=Object.keys(extra).filter(id=>num(extra[id])>0&&db.lessonTypes.some(lt=>String(lt.id)===String(id)));
  if(!ids.length)return `<div class="extra-hours-empty">Додаткових видів занять ще немає.</div>`;
  return ids.map(id=>{const lt=db.lessonTypes.find(x=>String(x.id)===String(id)),base=disciplineBaseHoursById(d,id);return `<div class="extra-hour-row" data-extra-type="${esc(id)}"><div class="extra-hour-name"><b>${esc(lt?.name||"Вид занять")}</b><span>${isPerStudentTypeId(id)?`${fmtHours(disciplineUnitHoursById(d,id))} год на одного студента · повний контингент ${groupStudentCount(d.group)} = ${fmtHours(disciplineTotalHoursById(d,id))} год навантаження`:(base?`у плані вже ${fmtHours(base)} год · додаємо окремо`:"додатково до робочого плану")}</span></div><label>Додатково, год<input data-extra-hours type="number" min="0" step="0.01" value="${esc(extra[id])}"></label><button type="button" class="extra-hour-remove" onclick="removeDisciplineExtraType('${String(id).replaceAll("'","\\'")}')">×</button></div>`;}).join("");
}
function renderDisciplineExtraHours(d){const box=$("#disciplineExtraHours");if(box)box.innerHTML=disciplineExtraHoursRowsHtml(d);$$('#disciplineExtraHours [data-extra-hours]').forEach(inp=>{inp.oninput=()=>{const row=inp.closest("[data-extra-type]");if(row)disciplineExtraDraft[row.dataset.extraType]=num(inp.value);renderAllocationEditor(d);};});}
function addDisciplineExtraType(){const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;if(!d)return;const typeId=$("#disciplineExtraTypePicker")?.value,hours=num($("#disciplineExtraTypeHours")?.value);if(!typeId)return alert("Оберіть вид занять.");if(hours<=0)return alert("Вкажіть кількість годин.");disciplineExtraDraft=disciplineExtraDraft||{};disciplineExtraDraft[typeId]=num(disciplineExtraDraft[typeId])+hours;renderDisciplineExtraHours(d);renderAllocationEditor(d);if($("#disciplineExtraTypeHours"))$("#disciplineExtraTypeHours").value="";}
function removeDisciplineExtraType(typeId){const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;if(!d)return;const lt=db.lessonTypes.find(x=>String(x.id)===String(typeId)),allocated=Object.values(disciplineAllocationDraft||{}).reduce((sum,load)=>sum+num(load?.[typeId]),0),base=disciplineBaseHoursById(d,typeId),scheduled=lt?db.schedule.filter(s=>Number(s.disciplineId)===Number(d.id)&&s.type===lt.name).reduce((a,s)=>a+num(s.workloadHours),0):0;if(allocated>base+.001||scheduled>base+.001)return alert("Цей додатковий вид уже розподілений або використаний у розкладі. Спочатку зменш навантаження / видали відповідні записи.");delete disciplineExtraDraft[typeId];renderDisciplineExtraHours(d);renderAllocationEditor(d);}

function isAuditoriumPairType(lt){
  if(!lt)return false;
  if(lt.countMode==="academic_pair")return true;
  const name=normIdentity(lt.name);
  return ["лекція", "семінар", "практичне", "лабораторне"].includes(name);
}
function auditoriumLessonTypes(){return db.lessonTypes.filter(isAuditoriumPairType);}
function disciplinePlannedTypes(d){return db.lessonTypes.filter(lt=>disciplineTotalHoursById(d,lt.id)>0);}
function disciplineAuditoriumPlan(d){return db.lessonTypes.filter(isAuditoriumPairType).reduce((a,lt)=>a+disciplineTotalHoursById(d,lt.id),0);}
function disciplineAllocatedForType(d,typeId){
  return Object.values(d?.teacherLoads||{}).reduce((a,load)=>a+num(load?.[typeId]),0);
}
function disciplineWorkloadPlan(d){return disciplinePlannedTypes(d).reduce((a,lt)=>a+disciplineTotalHoursById(d,lt.id),0);}
function disciplineWorkloadAllocated(d){return disciplinePlannedTypes(d).reduce((a,lt)=>a+disciplineAllocatedForType(d,lt.id),0);}
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
let loadPageState={...rememberedLoadPageState()};

function disciplineLoadState(d){
  const plan=disciplineWorkloadPlan(d);
  const allocated=disciplineWorkloadAllocated(d);
  let status="noaud";
  if(plan>0){
    if(allocated>plan+0.001)status="over";
    else if(Math.abs(allocated-plan)<=0.001)status="done";
    else status="attention";
  }
  return {
    plan,
    allocated,
    remaining:Math.max(0,plan-allocated),
    status,
    percent:plan>0?Math.min(100,Math.max(0,(allocated/plan)*100)):0
  };
}
function loadPageRows(){
  return db.disciplines
    .filter(d=>d.status!=="archived")
    .slice()
    .sort((a,b)=>(a.course||groupCourse(a.group)||99)-(b.course||groupCourse(b.group)||99)
      ||String(a.group||"").localeCompare(String(b.group||""),"uk")
      ||Number(a.semester||99)-Number(b.semester||99)
      ||a.name.localeCompare(b.name,"uk"));
}
function loadPageActiveGroups(rows=loadPageRows()){
  const codes=[...new Set(rows.map(d=>d.group).filter(Boolean))];
  return codes.map(code=>{
    const g=db.groups.find(x=>normIdentity(x.code)===normIdentity(code))||{code,course:groupCourse(code)||99};
    const disciplines=rows.filter(d=>normIdentity(d.group)===normIdentity(code));
    const states=disciplines.map(d=>disciplineLoadState(d));
    return {
      ...g,
      disciplines,
      total:disciplines.length,
      done:states.filter(x=>x.status==="done"||x.status==="noaud").length,
      attention:states.filter(x=>x.status==="attention"||x.status==="over").length
    };
  }).sort((a,b)=>(a.course||99)-(b.course||99)||String(a.code).localeCompare(String(b.code),"uk"));
}
function loadGroupCardHtml(g,selected){
  const isSelected=normIdentity(g.code)===normIdentity(selected);
  return `<button type="button" class="load-group-card course-${esc(g.course)} ${isSelected?"active":""} ${g.attention?"needs-attention":""}" onclick="selectLoadGroup('${String(g.code).replaceAll("'","\\'")}')">
    <div class="load-group-card-top">
      <div>
        <b>${esc(g.code)}</b>
        <span>${esc(g.course||"—")} курс · ${groupStudentCount(g.code)} студентів</span>
      </div>
      ${g.attention?`<strong>${g.attention}</strong>`:`<strong class="done">✓</strong>`}
    </div>
    <div class="load-group-card-stats">
      <span><b>${g.total}</b> дисциплін</span>
      <span class="ok"><b>${g.done}</b> готово</span>
      <span class="${g.attention?"warn":"muted"}"><b>${g.attention}</b> уваги</span>
    </div>
  </button>`;
}
function loadGroupBoardHtml(groups,selected){
  const courses=[...new Set(groups.map(g=>g.course||"—"))];
  return `<div class="load-group-board">
    ${courses.map(course=>{
      const list=groups.filter(g=>(g.course||"—")===course);
      return `<div class="load-course-section">
        <div class="load-course-label">${esc(course)} курс</div>
        <div class="load-group-cards">${list.map(g=>loadGroupCardHtml(g,selected)).join("")}</div>
      </div>`;
    }).join("")}
  </div>`;
}
function loadPageSelectedGroup(groups){
  const remembered=loadPageState.group;
  if(remembered&&groups.some(g=>normIdentity(g.code)===normIdentity(remembered)))return groups.find(g=>normIdentity(g.code)===normIdentity(remembered)).code;
  const withAttention=groups.find(g=>g.attention>0);
  return withAttention?.code||groups[0]?.code||"";
}
function selectLoadGroup(group){
  loadPageState.group=group;
  loadPageState.semester="all";
  rememberLoadPageState();
  renderDisciplines();
}
function setLoadPageFilter(filter){
  loadPageState.filter=["all","attention","done"].includes(filter)?filter:"all";
  rememberLoadPageState();
  renderLoadDisciplinePanel();
}
function setLoadPageSemester(semester){
  loadPageState.semester=semester||"all";
  rememberLoadPageState();
  renderLoadDisciplinePanel();
}
function loadDisciplineMatchesFilter(d){
  const s=disciplineLoadState(d);
  if(loadPageState.filter==="attention")return s.status==="attention"||s.status==="over";
  if(loadPageState.filter==="done")return s.status==="done"||s.status==="noaud";
  return true;
}
function loadDisciplineStatusHtml(d){
  const s=disciplineLoadState(d);
  if(s.status==="noaud"){
    return `<div class="load-progress-status"><span class="badge">БЕЗ АУД. ПАР</span><div class="small">Немає годин навантаження для розподілу.</div></div>`;
  }
  const cls=s.status==="done"?"ok":s.status==="over"?"bad":"warn";
  const title=s.status==="done"?"РОЗПОДІЛЕНО":s.status==="over"?"ПЕРЕРОЗПОДІЛЕНО":"ПОТРЕБУЄ РОЗПОДІЛУ";
  return `<div class="load-progress-status">
    <div class="load-progress-status-top"><span class="badge ${cls}">${title}</span><b>${fmtHours(s.allocated)} / ${fmtHours(s.plan)} год</b></div>
    <div class="load-progress-track"><i class="${cls}" style="width:${Math.min(100,s.percent)}%"></i></div>
    <div class="small">${s.status==="done"?"Усе навантаження розподілено.":s.status==="over"?`Перевищено на ${fmtHours(s.allocated-s.plan)} год.`:`Залишилось ${fmtHours(s.remaining)} год.`}</div>
  </div>`;
}
function readyExternalRowsForGroup(group){
  return db.schedule
    .filter(x=>isReadyExternalScheduleItem(x)&&dateInBounds(x.date))
    .filter(x=>scheduleIncludesGroup(x,group));
}
function readyExternalDisciplineSummaries(group){
  const rows=readyExternalRowsForGroup(group);
  const plans=readyPlanRecords(group).filter(rec=>rec.scope==="external");
  const map=new Map();
  const keyFor=(name,semester)=>`${normIdentity(name)}|${String(semester||"")}`;

  plans.forEach(rec=>{
    const key=keyFor(rec.name,rec.semester);
    map.set(key,{
      key,planRef:rec.ref,group,discipline:rec.name,semester:rec.semester||null,rows:[],
      sourceCurriculumId:rec.curriculumId||null,sourceComponentId:rec.componentId||null
    });
  });

  rows.forEach(x=>{
    let semester=x.sourceSemester||null;
    let matchingPlan=null;
    if(!semester){
      const matches=plans.filter(p=>normIdentity(p.name)===normIdentity(x.discipline));
      if(matches.length===1){matchingPlan=matches[0];semester=matchingPlan.semester;}
    }else{
      matchingPlan=plans.find(p=>normIdentity(p.name)===normIdentity(x.discipline)&&Number(p.semester)===Number(semester))||null;
    }
    const key=keyFor(x.discipline||"Без назви",semester);
    if(!map.has(key)){
      map.set(key,{
        key,planRef:matchingPlan?.ref||x.sourcePlanRef||"",group,
        discipline:x.discipline||"Без назви",semester:semester||null,rows:[],
        sourceCurriculumId:matchingPlan?.curriculumId||x.sourceCurriculumId||null,
        sourceComponentId:matchingPlan?.componentId||x.sourceComponentId||null
      });
    }
    map.get(key).rows.push(x);
  });

  return [...map.values()].map(s=>{
    const teachers=[...new Set(s.rows.map(x=>x.teacher).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"uk"));
    const types=[...new Set(s.rows.map(x=>x.type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"uk"));
    const hours=s.rows.reduce((sum,x)=>sum+readyAcademicHours(x),0);
    return {...s,teachers,types,hours,pairs:s.rows.length};
  }).sort((a,b)=>Number(a.semester||99)-Number(b.semester||99)||a.discipline.localeCompare(b.discipline,"uk"));
}
function compactTeacherChips(names=[]){
  if(!names.length)return `<span class="teacher-palette-chip empty">ще не вказано</span>`;
  return `<div class="teacher-palette-chips">${names.map((name,i)=>`<span class="teacher-palette-chip shade-${(i%3)+1}">${esc(name)}</span>`).join("")}</div>`;
}
function readyExternalDisciplineCardHtml(s){
  return `<article class="load-discipline-row load-discipline-card ready-external-load-card" style="${scheduleColorVars({group:s.group,discipline:s.discipline})}">
    <div class="compact-discipline-head">
      <div class="load-discipline-title">
        <span class="load-discipline-color"></span>
        <div>
          <b>${esc(s.discipline)}</b>
          <span>${s.semester?`${esc(s.semester)} семестр · `:""}інша кафедра / готовий розклад</span>
        </div>
      </div>
      <span class="compact-source-badge">НЕ КАФЕДРАЛЬНА</span>
    </div>

    <div class="compact-discipline-teachers">
      <span>Викладачі</span>
      ${compactTeacherChips(s.teachers)}
    </div>

    <div class="ready-load-stats">
      <div><b>${s.pairs}</b><span>пар внесено</span></div>
      <div><b>${fmtHours(s.hours)}</b><span>акад. год</span></div>
      <div><b>${s.types.length}</b><span>видів занять</span></div>
    </div>

    <div class="compact-discipline-actions">
      <button class="secondary" data-group="${esc(s.group)}" data-discipline="${esc(s.discipline)}" data-semester="${esc(s.semester||"")}" data-ref="${esc(s.planRef||"")}" onclick="openReadyExternalManager(this.dataset.group,this.dataset.discipline,this.dataset.semester,this.dataset.ref)">${s.pairs?"Редагувати пари":"Відкрити дисципліну"}</button>
      <button class="primary-inline" data-group="${esc(s.group)}" data-discipline="${esc(s.discipline)}" data-ref="${esc(s.planRef||"")}" onclick="openReadyScheduleForDiscipline(this.dataset.group,this.dataset.ref,this.dataset.discipline)">+ Додати</button>
    </div>
  </article>`;
}

function loadDisciplineRowHtml(d){
  const s=disciplineLoadState(d);
  const teacherNames=explicitlyAllocatedTeacherIds(d)
    .map(id=>teacherDisplay(teacherById(id)))
    .filter(Boolean);

  return `<article class="load-discipline-row load-discipline-card ${s.status}" style="${scheduleColorVars({group:d.group,discipline:d.name})}">
    <div class="compact-discipline-head">
      <div class="load-discipline-title">
        <span class="load-discipline-color"></span>
        <div>
          <b>${esc(d.name)}</b>
          <span>${d.semester?`${esc(d.semester)} семестр · `:""}${esc(d.controlForm||"без контролю")}</span>
        </div>
      </div>
      <span class="compact-status-badge ${s.status}">${s.status==="done"?"РОЗПОДІЛЕНО":s.status==="over"?"ПЕРЕВИЩЕНО":s.status==="noaud"?"БЕЗ АУД. ПАР":"ПОТРЕБУЄ УВАГИ"}</span>
    </div>

    <div class="compact-discipline-teachers">
      <span>Викладачі</span>
      ${compactTeacherChips(teacherNames)}
    </div>

    <div class="load-discipline-progress">${loadDisciplineStatusHtml(d)}</div>

    <div class="compact-discipline-actions">
      <button class="${s.status==="done"?"secondary":"primary-inline"}" onclick="openDisciplineModal(${d.id})">${s.status==="done"?"Переглянути":"Розподілити години"}</button>
      <button class="quiet-danger" onclick="deleteDiscipline(${d.id})">Видалити</button>
    </div>
  </article>`;
}
function renderLoadDisciplinePanel(){
  const box=$("#loadDisciplinePanel");
  if(!box)return;

  const rows=loadPageRows();
  const group=loadPageState.group;
  const allForGroup=rows.filter(d=>normIdentity(d.group)===normIdentity(group));
  const semesters=[...new Set(allForGroup.map(d=>d.semester).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));

  if(loadPageState.semester!=="all"&&!semesters.some(s=>String(s)===String(loadPageState.semester))){
    loadPageState.semester="all";
  }

  let filtered=allForGroup.filter(loadDisciplineMatchesFilter);
  if(loadPageState.semester!=="all"){
    filtered=filtered.filter(d=>String(d.semester)===String(loadPageState.semester));
  }

  const counts={
    all:allForGroup.length,
    attention:allForGroup.filter(d=>["attention","over"].includes(disciplineLoadState(d).status)).length,
    done:allForGroup.filter(d=>["done","noaud"].includes(disciplineLoadState(d).status)).length
  };
  const g=db.groups.find(x=>normIdentity(x.code)===normIdentity(group));
  const course=g?.course||groupCourse(group)||"—";

  box.innerHTML=`<div class="load-selected-group-head">
      <div>
        <span>Відкрита група</span>
        <h3>${esc(group)} · ${esc(course)} курс</h3>
        <div class="small">${groupStudentCount(group)} студентів · ${counts.all} кафедральних · ${readyExternalDisciplineSummaries(group).length} інших дисциплін</div>
      </div>
      <div class="load-filter-tabs">
        <button class="${loadPageState.filter==="all"?"active":""}" onclick="setLoadPageFilter('all')">Усі <b>${counts.all}</b></button>
        <button class="${loadPageState.filter==="attention"?"active attention":""}" onclick="setLoadPageFilter('attention')">Потребують уваги <b>${counts.attention}</b></button>
        <button class="${loadPageState.filter==="done"?"active":""}" onclick="setLoadPageFilter('done')">Розподілено <b>${counts.done}</b></button>
      </div>
    </div>

    ${semesters.length>1?`<div class="load-semester-tabs">
      <button class="${loadPageState.semester==="all"?"active":""}" onclick="setLoadPageSemester('all')">Усі семестри</button>
      ${semesters.map(s=>`<button class="${String(loadPageState.semester)===String(s)?"active":""}" onclick="setLoadPageSemester('${esc(s)}')">${esc(s)} семестр</button>`).join("")}
    </div>`:""}

    <div class="load-discipline-list">
      ${filtered.length
        ? filtered.map(loadDisciplineRowHtml).join("")
        : `<div class="empty load-filter-empty">${loadPageState.filter==="attention"?"У цій групі зараз немає дисциплін, які потребують розподілу.":"За вибраним фільтром кафедральних дисциплін немає."}</div>`}
    </div>

    ${loadPageState.filter==="all"?(()=>{
      const ready=readyExternalDisciplineSummaries(group);
      return ready.length?`<section class="ready-load-section">
        <div class="ready-load-section-head">
          <div>
            <span>ОКРЕМИЙ БЛОК</span>
            <h3>Інші кафедри / готовий розклад</h3>
            <p>Ці дисципліни існують у розкладі групи, але не входять у кафедральне навантаження наших викладачів.</p>
          </div>
          <button class="ready-import-btn" onclick="openReadyScheduleModal()">+ Внести готові пари</button>
        </div>
        <div class="load-discipline-list ready-load-grid">${ready.map(readyExternalDisciplineCardHtml).join("")}</div>
      </section>`:"";
    })():""}`;
}
function renderDisciplines(){
  const rows=loadPageRows();
  const groups=loadPageActiveGroups(rows);

  if(!rows.length){
    $("#page-disciplines").innerHTML=`<div class="card section">
      <div class="section-head">
        <div>
          <h2>Навантаження</h2>
          <div class="small">Після активації дисциплін із навчальних планів вони з’являться тут за групами.</div>
        </div>
        <button class="primary" onclick="openDisciplineModal()">+ Додати дисципліну</button>
      </div>
      <div class="empty">Активованих дисциплін ще немає.</div>
    </div>`;
    return;
  }

  const selected=loadPageSelectedGroup(groups);
  loadPageState.group=selected;
  rememberLoadPageState();

  const totalAttention=groups.reduce((sum,g)=>sum+g.attention,0);
  const totalDone=groups.reduce((sum,g)=>sum+g.done,0);

  const byCourse=[...new Set(groups.map(g=>Number(g.course)||99))]
    .sort((a,b)=>a-b)
    .map(course=>({
      course,
      groups:groups.filter(g=>(Number(g.course)||99)===course)
    }));

  $("#page-disciplines").innerHTML=`<div class="load-workspace">
    <div class="load-workspace-head">
      <div>
        <h1>Навантаження</h1>
        <p>Спочатку обери групу. На сторінці одночасно показуються дисципліни тільки однієї групи.</p>
      </div>
      <button class="primary" onclick="openDisciplineModal()">+ Додати дисципліну</button>
    </div>

    <div class="load-overview-strip">
      <div><b>${groups.length}</b><span>груп</span></div>
      <div><b>${rows.length}</b><span>кафедральних дисциплін</span></div>
      <div class="${totalAttention?"attention":""}"><b>${totalAttention}</b><span>потребують уваги</span></div>
      <div class="done"><b>${totalDone}</b><span>розподілено</span></div>
    </div>

    <div class="load-group-selector">
      <div class="load-group-selector-head">
        <div>
          <span>КРОК 1</span>
          <h2>Оберіть групу</h2>
        </div>
        <small>Групи автоматично розкладені за курсами.</small>
      </div>

      <div class="load-course-groups">
        ${byCourse.map(block=>`<section class="load-course-block">
          <div class="load-course-block-title">${esc(block.course)} курс</div>
          <div class="load-course-block-cards">
            ${block.groups.map(g=>loadGroupCardHtml(g,selected)).join("")}
          </div>
        </section>`).join("")}
      </div>
    </div>

    <div class="load-group-content-head">
      <span>КРОК 2</span>
      <h2>Дисципліни вибраної групи</h2>
    </div>

    <div id="loadDisciplinePanel" class="load-discipline-panel"></div>
  </div>`;

  renderLoadDisciplinePanel();
}
let disciplineAllocationDraft={};
let disciplineAllocationId=null;
function cloneStudentAllocationLoads(d){
  const out={};

  // Only explicitly saved assignments create real draft keys.
  Object.entries(d?.teacherStudentLoads||{}).forEach(([tid,byType])=>{
    out[String(tid)]={};
    Object.entries(byType||{}).forEach(([typeId,ids])=>{
      out[String(tid)][String(typeId)]=[...new Set((ids||[]).map(Number).filter(Boolean))];
    });
  });

  return out;
}
function draftStudentKeyExists(teacherId,typeId){
  const byTeacher=disciplineStudentAllocationDraft?.[String(teacherId)];
  return !!byTeacher&&Object.prototype.hasOwnProperty.call(byTeacher,String(typeId));
}
function syncPerStudentAllocationLoads(d){
  if(!disciplineStudentAllocationDraft)return;
  Object.keys(disciplineAllocationDraft||{}).forEach(tid=>{
    disciplineAllocationDraft[tid]=disciplineAllocationDraft[tid]||{};
    db.lessonTypes.filter(lt=>isPerStudentTypeId(lt.id)).forEach(lt=>{
      // Old numeric distributions are kept until the administrator explicitly opens
      // the student picker and chooses concrete students.
      if(!draftStudentKeyExists(tid,lt.id))return;
      const ids=disciplineStudentAllocationDraft[String(tid)][String(lt.id)]||[];
      disciplineAllocationDraft[tid][lt.id]=ids.length*perStudentUnitHours(d,lt.id);
    });
  });
}

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
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;
  if(d)syncPerStudentAllocationLoads(d);
}
function allocationDraftTotal(typeId,excludeTid=null){
  return Object.entries(disciplineAllocationDraft||{}).reduce((sum,[tid,load])=>String(tid)===String(excludeTid)?sum:sum+num(load?.[typeId]),0);
}
function allocationSummaryHtml(d){
  const types=disciplinePlannedTypes(d);
  if(!types.length)return `<div class="empty">У плані немає годин для розподілу.</div>`;
  return `<div class="allocation-summary-grid">${types.map(lt=>{
    const plan=disciplineTotalHoursById(d,lt.id),allocated=allocationDraftTotal(lt.id),remaining=plan-allocated;
    const cls=remaining<-.001?"bad":Math.abs(remaining)<=.001?"ok":"warn";
    const formula=isPerStudentTypeId(lt.id)?`${fmtHours(perStudentUnitHours(d,lt.id))} год × ${groupStudentCount(d.group)} студентів`:"";
    return `<div class="allocation-summary-item"><span>${esc(lt.name)}</span><b>${fmtHours(allocated)} / ${fmtHours(plan)}</b>${formula?`<em>${esc(formula)}</em>`:""}<small class="${cls}">${remaining<-.001?`перевищено ${fmtHours(-remaining)}`:`залишилось ${fmtHours(Math.max(0,remaining))}`} год</small></div>`;
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
function perStudentAllocationStatus(d,tid,lt){
  const ids=assignedStudentIds(d,tid,lt.id);
  const unit=perStudentUnitHours(d,lt.id);
  const legacyHours=num(disciplineAllocationDraft?.[String(tid)]?.[lt.id]);
  const legacyTarget=legacyPerStudentTarget(d,tid,lt.id);
  const explicit=persistedStudentAssignmentExists(d,tid,lt.id)||draftStudentKeyExists(tid,lt.id);
  const hints=scheduledHintStudentIds(d,tid,lt.id);
  return {
    ids,count:ids.length,unit,total:ids.length*unit,
    groupCount:groupStudentCount(d.group),
    unresolved:!explicit&&legacyHours>0,
    legacyHours,
    targetCount:legacyTarget.count,
    hintCount:hints.length,
    missing:Math.max(0,legacyTarget.count-ids.length)
  };
}
function perStudentAllocationPickerHtml(d,tid,lt){
  const current=new Set(assignedStudentIds(d,tid,lt.id));
  return `<div class="student-load-picker">${studentsForGroup(d.group).map(s=>{
    const otherTid=assignedStudentTeacherId(d,lt.id,s.id,tid);
    const other=otherTid?teacherById(otherTid):null;
    const checked=current.has(Number(s.id));
    const used=scheduledStudentLoad(d.id,Number(tid),lt.name,s.id);
    return `<button type="button"
      class="student-load-option ${checked?"active":""} ${other?"taken":""}"
      ${other?"disabled":""}
      onclick="togglePerStudentAllocation(${tid},${lt.id},${s.id})">
      <div>
        <b>${esc(s.name)}</b>
        <span>${other
          ?`уже закріплено: ${esc(teacherDisplay(other))}`
          :checked
            ?`${fmtHours(perStudentUnitHours(d,lt.id))} год на студента${used?` · уже виставлено ${fmtHours(used)} год`:""}`
            :"вільний для розподілу"}</span>
      </div>
      <strong>${other?"—":checked?"✓":"+"}</strong>
    </button>`;
  }).join("")}</div>`;
}
function openPerStudentAllocationPopup(tid,typeId){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;
  const lt=lessonTypeById(typeId),t=teacherById(Number(tid));
  if(!d||!lt||!t)return;
  captureAllocationDraft();

  disciplineStudentAllocationDraft=disciplineStudentAllocationDraft||{};
  disciplineStudentAllocationDraft[String(tid)]=disciplineStudentAllocationDraft[String(tid)]||{};

  // First opening: existing appointments are only a useful preselection.
  // The administrator still sees the ENTIRE group and completes the assignment.
  if(!Object.prototype.hasOwnProperty.call(disciplineStudentAllocationDraft[String(tid)],String(typeId))){
    disciplineStudentAllocationDraft[String(tid)][String(typeId)]=scheduledHintStudentIds(d,tid,typeId);
  }

  const s=perStudentAllocationStatus(d,tid,lt);
  openPlannerActionModal(`<div class="student-load-popup">
    <div class="student-load-popup-head">
      <div>
        <span>ПЕРСОНАЛЬНЕ НАВАНТАЖЕННЯ</span>
        <h2>${esc(teacherDisplay(t))}</h2>
        <p>${esc(d.name)} · ${esc(d.group)} · ${esc(lt.name)}</p>
      </div>
      <div class="student-load-formula">
        <b>${fmtHours(s.unit)} год</b>
        <span>на одного студента</span>
      </div>
    </div>

    <div class="student-load-popup-tools">
      <div><b id="studentLoadSelectedCount">${s.count}</b><span>обрано з ${s.groupCount}</span></div>
      <div><b id="studentLoadTotalHours">${fmtHours(s.total)} год</b><span>навантаження викладача</span></div>
      <button type="button" class="secondary" onclick="selectAllAvailablePerStudent(${tid},${typeId})">Обрати всіх вільних</button>
      <button type="button" class="secondary" onclick="clearPerStudentAllocation(${tid},${typeId})">Очистити</button>
    </div>

    ${s.legacyHours>0?`<div class="student-load-target" id="studentLoadTarget">
      <div>
        <span>ПОПЕРЕДНЄ НАВАНТАЖЕННЯ</span>
        <b>${fmtHours(s.legacyHours)} год = приблизно ${s.targetCount} студент(ів)</b>
      </div>
      <p>${s.hintCount
        ?`Із уже створеного розкладу я знайшов ${s.hintCount} студент(ів) і попередньо відмітив їх. Це <b>не весь список</b> — перевір і закріпи всіх потрібних.`
        :`Тепер ці години треба розкласти на конкретних студентів. Вибери тих, за кого відповідає цей викладач.`}</p>
    </div>`:""}

    <div id="studentLoadPicker">${perStudentAllocationPickerHtml(d,tid,lt)}</div>

    <div class="planner-popup-footer">
      <button type="button" class="primary" onclick="${window.__directStudentAssignment?`saveDirectStudentAssignment(${tid},${typeId})`:`applyPerStudentAllocation(${tid},${typeId})`}">
        ${window.__directStudentAssignment?"Зберегти закріплення":"Застосувати розподіл"}
      </button>
    </div>
  </div>`,true);
}
function refreshPerStudentPopup(tid,typeId){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft,lt=lessonTypeById(typeId);
  if(!d||!lt)return;
  const s=perStudentAllocationStatus(d,tid,lt);
  if($("#studentLoadPicker"))$("#studentLoadPicker").innerHTML=perStudentAllocationPickerHtml(d,tid,lt);
  if($("#studentLoadSelectedCount"))$("#studentLoadSelectedCount").textContent=s.count;
  if($("#studentLoadTotalHours"))$("#studentLoadTotalHours").textContent=`${fmtHours(s.total)} год`;
  const target=$("#studentLoadTarget");
  if(target&&s.legacyHours>0){
    const p=target.querySelector("p");
    if(p)p.innerHTML=s.missing
      ?`За старим розподілом орієнтир — ${s.targetCount} студент(ів). Зараз обрано ${s.count}; залишилось вибрати ще <b>${s.missing}</b>.`
      :`Зараз обрано ${s.count} студент(ів) = <b>${fmtHours(s.total)} год</b>. Можна зберігати або змінити склад.`;
  }
}
function togglePerStudentAllocation(tid,typeId,studentId){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft,lt=lessonTypeById(typeId);
  if(!d||!lt)return;
  const key=String(tid),typeKey=String(typeId);
  const arr=disciplineStudentAllocationDraft[key][typeKey];
  const pos=arr.map(Number).indexOf(Number(studentId));

  if(pos>=0){
    const used=scheduledStudentLoad(d.id,Number(tid),lt.name,studentId);
    if(used>0)return alert(`Цьому студенту вже виставлено ${fmtHours(used)} год. Спочатку перенеси або видали ці заняття.`);
    arr.splice(pos,1);
  }else{
    const other=assignedStudentTeacherId(d,typeId,studentId,tid);
    if(other)return alert(`Студент уже закріплений за ${teacherDisplay(teacherById(other))}.`);
    arr.push(Number(studentId));
  }

  syncPerStudentAllocationLoads(d);
  refreshPerStudentPopup(tid,typeId);
}
function selectAllAvailablePerStudent(tid,typeId){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;
  if(!d)return;
  const key=String(tid),typeKey=String(typeId);
  const arr=new Set(disciplineStudentAllocationDraft[key][typeKey]||[]);
  studentsForGroup(d.group).forEach(s=>{
    if(!assignedStudentTeacherId(d,typeId,s.id,tid))arr.add(Number(s.id));
  });
  disciplineStudentAllocationDraft[key][typeKey]=[...arr];
  syncPerStudentAllocationLoads(d);
  refreshPerStudentPopup(tid,typeId);
}
function clearPerStudentAllocation(tid,typeId){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft,lt=lessonTypeById(typeId);
  if(!d||!lt)return;
  const locked=assignedStudentIds(d,tid,typeId)
    .filter(sid=>scheduledStudentLoad(d.id,Number(tid),lt.name,sid)>0);
  disciplineStudentAllocationDraft[String(tid)][String(typeId)]=locked;
  syncPerStudentAllocationLoads(d);
  refreshPerStudentPopup(tid,typeId);
  if(locked.length)alert(`${locked.length} студент(ів) залишено, бо для них уже є заняття в розкладі.`);
}
function applyPerStudentAllocation(tid,typeId){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;
  if(!d)return;
  syncPerStudentAllocationLoads(d);
  closePlannerActionModal();
  renderAllocationEditor(d);
}
function perStudentAllocationFieldHtml(d,tid,lt){
  const s=perStudentAllocationStatus(d,tid,lt);
  const persisted=persistedAssignedStudentIds(d,tid,lt.id);
  const names=persisted
    .map(id=>db.students.find(x=>Number(x.id)===Number(id))?.name)
    .filter(Boolean);

  return `<div class="per-student-allocation-card ${s.unresolved?"unresolved":""}">
    <div class="per-student-allocation-copy">
      <b>${esc(lt.name)}</b>
      ${s.unresolved
        ?`<span><strong>${fmtHours(s.legacyHours)} год</strong> зі старого розподілу ≈ ${s.targetCount} студент(ів)</span><small>Потрібно один раз закріпити конкретних студентів за цим викладачем.</small>`
        :`<span>${fmtHours(s.unit)} год × ${s.count} студентів = <strong>${fmtHours(s.total)} год</strong></span><small>${s.count?`${s.count} із ${s.groupCount} студентів закріплено`:"Студентів ще не закріплено"}</small>`}
    </div>

    ${names.length?`<div class="per-student-assigned-preview">
      <span>ЗАКРІПЛЕНІ</span>
      <div>${names.slice(0,5).map(n=>`<b>${esc(n)}</b>`).join("")}${names.length>5?`<strong>+${names.length-5}</strong>`:""}</div>
    </div>`:""}

    <button type="button" class="${s.unresolved?"primary":"secondary"}" onclick="openPerStudentAllocationPopup(${tid},${lt.id})">
      ${s.unresolved?"Закріпити студентів":s.count?"Змінити студентів":"Обрати студентів"}
    </button>
  </div>`;
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
      <div class="hours-grid allocation-hours-grid">${types.map(lt=>{
        const used=scheduledLoad(d.id,Number(tid),lt.name);
        if(isPerStudentTypeId(lt.id))return perStudentAllocationFieldHtml(d,tid,lt);
        return `<label>${esc(lt.name)}<input data-allocation-hour data-type="${lt.id}" type="number" min="${fmtHours(used)}" step="0.01" value="${esc(load[lt.id]||0)}"><span class="small">план дисципліни ${fmtHours(disciplineTotalHoursById(d,lt.id))}${disciplineExtraHoursById(d,lt.id)?` · з них додатково ${fmtHours(disciplineExtraHoursById(d,lt.id))}`:""}${used?` · вже в розкладі ${fmtHours(used)}`:""}</span></label>`;
      }).join("")}</div>
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
  disciplineStudentAllocationDraft=disciplineStudentAllocationDraft||{};
  disciplineStudentAllocationDraft[String(tid)]=disciplineStudentAllocationDraft[String(tid)]||{};
  renderAllocationEditor(disciplineById(disciplineAllocationId)||window.__disciplineDraft);
}
function removeAllocationTeacher(tid){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;if(!d)return;
  captureAllocationDraft();
  const scheduled=db.lessonTypes.reduce((a,lt)=>a+scheduledLoad(d.id,Number(tid),lt.name),0);
  if(scheduled>0)return alert(`Цього викладача не можна прибрати: у розкладі вже виставлено ${fmtHours(scheduled)} год. Спочатку перенеси або видали ці заняття.`);
  delete disciplineAllocationDraft[String(tid)];if(disciplineStudentAllocationDraft)delete disciplineStudentAllocationDraft[String(tid)];renderAllocationEditor(d);
}
function fillTeacherWithRemaining(tid){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;if(!d)return;
  captureAllocationDraft();
  const key=String(tid);disciplineAllocationDraft[key]=disciplineAllocationDraft[key]||{};
  disciplinePlannedTypes(d).forEach(lt=>{
    if(isPerStudentTypeId(lt.id)){
      disciplineStudentAllocationDraft=disciplineStudentAllocationDraft||{};
      disciplineStudentAllocationDraft[key]=disciplineStudentAllocationDraft[key]||{};
      const selected=new Set(disciplineStudentAllocationDraft[key][String(lt.id)]||[]);
      studentsForGroup(d.group).forEach(s=>{
        if(!assignedStudentTeacherId(d,lt.id,s.id,tid))selected.add(Number(s.id));
      });
      disciplineStudentAllocationDraft[key][String(lt.id)]=[...selected];
      return;
    }
    const other=allocationDraftTotal(lt.id,key),plan=disciplineTotalHoursById(d,lt.id),alreadyScheduled=scheduledLoad(d.id,Number(tid),lt.name);
    disciplineAllocationDraft[key][lt.id]=Math.max(alreadyScheduled,Math.max(0,plan-other));
  });
  syncPerStudentAllocationLoads(d);
  renderAllocationEditor(d);
}
function validateAllocationDraft(d){
  captureAllocationDraft();
  const errors=[];

  db.lessonTypes.filter(lt=>isPerStudentTypeId(lt.id)).forEach(lt=>{
    const seen=new Map();

    Object.entries(disciplineAllocationDraft||{}).forEach(([tid,load])=>{
      if(num(load?.[lt.id])>0&&!draftStudentKeyExists(tid,lt.id)){
        errors.push(`${teacherDisplay(teacherById(Number(tid)))} · ${lt.name}: години розподілені, але не вказані конкретні студенти.`);
      }
    });

    Object.entries(disciplineStudentAllocationDraft||{}).forEach(([tid,byType])=>{
      (byType?.[String(lt.id)]||[]).forEach(studentId=>{
        const old=seen.get(Number(studentId));
        if(old&&Number(old)!==Number(tid)){
          const s=db.students.find(x=>Number(x.id)===Number(studentId));
          errors.push(`${lt.name}: студент ${s?.name||studentId} закріплений одразу за двома викладачами.`);
        }else{
          seen.set(Number(studentId),Number(tid));
        }
      });
    });
  });
  disciplinePlannedTypes(d).forEach(lt=>{
    const plan=disciplineTotalHoursById(d,lt.id),allocated=allocationDraftTotal(lt.id);
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
  const d=id?disciplineById(id):{id:null,name:"",course:"",group:"",semester:db.semester,academicYear:db.academicYear,teacherIds:[],teacherLoads:{},teacherStudentLoads:{},controlForm:"Немає",color:"#8b5cf6",hours:{},note:"",status:"active"};
  const fromPlan=!!d.sourceCurriculumId,lock=fromPlan?'disabled':'',ro=fromPlan?'readonly':'';
  disciplineAllocationId=id;window.__disciplineDraft=d;disciplineAllocationDraft=cloneAllocationLoads(d);
  disciplineStudentAllocationDraft=cloneStudentAllocationLoads(d);
  disciplineExtraDraft=clone(d.extraHours||{});
  syncPerStudentAllocationLoads(d);
  const hours=db.lessonTypes.map(t=>`<label>${esc(t.name)}<input class="dh" data-type="${t.id}" type="number" min="0" step="0.01" value="${esc(d.hours?.[t.id]||0)}" ${ro}></label>`).join("");
  openModal(`<h2>${id?"Навантаження дисципліни":"Нова дисципліна кафедри"}</h2>${fromPlan?`<div class="notice success-notice"><b>${esc(d.name)}</b> створена з робочого плану. Базові години плану не змінюються; додаткові види занять можна додати окремо нижче.</div>`:""}<form id="df" class="form-grid">
    <label class="wide">Назва дисципліни<input id="dn" value="${esc(d.name)}" required ${ro}></label>
    <label>Група<select id="dg" ${lock}><option value="">—</option>${groupOptions(d.group)}</select></label>
    <label>Курс<select id="dc" ${lock}><option value="">—</option>${[1,2,3,4,5,6].map(x=>`<option ${Number(d.course)===x?"selected":""}>${x}</option>`).join("")}</select></label>
    <label>Навчальний рік<input id="dy" value="${esc(d.academicYear||db.academicYear)}" ${ro}></label>
    <label>Семестр<select id="ds" ${lock}>${[1,2,3,4,5,6,7,8,9,10].map(x=>`<option ${Number(d.semester)===x?"selected":""}>${x}</option>`).join("")}</select></label>
    <label>Форма контролю<select id="dctrl" ${lock}>${db.controlForms.map(v=>`<option ${v===d.controlForm?"selected":""}>${esc(v)}</option>`).join("")}</select></label>
    <label>Колір<input id="dcolor" type="color" value="${esc(d.color||"#8b5cf6")}"></label>
    <div class="wide"><b>Години за робочим планом</b><div class="hours-grid" style="margin-top:8px">${hours}</div></div>
    <div class="wide extra-hours-section"><div class="section-head compact"><div><b>Додаткові види занять</b><div class="small">Додавай години, яких немає у вихідному плані — наприклад індивідуальні або консультації. Вони входять у навантаження, але не змінюють сам робочий план.</div></div></div><div id="disciplineExtraHours"></div><div class="extra-hours-add"><select id="disciplineExtraTypePicker"><option value="">— обрати вид занять —</option>${db.lessonTypes.map(lt=>`<option value="${lt.id}">${esc(lt.name)}</option>`).join("")}</select><input id="disciplineExtraTypeHours" type="number" min="0" step="0.01" placeholder="години"><button type="button" class="primary-inline" id="disciplineExtraTypeAdd">+ Додати вид занять</button></div></div>
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
  renderDisciplineExtraHours(d);
  renderAllocationEditor(d);
  $("#disciplineExtraTypeAdd").onclick=addDisciplineExtraType;
  $("#allocationAddTeacher").onclick=addAllocationTeacher;
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
    syncPerStudentAllocationLoads(d);
    const teacherLoads={};ids.forEach(tid=>{teacherLoads[tid]={};db.lessonTypes.forEach(lt=>teacherLoads[tid][lt.id]=num(disciplineAllocationDraft[String(tid)]?.[lt.id]));});

    const teacherStudentLoads={};
    Object.entries(disciplineStudentAllocationDraft||{}).forEach(([tid,byType])=>{
      const clean={};
      Object.entries(byType||{}).forEach(([typeId,studentIds])=>{
        const arr=[...new Set((studentIds||[]).map(Number).filter(Boolean))];
        if(arr.length||draftStudentKeyExists(tid,typeId))clean[typeId]=arr;
      });
      if(Object.keys(clean).length)teacherStudentLoads[tid]=clean;
    });

    const extraHours={};Object.entries(disciplineExtraDraft||{}).forEach(([k,v])=>{if(num(v)>0)extraHours[k]=num(v);});
    const obj=fromPlan
      ?{teacherIds:ids,teacherLoads,teacherStudentLoads,extraHours,color:$("#dcolor").value,note:$("#dnote").value.trim(),status:"active"}
      :{name:$("#dn").value.trim(),group:$("#dg").value,course:+$("#dc").value||"",academicYear:$("#dy").value.trim(),semester:+$("#ds").value,teacherIds:ids,teacherLoads,teacherStudentLoads,extraHours,controlForm:$("#dctrl").value,color:$("#dcolor").value,hours:hs,note:$("#dnote").value.trim(),status:"active"};
    if(id)Object.assign(d,obj);else db.disciplines.push({id:uid(db.disciplines),...obj});
    disciplineAllocationId=null;disciplineAllocationDraft={};disciplineStudentAllocationDraft=null;disciplineExtraDraft=null;delete window.__disciplineDraft;closeModal();save();
  };
}

function deleteDiscipline(id){const d=disciplineById(id);if(confirm(`Видалити «${d.name}»?`)){db.disciplines=db.disciplines.filter(x=>x.id!==id);db.schedule.forEach(s=>{if(Number(s.disciplineId)===Number(id))s.disciplineId=null;});save();}}

/* ================================================================
   Individual + consultation schedules
   ================================================================ */
const SPECIAL_SCHEDULE_KINDS=[
  {id:"individual",label:"Індивідуальні заняття",short:"Індивідуальні",description:"Окремий студент · 1 академічна година · половина пари"},
  {id:"consult_bachelor",label:"Консультації бакалаврів",short:"Бакалаври",description:"Конкретні студенти 1–4 курсів · 1 запис = 1 академічна година"},
  {id:"consult_master",label:"Консультації магістрів",short:"Магістри",description:"Конкретні студенти магістратури · 1 запис = 1 академічна година"}
];
let specialScheduleState={kind:"individual",group:"",disciplineId:null,month:clampAcademicMonth(currentAcademicDate().slice(0,7))};
function specialKindMeta(id){return SPECIAL_SCHEDULE_KINDS.find(x=>x.id===id)||SPECIAL_SCHEDULE_KINDS[0];}
function studentsForGroup(group){return db.students.filter(s=>s.status!=="archived"&&normIdentity(s.group)===normIdentity(group)).slice().sort((a,b)=>a.name.localeCompare(b.name,"uk"));}
function isConsultationType(lt){return normIdentity(lt?.name||"").includes("консультац");}
function specialTypeMatches(kind,lt,d){
  if(kind==="individual"){
    return !isConsultationType(lt)
      &&(lt?.countMode==="per_student"||normIdentity(lt?.name)==="індивідуальне");
  }
  if(!isConsultationType(lt))return false;
  const course=Number(d?.course||groupCourse(d?.group)||0);
  if(kind==="consult_bachelor")return course>0&&course<=4;
  if(kind==="consult_master")return course>=5;
  return false;
}
function specialLoadRows(kind=specialScheduleState.kind){
  const rows=[];
  db.disciplines.filter(d=>d.status!=="archived").forEach(d=>{
    explicitlyAllocatedTeacherIds(d).forEach(tid=>{
      const t=teacherById(tid);if(!t)return;
      disciplinePlannedTypes(d).forEach(lt=>{
        if(!specialTypeMatches(kind,lt,d))return;
        const planned=teacherTypePlan(d,tid,lt.name);if(planned<=0)return;
        const scheduled=scheduledLoad(d.id,tid,lt.name);
        rows.push({d,t,lt,planned,scheduled,remaining:Math.max(0,planned-scheduled)});
      });
    });
  });
  return rows.sort((a,b)=>Number(a.d.course||99)-Number(b.d.course||99)||String(a.d.group||"").localeCompare(String(b.d.group||""),"uk")||teacherDisplay(a.t).localeCompare(teacherDisplay(b.t),"uk")||a.d.name.localeCompare(b.d.name,"uk"));
}
function specialEventRows(kind=specialScheduleState.kind){return db.schedule.filter(x=>x.specialSchedule===true&&x.specialKind===kind&&dateInBounds(x.date)).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.pairId||99)-Number(b.pairId||99)||Number(a.specialHalf||1)-Number(b.specialHalf||1));}
function specialGroups(kind=specialScheduleState.kind){const set=new Set([...specialLoadRows(kind).map(x=>x.d.group),...specialEventRows(kind).map(x=>x.group)].filter(Boolean));return db.groups.filter(g=>set.has(g.code)).sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code,"uk"));}
function specialDisciplineChoices(kind=specialScheduleState.kind,group=specialScheduleState.group){
  const byId=new Map();

  specialLoadRows(kind)
    .filter(x=>!group||normIdentity(x.d.group)===normIdentity(group))
    .forEach(x=>byId.set(Number(x.d.id),x.d));

  specialEventRows(kind)
    .filter(x=>!group||scheduleIncludesGroup(x,group))
    .forEach(x=>{
      const d=disciplineById(x.disciplineId);
      if(d)byId.set(Number(d.id),d);
    });

  return [...byId.values()].sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"uk"));
}
function ensureSpecialDiscipline(){
  const choices=specialDisciplineChoices();
  if(!choices.some(d=>Number(d.id)===Number(specialScheduleState.disciplineId))){
    specialScheduleState.disciplineId=choices[0]?.id||null;
  }
}
function setSpecialKind(kind){
  specialScheduleState.kind=kind;
  const groups=specialGroups(kind);
  if(!groups.some(g=>g.code===specialScheduleState.group))specialScheduleState.group=groups[0]?.code||"";
  specialScheduleState.disciplineId=null;
  ensureSpecialDiscipline();
  renderSpecialSchedule();
}
function setSpecialGroup(group){
  specialScheduleState.group=group;
  specialScheduleState.disciplineId=null;
  ensureSpecialDiscipline();
  renderSpecialSchedule();
}
function setSpecialDiscipline(id){
  specialScheduleState.disciplineId=Number(id)||null;
  renderSpecialSchedule();
}
function setSpecialMonth(month){specialScheduleState.month=month;renderSpecialSchedule();}
function timeToMinutesValue(v){const [h,m]=String(v||"00:00").split(":").map(Number);return h*60+m;}
function minutesToTimeValue(v){const h=Math.floor(v/60),m=v%60;return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;}
function specialHalfTimes(pairId,half){const p=pairById(pairId);if(!p||!p.start||!p.end)return {start:"",end:""};const start=timeToMinutesValue(p.start),end=timeToMinutesValue(p.end),mid=Math.round((start+end)/2);return Number(half)===2?{start:minutesToTimeValue(mid),end:minutesToTimeValue(end)}:{start:minutesToTimeValue(start),end:minutesToTimeValue(mid)};}
function specialSlotLabel(x){const p=pairById(x.pairId),half=Number(x.specialHalf)===2?"ІІ половина":"І половина";return `${p?.id||x.pairId||"—"} пара · ${half}${x.start&&x.end?` · ${x.start}–${x.end}`:""}`;}
function specialStudentName(x){const s=db.students.find(s=>Number(s.id)===Number(x.studentId));return s?.name||x.students||"Студент";}
function specialKindTabsHtml(){return `<div class="special-kind-tabs">${SPECIAL_SCHEDULE_KINDS.map(k=>{const remaining=specialLoadRows(k.id).reduce((a,x)=>a+x.remaining,0);return `<button class="${specialScheduleState.kind===k.id?"active":""}" onclick="setSpecialKind('${k.id}')"><span>${esc(k.short)}</span><b>${fmtHours(remaining)} год</b></button>`;}).join("")}</div>`;}
function beginDirectStudentAssignment(disciplineId,teacherId,typeId){
  const d=disciplineById(disciplineId);
  if(!d)return;

  disciplineAllocationId=d.id;
  window.__disciplineDraft=d;
  disciplineAllocationDraft=cloneAllocationLoads(d);
  disciplineStudentAllocationDraft=cloneStudentAllocationLoads(d);
  disciplineExtraDraft=clone(d.extraHours||{});

  window.__directStudentAssignment={
    disciplineId:Number(disciplineId),
    teacherId:Number(teacherId),
    typeId:Number(typeId),
    returnPage:"specialSchedule"
  };

  openPerStudentAllocationPopup(teacherId,typeId);
}
function saveDirectStudentAssignment(tid,typeId){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;
  if(!d)return;

  syncPerStudentAllocationLoads(d);

  const ids=Object.keys(disciplineAllocationDraft||{}).map(Number).filter(Boolean);
  const teacherLoads={...clone(d.teacherLoads||{})};
  ids.forEach(teacherId=>{
    teacherLoads[String(teacherId)]=teacherLoads[String(teacherId)]||{};
    db.lessonTypes.forEach(lt=>{
      teacherLoads[String(teacherId)][lt.id]=num(disciplineAllocationDraft[String(teacherId)]?.[lt.id]);
    });
  });

  const teacherStudentLoads={...clone(d.teacherStudentLoads||{})};
  Object.entries(disciplineStudentAllocationDraft||{}).forEach(([teacherId,byType])=>{
    teacherStudentLoads[String(teacherId)]=teacherStudentLoads[String(teacherId)]||{};
    Object.entries(byType||{}).forEach(([ltId,studentIds])=>{
      teacherStudentLoads[String(teacherId)][String(ltId)]=[...new Set((studentIds||[]).map(Number).filter(Boolean))];
    });
  });

  d.teacherLoads=teacherLoads;
  d.teacherStudentLoads=teacherStudentLoads;
  d.teacherIds=[...new Set([...(d.teacherIds||[]).map(Number),...ids])];

  disciplineAllocationId=null;
  disciplineAllocationDraft={};
  disciplineStudentAllocationDraft=null;
  disciplineExtraDraft=null;
  delete window.__disciplineDraft;
  delete window.__directStudentAssignment;

  closePlannerActionModal();
  save();
  go("specialSchedule",{focusCurrentCalendar:false});
}

function specialLoadCardHtml(x){
  const done=x.remaining<=.001;
  const perStudent=isPerStudentTypeId(x.lt.id);
  const resolved=!perStudent||persistedStudentAssignmentExists(x.d,x.t.id,x.lt.id);
  const assigned=perStudent?persistedAssignedStudentIds(x.d,x.t.id,x.lt.id).length:0;
  const hintCount=perStudent?scheduledHintStudentIds(x.d,x.t.id,x.lt.id).length:0;
  const legacyTarget=perStudent?legacyPerStudentTarget(x.d,x.t.id,x.lt.id):{count:0,hours:0};
  const unit=perStudent?perStudentUnitHours(x.d,x.lt.id):0;

  return `<article class="special-load-card ${done?"done":""} ${!resolved?"needs-students":""}" style="${scheduleColorVars({group:x.d.group,discipline:x.d.name})}">
    <div class="special-load-card-head">
      <div><span>${esc(x.d.group)} · ${esc(x.d.course||groupCourse(x.d.group))} курс</span><h4>${esc(x.d.name)}</h4></div>
      <strong class="${done?"done":!resolved?"warn":""}">${!resolved?"ПОТРІБНІ СТУДЕНТИ":done?"ГОТОВО":`${fmtHours(x.remaining)} год`}</strong>
    </div>

    <div class="special-load-teacher"><span>Викладач</span><b>${esc(teacherDisplay(x.t))}</b></div>

    ${perStudent
      ?resolved
        ?`<div class="special-student-formula"><b>${assigned} студентів</b><span>× ${fmtHours(unit)} год = ${fmtHours(x.planned)} год навантаження</span></div>`
        :`<div class="special-assignment-warning">
            <b>Спочатку закріпи студентів</b>
            <span>${legacyTarget.hours?`Попереднє навантаження ${fmtHours(legacyTarget.hours)} год ≈ ${legacyTarget.count} студент(ів).`:""} ${hintCount?`У старому розкладі вже знайдено ${hintCount} студент(ів) — вони будуть попередньо відмічені.`:""}</span>
          </div>`
      :""}

    <div class="special-load-progress">
      <div><span>${esc(x.lt.name)}</span><b>${fmtHours(x.scheduled)} / ${fmtHours(x.planned)} год</b></div>
      <i><em style="width:${x.planned?Math.min(100,x.scheduled/x.planned*100):0}%"></em></i>
    </div>

    ${!resolved
      ?`<button class="primary" onclick="beginDirectStudentAssignment(${x.d.id},${x.t.id},${x.lt.id})">Закріпити студентів</button>`
      :`<button class="${done?"secondary":"primary"}" onclick="openSpecialScheduleModal(${x.d.id},${x.t.id},${x.lt.id})" ${done?"disabled":""}>${done?"Навантаження вичерпано":"Додати студенту"}</button>`}
  </article>`;
}
function specialDisciplineTabsHtml(){
  const choices=specialDisciplineChoices();
  if(!choices.length)return `<div class="empty">Для цієї групи ще немає дисциплін у вибраному окремому розкладі.</div>`;
  return `<div class="special-discipline-tabs">${choices.map(d=>{
    const eventCount=specialEventRows()
      .filter(x=>Number(x.disciplineId)===Number(d.id))
      .filter(x=>!specialScheduleState.group||normIdentity(x.group)===normIdentity(specialScheduleState.group))
      .length;
    return `<button class="${Number(specialScheduleState.disciplineId)===Number(d.id)?"active":""}" onclick="setSpecialDiscipline(${d.id})" style="${scheduleColorVars({group:d.group,discipline:d.name})}">
      <span>Дисципліна</span>
      <b>${esc(d.name)}</b>
      <small>${eventCount} записів</small>
    </button>`;
  }).join("")}</div>`;
}
function specialMonthTabsHtml(){
  return `<div class="teacher-month-tabs special-month-tabs">${academicMonthTabs().map(m=>{
    const count=specialEventRows()
      .filter(x=>String(x.date||"").slice(0,7)===m.value)
      .filter(x=>!specialScheduleState.group||normIdentity(x.group)===normIdentity(specialScheduleState.group))
      .filter(x=>!specialScheduleState.disciplineId||Number(x.disciplineId)===Number(specialScheduleState.disciplineId))
      .length;
    return `<button class="${specialScheduleState.month===m.value?"active":""}" onclick="setSpecialMonth('${m.value}')"><span>${esc(m.label)}</span>${count?`<b>${count}</b>`:""}</button>`;
  }).join("")}</div>`;
}
function specialScheduleListHtml(){
  const rows=specialEventRows()
    .filter(x=>String(x.date||"").slice(0,7)===specialScheduleState.month)
    .filter(x=>!specialScheduleState.group||normIdentity(x.group)===normIdentity(specialScheduleState.group))
    .filter(x=>!specialScheduleState.disciplineId||Number(x.disciplineId)===Number(specialScheduleState.disciplineId));
  if(!rows.length)return `<div class="empty">У цьому місяці ще немає записів цього спеціального розкладу.</div>`;
  const dates=[...new Set(rows.map(x=>x.date))];
  return `<div class="special-schedule-days">${dates.map(date=>{const dayRows=rows.filter(x=>x.date===date);return `<section class="special-day"><div class="special-day-date"><b>${formatDate(date)}</b><span>${esc(weekdayNameForDate(date))}</span><strong>${dayRows.length}</strong></div><div class="special-day-events">${dayRows.map(x=>`<div class="special-event-card special-event-editable" style="${scheduleColorVars(x)}" role="button" tabindex="0" onclick="openSpecialScheduleEventEditor(${x.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openSpecialScheduleEventEditor(${x.id});}"><div class="special-event-time"><b>${esc(specialSlotLabel(x))}</b><span>${esc(x.room||"без аудиторії")}</span></div><div class="special-event-student"><span>Студент</span><b>${esc(specialStudentName(x))}</b></div><div class="special-event-context"><b>${esc(x.discipline||"")}</b><span>${esc(x.teacher||"")}</span></div><span class="special-event-edit-hint">Редагувати ✎</span><button class="special-event-delete" title="Видалити" onclick="event.stopPropagation();deleteSpecialScheduleEvent(${x.id})">×</button></div>`).join("")}</div></section>`;}).join("")}</div>`;
}
function renderSpecialSchedule(){
  const kind=specialScheduleState.kind,groups=specialGroups(kind);
  if(!specialScheduleState.group&&groups.length)specialScheduleState.group=groups[0].code;
  ensureSpecialDiscipline();

  const rows=specialLoadRows(kind)
    .filter(x=>!specialScheduleState.group||x.d.group===specialScheduleState.group);
  const remaining=rows.reduce((a,x)=>a+x.remaining,0);
  const selectedDiscipline=disciplineById(specialScheduleState.disciplineId);

  $("#page-specialSchedule").innerHTML=`<div class="special-schedule-page">
    <div class="special-hero">
      <div><span>ОКРЕМІ РОЗКЛАДИ</span><h2>Індивідуальні та консультації</h2><p>Тут працюємо не парами, а академічними годинами: <b>1 запис = половина пари = 1 академічна година на одного студента.</b></p></div>
      <div class="special-hero-kpi"><b>${fmtHours(remaining)}</b><span>годин залишилось у вибраному режимі / групі</span></div>
    </div>

    ${specialKindTabsHtml()}

    <div class="special-group-bar">
      <div><span>Група</span><b>${esc(specialScheduleState.group||"—")}</b></div>
      ${groups.length?groupSwitchRowHtml({selected:specialScheduleState.group,onclick:"setSpecialGroup",groups,badgeFn:g=>String(studentsForGroup(g.code).length),extraClass:"special-group-switch"}):`<div class="empty">Для цього режиму ще немає розподіленого навантаження.</div>`}
    </div>

    <div class="special-two-column">
      <section class="card section special-load-section">
        <div class="section-head"><div><h2>Навантаження для розстановки</h2><div class="small">${esc(specialKindMeta(kind).description)}</div></div></div>
        ${rows.length?`<div class="special-load-grid">${rows.map(specialLoadCardHtml).join("")}</div>`:`<div class="empty">У ${esc(specialScheduleState.group||"цій групі")} немає розподілених годин цього типу. Додай вид занять у «Навантаженні» та розподіли його викладачу.</div>`}
      </section>

      <section class="card section special-ready-section">
        <div class="section-head">
          <div>
            <h2>Готовий окремий розклад</h2>
            <div class="small">${selectedDiscipline?`Зараз показано тільки: ${esc(selectedDiscipline.name)}`:"Спочатку обери дисципліну."}</div>
          </div>
        </div>

        <div class="special-ready-step">
          <span>1</span>
          <div><b>Оберіть дисципліну</b><small>Режисура, драматургія та інші дисципліни більше не змішуються в одному розкладі.</small></div>
        </div>
        ${specialDisciplineTabsHtml()}

        <div class="special-ready-step">
          <span>2</span>
          <div><b>Оберіть місяць</b><small>Місяці рахуються тільки для вибраної дисципліни.</small></div>
        </div>
        ${specialMonthTabsHtml()}
        ${specialScheduleListHtml()}
      </section>
    </div>
  </div>`;
}
function specialStudentsForLoad(d,t,lt){
  if(!isPerStudentTypeId(lt.id))return studentsForGroup(d.group);
  if(!persistedStudentAssignmentExists(d,t.id,lt.id))return [];
  const ids=new Set(persistedAssignedStudentIds(d,t.id,lt.id));
  return studentsForGroup(d.group).filter(s=>ids.has(Number(s.id)));
}
function personalMeetingLabel(lt){
  return isConsultationType(lt)?"консультацій":"зустрічей";
}
function personalWorkloadLabel(lt){
  return isConsultationType(lt)?"консультаційне":"індивідуальне";
}

function specialStudentProgress(d,t,lt,studentId,ignoreId=null){
  if(isPerStudentTypeId(lt.id)){
    const u=individualStudentUsage(d,t,lt,studentId,ignoreId);
    return {plan:u.limit,used:u.used,remaining:u.remaining,done:u.complete};
  }
  const plan=teacherTypePlan(d,t.id,lt.name);
  const used=scheduledStudentLoad(d.id,t.id,lt.name,studentId,ignoreId);
  return {plan,used,remaining:Math.max(0,plan-used),done:used>=plan-.001};
}
function specialStudentButtonsHtml(d,t,lt,selected=null,ignoreId=null){
  return `<div class="special-student-picker">${specialStudentsForLoad(d,t,lt).map(s=>{
    const p=specialStudentProgress(d,t,lt,s.id,ignoreId);
    return `<button type="button"
      class="${Number(selected)===Number(s.id)?"active":""} ${p.done?"done":""}"
      data-student-id="${s.id}"
      ${p.done?"disabled":""}
      onclick="selectSpecialStudent(${s.id})">
        <span>${esc(s.name)}</span>
        ${isPerStudentTypeId(lt.id)?`<small>${fmtHours(p.used)} / ${fmtHours(p.plan)} год · ${fmtHours(p.used)} / ${fmtHours(p.plan)} ${personalMeetingLabel(lt)}${p.done?" · ГОТОВО":` · залишилось ${fmtHours(p.remaining)}`}</small>`:""}
    </button>`;
  }).join("")}</div>`;
}
function selectSpecialStudent(id){const hidden=$("#specialStudentId");if(hidden)hidden.value=id;$$('[data-student-id]').forEach(b=>b.classList.toggle("active",Number(b.dataset.studentId)===Number(id)));}
function specialHalfOptionsHtml(pairId,selected=1){return [1,2].map(h=>{const times=specialHalfTimes(pairId,h);return `<button type="button" class="special-half-btn ${Number(selected)===h?"active":""}" data-half="${h}" onclick="selectSpecialHalf(${h})"><b>${h===1?"І половина":"ІІ половина"}</b><span>${esc(times.start)}–${esc(times.end)}</span></button>`;}).join("");}
function selectSpecialHalf(half){const hidden=$("#specialHalf");if(hidden)hidden.value=half;$$('[data-half]').forEach(b=>b.classList.toggle("active",Number(b.dataset.half)===Number(half)));refreshSpecialRoomOptions();}
let specialEditEventId=null;

function specialRoomOptions(date,pairId,half,selected="",ignoreId=specialEditEventId){
  const times=specialHalfTimes(pairId,half);
  return `<option value="">— без аудиторії —</option>`+
    db.rooms.filter(r=>r.status!=="archived").map(r=>{
      const conflict=roomConflictRecord(date,times.start,times.end,pairId,r.name,ignoreId);
      const busy=!!conflict;
      return `<option value="${esc(r.name)}" ${r.name===selected?"selected":""} ${busy&&r.name!==selected?"disabled":""}>${esc(roomBusyOptionLabel(r.name,conflict))}</option>`;
    }).join("");
}
function refreshSpecialRoomOptions(){
  const room=$("#specialRoom");
  if(!room)return;
  const selected=room.value;
  const date=$("#specialDate")?.value||"";
  const pairId=$("#specialPair")?.value;
  const half=Number($("#specialHalf")?.value||1);
  room.innerHTML=specialRoomOptions(date,pairId,half,selected);
  if([...room.options].some(o=>o.value===selected&&!o.disabled))room.value=selected;
}
function refreshSpecialHalfButtons(){
  const pairId=$("#specialPair")?.value,half=Number($("#specialHalf")?.value||1),box=$("#specialHalfButtons");
  if(box)box.innerHTML=specialHalfOptionsHtml(pairId,half);
  refreshSpecialRoomOptions();
}
function openSpecialScheduleEventEditor(id){
  const existing=db.schedule.find(x=>Number(x.id)===Number(id));
  if(!existing||!existing.specialSchedule)return;
  const d=disciplineById(existing.disciplineId);
  const t=teacherById(existing.teacherId);
  const lt=db.lessonTypes.find(x=>x.name===existing.type);
  if(!d||!t||!lt)return alert("Не вдалося відкрити запис для редагування.");
  specialScheduleState.kind=existing.specialKind||specialScheduleState.kind;
  specialScheduleState.group=existing.group||specialScheduleState.group;
  specialScheduleState.disciplineId=existing.disciplineId||specialScheduleState.disciplineId;
  specialScheduleState.month=String(existing.date||"").slice(0,7)||specialScheduleState.month;
  openSpecialScheduleModal(d.id,t.id,lt.id,existing.id);
}

function openSpecialScheduleModal(disciplineId,teacherId,typeId,editId=null){
  const d=disciplineById(disciplineId),t=teacherById(teacherId),lt=db.lessonTypes.find(x=>Number(x.id)===Number(typeId));
  if(!d||!t||!lt)return;

  const existing=editId?db.schedule.find(x=>Number(x.id)===Number(editId)):null;
  const editing=!!existing;
  specialEditEventId=editing?existing.id:null;

  const students=specialStudentsForLoad(d,t,lt);
  if(!students.length){
    if(isPerStudentTypeId(lt.id)){
      beginDirectStudentAssignment(d.id,t.id,lt.id);
      return;
    }
    return alert("У цій групі немає студентів.");
  }

  const availableStudents=students.filter(s=>{
    if(editing&&Number(s.id)===Number(existing.studentId))return true;
    return !specialStudentProgress(d,t,lt,s.id,editId).done;
  });
  if(!availableStudents.length)return alert("Усі закріплені за цим викладачем студенти вже використали свої години.");

  const remaining=remainingLoad(d,t.id,lt.name,editId);
  if(remaining<1-.001)return alert("Для цього виду занять уже немає щонайменше 1 години залишку.");

  const bounds=semesterDateBounds(d.semester);
  const defaultDate=editing?existing.date:clampDate(currentAcademicDate(),bounds);
  const firstPair=editing?(existing.pairId||bellPairs()[0]?.id||1):(bellPairs()[0]?.id||1);
  const defaultHalf=editing?(Number(existing.specialHalf)||1):1;
  const defaultStudentId=editing?Number(existing.studentId):Number(availableStudents[0].id);
  const defaultRoom=editing?(existing.room||""):"";
  const defaultNote=editing?(existing.note||""):"";

  openModal(`<div class="special-modal">
    <div class="special-modal-head">
      <div>
        <span>${editing?"РЕДАГУВАННЯ · ":""}${esc(specialKindMeta(specialScheduleState.kind).label)}</span>
        <h2>${esc(d.name)}</h2>
        <strong>${esc(teacherDisplay(t))}</strong>
        <p>${esc(d.group)} · ${esc(lt.name)} · ${editing?"редагуємо існуючий запис":`залишок викладача ${fmtHours(remaining)} год`}${isPerStudentTypeId(lt.id)?` · <b>${fmtHours(perStudentUnitHours(d,lt.id))} год = максимум ${fmtHours(perStudentUnitHours(d,lt.id))} ${personalMeetingLabel(lt)} на кожного студента</b>`:""}</p>
      </div>
      <div class="special-one-hour"><b>1</b><span>академічна година</span><small>= ½ пари</small></div>
    </div>

    ${editing?`<div class="special-edit-notice"><b>Редагування запису</b><span>Можна змінити студента, дату, половину пари, аудиторію та примітку. Цей запис не враховується як конфлікт із самим собою.</span></div>`:""}

    <form id="specialScheduleForm">
      <input id="specialStudentId" type="hidden" value="${defaultStudentId}">
      <input id="specialHalf" type="hidden" value="${defaultHalf}">

      <div class="special-form-section">
        <div class="special-form-title"><span>1</span><div><b>Студент</b><small>кожен запис належить конкретному студенту</small></div></div>
        ${specialStudentButtonsHtml(d,t,lt,defaultStudentId,editId)}
      </div>

      <div class="special-form-section">
        <div class="special-form-title"><span>2</span><div><b>Дата і половина пари</b><small>повної пари тут немає — тільки одна академічна година</small></div></div>
        <div class="special-time-grid">
          <label>Дата<input id="specialDate" type="date" min="${bounds.start}" max="${bounds.end}" value="${defaultDate}"></label>
          <label>Пара<select id="specialPair">${bellPairs().map(p=>`<option value="${p.id}" ${String(p.id)===String(firstPair)?"selected":""}>${p.id} пара · ${esc(p.start)}–${esc(p.end)}</option>`).join("")}</select></label>
        </div>
        <div id="specialHalfButtons" class="special-half-buttons">${specialHalfOptionsHtml(firstPair,defaultHalf)}</div>
      </div>

      <div class="special-form-section">
        <div class="special-form-title"><span>3</span><div><b>Місце</b><small>аудиторія необов’язкова; якщо вказана — вона буде зайнята в сітці аудиторій</small></div></div>
        <div class="special-time-grid">
          <label>Аудиторія<select id="specialRoom">${specialRoomOptions(defaultDate,firstPair,defaultHalf,defaultRoom,editId)}</select></label>
          <label>Примітка<input id="specialNote" value="${esc(defaultNote)}" placeholder="необов’язково"></label>
        </div>
      </div>

      <div id="specialConflictMessage"></div>

      <div class="special-modal-actions">
        <button type="button" class="secondary" onclick="specialEditEventId=null;closeModal()">Скасувати</button>
        <button class="primary">${editing?"Зберегти зміни":"Зберегти 1 академічну годину"}</button>
      </div>
    </form>
  </div>`,true);

  $("#specialPair").onchange=refreshSpecialHalfButtons;
  $("#specialDate").onchange=refreshSpecialRoomOptions;
  $("#specialScheduleForm").onsubmit=e=>saveSpecialScheduleEvent(e,d,t,lt,editId);
}
function saveSpecialScheduleEvent(e,d,t,lt,editId=null){
  e.preventDefault();

  const studentId=Number($("#specialStudentId").value);
  const student=db.students.find(s=>Number(s.id)===studentId);
  if(!student)return alert("Оберіть студента.");

  const date=$("#specialDate").value;
  const pairId=$("#specialPair").value;
  const half=Number($("#specialHalf").value||1);
  const times=specialHalfTimes(pairId,half);
  const room=$("#specialRoom").value;

  const previous=editId?db.schedule.find(x=>Number(x.id)===Number(editId)):null;
  const item={
    id:editId||uid(db.schedule),
    date,
    start:times.start,
    end:times.end,
    pairId,
    group:d.group,
    disciplineId:d.id,
    discipline:d.name,
    type:lt.name,
    coverage:student.name,
    students:student.name,
    studentId,
    teacherId:t.id,
    teacher:teacherDisplay(t),
    room,
    workloadHours:1,
    note:$("#specialNote").value.trim(),
    repeatBatchId:previous?.repeatBatchId||null,
    specialSchedule:true,
    specialKind:previous?.specialKind||specialScheduleState.kind,
    specialHalf:half,
    scheduleSource:"special"
  };

  const rem=remainingLoad(d,t.id,lt.name,editId);
  if(rem<1-.001)return alert(`Залишок навантаження лише ${fmtHours(rem)} год.`);

  if(isPerStudentTypeId(lt.id)){
    if(!assignedStudentIds(d,t.id,lt.id).includes(Number(studentId))){
      return alert("Цей студент не закріплений за цим викладачем у навантаженні.");
    }

    const usage=individualStudentUsage(d,t,lt,studentId,editId);
    if(usage.limit<=0){
      return alert("Для цього студента в навчальному плані не передбачено індивідуальних годин.");
    }
    if(usage.used+1>usage.limit+.001){
      return alert(`Ліміт вичерпано. За планом цьому студенту передбачено ${fmtHours(usage.limit)} год = максимум ${fmtHours(usage.limit)} ${personalMeetingLabel(lt)}. Уже виставлено ${fmtHours(usage.used)}.`);
    }
  }

  const cs=conflictsFor(item,editId);
  const info=teacherAvailabilityInfo(item,editId);

  const studentConflict=db.schedule.some(x=>
    Number(x.id)!==Number(editId)
    &&x.date===date
    &&Number(x.studentId)===studentId
    &&(
      (x.specialSchedule||item.specialSchedule)
        ?timeOverlap(item.start,item.end,x.start,x.end)
        :(item.pairId&&x.pairId
          ?String(item.pairId)===String(x.pairId)
          :timeOverlap(item.start,item.end,x.start,x.end))
    )
  );

  if(studentConflict)cs.push({studentId,discipline:"Студент уже зайнятий у цей час"});

  if(cs.length||info.warnings.length){
    $("#specialConflictMessage").innerHTML=conflictDetailsHtml(item,cs,info.warnings);
    return;
  }

  if(editId){
    const index=db.schedule.findIndex(x=>Number(x.id)===Number(editId));
    if(index<0)return alert("Не вдалося знайти запис для оновлення.");
    db.schedule[index]=item;
  }else{
    db.schedule.push(item);
  }

  specialScheduleState.disciplineId=d.id;
  specialScheduleState.group=d.group;
  specialScheduleState.month=String(date).slice(0,7)||specialScheduleState.month;
  specialEditEventId=null;

  closeModal();
  save();
  go("specialSchedule",{focusCurrentCalendar:false});
}
function openSpecialEventFromRoom(id){const x=db.schedule.find(s=>Number(s.id)===Number(id));if(!x||!x.specialSchedule)return;specialScheduleState.kind=x.specialKind||"individual";specialScheduleState.group=x.group||"";specialScheduleState.disciplineId=x.disciplineId||null;specialScheduleState.month=String(x.date||"").slice(0,7)||specialScheduleState.month;go("specialSchedule",{focusCurrentCalendar:false});}
function deleteSpecialScheduleEvent(id){
  const x=db.schedule.find(s=>Number(s.id)===Number(id));
  if(!x)return;
  if(!confirm(`Видалити ${specialKindMeta(x.specialKind).short.toLowerCase()} · ${specialStudentName(x)} · ${formatDate(x.date)}?`))return;
  db.schedule=db.schedule.filter(s=>Number(s.id)!==Number(id));
  save();
  if(currentPage==="specialSchedule")renderSpecialSchedule();
}

/* Schedule */
function lessonTypeIdByName(name){return lessonTypeByName(name)?.id||null;}
function disciplineTypePlan(d,typeName){const id=lessonTypeIdByName(typeName);return id?disciplineTotalHoursById(d,id):0;}
function teacherTypePlan(d,teacherId,typeName){
  if(!d||!teacherId)return 0;
  const id=lessonTypeIdByName(typeName);if(!id)return 0;

  if(isPerStudentTypeId(id)&&studentAssignmentKeyExists(d,teacherId,id)){
    return assignedStudentIds(d,teacherId,id).length*perStudentUnitHours(d,id);
  }

  const load=explicitTeacherLoad(d,teacherId);
  return load?num(load[id]):0;
}
function scheduledLoad(disciplineId,teacherId,typeName,ignoreId=null){
  return db.schedule.filter(s=>s.id!==ignoreId&&scheduleCoversDiscipline(s,disciplineId)&&Number(s.teacherId)===Number(teacherId)&&s.type===typeName).reduce((a,s)=>a+num(s.workloadHours),0);
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
function setWorkloadScheduleGroup(code){
  const input=$("#workloadGroup");
  if(input)input.value=code;
  rememberWorkloadGroup(code);
  const label=$("#workloadGroupLabel");
  if(label)label.textContent=code;
  const courseLabel=$("#workloadGroupCourse");
  if(courseLabel)courseLabel.textContent=`${groupCourse(code)} курс`;
  const wrap=$("#workloadGroupButtons");
  if(wrap){
    const loaded=groupsWithDistributedAuditoriumLoad();
    wrap.innerHTML=groupSwitchRowHtml({
      selected:code,
      onclick:"setWorkloadScheduleGroup",
      groups:sortedGroups(),
      badgeFn:g=>{
        const rows=workloadTeacherRowsForGroup(g.code);
        const disciplines=new Set(rows.map(x=>String(x.d.id))).size;
        return disciplines?`${disciplines} дисц.`:"—";
      },
      extraClass:"schedule-group-switch"
    });
  }
  const box=$("#workloadScheduleBox");
  if(box)box.innerHTML=renderWorkloadToSchedule(code);
}
function workloadTypeSummary(types){
  return `<div class="integrated-load-types">${types.map(x=>`<div class="integrated-load-type"><b>${esc(x.lt.name)}</b><span>${fmtHours(x.scheduled)} / ${fmtHours(x.planned)} год</span><small>зал. ${fmtHours(x.remaining)}</small></div>`).join("")}</div>`;
}
function workloadDisciplineGroups(rows){
  const map=new Map();
  rows.forEach(row=>{
    const key=String(row.d.id);
    if(!map.has(key))map.set(key,{d:row.d,teachers:[]});
    map.get(key).teachers.push(row);
  });
  return [...map.values()].sort((a,b)=>
    Number(a.d.semester||99)-Number(b.d.semester||99)
    || String(a.d.name||"").localeCompare(String(b.d.name||""),"uk")
  );
}
function workloadTeacherCardHtml(x){
  const percent=x.planned>0?Math.min(100,Math.max(0,x.scheduled/x.planned*100)):0;
  return `<div class="schedule-discipline-teacher ${x.remaining<=0?"done":""}">
    <div class="schedule-discipline-teacher-head">
      <div>
        <span>Викладач</span>
        <h4>${esc(teacherDisplay(x.t))}</h4>
      </div>
      <div class="schedule-discipline-teacher-total">
        <b>${fmtHours(x.scheduled)} / ${fmtHours(x.planned)} год</b>
        <span>виставлено / розподілено</span>
      </div>
    </div>

    <div class="schedule-discipline-teacher-types">
      ${x.types.map(type=>`
        <div class="schedule-teacher-type ${type.remaining<=0?"done":""}">
          <span>${esc(type.lt.name)}</span>
          <b>${fmtHours(type.scheduled)} / ${fmtHours(type.planned)} год</b>
          <small>${type.remaining>0?`залишок ${fmtHours(type.remaining)} год`:"готово"}</small>
        </div>
      `).join("")}
    </div>

    <div class="schedule-teacher-progress">
      <i style="width:${percent}%"></i>
    </div>

    <div class="schedule-discipline-teacher-foot">
      <span class="schedule-remaining ${x.remaining<=0?"done":""}">
        ${x.remaining<=0?"✓ усе виставлено":`залишилось ${fmtHours(x.remaining)} год`}
      </span>
      <button class="${x.remaining>0?"primary-inline":"secondary"}"
        onclick="safeOpenDisciplineTeacherScheduler(${x.d.id},${x.t.id})">
        ${x.remaining>0?"Розставити":"Переглянути календар"}
      </button>
    </div>
  </div>`;
}
function workloadDisciplineCardHtml(group){
  const planned=group.teachers.reduce((sum,x)=>sum+x.planned,0);
  const scheduled=group.teachers.reduce((sum,x)=>sum+x.scheduled,0);
  const remaining=group.teachers.reduce((sum,x)=>sum+x.remaining,0);
  const percent=planned>0?Math.min(100,Math.max(0,scheduled/planned*100)):0;
  const teachersCount=group.teachers.length;

  return `<section class="schedule-discipline-card ${remaining<=0?"done":""}"
    style="${scheduleColorVars({group:group.d.group,discipline:group.d.name})}">
    <div class="schedule-discipline-head">
      <div class="schedule-discipline-identity">
        <span class="schedule-discipline-accent"></span>
        <div>
          <div class="schedule-discipline-kicker">
            <span>${esc(group.d.group)}</span>
            <span>${group.d.semester?`${esc(group.d.semester)} семестр`:""}</span>
          </div>
          <h3>${esc(group.d.name)}</h3>
          <div class="schedule-discipline-meta">
            <span>${teachersCount} ${teachersCount===1?"викладач":"викладачі"}</span>
            <span>${esc(group.d.controlForm||"без контролю")}</span>
          </div>
        </div>
      </div>

      <div class="schedule-discipline-summary">
        <div>
          <b>${fmtHours(scheduled)} / ${fmtHours(planned)} год</b>
          <span>виставлено / розподілено</span>
        </div>
        <strong class="${remaining<=0?"done":""}">
          ${remaining<=0?"ГОТОВО":`${fmtHours(remaining)} год лишилось`}
        </strong>
      </div>
    </div>

    <div class="schedule-discipline-progress">
      <i style="width:${percent}%"></i>
    </div>

    <div class="schedule-discipline-teachers-grid">
      ${group.teachers.map(workloadTeacherCardHtml).join("")}
    </div>
  </section>`;
}
function renderWorkloadToSchedule(group){
  const rows=workloadTeacherRowsForGroup(group);
  const unallocated=db.disciplines
    .filter(d=>d.status!=="archived"&&normIdentity(d.group)===normIdentity(group))
    .flatMap(d=>schedulableTypes(d).map(lt=>({
      d,lt,
      plan:disciplineTypePlan(d,lt.name),
      allocated:disciplineAllocatedForType(d,lt.id)
    })))
    .filter(x=>x.plan-x.allocated>0.001);

  if(!rows.length){
    return `<div class="empty">Для ${esc(group)} ще немає розподіленого аудиторного навантаження. Спочатку відкрий «Навантаження» і розподіли години між викладачами.</div>`;
  }

  const warning=unallocated.length
    ? `<div class="notice warn-notice"><b>Ще не все розподілено між викладачами:</b> ${unallocated.map(x=>`${esc(x.d.name)} · ${esc(x.lt.name)} — ${fmtHours(x.plan-x.allocated)} год`).join("; ")}</div>`
    : "";

  const disciplines=workloadDisciplineGroups(rows);

  return `${warning}
    <div class="schedule-discipline-list">
      ${disciplines.map(workloadDisciplineCardHtml).join("")}
    </div>`;
}

/* Ready-made schedule from other departments */
let readyScheduleMode=null;

function setReadyScheduleMode(mode,existing=null){
  readyScheduleMode=mode==="series"?"series":mode==="single"?"single":null;

  const singleBtn=$("#readyModeSingle");
  const seriesBtn=$("#readyModeSeries");
  const hint=$("#readyModeHint");
  const body=$("#readyModeBody");

  if(singleBtn)singleBtn.classList.toggle("active",readyScheduleMode==="single");
  if(seriesBtn)seriesBtn.classList.toggle("active",readyScheduleMode==="series");
  if(hint)hint.classList.toggle("hidden",!!readyScheduleMode);
  if(!body)return;

  if(!readyScheduleMode){
    body.innerHTML="";
    return;
  }

  body.innerHTML=readyScheduleMode==="single"
    ? readySingleModeHtml(existing)
    : readySeriesModeHtml();

  if(readyScheduleMode==="series"){
    readySeriesMethod=null;
    setReadySeriesMethod(null);
  }
  bindReadyMode(existing);
  readyRefreshPlanFields();
}

function readySingleModeHtml(existing=null){
  const firstPair=bellPairs()[0]?.id||1;
  return `<div class="ready-mode-panel">
    <div class="section-head compact ready-rows-head">
      <div><b>${existing?"Заняття":"Одна дата"}</b><div class="small" id="readyDateHint"></div></div>
    </div>
    <form id="readyScheduleForm">
      <div id="readyRows">${readyRowHtml(existing?{
        date:existing.date,
        type:existing.type,
        pairId:existing.pairId||firstPair,
        room:existing.room
      }:{})}</div>
      <div id="readyConflictBox"></div>
      <div class="modal-footer-actions">
        <button class="primary">${existing?"Зберегти зміни":"Додати в розклад"}</button>
      </div>
    </form>
  </div>`;
}

function readySeriesModeHtml(){
  const b=readyDateBounds($("#readyGroup")?.value||"",$("#readyDiscipline")?.value||"");
  const firstPair=bellPairs()[0]?.id||1;
  const defaultWeekday=weekdayId(clampDate(currentAcademicDate(),b));

  return `<div class="ready-mode-panel ready-series-panel">
    <div class="series-method-switch">
      <button type="button" id="readySeriesMethodDates" onclick="setReadySeriesMethod('dates')">
        <b>Конкретні дати</b>
        <span>вставити готовий список</span>
      </button>
      <button type="button" id="readySeriesMethodRule" onclick="setReadySeriesMethod('rule')">
        <b>За правилом</b>
        <span>щотижня або через тиждень</span>
      </button>
    </div>

    <div id="readySeriesMethodHint" class="series-method-hint">
      Обери, як сформувати дати серії.
    </div>

    <div id="readySeriesDatesMethod" class="series-method-body hidden">
      <label>Конкретні дати
        <input id="readyDatesPaste" placeholder="03.09, 10.09, 17.09, 24.09">
      </label>
      <button type="button" class="primary-inline" id="readyAddDates">Додати дати</button>
    </div>

    <div id="readySeriesRuleMethod" class="series-method-body hidden">
      <div class="ready-series-rule">
        <label>Повторення
          <select id="readyRulePattern">
            <option value="weekly">Щотижня</option>
            <option value="biweekly">Через тиждень</option>
          </select>
        </label>
        <label>День
          <select id="readyRuleWeekday">${db.weekDays.map(d=>`<option value="${d.id}" ${Number(d.id)===Number(defaultWeekday)?"selected":""}>${esc(d.name)}</option>`).join("")}</select>
        </label>
        <label>Від
          <input id="readyRuleFrom" type="date" min="${b.start}" max="${b.end}" value="${b.start}">
        </label>
        <label>До
          <input id="readyRuleTo" type="date" min="${b.start}" max="${b.end}" value="${b.end}">
        </label>
        <button type="button" class="primary-inline" id="readyGenerateRule">Згенерувати дати</button>
      </div>
    </div>

    <div id="readySeriesWorkArea" class="hidden">
      <div class="ready-defaults ready-series-defaults">
        <label>Вид для всіх
          <select id="readyDefaultType"><option value="">— не змінювати —</option>${readyTypeOptions()}</select>
        </label>
        <label>Пара для всіх
          <select id="readyDefaultPair"><option value="">— не змінювати —</option>${readyPairOptions(firstPair)}</select>
        </label>
        <label>Аудиторія для всіх
          <input id="readyDefaultRoom" list="readyRoomList" placeholder="наприклад 415">
        </label>
        <button type="button" class="secondary" id="readyApplyDefaults">Застосувати до всіх</button>
      </div>

      <div class="section-head compact ready-rows-head">
        <div>
          <b>Дати серії</b>
          <div class="small" id="readyDateHint"></div>
        </div>
        <button type="button" class="secondary" id="readyAddRow">+ Додати дату</button>
      </div>

      <form id="readyScheduleForm">
        <div id="readyRows"></div>
        <div id="readyConflictBox"></div>
        <div class="modal-footer-actions">
          <button class="primary">Додати серію в розклад</button>
        </div>
      </form>
    </div>
  </div>`;
}
let readySeriesMethod=null;
function setReadySeriesMethod(method){
  readySeriesMethod=method==="rule"?"rule":method==="dates"?"dates":null;
  const datesBtn=$("#readySeriesMethodDates");
  const ruleBtn=$("#readySeriesMethodRule");
  const datesBody=$("#readySeriesDatesMethod");
  const ruleBody=$("#readySeriesRuleMethod");
  const hint=$("#readySeriesMethodHint");
  if(datesBtn)datesBtn.classList.toggle("active",readySeriesMethod==="dates");
  if(ruleBtn)ruleBtn.classList.toggle("active",readySeriesMethod==="rule");
  if(datesBody)datesBody.classList.toggle("hidden",readySeriesMethod!=="dates");
  if(ruleBody)ruleBody.classList.toggle("hidden",readySeriesMethod!=="rule");
  if(hint)hint.classList.toggle("hidden",!!readySeriesMethod);
}
function bindReadyMode(existing=null){
  const row0=$("[data-ready-row]");
  if(row0)bindReadyRow(row0);
  renumberReadyRows();
  readyUpdateEmptyState();

  const form=$("#readyScheduleForm");
  if(form)form.onsubmit=e=>saveReadySchedule(e,existing?.id||null);

  if(readyScheduleMode==="series"){
    $("#readyAddRow").onclick=()=>addReadyScheduleRow();
    $("#readyAddDates").onclick=addReadyDatesFromText;
    $("#readyApplyDefaults").onclick=applyReadyDefaults;
    $("#readyGenerateRule").onclick=generateReadyDatesByRule;
  }
}

function readyUpdateEmptyState(){
  const hasRows=$$("[data-ready-row]").length>0;
  const work=$("#readySeriesWorkArea");
  if(work)work.classList.toggle("hidden",!hasRows);
}

function generateReadyDatesByRule(){
  const group=$("#readyGroup").value;
  const ref=$("#readyDiscipline").value;
  const b=readyDateBounds(group,ref);
  const pattern=$("#readyRulePattern").value;
  const weekday=$("#readyRuleWeekday").value;
  const from=$("#readyRuleFrom").value;
  const to=$("#readyRuleTo").value;

  if(!from||!to)return alert("Вкажи період.");
  if(from>to)return alert("Дата «Від» не може бути пізніше за «До».");

  const dates=datesForPattern(pattern,from,to,weekday,"",b);
  if(!dates.length)return alert("За цим правилом дат не знайдено.");

  const pairId=$("#readyDefaultPair")?.value||bellPairs()[0]?.id||1;
  const type=$("#readyDefaultType")?.value||"Лекція";
  const room=$("#readyDefaultRoom")?.value.trim()||"";

  const existingKeys=new Set($$("[data-ready-row]").map(row=>{
    const date=row.querySelector("[data-ready-date]")?.value||"";
    const pair=row.querySelector("[data-ready-pair]")?.value||"";
    return `${date}|${pair}`;
  }));

  dates.forEach(date=>{
    const key=`${date}|${pairId}`;
    if(!existingKeys.has(key)){
      addReadyScheduleRow({date,type,pairId,room});
      existingKeys.add(key);
    }
  });
  readyUpdateEmptyState();
}


function readyPlanRecords(group){
  const rows=[];
  (db.curricula||[]).forEach(c=>{
    ensureCurriculumShape(c);
    const applies=!(c.applicableGroups||[]).length||(c.applicableGroups||[]).some(g=>normIdentity(g)===normIdentity(group));
    if(!applies)return;
    (c.components||[]).forEach(comp=>{
      (comp.rows||[]).forEach(row=>{
        rows.push({
          ref:`plan:${c.id}:${comp.id}:${row.semester}`,
          curriculumId:c.id,
          componentId:comp.id,
          semester:Number(row.semester)||null,
          name:comp.name,
          scope:comp.scope||"department",
          row
        });
      });
    });
  });
  return rows.sort((a,b)=>{
    if(a.scope!==b.scope)return a.scope==="external"?-1:1;
    if((a.semester||0)!==(b.semester||0))return (a.semester||0)-(b.semester||0);
    return a.name.localeCompare(b.name,"uk");
  });
}
function readyPlanRecordByRef(group,ref){
  return readyPlanRecords(group).find(x=>x.ref===ref)||null;
}
function readyPlanOptions(group,selected=""){
  const rows=readyPlanRecords(group);
  const external=rows.filter(x=>x.scope==="external");
  const other=rows.filter(x=>x.scope!=="external");
  const render=x=>`<option value="${esc(x.ref)}" ${x.ref===selected?"selected":""}>${esc(x.name)} · ${x.semester} сем.</option>`;
  return `<option value="">— обери дисципліну —</option>
    ${external.length?`<optgroup label="Не кафедральні / загальноосвітні">${external.map(render).join("")}</optgroup>`:""}
    ${other.length?`<optgroup label="Інші дисципліни з плану">${other.map(render).join("")}</optgroup>`:""}
    <option value="__custom__" ${selected==="__custom__"?"selected":""}>Інша дисципліна…</option>`;
}
function readyTeacherText(t){
  return t?.name||t?.shortName||"";
}
function readyTeacherIdFromText(text){
  const key=normIdentity(text);
  if(!key)return null;
  const t=db.teachers.find(x=>x.status!=="archived"&&(normIdentity(x.name)===key||normIdentity(x.shortName)===key));
  return t?Number(t.id):null;
}
function readyTeacherDatalist(){
  return db.teachers
    .filter(t=>t.status!=="archived")
    .slice()
    .sort((a,b)=>readyTeacherText(a).localeCompare(readyTeacherText(b),"uk"))
    .map(t=>`<option value="${esc(readyTeacherText(t))}">${esc(t.scope==="external"?"зовнішній":"викладач кафедри")}</option>`)
    .join("");
}
function readyRoomDatalist(){
  return db.rooms
    .filter(r=>r.status!=="archived")
    .slice()
    .sort((a,b)=>a.name.localeCompare(b.name,"uk",{numeric:true}))
    .map(r=>`<option value="${esc(r.name)}"></option>`)
    .join("");
}
function readyTypeOptions(selected=""){
  return db.lessonTypes.map(lt=>`<option value="${esc(lt.name)}" ${lt.name===selected?"selected":""}>${esc(lt.name)}</option>`).join("");
}
function readyPairOptions(selected=null){
  return bellPairs().map(p=>`<option value="${esc(p.id)}" ${String(p.id)===String(selected)?"selected":""}>${esc(p.id)} пара · ${esc(p.start)}–${esc(p.end)}</option>`).join("");
}
function readyDateBounds(group,planRef){
  const rec=readyPlanRecordByRef(group,planRef);
  return rec?.semester?semesterDateBounds(rec.semester):academicYearBounds();
}
function readyDisciplineName(){
  const group=$("#readyGroup")?.value||"";
  const ref=$("#readyDiscipline")?.value||"";
  if(ref==="__custom__")return ($("#readyCustomDiscipline")?.value||"").trim();
  return readyPlanRecordByRef(group,ref)?.name||"";
}
function readyRowHtml(preset={}){
  const firstPair=bellPairs()[0]?.id||1;
  return `<div class="ready-entry-row" data-ready-row>
    <div class="ready-row-number">1</div>
    <label>Дата<input data-ready-date type="date" value="${esc(preset.date||"")}"></label>
    <label>Вид<select data-ready-type>${readyTypeOptions(preset.type||"Лекція")}</select></label>
    <label>Пара<select data-ready-pair>${readyPairOptions(preset.pairId||firstPair)}</select></label>
    <label>Аудиторія<input data-ready-room list="readyRoomList" placeholder="324, 415, онлайн…" value="${esc(preset.room||"")}"></label>
    <button type="button" class="danger small-btn" data-ready-remove>×</button>
  </div>`;
}
function renumberReadyRows(){
  $$("[data-ready-row]").forEach((r,i)=>{
    const n=r.querySelector(".ready-row-number");
    if(n)n.textContent=i+1;
  });
}
function bindReadyRow(row){
  const remove=row.querySelector("[data-ready-remove]");
  if(remove)remove.onclick=()=>{
    if($$("[data-ready-row]").length<=1){
      row.querySelector("[data-ready-date]").value="";
      row.querySelector("[data-ready-room]").value="";
      return;
    }
    row.remove();
    renumberReadyRows();
    readyUpdateEmptyState();
  };
}
function addReadyScheduleRow(preset={}){
  const box=$("#readyRows");if(!box)return;
  box.insertAdjacentHTML("beforeend",readyRowHtml(preset));
  bindReadyRow(box.lastElementChild);
  renumberReadyRows();
  readyUpdateEmptyState();
  applyReadyDateBounds();
}
function applyReadyDateBounds(){
  const group=$("#readyGroup")?.value||"";
  const ref=$("#readyDiscipline")?.value||"";
  const b=readyDateBounds(group,ref);
  $$("[data-ready-date]").forEach(el=>{
    el.min=b.start;
    el.max=b.end;
    if(el.value&&!dateInBounds(el.value,b))el.value="";
  });
  const hint=$("#readyDateHint");
  if(hint)hint.textContent=`Дати: ${formatDate(b.start)} — ${formatDate(b.end)}`;
}
function parseReadyDateToken(token){
  const s=String(token||"").trim();
  if(!s)return null;
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  const m=s.match(/^(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?$/);
  if(!m)return null;
  const day=Number(m[1]),month=Number(m[2]);
  if(month<1||month>12||day<1||day>31)return null;
  const ay=parseAcademicYear();
  let year=m[3]?Number(m[3]):(month>=9?ay.startYear:ay.endYear);
  if(year<100)year+=2000;
  return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}
function addReadyDatesFromText(){
  const input=$("#readyDatesPaste");
  const raw=(input?.value||"").trim();
  if(!raw)return;
  const tokens=raw.split(/[\s,;]+/).filter(Boolean);
  const dates=tokens.map(parseReadyDateToken).filter(Boolean);
  if(!dates.length)return alert("Не знайшов дат. Можна вставити, наприклад: 03.09, 10.09, 17.09");
  const group=$("#readyGroup").value;
  const ref=$("#readyDiscipline").value;
  const b=readyDateBounds(group,ref);
  const invalid=dates.filter(d=>!dateInBounds(d,b));
  if(invalid.length)return alert(`Ці дати не входять у дозволений період: ${invalid.map(formatDate).join(", ")}`);

  const rows=$$("[data-ready-row]");
  if(rows.length===1&&!rows[0].querySelector("[data-ready-date]").value){
    rows[0].querySelector("[data-ready-date]").value=dates[0];
    dates.slice(1).forEach(d=>addReadyScheduleRow({date:d}));
  }else{
    dates.forEach(d=>addReadyScheduleRow({date:d}));
  }
  readyUpdateEmptyState();
  input.value="";
}
function applyReadyDefaults(){
  const type=$("#readyDefaultType").value;
  const pair=$("#readyDefaultPair").value;
  const room=$("#readyDefaultRoom").value.trim();
  $$("[data-ready-row]").forEach(row=>{
    if(type)row.querySelector("[data-ready-type]").value=type;
    if(pair)row.querySelector("[data-ready-pair]").value=pair;
    if(room)row.querySelector("[data-ready-room]").value=room;
  });
}
function readySameExternalTeacherConflict(item,ignoreId=null,extra=[]){
  if(item.teacherId||!item.teacher)return [];
  const key=normIdentity(item.teacher);
  if(!key)return [];
  return db.schedule.concat(extra||[]).filter(x=>{
    if(Number(x.id)===Number(ignoreId)||x.date!==item.date)return false;
    const sameSlot=item.pairId&&x.pairId
      ? String(item.pairId)===String(x.pairId)
      : timeOverlap(item.start,item.end,x.start,x.end);
    return sameSlot&&!x.teacherId&&normIdentity(x.teacher)===key;
  });
}
function readyBuildItem(row,common){
  const pairId=row.querySelector("[data-ready-pair]").value;
  const pair=pairById(pairId);
  const teacherId=readyTeacherIdFromText(common.teacher);
  const teacherObj=teacherById(teacherId);
  return {
    date:row.querySelector("[data-ready-date]").value,
    pairId:pairId?Number(pairId):null,
    start:pair?.start||"",
    end:pair?.end||"",
    group:common.group,
    audienceGroups:uniqueStrings(common.audienceGroups||[common.group]),
    disciplineId:null,
    disciplineIds:[],
    discipline:common.discipline,
    type:row.querySelector("[data-ready-type]").value,
    workloadHours:0,
    coverage:common.coverage,
    students:"",
    teacherId:teacherId||null,
    teacher:teacherObj?teacherDisplay(teacherObj):common.teacher,
    room:row.querySelector("[data-ready-room]").value.trim(),
    note:common.note,
    repeatBatchId:common.batchId,
    scheduleSource:"ready_external",
    sourceCurriculumId:common.plan?.curriculumId||null,
    sourceComponentId:common.plan?.componentId||null,
    sourceSemester:common.plan?.semester||null,
    sourcePlanRef:common.plan?.ref||""
  };
}
function readyRefreshPlanFields(){
  const group=$("#readyGroup").value;
  const ref=$("#readyDiscipline").value;
  $("#readyCustomDiscipline").style.display=ref==="__custom__"?"":"none";
  const rec=readyPlanRecordByRef(group,ref);
  const info=$("#readyPlanInfo");
  if(info){
    info.innerHTML=rec
      ? `<div class="notice success-notice"><b>${esc(rec.name)}</b> · ${rec.semester} семестр${rec.scope==="external"?" · не кафедральна дисципліна":""}. Записи підуть одразу в розклад і не потраплять у кафедральне навантаження.</div>`
      : `<div class="notice">Ці заняття не списують кафедральне навантаження.</div>`;
  }
  applyReadyDateBounds();
}
let readyExternalManagerState={group:"",discipline:"",semester:"",planRef:""};
function readyExternalManagerRows(group,discipline,semester=""){
  return db.schedule
    .filter(x=>isReadyExternalScheduleItem(x)&&!x.specialSchedule)
    .filter(x=>scheduleIncludesGroup(x,group))
    .filter(x=>normIdentity(x.discipline)===normIdentity(discipline))
    .filter(x=>!semester||!x.sourceSemester||Number(x.sourceSemester)===Number(semester))
    .slice()
    .sort((a,b)=>String(a.date||"").localeCompare(String(b.date||""))||Number(a.pairId||99)-Number(b.pairId||99));
}
function openReadyExternalManager(group,discipline,semester="",planRef=""){
  readyExternalManagerState={group,discipline,semester,planRef};
  const rows=readyExternalManagerRows(group,discipline,semester);

  openModal(`<div class="ready-manager">
    <div class="ready-manager-head" style="${scheduleColorVars({group,discipline})}">
      <div>
        <span>ГОТОВИЙ РОЗКЛАД · ІНША КАФЕДРА</span>
        <h2>${esc(discipline)}</h2>
        <p>${esc(group)}${semester?` · ${esc(semester)} семестр`:""} · ${rows.length} пар · ${fmtHours(rows.reduce((s,x)=>s+readyAcademicHours(x),0))} академічних годин</p>
      </div>
      <button class="primary" data-group="${esc(group)}" data-ref="${esc(planRef||"")}" data-discipline="${esc(discipline)}" onclick="closeModal();openReadyScheduleForDiscipline(this.dataset.group,this.dataset.ref,this.dataset.discipline)">+ Додати пари</button>
    </div>

    ${rows.length?`<div class="ready-manager-list">${rows.map(x=>`<div class="ready-manager-row">
      <div class="ready-manager-date"><b>${formatDate(x.date)}</b><span>${esc(weekdayNameForDate(x.date))}</span></div>
      <div class="ready-manager-pair"><b>${esc(pairDisplay(x))}</b><span>${esc(pairTimeDisplay(x)||"")}</span></div>
      <div class="ready-manager-main">
        <b>${esc(x.type||"Заняття")}</b>
        <span>${esc(x.teacher||"викладач не вказаний")} · ${esc(x.room||"без аудиторії")}</span>
        ${scheduleAudienceGroups(x).length>1?`<small>Потік: ${esc(scheduleAudienceLabel(x))}</small>`:""}
      </div>
      <div class="ready-manager-actions">
        <button onclick="openReadyScheduleModal(${x.id})">Редагувати</button>
        <button class="quiet-danger" onclick="deleteReadyExternalItem(${x.id})">Видалити</button>
      </div>
    </div>`).join("")}</div>`:`<div class="empty">Пар ще немає. Дисципліна вже є в навчальному плані — натисни «+ Додати пари».</div>`}
  </div>`,true);
}
function deleteReadyExternalItem(id){
  const x=db.schedule.find(r=>Number(r.id)===Number(id));
  if(!x)return;
  if(!confirm(`Видалити ${formatDate(x.date)} · ${pairDisplay(x)} · ${x.discipline}?`))return;
  db.schedule=db.schedule.filter(r=>Number(r.id)!==Number(id));
  save();
  openReadyExternalManager(readyExternalManagerState.group,readyExternalManagerState.discipline,readyExternalManagerState.semester,readyExternalManagerState.planRef);
}

let readyAudienceSelection=[];
let readySchedulePreset=null;
function readyAudienceButtonsHtml(selected=[]){
  const set=new Set((selected||[]).map(normIdentity));
  return `<div class="ready-audience-buttons">${sortedGroups().map(g=>`<button type="button" class="ready-audience-btn ${set.has(normIdentity(g.code))?"active":""}" data-ready-audience="${esc(g.code)}" onclick="toggleReadyAudienceGroup('${String(g.code).replaceAll("'","\\'")}')"><b>${esc(g.code)}</b><span>${esc(g.course)} курс</span></button>`).join("")}</div>`;
}
function renderReadyAudienceButtons(){
  const box=$("#readyAudienceButtons");if(box)box.innerHTML=readyAudienceButtonsHtml(readyAudienceSelection);
  const label=$("#readyAudienceSummary");if(label)label.textContent=readyAudienceSelection.length>1?`Потік: ${readyAudienceSelection.join(" + ")}`:`Одна група: ${readyAudienceSelection[0]||"—"}`;
}
function toggleReadyAudienceGroup(code){
  const primary=$("#readyGroup")?.value||code,key=normIdentity(code),exists=readyAudienceSelection.some(g=>normIdentity(g)===key);
  if(exists){if(normIdentity(code)===normIdentity(primary))return;readyAudienceSelection=readyAudienceSelection.filter(g=>normIdentity(g)!==key);}
  else readyAudienceSelection=uniqueStrings([...readyAudienceSelection,code]);
  if(!readyAudienceSelection.some(g=>normIdentity(g)===normIdentity(primary)))readyAudienceSelection.unshift(primary);
  renderReadyAudienceButtons();
}
function openReadyScheduleForDiscipline(group,planRef="",discipline=""){
  readySchedulePreset={group,planRef,discipline};
  openReadyScheduleModal();
}

function openReadyScheduleModal(editId=null){
  const existing=editId?db.schedule.find(x=>Number(x.id)===Number(editId)):null;
  const editing=!!existing;
  const preset=(!existing&&readySchedulePreset)?readySchedulePreset:null;
  const defaultGroup=existing?.group||preset?.group||currentWorkloadGroup()||db.groups[0]?.code||"";
  readyAudienceSelection=uniqueStrings(existing?.audienceGroups?.length?existing.audienceGroups:[defaultGroup]);

  let selectedRef="__custom__";
  if(existing?.sourceCurriculumId&&existing?.sourceComponentId&&existing?.sourceSemester){
    selectedRef=`plan:${existing.sourceCurriculumId}:${existing.sourceComponentId}:${existing.sourceSemester}`;
  }else if(!existing&&preset?.planRef){
    selectedRef=preset.planRef;
  }else if(!existing&&preset?.discipline){
    selectedRef="__custom__";
  }else if(!existing){
    selectedRef="";
  }

  const teacherText=existing?.teacher||"";
  readyScheduleMode=editing?"single":null;

  openModal(`<div class="ready-schedule-modal">
    <div class="allocation-scheduler-head">
      <div>
        <h2>${editing?"Редагувати готову пару":"Внести готові пари"}</h2>
        <div class="small">Для політології, філософії, іноземної мови та інших занять, які приходять уже готовим розкладом.</div>
      </div>
      <span class="badge ok">БЕЗ НАВАНТАЖЕННЯ</span>
    </div>

    <div class="ready-common-grid">
      <label>Група
        <select id="readyGroup">${groupOptions(defaultGroup)}</select>
      </label>
      <label class="ready-discipline-field">Дисципліна
        <select id="readyDiscipline">${readyPlanOptions(defaultGroup,selectedRef)}</select>
        <input id="readyCustomDiscipline" placeholder="Назва дисципліни"
          value="${esc(existing&&!existing.sourceComponentId?(existing.discipline||""):(preset?.discipline||""))}"
          style="display:${selectedRef==="__custom__"?"":"none"}">
      </label>
      <label>Викладач
        <input id="readyTeacher" list="readyTeacherList" placeholder="ПІБ або вибери з довідника" value="${esc(teacherText)}">
        <small>Якщо такого ПІБ ще немає в довіднику, система автоматично створить зовнішнього викладача. Його пари з’являться у розкладі та в розділі «Викладачі».</small>
      </label>
      <label>Охоплення
        <select id="readyCoverage">${db.coverageTypes.map(v=>`<option ${v===(existing?.coverage||"Вся група")?"selected":""}>${esc(v)}</option>`).join("")}</select>
      </label>
      <div class="wide ready-audience-section">
        <div class="ready-audience-head"><div><b>Хто слухає цю пару</b><span id="readyAudienceSummary"></span></div><small>Можна вибрати кілька груп. У базі це буде одна реальна пара для потоку.</small></div>
        <div id="readyAudienceButtons"></div>
      </div>
      <label class="wide">Примітка
        <input id="readyNote" placeholder="необов’язково" value="${esc(existing?.note||"")}">
      </label>
    </div>

    <datalist id="readyTeacherList">${readyTeacherDatalist()}</datalist>
    <datalist id="readyRoomList">${readyRoomDatalist()}</datalist>
    <div id="readyPlanInfo"></div>

    ${editing?"":`
      <div class="ready-mode-switch">
        <button type="button" id="readyModeSingle" onclick="setReadyScheduleMode('single')">
          <b>Одна дата</b>
          <span>внести одну конкретну пару</span>
        </button>
        <button type="button" id="readyModeSeries" onclick="setReadyScheduleMode('series')">
          <b>Серія дат</b>
          <span>конкретний список або повторення за правилом</span>
        </button>
      </div>
      <div id="readyModeHint" class="ready-mode-hint">
        Обери спосіб внесення — зайві поля не показуватимуться.
      </div>
    `}

    <div id="readyModeBody"></div>
  </div>`,true);

  readyRefreshPlanFields();

  $("#readyGroup").onchange=()=>{
    const primary=$("#readyGroup").value;
    readyAudienceSelection=[primary];
    renderReadyAudienceButtons();
    $("#readyDiscipline").innerHTML=readyPlanOptions(primary,"");
    $("#readyDiscipline").value="";
    readyRefreshPlanFields();
    if(readyScheduleMode)setReadyScheduleMode(readyScheduleMode,editing?existing:null);
  };

  $("#readyDiscipline").onchange=()=>{
    readyRefreshPlanFields();
    if(readyScheduleMode==="series")setReadyScheduleMode("series");
  };

  renderReadyAudienceButtons();
  if(editing)setReadyScheduleMode("single",existing);
  else setReadyScheduleMode(null);
  readySchedulePreset=null;
}
function saveReadySchedule(e,editId=null){
  e.preventDefault();

  const group=$("#readyGroup").value;
  const ref=$("#readyDiscipline").value;
  const plan=readyPlanRecordByRef(group,ref);
  const discipline=readyDisciplineName();
  let teacher=$("#readyTeacher").value.trim();
  if(teacher){
    const teacherRecord=ensureReadyExternalTeacher(teacher,db);
    if(teacherRecord)teacher=teacherDisplay(teacherRecord);
  }
  const coverage=$("#readyCoverage").value;
  const note=$("#readyNote").value.trim();

  if(!group)return alert("Оберіть групу.");
  if(!discipline)return alert("Оберіть або введіть дисципліну.");

  const b=readyDateBounds(group,ref);
  const rows=$$("[data-ready-row]");
  if(!rows.length)return alert("Додайте хоча б одне заняття.");

  const audienceGroups=uniqueStrings(readyAudienceSelection.length?readyAudienceSelection:[group]);
  if(!audienceGroups.some(g=>normIdentity(g)===normIdentity(group)))audienceGroups.unshift(group);
  const batchId=`READY-${Date.now()}`;
  const common={group,audienceGroups,plan,discipline,teacher,coverage,note,batchId};
  const draft=[],errors=[],warnings=[];

  rows.forEach((row,i)=>{
    const date=row.querySelector("[data-ready-date]").value;
    const pairId=row.querySelector("[data-ready-pair]").value;
    const type=row.querySelector("[data-ready-type]").value;

    if(!date){errors.push(`Рядок ${i+1}: немає дати.`);return;}
    if(!dateInBounds(date,b)){errors.push(`Рядок ${i+1}: дата ${formatDate(date)} поза дозволеним періодом.`);return;}
    if(!pairId){errors.push(`Рядок ${i+1}: не вибрана пара.`);return;}
    if(!type){errors.push(`Рядок ${i+1}: не вибраний вид заняття.`);return;}

    const item=readyBuildItem(row,common);
    const ignore=editId&&i===0?editId:null;
    const cs=conflictsFor(item,ignore,draft);
    const textTeacher=readySameExternalTeacherConflict(item,ignore,draft);
    const all=[...cs,...textTeacher];

    if(all.length){
      const detailed=conflictReasonLines(item,all);
      warnings.push(`${formatDate(item.date)} · ${pairDisplay(item)}: ${detailed.length?detailed.join(" "):"Є конфлікт із уже внесеним розкладом."}`);
    }
    draft.push(item);
  });

  if(errors.length){
    $("#readyConflictBox").innerHTML=`<div class="conflict"><b>Не можу зберегти:</b><br>${errors.map(esc).join("<br>")}</div>`;
    return;
  }

  if(warnings.length&&!confirm("Є конфлікти з уже внесеним розкладом:\n\n"+warnings.join("\n")+"\n\nВсе одно зберегти?"))return;

  if(editId){
    const target=db.schedule.find(x=>Number(x.id)===Number(editId));
    if(!target)return alert("Запис не знайдено.");
    Object.assign(target,draft[0],{id:target.id});
  }else{
    draft.forEach(item=>db.schedule.push({id:uid(db.schedule),...item}));
  }

  rememberWorkloadGroup(group);
  closeModal();
  save();

  if(editId&&readyExternalManagerState.group&&readyExternalManagerState.discipline){
    setTimeout(()=>openReadyExternalManager(readyExternalManagerState.group,readyExternalManagerState.discipline,readyExternalManagerState.semester,readyExternalManagerState.planRef),0);
  }
}

/* Compact schedule journal */
let scheduleJournalState={
  open:false,
  limit:30
};

function scheduleJournalMonthOptions(selected=""){
  const months=academicMonthTabs();
  return `<option value="">Увесь навчальний рік</option>`+
    months.map(m=>`<option value="${esc(m.value)}" ${m.value===selected?"selected":""}>${esc(m.label)}</option>`).join("");
}
function scheduleJournalTeacherOptions(selected=""){
  const names=[...new Set(
    db.schedule
      .filter(x=>!x.specialSchedule&&dateInBounds(x.date)&&x.teacher)
      .map(x=>String(x.teacher).trim())
      .filter(Boolean)
  )].sort((a,b)=>a.localeCompare(b,"uk"));
  return `<option value="">Усі викладачі</option>`+
    names.map(name=>`<option value="${esc(name)}" ${name===selected?"selected":""}>${esc(name)}</option>`).join("");
}
function scheduleJournalDisciplineOptions(selected=""){
  const names=[...new Set(
    db.schedule
      .filter(x=>!x.specialSchedule&&dateInBounds(x.date)&&x.discipline)
      .map(x=>String(x.discipline).trim())
      .filter(Boolean)
  )].sort((a,b)=>a.localeCompare(b,"uk"));
  return `<option value="">Усі дисципліни</option>`+
    names.map(name=>`<option value="${esc(name)}" ${name===selected?"selected":""}>${esc(name)}</option>`).join("");
}
function scheduleJournalCurrentMonth(){
  return currentAcademicDate().slice(0,7);
}
function toggleScheduleJournal(){
  scheduleJournalState.open=!scheduleJournalState.open;
  scheduleJournalState.limit=30;
  const body=$("#scheduleJournalBody");
  const btn=$("#scheduleJournalToggle");
  if(body)body.classList.toggle("hidden",!scheduleJournalState.open);
  if(btn)btn.textContent=scheduleJournalState.open?"Згорнути ↑":"Розгорнути ↓";
  if(scheduleJournalState.open){
    renderScheduleTable();
    requestAnimationFrame(()=>$("#scheduleJournalCard")?.scrollIntoView({behavior:"smooth",block:"nearest"}));
  }
}
function resetScheduleJournalLimit(){
  scheduleJournalState.limit=30;
  renderScheduleTable();
}
function showMoreScheduleJournal(){
  scheduleJournalState.limit+=30;
  renderScheduleTable();
}
function scheduleJournalFilteredRows(){
  const q=($("#scheduleSearch")?.value||"").trim().toLowerCase();
  const group=$("#scheduleGroup")?.value||"";
  const month=$("#scheduleMonth")?.value||"";
  const teacher=$("#scheduleTeacher")?.value||"";
  const discipline=$("#scheduleDiscipline")?.value||"";
  const source=$("#scheduleSource")?.value||"";

  return db.schedule
    .filter(x=>!x.specialSchedule)
    .filter(x=>dateInBounds(x.date))
    .filter(x=>!month||String(x.date||"").slice(0,7)===month)
    .filter(x=>!group||normIdentity(x.group)===normIdentity(group))
    .filter(x=>!teacher||String(x.teacher||"")===teacher)
    .filter(x=>!discipline||String(x.discipline||"")===discipline)
    .filter(x=>{
      if(!source)return true;
      if(source==="ready_external")return isReadyExternalScheduleItem(x);
      if(source==="department")return !isReadyExternalScheduleItem(x);
      return true;
    })
    .filter(x=>!q||JSON.stringify(x).toLowerCase().includes(q))
    .slice()
    .sort((a,b)=>{
      const aPair=Number(pairForLesson(a)?.id||a.pairId||99);
      const bPair=Number(pairForLesson(b)?.id||b.pairId||99);
      return String(a.date||"").localeCompare(String(b.date||""))||aPair-bPair;
    });
}
function scheduleJournalSourceBadge(x){
  if(isReadyExternalScheduleItem(x))return `<span class="badge ready-badge">ГОТОВА ПАРА</span>`;
  return `<span class="badge journal-dept-badge">КАФЕДРАЛЬНА</span>`;
}

function renderSchedule(){
  const defaultGroup=bestWorkloadGroup();
  const loadedGroups=groupsWithDistributedAuditoriumLoad();
  const journalMonth=scheduleJournalCurrentMonth();
  const totalSchedule=db.schedule.filter(x=>!x.specialSchedule&&dateInBounds(x.date)).length;

  $("#page-schedule").innerHTML=`<div class="card section">
    <div class="section-head">
      <div><h2>Складання розкладу</h2><div class="small">Кафедральні пари йдуть із «Навантаження». Пари інших кафедр можна внести одразу кнопкою «Внести готові пари» — без активації та розподілу годин.</div></div>
      <div class="actions"><button class="ready-import-btn" onclick="openReadyScheduleModal()">+ Внести готові пари</button><button class="secondary" onclick="openLessonModal(null,{group:currentWorkloadGroup()})">+ Одне заняття</button></div>
    </div>
    <div class="workflow-status-strip workflow-context-strip">
      <div class="workflow-load-count">
        <span>Груп із розподіленим навантаженням</span>
        <b>${loadedGroups.length}</b>
      </div>
      <div class="workflow-selected-group">
        <div class="workflow-selected-group-label">
          <span>Вибрана група</span>
          <small>зараз працюємо з її навантаженням</small>
        </div>
        <div class="workflow-selected-group-value">
          <b id="workloadGroupLabel">${esc(defaultGroup)}</b>
          <strong id="workloadGroupCourse">${esc(groupCourse(defaultGroup))} курс</strong>
        </div>
      </div>
    </div>
    <input id="workloadGroup" type="hidden" value="${esc(defaultGroup)}">
    <div id="workloadGroupButtons">
      ${groupSwitchRowHtml({
        selected:defaultGroup,
        onclick:"setWorkloadScheduleGroup",
        groups:sortedGroups(),
        badgeFn:g=>{
          const rows=workloadTeacherRowsForGroup(g.code);
          return rows.length?`${rows.length} навант.`:"—";
        },
        extraClass:"schedule-group-switch"
      })}
    </div>
    <div id="workloadScheduleBox"></div>
  </div>

  <div class="card section schedule-journal-card" id="scheduleJournalCard">
    <div class="schedule-journal-head">
      <button class="schedule-journal-title" type="button" onclick="toggleScheduleJournal()">
        <span>
          <b>Журнал занять</b>
          <small>Пошук, редагування та видалення вже внесених пар</small>
        </span>
        <strong>${totalSchedule} записів</strong>
      </button>
      <div class="actions">
        <button class="secondary" onclick="go('timetable')">Відкрити календар →</button>
        <button class="secondary" id="scheduleJournalToggle" onclick="toggleScheduleJournal()">${scheduleJournalState.open?"Згорнути ↑":"Розгорнути ↓"}</button>
      </div>
    </div>

    <div id="scheduleJournalBody" class="${scheduleJournalState.open?"":"hidden"}">
      <div class="journal-filter-grid">
        <label>Місяць
          <select id="scheduleMonth">${scheduleJournalMonthOptions(journalMonth)}</select>
        </label>
        <label class="journal-group-placeholder">Група
          <input id="scheduleGroup" type="hidden" value="">
          <span>обирається кнопками нижче</span>
        </label>
        <label>Викладач
          <select id="scheduleTeacher">${scheduleJournalTeacherOptions()}</select>
        </label>
        <label>Дисципліна
          <select id="scheduleDiscipline">${scheduleJournalDisciplineOptions()}</select>
        </label>
        <label>Джерело
          <select id="scheduleSource">
            <option value="">Усі заняття</option>
            <option value="department">Кафедральні</option>
            <option value="ready_external">Готові пари інших кафедр</option>
          </select>
        </label>
        <label class="journal-search-field">Пошук
          <input id="scheduleSearch" placeholder="аудиторія, назва, примітка…">
        </label>
      </div>

      <div id="scheduleJournalGroupButtons">
        ${groupSwitchRowHtml({
          selected:"",
          onclick:"setScheduleJournalGroup",
          includeAll:true,
          badgeFn:g=>String(db.schedule.filter(x=>dateInBounds(x.date)&&normIdentity(x.group)===normIdentity(g.code)).length),
          extraClass:"journal-group-switch"
        })}
      </div>

      <div id="scheduleJournalSummary" class="schedule-journal-summary"></div>
      <div id="scheduleTable"></div>
    </div>
  </div>`;

  setWorkloadScheduleGroup(defaultGroup);

  if(scheduleJournalState.open){
    ["scheduleMonth","scheduleTeacher","scheduleDiscipline","scheduleSource"].forEach(id=>{
      const el=$("#"+id);
      if(el)el.onchange=resetScheduleJournalLimit;
    });
    const search=$("#scheduleSearch");
    if(search)search.oninput=resetScheduleJournalLimit;
    renderScheduleTable();
  }
}
function setScheduleJournalGroup(code){
  const input=$("#scheduleGroup");
  if(input)input.value=code||"";

  const wrap=$("#scheduleJournalGroupButtons");
  if(wrap){
    wrap.innerHTML=groupSwitchRowHtml({
      selected:code||"",
      onclick:"setScheduleJournalGroup",
      includeAll:true,
      badgeFn:g=>String(db.schedule.filter(x=>dateInBounds(x.date)&&normIdentity(x.group)===normIdentity(g.code)).length),
      extraClass:"journal-group-switch"
    });
  }

  resetScheduleJournalLimit();
}

function renderScheduleTable(){
  if(!scheduleJournalState.open||!$("#scheduleTable"))return;

  const rows=scheduleJournalFilteredRows();
  const visible=rows.slice(0,scheduleJournalState.limit);
  const remaining=Math.max(0,rows.length-visible.length);

  const summary=$("#scheduleJournalSummary");
  if(summary){
    summary.innerHTML=`<span><b>${rows.length}</b> знайдено</span><span>показано <b>${visible.length}</b></span>`;
  }

  $("#scheduleTable").innerHTML=visible.length
    ? `<div class="table-wrap journal-table-wrap"><table class="journal-table">
        <thead><tr>
          <th>Дата</th><th>Пара</th><th>Група</th><th>Дисципліна</th>
          <th>Вид</th><th>Аудиторія</th><th>Викладач</th><th>Джерело</th><th></th>
        </tr></thead>
        <tbody>${visible.map(x=>`<tr>
          <td><b>${formatDate(x.date)}</b></td>
          <td><b>${esc(pairDisplay(x))}</b>${pairTimeDisplay(x)?`<div class="small">${esc(pairTimeDisplay(x))}</div>`:""}</td>
          <td>${esc(scheduleAudienceLabel(x)||"—")}</td>
          <td><b>${esc(x.discipline||"—")}</b></td>
          <td>${esc(x.type||"—")}</td>
          <td><b>${esc(x.room||"—")}</b></td>
          <td>${esc(x.teacher||"—")}</td>
          <td>${scheduleJournalSourceBadge(x)}</td>
          <td class="actions">
            <button onclick="${isReadyExternalScheduleItem(x)?`openReadyScheduleModal(${x.id})`:`openLessonModal(${x.id})`}">Редагувати</button>
            <button onclick="deleteLesson(${x.id})">Видалити</button>
          </td>
        </tr>`).join("")}</tbody>
      </table></div>
      ${remaining?`<div class="journal-more"><button class="secondary" onclick="showMoreScheduleJournal()">Показати ще 30 <span>(${remaining} залишилось)</span></button></div>`:""}`
    : `<div class="empty journal-empty">За вибраними фільтрами занять немає.</div>`;
}
function conflictEventTimeLabel(x){
  if(x?.specialSchedule)return specialSlotLabel(x);
  const pair=pairDisplay(x);
  const times=pairTimeDisplay(x);
  return `${pair||"час не вказано"}${times?` · ${times}`:""}`;
}
function conflictEventContext(x){
  const parts=[];
  if(scheduleAudienceGroups(x).length)parts.push(scheduleAudienceLabel(x));
  if(x?.discipline||x?.title||x?.kind)parts.push(x.discipline||x.title||x.kind);
  if(x?.teacher)parts.push(x.teacher);
  if(x?.specialSchedule){
    const student=specialStudentName(x);
    if(student)parts.push(student);
  }
  return parts.filter(Boolean).join(" · ");
}
function conflictReasonLines(item,conflicts=[]){
  const lines=[];
  const seen=new Set();
  const add=line=>{
    const key=normIdentity(line);
    if(!key||seen.has(key))return;
    seen.add(key);
    lines.push(line);
  };

  (conflicts||[]).forEach(c=>{
    const time=conflictEventTimeLabel(c);
    const context=conflictEventContext(c);
    const tail=[time,context].filter(Boolean).join(" — ");

    if(item.room&&c.room&&normIdentity(item.room)===normIdentity(c.room)){
      add(`Аудиторія ${item.room} зайнята${tail?` — ${tail}`:""}.`);
    }

    const conflictTeacherId=resolvedScheduleTeacherId(c,db);
    if(item.teacherId&&Number(conflictTeacherId)===Number(item.teacherId)){
      const teacherName=teacherDisplay(teacherById(item.teacherId))||item.teacher||"Викладач";
      add(`Викладач ${teacherName} уже зайнятий у цей час${tail?` — ${tail}`:""}.`);
    }

    if(item.studentId&&c.studentId&&Number(item.studentId)===Number(c.studentId)){
      const student=db.students.find(s=>Number(s.id)===Number(item.studentId));
      add(`Студент ${student?.name||item.students||"—"} уже зайнятий у цей час${tail?` — ${tail}`:""}.`);
    }

    const sameGroup=scheduleGroupsOverlap(item,c);
    const groupIsConflict=sameGroup&&!(item.specialSchedule&&c.specialSchedule);
    if(groupIsConflict){
      add(`У групи/потоку ${scheduleAudienceLabel(item)} уже є заняття в цей час${tail?` — ${tail}`:""}.`);
    }
  });

  return lines;
}
function conflictDetailsHtml(item,conflicts=[],availabilityWarnings=[]){
  const reasons=[
    ...conflictReasonLines(item,conflicts),
    ...(availabilityWarnings||[])
  ];
  if(!reasons.length)return "";
  return `<div class="conflict conflict-detailed">
    <b>Не можу зберегти. Ось де саме конфлікт:</b>
    <ul>${reasons.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
  </div>`;
}
function roomConflictRecord(date,start,end,pairId,room,ignoreId=null){
  const scheduleHit=db.schedule.find(x=>{
    if(Number(x.id)===Number(ignoreId))return false;
    if(x.date!==date||normIdentity(x.room)!==normIdentity(room))return false;
    if(start&&end)return timeOverlap(start,end,x.start,x.end);
    return pairId&&String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId);
  });
  if(scheduleHit)return scheduleHit;

  const bookingHit=db.roomBookings.find(x=>{
    if(x.date!==date||normIdentity(x.room)!==normIdentity(room))return false;
    if(start&&end)return timeOverlap(start,end,x.start,x.end);
    return pairId&&String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId);
  });
  return bookingHit?{...bookingHit,source:"booking",discipline:bookingHit.title||bookingHit.kind||"Бронювання"}:null;
}
function roomBusyOptionLabel(room,record){
  if(!record)return room;
  const who=record.specialSchedule
    ? specialStudentName(record)
    : (record.group||record.teacher||"");
  const what=record.discipline||record.title||record.kind||"заняття";
  const time=record.specialSchedule?specialSlotLabel(record):pairDisplay(record);
  return `${room} · ЗАЙНЯТА — ${[time,who,what].filter(Boolean).join(" · ")}`;
}

function conflictsFor(item,ignore=null,extra=[]){
  const sameSlot=x=>{if(x.date!==item.date)return false;if(item.specialSchedule||x.specialSchedule)return timeOverlap(item.start,item.end,x.start,x.end);return item.pairId&&x.pairId?String(item.pairId)===String(x.pairId):timeOverlap(item.start,item.end,x.start,x.end);};
  const lessonConflicts=db.schedule.concat(extra||[]).filter(x=>x.id!==ignore&&sameSlot(x)).filter(x=>(item.room&&x.room===item.room)||(scheduleGroupsOverlap(item,x)&&!(item.specialSchedule&&x.specialSchedule))||(item.studentId&&x.studentId&&Number(item.studentId)===Number(x.studentId))||(item.teacherId&&Number(resolvedScheduleTeacherId(x,db))===Number(item.teacherId)));
  const bookingConflicts=db.roomBookings.filter(x=>x.date===item.date&&(item.pairId&&x.pairId?String(item.pairId)===String(x.pairId):timeOverlap(item.start,item.end,x.start,x.end))).filter(x=>(item.room&&x.room===item.room)||(x.group&&scheduleIncludesGroup(item,x.group))||(item.teacherId&&x.teacherId&&Number(x.teacherId)===Number(item.teacherId))).map(x=>({...x,discipline:x.title||x.kind||"Бронювання"}));
  return [...lessonConflicts,...bookingConflicts];
}
function teacherAvailabilityInfo(item,ignoreId=null,extra=[]){
  const warnings=[],notes=[];
  const t=teacherById(item.teacherId);
  if(!t||t.scope==="external"||!item.date)return{warnings,notes};

  if(t.employmentStart&&item.date<t.employmentStart)
    warnings.push(`Дата заняття раніше дати початку роботи викладача (${formatDate(t.employmentStart)}).`);
  if(t.employmentEnd&&item.date>t.employmentEnd)
    warnings.push(`Дата заняття пізніше дати завершення роботи / контракту (${formatDate(t.employmentEnd)}).`);

  if(item.start&&item.end){
    const unavailable=(t.unavailableRules||[]).some(r=>ruleApplies(r,item.date)&&ruleTimeMatches(r,item.start,item.end));
    if(unavailable)warnings.push("Викладач позначив цю пару як недоступну.");

    const applicablePref=(t.preferredRules||[]).filter(r=>ruleApplies(r,item.date));
    if(applicablePref.length){
      const ok=applicablePref.some(r=>ruleTimeMatches(r,item.start,item.end));
      notes.push(ok
        ?"Бажаний час викладача."
        :"Пара поза бажаним часом викладача.");
    }
  }

  const existing=db.schedule
    .concat(extra||[])
    .filter(x=>x.id!==ignoreId&&Number(resolvedScheduleTeacherId(x,db))===Number(t.id)&&x.date===item.date);

  const dayUnits=existing.reduce((sum,x)=>sum+(x.specialSchedule?0.5:1),0)+(item.specialSchedule?0.5:1);
  if(t.maxPerDay&&dayUnits>Number(t.maxPerDay)+.0001)
    warnings.push(`Перевищено максимум пар викладача на день: ${t.maxPerDay}. Індивідуальна академічна година рахується як ½ пари.`);

  if(t.maxConsecutive&&item.pairId){
    const ids=new Set(
      existing
        .map(x=>Number(x.pairId||pairIdForTimes(x.start,x.end)))
        .filter(Number.isFinite)
    );
    ids.add(Number(item.pairId));
    const sorted=[...ids].sort((a,b)=>a-b);
    let longest=0,current=0,prev=null;
    for(const id of sorted){
      if(prev!==null&&id===prev+1)current++;
      else current=1;
      longest=Math.max(longest,current);
      prev=id;
    }
    if(longest>Number(t.maxConsecutive))
      warnings.push(`Перевищено максимум пар підряд: ${t.maxConsecutive}.`);
  }

  return{warnings,notes};
}
function teacherPairAvailability(date,pairId,teacherId,extra=[]){
  const pair=pairById(pairId);
  const item={
    date,
    pairId,
    start:pair?.start||"",
    end:pair?.end||"",
    teacherId:Number(teacherId)||null
  };
  return teacherAvailabilityInfo(item,null,extra);
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
  const primaryGroup=d?.group||group;
  const did=d?Number(d.id):(disciplineId?Number(disciplineId):null);
  return {date,pairId:pairId&&pairId!=="__custom__"?Number(pairId):null,start:pair?.start||start||"",end:pair?.end||end||"",group:primaryGroup,audienceGroups:uniqueStrings([primaryGroup]),disciplineId:did,disciplineIds:did?[did]:[],discipline:d?.name||discipline,type,workloadHours:num(workloadHours),coverage,students:students||"",teacherId:teacherId?Number(teacherId):null,teacher:t?teacherDisplay(t):"",room:room||"",note:note||"",repeatBatchId};
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
  const readLesson=()=>{const did=$("#ldi").value,disciplineId=did&&did!=="__custom__"?Number(did):null,d=disciplineById(disciplineId),tid=$("#ltea").value?Number($("#ltea").value):null,pv=$("#lpair").value;const item=lessonItemFromValues({date:$("#ld").value,pairId:pv,start:$("#ls")?.value,end:$("#le")?.value,group:$("#lg").value,disciplineId,discipline:did==="__custom__"?$("#ldiCustom").value.trim():(d?.name||""),type:$("#lt").value,workloadHours:$("#lwh").value,coverage:$("#lc").value,students:$("#lst").value.trim(),teacherId:tid,room:$("#lr").value,note:$("#ln").value.trim()});if(id&&existing){item.audienceGroups=existing.audienceGroups||item.audienceGroups;item.disciplineIds=existing.disciplineIds||item.disciplineIds;}return item;};
  const check=()=>{const item=readLesson(),cs=conflictsFor(item,id),info=teacherAvailabilityInfo(item,id);let html="";if(cs.length||info.warnings.length)html+=conflictDetailsHtml(item,cs,info.warnings);if(info.notes.length)html+=`<div class="notice">${info.notes.map(esc).join("<br>")}</div>`;$("#conflictBox").innerHTML=html;};
  $("#lg").onchange=()=>{$("#ldi").innerHTML=disciplineOptionsForGroup($("#lg").value,null,true);populateLessonFormFromLoad({});check();};$("#ldi").onchange=()=>{populateLessonFormFromLoad({});applyLessonDateBounds();check();};$("#lt").onchange=()=>{refreshTeachersAndLoad(null);check();};$("#ltea").onchange=()=>{renderLoadHint();check();};
  $("#lpair").onchange=()=>{$("#customTimeBox").style.display=$("#lpair").value==="__custom__"?"grid":"none";check();};["ld","lr","lwh"].forEach(k=>$("#"+k).onchange=check);check();
  $("#lf").onsubmit=e=>{e.preventDefault();const item=readLesson();if(!item.discipline)return alert("Вкажіть дисципліну.");const d0=item.disciplineId?disciplineById(item.disciplineId):null,b0=d0?semesterDateBounds(d0.semester):academicYearBounds();if(!dateInBounds(item.date,b0))return alert(`Дата має бути в межах ${d0?`${d0.semester} семестру`:`навчального року`}: ${academicDateMessage(b0)}.`);if(!item.pairId&&(!item.start||!item.end||item.end<=item.start))return alert("Оберіть пару або коректний час.");const d=item.disciplineId?disciplineById(item.disciplineId):null;if(d){if(!item.teacherId)return alert("Потрібно вибрати викладача з розподіленого навантаження.");const rem=remainingLoad(d,item.teacherId,item.type,id);if(item.workloadHours>rem+0.0001)return alert(`Недостатньо розподілених годин. Залишок у ${teacherDisplay(teacherById(item.teacherId))}: ${fmtHours(rem)} год. Зміни розподіл у «Навантаженні» або зменш години цього заняття.`);}const cs=conflictsFor(item,id),info=teacherAvailabilityInfo(item,id);if((cs.length||info.warnings.length)&&!confirm("Є конфлікт або обмеження викладача. Все одно зберегти?"))return;if(id)Object.assign(db.schedule.find(s=>s.id===id),item);else db.schedule.push({id:uid(db.schedule),...item});currentEditingLessonId=null;closeModal();save();};
}
/* Integrated calendar planner */
let disciplinePlannerState={disciplineId:null,teacherId:null,month:null,date:null,entryMode:null};
function schedulerMonthBounds(month){const [y,m]=month.split("-").map(Number),last=String(new Date(y,m,0,12,0,0).getDate()).padStart(2,"0");return {start:`${y}-${String(m).padStart(2,"0")}-01`,end:`${y}-${String(m).padStart(2,"0")}-${last}`};}
function schedulerMonthsForDiscipline(d){const b=semesterDateBounds(d.semester);return academicMonthTabs().filter(m=>{const mb=schedulerMonthBounds(m.value);return mb.end>=b.start&&mb.start<=b.end;});}
function schedulerCurrentMonth(d){return clampDate(currentAcademicDate(),semesterDateBounds(d.semester)).slice(0,7);}
function schedulerDateForMonth(d,month,preferred=null){const b=semesterDateBounds(d.semester),mb=schedulerMonthBounds(month);if(preferred&&preferred.slice(0,7)===month&&dateInBounds(preferred,b))return preferred;const today=currentAcademicDate();if(today.slice(0,7)===month&&dateInBounds(today,b))return today;return mb.start<b.start?b.start:mb.start;}
function plannerTypes(d,teacherId){return schedulableTypes(d).map(lt=>{const planned=teacherTypePlan(d,teacherId,lt.name);if(planned<=0)return null;const scheduled=scheduledLoad(d.id,teacherId,lt.name);return {lt,planned,scheduled,remaining:Math.max(0,planned-scheduled)};}).filter(Boolean);}
function plannerDefaultUnit(typeName,remaining){const lt=lessonTypeByName(typeName),unit=isAuditoriumPairType(lt)?2:num(lt?.defaultUnit||1);return Math.max(0,Math.min(unit,remaining));}
function plannerScheduleForDate(date){return db.schedule.filter(x=>x.date===date);}
function plannerTeacherEvents(date,teacherId){return plannerScheduleForDate(date).filter(x=>Number(resolvedScheduleTeacherId(x,db))===Number(teacherId));}
function plannerGroupEvents(date,group){return plannerScheduleForDate(date).filter(x=>scheduleIncludesGroup(x,group));}
function plannerOwnEvents(date,d,teacherId){return plannerScheduleForDate(date).filter(x=>scheduleCoversDiscipline(x,d.id)&&Number(resolvedScheduleTeacherId(x,db))===Number(teacherId));}
function plannerDateEventsSummary(date,d,t){
  const own=plannerOwnEvents(date,d,t.id);
  const teacher=plannerTeacherEvents(date,t.id);
  const group=plannerGroupEvents(date,d.group);
  return {own,teacher,group};
}
function plannerEventPair(x){return x.pairId?`${x.pairId} пара`:(x.start||x.end?`${x.start||""}${x.start&&x.end?"–":""}${x.end||""}`:"без №");}
function plannerMonthOwnCount(month,d,t){return db.schedule.filter(x=>String(x.date||"").slice(0,7)===month&&scheduleCoversDiscipline(x,d.id)&&Number(resolvedScheduleTeacherId(x,db))===Number(t.id)).length;}
function plannerMonthTabsHtml(d,t){return `<div class="scheduler-month-tabs">${schedulerMonthsForDiscipline(d).map(m=>{const c=plannerMonthOwnCount(m.value,d,t);return `<button class="${m.value===disciplinePlannerState.month?"active":""}" onclick="setDisciplinePlannerMonth('${m.value}')"><span>${esc(m.label)}</span>${c?`<b>${c}</b>`:""}</button>`;}).join("")}</div>`;}
function plannerCalendarChip(x,kind){
  const pair=x?.pairId||pairIdForTimes(x?.start||"",x?.end||"");
  const pairText=pair?`${pair}п`:"—";
  if(kind==="own"){
    return `<span class="day-detail-chip own" style="${scheduleColorVars(x)}">
      <b>${esc(pairText)}</b><span>${esc(x.type||"наша")}</span><small>${x.room?esc(x.room):"без ауд."}</small>
    </span>`;
  }
  if(kind==="teacher"){
    return `<span class="day-detail-chip teacher">
      <b>${esc(pairText)}</b><span>викл.</span><small>${esc(x.group||"інша група")}</small>
    </span>`;
  }
  return `<span class="day-detail-chip group">
    <b>${esc(pairText)}</b><span>група</span><small>${esc(x.teacher||"інший викл.")}</small>
  </span>`;
}
function plannerCalendarDayHtml(date,d,t){
  const inMonth=date.slice(0,7)===disciplinePlannerState.month;
  const bounds=semesterDateBounds(d.semester);
  const allowed=inMonth&&dateInBounds(date,bounds);

  const own=allowed?plannerOwnEvents(date,d,t.id):[];
  const teacherEvents=allowed?plannerTeacherEvents(date,t.id):[];
  const groupEvents=allowed?plannerGroupEvents(date,d.group):[];

  const otherTeacher=teacherEvents.filter(x=>!own.includes(x));
  const otherGroup=groupEvents.filter(x=>!own.includes(x)&&!otherTeacher.includes(x));

  const detailItems=[
    ...own.map(x=>({x,kind:"own"})),
    ...otherTeacher.map(x=>({x,kind:"teacher"})),
    ...otherGroup.map(x=>({x,kind:"group"}))
  ].sort((a,b)=>{
    const ap=Number(a.x.pairId||pairIdForTimes(a.x.start,a.x.end)||99);
    const bp=Number(b.x.pairId||pairIdForTimes(b.x.start,b.x.end)||99);
    return ap-bp;
  });

  const visible=detailItems.slice(0,3);
  const hidden=Math.max(0,detailItems.length-visible.length);
  const day=Number(date.slice(8,10));
  const selected=date===disciplinePlannerState.date;
  const today=date===localTodayISO();

  return `<button type="button"
    class="scheduler-day ${inMonth?"":"outside-month"} ${allowed?"":"disabled"} ${selected?"selected":""} ${today?"today":""}"
    ${allowed?`onclick="selectDisciplinePlannerDate('${date}')"`:"disabled"}>
      <div class="scheduler-day-head">
        <b>${day}</b>
        <div class="scheduler-day-head-tags">
          ${today?`<span>сьогодні</span>`:""}
          ${allowed?plannerCalendarAvailabilityTag(date,t):""}
        </div>
      </div>
      <div class="scheduler-day-details">
        ${visible.map(item=>plannerCalendarChip(item.x,item.kind)).join("")}
        ${hidden?`<span class="day-detail-more">+${hidden} ще</span>`:""}
        ${allowed&&!detailItems.length?`<span class="day-summary-free">вільний день</span>`:""}
      </div>
    </button>`;
}
function plannerCompactEvent(x,mode){
  if(!x){
    return `<div class="planner-status-free"><b>${mode==="teacher"?"викладач вільний":"група вільна"}</b></div>`;
  }
  const counterpart=mode==="teacher"?(x.group||"—"):(x.teacher||"—");
  return `<div class="planner-status-busy subject-colored" style="${scheduleColorVars(x)}">
    <b>${esc(counterpart)}</b>
    <span>${esc(x.discipline||x.type||"Заняття")}</span>
    <small>${x.room?`ауд. ${esc(x.room)}`:"без аудиторії"}</small>
  </div>`;
}
function plannerFreeRoomsForPair(date,pairId){
  const rooms=(typeof gridRooms==="function"?gridRooms():db.rooms.filter(r=>r.status!=="archived"));
  return rooms.filter(r=>!plannerRoomBusy(date,pairId,r.name));
}
function plannerFreeRoomsText(date,pairId){
  const rooms=plannerFreeRoomsForPair(date,pairId);
  if(!rooms.length)return "немає вільних кафедральних аудиторій";
  const first=rooms.slice(0,3).map(r=>r.name);
  return `вільні ауд.: ${first.join(", ")}${rooms.length>3?` +${rooms.length-3}`:""}`;
}
function plannerDayOverviewCell(x,mode){
  if(!x)return `<div class="planner-day-overview-free">вільно</div>`;
  const main=mode==="group"?(x.teacher||"—"):(x.group||"—");
  return `<div class="planner-day-overview-event subject-colored" style="${scheduleColorVars(x)}">
    <b>${esc(main)}</b>
    <span>${esc(x.discipline||x.type||"Заняття")}</span>
    <small>${x.room?`ауд. ${esc(x.room)}`:"без аудиторії"}${x.type?` · ${esc(x.type)}`:""}</small>
  </div>`;
}
function plannerDayOverviewHtml(d,t,date){
  const teacherEvents=plannerTeacherEvents(date,t.id);
  const groupEvents=plannerGroupEvents(date,d.group);

  return `<div class="planner-calendar-day-overview">
    <div class="planner-calendar-day-overview-head">
      <div>
        <span>Розклад вибраного дня</span>
        <h4>${formatDate(date)} · ${esc(weekdayNameForDate(date))}</h4>
      </div>
      <div class="small">Зліва — група ${esc(d.group)} · справа — ${esc(teacherDisplay(t))}</div>
    </div>

    <div class="planner-day-overview-grid">
      <div class="planner-day-overview-grid-head">
        <span>Пара</span><span>Група ${esc(d.group)}</span><span>Викладач</span>
      </div>
      ${bellPairs().map(pair=>{
        const groupEvent=groupEvents.find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pair.id));
        const teacherEvent=teacherEvents.find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pair.id));
        return `<div class="planner-day-overview-row ${!groupEvent&&!teacherEvent?"free":""}">
          <div class="planner-day-overview-pair">
            <b>${esc(pair.id)} пара</b>
            <span>${esc(pair.start)}–${esc(pair.end)}</span>
          </div>
          ${plannerDayOverviewCell(groupEvent,"group")}
          ${plannerDayOverviewCell(teacherEvent,"teacher")}
        </div>`;
      }).join("")}
    </div>
  </div>`;
}

function plannerDayOccupancyHtml(d,t,date){
  const teacherEvents=plannerTeacherEvents(date,t.id);
  const groupEvents=plannerGroupEvents(date,d.group);
  const canSchedule=plannerTypes(d,t.id).some(x=>x.remaining>0);

  return `<div class="planner-occupancy">
    <div class="planner-occupancy-title">
      <h4>Пари цього дня</h4>
      <span>Видно весь день без додаткової прокрутки</span>
    </div>
    <div class="planner-slot-list">
      ${bellPairs().map(pair=>{
        const teacherEvent=teacherEvents.find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pair.id));
        const groupEvent=groupEvents.find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pair.id));
        const free=!teacherEvent&&!groupEvent;
        return `<div class="planner-slot ${free?"free":"busy"}">
          <div class="planner-slot-top">
            <div class="planner-slot-pair">
              <b>${esc(pair.id)} пара</b>
              <span>${esc(pair.start)}–${esc(pair.end)}</span>
            </div>
            ${free&&canSchedule
              ? `<button type="button" class="planner-slot-add" onclick="plannerAddForPair('${esc(pair.id)}')">+ Додати</button>`
              : `<span class="planner-slot-state">${free?"вільно":"зайнято"}</span>`}
          </div>
          <div class="planner-slot-statuses">
            <div>
              <small>Викладач</small>
              ${plannerCompactEvent(teacherEvent,"teacher")}
            </div>
            <div>
              <small>Група ${esc(d.group)}</small>
              ${plannerCompactEvent(groupEvent,"group")}
            </div>
          </div>
          ${free?`<div class="planner-free-rooms">${esc(plannerFreeRoomsText(date,pair.id))}</div>`:""}
        </div>`;
      }).join("")}
    </div>
  </div>`;
}
function plannerPairBusyInfo(date,pairId,d,t){const teacher=plannerTeacherEvents(date,t.id).find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId)),group=plannerGroupEvents(date,d.group).find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId));return {teacher,group};}
function plannerPairOptions(date,d,t,selected=null){
  return bellPairs().map(p=>{
    const busy=plannerPairBusyInfo(date,p.id,d,t);
    const availability=teacherPairAvailability(date,p.id,t.id);
    const hard=[
      busy.teacher?"викладач зайнятий":"",
      busy.group?"група зайнята":"",
      ...availability.warnings
    ].filter(Boolean);
    const note=availability.notes[0]||"";
    const suffix=hard.length
      ? ` · НЕ МОЖНА: ${hard.join("; ")}`
      : note
        ? ` · ${note.includes("Бажаний")?"БАЖАНО":"поза бажаним часом"}`
        : "";
    return `<option value="${esc(p.id)}" ${String(selected)===String(p.id)?"selected":""} ${hard.length?"disabled":""}>${esc(p.id)} пара · ${esc(p.start)}–${esc(p.end)}${esc(suffix)}</option>`;
  }).join("");
}
function plannerRoomBusyRecord(date,pairId,room){
  return roomConflictRecord(date,"","",pairId,room,null);
}
function plannerRoomBusy(date,pairId,room){
  return !!plannerRoomBusyRecord(date,pairId,room);
}
function plannerRoomOptions(date,pairId,selected=""){
  const rooms=(typeof gridRooms==="function"?gridRooms():db.rooms.filter(r=>r.status!=="archived"));
  return `<option value="">— обери аудиторію —</option>`+rooms.map(r=>{
    const conflict=plannerRoomBusyRecord(date,pairId,r.name);
    const busy=!!conflict;
    return `<option value="${esc(r.name)}" ${r.name===selected?"selected":""} ${busy&&r.name!==selected?"disabled":""}>${esc(roomBusyOptionLabel(r.name,conflict))}</option>`;
  }).join("");
}
function plannerAvailableTypeOptions(d,t,selected=null){return plannerTypes(d,t.id).map(x=>`<option value="${esc(x.lt.name)}" ${x.lt.name===selected?"selected":""} ${x.remaining<=0?"disabled":""}>${esc(x.lt.name)} · залишок ${fmtHours(x.remaining)} год</option>`).join("");}
function plannerNextFreePair(date,d,t){return bellPairs().find(p=>{const b=plannerPairBusyInfo(date,p.id,d,t);return !b.teacher&&!b.group;})?.id||bellPairs()[0]?.id||null;}
function plannerNewRowHtml(d,t,index,typeName=null,pairId=null){
  const types=plannerTypes(d,t.id).filter(x=>x.remaining>0);
  const selectedType=typeName||(types[0]?.lt.name||"");
  const remaining=types.find(x=>x.lt.name===selectedType)?.remaining||0;
  const selectedPair=pairId||plannerNextFreePair(disciplinePlannerState.date,d,t);
  const hours=plannerDefaultUnit(selectedType,remaining);

  return `<div class="planner-entry-row" data-planner-entry>
    <div class="planner-entry-head">
      <div class="planner-entry-number">${index+1}</div>

      <div class="planner-entry-head-copy">
        <b>Заняття</b>
        <span>обери вид, пару та аудиторію</span>
      </div>

      <div class="planner-entry-hours">
        <span>спишеться</span>
        <b data-planner-hours>−${fmtHours(hours)} год</b>
      </div>

      <button type="button" class="planner-entry-remove" data-planner-remove title="Прибрати заняття" aria-label="Прибрати заняття">×</button>
    </div>

    <div class="planner-entry-fields">
      <label>Вид заняття
        <select data-planner-type>${plannerAvailableTypeOptions(d,t,selectedType)}</select>
      </label>
      <label>Пара
        <select data-planner-pair>${plannerPairOptions(disciplinePlannerState.date,d,t,selectedPair)}</select>
      </label>
      <label>Аудиторія
        <select data-planner-room>${plannerRoomOptions(disciplinePlannerState.date,selectedPair)}</select>
      </label>
    </div>
  </div>`;
}
function bindPlannerEntryRow(row,d,t){
  const type=row.querySelector("[data-planner-type]");
  const pair=row.querySelector("[data-planner-pair]");
  const room=row.querySelector("[data-planner-room]");
  const hours=row.querySelector("[data-planner-hours]");

  const refreshHours=()=>{
    const stat=plannerTypes(d,t.id).find(x=>x.lt.name===type.value);
    hours.textContent=`−${fmtHours(plannerDefaultUnit(type.value,stat?.remaining||0))} год`;
  };
  const refreshRoom=()=>{
    const old=room.value;
    room.innerHTML=plannerRoomOptions(disciplinePlannerState.date,pair.value,old);
  };

  type.onchange=refreshHours;
  pair.onchange=refreshRoom;
  row.querySelector("[data-planner-remove]").onclick=()=>{
    row.remove();
    renumberPlannerEntries();
  };
  refreshHours();
  refreshRoom();
}
function renumberPlannerEntries(){
  $$("[data-planner-entry]").forEach((row,i)=>{
    const n=row.querySelector(".planner-entry-number");
    if(n)n.textContent=i+1;
  });
  const empty=$("#plannerEntriesEmpty");
  if(empty)empty.style.display=$$("[data-planner-entry]").length?"none":"block";
}
function addPlannerEntry(pairId=null){
  const d=disciplineById(disciplinePlannerState.disciplineId);
  const t=teacherById(disciplinePlannerState.teacherId);
  if(!d||!t)return;
  const box=$("#plannerEntries");
  if(!box)return;

  if(pairId){
    const duplicate=$$("[data-planner-entry]").some(row=>String(row.querySelector("[data-planner-pair]")?.value)===String(pairId));
    if(duplicate)return;
  }

  const i=$$("[data-planner-entry]").length;
  box.insertAdjacentHTML("beforeend",plannerNewRowHtml(d,t,i,null,pairId));
  bindPlannerEntryRow(box.lastElementChild,d,t);
  renumberPlannerEntries();
}
function plannerAddForPair(pairId){
  if(disciplinePlannerState.entryMode!=="single")setPlannerEntryMode("single");
  addPlannerEntry(pairId);
  const box=$("#plannerEntries");
  if(box)box.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function plannerTypeSummaryHtml(d,t){return `<div class="planner-load-summary">${plannerTypes(d,t.id).map(x=>`<div class="planner-load-card"><span>${esc(x.lt.name)}</span><b>${fmtHours(x.remaining)} год</b><small>${fmtHours(x.scheduled)} виставлено з ${fmtHours(x.planned)}</small></div>`).join("")}</div>`;}

/* Departmental series inside the discipline+teacher planner */
function plannerSeriesWeekdayDefault(){
  return weekdayId(disciplinePlannerState.date||currentAcademicDate());
}
function plannerSeriesBounds(d){
  return semesterDateBounds(d.semester);
}
function plannerSeriesDefaultFrom(d){
  const b=plannerSeriesBounds(d);
  const selected=disciplinePlannerState.date;
  return selected&&dateInBounds(selected,b)?selected:b.start;
}
function plannerSeriesDefaultTo(d){
  return plannerSeriesBounds(d).end;
}
function plannerSeriesTypeOptions(d,t,selected=""){
  return `<option value="">— обери вид —</option>`+
    plannerTypes(d,t.id)
      .filter(x=>x.remaining>0)
      .map(x=>`<option value="${esc(x.lt.name)}" ${x.lt.name===selected?"selected":""}>${esc(x.lt.name)} · залишок ${fmtHours(x.remaining)} год</option>`)
      .join("");
}
function plannerSeriesDates(pattern,from,to,weekday,d){
  return datesForPattern(pattern,from,to,weekday,"",plannerSeriesBounds(d));
}
function plannerSeriesPairBusy(date,pairId,d,t){
  const teacher=plannerTeacherEvents(date,t.id).find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId));
  const group=plannerGroupEvents(date,d.group).find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId));
  return {teacher,group};
}
function plannerSeriesDefaultPair(d,t){
  return plannerNextFreePair(disciplinePlannerState.date,d,t)||bellPairs()[0]?.id||1;
}
function plannerSeriesCurrentDefaults(d,t){
  return {
    type:$("#plannerSeriesBulkType")?.value||"",
    pairId:$("#plannerSeriesBulkPair")?.value||plannerSeriesDefaultPair(d,t),
    room:$("#plannerSeriesBulkRoom")?.value||""
  };
}
function plannerSeriesRowHtml(date,d,t,pairId=null,room="",type=""){
  const b=plannerSeriesBounds(d);
  const selectedPair=pairId||plannerSeriesDefaultPair(d,t);

  return `<div class="planner-series-row planner-series-card" data-series-row>
    <div class="planner-series-card-head">
      <label class="planner-series-use">
        <input type="checkbox" data-series-use checked>
        <span>Включити</span>
      </label>

      <label class="planner-series-date-input">
        <span>Дата</span>
        <input type="date" data-series-date min="${b.start}" max="${b.end}" value="${esc(date||"")}">
      </label>

      <div class="planner-series-status" data-series-status></div>

      <button type="button" class="danger small-btn planner-series-remove" data-series-remove title="Прибрати дату">×</button>
    </div>

    <div class="planner-series-card-fields">
      <label>
        <span>Вид заняття</span>
        <select data-series-type>${plannerSeriesTypeOptions(d,t,type)}</select>
      </label>

      <label>
        <span>Пара</span>
        <select data-series-pair>${plannerPairOptions(date||disciplinePlannerState.date,d,t,selectedPair)}</select>
      </label>

      <label>
        <span>Аудиторія</span>
        <select data-series-room>${plannerRoomOptions(date||disciplinePlannerState.date,selectedPair,room)}</select>
      </label>
    </div>
  </div>`;
}
function plannerSeriesPanelHtml(d,t){
  const b=plannerSeriesBounds(d);
  const defaultPair=plannerSeriesDefaultPair(d,t);

  return `<div id="plannerSeriesMode" class="planner-series-mode">
    <div class="series-method-switch">
      <button type="button" id="plannerSeriesMethodDates" onclick="setPlannerSeriesMethod('dates')">
        <b>Конкретні дати</b>
        <span>коли список дат уже відомий</span>
      </button>
      <button type="button" id="plannerSeriesMethodRule" onclick="setPlannerSeriesMethod('rule')">
        <b>За правилом</b>
        <span>щотижня або через тиждень</span>
      </button>
    </div>

    <div id="plannerSeriesMethodHint" class="series-method-hint">
      Обери, як сформувати дати серії.
    </div>

    <div id="plannerSeriesDatesMethod" class="series-method-body hidden">
      <label>Конкретні дати
        <input id="plannerSeriesDatesPaste" placeholder="03.09, 10.09, 17.09, 24.09">
      </label>
      <button type="button" class="primary-inline" id="plannerSeriesAddDates">Додати дати</button>
    </div>

    <div id="plannerSeriesRuleMethod" class="series-method-body hidden">
      <div class="planner-series-rule-clean">
        <label>Повторення
          <select id="plannerSeriesPattern">
            <option value="weekly">Щотижня</option>
            <option value="biweekly">Через тиждень</option>
          </select>
        </label>
        <label>День
          <select id="plannerSeriesWeekday">${db.weekDays.map(x=>`<option value="${x.id}" ${Number(x.id)===Number(plannerSeriesWeekdayDefault())?"selected":""}>${esc(x.name)}</option>`).join("")}</select>
        </label>
        <label>Від
          <input id="plannerSeriesFrom" type="date" min="${b.start}" max="${b.end}" value="${plannerSeriesDefaultFrom(d)}">
        </label>
        <label>До
          <input id="plannerSeriesTo" type="date" min="${b.start}" max="${b.end}" value="${plannerSeriesDefaultTo(d)}">
        </label>
        <button type="button" class="primary-inline" id="plannerSeriesGenerate">Згенерувати дати</button>
      </div>
    </div>

    <div id="plannerSeriesWorkArea" class="hidden">
      <div class="planner-series-defaults">
        <label>Вид для всіх
          <select id="plannerSeriesBulkType"><option value="">— не змінювати —</option>${plannerTypes(d,t.id).filter(x=>x.remaining>0).map(x=>`<option value="${esc(x.lt.name)}">${esc(x.lt.name)}</option>`).join("")}</select>
        </label>
        <label>Пара для всіх
          <select id="plannerSeriesBulkPair"><option value="">— не змінювати —</option>${pairOptions(defaultPair,false)}</select>
        </label>
        <label>Аудиторія для всіх
          <select id="plannerSeriesBulkRoom"><option value="">— не змінювати —</option>${gridRooms().map(r=>`<option value="${esc(r.name)}">${esc(r.name)}</option>`).join("")}</select>
        </label>
        <div class="planner-series-default-actions">
          <button type="button" class="secondary" id="plannerSeriesApplyDefaults">Застосувати до всіх</button>
          <button type="button" class="secondary" id="plannerSeriesAutofill">Автозаповнити види</button>
        </div>
      </div>

      <div class="section-head compact planner-series-rows-head">
        <div>
          <b>Дати серії</b>
          <div class="small">Кожну дату можна змінити окремо.</div>
        </div>
        <button type="button" class="secondary" id="plannerSeriesAddRow">+ Додати дату</button>
      </div>

      <div id="plannerSeriesSummary" class="planner-series-summary"></div>
      <div id="plannerSeriesRows" class="planner-series-rows"></div>

      <div class="planner-stream-audience">
        <div><b>Групи / потік</b><span>Вибрані групи слухатимуть кожну пару серії разом.</span></div>
        ${plannerAudienceButtonsHtml(d,t,[d.group])}
      </div>

      <div class="planner-extra planner-series-extra">
        <label>Охоплення
          <select id="plannerSeriesCoverage">${db.coverageTypes.map(v=>`<option>${esc(v)}</option>`).join("")}</select>
        </label>
        <label>Примітка
          <input id="plannerSeriesNote" placeholder="необов’язково">
        </label>
      </div>

      <div id="plannerSeriesMessage"></div>
      <div class="planner-save-row">
        <button type="button" class="primary" id="plannerSeriesSave">Зберегти серію</button>
      </div>
    </div>
  </div>`;
}
let plannerSeriesMethod=null;
function setPlannerSeriesMethod(method){
  plannerSeriesMethod=method==="rule"?"rule":method==="dates"?"dates":null;
  const datesBtn=$("#plannerSeriesMethodDates");
  const ruleBtn=$("#plannerSeriesMethodRule");
  const datesBody=$("#plannerSeriesDatesMethod");
  const ruleBody=$("#plannerSeriesRuleMethod");
  const hint=$("#plannerSeriesMethodHint");
  if(datesBtn)datesBtn.classList.toggle("active",plannerSeriesMethod==="dates");
  if(ruleBtn)ruleBtn.classList.toggle("active",plannerSeriesMethod==="rule");
  if(datesBody)datesBody.classList.toggle("hidden",plannerSeriesMethod!=="dates");
  if(ruleBody)ruleBody.classList.toggle("hidden",plannerSeriesMethod!=="rule");
  if(hint)hint.classList.toggle("hidden",!!plannerSeriesMethod);
}
function setPlannerEntryMode(mode){
  disciplinePlannerState.entryMode=mode==="series"?"series":mode==="single"?"single":null;
  const single=$("#plannerSingleMode");
  const series=$("#plannerSeriesMode");
  const singleBtn=$("#plannerModeSingle");
  const seriesBtn=$("#plannerModeSeries");
  const hint=$("#plannerModeHint");
  if(single)single.classList.toggle("hidden",disciplinePlannerState.entryMode!=="single");
  if(series)series.classList.toggle("hidden",disciplinePlannerState.entryMode!=="series");
  if(singleBtn)singleBtn.classList.toggle("active",disciplinePlannerState.entryMode==="single");
  if(seriesBtn)seriesBtn.classList.toggle("active",disciplinePlannerState.entryMode==="series");
  if(hint)hint.classList.toggle("hidden",!!disciplinePlannerState.entryMode);
  if(disciplinePlannerState.entryMode==="series"&&!plannerSeriesMethod)setPlannerSeriesMethod(null);
}
function plannerSeriesUpdateEmpty(){
  const hasRows=$$("[data-series-row]").length>0;
  const work=$("#plannerSeriesWorkArea");
  if(work)work.classList.toggle("hidden",!hasRows);
}
function plannerSeriesRefreshRow(row,d,t){
  const use=row.querySelector("[data-series-use]");
  const dateEl=row.querySelector("[data-series-date]");
  const pairEl=row.querySelector("[data-series-pair]");
  const roomEl=row.querySelector("[data-series-room]");
  const status=row.querySelector("[data-series-status]");

  const date=dateEl?.value||"";
  let pairId=pairEl?.value||"";
  const oldRoom=roomEl?.value||"";

  if(date&&pairEl){
    const previous=pairId;
    pairEl.innerHTML=plannerPairOptions(date,d,t,previous);
    if([...pairEl.options].some(o=>String(o.value)===String(previous)))pairEl.value=previous;
    pairId=pairEl.value||previous;
  }

  if(date&&pairId&&roomEl){
    roomEl.innerHTML=plannerRoomOptions(date,pairId,oldRoom);
  }

  if(!date||!pairId){
    row.classList.remove("blocked");
    if(status)status.innerHTML=`<span class="bad">обери дату і пару</span>`;
    plannerUpdateSeriesSummary(d,t);
    return;
  }

  const busy=plannerSeriesPairBusy(date,pairId,d,t);
  const availability=teacherPairAvailability(date,pairId,t.id);
  const blocked=!!busy.teacher||!!busy.group||availability.warnings.length>0;
  row.classList.toggle("blocked",blocked);

  if(status){
    status.innerHTML=`
      ${busy.teacher?`<span class="bad">Викладач зайнятий</span>`:""}
      ${busy.group?`<span class="bad">Група зайнята</span>`:""}
      ${availability.warnings.map(w=>`<span class="bad">НЕ МОЖНА · ${esc(w)}</span>`).join("")}
      ${!blocked&&availability.notes.length?availability.notes.map(n=>`<span class="${n.includes("Бажаний")?"preferred":"warn"}">${n.includes("Бажаний")?"БАЖАНО":"ПОЗА БАЖАНИМ"} · ${esc(n)}</span>`).join(""):""}
      ${!blocked&&!availability.notes.length?`<span class="ok">МОЖНА СТАВИТИ</span>`:""}
    `;
  }
  plannerUpdateSeriesSummary(d,t);
}
function plannerBindSeriesRow(row,d,t){
  const use=row.querySelector("[data-series-use]");
  const dateEl=row.querySelector("[data-series-date]");
  const typeEl=row.querySelector("[data-series-type]");
  const pairEl=row.querySelector("[data-series-pair]");
  const roomEl=row.querySelector("[data-series-room]");
  const remove=row.querySelector("[data-series-remove]");

  if(use)use.onchange=()=>plannerUpdateSeriesSummary(d,t);
  if(typeEl)typeEl.onchange=()=>plannerUpdateSeriesSummary(d,t);
  if(roomEl)roomEl.onchange=()=>plannerUpdateSeriesSummary(d,t);
  if(dateEl)dateEl.onchange=()=>plannerSeriesRefreshRow(row,d,t);
  if(pairEl)pairEl.onchange=()=>plannerSeriesRefreshRow(row,d,t);
  if(remove)remove.onclick=()=>{
    row.remove();
    plannerSeriesUpdateEmpty();
    plannerUpdateSeriesSummary(d,t);
  };

  plannerSeriesRefreshRow(row,d,t);
}
function plannerSeriesExistingKeys(){
  return new Set($$("[data-series-row]").map(row=>{
    const date=row.querySelector("[data-series-date]")?.value||"";
    const pair=row.querySelector("[data-series-pair]")?.value||"";
    return `${date}|${pair}`;
  }));
}
function plannerAddSeriesRow(d,t,preset={}){
  const box=$("#plannerSeriesRows");if(!box)return;
  const defs=plannerSeriesCurrentDefaults(d,t);
  box.insertAdjacentHTML("beforeend",plannerSeriesRowHtml(
    preset.date||"",
    d,t,
    preset.pairId||defs.pairId,
    preset.room!==undefined?preset.room:defs.room,
    preset.type!==undefined?preset.type:defs.type
  ));
  plannerBindSeriesRow(box.lastElementChild,d,t);
  plannerSeriesUpdateEmpty();
}
function plannerAddSeriesDatesFromText(d,t){
  const input=$("#plannerSeriesDatesPaste");
  const raw=(input?.value||"").trim();
  if(!raw)return;

  const dates=raw.split(/[\s,;]+/).filter(Boolean).map(parseReadyDateToken).filter(Boolean);
  if(!dates.length)return alert("Не знайшов дат. Наприклад: 03.09, 10.09, 17.09");

  const b=plannerSeriesBounds(d);
  const invalid=dates.filter(date=>!dateInBounds(date,b));
  if(invalid.length)return alert(`Ці дати не входять у семестр: ${invalid.map(formatDate).join(", ")}`);

  const defs=plannerSeriesCurrentDefaults(d,t);
  const keys=plannerSeriesExistingKeys();
  dates.forEach(date=>{
    const key=`${date}|${defs.pairId}`;
    if(!keys.has(key)){
      plannerAddSeriesRow(d,t,{date,...defs});
      keys.add(key);
    }
  });
  input.value="";
}
function plannerGenerateSeries(d,t){
  const pattern=$("#plannerSeriesPattern").value;
  const weekday=$("#plannerSeriesWeekday").value;
  const from=$("#plannerSeriesFrom").value;
  const to=$("#plannerSeriesTo").value;

  if(!from||!to)return alert("Вкажи період серії.");
  if(from>to)return alert("Дата «Від» не може бути пізніше за «До».");

  const dates=plannerSeriesDates(pattern,from,to,weekday,d);
  if(!dates.length)return alert("У вибраному періоді немає таких днів.");

  const defs=plannerSeriesCurrentDefaults(d,t);
  const keys=plannerSeriesExistingKeys();

  dates.forEach(date=>{
    const key=`${date}|${defs.pairId}`;
    if(!keys.has(key)){
      plannerAddSeriesRow(d,t,{date,...defs});
      keys.add(key);
    }
  });
}
function plannerApplySeriesDefaults(d,t){
  const type=$("#plannerSeriesBulkType").value;
  const pairId=$("#plannerSeriesBulkPair").value;
  const room=$("#plannerSeriesBulkRoom").value;

  $$("[data-series-row]").forEach(row=>{
    const use=row.querySelector("[data-series-use]");
    if(!use||!use.checked)return;

    if(type)row.querySelector("[data-series-type]").value=type;
    if(pairId)row.querySelector("[data-series-pair]").value=pairId;

    plannerSeriesRefreshRow(row,d,t);

    if(room){
      const roomEl=row.querySelector("[data-series-room]");
      const opt=[...roomEl.options].find(o=>o.value===room&&!o.disabled);
      if(opt)roomEl.value=room;
    }
  });
  plannerUpdateSeriesSummary(d,t);
}
function plannerAutofillSeriesTypes(d,t){
  const queues=plannerTypes(d,t.id)
    .filter(x=>x.remaining>0)
    .map(x=>({type:x.lt.name,remaining:x.remaining}));

  $$("[data-series-row]").forEach(row=>{
    const use=row.querySelector("[data-series-use]");
    const typeSelect=row.querySelector("[data-series-type]");
    if(!use||!use.checked||!typeSelect)return;

    let chosen=null;
    for(const q of queues){
      const unit=plannerDefaultUnit(q.type,q.remaining);
      if(unit>0){
        chosen=q;
        q.remaining=Math.max(0,q.remaining-unit);
        break;
      }
    }
    typeSelect.value=chosen?.type||"";
  });
  plannerUpdateSeriesSummary(d,t);
}
function plannerSeriesSelection(d,t){
  const result=[];
  $$("[data-series-row]").forEach(row=>{
    const use=row.querySelector("[data-series-use]");
    if(!use||!use.checked)return;

    result.push({
      row,
      date:row.querySelector("[data-series-date]")?.value||"",
      type:row.querySelector("[data-series-type]")?.value||"",
      pairId:row.querySelector("[data-series-pair]")?.value||"",
      room:row.querySelector("[data-series-room]")?.value||""
    });
  });
  return result;
}
function plannerUpdateSeriesSummary(d,t){
  const selected=plannerSeriesSelection(d,t);
  const plannedStats=plannerTypes(d,t.id);
  const usedByType={};

  selected.forEach(x=>{
    if(!x.type)return;
    const stat=plannedStats.find(s=>s.lt.name===x.type);
    const already=usedByType[x.type]||0;
    const available=Math.max(0,(stat?.remaining||0)-already);
    const unit=plannerDefaultUnit(x.type,available);
    usedByType[x.type]=already+unit;
  });

  const withoutDate=selected.filter(x=>!x.date).length;
  const withoutType=selected.filter(x=>!x.type).length;
  const withoutPair=selected.filter(x=>!x.pairId).length;
  const withoutRoom=selected.filter(x=>!x.room).length;
  const conflicts=selected.filter(x=>x.date&&x.pairId&&(()=>{
    const busy=plannerSeriesPairBusy(x.date,x.pairId,d,t);
    return !!busy.teacher||!!busy.group;
  })()).length;

  const summary=$("#plannerSeriesSummary");
  if(summary){
    summary.innerHTML=`
      <span><b>${selected.length}</b> дат включено</span>
      ${plannedStats.map(s=>`<span>${esc(s.lt.name)}: <b>${fmtHours(usedByType[s.lt.name]||0)}</b> / ${fmtHours(s.remaining)} год</span>`).join("")}
      ${withoutDate?`<span class="bad">${withoutDate} без дати</span>`:""}
      ${withoutType?`<span class="bad">${withoutType} без виду</span>`:""}
      ${withoutPair?`<span class="bad">${withoutPair} без пари</span>`:""}
      ${withoutRoom?`<span class="bad">${withoutRoom} без аудиторії</span>`:""}
      ${conflicts?`<span class="bad">${conflicts} конфліктів</span>`:""}
    `;
  }
}
function savePlannerSeries(d,t){
  const selected=plannerSeriesSelection(d,t);
  if(!selected.length)return alert("Немає вибраних дат для збереження.");

  const bounds=plannerSeriesBounds(d);
  const audienceGroups=plannerSelectedAudienceGroups(d);
  const stats=plannerTypes(d,t.id);
  const byType={};
  const draft=[];
  const problems=[];
  const duplicateKeys=new Set();
  const batchId=`SERIES-${Date.now()}`;

  for(const x of selected){
    if(!x.date){problems.push("Є рядок без дати.");continue;}
    if(!dateInBounds(x.date,bounds)){problems.push(`${formatDate(x.date)}: дата поза межами семестру.`);continue;}
    if(!x.type){problems.push(`${formatDate(x.date)}: не вибрано вид заняття.`);continue;}
    if(!x.pairId){problems.push(`${formatDate(x.date)}: не вибрано пару.`);continue;}
    if(!x.room){problems.push(`${formatDate(x.date)}: не вибрано аудиторію.`);continue;}

    const duplicateKey=`${x.date}|${x.pairId}`;
    if(duplicateKeys.has(duplicateKey)){
      problems.push(`${formatDate(x.date)} · ${x.pairId} пара: ця дата й пара повторюються в серії.`);
      continue;
    }
    duplicateKeys.add(duplicateKey);

    const stat=stats.find(s=>s.lt.name===x.type);
    const used=byType[x.type]||0;
    const available=Math.max(0,(stat?.remaining||0)-used);
    const hours=plannerDefaultUnit(x.type,available);
    if(hours<=0){
      problems.push(`${x.type}: недостатньо розподілених годин для ${formatDate(x.date)}.`);
      continue;
    }

    const coverageIds=plannerDisciplineIdsForAudience(d,t,x.type,audienceGroups);
    if(coverageIds.missing.length){
      problems.push(`${formatDate(x.date)} · ${x.type}: у ${coverageIds.missing.join(", ")} цей вид не розподілений викладачу ${teacherDisplay(t)}.`);
      continue;
    }
    const item=lessonItemFromValues({
      date:x.date,pairId:x.pairId,group:d.group,disciplineId:d.id,discipline:d.name,type:x.type,
      workloadHours:hours,coverage:$("#plannerSeriesCoverage").value,teacherId:t.id,room:x.room,
      note:$("#plannerSeriesNote").value.trim(),repeatBatchId:batchId
    });
    item.audienceGroups=audienceGroups;
    item.disciplineIds=coverageIds.ids;

    const cs=conflictsFor(item,null,draft);
    const info=teacherAvailabilityInfo(item,null,draft);
    if(cs.length){
      problems.push(`${formatDate(x.date)} · ${pairDisplay(item)}: ${conflictReasonLines(item,cs).join(" ")}`);
      continue;
    }
    if(info.warnings.length){
      problems.push(`${formatDate(x.date)} · ${pairDisplay(item)}: ${info.warnings.join(" ")}`);
      continue;
    }

    byType[x.type]=used+hours;
    draft.push(item);
  }

  if(problems.length){
    $("#plannerSeriesMessage").innerHTML=`<div class="conflict"><b>Не можу зберегти серію:</b><br>${problems.map(esc).join("<br>")}</div>`;
    return;
  }
  if(!draft.length)return alert("Немає занять для збереження.");

  draft.forEach(item=>db.schedule.push({id:uid(db.schedule),...item}));
  refreshPlannerAfterAction(d,t);
}


function teacherAvailabilityRuleLabel(rule){
  if(!rule)return "";
  const kind=rule.kind||"weekday";
  const dayName=id=>{
    const d=db.weekDays.find(x=>String(x.id)===String(id));
    return d?.name||`день ${id}`;
  };

  let base="";
  if(kind==="weekday")base=dayName(rule.day);
  else if(kind==="date")base=rule.date?formatDate(rule.date):"конкретна дата";
  else if(kind==="range")base=`${rule.dateFrom?formatDate(rule.dateFrom):"…"}–${rule.dateTo?formatDate(rule.dateTo):"…"}`;
  else base="правило";

  const time=(rule.start||rule.end)
    ? ` · ${rule.start||"…"}–${rule.end||"…"}`
    : "";

  return `${base}${time}`;
}

function teacherAvailabilityDayState(t,date){
  const unavailable=(t.unavailableRules||[]).filter(r=>ruleApplies(r,date));
  const preferred=(t.preferredRules||[]).filter(r=>ruleApplies(r,date));

  if(unavailable.some(r=>!r.start&&!r.end)){
    return {state:"blocked",text:"Викладач цього дня недоступний"};
  }
  if(unavailable.length){
    return {state:"limited",text:"Є недоступні години цього дня"};
  }
  if(preferred.length){
    return {state:"preferred",text:"Є бажані години цього дня"};
  }
  if((t.preferredRules||[]).length){
    return {state:"outside",text:"Цей день поза бажаними днями"};
  }
  return {state:"neutral",text:"Обмежень на цей день немає"};
}
let plannerAvailabilityOpen=false;

function plannerTeacherAvailabilitySummaryHtml(t,date){
  const unavailable=t.unavailableRules||[];
  const preferred=t.preferredRules||[];
  const dayState=teacherAvailabilityDayState(t,date);

  return `<div class="planner-availability-accordion">
    <button type="button"
      class="planner-availability-toggle ${dayState.state}"
      id="plannerAvailabilityToggle"
      onclick="togglePlannerAvailabilityPanel()">

      <div class="planner-availability-toggle-title">
        <span class="planner-availability-icon">◷</span>
        <div>
          <b>Доступність викладача</b>
          <span>${esc(teacherDisplay(t))}</span>
        </div>
      </div>

      <div class="planner-availability-toggle-state">
        <strong id="plannerAvailabilityStatus">${esc(dayState.text)}</strong>
        <span>${plannerAvailabilityOpen?"▲":"▼"}</span>
      </div>
    </button>

    <div id="plannerAvailabilityBody" class="planner-availability-body ${plannerAvailabilityOpen?"":"hidden"}">
      <div class="planner-availability-date-status ${dayState.state}">
        <b>${formatDate(date)} · ${esc(weekdayNameForDate(date))}</b>
        <span>${esc(dayState.text)}</span>
      </div>

      <div class="planner-inline-availability-section blocked">
        <div class="planner-inline-availability-title">
          <div>
            <b>Не можна ставити</b>
            <span>День, дата або період + години.</span>
          </div>
          <button type="button" class="secondary" onclick="addRule('plannerAvailabilityUnavailableRules')">+ Додати</button>
        </div>
        <div id="plannerAvailabilityUnavailableRules" class="rule-list planner-rule-list">
          ${unavailable.map(ruleRow).join("")}
        </div>
        ${unavailable.length?"":`<div class="planner-inline-empty">Обмежень поки немає.</div>`}
      </div>

      <div class="planner-inline-availability-section preferred">
        <div class="planner-inline-availability-title">
          <div>
            <b>Бажано ставити</b>
            <span>Зручні для викладача дні та години.</span>
          </div>
          <button type="button" class="secondary" onclick="addRule('plannerAvailabilityPreferredRules')">+ Додати</button>
        </div>
        <div id="plannerAvailabilityPreferredRules" class="rule-list planner-rule-list">
          ${preferred.map(ruleRow).join("")}
        </div>
        ${preferred.length?"":`<div class="planner-inline-empty">Бажаний час поки не задано.</div>`}
      </div>

      <div class="planner-inline-limits">
        <label>
          <span>Максимум пар на день</span>
          <input id="plannerAvailabilityMaxPerDay" type="number" min="0" value="${esc(t.maxPerDay||"")}" placeholder="наприклад 4">
        </label>
        <label>
          <span>Максимум пар підряд</span>
          <input id="plannerAvailabilityMaxConsecutive" type="number" min="0" value="${esc(t.maxConsecutive||"")}" placeholder="наприклад 3">
        </label>
      </div>

      <div id="plannerAvailabilitySaveMessage"></div>

      <button type="button"
        class="primary planner-availability-save"
        onclick="savePlannerTeacherAvailability(${t.id})">
        Зберегти доступність
      </button>
    </div>
  </div>`;
}

function togglePlannerAvailabilityPanel(){
  plannerAvailabilityOpen=!plannerAvailabilityOpen;
  const body=$("#plannerAvailabilityBody");
  const toggle=$("#plannerAvailabilityToggle");

  if(body)body.classList.toggle("hidden",!plannerAvailabilityOpen);

  if(toggle){
    const arrow=toggle.querySelector(".planner-availability-toggle-state>span");
    if(arrow)arrow.textContent=plannerAvailabilityOpen?"▲":"▼";
  }

  if(plannerAvailabilityOpen)bindRuleRows();
}

function savePlannerTeacherAvailability(teacherId){
  const t=teacherById(teacherId);
  if(!t)return;

  t.unavailableRules=readRules("plannerAvailabilityUnavailableRules");
  t.preferredRules=readRules("plannerAvailabilityPreferredRules");
  t.maxPerDay=$("#plannerAvailabilityMaxPerDay")?.value||"";
  t.maxConsecutive=$("#plannerAvailabilityMaxConsecutive")?.value||"";

  /* Save underlying data but leave this planner modal and all draft rows intact. */
  save();

  const dayState=teacherAvailabilityDayState(t,disciplinePlannerState.date);
  const status=$("#plannerAvailabilityStatus");
  if(status)status.textContent=dayState.text;

  const toggle=$("#plannerAvailabilityToggle");
  if(toggle){
    toggle.classList.remove("blocked","limited","preferred","outside","neutral");
    toggle.classList.add(dayState.state);
  }

  const dateStatus=$(".planner-availability-date-status");
  if(dateStatus){
    dateStatus.classList.remove("blocked","limited","preferred","outside","neutral");
    dateStatus.classList.add(dayState.state);
    const text=dateStatus.querySelector("span");
    if(text)text.textContent=dayState.text;
  }

  const d=disciplineById(disciplinePlannerState.disciplineId);
  if(d){
    $$("[data-planner-entry]").forEach(row=>{
      const pairEl=row.querySelector("[data-planner-pair]");
      const roomEl=row.querySelector("[data-planner-room]");
      if(!pairEl)return;

      const selected=pairEl.value;
      pairEl.innerHTML=plannerPairOptions(disciplinePlannerState.date,d,t,selected);
      if([...pairEl.options].some(o=>String(o.value)===String(selected)))pairEl.value=selected;

      if(roomEl){
        const oldRoom=roomEl.value;
        roomEl.innerHTML=plannerRoomOptions(disciplinePlannerState.date,pairEl.value,oldRoom);
        if([...roomEl.options].some(o=>o.value===oldRoom&&!o.disabled))roomEl.value=oldRoom;
      }
    });

    $$("[data-series-row]").forEach(row=>plannerSeriesRefreshRow(row,d,t));
  }

  const message=$("#plannerAvailabilitySaveMessage");
  if(message){
    message.innerHTML=`<div class="ok-box">Збережено. Ти залишаєшся в цьому ж вікні.</div>`;
    setTimeout(()=>{
      const el=$("#plannerAvailabilitySaveMessage");
      if(el)el.innerHTML="";
    },3500);
  }
}
function plannerCalendarAvailabilityTag(date,t){
  const s=teacherAvailabilityDayState(t,date);
  if(s.state==="neutral")return "";
  const labels={
    preferred:"бажано",
    blocked:"викл. не може",
    limited:"є обмеження",
    outside:"поза бажаним"
  };
  return `<span class="planner-day-availability ${s.state}">${esc(labels[s.state]||"")}</span>`;
}


function plannerActionAvailabilityState(t,date){
  const s=teacherAvailabilityDayState(t,date);
  const labels={
    neutral:"Обмежень на цей день немає",
    preferred:"Бажаний день / час",
    blocked:"Викладач недоступний",
    limited:"Є обмеження по годинах",
    outside:"Поза бажаними днями"
  };
  return {...s,label:labels[s.state]||s.text};
}
function plannerActionButtonsHtml(d,t,totalRemaining,date){
  const availability=plannerActionAvailabilityState(t,date);
  const own=plannerOwnEvents(date,d,t.id).length;

  return `<div class="planner-action-launcher">
    <div class="planner-action-launcher-head">
      <span>Робота з вибраною датою</span>
      <h4>${formatDate(date)} · ${esc(weekdayNameForDate(date))}</h4>
      <p>Відкрий тільки той інструмент, який зараз потрібен.</p>
    </div>

    <div class="planner-action-buttons">
      <button type="button"
        class="planner-launch-btn availability ${availability.state}"
        onclick="openPlannerAvailabilityPopup(${d.id},${t.id})">
        <span class="planner-launch-icon">◷</span>
        <span class="planner-launch-copy">
          <b>Доступність викладача</b>
          <small>${esc(availability.label)}</small>
        </span>
        <span class="planner-launch-arrow">→</span>
      </button>

      <button type="button"
        class="planner-launch-btn single"
        ${totalRemaining<=0?"disabled":""}
        onclick="openPlannerSingleDatePopup(${d.id},${t.id})">
        <span class="planner-launch-icon">1</span>
        <span class="planner-launch-copy">
          <b>Одна дата</b>
          <small>${own?`Уже ${own} занять цієї дисципліни · `:""}поставити одну або кілька пар ${formatDate(date)}</small>
        </span>
        <span class="planner-launch-arrow">→</span>
      </button>

      <button type="button"
        class="planner-launch-btn series"
        ${totalRemaining<=0?"disabled":""}
        onclick="openPlannerSeriesPopup(${d.id},${t.id})">
        <span class="planner-launch-icon">↻</span>
        <span class="planner-launch-copy">
          <b>Серія дат</b>
          <small>конкретні дати або повторення за правилом · залишок ${fmtHours(totalRemaining)} год</small>
        </span>
        <span class="planner-launch-arrow">→</span>
      </button>
    </div>

    ${totalRemaining<=0?`<div class="planner-action-complete">Усе розподілене навантаження вже виставлено. Доступність викладача можна редагувати й далі.</div>`:""}
  </div>`;
}

function openPlannerAvailabilityPopup(disciplineId,teacherId){
  const d=disciplineById(disciplineId);
  const t=teacherById(teacherId);
  if(!d||!t)return;

  const date=disciplinePlannerState.date;
  const state=teacherAvailabilityDayState(t,date);

  openPlannerActionModal(`<div class="planner-popup-shell availability-popup">
    <div class="planner-popup-head">
      <div>
        <span>Викладач</span>
        <h2>Доступність викладача</h2>
        <p>${esc(teacherDisplay(t))}</p>
      </div>
      <div class="planner-popup-date-status ${state.state}">
        <b>${formatDate(date)}</b>
        <span>${esc(state.text)}</span>
      </div>
    </div>

    <div class="planner-popup-section unavailable">
      <div class="planner-popup-section-head">
        <div>
          <h3>Не можна ставити</h3>
          <p>День тижня, конкретна дата або період + години.</p>
        </div>
        <button type="button" class="secondary" onclick="addRule('plannerPopupUnavailableRules')">+ Додати</button>
      </div>
      <div id="plannerPopupUnavailableRules" class="rule-list planner-popup-rules">
        ${(t.unavailableRules||[]).map(ruleRow).join("")}
      </div>
      ${(t.unavailableRules||[]).length?"":`<div class="planner-popup-empty">Обмежень поки немає.</div>`}
    </div>

    <div class="planner-popup-section preferred">
      <div class="planner-popup-section-head">
        <div>
          <h3>Бажано ставити</h3>
          <p>Дні та години, які зручні викладачу.</p>
        </div>
        <button type="button" class="secondary" onclick="addRule('plannerPopupPreferredRules')">+ Додати</button>
      </div>
      <div id="plannerPopupPreferredRules" class="rule-list planner-popup-rules">
        ${(t.preferredRules||[]).map(ruleRow).join("")}
      </div>
      ${(t.preferredRules||[]).length?"":`<div class="planner-popup-empty">Бажаний час поки не задано.</div>`}
    </div>

    <div class="planner-popup-limits">
      <label>Максимум пар на день
        <input id="plannerPopupMaxPerDay" type="number" min="0" value="${esc(t.maxPerDay||"")}" placeholder="наприклад 4">
      </label>
      <label>Максимум пар підряд
        <input id="plannerPopupMaxConsecutive" type="number" min="0" value="${esc(t.maxConsecutive||"")}" placeholder="наприклад 3">
      </label>
    </div>

    <div class="planner-popup-footer">
      <button type="button" class="secondary" onclick="closePlannerActionModal()">Скасувати</button>
      <button type="button" class="primary" onclick="savePlannerAvailabilityPopup(${d.id},${t.id})">Зберегти</button>
    </div>
  </div>`,true);

  bindRuleRows();
}
function savePlannerAvailabilityPopup(disciplineId,teacherId){
  const d=disciplineById(disciplineId);
  const t=teacherById(teacherId);
  if(!d||!t)return;

  t.unavailableRules=readRules("plannerPopupUnavailableRules");
  t.preferredRules=readRules("plannerPopupPreferredRules");
  t.maxPerDay=$("#plannerPopupMaxPerDay")?.value||"";
  t.maxConsecutive=$("#plannerPopupMaxConsecutive")?.value||"";

  refreshPlannerAfterAction(d,t);
}

function sharedDisciplineCandidateForGroup(d,group){
  return db.disciplines.find(x=>x.status!=="archived"&&normIdentity(x.group)===normIdentity(group)&&normIdentity(x.name)===normIdentity(d.name)&&Number(x.semester)===Number(d.semester))||null;
}
function plannerCompatibleStreamGroups(d,t){
  return sortedGroups().filter(g=>{
    const peer=sharedDisciplineCandidateForGroup(d,g.code);
    if(!peer)return false;
    return schedulableTypes(peer).some(lt=>teacherTypePlan(peer,t.id,lt.name)>0);
  });
}
function plannerAudienceButtonsHtml(d,t,selected=[d.group]){
  const set=new Set((selected||[]).map(normIdentity));
  return `<div class="planner-audience-buttons">${plannerCompatibleStreamGroups(d,t).map(g=>`<label class="planner-audience-btn ${set.has(normIdentity(g.code))?"active":""}"><input type="checkbox" data-planner-audience value="${esc(g.code)}" ${set.has(normIdentity(g.code))?"checked":""} ${normIdentity(g.code)===normIdentity(d.group)?"disabled":""} onchange="this.closest('.planner-audience-btn').classList.toggle('active',this.checked)"><b>${esc(g.code)}</b><span>${esc(g.course)} курс</span></label>`).join("")}</div>`;
}
function plannerSelectedAudienceGroups(d){
  return uniqueStrings([d.group,...$$('[data-planner-audience]').filter(x=>x.checked).map(x=>x.value)]);
}
function plannerDisciplineIdsForAudience(d,t,type,audienceGroups){
  const ids=[],missing=[];
  (audienceGroups||[]).forEach(group=>{
    const peer=sharedDisciplineCandidateForGroup(d,group);
    if(!peer||teacherTypePlan(peer,t.id,type)<=0){missing.push(group);return;}
    ids.push(Number(peer.id));
  });
  return {ids:[...new Set(ids)],missing};
}

function openPlannerSingleDatePopup(disciplineId,teacherId){
  const d=disciplineById(disciplineId);
  const t=teacherById(teacherId);
  if(!d||!t)return;

  const date=disciplinePlannerState.date;
  const availability=teacherAvailabilityDayState(t,date);

  openPlannerActionModal(`<div class="planner-popup-shell single-popup">
    <div class="planner-popup-head">
      <div>
        <span>Одна дата</span>
        <h2>${formatDate(date)} · ${esc(weekdayNameForDate(date))}</h2>
        <div class="planner-popup-context">
          <strong>${esc(teacherDisplay(t))}</strong>
          <span>${esc(d.name)}</span>
          <b>${esc(d.group)}</b>
        </div>
      </div>
      <div class="planner-popup-date-status ${availability.state}">
        <span>${esc(availability.text)}</span>
      </div>
    </div>

    <div class="planner-popup-load">
      ${plannerTypes(d,t.id).filter(x=>x.remaining>0).map(x=>`
        <span><b>${esc(x.lt.name)}</b> · ${fmtHours(x.remaining)} год</span>
      `).join("")}
    </div>

    <form id="plannerDateForm" class="planner-popup-form">
      <div class="planner-popup-form-head">
        <div>
          <h3>Пари цього дня</h3>
          <p>Можна додати одразу кілька різних пар.</p>
        </div>
        <button type="button" class="secondary" id="plannerAddEntry">+ Ще одна пара</button>
      </div>

      <div id="plannerEntries"></div>
      <div id="plannerEntriesEmpty" class="planner-entries-empty">Додай хоча б одну пару.</div>

      <div class="planner-stream-audience">
        <div><b>Групи / потік</b><span>Якщо дисципліну слухають кілька груп разом — познач їх. Це буде одна реальна пара в розкладі всіх вибраних груп.</span></div>
        ${plannerAudienceButtonsHtml(d,t,[d.group])}
      </div>

      <div class="planner-popup-two">
        <label>Охоплення
          <select id="plannerCoverage">${db.coverageTypes.map(v=>`<option>${esc(v)}</option>`).join("")}</select>
        </label>
        <label>Примітка
          <input id="plannerNote" placeholder="необов’язково">
        </label>
      </div>

      <div id="plannerConflictMessage"></div>

      <div class="planner-popup-footer">
        <button type="button" class="secondary" onclick="closePlannerActionModal()">Скасувати</button>
        <button class="primary">Зберегти пари</button>
      </div>
    </form>
  </div>`,false);

  $("#plannerAddEntry").onclick=()=>addPlannerEntry();
  $("#plannerDateForm").onsubmit=e=>savePlannerDateEntries(e,d,t);

  const firstPair=plannerNextFreePair(date,d,t);
  addPlannerEntry(firstPair);
  renumberPlannerEntries();
}

function openPlannerSeriesPopup(disciplineId,teacherId){
  const d=disciplineById(disciplineId);
  const t=teacherById(teacherId);
  if(!d||!t)return;

  plannerSeriesMethod=null;

  openPlannerActionModal(`<div class="planner-popup-shell series-popup">
    <div class="planner-popup-head">
      <div>
        <span>Серія дат</span>
        <h2>${esc(d.name)}</h2>
        <div class="planner-popup-context">
          <strong>${esc(teacherDisplay(t))}</strong>
          <b>${esc(d.group)}</b>
          <span>${d.semester} семестр</span>
        </div>
      </div>
      <div class="planner-popup-remain">
        <b>${fmtHours(plannerTypes(d,t.id).reduce((sum,x)=>sum+x.remaining,0))} год</b>
        <span>залишилось розставити</span>
      </div>
    </div>

    ${plannerSeriesPanelHtml(d,t)}
  </div>`,true);

  $("#plannerSeriesAddDates").onclick=()=>plannerAddSeriesDatesFromText(d,t);
  $("#plannerSeriesGenerate").onclick=()=>plannerGenerateSeries(d,t);
  $("#plannerSeriesAddRow").onclick=()=>plannerAddSeriesRow(d,t);
  $("#plannerSeriesApplyDefaults").onclick=()=>plannerApplySeriesDefaults(d,t);
  $("#plannerSeriesAutofill").onclick=()=>plannerAutofillSeriesTypes(d,t);
  $("#plannerSeriesSave").onclick=()=>savePlannerSeries(d,t);

  setPlannerSeriesMethod(null);
  plannerSeriesUpdateEmpty();
  plannerUpdateSeriesSummary(d,t);
}

function plannerSelectedDayPanel(d,t,totalRemaining){
  const date=disciplinePlannerState.date;
  const summary=plannerDateEventsSummary(date,d,t);
  const ownCount=summary.own.length;
  const teacherOther=summary.teacher.filter(x=>!summary.own.includes(x)).length;
  const groupOther=summary.group.filter(x=>!summary.own.includes(x)&&!summary.teacher.includes(x)).length;

  return `<div class="scheduler-day-workspace planner-clean-actions" id="schedulerDayWorkspace">
    <div class="scheduler-day-workspace-head">
      <div>
        <span>Вибрана дата</span>
        <h3>${formatDate(date)} · ${esc(weekdayNameForDate(date))}</h3>
        <div class="small">${ownCount?`Уже виставлено ${ownCount} занять цієї дисципліни.`:"Цього дня ця дисципліна ще не стоїть."}</div>
      </div>
      <div class="scheduler-day-kpis">
        <div><b>${ownCount}</b><span>цієї дисципліни</span></div>
        <div><b>${teacherOther}</b><span>інших у викладача</span></div>
        <div><b>${groupOther}</b><span>інших у групи</span></div>
      </div>
    </div>

    ${plannerActionButtonsHtml(d,t,totalRemaining,date)}
  </div>`;
}

function renderDisciplinePlannerModal(){
  const d=disciplineById(disciplinePlannerState.disciplineId),t=teacherById(disciplinePlannerState.teacherId);
  if(!d||!t)return;

  const b=semesterDateBounds(d.semester),months=schedulerMonthsForDiscipline(d);
  if(!disciplinePlannerState.month||!months.some(x=>x.value===disciplinePlannerState.month))
    disciplinePlannerState.month=schedulerCurrentMonth(d);

  if(!disciplinePlannerState.date||
     disciplinePlannerState.date.slice(0,7)!==disciplinePlannerState.month||
     !dateInBounds(disciplinePlannerState.date,b)){
    disciplinePlannerState.date=schedulerDateForMonth(d,disciplinePlannerState.month,disciplinePlannerState.date);
  }

  const days=calendarMonthDays(disciplinePlannerState.month);
  const weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Нд"];
  const totalRemaining=plannerTypes(d,t.id).reduce((a,x)=>a+x.remaining,0);

  openModal(`<div class="discipline-planner">
    <div class="planner-context-hero">
      <div class="planner-context-title">
        <span class="planner-context-kicker">РОЗСТАВИТИ НАВАНТАЖЕННЯ</span>
        <h2>${esc(d.name)}</h2>
      </div>

      <div class="planner-context-person">
        <span>ВИКЛАДАЧ</span>
        <strong>${esc(teacherDisplay(t))}</strong>
      </div>

      <div class="planner-context-meta">
        <div><span>ГРУПА</span><b>${esc(d.group)}</b></div>
        <div><span>СЕМЕСТР</span><b>${d.semester}</b></div>
        <div class="planner-context-remain ${totalRemaining>0?"warn":"ok"}">
          <span>${totalRemaining>0?"ЗАЛИШИЛОСЬ":"СТАТУС"}</span>
          <b>${totalRemaining>0?`${fmtHours(totalRemaining)} год`:"Готово"}</b>
        </div>
      </div>
    </div>

    ${plannerTypeSummaryHtml(d,t)}
    ${plannerMonthTabsHtml(d,t)}

    <div class="planner-main-layout">
      <div class="planner-calendar-column">
        <div class="scheduler-calendar-wrap">
          <div class="scheduler-weekdays">${weekdays.map(x=>`<div>${x}</div>`).join("")}</div>
          <div class="scheduler-calendar">${days.map(date=>plannerCalendarDayHtml(date,d,t)).join("")}</div>
        </div>
        <div class="small planner-calendar-tip">Натисни на дату — нижче одразу побачиш повний розклад цього дня.</div>
        <div id="plannerCalendarDayOverview">
          ${plannerDayOverviewHtml(d,t,disciplinePlannerState.date)}
        </div>
      </div>

      <div class="planner-day-column">
        ${plannerSelectedDayPanel(d,t,totalRemaining)}
      </div>
    </div>
  </div>`,true);

  $("#modal").querySelector(".modal-card").classList.add("planner-modal-card");

}
function safeOpenDisciplineTeacherScheduler(disciplineId,teacherId){
  try{
    openDisciplineTeacherScheduler(disciplineId,teacherId);
  }catch(err){
    console.error("Planner open failed",err);
    alert("Не вдалося відкрити календар постановки розкладу. Помилка: "+(err?.message||err));
  }
}
function openDisciplineTeacherScheduler(disciplineId,teacherId,state={}){
  const d=disciplineById(disciplineId),t=teacherById(teacherId);
  if(!d||!t)return;
  if(!state.keepAvailabilityOpen)plannerAvailabilityOpen=false;
  disciplinePlannerState={
    disciplineId:Number(disciplineId),
    teacherId:Number(teacherId),
    month:state.month||schedulerCurrentMonth(d),
    date:state.date||null,
    entryMode:Object.prototype.hasOwnProperty.call(state,"entryMode")?state.entryMode:null
  };
  disciplinePlannerState.date=schedulerDateForMonth(d,disciplinePlannerState.month,state.date||null);
  renderDisciplinePlannerModal();
}
function setDisciplinePlannerMonth(month){const d=disciplineById(disciplinePlannerState.disciplineId);if(!d||!schedulerMonthsForDiscipline(d).some(x=>x.value===month))return;disciplinePlannerState.month=month;disciplinePlannerState.date=schedulerDateForMonth(d,month,null);renderDisciplinePlannerModal();}
function selectDisciplinePlannerDate(date){
  const d=disciplineById(disciplinePlannerState.disciplineId);
  if(!d||!dateInBounds(date,semesterDateBounds(d.semester)))return;
  disciplinePlannerState.date=date;
  disciplinePlannerState.month=date.slice(0,7);
  renderDisciplinePlannerModal();
  requestAnimationFrame(()=>$("#schedulerDayWorkspace")?.scrollIntoView({behavior:"smooth",block:"nearest"}));
}
function savePlannerDateEntries(e,d,t){
  e.preventDefault();
  const rows=$$("[data-planner-entry]");
  if(!rows.length)return alert("Додай хоча б одну пару.");
  const audienceGroups=plannerSelectedAudienceGroups(d);
  const date=disciplinePlannerState.date,byType={},draft=[],problems=[];

  rows.forEach((row,i)=>{
    const type=row.querySelector("[data-planner-type]").value,pairId=row.querySelector("[data-planner-pair]").value,room=row.querySelector("[data-planner-room]").value;
    if(!type||!pairId||!room){problems.push(`Рядок ${i+1}: обери вид, пару й аудиторію.`);return;}
    const coverageIds=plannerDisciplineIdsForAudience(d,t,type,audienceGroups);
    if(coverageIds.missing.length){problems.push(`${type}: у ${coverageIds.missing.join(", ")} цей вид не розподілений викладачу ${teacherDisplay(t)}.`);return;}
    const stat=plannerTypes(d,t.id).find(x=>x.lt.name===type),used=byType[type]||0,available=Math.max(0,(stat?.remaining||0)-used),hours=plannerDefaultUnit(type,available);
    if(hours<=0){problems.push(`${type}: години вже вичерпані.`);return;}
    byType[type]=used+hours;
    const item=lessonItemFromValues({date,pairId,group:d.group,disciplineId:d.id,discipline:d.name,type,workloadHours:hours,coverage:$("#plannerCoverage").value,teacherId:t.id,room,note:$("#plannerNote").value.trim(),repeatBatchId:`P${Date.now()}`});
    item.audienceGroups=audienceGroups;
    item.disciplineIds=coverageIds.ids;
    const cs=conflictsFor(item,null,draft),info=teacherAvailabilityInfo(item,null,draft);
    if(cs.length){problems.push(`${pairDisplay(item)} · ${type}: ${conflictReasonLines(item,cs).join(" ")}`);return;}
    if(info.warnings.length){problems.push(`${pairDisplay(item)} · ${type}: ${info.warnings.join(" ")}`);return;}
    draft.push(item);
  });

  if(problems.length){$("#plannerConflictMessage").innerHTML=`<div class="conflict"><b>Не можу зберегти:</b><br>${problems.map(esc).join("<br>")}</div>`;return;}
  draft.forEach(item=>db.schedule.push({id:uid(db.schedule),...item}));
  refreshPlannerAfterAction(d,t);
}
function openAllocationScheduler(disciplineId,typeName,teacherId){openDisciplineTeacherScheduler(disciplineId,teacherId);}
function addDays(dateStr,days){const d=new Date(dateStr+"T12:00:00");d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
function datesForPattern(pattern,from,to,weekday,specific,bounds=academicYearBounds()){if(pattern==="dates")return [...new Set((specific||"").split(/[\s,;]+/).map(x=>x.trim()).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&dateInBounds(x,bounds)))].sort();const result=[];if(!from||!to)return result;let d=from;while(d<=to){if(dateInBounds(d,bounds)&&weekdayId(d)===Number(weekday))result.push(d);d=addDays(d,1);}return pattern==="biweekly"?result.filter((_,i)=>i%2===0):result;}
function openBulkScheduleModal(presetGroup=null){
  const group=presetGroup||bestWorkloadGroup();openModal(`<h2>Розставити за правилом</h2><div class="notice">Для випадків, коли одна й та сама пара повторюється щотижня або через тиждень.</div><form id="bf" class="form-grid"><label>Група<select id="bg">${groupOptions(group)}</select></label><label>Дисципліна<select id="bd">${disciplineOptionsForGroup(group,null,false)}</select></label><label>Вид заняття<select id="bt"></select></label><label>Викладач<select id="btea"></select></label><div id="bulkLoadHint" class="wide"></div><label>Повторення<select id="bpattern"><option value="weekly">Щотижня</option><option value="biweekly">Через тиждень</option><option value="dates">Конкретні дати</option></select></label><label>День тижня<select id="bweekday">${db.weekDays.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join("")}</select></label><label>Від<input id="bfrom" type="date" ${dateAttrs()}></label><label>До<input id="bto" type="date" ${dateAttrs()}></label><label id="bdatesLabel" class="wide" style="display:none">Конкретні дати<textarea id="bdates" rows="3" placeholder="2026-09-03, 2026-09-10, 2026-09-24"></textarea></label><label>Пара<select id="bpair">${pairOptions(bellPairs()[0]?.id||null,false)}</select></label><label>Аудиторія<select id="br"><option value="">—</option>${db.rooms.filter(r=>r.status!=="archived").map(r=>`<option>${esc(r.name)}</option>`).join("")}</select></label><label>Годин за заняття<input id="bwh" type="number" min="0.01" step="0.01" value="2"></label><label>Охоплення<select id="bc">${db.coverageTypes.map(v=>`<option>${esc(v)}</option>`).join("")}</select></label><label class="wide">Примітка<input id="bn"></label><div class="wide"><button class="primary">Створити повтори</button></div></form>`,true);
  const refreshDisc=()=>{$("#bd").innerHTML=disciplineOptionsForGroup($("#bg").value,null,false);refreshType();};const refreshType=()=>{const d=disciplineById(Number($("#bd").value)),types=d?schedulableTypes(d):[];$("#bt").innerHTML=types.map(x=>`<option>${esc(x.name)}</option>`).join("");const b=d?semesterDateBounds(d.semester):academicYearBounds();["#bfrom","#bto"].forEach(id=>{const el=$(id);el.min=b.start;el.max=b.end;if(el.value&&!dateInBounds(el.value,b))el.value="";});refreshTeacher();};const refreshTeacher=()=>{const d=disciplineById(Number($("#bd").value)),type=$("#bt").value,teachers=d?allocatedTeachersForType(d,type):[];$("#btea").innerHTML=teachers.map(t=>`<option value="${t.id}">${esc(teacherDisplay(t))}</option>`).join("");const lt=lessonTypeByName(type);$("#bwh").value=lt?.defaultUnit||1;bulkHint();};const bulkHint=()=>{const d=disciplineById(Number($("#bd").value)),tid=Number($("#btea").value),type=$("#bt").value;if(!d||!tid){$("#bulkLoadHint").innerHTML=`<div class="conflict">Спочатку має бути розподілене навантаження.</div>`;return;}const p=teacherTypePlan(d,tid,type),used=scheduledLoad(d.id,tid,type),r=p-used;$("#bulkLoadHint").innerHTML=`<div class="load-hint-grid"><div><span>План</span><b>${fmtHours(p)} год</b></div><div><span>Виставлено</span><b>${fmtHours(used)} год</b></div><div><span>Залишок</span><b>${fmtHours(r)} год</b></div></div>`;};
  $("#bg").onchange=refreshDisc;$("#bd").onchange=refreshType;$("#bt").onchange=refreshTeacher;$("#btea").onchange=bulkHint;$("#bpattern").onchange=()=>{const dates=$("#bpattern").value==="dates";$("#bdatesLabel").style.display=dates?"":"none";$("#bweekday").disabled=dates;$("#bfrom").disabled=dates;$("#bto").disabled=dates;};refreshDisc();
  $("#bf").onsubmit=e=>{e.preventDefault();const d=disciplineById(Number($("#bd").value)),tid=Number($("#btea").value),type=$("#bt").value;if(!d||!tid)return alert("Немає розподіленого навантаження.");let rem=remainingLoad(d,tid,type,null);if(rem<=0)return alert("Години вже вичерпані.");const bounds=semesterDateBounds(d.semester),dates=datesForPattern($("#bpattern").value,$("#bfrom").value,$("#bto").value,$("#bweekday").value,$("#bdates").value,bounds);if(!dates.length)return alert("Не знайдено дат.");const unit=num($("#bwh").value),valid=[],blocked=[],batchId=`B${Date.now()}`;for(const date of dates){if(rem<=0.0001)break;const wh=Math.min(unit,rem),item=lessonItemFromValues({date,pairId:$("#bpair").value,group:$("#bg").value,disciplineId:d.id,discipline:d.name,type,workloadHours:wh,coverage:$("#bc").value,teacherId:tid,room:$("#br").value,note:$("#bn").value.trim(),repeatBatchId:batchId}),cs=conflictsFor(item,null,valid),info=teacherAvailabilityInfo(item,null);if(cs.length||info.warnings.length){blocked.push({date,reasons:[...conflictReasonLines(item,cs),...info.warnings]});continue;}valid.push(item);rem-=wh;}if(!valid.length)return alert("Усі дати мають конфлікти:\n\n"+blocked.slice(0,8).map(x=>`${formatDate(x.date)} — ${x.reasons.join(" ")}`).join("\n"));if(blocked.length&&!confirm(`${blocked.length} дат буде пропущено:\n\n${blocked.slice(0,8).map(x=>`${formatDate(x.date)} — ${x.reasons.join(" ")}`).join("\n")}${blocked.length>8?"\n…":""}\n\nПродовжити?`))return;valid.forEach(item=>db.schedule.push({id:uid(db.schedule),...item}));closeModal();save();go("schedule");};
}
function deleteLesson(id){if(confirm("Видалити заняття? Години автоматично повернуться у залишок навантаження.")){db.schedule=db.schedule.filter(x=>x.id!==id);save();}}

/* Group timetable calendar — monthly, fed by the same db.schedule as scheduling and teacher calendars */
let timetableState={group:rememberedTimetableGroup()||null,month:null};
function normGroup(v){return normIdentity(v);}
function scheduleVisualKey(x){
  const group=resolvedScheduleGroup(x,db)||x?.group||"";
  const discipline=x?.discipline||x?.title||x?.kind||"Подія";
  return `${normIdentity(group)}|${normIdentity(discipline)}`;
}
function stableVisualHash(value){
  let h=2166136261;
  const s=String(value||"");
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}
function scheduleColorVars(x){
  const hash=stableVisualHash(scheduleVisualKey(x));
  const hue=hash%360;
  const sat=52+((hash>>>8)%13);
  const bgLight=92+((hash>>>16)%3);
  const borderLight=54+((hash>>>20)%7);
  return `--subject-h:${hue};--subject-s:${sat}%;--subject-bg:hsl(${hue} ${sat}% ${bgLight}%);--subject-border:hsl(${hue} ${Math.min(78,sat+8)}% ${borderLight}%);--subject-text:hsl(${hue} 48% 23%);--subject-muted:hsl(${hue} 28% 42%)`;
}
function scheduleLessonsForGroup(group){
  return db.schedule.filter(x=>!x.specialSchedule&&scheduleIncludesGroup(x,group)&&dateInBounds(x.date));
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
  return [...lessons,...bookings].sort((a,b)=>{
    const ap=Number(a.data.pairId),bp=Number(b.data.pairId);
    if(Number.isFinite(ap)&&Number.isFinite(bp)&&ap!==bp)return ap-bp;
    return String(a.data.start||"99:99").localeCompare(String(b.data.start||"99:99"));
  });
}
function groupEventSlotId(ev){
  const x=ev.data;
  if(x?.pairId!==null&&x?.pairId!==undefined&&String(x.pairId)!=="")return String(x.pairId);
  const derived=pairIdForTimes(x?.start||"",x?.end||"");
  return derived!==null&&derived!==undefined?String(derived):null;
}
function groupMonthEventCard(ev){
  const x=ev.data;
  if(ev.source==="schedule"){
    return `<button class="group-slot-event" style="${scheduleColorVars(x)}" onclick="${isReadyExternalScheduleItem(x)?`openReadyScheduleModal(${x.id})`:`openLessonModal(${x.id})`}">
      <div class="group-slot-event-main">
        <b>${esc(x.discipline||"Заняття")}</b>
        <span>${esc(x.teacher||"—")}</span>
      </div>
      <div class="group-slot-event-meta">
        <strong>${x.room?`ауд. ${esc(x.room)}`:"—"}</strong>
        ${x.type?`<small>${esc(x.type)}</small>`:""}
      </div>
    </button>`;
  }
  return `<button class="group-slot-event booking" onclick="openRoomBookingModal(${x.id})">
    <div class="group-slot-event-main">
      <b>${esc(x.title||roomBookingLabel(x))}</b>
      <span>${esc(x.teacher||x.kind||"")}</span>
    </div>
    <div class="group-slot-event-meta">
      <strong>${x.room?`ауд. ${esc(x.room)}`:"—"}</strong>
      <small>${esc(x.kind||"Бронювання")}</small>
    </div>
  </button>`;
}
function groupDayPairSlots(group,date){
  const events=groupEventsForDate(group,date);
  const pairs=bellPairs();
  const known=new Set(pairs.map(p=>String(p.id)));
  const byPair=new Map();
  pairs.forEach(p=>byPair.set(String(p.id),[]));
  const unslotted=[];

  events.forEach(ev=>{
    const id=groupEventSlotId(ev);
    if(id&&known.has(id))byPair.get(id).push(ev);
    else unslotted.push(ev);
  });

  const slots=pairs.map(pair=>{
    const slotEvents=byPair.get(String(pair.id))||[];
    return `<div class="group-pair-slot ${slotEvents.length?"occupied":"free"}">
      <div class="group-pair-label">
        <b>${esc(pair.id)}</b>
        <span>${esc(pair.start||"")}</span>
      </div>
      <div class="group-pair-content">
        ${slotEvents.length?slotEvents.map(groupMonthEventCard).join(""):`<span class="group-free-label">вільно</span>`}
      </div>
    </div>`;
  }).join("");

  return slots+(unslotted.length?`<div class="group-unslotted"><span>Без № пари</span>${unslotted.map(groupMonthEventCard).join("")}</div>`:"");
}
function setTimetableGroup(code){
  if(!db.groups.some(g=>normGroup(g.code)===normGroup(code)))return;
  timetableState.group=code;
  rememberTimetableGroup(code);
  timetableState.month=groupCurrentMonth();
  renderTimetable();
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
      <div class="group-timetable-switch-head">
        <div>
          <span>Група</span>
          <b>${esc(group)} · ${groupCourse(group)} курс</b>
        </div>
        <div class="ready-count"><b>${total}</b><span>занять групи у базі</span></div>
      </div>
      ${groupSwitchRowHtml({
        selected:group,
        onclick:"setTimetableGroup",
        badgeFn:g=>String(scheduleLessonsForGroup(g.code).length),
        extraClass:"timetable-group-switch"
      })}
      ${groupMonthTabsHtml(group)}
      <div class="teacher-month-toolbar"><button class="secondary" ${idx<=0?"disabled":""} onclick="shiftGroupTimetableMonth(-1)">← Попередній</button><div class="teacher-month-title"><b>${esc(info?.label||monthLabel(month))}</b><span>${monthCount} подій у місяці · ${esc(db.academicYear)}</span></div><button class="secondary" onclick="timetableToday()">Актуальний місяць</button><button class="secondary" ${idx>=months.length-1?"disabled":""} onclick="shiftGroupTimetableMonth(1)">Наступний →</button></div>
    </div>
    <div class="card section teacher-month-calendar-card"><div class="teacher-month-weekdays">${weekdays.map(w=>`<div>${w}</div>`).join("")}</div><div class="teacher-month-calendar">${days.map(date=>{const inMonth=date.slice(0,7)===month,inAcademic=dateInBounds(date),day=Number(date.slice(8,10)),isToday=date===today;return `<div class="teacher-month-day ${inMonth?"":"outside-month"} ${isToday?"today":""}"><div class="teacher-month-day-head"><b>${day}</b>${isToday?`<span>сьогодні</span>`:""}</div><div class="teacher-month-day-events group-pair-slots">${inMonth&&inAcademic?groupDayPairSlots(group,date):""}</div></div>`;}).join("")}</div></div>
    <div class="notice">Це не окрема копія розкладу: кожне заняття тут — той самий запис, який одночасно бачить сітка аудиторій і індивідуальний розклад викладача.</div>
  </div>`;
}
/* Individual teacher schedule — monthly view */
let teacherScheduleFeed={teacherId:null,schedule:[],roomBookings:[],academicYear:"",bellSchedule:[]};
let teacherScheduleState={teacherId:rememberedTeacherView(),month:null};

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
  const current=Number(teacherScheduleState.teacherId)||rememberedTeacherView();
  return current&&teacherById(current)?current:null;
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
function teacherSchedulePairs(source){
  return (source?.bellSchedule||db.bellSchedule||[])
    .slice()
    .sort((a,b)=>Number(a.id)-Number(b.id));
}
function teacherEventSlotId(ev,source){
  const x=ev.data;
  if(x?.pairId!==null&&x?.pairId!==undefined&&String(x.pairId)!=="")return String(x.pairId);
  const p=(source.bellSchedule||[]).find(p=>p.start===x?.start&&p.end===x?.end);
  if(p)return String(p.id);
  const derived=pairIdForTimes(x?.start||"",x?.end||"");
  return derived!==null&&derived!==undefined?String(derived):null;
}
function teacherPairSlotEventCard(ev,source){
  const x=ev.data;
  if(ev.source==="schedule"){
    if(x.specialSchedule){
      return `<div class="teacher-slot-event teacher-slot-special subject-colored" style="${scheduleColorVars(x)}"><div class="teacher-slot-event-main"><b>${esc(specialStudentName(x))}</b><span>${esc(x.discipline||"Заняття")}</span></div><div class="teacher-slot-event-meta"><strong>${esc(x.start||"")}–${esc(x.end||"")}${x.room?` · ауд. ${esc(x.room)}`:""}</strong><small>½ пари · ${esc(x.type||specialKindMeta(x.specialKind).short)}</small></div></div>`;
    }
    return `<div class="teacher-slot-event subject-colored" style="${scheduleColorVars(x)}">
      <div class="teacher-slot-event-main"><b>${esc(scheduleAudienceLabel(x)||"—")}</b><span>${esc(x.discipline||"Заняття")}</span></div>
      <div class="teacher-slot-event-meta"><strong>${x.room?`ауд. ${esc(x.room)}`:"—"}</strong>${x.type?`<small>${esc(x.type)}</small>`:""}</div>
    </div>`;
  }
  return `<div class="teacher-slot-event booking">
    <div class="teacher-slot-event-main">
      <b>${esc(x.group||x.kind||"Подія")}</b>
      <span>${esc(x.title||roomBookingLabel(x))}</span>
    </div>
    <div class="teacher-slot-event-meta">
      <strong>${x.room?`ауд. ${esc(x.room)}`:"—"}</strong>
      ${x.kind?`<small>${esc(x.kind)}</small>`:""}
    </div>
  </div>`;
}
function teacherDayPairSlots(source,date){
  const events=teacherEventsForDate(source,date);
  const pairs=teacherSchedulePairs(source);
  const known=new Set(pairs.map(p=>String(p.id)));
  const byPair=new Map();
  pairs.forEach(p=>byPair.set(String(p.id),[]));
  const unslotted=[];

  events.forEach(ev=>{
    const id=teacherEventSlotId(ev,source);
    if(id&&known.has(id))byPair.get(id).push(ev);
    else unslotted.push(ev);
  });

  const slots=pairs.map(pair=>{
    const slotEvents=byPair.get(String(pair.id))||[];
    return `<div class="teacher-pair-slot ${slotEvents.length?"occupied":"free"}">
      <div class="teacher-pair-label">
        <b>${esc(pair.id)}</b>
        <span>${esc(pair.start||"")}</span>
      </div>
      <div class="teacher-pair-content">
        ${slotEvents.length?slotEvents.map(ev=>teacherPairSlotEventCard(ev,source)).join(""):`<span class="teacher-window-label">вікно</span>`}
      </div>
    </div>`;
  }).join("");

  return slots+(unslotted.length?`<div class="teacher-unslotted"><span>Без № пари</span>${unslotted.map(ev=>teacherPairSlotEventCard(ev,source)).join("")}</div>`:"");
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
    if(x.specialSchedule){
      return `<div class="teacher-month-event teacher-month-special subject-colored" style="${scheduleColorVars(x)}"><div class="teacher-month-event-top"><b>½ ${esc(pair)}</b><strong>${esc(x.start||"")}–${esc(x.end||"")}</strong></div><span class="teacher-month-group">${esc(specialStudentName(x))}</span><span class="teacher-month-discipline">${esc(x.discipline||"Заняття")}</span><small>${esc(x.type||specialKindMeta(x.specialKind).short)}${x.room?` · ауд. ${esc(x.room)}`:""}</small></div>`;
    }
    return `<div class="teacher-month-event subject-colored" style="${scheduleColorVars(x)}">
      <div class="teacher-month-event-top"><b>${esc(pair)}</b><strong>${x.room?`ауд. ${esc(x.room)}`:"—"}</strong></div>
      <span class="teacher-month-group">${esc(scheduleAudienceLabel(x)||"—")}</span><span class="teacher-month-discipline">${esc(x.discipline||"Заняття")}</span>${x.type?`<small>${esc(x.type)}</small>`:""}
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
  rememberTeacherView(teacherScheduleState.teacherId);
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
    if(role==="teacher"){
      $("#pageTitle").textContent="Мій розклад";
      $("#pageSubtitle").textContent=window.REMS_CLOUD?.email?.()||"";
      $("#page-mySchedule").innerHTML=`<div class="card section"><div class="empty"><b>Ваш акаунт ще не прив’язаний до профілю викладача.</b><br>Зверніться до адміністратора системи.</div><div class="actions" style="justify-content:center;margin-top:16px"><button class="secondary" onclick="window.REMS_CLOUD?.signOut?.()">Вийти</button></div></div>`;
      return;
    }
    if(role){
      rememberTeacherView(null);
      go("teachers");
      return;
    }
    $("#pageTitle").textContent="Розклад викладача";
    $("#pageSubtitle").textContent="";
    $("#page-mySchedule").innerHTML=`<div class="card section"><div class="empty">Завантаження доступу…</div></div>`;
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
          const day=Number(date.slice(8,10));
          const isToday=date===today;
          return `<div class="teacher-month-day ${inMonth?"":"outside-month"} ${isToday?"today":""}">
            <div class="teacher-month-day-head">
              <b>${day}</b>
              ${isToday?`<span>сьогодні</span>`:""}
            </div>
            <div class="teacher-month-day-events teacher-pair-slots">
              ${inMonth&&inAcademic?teacherDayPairSlots(source,date):""}
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
    return;
  }

  if(role&&currentPage==="mySchedule"){
    const saved=teacherPortalTeacherId();
    if(saved){
      teacherScheduleState.teacherId=saved;
      if(!teacherScheduleState.month)teacherScheduleState.month=teacherCurrentMonth();
      renderMySchedule();
    }else{
      rememberTeacherView(null);
      go("teachers");
    }
  }
};

/* Settings */
function renderBellRows(){return bellPairs().map(p=>`<div class="bell-row" data-bell-row data-id="${esc(p.id)}"><div class="bell-number">${esc(p.id)} пара</div><input data-bstart type="time" value="${esc(p.start||"")}"><span>—</span><input data-bend type="time" value="${esc(p.end||"")}"><button class="danger small-btn" onclick="removeBellPair(${JSON.stringify(p.id)})">×</button></div>`).join("");}
function renderUsers(){
  const page=$("#page-users");
  page.innerHTML=`${settingsBackBar("Користувачі та доступ","Облікові записи, ролі, прив’язка до викладачів і блокування доступу.")}
    <div id="usersCloudMount"><div class="card section"><div class="empty">Підключення модуля користувачів…</div></div></div>`;
  const mount=$("#usersCloudMount");
  if(window.REMS_CLOUD?.renderUsersPage) window.REMS_CLOUD.renderUsersPage(mount);
}

function renderBellSchedule(){
  $("#page-bellSchedule").innerHTML=`${settingsBackBar("Розклад дзвінків","Налаштування номерів пар і часу, який автоматично використовується у всіх календарях та перевірках конфліктів.")}
    <div class="card section settings-subpage-card bell-schedule-page">
      <div class="section-head">
        <div>
          <h2>Розклад дзвінків</h2>
          <div class="small">Змінюй час тут один раз — заняття з номерами пар оновляться автоматично.</div>
        </div>
        <button class="secondary" onclick="addBellPair()">+ Додати пару</button>
      </div>

      <div class="bell-page-intro">
        <div><b>${bellPairs().length}</b><span>пар у довіднику</span></div>
        <p>У складанні розкладу ти вибираєш номер пари, а час підтягується звідси.</p>
      </div>

      <div class="bell-editor">
        <div class="bell-head"><span>Пара</span><span>Початок</span><span></span><span>Кінець</span><span></span></div>
        ${renderBellRows()}
      </div>

      <div class="settings-subpage-actions">
        <button class="primary" onclick="saveBellSchedule()">Зберегти розклад дзвінків</button>
        <button class="secondary" onclick="go('settings')">← До налаштувань</button>
      </div>
    </div>`;
}

function renderSettings(){
  $("#page-settings").innerHTML=`
    <div class="settings-hub">
      <div class="settings-hub-hero">
        <div>
          <span>СИСТЕМА</span>
          <h2>Налаштування</h2>
          <p>Рідкісні довідники відкриваються окремими робочими екранами. Основні параметри та резервні копії залишаються тут.</p>
        </div>
      </div>

      <div class="settings-hub-section">
        <div class="settings-hub-section-head">
          <div>
            <span>ДОВІДНИКИ ТА ДОСТУП</span>
            <h3>Відкрити окремий розділ</h3>
          </div>
        </div>

        <div class="settings-shortcuts settings-shortcuts-3">
          <button class="settings-shortcut settings-shortcut-feature" onclick="go('lessonTypes')">
            <i>≡</i>
            <div><b>Види занять і правила годин</b><span>Лекції, практичні, іспити, індивідуальні та правила підрахунку.</span></div>
            <strong>→</strong>
          </button>

          <button class="settings-shortcut settings-shortcut-feature" onclick="go('users')">
            <i>◎</i>
            <div><b>Користувачі та доступ</b><span>Облікові записи, ролі, прив’язка викладачів і блокування доступу.</span></div>
            <strong>→</strong>
          </button>

          <button class="settings-shortcut settings-shortcut-feature" onclick="go('bellSchedule')">
            <i>◷</i>
            <div><b>Розклад дзвінків</b><span>${bellPairs().length} пар · час початку й завершення кожної пари.</span></div>
            <strong>→</strong>
          </button>
        </div>
      </div>

      <div class="settings-hub-section">
        <div class="settings-hub-section-head">
          <div>
            <span>ОСНОВНІ ПАРАМЕТРИ</span>
            <h3>Навчальний період і дані</h3>
          </div>
        </div>

        <div class="settings-grid">
          <div class="card settings-card settings-card-primary">
            <h3>Навчальний період</h3>
            <label>Навчальний рік<input id="setYear" value="${esc(db.academicYear)}"></label>
            <label style="margin-top:10px">Семестр<select id="setSem"><option ${db.semester===1?"selected":""}>1</option><option ${db.semester===2?"selected":""}>2</option></select></label>
            <div class="small settings-period-summary">
              <b>Календар року:</b> ${academicDateMessage()}<br>
              <b>І семестр:</b> ${academicDateMessage(semesterDateBounds(1))}<br>
              <b>ІІ семестр:</b> ${academicDateMessage(semesterDateBounds(2))}<br>
              Липень і серпень у розкладах не використовуються.
            </div>
            <button class="primary" style="margin-top:12px" onclick="savePeriod()">Зберегти період</button>
          </div>

          <div class="card settings-card">
            <h3>Резервна копія</h3>
            <p class="small">Експорт усієї бази одним JSON-файлом.</p>
            <button class="primary" onclick="exportData()">Експорт даних</button>
          </div>

          <div class="card settings-card">
            <h3>Імпорт</h3>
            <p class="small">Відновити дані з резервної копії.</p>
            <button class="secondary" onclick="document.querySelector('#importFile').click()">Імпортувати</button>
          </div>

          <div class="card settings-card settings-card-danger">
            <h3>Скидання</h3>
            <p class="small">Повернути початкові дані системи.</p>
            <button class="danger" onclick="resetData()">Скинути дані</button>
          </div>
        </div>
      </div>

      <div id="cloudSettingsMount"></div>
    </div>`;
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
