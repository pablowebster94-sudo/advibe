// ADvibe Bot: asistente de Telegram sobre la hoja oficial ADvibe CONTROL.
// Hace tres cosas: responde qué falta, registra cobros (con confirmación) y avisa solo de pagos vencidos y recordatorios.
// Configuración en Propiedades del script (ver README.md).

const BOT = {
  TZ: 'America/Guayaquil',
  SHEET_ID: '137EdqtLXOtB0pU1Yhqb9VpigWcyQl4lW0hOCCD_0DNc',
  CLAUDE_MODEL: 'claude-opus-5-5',
  GEMINI_MODEL: 'gemini-2.5-flash',
  // Septiembre sigue sin conciliar (hojas nº 5 y nº 9 no cuadran): el bot solo persigue cobros desde aquí.
  COBROS_DESDE: '2026-10',
  DONE: ['COMPLETADA', 'CANCELADA'],
  DIAS: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
};

// ---------- utilidades ----------

function prop(k, fallback) { const v = PropertiesService.getScriptProperties().getProperty(k); return v === null || v === '' ? fallback : v; }
function setProp(k, v) { PropertiesService.getScriptProperties().setProperty(k, String(v)); }
function book() { return SpreadsheetApp.openById(prop('SHEET_ID', BOT.SHEET_ID)); }
function sheet(n) { const s = book().getSheetByName(n); if (!s) throw new Error('Falta la pestaña ' + n); return s; }
function rows(n) { return sheet(n).getDataRange().getValues(); }
function fmt(d, p) { return Utilities.formatDate(d, BOT.TZ, p); }
function norm(v) { return String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
function uid(prefix) { return prefix + '-' + Utilities.getUuid().slice(0, 8).toUpperCase(); }
function money(n) { return '$' + (Math.round(Number(n) * 100) / 100); }
function withLock(fn) { const l = LockService.getScriptLock(); l.waitLock(20000); try { return fn(); } finally { l.releaseLock(); } }

function isDate(v) { return Object.prototype.toString.call(v) === '[object Date]'; }
function dayKey(d) { return fmt(d, 'yyyy-MM-dd'); }
// Días entre dos claves yyyy-MM-dd (b - a), sin depender de la hora ni del huso.
function daysBetween(a, b) {
  const p = s => s.split('-').map(Number);
  const [y1, m1, d1] = p(a), [y2, m2, d2] = p(b);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}
function periodKey(v) {
  if (isDate(v)) return fmt(v, 'yyyy-MM');
  const m = String(v || '').match(/(\d{4})-(\d{1,2})/);
  return m ? m[1] + '-' + ('0' + m[2]).slice(-2) : '';
}
function periodsFrom(from, to) {
  const out = []; let [y, m] = from.split('-').map(Number); const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) { out.push(y + '-' + ('0' + m).slice(-2)); m++; if (m > 12) { m = 1; y++; } }
  return out;
}
// Fecha de vencimiento de un periodo: el día de pago, sin pasarse del último día del mes.
function dueKey(period, payDay) {
  const day = Number(payDay); if (!day) return '';
  const [y, m] = period.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return period + '-' + ('0' + Math.min(day, last)).slice(-2);
}
function prettyDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return BOT.DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] + ' ' + d + '/' + m;
}

// ---------- datos de la hoja ----------

// CLIENTES: A ID · B Cliente · I Mensualidad · J Día de pago · K Estado
function readClients(data) {
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i]; if (!r[0] || !r[1]) continue;
    out.push({ id: String(r[0]), name: String(r[1]), monthly: Number(r[8]) || 0, payDay: Number(r[9]) || 0, active: norm(r[10]) === 'activo' });
  }
  return out;
}

// COBROS: A ID · B Cliente · C Periodo · E Monto · G Total pagado · H Saldo · I Estado
function findCobro(cobros, clientName, period) {
  for (let i = 1; i < cobros.length; i++) {
    if (norm(cobros[i][1]) === norm(clientName) && periodKey(cobros[i][2]) === period) return { row: i + 1, r: cobros[i] };
  }
  return null;
}

