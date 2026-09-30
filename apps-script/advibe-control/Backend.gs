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
  DONE: ['COMPLETADA','CANCELADA','PUBLICADA','ENTREGADA'],
  APPROVAL_TTL: 600 // segundos que vale una aprobación pendiente
};

// Solo las funciones sin "_" final son llamables desde el navegador (google.script.run) o desde un trigger.
// Todo lo que escribe es privado: la única puerta es prepareAction → executeAction.

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('ADvibe CONTROL')
    .addMetaTag('viewport','width=device-width, initial-scale=1, maximum-scale=1');
}

function ss_(){ return SpreadsheetApp.getActiveSpreadsheet(); }
function sh_(n){ const s=ss_().getSheetByName(n); if(!s) throw new Error('Falta hoja: '+n); return s; }
function now_(){ return new Date(); }
function norm_(v){ return String(v||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim(); }
function uid_(prefix){ return prefix+'-'+Utilities.getUuid().slice(0,8).toUpperCase(); }
function fmt_(d,p){ return Utilities.formatDate(d,ADVIBE.TZ,p); }
function cfg_(key, fallback){ const d=sh_('CONFIGURACION').getDataRange().getValues(); for(let i=1;i<d.length;i++) if(norm_(d[i][0])===norm_(key)) return d[i][1] || fallback; return fallback; }
function currentUser_(){ try{ return Session.getActiveUser().getEmail(); }catch(e){ return ''; } }
function logAction_(user,action,client,beforeValue,afterValue,result){ sh_('LOG').appendRow([now_(),fmt_(now_(),'HH:mm:ss'),user||currentUser_()||'Sistema',action,client||'',beforeValue||'',afterValue||'',result||'OK']); }
// Serializa las escrituras: dos mensajes a la vez no deben pisarse el contador de producción.
function withLock_(fn){ const l=LockService.getScriptLock(); l.waitLock(20000); try{ return fn(); } finally { l.releaseLock(); } }

function setupSystem(){
  ADVIBE.SHEETS.forEach(n=>{ if(!ss_().getSheetByName(n)) ss_().insertSheet(n); });
  setupTriggers();
  return {ok:true,message:'ADvibe CONTROL preparado. Falta autorizar y desplegar la Web App.'};
}

function setupTriggers(){
  ScriptApp.getProjectTriggers().forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyMorning').timeBased().everyDays(1).atHour(8).inTimezone(ADVIBE.TZ).create();
  ScriptApp.newTrigger('dailyNight').timeBased().everyDays(1).atHour(20).inTimezone(ADVIBE.TZ).create();
  ScriptApp.newTrigger('hourlyChecks').timeBased().everyHours(1).inTimezone(ADVIBE.TZ).create();
}

function adminEmail_(){ const e=String(cfg_('EMAIL_ADMIN','')).trim(); if(!e) console.warn('EMAIL_ADMIN vacío en CONFIGURACION: no se envía el resumen.'); return e; }
function dailyMorning(){ const e=adminEmail_(); if(e) MailApp.sendEmail(e, '☀️ ADvibe CONTROL — Hoy', buildAgendaText_(0,1)); }
function dailyNight(){ const e=adminEmail_(); if(e) MailApp.sendEmail(e, '🌙 ADvibe CONTROL — Mañana', buildAgendaText_(1,1)); }
function hourlyChecks(){ refreshCollectionStatuses_(); }

function findClient_(query){
  const q=norm_(query); if(!q) return null;
  const d=sh_('CLIENTES').getDataRange().getValues();
  for(let i=1;i<d.length;i++){
    const name=norm_(d[i][1]);
    if(name && (q.includes(name) || name===q)) return {row:i+1,id:d[i][0],name:d[i][1],meta:Number(d[i][13])||0,done:Number(d[i][14])||0,state:d[i][10],monthly:Number(d[i][8])||0};
  }
  const aliases=[['gualaceo','CLUB SANTA BÁRBARA GUALACEO'],['santa barbara','CLUB SANTA BÁRBARA CUENCA'],['paola','PAOLA MIGUITAMA'],['muebles','MUEBLES IDEAL'],['kamauto','KAMAUTO'],['san lucas','CETAD SAN LUCAS'],['cetad','CETAD SAN LUCAS'],['motorsport','AM MOTORSPORT']];
  for(const a of aliases) if(q.includes(a[0]) && norm_(a[1])!==q) return findClient_(a[1]);
  return null;
}

// Devuelve null si el texto no trae una cantidad explícita: nunca se asume 1 para escribir en la hoja.
function parseQuantity_(text){
  const t=norm_(text);
  const m=t.match(/\b(\d+)\s*(videos?|reels?|piezas?|post|posts)\b/) || t.match(/\b(\d+)\b/);
  if(m) return Number(m[1]);
  const words={un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10};
  for(const k in words) if(new RegExp('\\b'+k+'\\b').test(t)) return words[k];
  return null;
}

const DATE_WORDS_RE_=/\b\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b|\b\d{1,2}\/\d{1,2}\b|\b(a las|a la|las)\s+\d{1,2}(:\d{2})?\b|\b\d{1,2}:\d{2}\b|\b\d{1,2}\s*(am|pm)\b/g;

// Monto de un pago. Prioriza "$200" o "200 dólares"; si no, el primer número que no sea parte de una fecha u hora.
function parseAmount_(text){
  const t=norm_(text).replace(/(\d)\.(\d{3})\b/g,'$1$2');
  const num=s=>Number(s.replace(',','.'));
  let m=t.match(/\$\s*(\d+(?:[.,]\d{1,2})?)/) || t.match(/\b(\d+(?:[.,]\d{1,2})?)\s*(?:\$|dolares?|usd)\b/);
  if(m) return num(m[1]);
  m=t.replace(DATE_WORDS_RE_,' ').match(/\b(\d+(?:[.,]\d{1,2})?)\b/);
  return m?num(m[1]):null;
}

// Fechas y horas en la zona del proyecto (appsscript.json: America/Guayaquil).
// Hora solo si viene marcada ("a las 3", "15:30", "4pm"): un número suelto ("3 videos") no es una hora.
function parseDateNatural_(text){
  const t=norm_(text), d=new Date();
  const meses={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,setiembre:8,octubre:9,noviembre:10,diciembre:11};
  let m;
  if(t.includes('pasado manana')) d.setDate(d.getDate()+2);
  else if(/\bmanana\b/.test(t) && !/\b(la|en la|por la|de la) manana\b/.test(t)) d.setDate(d.getDate()+1);
  else if(/\bayer\b/.test(t)) d.setDate(d.getDate()-1);
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
  let time=null;
  if(tm){ let h=Number(tm[1]), min=Number(tm[2]||0), ap=tm[3]; if(ap==='pm'&&h<12)h+=12; if(ap==='am'&&h===12)h=0; if(!ap && /\b(tarde|noche)\b/.test(t) && h<12) h+=12; time=('0'+h).slice(-2)+':'+('0'+min).slice(-2); }
  return {date:fmt_(d,'yyyy-MM-dd'), time};
}

// "yyyy-MM-dd" + "HH:mm" → Date en la zona del script.
function toDate_(date,time){
  const m=String(date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) throw new Error('Fecha inválida (usa AAAA-MM-DD): '+date);
  const t=String(time||'10:00').match(/^([01]\d|2[0-3]):([0-5]\d)$/); if(!t) throw new Error('Hora inválida (usa HH:mm): '+time);
  const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(t[1]),Number(t[2]),0,0);
  if(d.getMonth()!==Number(m[2])-1) throw new Error('Fecha inexistente: '+date);
  return d;
}

