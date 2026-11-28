/* =====================================================================
   La Cachanilla · Avisos automáticos de cada venta de la caja
   ---------------------------------------------------------------------
   Al cobrar, envía el recibo sin tocar nada más:
   · por correo, con FormSubmit (formsubmit.co, gratis; el primer envío
     pide confirmar el correo una sola vez);
   · por WhatsApp, con CallMeBot (gratis, uso personal; la dueña del
     número activa una "apikey" una sola vez).
   La configuración y la apikey se guardan SOLO en este equipo.
   Si no hay internet, el aviso queda en cola y se reintenta.
   ===================================================================== */
(() => {
  const BASE = { activo: false, correo: 'lacachanillamx@outlook.com', copia: 'spm.biokinet@gmail.com', correoOn: true, wa: '19393510339', waKey: '', waOn: true, anuladas: true };
  const conf = () => {
    const g = store.get('avisos', {});
    if (g.correo === 'spm.biokinet@gmail.com') { g.correo = BASE.correo; store.set('avisos', g); }   // se cambió al correo del negocio
    return Object.assign({}, BASE, g);
  };
  const cola = () => store.get('avisos_cola', []);
  const guardarCola = c => store.set('avisos_cola', c.slice(-200));

  async function porCorreo(c, asunto, texto, extra) {
    const cc = [c.copia, extra].filter(x => x && x !== c.correo).join(',');
    const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(c.correo), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(Object.assign({ _subject: asunto, _template: 'box', _captcha: 'false', Recibo: texto }, cc ? { _cc: cc } : {}))
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || String(j.success) === 'false') {
      const m = j.message || ('Error ' + r.status);
      if (/activat|confirm/i.test(m)) { const e = new Error('Falta confirmar el correo: abre el mensaje de FormSubmit en ' + c.correo + ' y pulsa “Activate Form”.'); e.activar = true; throw e; }
      throw new Error(m);
    }
  }
  async function porWhatsApp(c, texto) {
    if (!c.waKey) throw new Error('Falta la apikey de CallMeBot');
    const url = 'https://api.callmebot.com/whatsapp.php?source=web&phone=' + encodeURIComponent('+' + c.wa.replace(/\D/g, '')) +
      '&apikey=' + encodeURIComponent(c.waKey) + '&text=' + encodeURIComponent(texto);
    // CallMeBot no permite leer la respuesta desde el navegador: se envía y se da por entregado.
    await fetch(url, { mode: 'no-cors' });
  }

  let trabajando = false;
  async function procesar() {
    if (trabajando || !navigator.onLine) return;
    trabajando = true;
    const c = conf(); let q = cola(), avisoError = '';
    for (const item of q) {
      if (item.correo === 'pend' && c.correoOn && c.correo) {
        try { await porCorreo(c, item.asunto, item.texto); item.correo = 'ok'; } catch (e) { avisoError = e.message; item.err = e.message; if (e.activar) item.correo = 'pend'; }
      }
      if (item.wa === 'pend' && c.waOn && c.waKey) {
        try { await porWhatsApp(c, item.texto); item.wa = 'ok'; } catch (e) { avisoError = e.message; item.err = e.message; }
        await new Promise(r => setTimeout(r, 1500));   // CallMeBot pide no enviar en ráfaga
      }
    }
    q = q.filter(i => i.correo === 'pend' || i.wa === 'pend');
    guardarCola(q); trabajando = false;
    if (avisoError) toast('Aviso de venta pendiente: ' + avisoError, true);
    pintarEstado();
  }

  /* Botón "Correo" del recibo: envía el recibo a los correos del negocio y, si se escribe, al cliente */
  window.enviarReciboCorreo = async (v, cliente) => {
    const c = conf();
    const asunto = `Recibo #${v.num} · ${money(v.total)} · La Cachanilla`;
    const texto = textoRecibo(v);
    if (navigator.onLine && c.correo) {
      try { await porCorreo(c, asunto, texto, cliente); toast('Recibo enviado por correo' + (cliente ? ' (también al cliente)' : '')); return; }
      catch (e) { toast(e.message, true); }
    }
    // Sin internet o sin activar: se abre el programa de correo del equipo
    const para = cliente || c.copia || c.correo;
    location.href = `mailto:${encodeURIComponent(para)}?${new URLSearchParams({ cc: cliente ? (c.copia || '') : '', subject: asunto, body: texto }).toString().replace(/\+/g, '%20')}`;
  };

  /* Llamado por la caja al cobrar o anular */
  window.avisarVenta = (v, anulada) => {
    const c = conf(); if (!c.activo) return;
    if (anulada && !c.anuladas) return;
    const asunto = `${anulada ? 'ANULADA · ' : ''}Venta #${v.num} · ${money(v.total)} · ${v.metodo} · La Cachanilla`;
    const s = sesionActual();
    const texto = (anulada ? '⚠️ VENTA ANULADA\n' : '') + textoRecibo(v) + (s ? `\n\nCobrado por: ${s.nombre}` : '');
    const q = cola();
    q.push({ id: v.id + (anulada ? '-x' : ''), asunto, texto, correo: c.correoOn && c.correo ? 'pend' : 'no', wa: c.waOn && c.waKey ? 'pend' : 'no', ts: Date.now() });
    guardarCola(q); procesar();
  };

  /* ---------- Ajustes ---------- */
  function pintarEstado() {
    const el = $('#avEstado'); if (!el) return;
    const n = cola().length, c = conf();
    el.innerHTML = !c.activo ? 'Avisos apagados.' : n ? `⏳ ${n} aviso(s) en cola. ${esc((cola().find(i => i.err) || {}).err || 'Se enviarán al haber internet.')}` : '✓ Todo enviado.';
  }
  function pintar() {
    const c = conf();
    $('#avOn').checked = c.activo; $('#avCorreoOn').checked = c.correoOn; $('#avCorreo').value = c.correo; $('#avCopia').value = c.copia || '';
    $('#avWaOn').checked = c.waOn; $('#avWa').value = c.wa; $('#avKey').value = c.waKey; $('#avAnul').checked = c.anuladas;
    pintarEstado();
  }
  function leer() {
    return { activo: $('#avOn').checked, correoOn: $('#avCorreoOn').checked, correo: $('#avCorreo').value.trim(), copia: $('#avCopia').value.trim(),
      waOn: $('#avWaOn').checked, wa: $('#avWa').value.replace(/\D/g, ''), waKey: $('#avKey').value.trim(), anuladas: $('#avAnul').checked };
  }
  if ($('#avGuardar')) {
    $('#avGuardar').onclick = () => {
      const c = leer();
      if (c.correoOn && [c.correo, c.copia].some(x => x && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x))) return toast('Correo no válido', true);
      if (c.waOn && c.wa.length < 10) return toast('Número de WhatsApp no válido (incluye el 1)', true);
      store.set('avisos', c); toast('Avisos guardados'); pintarEstado(); procesar();
    };
    $('#avProbar').onclick = async () => {
      const c = leer(); store.set('avisos', c);
      const texto = `🧪 Prueba de avisos de La Cachanilla\n${fecha(Date.now())} ${hora(Date.now())}\nSi te llegó esto, los recibos de cada venta llegarán aquí.`;
      const res = [];
      if (c.correoOn && c.correo) { try { await porCorreo(c, 'Prueba · avisos de ventas La Cachanilla', texto); res.push('correo ✓'); } catch (e) { res.push('correo: ' + e.message); } }
      if (c.waOn) { if (!c.waKey) res.push('WhatsApp: falta la apikey'); else { try { await porWhatsApp(c, texto); res.push('WhatsApp enviado (revisa el teléfono)'); } catch (e) { res.push('WhatsApp: ' + e.message); } } }
      $('#avEstado').textContent = res.join(' · ') || 'Activa al menos un canal.';
    };
    pintar();
  }
  window.addEventListener('online', procesar);
  setTimeout(procesar, 1500);
})();
