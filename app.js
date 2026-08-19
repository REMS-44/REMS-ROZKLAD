
const KEY="remsScheduleData_v09";
const APP_SCHEMA_VERSION=27;
const OLD_KEYS=["remsScheduleData_v08","remsScheduleData_v07","remsScheduleData_v06","remsScheduleData_v051","remsScheduleData_v04","remsScheduleData_v02","remsScheduleData_v01"];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clone=x=>JSON.parse(JSON.stringify(x));
const UI_PAGE_KEY="remsUiPage_v1";
const UI_TIMETABLE_GROUP_KEY="remsUiTimetableGroup_v1";
const UI_WORKLOAD_GROUP_KEY="remsUiWorkloadGroup_v1";
const UI_PROGRAM_SCOPE_KEY="remsUiProgramScope_v1";
const UI_TEACHER_VIEW_KEY="remsUiTeacherView_v1";
const UI_LOAD_PAGE_GROUP_KEY="remsUiLoadPageGroup_v1";
const UI_LOAD_PAGE_FILTER_KEY="remsUiLoadPageFilter_v1";
const UI_LOAD_PAGE_SEMESTER_KEY="remsUiLoadPageSemester_v1";

const BACKUP_DB_NAME="remsScheduleBackups_v1";
const BACKUP_STORE="snapshots";
const BACKUP_LIMIT=10;
const BACKUP_EXPORT_KEY="remsLastJsonExport_v1";
const BACKUP_AUTO_DELAY=45*1000;
let automaticBackupTimer=null;
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

  if(!matches.length)return null;
  return matches.find(t=>t.scope==="external")||matches[0];
}
function ensureReadyExternalTeacher(text,state=db,programId=null){
  const name=String(text||"").trim();
  if(!name)return null;
  const pid=programId||activeProgramId?.()||"rems";

  const existing=teacherMatchByText(name,state);
  if(existing){
    existing.programIds=uniqueStrings([...(Array.isArray(existing.programIds)?existing.programIds:[]),pid]);
    return existing;
  }

  state.teachers=state.teachers||[];
  const t={
    id:uid(state.teachers),
    scope:"external",
    homeDepartmentId:"",
    programIds:[pid],
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
        if(!linked){const pid=(state.groups||[]).find(g=>normIdentity(g.code)===normIdentity(item.group))?.programId||"rems";linked=ensureReadyExternalTeacher(item.teacher,state,pid);if(linked)changed++;}
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
function roomSeedKey(r){return normIdentity(r?.name||"");}
function mergeSeedRooms(existing=[],seed=[]){
  const result=clone(existing||[]),byKey=new Map(result.map(r=>[roomSeedKey(r),r]));
  (seed||[]).forEach(seedRoom=>{
    const key=roomSeedKey(seedRoom);if(!key)return;
    const current=byKey.get(key);
    if(!current){const copy=clone(seedRoom);result.push(copy);byKey.set(key,copy);return;}
    if(!current.ownerDepartmentId&&seedRoom.ownerDepartmentId)current.ownerDepartmentId=seedRoom.ownerDepartmentId;
    if(!Array.isArray(current.programIds)||!current.programIds.length)current.programIds=clone(seedRoom.programIds||[]);
  });
  return result;
}
function mergeSeedReferenceData(existing=[],seed=[]){
  const result=clone(existing||[]),byId=new Map(result.map(x=>[String(x?.id||""),x]));
  (seed||[]).forEach(seedItem=>{
    const key=String(seedItem?.id||"");if(!key)return;
    const current=byId.get(key);
    if(!current){const copy=clone(seedItem);result.push(copy);byId.set(key,copy);return;}
    Object.entries(seedItem).forEach(([k,v])=>{
      if(current[k]===undefined||current[k]===null||current[k]==="")current[k]=clone(v);
    });
  });
  return result;
}
function isMasterGroupCode(code){return normIdentity(code).startsWith("мсм-");}

function mergeSeedStudents(existing=[],seed=[]){
  const result=clone(existing||[]);
  const byKey=new Map(result.map(s=>[studentSeedKey(s),s]));
  (seed||[]).forEach(s=>{
    const key=studentSeedKey(s);
    if(!key)return;
    const current=byKey.get(key);
    if(current){
      // v2.0.14: enrich a manually created matching first-year student with funding data,
      // but never change status or resurrect an archived record.
      if(!current.funding&&s.funding)current.funding=s.funding;
      return;
    }
    const copy=clone(s);
    copy.id=uid(result);
    result.push(copy);
    byKey.set(key,copy);
  });
  return result;
}

function teacherSeedKey(t){return normIdentity(t?.name||t?.shortName||"");}
function mergeSeedTeachers(existing=[],seed=[]){
  const result=clone(existing||[]);
  const byKey=new Map(result.map(t=>[teacherSeedKey(t),t]).filter(([k])=>k));
  (seed||[]).forEach(seedTeacher=>{
    const key=teacherSeedKey(seedTeacher);if(!key)return;
    const current=byKey.get(key);
    if(!current){
      const copy=clone(seedTeacher);
      copy.id=uid(result);
      result.push(copy);
      byKey.set(key,copy);
      return;
    }
    const wasExternal=current.scope==="external";
    if(seedTeacher.scope==="department"){
      current.scope="department";
      if(wasExternal||!current.homeDepartmentId)current.homeDepartmentId=seedTeacher.homeDepartmentId||current.homeDepartmentId||"";
    }
    current.programIds=uniqueStrings([...(Array.isArray(current.programIds)?current.programIds:[]),...(Array.isArray(seedTeacher.programIds)?seedTeacher.programIds:[])]);
    if(!current.employmentType&&seedTeacher.employmentType)current.employmentType=seedTeacher.employmentType;
    if(!current.name&&seedTeacher.name)current.name=seedTeacher.name;
    if(!current.shortName&&seedTeacher.shortName)current.shortName=seedTeacher.shortName;
    if(!current.note&&seedTeacher.note)current.note=seedTeacher.note;
  });
  return result;
}

function deriveLegacyStudentHours(d,lessonTypes=[]){
  const out={};
  Object.entries(d?.teacherStudentLoads||{}).forEach(([tid,byType])=>{
    Object.entries(byType||{}).forEach(([typeId,studentIds])=>{
      const lt=(lessonTypes||[]).find(x=>String(x.id)===String(typeId));
      if(!lt)return;
      const name=normIdentity(lt.name||"");
      const thesis=name===normIdentity("Керівництво бакалаврською роботою")||name===normIdentity("Керівництво магістерською роботою");
      const splitIndividual=!thesis&&!name.includes("консультац")&&(lt.countMode==="per_student"||name==="індивідуальне");
      if(!splitIndividual)return;
      const unit=num(d?.hours?.[typeId])+num(d?.extraHours?.[typeId]);
      if(unit<=0)return;
      const map={};
      [...new Set((studentIds||[]).map(Number).filter(Boolean))].forEach(studentId=>map[String(studentId)]=unit);
      out[String(tid)]=out[String(tid)]||{};
      out[String(tid)][String(typeId)]=map;
    });
  });
  return out;
}

function migrate(old){
  const fresh=clone(window.REMS_INITIAL_DATA);
  if(!old||typeof old!=="object") return fresh;
  const previousSchemaVersion=Number(old.schemaVersion||0);
  fresh.faculty=old.faculty||fresh.faculty||{};
  fresh.departments=mergeSeedReferenceData(old.departments||[],fresh.departments||[]);
  fresh.programs=mergeSeedReferenceData(old.programs||[],fresh.programs||[]);
  fresh.groups=mergeSeedGroups(old.groups||[],fresh.groups||[]).map(g=>{
    const seed=(fresh.groups||[]).find(x=>groupSeedKey(x)===groupSeedKey(g));
    const out={...g,departmentId:g.departmentId||seed?.departmentId||"rems-dept",programId:g.programId||seed?.programId||"rems"};
    // v2.0.7: master's groups are a faculty-wide online workspace, not part of REMS.
    if(previousSchemaVersion<24&&isMasterGroupCode(out.code)){
      out.programId="master";
      out.departmentId="";
      if(normIdentity(out.code)===normIdentity("МСМ-25"))out.course=6;
    }
    return out;
  });
  // v2.0.14: schema 26 adds the received first-year TA/TR student lists; the one-time upgrade imports them into existing databases.
// v2.0.4: seed students are imported only while upgrading an older database.
  // From schema 22 onward the cloud/user list is authoritative, so a student
  // that the administrator deletes must NOT be silently re-created from data.js.
  // Student roster is user/cloud data, not functional seed data.
  // If a database already has a students array, keep it EXACTLY as the authority:
  // future schema upgrades must never restore deleted students, old names or old group membership.
  fresh.students=Array.isArray(old.students)?clone(old.students):clone(fresh.students||[]);
  fresh.adHocRooms=uniqueStrings(old.adHocRooms||fresh.adHocRooms||[]);
  fresh.rooms=mergeSeedRooms(old.rooms||[],fresh.rooms||[]).map((r,i)=>{
    const seed=(fresh.rooms||[]).find(x=>roomSeedKey(x)===roomSeedKey(r));
    const oldProgramIds=Array.isArray(r.programIds)&&r.programIds.length?r.programIds:[];
    const seededProgramIds=Array.isArray(seed?.programIds)?seed.programIds:[];
    const mergedProgramIds=previousSchemaVersion<19
      ?uniqueStrings([...oldProgramIds,...seededProgramIds])
      :uniqueStrings(oldProgramIds.length?oldProgramIds:seededProgramIds);
    const programIds=mergedProgramIds.length?mergedProgramIds:["rems"];
    const ownerDepartmentId=previousSchemaVersion<19&&seed?.ownerDepartmentId
      ?seed.ownerDepartmentId
      :(r.ownerDepartmentId||seed?.ownerDepartmentId||"rems-dept");
    return {id:r.id||i+1,name:r.name||"",status:r.status||"active",note:r.note||"",showInGrid:r.showInGrid!==false,gridOrder:Number.isFinite(Number(r.gridOrder))?Number(r.gridOrder):i+1,ownerDepartmentId,programIds};
  });
  fresh.roomBookings=(old.roomBookings||[]).map((b,i)=>{
    const groupProgram=fresh.groups.find(g=>normIdentity(g.code)===normIdentity(b.group))?.programId;
    const masterBooking=previousSchemaVersion<24&&isMasterGroupCode(b.group);
    return {...b,id:b.id||i+1,kind:b.kind||"Бронювання",title:b.title||"",date:b.date||"",pairId:b.pairId||null,start:b.start||"",end:b.end||"",room:masterBooking?"":(b.room||""),group:b.group||"",teacherId:b.teacherId||null,teacher:b.teacher||"",programId:masterBooking?"master":(b.programId||groupProgram||"rems"),showInTimetable:b.showInTimetable===true,note:b.note||""};
  });
  fresh.academicYear=old.academicYear||fresh.academicYear;
  fresh.semester=old.semester||fresh.semester;
  fresh.bellSchedule=old.bellSchedule||fresh.bellSchedule||[];
  fresh.studyPeriods=clone(old.studyPeriods||fresh.studyPeriods||{});
  if(previousSchemaVersion<23){
    [1,2].forEach(half=>{const oldKey=`5-${half}`,newKey=`6-${half}`;if(fresh.studyPeriods[oldKey]&&!fresh.studyPeriods[newKey])fresh.studyPeriods[newKey]=clone(fresh.studyPeriods[oldKey]);});
  }
  fresh.lessonTypes=(old.lessonTypes||fresh.lessonTypes).map((x,i)=>typeof x==="string"?{
    id:i+1,name:x,countMode:"manual",defaultUnit:1,description:""
  }:{...x,id:x.id||i+1});
  // v2.0.13: «Семінар» — базовий вид заняття і не повинен зникати зі старих хмарних даних.
  if(!fresh.lessonTypes.some(lt=>normIdentity(lt.name)===normIdentity("Семінар"))){
    fresh.lessonTypes.push({id:uid(fresh.lessonTypes),name:"Семінар",countMode:"academic_pair",defaultUnit:2,description:"Аудиторні години; 2 академічні години = 1 пара"});
  }
  fresh.lessonTypes.forEach(lt=>{const n=normIdentity(lt.name);if(["лекція","семінар","практичне","лабораторне"].includes(n)){lt.countMode="academic_pair";lt.defaultUnit=2;if(!lt.description)lt.description="Аудиторні години; 2 академічні години = 1 пара";}});
  // v2.0.8: thesis supervision is its own workload type, separate from generic consultations.
  [
    {name:"Керівництво бакалаврською роботою",description:"Лише 4 курс бакалаврату; один студент — один керівник"},
    {name:"Керівництво магістерською роботою",description:"Лише магістратура; один студент — один керівник"}
  ].forEach(seed=>{
    let lt=fresh.lessonTypes.find(x=>normIdentity(x.name)===normIdentity(seed.name));
    if(!lt){lt={id:uid(fresh.lessonTypes),name:seed.name,countMode:"per_student",defaultUnit:1,description:seed.description};fresh.lessonTypes.push(lt);}
    else{lt.countMode="per_student";lt.defaultUnit=lt.defaultUnit||1;lt.description=lt.description||seed.description;}
  });
  fresh.teachers=mergeSeedTeachers(old.teachers||[],fresh.teachers||[]).map((t,i)=>({
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
    homeDepartmentId:t.homeDepartmentId||(t.scope==="external"?"":"rems-dept"),
    programIds:uniqueStrings((Array.isArray(t.programIds)&&t.programIds.length?t.programIds:["rems"])),
    status:t.status||"active"
  }));
  fresh.disciplines=(old.disciplines||[]).map((d,i)=>({
    ...d,
    id:d.id||i+1,name:d.name||"",course:(previousSchemaVersion<24&&normIdentity(d.group)===normIdentity("МСМ-25"))?6:(d.course||""),group:d.group||"",
    programId:(previousSchemaVersion<24&&isMasterGroupCode(d.group))?"master":(d.programId||fresh.groups.find(g=>normIdentity(g.code)===normIdentity(d.group))?.programId||"rems"),
    semester:d.semester||fresh.semester,academicYear:d.academicYear||fresh.academicYear,
    teacherIds:d.teacherIds||[],teacherLoads:d.teacherLoads||{},teacherStudentLoads:d.teacherStudentLoads||{},
    teacherStudentHours:d.teacherStudentHours||deriveLegacyStudentHours(d,fresh.lessonTypes),
    teacherStreams:d.teacherStreams||{},
    audienceMode:d.audienceMode==="selected"?"selected":"group",
    selectedStudentIds:[...new Set((d.selectedStudentIds||[]).map(Number).filter(Boolean))],
    controlForm:d.controlForm||"Немає",color:d.color||"#8b5cf6",
    hours:d.hours||{},extraHours:d.extraHours||{},note:d.note||"",status:d.status||"active",
    sourceCurriculumId:d.sourceCurriculumId||null,sourceComponentId:d.sourceComponentId||null,
    planMeta:d.planMeta||{}
  }));
  fresh.curricula=mergeSeedCurricula(old.curricula||[],fresh.curricula||[]).map(c=>({
    ...c,
    course:(previousSchemaVersion<24&&(c.applicableGroups||[]).some(code=>normIdentity(code)===normIdentity("МСМ-25")))?6:c.course,
    programId:(previousSchemaVersion<24&&(c.applicableGroups||[]).some(isMasterGroupCode))?"master":(c.programId||fresh.groups.find(g=>(c.applicableGroups||[]).some(code=>normIdentity(code)===normIdentity(g.code)))?.programId||((fresh.programs||[]).find(p=>normIdentity(p.name)===normIdentity(c.program))?.id)||"rems")
  }));
  fresh.schemaVersion=APP_SCHEMA_VERSION;
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
    if(previousSchemaVersion<24&&scheduleAudienceGroups(out).some(isMasterGroupCode))out.room="";
    return out;
  });
  // Teachers stay attached to their home departments. If an existing teacher already
  // teaches a master's discipline / lesson, only add the master's programme link.
  if(previousSchemaVersion<24){
    const masterTeacherIds=new Set();
    (fresh.disciplines||[]).filter(d=>isMasterGroupCode(d.group)).forEach(d=>(d.teacherIds||[]).forEach(id=>masterTeacherIds.add(Number(id))));
    (fresh.schedule||[]).filter(x=>scheduleAudienceGroups(x).some(isMasterGroupCode)).forEach(x=>{if(x.teacherId)masterTeacherIds.add(Number(x.teacherId));});
    (fresh.teachers||[]).forEach(t=>{if(masterTeacherIds.has(Number(t.id)))t.programIds=uniqueStrings([...(t.programIds||[]),"master"]);});
  }
  repairScheduleLinks(fresh);
  return fresh;
}