function calendar_(){ const id=String(cfg_('CALENDAR_ID','primary')); return CalendarApp.getCalendarById(id) || CalendarApp.getDefaultCalendar(); }

function upsertCalendar_(eventId,title,start,end,description,reminders){
  const cal=calendar_();
  let ev=null;
  if(eventId){ try{ev=cal.getEventById(eventId);}catch(e){} }
  if(ev){ ev.setTitle(title); ev.setTime(start,end); ev.setDescription(description||'ADvibe CONTROL'); }
  else ev=cal.createEvent(title,start,end,{description:description||'ADvibe CONTROL'});
  (reminders||[60]).forEach(m=>{ try{ev.addPopupReminder(m);}catch(e){} });
  return ev.getId();
}

function cancelCalendar_(eventId){ if(!eventId)return; try{const ev=calendar_().getEventById(eventId);if(ev)ev.deleteEvent();}catch(e){} }

// ---------- Acciones ----------
// El nivel de riesgo lo fija esta tabla, nunca el payload: un modelo o un navegador no pueden rebajarlo.
// LOW: lectura, se ejecuta directo. MEDIUM: escritura, exige token de aprobación. HIGH: además, escribir el monto.
const ACTIONS_ = {
  GET_AGENDA:         {risk:'LOW',    run:d=>({ok:true,message:buildAgendaText_(d.offset,d.days)})},
  GET_CLIENT_SUMMARY: {risk:'LOW',    run:d=>clientStatus_(findClient_(d.client))},
  CREATE_RECORDING:   {risk:'MEDIUM', run:createRecording_},
  CREATE_PUBLICATION: {risk:'MEDIUM', run:createPublication_},
  CREATE_TASK:        {risk:'MEDIUM', run:createTask_},
  RECORD_PRODUCTION:  {risk:'MEDIUM', run:recordProduction_},
  RECORD_PAYMENT:     {risk:'HIGH',   run:recordPayment_}
};