// Cobros con saldo desde COBROS_DESDE hasta el mes actual, con vencimiento hasta dentro de `ahead` días.
function pendingPayments(clientRows, cobros, today, from, ahead) {
  const todayKey = dayKey(today), out = [];
  readClients(clientRows).filter(c => c.active && c.monthly > 0).forEach(c => {
    periodsFrom(from, fmt(today, 'yyyy-MM')).forEach(period => {
      const due = dueKey(period, c.payDay);
      const found = findCobro(cobros, c.name, period);
      const amount = found ? Number(found.r[4]) || c.monthly : c.monthly;
      const paid = found ? Number(found.r[6]) || 0 : 0;
      const balance = Math.max(0, amount - paid);
      if (!balance) return;
      const days = due ? daysBetween(todayKey, due) : null;
      if (days !== null && days > ahead) return;
      out.push({ clientId: c.id, client: c.name, period, amount, paid, balance, due, days });
    });
  });
  return out.sort((a, b) => (a.days === null ? 99 : a.days) - (b.days === null ? 99 : b.days));
}

// TAREAS: A ID · B Cliente · C Título · E Fecha · F Hora · H Estado · L Notas
function readTasks(data) {
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i]; if (!r[0] || !r[2]) continue;
    if (BOT.DONE.indexOf(String(r[7] || '').toUpperCase()) >= 0) continue;
    const date = isDate(r[4]) ? r[4] : null;
    // La hora va como texto en F. Las filas de la app anterior guardan la hora en la fecha de E
    // (una hora suelta convertida por Sheets se lee con el desfase histórico de 1899, así que se evita).
    let time = typeof r[5] === 'string' ? r[5].trim() : '';
    if (!time && date && fmt(date, 'HH:mm') !== '00:00') time = fmt(date, 'HH:mm');
    out.push({ row: i + 1, id: String(r[0]), client: String(r[1] || ''), title: String(r[2]), date: date ? dayKey(date) : '', time, notes: String(r[11] || '') });
  }
  return out;
}

function pendingTasks(taskRows, today, ahead) {
  const todayKey = dayKey(today);
  return readTasks(taskRows)
    .map(t => Object.assign(t, { days: t.date ? daysBetween(todayKey, t.date) : null }))
    .filter(t => t.days === null || t.days <= ahead)
    .sort((a, b) => ((a.days === null ? 99 : a.days) - (b.days === null ? 99 : b.days)) || a.time.localeCompare(b.time));
}

function whenText(days, key) {
  if (days === null) return 'sin fecha';
  if (days < 0) return 'venció hace ' + (-days) + (days === -1 ? ' día' : ' días');
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  return prettyDay(key);
}

function summaryText(clientRows, cobros, taskRows, today) {
  const pays = pendingPayments(clientRows, cobros, today, prop('COBROS_DESDE', BOT.COBROS_DESDE), 7);
  const tasks = pendingTasks(taskRows, today, 1);
  const out = ['📋 ' + prettyDay(dayKey(today))];
  const late = pays.filter(p => p.days !== null && p.days < 0), soon = pays.filter(p => !(p.days !== null && p.days < 0));
  if (late.length) out.push('\n🔴 Cobros vencidos:\n' + late.map(p => `• ${p.client} — ${money(p.balance)} (${p.period}, ${whenText(p.days, p.due)})`).join('\n'));
  if (soon.length) out.push('\n🟡 Cobros próximos:\n' + soon.map(p => `• ${p.client} — ${money(p.balance)} (${whenText(p.days, p.due)})`).join('\n'));
  if (tasks.length) out.push('\n✅ Tareas:\n' + tasks.map(t => `• ${t.title}${t.client ? ' (' + t.client + ')' : ''} — ${whenText(t.days, t.date)}${t.time ? ' ' + t.time : ''} [${t.id}]`).join('\n'));
  if (!late.length && !soon.length && !tasks.length) out.push('\nNada pendiente. 🙌');
  return out.join('\n');
}

function currentSummary() { return summaryText(rows('CLIENTES'), rows('COBROS'), rows('TAREAS'), new Date()); }

// ---------- escrituras ----------

// Cobro más antiguo con saldo (desde COBROS_DESDE) o, si no hay, el del mes actual.
function defaultPeriod(client, cobros, today) {
  const ps = periodsFrom(prop('COBROS_DESDE', BOT.COBROS_DESDE), fmt(today, 'yyyy-MM'));
  for (const p of ps) {
    const f = findCobro(cobros, client.name, p);
    if (!f || (Number(f.r[4]) || client.monthly) - (Number(f.r[6]) || 0) > 0) return p;
  }
  return fmt(today, 'yyyy-MM');
}

