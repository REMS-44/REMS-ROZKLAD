
const KEY="remsScheduleData_v051";
const OLD_KEYS=["remsScheduleData_v04","remsScheduleData_v02","remsScheduleData_v01"];
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
    id:d.id||i+1,name:d.name||"",course:d.course||"",group:d.group||"",
    semester:d.semester||fresh.semester,academicYear:d.academicYear||fresh.academicYear,
    teacherIds:d.teacherIds||[],teacherLoads:d.teacherLoads||{},
    controlForm:d.controlForm||"Немає",color:d.color||"#8b5cf6",
    hours:d.hours||{},note:d.note||"",status:d.status||"active"
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
      id:s.id||i+1,date:s.date||"",start:s.start||"",end:s.end||"",group:s.group||"",
      disciplineId,discipline:s.discipline||"",type:s.type||"",coverage:s.coverage||"Вся група",
      students:s.students||"",teacherId,teacher:s.teacher||"",room:s.room||"",
      workloadHours:s.workloadHours??lt?.defaultUnit??1,note:s.note||""
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
function save(){db.schemaVersion=5;localStorage.setItem(KEY,JSON.stringify(db));renderCurrent();}
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
  schedule:["Розклад","Заняття, час, аудиторії та конфлікти"],
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
  ({home:renderHome,schedule:renderSchedule,groups:renderGroups,students:renderStudents,rooms:renderRooms,teachers:renderTeachers,curricula:renderCurricula,disciplines:renderDisciplines,lessonTypes:renderLessonTypes,settings:renderSettings}[currentPage])();
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
  return `<div class="table-wrap"><table><thead><tr><th>Час</th><th>Група</th><th>Дисципліна</th><th>Викладач</th><th>Аудиторія</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.start)}–${esc(x.end)}</b></td><td>${esc(x.group)}</td><td>${esc(x.discipline||"—")}</td><td>${esc(x.teacher||"—")}</td><td><b>${esc(x.room||"—")}</b></td></tr>`).join("")}</tbody></table></div>`;
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
  const planned=teacherPlannedHours(t),scheduled=teacherScheduledHours(t),target=teacherTargetHours(t);
  return `<div class="teacher-card">
    <div class="teacher-card-head">
      <div><h3>${esc(t.name)}</h3><div class="small">${esc(t.shortName||"")}</div></div>
      <span class="badge ok">${esc(t.employmentType||"—")}</span>
    </div>
    <div class="teacher-meta">
      <div><b>Посада</b><span>${esc(t.position||"—")}</span></div>
      <div><b>Вчене звання</b><span>${esc(t.academicTitle||"—")}</span></div>
      <div><b>Науковий ступінь</b><span>${esc(t.degree||"—")}</span></div>
      <div><b>Почесне звання</b><span>${esc(t.honoraryTitle||"—")}</span></div>
      <div><b>Ставка</b><span>${t.rate!==""?esc(t.rate):"—"}</span></div>
      <div><b>Працює</b><span>${esc(teacherEmploymentText(t))}</span></div>
    </div>
    <div class="load-strip">
      <div><span>Навантаження з дисциплін</span><b>${fmtHours(planned)} год</b></div>
      <div><span>Виставлено в розклад</span><b>${fmtHours(scheduled)} год</b></div>
      <div><span>Ціль за ставкою</span><b>${target?fmtHours(target)+" год":"—"}</b></div>
    </div>
    <div class="actions teacher-actions"><button onclick="openTeacherWorkload(${t.id})">Картка навантаження</button><button onclick="openTeacherModal(${t.id})">Редагувати</button><button onclick="deleteTeacher(${t.id})">Видалити</button></div>
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
function curriculumTotalsFromRows(c){
  const rows=(c.components||[]).flatMap(x=>x.rows||[]);
  const sum=k=>rows.reduce((a,r)=>a+num(r[k]),0);
  return {
    credits:sum("credits"),totalHours:sum("totalHours"),auditoriumHours:sum("auditoriumHours"),
    auditoriumPlanHours:sum("auditoriumPlanHours"),lecture:sum("lecture"),seminar:sum("seminar"),
    practical:sum("practical"),laboratory:sum("laboratory"),individual:sum("individual"),
    selfStudy:sum("selfStudy"),practice:sum("practice")
  };
}
function renderCurricula(){
  const plans=db.curricula||[];
  $("#page-curricula").innerHTML=`<div class="card section">
    <div class="section-head"><h2>Робочі навчальні плани</h2><span class="small">Звідси мають народжуватися дисципліни, навантаження і вже потім розклад.</span></div>
    ${plans.length?`<div class="curriculum-grid">${plans.map(c=>{
      const t=curriculumTotalsFromRows(c);
      return `<div class="curriculum-card">
        <div class="curriculum-title"><div><span class="badge ok">${c.course} курс</span><h3>${esc(c.program)}</h3><div class="small">${esc(c.academicYear)} · ${esc(c.studyForm)} форма</div></div><button class="primary" onclick="openCurriculum(${c.id})">Відкрити план</button></div>
        <div class="curriculum-kpis">
          <div><b>${t.credits}</b><span>кредитів</span></div>
          <div><b>${t.totalHours}</b><span>загальних годин</span></div>
          <div><b>${t.auditoriumHours}</b><span>аудиторних за видами</span></div>
          <div><b>${t.selfStudy}</b><span>самостійних</span></div>
        </div>
        <div class="small" style="margin-top:12px">Групи: ${esc((c.applicableGroups||[]).join(", "))} · 5 семестр — ${c.semesterWeeks?.["5"]||"—"} тижнів · 6 семестр — ${c.semesterWeeks?.["6"]||"—"} тижнів</div>
      </div>`;
    }).join("")}</div>`:`<div class="empty">Планів ще немає.</div>`}
  </div>`;
}
function openCurriculum(id){
  const c=curriculumById(id);if(!c)return;
  const totals=curriculumTotalsFromRows(c);
  const sectionOrder=["Обов’язкові","Вибіркові"];
  let body="";
  sectionOrder.forEach(section=>{
    const comps=(c.components||[]).filter(x=>x.section===section);
    if(!comps.length)return;
    body+=`<h3 class="curriculum-section-title">${section==="Обов’язкові"?"Обов’язкові освітні компоненти":"Вибіркові освітні компоненти"}</h3>`;
    const cats=[...new Set(comps.map(x=>x.category))];
    cats.forEach(cat=>{
      body+=`<h4 class="curriculum-category">${esc(cat)}</h4>`;
      body+=`<div class="table-wrap"><table class="curriculum-table"><thead><tr>
        <th>Дисципліна</th><th>Сем.</th><th>Контроль</th><th>Кред.</th><th>Всього</th>
        <th>Аудит.</th><th>Лек.</th><th>Сем.</th><th>Практ.</th><th>Лаб.</th><th>Інд.</th>
        <th>Самост.</th><th>Практика</th><th>Тижд.</th><th>Статус</th><th></th>
      </tr></thead><tbody>`;
      comps.filter(x=>x.category===cat).forEach(comp=>{
        (comp.rows||[]).forEach((r,idx)=>{
          body+=`<tr>
            <td>${idx===0?`<b>${esc(comp.name)}</b>`:"↳ продовження"}${r.note?`<div class="small">${esc(r.note)}</div>`:""}</td>
            <td>${r.semester}</td><td>${esc(r.control||"—")}</td><td>${fmtHours(r.credits)}</td><td>${fmtHours(r.totalHours)}</td>
            <td>${fmtHours(r.auditoriumHours)}${r.auditoriumPlanHours!==r.auditoriumHours?` <span class="badge warn">план ${fmtHours(r.auditoriumPlanHours)}</span>`:""}</td>
            <td>${fmtHours(r.lecture)}</td><td>${fmtHours(r.seminar)}</td><td>${fmtHours(r.practical)}</td><td>${fmtHours(r.laboratory)}</td><td>${fmtHours(r.individual)}</td>
            <td>${fmtHours(r.selfStudy)}</td><td>${fmtHours(r.practice)}</td><td>${r.weekly||"—"}</td>
            <td><span class="badge ${comp.scope==="department"?"ok":"warn"}">${scopeLabel(comp.scope)}</span></td>
            <td class="actions">${comp.scope==="department"?`<button onclick="createLoadFromPlan(${c.id},${comp.id},${r.semester})">У навантаження</button>`:""}</td>
          </tr>`;
        });
      });
      body+=`</tbody></table></div>`;
    });
  });
  openModal(`<div class="curriculum-detail">
    <div class="workload-title"><div><h2>Робочий план · ${c.course} курс</h2><h3>${esc(c.program)}</h3><div class="small">${esc(c.specialty)} · ${esc(c.degree)} · ${esc(c.academicYear)}</div></div><span class="badge ok">${esc(c.studyForm)} форма</span></div>
    <div class="grid-kpi workload-kpi" style="margin-top:16px">
      ${kpi("Кредити",fmtHours(totals.credits))}
      ${kpi("Усього годин",fmtHours(totals.totalHours))}
      ${kpi("Аудиторні",fmtHours(totals.auditoriumHours))}
      ${kpi("Самостійні",fmtHours(totals.selfStudy))}
    </div>
    <div class="plan-summary">
      <span>Лекції: <b>${fmtHours(totals.lecture)}</b></span>
      <span>Семінари: <b>${fmtHours(totals.seminar)}</b></span>
      <span>Практичні: <b>${fmtHours(totals.practical)}</b></span>
      <span>Лабораторні: <b>${fmtHours(totals.laboratory)}</b></span>
      <span>Індивідуальні: <b>${fmtHours(totals.individual)}</b></span>
      <span>Практика: <b>${fmtHours(totals.practice)}</b></span>
    </div>
    <div class="notice">Для 3 курсу план застосовано до груп: <b>${esc((c.applicableGroups||[]).join(", "))}</b>. Загальноосвітні компоненти збережені в плані, але за замовчуванням не входять до кафедрального розподілу навантаження.</div>
    ${body}
  </div>`,true);
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
function createLoadFromPlan(curriculumId,componentId,semester){
  const c=curriculumById(curriculumId),comp=curriculumComponent(c,componentId);
  const r=comp?.rows?.find(x=>Number(x.semester)===Number(semester));if(!c||!comp||!r)return;
  const availableGroups=(c.applicableGroups||[]).filter(g=>db.groups.some(x=>x.code===g));
  openModal(`<h2>Створити дисципліну з робочого плану</h2>
    <div class="notice"><b>${esc(comp.name)}</b> · ${semester} семестр · ${esc(r.control)}</div>
    <form id="planLoadForm" class="form-grid">
      <label class="wide">Для яких груп<select id="plGroups" multiple size="${Math.max(2,availableGroups.length)}">${availableGroups.map(g=>`<option value="${esc(g)}" selected>${esc(g)} · ${groupStudentCount(g)} студентів</option>`).join("")}</select><span class="small">Ctrl/⌘ + клік — вибір окремих груп.</span></label>
      <div class="wide"><b>З плану буде перенесено</b><div class="plan-summary" style="margin-top:8px">
        <span>Лекції ${fmtHours(r.lecture)}</span><span>Семінари ${fmtHours(r.seminar)}</span><span>Практичні ${fmtHours(r.practical)}</span><span>Лабораторні ${fmtHours(r.laboratory)}</span><span>Індивідуальні ${fmtHours(r.individual)}</span>
      </div></div>
      <div class="wide"><button class="primary">Створити в «Дисципліни / навантаження»</button></div>
    </form>`);
  $("#planLoadForm").onsubmit=e=>{
    e.preventDefault();
    const groups=[...$("#plGroups").selectedOptions].map(o=>o.value);
    if(!groups.length)return alert("Оберіть хоча б одну групу.");
    const created=[],skipped=[];
    groups.forEach(group=>{
      const exists=db.disciplines.some(d=>Number(d.sourceCurriculumId)===Number(c.id)&&Number(d.sourceComponentId)===Number(comp.id)&&Number(d.semester)===Number(semester)&&d.group===group);
      if(exists){skipped.push(group);return;}
      db.disciplines.push({
        id:uid(db.disciplines),name:comp.name,course:c.course,group,semester:Number(semester),academicYear:c.academicYear,
        teacherIds:[],teacherLoads:{},controlForm:r.control,color:"#8b5cf6",hours:planRowToHours(r),note:"",
        status:"active",sourceCurriculumId:c.id,sourceComponentId:comp.id,
        planMeta:{
          credits:r.credits,totalHours:r.totalHours,auditoriumHours:r.auditoriumHours,auditoriumPlanHours:r.auditoriumPlanHours,
          selfStudy:r.selfStudy,practice:r.practice,weekly:r.weekly
        }
      });
      created.push(group);
    });
    save();closeModal();
    alert(`Створено: ${created.length}${skipped.length?`. Уже існувало: ${skipped.join(", ")}`:""}`);
    go("disciplines");
  };
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
  const hours=db.lessonTypes.map(t=>`<label>${esc(t.name)}<input class="dh" data-type="${t.id}" type="number" min="0" step="0.01" value="${esc(d.hours?.[t.id]||0)}"></label>`).join("");
  openModal(`<h2>${id?"Редагувати":"Нова"} дисципліна кафедри</h2><form id="df" class="form-grid">
    <label class="wide">Назва дисципліни<input id="dn" value="${esc(d.name)}" required></label>
    <label>Група<select id="dg"><option value="">—</option>${groupOptions(d.group)}</select></label>
    <label>Курс<select id="dc"><option value="">—</option>${[1,2,3,4,5,6].map(x=>`<option ${Number(d.course)===x?"selected":""}>${x}</option>`).join("")}</select></label>
    <label>Навчальний рік<input id="dy" value="${esc(d.academicYear||db.academicYear)}"></label>
    <label>Семестр<select id="ds"><option ${Number(d.semester)===1?"selected":""}>1</option><option ${Number(d.semester)===2?"selected":""}>2</option></select></label>
    <label>Форма контролю<select id="dctrl">${db.controlForms.map(v=>`<option ${v===d.controlForm?"selected":""}>${esc(v)}</option>`).join("")}</select></label>
    <label>Колір<input id="dcolor" type="color" value="${esc(d.color||"#8b5cf6")}"></label>
    <label class="wide">Викладачі кафедри<select id="dteachers" multiple size="${Math.min(7,Math.max(3,departmentTeachers().length))}">${departmentTeacherOptions(d.teacherIds||[])}</select><span class="small">Якщо викладачів кілька — години нижче потрібно розподілити між ними.</span></label>
    <div class="wide"><b>Загальні години дисципліни</b><div class="hours-grid" style="margin-top:8px">${hours}</div></div>
    <div class="wide allocation-section"><div class="section-head compact"><div><b>Розподіл годин між викладачами</b><div class="small">Саме цей розподіл потрапляє до картки навантаження конкретного викладача.</div></div><button type="button" class="secondary" onclick="autofillSingleTeacher()">Заповнити для одного викладача</button></div><div id="teacherAllocation"></div></div>
    <label class="wide">Примітка<textarea id="dnote" rows="3">${esc(d.note||"")}</textarea></label>
    <div class="wide"><button class="primary">Зберегти</button></div>
  </form>`,true);
  $("#dg").onchange=()=>{const g=db.groups.find(x=>x.code===$("#dg").value);if(g)$("#dc").value=g.course;};
  $("#dteachers").onchange=()=>renderAllocationEditor(d.teacherLoads||{});
  renderAllocationEditor(d.teacherLoads||{});
  $("#df").onsubmit=e=>{
    e.preventDefault();
    const hs={};$$(".dh").forEach(i=>hs[i.dataset.type]=num(i.value));
    const ids=[...$("#dteachers").selectedOptions].map(o=>+o.value);
    const teacherLoads={};
    $$("[data-teacher-load]").forEach(card=>{
      const tid=card.dataset.teacherLoad;teacherLoads[tid]={};
      card.querySelectorAll(".dtl").forEach(i=>teacherLoads[tid][i.dataset.type]=num(i.value));
    });
    const mismatches=[];
    db.lessonTypes.forEach(lt=>{
      const total=ids.reduce((sum,tid)=>sum+num(teacherLoads[tid]?.[lt.id]),0);
      if(Math.abs(total-num(hs[lt.id]))>0.001)mismatches.push(`${lt.name}: у дисципліні ${fmtHours(hs[lt.id])} год, розподілено ${fmtHours(total)} год`);
    });
    if(ids.length&&mismatches.length&&!confirm("Розподіл годин між викладачами не збігається із загальними годинами:\n\n"+mismatches.join("\n")+"\n\nВсе одно зберегти?"))return;
    const obj={name:$("#dn").value.trim(),group:$("#dg").value,course:+$("#dc").value||"",academicYear:$("#dy").value.trim(),semester:+$("#ds").value,teacherIds:ids,teacherLoads,controlForm:$("#dctrl").value,color:$("#dcolor").value,hours:hs,note:$("#dnote").value.trim(),status:"active"};
    if(id)Object.assign(d,obj);else db.disciplines.push({id:uid(db.disciplines),...obj});
    closeModal();save();
  };
}
function deleteDiscipline(id){const d=disciplineById(id);if(confirm(`Видалити «${d.name}»?`)){db.disciplines=db.disciplines.filter(x=>x.id!==id);db.schedule.forEach(s=>{if(Number(s.disciplineId)===Number(id))s.disciplineId=null;});save();}}

/* Schedule */
function renderSchedule(){
  $("#page-schedule").innerHTML=`<div class="card section"><div class="section-head"><h2>Усі заняття</h2><button class="primary" onclick="openLessonModal()">+ Додати заняття</button></div><div class="toolbar"><input id="scheduleSearch" placeholder="Група, дисципліна, аудиторія…"><select id="scheduleGroup"><option value="">Усі групи</option>${groupOptions()}</select></div><div id="scheduleTable"></div></div>`;
  $("#scheduleSearch").oninput=renderScheduleTable;$("#scheduleGroup").onchange=renderScheduleTable;renderScheduleTable();
}
function renderScheduleTable(){
  if(!$("#scheduleTable"))return;
  const q=($("#scheduleSearch")?.value||"").toLowerCase(),gf=$("#scheduleGroup")?.value||"";
  const rows=db.schedule.filter(x=>(!gf||x.group===gf)&&(!q||JSON.stringify(x).toLowerCase().includes(q))).slice().sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  $("#scheduleTable").innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Дата</th><th>Час</th><th>Група</th><th>Дисципліна</th><th>Вид</th><th>Облік. год.</th><th>Аудиторія</th><th>Викладач</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${formatDate(x.date)}</td><td><b>${esc(x.start)}–${esc(x.end)}</b></td><td>${esc(x.group)}</td><td>${esc(x.discipline||"—")}${x.disciplineId?"":` <span class="badge warn">ІНША</span>`}</td><td>${esc(x.type||"—")}</td><td>${fmtHours(x.workloadHours)}</td><td><b>${esc(x.room||"—")}</b></td><td>${esc(x.teacher||"—")}</td><td class="actions"><button onclick="openLessonModal(${x.id})">Редагувати</button><button onclick="deleteLesson(${x.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Розклад поки порожній.</div>`;
}
function conflictsFor(item,ignore=null){
  return db.schedule.filter(x=>x.id!==ignore&&x.date===item.date&&timeOverlap(item.start,item.end,x.start,x.end)).filter(x=>
    (item.room&&x.room===item.room)||(item.group&&x.group===item.group)||(item.teacherId&&Number(x.teacherId)===Number(item.teacherId))
  );
}
function teacherAvailabilityInfo(item,ignoreId=null){
  const warnings=[],notes=[];
  const t=teacherById(item.teacherId);
  if(!t||t.scope==="external"||!item.date||!item.start||!item.end)return{warnings,notes};
  if(t.employmentStart&&item.date<t.employmentStart)warnings.push(`Дата заняття раніше дати початку роботи викладача (${formatDate(t.employmentStart)}).`);
  if(t.employmentEnd&&item.date>t.employmentEnd)warnings.push(`Дата заняття пізніше дати завершення роботи / контракту (${formatDate(t.employmentEnd)}).`);
  (t.unavailableRules||[]).filter(r=>ruleApplies(r,item.date)&&ruleTimeMatches(r,item.start,item.end)).forEach(r=>warnings.push("Викладач позначив цей час як недоступний."));
  const applicablePref=(t.preferredRules||[]).filter(r=>ruleApplies(r,item.date));
  if(applicablePref.length){
    const ok=applicablePref.some(r=>ruleTimeMatches(r,item.start,item.end));
    if(ok)notes.push("Час входить до бажаного інтервалу викладача.");
    else notes.push("На цю дату є бажані інтервали викладача, але вибраний час до них не входить.");
  }
  const dayLessons=db.schedule.filter(x=>x.id!==ignoreId&&Number(x.teacherId)===Number(t.id)&&x.date===item.date);
  if(t.maxPerDay&&dayLessons.length+1>Number(t.maxPerDay))warnings.push(`Перевищено максимум занять викладача на день: ${t.maxPerDay}.`);
  return{warnings,notes};
}
function openLessonModal(id=null){
  const x=id?db.schedule.find(s=>s.id===id):{date:"",start:"09:00",end:"10:20",group:db.groups[0]?.code||"",disciplineId:null,discipline:"",type:db.lessonTypes[0]?.name||"",coverage:"Вся група",students:"",teacherId:null,teacher:"",room:"",workloadHours:db.lessonTypes[0]?.defaultUnit||1,note:""};
  const groupDiscs=db.disciplines.filter(d=>d.status!=="archived"&&(!d.group||d.group===x.group));
  const isCustom=!x.disciplineId&&!!x.discipline;
  const teacherOpts=`<option value="">—</option>${db.teachers.filter(t=>t.status!=="archived").map(t=>`<option value="${t.id}" ${Number(t.id)===Number(x.teacherId)?"selected":""}>${esc(teacherDisplay(t))}${t.scope==="external"?" · зовнішній":""}</option>`).join("")}`;
  openModal(`<h2>${id?"Редагувати":"Нове"} заняття</h2><form id="lf" class="form-grid">
    <label>Дата<input id="ld" type="date" value="${esc(x.date)}" required></label>
    <label>Група<select id="lg">${groupOptions(x.group)}</select></label>
    <label>Початок<input id="ls" type="time" value="${esc(x.start)}" required></label>
    <label>Кінець<input id="le" type="time" value="${esc(x.end)}" required></label>
    <label class="wide">Дисципліна<select id="ldi"><option value="">—</option>${groupDiscs.map(d=>`<option value="${d.id}" ${Number(d.id)===Number(x.disciplineId)?"selected":""}>${esc(d.name)}</option>`).join("")}<option value="__custom__" ${isCustom?"selected":""}>Інша / загальноосвітня дисципліна…</option></select><input id="ldiCustom" value="${esc(isCustom?x.discipline:"")}" placeholder="Наприклад, Політологія" style="display:${isCustom?"":"none"};margin-top:6px"></label>
    <label>Вид заняття<select id="lt">${db.lessonTypes.map(v=>`<option ${v.name===x.type?"selected":""}>${esc(v.name)}</option>`).join("")}</select></label>
    <label>Облікові години цього запису<input id="lwh" type="number" min="0" step="0.01" value="${esc(x.workloadHours)}"></label>
    <label>Охоплення<select id="lc">${db.coverageTypes.map(v=>`<option ${v===x.coverage?"selected":""}>${esc(v)}</option>`).join("")}</select></label>
    <label>Аудиторія<select id="lr"><option value="">—</option>${db.rooms.filter(r=>r.status!=="archived").map(r=>`<option ${r.name===x.room?"selected":""}>${esc(r.name)}</option>`).join("")}</select></label>
    <label class="wide">Студент(и) / підгрупа<input id="lst" value="${esc(x.students||"")}"></label>
    <label>Викладач<select id="ltea">${teacherOpts}</select></label>
    <label>Примітка<input id="ln" value="${esc(x.note||"")}"></label>
    <div id="conflictBox" class="wide"></div>
    <div class="wide"><button class="primary">${id?"Зберегти":"Додати"}</button></div>
  </form>`,true);
  const syncDisc=()=>{$("#ldiCustom").style.display=$("#ldi").value==="__custom__"?"":"none";};
  $("#ldi").onchange=syncDisc;syncDisc();
  $("#lt").onchange=()=>{const type=lessonTypeByName($("#lt").value);if(type)$("#lwh").value=type.defaultUnit??1;check();};
  $("#lg").onchange=()=>{closeModal();openLessonModal(id);};
  const check=()=>{
    const item=readLesson();
    const cs=item.date&&item.start&&item.end?conflictsFor(item,id):[];
    const info=teacherAvailabilityInfo(item,id);
    let html="";
    if(cs.length)html+=`<div class="conflicts"><b>Є конфлікт у розкладі:</b>${cs.map(c=>`<div class="conflict">${esc(c.group)} · ${esc(c.start)}–${esc(c.end)} · ауд. ${esc(c.room||"—")}${c.teacher?` · ${esc(c.teacher)}`:""}</div>`).join("")}</div>`;
    if(info.warnings.length)html+=`<div class="conflicts"><b>Обмеження викладача:</b>${info.warnings.map(w=>`<div class="conflict">${esc(w)}</div>`).join("")}</div>`;
    if(info.notes.length)html+=`<div class="notice">${info.notes.map(esc).join("<br>")}</div>`;
    if(!html)html=`<div class="notice">Усе вільно: перевірено групу, аудиторію, викладача, період його роботи та недоступний час.</div>`;
    $("#conflictBox").innerHTML=html;
  };
  ["ld","ls","le","lr","ltea"].forEach(k=>$("#"+k).onchange=check);check();
  $("#lf").onsubmit=e=>{
    e.preventDefault();
    const item=readLesson();
    if(item.end<=item.start)return alert("Час завершення має бути пізніше.");
    if(!item.discipline)return alert("Вкажіть дисципліну.");
    const cs=conflictsFor(item,id),info=teacherAvailabilityInfo(item,id);
    if((cs.length||info.warnings.length)&&!confirm("Є конфлікт або обмеження викладача. Все одно зберегти?"))return;
    if(id)Object.assign(db.schedule.find(s=>s.id===id),item);else db.schedule.push({id:uid(db.schedule),...item});
    closeModal();save();go("schedule");
  };
}
function readLesson(){
  const did=$("#ldi").value;
  const disciplineId=did&&did!=="__custom__"?Number(did):null;
  const d=disciplineById(disciplineId);
  const tid=$("#ltea").value?Number($("#ltea").value):null;
  const t=teacherById(tid);
  return{
    date:$("#ld").value,start:$("#ls").value,end:$("#le").value,group:$("#lg").value,
    disciplineId,discipline:did==="__custom__"?$("#ldiCustom").value.trim():(d?.name||""),
    type:$("#lt").value,workloadHours:num($("#lwh").value),coverage:$("#lc").value,students:$("#lst").value.trim(),
    teacherId:tid,teacher:t?teacherDisplay(t):"",room:$("#lr").value,note:$("#ln").value.trim()
  };
}
function deleteLesson(id){if(confirm("Видалити заняття?")){db.schedule=db.schedule.filter(x=>x.id!==id);save();}}

/* Settings */
function renderSettings(){
  $("#page-settings").innerHTML=`<div class="settings-grid">
    <div class="card settings-card"><h3>Навчальний період</h3><label>Навчальний рік<input id="setYear" value="${esc(db.academicYear)}"></label><label style="margin-top:10px">Семестр<select id="setSem"><option ${db.semester===1?"selected":""}>1</option><option ${db.semester===2?"selected":""}>2</option></select></label><button class="primary" style="margin-top:12px" onclick="savePeriod()">Зберегти</button></div>
    <div class="card settings-card"><h3>Резервна копія</h3><p class="small">Експорт усієї бази одним JSON-файлом.</p><button class="primary" onclick="exportData()">Експорт даних</button></div>
    <div class="card settings-card"><h3>Імпорт</h3><p class="small">Відновити дані з резервної копії.</p><button class="secondary" onclick="document.querySelector('#importFile').click()">Імпортувати</button></div>
    <div class="card settings-card"><h3>Скидання</h3><p class="small">Повернути початкові дані версії 0.4.</p><button class="danger" onclick="resetData()">Скинути дані</button></div>
  </div>`;
}
function savePeriod(){db.academicYear=$("#setYear").value.trim();db.semester=+$("#setSem").value;save();alert("Збережено.");}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`REMS-ROZKLAD-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);}
$("#importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=migrate(JSON.parse(r.result));save();alert("Дані імпортовано.");}catch(err){alert("Не вдалося прочитати файл.");}};r.readAsText(f);e.target.value="";};
function resetData(){if(confirm("Повернути початкові дані?")){db=clone(window.REMS_INITIAL_DATA);save();go("home");}}

go("home");
