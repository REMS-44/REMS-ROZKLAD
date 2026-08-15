
const KEY = "remsScheduleData_v01";
let db = loadData();
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function loadData(){
  try{
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : clone(window.REMS_INITIAL_DATA);
  }catch(e){ return clone(window.REMS_INITIAL_DATA); }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(db)); renderCurrent(); }
function uid(arr){ return arr.length ? Math.max(...arr.map(x=>Number(x.id)||0))+1 : 1; }
function esc(v=""){ return String(v).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
function groupStudentCount(code){ return db.students.filter(s=>s.group===code && s.status!=="archived").length; }

const pageMeta = {
  home:["Головна","Кафедральний пульт розкладу"],
  schedule:["Розклад","Заняття, час, аудиторії та конфлікти"],
  groups:["Групи","Курси та шифри груп"],
  students:["Студенти","Редагована база студентів"],
  rooms:["Аудиторії","Перелік приміщень кафедри"],
  teachers:["Викладачі","Заповнимо пізніше"],
  disciplines:["Дисципліни","Навчальні дисципліни та години"],
  settings:["Налаштування","Резервна копія та параметри системи"]
};
let currentPage = "home";

$$(".nav-btn").forEach(b=>b.onclick=()=>go(b.dataset.page));
$("#quickAdd").onclick=()=>openLessonModal();
$("#modalClose").onclick=closeModal;
$("#modal").onclick=e=>{ if(e.target.id==="modal") closeModal(); };

function go(page){
  currentPage=page;
  $$(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  $$(".page").forEach(x=>x.classList.remove("active"));
  $("#page-"+page).classList.add("active");
  $("#pageTitle").textContent=pageMeta[page][0];
  $("#pageSubtitle").textContent=pageMeta[page][1];
  $("#quickAdd").style.display = ["settings"].includes(page) ? "none" : "";
  renderCurrent();
}
function renderCurrent(){
  ({home:renderHome,schedule:renderSchedule,groups:renderGroups,students:renderStudents,rooms:renderRooms,teachers:renderTeachers,disciplines:renderDisciplines,settings:renderSettings}[currentPage])();
}
function openModal(html){ $("#modalBody").innerHTML=html; $("#modal").classList.remove("hidden"); }
function closeModal(){ $("#modal").classList.add("hidden"); $("#modalBody").innerHTML=""; }

function renderHome(){
  const el=$("#page-home");
  const today=new Date().toISOString().slice(0,10);
  const todays=db.schedule.filter(x=>x.date===today).sort((a,b)=>a.start.localeCompare(b.start));
  el.innerHTML=`
    <div class="grid-kpi">
      ${kpi("Груп",db.groups.length)}
      ${kpi("Студентів",db.students.filter(x=>x.status!=="archived").length)}
      ${kpi("Аудиторій",db.rooms.filter(x=>x.status!=="archived").length)}
      ${kpi("Занять у розкладі",db.schedule.length)}
    </div>
    <div class="card section">
      <div class="section-head"><h2>Групи</h2><button class="secondary" onclick="go('groups')">Керувати</button></div>
      <div class="group-grid">
        ${db.groups.sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`
          <div class="group-card"><b>${esc(g.code)}</b><p>${g.course} курс · ${groupStudentCount(g.code)} студентів</p></div>`).join("")}
      </div>
    </div>
    <div class="card section">
      <div class="section-head"><h2>Сьогодні</h2><button class="primary" onclick="openLessonModal()">+ Заняття</button></div>
      ${todays.length ? miniSchedule(todays) : `<div class="empty">На сьогодні занять ще немає.</div>`}
    </div>`;
}
function kpi(label,value){ return `<div class="card kpi"><div class="label">${label}</div><div class="value">${value}</div></div>`; }

function miniSchedule(rows){
  return `<div class="table-wrap"><table><thead><tr><th>Час</th><th>Група</th><th>Дисципліна</th><th>Аудиторія</th></tr></thead><tbody>
  ${rows.map(x=>`<tr><td><b>${esc(x.start)}–${esc(x.end)}</b></td><td>${esc(x.group)}</td><td>${esc(x.discipline||"—")}</td><td class="schedule-row-room">${esc(x.room||"—")}</td></tr>`).join("")}
  </tbody></table></div>`;
}

function renderGroups(){
  const el=$("#page-groups");
  el.innerHTML=`<div class="card section">
    <div class="section-head"><h2>Усі групи</h2><button class="primary" onclick="addGroup()">+ Додати групу</button></div>
    <div class="table-wrap"><table><thead><tr><th>Курс</th><th>Група</th><th>Студентів</th><th></th></tr></thead><tbody>
      ${db.groups.sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`
      <tr><td>${g.course}</td><td><b>${esc(g.code)}</b></td><td>${groupStudentCount(g.code)}</td><td class="actions">
      <button onclick="editGroup(${g.id})">Редагувати</button><button onclick="deleteGroup(${g.id})">Видалити</button></td></tr>`).join("")}
    </tbody></table></div></div>`;
}
function addGroup(){
  openModal(`<h2>Нова група</h2><form id="groupForm" class="form-grid">
    <label>Курс<select id="gCourse">${[1,2,3,4,5,6].map(x=>`<option>${x}</option>`).join("")}</select></label>
    <label>Шифр групи<input id="gCode" placeholder="Наприклад, РЕМС-47" required></label>
    <div class="wide"><button class="primary">Додати</button></div>
  </form>`);
  $("#groupForm").onsubmit=e=>{e.preventDefault(); const code=$("#gCode").value.trim(); if(!code)return;
    if(db.groups.some(g=>g.code.toLowerCase()===code.toLowerCase())) return alert("Така група вже існує.");
    db.groups.push({id:uid(db.groups),course:+$("#gCourse").value,code}); closeModal(); save();
  };
}
function editGroup(id){
  const g=db.groups.find(x=>x.id===id); if(!g)return;
  openModal(`<h2>Редагувати групу</h2><form id="groupForm" class="form-grid">
    <label>Курс<select id="gCourse">${[1,2,3,4,5,6].map(x=>`<option ${x===g.course?"selected":""}>${x}</option>`).join("")}</select></label>
    <label>Шифр групи<input id="gCode" value="${esc(g.code)}" required></label>
    <div class="wide"><button class="primary">Зберегти</button></div></form>`);
  $("#groupForm").onsubmit=e=>{e.preventDefault(); const old=g.code, neu=$("#gCode").value.trim(); if(!neu)return;
    g.course=+$("#gCourse").value; g.code=neu;
    db.students.forEach(s=>{if(s.group===old)s.group=neu});
    db.schedule.forEach(s=>{if(s.group===old)s.group=neu});
    db.disciplines.forEach(s=>{if(s.group===old)s.group=neu});
    closeModal(); save();
  };
}
function deleteGroup(id){
  const g=db.groups.find(x=>x.id===id); if(!g)return;
  if(groupStudentCount(g.code)>0) return alert("Спочатку переведіть або видаліть студентів цієї групи.");
  if(confirm(`Видалити групу ${g.code}?`)){ db.groups=db.groups.filter(x=>x.id!==id); save(); }
}

function renderStudents(){
  const el=$("#page-students");
  el.innerHTML=`<div class="card section">
    <div class="section-head"><h2>Студенти</h2><button class="primary" onclick="addStudent()">+ Додати студента</button></div>
    <div class="toolbar">
      <input id="studentSearch" placeholder="Пошук за прізвищем…">
      <select id="studentGroupFilter"><option value="">Усі групи</option>${groupOptions()}</select>
    </div>
    <div id="studentTable"></div></div>`;
  $("#studentSearch").oninput=renderStudentTable;
  $("#studentGroupFilter").onchange=renderStudentTable;
  renderStudentTable();
}
function renderStudentTable(){
  const q=($("#studentSearch")?.value||"").trim().toLowerCase();
  const gf=$("#studentGroupFilter")?.value||"";
  const rows=db.students.filter(s=>s.status!=="archived" && (!q||s.name.toLowerCase().includes(q)) && (!gf||s.group===gf))
    .sort((a,b)=>a.group.localeCompare(b.group)||a.name.localeCompare(b.name));
  $("#studentTable").innerHTML=`<div class="table-wrap"><table><thead><tr><th>ПІБ</th><th>Група</th><th>Курс</th><th></th></tr></thead><tbody>
  ${rows.map(s=>{const g=db.groups.find(x=>x.code===s.group);return `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.group)}</td><td>${g?.course||"—"}</td><td class="actions">
    <button onclick="editStudent(${s.id})">Редагувати</button><button onclick="deleteStudent(${s.id})">Видалити</button></td></tr>`}).join("")}
  </tbody></table></div><div class="small" style="margin-top:10px">Показано: ${rows.length}</div>`;
}
function groupOptions(selected=""){ return db.groups.sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`<option value="${esc(g.code)}" ${g.code===selected?"selected":""}>${esc(g.code)} · ${g.course} курс</option>`).join("");}
function addStudent(){
  openModal(`<h2>Новий студент</h2><form id="studentForm" class="form-grid">
    <label class="wide">ПІБ<input id="sName" required></label><label>Група<select id="sGroup">${groupOptions()}</select></label>
    <div class="wide"><button class="primary">Додати</button></div></form>`);
  $("#studentForm").onsubmit=e=>{e.preventDefault(); db.students.push({id:uid(db.students),name:$("#sName").value.trim(),group:$("#sGroup").value,status:"active"}); closeModal(); save();};
}
function editStudent(id){
  const s=db.students.find(x=>x.id===id); if(!s)return;
  openModal(`<h2>Редагувати студента</h2><form id="studentForm" class="form-grid">
    <label class="wide">ПІБ<input id="sName" value="${esc(s.name)}" required></label>
    <label>Група<select id="sGroup">${groupOptions(s.group)}</select></label>
    <div class="wide"><button class="primary">Зберегти</button></div></form>`);
  $("#studentForm").onsubmit=e=>{e.preventDefault(); s.name=$("#sName").value.trim(); s.group=$("#sGroup").value; closeModal(); save();};
}
function deleteStudent(id){ const s=db.students.find(x=>x.id===id); if(s&&confirm(`Видалити ${s.name}?`)){ db.students=db.students.filter(x=>x.id!==id); save(); } }