function backupSummary(state){
  const s=state||{};
  const schedule=(s.schedule||[]);
  return {
    groups:(s.groups||[]).filter(x=>x.status!=="archived").length,
    students:(s.students||[]).filter(x=>x.status!=="archived").length,
    teachers:(s.teachers||[]).filter(x=>x.status!=="archived").length,
    curricula:(s.curricula||[]).filter(x=>x.status!=="archived").length,
    disciplines:(s.disciplines||[]).filter(x=>x.status!=="archived").length,
    schedule:schedule.length,
    regular:schedule.filter(x=>!x.specialSchedule).length,
    special:schedule.filter(x=>x.specialSchedule).length,
    rooms:(s.rooms||[]).filter(x=>x.status!=="archived").length
  };
}
function backupSummaryInline(summary={}){
  return `${summary.groups||0} груп · ${summary.students||0} студентів · ${summary.teachers||0} викладачів · ${summary.disciplines||0} дисциплін · ${summary.schedule||0} записів розкладу`;
}
function backupBytes(state){
  try{return new Blob([JSON.stringify(state)]).size;}catch(e){return 0;}
}
function backupSizeLabel(bytes=0){
  if(bytes<1024)return `${bytes} Б`;
  if(bytes<1024*1024)return `${(bytes/1024).toFixed(bytes<10240?1:0)} КБ`;
  return `${(bytes/1024/1024).toFixed(1)} МБ`;
}
function backupDateLabel(value){
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return "—";
  return new Intl.DateTimeFormat("uk-UA",{
    day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"
  }).format(d);
}
function openBackupDB(){
  return new Promise((resolve,reject)=>{
    if(!("indexedDB" in window))return reject(new Error("IndexedDB недоступний у цьому браузері."));
    const req=indexedDB.open(BACKUP_DB_NAME,1);
    req.onupgradeneeded=()=>{
      const idb=req.result;
      if(!idb.objectStoreNames.contains(BACKUP_STORE)){
        const store=idb.createObjectStore(BACKUP_STORE,{keyPath:"id"});
        store.createIndex("createdAt","createdAt",{unique:false});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error("Не вдалося відкрити локальне сховище."));
  });
}
async function backupStoreAction(mode,callback){
  const idb=await openBackupDB();
  try{
    return await new Promise((resolve,reject)=>{
      const tx=idb.transaction(BACKUP_STORE,mode);
      const store=tx.objectStore(BACKUP_STORE);
      let result;
      try{result=callback(store,tx,resolve,reject);}catch(e){reject(e);return;}
      tx.onerror=()=>reject(tx.error||new Error("Помилка локального сховища."));
      tx.onabort=()=>reject(tx.error||new Error("Операцію резервної копії скасовано."));
      if(result!==undefined&&typeof result?.then!=="function"){}
    });
  }finally{
    idb.close();
  }
}
async function localBackupList(){
  const idb=await openBackupDB();
  try{
    return await new Promise((resolve,reject)=>{
      const tx=idb.transaction(BACKUP_STORE,"readonly");
      const req=tx.objectStore(BACKUP_STORE).getAll();
      req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))));
      req.onerror=()=>reject(req.error);
    });
  }finally{idb.close();}
}
async function localBackupGet(id){
  const idb=await openBackupDB();
  try{
    return await new Promise((resolve,reject)=>{
      const tx=idb.transaction(BACKUP_STORE,"readonly");
      const req=tx.objectStore(BACKUP_STORE).get(id);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
  }finally{idb.close();}
}
async function trimLocalBackups(){
  const list=await localBackupList();
  if(list.length<=BACKUP_LIMIT)return;
  const remove=list.slice(BACKUP_LIMIT);
  const idb=await openBackupDB();
  try{
    await new Promise((resolve,reject)=>{
      const tx=idb.transaction(BACKUP_STORE,"readwrite");
      const store=tx.objectStore(BACKUP_STORE);
      remove.forEach(x=>store.delete(x.id));
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
  }finally{idb.close();}
}
async function createLocalBackup(reason="Контрольна точка",state=null,kind="manual"){
  const snapshot=clone(state||db);
  const createdAt=new Date().toISOString();
  const record={
    id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    createdAt,
    reason,
    kind,
    summary:backupSummary(snapshot),
    bytes:backupBytes(snapshot),
    data:snapshot
  };
  const idb=await openBackupDB();
  try{
    await new Promise((resolve,reject)=>{
      const tx=idb.transaction(BACKUP_STORE,"readwrite");
      tx.objectStore(BACKUP_STORE).put(record);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
  }finally{idb.close();}
  await trimLocalBackups();
  return record;
}
function scheduleAutomaticBackup(){
  if(automaticBackupTimer)return;
  automaticBackupTimer=setTimeout(async()=>{
    automaticBackupTimer=null;
    try{
      await createLocalBackup("Автоматична контрольна точка",db,"auto");
    }catch(e){
      console.warn("Automatic backup failed",e);
    }
  },BACKUP_AUTO_DELAY);
}
async function deleteLocalBackup(id){
  const rec=await localBackupGet(id);
  if(!rec)return;
  if(!confirm(`Видалити контрольну точку від ${backupDateLabel(rec.createdAt)}?`))return;

  const idb=await openBackupDB();
  try{
    await new Promise((resolve,reject)=>{
      const tx=idb.transaction(BACKUP_STORE,"readwrite");
      tx.objectStore(BACKUP_STORE).delete(id);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
  }finally{idb.close();}
  await refreshBackupCenter();
}
async function createManualBackup(){
  try{
    await createLocalBackup("Створено вручну",db,"manual");
    await refreshBackupCenter();
  }catch(e){
    alert(`Не вдалося створити локальну копію: ${e.message||e}`);
  }
}
async function restoreLocalBackup(id){
  const rec=await localBackupGet(id);
  if(!rec)return alert("Контрольну точку не знайдено.");

  const warning=window.REMS_CLOUD?.canWrite?.()
    ?"\n\nУВАГА: після відновлення цей стан буде синхронізовано у спільну Firebase-базу."
    :"\n\nСтан буде відновлено в цьому браузері.";

  if(!confirm(
    `Відновити базу станом на ${backupDateLabel(rec.createdAt)}?\n\n${backupSummaryInline(rec.summary)}${warning}`
  ))return;

  try{
    await createLocalBackup("Перед відновленням старої версії",db,"safety");
    db=migrate(clone(rec.data));
    normalizeCurricula();
    save();
    closeModal();
    go("settings");
    alert("Контрольну точку відновлено.");
  }catch(e){
    alert(`Не вдалося відновити: ${e.message||e}`);
  }
}
function lastJsonExport(){
  try{return localStorage.getItem(BACKUP_EXPORT_KEY)||"";}catch(e){return"";}
}
function markJsonExport(){
  try{localStorage.setItem(BACKUP_EXPORT_KEY,new Date().toISOString());}catch(e){}
}
function backupExportPayload(){
  return {
    format:"REMS-ROZKLAD-BACKUP",
    formatVersion:1,
    createdAt:new Date().toISOString(),
    appVersion:"1.8.0",
    summary:backupSummary(db),
    data:clone(db)
  };
}
function exportData(){
  const payload=backupExportPayload();
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  const url=URL.createObjectURL(blob);
  a.href=url;
  a.download=`REMS-ROZKLAD-backup-${localTodayISO()}-${String(new Date().getHours()).padStart(2,"0")}${String(new Date().getMinutes()).padStart(2,"0")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  markJsonExport();
  refreshBackupCenter();
}
function extractImportedState(parsed){
  if(parsed?.format==="REMS-ROZKLAD-BACKUP"&&parsed?.data)return parsed.data;
  return parsed;
}
async function importBackupFile(file){
  if(!file)return;
  try{
    const text=await file.text();
    const parsed=JSON.parse(text);
    const candidate=extractImportedState(parsed);
    const migrated=migrate(candidate);
    const summary=backupSummary(migrated);

    if(!Array.isArray(migrated.groups)||!Array.isArray(migrated.schedule)||!Array.isArray(migrated.teachers)){
      throw new Error("Файл не схожий на резервну копію РЕМС-Розкладу.");
    }

    const cloudWarning=window.REMS_CLOUD?.canWrite?.()
      ?"\n\nПісля імпорту дані будуть синхронізовані у спільну Firebase-базу."
      :"";

    if(!confirm(
      `Імпортувати цю резервну копію?\n\n${backupSummaryInline(summary)}${cloudWarning}\n\nПоточний стан буде автоматично збережено окремою контрольною точкою.`
    ))return;

    await createLocalBackup("Перед імпортом JSON",db,"safety");
    db=migrated;
    normalizeCurricula();
    save();
    closeModal();
    go("settings");
    alert("Резервну копію імпортовано.");
  }catch(e){
    alert(`Не вдалося імпортувати файл: ${e.message||e}`);
  }
}
function backupKindLabel(kind){
  return ({
    auto:"АВТО",
    manual:"ВРУЧНУ",
    safety:"СТРАХУВАЛЬНА"
  })[kind]||"КОПІЯ";
}
function backupRowHtml(rec){
  return `<article class="backup-history-row">
    <div class="backup-history-time">
      <b>${esc(backupDateLabel(rec.createdAt))}</b>
      <span class="backup-kind ${esc(rec.kind||"")}">${esc(backupKindLabel(rec.kind))}</span>
    </div>
    <div class="backup-history-main">
      <b>${esc(rec.reason||"Контрольна точка")}</b>
      <span>${esc(backupSummaryInline(rec.summary||{}))}</span>
    </div>
    <div class="backup-history-size">${esc(backupSizeLabel(rec.bytes||0))}</div>
    <div class="backup-history-actions">
      <button class="secondary" onclick="restoreLocalBackup('${esc(rec.id)}')">Відновити</button>
      <button class="quiet-danger" onclick="deleteLocalBackup('${esc(rec.id)}')">×</button>
    </div>
  </article>`;
}
async function refreshBackupCenter(){
  const mount=$("#backupHistoryMount");
  const count=$("#backupCountValue");
  const last=$("#backupLastValue");
  if(!mount&&!count&&!last)return;

  try{
    const list=await localBackupList();
    if(count)count.textContent=String(list.length);
    if(last)last.textContent=list[0]?backupDateLabel(list[0].createdAt):"ще немає";
    if(mount){
      mount.innerHTML=list.length
        ?list.map(backupRowHtml).join("")
        :`<div class="backup-empty">
            <b>Контрольних точок ще немає</b>
            <span>Натисни «Створити контрольну точку». Далі система також робитиме їх автоматично під час роботи.</span>
          </div>`;
    }
  }catch(e){
    if(mount)mount.innerHTML=`<div class="notice warn-notice">Локальні контрольні точки недоступні: ${esc(e.message||e)}</div>`;
  }
}
function openBackupCenter(){
  const summary=backupSummary(db);
  openModal(`<div class="backup-center">
    <div class="backup-center-head">
      <div>
        <span>ЗАХИСТ ДАНИХ</span>
        <h2>Резервні копії</h2>
        <p>Локальні контрольні точки для швидкого відкату + повний JSON-файл, який можна зберігати окремо від браузера і Firebase.</p>
      </div>
      <div class="backup-current-badge">
        <b>${summary.schedule}</b>
        <span>записів розкладу зараз</span>
      </div>
    </div>

    <div class="backup-kpis">
      <div><span>Локальних точок</span><b id="backupCountValue">…</b><small>зберігаємо останні ${BACKUP_LIMIT}</small></div>
      <div><span>Остання точка</span><b id="backupLastValue">…</b><small>лише в цьому браузері</small></div>
      <div><span>Останній JSON</span><b>${esc(lastJsonExport()?backupDateLabel(lastJsonExport()):"ще не створювався")}</b><small>окремий файл на комп’ютері</small></div>
    </div>

    <div class="backup-actions-grid">
      <button class="backup-action-card primary-card" onclick="createManualBackup()">
        <i>●</i>
        <div><b>Створити контрольну точку</b><span>Швидка локальна копія поточного стану. Firebase не використовується.</span></div>
      </button>
      <button class="backup-action-card" onclick="exportData()">
        <i>↓</i>
        <div><b>Завантажити повний JSON</b><span>Найнадійніша зовнішня копія всієї бази одним файлом.</span></div>
      </button>
      <button class="backup-action-card" onclick="document.querySelector('#importFile').click()">
        <i>↑</i>
        <div><b>Відновити з JSON</b><span>Перед імпортом поточний стан автоматично збережеться окремою точкою.</span></div>
      </button>
    </div>

    <div class="backup-safety-note">
      <b>Як це працює</b>
      <span>Система тримає до ${BACKUP_LIMIT} локальних контрольних точок у браузері. Під час активної роботи нова автоматична точка створюється не частіше ніж приблизно раз на хвилину. Старі видаляються автоматично. Для справжньої зовнішньої страховки періодично завантажуй JSON.</span>
    </div>

    <div class="backup-history-head">
      <div><span>ІСТОРІЯ</span><h3>Останні контрольні точки</h3></div>
      <button class="secondary" onclick="refreshBackupCenter()">Оновити</button>
    </div>
    <div id="backupHistoryMount"><div class="backup-empty">Завантаження…</div></div>
  </div>`,true);

  refreshBackupCenter();
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
  db.schemaVersion=APP_SCHEMA_VERSION;
  localStorage.setItem(KEY,JSON.stringify(db));
  scheduleAutomaticBackup();
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
  const remoteCurriculumKeys=new Set((remote?.curricula||[]).map(curriculumSeedKey));
  const remoteGroupKeys=new Set((remote?.groups||[]).map(groupSeedKey));
  const remoteStudentKeys=new Set((remote?.students||[]).map(studentSeedKey));
  const remoteRoomKeys=new Set((remote?.rooms||[]).map(roomSeedKey));
  const remoteTeacherKeys=new Set((remote?.teachers||[])
    .filter(t=>t.status!=="archived")
    .map(t=>normIdentity(t.name||t.shortName))
    .filter(Boolean));

  db=migrate(remote);

  const addedSeedCurriculum=(db.curricula||[]).some(c=>!remoteCurriculumKeys.has(curriculumSeedKey(c)));
  const addedSeedGroup=(db.groups||[]).some(g=>!remoteGroupKeys.has(groupSeedKey(g)));
  const repairedSeedGroupMetadata=(db.groups||[]).some(g=>{
    const raw=(remote?.groups||[]).find(x=>groupSeedKey(x)===groupSeedKey(g));
    if(!raw)return false;
    return Number(raw.course||0)!==Number(g.course||0)||String(raw.programId||"")!==String(g.programId||"")||String(raw.departmentId||"")!==String(g.departmentId||"");
  });
  const addedSeedStudent=(db.students||[]).some(s=>!remoteStudentKeys.has(studentSeedKey(s)));
  const addedSeedRoom=(db.rooms||[]).some(r=>!remoteRoomKeys.has(roomSeedKey(r)));
  const repairedSeedRoomMetadata=(db.rooms||[]).some(r=>{
    const raw=(remote?.rooms||[]).find(x=>roomSeedKey(x)===roomSeedKey(r));
    if(!raw)return false;
    const a=uniqueStrings(raw.programIds||[]).slice().sort().join("|");
    const b=uniqueStrings(r.programIds||[]).slice().sort().join("|");
    return a!==b||String(raw.ownerDepartmentId||"")!==String(r.ownerDepartmentId||"");
  });

  // Repair old links only for local use. Old schedule rows must NOT all be
  // written back to Firestore merely because this browser normalized them.
  repairScheduleLinks(db);

  // Old ready-made rows may contain only teacher text. repairScheduleLinks()
  // reconstructs the missing external profile. Persist ONLY that static
  // teacher profile so it does not disappear at the next catalog refresh.
  const addedRecoveredExternalTeacher=(db.teachers||[]).some(t=>
    t.scope==="external"
    &&t.status!=="archived"
    &&normIdentity(t.name||t.shortName)
    &&!remoteTeacherKeys.has(normIdentity(t.name||t.shortName))
  );
  const addedSeedTeacher=(db.teachers||[]).some(t=>
    t.status!=="archived"
    &&normIdentity(t.name||t.shortName)
    &&!remoteTeacherKeys.has(normIdentity(t.name||t.shortName))
  );

  db.schemaVersion=APP_SCHEMA_VERSION;
  normalizeCurricula();
  localStorage.setItem(KEY,JSON.stringify(db));

  // Critical v1.6.2:
  // compare future user saves against the normalized schedule the user
  // actually sees, not against raw legacy Firestore documents.
  window.REMS_CLOUD?.acceptScheduleBaseline?.(clone(db.schedule||[]));

  renderCurrent();
  document.dispatchEvent(new CustomEvent("rems-rendered"));

  // Seed curricula/groups/students may still be created if genuinely missing.
  // Schedule repair is deliberately excluded from this automatic push.
  const needsStaticRepair=
    addedSeedCurriculum
    ||addedSeedGroup
    ||repairedSeedGroupMetadata
    ||addedSeedStudent
    ||addedSeedRoom
    ||repairedSeedRoomMetadata
    ||addedRecoveredExternalTeacher
    ||addedSeedTeacher;

  if(needsStaticRepair&&window.REMS_CLOUD?.canWrite?.()){
    setTimeout(()=>window.REMS_CLOUD?.schedulePush?.(clone(db)),350);
  }
};
function groupStudentCount(code){return db.students.filter(s=>s.group===code&&s.status!=="archived").length;}
function groupCourse(code){return db.groups.find(g=>g.code===code)?.course||"";}
function courseDisplayLabel(course){
  const n=Number(course)||0;
  if(n===5)return "1 курс магістратури";
  if(n===6)return "2 курс магістратури";
  return n?`${n} курс`:"—";
}
function courseDisplayCaps(course){return courseDisplayLabel(course).toUpperCase();}
function lessonTypeByName(name){return db.lessonTypes.find(x=>x.name===name);}
function teacherDisplay(t){return t?.shortName||t?.name||"";}
function teacherById(id){return db.teachers.find(t=>Number(t.id)===Number(id));}
function disciplineById(id){return db.disciplines.find(d=>Number(d.id)===Number(id));}

function activeStudentsForGroup(group,state=db){
  return (state?.students||[]).filter(s=>s.status!=="archived"&&normIdentity(s.group)===normIdentity(group)).slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"uk"));
}
function activeStudentIdsForGroup(group,state=db){return activeStudentsForGroup(group,state).map(s=>Number(s.id)).filter(Boolean);}
function disciplineAudienceMode(d){return d?.audienceMode==="selected"?"selected":"group";}
function disciplineSelectedStudentIds(d,state=db){
  if(!d)return[];const allowed=new Set(activeStudentIdsForGroup(d.group,state));
  return [...new Set((d.selectedStudentIds||[]).map(Number).filter(id=>allowed.has(id)))];
}
function disciplineAudienceStudentIds(d,state=db){return !d?[]:(disciplineAudienceMode(d)==="selected"?disciplineSelectedStudentIds(d,state):activeStudentIdsForGroup(d.group,state));}
function disciplineAudienceLabel(d,state=db){
  if(!d)return"";const total=activeStudentIdsForGroup(d.group,state).length;
  if(disciplineAudienceMode(d)==="selected")return `Вибіркова · ${disciplineSelectedStudentIds(d,state).length}/${total} студентів`;
  return `Вся група · ${total} студентів`;
}
function disciplineAudiencePartition(d,state=db){if(!d)return null;const mode=disciplineAudienceMode(d);return {group:d.group||"",mode,studentIds:mode==="selected"?disciplineSelectedStudentIds(d,state):[]};}
function normalizeAudiencePartition(p,state=db){
  const group=String(p?.group||"").trim();if(!group)return null;const mode=p?.mode==="selected"?"selected":"group",allowed=new Set(activeStudentIdsForGroup(group,state));
  const studentIds=mode==="selected"?[...new Set((p?.studentIds||[]).map(Number).filter(id=>allowed.has(id)))]:[];return {group,mode,studentIds};
}
function scheduleAudiencePartitions(item,state=db){
  if(!item)return[];
  if(item.specialSchedule){const studentId=Number(item.studentId)||null,student=(state?.students||[]).find(s=>Number(s.id)===studentId),group=item.group||student?.group||"";return group&&studentId?[{group,mode:"selected",studentIds:[studentId]}]:[];}
  if(!isReadyExternalScheduleItem(item)){
    const byGroup=new Map();
    scheduleDisciplineIds(item).forEach(id=>{const d=(state?.disciplines||[]).find(x=>Number(x.id)===Number(id));if(!d||d.status==="archived"||!d.group)return;byGroup.set(normIdentity(d.group),disciplineAudiencePartition(d,state));});
    scheduleAudienceGroups(item).forEach(group=>{const key=normIdentity(group);if(!byGroup.has(key))byGroup.set(key,{group,mode:"group",studentIds:[]});});
    if(byGroup.size)return [...byGroup.values()].filter(Boolean);
  }
  const explicit=Array.isArray(item.audiencePartitions)?item.audiencePartitions.map(p=>normalizeAudiencePartition(p,state)).filter(Boolean):[];
  if(explicit.length)return explicit;
  return scheduleAudienceGroups(item).map(group=>({group,mode:"group",studentIds:[]}));
}
function scheduleSelectedStudentIds(item,state=db){return [...new Set(scheduleAudiencePartitions(item,state).filter(p=>p.mode==="selected").flatMap(p=>p.studentIds||[]).map(Number).filter(Boolean))];}
function scheduleAudienceOverlap(a,b,state=db){
  const A=scheduleAudiencePartitions(a,state),B=scheduleAudiencePartitions(b,state);
  for(const pa of A)for(const pb of B){if(normIdentity(pa.group)!==normIdentity(pb.group))continue;if(pa.mode==="group"||pb.mode==="group")return true;const ids=new Set((pa.studentIds||[]).map(Number));if((pb.studentIds||[]).some(id=>ids.has(Number(id))))return true;}
  const aIds=new Set(scheduleSelectedStudentIds(a,state));return scheduleSelectedStudentIds(b,state).some(id=>aIds.has(Number(id)));
}
function scheduleAudienceConflictLabel(item,state=db){return scheduleAudiencePartitions(item,state).map(p=>p.mode==="group"?p.group:`${p.group} · ${p.studentIds.length} вибр.`).join(" + ")||scheduleAudienceLabel(item)||"";}
function refreshScheduleAudienceMetadata(item,state=db){
  if(!item)return item;const parts=scheduleAudiencePartitions(item,state);
  if(parts.length){item.audiencePartitions=parts.map(p=>({group:p.group,mode:p.mode,studentIds:p.mode==="selected"?[...p.studentIds]:[]}));const ids=[...new Set(parts.filter(p=>p.mode==="selected").flatMap(p=>p.studentIds||[]).map(Number).filter(Boolean))];if(ids.length)item.audienceStudentIds=ids;else delete item.audienceStudentIds;item.audienceMode=parts.some(p=>p.mode==="selected")?"selected":"group";if(parts.some(p=>p.mode==="selected"))item.coverage=parts.every(p=>p.mode==="selected")?"Вибрані студенти":"Змішаний потік";}
  return item;
}
function scheduleAudienceStudentNames(item,state=db){const ids=scheduleSelectedStudentIds(item,state),map=new Map((state?.students||[]).map(s=>[Number(s.id),s.name]));return ids.map(id=>map.get(Number(id))).filter(Boolean);}
function groupSlotAudienceCoverage(group,events=[],state=db){
  const all=new Set(activeStudentIdsForGroup(group,state)),occupied=new Set();let full=false;
  (events||[]).forEach(ev=>{const item=ev?.data||ev;scheduleAudiencePartitions(item,state).filter(p=>normIdentity(p.group)===normIdentity(group)).forEach(p=>{if(p.mode==="group")full=true;else(p.studentIds||[]).forEach(id=>occupied.add(Number(id)));});});
  if(full)return {full:true,occupied:all.size,free:0,total:all.size,occupiedIds:[...all]};
  return {full:false,occupied:occupied.size,free:Math.max(0,all.size-occupied.size),total:all.size,occupiedIds:[...occupied]};
}

function programById(id){return (db.programs||[]).find(p=>String(p.id)===String(id))||null;}
function departmentById(id){return (db.departments||[]).find(d=>String(d.id)===String(id))||null;}
let currentProgramScopeId="";
function activeProgramId(){
  if(currentProgramScopeId&&programById(currentProgramScopeId))return currentProgramScopeId;
  try{
    const saved=sessionStorage.getItem(UI_PROGRAM_SCOPE_KEY);
    if(saved&&programById(saved)){currentProgramScopeId=saved;return saved;}
  }catch(e){}
  currentProgramScopeId=programById("rems")?"rems":String(db.programs?.[0]?.id||"");
  return currentProgramScopeId;
}
function activeProgram(){return programById(activeProgramId())||programById("rems")||db.programs?.[0]||null;}
function programUsesRooms(programId=activeProgramId()){const p=programById(programId);return p?.usesRooms!==false&&p?.deliveryMode!=="online";}
function programIsFacultyWide(programId=activeProgramId()){const p=programById(programId);return p?.scope==="faculty"||!p?.departmentId;}
function activeDepartment(){return departmentById(activeProgram()?.departmentId)||null;}
function groupProgramId(g){return g?.programId||"rems";}
function groupVisible(g){return !!g&&groupProgramId(g)===activeProgramId()&&g.status!=="archived";}
function visibleGroups(){return (db.groups||[]).filter(groupVisible);}
function visibleGroupCodes(){return new Set(visibleGroups().map(g=>normIdentity(g.code)));}
function visibleStudents(){const codes=visibleGroupCodes();return (db.students||[]).filter(s=>s.status!=="archived"&&codes.has(normIdentity(s.group)));}
function teacherProgramIds(t){return uniqueStrings((Array.isArray(t?.programIds)&&t.programIds.length?t.programIds:["rems"]));}
function teacherVisibleInProgram(t){return !!t&&t.status!=="archived"&&teacherProgramIds(t).includes(activeProgramId());}
function roomProgramIds(r){return uniqueStrings((Array.isArray(r?.programIds)&&r.programIds.length?r.programIds:["rems"]));}
function roomVisibleInProgram(r){return !!r&&r.status!=="archived"&&roomProgramIds(r).includes(activeProgramId());}
function disciplineProgramId(d){return d?.programId||db.groups.find(g=>normIdentity(g.code)===normIdentity(d?.group))?.programId||"rems";}
function disciplineVisibleInProgram(d){return !!d&&d.status!=="archived"&&disciplineProgramId(d)===activeProgramId();}
function curriculumProgramId(c){
  if(c?.programId)return c.programId;
  const byGroup=(c?.applicableGroups||[]).map(code=>db.groups.find(g=>normIdentity(g.code)===normIdentity(code))?.programId).find(Boolean);
  if(byGroup)return byGroup;
  return (db.programs||[]).find(p=>normIdentity(p.name)===normIdentity(c?.program))?.id||"rems";
}
function curriculumVisibleInProgram(c){return curriculumProgramId(c)===activeProgramId();}
function scheduleVisibleInProgram(item){return scheduleAudienceGroups(item).some(code=>visibleGroupCodes().has(normIdentity(code)));}
function programOptionsHtml(selected=activeProgramId()){return (db.programs||[]).map(p=>`<option value="${esc(p.id)}" ${String(p.id)===String(selected)?"selected":""}>${esc(p.name)}</option>`).join("");}
function programMultiOptionsHtml(selected=[]){const ids=new Set((selected||[]).map(String));return (db.programs||[]).map(p=>`<option value="${esc(p.id)}" ${ids.has(String(p.id))?"selected":""}>${esc(p.name)}</option>`).join("");}
function roomProgramOptionsHtml(selected=[]){const ids=new Set((selected||[]).map(String));return (db.programs||[]).filter(p=>programUsesRooms(p.id)).map(p=>`<option value="${esc(p.id)}" ${ids.has(String(p.id))?"selected":""}>${esc(p.name)}</option>`).join("");}
function departmentOptionsHtml(selected=""){return (db.departments||[]).map(d=>`<option value="${esc(d.id)}" ${String(d.id)===String(selected)?"selected":""}>${esc(d.name)}</option>`).join("");}
function renderProgramScopeUI(){
  const sel=$("#programScope"),p=activeProgram(),d=activeDepartment(),facultyWide=programIsFacultyWide();
  if(sel){sel.innerHTML=programOptionsHtml(p?.id);sel.value=p?.id||"rems";sel.onchange=()=>setProgramScope(sel.value);}
  const kind=$("#sidebarScopeKind");if(kind)kind.textContent=facultyWide?"ПРОГРАМА":"КАФЕДРА";
  const dep=$("#sidebarDepartmentLabel");if(dep)dep.textContent=facultyWide?"міжкафедральна · онлайн":(d?.name||"Кафедра").replace(/^Кафедра\s+/i,"");
  const roomNav=document.querySelector('.nav-btn[data-page="roomGrid"]');if(roomNav)roomNav.style.display=programUsesRooms()?"":"none";
  const specialNav=document.querySelector('.nav-btn[data-page="specialSchedule"] span');if(specialNav)specialNav.textContent=activeProgramId()==="master"?"Магістерські роботи":"Індивідуальні / бакалаврські";
  const fac=$("#programScopeFaculty");if(fac)fac.textContent=db.faculty?.name||"Факультет театру, кіно та естради";
  const kicker=$("#topbarKicker");if(kicker)kicker.textContent=`${p?.shortName||""} · РОБОЧИЙ ПУЛЬТ`;
}
function setProgramScope(id){
  if(!programById(id))return;
  currentProgramScopeId=String(id);
  try{sessionStorage.setItem(UI_PROGRAM_SCOPE_KEY,id);sessionStorage.removeItem(UI_TIMETABLE_GROUP_KEY);sessionStorage.removeItem(UI_WORKLOAD_GROUP_KEY);sessionStorage.removeItem(UI_LOAD_PAGE_GROUP_KEY);}catch(e){}
  loadPageState.group="";
  if(typeof timetableState!=="undefined")timetableState.group="";
  if(typeof dayPlannerState!=="undefined"){dayPlannerState.group="";dayPlannerState.course=null;}
  if(typeof specialScheduleState!=="undefined"){specialScheduleState.kind=String(id)==="master"?"consult_master":"individual";specialScheduleState.group="";specialScheduleState.disciplineId=null;}
  renderProgramScopeUI();
  if(!programUsesRooms()&&["roomGrid","rooms"].includes(currentPage)){go("home");return;}
  renderCurrent();
}
function teacherHomeDepartmentId(t){return t?.homeDepartmentId||(t?.scope==="external"?"":"rems-dept");}
function departmentTeachers(){return db.teachers.filter(t=>teacherVisibleInProgram(t)&&t.scope!=="external"&&(programIsFacultyWide()||teacherHomeDepartmentId(t)===activeDepartment()?.id));}
function externalTeachers(){return db.teachers.filter(t=>teacherVisibleInProgram(t)&&(t.scope==="external"||(!programIsFacultyWide()&&teacherHomeDepartmentId(t)!==activeDepartment()?.id)));}
function visibleTeachers(){return db.teachers.filter(teacherVisibleInProgram);}
function totalDisciplineHours(d){return Object.values(d.hours||{}).reduce((a,b)=>a+num(b),0);}
function teacherNames(ids=[]){return ids.map(id=>teacherDisplay(teacherById(id))).filter(Boolean).join(", ");}
function kpiIcon(label){return ({"Груп":"◉","Студентів":"✦","Викладачів кафедри":"♟","Дисциплін кафедри":"◇"})[label]||"•";}
function kpi(label,value){return `<div class="card kpi studio-kpi"><div class="kpi-icon">${kpiIcon(label)}</div><div class="kpi-copy"><div class="label">${label}</div><div class="value">${value}</div></div><span class="kpi-line"></span></div>`;}
function groupOptions(selected=""){return visibleGroups().slice().sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`<option value="${esc(g.code)}" ${g.code===selected?"selected":""}>${esc(g.code)} · ${esc(courseDisplayLabel(g.course))}</option>`).join("");}
function sortedGroups(){
  return visibleGroups().slice().sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code,"uk"));
}
function groupSwitchButtonHtml(g,selected,onclick,badge=""){
  const active=normIdentity(g.code)===normIdentity(selected);
  const safe=String(g.code).replaceAll("\\","\\\\").replaceAll("'","\\'");
  return `<button type="button"
    class="group-switch-btn course-${esc(g.course)} ${active?"active":""}"
    onclick="${onclick}('${safe}')">
      <span class="group-switch-meta">${esc(courseDisplayCaps(g.course))}</span>
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
  home:["Головна","Робочий пульт спеціальності"],
  faculty:["Структура факультету","Кафедри, спеціальності, групи та аудиторії"],
  schedule:["Складання розкладу","Розподілені години → дати, пари та аудиторії"],
  specialSchedule:["Індивідуальні / кваліфікаційні роботи","Персональне навантаження студентів і керівників"],
  timetable:["Розклад","Готовий календар занять конкретної групи"],
  dayPlanner:["Розклад по днях","Курс → група → день тижня → усі дати та вільні пари"],
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
  renderProgramScopeUI();
  rememberPage(p);
  try{
    const wanted="#"+p;
    if(location.hash!==wanted)history.replaceState(null,"",location.pathname+location.search+wanted);
  }catch(e){}
  const sidebarPage=({students:"groups",rooms:"roomGrid",lessonTypes:"settings",users:"settings",bellSchedule:"settings"})[p]||p;
  $$(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===sidebarPage));
  $$(".page").forEach(x=>x.classList.remove("active"));
  $("#page-"+p).classList.add("active");
  const pageMeta=p==="specialSchedule"
    ?(activeProgramId()==="master"?["Магістерські роботи","Керівництво магістерськими роботами та персональний графік"]:["Індивідуальні / бакалаврські роботи","Індивідуальні заняття та керівництво бакалаврськими роботами 4 курсу"])
    :meta[p];
  $("#pageTitle").textContent=pageMeta[0];
  $("#pageSubtitle").textContent=pageMeta[1];
  renderCurrent();
}
function renderCurrent(){
  ({home:renderHome,faculty:renderFaculty,schedule:renderSchedule,specialSchedule:renderSpecialSchedule,timetable:renderTimetable,dayPlanner:renderDayPlanner,mySchedule:renderMySchedule,groups:renderGroups,students:renderStudents,rooms:renderRooms,roomGrid:renderRoomGrid,teachers:renderTeachers,curricula:renderCurricula,disciplines:renderDisciplines,lessonTypes:renderLessonTypes,users:renderUsers,bellSchedule:renderBellSchedule,settings:renderSettings}[currentPage])();
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
  const todays=db.schedule.filter(x=>x.date===today&&scheduleVisibleInProgram(x)).sort((a,b)=>a.start.localeCompare(b.start));
  const dateObj=new Date(today+"T12:00:00");
  const dateDay=dateObj.toLocaleDateString("uk-UA",{day:"2-digit"});
  const dateMonth=dateObj.toLocaleDateString("uk-UA",{month:"long"});
  const activeDisciplines=db.disciplines.filter(d=>disciplineVisibleInProgram(d)).length;
  const groups=sortedGroups();
  const program=activeProgram(),department=activeDepartment(),facultyWide=programIsFacultyWide();
  const programContext=facultyWide?(program?.deliveryMode==="online"?"Міжкафедральна програма · онлайн":"Міжкафедральна програма"):(department?.name||"");

  $("#page-home").innerHTML=`
    <div class="home-stage">
      <div class="home-stage-copy">
        <span class="home-stage-kicker">НАВЧАЛЬНИЙ СЕЗОН</span>
        <h2>${esc(db.academicYear)}</h2>
        <p>${db.semester} семестр · ${esc(program?.name||"")}${programContext?` · ${esc(programContext)}`:""}</p>
        <div class="home-stage-actions"><button class="primary" onclick="go('schedule')">Складати розклад →</button><button class="secondary" onclick="go('timetable',{focusCurrentCalendar:true})">Дивитися календар</button></div>
      </div>
      <div class="home-stage-date"><span>СЬОГОДНІ</span><b>${esc(dateDay)}</b><strong>${esc(dateMonth)}</strong><small>${todays.length} занять у базі на сьогодні</small></div>
      <div class="home-stage-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>

    <div class="grid-kpi">
      ${kpi("Груп",groups.length)}
      ${kpi("Студентів",visibleStudents().length)}
      ${kpi(facultyWide?"Викладачів програми":"Викладачів кафедри",departmentTeachers().length+ (facultyWide?externalTeachers().length:0))}
      ${kpi(facultyWide?"Дисциплін програми":"Дисциплін кафедри",activeDisciplines)}
    </div>

    <div class="card section home-groups-section">
      <div class="section-head"><div><span class="section-kicker">СТРУКТУРА</span><h2>Навчальні групи</h2><div class="small">Кожен курс має свій візуальний акцент — так легше орієнтуватися в системі.</div></div><button class="secondary" onclick="go('groups')">Групи і студенти →</button></div>
      <div class="group-grid">${groups.map(g=>`<div class="group-card course-${g.course}"><span class="group-card-course">${esc(courseDisplayCaps(g.course))}</span><b>${esc(g.code)}</b><p><strong>${groupStudentCount(g.code)}</strong> студентів</p><span class="group-card-glow"></span></div>`).join("")}</div>
    </div>

    <div class="card section home-today-section">
      <div class="section-head"><div><span class="section-kicker">СЬОГОДНІ</span><h2>Сьогодні</h2><div class="small">Оперативний зріз розкладу на поточну дату.</div></div><button class="secondary" onclick="go('timetable',{focusCurrentCalendar:true})">Відкрити розклад →</button></div>
      ${todays.length?miniSchedule(todays):`<div class="empty studio-empty"><b>Сьогодні тихо</b><span>На поточну дату занять ще немає.</span></div>`}
    </div>`;
}
function renderFaculty(){
  const departments=(db.departments||[]);
  const facultyPrograms=(db.programs||[]).filter(p=>programIsFacultyWide(p.id));
  $("#page-faculty").innerHTML=`<div class="faculty-structure-page">
    <div class="faculty-hero card section"><span>ФАКУЛЬТЕТ</span><h2>${esc(db.faculty?.name||"Факультет театру, кіно та естради")}</h2><p>Одна база для спільних конфліктів, але кожна спеціальність відкривається окремим робочим простором без зайвої інформації.</p></div>
    <div class="faculty-department-grid">${departments.map(dep=>{
      const programs=(db.programs||[]).filter(p=>p.departmentId===dep.id);
      const rooms=(db.rooms||[]).filter(r=>r.status!=="archived"&&r.ownerDepartmentId===dep.id);
      return `<article class="faculty-department-card card section"><div class="faculty-department-head"><div><span>КАФЕДРА</span><h3>${esc(dep.name)}</h3></div><b>${programs.length} спец.</b></div><div class="faculty-program-list">${programs.map(program=>{const groups=(db.groups||[]).filter(g=>g.status!=="archived"&&g.programId===program.id).sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code,"uk"));return `<button type="button" class="faculty-program-row ${program.id===activeProgramId()?"active":""}" onclick="setProgramScope('${esc(program.id)}');go('home')"><div><span>${esc(program.shortName||"")}</span><b>${esc(program.name)}</b><small>${groups.map(g=>g.code).join(" · ")||"групи ще не додані"}</small></div><strong>${groups.length}</strong></button>`;}).join("")}</div><div class="faculty-room-block"><span>АУДИТОРІЇ КАФЕДРИ</span><p>${rooms.map(r=>esc(r.name)).join(" · ")||"ще не додані"}</p></div></article>`;
    }).join("")}</div>
    ${facultyPrograms.length?`<div class="faculty-department-card card section faculty-wide-program-card"><div class="faculty-department-head"><div><span>МІЖКАФЕДРАЛЬНА ПРОГРАМА</span><h3>Магістратура</h3></div><b>ОНЛАЙН</b></div><div class="faculty-program-list">${facultyPrograms.map(program=>{const groups=(db.groups||[]).filter(g=>g.status!=="archived"&&g.programId===program.id).sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code,"uk"));return `<button type="button" class="faculty-program-row ${program.id===activeProgramId()?"active":""}" onclick="setProgramScope('${esc(program.id)}');go('home')"><div><span>${esc(program.shortName||"")}</span><b>${esc(program.name)}</b><small>${groups.map(g=>`${g.code} · ${courseDisplayLabel(g.course)}`).join(" · ")||"групи ще не додані"}</small></div><strong>${groups.length}</strong></button>`;}).join("")}</div><div class="faculty-room-block"><span>ФОРМАТ НАВЧАННЯ</span><p>Онлайн · аудиторії не використовуються</p></div></div>`:""}
    <div class="notice">Спільний викладач зберігається в базі один раз і може бути прив’язаний до кількох програм. Для магістратури перевіряються перетини викладачів і груп, але не аудиторій.</div>
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
        ${sortedGroups().map(g=>`<tr><td>${g.course}</td><td><b>${esc(g.code)}</b></td><td>${groupStudentCount(g.code)}</td><td class="actions"><button onclick="showGroupStudents('${esc(g.code)}')">Студенти</button><button onclick="editGroup(${g.id})">Редагувати</button><button onclick="deleteGroup(${g.id})">Видалити</button></td></tr>`).join("")}
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
  openModal(`<h2>Нова група</h2><form id="f" class="form-grid"><label>Курс<select id="gc">${[1,2,3,4,5,6].map(x=>`<option value="${x}">${esc(courseDisplayLabel(x))}</option>`).join("")}</select></label><label>Шифр<input id="gn" required></label><label class="wide">Спеціальність<select id="gp">${programOptionsHtml(activeProgramId())}</select></label><div class="wide"><button class="primary">Додати</button></div></form>`);
  $("#f").onsubmit=e=>{e.preventDefault();const c=$("#gn").value.trim();if(!c)return;if(db.groups.some(g=>g.code.toLowerCase()===c.toLowerCase()))return alert("Така група вже є.");const programId=$("#gp").value,program=programById(programId);db.groups.push({id:uid(db.groups),course:+$("#gc").value,code:c,programId,departmentId:program?.departmentId||activeDepartment()?.id||""});closeModal();save();};
}
function editGroup(id){
  const g=db.groups.find(x=>x.id===id);
  openModal(`<h2>Редагувати групу</h2><form id="f" class="form-grid"><label>Курс<select id="gc">${[1,2,3,4,5,6].map(x=>`<option value="${x}" ${x===g.course?"selected":""}>${esc(courseDisplayLabel(x))}</option>`).join("")}</select></label><label>Шифр<input id="gn" value="${esc(g.code)}" required></label><label class="wide">Спеціальність<select id="gp">${programOptionsHtml(g.programId||"rems")}</select></label><div class="wide entity-form-actions"><button class="primary">Зберегти</button><button type="button" class="danger entity-delete-btn" onclick="deleteGroup(${g.id})">Видалити групу</button></div></form>`);
  $("#f").onsubmit=e=>{e.preventDefault();const old=g.code,neu=$("#gn").value.trim(),programId=$("#gp").value,program=programById(programId);g.course=+$("#gc").value;g.code=neu;g.programId=programId;g.departmentId=program?.departmentId||g.departmentId;db.students.forEach(s=>{if(s.group===old)s.group=neu});db.schedule.forEach(s=>{
    if(s.group===old)s.group=neu;
    if(Array.isArray(s.audienceGroups))s.audienceGroups=s.audienceGroups.map(g=>g===old?neu:g);
  });db.disciplines.forEach(d=>{if(d.group===old)d.group=neu});closeModal();save();};
}
function deleteGroup(id){
  const g=db.groups.find(x=>Number(x.id)===Number(id));if(!g)return;
  const students=db.students.filter(s=>normIdentity(s.group)===normIdentity(g.code));
  const disciplines=db.disciplines.filter(d=>normIdentity(d.group)===normIdentity(g.code));
  const disciplineIds=new Set(disciplines.map(d=>Number(d.id)));
  const lessons=db.schedule.filter(s=>scheduleIncludesGroup(s,g.code)||disciplineIds.has(Number(s.disciplineId)));
  const bookings=db.roomBookings.filter(b=>normIdentity(b.group)===normIdentity(g.code));
  const lines=[];
  if(students.length)lines.push(`Разом буде видалено: ${deleteCountLabel(students.length,"студента","студенти","студентів")}.`);
  if(disciplines.length)lines.push(`${deleteCountLabel(disciplines.length,"дисципліну","дисципліни","дисциплін")} кафедрального навантаження.`);
  if(lessons.length)lines.push(`${deleteCountLabel(lessons.length,"пару/запис","пари/записи","пар/записів")} розкладу.`);
  if(bookings.length)lines.push(`${deleteCountLabel(bookings.length,"бронювання","бронювання","бронювань")} аудиторій.`);
  if(!confirmCascadeDelete(`Видалити групу ${g.code}?`,lines))return;

  const studentIds=new Set(students.map(s=>Number(s.id)));
  db.groups=db.groups.filter(x=>Number(x.id)!==Number(id));
  db.students=db.students.filter(s=>!studentIds.has(Number(s.id)));
  db.disciplines=db.disciplines.filter(d=>!disciplineIds.has(Number(d.id)));
  db.schedule=db.schedule.filter(s=>!scheduleIncludesGroup(s,g.code)&&!disciplineIds.has(Number(s.disciplineId))&&!studentIds.has(Number(s.studentId)));
  db.roomBookings=db.roomBookings.filter(b=>normIdentity(b.group)!==normIdentity(g.code));
  (db.curricula||[]).forEach(c=>c.applicableGroups=(c.applicableGroups||[]).filter(code=>normIdentity(code)!==normIdentity(g.code)));
  closeModal();save();
}


function deleteCountLabel(n,one,few,many){
  n=Number(n)||0;
  const n10=n%10,n100=n%100;
  const word=n10===1&&n100!==11?one:(n10>=2&&n10<=4&&(n100<12||n100>14)?few:many);
  return `${n} ${word}`;
}
function confirmCascadeDelete(title,lines=[]){
  const meaningful=(lines||[]).filter(Boolean);
  const text=[title,meaningful.length?"":"",...meaningful,"","Цю дію не можна скасувати. Продовжити?"].join("\n");
  return confirm(text);
}

/* Students */
function renderStudents(){go("groups");}
function renderStudentTable(){
  const q=($("#studentSearch")?.value||"").toLowerCase(),gf=$("#studentGroupFilter")?.value||"";
  const codes=visibleGroupCodes();
  const rows=db.students.filter(s=>s.status!=="archived"&&codes.has(normIdentity(s.group))&&(!q||s.name.toLowerCase().includes(q))&&(!gf||s.group===gf)).sort((a,b)=>a.group.localeCompare(b.group)||a.name.localeCompare(b.name));
  $("#studentTable").innerHTML=`<div class="table-wrap"><table><thead><tr><th>ПІБ</th><th>Група</th><th>Курс</th><th></th></tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.group)}</td><td>${groupCourse(s.group)}</td><td class="actions"><button onclick="editStudent(${s.id})">Редагувати</button><button onclick="deleteStudent(${s.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div><div class="small" style="margin-top:10px">Показано: ${rows.length}</div>`;
}
function canEditStudentCatalog(){
  const role=window.REMS_CLOUD?.role?.();
  if(window.REMS_CLOUD?.configured&&role&&role!=="admin"){
    alert("Додавати, редагувати й видаляти студентів може лише адміністратор. Поточна роль: "+({dispatcher:"Диспетчер",teacher:"Викладач",viewer:"Перегляд"}[role]||role)+".");
    return false;
  }
  return true;
}
function addStudent(){
  if(!canEditStudentCatalog())return;
  openModal(`<h2>Новий студент</h2><form id="f" class="form-grid"><label class="wide">ПІБ<input id="sn" required></label><label>Група<select id="sg">${groupOptions()}</select></label><div class="wide"><button class="primary">Додати</button></div></form>`);
  $("#f").onsubmit=e=>{
    e.preventDefault();
    const name=$("#sn").value.trim(),group=$("#sg").value;
    if(!name||!group)return;
    // If the same student had been deleted earlier, reactivate that record
    // instead of creating a second Firestore document with the same person.
    const archived=(db.students||[]).find(x=>x.status==="archived"&&studentSeedKey(x)===studentSeedKey({name,group}));
    if(archived){
      archived.name=name;archived.group=group;archived.status="active";delete archived.deletedAt;delete archived.deletedBy;
    }else{
      db.students.push({id:uid(db.students),name,group,status:"active",note:""});
    }
    closeModal();save();
  };
}
function editStudent(id){
  if(!canEditStudentCatalog())return;
  const s=db.students.find(x=>Number(x.id)===Number(id));if(!s)return alert("Студента не знайдено в поточній базі.");
  openModal(`<h2>Редагувати студента</h2><form id="f" class="form-grid"><label class="wide">ПІБ<input id="sn" value="${esc(s.name)}" required></label><label>Група<select id="sg">${groupOptions(s.group)}</select></label><div class="wide entity-form-actions"><button class="primary">Зберегти</button><button type="button" class="danger entity-delete-btn" onclick="deleteStudent(${Number(s.id)})">Видалити студента</button></div></form>`);
  $("#f").onsubmit=e=>{e.preventDefault();s.name=$("#sn").value.trim();s.group=$("#sg").value;closeModal();save();};
}
function deleteStudent(id){
  if(!canEditStudentCatalog())return;
  const s=db.students.find(x=>Number(x.id)===Number(id));if(!s)return alert("Студента не знайдено в поточній базі.");
  const special=db.schedule.filter(x=>Number(x.studentId)===Number(id));
  const lines=special.length?[`Разом буде видалено ${deleteCountLabel(special.length,"персональний запис","персональні записи","персональних записів")} (індивідуальні/консультації).`]:[];
  if(!confirmCascadeDelete(`Видалити студента ${s.name}?`,lines))return;

  // IMPORTANT: do not physically remove the student document. Some students
  // came from the bundled seed list, so a later migration could recreate a
  // missing document. An archived record is invisible in all working lists
  // and counts, but acts as a durable tombstone in Firebase.
  s.status="archived";
  s.deletedAt=new Date().toISOString();
  s.deletedBy=window.REMS_CLOUD?.email?.()||"";

  db.schedule=db.schedule.filter(x=>Number(x.studentId)!==Number(id));
  db.disciplines.forEach(d=>{
    if(Array.isArray(d.selectedStudentIds))d.selectedStudentIds=d.selectedStudentIds.filter(sid=>Number(sid)!==Number(id));
    Object.entries(d.teacherStudentLoads||{}).forEach(([tid,byType])=>{
      Object.keys(byType||{}).forEach(typeId=>{
        byType[typeId]=(byType[typeId]||[]).filter(sid=>Number(sid)!==Number(id));
        const lt=lessonTypeById(typeId);
        if(lt&&isPerStudentTypeId(typeId)&&!isSplitIndividualType(lt)){
          d.teacherLoads=d.teacherLoads||{};d.teacherLoads[String(tid)]=d.teacherLoads[String(tid)]||{};
          d.teacherLoads[String(tid)][String(typeId)]=byType[typeId].length*perStudentUnitHours(d,typeId);
        }
      });
    });
    Object.entries(d.teacherStudentHours||{}).forEach(([tid,byType])=>{
      Object.entries(byType||{}).forEach(([typeId,byStudent])=>{
        if(byStudent&&Object.prototype.hasOwnProperty.call(byStudent,String(id)))delete byStudent[String(id)];
        const lt=lessonTypeById(typeId);
        if(lt&&isSplitIndividualType(lt)){
          d.teacherLoads=d.teacherLoads||{};d.teacherLoads[String(tid)]=d.teacherLoads[String(tid)]||{};
          d.teacherLoads[String(tid)][String(typeId)]=Object.values(byStudent||{}).reduce((a,h)=>a+num(h),0);
          d.teacherStudentLoads=d.teacherStudentLoads||{};d.teacherStudentLoads[String(tid)]=d.teacherStudentLoads[String(tid)]||{};
          d.teacherStudentLoads[String(tid)][String(typeId)]=Object.entries(byStudent||{}).filter(([,h])=>num(h)>0).map(([sid])=>Number(sid)).filter(Boolean);
        }
      });
    });
  });
  db.schedule.forEach(x=>refreshScheduleAudienceMetadata(x));
  closeModal();save();
}

/* Rooms */
function roomAreaTabs(active="grid"){
  return `<div class="subtabs"><button class="${active==="grid"?"active":""}" onclick="go('roomGrid',{focusCurrentCalendar:false})">Сітка зайнятості</button><button class="${active==="directory"?"active":""}" onclick="go('rooms')">Довідник аудиторій</button></div>`;
}
function activeRooms(){return programUsesRooms()?db.rooms.filter(roomVisibleInProgram):[];}
function adHocRoomNames(){
  const directoryKeys=new Set((db.rooms||[]).map(r=>normIdentity(r.name)).filter(Boolean));
  return uniqueStrings([
    ...(db.adHocRooms||[]),
    ...(db.schedule||[]).map(x=>x.room||""),
    ...(db.roomBookings||[]).map(x=>x.room||"")
  ]).filter(name=>!directoryKeys.has(normIdentity(name)));
}
function scheduleRoomNames(selected=""){
  return uniqueStrings([...activeRooms().map(r=>r.name),...adHocRoomNames(),selected||""])
    .sort((a,b)=>a.localeCompare(b,"uk",{numeric:true}));
}
function rememberAdHocRoom(name){
  const raw=String(name||"").trim();
  if(!raw||raw==="__other__")return "";
  const inDirectory=(db.rooms||[]).some(r=>normIdentity(r.name)===normIdentity(raw));
  if(!inDirectory)db.adHocRooms=uniqueStrings([...(db.adHocRooms||[]),raw]);
  return raw;
}
function scheduleRoomOptionsHtml(selected="",options={}){
  const emptyLabel=options.emptyLabel===undefined?"— обери аудиторію —":options.emptyLabel;
  const allowEmpty=options.allowEmpty!==false;
  const names=scheduleRoomNames(selected);
  return `${allowEmpty?`<option value="">${esc(emptyLabel)}</option>`:""}${names.map(name=>`<option value="${esc(name)}" ${normIdentity(name)===normIdentity(selected)?"selected":""}>${esc(name)}</option>`).join("")}<option value="__other__">+ Інша аудиторія…</option>`;
}
function resolveAdHocRoomSelect(select){
  if(!select||select.value!=="__other__")return select?.value||"";
  const previous=select.dataset.previousRoom||"";
  const raw=prompt("Введи номер або назву аудиторії:","");
  const name=String(raw||"").trim();
  if(!name){select.value=previous;return previous;}
  rememberAdHocRoom(name);
  let option=[...select.options].find(o=>normIdentity(o.value)===normIdentity(name));
  if(!option){option=document.createElement("option");option.value=name;option.textContent=name;const other=[...select.options].find(o=>o.value==="__other__");select.insertBefore(option,other||null);}
  select.value=option.value;
  select.dataset.previousRoom=option.value;
  return option.value;
}
function initAdHocRoomSelect(select,onResolved=null){
  if(!select)return;
  if(select.value&&select.value!=="__other__")select.dataset.previousRoom=select.value;
  select.addEventListener("change",()=>{
    if(select.value==="__other__")resolveAdHocRoomSelect(select);
    else select.dataset.previousRoom=select.value||"";
    if(onResolved)onResolved(select.value||"");
  });
}
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
  const r=id?db.rooms.find(x=>Number(x.id)===Number(id)):{name:"",status:"active",note:"",showInGrid:true,gridOrder:gridRooms().length+1,ownerDepartmentId:activeDepartment()?.id||"",programIds:[activeProgramId()]};
  const currentPos=id?roomGridPosition(id):(gridRooms().length+1);
  openModal(`<h2>${id?"Редагувати":"Нова"} аудиторія</h2><form id="roomForm" class="form-grid">
    <label>Номер / назва<input id="roomName" value="${esc(r.name||"")}" required></label>
    <label>Позиція в сітці<input id="roomGridOrder" type="number" min="1" max="${Math.max(1,gridRooms().length+(id?0:1))}" value="${esc(currentPos||gridRooms().length+1)}"></label>
    <label class="wide">Належить кафедрі<select id="roomOwner">${departmentOptionsHtml(r.ownerDepartmentId||activeDepartment()?.id||"")}</select></label>
    <label class="wide">Доступна для спеціальностей<select id="roomPrograms" multiple size="3">${roomProgramOptionsHtml(r.programIds||[activeProgramId()])}</select></label>
    <label class="wide check-label"><span>Сітка спеціальності</span><span class="check-inline"><input id="roomGridFlag" type="checkbox" ${r.showInGrid!==false?"checked":""}> Показувати у сітці зайнятості</span></label>
    <label class="wide">Примітка<textarea id="roomNote" rows="3">${esc(r.note||"")}</textarea></label>
    <div class="wide entity-form-actions"><button class="primary">Зберегти</button>${id?`<button type="button" class="danger entity-delete-btn" onclick="deleteRoom(${id})">Видалити аудиторію</button>`:""}</div>
  </form>`);
  $("#roomForm").onsubmit=e=>{
    e.preventDefault();
    const name=$("#roomName").value.trim();if(!name)return;
    const duplicate=db.rooms.some(x=>Number(x.id)!==Number(id)&&x.status!=="archived"&&x.name.toLowerCase()===name.toLowerCase());
    if(duplicate)return alert("Така аудиторія вже є.");
    const requestedPos=Number($("#roomGridOrder").value)||gridRooms().length+1;
    const programIds=[...$("#roomPrograms").selectedOptions].map(o=>o.value);if(!programIds.length)return alert("Оберіть хоча б одну спеціальність, де аудиторія має бути видима.");
    const obj={name,note:$("#roomNote").value.trim(),showInGrid:$("#roomGridFlag").checked,status:"active",gridOrder:r.gridOrder??gridRooms().length+1,ownerDepartmentId:$("#roomOwner").value,programIds};
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
  const lessons=db.schedule.filter(x=>x.room===r.name);
  const bookings=db.roomBookings.filter(x=>x.room===r.name);
  const lines=[];
  if(lessons.length)lines.push(`${deleteCountLabel(lessons.length,"заняття","заняття","занять")} залишаться, але поле аудиторії буде очищене.`);
  if(bookings.length)lines.push(`${deleteCountLabel(bookings.length,"бронювання","бронювання","бронювань")} цієї аудиторії буде видалено.`);
  if(!confirmCascadeDelete(`Видалити аудиторію ${r.name}?`,lines))return;
  db.rooms=db.rooms.filter(x=>Number(x.id)!==Number(id));
  db.schedule.forEach(x=>{if(x.room===r.name)x.room="";});
  db.roomBookings=db.roomBookings.filter(x=>x.room!==r.name);
  normalizeRoomGridOrder();closeModal();save();
}

/* Room occupancy grid */
let roomGridState={date:null,month:null};
const ROOM_BOOKING_KINDS=["Репетиція","Майстер-клас","Зустріч","Додаткова пара","Захід","Бронювання","Інше"];
function roomBookingById(id){return db.roomBookings.find(x=>Number(x.id)===Number(id));}
function roomBookingProgramId(b){
  if(b?.programId)return String(b.programId);
  const g=(db.groups||[]).find(x=>normIdentity(x.code)===normIdentity(b?.group));
  return String(g?.programId||"rems");
}
function roomEvents(date,room,pairId){
  const schedule=db.schedule
    .filter(x=>x.date===date&&normIdentity(x.room)===normIdentity(room)&&String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId))
    .map(x=>({source:"schedule",data:x,external:!scheduleVisibleInProgram(x)}));
  const bookings=db.roomBookings
    .filter(x=>x.date===date&&normIdentity(x.room)===normIdentity(room)&&String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId))
    .map(x=>({source:"booking",data:x,external:roomBookingProgramId(x)!==activeProgramId()}));
  return [...schedule,...bookings];
}
function roomBookingLabel(b){return b.title||b.kind||"Бронювання";}
function specialRoomGridKindLabel(x){
  if(x?.specialKind==="consult_bachelor")return "БАКАЛАВРСЬКА РОБОТА";
  if(x?.specialKind==="consult_master")return "МАГІСТЕРСЬКА РОБОТА";
  return "ІНДИВІДУАЛЬНЕ ЗАНЯТТЯ";
}

