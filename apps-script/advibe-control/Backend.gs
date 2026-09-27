const ADVIBE = {
  NAME: 'ADvibe CONTROL 2026',
  TZ: 'America/Guayaquil',
  SHEETS: ['DASHBOARD','CLIENTES','SERVICIOS','CLIENTE_SERVICIOS','PRODUCCION','TAREAS','PUBLICACIONES','CALENDARIO','COBROS','PAGOS','CAMPAÑAS_META','IDEAS_CONTENIDO','GRABACIONES','EDICIONES','ENTREGAS','RECORDATORIOS','CONFIGURACION','LOG','USUARIOS'],
  // Columnas (base 0) de cada hoja que aparece en la agenda: fecha, estado, cliente, etiqueta, id de evento de Calendar
  AGENDA: [
    {sheet:'TAREAS',        date:4, status:7, client:1, label:2, event:10},
    {sheet:'GRABACIONES',   date:2, status:9, client:1, label:5, event:11},
    {sheet:'PUBLICACIONES', date:4, status:8, client:2, label:3, event:11},
    {sheet:'ENTREGAS',      date:3, status:6, client:1, label:5, event:8}
  ],
  DONE: ['COMPLETADA','CANCELADA','PUBLICADA','ENTREGADA']
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('ADvibe CONTROL')
    .addMetaTag('viewport','width=device-width, initial-scale=1, maximum-scale=1');
}