function renderRooms(){
  $("#page-rooms").innerHTML=`<div class="card section">
    <div class="section-head"><h2>Аудиторії</h2><button class="primary" onclick="addRoom()">+ Додати аудиторію</button></div>
    <div class="table-wrap"><table><thead><tr><th>Аудиторія</th><th>Статус</th><th></th></tr></thead><tbody>
      ${db.rooms.map(r=>`<tr><td><b>${esc(r.name)}</b></td><td><span class="badge ok">АКТИВНА</span></td><td class="actions">
      <button onclick="editRoom(${r.id})">Редагувати</button><button onclick="deleteRoom(${r.id})">Видалити</button></td></tr>`).join("")}
    </tbody></table></div></div>`;
}
function addRoom(){
  const name=prompt("Номер або назва аудиторії:"); if(!name)return;
  if(db.rooms.some(r=>r.name.toLowerCase()===name.trim().toLowerCase())) return alert("Така аудиторія вже є.");
  db.rooms.push({id:uid(db.rooms),name:name.trim(),status:"active"}); save();
}
function editRoom(id){ const r=db.rooms.find(x=>x.id===id); if(!r)return; const n=prompt("Аудиторія:",r.name); if(n){r.name=n.trim();save();}}
function deleteRoom(id){ const r=db.rooms.find(x=>x.id===id); if(r&&confirm(`Видалити аудиторію ${r.name}?`)){db.rooms=db.rooms.filter(x=>x.id!==id);save();}}