function roomEventCard(ev){
  const x=ev.data;
  if(ev.external){
    const pid=ev.source==="booking"?roomBookingProgramId(x):(db.groups.find(g=>scheduleAudienceGroups(x).some(code=>normIdentity(code)===normIdentity(g.code)))?.programId||"rems");
    const p=programById(pid);
    const audience=ev.source==="booking"?(x.group||roomBookingLabel(x)):(scheduleAudienceLabel(x)||x.group||"");
    return `<div class="room-event room-event-external"><span class="room-event-badge">ЗАЙНЯТО · ІНША СПЕЦІАЛЬНІСТЬ</span><b>${esc(p?.shortName||p?.name||"Інша спеціальність")}</b>${audience?`<span>${esc(audience)}</span>`:""}<small>Спільний ресурс · редагування у відповідній спеціальності</small></div>`;
  }
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
  if(!programUsesRooms()){
    $("#page-roomGrid").innerHTML=`<div class="card section"><div class="section-head"><div><h2>Магістратура навчається онлайн</h2><div class="small">Для цієї програми аудиторії не використовуються. Під час складання розкладу система перевіряє зайнятість групи, студентів і викладачів.</div></div></div><div class="notice success-notice"><b>Аудиторії вимкнені для магістратури.</b> Фізичні приміщення інших кафедр не засмічують цей робочий простір і не створюють зайвих конфліктів.</div></div>`;
    return;
  }
  roomGridState.date=clampDate(roomGridState.date||currentAcademicDate());roomGridState.month=clampAcademicMonth((roomGridState.month||roomGridState.date.slice(0,7)));if(roomGridState.date.slice(0,7)!==roomGridState.month)roomGridState.date=clampDate(`${roomGridState.month}-01`);
  const rooms=gridRooms(),pairs=bellPairs();
  $("#page-roomGrid").innerHTML=`${roomAreaTabs("grid")}<div class="card section room-grid-shell"><div class="section-head"><div><h2>Зайнятість аудиторій</h2><div class="small">Показані аудиторії обраної спеціальності. У спільних аудиторіях зайнятість інших спеціальностей видно лише як блок конфлікту — без зайвих чужих даних. Репетиції, зустрічі та інші бронювання додаються прямо тут.</div></div><div class="actions"><button class="secondary" onclick="shiftRoomGridDate(-1)">← День</button><button class="secondary" onclick="roomGridToday()">Поточний навчальний день</button><button class="secondary" onclick="shiftRoomGridDate(1)">День →</button><button class="primary" onclick="openRoomBookingModal()">+ Бронювання</button></div></div>
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
  db.schedule.forEach(x=>{if(x.date!==item.date)return;const sameSlot=item.pairId&&x.pairId?String(item.pairId)===String(x.pairId):timeOverlap(item.start,item.end,x.start,x.end);if(!sameSlot)return;if(item.room&&normIdentity(x.room)===normIdentity(item.room))conflicts.push(`Аудиторія ${item.room} вже зайнята заняттям ${x.group||""} ${x.discipline||""}.`);if(item.group&&x.group===item.group)conflicts.push(`Група ${item.group} уже має заняття.`);if(item.teacherId&&Number(x.teacherId)===Number(item.teacherId))conflicts.push(`Викладач ${item.teacher||""} уже має заняття.`);});
  db.roomBookings.forEach(x=>{if(Number(x.id)===Number(ignoreId)||x.date!==item.date)return;const sameSlot=item.pairId&&x.pairId?String(item.pairId)===String(x.pairId):timeOverlap(item.start,item.end,x.start,x.end);if(!sameSlot)return;if(item.room&&normIdentity(x.room)===normIdentity(item.room))conflicts.push(`Аудиторія ${item.room} вже заброньована: ${roomBookingLabel(x)}.`);if(item.group&&x.group===item.group)conflicts.push(`Для групи ${item.group} уже є бронювання.`);if(item.teacherId&&Number(x.teacherId)===Number(item.teacherId))conflicts.push(`У викладача ${item.teacher||""} уже є бронювання.`);});
  return [...new Set(conflicts)];
}
function openRoomBookingModal(id=null,preset={}){
  const b=id?roomBookingById(id):{kind:"Репетиція",title:"",date:clampDate(preset.date||roomGridState.date||localTodayISO()),pairId:preset.pairId||bellPairs()[0]?.id||null,room:preset.room||gridRooms()[0]?.name||activeRooms()[0]?.name||"",group:"",teacherId:null,teacher:"",showInTimetable:false,note:""};
  if(!b)return;
  openModal(`<h2>${id?"Редагувати":"Нове"} бронювання аудиторії</h2><div class="notice">Цей запис блокує аудиторію. Він не впливає на навчальне навантаження викладача.</div><form id="roomBookingForm" class="form-grid"><label>Тип<select id="rbKind">${ROOM_BOOKING_KINDS.map(k=>`<option ${k===b.kind?"selected":""}>${esc(k)}</option>`).join("")}</select></label><label>Назва<input id="rbTitle" value="${esc(b.title||"")}" placeholder="Напр. Репетиція показу"></label><label>Дата<input id="rbDate" type="date" ${dateAttrs()} value="${esc(clampDate(b.date))}" required></label><label>Пара<select id="rbPair">${pairOptions(b.pairId)}</select></label><label>Аудиторія<select id="rbRoom">${scheduleRoomOptionsHtml(b.room,{allowEmpty:false})}</select></label><label>Група (необов’язково)<select id="rbGroup"><option value="">— без групи —</option>${groupOptions(b.group||"")}</select></label><label>Викладач / відповідальний (необов’язково)<select id="rbTeacher"><option value="">—</option>${activeTeacherOptions(b.teacherId)}</select></label><label class="check-label"><span>Основний розклад</span><span class="check-inline"><input id="rbShow" type="checkbox" ${b.showInTimetable?"checked":""}> Показувати в календарі обраної групи</span></label><label class="wide">Примітка<textarea id="rbNote" rows="3">${esc(b.note||"")}</textarea></label><div id="rbConflict" class="wide"></div><div class="wide actions"><button class="primary">${id?"Зберегти":"Забронювати"}</button>${id?`<button type="button" class="danger" onclick="deleteRoomBooking(${b.id})">Видалити бронювання</button>`:""}</div></form>`,true);
  const preview=()=>{const pair=pairById($("#rbPair").value),tid=Number($("#rbTeacher").value)||null,t=teacherById(tid),item={id:b.id,date:$("#rbDate").value,pairId:$("#rbPair").value,start:pair?.start||"",end:pair?.end||"",room:$("#rbRoom").value,group:$("#rbGroup").value,teacherId:tid,teacher:teacherDisplay(t)};const cs=bookingConflicts(item,id);$("#rbConflict").innerHTML=cs.length?`<div class="conflict"><b>Конфлікт:</b><br>${cs.map(esc).join("<br>")}</div>`:`<div class="ok-box">Час вільний.</div>`;};
  initAdHocRoomSelect($("#rbRoom"),preview);["rbDate","rbPair","rbGroup","rbTeacher"].forEach(x=>$("#"+x).onchange=preview);preview();
  $("#roomBookingForm").onsubmit=e=>{e.preventDefault();if(!dateInBounds($("#rbDate").value))return alert(`Дата має бути в межах навчального року: ${academicDateMessage()}.`);const pair=pairById($("#rbPair").value),tid=Number($("#rbTeacher").value)||null,t=teacherById(tid),group=$("#rbGroup").value,programId=db.groups.find(g=>normIdentity(g.code)===normIdentity(group))?.programId||activeProgramId(),obj={kind:$("#rbKind").value,title:$("#rbTitle").value.trim(),date:$("#rbDate").value,pairId:$("#rbPair").value,start:pair?.start||"",end:pair?.end||"",room:rememberAdHocRoom($("#rbRoom").value),group,teacherId:tid,teacher:teacherDisplay(t),programId,showInTimetable:$("#rbShow").checked,note:$("#rbNote").value.trim()};const cs=bookingConflicts(obj,id);if(cs.length)return alert("Не можна зберегти через конфлікт:\n\n"+cs.join("\n"));if(id)Object.assign(b,obj);else db.roomBookings.push({id:uid(db.roomBookings),...obj});roomGridState.date=obj.date;closeModal();save();if(currentPage==="roomGrid")renderRoomGrid();};
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


/* Workload streams live inside discipline allocation.
   Each member discipline stores the same stream definition for teacher+type. */
function teacherStreamMap(d,teacherId){
  return d?.teacherStreams?.[String(teacherId)]||d?.teacherStreams?.[teacherId]||{};
}
function teacherStreamForTypeId(d,teacherId,typeId){
  const s=teacherStreamMap(d,teacherId)?.[String(typeId)]||teacherStreamMap(d,teacherId)?.[typeId]||null;
  return s&&Array.isArray(s.disciplineIds)&&s.disciplineIds.length>1?s:null;
}
function teacherStreamForTypeName(d,teacherId,typeName){
  const lt=lessonTypeByName(typeName);return lt?teacherStreamForTypeId(d,teacherId,lt.id):null;
}
function teacherStreamGroups(stream){
  if(!stream)return[];
  const ids=new Set((stream.disciplineIds||[]).map(Number));
  const groups=db.disciplines.filter(d=>ids.has(Number(d.id))&&d.status!=="archived").map(d=>d.group).filter(Boolean);
  return uniqueStrings([...(stream.groups||[]),...groups]);
}
function teacherStreamLabel(stream){
  const groups=teacherStreamGroups(stream);
  return groups.length>1?`Потік · ${groups.join(" + ")}`:"Окремо";
}
function workloadAudienceForType(d,teacherId,typeName){
  const stream=teacherStreamForTypeName(d,teacherId,typeName);
  if(!stream)return {stream:null,groups:[d.group],disciplineIds:[Number(d.id)]};
  const valid=new Set(db.disciplines.filter(x=>x.status!=="archived").map(x=>Number(x.id)));
  const ids=[...new Set((stream.disciplineIds||[]).map(Number).filter(id=>valid.has(id)))];
  const groups=ids.map(id=>disciplineById(id)?.group).filter(Boolean);
  return {stream,groups:uniqueStrings(groups),disciplineIds:ids};
}
function disciplineStreamBadgesHtml(d){
  const rows=[];
  explicitlyAllocatedTeacherIds(d).forEach(tid=>{
    db.lessonTypes.forEach(lt=>{
      const s=teacherStreamForTypeId(d,tid,lt.id);if(!s)return;
      const key=`${s.streamId||""}|${lt.id}`;
      if(rows.some(x=>x.key===key))return;
      rows.push({key,lt,s});
    });
  });
  if(!rows.length)return"";
  return `<div class="load-stream-badges">${rows.map(x=>`<span><b>${esc(x.lt.name)}</b>${esc(teacherStreamLabel(x.s))}</span>`).join("")}</div>`;
}
function teacherUniqueAllocatedHours(t,{auditoriumOnly=false,typeId=null,allPrograms=false}={}){
  if(!t||t.scope==="external")return 0;
  let total=0;const seen=new Set();
  db.disciplines.filter(d=>d.status!=="archived"&&(allPrograms||disciplineVisibleInProgram(d))).forEach(d=>{
    const load=explicitTeacherLoad(d,t.id);if(!load)return;
    db.lessonTypes.forEach(lt=>{
      if(typeId&&Number(lt.id)!==Number(typeId))return;
      if(auditoriumOnly&&!isAuditoriumPairType(lt))return;
      const hours=num(load[lt.id]);if(hours<=0)return;
      const s=teacherStreamForTypeId(d,t.id,lt.id);
      if(s){
        const key=String(s.streamId||`${t.id}:${lt.id}:${(s.disciplineIds||[]).slice().sort((a,b)=>a-b).join(",")}`);
        if(seen.has(key))return;
        seen.add(key);total+=num(s.hours)||hours;
      }else total+=hours;
    });
  });
  return total;
}

/* Teachers + workload */
function explicitTeacherLoad(d,teacherId){
  return d?.teacherLoads?.[teacherId]||d?.teacherLoads?.[String(teacherId)]||null;
}
function teacherPlannedHours(t){return teacherUniqueAllocatedHours(t);}
function teacherAuditoriumPlannedHours(t){return teacherUniqueAllocatedHours(t,{auditoriumOnly:true});}
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
  const readyRows=rows.filter(isReadyExternalScheduleItem);
  const disciplines=[...new Set(rows.map(x=>x.discipline).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"uk"));
  const groups=[...new Set(rows.flatMap(x=>scheduleAudienceGroups(x)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"uk"));
  const hours=rows.reduce((sum,x)=>sum+readyAcademicHours(x),0);
  return {rows,readyRows,disciplines,groups,pairs:rows.length,hours};
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
      <div><span>Дисципліни</span><b>${esc(s.disciplines.join(" · ")||(t.autoCreatedFromReady?"пари ще не синхронізовані / не знайдені":"ще немає"))}</b></div>
      <div><span>Групи</span><b>${esc(s.groups.join(" · ")||"—")}</b></div>
    </div>

    <div class="external-teacher-actions">
      <button onclick="openTeacherSchedule(${t.id})">Розклад</button>
      <button onclick="${t.scope==="external"?`openExternalTeacherModal(${t.id})`:`openTeacherModal(${t.id})`}">Редагувати</button>
      <button class="quiet-danger" onclick="deleteTeacher(${t.id})">Видалити</button>
    </div>
  </article>`;
}

function renderTeachers(){
  const dep=departmentTeachers().slice().sort((a,b)=>a.name.localeCompare(b.name));
  const ext=externalTeachers().slice().sort((a,b)=>a.name.localeCompare(b.name));
  const facultyWide=programIsFacultyWide();
  $("#page-teachers").innerHTML=`
    <div class="card section">
      <div class="section-head">
        <div><h2>${facultyWide?"Викладачі магістратури":"Викладачі кафедри"}</h2>${facultyWide?`<span class="small">Викладачі можуть бути закріплені за різними кафедрами. У магістратурі показуються тільки ті, кому додана програма «Магістратура».</span>`:""}</div>
        <div class="actions"><button class="primary" onclick="openTeacherModal()">+ Додати викладача</button><button class="secondary" onclick="openExternalTeacherModal()">+ Зовнішній викладач</button></div>
      </div>
      ${dep.length?`<div class="teacher-grid">${dep.map(teacherCard).join("")}</div>`:`<div class="empty">${facultyWide?"Викладачів магістратури ще не додано.":"Викладачів кафедри ще немає."}</div>`}
    </div>
    <div class="card section external-teachers-section">
      <div class="section-head">
        <div>
          <h2>${facultyWide?"Зовнішні викладачі магістратури":"Інші кафедри / загальноосвітні викладачі"}</h2>
          <span class="small">${facultyWide?"Лише викладачі без основної кафедральної картки в системі.":"Тут видно тільки тих викладачів інших кафедр або загальноосвітніх дисциплін, які реально працюють з обраною спеціальністю."}</span>
        </div>
        <button class="secondary" onclick="openExternalTeacherModal()">+ Додати вручну</button>
      </div>
      ${ext.length?`<div class="external-teacher-grid">${ext.map(externalTeacherCard).join("")}</div>`:`<div class="empty">Зовнішніх викладачів ще немає.</div>`}
    </div>`;
}
function positiveTeacherLimit(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>0?n:null;
}
function teacherLimitStateText(value){
  const n=positiveTeacherLimit(value);
  return n?`Ліміт: ${n}`:"Без обмежень";
}
function updateTeacherLimitUi(inputId,statusId){
  const input=$("#"+inputId),status=$("#"+statusId);
  if(!input||!status)return;
  const n=positiveTeacherLimit(input.value);
  status.textContent=n?`Ліміт: ${n}`:"Без обмежень";
  status.classList.toggle("active",!!n);
  status.classList.toggle("unlimited",!n);
}
function clearTeacherLimit(inputId,statusId){
  const input=$("#"+inputId);
  if(input)input.value="";
  updateTeacherLimitUi(inputId,statusId);
}
function teacherAvailabilitySummary(t){
  const unavailable=(t.unavailableRules||[]).length;
  const preferred=(t.preferredRules||[]).length;
  const parts=[];
  if(unavailable)parts.push(`не можна: ${unavailable}`);
  if(preferred)parts.push(`бажано: ${preferred}`);
  const maxPerDay=positiveTeacherLimit(t.maxPerDay);
  const maxConsecutive=positiveTeacherLimit(t.maxConsecutive);
  if(maxPerDay)parts.push(`до ${maxPerDay}/день`);
  if(maxConsecutive)parts.push(`до ${maxConsecutive} підряд`);
  return parts.length?parts.join(" · "):"обмеження не задані";
}
function teacherCard(t){
  const home=departmentById(teacherHomeDepartmentId(t));
  return `<div class="teacher-card teacher-card-compact">
    <div class="teacher-compact-main">
      <div>
        <h3>${esc(t.name)}</h3>
        <div class="teacher-compact-tags">
          <span class="badge ok">${esc(t.employmentType||"—")}</span>
          <span class="rate-chip">${t.rate!==""?esc(t.rate):"—"} ставки</span>
        </div>
        <div class="teacher-availability-summary">${programIsFacultyWide()&&home?`${esc(home.name)} · `:""}${esc(teacherAvailabilitySummary(t))}</div>
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
  const t=id?teacherById(id):{scope:"external",name:"",shortName:"",note:"",programIds:[activeProgramId()],status:"active"};
  openModal(`<h2>${id?"Редагувати":"Новий"} зовнішній викладач</h2><div class="notice">Цей викладач буде доступний у розкладі, але його кафедральне навантаження не рахується.</div><form id="etf" class="form-grid"><label class="wide">ПІБ<input id="etn" value="${esc(t.name)}" required></label><label>Коротке ім’я<input id="ets" value="${esc(t.shortName||"")}"></label><label class="wide">Спеціальності<select id="etprograms" multiple size="3">${programMultiOptionsHtml(teacherProgramIds(t))}</select></label><label class="wide">Примітка<textarea id="etnote" rows="3">${esc(t.note||"")}</textarea></label><div class="wide entity-form-actions"><button class="primary">Зберегти</button>${id?`<button type="button" class="danger entity-delete-btn" onclick="deleteTeacher(${id})">Видалити викладача</button>`:""}</div></form>`);
  $("#etf").onsubmit=e=>{e.preventDefault();const programIds=[...$("#etprograms").selectedOptions].map(o=>o.value);if(!programIds.length)return alert("Оберіть хоча б одну спеціальність.");const obj={scope:"external",homeDepartmentId:"",name:$("#etn").value.trim(),shortName:$("#ets").value.trim(),programIds,note:$("#etnote").value.trim(),status:"active"};if(id)Object.assign(t,obj);else db.teachers.push({id:uid(db.teachers),...obj});closeModal();save();};
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
        <label class="teacher-limit-field"><span>Максимум пар на день</span><input id="availabilityMaxPerDay" type="number" min="1" value="${esc(t.maxPerDay||"")}" placeholder="Напр. 4" oninput="updateTeacherLimitUi('availabilityMaxPerDay','availabilityMaxPerDayStatus')"><div class="teacher-limit-tools"><span id="availabilityMaxPerDayStatus" class="teacher-limit-status ${positiveTeacherLimit(t.maxPerDay)?"active":"unlimited"}">${teacherLimitStateText(t.maxPerDay)}</span><button type="button" class="teacher-limit-clear" onclick="clearTeacherLimit('availabilityMaxPerDay','availabilityMaxPerDayStatus')">Без обмежень</button></div></label>
        <label class="teacher-limit-field"><span>Максимум пар підряд</span><input id="availabilityMaxConsecutive" type="number" min="1" value="${esc(t.maxConsecutive||"")}" placeholder="Напр. 3" oninput="updateTeacherLimitUi('availabilityMaxConsecutive','availabilityMaxConsecutiveStatus')"><div class="teacher-limit-tools"><span id="availabilityMaxConsecutiveStatus" class="teacher-limit-status ${positiveTeacherLimit(t.maxConsecutive)?"active":"unlimited"}">${teacherLimitStateText(t.maxConsecutive)}</span><button type="button" class="teacher-limit-clear" onclick="clearTeacherLimit('availabilityMaxConsecutive','availabilityMaxConsecutiveStatus')">Без обмежень</button></div></label>
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
    t.maxPerDay=positiveTeacherLimit($("#availabilityMaxPerDay").value)||"";
    t.maxConsecutive=positiveTeacherLimit($("#availabilityMaxConsecutive").value)||"";
    closeModal();
    save();
  };
}

function openTeacherModal(id=null){
  const t=id?teacherById(id):{
    scope:"department",name:"",shortName:"",position:"",academicTitle:"",degree:"",honoraryTitle:"",
    employmentType:"Штатний",rate:"1",teachingNormPerRate:"",employmentStart:"",employmentEnd:"",
    phone:"",email:"",unavailableRules:[],preferredRules:[],maxPerDay:"",maxConsecutive:"",note:"",photo:"",homeDepartmentId:activeDepartment()?.id||"",programIds:[activeProgramId()],status:"active"
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
    <label class="wide">Закріплений за кафедрою<select id="thomeDepartment">${departmentOptionsHtml(teacherHomeDepartmentId(t)||activeDepartment()?.id||"")}</select><span class="small">Основна кафедра викладача. На інших спеціальностях він з’явиться тільки якщо вони вибрані нижче.</span></label>
    <label class="wide">Викладає на спеціальностях<select id="tprograms" multiple size="3">${programMultiOptionsHtml(teacherProgramIds(t))}</select><span class="small">Можна обрати одну або кілька програм, включно з магістратурою. Це не дублює викладача — картка залишається одна.</span></label>

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
    <div class="wide entity-form-actions"><button class="primary">${id?"Зберегти":"Додати"}</button>${id?`<button type="button" class="danger entity-delete-btn" onclick="deleteTeacher(${id})">Видалити викладача</button>`:""}</div>
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
      homeDepartmentId:$("#thomeDepartment").value,
      programIds:[...$("#tprograms").selectedOptions].map(o=>o.value),
      unavailableRules:readRules("unavailableRules"),preferredRules:readRules("preferredRules"),
      maxPerDay:positiveTeacherLimit($("#tmax").value)||"",maxConsecutive:positiveTeacherLimit($("#tcon").value)||"",note:$("#tnote").value.trim(),status:"active"
    };
    if(!obj.programIds.length)return alert("Оберіть хоча б одну спеціальність для викладача.");
    if(id)Object.assign(t,obj);else db.teachers.push({id:uid(db.teachers),...obj});
    closeModal();save();
  };
}
function deleteTeacher(id){
  const t=teacherById(id);if(!t)return;
  const lessons=db.schedule.filter(s=>Number(resolvedScheduleTeacherId(s,db))===Number(id));
  const allocations=db.disciplines.filter(d=>
    (d.teacherIds||[]).some(x=>Number(x)===Number(id))
    ||Object.keys(d.teacherLoads||{}).some(k=>Number(k)===Number(id))
  );
  const lines=[];
  if(lessons.length)lines.push(`Разом буде видалено ${deleteCountLabel(lessons.length,"пару/запис","пари/записи","пар/записів")} цього викладача.`);
  if(allocations.length)lines.push(`Викладача буде прибрано з розподілу ${deleteCountLabel(allocations.length,"дисципліни","дисциплін","дисциплін")}.`);
  if(!confirmCascadeDelete(`Видалити викладача ${t.name}?`,lines))return;

  db.teachers=db.teachers.filter(x=>Number(x.id)!==Number(id));
  db.disciplines.forEach(d=>{
    d.teacherIds=(d.teacherIds||[]).filter(x=>Number(x)!==Number(id));
    if(d.teacherLoads){delete d.teacherLoads[id];delete d.teacherLoads[String(id)];}
    if(d.teacherStudentLoads){delete d.teacherStudentLoads[id];delete d.teacherStudentLoads[String(id)];}
    if(d.teacherStudentHours){delete d.teacherStudentHours[id];delete d.teacherStudentHours[String(id)];}
    if(d.teacherStreams){delete d.teacherStreams[id];delete d.teacherStreams[String(id)];}
  });
  db.schedule=db.schedule.filter(s=>Number(resolvedScheduleTeacherId(s,db))!==Number(id));
  closeModal();save();
}
function plannedForDisciplineTeacher(d,teacherId){
  const load=explicitTeacherLoad(d,teacherId);
  return load?Object.values(load).reduce((a,b)=>a+num(b),0):0;
}
function plannedTypeForTeacher(teacherId,typeId){
  const t=teacherById(teacherId);return t?teacherUniqueAllocatedHours(t,{typeId:Number(typeId),allPrograms:true}):0;
}
function scheduledForTeacherType(teacherId,typeName){
  return db.schedule.filter(s=>Number(s.teacherId)===Number(teacherId)&&s.disciplineId&&s.type===typeName).reduce((a,s)=>a+num(s.workloadHours),0);
}
function openTeacherWorkload(id){
  const t=teacherById(id);if(!t||t.scope==="external")return;

  const disciplines=db.disciplines
    .filter(d=>d.status!=="archived"&&plannedForDisciplineTeacher(d,id)>0)
    .sort((a,b)=>(a.course||99)-(b.course||99)||String(a.group||"").localeCompare(String(b.group||""),"uk")||a.name.localeCompare(b.name,"uk"));

  const totalAllocated=teacherUniqueAllocatedHours(t,{allPrograms:true});
  const currentProgramAllocated=teacherPlannedHours(t);
  const auditoriumAllocated=teacherUniqueAllocatedHours(t,{auditoriumOnly:true,allPrograms:true});
  const auditoriumScheduled=teacherAuditoriumScheduledHours(t);
  const auditoriumRemaining=Math.max(0,auditoriumAllocated-auditoriumScheduled);

  const discRows=disciplines.map(d=>{
    const load=explicitTeacherLoad(d,id)||{};
    const typeParts=db.lessonTypes
      .filter(lt=>num(load[lt.id])>0)
      .map(lt=>{const s=teacherStreamForTypeId(d,id,lt.id);return `${esc(lt.name)} — ${fmtHours(load[lt.id])}${s?` · <strong>${esc(teacherStreamLabel(s))}</strong>`:""}`;})
      .join(" · ");
    const aud=auditoriumLessonTypes().reduce((a,lt)=>a+num(load[lt.id]),0);
    const scheduled=db.schedule
      .filter(x=>Number(resolvedScheduleTeacherId(x,db))===Number(id)&&scheduleCoversDiscipline(x,d.id)&&isAuditoriumPairType(lessonTypeByName(x.type)))
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
      ${kpi("Загальне навантаження · усі програми",fmtHours(totalAllocated)+" год")}
      ${kpi("У поточній програмі",fmtHours(currentProgramAllocated)+" год")}
      ${kpi("Аудиторних до розкладу · усі програми",fmtHours(auditoriumAllocated)+" год")}
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
  openModal(`<h2>${id?"Редагувати":"Новий"} вид заняття</h2><form id="ltf" class="form-grid"><label class="wide">Назва<input id="ltn" value="${esc(x.name)}" required></label><label>Правило підрахунку<select id="ltm"><option value="academic_pair" ${x.countMode==="academic_pair"?"selected":""}>Аудиторні / парами</option><option value="contingent" ${x.countMode==="contingent"?"selected":""}>За контингентом</option><option value="per_student" ${x.countMode==="per_student"?"selected":""}>Індивідуально кожному студенту</option><option value="fixed" ${x.countMode==="fixed"?"selected":""}>Фіксована кількість годин</option><option value="manual" ${x.countMode==="manual"?"selected":""}>Ручний підрахунок</option></select></label><label>Базове значення<input id="ltu" type="number" min="0" step="0.01" value="${esc(x.defaultUnit||1)}"></label><label class="wide">Пояснення / примітка<textarea id="ltd" rows="3">${esc(x.description||"")}</textarea></label><div class="wide entity-form-actions"><button class="primary">Зберегти</button>${id?`<button type="button" class="danger entity-delete-btn" onclick="deleteLessonType(${id})">Видалити вид занять</button>`:""}</div></form>`);
  $("#ltf").onsubmit=e=>{e.preventDefault();const obj={name:$("#ltn").value.trim(),countMode:$("#ltm").value,defaultUnit:+$("#ltu").value||0,description:$("#ltd").value.trim()};if(id)Object.assign(x,obj);else db.lessonTypes.push({id:uid(db.lessonTypes),...obj});closeModal();save();};
}
function deleteLessonType(id){
  const x=db.lessonTypes.find(v=>Number(v.id)===Number(id));if(!x)return;
  const scheduleCount=db.schedule.filter(s=>normIdentity(s.type)===normIdentity(x.name)).length;
  const loadCount=db.disciplines.filter(d=>
    num(d.hours?.[id])>0||num(d.extraHours?.[id])>0||Object.values(d.teacherLoads||{}).some(load=>num(load?.[id])>0)
  ).length;
  if(scheduleCount||loadCount){
    return alert(`Вид «${x.name}» зараз використовується: ${scheduleCount} записів розкладу, ${loadCount} дисциплін із годинами. Спочатку видаліть або перенесіть ці записи.`);
  }
  if(!confirmCascadeDelete(`Видалити вид занять «${x.name}»?`,[]))return;
  db.lessonTypes=db.lessonTypes.filter(v=>Number(v.id)!==Number(id));
  closeModal();save();
}

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
  const plans=(db.curricula||[]).filter(curriculumVisibleInProgram);
  plans.forEach(ensureCurriculumShape);
  $("#page-curricula").innerHTML=`<div class="card section">
    <div class="section-head"><div><h2>Робочі навчальні плани</h2><span class="small">План є першоджерелом: зміни тут автоматично оновлюють активовані дисципліни та навантаження.</span></div><button class="primary" onclick="openCurriculumMetaModal()">+ Новий план</button></div>
    ${plans.length?`<div class="curriculum-grid">${plans.map(c=>{const t=curriculumTotalsFromRows(c);return `<div class="curriculum-card"><div class="curriculum-title"><div><span class="badge ok">${esc(courseDisplayLabel(c.course))}</span><h3>${esc(c.program||"Без назви")}</h3><div class="small">${esc(c.academicYear||"")} · ${esc(c.studyForm||"")} форма</div></div><div class="actions"><button class="primary" onclick="openCurriculum(${c.id})">Відкрити</button><button onclick="openCurriculumMetaModal(${c.id})">Редагувати</button><button class="quiet-danger" onclick="deleteCurriculum(${c.id})">Видалити</button></div></div><div class="curriculum-kpis"><div><b>${fmtHours(t.credits)}</b><span>кредитів</span></div><div><b>${fmtHours(t.totalHours)}</b><span>загальних годин</span></div><div><b>${fmtHours(t.auditoriumHours)}</b><span>аудиторних</span></div><div><b>${fmtHours(t.selfStudy)}</b><span>самостійних</span></div></div><div class="small" style="margin-top:12px">Групи: ${esc((c.applicableGroups||[]).join(", ")||"—")}</div></div>`;}).join("")}</div>`:`<div class="empty">Планів ще немає.</div>`}
  </div>`;
}
function openCurriculumMetaModal(id=null){
  const existing=id?curriculumById(id):null;
  const c=existing?clone(existing):{id:null,academicYear:db.academicYear,course:1,specialty:"026 Сценічне мистецтво",program:activeProgram()?.name||"",programId:activeProgramId(),degree:"Бакалавр сценічного мистецтва",studyForm:"Денна",semesterWeeks:{},applicableGroups:[],components:[],blocks:[]};
  ensureCurriculumShape(c);
  openModal(`<h2>${id?"Редагувати":"Новий"} робочий навчальний план</h2><form id="cmf" class="form-grid">
    <label>Навчальний рік<input id="cmy" value="${esc(c.academicYear||"")}" required></label><label>Курс<select id="cmc">${[1,2,3,4,5,6].map(x=>`<option value="${x}" ${Number(c.course)===x?"selected":""}>${esc(courseDisplayLabel(x))}</option>`).join("")}</select></label>
    <label class="wide">Робочий простір спеціальності<select id="cmprogramId">${programOptionsHtml(c.programId||curriculumProgramId(c))}</select></label><label class="wide">Спеціальність<input id="cmspec" value="${esc(c.specialty||"")}"></label><label class="wide">Освітня програма<input id="cmprog" value="${esc(c.program||"")}" required></label>
    <label>Кваліфікація<input id="cmdeg" value="${esc(c.degree||"")}"></label><label>Форма навчання<input id="cmform" value="${esc(c.studyForm||"")}"></label>
    <label class="wide">Групи, до яких застосовується план<select id="cmgroups" multiple size="${Math.min(8,Math.max(3,visibleGroups().length))}">${sortedGroups().map(g=>`<option value="${esc(g.code)}" ${(c.applicableGroups||[]).includes(g.code)?"selected":""}>${esc(g.code)} · ${esc(courseDisplayLabel(g.course))}</option>`).join("")}</select></label>
    <div class="wide"><b>Кількість навчальних тижнів за семестрами</b><div class="weeks-grid">${[1,2,3,4,5,6,7,8,9,10].map(s=>`<label>${s} сем.<input class="cmweek" data-sem="${s}" type="number" min="0" step="1" value="${esc(c.semesterWeeks?.[s]||c.semesterWeeks?.[String(s)]||"")}"></label>`).join("")}</div></div>
    <div class="wide modal-footer-actions"><button class="primary">Зберегти</button>${id?`<button type="button" class="danger" onclick="deleteCurriculum(${id})">Видалити план</button>`:""}</div>
  </form>`,true);
  $("#cmf").onsubmit=e=>{e.preventDefault();const weeks={};$$('.cmweek').forEach(i=>{if(i.value!=="")weeks[i.dataset.sem]=num(i.value);});const obj={academicYear:$("#cmy").value.trim(),course:+$("#cmc").value,programId:$("#cmprogramId").value,specialty:$("#cmspec").value.trim(),program:$("#cmprog").value.trim(),degree:$("#cmdeg").value.trim(),studyForm:$("#cmform").value.trim(),applicableGroups:[...$("#cmgroups").selectedOptions].map(o=>o.value),semesterWeeks:weeks};if(existing){Object.assign(existing,obj);syncAllCurriculumLinks(existing);}else{db.curricula.push({id:uid(db.curricula),...obj,components:[],blocks:[]});}closeModal();save();};
}
function deleteCurriculum(id){
  const c=curriculumById(id);if(!c)return;
  const linked=db.disciplines.filter(d=>Number(d.sourceCurriculumId)===Number(id));
  const linkedIds=new Set(linked.map(d=>Number(d.id)));
  const scheduled=db.schedule.filter(s=>linkedIds.has(Number(s.disciplineId))||Number(s.sourceCurriculumId)===Number(id));
  const lines=[];
  if(linked.length)lines.push(`${deleteCountLabel(linked.length,"активовану дисципліну","активовані дисципліни","активованих дисциплін")} навантаження буде видалено.`);
  if(scheduled.length)lines.push(`${deleteCountLabel(scheduled.length,"пару/запис","пари/записи","пар/записів")} з цього плану буде видалено.`);
  if(!confirmCascadeDelete(`Видалити навчальний план «${c.program}»?`,lines))return;
  db.schedule=db.schedule.filter(s=>!linkedIds.has(Number(s.disciplineId))&&Number(s.sourceCurriculumId)!==Number(id));
  db.disciplines=db.disciplines.filter(d=>Number(d.sourceCurriculumId)!==Number(id));
  db.curricula=db.curricula.filter(x=>Number(x.id)!==Number(id));
  closeModal();save();
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
  openModal(`<div class="curriculum-detail"><div class="workload-title"><div><h2>Робочий план · ${esc(courseDisplayLabel(c.course))}</h2><h3>${esc(c.program)}</h3><div class="small">${esc(c.specialty)} · ${esc(c.degree)} · ${esc(c.academicYear)}</div></div><div class="actions"><button class="primary" onclick="openCurriculumBlockModal(${c.id})">+ Блок</button><button onclick="openCurriculumMetaModal(${c.id})">Редагувати план</button></div></div><div class="grid-kpi workload-kpi" style="margin-top:16px">${kpi("Кредити",fmtHours(totals.credits))}${kpi("Усього годин",fmtHours(totals.totalHours))}${kpi("Аудиторні",fmtHours(totals.auditoriumHours))}${kpi("Самостійні",fmtHours(totals.selfStudy))}</div><div class="notice success-notice"><b>План редагований.</b> Якщо змінити назву, контроль або години вже активованої дисципліни, зміни автоматично переходять у «Дисципліни / навантаження», картки викладачів і розклад.</div>${body}</div>`,true);
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
  openModal(`<h2>${comp?"Редагувати":"Нова"} дисципліна в навчальному плані</h2><form id="ccf"><div class="form-grid"><label class="wide">Назва дисципліни<input id="ccname" value="${esc(comp?.name||"")}" required></label><label>Тип<select id="ccscope"><option value="department" ${comp?.scope!=="external"?"selected":""}>Кафедральна</option><option value="external" ${comp?.scope==="external"?"selected":""}>Не кафедральна / загальноосвітня</option></select></label><label>Блок<select id="ccblock">${c.blocks.map(b=>`<option value="${b.id}" ${Number(b.id)===Number(selectedBlock?.id)?"selected":""}>${esc(b.section)} → ${esc(b.name)}</option>`).join("")}</select></label></div><div class="section-head compact" style="margin-top:18px"><div><b>Семестри та години</b><div class="small">Можна змінювати всі цифри або додати ще один семестр.</div></div><button type="button" class="secondary" onclick="addCurriculumRow()">+ Семестр</button></div><div id="curriculumRows">${(comp?.rows?.length?comp.rows:[{semester:1,control:"Немає"}]).map(curriculumRowEditor).join("")}</div><div class="modal-footer-actions"><button class="primary">Зберегти дисципліну</button>${comp?`<button type="button" class="danger entity-delete-btn" onclick="deleteCurriculumComponent(${c.id},${comp.id})">Видалити дисципліну</button>`:""}</div></form>`,true);
  $("#ccf").onsubmit=e=>{e.preventDefault();const rows=readCurriculumRows(comp);if(!rows.length)return alert("Додайте хоча б один семестровий рядок.");const sems=rows.map(r=>r.semester);if(new Set(sems).size!==sems.length)return alert("У межах однієї дисципліни не може бути два однакові семестрові рядки.");const b=c.blocks.find(x=>Number(x.id)===Number($("#ccblock").value));const oldRowIds=new Set((comp?.rows||[]).map(r=>Number(r.id)));const newRowIds=new Set(rows.map(r=>Number(r.id)));const removed=[...oldRowIds].filter(id=>!newRowIds.has(id));for(const rid of removed){const linked=db.disciplines.filter(d=>Number(d.sourceCurriculumId)===Number(c.id)&&Number(d.sourceComponentId)===Number(comp.id)&&Number(d.sourceRowId)===Number(rid));const ids=new Set(linked.map(d=>Number(d.id)));if(db.schedule.some(s=>ids.has(Number(s.disciplineId))))return alert("Не можна видалити семестровий рядок, бо для нього вже є заняття в розкладі. Спочатку видаліть ці заняття.");db.disciplines=db.disciplines.filter(d=>!ids.has(Number(d.id)));}
    const obj={name:$("#ccname").value.trim(),scope:$("#ccscope").value,section:b.section,category:b.name,rows};if(comp){Object.assign(comp,obj);}else c.components.push({id:nextLocalId(c.components),...obj});syncAllCurriculumLinks(c);closeModal();save();openCurriculum(c.id);};
}
function deleteCurriculumComponent(curriculumId,componentId){
  const c=curriculumById(curriculumId),comp=curriculumComponent(c,componentId);if(!c||!comp)return;
  const linked=db.disciplines.filter(d=>Number(d.sourceCurriculumId)===Number(c.id)&&Number(d.sourceComponentId)===Number(comp.id));
  const ids=new Set(linked.map(d=>Number(d.id)));
  const scheduled=db.schedule.filter(s=>
    ids.has(Number(s.disciplineId))
    ||(Number(s.sourceCurriculumId)===Number(c.id)&&Number(s.sourceComponentId)===Number(comp.id))
  );
  const lines=[];
  if(linked.length)lines.push(`${deleteCountLabel(linked.length,"активований запис","активовані записи","активованих записів")} навантаження буде видалено.`);
  if(scheduled.length)lines.push(`${deleteCountLabel(scheduled.length,"пару/запис","пари/записи","пар/записів")} цієї дисципліни буде видалено.`);
  if(!confirmCascadeDelete(`Видалити дисципліну «${comp.name}» з навчального плану?`,lines))return;
  db.schedule=db.schedule.filter(s=>
    !ids.has(Number(s.disciplineId))
    &&!(Number(s.sourceCurriculumId)===Number(c.id)&&Number(s.sourceComponentId)===Number(comp.id))
  );
  db.disciplines=db.disciplines.filter(d=>!ids.has(Number(d.id)));
  c.components=c.components.filter(x=>Number(x.id)!==Number(componentId));
  closeModal();save();openCurriculum(c.id);
}
function createLoadFromPlan(curriculumId,componentId,rowId){
  const c=curriculumById(curriculumId),comp=curriculumComponent(c,componentId);ensureCurriculumShape(c);const r=comp?.rows?.find(x=>Number(x.id)===Number(rowId));if(!c||!comp||!r)return;const availableGroups=(c.applicableGroups||[]).filter(g=>db.groups.some(x=>x.code===g));
  openModal(`<h2>Створити дисципліну з робочого плану</h2><div class="notice"><b>${esc(comp.name)}</b> · ${r.semester} семестр · ${esc(r.control)}</div><form id="planLoadForm" class="form-grid"><label class="wide">Для яких груп<select id="plGroups" multiple size="${Math.max(2,availableGroups.length)}">${availableGroups.map(g=>`<option value="${esc(g)}" selected>${esc(g)} · ${groupStudentCount(g)} студентів</option>`).join("")}</select><span class="small">Ctrl/⌘ + клік — вибір окремих груп.</span></label><div class="wide"><b>З плану буде перенесено</b><div class="plan-summary" style="margin-top:8px"><span>Лекції ${fmtHours(r.lecture)}</span><span>Семінари ${fmtHours(r.seminar)}</span><span>Практичні ${fmtHours(r.practical)}</span><span>Лабораторні ${fmtHours(r.laboratory)}</span><span>Індивідуальні ${fmtHours(r.individual)}</span></div></div><div class="wide"><button class="primary">Створити в «Дисципліни / навантаження»</button></div></form>`);
  $("#planLoadForm").onsubmit=e=>{e.preventDefault();const groups=[...$("#plGroups").selectedOptions].map(o=>o.value);if(!groups.length)return alert("Оберіть хоча б одну групу.");const created=[],skipped=[];groups.forEach(group=>{const exists=db.disciplines.some(d=>Number(d.sourceCurriculumId)===Number(c.id)&&Number(d.sourceComponentId)===Number(comp.id)&&Number(d.sourceRowId)===Number(r.id)&&d.group===group);if(exists){skipped.push(group);return;}db.disciplines.push({id:uid(db.disciplines),name:comp.name,course:c.course,group,programId:c.programId||db.groups.find(g=>g.code===group)?.programId||activeProgramId(),semester:Number(r.semester),academicYear:c.academicYear,teacherIds:[],teacherLoads:{},teacherStudentLoads:{},teacherStudentHours:{},audienceMode:"group",selectedStudentIds:[],controlForm:r.control,color:"#8b5cf6",hours:planRowToHours(r),note:"",status:"active",sourceCurriculumId:c.id,sourceComponentId:comp.id,sourceRowId:r.id,planMeta:{credits:r.credits,totalHours:r.totalHours,auditoriumHours:r.auditoriumHours,auditoriumPlanHours:r.auditoriumPlanHours,selfStudy:r.selfStudy,practice:r.practice,weekly:r.weekly}});created.push(group);});save();closeModal();alert(`Створено: ${created.length}${skipped.length?`. Уже існувало: ${skipped.join(", ")}`:""}`);go("disciplines");};
}

let disciplineExtraDraft=null;
let disciplineStudentAllocationDraft=null;
let disciplineStudentHoursDraft=null;
let splitIndividualBulkSelection={};
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
  const lt=lessonTypeById(typeId);
  if(lt&&!thesisTypeApplicable(d,lt))return 0;
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
  const lt=lessonTypeById(typeId);
  if(isSplitIndividualType(lt)){
    const byHours=d?.teacherStudentHours?.[String(teacherId)]||d?.teacherStudentHours?.[Number(teacherId)];
    if(byHours&&Object.prototype.hasOwnProperty.call(byHours,String(typeId)))return true;
  }
  const byTeacher=d?.teacherStudentLoads?.[String(teacherId)]||d?.teacherStudentLoads?.[Number(teacherId)];
  return !!byTeacher&&Object.prototype.hasOwnProperty.call(byTeacher,String(typeId));
}
function persistedAssignedStudentIds(d,teacherId,typeId){
  const lt=lessonTypeById(typeId);
  if(isSplitIndividualType(lt)){
    const byHours=d?.teacherStudentHours?.[String(teacherId)]||d?.teacherStudentHours?.[Number(teacherId)]||{};
    if(Object.prototype.hasOwnProperty.call(byHours,String(typeId)))return Object.entries(byHours[String(typeId)]||{}).filter(([,h])=>num(h)>0).map(([sid])=>Number(sid)).filter(Boolean);
  }
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
  const lt=lessonTypeById(typeId);
  if(window.__disciplineDraft===d&&isSplitIndividualType(lt)&&disciplineStudentHoursDraft!==null&&draftStudentHoursKeyExists(teacherId,typeId)){
    return Object.entries(disciplineStudentHoursDraft?.[String(teacherId)]?.[String(typeId)]||{}).filter(([,h])=>num(h)>0).map(([sid])=>Number(sid)).filter(Boolean);
  }
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
function thesisSupervisorAssignment(d,lt,studentId,currentTeacherId=null){
  const kind=thesisKindForType(lt);if(!kind)return null;
  const sameDisciplineTeacher=assignedStudentTeacherId(d,lt.id,studentId,currentTeacherId);
  if(sameDisciplineTeacher)return {teacherId:sameDisciplineTeacher,disciplineId:d.id};
  for(const peer of db.disciplines||[]){
    if(peer.status==="archived"||Number(peer.id)===Number(d?.id))continue;
    if(!specialTypeMatches(kind,lt,peer))continue;
    const byTeacher=peer.teacherStudentLoads||{};
    for(const [tid,byType] of Object.entries(byTeacher)){
      const ids=(byType?.[String(lt.id)]||[]).map(Number);
      if(ids.includes(Number(studentId)))return {teacherId:Number(tid),disciplineId:peer.id};
    }
  }
  return null;
}
function studentSupervisorLabel(assignment){const t=assignment?teacherById(assignment.teacherId):null;return t?teacherDisplay(t):"інший викладач";}
function individualStudentLimit(d,t,lt,studentId){
  if(!d||!lt||!isPerStudentTypeId(lt.id))return 0;
  if(isSplitIndividualType(lt))return assignedStudentHours(d,t?.id,lt.id,studentId);
  return perStudentUnitHours(d,lt.id);
}
function individualStudentUsage(d,t,lt,studentId,ignoreId=null){
  const limit=individualStudentLimit(d,t,lt,studentId);
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
    .filter(d=>disciplineVisibleInProgram(d))
    .slice()
    .sort((a,b)=>(a.course||groupCourse(a.group)||99)-(b.course||groupCourse(b.group)||99)
      ||String(a.group||"").localeCompare(String(b.group||""),"uk")
      ||Number(a.semester||99)-Number(b.semester||99)
      ||a.name.localeCompare(b.name,"uk"));
}
function loadPageActiveGroups(rows=loadPageRows()){
  const codes=new Set(rows.map(d=>d.group).filter(Boolean));

  // A group with only external/general-education subjects must still be visible.
  visibleGroups().forEach(g=>{
    const hasExternalPlan=readyPlanRecords(g.code).some(rec=>rec.scope==="external");
    const hasReadyRows=readyExternalRowsForGroup(g.code).length>0;
    if(hasExternalPlan||hasReadyRows)codes.add(g.code);
  });

  return [...codes].map(code=>{
    const g=db.groups.find(x=>normIdentity(x.code)===normIdentity(code))||{code,course:groupCourse(code)||99};
    const disciplines=rows.filter(d=>normIdentity(d.group)===normIdentity(code));
    const states=disciplines.map(d=>disciplineLoadState(d));
    const external=readyExternalDisciplineSummaries(code);

    return {
      ...g,
      disciplines,
      external,
      total:disciplines.length,
      externalTotal:external.length,
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
        <span>${esc(courseDisplayLabel(g.course))} · ${groupStudentCount(g.code)} студентів</span>
      </div>
      ${g.attention?`<strong>${g.attention}</strong>`:`<strong class="done">✓</strong>`}
    </div>
    <div class="load-group-card-stats">
      <span><b>${g.total}</b> кафедр.</span>
      <span class="external-count"><b>${g.externalTotal||0}</b> інших</span>
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
        <div class="load-course-label">${esc(courseDisplayLabel(course))}</div>
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

  // Plan-backed external subjects exist even before a single pair is entered.
  plans.forEach(rec=>{
    const key=readyPlanIdentity(rec);
    map.set(key,{
      key,
      planRef:rec.ref,
      planRecord:rec,
      group,
      discipline:rec.name,
      semester:rec.semester||null,
      rows:[],
      sourceCurriculumId:rec.curriculumId||null,
      sourceComponentId:rec.componentId||null
    });
  });

  rows.forEach(x=>{
    const sourceKey=readyItemPlanIdentity(x);
    let plan=sourceKey?plans.find(p=>readyPlanIdentity(p)===sourceKey):null;

    // Old rows without source IDs: safe fallback by name+semester.
    if(!plan){
      const candidates=plans.filter(p=>normIdentity(p.name)===normIdentity(x.discipline));
      if(x.sourceSemester){
        plan=candidates.find(p=>Number(p.semester)===Number(x.sourceSemester))||null;
      }else if(candidates.length===1){
        plan=candidates[0];
      }
    }

    const key=plan
      ?readyPlanIdentity(plan)
      :`custom:${normIdentity(x.discipline||"Без назви")}|${Number(x.sourceSemester)||0}`;

    if(!map.has(key)){
      map.set(key,{
        key,
        planRef:plan?.ref||x.sourcePlanRef||"",
        planRecord:plan||null,
        group,
        discipline:plan?.name||x.discipline||"Без назви",
        semester:plan?.semester||x.sourceSemester||null,
        rows:[],
        sourceCurriculumId:plan?.curriculumId||x.sourceCurriculumId||null,
        sourceComponentId:plan?.componentId||x.sourceComponentId||null
      });
    }

    map.get(key).rows.push(x);
  });

  return [...map.values()].map(s=>{
    const teachers=[...new Set(s.rows.map(x=>x.teacher).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b,"uk"));
    const types=[...new Set(s.rows.map(x=>x.type).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b,"uk"));
    const hours=s.rows.reduce((sum,x)=>sum+readyAcademicHours(x),0);
    const planHours=readyPlanHours(s.planRecord);
    const remaining=planHours?Math.max(0,planHours-hours):0;

    return {
      ...s,
      teachers,
      types,
      hours,
      pairs:s.rows.length,
      planHours,
      remaining,
      planTypeText:readyPlanTypeText(s.planRecord),
      control:s.planRecord?.row?.control||""
    };
  }).sort((a,b)=>
    Number(a.semester||99)-Number(b.semester||99)
    ||a.discipline.localeCompare(b.discipline,"uk")
  );
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

    <div class="ready-load-stats ${s.planHours?"has-plan":""}">
      ${s.planHours?`
        <div><b>${fmtHours(s.hours)} / ${fmtHours(s.planHours)}</b><span>внесено / за планом, год</span></div>
        <div><b>${fmtHours(s.remaining)}</b><span>ще не внесено, год</span></div>
        <div><b>${s.pairs}</b><span>пар внесено</span></div>
      `:`
        <div><b>${s.pairs}</b><span>пар внесено</span></div>
        <div><b>${fmtHours(s.hours)}</b><span>акад. год</span></div>
        <div><b>${s.types.length}</b><span>видів занять</span></div>
      `}
    </div>

    ${s.planTypeText?`<div class="ready-plan-types"><span>План:</span><b>${esc(s.planTypeText)}</b>${s.control?`<small>${esc(s.control)}</small>`:""}</div>`:""}

    <div class="compact-discipline-actions">
      <button class="secondary" data-group="${esc(s.group)}" data-discipline="${esc(s.discipline)}" data-semester="${esc(s.semester||"")}" data-ref="${esc(s.planRef||"")}" onclick="openReadyExternalManager(this.dataset.group,this.dataset.discipline,this.dataset.semester,this.dataset.ref)">${s.pairs?"Редагувати пари":"Відкрити дисципліну"}</button>
      <button class="primary-inline" data-group="${esc(s.group)}" data-discipline="${esc(s.discipline)}" data-ref="${esc(s.planRef||"")}" onclick="openReadyScheduleForDiscipline(this.dataset.group,this.dataset.ref,this.dataset.discipline)">+ Додати</button>
      <button class="quiet-danger compact-delete" data-group="${esc(s.group)}" data-discipline="${esc(s.discipline)}" data-semester="${esc(s.semester||"")}" data-ref="${esc(s.planRef||"")}" onclick="deleteReadyExternalDiscipline(this.dataset.group,this.dataset.discipline,this.dataset.semester,this.dataset.ref)">Видалити</button>
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

    <button type="button" class="discipline-audience-strip ${disciplineAudienceMode(d)==="selected"?"selected":""}" onclick="openDisciplineAudienceModal(${d.id})"><span class="discipline-audience-icon">👥</span><div><span>Хто слухає дисципліну</span><b>${esc(disciplineAudienceLabel(d))}</b></div><strong>${disciplineAudienceMode(d)==="selected"?"ЗМІНИТИ СКЛАД":"НАЛАШТУВАТИ"}</strong></button>

    ${disciplineStreamBadgesHtml(d)}

    <div class="load-discipline-progress">${loadDisciplineStatusHtml(d)}</div>

    <div class="compact-discipline-actions">
      <button class="${s.status==="done"?"secondary":"primary-inline"}" onclick="openDisciplineModal(${d.id})">${s.status==="done"?"Переглянути":"Розподілити години"}</button>
      <button class="secondary bulk-across-groups-btn" onclick="openBulkDisciplineAllocation(${d.id})">По всіх групах</button>
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
  const readyForGroup=readyExternalDisciplineSummaries(group);
  const semesters=[...new Set([
    ...allForGroup.map(d=>d.semester),
    ...readyForGroup.map(d=>d.semester)
  ].filter(Boolean))].sort((a,b)=>Number(a)-Number(b));

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
        <h3>${esc(group)} · ${esc(courseDisplayLabel(course))}</h3>
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
      let ready=readyExternalDisciplineSummaries(group);
      if(loadPageState.semester!=="all"){
        ready=ready.filter(x=>String(x.semester)===String(loadPageState.semester));
      }
      return ready.length?`<section class="ready-load-section">
        <div class="ready-load-section-head">
          <div>
            <span>ОКРЕМИЙ БЛОК</span>
            <h3>Інші кафедри / готовий розклад</h3>
            <p>Ці дисципліни існують у розкладі групи, але не входять у кафедральне навантаження наших викладачів.</p>
          </div>
          <button class="ready-import-btn schedule-action-btn ready-action-prominent compact" onclick="openReadyScheduleModal()"><span class="action-kicker">Швидко</span><b>+ Внести готові пари</b><small>одразу в розклад групи</small></button>
        </div>
        <div class="load-discipline-list ready-load-grid">${ready.map(readyExternalDisciplineCardHtml).join("")}</div>
      </section>`:"";
    })():""}`;
}

