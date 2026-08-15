
const KEY="remsScheduleData_v08";
const OLD_KEYS=["remsScheduleData_v07","remsScheduleData_v06","remsScheduleData_v051","remsScheduleData_v04","remsScheduleData_v02","remsScheduleData_v01"];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clone=x=>JSON.parse(JSON.stringify(x));
function esc(v=""){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function uid(arr){return arr.length?Math.max(...arr.map(x=>Number(x.id)||0))+1:1;}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}
function fmtHours(v){const n=num(v);return Number.isInteger(n)?String(n):n.toFixed(2).replace(/0+$/,"").replace(/\.$/,"");}
function formatDate(s){if(!s)return"—";const[y,m,d]=s.split("-");return`${d}.${m}.${y}`}
function monthLabel(s){if(!s)return"";const [y,m]=s.split("-");const names=["","Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];return `${names[Number(m)]} ${y}`}
function timeOverlap(aStart,aEnd,bStart,bEnd){return aStart<bEnd&&aEnd>bStart}

function migrate(old){
  const fresh=clone(window.REMS_INITIAL_DATA);
  if(!old||typeof old!=="object") return fresh;
  fresh.groups=old.groups||fresh.groups;
  fresh.students=old.students||fresh.students;
  fresh.rooms=old.rooms||fresh.rooms;
  fresh.academicYear=old.academicYear||fresh.academicYear;
  fresh.semester=old.semester||fresh.semester;
  fresh.bellSchedule=old.bellSchedule||fresh.bellSchedule||[];
  fresh.lessonTypes=(old.lessonTypes||fresh.lessonTypes).map((x,i)=>typeof x==="string"?{
    id:i+1,name:x,countMode:"manual",defaultUnit:1,description:""
  }:{...x,id:x.id||i+1});
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
function save(){db.schemaVersion=8;localStorage.setItem(KEY,JSON.stringify(db));renderCurrent();}
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
  timetable:["Розклад","Календар занять конкретної групи"],
  groups:["Групи","Курси та шифри груп"],
  students:["Студенти","Редагована база студентів"],
  rooms:["Аудиторії","Перелік приміщень кафедри"],
  teachers:["Викладачі","Профілі, кадрові дані та картки навантаження"],
  curricula:["Навчальні плани","Першоджерело дисциплін, годин і навантаження"],
  disciplines:["Дисципліни / навантаження","Розподіл дисциплін і годин між викладачами"],
  lessonTypes:["Види занять","Правила підрахунку годин"],
  settings:["Налаштування","Навчальний рік, семестр і резервні копії"]
};
$$(".nav-btn").forEach(b=>b.onclick=()=>go(b.dataset.page));
$("#quickAdd").onclick=()=>openLessonModal();
$("#modalClose").onclick=closeModal;
$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
function go(p){
  currentPage=p;
  $$(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
  $$(".page").forEach(x=>x.classList.remove("active"));
  $("#page-"+p).classList.add("active");
  $("#pageTitle").textContent=meta[p][0];
  $("#pageSubtitle").textContent=meta[p][1];
  $("#quickAdd").style.display=p==="settings"?"none":"";
  renderCurrent();
}
function renderCurrent(){
  ({home:renderHome,schedule:renderSchedule,timetable:renderTimetable,groups:renderGroups,students:renderStudents,rooms:renderRooms,teachers:renderTeachers,curricula:renderCurricula,disciplines:renderDisciplines,lessonTypes:renderLessonTypes,settings:renderSettings}[currentPage])();
}
function openModal(html,wide=false){$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden");$("#modal").querySelector(".modal-card").classList.toggle("modal-wide",wide);}
function closeModal(){$("#modal").classList.add("hidden");$("#modalBody").innerHTML="";}

function renderHome(){
  const today=new Date().toISOString().slice(0,10);
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
      <div class="section-head"><h2>Сьогодні</h2><button class="primary" onclick="openLessonModal()">+ Заняття</button></div>
      ${todays.length?miniSchedule(todays):`<div class="empty">На сьогодні занять ще немає.</div>`}
    </div>`;
}
function miniSchedule(rows){
  return `<div class="table-wrap"><table><thead><tr><th>Пара</th><th>Група</th><th>Дисципліна</th><th>Викладач</th><th>Аудиторія</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(pairDisplay(x))}</b>${pairTimeDisplay(x)?`<div class="small">${esc(pairTimeDisplay(x))}</div>`:""}</td><td>${esc(x.group)}</td><td>${esc(x.discipline||"—")}</td><td>${esc(x.teacher||"—")}</td><td><b>${esc(x.room||"—")}</b></td></tr>`).join("")}</tbody></table></div>`;
}

/* Groups */
function renderGroups(){
  $("#page-groups").innerHTML=`<div class="card section"><div class="section-head"><h2>Усі групи</h2><button class="primary" onclick="addGroup()">+ Додати групу</button></div><div class="table-wrap"><table><thead><tr><th>Курс</th><th>Група</th><th>Студентів</th><th></th></tr></thead><tbody>${db.groups.slice().sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`<tr><td>${g.course}</td><td><b>${esc(g.code)}</b></td><td>${groupStudentCount(g.code)}</td><td class="actions"><button onclick="editGroup(${g.id})">Редагувати</button><button onclick="deleteGroup(${g.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div></div>`;
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
function renderStudents(){
  $("#page-students").innerHTML=`<div class="card section"><div class="section-head"><h2>Студенти</h2><button class="primary" onclick="addStudent()">+ Додати студента</button></div><div class="toolbar"><input id="studentSearch" placeholder="Пошук…"><select id="studentGroupFilter"><option value="">Усі групи</option>${groupOptions()}</select></div><div id="studentTable"></div></div>`;
  $("#studentSearch").oninput=renderStudentTable;$("#studentGroupFilter").onchange=renderStudentTable;renderStudentTable();
}
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
function renderRooms(){
  $("#page-rooms").innerHTML=`<div class="card section"><div class="section-head"><h2>Аудиторії</h2><button class="primary" onclick="addRoom()">+ Додати аудиторію</button></div><div class="table-wrap"><table><thead><tr><th>Аудиторія</th><th>Статус</th><th></th></tr></thead><tbody>${db.rooms.filter(r=>r.status!=="archived").map(r=>`<tr><td><b>${esc(r.name)}</b></td><td><span class="badge ok">АКТИВНА</span></td><td class="actions"><button onclick="editRoom(${r.id})">Редагувати</button><button onclick="deleteRoom(${r.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div></div>`;
}
function addRoom(){const n=prompt("Номер або назва аудиторії:");if(!n)return;if(db.rooms.some(r=>r.name.toLowerCase()===n.trim().toLowerCase()))return alert("Така аудиторія вже є.");db.rooms.push({id:uid(db.rooms),name:n.trim(),status:"active",note:""});save();}
function editRoom(id){const r=db.rooms.find(x=>x.id===id),n=prompt("Аудиторія:",r.name);if(n){r.name=n.trim();save();}}
function deleteRoom(id){const r=db.rooms.find(x=>x.id===id);if(confirm(`Видалити аудиторію ${r.name}?`)){db.rooms=db.rooms.filter(x=>x.id!==id);save();}}

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
function teacherPlannedHours(t){
  if(t.scope==="external")return 0;
  let total=0;
  db.disciplines.filter(d=>d.status!=="archived"&&(d.teacherIds||[]).map(Number).includes(Number(t.id))).forEach(d=>{
    const load=d.teacherLoads?.[t.id]||d.teacherLoads?.[String(t.id)];
    if(load)total+=Object.values(load).reduce((a,b)=>a+num(b),0);
    else if((d.teacherIds||[]).length===1)total+=totalDisciplineHours(d);
  });
  return total;
}
function teacherScheduledHours(t){
  if(t.scope==="external")return 0;
  return db.schedule.filter(s=>Number(s.teacherId)===Number(t.id)&&s.disciplineId).reduce((a,s)=>a+num(s.workloadHours),0);
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
      <div class="actions teacher-actions"><button onclick="openTeacherWorkload(${t.id})">Картка навантаження</button><button onclick="openTeacherModal(${t.id})">Редагувати</button><button onclick="deleteTeacher(${t.id})">Видалити</button></div>
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
  const load=d.teacherLoads?.[teacherId]||d.teacherLoads?.[String(teacherId)];
  if(load)return Object.values(load).reduce((a,b)=>a+num(b),0);
  if((d.teacherIds||[]).length===1&&Number(d.teacherIds[0])===Number(teacherId))return totalDisciplineHours(d);
  return 0;
}
function plannedTypeForTeacher(teacherId,typeId){
  let total=0;
  db.disciplines.filter(d=>(d.teacherIds||[]).map(Number).includes(Number(teacherId))).forEach(d=>{
    const load=d.teacherLoads?.[teacherId]||d.teacherLoads?.[String(teacherId)];
    if(load)total+=num(load[typeId]);
    else if((d.teacherIds||[]).length===1)total+=num(d.hours?.[typeId]);
  });
  return total;
}
function scheduledForTeacherType(teacherId,typeName){
  return db.schedule.filter(s=>Number(s.teacherId)===Number(teacherId)&&s.disciplineId&&s.type===typeName).reduce((a,s)=>a+num(s.workloadHours),0);
}
function openTeacherWorkload(id){
  const t=teacherById(id);if(!t||t.scope==="external")return;
  const disciplines=db.disciplines.filter(d=>d.status!=="archived"&&(d.teacherIds||[]).map(Number).includes(Number(id)));
  const planned=teacherPlannedHours(t),scheduled=teacherScheduledHours(t),target=teacherTargetHours(t),remaining=planned-scheduled;
  const typeRows=db.lessonTypes.map(lt=>{
    const p=plannedTypeForTeacher(id,lt.id),s=scheduledForTeacherType(id,lt.name);
    return `<tr><td>${esc(lt.name)}</td><td>${fmtHours(p)}</td><td>${fmtHours(s)}</td><td class="${p-s<0?"negative":""}">${fmtHours(p-s)}</td></tr>`;
  }).filter(x=>!x.includes("<td>0</td><td>0</td><td>0</td>")).join("");
  const discRows=disciplines.map(d=>{
    const p=plannedForDisciplineTeacher(d,id);
    const s=db.schedule.filter(x=>Number(x.teacherId)===Number(id)&&Number(x.disciplineId)===Number(d.id)).reduce((a,x)=>a+num(x.workloadHours),0);
    return `<tr><td><b>${esc(d.name)}</b></td><td>${esc(d.group||"—")}</td><td>${d.course||groupCourse(d.group)||"—"}</td><td>${groupStudentCount(d.group)}</td><td>${d.semester||"—"}</td><td>${esc(d.controlForm||"—")}</td><td>${fmtHours(p)}</td><td>${fmtHours(s)}</td><td>${fmtHours(p-s)}</td></tr>`;
  }).join("");
  const monthMap={};
  db.schedule.filter(x=>Number(x.teacherId)===Number(id)&&x.disciplineId&&x.date).forEach(x=>{const k=x.date.slice(0,7);monthMap[k]=(monthMap[k]||0)+num(x.workloadHours);});
  const monthRows=Object.keys(monthMap).sort().map(k=>`<tr><td>${monthLabel(k+"-01")}</td><td>${fmtHours(monthMap[k])}</td></tr>`).join("");
  const underOver=target?planned-target:null;
  openModal(`<div class="workload-card">
    <div class="workload-title"><div><h2>Картка навантаження</h2><h3>${esc(t.name)}</h3></div><span class="badge ok">${esc(db.academicYear)}</span></div>
    <div class="teacher-meta workload-profile">
      <div><b>Посада</b><span>${esc(t.position||"—")}</span></div><div><b>Вчене звання</b><span>${esc(t.academicTitle||"—")}</span></div>
      <div><b>Науковий ступінь</b><span>${esc(t.degree||"—")}</span></div><div><b>Почесне звання</b><span>${esc(t.honoraryTitle||"—")}</span></div>
      <div><b>Зайнятість</b><span>${esc(t.employmentType||"—")}</span></div><div><b>Ставка</b><span>${t.rate!==""?esc(t.rate):"—"}</span></div>
      <div><b>Період роботи</b><span>${esc(teacherEmploymentText(t))}</span></div><div><b>Норма на 1 ставку</b><span>${t.teachingNormPerRate?fmtHours(t.teachingNormPerRate)+" год":"—"}</span></div>
    </div>
    <div class="grid-kpi workload-kpi">
      ${kpi("Ціль за ставкою",target?fmtHours(target)+" год":"—")}
      ${kpi("План з дисциплін",fmtHours(planned)+" год")}
      ${kpi("Виставлено в розклад",fmtHours(scheduled)+" год")}
      ${kpi("Залишилось виставити",fmtHours(remaining)+" год")}
    </div>
    ${underOver!==null?`<div class="notice">${underOver===0?"План відповідає цільовому обсягу за ставкою.":underOver>0?`План перевищує ціль за ставкою на ${fmtHours(underOver)} год.`:`До цільового обсягу за ставкою не вистачає ${fmtHours(Math.abs(underOver))} год.`}</div>`:""}
    <h3>Дисципліни та групи</h3>
    ${discRows?`<div class="table-wrap"><table><thead><tr><th>Дисципліна</th><th>Група</th><th>Курс</th><th>Студентів</th><th>Семестр</th><th>Контроль</th><th>План</th><th>У розкладі</th><th>Залишок</th></tr></thead><tbody>${discRows}</tbody></table></div>`:`<div class="empty">Дисципліни ще не прив’язані.</div>`}
    <h3>Навантаження за видами роботи</h3>
    ${typeRows?`<div class="table-wrap"><table><thead><tr><th>Вид роботи</th><th>План</th><th>У розкладі</th><th>Залишок</th></tr></thead><tbody>${typeRows}</tbody></table></div>`:`<div class="empty">Години ще не задані.</div>`}
    <h3>Розподіл виставлених годин за місяцями</h3>
    ${monthRows?`<div class="table-wrap small-table"><table><thead><tr><th>Місяць</th><th>Годин у розкладі</th></tr></thead><tbody>${monthRows}</tbody></table></div>`:`<div class="empty">У розкладі ще немає годин цього викладача.</div>`}
    <div class="notice">Картка рахує план із кафедральних дисциплін і те, що вже виставлено у розклад. Окремий облік фактично проведених занять можна додати наступним етапом.</div>
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
  d.teacherLoads=d.teacherLoads||{};
  const tids=(d.teacherIds||[]).map(Number);
  db.lessonTypes.forEach(lt=>{
    const newTotal=num(newHours[lt.id]);
    const vals=tids.map(tid=>num((d.teacherLoads?.[tid]||d.teacherLoads?.[String(tid)]||{})[lt.id]));
    const allocTotal=vals.reduce((a,b)=>a+b,0);
    if(allocTotal>0){
      let running=0;
      tids.forEach((tid,idx)=>{
        d.teacherLoads[tid]=d.teacherLoads[tid]||{};
        const v=idx===tids.length-1?Math.max(0,newTotal-running):Math.round((vals[idx]/allocTotal*newTotal)*100)/100;
        d.teacherLoads[tid][lt.id]=v;running+=v;
      });
    }else if(tids.length===1){
      d.teacherLoads[tids[0]]=d.teacherLoads[tids[0]]||{};
      d.teacherLoads[tids[0]][lt.id]=newTotal;
    }else{
      tids.forEach(tid=>{d.teacherLoads[tid]=d.teacherLoads[tid]||{};d.teacherLoads[tid][lt.id]=0;});
    }
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

function renderDisciplines(){
  const rows=db.disciplines.filter(d=>d.status!=="archived").sort((a,b)=>(a.course||99)-(b.course||99)||a.name.localeCompare(b.name));
  $("#page-disciplines").innerHTML=`<div class="card section"><div class="section-head"><h2>Дисципліни кафедри</h2><button class="primary" onclick="openDisciplineModal()">+ Додати дисципліну</button></div><div class="notice">Загальноосвітні / зовнішні дисципліни сюди додавати не обов’язково — їх можна ввести безпосередньо в розкладі.</div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>Дисципліна</th><th>Група</th><th>Семестр</th><th>Викладачі</th><th>Контроль</th><th>Години</th><th></th></tr></thead><tbody>${rows.map(d=>`<tr><td><span class="color-dot" style="background:${esc(d.color||"#8b5cf6")}"></span><b>${esc(d.name)}</b><div class="small">${esc(d.academicYear||"")}</div></td><td>${esc(d.group||"—")}</td><td>${d.semester||"—"}</td><td>${esc(teacherNames(d.teacherIds)||"—")}</td><td>${esc(d.controlForm||"—")}</td><td><b>${fmtHours(totalDisciplineHours(d))}</b></td><td class="actions"><button onclick="openDisciplineModal(${d.id})">Редагувати</button><button onclick="deleteDiscipline(${d.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Дисциплін ще немає.</div>`}</div>`;
}
function renderAllocationEditor(existingLoads={}){
  const ids=[...$("#dteachers").selectedOptions].map(o=>+o.value);
  const box=$("#teacherAllocation");
  if(!ids.length){box.innerHTML=`<div class="empty">Спочатку виберіть викладача.</div>`;return;}
  box.innerHTML=ids.map(id=>{
    const t=teacherById(id),load=existingLoads?.[id]||existingLoads?.[String(id)]||{};
    return `<div class="allocation-card" data-teacher-load="${id}"><b>${esc(teacherDisplay(t))}</b><div class="hours-grid">${db.lessonTypes.map(lt=>`<label>${esc(lt.name)}<input class="dtl" data-type="${lt.id}" type="number" min="0" step="0.01" value="${esc(load[lt.id]||0)}"></label>`).join("")}</div></div>`;
  }).join("");
}
function autofillSingleTeacher(){
  const ids=[...$("#dteachers").selectedOptions].map(o=>+o.value);
  if(ids.length!==1)return alert("Автозаповнення працює, коли вибраний один викладач.");
  const card=$(`[data-teacher-load="${ids[0]}"]`);if(!card)return;
  card.querySelectorAll(".dtl").forEach(inp=>{const source=$(`.dh[data-type="${inp.dataset.type}"]`);inp.value=source?.value||0;});
}
function openDisciplineModal(id=null){
  const d=id?disciplineById(id):{name:"",course:"",group:"",semester:db.semester,academicYear:db.academicYear,teacherIds:[],teacherLoads:{},controlForm:"Немає",color:"#8b5cf6",hours:{},note:"",status:"active"};
  const fromPlan=!!d.sourceCurriculumId,lock=fromPlan?'disabled':'',ro=fromPlan?'readonly':'';
  const hours=db.lessonTypes.map(t=>`<label>${esc(t.name)}<input class="dh" data-type="${t.id}" type="number" min="0" step="0.01" value="${esc(d.hours?.[t.id]||0)}" ${ro}></label>`).join("");
  openModal(`<h2>${id?"Редагувати":"Нова"} дисципліна кафедри</h2>${fromPlan?`<div class="notice success-notice">Ця дисципліна створена з навчального плану. Назва, семестр, контроль і загальні години редагуються <b>у навчальному плані</b> та синхронізуються сюди автоматично.</div>`:""}<form id="df" class="form-grid">
    <label class="wide">Назва дисципліни<input id="dn" value="${esc(d.name)}" required ${ro}></label>
    <label>Група<select id="dg" ${lock}><option value="">—</option>${groupOptions(d.group)}</select></label>
    <label>Курс<select id="dc" ${lock}><option value="">—</option>${[1,2,3,4,5,6].map(x=>`<option ${Number(d.course)===x?"selected":""}>${x}</option>`).join("")}</select></label>
    <label>Навчальний рік<input id="dy" value="${esc(d.academicYear||db.academicYear)}" ${ro}></label>
    <label>Семестр<select id="ds" ${lock}>${[1,2,3,4,5,6,7,8,9,10].map(x=>`<option ${Number(d.semester)===x?"selected":""}>${x}</option>`).join("")}</select></label>
    <label>Форма контролю<select id="dctrl" ${lock}>${db.controlForms.map(v=>`<option ${v===d.controlForm?"selected":""}>${esc(v)}</option>`).join("")}</select></label>
    <label>Колір<input id="dcolor" type="color" value="${esc(d.color||"#8b5cf6")}"></label>
    <label class="wide">Викладачі кафедри<select id="dteachers" multiple size="${Math.min(7,Math.max(3,departmentTeachers().length))}">${departmentTeacherOptions(d.teacherIds||[])}</select><span class="small">Якщо викладачів кілька — години нижче потрібно розподілити між ними.</span></label>
    <div class="wide"><b>Загальні години дисципліни</b><div class="hours-grid" style="margin-top:8px">${hours}</div></div>
    <div class="wide allocation-section"><div class="section-head compact"><div><b>Розподіл годин між викладачами</b><div class="small">Саме цей розподіл потрапляє до картки навантаження конкретного викладача.</div></div><button type="button" class="secondary" onclick="autofillSingleTeacher()">Заповнити для одного викладача</button></div><div id="teacherAllocation"></div></div>
    <label class="wide">Примітка<textarea id="dnote" rows="3">${esc(d.note||"")}</textarea></label><div class="wide"><button class="primary">Зберегти</button></div>
  </form>`,true);
  if(!fromPlan)$("#dg").onchange=()=>{const g=db.groups.find(x=>x.code===$("#dg").value);if(g)$("#dc").value=g.course;};
  $("#dteachers").onchange=()=>renderAllocationEditor(d.teacherLoads||{});renderAllocationEditor(d.teacherLoads||{});
  $("#df").onsubmit=e=>{e.preventDefault();const hs={};$$('.dh').forEach(i=>hs[i.dataset.type]=num(i.value));const ids=[...$("#dteachers").selectedOptions].map(o=>+o.value);const teacherLoads={};$$('[data-teacher-load]').forEach(card=>{const tid=card.dataset.teacherLoad;teacherLoads[tid]={};card.querySelectorAll('.dtl').forEach(i=>teacherLoads[tid][i.dataset.type]=num(i.value));});const mismatches=[];db.lessonTypes.forEach(lt=>{const total=ids.reduce((sum,tid)=>sum+num(teacherLoads[tid]?.[lt.id]),0);if(Math.abs(total-num(hs[lt.id]))>0.001)mismatches.push(`${lt.name}: у дисципліні ${fmtHours(hs[lt.id])} год, розподілено ${fmtHours(total)} год`);});if(ids.length&&mismatches.length&&!confirm("Розподіл годин між викладачами не збігається із загальними годинами:\n\n"+mismatches.join("\n")+"\n\nВсе одно зберегти?"))return;const obj=fromPlan?{teacherIds:ids,teacherLoads,color:$("#dcolor").value,note:$("#dnote").value.trim(),status:"active"}:{name:$("#dn").value.trim(),group:$("#dg").value,course:+$("#dc").value||"",academicYear:$("#dy").value.trim(),semester:+$("#ds").value,teacherIds:ids,teacherLoads,controlForm:$("#dctrl").value,color:$("#dcolor").value,hours:hs,note:$("#dnote").value.trim(),status:"active"};if(id)Object.assign(d,obj);else db.disciplines.push({id:uid(db.disciplines),...obj});closeModal();save();};
}
function deleteDiscipline(id){const d=disciplineById(id);if(confirm(`Видалити «${d.name}»?`)){db.disciplines=db.disciplines.filter(x=>x.id!==id);db.schedule.forEach(s=>{if(Number(s.disciplineId)===Number(id))s.disciplineId=null;});save();}}

/* Schedule */
function lessonTypeIdByName(name){return lessonTypeByName(name)?.id||null;}
function disciplineTypePlan(d,typeName){const id=lessonTypeIdByName(typeName);return id?num(d?.hours?.[id]):0;}
function teacherTypePlan(d,teacherId,typeName){
  if(!d||!teacherId)return 0;const id=lessonTypeIdByName(typeName);if(!id)return 0;
  const load=d.teacherLoads?.[teacherId]||d.teacherLoads?.[String(teacherId)];
  if(load)return num(load[id]);
  if((d.teacherIds||[]).length===1&&Number(d.teacherIds[0])===Number(teacherId))return num(d.hours?.[id]);
  return 0;
}
function scheduledLoad(disciplineId,teacherId,typeName,ignoreId=null){
  return db.schedule.filter(s=>s.id!==ignoreId&&Number(s.disciplineId)===Number(disciplineId)&&Number(s.teacherId)===Number(teacherId)&&s.type===typeName).reduce((a,s)=>a+num(s.workloadHours),0);
}
function remainingLoad(d,teacherId,typeName,ignoreId=null){return teacherTypePlan(d,teacherId,typeName)-scheduledLoad(d.id,teacherId,typeName,ignoreId);}
function allocatedTeachersForType(d,typeName){return (d?.teacherIds||[]).map(teacherById).filter(t=>t&&teacherTypePlan(d,t.id,typeName)>0);}
function schedulableTypes(d){return db.lessonTypes.filter(lt=>disciplineTypePlan(d,lt.name)>0);}
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
  return db.disciplines.filter(d=>d.status!=="archived"&&d.group===group).flatMap(d=>schedulableTypes(d).flatMap(lt=>allocatedTeachersForType(d,lt.name).map(t=>{
    const planned=teacherTypePlan(d,t.id,lt.name),scheduled=scheduledLoad(d.id,t.id,lt.name);
    return {d,lt,t,planned,scheduled,remaining:planned-scheduled};
  }))).filter(x=>x.planned>0).sort((a,b)=>(a.d.semester||0)-(b.d.semester||0)||a.d.name.localeCompare(b.d.name)||a.lt.name.localeCompare(b.lt.name));
}
function renderWorkloadToSchedule(group){
  const rows=workloadTeacherRowsForGroup(group);
  if(!rows.length)return `<div class="empty">Для ${esc(group)} ще немає розподіленого навантаження.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Дисципліна</th><th>Сем.</th><th>Вид</th><th>Викладач</th><th>План</th><th>Виставлено</th><th>Залишок</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr>
    <td><b>${esc(x.d.name)}</b></td><td>${x.d.semester||"—"}</td><td>${esc(x.lt.name)}</td><td><b>${esc(teacherDisplay(x.t))}</b></td>
    <td>${fmtHours(x.planned)}</td><td>${fmtHours(x.scheduled)}</td><td><span class="badge ${x.remaining<=0?"ok":"warn"}">${fmtHours(x.remaining)}</span></td>
    <td class="actions">${x.remaining>0?`<button class="primary-inline" onclick="openAllocationScheduler(${x.d.id},'${esc(x.lt.name)}',${x.t.id})">Розставити години</button><button onclick="openLessonModal(null,{group:'${esc(x.d.group)}',disciplineId:${x.d.id},type:'${esc(x.lt.name)}',teacherId:${x.t.id}})">+ Одне</button>`:`<span class="badge ok">Готово</span>`}</td>
  </tr>`).join("")}</tbody></table></div>`;
}
function renderSchedule(){
  const defaultGroup=db.groups[0]?.code||"";
  $("#page-schedule").innerHTML=`<div class="card section">
    <div class="section-head"><div><h2>Складання розкладу</h2><div class="small">Тут ти розставляєш уже розподілене навантаження по датах, парах та аудиторіях.</div></div><div class="actions"><button class="secondary" onclick="openBulkScheduleModal()">⇉ За правилом</button><button class="primary" onclick="openLessonModal()">+ Одне заняття</button></div></div>
    <div class="toolbar"><select id="workloadGroup">${groupOptions(defaultGroup)}</select></div><div id="workloadScheduleBox"></div>
  </div>
  <div class="card section"><div class="section-head"><h2>Виставлені заняття</h2><button class="secondary" onclick="go('timetable')">Відкрити календар →</button></div><div class="toolbar"><input id="scheduleSearch" placeholder="Група, дисципліна, аудиторія…"><select id="scheduleGroup"><option value="">Усі групи</option>${groupOptions()}</select></div><div id="scheduleTable"></div></div>`;
  const draw=()=>{$("#workloadScheduleBox").innerHTML=renderWorkloadToSchedule($("#workloadGroup").value);};
  $("#workloadGroup").onchange=draw;draw();
  $("#scheduleSearch").oninput=renderScheduleTable;$("#scheduleGroup").onchange=renderScheduleTable;renderScheduleTable();
}
function renderScheduleTable(){
  if(!$("#scheduleTable"))return;const q=($("#scheduleSearch")?.value||"").toLowerCase(),gf=$("#scheduleGroup")?.value||"";
  const rows=db.schedule.filter(x=>(!gf||x.group===gf)&&(!q||JSON.stringify(x).toLowerCase().includes(q))).slice().sort((a,b)=>(a.date+(pairForLesson(a)?.id||99)).localeCompare(b.date+(pairForLesson(b)?.id||99)));
  $("#scheduleTable").innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Дата</th><th>Пара</th><th>Група</th><th>Дисципліна</th><th>Вид</th><th>Облік. год.</th><th>Аудиторія</th><th>Викладач</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${formatDate(x.date)}</td><td><b>${esc(pairDisplay(x))}</b>${pairTimeDisplay(x)?`<div class="small">${esc(pairTimeDisplay(x))}</div>`:""}</td><td>${esc(x.group)}</td><td>${esc(x.discipline||"—")}${x.disciplineId?"":` <span class="badge warn">ІНША</span>`}</td><td>${esc(x.type||"—")}</td><td>${fmtHours(x.workloadHours)}</td><td><b>${esc(x.room||"—")}</b></td><td>${esc(x.teacher||"—")}</td><td class="actions"><button onclick="openLessonModal(${x.id})">Редагувати</button><button onclick="deleteLesson(${x.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Занять поки немає.</div>`;
}
function conflictsFor(item,ignore=null,extra=[]){
  const pool=db.schedule.concat(extra||[]);
  return pool.filter(x=>x.id!==ignore&&x.date===item.date&&(
    item.pairId&&x.pairId?String(item.pairId)===String(x.pairId):timeOverlap(item.start,item.end,x.start,x.end)
  )).filter(x=>(item.room&&x.room===item.room)||(item.group&&x.group===item.group)||(item.teacherId&&Number(x.teacherId)===Number(item.teacherId)));
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
  const rows=db.disciplines.filter(d=>d.status!=="archived"&&d.group===group).sort((a,b)=>(a.semester||0)-(b.semester||0)||a.name.localeCompare(b.name));
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
  const t=teacherById(teacherId),pair=pairById(pairId);
  return {date,pairId:pairId&&pairId!=="__custom__"?Number(pairId):null,start:pair?.start||start||"",end:pair?.end||end||"",group,disciplineId:disciplineId?Number(disciplineId):null,discipline,type,workloadHours:num(workloadHours),coverage,students:students||"",teacherId:teacherId?Number(teacherId):null,teacher:t?teacherDisplay(t):"",room:room||"",note:note||"",repeatBatchId};
}
function openLessonModal(id=null,preset={}){
  currentEditingLessonId=id;const existing=id?db.schedule.find(s=>s.id===id):null;
  const today=new Date().toISOString().slice(0,10),firstPair=bellPairs()[0];
  const x=existing||{date:preset.date||today,pairId:preset.pairId||firstPair?.id||null,start:firstPair?.start||"",end:firstPair?.end||"",group:preset.group||db.groups[0]?.code||"",disciplineId:preset.disciplineId||null,discipline:"",type:preset.type||"",workloadHours:2,coverage:"Вся група",students:"",teacherId:preset.teacherId||null,teacher:"",room:"",note:""};
  const matchedPair=x.pairId||pairIdForTimes(x.start,x.end),pairSelected=matchedPair||"__custom__";
  openModal(`<h2>${id?"Редагувати заняття":"Додати заняття"}</h2><form id="lf" class="form-grid">
    <label>Група<select id="lg">${groupOptions(x.group)}</select></label><label>Дисципліна<select id="ldi">${disciplineOptionsForGroup(x.group,x.disciplineId,true)}</select><input id="ldiCustom" style="display:${x.disciplineId?"none":""};margin-top:6px" placeholder="Назва дисципліни" value="${esc(!x.disciplineId?(x.discipline||""):"")}"></label>
    <label>Вид заняття<select id="lt"></select></label><label>Викладач<select id="ltea"></select></label><div id="loadHint" class="wide"></div>
    <label>Дата<input id="ld" type="date" value="${esc(x.date)}" required></label><label>Пара<select id="lpair">${pairOptions(pairSelected,true)}</select></label>
    <div id="customTimeBox" class="wide form-grid" style="display:${pairSelected==="__custom__"?"grid":"none"}"><label>Початок<input id="ls" type="time" value="${esc(x.start||"")}"></label><label>Кінець<input id="le" type="time" value="${esc(x.end||"")}"></label></div>
    <label>Аудиторія<select id="lr"><option value="">—</option>${db.rooms.filter(r=>r.status!=="archived").map(r=>`<option ${r.name===x.room?"selected":""}>${esc(r.name)}</option>`).join("")}</select></label><label>Годин у навантаження<input id="lwh" type="number" min="0.01" step="0.01" value="${esc(x.workloadHours||2)}"></label>
    <label>Охоплення<select id="lc">${db.coverageTypes.map(v=>`<option ${v===x.coverage?"selected":""}>${esc(v)}</option>`).join("")}</select></label><label>Студент(и) / підгрупа<input id="lst" value="${esc(x.students||"")}"></label>
    <label class="wide">Примітка<input id="ln" value="${esc(x.note||"")}"></label><div id="conflictBox" class="wide"></div><div class="wide"><button class="primary">${id?"Зберегти":"Додати"}</button></div>
  </form>`,true);
  populateLessonFormFromLoad({type:x.type,teacherId:x.teacherId});
  if(x.disciplineId)$("#ldi").value=x.disciplineId;else if(x.discipline)$("#ldi").value="__custom__";
  if(!x.disciplineId&&x.discipline)$("#ldiCustom").value=x.discipline;
  const readLesson=()=>{const did=$("#ldi").value,disciplineId=did&&did!=="__custom__"?Number(did):null,d=disciplineById(disciplineId),tid=$("#ltea").value?Number($("#ltea").value):null,pv=$("#lpair").value;return lessonItemFromValues({date:$("#ld").value,pairId:pv,start:$("#ls")?.value,end:$("#le")?.value,group:$("#lg").value,disciplineId,discipline:did==="__custom__"?$("#ldiCustom").value.trim():(d?.name||""),type:$("#lt").value,workloadHours:$("#lwh").value,coverage:$("#lc").value,students:$("#lst").value.trim(),teacherId:tid,room:$("#lr").value,note:$("#ln").value.trim()});};
  const check=()=>{const item=readLesson(),cs=conflictsFor(item,id),info=teacherAvailabilityInfo(item,id);let html="";if(cs.length)html+=`<div class="conflict"><b>Конфлікт:</b> ${cs.map(c=>`${esc(c.group)} · ${esc(pairDisplay(c))} · ${esc(c.room||"без ауд.")}`).join("; ")}</div>`;if(info.warnings.length)html+=`<div class="conflict">${info.warnings.map(esc).join("<br>")}</div>`;if(info.notes.length)html+=`<div class="notice">${info.notes.map(esc).join("<br>")}</div>`;$("#conflictBox").innerHTML=html;};
  $("#lg").onchange=()=>{$("#ldi").innerHTML=disciplineOptionsForGroup($("#lg").value,null,true);populateLessonFormFromLoad({});check();};$("#ldi").onchange=()=>{populateLessonFormFromLoad({});check();};$("#lt").onchange=()=>{refreshTeachersAndLoad(null);check();};$("#ltea").onchange=()=>{renderLoadHint();check();};
  $("#lpair").onchange=()=>{$("#customTimeBox").style.display=$("#lpair").value==="__custom__"?"grid":"none";check();};["ld","lr","lwh"].forEach(k=>$("#"+k).onchange=check);check();
  $("#lf").onsubmit=e=>{e.preventDefault();const item=readLesson();if(!item.discipline)return alert("Вкажіть дисципліну.");if(!item.pairId&&(!item.start||!item.end||item.end<=item.start))return alert("Оберіть пару або коректний час.");const d=item.disciplineId?disciplineById(item.disciplineId):null;if(d){if(!item.teacherId)return alert("Потрібно вибрати викладача з розподіленого навантаження.");const rem=remainingLoad(d,item.teacherId,item.type,id);if(item.workloadHours>rem+0.0001&&!confirm(`Це перевищить залишок навантаження на ${fmtHours(item.workloadHours-rem)} год. Все одно зберегти?`))return;}const cs=conflictsFor(item,id),info=teacherAvailabilityInfo(item,id);if((cs.length||info.warnings.length)&&!confirm("Є конфлікт або обмеження викладача. Все одно зберегти?"))return;if(id)Object.assign(db.schedule.find(s=>s.id===id),item);else db.schedule.push({id:uid(db.schedule),...item});currentEditingLessonId=null;closeModal();save();};
}
function allocationRowHtml(i,hours,defaultRoom=""){
  return `<div class="allocation-date-row" data-allocation-row><div class="allocation-index">${i+1}</div><label>Дата<input data-adate type="date"></label><label>Пара<select data-apair>${pairOptions(bellPairs()[0]?.id||null,false)}</select></label><label>Аудиторія<select data-aroom><option value="">—</option>${db.rooms.filter(r=>r.status!=="archived").map(r=>`<option ${r.name===defaultRoom?"selected":""}>${esc(r.name)}</option>`).join("")}</select></label><label>Год.<input data-ahours type="number" min="0.01" step="0.01" value="${fmtHours(hours)}"></label><button type="button" class="danger small-btn" onclick="this.closest('[data-allocation-row]').remove();renumberAllocationRows()">×</button></div>`;
}
function renumberAllocationRows(){$$("[data-allocation-row]").forEach((r,i)=>{const n=r.querySelector(".allocation-index");if(n)n.textContent=i+1;});}
function openAllocationScheduler(disciplineId,typeName,teacherId){
  const d=disciplineById(disciplineId),t=teacherById(teacherId);if(!d||!t)return;const rem=remainingLoad(d,teacherId,typeName),lt=lessonTypeByName(typeName),unit=num(lt?.defaultUnit||2);if(rem<=0)return alert("Це навантаження вже повністю виставлено.");const count=Math.ceil(rem/unit);let left=rem,rows="";for(let i=0;i<count;i++){const h=Math.min(unit,left);rows+=allocationRowHtml(i,h);left-=h;}
  openModal(`<div class="allocation-scheduler-head"><div><h2>Розставити всі години</h2><h3>${esc(d.name)}</h3><div class="small">${esc(typeName)} · <b>${esc(teacherDisplay(t))}</b> · ${esc(d.group)} · ${d.semester} семестр</div></div><span class="badge warn">Залишок ${fmtHours(rem)} год</span></div>
    <div class="load-hint-grid"><div><span>План</span><b>${fmtHours(teacherTypePlan(d,teacherId,typeName))} год</b></div><div><span>Виставлено</span><b>${fmtHours(scheduledLoad(d.id,teacherId,typeName))} год</b></div><div><span>Треба розставити</span><b>${fmtHours(rem)} год</b></div></div>
    <div class="allocation-tools"><label>Одна аудиторія для всіх<select id="allRoom"><option value="">— не змінювати —</option>${db.rooms.filter(r=>r.status!=="archived").map(r=>`<option>${esc(r.name)}</option>`).join("")}</select></label><button type="button" class="secondary" id="applyRoom">Застосувати</button><label>Охоплення<select id="allCoverage">${db.coverageTypes.map(v=>`<option>${esc(v)}</option>`).join("")}</select></label></div>
    <form id="allocationForm"><div class="allocation-date-head"><span>#</span><span>Дата</span><span>Пара</span><span>Аудиторія</span><span>Години</span><span></span></div><div id="allocationRows">${rows}</div><div class="allocation-footer"><button type="button" class="secondary" id="addAllocationRow">+ Додати рядок</button><label class="allocation-note">Примітка<input id="allNote"></label><button class="primary">Зберегти заповнені дати</button></div></form><div id="allocationMessage"></div>`,true);
  $("#applyRoom").onclick=()=>{const room=$("#allRoom").value;if(room)$$('[data-aroom]').forEach(x=>x.value=room);};$("#addAllocationRow").onclick=()=>{$("#allocationRows").insertAdjacentHTML("beforeend",allocationRowHtml($$("[data-allocation-row]").length,unit));};
  $("#allocationForm").onsubmit=e=>{e.preventDefault();const filled=$$("[data-allocation-row]").map(r=>({date:r.querySelector("[data-adate]").value,pairId:r.querySelector("[data-apair]").value,room:r.querySelector("[data-aroom]").value,hours:num(r.querySelector("[data-ahours]").value)})).filter(x=>x.date);if(!filled.length)return alert("Заповни хоча б одну дату.");let remaining=remainingLoad(d,teacherId,typeName),valid=[],blocked=[];const batchId=`A${Date.now()}`;for(const r of filled){if(remaining<=0.0001)break;const wh=Math.min(r.hours,remaining),item=lessonItemFromValues({date:r.date,pairId:r.pairId,group:d.group,disciplineId:d.id,discipline:d.name,type:typeName,workloadHours:wh,coverage:$("#allCoverage").value,teacherId,room:r.room,note:$("#allNote").value.trim(),repeatBatchId:batchId});const cs=conflictsFor(item,null,valid),info=teacherAvailabilityInfo(item,null);if(cs.length||info.warnings.length){blocked.push(`${formatDate(r.date)} · ${pairDisplay(item)}`);continue;}valid.push(item);remaining-=wh;}if(!valid.length)return alert("Усі заповнені дати мають конфлікти або обмеження.");if(blocked.length&&!confirm(`Є ${blocked.length} конфліктних дат: ${blocked.join(", ")}. Їх буде пропущено. Зберегти решту?`))return;valid.forEach(item=>db.schedule.push({id:uid(db.schedule),...item}));closeModal();save();go("schedule");};
}
function addDays(dateStr,days){const d=new Date(dateStr+"T12:00:00");d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
function datesForPattern(pattern,from,to,weekday,specific){if(pattern==="dates")return [...new Set((specific||"").split(/[\s,;]+/).map(x=>x.trim()).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)))].sort();const result=[];if(!from||!to)return result;let d=from;while(d<=to){if(weekdayId(d)===Number(weekday))result.push(d);d=addDays(d,1);}return pattern==="biweekly"?result.filter((_,i)=>i%2===0):result;}
function openBulkScheduleModal(){
  const group=db.groups[0]?.code||"";openModal(`<h2>Розставити за правилом</h2><div class="notice">Для випадків, коли одна й та сама пара повторюється щотижня або через тиждень.</div><form id="bf" class="form-grid"><label>Група<select id="bg">${groupOptions(group)}</select></label><label>Дисципліна<select id="bd">${disciplineOptionsForGroup(group,null,false)}</select></label><label>Вид заняття<select id="bt"></select></label><label>Викладач<select id="btea"></select></label><div id="bulkLoadHint" class="wide"></div><label>Повторення<select id="bpattern"><option value="weekly">Щотижня</option><option value="biweekly">Через тиждень</option><option value="dates">Конкретні дати</option></select></label><label>День тижня<select id="bweekday">${db.weekDays.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join("")}</select></label><label>Від<input id="bfrom" type="date"></label><label>До<input id="bto" type="date"></label><label id="bdatesLabel" class="wide" style="display:none">Конкретні дати<textarea id="bdates" rows="3" placeholder="2026-09-03, 2026-09-10, 2026-09-24"></textarea></label><label>Пара<select id="bpair">${pairOptions(bellPairs()[0]?.id||null,false)}</select></label><label>Аудиторія<select id="br"><option value="">—</option>${db.rooms.filter(r=>r.status!=="archived").map(r=>`<option>${esc(r.name)}</option>`).join("")}</select></label><label>Годин за заняття<input id="bwh" type="number" min="0.01" step="0.01" value="2"></label><label>Охоплення<select id="bc">${db.coverageTypes.map(v=>`<option>${esc(v)}</option>`).join("")}</select></label><label class="wide">Примітка<input id="bn"></label><div class="wide"><button class="primary">Створити повтори</button></div></form>`,true);
  const refreshDisc=()=>{$("#bd").innerHTML=disciplineOptionsForGroup($("#bg").value,null,false);refreshType();};const refreshType=()=>{const d=disciplineById(Number($("#bd").value)),types=d?schedulableTypes(d):[];$("#bt").innerHTML=types.map(x=>`<option>${esc(x.name)}</option>`).join("");refreshTeacher();};const refreshTeacher=()=>{const d=disciplineById(Number($("#bd").value)),type=$("#bt").value,teachers=d?allocatedTeachersForType(d,type):[];$("#btea").innerHTML=teachers.map(t=>`<option value="${t.id}">${esc(teacherDisplay(t))}</option>`).join("");const lt=lessonTypeByName(type);$("#bwh").value=lt?.defaultUnit||1;bulkHint();};const bulkHint=()=>{const d=disciplineById(Number($("#bd").value)),tid=Number($("#btea").value),type=$("#bt").value;if(!d||!tid){$("#bulkLoadHint").innerHTML=`<div class="conflict">Спочатку має бути розподілене навантаження.</div>`;return;}const p=teacherTypePlan(d,tid,type),used=scheduledLoad(d.id,tid,type),r=p-used;$("#bulkLoadHint").innerHTML=`<div class="load-hint-grid"><div><span>План</span><b>${fmtHours(p)} год</b></div><div><span>Виставлено</span><b>${fmtHours(used)} год</b></div><div><span>Залишок</span><b>${fmtHours(r)} год</b></div></div>`;};
  $("#bg").onchange=refreshDisc;$("#bd").onchange=refreshType;$("#bt").onchange=refreshTeacher;$("#btea").onchange=bulkHint;$("#bpattern").onchange=()=>{const dates=$("#bpattern").value==="dates";$("#bdatesLabel").style.display=dates?"":"none";$("#bweekday").disabled=dates;$("#bfrom").disabled=dates;$("#bto").disabled=dates;};refreshDisc();
  $("#bf").onsubmit=e=>{e.preventDefault();const d=disciplineById(Number($("#bd").value)),tid=Number($("#btea").value),type=$("#bt").value;if(!d||!tid)return alert("Немає розподіленого навантаження.");let rem=remainingLoad(d,tid,type,null);if(rem<=0)return alert("Години вже вичерпані.");const dates=datesForPattern($("#bpattern").value,$("#bfrom").value,$("#bto").value,$("#bweekday").value,$("#bdates").value);if(!dates.length)return alert("Не знайдено дат.");const unit=num($("#bwh").value),valid=[],blocked=[],batchId=`B${Date.now()}`;for(const date of dates){if(rem<=0.0001)break;const wh=Math.min(unit,rem),item=lessonItemFromValues({date,pairId:$("#bpair").value,group:$("#bg").value,disciplineId:d.id,discipline:d.name,type,workloadHours:wh,coverage:$("#bc").value,teacherId:tid,room:$("#br").value,note:$("#bn").value.trim(),repeatBatchId:batchId}),cs=conflictsFor(item,null,valid),info=teacherAvailabilityInfo(item,null);if(cs.length||info.warnings.length){blocked.push(date);continue;}valid.push(item);rem-=wh;}if(!valid.length)return alert("Усі дати мають конфлікти.");if(blocked.length&&!confirm(`${blocked.length} дат буде пропущено через конфлікти. Продовжити?`))return;valid.forEach(item=>db.schedule.push({id:uid(db.schedule),...item}));closeModal();save();go("schedule");};
}
function deleteLesson(id){if(confirm("Видалити заняття? Години автоматично повернуться у залишок навантаження.")){db.schedule=db.schedule.filter(x=>x.id!==id);save();}}

/* Group timetable calendar */
let timetableState={group:null,week:null};
function mondayOf(dateStr){const d=new Date((dateStr||new Date().toISOString().slice(0,10))+"T12:00:00"),day=d.getDay()||7;d.setDate(d.getDate()-day+1);return d.toISOString().slice(0,10);}
function weekdayNameByIndex(i){return ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"][i];}
function timetableCellLessons(group,date,pairId){return db.schedule.filter(x=>x.group===group&&x.date===date&&String(x.pairId||pairIdForTimes(x.start,x.end))===String(pairId));}
function renderTimetable(){
  if(!timetableState.group||!db.groups.some(g=>g.code===timetableState.group))timetableState.group=db.groups[0]?.code||"";if(!timetableState.week)timetableState.week=mondayOf(new Date().toISOString().slice(0,10));
  const dates=Array.from({length:7},(_,i)=>addDays(timetableState.week,i)),end=dates[6];
  $("#page-timetable").innerHTML=`<div class="card section timetable-shell"><div class="section-head"><div><h2>Розклад групи</h2><div class="small">${formatDate(timetableState.week)} — ${formatDate(end)}</div></div><div class="actions"><button class="secondary" onclick="shiftTimetableWeek(-7)">← Тиждень</button><button class="secondary" onclick="timetableToday()">Сьогодні</button><button class="secondary" onclick="shiftTimetableWeek(7)">Тиждень →</button></div></div><div class="toolbar"><label>Група<select id="timetableGroup">${groupOptions(timetableState.group)}</select></label></div><div class="timetable-wrap"><div class="timetable-grid"><div class="tt-corner">Пара</div>${dates.map((d,i)=>`<div class="tt-day"><b>${weekdayNameByIndex(i)}</b><span>${formatDate(d).slice(0,5)}</span></div>`).join("")}${bellPairs().map(pair=>`<div class="tt-pair"><b>${pair.id}</b><span>пара</span>${pair.start&&pair.end?`<small>${pair.start}<br>${pair.end}</small>`:""}</div>${dates.map(date=>{const lessons=timetableCellLessons(timetableState.group,date,pair.id);return `<div class="tt-cell" onclick="if(event.target===this)openLessonModal(null,{group:'${esc(timetableState.group)}',date:'${date}',pairId:${JSON.stringify(pair.id)}})">${lessons.map(x=>{const d=disciplineById(x.disciplineId),color=d?.color||"#8b5cf6";return `<button class="tt-lesson" style="--lesson-color:${esc(color)}" onclick="event.stopPropagation();openLessonModal(${x.id})"><b>${esc(x.discipline)}</b><span>${esc(x.type||"")}</span><span>${esc(x.teacher||"—")}</span><strong>${esc(x.room||"—")}</strong></button>`;}).join("")}</div>`;}).join("")}`).join("")}</div></div><div class="small timetable-help">Клік по порожній клітинці — додати заняття одразу на цю дату й пару. Клік по заняттю — редагувати.</div></div>`;
  $("#timetableGroup").onchange=e=>{timetableState.group=e.target.value;renderTimetable();};
}
function shiftTimetableWeek(days){timetableState.week=addDays(timetableState.week,days);renderTimetable();}
function timetableToday(){timetableState.week=mondayOf(new Date().toISOString().slice(0,10));renderTimetable();}

/* Settings */
function renderBellRows(){return bellPairs().map(p=>`<div class="bell-row" data-bell-row data-id="${esc(p.id)}"><div class="bell-number">${esc(p.id)} пара</div><input data-bstart type="time" value="${esc(p.start||"")}"><span>—</span><input data-bend type="time" value="${esc(p.end||"")}"><button class="danger small-btn" onclick="removeBellPair(${JSON.stringify(p.id)})">×</button></div>`).join("");}
function renderSettings(){
  $("#page-settings").innerHTML=`<div class="settings-grid"><div class="card settings-card"><h3>Навчальний період</h3><label>Навчальний рік<input id="setYear" value="${esc(db.academicYear)}"></label><label style="margin-top:10px">Семестр<select id="setSem"><option ${db.semester===1?"selected":""}>1</option><option ${db.semester===2?"selected":""}>2</option></select></label><button class="primary" style="margin-top:12px" onclick="savePeriod()">Зберегти</button></div><div class="card settings-card"><h3>Резервна копія</h3><p class="small">Експорт усієї бази одним JSON-файлом.</p><button class="primary" onclick="exportData()">Експорт даних</button></div><div class="card settings-card"><h3>Імпорт</h3><p class="small">Відновити дані з резервної копії.</p><button class="secondary" onclick="document.querySelector('#importFile').click()">Імпортувати</button></div><div class="card settings-card"><h3>Скидання</h3><p class="small">Повернути початкові дані версії 0.8.</p><button class="danger" onclick="resetData()">Скинути дані</button></div></div>
  <div class="card section"><div class="section-head"><div><h2>Розклад дзвінків</h2><div class="small">У складанні розкладу ти вибираєш номер пари. Час використовується автоматично для перевірки конфліктів і доступності викладачів.</div></div><button class="secondary" onclick="addBellPair()">+ Додати пару</button></div><div class="bell-editor"><div class="bell-head"><span>Пара</span><span>Початок</span><span></span><span>Кінець</span><span></span></div>${renderBellRows()}</div><button class="primary" style="margin-top:12px" onclick="saveBellSchedule()">Зберегти дзвінки</button></div>`;
}
function saveBellSchedule(){db.bellSchedule=$$("[data-bell-row]").map(r=>({id:Number(r.dataset.id),start:r.querySelector("[data-bstart]").value,end:r.querySelector("[data-bend]").value})).sort((a,b)=>a.id-b.id);db.schedule.forEach(s=>{if(s.pairId){const p=pairById(s.pairId);if(p){s.start=p.start;s.end=p.end;}}});save();alert("Розклад дзвінків збережено. Усі заняття з номерами пар оновлено автоматично.");}
function addBellPair(){const next=bellPairs().length?Math.max(...bellPairs().map(p=>Number(p.id)||0))+1:1;db.bellSchedule.push({id:next,start:"",end:""});save();}
function removeBellPair(id){if(db.schedule.some(s=>String(s.pairId)===String(id))&&!confirm("На цій парі вже є заняття. Видалити пару з довідника? Самі заняття не видаляться."))return;db.bellSchedule=db.bellSchedule.filter(p=>String(p.id)!==String(id));save();}
function savePeriod(){db.academicYear=$("#setYear").value.trim();db.semester=+$("#setSem").value;save();alert("Збережено.");}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`REMS-ROZKLAD-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);}
$("#importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=migrate(JSON.parse(r.result));save();alert("Дані імпортовано.");}catch(err){alert("Не вдалося прочитати файл.");}};r.readAsText(f);e.target.value="";};
function resetData(){if(confirm("Повернути початкові дані?")){db=clone(window.REMS_INITIAL_DATA);save();go("home");}}

go("home");