function str_(v,max){ return String(v==null?'':v).trim().slice(0,max||500); }
function intIn_(v,lo,hi,label){ const n=Number(v); if(!Number.isInteger(n)||n<lo||n>hi) throw new Error(`${label} debe ser un entero entre ${lo} y ${hi}.`); return n; }
function needClient_(name){ const c=findClient_(name); if(!c) throw new Error('No encontré el cliente: '+(name||'(vacío)')); return c; }
function when_(d){ return fmt_(d,"EEEE d 'de' MMMM 'a las' HH:mm"); }
function money_(n){ return '$'+Number(n).toFixed(2); }

// Cobros con saldo del cliente. Columnas COBROS: ID, Cliente, Periodo, Concepto, Monto, Fecha vencimiento, Total pagado, Saldo, Estado…
function openCollections_(clientName){
  const d=sh_('COBROS').getDataRange().getValues(), out=[];
  for(let i=1;i<d.length;i++){
    const saldo=Number(d[i][7])||0;
    if(d[i][0] && norm_(d[i][1])===norm_(clientName) && saldo>0) out.push({row:i+1,id:String(d[i][0]),period:d[i][2],concept:d[i][3],amount:Number(d[i][4])||0,paid:Number(d[i][6])||0,saldo});
  }
  return out;
}