/* v2.0.11 · discipline-first workload matrix */
let bulkDisciplineAllocationState={disciplineId:null,typeId:null,mode:"separate"};
function bulkDisciplineFamilyKey(d){
  return [disciplineProgramId(d),normIdentity(d?.name||""),Number(d?.course||groupCourse(d?.group)||0),Number(d?.semester||0),String(d?.academicYear||db.academicYear||"")].join("|");
}
function bulkDisciplineFamilyPeers(d){
  if(!d)return[];const key=bulkDisciplineFamilyKey(d);
  return loadPageRows().filter(x=>bulkDisciplineFamilyKey(x)===key)
    .sort((a,b)=>String(a.group||"").localeCompare(String(b.group||""),"uk"));
}
function bulkDisciplineFamilies(){
  const map=new Map();loadPageRows().forEach(d=>{const key=bulkDisciplineFamilyKey(d);if(!map.has(key))map.set(key,{key,d,peers:[]});map.get(key).peers.push(d);});
  return [...map.values()].sort((a,b)=>(a.d.course||99)-(b.d.course||99)||Number(a.d.semester||99)-Number(b.d.semester||99)||String(a.d.name||"").localeCompare(String(b.d.name||""),"uk"));
}
function bulkDisciplineFamilyLabel(f){return `${f.d.name} · ${courseDisplayLabel(f.d.course||groupCourse(f.d.group))} · ${f.d.semester||"—"} сем. · ${f.peers.length} гр.`;}
function bulkAllocationTypes(peers){
  return db.lessonTypes.filter(lt=>!isPerStudentTypeId(lt.id)&&peers.some(d=>disciplineTotalHoursById(d,lt.id)>0));
}
function bulkTypeAllocatedTeachers(d,typeId){
  return Object.entries(d?.teacherLoads||{}).map(([tid,load])=>({tid:Number(tid),hours:num(load?.[typeId])})).filter(x=>x.tid&&x.hours>0&&teacherById(x.tid));
}
function bulkTypeOtherHours(d,typeId,excludeTeacherId){
  return bulkTypeAllocatedTeachers(d,typeId).filter(x=>Number(x.tid)!==Number(excludeTeacherId)).reduce((a,x)=>a+x.hours,0);
}
function bulkTeacherSelectOptions(selected=""){
  return `<option value="">— оберіть викладача —</option>`+visibleTeachers().slice().sort((a,b)=>teacherDisplay(a).localeCompare(teacherDisplay(b),"uk")).map(t=>`<option value="${t.id}" ${Number(t.id)===Number(selected)?"selected":""}>${esc(teacherDisplay(t))}</option>`).join("");
}
function bulkTeacherChipsForType(d,typeId){
  const rows=bulkTypeAllocatedTeachers(d,typeId);if(!rows.length)return `<span class="bulk-current-empty">ще не розподілено</span>`;
  return `<div class="bulk-current-chips">${rows.map(x=>`<span>${esc(teacherDisplay(teacherById(x.tid)))} · <b>${fmtHours(x.hours)} год</b></span>`).join("")}</div>`;
}
function bulkPersistDetachTeacherStream(d,teacherId,typeId){
  const tid=String(teacherId),lt=String(typeId),stream=d?.teacherStreams?.[tid]?.[lt]||d?.teacherStreams?.[teacherId]?.[typeId];
  if(!stream)return;const streamId=String(stream.streamId||"");const ids=[...new Set((stream.disciplineIds||[d.id]).map(Number).filter(Boolean))];
  ids.forEach(id=>{const peer=disciplineById(id);if(!peer?.teacherStreams)return;const byTeacher=peer.teacherStreams[tid]||peer.teacherStreams[teacherId];const candidate=byTeacher?.[lt]||byTeacher?.[typeId];if(candidate&&(!streamId||String(candidate.streamId||"")===streamId)){delete byTeacher[lt];delete byTeacher[typeId];if(!Object.keys(byTeacher).length){delete peer.teacherStreams[tid];delete peer.teacherStreams[teacherId];}}});
}
function bulkSetTeacherTypeHours(d,teacherId,typeId,hours){
  const tid=String(teacherId),lt=String(typeId);d.teacherLoads=d.teacherLoads||{};d.teacherLoads[tid]=d.teacherLoads[tid]||{};d.teacherLoads[tid][lt]=num(hours);d.teacherIds=d.teacherIds||[];
  if(num(hours)>0)d.teacherIds=[...new Set([...d.teacherIds.map(Number),Number(teacherId)])];
  if(num(hours)<=0){delete d.teacherLoads[tid][lt];if(!Object.values(d.teacherLoads[tid]||{}).some(v=>num(v)>0))delete d.teacherLoads[tid];}
  d.teacherIds=d.teacherIds.filter(id=>{const load=d.teacherLoads?.[String(id)]||{};const student=(d.teacherStudentLoads?.[String(id)]||{});const studentHours=(d.teacherStudentHours?.[String(id)]||{});return Object.values(load).some(v=>num(v)>0)||Object.values(student).some(v=>(v||[]).length)||Object.values(studentHours).some(m=>Object.values(m||{}).some(v=>num(v)>0));});
}
function openBulkDisciplineAllocation(disciplineId=null){
  const families=bulkDisciplineFamilies();if(!families.length)return alert("Спочатку додай дисципліни з навчального плану.");
  let family=disciplineId?families.find(f=>f.peers.some(d=>Number(d.id)===Number(disciplineId))):null;family=family||families[0];
  const peers=family.peers,types=bulkAllocationTypes(peers);if(!types.length)return alert("У цієї дисципліни немає аудиторних видів занять для швидкого розподілу.");
  bulkDisciplineAllocationState.disciplineId=Number(family.d.id);if(!types.some(lt=>Number(lt.id)===Number(bulkDisciplineAllocationState.typeId)))bulkDisciplineAllocationState.typeId=Number(types[0].id);bulkDisciplineAllocationState.mode="separate";
  openModal(`<div class="bulk-load-modal">
    <div class="bulk-load-hero"><div><span>ШВИДКИЙ РОЗПОДІЛ НАВАНТАЖЕННЯ</span><h2>Одна дисципліна — одразу всі групи</h2><p>Призначай різних викладачів різним групам або створи спільний потік без переходів між картками.</p></div><div class="bulk-load-hero-badge"><b>${peers.length}</b><span>груп</span></div></div>
    <div class="bulk-load-controls">
      <label>Дисципліна<select id="bulkFamilySelect">${families.map(f=>`<option value="${f.d.id}" ${Number(f.d.id)===Number(family.d.id)?"selected":""}>${esc(bulkDisciplineFamilyLabel(f))}</option>`).join("")}</select></label>
      <label>Вид занять<select id="bulkTypeSelect">${types.map(lt=>`<option value="${lt.id}" ${Number(lt.id)===Number(bulkDisciplineAllocationState.typeId)?"selected":""}>${esc(lt.name)}</option>`).join("")}</select></label>
    </div>
    <div class="bulk-mode-switch"><button type="button" id="bulkModeSeparate" class="active" onclick="setBulkDisciplineAllocationMode('separate')"><b>Групи окремо</b><span>різні викладачі для різних груп</span></button><button type="button" id="bulkModeStream" onclick="setBulkDisciplineAllocationMode('stream')"><b>Спільний потік</b><span>один викладач читає кільком групам разом</span></button></div>
    <div id="bulkAllocationBody"></div>
  </div>`,true);
  $("#bulkFamilySelect").onchange=e=>openBulkDisciplineAllocation(Number(e.target.value));
  $("#bulkTypeSelect").onchange=e=>{bulkDisciplineAllocationState.typeId=Number(e.target.value);renderBulkDisciplineAllocationBody();};
  renderBulkDisciplineAllocationBody();
}
function setBulkDisciplineAllocationMode(mode){bulkDisciplineAllocationState.mode=mode==="stream"?"stream":"separate";$("#bulkModeSeparate")?.classList.toggle("active",bulkDisciplineAllocationState.mode==="separate");$("#bulkModeStream")?.classList.toggle("active",bulkDisciplineAllocationState.mode==="stream");renderBulkDisciplineAllocationBody();}
function bulkSeparateRowHtml(d,typeId){
  const allocations=bulkTypeAllocatedTeachers(d,typeId),single=allocations.length===1?allocations[0]:null,plan=disciplineTotalHoursById(d,typeId),other=single?bulkTypeOtherHours(d,typeId,single.tid):allocations.reduce((a,x)=>a+x.hours,0),suggest=single?single.hours:Math.max(0,plan-other),checked=allocations.length<=1;
  return `<div class="bulk-group-row ${allocations.length>1?"complex":""}" data-bulk-row data-discipline="${d.id}">
    <label class="bulk-row-check"><input type="checkbox" data-bulk-check ${checked?"checked":""}><span>✓</span></label>
    <div class="bulk-group-identity"><b>${esc(d.group)}</b><span>${esc(courseDisplayLabel(d.course||groupCourse(d.group)))} · план ${fmtHours(plan)} год</span></div>
    <div class="bulk-existing"><small>Зараз</small>${bulkTeacherChipsForType(d,typeId)}</div>
    <label class="bulk-teacher-field"><span>Викладач</span><select data-bulk-teacher>${bulkTeacherSelectOptions(single?.tid||"")}</select></label>
    <label class="bulk-hours-field"><span>Годин</span><input data-bulk-hours type="number" min="0" step="0.01" value="${fmtHours(suggest)}"></label>
    ${allocations.length>1?`<div class="bulk-complex-note">Уже є кілька викладачів. Обери, кого саме змінюєш; решта навантаження збережеться.</div>`:""}
  </div>`;
}
function renderBulkDisciplineAllocationBody(){
  const d=disciplineById(bulkDisciplineAllocationState.disciplineId),box=$("#bulkAllocationBody");if(!d||!box)return;const peers=bulkDisciplineFamilyPeers(d),typeId=Number(bulkDisciplineAllocationState.typeId),lt=lessonTypeById(typeId);if(!lt)return;
  if(bulkDisciplineAllocationState.mode==="stream"){
    const plans=peers.map(x=>disciplineTotalHoursById(x,typeId)).filter(x=>x>0),suggest=plans.length?Math.min(...plans):0;
    box.innerHTML=`<div class="bulk-stream-panel"><div class="bulk-stream-explain"><b>${esc(lt.name)} · ${esc(d.name)}</b><span>Вибрані групи отримають одного викладача і однакову кількість годин. У розкладі це буде одна спільна пара потоку.</span></div><div class="bulk-stream-fields"><label>Викладач<select id="bulkStreamTeacher">${bulkTeacherSelectOptions("")}</select></label><label>Годин кожній групі<input id="bulkStreamHours" type="number" min="0" step="0.01" value="${fmtHours(suggest)}"></label></div><div class="bulk-stream-toolbar"><button type="button" class="secondary" onclick="bulkSetStreamChecks(true)">Обрати всі</button><button type="button" class="secondary" onclick="bulkSetStreamChecks(false)">Очистити</button></div><div class="bulk-stream-groups">${peers.map(x=>`<label><input type="checkbox" data-bulk-stream-group value="${x.id}" checked><span><b>${esc(x.group)}</b><small>план ${fmtHours(disciplineTotalHoursById(x,typeId))} год · ${bulkTypeAllocatedTeachers(x,typeId).length?bulkTypeAllocatedTeachers(x,typeId).map(a=>`${teacherDisplay(teacherById(a.tid))} ${fmtHours(a.hours)}`).join(", "):"ще не розподілено"}</small></span></label>`).join("")}</div><div class="bulk-load-actions"><button type="button" class="secondary" onclick="closeModal()">Скасувати</button><button type="button" class="primary" onclick="saveBulkStreamAllocation()">Створити / оновити потік</button></div></div>`;
    return;
  }
  box.innerHTML=`<div class="bulk-separate-panel"><div class="bulk-apply-bar"><div><b>${esc(lt.name)} · ${esc(d.name)}</b><span>Познач групи й задай викладачів. Можна всім поставити одного, а потім змінити окремі рядки.</span></div><div class="bulk-apply-tools"><select id="bulkCommonTeacher">${bulkTeacherSelectOptions("")}</select><button type="button" class="secondary" onclick="bulkApplyCommonTeacher()">Поставити обраним</button><button type="button" class="secondary" onclick="bulkFillSeparateRemaining()">Заповнити залишок годин</button></div></div><div class="bulk-select-toolbar"><button type="button" class="secondary" onclick="bulkSetSeparateChecks(true)">Позначити всі</button><button type="button" class="secondary" onclick="bulkSetSeparateChecks(false)">Зняти вибір</button></div><div class="bulk-group-matrix">${peers.map(x=>bulkSeparateRowHtml(x,typeId)).join("")}</div><div class="bulk-load-actions"><button type="button" class="secondary" onclick="closeModal()">Скасувати</button><button type="button" class="primary" onclick="saveBulkSeparateAllocation()">Зберегти для всіх обраних груп</button></div></div>`;
}
function bulkSetSeparateChecks(value){$$('[data-bulk-check]').forEach(x=>x.checked=!!value);}
function bulkSetStreamChecks(value){$$('[data-bulk-stream-group]').forEach(x=>x.checked=!!value);}
function bulkApplyCommonTeacher(){const tid=Number($("#bulkCommonTeacher")?.value);if(!tid)return alert("Оберіть викладача.");$$('[data-bulk-row]').forEach(row=>{if(!row.querySelector('[data-bulk-check]')?.checked)return;const sel=row.querySelector('[data-bulk-teacher]');if(sel)sel.value=String(tid);});bulkFillSeparateRemaining();}
function bulkFillSeparateRemaining(){const typeId=Number(bulkDisciplineAllocationState.typeId);$$('[data-bulk-row]').forEach(row=>{if(!row.querySelector('[data-bulk-check]')?.checked)return;const d=disciplineById(Number(row.dataset.discipline)),tid=Number(row.querySelector('[data-bulk-teacher]')?.value),input=row.querySelector('[data-bulk-hours]');if(!d||!tid||!input)return;const plan=disciplineTotalHoursById(d,typeId),other=bulkTypeOtherHours(d,typeId,tid);input.value=fmtHours(Math.max(0,plan-other));});}
function saveBulkSeparateAllocation(){
  const typeId=Number(bulkDisciplineAllocationState.typeId),lt=lessonTypeById(typeId),rows=$$('[data-bulk-row]').filter(row=>row.querySelector('[data-bulk-check]')?.checked);if(!rows.length)return alert("Познач хоча б одну групу.");const changes=[],errors=[];
  rows.forEach(row=>{const d=disciplineById(Number(row.dataset.discipline)),tid=Number(row.querySelector('[data-bulk-teacher]')?.value),hours=num(row.querySelector('[data-bulk-hours]')?.value);if(!d)return;if(!tid){errors.push(`${d.group}: не обрано викладача.`);return;}const plan=disciplineTotalHoursById(d,typeId),other=bulkTypeOtherHours(d,typeId,tid),scheduled=lt?scheduledLoad(d.id,tid,lt.name):0;if(hours+0.001<scheduled)errors.push(`${d.group}: вже виставлено ${fmtHours(scheduled)} год у розкладі.`);if(other+hours>plan+0.001)errors.push(`${d.group}: разом вийде ${fmtHours(other+hours)} год при плані ${fmtHours(plan)}.`);changes.push({d,tid,hours});});
  if(errors.length)return alert("Не можу зберегти:\n\n"+errors.join("\n"));changes.forEach(x=>{bulkPersistDetachTeacherStream(x.d,x.tid,typeId);bulkSetTeacherTypeHours(x.d,x.tid,typeId,x.hours);});closeModal();save();
}
function saveBulkStreamAllocation(){
  const source=disciplineById(bulkDisciplineAllocationState.disciplineId),typeId=Number(bulkDisciplineAllocationState.typeId),lt=lessonTypeById(typeId),tid=Number($("#bulkStreamTeacher")?.value),hours=num($("#bulkStreamHours")?.value),ids=$$('[data-bulk-stream-group]').filter(x=>x.checked).map(x=>Number(x.value)).filter(Boolean);if(!source||!lt)return;if(!tid)return alert("Оберіть викладача.");if(ids.length<2)return alert("Для потоку обери щонайменше дві групи.");if(hours<=0)return alert("Вкажи кількість годин.");const errors=[];ids.forEach(id=>{const d=disciplineById(id);if(!d)return;const plan=disciplineTotalHoursById(d,typeId),other=bulkTypeOtherHours(d,typeId,tid),scheduled=scheduledLoad(d.id,tid,lt.name);if(hours+0.001<scheduled)errors.push(`${d.group}: вже виставлено ${fmtHours(scheduled)} год.`);if(other+hours>plan+0.001)errors.push(`${d.group}: разом ${fmtHours(other+hours)} год при плані ${fmtHours(plan)}.`);});if(errors.length)return alert("Не можу створити потік:\n\n"+errors.join("\n"));
  ids.forEach(id=>{const d=disciplineById(id);if(d)bulkPersistDetachTeacherStream(d,tid,typeId);});const streamId=`BLS-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,groups=ids.map(id=>disciplineById(id)?.group).filter(Boolean),stream={streamId,teacherId:tid,typeId,disciplineIds:ids,groups,hours,semester:Number(source.semester)||null,disciplineName:source.name};ids.forEach(id=>{const d=disciplineById(id);if(!d)return;bulkSetTeacherTypeHours(d,tid,typeId,hours);d.teacherStreams=d.teacherStreams||{};d.teacherStreams[String(tid)]=d.teacherStreams[String(tid)]||{};d.teacherStreams[String(tid)][String(typeId)]=clone(stream);});closeModal();save();
}

function renderDisciplines(){
  const rows=loadPageRows();
  const groups=loadPageActiveGroups(rows);

  if(!groups.length){
    $("#page-disciplines").innerHTML=`<div class="card section">
      <div class="section-head">
        <div>
          <h2>Навантаження</h2>
          <div class="small">Після додавання навчальних планів або активації кафедральних дисциплін вони з’являться тут за групами.</div>
        </div>
        <button class="primary" onclick="openDisciplineModal()">+ Додати дисципліну</button>
      </div>
      <div class="empty">Дисциплін для відображення ще немає.</div>
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
        <p>Можна працювати по групах, як раніше, або відкрити одну дисципліну й одразу розподілити її між усіма групами.</p>
      </div>
      <div class="load-head-actions"><button class="bulk-load-launch" onclick="openBulkDisciplineAllocation()"><span>⚡ ШВИДКО</span><b>Розподілити дисципліну по групах</b><small>лекції · практичні · потоки · різні викладачі</small></button><button class="primary" onclick="openDisciplineModal()">+ Додати дисципліну</button></div>
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
          <div class="load-course-block-title">${esc(courseDisplayLabel(block.course))}</div>
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
let disciplineStreamDraft=null;
let disciplinePeerLoadDraft={};
let disciplinePeerStreamDraft={};

function cloneTeacherStreams(d){return clone(d?.teacherStreams||{});}
function draftTeacherStreamsFor(d){
  if(Number(d?.id)===Number(disciplineAllocationId))return disciplineStreamDraft||{};
  if(disciplinePeerStreamDraft&&Object.prototype.hasOwnProperty.call(disciplinePeerStreamDraft,String(d?.id)))return disciplinePeerStreamDraft[String(d.id)]||{};
  return d?.teacherStreams||{};
}
function ensurePeerStreamDraft(d){
  const key=String(d.id);disciplinePeerStreamDraft=disciplinePeerStreamDraft||{};
  if(!Object.prototype.hasOwnProperty.call(disciplinePeerStreamDraft,key))disciplinePeerStreamDraft[key]=cloneTeacherStreams(d);
  return disciplinePeerStreamDraft[key];
}
function draftTeacherStreamForType(d,teacherId,typeId){
  const map=draftTeacherStreamsFor(d);
  const s=map?.[String(teacherId)]?.[String(typeId)]||map?.[teacherId]?.[typeId]||null;
  return s&&Array.isArray(s.disciplineIds)&&s.disciplineIds.length>1?s:null;
}
function setDraftTeacherStream(d,teacherId,typeId,stream){
  let root;
  if(Number(d.id)===Number(disciplineAllocationId)){
    disciplineStreamDraft=disciplineStreamDraft||{};root=disciplineStreamDraft;
  }else root=ensurePeerStreamDraft(d);
  const tid=String(teacherId),lt=String(typeId);root[tid]=root[tid]||{};
  if(stream)root[tid][lt]=clone(stream);else delete root[tid][lt];
  if(!Object.keys(root[tid]).length)delete root[tid];
}
function peerDraftLoadValue(disciplineId,teacherId,typeId){
  const v=disciplinePeerLoadDraft?.[String(disciplineId)]?.[String(teacherId)]?.[String(typeId)];
  if(v!==undefined)return num(v);
  const peer=disciplineById(disciplineId);return peer?num(explicitTeacherLoad(peer,teacherId)?.[typeId]):0;
}
function setPeerDraftLoad(disciplineId,teacherId,typeId,value){
  const did=String(disciplineId),tid=String(teacherId),lt=String(typeId);
  disciplinePeerLoadDraft[did]=disciplinePeerLoadDraft[did]||{};disciplinePeerLoadDraft[did][tid]=disciplinePeerLoadDraft[did][tid]||{};
  disciplinePeerLoadDraft[did][tid][lt]=num(value);
}
function allocationTeacherTypeDraftHours(d,teacherId,typeId){
  if(Number(d.id)===Number(disciplineAllocationId))return num(disciplineAllocationDraft?.[String(teacherId)]?.[typeId]);
  return peerDraftLoadValue(d.id,teacherId,typeId);
}

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
function cloneStudentHourAllocations(d){
  const out={};
  Object.entries(d?.teacherStudentHours||{}).forEach(([tid,byType])=>{
    Object.entries(byType||{}).forEach(([typeId,byStudent])=>{
      const clean={};
      Object.entries(byStudent||{}).forEach(([studentId,hours])=>{if(num(hours)>0)clean[String(studentId)]=num(hours);});
      out[String(tid)]=out[String(tid)]||{};
      out[String(tid)][String(typeId)]=clean;
    });
  });
  return out;
}
function studentHourAllocationSource(d){
  return (window.__disciplineDraft===d&&disciplineStudentHoursDraft!==null)
    ?disciplineStudentHoursDraft
    :(d?.teacherStudentHours||{});
}
function studentHourKeyExists(d,teacherId,typeId){
  const source=studentHourAllocationSource(d),byTeacher=source?.[String(teacherId)]||source?.[Number(teacherId)];
  return !!byTeacher&&Object.prototype.hasOwnProperty.call(byTeacher,String(typeId));
}
function draftStudentHoursKeyExists(teacherId,typeId){
  const byTeacher=disciplineStudentHoursDraft?.[String(teacherId)];
  return !!byTeacher&&Object.prototype.hasOwnProperty.call(byTeacher,String(typeId));
}
function studentHoursMapForTeacher(d,teacherId,typeId){
  const source=studentHourAllocationSource(d),byTeacher=source?.[String(teacherId)]||source?.[Number(teacherId)]||{};
  const raw=byTeacher?.[String(typeId)]||{};
  const out={};Object.entries(raw||{}).forEach(([sid,h])=>{if(num(h)>0)out[String(sid)]=num(h);});return out;
}
function assignedStudentHours(d,teacherId,typeId,studentId){return num(studentHoursMapForTeacher(d,teacherId,typeId)?.[String(studentId)]);}
function totalAssignedStudentHours(d,typeId,studentId,excludeTeacherId=null){
  const source=studentHourAllocationSource(d);let total=0;
  Object.entries(source||{}).forEach(([tid,byType])=>{if(excludeTeacherId!==null&&Number(tid)===Number(excludeTeacherId))return;total+=num(byType?.[String(typeId)]?.[String(studentId)]);});
  return total;
}
function totalTeacherStudentHours(d,teacherId,typeId){return Object.values(studentHoursMapForTeacher(d,teacherId,typeId)).reduce((a,h)=>a+num(h),0);}
function syncStudentIdsFromHourDraft(tid,typeId){
  if(!disciplineStudentHoursDraft||!disciplineStudentAllocationDraft)return;
  const map=disciplineStudentHoursDraft?.[String(tid)]?.[String(typeId)]||{};
  disciplineStudentAllocationDraft[String(tid)]=disciplineStudentAllocationDraft[String(tid)]||{};
  disciplineStudentAllocationDraft[String(tid)][String(typeId)]=Object.entries(map).filter(([,h])=>num(h)>0).map(([sid])=>Number(sid)).filter(Boolean);
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
      if(isSplitIndividualType(lt)){
        if(!draftStudentHoursKeyExists(tid,lt.id))return;
        syncStudentIdsFromHourDraft(tid,lt.id);
        disciplineAllocationDraft[tid][lt.id]=totalTeacherStudentHours(d,tid,lt.id);
        return;
      }
      // Thesis supervision remains exclusive: one student -> one supervisor.
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
  const rows=visibleTeachers().filter(t=>t.scope!=="external"&&!used.has(String(t.id)));
  return `<option value="">— обрати викладача —</option>${rows.map(t=>`<option value="${t.id}">${esc(teacherDisplay(t))}</option>`).join("")}`;
}
function perStudentAllocationStatus(d,tid,lt){
  const ids=assignedStudentIds(d,tid,lt.id);
  const unit=perStudentUnitHours(d,lt.id);
  const legacyHours=num(disciplineAllocationDraft?.[String(tid)]?.[lt.id]);
  const legacyTarget=legacyPerStudentTarget(d,tid,lt.id);
  const split=isSplitIndividualType(lt);
  const explicit=split?(persistedStudentAssignmentExists(d,tid,lt.id)||draftStudentHoursKeyExists(tid,lt.id)):(persistedStudentAssignmentExists(d,tid,lt.id)||draftStudentKeyExists(tid,lt.id));
  const hints=scheduledHintStudentIds(d,tid,lt.id);
  const total=split?totalTeacherStudentHours(d,tid,lt.id):ids.length*unit;
  return {
    ids,count:ids.length,unit,total,split,
    groupCount:groupStudentCount(d.group),
    unresolved:!explicit&&legacyHours>0,
    legacyHours,
    targetCount:legacyTarget.count,
    hintCount:hints.length,
    missing:Math.max(0,legacyTarget.count-ids.length)
  };
}
function splitIndividualBulkKey(tid,typeId){return `${String(tid)}::${String(typeId)}`;}
function splitIndividualSelectedSet(tid,typeId){
  const key=splitIndividualBulkKey(tid,typeId);
  if(!(splitIndividualBulkSelection[key] instanceof Set))splitIndividualBulkSelection[key]=new Set(splitIndividualBulkSelection[key]||[]);
  return splitIndividualBulkSelection[key];
}
function splitIndividualAllocationPickerHtml(d,tid,lt){
  const unit=perStudentUnitHours(d,lt.id),current=studentHoursMapForTeacher(d,tid,lt.id),selected=splitIndividualSelectedSet(tid,lt.id);
  return `<div class="student-hour-picker">${studentsForGroup(d.group).map(s=>{
    const own=num(current[String(s.id)]),other=totalAssignedStudentHours(d,lt.id,s.id,tid),used=scheduledStudentLoad(d.id,Number(tid),lt.name,s.id);
    const max=Math.max(used,Math.max(0,unit-other));
    const total=other+own,remaining=Math.max(0,unit-total),checked=selected.has(Number(s.id));
    return `<div class="student-hour-option ${own>0?"active":""} ${checked?"bulk-selected":""}">
      <label class="student-hour-select" title="Обрати для масового встановлення годин"><input type="checkbox" ${checked?"checked":""} onchange="toggleSplitIndividualBulkStudent(${tid},${lt.id},${s.id},this.checked)"><span>обрати</span></label>
      <div class="student-hour-copy"><b>${esc(s.name)}</b><span>План ${fmtHours(unit)} год · інші викладачі ${fmtHours(other)} · залишок ${fmtHours(remaining)}${used?` · уже в розкладі у цього викладача ${fmtHours(used)}`:""}</span></div>
      <label><span>цьому викладачу</span><input type="number" min="${fmtHours(used)}" max="${fmtHours(max)}" step="1" value="${esc(own)}" onchange="setSplitIndividualHours(${tid},${lt.id},${s.id},this.value)"></label>
    </div>`;
  }).join("")}</div>`;
}
function splitIndividualBulkToolsHtml(tid,typeId){
  const selected=splitIndividualSelectedSet(tid,typeId).size;
  return `<div class="student-hour-bulk-tools">
    <div class="student-hour-bulk-copy"><span>МАСОВЕ ПРИЗНАЧЕННЯ</span><b><strong id="splitBulkSelectedCount">${selected}</strong> студентів обрано</b><small>Задай однакову кількість годин усім позначеним студентам.</small></div>
    <label><span>Годин кожному</span><input id="splitBulkHours" type="number" min="0" step="1" placeholder="Напр. 2"></label>
    <button type="button" class="primary" onclick="applySplitIndividualBulkHours(${tid},${typeId})">Застосувати до обраних</button>
    <button type="button" class="secondary" onclick="selectSplitIndividualBulkStudents(${tid},${typeId},true)">Позначити всіх</button>
    <button type="button" class="secondary" onclick="selectSplitIndividualBulkStudents(${tid},${typeId},false)">Зняти вибір</button>
  </div>`;
}
function toggleSplitIndividualBulkStudent(tid,typeId,studentId,checked){
  const selected=splitIndividualSelectedSet(tid,typeId),sid=Number(studentId);
  if(checked)selected.add(sid);else selected.delete(sid);
  const counter=$("#splitBulkSelectedCount");if(counter)counter.textContent=selected.size;
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft,lt=lessonTypeById(typeId);
  if(d&&lt&&$("#studentLoadPicker"))$("#studentLoadPicker").innerHTML=perStudentAllocationPickerHtml(d,tid,lt);
}
function selectSplitIndividualBulkStudents(tid,typeId,on=true){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;if(!d)return;
  const selected=splitIndividualSelectedSet(tid,typeId);selected.clear();
  if(on)studentsForGroup(d.group).forEach(s=>selected.add(Number(s.id)));
  refreshPerStudentPopup(tid,typeId);
}
function applySplitIndividualBulkHours(tid,typeId){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft,lt=lessonTypeById(typeId);if(!d||!lt)return;
  const input=$("#splitBulkHours"),requested=num(input?.value),selected=splitIndividualSelectedSet(tid,typeId);
  if(!selected.size)return alert("Спочатку обери хоча б одного студента.");
  if(!input||input.value===""||requested<0)return alert("Вкажи кількість годин, яку треба поставити кожному обраному студенту.");
  const unit=perStudentUnitHours(d,typeId),blocked=[];
  selected.forEach(studentId=>{
    const s=db.students.find(x=>Number(x.id)===Number(studentId));
    const other=totalAssignedStudentHours(d,typeId,studentId,tid),used=scheduledStudentLoad(d.id,Number(tid),lt.name,studentId);
    const max=Math.max(used,Math.max(0,unit-other));
    if(requested>max+.001||requested+0.001<used)blocked.push({name:s?.name||`ID ${studentId}`,max,used});
  });
  if(blocked.length){
    const examples=blocked.slice(0,5).map(x=>`${x.name} (можна ${fmtHours(x.used)}–${fmtHours(x.max)} год)`).join("\n");
    return alert(`Однакове значення ${fmtHours(requested)} год не можна застосувати до ${blocked.length} обраних студент(ів).\n\n${examples}${blocked.length>5?`\n…і ще ${blocked.length-5}`:""}\n\nНічого не змінено.`);
  }
  const key=String(tid),typeKey=String(typeId);
  disciplineStudentHoursDraft=disciplineStudentHoursDraft||{};disciplineStudentHoursDraft[key]=disciplineStudentHoursDraft[key]||{};disciplineStudentHoursDraft[key][typeKey]=disciplineStudentHoursDraft[key][typeKey]||{};
  const map=disciplineStudentHoursDraft[key][typeKey];
  selected.forEach(studentId=>{if(requested>0)map[String(studentId)]=requested;else delete map[String(studentId)];});
  syncStudentIdsFromHourDraft(tid,typeId);syncPerStudentAllocationLoads(d);refreshPerStudentPopup(tid,typeId);
}
function perStudentAllocationPickerHtml(d,tid,lt){
  if(isSplitIndividualType(lt))return splitIndividualAllocationPickerHtml(d,tid,lt);
  const current=new Set(assignedStudentIds(d,tid,lt.id));
  return `<div class="student-load-picker">${studentsForGroup(d.group).map(s=>{
    const supervision=thesisSupervisorAssignment(d,lt,s.id,tid);
    const otherTid=supervision?.teacherId||assignedStudentTeacherId(d,lt.id,s.id,tid);
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
          ?`уже має керівника: ${esc(teacherDisplay(other))}`
          :checked
            ?`${fmtHours(perStudentUnitHours(d,lt.id))} год на студента${used?` · уже виставлено ${fmtHours(used)} год`:""}`
            :thesisKindForType(lt)?"без керівника":"вільний для розподілу"}</span>
      </div>
      <strong>${other?"—":checked?"✓":"+"}</strong>
    </button>`;
  }).join("")}</div>`;
}
function setSplitIndividualHours(tid,typeId,studentId,value){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft,lt=lessonTypeById(typeId);if(!d||!lt)return;
  const key=String(tid),typeKey=String(typeId),studentKey=String(studentId),unit=perStudentUnitHours(d,typeId);
  disciplineStudentHoursDraft=disciplineStudentHoursDraft||{};
  disciplineStudentHoursDraft[key]=disciplineStudentHoursDraft[key]||{};
  disciplineStudentHoursDraft[key][typeKey]=disciplineStudentHoursDraft[key][typeKey]||{};
  const other=totalAssignedStudentHours(d,typeId,studentId,tid),used=scheduledStudentLoad(d.id,Number(tid),lt.name,studentId);
  const max=Math.max(used,Math.max(0,unit-other)),requested=num(value);
  if(requested>0)splitIndividualSelectedSet(tid,typeId).add(Number(studentId));
  if(requested>max+.001){alert(`Цьому студенту можна дати цьому викладачу максимум ${fmtHours(max)} год. Загальний план на студента — ${fmtHours(unit)} год.`);disciplineStudentHoursDraft[key][typeKey][studentKey]=Math.max(used,Math.min(max,num(disciplineStudentHoursDraft[key][typeKey][studentKey])));}
  else if(requested+0.001<used){alert(`Не можна зменшити нижче ${fmtHours(used)} год: стільки вже виставлено цьому студенту в розкладі.`);disciplineStudentHoursDraft[key][typeKey][studentKey]=used;}
  else if(requested>0)disciplineStudentHoursDraft[key][typeKey][studentKey]=requested;
  else delete disciplineStudentHoursDraft[key][typeKey][studentKey];
  syncStudentIdsFromHourDraft(tid,typeId);syncPerStudentAllocationLoads(d);refreshPerStudentPopup(tid,typeId);
}
function openPerStudentAllocationPopup(tid,typeId){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;
  const lt=lessonTypeById(typeId),t=teacherById(Number(tid));
  if(!d||!lt||!t)return;
  if(!thesisTypeApplicable(d,lt)){
    if(isBachelorThesisType(lt))return alert("Керівництво бакалаврською роботою можна призначати тільки студентам 4 курсу бакалаврату.");
    if(isMasterThesisType(lt))return alert("Керівництво магістерською роботою можна призначати тільки студентам магістратури.");
  }
  captureAllocationDraft();

  disciplineStudentAllocationDraft=disciplineStudentAllocationDraft||{};
  disciplineStudentAllocationDraft[String(tid)]=disciplineStudentAllocationDraft[String(tid)]||{};
  disciplineStudentHoursDraft=disciplineStudentHoursDraft||{};
  disciplineStudentHoursDraft[String(tid)]=disciplineStudentHoursDraft[String(tid)]||{};

  if(isSplitIndividualType(lt)){
    splitIndividualBulkSelection[splitIndividualBulkKey(tid,typeId)]=new Set(assignedStudentIds(d,tid,typeId).map(Number));
    if(!Object.prototype.hasOwnProperty.call(disciplineStudentHoursDraft[String(tid)],String(typeId))){
      const existingHours=studentHoursMapForTeacher(d,tid,typeId),map={...existingHours};
      if(!Object.keys(map).length){
        const unit=perStudentUnitHours(d,typeId);
        scheduledHintStudentIds(d,tid,typeId).forEach(studentId=>{const used=scheduledStudentLoad(d.id,Number(tid),lt.name,studentId);if(used>0)map[String(studentId)]=Math.min(unit,used);});
      }
      disciplineStudentHoursDraft[String(tid)][String(typeId)]=map;
      syncStudentIdsFromHourDraft(tid,typeId);
    }
  }else if(!Object.prototype.hasOwnProperty.call(disciplineStudentAllocationDraft[String(tid)],String(typeId))){
    // Thesis supervision: existing appointments are a useful preselection, but the final assignment stays exclusive.
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
        <span>${s.split?"план на одного студента":"на одного студента"}</span>
      </div>
    </div>

    <div class="student-load-popup-tools">
      <div><b id="studentLoadSelectedCount">${s.count}</b><span>обрано з ${s.groupCount}</span></div>
      <div><b id="studentLoadTotalHours">${fmtHours(s.total)} год</b><span>навантаження викладача</span></div>
      <button type="button" class="secondary" onclick="selectAllAvailablePerStudent(${tid},${typeId})">${s.split?"Взяти весь вільний залишок":"Обрати всіх вільних"}</button>
      <button type="button" class="secondary" onclick="clearPerStudentAllocation(${tid},${typeId})">Очистити</button>
    </div>

    ${s.split?splitIndividualBulkToolsHtml(tid,typeId):""}

    ${s.legacyHours>0?`<div class="student-load-target" id="studentLoadTarget">
      <div>
        <span>ПОПЕРЕДНЄ НАВАНТАЖЕННЯ</span>
        <b>${s.split?`${fmtHours(s.legacyHours)} год треба розкласти між студентами`:`${fmtHours(s.legacyHours)} год = приблизно ${s.targetCount} студент(ів)`}</b>
      </div>
      <p>${s.split
        ?`Раніше було збережено лише загальну кількість годин викладача. Тепер вкажи, скільки годин він має у кожного студента; одного студента можна поділити між кількома викладачами.`
        :s.hintCount
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
  if($("#splitBulkSelectedCount"))$("#splitBulkSelectedCount").textContent=splitIndividualSelectedSet(tid,typeId).size;
  const target=$("#studentLoadTarget");
  if(target&&s.legacyHours>0){
    const p=target.querySelector("p");
    if(p)p.innerHTML=s.split
      ?`Зараз цьому викладачу розподілено <b>${fmtHours(s.total)} год</b> між ${s.count} студент(ами). Попередньо було ${fmtHours(s.legacyHours)} год.`
      :s.missing
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
    const supervision=thesisSupervisorAssignment(d,lt,studentId,tid);
    const other=supervision?.teacherId||assignedStudentTeacherId(d,typeId,studentId,tid);
    if(other)return alert(`Студент уже має керівника: ${teacherDisplay(teacherById(other))}. Спочатку зніми попереднє закріплення.`);
    arr.push(Number(studentId));
  }

  syncPerStudentAllocationLoads(d);
  refreshPerStudentPopup(tid,typeId);
}
function selectAllAvailablePerStudent(tid,typeId){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;
  if(!d)return;
  const key=String(tid),typeKey=String(typeId),lt=lessonTypeById(typeId);
  if(isSplitIndividualType(lt)){
    disciplineStudentHoursDraft=disciplineStudentHoursDraft||{};disciplineStudentHoursDraft[key]=disciplineStudentHoursDraft[key]||{};disciplineStudentHoursDraft[key][typeKey]=disciplineStudentHoursDraft[key][typeKey]||{};
    const map=disciplineStudentHoursDraft[key][typeKey],unit=perStudentUnitHours(d,typeId);
    studentsForGroup(d.group).forEach(s=>{const other=totalAssignedStudentHours(d,typeId,s.id,tid),used=scheduledStudentLoad(d.id,Number(tid),lt.name,s.id),max=Math.max(used,Math.max(0,unit-other));if(max>0)map[String(s.id)]=max;else delete map[String(s.id)];});
    syncStudentIdsFromHourDraft(tid,typeId);syncPerStudentAllocationLoads(d);refreshPerStudentPopup(tid,typeId);return;
  }
  const arr=new Set(disciplineStudentAllocationDraft[key][typeKey]||[]);
  studentsForGroup(d.group).forEach(s=>{
    if(!assignedStudentTeacherId(d,typeId,s.id,tid)&&!thesisSupervisorAssignment(d,lt,s.id,tid))arr.add(Number(s.id));
  });
  disciplineStudentAllocationDraft[key][typeKey]=[...arr];
  syncPerStudentAllocationLoads(d);
  refreshPerStudentPopup(tid,typeId);
}
function clearPerStudentAllocation(tid,typeId){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft,lt=lessonTypeById(typeId);
  if(!d||!lt)return;
  if(isSplitIndividualType(lt)){
    const key=String(tid),typeKey=String(typeId),map={};let locked=0;
    studentsForGroup(d.group).forEach(s=>{const used=scheduledStudentLoad(d.id,Number(tid),lt.name,s.id);if(used>0){map[String(s.id)]=used;locked++;}});
    disciplineStudentHoursDraft=disciplineStudentHoursDraft||{};disciplineStudentHoursDraft[key]=disciplineStudentHoursDraft[key]||{};disciplineStudentHoursDraft[key][typeKey]=map;
    syncStudentIdsFromHourDraft(tid,typeId);syncPerStudentAllocationLoads(d);refreshPerStudentPopup(tid,typeId);
    if(locked)alert(`${locked} студент(ів) залишено з мінімальними годинами, бо для них уже є заняття в розкладі.`);return;
  }
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
  const currentIds=assignedStudentIds(d,tid,lt.id);
  const hourMap=isSplitIndividualType(lt)?studentHoursMapForTeacher(d,tid,lt.id):{};
  const names=currentIds
    .map(id=>{const name=db.students.find(x=>Number(x.id)===Number(id))?.name;if(!name)return null;return {name,hours:num(hourMap[String(id)])};})
    .filter(Boolean);

  return `<div class="per-student-allocation-card ${s.unresolved?"unresolved":""}">
    <div class="per-student-allocation-copy">
      <b>${esc(lt.name)}</b>
      ${s.unresolved
        ?`<span><strong>${fmtHours(s.legacyHours)} год</strong> зі старого розподілу</span><small>Потрібно один раз розкласти години на конкретних студентів.</small>`
        :s.split
          ?`<span>${s.count} студентів · <strong>${fmtHours(s.total)} год</strong> цьому викладачу</span><small>Години одного студента можна ділити між кількома викладачами. План на студента: ${fmtHours(s.unit)} год.</small>`
          :`<span>${fmtHours(s.unit)} год × ${s.count} студентів = <strong>${fmtHours(s.total)} год</strong></span><small>${s.count?`${s.count} із ${s.groupCount} студентів закріплено`:"Студентів ще не закріплено"}</small>`}
    </div>

    ${names.length?`<div class="per-student-assigned-preview">
      <span>${s.split?"РОЗПОДІЛ ГОДИН":"ЗАКРІПЛЕНІ"}</span>
      <div>${names.slice(0,5).map(n=>`<b>${esc(n.name)}${s.split?` · ${fmtHours(n.hours)} год`:""}</b>`).join("")}${names.length>5?`<strong>+${names.length-5}</strong>`:""}</div>
    </div>`:""}

    <button type="button" class="${s.unresolved?"primary":"secondary"}" onclick="openPerStudentAllocationPopup(${tid},${lt.id})">
      ${s.unresolved?(s.split?"Розподілити години":"Закріпити студентів"):s.count?(s.split?"Змінити години":"Змінити студентів"):(s.split?"Розподілити години":"Обрати студентів")}
    </button>
  </div>`;
}


