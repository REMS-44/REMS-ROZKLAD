(function(global){
  "use strict";

  const W_NS="http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const REL_NS="http://schemas.openxmlformats.org/package/2006/relationships";
  const OFFICE_REL_NS="http://schemas.openxmlformats.org/officeDocument/2006/relationships";

  function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");}
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
      const key=[dow,pairId,norm(x.discipline),norm(x.type),norm(teacher),norm(x.room),coverageOrdered.map(norm).join("|")].join("§");
      if(!map.has(key))map.set(key,{
        dow,pairId,discipline:String(x.discipline||"Заняття"),type:String(x.type||""),teacher,room:String(x.room||""),coverage:coverageOrdered,dates:[]
      });
      map.get(key).dates.push(String(x.date));
    }
    const events=[...map.values()];
    events.forEach(e=>{e.dates=unique(e.dates).sort();});
    events.sort((a,b)=>a.dow-b.dow||a.pairId-b.pairId||(a.dates[0]||"").localeCompare(b.dates[0]||"")||a.discipline.localeCompare(b.discipline,"uk"));
    return {groups,events,bounds};
  }

  function run(text,{bold=false,italic=false,size=24}={}){
    const props=[
      `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>`,
      `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`,
      `<w:lang w:val="uk-UA"/>`,
      bold?"<w:b/><w:bCs/>":"",
      italic?"<w:i/><w:iCs/>":""
    ].join("");
    return `<w:r><w:rPr>${props}</w:rPr>${xmlText(text)}</w:r>`;
  }
  function para(runs,{align="center",before=0,after=0,keepNext=false}={}){
    const jc=align?`<w:jc w:val="${align}"/>`:"";
    return `<w:p><w:pPr>${jc}<w:spacing w:before="${before}" w:after="${after}" w:line="240" w:lineRule="auto"/>${keepNext?"<w:keepNext/>":""}</w:pPr>${Array.isArray(runs)?runs.join(""):runs}</w:p>`;
  }
  function emptyPara(){return para(run(""));}
  function cell(paras,width,{gridSpan=1,vMerge=null,shade=null}={}){
    const vm=vMerge?`<w:vMerge${vMerge==="continue"?"":" w:val=\"restart\""}/>`:"";
    const span=gridSpan>1?`<w:gridSpan w:val="${gridSpan}"/>`:"";
    const shd=shade?`<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>`:"";
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${span}${vm}<w:vAlign w:val="center"/>${shd}</w:tcPr>${paras||emptyPara()}</w:tc>`;
  }
  function table(rows,widths){
    const sum=widths.reduce((a,b)=>a+b,0);
    const grid=widths.map(w=>`<w:gridCol w:w="${w}"/>`).join("");
    return `<w:tbl><w:tblPr><w:tblW w:w="${sum}" w:type="dxa"/><w:jc w:val="left"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="10" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="10" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="10" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="10" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="8" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="8" w:space="0" w:color="000000"/></w:tblBorders><w:tblCellMar><w:top w:w="45" w:type="dxa"/><w:left w:w="55" w:type="dxa"/><w:bottom w:w="45" w:type="dxa"/><w:right w:w="55" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${rows.join("")}</w:tbl>`;
  }
  function tr(cells){return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells.join("")}</w:tr>`;}
  function eventParas(e){
    const lines=[];
    lines.push(para(run(e.discipline,{bold:true,size:24})));
    const dateText=e.dates.map(shortDate).join("; ");
    const typeDate=[typeAbbr(e.type),dateText].filter(Boolean).join(" ");
    if(typeDate)lines.push(para(run(typeDate,{italic:true,size:24})));
    const room=e.room?`ауд. ${String(e.room).replace(/^ауд\.?\s*/i,"")}`:"";
    const who=[e.teacher,room].filter(Boolean).join("  ");
    if(who)lines.push(para(run(who,{bold:true,size:24})));
    return lines.join("");
  }
  function eventRowCells(groupCodes,event,groupWidth){
    const coverageIdx=event.coverage.map(g=>groupCodes.findIndex(c=>norm(c)===norm(g))).filter(i=>i>=0).sort((a,b)=>a-b);
    const contiguous=coverageIdx.length>1&&coverageIdx.every((v,i)=>i===0||v===coverageIdx[i-1]+1);
    const out=[];
    let i=0;
    while(i<groupCodes.length){
      if(contiguous&&i===coverageIdx[0]){
        out.push(cell(eventParas(event),groupWidth*coverageIdx.length,{gridSpan:coverageIdx.length}));
        i+=coverageIdx.length;continue;
      }
      if(coverageIdx.includes(i))out.push(cell(eventParas(event),groupWidth));
      else out.push(cell(emptyPara(),groupWidth));
      i++;
    }
    return out;
  }
  function packPairRows(state,groupCodes,pairId,events,groupWidth){
    const shared=events.filter(e=>e.coverage.length>1);
    const singles=Object.fromEntries(groupCodes.map(g=>[g,events.filter(e=>e.coverage.length===1&&norm(e.coverage[0])===norm(g))]));
    const rows=[];
    shared.forEach(e=>rows.push({kind:"shared",event:e}));
    const max=Math.max(0,...groupCodes.map(g=>singles[g].length));
    for(let i=0;i<max;i++)rows.push({kind:"packed",index:i});
    if(!rows.length)rows.push({kind:"empty"});
    const pair=pairInfo(state,pairId);
    return rows.map((r,ri)=>{
      const first=ri===0;
      const cells=[];
      cells.push(cell(first?para(run(String(pairId),{bold:true,size:24})):emptyPara(),788,{vMerge:first?"restart":"continue"}));
      cells.push(cell(first?para(run([pair.start,pair.end].filter(Boolean).join("-") ,{bold:true,size:22})):emptyPara(),1720,{vMerge:first?"restart":"continue"}));
      if(r.kind==="shared")cells.push(...eventRowCells(groupCodes,r.event,groupWidth));
      else if(r.kind==="packed"){
        groupCodes.forEach(g=>{
          const e=singles[g][r.index];
          cells.push(cell(e?eventParas(e):emptyPara(),groupWidth));
        });
      }else groupCodes.forEach(()=>cells.push(cell(emptyPara(),groupWidth)));
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
    const pairIds=unique(dayEvents.map(e=>e.pairId)).sort((a,b)=>a-b);
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
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W_NS}" xmlns:r="${OFFICE_REL_NS}"><w:body>${body.join("")}</w:body></w:document>`;
  }
  function stylesXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W_NS}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="uk-UA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;}
  function coreXml(){const now=new Date().toISOString();return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Розклад Режисура естради і шоу</dc:title><dc:creator>РЕМС-Розклад</dc:creator><cp:lastModifiedBy>РЕМС-Розклад</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;}
  function appXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>РЕМС-Розклад</Application><AppVersion>1.9.0</AppVersion></Properties>`;}
  function typesXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;}
  function rootRels(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OFFICE_REL_NS}/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${OFFICE_REL_NS}/extended-properties" Target="docProps/app.xml"/></Relationships>`;}
  function docRels(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OFFICE_REL_NS}/styles" Target="styles.xml"/></Relationships>`;}

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