// Valida el payload y lo deja en forma canónica, con un resumen escrito por el servidor.
function normalizeAction_(payload){
  const intent=str_(payload&&payload.intent,40), data=(payload&&payload.data)||{};
  if(!ACTIONS_[intent]) throw new Error('Intención no reconocida: '+(intent||'(vacía)'));
  let out, summary;
  switch(intent){
    case 'GET_AGENDA': {
      out={offset:intIn_(data.offset==null?0:data.offset,0,60,'offset'),days:intIn_(data.days==null?1:data.days,1,31,'days')};
      summary=`Agenda (${out.days} día${out.days>1?'s':''})`; break;
    }
    case 'GET_CLIENT_SUMMARY': {
      const c=needClient_(data.client); out={client:c.name}; summary=`Resumen de ${c.name}`; break;
    }
    case 'CREATE_RECORDING': {
      const c=needClient_(data.client), time=data.time||'10:00', start=toDate_(data.date,time);
      out={client:c.name,date:data.date,time,duration_min:intIn_(data.duration_min==null?120:data.duration_min,15,720,'duration_min'),description:str_(data.description)};
      summary=`Grabación · ${c.name} · ${when_(start)} (${out.duration_min} min)`; break;
    }
    case 'CREATE_PUBLICATION': {
      const c=needClient_(data.client), time=data.time||String(cfg_('HORARIO_DEFAULT_PUBLICACION','19:00')), start=toDate_(data.date,time);
      out={client:c.name,date:data.date,time,platform:str_(data.platform||'Instagram',40),description:str_(data.description)};
      summary=`Publicación · ${c.name} · ${out.platform} · ${when_(start)}`; break;
    }
    case 'CREATE_TASK': {
      const c=data.client?needClient_(data.client):null, time=data.time||'10:00', start=toDate_(data.date,time), title=str_(data.title,200);
      if(!title) throw new Error('La tarea necesita un título.');
      out={client:c?c.name:'',date:data.date,time,title,description:str_(data.description||title)};
      summary=`Tarea · ${c?c.name:'General'} · ${when_(start)} · ${title}`; break;
    }
    case 'RECORD_PRODUCTION': {
      const c=needClient_(data.client), mode=data.mode==='SET'?'SET':'ADD';
      const quantity=intIn_(data.quantity,mode==='SET'?0:1,200,'quantity');
      const after=mode==='SET'?quantity:c.done+quantity;
      out={client:c.name,quantity,mode,type:str_(data.type||'VIDEO',40).toUpperCase(),description:str_(data.description)};
      summary=mode==='SET'?`Producción · ${c.name} · fijar total en ${quantity} (hoy ${c.done}/${c.meta})`:`Producción · ${c.name} · +${quantity} ${out.type} (quedaría ${after}/${c.meta})`; break;
    }
    case 'RECORD_PAYMENT': {
      const c=needClient_(data.client), amount=Math.round(Number(data.amount)*100)/100;
      if(!(amount>0) || amount>100000) throw new Error('Monto inválido: '+data.amount);
      const date=data.date||fmt_(now_(),'yyyy-MM-dd'); toDate_(date,'12:00');
      const open=openCollections_(c.name);
      let cobro=null;
      if(data.cobro_id){ cobro=open.find(x=>x.id===String(data.cobro_id)); if(!cobro) throw new Error(`El cobro ${data.cobro_id} no existe o no tiene saldo para ${c.name}.`); }
      else if(open.length===1) cobro=open[0];
      else if(open.length>1) throw new Error(`${c.name} tiene ${open.length} cobros con saldo. Indica cuál: `+open.map(x=>`${x.id} (${x.period} ${x.concept}, saldo ${money_(x.saldo)})`).join('; '));
      if(cobro && amount>cobro.saldo+0.005) throw new Error(`El pago (${money_(amount)}) supera el saldo de ${cobro.id} (${money_(cobro.saldo)}).`);
      out={client:c.name,amount,date,method:str_(data.method,40),reference:str_(data.reference,100),notes:str_(data.notes),cobro_id:cobro?cobro.id:''};
      summary=`Pago · ${c.name} · ${money_(amount)} · ${date}`+(cobro?` · cobro ${cobro.id} (saldo ${money_(cobro.saldo)} → ${money_(cobro.saldo-amount)})`:' · sin cobro asociado (COBROS no tiene saldo abierto para este cliente)');
      break;
    }
  }
  return {intent,risk_level:ACTIONS_[intent].risk,requires_approval:ACTIONS_[intent].risk!=='LOW',summary,data:out};
}

// Puerta 1: valida una intención (del parser local o de Claude) y, si escribe, emite un token de un solo uso.
function prepareAction(payload){
  try{
    const a=normalizeAction_(payload);
    if(a.requires_approval){
      a.token=Utilities.getUuid();
      CacheService.getUserCache().put('approval:'+a.token, JSON.stringify(a), ADVIBE.APPROVAL_TTL);
      if(a.risk_level==='HIGH') a.confirm_hint=`Escribe el monto (${a.data.amount}) para confirmar.`;
    }
    return Object.assign({success:true}, a);
  }catch(e){
    return {success:false,error:String(e.message||e)};
  }
}

// Puerta 2: ejecuta. Las lecturas se validan y corren; las escrituras solo corren con un token vigente,
// y lo que se ejecuta es lo que se aprobó (guardado en el servidor), no lo que mande el navegador.
function executeAction(payload){
  try{
    const intent=str_(payload&&payload.intent,40), spec=ACTIONS_[intent];
    if(!spec) return {success:false,error:'Intención no reconocida: '+(intent||'(vacía)')};
    let action;
    if(spec.risk==='LOW') action=normalizeAction_(payload);
    else {
      const key='approval:'+str_(payload.token,64), cache=CacheService.getUserCache();
      const check=withLock_(()=>{
        const raw=payload.token && cache.get(key);
        if(!raw) return {error:'La aprobación caducó o ya se usó. Vuelve a pedir la acción.'};
        const a=JSON.parse(raw);
        if(a.intent!==intent) return {error:'La aprobación no corresponde a esta acción.'};
        if(a.risk_level==='HIGH' && Math.abs(Number(String(payload.confirmation||'').replace(',','.'))-a.data.amount)>0.005)
          return {error:'Confirmación incorrecta: escribe el monto exacto.'};
        cache.remove(key);
        return {action:a};
      });
      if(check.error) return {success:false,error:check.error};
      action=check.action;
    }
    const r=spec.run(action.data, currentUser_());
    return r.ok?{success:true,message:r.message,result:r.data||null}:{success:false,error:r.message};
  }catch(e){
    console.error('executeAction: '+(e.stack||e));
    return {success:false,error:String(e.message||e)};
  }
}