function allocationStreamCandidates(d){
  return db.disciplines.filter(x=>x.status!=="archived"&&disciplineProgramId(x)===disciplineProgramId(d)&&normIdentity(x.name)===normIdentity(d.name)&&Number(x.semester)===Number(d.semester))
    .sort((a,b)=>Number(a.course||99)-Number(b.course||99)||String(a.group).localeCompare(String(b.group),"uk"));
}
function allocationOtherTeacherHours(peer,teacherId,typeId){
  const peerDraft=disciplinePeerLoadDraft?.[String(peer.id)]||{};
  const tids=new Set([...Object.keys(peer.teacherLoads||{}),...Object.keys(peerDraft)]);let total=0;
  tids.forEach(tid=>{if(Number(tid)===Number(teacherId))return;const v=peerDraft?.[String(tid)]?.[String(typeId)];total+=v!==undefined?num(v):num(explicitTeacherLoad(peer,tid)?.[typeId]);});
  return total;
}
function allocationStreamCandidateStatus(source,peer,teacherId,typeId,sourceHours){
  const plan=disciplineTotalHoursById(peer,typeId),other=allocationOtherTeacherHours(peer,teacherId,typeId);
  const lt=lessonTypeById(typeId),already=lt?scheduledLoad(peer.id,teacherId,lt.name):0;
  if(Number(peer.id)===Number(source.id))return {enabled:true,primary:true,title:"Основна група",detail:`${fmtHours(sourceHours)} год`};
  const sourceStream=draftTeacherStreamForType(source,teacherId,typeId);
  const peerStream=draftTeacherStreamForType(peer,teacherId,typeId);
  if(peerStream&&(!sourceStream||String(peerStream.streamId)!==String(sourceStream.streamId))){
    return {enabled:false,primary:false,title:"Уже входить в інший потік",detail:teacherStreamLabel(peerStream)};
  }
  if(sourceHours<=0)return {enabled:false,primary:false,title:"Спочатку розподіли години",detail:"У поточній групі стоїть 0 год"};
  if(plan+0.001<sourceHours)return {enabled:false,primary:false,title:"Замало годин у плані",detail:`План ${fmtHours(plan)} год, потрібно ${fmtHours(sourceHours)}`};
  if(other+sourceHours>plan+0.001)return {enabled:false,primary:false,title:"Частина годин уже в іншого викладача",detail:`Іншим розподілено ${fmtHours(other)} із ${fmtHours(plan)} год`};
  if(already>sourceHours+.001)return {enabled:false,primary:false,title:"Уже виставлено більше годин",detail:`У розкладі ${fmtHours(already)} год`};
  return {enabled:true,primary:false,title:"Можна додати до потоку",detail:`${fmtHours(sourceHours)} год автоматично отримає цей самий викладач`};
}
function allocationStreamControlHtml(d,tid,lt){
  if(isPerStudentTypeId(lt.id))return"";
  const s=draftTeacherStreamForType(d,tid,lt.id),groups=s?(s.disciplineIds||[]).map(id=>disciplineById(id)?.group).filter(Boolean):[d.group];
  return `<button type="button" class="allocation-stream-control ${s?"active":""}" onclick="openAllocationStreamPopup(${d.id},${tid},${lt.id})"><span>${s?"ПОТІК":"РОЗКЛАД ГРУП"}</span><b>${s?esc(groups.join(" + ")):esc(`Окремо · ${d.group}`)}</b><small>${s?"Одна реальна пара для цих груп":"Натисни, якщо цей вид занять треба читати потоком"}</small></button>`;
}
function openAllocationStreamPopup(disciplineId,teacherId,typeId){
  const d=disciplineById(disciplineId)||window.__disciplineDraft,t=teacherById(teacherId),lt=lessonTypeById(typeId);if(!d||!t||!lt)return;
  captureAllocationDraft();const hours=allocationTeacherTypeDraftHours(d,teacherId,typeId),existing=draftTeacherStreamForType(d,teacherId,typeId);
  const selected=new Set((existing?.disciplineIds||[d.id]).map(Number));selected.add(Number(d.id));
  openPlannerActionModal(`<div class="allocation-stream-popup"><div class="allocation-stream-popup-head"><div><span>ПОТІК НА ЕТАПІ НАВАНТАЖЕННЯ</span><h2>${esc(lt.name)}</h2><p>${esc(d.name)} · ${esc(teacherDisplay(t))}</p></div><div class="allocation-stream-hours"><b>${fmtHours(hours)} год</b><span>для цього викладача</span></div></div><div class="allocation-stream-explainer"><b>Це правило для всього семестру.</b><span>Лекції можуть бути потоковими, а практичні — окремими. Під час постановки дат система вже сама підставить потрібні групи.</span></div>${hours<=0?`<div class="conflict">Спочатку введи години «${esc(lt.name)}» для цього викладача.</div>`:""}<div class="allocation-stream-groups">${allocationStreamCandidates(d).map(peer=>{const st=allocationStreamCandidateStatus(d,peer,teacherId,typeId,hours),checked=selected.has(Number(peer.id));return `<label class="allocation-stream-group ${st.primary?"primary":st.enabled?"ready":"blocked"} ${checked&&st.enabled?"active":""}"><input type="checkbox" data-load-stream-peer value="${peer.id}" ${checked?"checked":""} ${st.primary||!st.enabled?"disabled":""}><div class="allocation-stream-group-main"><div><b>${esc(peer.group)}</b><span>${esc(courseDisplayLabel(peer.course||groupCourse(peer.group)))} · ${esc(peer.semester)} семестр</span></div><strong>${st.primary?"ОСНОВНА":st.enabled?"МОЖНА":"НЕ МОЖНА"}</strong></div><small>${esc(st.title)} · ${esc(st.detail)}</small></label>`;}).join("")}</div><div id="allocationStreamResult" class="allocation-stream-result"></div><div class="planner-popup-footer"><button type="button" class="secondary" onclick="closePlannerActionModal()">Скасувати</button><button type="button" class="primary" ${hours<=0?"disabled":""} onclick="applyAllocationStream(${d.id},${teacherId},${typeId})">Застосувати схему</button></div></div>`,true);
  $$('[data-load-stream-peer]').forEach(x=>x.onchange=refreshAllocationStreamPopupResult);refreshAllocationStreamPopupResult();
}
function refreshAllocationStreamPopupResult(){
  const ids=$$('[data-load-stream-peer]').filter(x=>x.checked).map(x=>Number(x.value)),groups=ids.map(id=>disciplineById(id)?.group).filter(Boolean),box=$("#allocationStreamResult");if(!box)return;
  box.innerHTML=groups.length>1?`<span>БУДЕ ПОТІК</span><b>${esc(groups.join(" + "))}</b>`:`<span>БУДЕ ОКРЕМО</span><b>${esc(groups[0]||"")}</b>`;
}
function applyAllocationStream(disciplineId,teacherId,typeId){
  const d=disciplineById(disciplineId)||window.__disciplineDraft,lt=lessonTypeById(typeId);if(!d||!lt)return;captureAllocationDraft();
  const hours=allocationTeacherTypeDraftHours(d,teacherId,typeId);if(hours<=0)return alert("Спочатку розподіли години цьому викладачу.");
  const ids=[Number(d.id),...$$('[data-load-stream-peer]').filter(x=>x.checked&&!x.disabled).map(x=>Number(x.value))].filter(Boolean),uniqueIds=[...new Set(ids)];
  const invalid=[];uniqueIds.forEach(id=>{const peer=disciplineById(id);if(!peer)return;const st=allocationStreamCandidateStatus(d,peer,teacherId,typeId,hours);if(!st.enabled)invalid.push(`${peer.group}: ${st.title}`);});if(invalid.length)return alert("Не можу створити потік:\n\n"+invalid.join("\n"));
  const old=draftTeacherStreamForType(d,teacherId,typeId),oldIds=(old?.disciplineIds||[d.id]).map(Number),streamId=old?.streamId||`LS-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  const allIds=[...new Set([...oldIds,...uniqueIds])];
  if(uniqueIds.length>1){
    const stream={streamId,teacherId:Number(teacherId),typeId:Number(typeId),disciplineIds:uniqueIds,groups:uniqueIds.map(id=>disciplineById(id)?.group).filter(Boolean),hours,semester:Number(d.semester)||null,disciplineName:d.name};
    allIds.forEach(id=>{const peer=disciplineById(id);if(!peer)return;setDraftTeacherStream(peer,teacherId,typeId,uniqueIds.includes(id)?stream:null);});
    uniqueIds.forEach(id=>{if(Number(id)!==Number(d.id))setPeerDraftLoad(id,teacherId,typeId,hours);});
  }else allIds.forEach(id=>{const peer=disciplineById(id);if(peer)setDraftTeacherStream(peer,teacherId,typeId,null);});
  closePlannerActionModal();renderAllocationEditor(d);
}
function validateStreamDraft(d){
  const errors=[];
  const maps=[
    {d,streams:disciplineStreamDraft||{}},
    ...Object.entries(disciplinePeerStreamDraft||{}).map(([id,streams])=>({d:disciplineById(Number(id)),streams}))
  ];
  const seen=new Set();

  maps.forEach(({d:peer,streams})=>{
    if(!peer)return;
    Object.entries(streams||{}).forEach(([tid,byType])=>{
      Object.entries(byType||{}).forEach(([typeId,stream])=>{
        if(!stream||!(stream.disciplineIds||[]).length)return;
        const key=String(stream.streamId||`${tid}:${typeId}:${(stream.disciplineIds||[]).join(',')}`);
        if(seen.has(key))return;
        seen.add(key);
        const lt=lessonTypeById(typeId);

        (stream.disciplineIds||[]).forEach(id=>{
          const member=disciplineById(id);
          if(!member){
            errors.push(`Потік ${lt?.name||""}: дисципліну видалено.`);
            return;
          }
          const actual=Number(member.id)===Number(d.id)
            ?allocationTeacherTypeDraftHours(d,tid,typeId)
            :peerDraftLoadValue(member.id,tid,typeId);
          if(Math.abs(actual-num(stream.hours))>.001){
            errors.push(`${lt?.name||"Вид"} · ${member.group}: для потоку має бути ${fmtHours(stream.hours)} год у цього викладача, зараз ${fmtHours(actual)}.`);
          }
        });
      });
    });
  });
  return errors;
}

function applyPeerAllocationDrafts(){
  Object.entries(disciplinePeerLoadDraft||{}).forEach(([did,byTeacher])=>{const peer=disciplineById(Number(did));if(!peer)return;peer.teacherLoads=peer.teacherLoads||{};peer.teacherIds=peer.teacherIds||[];Object.entries(byTeacher||{}).forEach(([tid,byType])=>{peer.teacherLoads[String(tid)]=peer.teacherLoads[String(tid)]||{};Object.entries(byType||{}).forEach(([typeId,v])=>peer.teacherLoads[String(tid)][String(typeId)]=num(v));if(Object.values(peer.teacherLoads[String(tid)]).some(v=>num(v)>0))peer.teacherIds=[...new Set([...peer.teacherIds.map(Number),Number(tid)])];});});
  Object.entries(disciplinePeerStreamDraft||{}).forEach(([did,streams])=>{const peer=disciplineById(Number(did));if(peer)peer.teacherStreams=clone(streams||{});});
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
        return `<div class="allocation-type-with-stream"><label>${esc(lt.name)}<input data-allocation-hour data-type="${lt.id}" type="number" min="${fmtHours(used)}" step="0.01" value="${esc(load[lt.id]||0)}"><span class="small">план дисципліни ${fmtHours(disciplineTotalHoursById(d,lt.id))}${disciplineExtraHoursById(d,lt.id)?` · з них додатково ${fmtHours(disciplineExtraHoursById(d,lt.id))}`:""}${used?` · вже в розкладі ${fmtHours(used)}`:""}</span></label>${d.id?allocationStreamControlHtml(d,Number(tid),lt):""}</div>`;
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
  disciplineStudentHoursDraft=disciplineStudentHoursDraft||{};
  disciplineStudentHoursDraft[String(tid)]=disciplineStudentHoursDraft[String(tid)]||{};
  renderAllocationEditor(disciplineById(disciplineAllocationId)||window.__disciplineDraft);
}
function removeAllocationTeacher(tid){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;if(!d)return;
  captureAllocationDraft();
  const scheduled=db.lessonTypes.reduce((a,lt)=>a+scheduledLoad(d.id,Number(tid),lt.name),0);
  if(scheduled>0)return alert(`Цього викладача не можна прибрати: у розкладі вже виставлено ${fmtHours(scheduled)} год. Спочатку перенеси або видали ці заняття.`);
  const streams=db.lessonTypes.map(lt=>draftTeacherStreamForType(d,tid,lt.id)).filter(Boolean);if(streams.length)return alert(`Цей викладач має потокове навантаження. Спочатку відкрий відповідний вид занять і поверни його в режим «Окремо».`);
  delete disciplineAllocationDraft[String(tid)];if(disciplineStudentAllocationDraft)delete disciplineStudentAllocationDraft[String(tid)];if(disciplineStudentHoursDraft)delete disciplineStudentHoursDraft[String(tid)];renderAllocationEditor(d);
}
function fillTeacherWithRemaining(tid){
  const d=disciplineById(disciplineAllocationId)||window.__disciplineDraft;if(!d)return;
  captureAllocationDraft();
  const key=String(tid);disciplineAllocationDraft[key]=disciplineAllocationDraft[key]||{};
  disciplinePlannedTypes(d).forEach(lt=>{
    if(isPerStudentTypeId(lt.id)){
      disciplineStudentAllocationDraft=disciplineStudentAllocationDraft||{};
      disciplineStudentAllocationDraft[key]=disciplineStudentAllocationDraft[key]||{};
      if(isSplitIndividualType(lt)){
        disciplineStudentHoursDraft=disciplineStudentHoursDraft||{};disciplineStudentHoursDraft[key]=disciplineStudentHoursDraft[key]||{};disciplineStudentHoursDraft[key][String(lt.id)]=disciplineStudentHoursDraft[key][String(lt.id)]||{};
        const map=disciplineStudentHoursDraft[key][String(lt.id)],unit=perStudentUnitHours(d,lt.id);
        studentsForGroup(d.group).forEach(s=>{const other=totalAssignedStudentHours(d,lt.id,s.id,tid),used=scheduledStudentLoad(d.id,Number(tid),lt.name,s.id),max=Math.max(used,Math.max(0,unit-other));if(max>0)map[String(s.id)]=max;});
        syncStudentIdsFromHourDraft(tid,lt.id);
      }else{
        const selected=new Set(disciplineStudentAllocationDraft[key][String(lt.id)]||[]);
        studentsForGroup(d.group).forEach(s=>{if(!assignedStudentTeacherId(d,lt.id,s.id,tid))selected.add(Number(s.id));});
        disciplineStudentAllocationDraft[key][String(lt.id)]=[...selected];
      }
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
    if(isSplitIndividualType(lt)){
      Object.entries(disciplineAllocationDraft||{}).forEach(([tid,load])=>{
        if(num(load?.[lt.id])>0&&!draftStudentHoursKeyExists(tid,lt.id))errors.push(`${teacherDisplay(teacherById(Number(tid)))} · ${lt.name}: години розподілені, але не вказано, скільки годин припадає на конкретних студентів.`);
      });
      const unit=perStudentUnitHours(d,lt.id);
      studentsForGroup(d.group).forEach(student=>{
        const total=totalAssignedStudentHours(d,lt.id,student.id);
        if(total>unit+.001)errors.push(`${lt.name}: студент ${student.name} має ${fmtHours(total)} год при плані ${fmtHours(unit)} год.`);
      });
      Object.entries(disciplineStudentHoursDraft||{}).forEach(([tid,byType])=>{
        Object.entries(byType?.[String(lt.id)]||{}).forEach(([studentId,hours])=>{
          const used=scheduledStudentLoad(d.id,Number(tid),lt.name,Number(studentId));
          if(num(hours)+.001<used){const st=db.students.find(x=>Number(x.id)===Number(studentId));errors.push(`${teacherDisplay(teacherById(Number(tid)))} · ${st?.name||studentId}: у розкладі вже ${fmtHours(used)} год, тому індивідуальне навантаження не можна зменшити до ${fmtHours(hours)}.`);}
        });
      });
      return;
    }
    // Qualification papers remain exclusive: one student can have only one supervisor.
    const seen=new Map();
    Object.entries(disciplineAllocationDraft||{}).forEach(([tid,load])=>{
      if(num(load?.[lt.id])>0&&!draftStudentKeyExists(tid,lt.id))errors.push(`${teacherDisplay(teacherById(Number(tid)))} · ${lt.name}: години розподілені, але не вказані конкретні студенти.`);
    });
    Object.entries(disciplineStudentAllocationDraft||{}).forEach(([tid,byType])=>{
      (byType?.[String(lt.id)]||[]).forEach(studentId=>{
        const old=seen.get(Number(studentId));
        if(old&&Number(old)!==Number(tid)){
          const st=db.students.find(x=>Number(x.id)===Number(studentId));
          errors.push(`${lt.name}: студент ${st?.name||studentId} закріплений одразу за двома викладачами.`);
        }else seen.set(Number(studentId),Number(tid));
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
  const d=id?disciplineById(id):{id:null,name:"",course:"",group:"",semester:db.semester,academicYear:db.academicYear,teacherIds:[],teacherLoads:{},teacherStudentLoads:{},teacherStudentHours:{},audienceMode:"group",selectedStudentIds:[],controlForm:"Немає",color:"#8b5cf6",hours:{},note:"",status:"active"};
  const fromPlan=!!d.sourceCurriculumId,lock=fromPlan?'disabled':'',ro=fromPlan?'readonly':'';
  disciplineAllocationId=id;window.__disciplineDraft=d;disciplineAllocationDraft=cloneAllocationLoads(d);
  disciplineStudentAllocationDraft=cloneStudentAllocationLoads(d);
  disciplineStudentHoursDraft=cloneStudentHourAllocations(d);
  disciplineExtraDraft=clone(d.extraHours||{});
  disciplineStreamDraft=cloneTeacherStreams(d);disciplinePeerLoadDraft={};disciplinePeerStreamDraft={};
  syncPerStudentAllocationLoads(d);
  const hours=db.lessonTypes.map(t=>`<label>${esc(t.name)}<input class="dh" data-type="${t.id}" type="number" min="0" step="0.01" value="${esc(d.hours?.[t.id]||0)}" ${ro}></label>`).join("");
  openModal(`<h2>${id?"Навантаження дисципліни":"Нова дисципліна кафедри"}</h2>${fromPlan?`<div class="notice success-notice"><b>${esc(d.name)}</b> створена з робочого плану. Базові години плану не змінюються; додаткові види занять можна додати окремо нижче.</div>`:""}<form id="df" class="form-grid">
    <label class="wide">Назва дисципліни<input id="dn" value="${esc(d.name)}" required ${ro}></label>
    <label>Група<select id="dg" ${lock}><option value="">—</option>${groupOptions(d.group)}</select></label>
    <label>Курс<select id="dc" ${lock}><option value="">—</option>${[1,2,3,4,5,6].map(x=>`<option value="${x}" ${Number(d.course)===x?"selected":""}>${esc(courseDisplayLabel(x))}</option>`).join("")}</select></label>
    <label>Семестр<select id="ds" ${lock}>${[1,2,3,4,5,6,7,8,9,10].map(x=>`<option ${Number(d.semester)===x?"selected":""}>${x}</option>`).join("")}</select><small>Рік для дат визначається автоматично за семестром.</small></label>
    <label>Форма контролю<select id="dctrl" ${lock}>${db.controlForms.map(v=>`<option ${v===d.controlForm?"selected":""}>${esc(v)}</option>`).join("")}</select></label>
    <label>Колір<input id="dcolor" type="color" value="${esc(d.color||"#8b5cf6")}"></label>
    <div class="wide"><b>Години за робочим планом</b><div class="hours-grid" style="margin-top:8px">${hours}</div></div>
    <div class="wide extra-hours-section"><div class="section-head compact"><div><b>Додаткові види занять</b><div class="small">Додавай години, яких немає у вихідному плані — наприклад індивідуальні або консультації. Вони входять у навантаження, але не змінюють сам робочий план.</div></div></div><div id="disciplineExtraHours"></div><div class="extra-hours-add"><select id="disciplineExtraTypePicker"><option value="">— обрати вид занять —</option>${db.lessonTypes.map(lt=>`<option value="${lt.id}">${esc(lt.name)}</option>`).join("")}</select><input id="disciplineExtraTypeHours" type="number" min="0" step="0.01" placeholder="години"><button type="button" class="primary-inline" id="disciplineExtraTypeAdd">+ Додати вид занять</button></div></div>
    ${id?`<div class="wide discipline-audience-modal-entry"><div><span>Хто слухає дисципліну</span><b>${esc(disciplineAudienceLabel(d))}</b><small>${disciplineAudienceMode(d)==="selected"?"Конфлікти рахуються по конкретних студентах.":"Зараз пара займає всю групу."}</small></div><button type="button" class="secondary" onclick="openDisciplineAudienceModal(${id})">👥 Налаштувати склад</button></div>`:""}
    <div class="wide allocation-section">
      <div class="section-head compact"><div><b>Розподіл між викладачами</b><div class="small">Додавай викладачів по одному. Можна зберігати частковий розподіл і повернутися до нього пізніше.</div></div></div>
      <div id="allocationSummary"></div>
      <div id="teacherAllocation"></div>
      <div class="allocation-add-teacher"><select id="allocationTeacherPicker"></select><button type="button" class="primary-inline" id="allocationAddTeacher">+ Додати викладача</button></div>
    </div>
    <label class="wide">Примітка<textarea id="dnote" rows="3">${esc(d.note||"")}</textarea></label>
    <div class="wide entity-form-actions"><button class="primary">Зберегти навантаження</button>${id?`<button type="button" class="danger entity-delete-btn" onclick="deleteDiscipline(${id})">Видалити дисципліну</button>`:""}</div>
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
    const errors=[...validateAllocationDraft(d),...validateStreamDraft(d)];if(errors.length)return alert("Перевір розподіл:\n\n"+errors.join("\n"));
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

    const teacherStudentHours={};
    Object.entries(disciplineStudentHoursDraft||{}).forEach(([tid,byType])=>{
      const cleanTypes={};Object.entries(byType||{}).forEach(([typeId,byStudent])=>{const clean={};Object.entries(byStudent||{}).forEach(([sid,h])=>{if(num(h)>0)clean[String(sid)]=num(h);});if(Object.keys(clean).length||draftStudentHoursKeyExists(tid,typeId))cleanTypes[String(typeId)]=clean;});if(Object.keys(cleanTypes).length)teacherStudentHours[String(tid)]=cleanTypes;
    });
    const extraHours={};Object.entries(disciplineExtraDraft||{}).forEach(([k,v])=>{if(num(v)>0)extraHours[k]=num(v);});
    const obj=fromPlan
      ?{teacherIds:ids,teacherLoads,teacherStudentLoads,teacherStudentHours,teacherStreams:clone(disciplineStreamDraft||{}),audienceMode:disciplineAudienceMode(d),selectedStudentIds:disciplineSelectedStudentIds(d),extraHours,color:$("#dcolor").value,note:$("#dnote").value.trim(),status:"active"}
      :{name:$("#dn").value.trim(),group:$("#dg").value,programId:db.groups.find(g=>g.code===$("#dg").value)?.programId||activeProgramId(),course:+$("#dc").value||"",academicYear:d.academicYear||db.academicYear,semester:+$("#ds").value,teacherIds:ids,teacherLoads,teacherStudentLoads,teacherStudentHours,teacherStreams:clone(disciplineStreamDraft||{}),audienceMode:disciplineAudienceMode(d),selectedStudentIds:disciplineSelectedStudentIds(d),extraHours,controlForm:$("#dctrl").value,color:$("#dcolor").value,hours:hs,note:$("#dnote").value.trim(),status:"active"};
    if(id)Object.assign(d,obj);else db.disciplines.push({id:uid(db.disciplines),...obj});
    applyPeerAllocationDrafts();
    disciplineAllocationId=null;disciplineAllocationDraft={};disciplineStudentAllocationDraft=null;disciplineStudentHoursDraft=null;disciplineExtraDraft=null;disciplineStreamDraft=null;disciplinePeerLoadDraft={};disciplinePeerStreamDraft={};delete window.__disciplineDraft;closeModal();save();
  };
}


