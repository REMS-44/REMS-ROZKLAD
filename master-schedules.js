// Approved online timetable for MSM-26, semester 1, 2026/2027.
// Source: "МСМ-26 розклад I семестр 2026-2027 н.р.docx".
(()=>{
  const state=window.REMS_INITIAL_DATA;
  if(!state)return;
  state.schemaVersion=Math.max(Number(state.schemaVersion)||0,38);

  const norm=value=>String(value||"").trim().toLocaleLowerCase("uk-UA").replace(/\s+/g," ");
  const ensureTeacher=teacher=>{
    const current=(state.teachers||[]).find(t=>
      [t.name,t.shortName].some(value=>norm(value)===norm(teacher.name)||norm(value)===norm(teacher.shortName))
    );
    if(current){
      current.programIds=[...new Set([...(current.programIds||[]),"master"])];
      if(!current.shortName)current.shortName=teacher.shortName;
      return current.id;
    }
    state.teachers=state.teachers||[];
    state.teachers.push({...teacher,scope:"external",homeDepartmentId:"",programIds:["master"],position:teacher.position||"",academicTitle:"",degree:"",honoraryTitle:"",employmentType:"",rate:"",teachingNormPerRate:"",employmentStart:"",employmentEnd:"",phone:"",email:"",unavailableRules:[],preferredRules:[],maxPerDay:"",maxConsecutive:"",note:"Додано із затвердженого розкладу МСМ-26 на I семестр 2026/2027.",photo:"",status:"active",sourceScheduleImport:true});
    return teacher.id;
  };

  const teacherIds={
    melnyk:ensureTeacher({id:1066,name:"Мельник Мирослава Миколаївна",shortName:"Мельник М.М."}),
    bezukh:ensureTeacher({id:1088,name:"Безух Ю.С.",shortName:"Безух Ю.С.",position:"Старший викладач"}),
    kunderevych:ensureTeacher({id:1089,name:"Кундеревич О.В.",shortName:"Кундеревич О.В.",position:"Професор"}),
    pecheranskyi:ensureTeacher({id:1090,name:"Печеранський І.П.",shortName:"Печеранський І.П.",position:"Професор"}),
    yudova:ensureTeacher({id:1018,name:"Юдова-Романова Катерина Володимирівна",shortName:"Юдова-Романова К.В."}),
    panasiuk:ensureTeacher({id:1012,name:"Панасюк Валерій Юрійович",shortName:"Панасюк В.Ю."}),
    kucher:ensureTeacher({id:1058,name:"Кучер Ростислав Станіславович",shortName:"Кучер Р.С."}),
    kuznetsova:ensureTeacher({id:1091,name:"Кузнецова Л.В.",shortName:"Кузнецова Л.В.",position:"Доцент"})
  };

  const disciplines=[
    {id:3001,name:"Магістерський професійний практикум",componentId:6,controlForm:"Іспит + Контрольна робота",hours:{1:18,3:30},teacherIds:[],teacherLoads:{}},
    {id:3002,name:"Менеджмент сценічних проєктів",componentId:7,controlForm:"Іспит + Контрольна робота",hours:{1:14,3:22},teacherIds:[teacherIds.yudova],teacherLoads:{[teacherIds.yudova]:{1:14,3:22}}},
    {id:3003,name:"Театральні системи та творчі методи режисури та акторського мистецтва ХХ-ХХІ ст.",componentId:8,controlForm:"Залік + Контрольна робота",hours:{1:16,3:8},teacherIds:[teacherIds.panasiuk],teacherLoads:{[teacherIds.panasiuk]:{1:16,3:8}}},
    {id:3004,name:"Режисура та акторська майстерність",componentId:9,controlForm:"Іспит + Контрольна робота",hours:{1:14,3:34},teacherIds:[teacherIds.melnyk,teacherIds.kucher],teacherLoads:{[teacherIds.melnyk]:{1:14,3:14},[teacherIds.kucher]:{3:20}}}
  ];
  state.disciplines=state.disciplines||[];
  disciplines.forEach(seed=>{
    if(state.disciplines.some(d=>norm(d.group)===norm("МСМ-26")&&norm(d.name)===norm(seed.name)))return;
    state.disciplines.push({...seed,course:5,group:"МСМ-26",programId:"master",semester:1,academicYear:"2026/2027",teacherStudentLoads:{},teacherStudentHours:{},teacherStreams:{},audienceMode:"group",selectedStudentIds:[],extraHours:{},color:"#8b5cf6",note:"",status:"active",sourceCurriculumId:11,sourceComponentId:seed.componentId,sourceRowId:1,planMeta:{}});
  });

  const disciplineId=name=>state.disciplines.find(d=>norm(d.group)===norm("МСМ-26")&&norm(d.name)===norm(name))?.id||null;
  const rows=[
    {name:"Режисура та акторська майстерність",componentId:9,pair:3,type:"Практичне",dates:["2026-10-06","2026-10-13"],teacher:"Мельник М.М.",teacherId:teacherIds.melnyk},
    {name:"Режисура та акторська майстерність",componentId:9,pair:4,type:"Лекція",dates:["2026-09-08","2026-09-15","2026-09-22","2026-09-29","2026-10-06","2026-10-13","2026-10-20"],teacher:"Мельник М.М.",teacherId:teacherIds.melnyk},
    {name:"Режисура та акторська майстерність",componentId:9,pair:4,type:"Практичне",dates:["2026-10-27","2026-11-03","2026-11-10","2026-11-17","2026-11-24"],teacher:"Мельник М.М.",teacherId:teacherIds.melnyk},
    {name:"Магістерський професійний практикум",componentId:6,pair:5,type:"Лекція",dates:["2026-09-29","2026-10-06","2026-10-13","2026-10-20","2026-10-27","2026-11-03","2026-11-10","2026-11-17","2026-11-24"]},
    {name:"Магістерський професійний практикум",componentId:6,pair:6,type:"Практичне",dates:["2026-09-15","2026-09-22","2026-09-29","2026-10-06","2026-10-13","2026-10-20","2026-10-27","2026-11-03","2026-11-10","2026-11-17","2026-11-24"]},
    {name:"Магістерський професійний практикум",componentId:6,pair:7,type:"Практичне",dates:["2026-10-20","2026-10-27","2026-11-03","2026-11-10"]},
    {name:"Ділова іноземна мова",componentId:2,pair:3,type:"Практичне",dates:["2026-09-09","2026-09-16","2026-09-23","2026-09-30","2026-10-07","2026-10-14","2026-10-21","2026-10-28","2026-11-04","2026-11-11","2026-11-18","2026-11-25"],teacher:"Безух Ю.С.",teacherId:teacherIds.bezukh,external:true},
    {name:"Методологія і організація наукових досліджень",componentId:1,pair:4,type:"Лекція",dates:["2026-09-09","2026-09-16","2026-09-23","2026-09-30","2026-10-07","2026-10-14","2026-10-21","2026-10-28","2026-11-04","2026-11-11","2026-11-18"],teacher:"Кундеревич О.В.",teacherId:teacherIds.kunderevych,external:true},
    {name:"Філософія мистецтв",componentId:3,pair:5,type:"Лекція",dates:["2026-09-09","2026-09-16","2026-09-23","2026-09-30","2026-10-21","2026-10-28","2026-11-04","2026-11-11","2026-11-18"],teacher:"Печеранський І.П.",teacherId:teacherIds.pecheranskyi,external:true},
    {name:"Методологія і організація наукових досліджень",componentId:1,pair:5,type:"Лекція",dates:["2026-10-07","2026-10-14"],teacher:"Кундеревич О.В.",teacherId:teacherIds.kunderevych,external:true},
    {name:"Філософія мистецтв",componentId:3,pair:3,type:"Лекція",dates:["2026-09-10","2026-09-17","2026-09-24","2026-10-01"],teacher:"Печеранський І.П.",teacherId:teacherIds.pecheranskyi,external:true},
    {name:"Менеджмент сценічних проєктів",componentId:7,pair:3,type:"Практичне",dates:["2026-10-08","2026-10-15","2026-10-22","2026-10-29","2026-11-05","2026-11-12","2026-11-19","2026-11-26"],teacher:"Юдова-Романова К.В.",teacherId:teacherIds.yudova},
    {name:"Театральні системи та творчі методи режисури та акторського мистецтва ХХ-ХХІ ст.",componentId:8,pair:4,type:"Лекція",dates:["2026-09-10","2026-09-17","2026-09-24"],teacher:"Панасюк В.Ю.",teacherId:teacherIds.panasiuk},
    {name:"Режисура та акторська майстерність",componentId:9,pair:4,type:"Практичне",dates:["2026-10-01","2026-10-08","2026-10-15","2026-10-22","2026-10-29","2026-11-05","2026-11-12","2026-11-19","2026-11-26"],teacher:"Кучер Р.С.",teacherId:teacherIds.kucher},
    {name:"Менеджмент сценічних проєктів",componentId:7,pair:5,type:"Лекція",dates:["2026-09-10","2026-09-17","2026-09-24","2026-10-01","2026-10-08","2026-10-15","2026-10-22"],teacher:"Юдова-Романова К.В.",teacherId:teacherIds.yudova},
    {name:"Менеджмент сценічних проєктів",componentId:7,pair:5,type:"Практичне",dates:["2026-11-19","2026-11-26"],teacher:"Юдова-Романова К.В.",teacherId:teacherIds.yudova},
    {name:"Режисура та акторська майстерність",componentId:9,pair:5,type:"Практичне",dates:["2026-11-05"],teacher:"Кучер Р.С.",teacherId:teacherIds.kucher},
    {name:"Менеджмент сценічних проєктів",componentId:7,pair:6,type:"Практичне",dates:["2026-11-26"],teacher:"Юдова-Романова К.В.",teacherId:teacherIds.yudova},
    {name:"Філософія мистецтв",componentId:3,pair:3,type:"Семінар",dates:["2026-09-18","2026-10-02","2026-10-09","2026-10-30","2026-11-27"],teacher:"Печеранський І.П.",teacherId:teacherIds.pecheranskyi,external:true,notes:{"2026-10-30":"ПК"}},
    {name:"Методологія і організація наукових досліджень",componentId:1,pair:3,type:"Практичне",dates:["2026-09-25","2026-10-16","2026-11-06","2026-11-13","2026-11-20"],teacher:"Кузнецова Л.В.",teacherId:teacherIds.kuznetsova,external:true,notes:{"2026-11-06":"ПК"}},
    {name:"Театральні системи та творчі методи режисури та акторського мистецтва ХХ-ХХІ ст.",componentId:8,pair:4,type:"Лекція",dates:["2026-09-11","2026-09-18","2026-09-25","2026-10-02","2026-10-30"],teacher:"Панасюк В.Ю.",teacherId:teacherIds.panasiuk},
    {name:"Театральні системи та творчі методи режисури та акторського мистецтва ХХ-ХХІ ст.",componentId:8,pair:4,type:"Практичне",dates:["2026-10-16","2026-10-23","2026-11-06","2026-11-13"],teacher:"Панасюк В.Ю.",teacherId:teacherIds.panasiuk}
  ];

  const pairTimes={3:["12:30","13:50"],4:["14:10","15:30"],5:["15:40","17:00"],6:["17:10","18:30"],7:["18:40","20:00"]};
  const seed=[];
  let nextId=920001;
  rows.forEach(row=>row.dates.forEach(date=>{
    const id=row.external?null:disciplineId(row.name);
    const [start,end]=pairTimes[row.pair];
    const extra=row.notes?.[date];
    seed.push({id:nextId++,date,start,end,pairId:row.pair,group:"МСМ-26",audienceGroups:["МСМ-26"],disciplineId:id,disciplineIds:id?[id]:[],discipline:row.name,type:row.type,coverage:"Вся група",students:"",studentId:null,teacherId:row.teacherId||null,teacher:row.teacher||"",room:"",workloadHours:row.external?0:2,note:[extra,"Zoom"].filter(Boolean).join(" · "),repeatBatchId:null,specialSchedule:false,specialKind:"",specialHalf:null,scheduleSource:row.external?"ready_external":"approved_2026_2027",sourceSemester:1,sourceSemesters:[1],sourceCourse:5,sourceCourses:[5],sourceFile:"МСМ-26 розклад I семестр 2026-2027 н.р.docx",sourceCurriculumId:11,sourceComponentId:row.componentId,sourceRowId:1,deliveryMode:"online",platform:"Zoom"});
  }));
  state.schedule=state.schedule||[];
  const key=x=>[x.date,x.pairId,norm(x.group),norm(x.discipline),norm(x.type)].join("|");
  const existing=new Set(state.schedule.map(key));
  seed.forEach(item=>{if(!existing.has(key(item))){state.schedule.push(item);existing.add(key(item));}});
  state.msm26ScheduleVersion="2026-09-17-v1";
})();