function planPayment(input) {
  const client = readClients(rows('CLIENTES')).find(c => c.id === input.cliente_id);
  if (!client) return { error: 'No encuentro el cliente ' + input.cliente_id };
  const cobros = rows('COBROS');
  const period = periodKey(input.periodo) || defaultPeriod(client, cobros, new Date());
  const found = findCobro(cobros, client.name, period);
  const balance = (found ? Number(found.r[4]) || client.monthly : client.monthly) - (found ? Number(found.r[6]) || 0 : 0);
  const amount = Number(input.monto) > 0 ? Number(input.monto) : balance;
  if (!(amount > 0)) return { error: `${client.name} no tiene saldo pendiente en ${period}. Dime el monto si es otro pago.` };
  return { clientId: client.id, client: client.name, period, amount, balance };
}

function applyPayment(plan) {
  return withLock(() => {
    const client = readClients(rows('CLIENTES')).find(c => c.id === plan.clientId);
    const ws = sheet('COBROS');
    let found = findCobro(ws.getDataRange().getValues(), plan.client, plan.period);
    if (!found) {
      const due = dueKey(plan.period, client.payDay);
      ws.appendRow([uid('COB'), plan.client, '', 'Mensualidad', client.monthly, '', 0, client.monthly, 'PENDIENTE', '', 'Creado por ADvibe Bot']);
      const row = ws.getLastRow();
      ws.getRange(row, 3).setNumberFormat('@').setValue(plan.period); // texto: si no, Sheets lo convierte en fecha
      if (due) { const [y, m, d] = due.split('-').map(Number); ws.getRange(row, 6).setValue(new Date(y, m - 1, d)); }
      found = { row, r: ws.getRange(row, 1, 1, 11).getValues()[0] };
    }
    const amount = Number(found.r[4]) || client.monthly;
    const paid = (Number(found.r[6]) || 0) + plan.amount;
    const balance = Math.max(0, amount - paid);
    const state = balance <= 0 ? 'PAGADO' : 'ABONO';
    ws.getRange(found.row, 7, 1, 3).setValues([[paid, balance, state]]);
    sheet('PAGOS').appendRow([uid('PAG'), found.r[0], plan.client, new Date(), plan.amount, '', '', 'Registrado por Telegram']);
    sheet('LOG').appendRow([new Date(), fmt(new Date(), 'HH:mm:ss'), 'ADvibe Bot', 'PAGO', plan.client, money(amount - paid + plan.amount), money(balance), state]);
    return `✅ Registrado: ${plan.client} pagó ${money(plan.amount)} (${plan.period}). ` + (balance ? `Queda saldo ${money(balance)}.` : 'Mes al día.');
  });
}

function createReminder(input) {
  const m = String(input.fecha || '').match(/^(\d{4})-(\d{2})-(\d{2})$/), h = String(input.hora || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 'Falta la fecha (yyyy-MM-dd).';
  const hour = h ? ('0' + h[1]).slice(-2) + ':' + h[2] : '';
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h ? Number(h[1]) : 9, h ? Number(h[2]) : 0);
  const client = input.cliente_id ? readClients(rows('CLIENTES')).find(c => c.id === input.cliente_id) : null;
  const id = uid('TSK');
  withLock(() => {
    const ws = sheet('TAREAS');
    ws.appendRow([id, client ? client.name : '', String(input.titulo), '', date, '', 'MEDIA', 'PENDIENTE', 'Pablo', 'TELEGRAM', '', '']);
    ws.getRange(ws.getLastRow(), 6).setNumberFormat('@').setValue(hour);
  });
  return `Recordatorio ${id} creado para ${prettyDay(m[1] + '-' + m[2] + '-' + m[3])}${hour ? ' a las ' + hour : ' (sin hora: aviso en el resumen de la mañana)'}.`;
}

function setTaskState(id, state) {
  return withLock(() => {
    const ws = sheet('TAREAS'), d = ws.getDataRange().getValues();
    for (let i = 1; i < d.length; i++) if (String(d[i][0]) === id) { ws.getRange(i + 1, 8).setValue(state); return `Tarea ${id} → ${state}: ${d[i][2]}`; }
    return 'No encuentro la tarea ' + id;
  });
}

// ---------- Claude ----------