function ss(){ return SpreadsheetApp.getActiveSpreadsheet(); }
function sh(n){ const s=ss().getSheetByName(n); if(!s) throw new Error('Falta hoja: '+n); return s; }
function now(){ return new Date(); }
function norm(v){ return String(v||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim(); }
function uid(prefix){ return prefix+'-'+Utilities.getUuid().slice(0,8).toUpperCase(); }
function fmt(d,p){ return Utilities.formatDate(d,ADVIBE.TZ,p); }
function cfg(key, fallback){ const d=sh('CONFIGURACION').getDataRange().getValues(); for(let i=1;i<d.length;i++) if(norm(d[i][0])===norm(key)) return d[i][1] || fallback; return fallback; }
function logAction(user,action,client,beforeValue,afterValue,result){ sh('LOG').appendRow([now(),fmt(now(),'HH:mm:ss'),user||Session.getActiveUser().getEmail()||'Sistema',action,client||'',beforeValue||'',afterValue||'',result||'OK']); }
// Serializa las escrituras: dos mensajes a la vez no deben pisarse el contador de producción.
function withLock(fn){ const l=LockService.getScriptLock(); l.waitLock(20000); try{ return fn(); } finally { l.releaseLock(); } }

function setupSystem(){
  ADVIBE.SHEETS.forEach(n=>{ if(!ss().getSheetByName(n)) ss().insertSheet(n); });
  setupTriggers();
  return {ok:true,message:'ADvibe CONTROL preparado. Falta autorizar y desplegar la Web App.'};
}

function setupTriggers(){
  ScriptApp.getProjectTriggers().forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyMorning').timeBased().everyDays(1).atHour(8).inTimezone(ADVIBE.TZ).create();
  ScriptApp.newTrigger('dailyNight').timeBased().everyDays(1).atHour(20).inTimezone(ADVIBE.TZ).create();
  ScriptApp.newTrigger('hourlyChecks').timeBased().everyHours(1).inTimezone(ADVIBE.TZ).create();
}

function adminEmail(){ const e=String(cfg('EMAIL_ADMIN','')).trim(); if(!e) console.warn('EMAIL_ADMIN vacío en CONFIGURACION: no se envía el resumen.'); return e; }
function dailyMorning(){ const e=adminEmail(); if(e) MailApp.sendEmail(e, '☀️ ADvibe CONTROL — Hoy', buildAgendaText(0,1)); }
function dailyNight(){ const e=adminEmail(); if(e) MailApp.sendEmail(e, '🌙 ADvibe CONTROL — Mañana', buildAgendaText(1,1)); }
function hourlyChecks(){ refreshCollectionStatuses(); }

function findClient(query){
  const q=norm(query); if(!q) return null;
  const d=sh('CLIENTES').getDataRange().getValues();
  for(let i=1;i<d.length;i++){
    const name=norm(d[i][1]);
    if(name && (q.includes(name) || name===q)) return {row:i+1,id:d[i][0],name:d[i][1],meta:Number(d[i][13])||0,done:Number(d[i][14])||0,state:d[i][10],monthly:Number(d[i][8])||0};
  }
  const aliases=[['gualaceo','CLUB SANTA BÁRBARA GUALACEO'],['santa barbara','CLUB SANTA BÁRBARA CUENCA'],['paola','PAOLA MIGUITAMA'],['muebles','MUEBLES IDEAL'],['kamauto','KAMAUTO'],['san lucas','CETAD SAN LUCAS'],['cetad','CETAD SAN LUCAS'],['motorsport','AM MOTORSPORT']];
  for(const a of aliases) if(q.includes(a[0]) && norm(a[1])!==q) return findClient(a[1]);
  return null;
}

// Devuelve null si el texto no trae una cantidad explícita: nunca se asume 1 para escribir en la hoja.
function parseQuantity(text){
  const t=norm(text);
  const m=t.match(/\b(\d+)\s*(videos?|reels?|piezas?|post|posts)\b/) || t.match(/\b(\d+)\b/);
  if(m) return Number(m[1]);
  const words={un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10};
  for(const k in words) if(new RegExp('\\b'+k+'\\b').test(t)) return words[k];
  return null;
}

// Fechas y horas en la zona del proyecto (appsscript.json: America/Guayaquil).
// Hora solo si viene marcada ("a las 3", "15:30", "4pm"): un número suelto ("3 videos") no es una hora.
function parseDateNatural(text){
  const t=norm(text), d=new Date();
  const meses={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,setiembre:8,octubre:9,noviembre:10,diciembre:11};
  let m;
  if(t.includes('pasado manana')) d.setDate(d.getDate()+2);
  else if(/\bmanana\b/.test(t) && !/\b(la|en la|por la|de la) manana\b/.test(t)) d.setDate(d.getDate()+1);
  else if((m=t.match(/\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/))){
    d.setMonth(meses[m[2]], Number(m[1])); if(d < new Date(new Date().setHours(0,0,0,0))) d.setFullYear(d.getFullYear()+1);
  }
  else if((m=t.match(/\b(\d{1,2})\/(\d{1,2})\b/))){
    d.setMonth(Number(m[2])-1, Number(m[1])); if(d < new Date(new Date().setHours(0,0,0,0))) d.setFullYear(d.getFullYear()+1);
  }
  else {
    const days={domingo:0,lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6};
    for(const k in days) if(new RegExp('\\b'+k+'\\b').test(t)){ let delta=(days[k]-d.getDay()+7)%7; if(delta===0) delta=7; d.setDate(d.getDate()+delta); break; }
  }
  const tm=t.match(/\b(?:a las|a la|las)\s+([01]?\d|2[0-3])(?::([0-5]\d))?\s*(am|pm)?\b/) || t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\s*(am|pm)?\b/) || t.match(/\b([01]?\d)()\s*(am|pm)\b/);
  if(tm){ let h=Number(tm[1]), min=Number(tm[2]||0), ap=tm[3]; if(ap==='pm'&&h<12)h+=12; if(ap==='am'&&h===12)h=0; if(!ap && /\b(tarde|noche)\b/.test(t) && h<12) h+=12; d.setHours(h,min,0,0); }
  else d.setHours(10,0,0,0);
  return d;
}

function calendar(){ const id=String(cfg('CALENDAR_ID','primary')); return CalendarApp.getCalendarById(id) || CalendarApp.getDefaultCalendar(); }

function upsertCalendar(eventId,title,start,end,description,reminders){
  const cal=calendar();
  let ev=null;
  if(eventId){ try{ev=cal.getEventById(eventId);}catch(e){} }
  if(ev){ ev.setTitle(title); ev.setTime(start,end); ev.setDescription(description||'ADvibe CONTROL'); }
  else ev=cal.createEvent(title,start,end,{description:description||'ADvibe CONTROL'});
  (reminders||[60]).forEach(m=>{ try{ev.addPopupReminder(m);}catch(e){} });
  return ev.getId();
}
function cancelCalendar(eventId){ if(!eventId)return; try{const ev=calendar().getEventById(eventId);if(ev)ev.deleteEvent();}catch(e){} }

function clientStatus(c){
  const pending=Math.max(0,c.meta-c.done);
  return {ok:true,message:`${c.name}: ${c.done}/${c.meta} piezas este mes. Faltan ${pending}.`+(c.meta?'':' (Meta de contenido en 0: revisa CLIENTES.)')};
}

