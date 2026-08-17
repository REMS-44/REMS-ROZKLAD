(function(global){
  "use strict";

  const W_NS="http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const REL_NS="http://schemas.openxmlformats.org/package/2006/relationships";
  const OFFICE_REL_NS="http://schemas.openxmlformats.org/officeDocument/2006/relationships";

  function cleanXmlText(v){
    return String(v??"").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"");
  }
  function esc(v){return cleanXmlText(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");}
  function norm(v){return String(v||"").trim().toLocaleLowerCase("uk-UA").replace(/[’`']/g,"'").replace(/\s+/g," ");}
  function unique(arr){return [...new Set(arr)];}
  function pad2(v){return String(v).padStart(2,"0");}
  function dateParts(iso){const m=String(iso||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?{y:+m[1],m:+m[2],d:+m[3]}:null;}
  function dayOfWeek(iso){const p=dateParts(iso);if(!p)return -1;const d=new Date(p.y,p.m-1,p.d,12,0,0);return (d.getDay()+6)%7;}
  function shortDate(iso){const p=dateParts(iso);return p?`${pad2(p.d)}.${pad2(p.m)}`:String(iso||"");}
  function xmlText(v){return `<w:t xml:space="preserve">${esc(v)}</w:t>`;}

  function typeAbbr(v){
    const s=norm(v);
    if(s.startsWith("лек"))return "Лек.";
    if(s.startsWith("сем"))return "Сем.";
    if(s.startsWith("практ"))return "Пр.";
    if(s.startsWith("лаб"))return "Лаб.";
    if(s.startsWith("інд"))return "Інд.";
    if(s.startsWith("контроль"))return "Контр.";
    if(s.startsWith("конс"))return "Конс.";
    if(s.startsWith("зал"))return "Зал.";
    if(s.startsWith("ісп"))return "Ісп.";
    if(s.startsWith("реп"))return "Реп.";
    return String(v||"").trim();
  }
  function positionAbbr(v){
    const s=norm(v);
    if(!s)return "";
    if(s.includes("професор за наказом"))return "проф.з/н";
    if(s.includes("доцент за наказом"))return "доц.з/н";
    if(s.includes("старший викладач"))return "ст.викл.";
    if(s.includes("завідувач"))return "зав.каф.";
    if(s.includes("професор"))return "проф.";
    if(s.includes("доцент"))return "доц.";
    if(s.includes("асистент"))return "асист.";
    if(s.includes("викладач"))return "викл.";
    return "";
  }
  function shortPersonName(name){
    const raw=String(name||"").trim().replace(/\s+/g," ");
    if(!raw)return "";
    const parts=raw.split(" ");
    if(parts.length<2)return raw;
    const first=parts[0];
    const initials=parts.slice(1,3).map(x=>x?`${x[0].toUpperCase()}.`:"").join("");
    return initials?`${first} ${initials}`:raw;
  }
  function teacherProfile(state,item){
    const teachers=(state.teachers||[]).filter(t=>t.status!=="archived");
    if(item.teacherId!=null){
      const t=teachers.find(x=>String(x.id)===String(item.teacherId));
      if(t)return t;
    }
    const key=norm(item.teacher);
    if(!key)return null;
    return teachers.find(t=>[t.name,t.shortName].map(norm).includes(key))||null;
  }
  function teacherDisplay(state,item){
    const t=teacherProfile(state,item);
    const pos=positionAbbr(t?.position||"");
    const name=t?.shortName||shortPersonName(t?.name||item.teacher||"");
    return [pos,name].filter(Boolean).join(" ");
  }
  function audienceGroups(item){return unique([item.group,...(Array.isArray(item.audienceGroups)?item.audienceGroups:[])].filter(Boolean));}

  function disciplineById(state,id){return (state.disciplines||[]).find(d=>String(d.id)===String(id));}
  function disciplineIds(item){return unique([...(Array.isArray(item.disciplineIds)?item.disciplineIds:[]),item.disciplineId].filter(Boolean).map(String));}
  function disciplineAudience(state,d){
    if(!d)return null;
    const mode=d.audienceMode==="selected"?"selected":"group";
    const allowed=new Set((state.students||[]).filter(s=>s.status!=="archived"&&norm(s.group)===norm(d.group)).map(s=>String(s.id)));
    const ids=mode==="selected"?unique((d.selectedStudentIds||[]).map(String).filter(id=>allowed.has(id))):[];
    return {group:d.group,mode,studentIds:ids};
  }
  function audiencePartitions(state,item){
    if(Array.isArray(item.audiencePartitions)&&item.audiencePartitions.length)return item.audiencePartitions.map(p=>({group:p.group,mode:p.mode==="selected"?"selected":"group",studentIds:unique((p.studentIds||[]).map(String))}));
    const parts=disciplineIds(item).map(id=>disciplineAudience(state,disciplineById(state,id))).filter(Boolean);
    if(parts.length)return parts;
    return audienceGroups(item).map(group=>({group,mode:"group",studentIds:[]}));
  }
  function selectiveNote(state,item){const selected=audiencePartitions(state,item).filter(p=>p.mode==="selected");if(!selected.length)return "";const count=unique(selected.flatMap(p=>p.studentIds)).length;return `Вибіркова група · ${count} студентів`;}
  function selectiveSignature(state,item){return audiencePartitions(state,item).map(p=>`${norm(p.group)}:${p.mode}:${unique(p.studentIds).sort().join(",")}`).join("|");}

  function courseGroups(state,course){
    return (state.groups||[]).filter(g=>g.status!=="archived"&&Number(g.course)===Number(course)).slice();
  }
  function groupCount(state,code){return (state.students||[]).filter(s=>s.status!=="archived"&&norm(s.group)===norm(code)).length;}
  function academicYears(state){
    const nums=String(state.academicYear||"").match(/\d{4}/g)||[];
    const start=Number(nums[0])||new Date().getFullYear();
    const end=Number(nums[1])||start+1;
    return {start,end};
  }
  function semesterBounds(state,semester){
    const y=academicYears(state);
    return Number(semester)===2
      ?{from:`${y.end}-01-01`,to:`${y.end}-06-30`}
      :{from:`${y.start}-09-01`,to:`${y.start}-12-31`};
  }
  function inBounds(iso,b){return iso>=b.from&&iso<=b.to;}
  function pairInfo(state,pairId){
    const p=(state.bellSchedule||[]).find(x=>String(x.id)===String(pairId));
    return p||{id:pairId,start:"",end:""};
  }
  function roman(n){return ({1:"I",2:"II",3:"III",4:"IV",5:"V",6:"VI"})[Number(n)]||String(n);}
  function weekdayName(idx){return ["Понеділок","Вівторок","Середа","Четвер","П’ятниця","Субота","Неділя"][idx]||"";}

  function collectEvents(state,{course,semester}){
    const groups=courseGroups(state,course);
    const groupCodes=groups.map(g=>g.code);
    const selected=new Set(groupCodes.map(norm));
    const bounds=semesterBounds(state,semester);
    const map=new Map();

    for(const x of (state.schedule||[])){
      if(x.specialSchedule)continue;
      if(!x.date||!inBounds(String(x.date),bounds))continue;
      const coverage=audienceGroups(x).filter(g=>selected.has(norm(g)));
      if(!coverage.length)continue;
      const pairId=Number(x.pairId)||Number(pairInfo(state,x.pairId).id)||0;
      if(!pairId)continue;
      const dow=dayOfWeek(x.date);
      if(dow<0)continue;
      const coverageOrdered=groupCodes.filter(g=>coverage.some(c=>norm(c)===norm(g)));
      const teacher=teacherDisplay(state,x);
      const selective=selectiveNote(state,x);
      const key=[dow,pairId,norm(x.discipline),norm(x.type),norm(teacher),norm(x.room),coverageOrdered.map(norm).join("|"),selectiveSignature(state,x)].join("§");
      if(!map.has(key))map.set(key,{
        dow,pairId,discipline:String(x.discipline||"Заняття"),type:String(x.type||""),teacher,room:String(x.room||""),coverage:coverageOrdered,selective,dates:[]
      });
      map.get(key).dates.push(String(x.date));
    }
    const events=[...map.values()];
    events.forEach(e=>{e.dates=unique(e.dates).sort();});
    events.sort((a,b)=>a.dow-b.dow||a.pairId-b.pairId||(a.dates[0]||"").localeCompare(b.dates[0]||"")||a.discipline.localeCompare(b.discipline,"uk"));
    return {groups,events,bounds};
  }

  function run(text,{bold=false,italic=false,size=24}={}){
    // Child order in w:rPr follows WordprocessingML schema.
    const props=[
      `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>`,
      bold?"<w:b/><w:bCs/>":"",
      italic?"<w:i/><w:iCs/>":"",
      `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`,
      `<w:lang w:val="uk-UA"/>`
    ].join("");
    return `<w:r><w:rPr>${props}</w:rPr>${xmlText(text)}</w:r>`;
  }
  function para(runs,{align="center",before=0,after=0,keepNext=false}={}){
    // w:pPr is order-sensitive in Microsoft Word:
    // keepNext -> spacing -> jc.
    return `<w:p><w:pPr>${keepNext?"<w:keepNext/>":""}<w:spacing w:before="${before}" w:after="${after}" w:line="240" w:lineRule="auto"/>${align?`<w:jc w:val="${align}"/>`:""}</w:pPr>${Array.isArray(runs)?runs.join(""):runs}</w:p>`;
  }
  function emptyPara(){return `<w:p/>`;}
  function cell(paras,width,{shade=null}={}){
    // Avoid gridSpan / vMerge in exported fragments. A simple rectangular
    // table is dramatically safer when later pasted into the faculty schedule.
    const shd=shade?`<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>`:"";
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${shd}<w:vAlign w:val="center"/></w:tcPr>${paras||emptyPara()}</w:tc>`;
  }
  function table(rows,widths){
    const sum=widths.reduce((a,b)=>a+b,0);
    const grid=widths.map(w=>`<w:gridCol w:w="${w}"/>`).join("");
    return `<w:tbl><w:tblPr><w:tblW w:w="${sum}" w:type="dxa"/><w:jc w:val="left"/><w:tblBorders><w:top w:val="single" w:sz="10" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="10" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="10" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="10" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="8" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="8" w:space="0" w:color="000000"/></w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="45" w:type="dxa"/><w:left w:w="55" w:type="dxa"/><w:bottom w:w="45" w:type="dxa"/><w:right w:w="55" w:type="dxa"/></w:tblCellMar><w:tblLook w:firstColumn="1" w:firstRow="1" w:lastColumn="0" w:lastRow="0" w:noHBand="1" w:noVBand="1" w:val="0600"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${rows.join("")}</w:tbl>`;
  }
  function tr(cells){return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells.join("")}</w:tr>`;}
  function eventParas(e){
    const lines=[];
    lines.push(para(run(e.discipline,{bold:true,size:24})));
    const dateText=e.dates.map(shortDate).join("; ");
    const typeDate=[typeAbbr(e.type),dateText].filter(Boolean).join(" ");
    if(typeDate)lines.push(para(run(typeDate,{italic:true,size:24})));
    if(e.selective)lines.push(para(run(e.selective,{italic:true,bold:true,size:20})));
    const room=e.room?`ауд. ${String(e.room).replace(/^ауд\.?\s*/i,"")}`:"";
    const who=[e.teacher,room].filter(Boolean).join("  ");
    if(who)lines.push(para(run(who,{bold:true,size:24})));
    return lines.join("");
  }
  function eventRowCells(groupCodes,event,groupWidth){
    // Repeat the same shared/stream event in each covered group column.
    // This makes the exported fragment much easier to paste into the
    // faculty timetable and removes fragile merged cells.
    return groupCodes.map(g=>
      event.coverage.some(c=>norm(c)===norm(g))
        ?cell(eventParas(event),groupWidth)
        :cell(emptyPara(),groupWidth)
    );
  }
  function packPairRows(state,groupCodes,pairId,events,groupWidth){
    const perGroup=Object.fromEntries(groupCodes.map(g=>[
      g,
      events.filter(e=>e.coverage.some(c=>norm(c)===norm(g)))
    ]));
    const max=Math.max(1,...groupCodes.map(g=>perGroup[g].length));
    const pair=pairInfo(state,pairId);

    return Array.from({length:max},(_,ri)=>{
      const cells=[
        cell(ri===0?para(run(String(pairId),{bold:true,size:24})):emptyPara(),788),
        cell(ri===0?para(run([pair.start,pair.end].filter(Boolean).join("-"),{bold:true,size:22})):emptyPara(),1720)
      ];
      groupCodes.forEach(g=>{
        const e=perGroup[g][ri];
        cells.push(cell(e?eventParas(e):emptyPara(),groupWidth));
      });
      return tr(cells);
    });
  }
  function dayTable(state,groups,events,dow){
    const groupWidth=4445;
    const widths=[788,1720,...groups.map(()=>groupWidth)];
    const headerCells=[
      cell(para(run("Пара",{bold:true,size:24})),788),
      cell(para(run("Тривалість",{bold:true,size:24})),1720)
    ];
    groups.forEach(g=>{
      const n=groupCount(state,g.code);
      const p=[para(run(g.code,{bold:true,size:24}))];
      if(n)p.push(para(run(String(n),{size:24})));
      headerCells.push(cell(p.join(""),groupWidth));
    });
    const rows=[tr(headerCells)];
    const dayEvents=events.filter(e=>e.dow===dow);
    const configured=(state.bellSchedule||[]).map(p=>Number(p.id)).filter(n=>n>=1&&n<=7);
    const pairIds=unique(configured.length?configured:[1,2,3,4,5,6,7]).sort((a,b)=>a-b);
    pairIds.forEach(pairId=>rows.push(...packPairRows(state,groups.map(g=>g.code),pairId,dayEvents.filter(e=>e.pairId===pairId),groupWidth)));
    return table(rows,widths);
  }
  function pageBreak(){return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;}
  function headingBlock(state,course,semester){
    const y=academicYears(state);
    return [
      para(run("РЕЖИСУРА ЕСТРАДИ І ШОУ",{bold:true,size:24}),{keepNext:true}),
      para(run("(денна форма навчання)",{bold:true,size:24}),{keepNext:true}),
      para(run(`${roman(semester)} семестр ${y.start} – ${y.end} н.р.`,{bold:true,size:24}),{keepNext:true}),
      para(run(`${roman(course)} КУРС`,{bold:true,size:24}),{after:80,keepNext:true})
    ].join("");
  }
  function documentXml(state,opts){
    const {groups,events}=collectEvents(state,opts);
    if(!groups.length)throw new Error(`Для ${opts.course} курсу немає груп.`);
    if(!events.length)throw new Error(`Для ${opts.course} курсу у ${roman(opts.semester)} семестрі ще немає занять у розкладі.`);
    const usedDays=unique(events.map(e=>e.dow));
    const days=[0,1,2,3,4];
    if(usedDays.includes(5))days.push(5);
    const body=[];
    body.push(headingBlock(state,opts.course,opts.semester));
    days.forEach((dow,idx)=>{
      if(idx>0)body.push(pageBreak());
      body.push(dayTable(state,groups,events,dow));
      body.push(para(run(weekdayName(dow),{bold:true,size:24}),{align:"left",before:45,after:0}));
    });
    body.push(`<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="180" w:right="962" w:bottom="284" w:left="567" w:header="0" w:footer="0" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>`);
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W_NS}" xmlns:r="${OFFICE_REL_NS}" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><w:body>${body.join("")}</w:body></w:document>`;
  }
  function stylesXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W_NS}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="uk-UA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:widowControl/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="uk-UA"/></w:rPr></w:style></w:styles>`;}
  function settingsXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="${W_NS}"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat><w:themeFontLang w:val="uk-UA"/></w:settings>`;}
  function fontTableXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:fonts xmlns:w="${W_NS}"><w:font w:name="Times New Roman"><w:charset w:val="00"/><w:family w:val="roman"/><w:pitch w:val="variable"/></w:font><w:font w:name="Arial"><w:charset w:val="00"/><w:family w:val="swiss"/><w:pitch w:val="variable"/></w:font></w:fonts>`;}
  function themeXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F497D"/></a:dk2><a:lt2><a:srgbClr val="EEECE1"/></a:lt2><a:accent1><a:srgbClr val="4F81BD"/></a:accent1><a:accent2><a:srgbClr val="C0504D"/></a:accent2><a:accent3><a:srgbClr val="9BBB59"/></a:accent3><a:accent4><a:srgbClr val="8064A2"/></a:accent4><a:accent5><a:srgbClr val="4BACC6"/></a:accent5><a:accent6><a:srgbClr val="F79646"/></a:accent6><a:hlink><a:srgbClr val="0000FF"/></a:hlink><a:folHlink><a:srgbClr val="800080"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Times New Roman"/><a:ea typeface=""/><a:cs typeface="Times New Roman"/></a:majorFont><a:minorFont><a:latin typeface="Times New Roman"/><a:ea typeface=""/><a:cs typeface="Times New Roman"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;}
  function coreXml(){const now=new Date().toISOString();return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Розклад Режисура естради і шоу</dc:title><dc:creator>РЕМС-Розклад</dc:creator><cp:lastModifiedBy>РЕМС-Розклад</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;}
  function appXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template></Template><TotalTime>0</TotalTime><Application>Microsoft Office Word</Application><AppVersion>16.0000</AppVersion></Properties>`;}
  function typesXml(){return `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/><Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;}
  function rootRels(){return `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OFFICE_REL_NS}/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${OFFICE_REL_NS}/extended-properties" Target="docProps/app.xml"/></Relationships>`;}
  function docRels(){return `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OFFICE_REL_NS}/styles" Target="styles.xml"/><Relationship Id="rId2" Type="${OFFICE_REL_NS}/settings" Target="settings.xml"/><Relationship Id="rId3" Type="${OFFICE_REL_NS}/fontTable" Target="fontTable.xml"/><Relationship Id="rId4" Type="${OFFICE_REL_NS}/theme" Target="theme/theme1.xml"/></Relationships>`;}

  const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
  function crc32(bytes){let c=0xFFFFFFFF;for(let i=0;i<bytes.length;i++)c=CRC_TABLE[(c^bytes[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
  function u16(v){return [v&255,(v>>>8)&255];}
  function u32(v){return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];}
  function concat(chunks){const len=chunks.reduce((s,c)=>s+c.length,0),out=new Uint8Array(len);let o=0;for(const c of chunks){out.set(c,o);o+=c.length;}return out;}
  function dosDateTime(d=new Date()){
    const year=Math.max(1980,d.getFullYear());
    const time=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);
    const date=((year-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
    return {time,date};
  }
  function zipStore(entries){
    const enc=new TextEncoder(),local=[],central=[];let offset=0;const dt=dosDateTime();
    for(const [name,content] of Object.entries(entries)){
      const nameBytes=enc.encode(name),data=typeof content==="string"?enc.encode(content):content,crc=crc32(data);
      const lh=new Uint8Array([0x50,0x4b,0x03,0x04,...u16(20),...u16(0),...u16(0),...u16(dt.time),...u16(dt.date),...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),...u16(0)]);
      const localChunk=concat([lh,nameBytes,data]);local.push(localChunk);
      const ch=new Uint8Array([0x50,0x4b,0x01,0x02,...u16(20),...u16(20),...u16(0),...u16(0),...u16(dt.time),...u16(dt.date),...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)]);
      central.push(concat([ch,nameBytes]));offset+=localChunk.length;
    }
    const centralBytes=concat(central),localBytes=concat(local);
    const end=new Uint8Array([0x50,0x4b,0x05,0x06,...u16(0),...u16(0),...u16(central.length),...u16(central.length),...u32(centralBytes.length),...u32(localBytes.length),...u16(0)]);
    return concat([localBytes,centralBytes,end]);
  }
  function buildCourseScheduleDocx(state,opts){
    const xml=documentXml(state,opts);
    return zipStore({
      "[Content_Types].xml":typesXml(),
      "_rels/.rels":rootRels(),
      "docProps/core.xml":coreXml(),
      "docProps/app.xml":appXml(),
      "word/document.xml":xml,
      "word/styles.xml":stylesXml(),
      "word/settings.xml":settingsXml(),
      "word/fontTable.xml":fontTableXml(),
      "word/theme/theme1.xml":themeXml(),
      "word/_rels/document.xml.rels":docRels()
    });
  }
  function filename(state,{course,semester}){
    const y=academicYears(state);
    return `Розклад_РЕМС_${course}_курс_${roman(semester)}_семестр_${y.start}-${y.end}.docx`;
  }
  function downloadCourseSchedule(state,opts){
    const bytes=buildCourseScheduleDocx(state,opts);
    const blob=new Blob([bytes],{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=filename(state,opts);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    return {filename:filename(state,opts),bytes};
  }
  function preview(state,opts){
    const data=collectEvents(state,opts);
    return {groups:data.groups.map(g=>({code:g.code,count:groupCount(state,g.code)})),events:data.events.length,bounds:data.bounds};
  }
  global.REMS_WORD_EXPORT={buildCourseScheduleDocx,downloadCourseSchedule,preview,filename,roman};
})(typeof window!=="undefined"?window:globalThis);