function systemPrompt(clients, now) {
  return [
    'Eres el asistente personal de Pablo, dueño de la agencia AdVibe (marketing y contenido) en Ecuador. Le hablas por Telegram como un empleado de confianza: en español, breve, directo, sin relleno ni markdown.',
    `Ahora: ${prettyDay(dayKey(now))} ${fmt(now, 'yyyy-MM-dd HH:mm')} (America/Guayaquil). Moneda: USD.`,
    'Clientes (ID · nombre · estado · mensualidad · día de pago):',
    clients.map(c => `${c.id} · ${c.name} · ${c.active ? 'ACTIVO' : 'sin estado'} · $${c.monthly} · ${c.payDay || 'sin definir'}`).join('\n'),
    'Reglas:',
    '- Para saber qué falta, qué se debe o qué hay hoy, usa ver_pendientes y resume lo importante primero (vencidos).',
    '- Si Pablo dice que cobró o que un cliente pagó, usa registrar_pago. No queda registrado hasta que él pulse el botón de confirmar; díselo en una línea.',
    '- Si pide que le recuerdes algo, usa crear_recordatorio con fecha y hora absolutas calculadas desde ahora. "En la mañana" = 09:00, "en la tarde" = 15:00, "en la noche" = 19:00.',
    '- Si no está claro a qué cliente se refiere (por ejemplo Muebles Ideal y Paola Miguitama pueden ser el mismo negocio), pregunta antes de registrar.',
    '- Nunca inventes montos, pagos ni fechas. Si te falta un dato, pregúntalo.',
    '- Si piden algo que no puedes hacer todavía (videos, campañas, enviar mensajes a clientes), dilo en una línea.'
  ].join('\n');
}

function tools(clients) {
  const ids = clients.map(c => c.id);
  return [
    { name: 'ver_pendientes', description: 'Cobros vencidos y próximos (7 días) y tareas/recordatorios pendientes de hoy y mañana, leídos de la hoja ADvibe CONTROL.', input_schema: { type: 'object', properties: {} } },
    {
      name: 'registrar_pago', description: 'Prepara el registro de un pago de un cliente. Pablo lo confirma con un botón. Sin monto, usa el saldo pendiente; sin periodo, el cobro más antiguo con saldo.',
      input_schema: { type: 'object', properties: {
        cliente_id: { type: 'string', enum: ids },
        monto: { type: 'number', description: 'USD. Omitir si no lo dijo.' },
        periodo: { type: 'string', description: 'yyyy-MM del mes que paga. Omitir si no lo dijo.' }
      }, required: ['cliente_id'] }
    },
    {
      name: 'crear_recordatorio', description: 'Crea una tarea en la hoja; el bot avisa a Pablo por Telegram a esa hora.',
      input_schema: { type: 'object', properties: {
        titulo: { type: 'string' },
        fecha: { type: 'string', description: 'yyyy-MM-dd' },
        hora: { type: 'string', description: 'HH:mm en 24 h. Omitir si no dio hora.' },
        cliente_id: { type: 'string', enum: ids }
      }, required: ['titulo', 'fecha'] }
    },
    {
      name: 'cerrar_tarea', description: 'Marca una tarea como hecha o cancelada. El ID aparece entre corchetes en ver_pendientes.',
      input_schema: { type: 'object', properties: { tarea_id: { type: 'string' }, estado: { type: 'string', enum: ['COMPLETADA', 'CANCELADA'] } }, required: ['tarea_id', 'estado'] }
    }
  ];
}

function callClaude(body) {
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': prop('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'anthropic-beta': 'server-side-fallback-2026-07-01' },
    payload: JSON.stringify(body)
  });
  const json = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) throw new Error('Claude ' + res.getResponseCode() + ': ' + (json.error && json.error.message));
  return json;
}

// Devuelve {text, confirm}; confirm es un pago pendiente de botón.
function runAgent(userText) {
  const clients = readClients(rows('CLIENTES'));
  const now = new Date();
  const messages = [{ role: 'user', content: userText }];
  let confirm = null;
  for (let turn = 0; turn < 6; turn++) {
    const res = callClaude({
      model: prop('CLAUDE_MODEL', BOT.CLAUDE_MODEL), max_tokens: 8000, output_config: { effort: 'low' }, fallbacks: 'default',
      system: systemPrompt(clients, now), tools: tools(clients), messages
    });
    if (res.stop_reason === 'refusal') return { text: 'No puedo ayudar con eso.', confirm };
    const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    const uses = res.content.filter(b => b.type === 'tool_use');
    if (res.stop_reason !== 'tool_use' || !uses.length) return { text: text || 'Listo.', confirm };
    messages.push({ role: 'assistant', content: res.content });
    messages.push({ role: 'user', content: uses.map(u => {
      try {
        let out;
        if (u.name === 'ver_pendientes') out = currentSummary();
        else if (u.name === 'registrar_pago') {
          const plan = planPayment(u.input || {});
          if (plan.error) out = plan.error;
          else { confirm = plan; out = `Preparado, pendiente del botón de Pablo: ${plan.client} ${money(plan.amount)} periodo ${plan.period} (saldo ${money(plan.balance)}).`; }
        }
        else if (u.name === 'crear_recordatorio') out = createReminder(u.input || {});
        else if (u.name === 'cerrar_tarea') out = setTaskState(String(u.input.tarea_id), u.input.estado);
        else out = 'Herramienta desconocida';
        return { type: 'tool_result', tool_use_id: u.id, content: out };
      } catch (err) {
        return { type: 'tool_result', tool_use_id: u.id, content: 'Error: ' + err.message, is_error: true };
      }
    }) });
  }
  return { text: 'Me enredé con esa petición. ¿Me la dices de otra forma?', confirm };
}