function recordProduction(client, quantity, mode, original, user){
  return withLock(()=>{
    const c=findClient(client); if(!c) return {ok:false,message:'No encontré el cliente.'};
    const before=c.done, after=mode==='SET'?quantity:before+quantity;
    if(after<0) return {ok:false,message:'La cantidad no puede quedar negativa.'};
    const pending=Math.max(0,c.meta-after), added=Math.max(0,after-before);
    sh('CLIENTES').getRange(c.row,15).setValue(after);
    sh('CLIENTES').getRange(c.row,16).setValue(pending);
    for(let i=0;i<added;i++) sh('PRODUCCION').appendRow([uid('PRD'),c.name,fmt(now(),'yyyy-MM'),before+i+1,'VIDEO',original,'','','LISTO',now(),'','','','','Instagram','Pablo','','','Asistente']);
    logAction(user,mode==='SET'?'PRODUCCION_AJUSTE':'PRODUCCION',c.name,before,after,'OK');
    const note=after<before?` (bajó de ${before}; las filas de PRODUCCION no se borran, revísalas a mano)`:'';
    return {ok:true,message:`Registrado. ${c.name}: ${after}/${c.meta}. Te faltan ${pending} piezas este mes.${note}`,data:{client:c.name,done:after,meta:c.meta,pending}};
  });
}

function createRecording(client,text,user){
  return withLock(()=>{
    const c=findClient(client); if(!c)return {ok:false,message:'No encontré el cliente.'};
    const start=parseDateNatural(text), end=new Date(start.getTime()+2*60*60000);
    const eventId=upsertCalendar(null,`${c.name} — GRABACIÓN`,start,end,`ADvibe CONTROL\nCliente: ${c.name}`,[1440,60]);
    sh('GRABACIONES').appendRow([uid('GRB'),c.name,start,fmt(start,'HH:mm'),'','Rodaje','', '', 'Pablo','PLANIFICADA',text,eventId]);
    logAction(user,'GRABACION',c.name,'','PLANIFICADA','OK');
    return {ok:true,message:`Grabación creada: ${c.name}, ${fmt(start,"EEEE d 'de' MMMM 'a las' HH:mm")}.`,eventId};
  });
}

function createTask(client,title,text,user){
  return withLock(()=>{
    const c=client?findClient(client):null, name=c?c.name:(client||'General');
    const start=parseDateNatural(text), end=new Date(start.getTime()+30*60000);
    const eventId=upsertCalendar(null,`TAREA — ${title}`,start,end,`ADvibe CONTROL\n${name}`,[60]);
    sh('TAREAS').appendRow([uid('TSK'),name,title,text,start,fmt(start,'HH:mm'),'ALTA','PENDIENTE','Pablo','ASISTENTE',eventId,'']);
    logAction(user,'TAREA',name,'','PENDIENTE','OK');
    return {ok:true,message:`Tarea creada para ${name} el ${fmt(start,"EEEE d 'a las' HH:mm")}: ${title}.`,eventId};
  });
}

function createPublication(client,text,user){
  return withLock(()=>{
    const c=findClient(client); if(!c)return {ok:false,message:'No encontré el cliente.'};
    const start=parseDateNatural(text), end=new Date(start.getTime()+30*60000);
    const eventId=upsertCalendar(null,`${c.name} — PUBLICACIÓN`,start,end,`ADvibe CONTROL\nPublicación`,[60]);
    sh('PUBLICACIONES').appendRow([uid('PUB'),'',c.name,'Instagram',start,fmt(start,'HH:mm'),'','','PROGRAMADA','',text,eventId]);
    logAction(user,'PUBLICACION',c.name,'','PROGRAMADA','OK');
    return {ok:true,message:`Publicación programada para ${c.name} el ${fmt(start,"EEEE d 'a las' HH:mm")}.`,eventId};
  });
}