function disciplineAudienceStudentsHtml(d){
  const selected=new Set(disciplineSelectedStudentIds(d)),students=activeStudentsForGroup(d.group);
  return students.map(s=>`<label class="selective-student-row ${selected.has(Number(s.id))?"selected":""}"><input type="checkbox" data-selective-student value="${s.id}" ${selected.has(Number(s.id))?"checked":""}><span class="selective-student-check">✓</span><div><b>${esc(s.name)}</b><small>${esc(s.group)}</small></div></label>`).join("");
}
function selectiveAudienceCountUpdate(){const checks=$$("[data-selective-student]"),n=checks.filter(x=>x.checked).length,total=checks.length,count=$("#selectiveAudienceCount");if(count)count.innerHTML=`<b>${n}</b><span>із ${total}</span>`;checks.forEach(x=>x.closest(".selective-student-row")?.classList.toggle("selected",x.checked));}
function setSelectiveAudienceMode(mode){const selected=mode==="selected";$("#audienceModeGroup")?.classList.toggle("active",!selected);$("#audienceModeSelected")?.classList.toggle("active",selected);$("#selectiveStudentPicker")?.classList.toggle("disabled",!selected);if($("#selectiveAudienceMode"))$("#selectiveAudienceMode").value=selected?"selected":"group";}
function setAllSelectiveStudents(value){$$("[data-selective-student]").forEach(x=>x.checked=!!value);selectiveAudienceCountUpdate();}
function filterSelectiveStudents(value){const key=normIdentity(value);$$(".selective-student-row").forEach(row=>row.style.display=!key||normIdentity(row.innerText).includes(key)?"":"none");}
function openDisciplineAudienceModal(id){
  const d=disciplineById(id);if(!d)return;const total=activeStudentsForGroup(d.group).length,selected=disciplineSelectedStudentIds(d).length;
  openModal(`<div class="selective-audience-modal"><div class="selective-audience-hero"><div><span>СКЛАД ДИСЦИПЛІНИ</span><h2>${esc(d.name)}</h2><p>${esc(d.group)} · ${esc(d.semester)} семестр</p></div><div id="selectiveAudienceCount" class="selective-audience-count"><b>${selected}</b><span>із ${total}</span></div></div><input type="hidden" id="selectiveAudienceMode" value="${esc(disciplineAudienceMode(d))}"><div class="selective-mode-grid"><button type="button" id="audienceModeGroup" class="selective-mode-card ${disciplineAudienceMode(d)==="group"?"active":""}" onclick="setSelectiveAudienceMode('group')"><span>УСІ</span><b>Вся група</b><small>Заняття блокує всю ${esc(d.group)}.</small></button><button type="button" id="audienceModeSelected" class="selective-mode-card ${disciplineAudienceMode(d)==="selected"?"active":""}" onclick="setSelectiveAudienceMode('selected')"><span>ЗА ВИБОРОМ</span><b>Вибрані студенти</b><small>Пара конфліктує тільки для конкретних студентів.</small></button></div><div id="selectiveStudentPicker" class="selective-student-picker ${disciplineAudienceMode(d)==="selected"?"":"disabled"}"><div class="selective-student-toolbar"><input type="search" placeholder="Знайти студента…" oninput="filterSelectiveStudents(this.value)"><div><button type="button" class="secondary" onclick="setAllSelectiveStudents(true)">Обрати всіх</button><button type="button" class="secondary" onclick="setAllSelectiveStudents(false)">Очистити</button></div></div><div class="selective-student-list">${disciplineAudienceStudentsHtml(d)||`<div class="empty">У групі немає студентів.</div>`}</div></div><div class="selective-audience-note"><b>Як працюватиме розклад</b><span>Дві вибіркові дисципліни однієї групи можна поставити на одну пару, якщо їхні списки студентів не перетинаються, викладачі різні й аудиторії різні.</span></div><div id="selectiveAudienceMessage"></div><div class="modal-footer-actions"><button type="button" class="secondary" onclick="closeModal()">Скасувати</button><button type="button" class="primary" onclick="saveDisciplineAudience(${d.id})">Зберегти склад студентів</button></div></div>`,true);
  $$("[data-selective-student]").forEach(x=>x.onchange=selectiveAudienceCountUpdate);selectiveAudienceCountUpdate();
}
function saveDisciplineAudience(id){
  const d=disciplineById(id);if(!d)return;const mode=$("#selectiveAudienceMode")?.value==="selected"?"selected":"group",ids=$$("[data-selective-student]").filter(x=>x.checked).map(x=>Number(x.value)).filter(Boolean);if(mode==="selected"&&!ids.length)return alert("Для вибіркової дисципліни обери хоча б одного студента.");
  const oldMode=d.audienceMode||"group",oldIds=[...(d.selectedStudentIds||[])],affected=db.schedule.filter(s=>scheduleCoversDiscipline(s,d.id));
  d.audienceMode=mode;d.selectedStudentIds=mode==="selected"?[...new Set(ids)]:[];affected.forEach(x=>refreshScheduleAudienceMetadata(x));
  const conflicts=[];affected.forEach(item=>{const cs=conflictsFor(item,item.id);if(cs.length)conflicts.push({item,reasons:conflictReasonLines(item,cs)});});
  if(conflicts.length){d.audienceMode=oldMode;d.selectedStudentIds=oldIds;affected.forEach(x=>refreshScheduleAudienceMetadata(x));const box=$("#selectiveAudienceMessage");if(box)box.innerHTML=`<div class="conflict"><b>Не можу змінити склад: у вже виставленому розкладі виникнуть конфлікти.</b><br>${conflicts.slice(0,6).map(x=>`${formatDate(x.item.date)} · ${pairDisplay(x.item)} — ${esc(x.reasons.join(" "))}`).join("<br>")}${conflicts.length>6?"<br>…":""}</div>`;return;}
  closeModal();save();
}

function deleteDiscipline(id){
  const d=disciplineById(id);if(!d)return;
  const lessons=db.schedule.filter(s=>scheduleCoversDiscipline(s,id));
  const lines=lessons.length?[`Разом буде видалено ${deleteCountLabel(lessons.length,"пару/запис","пари/записи","пар/записів")} цієї дисципліни.`]:[];
  if(!confirmCascadeDelete(`Видалити дисципліну «${d.name}» із навантаження ${d.group}?`,lines))return;
  db.schedule=db.schedule.filter(s=>!scheduleCoversDiscipline(s,id));
  db.disciplines=db.disciplines.filter(x=>Number(x.id)!==Number(id));
  db.disciplines.forEach(peer=>{Object.entries(peer.teacherStreams||{}).forEach(([tid,byType])=>Object.entries(byType||{}).forEach(([typeId,s])=>{if(!(s?.disciplineIds||[]).some(did=>Number(did)===Number(id)))return;const ids=(s.disciplineIds||[]).filter(did=>Number(did)!==Number(id));if(ids.length<2)delete peer.teacherStreams[tid][typeId];else peer.teacherStreams[tid][typeId]={...s,disciplineIds:ids,groups:ids.map(did=>disciplineById(did)?.group).filter(Boolean)};}));});
  closeModal();save();
}

/* ================================================================
   Individual + consultation schedules
   ================================================================ */
