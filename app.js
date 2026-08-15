
const KEY="remsScheduleData_v02";
const OLDKEY="remsScheduleData_v01";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clone=x=>JSON.parse(JSON.stringify(x));
function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function uid(arr){return arr.length?Math.max(...arr.map(x=>Number(x.id)||0))+1:1;}

function migrate(old){
  const fresh=clone(window.REMS_INITIAL_DATA);
  if(!old||typeof old!=="object") return fresh;
  fresh.groups=old.groups||fresh.groups; fresh.students=old.students||fresh.students; fresh.rooms=old.rooms||fresh.rooms;
  fresh.schedule=old.schedule||[]; fresh.teachers=(old.teachers||[]).map((t,i)=>({
    id:t.id||i+1,name:t.name||"",shortName:t.shortName||"",position:t.position||"",academicTitle:t.academicTitle||"",
    degree:t.degree||"",employmentType:t.employmentType||"",rate:t.rate||"",phone:t.phone||"",email:t.email||"",
    unavailable:t.unavailable||"",preferred:t.preferred||"",maxPerDay:t.maxPerDay||"",maxConsecutive:t.maxConsecutive||"",
    note:t.note||"",photo:t.photo||"",status:t.status||"active"
  }));
  fresh.disciplines=(old.disciplines||[]).map((d,i)=>({
    id:d.id||i+1,name:d.name||"",course:d.course||"",group:d.group||"",semester:d.semester||fresh.semester,
    academicYear:d.academicYear||fresh.academicYear,teacherIds:d.teacherIds||[],controlForm:d.controlForm||"Немає",
    color:d.color||"#8b5cf6",hours:d.hours||{},note:d.note||"",status:d.status||"active"
  }));
  if(Array.isArray(old.lessonTypes)&&old.lessonTypes.length){
    fresh.lessonTypes=old.lessonTypes.map((x,i)=>typeof x==="string"?{id:i+1,name:x,countMode:"manual",defaultUnit:1,description:""}:{...x,id:x.id||i+1});
  }
  return fresh;
}
function loadData(){
  try{
    const v2=localStorage.getItem(KEY); if(v2) return migrate(JSON.parse(v2));
    const v1=localStorage.getItem(OLDKEY); if(v1){const m=migrate(JSON.parse(v1)); localStorage.setItem(KEY,JSON.stringify(m)); return m;}
  }catch(e){}
  return clone(window.REMS_INITIAL_DATA);
}
let db=loadData(), currentPage="home";
function save(){db.schemaVersion=2;localStorage.setItem(KEY,JSON.stringify(db));renderCurrent();}
function groupStudentCount(code){return db.students.filter(s=>s.group===code&&s.status!=="archived").length;}
function groupCourse(code){return db.groups.find(g=>g.code===code)?.course||"";}