// Approved online timetable for MSM-25, semester 3, 2026/2027.
// Source: "МСМ_25_розклад_III_семестр_2026_2027_н_р_ (1).docx".
(()=>{
  const state=window.REMS_INITIAL_DATA;
  if(!state)return;
  state.schemaVersion=Math.max(Number(state.schemaVersion)||0,39);

  const norm=value=>String(value||"").trim().toLocaleLowerCase("uk-UA").replace(/\s+/g," ");
  const ensureTeacher=teacher=>{
    const current=(state.teachers||[]).find(t=>
      [t.name,t.shortName].some(value=>norm(value)===norm(teacher.name)||norm(value)===norm(teacher.shortName))
    );
    if(current){
      current.programIds=[...new Set([...(current.programIds||[]),"master"])];
      if(!current.shortName)current.shortName=teacher.shortName;
      return current.id;
    }
    state.teachers=state.teachers||[];
    state.teachers.push({...teacher,scope:"external",homeDepartmentId:"",programIds:["master"],position:teacher.position||"",academicTitle:"",degree:"",honoraryTitle:"",employmentType:"",rate:"",teachingNormPerRate:"",employmentStart:"",employmentEnd:"",phone:"",email:"",unavailableRules:[],preferredRules:[],maxPerDay:"",maxConsecutive:"",note:"Додано із затвердженого розкладу МСМ-25 на III семестр 2026/2027.",photo:"",status:"active",sourceScheduleImport:true});
    return teacher.id;
  };

  const teacherIds={
    cheremnykh:ensureTeacher({id:1092,name:"Черемних І.В.",shortName:"Черемних І.В.",position:"Професор"}),
    chaikovska:ensureTeacher({id:1086,name:"Чайковська О.А.",shortName:"Чайковська О.А."}),
    tolmach:ensureTeacher({id:1081,name:"Толмач М.С.",shortName:"Толмач М.С."}),
    boiko:ensureTeacher({id:1001,name:"Бойко Тетяна Антонівна",shortName:"Бойко Т.А."}),
    yudova:ensureTeacher({id:1018,name:"Юдова-Романова Катерина Володимирівна",shortName:"Юдова-Романова К.В."}),
    mykhalov:ensureTeacher({id:1067,name:"Михальов В.Я.",shortName:"Михальов В.Я."}),
    verezomska:ensureTeacher({id:1093,name:"Верезомська І.Г.",shortName:"Верезомська І.Г."}),
    pyroghova:ensureTeacher({id:1094,name:"Пирогова Т.І.",shortName:"Пирогова Т.І."}),
    kuznetsova:ensureTeacher({id:1091,name:"Кузнецова Л.В.",shortName:"Кузнецова Л.В.",position:"Доцент"}),
    kunderevych:ensureTeacher({id:1089,name:"Кундеревич О.В.",shortName:"Кундеревич О.В.",position:"Професор"}),
    kuzmenko:ensureTeacher({id:1095,name:"Кузьменко Т.Г.",shortName:"Кузьменко Т.Г."})
  };

  const rows=[
    {name:"Стартапи в галузі культури і мистецтв",componentId:5,pair:2,type:"Лекція",dates:["2026-09-07","2026-09-14","2026-09-21","2026-09-28","2026-10-19","2026-10-26","2026-11-02","2026-11-09"],teacher:"Черемних І.В.",teacherId:teacherIds.cheremnykh},
    {name:"Візуальний сторітелінг в дизайні",componentId:9,pair:3,type:"Лекція",dates:["2026-09-07","2026-09-14","2026-09-21","2026-09-28","2026-10-19"],teacher:"Чайковська О.А.",teacherId:teacherIds.chaikovska},
    {name:"Візуальний сторітелінг в дизайні",componentId:9,pair:3,type:"Практичне",dates:["2026-10-26","2026-11-02","2026-11-09"],teacher:"Толмач М.С.",teacherId:teacherIds.tolmach,notes:{"2026-10-26":"ПК"}},
    {name:"Візуальний сторітелінг в дизайні",componentId:9,pair:4,type:"Практичне",dates:["2026-09-07","2026-09-14","2026-09-21"],teacher:"Толмач М.С.",teacherId:teacherIds.tolmach},
    {name:"Театральна критика",componentId:3,pair:4,type:"Лекція",dates:["2026-09-28","2026-10-19","2026-10-26","2026-11-02","2026-11-09"],teacher:"Бойко Т.А.",teacherId:teacherIds.boiko},
    {name:"Менеджмент сценічних проєктів",componentId:4,pair:5,type:"Лекція",dates:["2026-09-07","2026-09-14","2026-09-21","2026-09-28","2026-10-19"],teacher:"Юдова-Романова К.В.",teacherId:teacherIds.yudova},
    {name:"Театральна критика",componentId:3,pair:5,type:"Лекція",dates:["2026-11-02"],teacher:"Бойко Т.А.",teacherId:teacherIds.boiko},
    {name:"Театральна критика",componentId:3,pair:5,type:"Практичне",dates:["2026-10-26","2026-11-09"],teacher:"Бойко Т.А.",teacherId:teacherIds.boiko,notes:{"2026-10-26":"ПК"}},
    {name:"Візуальний сторітелінг в дизайні",componentId:9,pair:6,type:"Практичне",dates:["2026-09-28","2026-10-19","2026-10-26","2026-11-02"],teacher:"Толмач М.С.",teacherId:teacherIds.tolmach},

    {name:"Стартапи в галузі культури і мистецтв",componentId:5,pair:2,type:"Лекція",dates:["2026-10-27","2026-11-03"],teacher:"Черемних І.В.",teacherId:teacherIds.cheremnykh},
    {name:"Менеджмент сценічних проєктів",componentId:4,pair:3,type:"Лекція",dates:["2026-09-01"],teacher:"Юдова-Романова К.В.",teacherId:teacherIds.yudova},
    {name:"Медійна та інформаційна грамотність",componentId:6,pair:3,type:"Лекція",dates:["2026-09-08","2026-09-15","2026-09-22","2026-09-29","2026-10-20","2026-10-27","2026-11-03"],teacher:"Михальов В.Я.",teacherId:teacherIds.mykhalov,notes:{"2026-10-20":"ПК"}},
    {name:"Театральна критика",componentId:3,pair:3,type:"Лекція",dates:["2026-11-10"],teacher:"Бойко Т.А.",teacherId:teacherIds.boiko},
    {name:"Управління start-up-проєктами",componentId:7,pair:4,type:"Лекція",dates:["2026-09-01","2026-09-08","2026-09-15","2026-09-22","2026-09-29"],teacher:"Верезомська І.Г.",teacherId:teacherIds.verezomska},
    {name:"Театральна критика",componentId:3,pair:4,type:"Лекція",dates:["2026-10-20","2026-10-27","2026-11-03","2026-11-10"],teacher:"Бойко Т.А.",teacherId:teacherIds.boiko},
    {name:"Управління start-up-проєктами",componentId:7,pair:5,type:"Лекція",dates:["2026-10-20","2026-10-27","2026-11-03"],teacher:"Верезомська І.Г.",teacherId:teacherIds.verezomska},
    {name:"Управління start-up-проєктами",componentId:7,pair:5,type:"Практичне",dates:["2026-09-01","2026-09-08","2026-09-15","2026-09-22","2026-09-29"],teacher:"Верезомська І.Г.",teacherId:teacherIds.verezomska,notes:{"2026-09-22":"ПК"}},
    {name:"Сценічно-виконавська майстерність",componentId:10,pair:5,type:"Практичне",dates:["2026-09-01","2026-09-08","2026-09-15","2026-09-22","2026-09-29","2026-10-20","2026-10-27","2026-11-03","2026-11-10"],teacher:"Пирогова Т.І.",teacherId:teacherIds.pyroghova,notes:{"2026-10-20":"ПК"}},
    {name:"Методика викладання у вищій школі",componentId:1,pair:6,type:"Практичне",dates:["2026-09-15","2026-09-22","2026-09-29","2026-10-20"],teacher:"Кузнецова Л.В.",teacherId:teacherIds.kuznetsova,notes:{"2026-10-20":"ПК"}},
    {name:"Театральна критика",componentId:3,pair:6,type:"Практичне",dates:["2026-10-27","2026-11-03","2026-11-10"],teacher:"Бойко Т.А.",teacherId:teacherIds.boiko},

    {name:"Медійна та інформаційна грамотність",componentId:6,pair:4,type:"Лекція",dates:["2026-09-09","2026-09-16","2026-09-23","2026-09-30","2026-10-21","2026-10-28","2026-11-04"],teacher:"Михальов В.Я.",teacherId:teacherIds.mykhalov},
    {name:"Медійна та інформаційна грамотність",componentId:6,pair:5,type:"Лекція",dates:["2026-09-02"],teacher:"Михальов В.Я.",teacherId:teacherIds.mykhalov},
    {name:"Методика викладання у вищій школі",componentId:1,pair:5,type:"Лекція",dates:["2026-09-09","2026-09-16","2026-09-23","2026-09-30","2026-10-21","2026-10-28","2026-11-04"],teacher:"Кундеревич О.В.",teacherId:teacherIds.kunderevych},
    {name:"Театральна критика",componentId:3,pair:5,type:"Лекція",dates:["2026-11-11"],teacher:"Бойко Т.А.",teacherId:teacherIds.boiko},
    {name:"Менеджмент сценічних проєктів",componentId:4,pair:6,type:"Лекція",dates:["2026-09-02"],teacher:"Юдова-Романова К.В.",teacherId:teacherIds.yudova},
    {name:"Методика викладання у вищій школі",componentId:1,pair:6,type:"Лекція",dates:["2026-09-09","2026-09-23","2026-10-21"],teacher:"Кундеревич О.В.",teacherId:teacherIds.kunderevych},
    {name:"Медійна та інформаційна грамотність",componentId:6,pair:6,type:"Практичне",dates:["2026-09-30","2026-10-28","2026-11-04"],teacher:"Михальов В.Я.",teacherId:teacherIds.mykhalov,notes:{"2026-10-28":"ПК"}},
    {name:"Театральна критика",componentId:3,pair:6,type:"Практичне",dates:["2026-11-11"],teacher:"Бойко Т.А.",teacherId:teacherIds.boiko},
    {name:"Мистецькі студії",componentId:8,pair:7,type:"Лекція",dates:["2026-09-02","2026-09-09","2026-09-16","2026-09-23","2026-09-30","2026-10-21","2026-10-28","2026-11-04","2026-11-11"],teacher:"Кузьменко Т.Г.",teacherId:teacherIds.kuzmenko},

    {name:"Стартапи в галузі культури і мистецтв",componentId:5,pair:4,type:"Практичне",dates:["2026-09-10","2026-09-17","2026-09-24","2026-10-01","2026-10-22","2026-10-29","2026-11-05","2026-11-12"],teacher:"Юдова-Романова К.В.",teacherId:teacherIds.yudova,notes:{"2026-10-01":"ПК"}},
    {name:"Управління start-up-проєктами",componentId:7,pair:5,type:"Лекція",dates:["2026-09-03","2026-09-10"],teacher:"Верезомська І.Г.",teacherId:teacherIds.verezomska},
    {name:"Управління start-up-проєктами",componentId:7,pair:5,type:"Практичне",dates:["2026-09-17"],teacher:"Верезомська І.Г.",teacherId:teacherIds.verezomska},
    {name:"Сценічно-виконавська майстерність",componentId:10,pair:5,type:"Практичне",dates:["2026-09-03","2026-09-10","2026-09-17","2026-09-24","2026-10-01","2026-10-22"],teacher:"Пирогова Т.І.",teacherId:teacherIds.pyroghova},
    {name:"Менеджмент сценічних проєктів",componentId:4,pair:5,type:"Лекція",dates:["2026-10-29","2026-11-05","2026-11-12"],teacher:"Юдова-Романова К.В.",teacherId:teacherIds.yudova},
    {name:"Менеджмент сценічних проєктів",componentId:4,pair:6,type:"Лекція",dates:["2026-09-03","2026-09-10"],teacher:"Юдова-Романова К.В.",teacherId:teacherIds.yudova},
    {name:"Менеджмент сценічних проєктів",componentId:4,pair:6,type:"Практичне",dates:["2026-09-24","2026-10-01","2026-10-22","2026-10-29","2026-11-05","2026-11-12"],teacher:"Юдова-Романова К.В.",teacherId:teacherIds.yudova,notes:{"2026-10-22":"ПК"}},
    {name:"Мистецькі студії",componentId:8,pair:7,type:"Лекція",dates:["2026-09-03"],teacher:"Кузьменко Т.Г.",teacherId:teacherIds.kuzmenko},
    {name:"Мистецькі студії",componentId:8,pair:7,type:"Практичне",dates:["2026-09-10","2026-09-17","2026-09-24","2026-10-01","2026-10-22","2026-10-29","2026-11-05","2026-11-12"],teacher:"Кузьменко Т.Г.",teacherId:teacherIds.kuzmenko,notes:{"2026-10-22":"ПК"}},
    {name:"Управління start-up-проєктами",componentId:7,pair:7,type:"Практичне",dates:["2026-10-29","2026-11-05"],teacher:"Верезомська І.Г.",teacherId:teacherIds.verezomska}
  ];

  const pairTimes={2:["10:40","12:00"],3:["12:30","13:50"],4:["14:10","15:30"],5:["15:40","17:00"],6:["17:10","18:30"],7:["18:40","20:00"]};
  const seed=[];
  let nextId=930001;
  rows.forEach(row=>row.dates.forEach(date=>{
    const [start,end]=pairTimes[row.pair];
    const extra=row.notes?.[date];
    seed.push({id:nextId++,date,start,end,pairId:row.pair,group:"МСМ-25",audienceGroups:["МСМ-25"],disciplineId:null,disciplineIds:[],discipline:row.name,type:row.type,coverage:"Вся група",students:"",studentId:null,teacherId:row.teacherId||null,teacher:row.teacher||"",room:"",workloadHours:0,note:[extra,"Zoom"].filter(Boolean).join(" · "),repeatBatchId:null,specialSchedule:false,specialKind:"",specialHalf:null,scheduleSource:"ready_external",sourceSemester:3,sourceSemesters:[3],sourceCourse:6,sourceCourses:[6],sourceFile:"МСМ_25_розклад_III_семестр_2026_2027_н_р_ (1).docx",sourceCurriculumId:12,sourceComponentId:row.componentId,sourceRowId:1,deliveryMode:"online",platform:"Zoom"});
  }));
  state.schedule=state.schedule||[];
  const key=x=>[x.date,x.pairId,norm(x.group),norm(x.discipline),norm(x.type)].join("|");
  const existing=new Set(state.schedule.map(key));
  seed.forEach(item=>{if(!existing.has(key(item))){state.schedule.push(item);existing.add(key(item));}});
  state.msm25ScheduleVersion="2026-09-17-v1";
})();