function clientStatus_(c){
  if(!c) return {ok:false,message:'No encontré el cliente.'};
  const pending=Math.max(0,c.meta-c.done);
  return {ok:true,message:`${c.name}: ${c.done}/${c.meta} piezas este mes. Faltan ${pending}.`+(c.meta?'':' (Meta de contenido en 0: revisa CLIENTES.)'),data:{client:c.name,done:c.done,meta:c.meta,pending}};
}

function recordProduction_(d, user){
  return withLock_(()=>{
    const c=findClient_(d.client); if(!c) return {ok:false,message:'No encontré el cliente.'};
    const before=c.done, after=d.mode==='SET'?d.quantity:before+d.quantity;
    if(after<0) return {ok:false,message:'La cantidad no puede quedar negativa.'};
    const pending=Math.max(0,c.meta-after), added=Math.max(0,after-before);
    sh_('CLIENTES').getRange(c.row,15).setValue(after);
    sh_('CLIENTES').getRange(c.row,16).setValue(pending);
    for(let i=0;i<added;i++) sh_('PRODUCCION').appendRow([uid_('PRD'),c.name,fmt_(now_(),'yyyy-MM'),before+i+1,d.type,d.description,'','','LISTO',now_(),'','','','','Instagram','Pablo','','','Asistente']);
    logAction_(user,d.mode==='SET'?'PRODUCCION_AJUSTE':'PRODUCCION',c.name,before,after,'OK');
    const note=after<before?` (bajó de ${before}; las filas de PRODUCCION no se borran, revísalas a mano)`:'';
    return {ok:true,message:`Registrado. ${c.name}: ${after}/${c.meta}. Te faltan ${pending} piezas este mes.${note}`,data:{client:c.name,done:after,meta:c.meta,pending}};
  });
}

function createRecording_(d, user){
  return withLock_(()=>{
    const start=toDate_(d.date,d.time), end=new Date(start.getTime()+d.duration_min*60000);
    const eventId=upsertCalendar_(null,`${d.client} — GRABACIÓN`,start,end,`ADvibe CONTROL\nCliente: ${d.client}\n${d.description}`,[1440,60]);
    sh_('GRABACIONES').appendRow([uid_('GRB'),d.client,start,fmt_(start,'HH:mm'),'','Rodaje','','','Pablo','PLANIFICADA',d.description,eventId]);
    logAction_(user,'GRABACION',d.client,'','PLANIFICADA','OK');
    return {ok:true,message:`Grabación creada: ${d.client}, ${when_(start)}.`,data:{eventId}};
  });
}

function createTask_(d, user){
  return withLock_(()=>{
    const name=d.client||'General', start=toDate_(d.date,d.time), end=new Date(start.getTime()+30*60000);
    const eventId=upsertCalendar_(null,`TAREA — ${d.title}`,start,end,`ADvibe CONTROL\n${name}`,[60]);
    sh_('TAREAS').appendRow([uid_('TSK'),name,d.title,d.description,start,fmt_(start,'HH:mm'),'ALTA','PENDIENTE','Pablo','ASISTENTE',eventId,'']);
    logAction_(user,'TAREA',name,'','PENDIENTE','OK');
    return {ok:true,message:`Tarea creada para ${name} el ${fmt_(start,"EEEE d 'a las' HH:mm")}: ${d.title}.`,data:{eventId}};
  });
}

function createPublication_(d, user){
  return withLock_(()=>{
    const start=toDate_(d.date,d.time), end=new Date(start.getTime()+30*60000);
    const eventId=upsertCalendar_(null,`${d.client} — PUBLICACIÓN`,start,end,`ADvibe CONTROL\nPublicación ${d.platform}`,[60]);
    sh_('PUBLICACIONES').appendRow([uid_('PUB'),'',d.client,d.platform,start,fmt_(start,'HH:mm'),'','','PROGRAMADA','',d.description,eventId]);
    logAction_(user,'PUBLICACION',d.client,'','PROGRAMADA','OK');
    return {ok:true,message:`Publicación programada para ${d.client} (${d.platform}) el ${fmt_(start,"EEEE d 'a las' HH:mm")}.`,data:{eventId}};
  });
}