const meta={
 home:["Головна","Кафедральний пульт розкладу"],schedule:["Розклад","Заняття, час, аудиторії та конфлікти"],
 groups:["Групи","Курси та шифри груп"],students:["Студенти","Редагована база студентів"],rooms:["Аудиторії","Перелік приміщень кафедри"],
 teachers:["Викладачі","Профілі, зайнятість і побажання"],disciplines:["Дисципліни","Групи, викладачі, години та контроль"],
 lessonTypes:["Види занять","Правила підрахунку годин"],settings:["Налаштування","Навчальний рік, семестр і резервні копії"]
};
$$(".nav-btn").forEach(b=>b.onclick=()=>go(b.dataset.page));
$("#quickAdd").onclick=()=>openLessonModal(); $("#modalClose").onclick=closeModal; $("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
function go(p){currentPage=p;$$(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===p));$$(".page").forEach(x=>x.classList.remove("active"));$("#page-"+p).classList.add("active");$("#pageTitle").textContent=meta[p][0];$("#pageSubtitle").textContent=meta[p][1];$("#quickAdd").style.display=p==="settings"?"none":"";renderCurrent();}
function renderCurrent(){({home:renderHome,schedule:renderSchedule,groups:renderGroups,students:renderStudents,rooms:renderRooms,teachers:renderTeachers,disciplines:renderDisciplines,lessonTypes:renderLessonTypes,settings:renderSettings}[currentPage])();}
function openModal(h){$("#modalBody").innerHTML=h;$("#modal").classList.remove("hidden")} function closeModal(){$("#modal").classList.add("hidden");$("#modalBody").innerHTML=""}
function kpi(l,v){return `<div class="card kpi"><div class="label">${l}</div><div class="value">${v}</div></div>`}
function groupOptions(sel=""){return db.groups.sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`<option value="${esc(g.code)}" ${g.code===sel?"selected":""}>${esc(g.code)} · ${g.course} курс</option>`).join("")}
function teacherOptions(ids=[]){return db.teachers.filter(t=>t.status!=="archived").map(t=>`<option value="${t.id}" ${ids.includes(t.id)?"selected":""}>${esc(t.shortName||t.name)}</option>`).join("")}
function formatMode(m){return ({academic_pair:"Аудиторні / парами",contingent:"За контингентом",per_student:"Індивідуально кожному",fixed:"Фіксовані години",manual:"Ручний підрахунок"})[m]||m}
function lessonTypeByName(n){return db.lessonTypes.find(x=>x.name===n)}
function teacherNames(ids=[]){return ids.map(id=>db.teachers.find(t=>t.id===id)?.shortName||db.teachers.find(t=>t.id===id)?.name).filter(Boolean).join(", ")}
function totalDisciplineHours(d){return Object.values(d.hours||{}).reduce((a,b)=>a+(Number(b)||0),0)}