// Agenda de `days` días desde hoy+offsetDays: hojas + eventos de Calendar que no creó la app (p. ej. publicaciones recurrentes).
function buildAgendaText(offsetDays,days){
  const start=new Date(); start.setDate(start.getDate()+Number(offsetDays||0));
  const n=Math.max(1,Number(days||1));
  const rows=ADVIBE.AGENDA.map(x=>({x,data:sh(x.sheet).getDataRange().getValues()}));
  const out=[`📅 ADvibe CONTROL — ${fmt(start,'yyyy-MM-dd')}`+(n>1?` (${n} días)`:'')];
  let total=0;
  for(let k=0;k<n;k++){
    const day=new Date(start); day.setDate(start.getDate()+k);
    const key=fmt(day,'yyyy-MM-dd'), items=[], known={};
    rows.forEach(({x,data})=>{
      for(let i=1;i<data.length;i++){
        const r=data[i], dt=r[x.date];
        if(r[x.event]) known[r[x.event]]=true;
        if(dt instanceof Date && fmt(dt,'yyyy-MM-dd')===key && ADVIBE.DONE.indexOf(String(r[x.status]||'').toUpperCase())<0)
          items.push(`${fmt(dt,'HH:mm')} ${x.sheet}: ${r[x.client]||'General'} — ${r[x.label]||''}`);
      }
    });
    try{ calendar().getEventsForDay(day).forEach(ev=>{ if(!known[ev.getId()]) items.push(`${ev.isAllDayEvent()?'todo el día':fmt(ev.getStartTime(),'HH:mm')} CALENDAR: ${ev.getTitle()}`); }); }catch(e){}
    items.sort();
    total+=items.length;
    if(items.length) out.push(`\n${fmt(day,"EEEE d")}:\n• `+items.join('\n• '));
  }
  if(!total) out.push('\nSin pendientes registrados.');
  return out.join('\n');
}

function assistant(prompt,user){
  const t=norm(prompt);
  const client=findClient(prompt);
  const isQuestion=/[¿?]/.test(prompt) || /\b(cuantos|cuantas|cuanto|como va|como vamos)\b/.test(t);
  const aboutPieces=/\b(videos?|reels?|piezas?)\b/.test(t);
  if(client && aboutPieces && isQuestion) return clientStatus(client);
  if(client && aboutPieces && /\b(hice|termine|terminamos|hicimos|otro|otros)\b/.test(t)){
    const q=/\botro\b/.test(t)?(parseQuantity(prompt)||1):parseQuantity(prompt);
    if(!q) return {ok:false,message:`¿Cuántos videos hiciste para ${client.name}? Dímelo con número.`};
    return recordProduction(client.name,q,'ADD',prompt,user);
  }
  if(client && aboutPieces && /\b(ya tiene|ya lleva|llevamos|en total|total)\b/.test(t)){
    const q=parseQuantity(prompt);
    if(q===null) return {ok:false,message:`¿Cuántos videos lleva ${client.name} en total? Dímelo con número.`};
    return recordProduction(client.name,q,'SET',prompt,user);
  }
  if(client && /\b(grabar|grabacion|grabo|grabamos|rodaje)\b/.test(t)) return createRecording(client.name,prompt,user);
  if(client && /\b(publicar|publicacion|publico)\b/.test(t)) return createPublication(client.name,prompt,user);
  if(/\b(que tengo|pendientes?|agenda)\b/.test(t)) {
    if(/\bsemana\b/.test(t)) return {ok:true,message:buildAgendaText(0,7)};
    return {ok:true,message:buildAgendaText(/\bmanana\b/.test(t) && !/\b(la|en la|por la) manana\b/.test(t)?1:0,1)};
  }
  if(/\b(tarea|llamar|editar|comenzar|comienzo|recordar|recuerdame)\b/.test(t)){
    return createTask(client?client.name:null,prompt,prompt,user);
  }
  return {ok:false,message:'No identifiqué con suficiente seguridad la acción. Dime cliente + acción + fecha/cantidad y lo ejecuto.'};
}
function processNaturalLanguage(prompt,userEmail){ return assistant(prompt,userEmail); }

function getDashboardData(){
  const c=sh('CLIENTES').getDataRange().getValues(), cob=sh('COBROS').getDataRange().getValues(), t=sh('TAREAS').getDataRange().getValues();
  let active=0,done=0,pending=0,projected=0,paid=0,balance=0;
  for(let i=1;i<c.length;i++){if(c[i][10]==='ACTIVO')active++;done+=Number(c[i][14])||0;pending+=Number(c[i][15])||0;}
  for(let i=1;i<cob.length;i++){projected+=Number(cob[i][4])||0;paid+=Number(cob[i][6])||0;balance+=Number(cob[i][7])||0;}
  let tasks=0; for(let i=1;i<t.length;i++) if(t[i][7]==='PENDIENTE')tasks++;
  return {active,done,pending,projected,paid,balance,tasks};
}

function refreshCollectionStatuses(){
  const ws=sh('COBROS'), d=ws.getDataRange().getValues(), today=new Date();
  for(let i=1;i<d.length;i++){
    const due=d[i][5], saldo=Number(d[i][7])||0;
    if(due instanceof Date && saldo>0 && due<today) ws.getRange(i+1,9).setValue('VENCIDO');
  }
}
