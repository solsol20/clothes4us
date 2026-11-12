/* Clothes4Us - panel de moderación. Solo funciona para las cuentas listadas en ADMIN_USERS (en el .env del servidor). */
(function () {
  'use strict';
  var cont = document.getElementById('listaDenuncias');
  if (!cont) return;

  function el(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }
  function api(ruta, metodo, cuerpo) {
    return fetch('/api' + ruta, {
      method: metodo || 'GET',
      headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      credentials: 'same-origin'
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, status: res.status, data: data }; });
    }).catch(function () { return { ok: false, status: 0, data: { error: 'No pudimos conectarnos al servidor.' } }; });
  }
  var TIPOS = { publicacion: 'Publicación', comentario: 'Comentario', usuario: 'Usuario' };

  function accion(d, nombre, texto, peligro, tarjeta) {
    var b = el('button', 'btn-react' + (peligro ? ' btn-report-flag' : ''), texto);
    b.type = 'button';
    b.onclick = function () {
      if (nombre === 'eliminar' && !window.confirm('Se borra para siempre. ¿Seguro?')) return;
      b.disabled = true;
      api('/admin/denuncias/' + encodeURIComponent(d.id), 'POST', { accion: nombre }).then(function (r) {
        if (!r.ok) { b.disabled = false; window.alert(r.data.error || 'No se pudo completar.'); return; }
        tarjeta.remove();
        if (!cont.querySelector('.denuncia')) cont.appendChild(el('p', 'sin-datos', 'No quedan denuncias pendientes.'));
      });
    };
    return b;
  }

  function cargar() {
    api('/me').then(function (m) {
      cont.textContent = '';
      if (!m.ok) { cont.appendChild(el('p', 'sin-datos', 'Iniciá sesión con una cuenta de moderación.')); return; }
      api('/admin/denuncias').then(function (r) {
        if (r.status === 403) { cont.appendChild(el('p', 'sin-datos', 'Tu cuenta no tiene permisos de moderación.')); return; }
        if (!r.ok) { cont.appendChild(el('p', 'sin-datos', r.data.error || 'No se pudieron cargar las denuncias.')); return; }
        if (!r.data.denuncias.length) { cont.appendChild(el('p', 'sin-datos', 'No hay denuncias pendientes. ¡Todo tranquilo!')); return; }
        r.data.denuncias.forEach(function (d) {
          var t = el('article', 'denuncia');
          t.appendChild(el('p', 'denuncia-cab', (TIPOS[d.tipo] || d.tipo) + ' #' + d.objetivo + (d.oculto ? ' · oculto' : '')));
          t.appendChild(el('p', 'denuncia-resumen', d.resumen));
          t.appendChild(el('p', 'post-meta', 'Autor: @' + d.dueno + ' · Denunció: @' + d.denunciante + ' · ' + new Date(d.fecha).toLocaleString('es-AR')));
          t.appendChild(el('p', 'denuncia-motivo', 'Motivo: ' + d.motivo));
          var fila = el('div', 'fila-botones');
          fila.appendChild(accion(d, 'descartar', 'Descartar', false, t));
          if (d.tipo !== 'usuario') {
            fila.appendChild(accion(d, d.oculto ? 'restaurar' : 'ocultar', d.oculto ? 'Restaurar' : 'Ocultar', false, t));
            fila.appendChild(accion(d, 'eliminar', 'Eliminar', true, t));
          }
          if (d.tipo === 'usuario') {
            var ver = el('a', 'btn-react', 'Ver perfil');
            ver.href = 'perfil.html?u=' + encodeURIComponent(d.resumen.replace(/^@/, ''));
            fila.appendChild(ver);
          }
          t.appendChild(fila);
          cont.appendChild(t);
        });
      });
    });
  }
  document.addEventListener('DOMContentLoaded', cargar);
})();