// PAGOS: ID, Cobro ID, Cliente, Fecha, Monto, Método, Referencia, Nota.
// Si hay cobro asociado, actualiza Total pagado, Saldo y Estado, salvo las celdas que tengan fórmula.
function recordPayment_(d, user){
  return withLock_(()=>{
    let cobro=null;
    if(d.cobro_id){
      cobro=openCollections_(d.client).find(x=>x.id===d.cobro_id);
      if(!cobro) return {ok:false,message:`El cobro ${d.cobro_id} ya no tiene saldo. No se registró nada.`};
      if(d.amount>cobro.saldo+0.005) return {ok:false,message:`El saldo de ${cobro.id} cambió a ${money_(cobro.saldo)}. No se registró nada.`};
    }
    const id=uid_('PAG');
    sh_('PAGOS').appendRow([id,d.cobro_id,d.client,toDate_(d.date,'12:00'),d.amount,d.method,d.reference,d.notes]);
    let tail=' Sin cobro asociado: revisa COBROS.';
    if(cobro){
      const ws=sh_('COBROS'), paid=Math.round((cobro.paid+d.amount)*100)/100, saldo=Math.round((cobro.saldo-d.amount)*100)/100;
      const put=(col,v)=>{ const r=ws.getRange(cobro.row,col); if(!r.getFormula()) r.setValue(v); };
      put(7,paid); put(8,saldo); put(9,saldo<=0?'PAGADO':'PARCIAL');
      tail=` Cobro ${cobro.id}: saldo ${money_(saldo)}.`;
    }
    logAction_(user,'PAGO',d.client,cobro?cobro.saldo:'',d.amount,'OK '+id);
    return {ok:true,message:`Pago registrado: ${d.client}, ${money_(d.amount)} (${d.date}).${tail}`,data:{paymentId:id,cobroId:d.cobro_id}};
  });
}

// Agenda de `days` días desde hoy+offsetDays: hojas + eventos de Calendar que no creó la app (p. ej. publicaciones recurrentes).
function buildAgendaText_(offsetDays,days){
  const start=new Date(); start.setDate(start.getDate()+Number(offsetDays||0));
  const n=Math.max(1,Number(days||1));
  const rows=ADVIBE.AGENDA.map(x=>({x,data:sh_(x.sheet).getDataRange().getValues()}));
  const out=[`📅 ADvibe CONTROL — ${fmt_(start,'yyyy-MM-dd')}`+(n>1?` (${n} días)`:'')];
  let total=0;
  for(let k=0;k<n;k++){
    const day=new Date(start); day.setDate(start.getDate()+k);
    const key=fmt_(day,'yyyy-MM-dd'), items=[], known={};
    rows.forEach(({x,data})=>{
      for(let i=1;i<data.length;i++){
        const r=data[i], dt=r[x.date];
        if(r[x.event]) known[r[x.event]]=true;
        if(dt instanceof Date && fmt_(dt,'yyyy-MM-dd')===key && ADVIBE.DONE.indexOf(String(r[x.status]||'').toUpperCase())<0)
          items.push(`${fmt_(dt,'HH:mm')} ${x.sheet}: ${r[x.client]||'General'} — ${r[x.label]||''}`);
      }
    });
    try{ calendar_().getEventsForDay(day).forEach(ev=>{ if(!known[ev.getId()]) items.push(`${ev.isAllDayEvent()?'todo el día':fmt_(ev.getStartTime(),'HH:mm')} CALENDAR: ${ev.getTitle()}`); }); }catch(e){}
    items.sort();
    total+=items.length;
    if(items.length) out.push(`\n${fmt_(day,"EEEE d")}:\n• `+items.join('\n• '));
  }
  if(!total) out.push('\nSin pendientes registrados.');
  return out.join('\n');
}