function renderTeachers(){
  $("#page-teachers").innerHTML=`<div class="card section">
    <div class="section-head"><h2>Викладачі</h2><button class="primary" onclick="addSimple('teacher')">+ Додати викладача</button></div>
    ${db.teachers.length?simpleTable(db.teachers,"teacher"):`<div class="empty">Список викладачів додамо пізніше. Вкладка вже готова.</div>`}
  </div>`;
}
function renderDisciplines(){
  $("#page-disciplines").innerHTML=`<div class="card section">
    <div class="section-head"><h2>Дисципліни</h2><button class="primary" onclick="addDiscipline()">+ Додати дисципліну</button></div>
    ${db.disciplines.length?disciplineTable():`<div class="empty">Дисципліни та їх години внесемо пізніше. Структура вже підготовлена.</div>`}
  </div>`;
}
function addSimple(type){
  const name=prompt(type==="teacher"?"ПІБ викладача:":"Назва:"); if(!name)return;
  db.teachers.push({id:uid(db.teachers),name:name.trim()}); save();
}
function simpleTable(arr,type){
  return `<div class="table-wrap"><table><thead><tr><th>ПІБ</th><th></th></tr></thead><tbody>${arr.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td class="actions"><button onclick="removeSimple('${type}',${x.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div>`;
}
function removeSimple(type,id){ if(confirm("Видалити запис?")){ db.teachers=db.teachers.filter(x=>x.id!==id); save(); } }
function addDiscipline(){
  openModal(`<h2>Нова дисципліна</h2><form id="discForm" class="form-grid">
  <label class="wide">Назва<input id="dName" required></label>
  <label>Група<select id="dGroup"><option value="">Без прив'язки</option>${groupOptions()}</select></label>
  <label>Лекції, год.<input id="dLect" type="number" min="0" value="0"></label>
  <label>Практичні, год.<input id="dPract" type="number" min="0" value="0"></label>
  <label>Індивідуальні, год.<input id="dInd" type="number" min="0" value="0"></label>
  <label>Консультації, год.<input id="dCons" type="number" min="0" value="0"></label>
  <label>Контрольні, год.<input id="dCtrl" type="number" min="0" value="0"></label>
  <div class="wide"><button class="primary">Додати</button></div></form>`);
  $("#discForm").onsubmit=e=>{e.preventDefault();db.disciplines.push({id:uid(db.disciplines),name:$("#dName").value.trim(),group:$("#dGroup").value,
    hours:{lecture:+$("#dLect").value,practice:+$("#dPract").value,individual:+$("#dInd").value,consultation:+$("#dCons").value,control:+$("#dCtrl").value}});closeModal();save();};
}
function disciplineTable(){
  return `<div class="table-wrap"><table><thead><tr><th>Дисципліна</th><th>Група</th><th>Лек.</th><th>Практ.</th><th>Інд.</th><th>Конс.</th><th>Контр.</th><th></th></tr></thead><tbody>
  ${db.disciplines.map(d=>`<tr><td><b>${esc(d.name)}</b></td><td>${esc(d.group||"—")}</td><td>${d.hours?.lecture||0}</td><td>${d.hours?.practice||0}</td><td>${d.hours?.individual||0}</td><td>${d.hours?.consultation||0}</td><td>${d.hours?.control||0}</td><td class="actions"><button onclick="deleteDiscipline(${d.id})">Видалити</button></td></tr>`).join("")}
  </tbody></table></div>`;
}
function deleteDiscipline(id){if(confirm("Видалити дисципліну?")){db.disciplines=db.disciplines.filter(x=>x.id!==id);save();}}