// ---------- voz ----------

function transcribe(fileId) {
  const token = prop('TELEGRAM_TOKEN');
  const info = tg('getFile', { file_id: fileId });
  const audio = UrlFetchApp.fetch(`https://api.telegram.org/file/bot${token}/${info.result.file_path}`).getBlob();
  const model = prop('GEMINI_MODEL', BOT.GEMINI_MODEL);
  const res = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${prop('GEMINI_API_KEY')}`, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ contents: [{ parts: [
      { text: 'Transcribe literalmente este audio en español de Ecuador. Devuelve solo el texto, sin comentarios.' },
      { inline_data: { mime_type: 'audio/ogg', data: Utilities.base64Encode(audio.getBytes()) } }
    ] }] })
  });
  const json = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) throw new Error('Transcripción ' + res.getResponseCode() + ': ' + (json.error && json.error.message));
  return ((json.candidates || [])[0] || { content: { parts: [] } }).content.parts.map(p => p.text || '').join(' ').trim();
}

// ---------- Telegram ----------

function tg(method, payload) {
  const res = UrlFetchApp.fetch(`https://api.telegram.org/bot${prop('TELEGRAM_TOKEN')}/${method}`, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(payload)
  });
  return JSON.parse(res.getContentText());
}
function send(chatId, text, buttons) {
  const p = { chat_id: chatId, text: String(text).slice(0, 4000) };
  if (buttons) p.reply_markup = { inline_keyboard: [buttons] };
  return tg('sendMessage', p);
}
function owner() { return prop('OWNER_CHAT_ID', ''); }

function doPost(e) {
  if (!e || !e.parameter || e.parameter.k !== prop('WEBHOOK_KEY', '-')) return ContentService.createTextOutput('no');
  const update = JSON.parse(e.postData.contents);
  // Apps Script responde a Telegram con un 302 y Telegram reintenta: cada update se procesa una sola vez.
  const fresh = withLock(() => {
    if (update.update_id <= Number(prop('LAST_UPDATE_ID', 0))) return false;
    setProp('LAST_UPDATE_ID', update.update_id); return true;
  });
  if (fresh) {
    try { handleUpdate(update); } catch (err) {
      console.error(err);
      const chat = (update.message && update.message.chat.id) || (update.callback_query && update.callback_query.message.chat.id);
      if (chat && String(chat) === owner()) send(chat, '⚠️ Algo falló: ' + err.message);
    }
  }
  return ContentService.createTextOutput('ok');
}

function handleUpdate(update) {
  if (update.callback_query) return handleButton(update.callback_query);
  const msg = update.message; if (!msg) return;
  const chat = String(msg.chat.id);
  if (!owner()) {
    // Solo se vincula el primer chat que escribe /start en los 30 minutos siguientes a conectarTelegram().
    if (msg.text === '/start' && Date.now() < Number(prop('BIND_UNTIL', 0))) {
      setProp('OWNER_CHAT_ID', chat);
      return send(chat, '👋 Listo, Pablo. Soy tu asistente de AdVibe. Háblame por texto o audio:\n• "¿Qué me falta hoy?"\n• "Ya me pagó Kamauto"\n• "Recuérdame mañana a las 9 llamar a Gualaceo"\nY cada mañana a las 8 te escribo con lo pendiente.');
    }
    return;
  }
  if (chat !== owner()) return;

  let text = msg.text || '', heard = '';
  const audio = msg.voice || msg.audio;
  if (audio) {
    text = transcribe(audio.file_id);
    if (!text) return send(chat, 'No te entendí el audio. ¿Me lo repites?');
    heard = '🎙️ «' + text + '»\n\n';
  }
  if (!text) return send(chat, 'Por ahora entiendo texto y audios.');
  if (text === '/start' || text === '/hoy') return send(chat, currentSummary());

  const out = runAgent(text);
  if (out.confirm) {
    const token = Utilities.getUuid().slice(0, 8);
    CacheService.getScriptCache().put('pay:' + token, JSON.stringify(out.confirm), 3600);
    return send(chat, heard + out.text + `\n\n💵 ¿Registro ${out.confirm.client} ${money(out.confirm.amount)} (${out.confirm.period})?`,
      [{ text: '✅ Sí, registrar', callback_data: 'pay:' + token }, { text: '❌ No', callback_data: 'no:' + token }]);
  }
  return send(chat, heard + out.text);
}