// Parser local: convierte el texto en una intención estructurada ({intent, data}). No escribe nada.
// Es el mismo formato que debe producir Claude; ambos pasan por prepareAction.
function planFromText_(prompt){
  const t=norm_(prompt);
  const client=findClient_(prompt);
  const isQuestion=/[¿?]/.test(prompt) || /\b(cuantos|cuantas|cuanto|como va|como vamos)\b/.test(t);
  const aboutPieces=/\b(videos?|reels?|piezas?)\b/.test(t);
  const when=parseDateNatural_(prompt);
  if(client && aboutPieces && isQuestion) return {intent:'GET_CLIENT_SUMMARY',data:{client:client.name}};
  if(client && /\b(pago|pagaron|abono|abonaron|cobre|recibi|deposito|transfirio|transferencia)\b/.test(t) && !aboutPieces){
    const amount=parseAmount_(prompt);
    if(amount===null) return {error:`¿Cuánto pagó ${client.name}? Dímelo con número.`};
    const method=/\befectivo\b/.test(t)?'Efectivo':/\b(transferencia|transfirio)\b/.test(t)?'Transferencia':/\bdeposito\b/.test(t)?'Depósito':'';
    return {intent:'RECORD_PAYMENT',data:{client:client.name,amount,date:when.date,method,notes:prompt}};
  }
  if(client && aboutPieces && /\b(hice|termine|terminamos|hicimos|otro|otros)\b/.test(t)){
    const q=/\botro\b/.test(t)?(parseQuantity_(prompt)||1):parseQuantity_(prompt);
    if(!q) return {error:`¿Cuántos videos hiciste para ${client.name}? Dímelo con número.`};
    return {intent:'RECORD_PRODUCTION',data:{client:client.name,quantity:q,mode:'ADD',description:prompt}};
  }
  if(client && aboutPieces && /\b(ya tiene|ya lleva|llevamos|en total|total)\b/.test(t)){
    const q=parseQuantity_(prompt);
    if(q===null) return {error:`¿Cuántos videos lleva ${client.name} en total? Dímelo con número.`};
    return {intent:'RECORD_PRODUCTION',data:{client:client.name,quantity:q,mode:'SET',description:prompt}};
  }
  if(client && /\b(grabar|grabacion|grabo|grabamos|rodaje)\b/.test(t)) return {intent:'CREATE_RECORDING',data:{client:client.name,date:when.date,time:when.time||'10:00',description:prompt}};
  if(client && /\b(publicar|publicacion|publico)\b/.test(t)) return {intent:'CREATE_PUBLICATION',data:{client:client.name,date:when.date,time:when.time||'10:00',description:prompt}};
  if(/\b(que tengo|pendientes?|agenda)\b/.test(t)) {
    if(/\bsemana\b/.test(t)) return {intent:'GET_AGENDA',data:{offset:0,days:7}};
    return {intent:'GET_AGENDA',data:{offset:/\bmanana\b/.test(t) && !/\b(la|en la|por la) manana\b/.test(t)?1:0,days:1}};
  }
  if(/\b(tarea|llamar|editar|comenzar|comienzo|recordar|recuerdame)\b/.test(t)){
    return {intent:'CREATE_TASK',data:{client:client?client.name:'',title:prompt,date:when.date,time:when.time||'10:00',description:prompt}};
  }
  return {error:'No identifiqué con suficiente seguridad la acción. Dime cliente + acción + fecha/cantidad y lo preparo.'};
}

// Texto → intención validada, lista para mostrar (y aprobar, si escribe). No ejecuta nada.
function processNaturalLanguage(prompt){
  try{
    const plan=planFromText_(String(prompt||''));
    if(plan.error) return {success:false,error:plan.error};
    return prepareAction(plan);
  }catch(e){
    return {success:false,error:String(e.message||e)};
  }
}

function getDashboardData(){
  const c=sh_('CLIENTES').getDataRange().getValues(), cob=sh_('COBROS').getDataRange().getValues(), t=sh_('TAREAS').getDataRange().getValues();
  let active=0,done=0,pending=0,projected=0,paid=0,balance=0;
  for(let i=1;i<c.length;i++){if(c[i][10]==='ACTIVO')active++;done+=Number(c[i][14])||0;pending+=Number(c[i][15])||0;}
  for(let i=1;i<cob.length;i++){projected+=Number(cob[i][4])||0;paid+=Number(cob[i][6])||0;balance+=Number(cob[i][7])||0;}
  let tasks=0; for(let i=1;i<t.length;i++) if(t[i][7]==='PENDIENTE')tasks++;
  return {active,done,pending,projected,paid,balance,tasks};
}

function refreshCollectionStatuses_(){
  const ws=sh_('COBROS'), d=ws.getDataRange().getValues(), today=new Date();
  for(let i=1;i<d.length;i++){
    const due=d[i][5], saldo=Number(d[i][7])||0;
    if(due instanceof Date && saldo>0 && due<today) ws.getRange(i+1,9).setValue('VENCIDO');
  }
}
