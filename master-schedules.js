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
  state.schemaVersion=Math.max(Number(state.schemaVersion)||0,41);

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
    kuzmenko:ensureTeacher({id:1095,name:"Кузьменко Т.Г.",shortName:"Кузьменко Т.Г."}),
    fisher:ensureTeacher({id:1084,name:"Фішер Володимир Михайлович",shortName:"Фішер В.М.",position:"Професор"})
  };

  const thesisStudentNames=[
    "Бондарчук Анастасія Сергіївна","Будяк Станіслав Миколайович",
    "Морська Юлія Русланівна","Чирва Дарина Олегівна"
  ];
  const msm25StudentIdByName=()=>new Map((state.students||[])
    .filter(s=>norm(s.group)===norm("МСМ-25")&&s.status!=="archived")
    .map(s=>[norm(s.name),Number(s.id)]));
  const thesisStudentIds=thesisStudentNames.map(name=>msm25StudentIdByName().get(norm(name))).filter(Boolean);
  state.disciplines=state.disciplines||[];
  let thesisDiscipline=state.disciplines.find(d=>norm(d.group)===norm("МСМ-25")&&norm(d.name)===norm("Керівництво магістерською роботою"));
  if(!thesisDiscipline){
    thesisDiscipline={id:3101,name:"Керівництво магістерською роботою",course:6,group:"МСМ-25",programId:"master",semester:3,academicYear:"2026/2027",teacherIds:[teacherIds.fisher],teacherLoads:{[teacherIds.fisher]:{11:56}},teacherStudentLoads:{[teacherIds.fisher]:{11:[...thesisStudentIds]}},teacherStudentHours:{},teacherStreams:{},audienceMode:"selected",selectedStudentIds:[...thesisStudentIds],controlForm:"Немає",color:"#c9789c",hours:{11:14},extraHours:{},note:"По 14 консультацій кожному магістру згідно з узгодженим графіком.",status:"active",sourceCurriculumId:null,sourceComponentId:null,sourceRowId:null,planMeta:{}};
    state.disciplines.push(thesisDiscipline);
  }
  thesisDiscipline.color="#c9789c";

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
  // Documented elective audiences for MSM-25. These explicit partitions make
  // an elective lesson busy only for the students who actually selected it.
  const electiveAudiences={
    "Мистецькі студії":[
      "Ванджура Вікторія Юріївна","Гапонов Микита Олександрович","Грошева Марія Олександрівна",
      "Колотурський Єгор Ярославович","Рудий Владислав Іванович","Самовілов Сергій Олександрович",
      "Скоробагатько Тамара Сергіївна","Смердова Тетяна Дмитрівна","Цесарчук Єлизавета Євгеніївна",
      "Янкова Анастасія Віталіївна","Петриченко Лейла Ельчинівна","Невмержицька Анна Сергіївна",
      "Колесніков Гліб Максимович"
    ],
    "Медійна та інформаційна грамотність":[
      "Бондарчук Анастасія Сергіївна","Гапон Олександр Миколайович","Кононенко Марія Юріївна",
      "Лєбєдєва Світлана Сергіївна","Поліщук Михайло Романович","Самовілов Сергій Олександрович"
    ],
    "Стартапи в галузі культури і мистецтв":[
      "Будяк Станіслав Миколайович","Ванджура Вікторія Юріївна","Гапон Олександр Миколайович",
      "Гапонов Микита Олександрович","Грошева Марія Олександрівна","Колотурський Єгор Ярославович",
      "Кононенко Марія Юріївна","Лєбєдєва Світлана Сергіївна","Морська Юлія Русланівна",
      "Поліщук Михайло Романович","Рудий Владислав Іванович","Скоробагатько Тамара Сергіївна",
      "Смердова Тетяна Дмитрівна","Цесарчук Єлизавета Євгеніївна","Чирва Дарина Олегівна",
      "Янкова Анастасія Віталіївна","Петриченко Лейла Ельчинівна","Невмержицька Анна Сергіївна",
      "Колесніков Гліб Максимович"
    ],
    "Управління start-up-проєктами":[
      "Бондарчук Анастасія Сергіївна","Будяк Станіслав Миколайович",
      "Морська Юлія Русланівна","Чирва Дарина Олегівна"
    ],
    "Сценічно-виконавська майстерність":[
      "Ванджура Вікторія Юріївна","Гапон Олександр Миколайович","Гапонов Микита Олександрович",
      "Грошева Марія Олександрівна","Колотурський Єгор Ярославович","Лєбєдєва Світлана Сергіївна",
      "Поліщук Михайло Романович","Рудий Владислав Іванович","Скоробагатько Тамара Сергіївна",
      "Смердова Тетяна Дмитрівна","Цесарчук Єлизавета Євгеніївна","Янкова Анастасія Віталіївна",
      "Петриченко Лейла Ельчинівна","Колесніков Гліб Максимович"
    ],
    "Візуальний сторітелінг в дизайні":[
      "Бондарчук Анастасія Сергіївна","Будяк Станіслав Миколайович","Кононенко Марія Юріївна",
      "Морська Юлія Русланівна","Самовілов Сергій Олександрович","Чирва Дарина Олегівна",
      "Невмержицька Анна Сергіївна"
    ]
  };
  const studentIdByName=new Map((state.students||[])
    .filter(s=>norm(s.group)===norm("МСМ-25")&&s.status!=="archived")
    .map(s=>[norm(s.name),Number(s.id)]));
  Object.entries(electiveAudiences).forEach(([discipline,names])=>{
    const studentIds=names.map(name=>studentIdByName.get(norm(name))).filter(Boolean);
    state.schedule.filter(item=>norm(item.group)===norm("МСМ-25")&&norm(item.discipline)===norm(discipline)).forEach(item=>{
      item.audiencePartitions=[{group:"МСМ-25",mode:"selected",studentIds:[...studentIds]}];
      item.audiencePartitionsSource="documented_elective_choices";
      item.audienceStudentIds=[...studentIds];
      item.audienceMode="selected";
      item.coverage="Вибрані студенти";
      item.sourceAudienceFile="Назва ОК.docx";
    });
  });

  const consultationPlan=[
    // 21.09–04.10: 3 консультації кожному.
    // Поки тривають бакалаврські пари Фішера, максимально використовуємо вже наявні його робочі дні.
    // Окремо додано лише 23.09, бо на наявних робочих днях фізично не вистачає вільних півпар для 12 консультацій.
    ["2026-09-21",2,["Бондарчук Анастасія Сергіївна"]],
    ["2026-09-22",2,["Будяк Станіслав Миколайович","Морська Юлія Русланівна"]],
    ["2026-09-23",2,["Морська Юлія Русланівна","Чирва Дарина Олегівна"]],
    ["2026-09-24",4,["Бондарчук Анастасія Сергіївна"]],
    ["2026-09-24",5,["Будяк Станіслав Миколайович","Чирва Дарина Олегівна"]],
    ["2026-09-29",2,["Бондарчук Анастасія Сергіївна","Морська Юлія Русланівна"]],
    ["2026-09-29",3,["Будяк Станіслав Миколайович","Чирва Дарина Олегівна"]],

    // 19.10–15.11: 6 консультацій кожному.
    // До завершення бакалаврських занять використовуємо насамперед існуючі робочі дні Фішера.
    // Після 05.11 окремі консультаційні дні ставимо в середині тижня, коли магістри вільні.
    ["2026-10-19",2,["Бондарчук Анастасія Сергіївна"]],
    ["2026-10-20",2,["Бондарчук Анастасія Сергіївна","Будяк Станіслав Миколайович"]],
    ["2026-10-20",3,["Морська Юлія Русланівна","Чирва Дарина Олегівна"]],
    ["2026-10-21",2,["Бондарчук Анастасія Сергіївна","Морська Юлія Русланівна"]],
    ["2026-10-21",3,["Будяк Станіслав Миколайович","Чирва Дарина Олегівна"]],
    ["2026-10-26",2,["Бондарчук Анастасія Сергіївна"]],
    ["2026-10-27",2,["Бондарчук Анастасія Сергіївна"]],
    ["2026-10-27",3,["Будяк Станіслав Миколайович","Морська Юлія Русланівна"]],
    ["2026-10-28",2,["Будяк Станіслав Миколайович","Морська Юлія Русланівна"]],
    ["2026-10-28",3,["Чирва Дарина Олегівна"]],
    ["2026-11-02",2,["Бондарчук Анастасія Сергіївна"]],
    ["2026-11-04",2,["Будяк Станіслав Миколайович"]],
    ["2026-11-04",3,["Морська Юлія Русланівна","Чирва Дарина Олегівна"]],
    ["2026-11-10",5,["Будяк Станіслав Миколайович","Чирва Дарина Олегівна"]],
    ["2026-11-12",2,["Морська Юлія Русланівна","Чирва Дарина Олегівна"]],

    // 16.11–29.11: 2 консультації кожному — середина тижня.
    ["2026-11-18",2,["Бондарчук Анастасія Сергіївна","Будяк Станіслав Миколайович"]],
    ["2026-11-18",3,["Морська Юлія Русланівна","Чирва Дарина Олегівна"]],
    ["2026-11-25",2,["Бондарчук Анастасія Сергіївна","Будяк Станіслав Миколайович"]],
    ["2026-11-25",3,["Морська Юлія Русланівна","Чирва Дарина Олегівна"]],

    // 30.11–13.12: 2 консультації кожному — середи.
    ["2026-12-02",2,["Бондарчук Анастасія Сергіївна","Будяк Станіслав Миколайович"]],
    ["2026-12-02",3,["Морська Юлія Русланівна","Чирва Дарина Олегівна"]],
    ["2026-12-09",2,["Бондарчук Анастасія Сергіївна","Будяк Станіслав Миколайович"]],
    ["2026-12-09",3,["Морська Юлія Русланівна","Чирва Дарина Олегівна"]],

    // 14.12–20.12: 1 консультація кожному — середа.
    ["2026-12-16",2,["Бондарчук Анастасія Сергіївна","Будяк Станіслав Миколайович"]],
    ["2026-12-16",3,["Морська Юлія Русланівна","Чирва Дарина Олегівна"]]
  ];
  const consultationHalfTimes={
    2:[["10:40","11:20"],["11:20","12:00"]],
    3:[["12:30","13:10"],["13:10","13:50"]],
    4:[["14:10","14:50"],["14:50","15:30"]],
    5:[["15:40","16:20"],["16:20","17:00"]]
  };
  const studentIdsByName=msm25StudentIdByName();
  const consultationRows=[];
  let consultationId=940001;
  consultationPlan.forEach(([date,pair,names])=>names.forEach((name,index)=>{
    const studentId=studentIdsByName.get(norm(name));
    const [start,end]=consultationHalfTimes[pair][index];
    if(!studentId)return;
    consultationRows.push({id:consultationId++,date,start,end,pairId:pair,group:"МСМ-25",disciplineId:thesisDiscipline.id,disciplineIds:[thesisDiscipline.id],discipline:thesisDiscipline.name,type:"Керівництво магістерською роботою",coverage:name,students:name,studentId,teacherId:teacherIds.fisher,teacher:"Фішер В.М.",room:"",workloadHours:1,note:"Консультація · онлайн",repeatBatchId:null,specialSchedule:true,specialKind:"consult_master",specialHalf:index+1,scheduleSource:"special",sourceSemester:3,sourceSemesters:[3],sourceCourse:6,sourceCourses:[6],sourceFile:"Узгоджений графік консультацій МСМ-25",deliveryMode:"online",platform:"Zoom"});
  }));
  const consultationKey=item=>[item.date,item.pairId,item.specialHalf,norm(item.group),norm(item.students||item.coverage),norm(item.type)].join("|");
  const existingConsultations=new Set((state.schedule||[]).map(consultationKey));
  consultationRows.forEach(item=>{if(!existingConsultations.has(consultationKey(item))){state.schedule.push(item);existingConsultations.add(consultationKey(item));}});
  state.msm25ConsultationVersion="2026-09-17-v8-existing-workdays-then-midweek";
  state.msm25ScheduleVersion="2026-09-17-v2-elective-audiences";
})();