function renderSchedule(){
  const el=$("#page-schedule");
  const rows=[...db.schedule].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  el.innerHTML=`<div class="card section">
    <div class="section-head"><h2>Усі заняття</h2><button class="primary" onclick="openLessonModal()">+ Додати заняття</button></div>
    <div class="toolbar"><input id="scheduleSearch" placeholder="Група, дисципліна, аудиторія…"><select id="scheduleGroup"><option value="">Усі групи</option>${groupOptions()}</select></div>
    <div id="scheduleTable"></div></div>`;
  $("#scheduleSearch").oninput=renderScheduleTable; $("#scheduleGroup").onchange=renderScheduleTable; renderScheduleTable();
}
function renderScheduleTable(){
  if(!$("#scheduleTable"))return;
  const q=($("#scheduleSearch")?.value||"").toLowerCase(), gf=$("#scheduleGroup")?.value||"";
  const rows=[...db.schedule].filter(x=>(!gf||x.group===gf)&&(!q||JSON.stringify(x).toLowerCase().includes(q))).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  $("#scheduleTable").innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Дата</th><th>Час</th><th>Група</th><th>Дисципліна</th><th>Вид</th><th>Аудиторія</th><th>Викладач</th><th></th></tr></thead><tbody>
  ${rows.map(x=>`<tr><td>${formatDate(x.date)}</td><td><b>${esc(x.start)}–${esc(x.end)}</b></td><td>${esc(x.group)}</td><td>${esc(x.discipline||"—")}</td><td>${esc(x.type||"—")}</td><td class="schedule-row-room">${esc(x.room||"—")}</td><td>${esc(x.teacher||"—")}</td><td class="actions"><button onclick="openLessonModal(${x.id})">Редагувати</button><button onclick="deleteLesson(${x.id})">Видалити</button></td></tr>`).join("")}
  </tbody></table></div>`:`<div class="empty">Розклад поки порожній.</div>`;
}
function formatDate(s){ if(!s)return""; const [y,m,d]=s.split("-"); return `${d}.${m}.${y}`; }
function timeOverlap(aStart,aEnd,bStart,bEnd){ return aStart < bEnd && aEnd > bStart; }
function conflictsFor(item, ignoreId=null){
  return db.schedule.filter(x=>x.id!==ignoreId && x.date===item.date && timeOverlap(item.start,item.end,x.start,x.end))
    .filter(x=>(item.room&&x.room===item.room)||(item.group&&x.group===item.group)||(item.teacher&&x.teacher&&x.teacher===item.teacher));
}
function openLessonModal(id=null){
  const x=id?db.schedule.find(s=>s.id===id):{date:"",start:"09:00",end:"10:20",group:db.groups[0]?.code||"",discipline:"",type:"Практичне",coverage:"Вся група",students:"",teacher:"",room:"",note:""};
  const teacherOpts=`<option value="">—</option>`+db.teachers.map(t=>`<option ${t.name===x.teacher?"selected":""}>${esc(t.name)}</option>`).join("");
  const disciplineOpts=`<option value="">—</option>`+db.disciplines.filter(d=>!d.group||d.group===x.group).map(d=>`<option ${d.name===x.discipline?"selected":""}>${esc(d.name)}</option>`).join("");
  openModal(`<h2>${id?"Редагувати":"Нове"} заняття</h2>
  <form id="lessonForm" class="form-grid">
    <label>Дата<input id="lDate" type="date" value="${esc(x.date)}" required></label>
    <label>Група<select id="lGroup">${groupOptions(x.group)}</select></label>
    <label>Початок<input id="lStart" type="time" value="${esc(x.start)}" required></label>
    <label>Кінець<input id="lEnd" type="time" value="${esc(x.end)}" required></label>
    <label>Дисципліна<select id="lDisc">${disciplineOpts}</select></label>
    <label>Вид заняття<select id="lType">${db.lessonTypes.map(v=>`<option ${v===x.type?"selected":""}>${v}</option>`).join("")}</select></label>
    <label>Охоплення<select id="lCoverage">${db.coverageTypes.map(v=>`<option ${v===x.coverage?"selected":""}>${v}</option>`).join("")}</select></label>
    <label>Аудиторія<select id="lRoom"><option value="">—</option>${db.rooms.map(r=>`<option ${r.name===x.room?"selected":""}>${esc(r.name)}</option>`).join("")}</select></label>
    <label class="wide">Студент(и) / підгрупа<input id="lStudents" value="${esc(x.students||"")}" placeholder="За потреби"></label>
    <label>Викладач<select id="lTeacher">${teacherOpts}</select></label>
    <label>Примітка<input id="lNote" value="${esc(x.note||"")}"></label>
    <div id="conflictBox" class="wide"></div>
    <div class="wide"><button class="primary">${id?"Зберегти":"Додати в розклад"}</button></div>
  </form>`);
  const check=()=>{
    const item=readLessonForm(); const cs=item.date&&item.start&&item.end?conflictsFor(item,id):[];
    $("#conflictBox").innerHTML=cs.length?`<div class="conflicts"><b>Є конфлікт:</b>${cs.map(c=>`<div class="conflict">${esc(c.group)} · ${esc(c.start)}–${esc(c.end)} · ауд. ${esc(c.room||"—")}${c.teacher?` · ${esc(c.teacher)}`:""}</div>`).join("")}</div>`:`<div class="notice">Якщо дата, час і аудиторія заповнені — система перевіряє перетини автоматично.</div>`;
  };
  ["lDate","lStart","lEnd","lGroup","lRoom","lTeacher"].forEach(k=>$("#"+k).onchange=check); check();
  $("#lessonForm").onsubmit=e=>{e.preventDefault(); const item=readLessonForm(); if(item.end<=item.start)return alert("Час завершення має бути пізніше за початок.");
    const cs=conflictsFor(item,id); if(cs.length&&!confirm("Є конфлікт у розкладі. Все одно зберегти?"))return;
    if(id) Object.assign(db.schedule.find(s=>s.id===id),item); else db.schedule.push({id:uid(db.schedule),...item});
    closeModal(); save(); go("schedule");
  };
}
function readLessonForm(){return {date:$("#lDate").value,start:$("#lStart").value,end:$("#lEnd").value,group:$("#lGroup").value,discipline:$("#lDisc").value,type:$("#lType").value,coverage:$("#lCoverage").value,students:$("#lStudents").value.trim(),teacher:$("#lTeacher").value,room:$("#lRoom").value,note:$("#lNote").value.trim()};}
function deleteLesson(id){if(confirm("Видалити заняття?")){db.schedule=db.schedule.filter(x=>x.id!==id);save();}}

function renderSettings(){
  $("#page-settings").innerHTML=`<div class="settings-grid">
    <div class="card settings-card"><h3>Резервна копія</h3><p class="small">Вивантажити всі групи, студентів, аудиторії та розклад одним JSON-файлом.</p><button class="primary" onclick="exportData()">Експорт даних</button></div>
    <div class="card settings-card"><h3>Імпорт</h3><p class="small">Відновити дані з раніше створеної резервної копії.</p><button class="secondary" onclick="document.querySelector('#importFile').click()">Імпортувати</button></div>
    <div class="card settings-card"><h3>Скидання</h3><p class="small">Повернути початкові 6 груп, 118 студентів та 8 аудиторій.</p><button class="danger" onclick="resetData()">Скинути дані</button></div>
    <div class="card settings-card"><h3>Важливо</h3><p class="small">У цій першій версії зміни зберігаються в браузері цього пристрою. Наступним етапом підключимо спільну онлайн-базу, щоб усе синхронізувалося між пристроями.</p></div>
  </div>`;
}
function exportData(){
  const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`REMS-ROZKLAD-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
}
$("#importFile").onchange=e=>{
  const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{db=JSON.parse(r.result);save();alert("Дані імпортовано.");}catch(e){alert("Не вдалося прочитати файл.");}}; r.readAsText(f); e.target.value="";
};
function resetData(){if(confirm("Повернути початкові дані? Поточні зміни буде втрачено.")){db=clone(window.REMS_INITIAL_DATA);save();go("home");}}

go("home");