function renderHome(){
 const el=$("#page-home");const today=new Date().toISOString().slice(0,10);const todays=db.schedule.filter(x=>x.date===today).sort((a,b)=>a.start.localeCompare(b.start));
 el.innerHTML=`<div class="grid-kpi">${kpi("Груп",db.groups.length)}${kpi("Студентів",db.students.filter(x=>x.status!=="archived").length)}${kpi("Викладачів",db.teachers.filter(x=>x.status!=="archived").length)}${kpi("Дисциплін",db.disciplines.filter(x=>x.status!=="archived").length)}</div>
 <div class="card section"><div class="section-head"><h2>${esc(db.academicYear)} · ${db.semester} семестр</h2><button class="secondary" onclick="go('settings')">Змінити</button></div><div class="group-grid">${db.groups.sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`<div class="group-card"><b>${esc(g.code)}</b><p>${g.course} курс · ${groupStudentCount(g.code)} студентів</p></div>`).join("")}</div></div>
 <div class="card section"><div class="section-head"><h2>Сьогодні</h2><button class="primary" onclick="openLessonModal()">+ Заняття</button></div>${todays.length?miniSchedule(todays):`<div class="empty">На сьогодні занять ще немає.</div>`}</div>`;
}
function miniSchedule(rows){return `<div class="table-wrap"><table><thead><tr><th>Час</th><th>Група</th><th>Дисципліна</th><th>Аудиторія</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.start)}–${esc(x.end)}</b></td><td>${esc(x.group)}</td><td>${esc(x.discipline||"—")}</td><td><b>${esc(x.room||"—")}</b></td></tr>`).join("")}</tbody></table></div>`}

function renderGroups(){$("#page-groups").innerHTML=`<div class="card section"><div class="section-head"><h2>Усі групи</h2><button class="primary" onclick="addGroup()">+ Додати групу</button></div><div class="table-wrap"><table><thead><tr><th>Курс</th><th>Група</th><th>Студентів</th><th></th></tr></thead><tbody>${db.groups.sort((a,b)=>a.course-b.course||a.code.localeCompare(b.code)).map(g=>`<tr><td>${g.course}</td><td><b>${esc(g.code)}</b></td><td>${groupStudentCount(g.code)}</td><td class="actions"><button onclick="editGroup(${g.id})">Редагувати</button><button onclick="deleteGroup(${g.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div></div>`}
function addGroup(){openModal(`<h2>Нова група</h2><form id="f" class="form-grid"><label>Курс<select id="gc">${[1,2,3,4,5,6].map(x=>`<option>${x}</option>`).join("")}</select></label><label>Шифр<input id="gn" required></label><div class="wide"><button class="primary">Додати</button></div></form>`);$("#f").onsubmit=e=>{e.preventDefault();const c=$("#gn").value.trim();if(!c)return;if(db.groups.some(g=>g.code.toLowerCase()===c.toLowerCase()))return alert("Така група вже є.");db.groups.push({id:uid(db.groups),course:+$("#gc").value,code:c});closeModal();save()}}
function editGroup(id){const g=db.groups.find(x=>x.id===id);openModal(`<h2>Редагувати групу</h2><form id="f" class="form-grid"><label>Курс<select id="gc">${[1,2,3,4,5,6].map(x=>`<option ${x===g.course?"selected":""}>${x}</option>`).join("")}</select></label><label>Шифр<input id="gn" value="${esc(g.code)}" required></label><div class="wide"><button class="primary">Зберегти</button></div></form>`);$("#f").onsubmit=e=>{e.preventDefault();const old=g.code,neu=$("#gn").value.trim();g.course=+$("#gc").value;g.code=neu;db.students.forEach(s=>{if(s.group===old)s.group=neu});db.schedule.forEach(s=>{if(s.group===old)s.group=neu});db.disciplines.forEach(s=>{if(s.group===old)s.group=neu});closeModal();save()}}
function deleteGroup(id){const g=db.groups.find(x=>x.id===id);if(groupStudentCount(g.code))return alert("Спочатку переведіть або видаліть студентів.");if(confirm(`Видалити ${g.code}?`)){db.groups=db.groups.filter(x=>x.id!==id);save()}}

function renderStudents(){$("#page-students").innerHTML=`<div class="card section"><div class="section-head"><h2>Студенти</h2><button class="primary" onclick="addStudent()">+ Додати студента</button></div><div class="toolbar"><input id="studentSearch" placeholder="Пошук…"><select id="studentGroupFilter"><option value="">Усі групи</option>${groupOptions()}</select></div><div id="studentTable"></div></div>`;$("#studentSearch").oninput=renderStudentTable;$("#studentGroupFilter").onchange=renderStudentTable;renderStudentTable()}
function renderStudentTable(){const q=($("#studentSearch")?.value||"").toLowerCase(),gf=$("#studentGroupFilter")?.value||"";const rows=db.students.filter(s=>s.status!=="archived"&&(!q||s.name.toLowerCase().includes(q))&&(!gf||s.group===gf)).sort((a,b)=>a.group.localeCompare(b.group)||a.name.localeCompare(b.name));$("#studentTable").innerHTML=`<div class="table-wrap"><table><thead><tr><th>ПІБ</th><th>Група</th><th>Курс</th><th></th></tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.group)}</td><td>${groupCourse(s.group)}</td><td class="actions"><button onclick="editStudent(${s.id})">Редагувати</button><button onclick="deleteStudent(${s.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div><div class="small" style="margin-top:10px">Показано: ${rows.length}</div>`}
function addStudent(){openModal(`<h2>Новий студент</h2><form id="f" class="form-grid"><label class="wide">ПІБ<input id="sn" required></label><label>Група<select id="sg">${groupOptions()}</select></label><div class="wide"><button class="primary">Додати</button></div></form>`);$("#f").onsubmit=e=>{e.preventDefault();db.students.push({id:uid(db.students),name:$("#sn").value.trim(),group:$("#sg").value,status:"active",note:""});closeModal();save()}}
function editStudent(id){const s=db.students.find(x=>x.id===id);openModal(`<h2>Редагувати студента</h2><form id="f" class="form-grid"><label class="wide">ПІБ<input id="sn" value="${esc(s.name)}" required></label><label>Група<select id="sg">${groupOptions(s.group)}</select></label><div class="wide"><button class="primary">Зберегти</button></div></form>`);$("#f").onsubmit=e=>{e.preventDefault();s.name=$("#sn").value.trim();s.group=$("#sg").value;closeModal();save()}}
function deleteStudent(id){const s=db.students.find(x=>x.id===id);if(confirm(`Видалити ${s.name}?`)){db.students=db.students.filter(x=>x.id!==id);save()}}

function renderRooms(){$("#page-rooms").innerHTML=`<div class="card section"><div class="section-head"><h2>Аудиторії</h2><button class="primary" onclick="addRoom()">+ Додати аудиторію</button></div><div class="table-wrap"><table><thead><tr><th>Аудиторія</th><th>Статус</th><th></th></tr></thead><tbody>${db.rooms.filter(r=>r.status!=="archived").map(r=>`<tr><td><b>${esc(r.name)}</b></td><td><span class="badge ok">АКТИВНА</span></td><td class="actions"><button onclick="editRoom(${r.id})">Редагувати</button><button onclick="deleteRoom(${r.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div></div>`}
function addRoom(){const n=prompt("Номер або назва аудиторії:");if(!n)return;if(db.rooms.some(r=>r.name.toLowerCase()===n.trim().toLowerCase()))return alert("Така аудиторія вже є.");db.rooms.push({id:uid(db.rooms),name:n.trim(),status:"active",note:""});save()}
function editRoom(id){const r=db.rooms.find(x=>x.id===id),n=prompt("Аудиторія:",r.name);if(n){r.name=n.trim();save()}}
function deleteRoom(id){const r=db.rooms.find(x=>x.id===id);if(confirm(`Видалити аудиторію ${r.name}?`)){db.rooms=db.rooms.filter(x=>x.id!==id);save()}}

function renderTeachers(){
 const rows=db.teachers.filter(t=>t.status!=="archived").sort((a,b)=>a.name.localeCompare(b.name));
 $("#page-teachers").innerHTML=`<div class="card section"><div class="section-head"><h2>Викладачі</h2><button class="primary" onclick="openTeacherModal()">+ Додати викладача</button></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>ПІБ</th><th>Посада</th><th>Звання</th><th>Ступінь</th><th>Зайнятість</th><th></th></tr></thead><tbody>${rows.map(t=>`<tr><td><b>${esc(t.name)}</b><div class="small">${esc(t.shortName||"")}</div></td><td>${esc(t.position||"—")}</td><td>${esc(t.academicTitle||"—")}</td><td>${esc(t.degree||"—")}</td><td>${esc(t.employmentType||"—")}${t.rate?` · ${esc(t.rate)}`:""}</td><td class="actions"><button onclick="openTeacherModal(${t.id})">Редагувати</button><button onclick="deleteTeacher(${t.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Викладачів ще немає.</div>`}</div>`;
}
function openTeacherModal(id=null){
 const t=id?db.teachers.find(x=>x.id===id):{name:"",shortName:"",position:"",academicTitle:"",degree:"",employmentType:"Штатний",rate:"",phone:"",email:"",unavailable:"",preferred:"",maxPerDay:"",maxConsecutive:"",note:"",photo:"",status:"active"};
 openModal(`<h2>${id?"Редагувати":"Новий"} викладач</h2><form id="tf" class="form-grid">
 <label class="wide">ПІБ<input id="tn" value="${esc(t.name)}" required></label><label>Коротке ім’я для розкладу<input id="ts" value="${esc(t.shortName)}" placeholder="Фішер В.М."></label>
 <label>Посада<input id="tp" value="${esc(t.position)}"></label><label>Вчене звання<input id="ta" value="${esc(t.academicTitle)}"></label>
 <label>Науковий ступінь<input id="td" value="${esc(t.degree)}"></label><label>Тип зайнятості<select id="te">${db.employmentTypes.map(v=>`<option ${v===t.employmentType?"selected":""}>${v}</option>`).join("")}</select></label>
 <label>Ставка / частка ставки<input id="tr" value="${esc(t.rate)}" placeholder="1.0 / 0.5 / погодинно"></label><label>Телефон<input id="tph" value="${esc(t.phone)}"></label>
 <label>E-mail<input id="tem" type="email" value="${esc(t.email)}"></label><label>Фото — посилання (необов’язково)<input id="tphoto" value="${esc(t.photo)}"></label>
 <label class="wide">Недоступні дні / години<textarea id="tu" rows="2" placeholder="Напр.: понеділок до 12:00">${esc(t.unavailable)}</textarea></label>
 <label class="wide">Бажані дні / години<textarea id="tpr" rows="2">${esc(t.preferred)}</textarea></label>
 <label>Максимум занять на день<input id="tmax" type="number" min="0" value="${esc(t.maxPerDay)}"></label><label>Максимум занять підряд<input id="tcon" type="number" min="0" value="${esc(t.maxConsecutive)}"></label>
 <label class="wide">Примітка<textarea id="tnote" rows="3">${esc(t.note)}</textarea></label><div class="wide"><button class="primary">${id?"Зберегти":"Додати"}</button></div></form>`);
 $("#tf").onsubmit=e=>{e.preventDefault();const obj={name:$("#tn").value.trim(),shortName:$("#ts").value.trim(),position:$("#tp").value.trim(),academicTitle:$("#ta").value.trim(),degree:$("#td").value.trim(),employmentType:$("#te").value,rate:$("#tr").value.trim(),phone:$("#tph").value.trim(),email:$("#tem").value.trim(),photo:$("#tphoto").value.trim(),unavailable:$("#tu").value.trim(),preferred:$("#tpr").value.trim(),maxPerDay:$("#tmax").value,maxConsecutive:$("#tcon").value,note:$("#tnote").value.trim(),status:"active"};if(id)Object.assign(t,obj);else db.teachers.push({id:uid(db.teachers),...obj});closeModal();save()}
}
function deleteTeacher(id){const t=db.teachers.find(x=>x.id===id);if(confirm(`Видалити ${t.name}?`)){db.teachers=db.teachers.filter(x=>x.id!==id);db.disciplines.forEach(d=>d.teacherIds=(d.teacherIds||[]).filter(x=>x!==id));save()}}

function renderLessonTypes(){
 $("#page-lessonTypes").innerHTML=`<div class="card section"><div class="section-head"><h2>Види занять</h2><button class="primary" onclick="openLessonTypeModal()">+ Додати вид</button></div>
 <div class="notice">Правило підрахунку можна змінити для будь-якого виду. Воно не зашите назавжди.</div>
 ${db.lessonTypes.map(x=>`<div class="mode-card"><div><b>${esc(x.name)}</b><p>${formatMode(x.countMode)}${x.defaultUnit?` · базове значення: ${esc(x.defaultUnit)}`:""}${x.description?` · ${esc(x.description)}`:""}</p></div><div class="actions"><button onclick="openLessonTypeModal(${x.id})">Редагувати</button><button onclick="deleteLessonType(${x.id})">Видалити</button></div></div>`).join("")}</div>`;
}
function openLessonTypeModal(id=null){
 const x=id?db.lessonTypes.find(v=>v.id===id):{name:"",countMode:"manual",defaultUnit:1,description:""};
 openModal(`<h2>${id?"Редагувати":"Новий"} вид заняття</h2><form id="ltf" class="form-grid">
 <label class="wide">Назва<input id="ltn" value="${esc(x.name)}" required></label>
 <label>Правило підрахунку<select id="ltm">
 <option value="academic_pair" ${x.countMode==="academic_pair"?"selected":""}>Аудиторні / парами</option>
 <option value="contingent" ${x.countMode==="contingent"?"selected":""}>За контингентом</option>
 <option value="per_student" ${x.countMode==="per_student"?"selected":""}>Індивідуально кожному студенту</option>
 <option value="fixed" ${x.countMode==="fixed"?"selected":""}>Фіксована кількість годин</option>
 <option value="manual" ${x.countMode==="manual"?"selected":""}>Ручний підрахунок</option></select></label>
 <label>Базове значення<input id="ltu" type="number" min="0" step="0.01" value="${esc(x.defaultUnit||1)}"></label>
 <label class="wide">Пояснення / примітка<textarea id="ltd" rows="3">${esc(x.description||"")}</textarea></label>
 <div class="wide"><button class="primary">Зберегти</button></div></form>`);
 $("#ltf").onsubmit=e=>{e.preventDefault();const obj={name:$("#ltn").value.trim(),countMode:$("#ltm").value,defaultUnit:+$("#ltu").value||0,description:$("#ltd").value.trim()};if(id)Object.assign(x,obj);else db.lessonTypes.push({id:uid(db.lessonTypes),...obj});closeModal();save()}
}
function deleteLessonType(id){const x=db.lessonTypes.find(v=>v.id===id);if(confirm(`Видалити вид «${x.name}»?`)){db.lessonTypes=db.lessonTypes.filter(v=>v.id!==id);save()}}

function renderDisciplines(){
 const rows=db.disciplines.filter(d=>d.status!=="archived").sort((a,b)=>(a.course||99)-(b.course||99)||a.name.localeCompare(b.name));
 $("#page-disciplines").innerHTML=`<div class="card section"><div class="section-head"><h2>Дисципліни</h2><button class="primary" onclick="openDisciplineModal()">+ Додати дисципліну</button></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>Дисципліна</th><th>Група</th><th>Семестр</th><th>Викладачі</th><th>Контроль</th><th>Години</th><th></th></tr></thead><tbody>${rows.map(d=>`<tr><td><span class="color-dot" style="background:${esc(d.color||"#8b5cf6")}"></span><b>${esc(d.name)}</b><div class="small">${esc(d.academicYear||"")}</div></td><td>${esc(d.group||"—")}</td><td>${d.semester||"—"}</td><td>${esc(teacherNames(d.teacherIds)||"—")}</td><td>${esc(d.controlForm||"—")}</td><td><b>${totalDisciplineHours(d)}</b></td><td class="actions"><button onclick="openDisciplineModal(${d.id})">Редагувати</button><button onclick="deleteDiscipline(${d.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Дисциплін ще немає.</div>`}</div>`;
}
function openDisciplineModal(id=null){
 const d=id?db.disciplines.find(x=>x.id===id):{name:"",course:"",group:"",semester:db.semester,academicYear:db.academicYear,teacherIds:[],controlForm:"Немає",color:"#8b5cf6",hours:{},note:"",status:"active"};
 const hours=db.lessonTypes.map(t=>`<label>${esc(t.name)}<input class="dh" data-type="${t.id}" type="number" min="0" step="0.01" value="${esc(d.hours?.[t.id]||0)}"></label>`).join("");
 openModal(`<h2>${id?"Редагувати":"Нова"} дисципліна</h2><form id="df" class="form-grid">
 <label class="wide">Назва дисципліни<input id="dn" value="${esc(d.name)}" required></label>
 <label>Група<select id="dg"><option value="">—</option>${groupOptions(d.group)}</select></label>
 <label>Курс<select id="dc"><option value="">—</option>${[1,2,3,4,5,6].map(x=>`<option ${Number(d.course)===x?"selected":""}>${x}</option>`).join("")}</select></label>
 <label>Навчальний рік<input id="dy" value="${esc(d.academicYear||db.academicYear)}"></label><label>Семестр<select id="ds"><option ${Number(d.semester)===1?"selected":""}>1</option><option ${Number(d.semester)===2?"selected":""}>2</option></select></label>
 <label>Форма контролю<select id="dctrl">${db.controlForms.map(v=>`<option ${v===d.controlForm?"selected":""}>${v}</option>`).join("")}</select></label>
 <label>Колір<input id="dcolor" type="color" value="${esc(d.color||"#8b5cf6")}"></label>
 <label class="wide">Викладачі<select id="dteachers" multiple size="${Math.min(6,Math.max(3,db.teachers.length))}">${teacherOptions(d.teacherIds||[])}</select><span class="small">Можна вибрати кількох: Ctrl/⌘ + клік.</span></label>
 <div class="wide"><b>Години за видами занять</b><div class="hours-grid" style="margin-top:8px">${hours}</div></div>
 <label class="wide">Примітка<textarea id="dnote" rows="3">${esc(d.note||"")}</textarea></label>
 <div class="wide"><button class="primary">Зберегти</button></div></form>`);
 $("#dg").onchange=()=>{const g=db.groups.find(x=>x.code===$("#dg").value);if(g)$("#dc").value=g.course};
 $("#df").onsubmit=e=>{e.preventDefault();const hs={};$$(".dh").forEach(i=>{hs[i.dataset.type]=+i.value||0});const ids=[...$("#dteachers").selectedOptions].map(o=>+o.value);const obj={name:$("#dn").value.trim(),group:$("#dg").value,course:+$("#dc").value||"",academicYear:$("#dy").value.trim(),semester:+$("#ds").value,teacherIds:ids,controlForm:$("#dctrl").value,color:$("#dcolor").value,hours:hs,note:$("#dnote").value.trim(),status:"active"};if(id)Object.assign(d,obj);else db.disciplines.push({id:uid(db.disciplines),...obj});closeModal();save()}
}
function deleteDiscipline(id){const d=db.disciplines.find(x=>x.id===id);if(confirm(`Видалити «${d.name}»?`)){db.disciplines=db.disciplines.filter(x=>x.id!==id);save()}}

function renderSchedule(){
 $("#page-schedule").innerHTML=`<div class="card section"><div class="section-head"><h2>Усі заняття</h2><button class="primary" onclick="openLessonModal()">+ Додати заняття</button></div><div class="toolbar"><input id="scheduleSearch" placeholder="Група, дисципліна, аудиторія…"><select id="scheduleGroup"><option value="">Усі групи</option>${groupOptions()}</select></div><div id="scheduleTable"></div></div>`;$("#scheduleSearch").oninput=renderScheduleTable;$("#scheduleGroup").onchange=renderScheduleTable;renderScheduleTable()
}
function renderScheduleTable(){if(!$("#scheduleTable"))return;const q=($("#scheduleSearch")?.value||"").toLowerCase(),gf=$("#scheduleGroup")?.value||"";const rows=[...db.schedule].filter(x=>(!gf||x.group===gf)&&(!q||JSON.stringify(x).toLowerCase().includes(q))).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));$("#scheduleTable").innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Дата</th><th>Час</th><th>Група</th><th>Дисципліна</th><th>Вид</th><th>Аудиторія</th><th>Викладач</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${formatDate(x.date)}</td><td><b>${esc(x.start)}–${esc(x.end)}</b></td><td>${esc(x.group)}</td><td>${esc(x.discipline||"—")}</td><td>${esc(x.type||"—")}</td><td><b>${esc(x.room||"—")}</b></td><td>${esc(x.teacher||"—")}</td><td class="actions"><button onclick="openLessonModal(${x.id})">Редагувати</button><button onclick="deleteLesson(${x.id})">Видалити</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Розклад поки порожній.</div>`}
function formatDate(s){if(!s)return"";const[y,m,d]=s.split("-");return`${d}.${m}.${y}`} function timeOverlap(a,b,c,d){return a<d&&b>c}
function conflictsFor(item,ignore=null){return db.schedule.filter(x=>x.id!==ignore&&x.date===item.date&&timeOverlap(item.start,item.end,x.start,x.end)).filter(x=>(item.room&&x.room===item.room)||(item.group&&x.group===item.group)||(item.teacher&&x.teacher&&x.teacher===item.teacher))}
function openLessonModal(id=null){
 const x=id?db.schedule.find(s=>s.id===id):{date:"",start:"09:00",end:"10:20",group:db.groups[0]?.code||"",discipline:"",type:db.lessonTypes[0]?.name||"",coverage:"Вся група",students:"",teacher:"",room:"",note:""};
 const disc=db.disciplines.filter(d=>!d.group||d.group===x.group),teacherOpts=`<option value="">—</option>`+db.teachers.map(t=>`<option ${(t.shortName||t.name)===x.teacher?"selected":""}>${esc(t.shortName||t.name)}</option>`).join("");
 openModal(`<h2>${id?"Редагувати":"Нове"} заняття</h2><form id="lf" class="form-grid"><label>Дата<input id="ld" type="date" value="${esc(x.date)}" required></label><label>Група<select id="lg">${groupOptions(x.group)}</select></label><label>Початок<input id="ls" type="time" value="${esc(x.start)}" required></label><label>Кінець<input id="le" type="time" value="${esc(x.end)}" required></label><label>Дисципліна<select id="ldi"><option value="">—</option>${disc.map(d=>`<option ${d.name===x.discipline?"selected":""}>${esc(d.name)}</option>`).join("")}</select></label><label>Вид заняття<select id="lt">${db.lessonTypes.map(v=>`<option ${v.name===x.type?"selected":""}>${esc(v.name)}</option>`).join("")}</select></label><label>Охоплення<select id="lc">${db.coverageTypes.map(v=>`<option ${v===x.coverage?"selected":""}>${v}</option>`).join("")}</select></label><label>Аудиторія<select id="lr"><option value="">—</option>${db.rooms.map(r=>`<option ${r.name===x.room?"selected":""}>${esc(r.name)}</option>`).join("")}</select></label><label class="wide">Студент(и) / підгрупа<input id="lst" value="${esc(x.students||"")}"></label><label>Викладач<select id="ltea">${teacherOpts}</select></label><label>Примітка<input id="ln" value="${esc(x.note||"")}"></label><div id="conflictBox" class="wide"></div><div class="wide"><button class="primary">${id?"Зберегти":"Додати"}</button></div></form>`);
 const check=()=>{const item=readLesson(),cs=item.date&&item.start&&item.end?conflictsFor(item,id):[];$("#conflictBox").innerHTML=cs.length?`<div class="conflicts"><b>Є конфлікт:</b>${cs.map(c=>`<div class="conflict">${esc(c.group)} · ${esc(c.start)}–${esc(c.end)} · ауд. ${esc(c.room||"—")}${c.teacher?` · ${esc(c.teacher)}`:""}</div>`).join("")}</div>`:`<div class="notice">Перевіряємо групу, аудиторію і викладача на перетини.</div>`};
 ["ld","ls","le","lg","lr","ltea"].forEach(k=>$("#"+k).onchange=check);check();
 $("#lf").onsubmit=e=>{e.preventDefault();const item=readLesson();if(item.end<=item.start)return alert("Час завершення має бути пізніше.");const cs=conflictsFor(item,id);if(cs.length&&!confirm("Є конфлікт. Все одно зберегти?"))return;if(id)Object.assign(db.schedule.find(s=>s.id===id),item);else db.schedule.push({id:uid(db.schedule),...item});closeModal();save();go("schedule")}
}
function readLesson(){return{date:$("#ld").value,start:$("#ls").value,end:$("#le").value,group:$("#lg").value,discipline:$("#ldi").value,type:$("#lt").value,coverage:$("#lc").value,students:$("#lst").value.trim(),teacher:$("#ltea").value,room:$("#lr").value,note:$("#ln").value.trim()}}
function deleteLesson(id){if(confirm("Видалити заняття?")){db.schedule=db.schedule.filter(x=>x.id!==id);save()}}

function renderSettings(){
 $("#page-settings").innerHTML=`<div class="settings-grid">
 <div class="card settings-card"><h3>Навчальний період</h3><label>Навчальний рік<input id="setYear" value="${esc(db.academicYear)}"></label><label style="margin-top:10px">Семестр<select id="setSem"><option ${db.semester===1?"selected":""}>1</option><option ${db.semester===2?"selected":""}>2</option></select></label><button class="primary" style="margin-top:12px" onclick="savePeriod()">Зберегти</button></div>
 <div class="card settings-card"><h3>Резервна копія</h3><p class="small">Експорт усієї бази одним JSON-файлом.</p><button class="primary" onclick="exportData()">Експорт даних</button></div>
 <div class="card settings-card"><h3>Імпорт</h3><p class="small">Відновити дані з резервної копії.</p><button class="secondary" onclick="document.querySelector('#importFile').click()">Імпортувати</button></div>
 <div class="card settings-card"><h3>Скидання</h3><p class="small">Повернути початкові дані версії 0.2.</p><button class="danger" onclick="resetData()">Скинути дані</button></div>
 </div>`;
}
function savePeriod(){db.academicYear=$("#setYear").value.trim();db.semester=+$("#setSem").value;save();alert("Збережено.")}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`REMS-ROZKLAD-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}
$("#importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=migrate(JSON.parse(r.result));save();alert("Дані імпортовано.")}catch(err){alert("Не вдалося прочитати файл.")}};r.readAsText(f);e.target.value=""}
function resetData(){if(confirm("Повернути початкові дані?")){db=clone(window.REMS_INITIAL_DATA);save();go("home")}}

go("home");