const SPECIAL_SCHEDULE_KINDS=[
  {id:"individual",label:"Індивідуальні заняття",short:"Індивідуальні",description:"Години одного студента можна ділити між кількома викладачами · 1 запис = 1 академічна година"},
  {id:"consult_bachelor",label:"Керівництво бакалаврськими роботами",short:"Бакалаврські роботи",description:"Лише студенти 4 курсу · один студент має одного керівника · один викладач може керувати кількома студентами"},
  {id:"consult_master",label:"Керівництво магістерськими роботами",short:"Магістерські роботи",description:"Лише студенти магістратури · один студент має одного керівника · один викладач може керувати кількома студентами"}
];
let specialScheduleState={kind:"individual",group:"",disciplineId:null,month:clampAcademicMonth(currentAcademicDate().slice(0,7))};
function specialKindMeta(id){return SPECIAL_SCHEDULE_KINDS.find(x=>x.id===id)||SPECIAL_SCHEDULE_KINDS[0];}
function availableSpecialKinds(){return activeProgramId()==="master"?SPECIAL_SCHEDULE_KINDS.filter(x=>x.id==="consult_master"):SPECIAL_SCHEDULE_KINDS.filter(x=>x.id==="individual"||x.id==="consult_bachelor");}
function normalizeSpecialKindForProgram(){const allowed=availableSpecialKinds();if(!allowed.some(x=>x.id===specialScheduleState.kind))specialScheduleState.kind=allowed[0]?.id||"individual";}
function studentsForGroup(group){return db.students.filter(s=>s.status!=="archived"&&normIdentity(s.group)===normIdentity(group)).slice().sort((a,b)=>a.name.localeCompare(b.name,"uk"));}
function isConsultationType(lt){return normIdentity(lt?.name||"").includes("консультац");}
function isBachelorThesisType(lt){return normIdentity(lt?.name||"")===normIdentity("Керівництво бакалаврською роботою");}
function isMasterThesisType(lt){return normIdentity(lt?.name||"")===normIdentity("Керівництво магістерською роботою");}
function thesisKindForType(lt){return isBachelorThesisType(lt)?"consult_bachelor":isMasterThesisType(lt)?"consult_master":"";}
function isSplitIndividualType(lt){
  if(!lt)return false;
  return isPerStudentTypeId(lt.id)&&!thesisKindForType(lt)&&!isConsultationType(lt);
}
function thesisTypeApplicable(d,lt){
  const kind=thesisKindForType(lt);if(!kind)return true;
  const course=Number(d?.course||groupCourse(d?.group)||0),pid=disciplineProgramId(d);
  return kind==="consult_master"?pid==="master":pid!=="master"&&course===4;
}
function specialTypeMatches(kind,lt,d){
  const course=Number(d?.course||groupCourse(d?.group)||0),pid=disciplineProgramId(d);
  if(kind==="individual"){
    return pid!=="master"&&!isBachelorThesisType(lt)&&!isMasterThesisType(lt)&&!isConsultationType(lt)
      &&(lt?.countMode==="per_student"||normIdentity(lt?.name)==="індивідуальне");
  }
  if(kind==="consult_bachelor")return pid!=="master"&&course===4&&isBachelorThesisType(lt);
  if(kind==="consult_master")return pid==="master"&&isMasterThesisType(lt);
  return false;
}
function specialLoadRows(kind=specialScheduleState.kind){
  const rows=[];
  db.disciplines.filter(d=>disciplineVisibleInProgram(d)).forEach(d=>{
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
function specialEventRows(kind=specialScheduleState.kind){return db.schedule.filter(x=>x.specialSchedule===true&&x.specialKind===kind&&dateInBounds(x.date)&&scheduleVisibleInProgram(x)).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.pairId||99)-Number(b.pairId||99)||Number(a.specialHalf||1)-Number(b.specialHalf||1));}
function specialGroups(kind=specialScheduleState.kind){const set=new Set([...specialLoadRows(kind).map(x=>x.d.group),...specialEventRows(kind).map(x=>x.group)].filter(Boolean));return visibleGroups().filter(g=>set.has(g.code)).sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code,"uk"));}
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
function specialKindTabsHtml(){normalizeSpecialKindForProgram();return `<div class="special-kind-tabs">${availableSpecialKinds().map(k=>{const remaining=specialLoadRows(k.id).reduce((a,x)=>a+x.remaining,0);return `<button class="${specialScheduleState.kind===k.id?"active":""}" onclick="setSpecialKind('${k.id}')"><span>${esc(k.short)}</span><b>${fmtHours(remaining)} год</b></button>`;}).join("")}</div>`;}
function beginDirectStudentAssignment(disciplineId,teacherId,typeId){
  const d=disciplineById(disciplineId);
  if(!d)return;

  disciplineAllocationId=d.id;
  window.__disciplineDraft=d;
  disciplineAllocationDraft=cloneAllocationLoads(d);
  disciplineStudentAllocationDraft=cloneStudentAllocationLoads(d);
  disciplineStudentHoursDraft=cloneStudentHourAllocations(d);
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

  const teacherStudentHours={...clone(d.teacherStudentHours||{})};
  Object.entries(disciplineStudentHoursDraft||{}).forEach(([teacherId,byType])=>{
    teacherStudentHours[String(teacherId)]=teacherStudentHours[String(teacherId)]||{};
    Object.entries(byType||{}).forEach(([ltId,byStudent])=>{const clean={};Object.entries(byStudent||{}).forEach(([sid,h])=>{if(num(h)>0)clean[String(sid)]=num(h);});teacherStudentHours[String(teacherId)][String(ltId)]=clean;});
  });

  d.teacherLoads=teacherLoads;
  d.teacherStudentLoads=teacherStudentLoads;
  d.teacherStudentHours=teacherStudentHours;
  d.teacherIds=[...new Set([...(d.teacherIds||[]).map(Number),...ids])];

  disciplineAllocationId=null;
  disciplineAllocationDraft={};
  disciplineStudentAllocationDraft=null;
  disciplineStudentHoursDraft=null;
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
  const split=perStudent&&isSplitIndividualType(x.lt);
  const assignedHours=split?totalTeacherStudentHours(x.d,x.t.id,x.lt.id):assigned*unit;

  return `<article class="special-load-card ${done?"done":""} ${!resolved?"needs-students":""}" style="${scheduleColorVars({group:x.d.group,discipline:x.d.name})}">
    <div class="special-load-card-head">
      <div><span>${esc(x.d.group)} · ${esc(courseDisplayLabel(x.d.course||groupCourse(x.d.group)))}</span><h4>${esc(x.d.name)}</h4></div>
      <strong class="${done?"done":!resolved?"warn":""}">${!resolved?"ПОТРІБНІ СТУДЕНТИ":done?"ГОТОВО":`${fmtHours(x.remaining)} год`}</strong>
    </div>

    <div class="special-load-teacher"><span>Викладач</span><b>${esc(teacherDisplay(x.t))}</b></div>

    ${perStudent
      ?resolved
        ?`<div class="special-student-formula"><b>${assigned} студентів</b><span>${split?`${fmtHours(assignedHours)} год розподілено між ними`:`× ${fmtHours(unit)} год = ${fmtHours(x.planned)} год навантаження`}</span></div>`
        :`<div class="special-assignment-warning">
            <b>${split?"Спочатку розподіли години між студентами":"Спочатку закріпи студентів"}</b>
            <span>${legacyTarget.hours?`Попереднє навантаження ${fmtHours(legacyTarget.hours)} год${split?"":` ≈ ${legacyTarget.count} студент(ів)`}.`:""} ${hintCount?`У старому розкладі вже знайдено ${hintCount} студент(ів).`:""}</span>
          </div>`
      :""}

    <div class="special-load-progress">
      <div><span>${esc(x.lt.name)}</span><b>${fmtHours(x.scheduled)} / ${fmtHours(x.planned)} год</b></div>
      <i><em style="width:${x.planned?Math.min(100,x.scheduled/x.planned*100):0}%"></em></i>
    </div>

    ${!resolved
      ?`<button class="primary" onclick="beginDirectStudentAssignment(${x.d.id},${x.t.id},${x.lt.id})">${split?"Розподілити години":"Закріпити студентів"}</button>`
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
  normalizeSpecialKindForProgram();
  const kind=specialScheduleState.kind,groups=specialGroups(kind);
  if(!groups.some(g=>normIdentity(g.code)===normIdentity(specialScheduleState.group))){
    specialScheduleState.group=groups[0]?.code||"";
    specialScheduleState.disciplineId=null;
  }
  ensureSpecialDiscipline();

  const rows=specialLoadRows(kind)
    .filter(x=>!specialScheduleState.group||x.d.group===specialScheduleState.group);
  const remaining=rows.reduce((a,x)=>a+x.remaining,0);
  const selectedDiscipline=disciplineById(specialScheduleState.disciplineId);

  $("#page-specialSchedule").innerHTML=`<div class="special-schedule-page">
    <div class="special-hero">
      <div><span>${activeProgramId()==="master"?"МАГІСТРАТУРА":"ОКРЕМІ РОЗКЛАДИ"}</span><h2>${activeProgramId()==="master"?"Магістерські роботи":"Індивідуальні / бакалаврські роботи"}</h2><p>${kind==="individual"?`Тут працюємо не парами, а академічними годинами: <b>1 запис = половина пари = 1 академічна година.</b> Планові години одного студента можна розподілити між кількома викладачами.`:`<b>Один студент → один керівник.</b> Один викладач може керувати кількома студентами. Години керівництва входять у педагогічне навантаження викладача.`}</p></div>
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
    scheduleRoomNames(selected).map(name=>{
      const conflict=roomConflictRecord(date,times.start,times.end,pairId,name,ignoreId);
      const busy=!!conflict;
      return `<option value="${esc(name)}" ${normIdentity(name)===normIdentity(selected)?"selected":""} ${busy&&normIdentity(name)!==normIdentity(selected)?"disabled":""}>${esc(roomBusyOptionLabel(name,conflict))}</option>`;
    }).join("")+`<option value="__other__">+ Інша аудиторія…</option>`;
}
function refreshSpecialRoomOptions(){
  const room=$("#specialRoom");
  if(!room||!programUsesRooms()||room.tagName!=="SELECT")return;
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
        <p>${esc(d.group)} · ${esc(lt.name)} · ${editing?"редагуємо існуючий запис":`залишок викладача ${fmtHours(remaining)} год`}${isPerStudentTypeId(lt.id)?(isSplitIndividualType(lt)?` · <b>план на студента ${fmtHours(perStudentUnitHours(d,lt.id))} год; цьому викладачу — за вашим розподілом</b>`:` · <b>${fmtHours(perStudentUnitHours(d,lt.id))} год = максимум ${fmtHours(perStudentUnitHours(d,lt.id))} ${personalMeetingLabel(lt)} на кожного студента</b>`):""}</p>
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
        <div class="special-form-title"><span>3</span><div><b>${programUsesRooms()?"Місце":"Формат"}</b><small>${programUsesRooms()?"аудиторія необов’язкова; система перевіряє її конфлікти, а в сітці показуються лише кафедральні аудиторії":"магістратура навчається онлайн"}</small></div></div>
        <div class="special-time-grid">
          ${programUsesRooms()?`<label>Аудиторія<select id="specialRoom">${specialRoomOptions(defaultDate,firstPair,defaultHalf,defaultRoom,editId)}</select></label>`:`<input id="specialRoom" type="hidden" value=""><div class="notice success-notice"><b>Онлайн-заняття</b><br><span class="small">Фізична аудиторія не резервується.</span></div>`}
          <label>Примітка<input id="specialNote" value="${esc(defaultNote)}" placeholder="необов’язково"></label>
        </div>
      </div>

      <div id="specialConflictMessage"></div>

      <div class="special-modal-actions">
        <button type="button" class="secondary" onclick="specialEditEventId=null;closeModal()">Скасувати</button>
        <button class="primary">${editing?"Зберегти зміни":"Зберегти 1 академічну годину"}</button>
        ${editing?`<button type="button" class="danger entity-delete-btn" onclick="deleteSpecialScheduleEvent(${existing.id})">Видалити запис</button>`:""}
      </div>
    </form>
  </div>`,true);

  $("#specialPair").onchange=refreshSpecialHalfButtons;
  $("#specialDate").onchange=refreshSpecialRoomOptions;
  initAdHocRoomSelect($("#specialRoom"),()=>refreshSpecialRoomOptions());
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
  const room=rememberAdHocRoom($("#specialRoom").value);

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
      return alert(`Ліміт цього викладача для студента вичерпано. Йому розподілено ${fmtHours(usage.limit)} год, уже виставлено ${fmtHours(usage.used)}.`);
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
function activeTeacherOptions(selected=null){return visibleTeachers().map(t=>`<option value="${t.id}" ${Number(t.id)===Number(selected)?"selected":""}>${esc(teacherDisplay(t))}</option>`).join("");}
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
  return visibleGroups().filter(g=>workloadTeacherRowsForGroup(g.code).length>0);
}
function bestWorkloadGroup(){
  const remembered=rememberedWorkloadGroup();
  if(remembered&&workloadTeacherRowsForGroup(remembered).length>0)return remembered;
  const loaded=groupsWithDistributedAuditoriumLoad();
  if(loaded.length)return loaded[0].code;
  const activated=db.disciplines.find(d=>disciplineVisibleInProgram(d)&&d.group);
  return activated?.group||visibleGroups()[0]?.code||"";
}
function workloadGroupOptions(selected){
  const loaded=groupsWithDistributedAuditoriumLoad();
  const loadedSet=new Set(loaded.map(g=>g.code));
  const rest=visibleGroups().filter(g=>!loadedSet.has(g.code));
  const opt=g=>`<option value="${esc(g.code)}" ${g.code===selected?"selected":""}>${esc(g.code)} · ${esc(courseDisplayLabel(g.course))}</option>`;
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
  if(courseLabel)courseLabel.textContent=`${courseDisplayLabel(groupCourse(code))}`;
  const wrap=$("#workloadGroupButtons");
  if(wrap){
    const loaded=groupsWithDistributedAuditoriumLoad();
    wrap.innerHTML=groupSwitchRowHtml({
      selected:code,
      onclick:"setWorkloadScheduleGroup",
      groups:sortedGroups(),
      badgeFn:g=>{
        const rows=workloadTeacherRowsForGroup(g.code);
        const department=new Set(rows.map(x=>String(x.d.id))).size;
        const external=readyExternalDisciplineSummaries(g.code).length;
        if(department&&external)return `${department}+${external}`;
        if(department)return `${department} каф.`;
        if(external)return `${external} ін.`;
        return "—";
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
      ${x.types.map(type=>{const s=teacherStreamForTypeId(x.d,x.t.id,type.lt.id);return `
        <div class="schedule-teacher-type ${type.remaining<=0?"done":""} ${s?"stream":""}">
          <span>${esc(type.lt.name)}</span>
          <b>${fmtHours(type.scheduled)} / ${fmtHours(type.planned)} год</b>
          <small>${s?`ПОТІК · ${esc(teacherStreamGroups(s).join(" + "))}`:(type.remaining>0?`залишок ${fmtHours(type.remaining)} год`:"готово")}</small>
        </div>`;}).join("")}
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
            <span class="${disciplineAudienceMode(group.d)==="selected"?"selective-meta":""}">${esc(disciplineAudienceLabel(group.d))}</span>
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
function readyExternalScheduleCardHtml(s){
  const progress=s.planHours?Math.min(100,(s.hours/s.planHours)*100):0;
  const streamGroups=[...new Set(s.rows.flatMap(x=>scheduleAudienceGroups(x)))]
    .filter(Boolean);

  return `<section class="schedule-discipline-card ready-schedule-external-card"
    style="${scheduleColorVars({group:s.group,discipline:s.discipline})}">
    <div class="schedule-discipline-head">
      <div class="schedule-discipline-identity">
        <span class="schedule-discipline-accent"></span>
        <div>
          <div class="schedule-discipline-kicker">
            <span>${esc(s.group)}</span>
            <span>${s.semester?`${esc(s.semester)} семестр`:""}</span>
          </div>
          <h3>${esc(s.discipline)}</h3>
          <div class="schedule-discipline-meta">
            <span>інша кафедра / готовий розклад</span>
            ${s.control?`<span>${esc(s.control)}</span>`:""}
          </div>
        </div>
      </div>
      <span class="ready-external-corner-badge">НЕ КАФЕДРАЛЬНА</span>
    </div>

    ${s.planHours?`
      <div class="schedule-discipline-summary ready-external-summary">
        <div><b>${fmtHours(s.hours)} / ${fmtHours(s.planHours)} год</b><span>внесено / за планом</span></div>
        <strong class="${s.remaining<=0?"done":""}">${s.remaining<=0?"ГОТОВО":`${fmtHours(s.remaining)} год лишилось`}</strong>
      </div>
      <div class="schedule-discipline-progress"><i style="width:${progress}%"></i></div>
    `:`
      <div class="schedule-discipline-summary ready-external-summary">
        <div><b>${s.pairs} пар · ${fmtHours(s.hours)} год</b><span>фактично внесено</span></div>
      </div>
    `}

    <div class="ready-schedule-card-body">
      <div class="ready-schedule-card-line">
        <span>Викладачі</span>
        ${compactTeacherChips(s.teachers)}
      </div>
      ${s.planTypeText?`<div class="ready-schedule-card-line"><span>За планом</span><b>${esc(s.planTypeText)}</b></div>`:""}
      ${streamGroups.length>1?`<div class="ready-schedule-stream"><span>Потоки в розкладі</span><b>${esc(streamGroups.join(" + "))}</b></div>`:""}
    </div>

    <div class="compact-discipline-actions ready-schedule-actions">
      <button class="secondary"
        data-group="${esc(s.group)}"
        data-discipline="${esc(s.discipline)}"
        data-semester="${esc(s.semester||"")}"
        data-ref="${esc(s.planRef||"")}"
        onclick="openReadyExternalManager(this.dataset.group,this.dataset.discipline,this.dataset.semester,this.dataset.ref)">
        ${s.pairs?"Редагувати всі пари":"Відкрити"}
      </button>
      <button class="primary-inline"
        data-group="${esc(s.group)}"
        data-discipline="${esc(s.discipline)}"
        data-ref="${esc(s.planRef||"")}"
        onclick="openReadyScheduleForDiscipline(this.dataset.group,this.dataset.ref,this.dataset.discipline)">
        + Додати пари
      </button>
      <button class="quiet-danger compact-delete" data-group="${esc(s.group)}" data-discipline="${esc(s.discipline)}" data-semester="${esc(s.semester||"")}" data-ref="${esc(s.planRef||"")}" onclick="deleteReadyExternalDiscipline(this.dataset.group,this.dataset.discipline,this.dataset.semester,this.dataset.ref)">Видалити</button>
    </div>
  </section>`;
}

function renderWorkloadToSchedule(group){
  const rows=workloadTeacherRowsForGroup(group);
  const external=readyExternalDisciplineSummaries(group);

  const unallocated=db.disciplines
    .filter(d=>d.status!=="archived"&&normIdentity(d.group)===normIdentity(group))
    .flatMap(d=>schedulableTypes(d).map(lt=>({
      d,lt,
      plan:disciplineTypePlan(d,lt.name),
      allocated:disciplineAllocatedForType(d,lt.id)
    })))
    .filter(x=>x.plan-x.allocated>0.001);

  if(!rows.length&&!external.length){
    return `<div class="empty">Для ${esc(group)} ще немає дисциплін для складання розкладу. Кафедральні з’являться після розподілу навантаження, некафедральні — з навчального плану або після внесення готових пар.</div>`;
  }

  const warning=unallocated.length
    ? `<div class="notice warn-notice"><b>Ще не все кафедральне навантаження розподілено між викладачами:</b> ${unallocated.map(x=>`${esc(x.d.name)} · ${esc(x.lt.name)} — ${fmtHours(x.plan-x.allocated)} год`).join("; ")}</div>`
    : "";

  const disciplines=workloadDisciplineGroups(rows);

  return `${warning}
    ${disciplines.length?`
      <div class="schedule-subsection-title">
        <div><span>КАФЕДРАЛЬНІ</span><h3>Розподілене навантаження</h3></div>
        <small>${disciplines.length} дисциплін</small>
      </div>
      <div class="schedule-discipline-list">
        ${disciplines.map(workloadDisciplineCardHtml).join("")}
      </div>
    `:""}

    ${external.length?`
      <div class="schedule-subsection-title external">
        <div><span>ІНШІ КАФЕДРИ</span><h3>Готові / загальноосвітні дисципліни</h3></div>
        <small>${external.length} дисциплін · редагуються тут само</small>
      </div>
      <div class="schedule-discipline-list ready-schedule-grid">
        ${external.map(readyExternalScheduleCardHtml).join("")}
      </div>
    `:""}`;
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
      }:{
        date:readySchedulePreset?.date||"",
        pairId:readySchedulePreset?.pairId||firstPair,
        room:readySchedulePreset?.room||""
      })}</div>
      <div id="readyConflictBox"></div>
      <div class="modal-footer-actions">
        <button class="primary">${existing?"Зберегти зміни":"Додати в розклад"}</button>
        ${existing?`<button type="button" class="danger entity-delete-btn" onclick="deleteReadyExternalItem(${existing.id})">Видалити пару</button>`:""}
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
        ${programUsesRooms()?`<label>Аудиторія для всіх
          <input id="readyDefaultRoom" list="readyRoomList" placeholder="наприклад 415">
        </label>`:`<input id="readyDefaultRoom" type="hidden" value=""><div class="notice success-notice"><b>Онлайн</b> · аудиторія не потрібна</div>`}
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
function setSeriesPanelVisible(el,visible){
  if(!el)return;
  el.classList.toggle("hidden",!visible);
  el.hidden=!visible;
  el.style.display=visible?"":"none";
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
  setSeriesPanelVisible(datesBody,readySeriesMethod==="dates");
  setSeriesPanelVisible(ruleBody,readySeriesMethod==="rule");
  setSeriesPanelVisible(hint,!readySeriesMethod);
}
function bindReadyMode(existing=null){
  const row0=$("[data-ready-row]");
  if(row0)bindReadyRow(row0);
  renumberReadyRows();
  readyUpdateEmptyState();

  const form=$("#readyScheduleForm");
  if(form)form.onsubmit=e=>saveReadySchedule(e,existing?.id||null);

  if(readyScheduleMode==="series"){
    const datesMethodBtn=$("#readySeriesMethodDates");
    const ruleMethodBtn=$("#readySeriesMethodRule");
    if(datesMethodBtn)datesMethodBtn.onclick=e=>{e.preventDefault();setReadySeriesMethod("dates");};
    if(ruleMethodBtn)ruleMethodBtn.onclick=e=>{e.preventDefault();setReadySeriesMethod("rule");};
    $("#readyAddRow").onclick=()=>addReadyScheduleRow();
    $("#readyAddDates").onclick=e=>{e.preventDefault();addReadyDatesFromText();};
    $("#readyApplyDefaults").onclick=applyReadyDefaults;
    $("#readyGenerateRule").onclick=generateReadyDatesByRule;
    const paste=$("#readyDatesPaste");
    if(paste)paste.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();addReadyDatesFromText();}};
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


function readyPlanIdentity(rec){
  if(!rec)return "";
  return `plan:${Number(rec.curriculumId)||0}:${Number(rec.componentId)||0}:${Number(rec.semester)||0}`;
}
function readyItemPlanIdentity(item){
  if(!item?.sourceCurriculumId||!item?.sourceComponentId||!item?.sourceSemester)return "";
  return `plan:${Number(item.sourceCurriculumId)}:${Number(item.sourceComponentId)}:${Number(item.sourceSemester)}`;
}
function readyPlanHours(rec){
  if(!rec?.row)return 0;
  return num(rec.row.auditoriumPlanHours??rec.row.auditoriumHours);
}
function readyPlanTypeText(rec){
  const r=rec?.row||{};
  const parts=[
    ["лекц.",r.lecture],
    ["сем.",r.seminar],
    ["практ.",r.practical],
    ["лаб.",r.laboratory]
  ].filter(([,v])=>num(v)>0).map(([label,v])=>`${fmtHours(v)} ${label}`);
  return parts.join(" · ");
}
function readyPlanCompatibleGroups(rec){
  if(!rec)return sortedGroups();
  return sortedGroups().filter(g=>
    readyPlanRecords(g.code).some(x=>readyPlanIdentity(x)===readyPlanIdentity(rec))
  );
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
  return visibleTeachers()
    .slice()
    .sort((a,b)=>readyTeacherText(a).localeCompare(readyTeacherText(b),"uk"))
    .map(t=>`<option value="${esc(readyTeacherText(t))}">${esc(t.scope==="external"?"зовнішній":"викладач кафедри")}</option>`)
    .join("");
}
function readyRoomDatalist(){
  return scheduleRoomNames().map(name=>`<option value="${esc(name)}"></option>`).join("");
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
    ${programUsesRooms()?`<label>Аудиторія<input data-ready-room list="readyRoomList" placeholder="324, 415…" value="${esc(preset.room||"")}"></label>`:`<input data-ready-room type="hidden" value=""><div class="ready-online-badge">Онлайн</div>`}
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
function parseReadyDateToken(token,bounds=academicYearBounds()){
  const s=String(token||"").trim();
  if(!s)return null;
  let year,month,day;
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)){
    [year,month,day]=s.split("-").map(Number);
  }else{
    const m=s.match(/^(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?$/);
    if(!m)return null;
    day=Number(m[1]);month=Number(m[2]);
    if(m[3]){year=Number(m[3]);if(year<100)year+=2000;}
    else{
      const startYear=Number(String(bounds.start||"").slice(0,4));
      const endYear=Number(String(bounds.end||"").slice(0,4));
      // For one-semester bounds both dates are in the same calendar year.
      // For a full academic year September–December belong to startYear, January–June to endYear.
      year=startYear===endYear?startYear:(month>=9?startYear:endYear);
    }
  }
  if(!year||month<1||month>12||day<1||day>31)return null;
  const dt=new Date(Date.UTC(year,month-1,day));
  if(dt.getUTCFullYear()!==year||dt.getUTCMonth()!==month-1||dt.getUTCDate()!==day)return null;
  return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}
function addReadyDatesFromText(){
  const input=$("#readyDatesPaste");
  const raw=(input?.value||"").trim();
  if(!raw)return alert("Встав дати через кому. Наприклад: 03.09, 10.09, 17.09");
  const group=$("#readyGroup").value;
  const ref=$("#readyDiscipline").value;
  const b=readyDateBounds(group,ref);
  const tokens=raw.split(/[\s,;]+/).filter(Boolean);
  const dates=tokens.map(token=>parseReadyDateToken(token,b)).filter(Boolean);
  if(!dates.length)return alert("Не знайшов дат. Можна вставити, наприклад: 03.09, 10.09, 17.09");
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
    room:programUsesRooms()?rememberAdHocRoom(row.querySelector("[data-ready-room]").value.trim()):"",
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
    const compatible=rec?readyPlanCompatibleGroups(rec).map(g=>g.code):[];
    info.innerHTML=rec
      ? `<div class="notice success-notice"><b>${esc(rec.name)}</b> · ${rec.semester} семестр${rec.scope==="external"?" · не кафедральна дисципліна":""}. Записи підуть одразу в розклад і не потраплять у кафедральне навантаження.${compatible.length>1?` <strong>Можливий потік:</strong> ${esc(compatible.join(" + "))}.`:""}</div>`
      : `<div class="notice">Ці заняття не списують кафедральне навантаження.</div>`;
  }
  applyReadyDateBounds();
}
let readyExternalManagerState={group:"",discipline:"",semester:"",planRef:""};
function deleteReadyExternalDiscipline(group,discipline,semester="",planRef=""){
  const rec=planRef?readyPlanRecordByRef(group,planRef):null;
  if(rec?.curriculumId&&rec?.componentId){
    return deleteCurriculumComponent(rec.curriculumId,rec.componentId);
  }
  const rows=readyExternalManagerRows(group,discipline,semester,planRef);
  const lines=rows.length?[`Разом буде видалено ${deleteCountLabel(rows.length,"готову пару","готові пари","готових пар")}.`]:[];
  if(!confirmCascadeDelete(`Видалити некафедральну дисципліну «${discipline}»?`,lines))return;
  const ids=new Set(rows.map(x=>Number(x.id)));
  db.schedule=db.schedule.filter(x=>!ids.has(Number(x.id)));
  closeModal();save();
}

function readyExternalManagerRows(group,discipline,semester="",planRef=""){
  const rec=planRef?readyPlanRecordByRef(group,planRef):null;
  const identity=readyPlanIdentity(rec);

  return db.schedule
    .filter(x=>isReadyExternalScheduleItem(x)&&!x.specialSchedule)
    .filter(x=>scheduleIncludesGroup(x,group))
    .filter(x=>{
      if(identity&&readyItemPlanIdentity(x)){
        return readyItemPlanIdentity(x)===identity;
      }
      return normIdentity(x.discipline)===normIdentity(discipline)
        &&(!semester||!x.sourceSemester||Number(x.sourceSemester)===Number(semester));
    })
    .slice()
    .sort((a,b)=>String(a.date||"").localeCompare(String(b.date||""))||Number(a.pairId||99)-Number(b.pairId||99));
}
function openReadyExternalManager(group,discipline,semester="",planRef=""){
  readyExternalManagerState={group,discipline,semester,planRef};
  const rows=readyExternalManagerRows(group,discipline,semester,planRef);

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
  const group=$("#readyGroup")?.value||selected?.[0]||"";
  const ref=$("#readyDiscipline")?.value||"";
  const rec=readyPlanRecordByRef(group,ref);
  const groups=rec?readyPlanCompatibleGroups(rec):sortedGroups();

  return `<div class="ready-audience-buttons">${groups.map(g=>`<button type="button" class="ready-audience-btn ${set.has(normIdentity(g.code))?"active":""}" data-ready-audience="${esc(g.code)}" onclick="toggleReadyAudienceGroup('${String(g.code).replaceAll("'","\\'")}')"><b>${esc(g.code)}</b><span>${esc(courseDisplayLabel(g.course))}</span></button>`).join("")}</div>`;
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
  const defaultGroup=existing?.group||preset?.group||currentWorkloadGroup()||visibleGroups()[0]?.code||"";
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
  readyScheduleMode=editing||preset?.date||preset?.pairId?"single":null;

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
    const primary=$("#readyGroup").value;
    const rec=readyPlanRecordByRef(primary,$("#readyDiscipline").value);
    if(rec){
      const allowed=new Set(readyPlanCompatibleGroups(rec).map(g=>normIdentity(g.code)));
      readyAudienceSelection=readyAudienceSelection.filter(g=>allowed.has(normIdentity(g)));
      if(!readyAudienceSelection.some(g=>normIdentity(g)===normIdentity(primary)))readyAudienceSelection.unshift(primary);
    }
    renderReadyAudienceButtons();
    readyRefreshPlanFields();
    if(readyScheduleMode==="series")setReadyScheduleMode("series");
  };

  renderReadyAudienceButtons();
  if(editing)setReadyScheduleMode("single",existing);
  else if(preset?.date||preset?.pairId)setReadyScheduleMode("single");
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
    const teacherRecord=ensureReadyExternalTeacher(teacher,db,db.groups.find(g=>normIdentity(g.code)===normIdentity(group))?.programId||activeProgramId());
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
    .filter(x=>!group||scheduleIncludesGroup(x,group))
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
      <div class="actions schedule-hero-actions"><button class="ready-import-btn schedule-action-btn ready-action-prominent" onclick="openReadyScheduleModal()"><span class="action-kicker">Швидко</span><b>+ Внести готові пари</b><small>некафедральні дисципліни / готовий розклад</small></button><button class="secondary schedule-action-btn single-lesson-action" onclick="openLessonModal(null,{group:currentWorkloadGroup()})"><span class="action-kicker">Вручну</span><b>+ Одне заняття</b><small>додати окрему кафедральну пару</small></button></div>
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
          <strong id="workloadGroupCourse">${esc(courseDisplayLabel(groupCourse(defaultGroup)))}</strong>
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
          badgeFn:g=>String(db.schedule.filter(x=>dateInBounds(x.date)&&scheduleIncludesGroup(x,g.code)).length),
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
      badgeFn:g=>String(db.schedule.filter(x=>dateInBounds(x.date)&&scheduleIncludesGroup(x,g.code)).length),
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

    if(scheduleAudienceOverlap(item,c,db)){
      const itemSelected=scheduleSelectedStudentIds(item,db),conflictSelected=scheduleSelectedStudentIds(c,db),overlap=itemSelected.filter(id=>conflictSelected.includes(id));
      if(overlap.length){const names=overlap.slice(0,4).map(id=>db.students.find(s=>Number(s.id)===Number(id))?.name).filter(Boolean);add(`Збігаються студенти: ${names.join(", ")||`${overlap.length} студент(ів)`}${overlap.length>4?` та ще ${overlap.length-4}`:""}${tail?` — ${tail}`:""}.`);}
      else add(`Аудиторія студентів ${scheduleAudienceConflictLabel(item)} уже зайнята в цей час${tail?` — ${tail}`:""}.`);
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
  const lessonConflicts=db.schedule.concat(extra||[]).filter(x=>x.id!==ignore&&sameSlot(x)).filter(x=>(item.room&&normIdentity(x.room)===normIdentity(item.room))||scheduleAudienceOverlap(item,x,db)||(item.teacherId&&Number(resolvedScheduleTeacherId(x,db))===Number(item.teacherId)));
  const bookingConflicts=db.roomBookings.filter(x=>x.date===item.date&&(item.pairId&&x.pairId?String(item.pairId)===String(x.pairId):timeOverlap(item.start,item.end,x.start,x.end))).filter(x=>(item.room&&normIdentity(x.room)===normIdentity(item.room))||(x.group&&scheduleIncludesGroup(item,x.group))||(item.teacherId&&x.teacherId&&Number(x.teacherId)===Number(item.teacherId))).map(x=>({...x,discipline:x.title||x.kind||"Бронювання"}));
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
  const maxPerDay=positiveTeacherLimit(t.maxPerDay);
  const maxConsecutive=positiveTeacherLimit(t.maxConsecutive);

  if(maxPerDay&&dayUnits>maxPerDay+.0001)
    warnings.push(`Перевищено максимум пар викладача на день: ${maxPerDay}. Індивідуальна академічна година рахується як ½ пари.`);

  if(maxConsecutive&&item.pairId){
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
    if(longest>maxConsecutive)
      warnings.push(`Перевищено максимум пар підряд: ${maxConsecutive}.`);
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
  const item={date,pairId:pairId&&pairId!=="__custom__"?Number(pairId):null,start:pair?.start||start||"",end:pair?.end||end||"",group:primaryGroup,audienceGroups:uniqueStrings([primaryGroup]),disciplineId:did,disciplineIds:did?[did]:[],discipline:d?.name||discipline,type,workloadHours:num(workloadHours),coverage,students:students||"",teacherId:teacherId?Number(teacherId):null,teacher:t?teacherDisplay(t):"",room:room||"",note:note||"",repeatBatchId};
  if(d&&teacherId&&type){const a=workloadAudienceForType(d,teacherId,type);item.audienceGroups=a.groups;item.disciplineIds=a.disciplineIds;if(a.stream)item.loadStreamId=a.stream.streamId;}
  return refreshScheduleAudienceMetadata(item);
}
function openLessonModal(id=null,preset={}){
  currentEditingLessonId=id;const existing=id?db.schedule.find(s=>s.id===id):null;
  const today=clampDate(localTodayISO()),firstPair=bellPairs()[0];
  const x=existing||{date:clampDate(preset.date||today),pairId:preset.pairId||firstPair?.id||null,start:firstPair?.start||"",end:firstPair?.end||"",group:preset.group||(currentPage==="schedule"?bestWorkloadGroup():visibleGroups()[0]?.code)||"",disciplineId:preset.disciplineId||null,discipline:"",type:preset.type||"",workloadHours:2,coverage:"Вся група",students:"",teacherId:preset.teacherId||null,teacher:"",room:"",note:""};
  const matchedPair=x.pairId||pairIdForTimes(x.start,x.end),pairSelected=matchedPair||"__custom__";
  openModal(`<h2>${id?"Редагувати заняття":"Додати заняття"}</h2><form id="lf" class="form-grid">
    <label>Група<select id="lg">${groupOptions(x.group)}</select></label><label>Дисципліна<select id="ldi">${disciplineOptionsForGroup(x.group,x.disciplineId,true)}</select><input id="ldiCustom" style="display:${x.disciplineId?"none":""};margin-top:6px" placeholder="Назва дисципліни" value="${esc(!x.disciplineId?(x.discipline||""):"")}"></label>
    <label>Вид заняття<select id="lt"></select></label><label>Викладач<select id="ltea"></select></label><div id="loadHint" class="wide"></div>
    <label>Дата<input id="ld" type="date" ${dateAttrs()} value="${esc(clampDate(x.date))}" required></label><label>Пара<select id="lpair">${pairOptions(pairSelected,true)}</select></label>
    <div id="customTimeBox" class="wide form-grid" style="display:${pairSelected==="__custom__"?"grid":"none"}"><label>Початок<input id="ls" type="time" value="${esc(x.start||"")}"></label><label>Кінець<input id="le" type="time" value="${esc(x.end||"")}"></label></div>
    ${programUsesRooms()?`<label>Аудиторія<select id="lr">${scheduleRoomOptionsHtml(x.room,{emptyLabel:"—"})}</select></label>`:`<input id="lr" type="hidden" value=""><div class="notice success-notice"><b>Онлайн</b><br><span class="small">Аудиторія для магістратури не потрібна.</span></div>`}<label>Годин у навантаження<input id="lwh" type="number" min="0.01" step="0.01" value="${esc(x.workloadHours||2)}"></label>
    <label>Охоплення<select id="lc">${db.coverageTypes.map(v=>`<option ${v===x.coverage?"selected":""}>${esc(v)}</option>`).join("")}</select></label><label>Студент(и) / підгрупа<input id="lst" value="${esc(x.students||"")}"></label>
    <label class="wide">Примітка<input id="ln" value="${esc(x.note||"")}"></label><div id="conflictBox" class="wide"></div><div class="wide entity-form-actions"><button class="primary">${id?"Зберегти":"Додати"}</button>${id?`<button type="button" class="danger entity-delete-btn" onclick="deleteLesson(${id})">Видалити заняття</button>`:""}</div>
  </form>`,true);
  populateLessonFormFromLoad({type:x.type,teacherId:x.teacherId});
  if(programUsesRooms())initAdHocRoomSelect($("#lr"),()=>check?.());
  if(x.disciplineId)$("#ldi").value=x.disciplineId;else if(x.discipline)$("#ldi").value="__custom__";
  if(!x.disciplineId&&x.discipline)$("#ldiCustom").value=x.discipline;
  const applyLessonDateBounds=()=>{const did=$("#ldi").value,d=did&&did!=="__custom__"?disciplineById(Number(did)):null,b=d?semesterDateBounds(d.semester):academicYearBounds(),input=$("#ld");input.min=b.start;input.max=b.end;if(!dateInBounds(input.value,b))input.value=clampDate(input.value,b);};
  applyLessonDateBounds();
  const readLesson=()=>{const did=$("#ldi").value,disciplineId=did&&did!=="__custom__"?Number(did):null,d=disciplineById(disciplineId),tid=$("#ltea").value?Number($("#ltea").value):null,pv=$("#lpair").value;const item=lessonItemFromValues({date:$("#ld").value,pairId:pv,start:$("#ls")?.value,end:$("#le")?.value,group:$("#lg").value,disciplineId,discipline:did==="__custom__"?$("#ldiCustom").value.trim():(d?.name||""),type:$("#lt").value,workloadHours:$("#lwh").value,coverage:$("#lc").value,students:$("#lst").value.trim(),teacherId:tid,room:rememberAdHocRoom($("#lr").value),note:$("#ln").value.trim()});if(id&&existing){item.audienceGroups=existing.audienceGroups||item.audienceGroups;item.disciplineIds=existing.disciplineIds||item.disciplineIds;}refreshScheduleAudienceMetadata(item);return item;};
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
function plannerPairBusyInfo(date,pairId,d,t){
  const teacher=plannerTeacherEvents(date,t.id).find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId));
  const probe=refreshScheduleAudienceMetadata({date,pairId:Number(pairId),group:d.group,audienceGroups:[d.group],disciplineId:d.id,disciplineIds:[d.id],discipline:d.name,teacherId:t.id});
  const group=plannerGroupEvents(date,d.group).find(x=>String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId)&&scheduleAudienceOverlap(probe,x,db));
  return {teacher,group};
}
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
  return `<option value="">— обери аудиторію —</option>`+scheduleRoomNames(selected).map(name=>{
    const conflict=plannerRoomBusyRecord(date,pairId,name);
    const busy=!!conflict;
    return `<option value="${esc(name)}" ${normIdentity(name)===normIdentity(selected)?"selected":""} ${busy&&normIdentity(name)!==normIdentity(selected)?"disabled":""}>${esc(roomBusyOptionLabel(name,conflict))}</option>`;
  }).join("")+`<option value="__other__">+ Інша аудиторія…</option>`;
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

  type.onchange=()=>{
    refreshHours();
    updatePlannerStreamAudience(d.id,t.id);
  };
  pair.onchange=refreshRoom;
  initAdHocRoomSelect(room,()=>{refreshRoom();updatePlannerStreamAudience(d.id,t.id);});
  row.querySelector("[data-planner-remove]").onclick=()=>{
    row.remove();
    renumberPlannerEntries();
    updatePlannerStreamAudience(d.id,t.id);
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
  updatePlannerStreamAudience(d.id,t.id);
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
function plannerSeriesPairBusy(date,pairId,d,t){return plannerPairBusyInfo(date,pairId,d,t);}
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
          <select id="plannerSeriesBulkRoom"><option value="">— не змінювати —</option>${scheduleRoomNames().map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join("")}<option value="__other__">+ Інша аудиторія…</option></select>
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
  setSeriesPanelVisible(datesBody,plannerSeriesMethod==="dates");
  setSeriesPanelVisible(ruleBody,plannerSeriesMethod==="rule");
  setSeriesPanelVisible(hint,!plannerSeriesMethod);
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
  if(typeEl)typeEl.onchange=()=>{
    plannerUpdateSeriesSummary(d,t);
    updatePlannerStreamAudience(d.id,t.id);
  };
  if(roomEl)initAdHocRoomSelect(roomEl,()=>plannerUpdateSeriesSummary(d,t));
  if(dateEl)dateEl.onchange=()=>plannerSeriesRefreshRow(row,d,t);
  if(pairEl)pairEl.onchange=()=>plannerSeriesRefreshRow(row,d,t);
  if(remove)remove.onclick=()=>{
    row.remove();
    plannerSeriesUpdateEmpty();
    plannerUpdateSeriesSummary(d,t);
    updatePlannerStreamAudience(d.id,t.id);
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
  updatePlannerStreamAudience(d.id,t.id);
}
function plannerAddSeriesDatesFromText(d,t){
  const input=$("#plannerSeriesDatesPaste");
  const raw=(input?.value||"").trim();
  if(!raw)return alert("Встав дати через кому. Наприклад: 03.09, 10.09, 17.09");

  const b=plannerSeriesBounds(d);
  const dates=raw.split(/[\s,;]+/).filter(Boolean).map(token=>parseReadyDateToken(token,b)).filter(Boolean);
  if(!dates.length)return alert("Не знайшов дат. Наприклад: 03.09, 10.09, 17.09");
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
  const room=rememberAdHocRoom($("#plannerSeriesBulkRoom").value);

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
  updatePlannerStreamAudience(d.id,t.id);
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
  updatePlannerStreamAudience(d.id,t.id);
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
      room:rememberAdHocRoom(row.querySelector("[data-series-room]")?.value||"")
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

    const allocation=workloadAudienceForType(d,t.id,x.type);
    const coverageIds=plannerDisciplineIdsForAudience(d,t,x.type,allocation.groups);
    if(coverageIds.missing.length){
      problems.push(`${formatDate(x.date)} · ${x.type}: ${coverageIds.details.join("; ")}.`);
      continue;
    }
    const item=lessonItemFromValues({
      date:x.date,pairId:x.pairId,group:d.group,disciplineId:d.id,discipline:d.name,type:x.type,
      workloadHours:hours,coverage:$("#plannerSeriesCoverage").value,teacherId:t.id,room:x.room,
      note:$("#plannerSeriesNote").value.trim(),repeatBatchId:batchId
    });
    item.audienceGroups=allocation.groups;
    item.disciplineIds=coverageIds.ids;
    if(allocation.stream)item.loadStreamId=allocation.stream.streamId;
    refreshScheduleAudienceMetadata(item);

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
        <label class="teacher-limit-field"><span>Максимум пар на день</span><input id="plannerAvailabilityMaxPerDay" type="number" min="1" value="${esc(t.maxPerDay||"")}" placeholder="Напр. 4" oninput="updateTeacherLimitUi('plannerAvailabilityMaxPerDay','plannerAvailabilityMaxPerDayStatus')"><div class="teacher-limit-tools"><span id="plannerAvailabilityMaxPerDayStatus" class="teacher-limit-status ${positiveTeacherLimit(t.maxPerDay)?"active":"unlimited"}">${teacherLimitStateText(t.maxPerDay)}</span><button type="button" class="teacher-limit-clear" onclick="clearTeacherLimit('plannerAvailabilityMaxPerDay','plannerAvailabilityMaxPerDayStatus')">Без обмежень</button></div></label>
        <label class="teacher-limit-field"><span>Максимум пар підряд</span><input id="plannerAvailabilityMaxConsecutive" type="number" min="1" value="${esc(t.maxConsecutive||"")}" placeholder="Напр. 3" oninput="updateTeacherLimitUi('plannerAvailabilityMaxConsecutive','plannerAvailabilityMaxConsecutiveStatus')"><div class="teacher-limit-tools"><span id="plannerAvailabilityMaxConsecutiveStatus" class="teacher-limit-status ${positiveTeacherLimit(t.maxConsecutive)?"active":"unlimited"}">${teacherLimitStateText(t.maxConsecutive)}</span><button type="button" class="teacher-limit-clear" onclick="clearTeacherLimit('plannerAvailabilityMaxConsecutive','plannerAvailabilityMaxConsecutiveStatus')">Без обмежень</button></div></label>
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
  t.maxPerDay=positiveTeacherLimit($("#plannerAvailabilityMaxPerDay")?.value)||"";
  t.maxConsecutive=positiveTeacherLimit($("#plannerAvailabilityMaxConsecutive")?.value)||"";

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
      <label class="teacher-limit-field"><span>Максимум пар на день</span><input id="plannerPopupMaxPerDay" type="number" min="1" value="${esc(t.maxPerDay||"")}" placeholder="Напр. 4" oninput="updateTeacherLimitUi('plannerPopupMaxPerDay','plannerPopupMaxPerDayStatus')"><div class="teacher-limit-tools"><span id="plannerPopupMaxPerDayStatus" class="teacher-limit-status ${positiveTeacherLimit(t.maxPerDay)?"active":"unlimited"}">${teacherLimitStateText(t.maxPerDay)}</span><button type="button" class="teacher-limit-clear" onclick="clearTeacherLimit('plannerPopupMaxPerDay','plannerPopupMaxPerDayStatus')">Без обмежень</button></div></label>
      <label class="teacher-limit-field"><span>Максимум пар підряд</span><input id="plannerPopupMaxConsecutive" type="number" min="1" value="${esc(t.maxConsecutive||"")}" placeholder="Напр. 3" oninput="updateTeacherLimitUi('plannerPopupMaxConsecutive','plannerPopupMaxConsecutiveStatus')"><div class="teacher-limit-tools"><span id="plannerPopupMaxConsecutiveStatus" class="teacher-limit-status ${positiveTeacherLimit(t.maxConsecutive)?"active":"unlimited"}">${teacherLimitStateText(t.maxConsecutive)}</span><button type="button" class="teacher-limit-clear" onclick="clearTeacherLimit('plannerPopupMaxConsecutive','plannerPopupMaxConsecutiveStatus')">Без обмежень</button></div></label>
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
  t.maxPerDay=positiveTeacherLimit($("#plannerPopupMaxPerDay")?.value)||"";
  t.maxConsecutive=positiveTeacherLimit($("#plannerPopupMaxConsecutive")?.value)||"";

  refreshPlannerAfterAction(d,t);
}

function sharedDisciplineCandidateForGroup(d,group){return db.disciplines.find(x=>x.status!=="archived"&&normIdentity(x.group)===normIdentity(group)&&normIdentity(x.name)===normIdentity(d.name)&&Number(x.semester)===Number(d.semester))||null;}
function plannerDisciplineIdsForAudience(d,t,type,audienceGroups){const ids=[],missing=[],details=[];(audienceGroups||[]).forEach(group=>{const peer=sharedDisciplineCandidateForGroup(d,group);if(!peer){missing.push(group);details.push(`${group}: дисципліну не активовано для ${d.semester} семестру`);return;}if(teacherTypePlan(peer,t.id,type)<=0){missing.push(group);details.push(`${group}: ${type} не розподілено викладачу ${teacherDisplay(t)}`);return;}ids.push(Number(peer.id));});return {ids:[...new Set(ids)],missing,details};}
function plannerRequestedStreamTypes(){const types=[];$$('[data-planner-entry]').forEach(row=>{const v=row.querySelector('[data-planner-type]')?.value;if(v)types.push(v);});$$('[data-series-row]').forEach(row=>{const use=row.querySelector('[data-series-use]');if(use&&!use.checked)return;const v=row.querySelector('[data-series-type]')?.value;if(v)types.push(v);});return uniqueStrings(types);}
function plannerWorkloadSchemeRowsHtml(d,t){const requested=new Set(plannerRequestedStreamTypes().map(normIdentity));return `<div class="planner-workload-scheme-list">${plannerTypes(d,t.id).map(x=>{const a=workloadAudienceForType(d,t.id,x.lt.name),active=!requested.size||requested.has(normIdentity(x.lt.name));return `<div class="planner-workload-scheme-row ${a.stream?"stream":"single"} ${active?"active":""}"><div><span>${esc(x.lt.name)}</span><b>${a.stream?esc(a.groups.join(" + ")):esc(d.group)}</b></div><strong>${a.stream?"ПОТІК":"ОКРЕМО"}</strong><small>${a.stream?`Схему задано в «Навантаженні». Цей вид автоматично стане однією спільною парою.`:`Цей вид занять ставиться тільки для ${esc(d.group)}.`}</small></div>`;}).join("")}</div>`;}
function plannerAudienceButtonsHtml(d,t){return `<div class="planner-stream-panel workload-driven"><div class="planner-stream-panel-head"><div><span>СХЕМА З «НАВАНТАЖЕННЯ»</span><b>Групи вже визначені видом заняття</b><small>Щоб змінити потік, повернися у «Навантаження». Тут система лише виконує задану схему.</small></div></div><div id="plannerWorkloadSchemeBody">${plannerWorkloadSchemeRowsHtml(d,t)}</div></div>`;}
function plannerSelectedAudienceGroups(d){return [d.group];}
function updatePlannerStreamAudience(disciplineId,teacherId){const d=disciplineById(disciplineId),t=teacherById(teacherId),box=$("#plannerWorkloadSchemeBody");if(d&&t&&box)box.innerHTML=plannerWorkloadSchemeRowsHtml(d,t);}
function plannerStreamAudienceChanged(disciplineId,teacherId){updatePlannerStreamAudience(disciplineId,teacherId);}

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
  updatePlannerStreamAudience(d.id,t.id);
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

  const plannerDatesMethodBtn=$("#plannerSeriesMethodDates");
  const plannerRuleMethodBtn=$("#plannerSeriesMethodRule");
  if(plannerDatesMethodBtn)plannerDatesMethodBtn.onclick=e=>{e.preventDefault();setPlannerSeriesMethod("dates");};
  if(plannerRuleMethodBtn)plannerRuleMethodBtn.onclick=e=>{e.preventDefault();setPlannerSeriesMethod("rule");};
  $("#plannerSeriesAddDates").onclick=e=>{e.preventDefault();plannerAddSeriesDatesFromText(d,t);};
  const plannerPaste=$("#plannerSeriesDatesPaste");
  if(plannerPaste)plannerPaste.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();plannerAddSeriesDatesFromText(d,t);}};
  $("#plannerSeriesGenerate").onclick=()=>plannerGenerateSeries(d,t);
  $("#plannerSeriesAddRow").onclick=()=>plannerAddSeriesRow(d,t);
  initAdHocRoomSelect($("#plannerSeriesBulkRoom"));
  $("#plannerSeriesApplyDefaults").onclick=()=>plannerApplySeriesDefaults(d,t);
  $("#plannerSeriesAutofill").onclick=()=>plannerAutofillSeriesTypes(d,t);
  $("#plannerSeriesSave").onclick=()=>savePlannerSeries(d,t);

  setPlannerSeriesMethod(null);
  plannerSeriesUpdateEmpty();
  plannerUpdateSeriesSummary(d,t);
  updatePlannerStreamAudience(d.id,t.id);
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
  const d=disciplineById(disciplineId);
  if(d&&disciplineAudienceMode(d)==="selected"&&!disciplineSelectedStudentIds(d).length){openDisciplineAudienceModal(d.id);return;}
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
  const date=disciplinePlannerState.date,byType={},draft=[],problems=[];

  rows.forEach((row,i)=>{
    const type=row.querySelector("[data-planner-type]").value,pairId=row.querySelector("[data-planner-pair]").value,room=rememberAdHocRoom(row.querySelector("[data-planner-room]").value);
    if(!type||!pairId||!room){problems.push(`Рядок ${i+1}: обери вид, пару й аудиторію.`);return;}
    const allocation=workloadAudienceForType(d,t.id,type);
    const coverageIds=plannerDisciplineIdsForAudience(d,t,type,allocation.groups);
    if(coverageIds.missing.length){problems.push(`${type}: ${coverageIds.details.join("; ")}.`);return;}
    const stat=plannerTypes(d,t.id).find(x=>x.lt.name===type),used=byType[type]||0,available=Math.max(0,(stat?.remaining||0)-used),hours=plannerDefaultUnit(type,available);
    if(hours<=0){problems.push(`${type}: години вже вичерпані.`);return;}
    byType[type]=used+hours;
    const item=lessonItemFromValues({date,pairId,group:d.group,disciplineId:d.id,discipline:d.name,type,workloadHours:hours,coverage:$("#plannerCoverage").value,teacherId:t.id,room,note:$("#plannerNote").value.trim(),repeatBatchId:`P${Date.now()}`});
    item.audienceGroups=allocation.groups;
    item.disciplineIds=coverageIds.ids;
    if(allocation.stream)item.loadStreamId=allocation.stream.streamId;
    refreshScheduleAudienceMetadata(item);
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
function datesForPattern(pattern,from,to,weekday,specific,bounds=academicYearBounds()){if(pattern==="dates")return [...new Set((specific||"").split(/[\s,;]+/).map(token=>parseReadyDateToken(token,bounds)).filter(x=>x&&dateInBounds(x,bounds)))].sort();const result=[];if(!from||!to)return result;let d=from;while(d<=to){if(dateInBounds(d,bounds)&&weekdayId(d)===Number(weekday))result.push(d);d=addDays(d,1);}return pattern==="biweekly"?result.filter((_,i)=>i%2===0):result;}
function openBulkScheduleModal(presetGroup=null){
  const group=presetGroup||bestWorkloadGroup();openModal(`<h2>Розставити за правилом</h2><div class="notice">Для випадків, коли одна й та сама пара повторюється щотижня або через тиждень.</div><form id="bf" class="form-grid"><label>Група<select id="bg">${groupOptions(group)}</select></label><label>Дисципліна<select id="bd">${disciplineOptionsForGroup(group,null,false)}</select></label><label>Вид заняття<select id="bt"></select></label><label>Викладач<select id="btea"></select></label><div id="bulkLoadHint" class="wide"></div><label>Повторення<select id="bpattern"><option value="weekly">Щотижня</option><option value="biweekly">Через тиждень</option><option value="dates">Конкретні дати</option></select></label><label>День тижня<select id="bweekday">${db.weekDays.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join("")}</select></label><label>Від<input id="bfrom" type="date" ${dateAttrs()}></label><label>До<input id="bto" type="date" ${dateAttrs()}></label><label id="bdatesLabel" class="wide" style="display:none">Конкретні дати<textarea id="bdates" rows="3" placeholder="03.09, 10.09, 17.09, 24.09"></textarea></label><label>Пара<select id="bpair">${pairOptions(bellPairs()[0]?.id||null,false)}</select></label>${programUsesRooms()?`<label>Аудиторія<select id="br">${scheduleRoomOptionsHtml("",{emptyLabel:"—"})}</select></label>`:`<input id="br" type="hidden" value=""><div class="notice success-notice"><b>Онлайн</b> · без аудиторії</div>`}<label>Годин за заняття<input id="bwh" type="number" min="0.01" step="0.01" value="2"></label><label>Охоплення<select id="bc">${db.coverageTypes.map(v=>`<option>${esc(v)}</option>`).join("")}</select></label><label class="wide">Примітка<input id="bn"></label><div class="wide"><button class="primary">Створити повтори</button></div></form>`,true);
  const refreshDisc=()=>{$("#bd").innerHTML=disciplineOptionsForGroup($("#bg").value,null,false);refreshType();};const refreshType=()=>{const d=disciplineById(Number($("#bd").value)),types=d?schedulableTypes(d):[];$("#bt").innerHTML=types.map(x=>`<option>${esc(x.name)}</option>`).join("");const b=d?semesterDateBounds(d.semester):academicYearBounds();const from=$("#bfrom"),to=$("#bto");[from,to].forEach(el=>{el.min=b.start;el.max=b.end;});if(!from.value||!dateInBounds(from.value,b))from.value=b.start;if(!to.value||!dateInBounds(to.value,b))to.value=b.end;refreshTeacher();};const refreshTeacher=()=>{const d=disciplineById(Number($("#bd").value)),type=$("#bt").value,teachers=d?allocatedTeachersForType(d,type):[];$("#btea").innerHTML=teachers.map(t=>`<option value="${t.id}">${esc(teacherDisplay(t))}</option>`).join("");const lt=lessonTypeByName(type);$("#bwh").value=lt?.defaultUnit||1;bulkHint();};const bulkHint=()=>{const d=disciplineById(Number($("#bd").value)),tid=Number($("#btea").value),type=$("#bt").value;if(!d||!tid){$("#bulkLoadHint").innerHTML=`<div class="conflict">Спочатку має бути розподілене навантаження.</div>`;return;}const p=teacherTypePlan(d,tid,type),used=scheduledLoad(d.id,tid,type),r=p-used;$("#bulkLoadHint").innerHTML=`<div class="load-hint-grid"><div><span>План</span><b>${fmtHours(p)} год</b></div><div><span>Виставлено</span><b>${fmtHours(used)} год</b></div><div><span>Залишок</span><b>${fmtHours(r)} год</b></div></div>`;};
  const toggleBulkDateMode=()=>{
    const dates=$("#bpattern")?.value==="dates";
    const label=$("#bdatesLabel");
    if(label){label.hidden=!dates;label.style.display=dates?"":"none";}
    ["#bweekday","#bfrom","#bto"].forEach(sel=>{const el=$(sel);if(el)el.disabled=dates;});
    const input=$("#bdates");if(input)input.disabled=!dates;
  };
  $("#bg").onchange=refreshDisc;$("#bd").onchange=refreshType;$("#bt").onchange=refreshTeacher;$("#btea").onchange=bulkHint;if(programUsesRooms())initAdHocRoomSelect($("#br"));
  const pattern=$("#bpattern");if(pattern){pattern.onchange=toggleBulkDateMode;pattern.oninput=toggleBulkDateMode;}
  refreshDisc();toggleBulkDateMode();
  $("#bf").onsubmit=e=>{e.preventDefault();const d=disciplineById(Number($("#bd").value)),tid=Number($("#btea").value),type=$("#bt").value;if(!d||!tid)return alert("Немає розподіленого навантаження.");let rem=remainingLoad(d,tid,type,null);if(rem<=0)return alert("Години вже вичерпані.");const bounds=semesterDateBounds(d.semester),dates=datesForPattern($("#bpattern").value,$("#bfrom").value,$("#bto").value,$("#bweekday").value,$("#bdates").value,bounds);if(!dates.length)return alert("Не знайдено дат.");const unit=num($("#bwh").value),valid=[],blocked=[],batchId=`B${Date.now()}`;for(const date of dates){if(rem<=0.0001)break;const wh=Math.min(unit,rem),item=lessonItemFromValues({date,pairId:$("#bpair").value,group:$("#bg").value,disciplineId:d.id,discipline:d.name,type,workloadHours:wh,coverage:$("#bc").value,teacherId:tid,room:rememberAdHocRoom($("#br").value),note:$("#bn").value.trim(),repeatBatchId:batchId}),cs=conflictsFor(item,null,valid),info=teacherAvailabilityInfo(item,null);if(cs.length||info.warnings.length){blocked.push({date,reasons:[...conflictReasonLines(item,cs),...info.warnings]});continue;}valid.push(item);rem-=wh;}if(!valid.length)return alert("Усі дати мають конфлікти:\n\n"+blocked.slice(0,8).map(x=>`${formatDate(x.date)} — ${x.reasons.join(" ")}`).join("\n"));if(blocked.length&&!confirm(`${blocked.length} дат буде пропущено:\n\n${blocked.slice(0,8).map(x=>`${formatDate(x.date)} — ${x.reasons.join(" ")}`).join("\n")}${blocked.length>8?"\n…":""}\n\nПродовжити?`))return;valid.forEach(item=>db.schedule.push({id:uid(db.schedule),...item}));closeModal();save();go("schedule");};
}
function deleteLesson(id){
  const x=db.schedule.find(s=>Number(s.id)===Number(id));if(!x)return;
  const label=[x.date?formatDate(x.date):"",pairDisplay(x),x.discipline].filter(Boolean).join(" · ");
  if(!confirmCascadeDelete(`Видалити заняття${label?` ${label}`:""}?`,["Години автоматично повернуться у залишок навантаження."]))return;
  db.schedule=db.schedule.filter(s=>Number(s.id)!==Number(id));
  currentEditingLessonId=null;closeModal();save();
}


/* Word export — course fragment in the same table language as faculty schedule */
let courseWordExportState={course:null,semester:null};
function wordSemesterFromMonth(month){
  const m=Number(String(month||"").slice(5,7));
  return m>=9&&m<=12?1:2;
}
function wordExportCourses(){
  return [...new Set(visibleGroups().map(g=>Number(g.course)).filter(Boolean))].sort((a,b)=>a-b);
}
function wordExportGroups(course){
  return visibleGroups().filter(g=>Number(g.course)===Number(course)).slice();
}
function wordExportStudentCount(code){
  return (db.students||[]).filter(s=>s.status!=="archived"&&normIdentity(s.group)===normIdentity(code)).length;
}
function wordExportPreviewHtml(){
  const course=Number(courseWordExportState.course),semester=Number(courseWordExportState.semester);
  const groups=wordExportGroups(course);
  let preview={events:0,groups:[]};
  try{preview=window.REMS_WORD_EXPORT?.preview?.(db,{course,semester,programId:activeProgramId(),programName:activeProgram()?.name||"",online:!programUsesRooms()})||preview;}catch(e){}
  return `<div class="word-export-preview">
    <div class="word-export-preview-head"><span>У WORD ПОТРАПЛЯТЬ</span><b>${esc(courseDisplayLabel(course))} · ${semester===2?"II":"I"} семестр</b></div>
    <div class="word-export-group-list">${groups.map(g=>`<div><b>${esc(g.code)}</b><span>${wordExportStudentCount(g.code)} студентів</span></div>`).join("")||`<div class="empty">Немає груп цього курсу.</div>`}</div>
    <div class="word-export-preview-foot"><b>${preview.events||0}</b><span>агрегованих блоків занять у документі</span></div>
  </div>`;
}
function refreshCourseWordExportModal(){
  const courses=wordExportCourses();
  const coursesMount=$("#wordExportCourseButtons"),semMount=$("#wordExportSemesterButtons"),previewMount=$("#wordExportPreview");
  if(coursesMount)coursesMount.innerHTML=courses.map(c=>{const gs=wordExportGroups(c);return `<button type="button" class="word-course-btn ${Number(courseWordExportState.course)===c?"active":""}" onclick="setCourseWordExportCourse(${c})"><b>${esc(courseDisplayLabel(c))}</b><span>${esc(gs.map(g=>g.code).join(" · ")||"без груп")}</span></button>`;}).join("");
  if(semMount)semMount.innerHTML=[1,2].map(s=>`<button type="button" class="word-semester-btn ${Number(courseWordExportState.semester)===s?"active":""}" onclick="setCourseWordExportSemester(${s})"><b>${s===1?"I":"II"} семестр</b><span>${s===1?"вересень — грудень":"січень — червень"}</span></button>`).join("");
  if(previewMount)previewMount.innerHTML=wordExportPreviewHtml();
}
function setCourseWordExportCourse(course){courseWordExportState.course=Number(course);refreshCourseWordExportModal();}
function setCourseWordExportSemester(semester){courseWordExportState.semester=Number(semester);refreshCourseWordExportModal();}
function openCourseWordExport(){
  const currentCourse=Number(groupCourse(timetableState.group))||wordExportCourses()[0]||1;
  courseWordExportState={course:currentCourse,semester:wordSemesterFromMonth(timetableState.month)};
  openModal(`<div class="word-export-modal">
    <div class="word-export-hero">
      <div><span>ЕКСПОРТ ДЛЯ ЗАГАЛЬНОГО РОЗКЛАДУ</span><h2>Word по курсу</h2><p>Один документ містить тільки групи нашої спеціальності вибраного курсу. Формат повторює факультетський зразок: № пари, тривалість, окремі колонки груп, дисципліна, вид заняття, дати, викладач і аудиторія.</p></div>
      <div class="word-export-icon">W</div>
    </div>
    <div class="word-export-section"><div class="word-export-section-title"><span>1</span><div><b>Оберіть курс</b><small>У документ підуть усі групи цього курсу з бази.</small></div></div><div id="wordExportCourseButtons" class="word-course-grid"></div></div>
    <div class="word-export-section"><div class="word-export-section-title"><span>2</span><div><b>Оберіть семестр</b><small>Дати автоматично відбираються з готового розкладу.</small></div></div><div id="wordExportSemesterButtons" class="word-semester-grid"></div></div>
    <div id="wordExportPreview"></div>
    <div class="word-export-note"><b>Для вставки у факультетський файл</b><span>Ширина кожної групової колонки збережена такою самою, як у надісланому зразку. Ми не додаємо блок «ЗАТВЕРДЖУЮ» та факультетські підписи — це саме фрагмент нашої спеціальності.</span></div>
    <div class="word-export-actions"><button class="secondary" type="button" onclick="closeModal()">Скасувати</button><button class="word-download-btn" type="button" onclick="downloadCourseWordExport()"><b>↓ Завантажити Word</b><span>.docx · готовий розклад курсу</span></button></div>
  </div>`,true);
  refreshCourseWordExportModal();
}
function downloadCourseWordExport(){
  const course=Number(courseWordExportState.course),semester=Number(courseWordExportState.semester);
  if(!window.REMS_WORD_EXPORT)return alert("Модуль Word-експорту не завантажився. Оновіть сторінку.");
  try{
    window.REMS_WORD_EXPORT.downloadCourseSchedule(db,{course,semester,programId:activeProgramId(),programName:activeProgram()?.name||"",online:!programUsesRooms()});
  }catch(e){
    alert(e?.message||"Не вдалося створити Word-файл.");
  }
}

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
  if(remembered&&visibleGroups().some(g=>normGroup(g.code)===normGroup(remembered)))return remembered;
  const candidates=visibleGroups().map(g=>({code:g.code,count:scheduleLessonsForGroup(g.code).length})).sort((a,b)=>b.count-a.count);
  return candidates[0]?.code||visibleGroups()[0]?.code||"";
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
  if(!visibleGroups().some(g=>normGroup(g.code)===normGroup(code)))return;
  timetableState.group=code;
  rememberTimetableGroup(code);
  timetableState.month=groupCurrentMonth();
  renderTimetable();
}
function setGroupTimetableMonth(month){if(!academicMonthTabs().some(x=>x.value===month))return;timetableState.month=month;renderTimetable();}
function shiftGroupTimetableMonth(delta){const months=academicMonthTabs(),idx=months.findIndex(x=>x.value===timetableState.month),next=months[idx+Number(delta)];if(next)setGroupTimetableMonth(next.value);}
function timetableToday(){setGroupTimetableMonth(groupCurrentMonth());}

/* ================================================================
   v1.9.1 · GROUP DAY PLANNER
   course → group → weekday → all semester dates × pairs 1..7
   ================================================================ */
const DAY_PLANNER_KEY="remsDayPlannerState_v1";
function loadDayPlannerState(){try{return JSON.parse(localStorage.getItem(DAY_PLANNER_KEY)||"{}")||{};}catch(e){return{};}}
let dayPlannerState={course:null,group:"",semester:null,weekday:null,...loadDayPlannerState()};
function rememberDayPlanner(){try{localStorage.setItem(DAY_PLANNER_KEY,JSON.stringify(dayPlannerState));}catch(e){}}
function dayPlannerCourses(){return [...new Set(sortedGroups().map(g=>Number(g.course)).filter(Number.isFinite))].sort((a,b)=>a-b);}
function dayPlannerGroups(course){return sortedGroups().filter(g=>Number(g.course)===Number(course));}
function dayPlannerSemesterForToday(){const d=currentAcademicDate(),b=academicYearBounds();return d<=`${b.startYear}-12-31`?1:2;}
function normalizeDayPlannerState(){
  const courses=dayPlannerCourses();if(!courses.length)return;
  if(!courses.includes(Number(dayPlannerState.course)))dayPlannerState.course=courses[0];
  const groups=dayPlannerGroups(dayPlannerState.course);
  if(!groups.some(g=>normGroup(g.code)===normGroup(dayPlannerState.group)))dayPlannerState.group=groups[0]?.code||"";
  if(![1,2].includes(Number(dayPlannerState.semester)))dayPlannerState.semester=dayPlannerSemesterForToday();
  if(![0,1,2,3,4,5,6].includes(Number(dayPlannerState.weekday)))dayPlannerState.weekday=weekdayId(currentAcademicDate());
  rememberDayPlanner();
}
function setDayPlannerCourse(course){dayPlannerState.course=Number(course);dayPlannerState.group=dayPlannerGroups(course)[0]?.code||"";rememberDayPlanner();renderDayPlanner();}
function setDayPlannerGroup(group){if(!dayPlannerGroups(dayPlannerState.course).some(g=>normGroup(g.code)===normGroup(group)))return;dayPlannerState.group=group;rememberDayPlanner();renderDayPlanner();}
function setDayPlannerSemester(semester){dayPlannerState.semester=Number(semester)===2?2:1;rememberDayPlanner();renderDayPlanner();}
function setDayPlannerWeekday(weekday){const n=Number(weekday);dayPlannerState.weekday=[0,1,2,3,4,5,6].includes(n)?n:1;rememberDayPlanner();renderDayPlanner();}
function dayPlannerWeekdayName(id){return ({0:"Неділя",1:"Понеділок",2:"Вівторок",3:"Середа",4:"Четвер",5:"П’ятниця",6:"Субота"})[Number(id)]||"";}
function dayPlannerWeekdayShort(id){return ({0:"Нд",1:"Пн",2:"Вт",3:"Ср",4:"Чт",5:"Пт",6:"Сб"})[Number(id)]||"";}
function dayPlannerGlobalSemester(course,half){return (Math.max(1,Number(course))-1)*2+(Number(half)===2?2:1);}
function dayPlannerPeriodKey(course,half){return `${Number(course)}-${Number(half)===2?2:1}`;}
function dayPlannerCurriculaForGroup(group){
  const course=Number(groupCourse(group));
  return (db.curricula||[]).filter(c=>{
    const groups=c.applicableGroups||[];
    if(groups.some(code=>normGroup(code)===normGroup(group)))return true;
    return !groups.length&&Number(c.course)===course;
  });
}
function dayPlannerPlanWeeks(group,half){
  const semesterNo=dayPlannerGlobalSemester(groupCourse(group),half);
  const values=dayPlannerCurriculaForGroup(group).map(c=>num(c.semesterWeeks?.[semesterNo]??c.semesterWeeks?.[String(semesterNo)])).filter(v=>v>0);
  return values[0]||0;
}
function dayPlannerDefaultStart(half){const y=academicYearBounds();return Number(half)===2?`${y.endYear}-02-01`:y.start;}
function dayPlannerPeriod(group,half){
  const key=dayPlannerPeriodKey(groupCourse(group),half),saved=db.studyPeriods?.[key]||{};
  const planWeeks=dayPlannerPlanWeeks(group,half),calendarBounds=semesterDateBounds(half);
  const start=clampDate(saved.start||dayPlannerDefaultStart(half),calendarBounds);
  const weeks=Math.max(0,Math.round(num(saved.weeks)||planWeeks));
  const end=weeks?([addDays(start,weeks*7-1),calendarBounds.end].sort()[0]):calendarBounds.end;
  return {key,start,end,weeks,planWeeks,semesterNo:dayPlannerGlobalSemester(groupCourse(group),half),calendarBounds,custom:!!(saved.start||saved.weeks)};
}
function openDayPlannerPeriodSettings(){
  const group=dayPlannerState.group,half=dayPlannerState.semester,p=dayPlannerPeriod(group,half),course=groupCourse(group);
  openModal(`<div class="day-period-modal"><span class="day-slot-choice-kicker">НАВЧАЛЬНИЙ ПЕРІОД</span><h2>${esc(courseDisplayLabel(course))} · ${Number(half)===1?"І":"ІІ"} семестр</h2><p>Тут задається саме період аудиторного навчання, а не весь календарний семестр. Для цієї групи навчальний план ${p.planWeeks?`містить <b>${p.planWeeks} навчальних тижнів</b>.`:"ще не містить кількості навчальних тижнів."}</p><form id="dayPeriodForm" class="form-grid"><label>Початок навчальних тижнів<input id="dayPeriodStart" type="date" ${dateAttrs(p.calendarBounds)} value="${esc(p.start)}"></label><label>Кількість навчальних тижнів<input id="dayPeriodWeeks" type="number" min="1" max="30" step="1" value="${esc(p.weeks||p.planWeeks||"")}" placeholder="напр. 10"></label><div class="wide notice">Після збереження вкладка «По днях груп» показуватиме тільки дати в межах цього навчального періоду. Налаштування спільне для всіх груп цього курсу.</div><div class="wide modal-footer-actions"><button class="primary">Зберегти період</button>${p.custom?`<button type="button" class="secondary" onclick="resetDayPlannerPeriod()">Взяти з навчального плану</button>`:""}</div></form></div>`,true);
  $("#dayPeriodForm").onsubmit=e=>{e.preventDefault();const weeks=Math.round(num($("#dayPeriodWeeks").value)),start=$("#dayPeriodStart").value;if(!start||weeks<1)return alert("Вкажи дату початку і кількість навчальних тижнів.");db.studyPeriods=db.studyPeriods||{};db.studyPeriods[p.key]={start,weeks};closeModal();save();renderDayPlanner();};
}
function resetDayPlannerPeriod(){const group=dayPlannerState.group,p=dayPlannerPeriod(group,dayPlannerState.semester);db.studyPeriods=db.studyPeriods||{};delete db.studyPeriods[p.key];closeModal();save();renderDayPlanner();}
function dayPlannerDates(semester,weekday){const group=dayPlannerState.group,p=dayPlannerPeriod(group,semester),out=[];let d=p.start;while(d<=p.end){if(weekdayId(d)===Number(weekday))out.push(d);d=addDays(d,1);}return out;}
function dayPlannerEvents(group,date,pairId){return groupEventsForDate(group,date).filter(ev=>String(groupEventSlotId(ev)||"")===String(pairId));}
function dayPlannerEventHtml(ev){
  const x=ev.data;
  if(ev.source==="schedule"){
    const click=isReadyExternalScheduleItem(x)?`openReadyScheduleModal(${x.id})`:`openLessonModal(${x.id})`,parts=scheduleAudiencePartitions(x),selected=parts.filter(p=>p.mode==="selected"),audienceNote=selected.length?`Вибіркова: ${selected.map(p=>`${p.group} · ${p.studentIds.length}`).join(" + ")}`:(scheduleAudienceGroups(x).length>1?`Потік: ${scheduleAudienceLabel(x)}`:""),names=scheduleAudienceStudentNames(x);
    return `<button type="button" class="day-planner-event subject-colored ${selected.length?"selective":""}" style="${scheduleColorVars(x)}" title="${esc(names.join(", "))}" onclick="event.stopPropagation();${click}"><b>${esc(x.discipline||"Заняття")}</b><span>${esc(x.teacher||"викладач не вказаний")}</span><strong>${x.room?`ауд. ${esc(x.room)}`:"без аудиторії"}</strong>${x.type?`<small>${esc(x.type)}</small>`:""}${audienceNote?`<em>${esc(audienceNote)}</em>`:""}</button>`;
  }
  return `<button type="button" class="day-planner-event booking" onclick="event.stopPropagation();openRoomBookingModal(${x.id})"><b>${esc(x.title||roomBookingLabel(x))}</b><span>${esc(x.teacher||x.kind||"Бронювання")}</span><strong>${x.room?`ауд. ${esc(x.room)}`:"без аудиторії"}</strong><small>${esc(x.kind||"")}</small></button>`;
}
function openDayPlannerSlot(date,pairId,group){
  const pair=pairById(pairId),safeGroup=String(group).replaceAll("'","\\'");
  openModal(`<div class="day-slot-choice"><span class="day-slot-choice-kicker">ВІЛЬНЕ МІСЦЕ</span><h2>${esc(group)} · ${formatDate(date)}</h2><p>${esc(dayPlannerWeekdayName(weekdayId(date)))} · ${esc(pair?.id||pairId)} пара · ${esc(pair?.start||"")}–${esc(pair?.end||"")}</p><div class="day-slot-choice-grid"><button type="button" class="day-slot-choice-btn department" onclick="closeModal();openLessonModal(null,{group:'${safeGroup}',date:'${date}',pairId:${Number(pairId)}})"><span>КАФЕДРА</span><b>+ Кафедральна пара</b><small>із уже розподіленого навантаження</small></button><button type="button" class="day-slot-choice-btn external" onclick="closeModal();readySchedulePreset={group:'${safeGroup}',date:'${date}',pairId:${Number(pairId)}};openReadyScheduleModal()"><span>ГОТОВИЙ РОЗКЛАД</span><b>+ Пара іншої кафедри</b><small>без списання нашого навантаження</small></button></div></div>`);
}
function dayPlannerCellHtml(group,date,pair){
  const events=dayPlannerEvents(group,date,pair.id),safeGroup=String(group).replaceAll("'","\\'");
  if(events.length){
    const scheduleItems=events.filter(ev=>ev.source==="schedule").map(ev=>ev.data);
    const hasGroupBooking=events.some(ev=>ev.source!=="schedule");
    const coverage=hasGroupBooking?{free:0}:groupSlotAudienceCoverage(group,scheduleItems);
    return `<div class="day-planner-cell occupied ${coverage.free>0?"partial":""}">${events.map(dayPlannerEventHtml).join("")}${coverage.free>0?`<button type="button" class="day-planner-parallel-add" onclick="event.stopPropagation();openDayPlannerSlot('${date}',${Number(pair.id)},'${safeGroup}')"><span>+</span><b>Паралельно</b><small>${coverage.free} студентів ще вільні</small></button>`:""}</div>`;
  }
  return `<button type="button" class="day-planner-cell free" onclick="openDayPlannerSlot('${date}',${Number(pair.id)},'${safeGroup}')"><span>+</span><b>Вільно</b><small>поставити пару</small></button>`;
}
function dayPlannerDateHeadHtml(group,date,index=0){
  const count=groupEventsForDate(group,date).length,[y,m,d]=date.split("-");
  const months={"01":"січ","02":"лют","03":"бер","04":"кві","05":"тра","06":"чер","07":"лип","08":"сер","09":"вер","10":"жов","11":"лис","12":"гру"};
  return `<div class="day-planner-date-head ${count?"has-events":""} ${date===localTodayISO()?"today":""}" data-dayplanner-date="${date}"><b>${d}.${m}</b><span>${months[m]||y}</span><small>${index+1} тиж. · ${count?`${count} под.`:"вільно"}</small></div>`;
}
function dayPlannerCourseButtonsHtml(){return `<div class="day-planner-course-row">${dayPlannerCourses().map(c=>`<button type="button" class="day-planner-course ${Number(dayPlannerState.course)===Number(c)?"active":""}" onclick="setDayPlannerCourse(${c})"><span>${c}</span><b>${esc(courseDisplayLabel(c))}</b><small>${dayPlannerGroups(c).map(g=>g.code).join(" · ")}</small></button>`).join("")}</div>`;}
function dayPlannerGroupButtonsHtml(){const list=dayPlannerGroups(dayPlannerState.course);return `<div class="day-planner-group-row">${list.map(g=>`<button type="button" class="day-planner-group ${normGroup(g.code)===normGroup(dayPlannerState.group)?"active":""}" onclick="setDayPlannerGroup('${String(g.code).replaceAll("'","\\'")}')"><b>${esc(g.code)}</b><span>${groupStudentCount(g.code)} студентів</span></button>`).join("")}</div>`;}
function dayPlannerWeekdayButtonsHtml(){const order=[1,2,3,4,5,6,0];return `<div class="day-planner-weekdays">${order.map(id=>`<button type="button" class="${Number(dayPlannerState.weekday)===id?"active":""}" onclick="setDayPlannerWeekday(${id})"><b>${dayPlannerWeekdayShort(id)}</b><span>${dayPlannerWeekdayName(id)}</span></button>`).join("")}</div>`;}
function dayPlannerScrollCurrent(){const wrap=$("#dayPlannerGridWrap");if(!wrap)return;const dates=dayPlannerDates(dayPlannerState.semester,dayPlannerState.weekday),today=currentAcademicDate(),target=dates.find(d=>d>=today)||dates[dates.length-1],el=target?wrap.querySelector(`[data-dayplanner-date="${target}"]`):null;if(el)wrap.scrollTo({left:Math.max(0,el.offsetLeft-180),behavior:"smooth"});}
function renderDayPlanner(){
  normalizeDayPlannerState();const group=dayPlannerState.group;
  if(!group){$("#page-dayPlanner").innerHTML=`<div class="card section"><div class="empty">Спочатку додай групи.</div></div>`;return;}
  const period=dayPlannerPeriod(group,dayPlannerState.semester),dates=dayPlannerDates(dayPlannerState.semester,dayPlannerState.weekday),pairs=bellPairs().slice().sort((a,b)=>Number(a.id)-Number(b.id)).slice(0,7),occupied=dates.reduce((sum,date)=>sum+pairs.filter(p=>dayPlannerEvents(group,date,p.id).length).length,0),free=Math.max(0,dates.length*pairs.length-occupied),semLabel=Number(dayPlannerState.semester)===1?"І семестр":"ІІ семестр";
  const periodText=period.weeks?`${period.weeks} навч. тижнів · ${formatDate(period.start)} — ${formatDate(period.end)}`:`кількість навчальних тижнів не задана`,denseClass=dates.length>=11?"dense":"";
  $("#page-dayPlanner").innerHTML=`<div class="day-planner-page"><div class="card section day-planner-control-card"><div class="section-head"><div><span class="day-planner-eyebrow">РОЗКЛАД ПО ДНЯХ</span><h2>Де ще можна поставити пару</h2><div class="small">Обери курс, групу, семестр і день тижня. Показуються тільки навчальні тижні, а не весь календарний семестр.</div></div><div class="day-planner-summary"><div><b>${occupied}</b><span>зайнято</span></div><div><b>${free}</b><span>вільно</span></div></div></div><div class="day-planner-control-section"><div class="day-planner-control-label"><span>1</span><b>Курс</b></div>${dayPlannerCourseButtonsHtml()}</div><div class="day-planner-control-section"><div class="day-planner-control-label"><span>2</span><b>Група</b></div>${dayPlannerGroupButtonsHtml()}</div><div class="day-planner-control-section"><div class="day-planner-control-label"><span>3</span><b>Семестр</b></div><div class="day-planner-semesters"><button class="${Number(dayPlannerState.semester)===1?"active":""}" onclick="setDayPlannerSemester(1)"><b>І семестр</b><span>${dayPlannerPlanWeeks(group,1)?`${dayPlannerPlanWeeks(group,1)} навч. тижнів`:"налаштувати період"}</span></button><button class="${Number(dayPlannerState.semester)===2?"active":""}" onclick="setDayPlannerSemester(2)"><b>ІІ семестр</b><span>${dayPlannerPlanWeeks(group,2)?`${dayPlannerPlanWeeks(group,2)} навч. тижнів`:"налаштувати період"}</span></button></div></div><div class="day-planner-control-section"><div class="day-planner-control-label"><span>4</span><b>День</b></div>${dayPlannerWeekdayButtonsHtml()}</div></div><div class="card section day-planner-table-card"><div class="day-planner-table-head"><div><span>${esc(group)} · ${esc(courseDisplayLabel(groupCourse(group)))} · ${esc(semLabel)}</span><h3>${esc(dayPlannerWeekdayName(dayPlannerState.weekday))}</h3><p>${esc(periodText)}</p></div><div class="day-planner-head-actions"><span class="day-planner-week-count">${dates.length} дат</span><button class="secondary" onclick="openDayPlannerPeriodSettings()">⚙ Навчальний період</button></div></div>${!period.weeks?`<div class="day-planner-period-warning"><b>Кількість навчальних тижнів не задана.</b><span>Зараз показано календарний діапазон. Натисни «Навчальний період» і вкажи реальну кількість тижнів.</span></div>`:""}<div id="dayPlannerGridWrap" class="day-planner-grid-wrap"><div class="day-planner-grid ${denseClass}" style="--day-count:${Math.max(1,dates.length)}"><div class="day-planner-corner"><b>Пара</b><span>час</span></div>${dates.map((date,i)=>dayPlannerDateHeadHtml(group,date,i)).join("")}${pairs.map(pair=>`<div class="day-planner-pair-head"><b>${esc(pair.id)}</b><span>${esc(pair.start||"")}–${esc(pair.end||"")}</span></div>${dates.map(date=>dayPlannerCellHtml(group,date,pair)).join("")}`).join("")}</div></div><div class="day-planner-legend"><span><i class="occupied"></i> заняття вже стоїть</span><span><i class="free"></i> вільна дата</span><b>Клік по заняттю — редагувати · клік по «Вільно» — додати</b></div></div></div>`;
}
function renderTimetable(){
  if(!timetableState.group||!visibleGroups().some(g=>normGroup(g.code)===normGroup(timetableState.group))){timetableState.group=bestTimetableGroup();rememberTimetableGroup(timetableState.group);}
  if(!timetableState.month||!academicMonthAllowed(timetableState.month))timetableState.month=groupCurrentMonth();
  const group=timetableState.group,month=timetableState.month,days=calendarMonthDays(month),months=academicMonthTabs(),idx=months.findIndex(x=>x.value===month),info=months[idx];
  const monthCount=groupMonthEventCount(group,month),total=scheduleLessonsForGroup(group).length;
  const weekdays=["Пн","Вт","Ср","Чт","Пт","Сб","Нд"],today=localTodayISO();
  $("#page-timetable").innerHTML=`<div class="teacher-month-page group-month-page">
    <div class="card section teacher-month-header">
      <div class="section-head"><div><h2>Розклад групи</h2><div class="small">Усі виставлені заняття беруться безпосередньо зі «Складання розкладу».</div></div><div class="actions"><button class="word-course-export-btn" onclick="openCourseWordExport()"><span>WORD</span><b>↓ Word по курсу</b></button></div></div>
      <div class="group-timetable-switch-head">
        <div>
          <span>Група</span>
          <b>${esc(group)} · ${esc(courseDisplayLabel(groupCourse(group)))}</b>
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

          <div class="card settings-card settings-backup-entry">
            <div class="settings-backup-entry-icon">↺</div>
            <div>
              <h3>Резервні копії</h3>
              <p class="small">10 локальних контрольних точок, автоматичне страхування та повний JSON-експорт.</p>
            </div>
            <button class="primary" onclick="openBackupCenter()">Відкрити центр копій</button>
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
$("#importFile").onchange=async e=>{
  const f=e.target.files[0];
  e.target.value="";
  if(!f)return;
  await importBackupFile(f);
};
async function resetData(){
  if(!confirm("Повернути початкові дані? Поточний стан буде спочатку збережено страховою контрольною точкою."))return;
  try{await createLocalBackup("Перед скиданням даних",db,"safety");}catch(e){}
  db=clone(window.REMS_INITIAL_DATA);
  save();
  go("home");
}

renderProgramScopeUI();

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
