// Clothes4Us - avisos en vivo (mensajes nuevos) en cualquier página.
// Se conecta al servidor con SSE (/api/eventos) y muestra un cartelito cuando llega un mensaje.
(function () {
  'use strict';
  if (window.__c4uTiempoReal) return;
  window.__c4uTiempoReal = true;

  var contenedor = null;
  var fuente = null;

  function crearContenedor() {
    if (contenedor) return contenedor;
    contenedor = document.createElement('div');
    contenedor.setAttribute('aria-live', 'polite');
    contenedor.style.cssText =
      'position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);right:10px;left:10px;' +
      'z-index:99999;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none;';
    document.body.appendChild(contenedor);
    return contenedor;
  }

  function textoDe(d) {
    return d.foto && !d.texto ? '📷 Foto' : d.texto;
  }

  function mostrarCartel(d) {
    var a = document.createElement('a');
    a.href = 'chats.html?chat=' + encodeURIComponent(d.chatId);
    a.style.cssText =
      'pointer-events:auto;display:flex;align-items:center;gap:10px;max-width:340px;width:100%;' +
      'box-sizing:border-box;padding:10px 12px;border-radius:12px;background:#fff;color:#222;' +
      'text-decoration:none;box-shadow:0 4px 16px rgba(0,0,0,.25);border:1px solid #ccc;' +
      'font:14px/1.3 system-ui,sans-serif;opacity:0;transform:translateY(-10px);' +
      'transition:opacity .25s,transform .25s;';

    if (d.de.avatar) {
      var img = document.createElement('img');
      img.src = d.de.avatar;
      img.alt = '';
      img.style.cssText = 'width:38px;height:38px;border-radius:50%;object-fit:cover;flex:none;';
      a.appendChild(img);
    }
    var caja = document.createElement('div');
    caja.style.cssText = 'min-width:0;';
    var nom = document.createElement('strong');
    nom.textContent = d.de.nombre;
    var txt = document.createElement('div');
    txt.textContent = textoDe(d);
    txt.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#555;';
    caja.appendChild(nom);
    caja.appendChild(txt);
    a.appendChild(caja);

    var c = crearContenedor();
    // Máximo 3 cartelitos a la vez
    while (c.children.length >= 3) c.removeChild(c.firstChild);
    c.appendChild(a);
    requestAnimationFrame(function () { a.style.opacity = '1'; a.style.transform = 'none'; });
    setTimeout(function () {
      a.style.opacity = '0';
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 300);
    }, 5000);
  }

  function avisoDelSistema(d) {
    // Solo si la pestaña está en segundo plano y la persona dio permiso.
    try {
      if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
      var n = new Notification(d.de.nombre, { body: textoDe(d), tag: 'c4u-chat-' + d.chatId });
      n.onclick = function () { window.focus(); location.href = 'chats.html?chat=' + encodeURIComponent(d.chatId); };
    } catch (e) { /* sin soporte en este celu/navegador */ }
  }

  function alLlegarMensaje(ev) {
    var d;
    try { d = JSON.parse(ev.data); } catch (e) { return; }
    if (!d || !d.de) return;

    // Las demás partes de la página (ej. el chat abierto) pueden escuchar este evento
    // para actualizarse solas. Si llaman a preventDefault(), no se muestra el cartelito.
    var evento = new CustomEvent('c4u-mensaje', { detail: d, cancelable: true });
    var mostrar = window.dispatchEvent(evento);

    if (d.silenciado) return;
    if (mostrar && !document.hidden) mostrarCartel(d);
    avisoDelSistema(d);
  }

  function conectar() {
    if (fuente || !('EventSource' in window)) return;
    fuente = new EventSource('/api/eventos');
    fuente.addEventListener('mensaje', alLlegarMensaje);
    // Si el servidor responde 401 (no hay sesión) el navegador no reintenta solo.
    fuente.onerror = function () {
      if (fuente && fuente.readyState === 2) { fuente = null; }
    };
  }

  // Solo se conecta si hay sesión iniciada.
  function iniciar() {
    fetch('/api/me', { credentials: 'same-origin' })
      .then(function (r) { if (r.ok) conectar(); })
      .catch(function () { /* sin conexión */ });
  }

  // Al volver a la pestaña (típico en el celu) se reconecta si se había cortado.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !fuente) iniciar();
  });

  // Pide permiso para avisos del sistema la primera vez que la persona toca algo.
  function pedirPermiso() {
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    } catch (e) { /* sin soporte */ }
  }
  document.addEventListener('click', pedirPermiso, { once: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();