function handleButton(q) {
  const chat = String(q.message.chat.id);
  if (chat !== owner()) return;
  const [kind, token] = String(q.data || '').split(':');
  const done = text => { tg('answerCallbackQuery', { callback_query_id: q.id }); tg('editMessageReplyMarkup', { chat_id: chat, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } }); return send(chat, text); };
  if (kind === 'no') { CacheService.getScriptCache().remove('pay:' + token); return done('Cancelado, no registré nada.'); }
  if (kind === 'pay') {
    const raw = CacheService.getScriptCache().get('pay:' + token);
    if (!raw) return done('Esa confirmación caducó. Dímelo otra vez y lo preparo de nuevo.');
    CacheService.getScriptCache().remove('pay:' + token);
    return done(applyPayment(JSON.parse(raw)));
  }
  if (kind === 'task') return done(setTaskState(token, 'COMPLETADA'));
}

// ---------- avisos automáticos ----------

function avisoManana() { if (owner()) send(owner(), '☀️ Buenos días.\n' + currentSummary()); }

// Cada 15 min: recordatorios cuya hora ya llegó (de hoy o ayer) y que aún no se avisaron.
function revisarRecordatorios() {
  if (!owner()) return;
  const now = new Date(), nowKey = dayKey(now), nowTime = fmt(now, 'HH:mm');
  const due = pendingTasks(rows('TAREAS'), now, 0).filter(t => t.time && t.days !== null && t.days >= -1 && (t.days < 0 || t.time <= nowTime) && t.notes.indexOf('[avisado]') < 0);
  if (!due.length) return;
  const ws = sheet('TAREAS');
  due.forEach(t => {
    send(owner(), `⏰ ${t.title}${t.client ? ' (' + t.client + ')' : ''}${t.date !== nowKey ? ' — era para ' + prettyDay(t.date) : ''} ${t.time}`,
      [{ text: '✅ Hecho', callback_data: 'task:' + t.id }]);
    ws.getRange(t.row, 12).setValue((t.notes ? t.notes + ' ' : '') + '[avisado]');
  });
}

// ---------- instalación ----------

function conectarTelegram() {
  ['TELEGRAM_TOKEN', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY'].forEach(k => { if (!prop(k)) throw new Error('Falta la propiedad ' + k + ' (Configuración del proyecto → Propiedades del script).'); });
  const url = prop('WEBAPP_URL', '') || ScriptApp.getService().getUrl();
  if (!/\/exec$/.test(String(url))) throw new Error('Primero implementa la app web y pega su URL (termina en /exec) en la propiedad WEBAPP_URL.');
  if (!prop('WEBHOOK_KEY')) setProp('WEBHOOK_KEY', Utilities.getUuid().replace(/-/g, ''));
  const res = tg('setWebhook', { url: url + '?k=' + prop('WEBHOOK_KEY'), allowed_updates: ['message', 'callback_query'], drop_pending_updates: true });
  if (!res.ok) throw new Error('Telegram: ' + res.description);
  setProp('BIND_UNTIL', Date.now() + 30 * 60 * 1000);
  ScriptApp.getProjectTriggers().forEach(t => { if (['avisoManana', 'revisarRecordatorios'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('avisoManana').timeBased().everyDays(1).atHour(8).inTimezone(BOT.TZ).create();
  ScriptApp.newTrigger('revisarRecordatorios').timeBased().everyMinutes(15).create();
  console.log('Conectado. Abre tu bot en Telegram y escribe /start en los próximos 30 minutos.');
}

// Para probar sin Telegram: ejecútala en el editor y mira el registro.
function probarResumen() { console.log(currentSummary()); }
