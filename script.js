/* Clothes4Us - lógica del sitio: muro, publicaciones, comentarios, guardados, carrito, perfil y chats.
   El inicio de sesión / registro / "Hola, usuario" vive en auth.js. Acá solo se LEE la sesión (/api/me).
   Cada página tiene <body data-page="inicio|perfil|guardados|carrito|chats|ayuda|donar">.
   Sin sesión se puede mirar todo; para publicar, comentar, guardar, comprar o chatear se pide iniciar sesión. */
(function () {
  'use strict';

  var PAGINA = document.body.getAttribute('data-page') || '';
  var yo = null; // usuario con sesión iniciada (o null)

  var AVATAR_VACIO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24'><rect width='24' height='24' fill='%23e8f4ff'/><path fill='%230072ce' d='M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z'/></svg>";

  var $ = function (id) { return document.getElementById(id); };

  // ============================== utilidades ==============================
  function api(ruta, metodo, cuerpo) {
    return fetch('/api' + ruta, {
      method: metodo || 'GET',
      headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      credentials: 'same-origin'
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    }).catch(function () {
      return { ok: false, status: 0, data: { error: 'No pudimos conectarnos al servidor. Revisá tu conexión.' } };
    });
  }

  // Crea elementos de forma segura (todo texto va con textContent: nada de HTML de usuarios).
  function h(tag, attrs, hijos) {
    var e = document.createElement(tag);
    var icono = null, textoIco = null;
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'ico') icono = v;
      else if (k === 'text') { e.textContent = v; textoIco = v; }
      else if (k === 'style') e.style.cssText = v;
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    (hijos || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    if (icono) {
      var t0 = e.firstChild;
      if (t0 && t0.nodeType === 3 && e.childNodes.length === 1) {
        var sp = document.createElement('span'); sp.className = 'txt'; sp.textContent = t0.nodeValue; e.replaceChild(sp, t0);
      }
      e.insertBefore(ico(icono), e.firstChild);
      if (textoIco && !e.hasAttribute('title')) e.setAttribute('title', textoIco);
    }
    return e;
  }

  function aviso(texto, tipo) {
    var t = $('c4u-aviso');
    if (!t) { t = h('div', { id: 'c4u-aviso', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(t); }
    t.textContent = texto;
    t.className = 'c4u-aviso show ' + (tipo || '');
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.className = 'c4u-aviso'; }, 3800);
  }

  // Ventana de confirmación / pregunta. Devuelve una promesa: true / texto escrito / null (cancelado).
  function dialogo(op) {
    return new Promise(function (resolve) {
      var campo = null;
      if (op.campo) {
        campo = op.campo.multilinea
          ? h('textarea', { maxlength: op.campo.max || 300, placeholder: op.campo.placeholder || '', rows: 3 })
          : h('input', { type: 'text', maxlength: op.campo.max || 300, placeholder: op.campo.placeholder || '' });
      }
      var anterior = document.activeElement;
      var fondo;
      function cerrar(v) {
        document.removeEventListener('keydown', tecla);
        fondo.remove();
        if (anterior && anterior.focus) anterior.focus();
        resolve(v);
      }
      function tecla(e) { if (e.key === 'Escape') cerrar(null); }
      var ok = h('button', {
        type: 'button', class: 'btn-aero-action' + (op.peligro ? ' peligro' : ''), text: op.ok || 'Aceptar',
        onclick: function () {
          if (campo) { var v = campo.value.trim(); if (!v) { campo.focus(); return; } cerrar(v); }
          else cerrar(true);
        }
      });
      var cancelar = h('button', { type: 'button', class: 'btn-react', text: op.cancelar || 'Cancelar', onclick: function () { cerrar(null); } });
      fondo = h('div', { class: 'c4u-fondo', onclick: function (e) { if (e.target === fondo) cerrar(null); } }, [
        h('div', { class: 'aero-panel c4u-dialogo', role: 'dialog', 'aria-modal': 'true' }, [
          h('h3', { text: op.titulo || 'Clothes4Us' }),
          op.texto ? h('p', { class: 'c4u-dialogo-texto', text: op.texto }) : null,
          campo,
          h('div', { class: 'c4u-dialogo-botones' }, [cancelar, ok])
        ])
      ]);
      document.body.appendChild(fondo);
      document.addEventListener('keydown', tecla);
      (campo || ok).focus();
    });
  }

  // Ventana con contenido propio (listas de personas, compartir, fotos grandes…).
  function modal(titulo, contenido) {
    var anterior = document.activeElement;
    var fondo;
    function cerrar() {
      document.removeEventListener('keydown', tecla);
      fondo.remove();
      if (anterior && anterior.focus) anterior.focus();
    }
    function tecla(e) { if (e.key === 'Escape') cerrar(); }
    fondo = h('div', { class: 'c4u-fondo', onclick: function (e) { if (e.target === fondo) cerrar(); } }, [
      h('div', { class: 'aero-panel c4u-dialogo c4u-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo }, [
        h('div', { class: 'c4u-modal-cab' }, [
          h('h3', { text: titulo }),
          h('button', { type: 'button', class: 'btn-icono', ico: 'x', title: 'Cerrar', 'aria-label': 'Cerrar', onclick: cerrar })
        ]),
        contenido
      ])
    ]);
    document.body.appendChild(fondo);
    document.addEventListener('keydown', tecla);
    return { cerrar: cerrar };
  }
  function verImagen(src) {
    modal('Foto', h('img', { class: 'imagen-grande', src: src, alt: 'Foto ampliada' }));
  }
  function copiarTexto(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise(function (ok, no) {
      var a = h('textarea', { style: 'position:fixed;opacity:0;' });
      a.value = t; document.body.appendChild(a); a.select();
      var bien = false;
      try { bien = document.execCommand('copy'); } catch (e) { bien = false; }
      a.remove();
      if (bien) ok(); else no(new Error('no se pudo copiar'));
    });
  }

  function filaPersona(u, extra) {
    return h('div', { class: 'persona' }, [
      h('a', { href: perfilHref(u.nombre) }, [avatarDe(u, 'comentario-avatar')]),
      h('a', { class: 'post-username persona-nombre', href: perfilHref(u.nombre), text: '@' + u.nombre }),
      extra
    ]);
  }

  // Botón Seguir / Siguiendo. u = { id, loSigo }.
  function botonSeguir(u, alCambiar) {
    var b = h('button', { type: 'button', class: 'btn-react' });
    function pintar() {
      conIcono(b, u.loSigo ? 'usuarioCheck' : 'usuarioMas', u.loSigo ? 'Siguiendo' : 'Seguir');
      b.classList.toggle('activo', !!u.loSigo);
      b.setAttribute('aria-pressed', String(!!u.loSigo));
    }
    b.onclick = function () {
      if (!requiereLogin()) return;
      b.disabled = true;
      api('/seguir/' + u.id, 'POST').then(function (r) {
        b.disabled = false;
        if (!r.ok) { aviso(r.data.error || 'No se pudo completar.', 'error'); return; }
        u.loSigo = r.data.siguiendo;
        pintar();
        if (alCambiar) alCambiar(r.data);
      });
    };
    pintar();
    return b;
  }

  // Lista pública de seguidores / seguidos / amigos de alguien.
  function listaRed(nombre, tipo, titulo) {
    var cont = h('div', { class: 'lista-personas' }, [h('p', { class: 'sin-datos', text: 'Cargando…' })]);
    modal(titulo, cont);
    api('/usuarios/' + encodeURIComponent(nombre) + '/red?tipo=' + tipo).then(function (r) {
      cont.textContent = '';
      if (!r.ok || !r.data.usuarios.length) { cont.appendChild(h('p', { class: 'sin-datos', text: r.ok ? 'Todavía no hay nadie en esta lista.' : (r.data.error || 'No se pudo cargar la lista.') })); return; }
      r.data.usuarios.forEach(function (u) {
        cont.appendChild(filaPersona(u, yo && !u.soyYo ? botonSeguir(u) : null));
      });
    });
  }

  // Cajita "seguidores · seguidos · amigos" del perfil. Devuelve { nodo, actualizar(cambios) }.
  function montarRed(c) {
    var caja = h('div', { class: 'red-stats' });
    var cuenta = { seguidores: c.seguidores || 0, siguiendo: c.siguiendo || 0, amigos: c.amigos || 0 };
    function pintar() {
      caja.textContent = '';
      [['seguidores', 'Seguidores'], ['siguiendo', 'Seguidos'], ['amigos', 'Amigos']].forEach(function (t) {
        caja.appendChild(h('button', { type: 'button', class: 'red-dato', onclick: function () { listaRed(c.nombre, t[0], t[1]); } }, [
          h('strong', { text: String(cuenta[t[0]]) }), h('span', { text: t[1] })
        ]));
      });
    }
    pintar();
    return { nodo: caja, actualizar: function (n) { Object.keys(n).forEach(function (k) { cuenta[k] = Math.max(0, n[k]); }); pintar(); }, cuenta: cuenta };
  }

  // Compartir una publicación: copiar el enlace o mandarla por chat a amigos y a quien quieras.
  function compartirPublicacion(p) {
    var enlace = location.origin + '/index.html?pub=' + p.id;
    var caja = h('div', { class: 'compartir' });
    modal('Compartir publicación', caja);
    var fila = h('div', { class: 'fila-botones' }, [
      h('button', {
        type: 'button', class: 'btn-aero-action', style: 'width:auto;margin:0;', ico: 'enlace', text: 'Copiar enlace',
        onclick: function () { copiarTexto(enlace).then(function () { aviso('Enlace copiado.', 'ok'); }).catch(function () { aviso('No se pudo copiar. Este es el enlace: ' + enlace, 'error'); }); }
      })
    ]);
    if (navigator.share) fila.appendChild(h('button', {
      type: 'button', class: 'btn-react', ico: 'compartir', text: 'Otras apps',
      onclick: function () { navigator.share({ title: p.titulo || 'Clothes4Us', url: enlace }).catch(function () { /* cancelado */ }); }
    }));
    caja.appendChild(fila);
    if (!yo) { caja.appendChild(h('p', { class: 'sin-datos' }, [h('a', { href: 'login.html?next=' + paginaActual(), text: 'Iniciá sesión' }), ' para mandarla por chat a tus amigos.'])); return; }

    caja.appendChild(h('h4', { text: 'Enviar por chat' }));
    var buscador = h('input', { type: 'text', maxlength: 30, placeholder: 'Buscar usuario…', 'aria-label': 'Buscar usuario' });
    var lista = h('div', { class: 'lista-personas' });
    caja.appendChild(buscador);
    caja.appendChild(lista);

    function botonEnviar(u) {
      var b = h('button', { type: 'button', class: 'btn-react', ico: 'sobre', text: 'Enviar' });
      b.onclick = function () {
        b.disabled = true;
        api('/chats/' + u.id, 'POST', { texto: 'Mirá esta publicación: ' + (p.titulo || '') + ' ' + enlace, publicacionId: p.id }).then(function (r) {
          if (!r.ok) { b.disabled = false; aviso(r.data.error || 'No se pudo enviar.', 'error'); return; }
          conIcono(b, 'check', 'Enviado');
          aviso('Enviada a @' + u.nombre, 'ok');
        });
      };
      return b;
    }
    function mostrar(us, vacio) {
      lista.textContent = '';
      if (!us.length) { lista.appendChild(h('p', { class: 'sin-datos', text: vacio })); return; }
      us.forEach(function (u) { lista.appendChild(filaPersona(u, botonEnviar(u))); });
    }
    function cargarAmigos() {
      lista.textContent = 'Cargando…';
      api('/usuarios/' + encodeURIComponent(yo.nombre) + '/red?tipo=amigos').then(function (r) {
        if (r.ok && r.data.usuarios.length) return mostrar(r.data.usuarios, '');
        api('/usuarios/' + encodeURIComponent(yo.nombre) + '/red?tipo=siguiendo').then(function (r2) {
          mostrar(r2.ok ? r2.data.usuarios : [], 'Todavía no tenés amigos ni seguidos. Buscá a alguien arriba.');
        });
      });
    }
    var espera = null;
    buscador.addEventListener('input', function () {
      clearTimeout(espera);
      var q = buscador.value.trim();
      if (q.length < 2) { if (!q) cargarAmigos(); return; }
      espera = setTimeout(function () {
        api('/usuarios?q=' + encodeURIComponent(q)).then(function (r) { mostrar(r.ok ? r.data.usuarios : [], 'No encontramos usuarios con ese nombre.'); });
      }, 300);
    });
    cargarAmigos();
  }

  // Publicaciones ya vistas en el inicio al azar (se recuerdan en este navegador).
  function vistasLeer() {
    try {
      var v = JSON.parse(localStorage.getItem('c4u_vistas') || '[]');
      return Array.isArray(v) ? v.filter(function (n) { return Math.floor(n) === n && n > 0; }).slice(-300) : [];
    } catch (e) { return []; }
  }
  function vistasGuardar(ids, reiniciar) {
    var v = reiniciar ? [] : vistasLeer();
    ids.forEach(function (i) { if (v.indexOf(i) < 0) v.push(i); });
    try { localStorage.setItem('c4u_vistas', JSON.stringify(v.slice(-300))); } catch (e) { /* modo privado */ }
  }

  // Si no hay sesión, ofrece ir a iniciar sesión y vuelve a esta misma página después.
  function requiereLogin() {
    if (yo) return true;
    dialogo({
      titulo: 'Iniciá sesión',
      texto: 'Podés mirar todo el sitio sin cuenta, pero para publicar, comentar, guardar, usar el carrito o chatear necesitás ingresar.',
      ok: 'Iniciar sesión'
    }).then(function (si) { if (si) location.href = 'login.html?next=' + paginaActual(); });
    return false;
  }
  function paginaActual() {
    var pag = location.pathname.split('/').pop() || 'index.html';
    return /^[A-Za-z0-9_\-]+\.html$/.test(pag) ? pag : 'index.html';
  }

  function hace(fecha) {
    var s = (Date.now() - new Date(fecha).getTime()) / 1000;
    if (!(s >= 0)) s = 0;
    if (s < 60) return 'hace un momento';
    var m = Math.floor(s / 60); if (m < 60) return 'hace ' + m + ' min';
    var hr = Math.floor(m / 60); if (hr < 24) return 'hace ' + hr + (hr === 1 ? ' hora' : ' horas');
    var d = Math.floor(hr / 24); if (d < 30) return 'hace ' + d + (d === 1 ? ' día' : ' días');
    return new Date(fecha).toLocaleDateString('es-AR');
  }
  function horaCorta(fecha) {
    var f = new Date(fecha);
    var hora = f.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return f.toDateString() === new Date().toDateString() ? hora : f.toLocaleDateString('es-AR') + ' ' + hora;
  }
  function precioTexto(p) { return p > 0 ? '$' + Number(p).toLocaleString('es-AR') + ' ARS' : 'Trueque ($0)'; }
  function estrellasTexto(n) {
    var llenas = Math.round(n || 0);
    return '★★★★★'.slice(0, llenas) + '☆☆☆☆☆'.slice(0, 5 - llenas);
  }
  function textoCalificacion(c) {
    if (!c.calificacion) return 'Todavía sin calificaciones';
    return estrellasTexto(c.calificacion) + ' (' + c.calificacion.toFixed(1) + ' · ' + c.cantidadCalificaciones + (c.cantidadCalificaciones === 1 ? ' opinión)' : ' opiniones)');
  }
  function perfilHref(nombre) { return 'perfil.html?u=' + encodeURIComponent(nombre); }

  // Achica la foto en el navegador antes de subirla (los celulares sacan fotos enormes).
  function leerImagen(archivo, lado, calidad, maxChars) {
    return new Promise(function (resolve, reject) {
      if (!archivo || !/^image\//.test(archivo.type)) return reject(new Error('Elegí un archivo de imagen.'));
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error('No pudimos leer esa imagen.')); };
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('No pudimos leer esa imagen.')); };
        img.onload = function () {
          var k = Math.min(1, lado / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * k));
          c.height = Math.max(1, Math.round(img.height * k));
          var g = c.getContext('2d');
          g.fillStyle = '#fff';
          g.fillRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, 0, c.width, c.height);
          var q = calidad;
          var url = c.toDataURL('image/jpeg', q);
          while (url.length > maxChars && q > 0.3) { q -= 0.1; url = c.toDataURL('image/jpeg', q); }
          if (url.length > maxChars) return reject(new Error('La imagen es demasiado pesada.'));
          resolve(url);
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(archivo);
    });
  }

  function guardarUsuarioLocal(u) { try { localStorage.setItem('usuario', JSON.stringify(u)); } catch (e) { /* modo privado */ } }

  function avatarDe(u, clase) {
    return h('img', { class: clase || 'post-avatar', src: u.avatar || AVATAR_VACIO, alt: 'Foto de ' + u.nombre });
  }

  // ============================== íconos (en lugar de emojis) ==============================
  var ICONOS = {
    corazon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    comentario: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    marcador: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    carrito: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    sobre: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    lapiz: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    deshacer: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    papelera: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    bandera: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    prohibido: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
    candado: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    camara: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    carita: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    lupa: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    ayuda: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    casa: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    usuario: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    filtro: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    paleta: '<circle cx="13.5" cy="6.5" r=".6"/><circle cx="17.5" cy="10.5" r=".6"/><circle cx="8.5" cy="7.5" r=".6"/><circle cx="6.5" cy="12.5" r=".6"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.12a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
    camisa: '<path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>'
    ,
    compartir: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    pulgarArriba: '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>',
    pulgarAbajo: '<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>',
    responder: '<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
    campana: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    campanaOff: '<path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/>',
    pin: '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/>',
    usuarioMas: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
    usuarioCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
    usuarios: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    enlace: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    mezcla: '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
    reloj: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
  };
  // Devuelve un ícono SVG (hereda el color del texto del botón).
  function ico(nombre) {
    var caja = document.createElement('div');
    caja.innerHTML = '<svg class="ico ico-' + nombre + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONOS[nombre] || '') + '</svg>';
    return caja.firstChild;
  }
  // Cambia el contenido de un botón: ícono + texto.
  function conIcono(el, nombre, texto) {
    el.textContent = '';
    el.appendChild(ico(nombre));
    var sp = document.createElement('span'); sp.className = 'txt'; sp.textContent = texto;
    el.appendChild(sp);
    el.setAttribute('title', texto);
  }
  // Botón con ícono + etiqueta + contador (en celular se ve solo el ícono y el número).
  function botonConteo(attrs, etiqueta, n) {
    var b = h('button', attrs);
    b.appendChild(h('span', { class: 'txt', text: etiqueta }));
    b.appendChild(h('span', { class: 'cuenta', text: String(n) }));
    return b;
  }
  // Pone el ícono en los elementos de los .html que tienen data-ico="nombre".
  function decorarIconos() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ico]'), function (el) {
      if (el.querySelector(':scope > .ico')) return;
      var texto = '';
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && n.nodeValue.trim()) {
          texto += n.nodeValue.trim();
          var sp = document.createElement('span'); sp.className = 'txt'; sp.textContent = n.nodeValue.trim();
          el.replaceChild(sp, n);
        }
      });
      el.insertBefore(ico(el.getAttribute('data-ico')), el.firstChild);
      if (texto && !el.hasAttribute('title') && el.tagName !== 'H3') el.setAttribute('title', texto);
    });
  }
  // Si el encabezado se arma después (ej: "Hola, usuario"), también lo decora.
  function vigilarIconos() {
    if (!window.MutationObserver) return;
    new MutationObserver(function () { decorarIconos(); }).observe(document.body, { childList: true, subtree: true });
  }

  // ============================== temas de color y fondo ==============================
  var TEMAS = [
    { id: '',          nombre: 'Azul clásico', color: 'linear-gradient(135deg,#4aa3f0,#0055a5)' },
    { id: 'rosa',      nombre: 'Rosa chicle',  color: 'linear-gradient(135deg,#ff7ac0,#d6409f)' },
    { id: 'menta',     nombre: 'Verde menta',  color: 'linear-gradient(135deg,#4fd1a5,#1fa37c)' },
    { id: 'violeta',   nombre: 'Violeta',      color: 'linear-gradient(135deg,#a07cf0,#7a4fd6)' },
    { id: 'atardecer', nombre: 'Atardecer',    color: 'linear-gradient(135deg,#ff9d45,#ea7a1c)' },
    { id: 'grafito',   nombre: 'Grafito',      color: 'linear-gradient(135deg,#7d8aa3,#566277)' }
  ];
  // ---- colores propios: 3 colores elegidos por la persona -> paleta completa ----
  var RE_CUSTOM = /^custom:(#[0-9a-fA-F]{6}):(#[0-9a-fA-F]{6}):(#[0-9a-fA-F]{6})$/;
  var VARS_TEMA = ['--t1', '--t2', '--t3', '--t4', '--tn'];
  function hexARgb(x) { return [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)]; }
  function rgbAHex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mezclar(x, y, t) { var a = hexARgb(x), b = hexARgb(y); return rgbAHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  function luz(x) { // luminosidad aproximada 0..1
    var c = hexARgb(x).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  // Los colores muy claros se oscurecen para que el texto blanco de barras y botones se lea.
  function legible(x) { var n = 0; while (luz(x) > 0.3 && n < 12) { x = mezclar(x, '#000000', 0.12); n++; } return x; }
  function paletaDe(c1, c2, c3) {
    var t1 = legible(c1), t2 = legible(c2);
    return { '--t1': t1, '--t2': t2, '--tn': mezclar(t2, '#ffffff', 0.25), '--t3': mezclar(t2, '#ffffff', 0.6), '--t4': mezclar(c3, '#ffffff', 0.55) };
  }
  // tema = id del tema ('' = el de siempre) o "custom:#aaaaaa:#bbbbbb:#cccccc"; fondoV = versión del fondo (0 = sin fondo)
  function aplicarTema(tema, fondoV, nombre) {
    var cuerpo = document.body, m = RE_CUSTOM.exec(tema || '');
    VARS_TEMA.forEach(function (v) { cuerpo.style.removeProperty(v); });
    if (m) {
      var p = paletaDe(m[1], m[2], m[3]);
      Object.keys(p).forEach(function (k) { cuerpo.style.setProperty(k, p[k]); });
      cuerpo.setAttribute('data-tema', 'custom');
    } else if (tema) cuerpo.setAttribute('data-tema', tema);
    else cuerpo.removeAttribute('data-tema');
    if (fondoV) {
      cuerpo.style.setProperty('--fondo-url', 'url("/api/usuarios/' + encodeURIComponent(nombre || (yo && yo.nombre) || '') + '/fondo?v=' + Number(fondoV) + '")');
      cuerpo.classList.add('con-fondo');
    } else {
      cuerpo.classList.remove('con-fondo');
    }
  }
  function montarPersonalizacion() {
    var panel = $('panelTema');
    if (!panel || !yo) return;
    panel.hidden = false;
    var lista = $('temasLista');
    lista.textContent = '';
    function marcar() {
      var esCustom = RE_CUSTOM.test(yo.tema || '');
      Array.prototype.forEach.call(lista.children, function (b) { var id = b.getAttribute('data-id'); b.setAttribute('aria-pressed', (id === 'custom' ? esCustom : id === (yo.tema || '')) ? 'true' : 'false'); });
    }
    TEMAS.forEach(function (t) {
      var b = h('button', { type: 'button', class: 'tema-op', title: t.nombre, 'aria-label': 'Tema ' + t.nombre });
      b.style.background = t.color;
      b.setAttribute('data-id', t.id);
      b.appendChild(ico('check'));
      b.onclick = function () {
        api('/perfil', 'PUT', { tema: t.id }).then(function (r) {
          if (!r.ok) { aviso(r.data.error || 'No se pudo cambiar el tema.', 'error'); return; }
          if (r.data.usuario.tema === undefined) { aviso('El servidor no está actualizado: reemplazá server.js y rutas.js y reiniciá (Ctrl+C y npm start).', 'error'); return; }
          yo.tema = r.data.usuario.tema; aplicarTema(yo.tema, yo.fondoV, yo.nombre); marcar();
          var cc = $('temaCustom'); if (cc) cc.hidden = true;
        });
      };
      lista.appendChild(b);
    });
    // --- colores propios ---
    var cb = h('button', { type: 'button', class: 'tema-op tema-op-custom', title: 'Personalizado', 'aria-label': 'Tema Personalizado' });
    cb.setAttribute('data-id', 'custom');
    cb.appendChild(ico('check'));
    lista.appendChild(cb);
    var caja = $('temaCustom'), i1 = $('colorBarras'), i2 = $('colorBotones'), i3 = $('colorPaneles');
    var m0 = RE_CUSTOM.exec(yo.tema || '');
    i1.value = m0 ? m0[1] : '#2b6299'; i2.value = m0 ? m0[2] : '#0072ce'; i3.value = m0 ? m0[3] : '#cfe6ff';
    caja.hidden = !m0;
    var espera = null;
    function valor() { return 'custom:' + i1.value + ':' + i2.value + ':' + i3.value; }
    function guardarColores() {
      var v = valor();
      api('/perfil', 'PUT', { tema: v }).then(function (r) {
        if (!r.ok) { aviso(r.data.error || 'No se pudo cambiar el tema.', 'error'); return; }
        yo.tema = r.data.usuario.tema; marcar();
      });
    }
    function cambioColor() {
      yo.tema = valor(); aplicarTema(yo.tema, yo.fondoV, yo.nombre); marcar();   // vista previa al instante
      clearTimeout(espera); espera = setTimeout(guardarColores, 600);               // se guarda cuando dejás de mover el color
    }
    [i1, i2, i3].forEach(function (i) { i.addEventListener('input', cambioColor); });
    cb.onclick = function () { caja.hidden = false; cambioColor(); };
    marcar();

    var archivo = $('uploadFondo'), quitar = $('btnQuitarFondo');
    quitar.hidden = !yo.fondoV;
    $('btnElegirFondo').onclick = function () { archivo.click(); };
    archivo.onchange = function () {
      var f = archivo.files[0];
      archivo.value = '';
      if (!f) return;
      leerImagen(f, 1600, 0.7, 550000).then(function (url) {
        return api('/perfil', 'PUT', { fondo: url });
      }).then(function (r) {
        if (!r.ok) { aviso(r.data.error || 'No se pudo guardar el fondo.', 'error'); return; }
        if (r.data.usuario.fondoV === undefined) { aviso('El servidor no está actualizado: reemplazá server.js y rutas.js y reiniciá (Ctrl+C y npm start).', 'error'); return; }
        yo.fondoV = r.data.usuario.fondoV; aplicarTema(yo.tema, yo.fondoV, yo.nombre); quitar.hidden = false;
        aviso('¡Fondo cambiado!', 'ok');
      }).catch(function (e) { aviso(e.message, 'error'); });
    };
    quitar.onclick = function () {
      api('/perfil', 'PUT', { fondo: '' }).then(function (r) {
        if (!r.ok) { aviso(r.data.error || 'No se pudo quitar el fondo.', 'error'); return; }
        yo.fondoV = 0; aplicarTema(yo.tema, 0, yo.nombre); quitar.hidden = true;
      });
    };
  }

  // ============================== filtros plegables (celular y tablet) ==============================
  function configurarFiltrosPlegables() {
    var panel = $('panelFiltros'), titulo = $('tituloFiltros');
    if (!panel || !titulo) return;
    titulo.classList.add('filtros-titulo');
    titulo.setAttribute('role', 'button');
    titulo.setAttribute('tabindex', '0');
    var chev = ico('chevron'); chev.setAttribute('class', 'ico chev');
    titulo.appendChild(chev);
    if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) panel.classList.add('cerrado');
    function estado() { titulo.setAttribute('aria-expanded', String(!panel.classList.contains('cerrado'))); }
    function alternar() { panel.classList.toggle('cerrado'); estado(); }
    titulo.addEventListener('click', alternar);
    titulo.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); } });
    estado();
  }

  // ============================== menú: numeritos de carrito y mensajes ==============================
  function actualizarInsignias() {
    if (!yo) return Promise.resolve();
    return api('/resumen').then(function (r) {
      if (!r.ok) return;
      [['carrito.html', r.data.carrito], ['chats.html', r.data.sinLeer]].forEach(function (par) {
        var a = document.querySelector('.main-nav a[href="' + par[0] + '"]');
        if (!a) return;
        var viejo = a.querySelector('.nav-badge');
        if (viejo) viejo.remove();
        if (par[1] > 0) a.appendChild(h('span', { class: 'nav-badge', text: par[1] > 99 ? '99+' : String(par[1]), 'aria-label': par[1] + ' pendientes' }));
      });
    });
  }

  // ============================== buscador del encabezado ==============================
  var alBuscar = null; // la página de inicio lo reemplaza para buscar sin recargar
  function configurarBuscador() {
    var barra = document.querySelector('.search-bar');
    if (!barra || barra.getAttribute('data-buscar') === 'usuarios') return;
    var input = barra.querySelector('input');
    var boton = barra.querySelector('button');
    if (!input || !boton) return;
    function buscar() {
      var t = input.value.trim();
      if (alBuscar) alBuscar(t);
      else location.href = 'index.html' + (t ? '?buscar=' + encodeURIComponent(t) : '');
    }
    boton.addEventListener('click', buscar);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); buscar(); } });
  }

  // ============================== tarjeta de publicación ==============================
  function tarjetaPublicacion(p, op) {
    op = op || {};
    var tarjeta = h('article', { class: 'aero-panel post-card' });
    var fijo = h('div');
    var zona = h('div', { class: 'comentarios', hidden: true });
    tarjeta.appendChild(fijo);
    tarjeta.appendChild(zona);
    var comentariosCargados = false;

    function llamar(ruta, metodo, cuerpo, alOk) {
      return api(ruta, metodo, cuerpo).then(function (r) {
        if (r.status === 401) { requiereLogin(); return; }
        if (!r.ok) { aviso(r.data.error || 'No se pudo completar la acción.', 'error'); return; }
        alOk(r.data);
      });
    }

    function pintar() {
      fijo.textContent = '';
      var esAnuncio = p.categoria === 'Anuncio';
      tarjeta.classList.toggle('vendida', p.estado === 'vendida');
      tarjeta.classList.toggle('anuncio', esAnuncio);

      // --- cabecera ---
      fijo.appendChild(h('div', { class: 'post-header-user' }, [
        h('a', { href: perfilHref(p.usuario.nombre) }, [avatarDe(p.usuario)]),
        h('div', {}, [
          h('a', { href: perfilHref(p.usuario.nombre), class: 'post-username', text: '@' + p.usuario.nombre }),
          h('span', { class: 'post-meta', text: hace(p.fecha) + ' · ' + p.categoria })
        ]),
        p.estado === 'vendida' ? h('span', { class: 'etiqueta-vendida', text: 'VENDIDA' }) : null,
        p.mia ? null : h('button', {
          type: 'button', class: 'btn-icono btn-denunciar', ico: 'bandera', title: 'Denunciar', 'aria-label': 'Denunciar',
          onclick: function () {
            if (!requiereLogin()) return;
            dialogo({ titulo: 'Denunciar publicación', texto: '¿Qué está mal con esta publicación?', campo: { placeholder: 'Ej: estafa, contenido inapropiado…', max: 300 }, ok: 'Enviar denuncia' }).then(function (motivo) {
              if (!motivo) return;
              llamar('/denuncias', 'POST', { tipo: 'publicacion', id: p.id, motivo: motivo }, function (d) { aviso(d.mensaje || 'Denuncia enviada.'); });
            });
          }
        })
      ]));

      // --- cuerpo ---
      fijo.appendChild(h('div', { class: 'post-body' }, [
        p.titulo ? h('p', {}, [h('strong', { text: p.titulo })]) : null,
        h('p', { text: p.texto }),
        esAnuncio ? null : h('p', { class: 'post-precio', text: precioTexto(p.precio) })
      ]));
      if (p.imagen) fijo.appendChild(h('img', { class: 'post-image-content', src: p.imagen, alt: p.titulo || 'Foto de la publicación', loading: 'lazy' }));

      // --- botones ---
      var b = [];
      b.push(botonConteo({
        type: 'button', class: 'btn-react' + (p.yoLike ? ' activo' : ''), 'aria-pressed': String(p.yoLike),
        ico: 'corazon', title: 'Me gusta',
        onclick: function () {
          if (!requiereLogin()) return;
          llamar('/publicaciones/' + p.id + '/like', 'POST', null, function (d) { p.yoLike = d.activo; p.likes = d.total; pintar(); });
        }
      }, 'Me gusta', p.likes));
      b.push(botonConteo({
        type: 'button', class: 'btn-react', ico: 'comentario', title: 'Comentarios', 'aria-expanded': String(!zona.hidden),
        onclick: function () {
          zona.hidden = !zona.hidden;
          if (!zona.hidden && !comentariosCargados) cargarComentarios();
          pintar();
        }
      }, 'Comentarios', p.comentarios));
      b.push(h('button', {
        type: 'button', class: 'btn-react' + (p.guardado ? ' activo' : ''), 'aria-pressed': String(p.guardado),
        ico: 'marcador', text: p.guardado ? 'Guardado' : 'Guardar',
        onclick: function () {
          if (!requiereLogin()) return;
          llamar('/publicaciones/' + p.id + '/guardar', 'POST', null, function (d) {
            p.guardado = d.activo;
            aviso(d.activo ? 'Guardado en tu lista.' : 'Quitado de guardados.');
            if (!d.activo && op.alQuitarGuardado) { tarjeta.remove(); op.alQuitarGuardado(); } else pintar();
          });
        }
      }));

      b.push(h('button', { type: 'button', class: 'btn-react', ico: 'compartir', text: 'Compartir', onclick: function () { compartirPublicacion(p); } }));

      if (!p.mia && p.estado === 'activa') {
        if (!esAnuncio) b.push(p.enCarrito
          ? h('a', { class: 'btn-react activo', href: 'carrito.html', ico: 'carrito', text: 'En el carrito' })
          : h('button', {
            type: 'button', class: 'btn-react', ico: 'carrito', text: 'Agregar al carrito',
            onclick: function () {
              if (!requiereLogin()) return;
              llamar('/carrito/' + p.id, 'POST', null, function () { p.enCarrito = true; aviso('Agregado al carrito.'); actualizarInsignias(); pintar(); });
            }
          }));
        b.push(h('button', {
          type: 'button', class: 'btn-react', ico: 'sobre', text: esAnuncio ? 'Escribirle' : 'Contactar',
          onclick: function () { if (requiereLogin()) location.href = 'chats.html?con=' + p.usuario.id + '&pub=' + p.id; }
        }));
      }

      if (p.mia) {
        b.push(h('button', { type: 'button', class: 'btn-react', ico: 'lapiz', text: 'Editar', onclick: editar }));
        if (!esAnuncio) b.push(h('button', {
          type: 'button', class: 'btn-react', ico: p.estado === 'vendida' ? 'deshacer' : 'check', text: p.estado === 'vendida' ? 'Reactivar' : 'Marcar vendida',
          onclick: function () { llamar('/publicaciones/' + p.id + '/vendida', 'POST', null, function (d) { p.estado = d.estado; pintar(); }); }
        }));
        b.push(h('button', {
          type: 'button', class: 'btn-react btn-report-flag', ico: 'papelera', text: 'Eliminar',
          onclick: function () {
            dialogo({ titulo: 'Eliminar publicación', texto: 'Se borra para siempre, con sus comentarios. ¿Seguro?', ok: 'Eliminar', peligro: true }).then(function (si) {
              if (!si) return;
              llamar('/publicaciones/' + p.id, 'DELETE', null, function () { tarjeta.remove(); aviso('Publicación eliminada.'); if (op.alEliminar) op.alEliminar(); });
            });
          }
        }));
      }
      fijo.appendChild(h('div', { class: 'post-reactions' }, b));
    }

    // --- edición dentro de la misma tarjeta ---
    function editar() {
      var titulo = h('input', { type: 'text', maxlength: 80, value: p.titulo });
      var texto = h('textarea', { maxlength: 1000, rows: 3 });
      texto.value = p.texto;
      var precio = h('input', { type: 'number', min: 0, step: '0.01', value: String(p.precio) });
      var cat = h('select', {}, [['ropa', 'Ropa'], ['muebles', 'Muebles'], ['musica', 'Música'], ['anuncio', 'Anuncio']].map(function (c) {
        return h('option', { value: c[0], text: c[1], selected: c[1] === p.categoria });
      }));
      cat.onchange = function () { precio.hidden = cat.value === 'anuncio'; };
      precio.hidden = p.categoria === 'Anuncio';
      fijo.textContent = '';
      fijo.appendChild(h('div', { class: 'post-body' }, [
        h('label', { text: 'Título:' }), titulo,
        h('label', { text: 'Descripción:' }), texto,
        h('div', { class: 'post-row' }, [precio, cat]),
        h('div', { class: 'post-reactions' }, [
          h('button', {
            type: 'button', class: 'btn-aero-action', style: 'width:auto;margin:0;', text: 'Guardar cambios',
            onclick: function () {
              llamar('/publicaciones/' + p.id, 'PUT', { titulo: titulo.value, texto: texto.value, precio: precio.value, categoria: cat.value }, function (d) {
                Object.keys(d.publicacion).forEach(function (k) { p[k] = d.publicacion[k]; });
                aviso('Publicación actualizada.');
                pintar();
              });
            }
          }),
          h('button', { type: 'button', class: 'btn-react', text: 'Cancelar', onclick: pintar })
        ])
      ]));
      titulo.focus();
    }

    // --- comentarios: con respuestas, me gusta / no me gusta, fotos y denuncias ---
    var lista = [];
    var respondiendo = null;   // { id, nombre } cuando estás contestando a alguien
    var fotoComentario = '';
    var compositor = null, campoCom = null, actualizarCompositor = function () {};

    function cargarComentarios() {
      zona.textContent = 'Cargando comentarios…';
      api('/publicaciones/' + p.id + '/comentarios').then(function (r) {
        if (!r.ok) { zona.textContent = r.data.error || 'No se pudieron cargar los comentarios.'; return; }
        comentariosCargados = true;
        lista = r.data.comentarios;
        pintarComentarios();
      });
    }

    function votar(c, valor) {
      if (!requiereLogin()) return;
      llamar('/comentarios/' + c.id + '/voto', 'POST', { valor: valor }, function (d) {
        c.likes = d.likes; c.dislikes = d.dislikes; c.miVoto = d.miVoto;
        pintarComentarios();
      });
    }
    function denunciarComentario(c) {
      if (!requiereLogin()) return;
      dialogo({ titulo: 'Denunciar comentario', texto: '¿Qué está mal con este comentario?', campo: { placeholder: 'Ej: insultos, spam, contenido inapropiado…', max: 300 }, ok: 'Enviar denuncia' }).then(function (motivo) {
        if (!motivo) return;
        llamar('/denuncias', 'POST', { tipo: 'comentario', id: c.id, motivo: motivo }, function (d) { aviso(d.mensaje || 'Denuncia enviada.'); });
      });
    }
    function borrarComentario(c) {
      dialogo({ titulo: 'Borrar comentario', texto: c.padre ? 'Se borra este comentario.' : 'Se borra el comentario y todas sus respuestas.', ok: 'Borrar', peligro: true }).then(function (si) {
        if (!si) return;
        llamar('/comentarios/' + c.id, 'DELETE', null, function (d) {
          var fuera = {};
          (d.borrados || [c.id]).forEach(function (x) { fuera[x] = true; });
          lista = lista.filter(function (x) { return !fuera[x.id]; });
          p.comentarios = Math.max(0, p.comentarios - (d.borrados || [c.id]).length);
          if (respondiendo && fuera[respondiendo.id]) respondiendo = null;
          pintarComentarios();
          pintar();
        });
      });
    }

    function botonVoto(c, valor) {
      var activo = c.miVoto === valor;
      var etiqueta = valor === 1 ? 'Me gusta' : 'No me gusta';
      return h('button', {
        type: 'button', class: 'btn-voto' + (activo ? ' activo' : ''), ico: valor === 1 ? 'pulgarArriba' : 'pulgarAbajo',
        title: etiqueta, 'aria-label': etiqueta, 'aria-pressed': String(activo), onclick: function () { votar(c, valor); }
      }, [h('span', { class: 'cuenta', text: String(valor === 1 ? c.likes : c.dislikes) })]);
    }

    function filaComentario(c, esRespuesta) {
      var cuerpo = [
        h('a', { class: 'post-username', href: perfilHref(c.usuario.nombre), text: '@' + c.usuario.nombre }),
        h('span', { class: 'post-meta', text: ' ' + hace(c.fecha) }),
        esRespuesta && c.respondeA ? h('span', { class: 'responde-a', text: 'Respondió a @' + c.respondeA }) : null,
        c.oculto ? h('p', { class: 'comentario-oculto', text: 'Tu comentario está oculto por denuncias hasta que lo revisemos.' }) : null,
        c.texto ? h('p', { class: 'comentario-texto', text: c.texto }) : null,
        c.imagen ? h('img', { class: 'comentario-foto', src: c.imagen, alt: 'Foto del comentario', loading: 'lazy', onclick: function () { verImagen(c.imagen); } }) : null,
        h('div', { class: 'comentario-acciones' }, [
          botonVoto(c, 1),
          botonVoto(c, -1),
          h('button', {
            type: 'button', class: 'btn-voto', ico: 'responder', text: 'Responder',
            onclick: function () {
              if (!requiereLogin()) return;
              respondiendo = { id: c.id, nombre: c.usuario.nombre };
              actualizarCompositor();
              if (campoCom) campoCom.focus();
            }
          }),
          c.mia ? null : h('button', { type: 'button', class: 'btn-voto', ico: 'bandera', text: 'Denunciar', onclick: function () { denunciarComentario(c); } }),
          c.puedeBorrar ? h('button', { type: 'button', class: 'btn-voto', ico: 'papelera', text: 'Borrar', onclick: function () { borrarComentario(c); } }) : null
        ])
      ];
      return h('div', { class: 'comentario' + (esRespuesta ? ' es-respuesta' : '') }, [
        avatarDe(c.usuario, 'comentario-avatar'),
        h('div', { class: 'comentario-cuerpo' }, cuerpo)
      ]);
    }

    function armarCompositor() {
      campoCom = h('input', { type: 'text', maxlength: 500, placeholder: 'Escribí un comentario…', 'aria-label': 'Escribí un comentario' });
      var archivo = h('input', { type: 'file', accept: 'image/*', hidden: true });
      var vista = h('img', { class: 'comentario-foto-previa', alt: 'Foto lista para enviar (tocala para quitarla)', hidden: true });
      var chip = h('div', { class: 'respondiendo', hidden: true });
      var btnEnviar;

      actualizarCompositor = function () {
        chip.textContent = '';
        chip.hidden = !respondiendo;
        if (respondiendo) {
          chip.appendChild(h('span', { text: 'Respondiendo a @' + respondiendo.nombre }));
          chip.appendChild(h('button', { type: 'button', class: 'btn-icono', ico: 'x', title: 'Cancelar respuesta', 'aria-label': 'Cancelar respuesta', onclick: function () { respondiendo = null; actualizarCompositor(); } }));
        }
        campoCom.placeholder = respondiendo ? 'Escribí tu respuesta…' : 'Escribí un comentario…';
      };
      function enviar() {
        var t = campoCom.value.trim();
        if (!t && !fotoComentario) return;
        campoCom.disabled = true; btnEnviar.disabled = true;
        api('/publicaciones/' + p.id + '/comentarios', 'POST', { texto: t, imagen: fotoComentario || undefined, padreId: respondiendo ? respondiendo.id : undefined }).then(function (r) {
          campoCom.disabled = false; btnEnviar.disabled = false;
          if (r.status === 401) { requiereLogin(); return; }
          if (!r.ok) { aviso(r.data.error || 'No se pudo comentar.', 'error'); return; }
          lista.push(r.data.comentario);
          p.comentarios += 1;
          campoCom.value = ''; fotoComentario = ''; vista.hidden = true; vista.removeAttribute('src'); respondiendo = null;
          pintarComentarios();
          pintar();
        });
      }
      campoCom.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); enviar(); } });
      archivo.onchange = function () {
        var f = archivo.files[0];
        archivo.value = '';
        if (!f) return;
        leerImagen(f, 800, 0.8, 380000).then(function (url) { fotoComentario = url; vista.src = url; vista.hidden = false; })
          .catch(function (e) { aviso(e.message, 'error'); });
      };
      vista.addEventListener('click', function () { fotoComentario = ''; vista.hidden = true; vista.removeAttribute('src'); aviso('Foto quitada.'); });
      btnEnviar = h('button', { type: 'button', class: 'btn-aero-action', text: 'Comentar', onclick: enviar });
      compositor = h('div', { class: 'compositor' }, [
        chip,
        h('div', { class: 'comentar-fila' }, [
          campoCom,
          h('button', { type: 'button', class: 'btn-react', ico: 'camara', title: 'Agregar foto', 'aria-label': 'Agregar foto', onclick: function () { archivo.click(); } }),
          btnEnviar
        ]),
        vista, archivo
      ]);
      actualizarCompositor();
    }

    function pintarComentarios() {
      zona.textContent = '';
      var porId = {};
      lista.forEach(function (c) { porId[c.id] = c; });
      var raices = lista.filter(function (c) { return !c.padre || !porId[c.padre]; });
      var respuestas = {};
      lista.forEach(function (c) { if (c.padre && porId[c.padre]) (respuestas[c.padre] = respuestas[c.padre] || []).push(c); });
      if (!lista.length) zona.appendChild(h('p', { class: 'sin-datos', text: 'Todavía no hay comentarios.' }));
      raices.forEach(function (c) {
        var hilo = h('div', { class: 'hilo' }, [filaComentario(c, false)]);
        var hijas = respuestas[c.id] || [];
        if (hijas.length) hilo.appendChild(h('div', { class: 'respuestas' }, hijas.map(function (r) { return filaComentario(r, true); })));
        zona.appendChild(hilo);
      });
      if (yo) {
        if (!compositor) armarCompositor();
        actualizarCompositor();
        zona.appendChild(compositor);
      } else {
        zona.appendChild(h('p', { class: 'sin-datos' }, [h('a', { href: 'login.html?next=' + paginaActual(), text: 'Iniciá sesión' }), ' para comentar.']));
      }
    }

    pintar();
    return tarjeta;
  }

  // ============================== lista de publicaciones con "Ver más" ==============================
  function listaPublicaciones(contenedor, armarConsulta, opciones) {
    opciones = opciones || {};
    var offset = 0;
    var ticket = 0; // si llega una respuesta vieja (por buscar rápido), se descarta

    function textoVacio() { return typeof opciones.textoVacio === 'function' ? opciones.textoVacio() : (opciones.textoVacio || 'No hay publicaciones todavía.'); }
    function vacio() { contenedor.appendChild(h('div', { class: 'aero-panel' }, [h('p', { class: 'sin-datos', text: textoVacio() })])); }
    function actualizarVacio() { if (!contenedor.querySelector('.post-card') && !contenedor.querySelector('.sin-datos')) vacio(); }

    function cargar(reiniciar) {
      var mio = ++ticket;
      if (reiniciar) { offset = 0; contenedor.textContent = ''; contenedor.appendChild(h('p', { class: 'sin-datos', text: 'Cargando…' })); }
      var botonViejo = contenedor.querySelector('.ver-mas');
      if (botonViejo) botonViejo.remove();
      api('/publicaciones?' + armarConsulta() + (armarConsulta() ? '&' : '') + 'offset=' + offset).then(function (r) {
        if (mio !== ticket) return;
        if (reiniciar) contenedor.textContent = '';
        if (!r.ok) { contenedor.appendChild(h('p', { class: 'sin-datos', text: r.data.error || 'No se pudieron cargar las publicaciones.' })); return; }
        r.data.publicaciones.forEach(function (p) {
          contenedor.appendChild(tarjetaPublicacion(p, { alQuitarGuardado: actualizarVacio, alEliminar: actualizarVacio }));
        });
        if (opciones.alRecibir) opciones.alRecibir(r.data);
        offset += r.data.publicaciones.length;
        if (!offset) vacio();
        if (r.data.hayMas) contenedor.appendChild(h('button', { type: 'button', class: 'btn-aero-action ver-mas', text: 'Ver más publicaciones', onclick: function () { cargar(false); } }));
      });
    }
    cargar(true);
    return { recargar: function () { cargar(true); } };
  }

  // ============================== formulario "Publicar" (inicio y perfil) ==============================
  function montarPublicar(alPublicar) {
    var btn = $('btnPublicar');
    if (!btn) return;
    var titulo = $('pubTitulo'), texto = $('pubTexto'), precio = $('pubPrecio'), cat = $('pubCategoria'), foto = $('pubImagen');
    var vistaPrevia = $('pubPreview');
    var imagen = '';

    if (!yo) {
      [titulo, texto, precio, cat, foto].forEach(function (c) { if (c) c.disabled = true; });
      btn.disabled = false;
      btn.textContent = 'Iniciá sesión para publicar';
      btn.onclick = function () { requiereLogin(); };
      return;
    }
    foto.addEventListener('change', function () {
      var f = foto.files[0];
      if (!f) return;
      leerImagen(f, 900, 0.8, 550000).then(function (url) {
        imagen = url;
        vistaPrevia.src = url;
        vistaPrevia.hidden = false;
      }).catch(function (e) { foto.value = ''; aviso(e.message, 'error'); });
    });
    function alternarTipo() {
      var anuncio = cat.value === 'anuncio';
      precio.hidden = anuncio;
      texto.placeholder = anuncio ? 'Contá de qué se trata: fecha, hora, lugar (ej: Feria en Plaza Italia, sábado 10 a 18 hs)…' : 'Contanos qué tenés, estado, talle o si buscás trueque...';
      btn.textContent = anuncio ? 'Publicar anuncio' : btn.getAttribute('data-texto');
    }
    btn.setAttribute('data-texto', btn.textContent);
    cat.addEventListener('change', alternarTipo);
    function limpiar() {
      titulo.value = ''; texto.value = ''; precio.value = ''; foto.value = ''; imagen = '';
      vistaPrevia.hidden = true; vistaPrevia.removeAttribute('src');
    }
    btn.disabled = false;
    btn.onclick = function () {
      btn.disabled = true;
      api('/publicaciones', 'POST', { titulo: titulo.value, texto: texto.value, precio: precio.value, categoria: cat.value, imagen: imagen || undefined }).then(function (r) {
        btn.disabled = false;
        if (r.status === 401) { requiereLogin(); return; }
        if (!r.ok) { aviso(r.data.error || 'No se pudo publicar.', 'error'); return; }
        limpiar();
        aviso('¡Publicación creada!', 'ok');
        if (alPublicar) alPublicar(r.data.publicacion);
      });
    };
  }

  // ============================== INICIO ==============================
  function paginaInicio() {
    var muro = $('muro-publicaciones');
    var inputBusqueda = document.querySelector('.search-bar input');
    var texto = new URLSearchParams(location.search).get('buscar') || '';
    if (inputBusqueda) inputBusqueda.value = texto;

    // Orden del inicio: "Para vos" (al azar, solo lo que todavía no viste), "Recientes" o "Seguidos".
    var modo = 'azar';
    try { modo = localStorage.getItem('c4u_orden') || 'azar'; } catch (e) { /* modo privado */ }
    if (modo !== 'azar' && modo !== 'recientes' && modo !== 'seguidos') modo = 'azar';
    if (!yo && modo === 'seguidos') modo = 'azar';

    function filtros() {
      var partes = [];
      if (texto) partes.push('q=' + encodeURIComponent(texto));
      var min = $('fMin').value, max = $('fMax').value;
      if (min !== '') partes.push('min=' + encodeURIComponent(min));
      if (max !== '') partes.push('max=' + encodeURIComponent(max));
      var cats = Array.prototype.filter.call(document.querySelectorAll('[data-cat]'), function (c) { return c.checked; })
        .map(function (c) { return c.getAttribute('data-cat'); });
      if (cats.length && cats.length < document.querySelectorAll('[data-cat]').length) partes.push('cat=' + cats.join(','));
      if ($('t1').checked) partes.push('trueque=1');
      return partes;
    }
    function consulta() {
      var partes = filtros();
      if (modo === 'azar') partes.push('modo=azar', 'vistas=' + vistasLeer().join(','));
      else if (modo === 'seguidos') partes.push('seguidos=1');
      return partes.join('&');
    }
    var lista = listaPublicaciones(muro, consulta, {
      textoVacio: function () {
        if (filtros().length) return 'Oops! Lo que buscas no se encuentra :(';
        if (modo === 'seguidos') return 'Todavía no hay publicaciones de la gente que seguís. Seguí a otras personas desde su perfil.';
        return 'No hay publicaciones aún. ¡Sé el primero en publicar!';
      },
      alRecibir: function (datos) {
        if (modo === 'azar') vistasGuardar(datos.publicaciones.map(function (x) { return x.id; }), !!datos.reinicio);
      }
    });

    var barra = h('div', { class: 'orden-barra', role: 'tablist', 'aria-label': 'Orden del inicio' });
    var pestanas = [['azar', 'Para vos', 'mezcla'], ['recientes', 'Recientes', 'reloj']];
    if (yo) pestanas.push(['seguidos', 'Seguidos', 'usuarios']);
    function pintarPestanas() {
      barra.textContent = '';
      pestanas.forEach(function (t) {
        barra.appendChild(h('button', {
          type: 'button', class: 'orden-tab' + (modo === t[0] ? ' activo' : ''), role: 'tab', 'aria-selected': String(modo === t[0]),
          ico: t[2], text: t[1],
          onclick: function () {
            if (modo === t[0]) return;
            modo = t[0];
            try { localStorage.setItem('c4u_orden', modo); } catch (e) { /* modo privado */ }
            pintarPestanas();
            lista.recargar();
          }
        }));
      });
    }
    pintarPestanas();
    muro.parentNode.insertBefore(barra, muro);

    // Enlace compartido: index.html?pub=NÚMERO muestra esa publicación arriba de todo.
    var pubId = parseInt(new URLSearchParams(location.search).get('pub'), 10);
    if (pubId > 0) {
      var destacada = h('div', { class: 'pub-destacada' });
      barra.parentNode.insertBefore(destacada, barra);
      api('/publicaciones/' + pubId).then(function (r) {
        if (!r.ok) { aviso(r.data.error || 'Esa publicación no existe.', 'error'); return; }
        destacada.appendChild(h('p', { class: 'pub-destacada-titulo', text: 'Publicación compartida' }));
        destacada.appendChild(tarjetaPublicacion(r.data.publicacion, { alEliminar: function () { destacada.remove(); } }));
      });
    }

    alBuscar = function (t) {
      texto = t;
      history.replaceState(null, '', 'index.html' + (t ? '?buscar=' + encodeURIComponent(t) : ''));
      lista.recargar();
    };
    $('btnFiltros').addEventListener('click', function () { lista.recargar(); });
    // La publicación nueva aparece arriba de todo (en el modo "Para vos" no entra, porque ahí solo hay publicaciones de otras personas).
    montarPublicar(function (nueva) {
      var vacio = muro.querySelector('.sin-datos');
      if (vacio) (vacio.closest('.aero-panel') || vacio).remove();
      if (nueva) muro.insertBefore(tarjetaPublicacion(nueva, {}), muro.firstChild);
    });
  }

  // ============================== PERFIL ==============================
  function paginaPerfil() {
    var u = new URLSearchParams(location.search).get('u');
    if (u && (!yo || u.toLowerCase() !== yo.nombre.toLowerCase())) perfilAjeno(u);
    else perfilPropio();
  }

  function ponerFoto(url) {
    var img = $('profileImage');
    if (url) { img.src = url; img.style.display = 'block'; $('profilePicContainer').style.border = '2px solid #0072ce'; }
    else { img.removeAttribute('src'); img.style.display = 'none'; $('profilePicContainer').style.border = '2px dashed #999'; }
  }

  function misPublicaciones(nombre, textoVacio) {
    var cont = $('misPublicaciones');
    cont.textContent = '';
    return listaPublicaciones(cont, function () { return 'usuario=' + encodeURIComponent(nombre); }, { textoVacio: textoVacio });
  }

  function perfilPropio() {
    montarPublicar(function () { if (yo) misPublicaciones(yo.nombre, 'Aún no tenés publicaciones en tu perfil. ¡Escribí una arriba!'); });
    if (!yo) return; // visitante: la página queda en modo "solo ver"

    var campoNombre = $('profileNombre'), bio = $('profileBio'), btnFoto = $('btnCambiarFoto'), archivo = $('uploadAvatar');
    var avatarNuevo; // undefined = sin cambios, '' = quitar foto, texto = foto nueva

    $('profileUsername').textContent = '@' + yo.nombre;
    $('profileUsername').style.color = '#004b8d';
    campoNombre.value = yo.nombre; campoNombre.disabled = false;
    $('campoNombre').hidden = false;
    bio.value = yo.bio || ''; bio.disabled = false; bio.placeholder = 'Escribí tu descripción personal o de tu feria…';
    btnFoto.disabled = false;
    $('btnQuitarFoto').hidden = !yo.avatar;
    $('btnGuardar').hidden = false;
    $('panelSeguridad').hidden = false;
    montarPersonalizacion();
    aplicarTema(yo.tema, yo.fondoV, yo.nombre);
    ponerFoto(yo.avatar);

    btnFoto.onclick = function () { archivo.click(); };
    archivo.onchange = function () {
      var f = archivo.files[0];
      if (!f) return;
      leerImagen(f, 200, 0.8, 150000).then(function (url) {
        avatarNuevo = url; ponerFoto(url); $('btnQuitarFoto').hidden = false;
        aviso('Foto elegida. Tocá "Guardar cambios" para confirmarla.');
      }).catch(function (e) { aviso(e.message, 'error'); });
    };
    $('btnQuitarFoto').onclick = function () { avatarNuevo = ''; ponerFoto(''); $('btnQuitarFoto').hidden = true; };

    $('btnGuardar').onclick = function () {
      var cambios = { bio: bio.value, nombre: campoNombre.value.trim() };
      if (avatarNuevo !== undefined) cambios.avatar = avatarNuevo;
      var btn = $('btnGuardar');
      btn.disabled = true;
      api('/perfil', 'PUT', cambios).then(function (r) {
        btn.disabled = false;
        if (!r.ok) { aviso(r.data.error || 'No se pudieron guardar los cambios.', 'error'); return; }
        var cambioNombre = r.data.usuario.nombre !== yo.nombre;
        yo.nombre = r.data.usuario.nombre; yo.bio = r.data.usuario.bio; yo.avatar = r.data.usuario.avatar;
        avatarNuevo = undefined;
        guardarUsuarioLocal({ id: yo.id, nombre: yo.nombre, avatar: yo.avatar, bio: yo.bio });
        $('profileUsername').textContent = '@' + yo.nombre;
        campoNombre.value = yo.nombre;
        var hola = document.querySelector('.auth-hola');
        if (hola) hola.textContent = 'Hola, ' + yo.nombre;
        if (cambioNombre) misPublicaciones(yo.nombre, 'Aún no tenés publicaciones en tu perfil. ¡Escribí una arriba!');
        aviso('¡Cambios guardados!', 'ok');
      });
    };

    // calificación propia (solo lectura)
    api('/usuarios/' + encodeURIComponent(yo.nombre)).then(function (r) {
      if (!r.ok) return;
      $('profileRating').textContent = textoCalificacion(r.data.usuario);
      var red = montarRed(r.data.usuario);
      var caja = document.querySelector('.profile-rating');
      caja.parentNode.insertBefore(red.nodo, caja);
    });

    // cambiar contraseña
    var passActual = $('passActual'), passNueva = $('passNueva'), passConf = $('passConfirmar');
    $('verPasswords').addEventListener('change', function () {
      var tipo = this.checked ? 'text' : 'password';
      [passActual, passNueva, passConf].forEach(function (c) { c.type = tipo; });
    });
    $('btnCambiarPass').onclick = function () {
      var btn = $('btnCambiarPass');
      btn.disabled = true;
      api('/perfil/password', 'POST', { actual: passActual.value, nueva: passNueva.value, confirmar: passConf.value }).then(function (r) {
        btn.disabled = false;
        if (!r.ok) { aviso(r.data.error || 'No se pudo cambiar la contraseña.', 'error'); return; }
        passActual.value = ''; passNueva.value = ''; passConf.value = '';
        aviso('Contraseña actualizada. Se cerró tu sesión en otros dispositivos.', 'ok');
      });
    };

    // cambiar correo o teléfono (se verifica con un código enviado al contacto nuevo)
    $('contactoActual').textContent = yo.contacto || '-';
    $('btnPedirContacto').onclick = function () {
      var btn = $('btnPedirContacto');
      btn.disabled = true;
      api('/perfil/contacto/pedir', 'POST', { contacto: $('contactoNuevo').value, password: $('contactoPass').value }).then(function (r) {
        btn.disabled = false;
        if (!r.ok) { aviso(r.data.error || 'No se pudo enviar el código.', 'error'); return; }
        $('contactoPaso2').hidden = false;
        $('contactoCodigo').focus();
        aviso(r.data.mensaje || 'Te enviamos un código.', 'ok');
      });
    };
    $('btnConfirmarContacto').onclick = function () {
      var btn = $('btnConfirmarContacto');
      btn.disabled = true;
      api('/perfil/contacto/confirmar', 'POST', { codigo: $('contactoCodigo').value }).then(function (r) {
        btn.disabled = false;
        if (!r.ok) { aviso(r.data.error || 'No se pudo cambiar.', 'error'); return; }
        $('contactoActual').textContent = r.data.contacto;
        $('contactoNuevo').value = ''; $('contactoPass').value = ''; $('contactoCodigo').value = '';
        $('contactoPaso2').hidden = true;
        aviso('Listo: tu correo o teléfono se actualizó.', 'ok');
      });
    };

    misPublicaciones(yo.nombre, 'Aún no tenés publicaciones en tu perfil. ¡Escribí una arriba!');
  }

  function perfilAjeno(nombre) {
    // El mismo diseño, pero solo para mirar. Se ocultan los controles de edición.
    ['panelCrearPublicacion', 'panelSeguridad', 'btnCambiarFoto', 'btnQuitarFoto', 'btnGuardar', 'campoNombre'].forEach(function (id) { if ($(id)) $(id).hidden = true; });
    $('profileBio').hidden = true;
    var bioTexto = h('p', { class: 'bio-texto' });
    $('profileBio').parentNode.insertBefore(bioTexto, $('profileBio'));
    $('tituloPublicaciones').textContent = 'Publicaciones de @' + nombre;
    $('profileUsername').textContent = '@' + nombre;

    api('/usuarios/' + encodeURIComponent(nombre)).then(function (r) {
      if (!r.ok) {
        $('profileUsername').textContent = 'Usuario no encontrado';
        $('misPublicaciones').textContent = '';
        $('misPublicaciones').appendChild(h('p', { class: 'sin-datos', text: r.data.error || 'Ese usuario no existe.' }));
        return;
      }
      var c = r.data.usuario;
      document.title = '@' + c.nombre + ' - Clothes4Us';
      aplicarTema(c.tema, c.fondoV, c.nombre);
      $('profileUsername').textContent = '@' + c.nombre;
      $('profileUsername').style.color = '#004b8d';
      ponerFoto(c.avatar);
      bioTexto.textContent = c.bio || 'Este usuario todavía no escribió una descripción.';
      var acciones = $('accionesAjenas');
      acciones.hidden = false;
      $('profileRating').textContent = textoCalificacion(c);

      acciones.textContent = '';
      var red = montarRed(c);
      var cajaRating = document.querySelector('.profile-rating');
      cajaRating.parentNode.insertBefore(red.nodo, cajaRating);

      // Seguir / Siguiendo, y si se siguen los dos: Amigos.
      var etiquetaRel = h('p', { class: 'etiqueta-rel' });
      function pintarRel() {
        etiquetaRel.textContent = c.esAmigo ? 'Son amigos' : (c.meSigue ? 'Te sigue' : '');
        etiquetaRel.hidden = !etiquetaRel.textContent;
      }
      pintarRel();
      acciones.appendChild(etiquetaRel);
      var estado = { id: c.id, loSigo: c.loSigo };
      acciones.appendChild(botonSeguir(estado, function (d) {
        var eraAmigo = c.esAmigo;
        c.loSigo = d.siguiendo; c.esAmigo = !!d.amigos;
        red.actualizar({ seguidores: d.seguidores, amigos: red.cuenta.amigos + (c.esAmigo ? 1 : 0) - (eraAmigo ? 1 : 0) });
        pintarRel();
        aviso(d.siguiendo ? 'Ahora seguís a @' + c.nombre + (c.esAmigo ? '. ¡Ya son amigos!' : '.') : 'Dejaste de seguir a @' + c.nombre + '.');
      }));
      acciones.appendChild(h('button', { type: 'button', class: 'btn-aero-action', ico: 'sobre', text: 'Enviar mensaje', onclick: function () { if (requiereLogin()) location.href = 'chats.html?con=' + c.id; } }));

      // Calificar con estrellas
      var fila = h('div', { class: 'calificar', role: 'group', 'aria-label': 'Calificar a este usuario' });
      function pintarEstrellas() {
        fila.textContent = '';
        fila.appendChild(h('span', { class: 'calificar-texto', text: c.miCalificacion ? 'Tu calificación:' : 'Calificá a este usuario:' }));
        for (var i = 1; i <= 5; i++) {
          (function (n) {
            fila.appendChild(h('button', {
              type: 'button', class: 'estrella' + (n <= c.miCalificacion ? ' on' : ''), text: '★', title: n + (n === 1 ? ' estrella' : ' estrellas'), 'aria-label': n + ' de 5',
              onclick: function () {
                if (!requiereLogin()) return;
                api('/usuarios/' + c.id + '/calificar', 'POST', { estrellas: n }).then(function (rr) {
                  if (!rr.ok) { aviso(rr.data.error || 'No se pudo calificar.', 'error'); return; }
                  c.miCalificacion = rr.data.miCalificacion; c.calificacion = rr.data.calificacion; c.cantidadCalificaciones = rr.data.cantidad;
                  pintarEstrellas(); $('profileRating').textContent = textoCalificacion(c); aviso('¡Gracias por calificar!', 'ok');
                });
              }
            }));
          })(i);
        }
      }
      pintarEstrellas();
      acciones.appendChild(fila);

      var bloquear = h('button', {
        type: 'button', class: 'btn-react', style: 'color:#cc0000;', ico: c.bloqueado ? 'candado' : 'prohibido', text: c.bloqueado ? 'Desbloquear' : 'Bloquear',
        onclick: function () {
          if (!requiereLogin()) return;
          api('/bloqueos/' + c.id, 'POST').then(function (rr) {
            if (!rr.ok) { aviso(rr.data.error || 'No se pudo completar.', 'error'); return; }
            c.bloqueado = rr.data.bloqueado;
            if (c.bloqueado) location.reload();
            conIcono(bloquear, c.bloqueado ? 'candado' : 'prohibido', c.bloqueado ? 'Desbloquear' : 'Bloquear');
            aviso(c.bloqueado ? 'Usuario bloqueado. No verás sus publicaciones ni podrán escribirte.' : 'Usuario desbloqueado.');
          });
        }
      });
      var denunciar = h('button', {
        type: 'button', class: 'btn-react btn-report-flag', style: 'margin-left:0;', ico: 'bandera', text: 'Denunciar',
        onclick: function () {
          if (!requiereLogin()) return;
          dialogo({ titulo: 'Denunciar usuario', texto: '¿Qué pasó con @' + c.nombre + '?', campo: { placeholder: 'Contanos el motivo…', max: 300 }, ok: 'Enviar denuncia' }).then(function (motivo) {
            if (!motivo) return;
            api('/denuncias', 'POST', { tipo: 'usuario', id: c.id, motivo: motivo }).then(function (rr) {
              aviso(rr.ok ? (rr.data.mensaje || 'Denuncia enviada.') : (rr.data.error || 'No se pudo enviar.'), rr.ok ? 'ok' : 'error');
            });
          });
        }
      });
      acciones.appendChild(h('div', { class: 'fila-botones' }, [bloquear, denunciar]));

      misPublicaciones(c.nombre, '@' + c.nombre + ' todavía no tiene publicaciones.');
    });
  }

  // ============================== GUARDADOS ==============================
  function paginaGuardados() {
    var cont = $('listaGuardados');
    if (!yo) {
      cont.appendChild(h('p', { class: 'sin-datos' }, ['Iniciá sesión para ver tus publicaciones guardadas. ', h('a', { href: 'login.html?next=articulos.html', text: 'Iniciar sesión' })]));
      return;
    }
    listaPublicaciones(cont, function () { return 'guardadas=1'; }, { textoVacio: 'Todavía no guardaste nada. Tocá el botón Guardar en cualquier publicación.' });
  }

  // ============================== CARRITO ==============================
  function paginaCarrito() {
    var cont = $('listaCarrito');
    var resumen = $('resumenCarrito');
    if (!yo) {
      cont.appendChild(h('p', { class: 'sin-datos' }, ['Iniciá sesión para usar el carrito. ', h('a', { href: 'login.html?next=carrito.html', text: 'Iniciar sesión' })]));
      return;
    }

    function cargar() {
      api('/carrito').then(function (r) {
        cont.textContent = '';
        if (!r.ok) { cont.appendChild(h('p', { class: 'sin-datos', text: r.data.error || 'No se pudo cargar el carrito.' })); return; }
        var items = r.data.items;
        if (!items.length) {
          resumen.hidden = true;
          cont.appendChild(h('div', { class: 'sin-datos' }, [h('p', { text: 'Tu carrito está vacío.' }), h('p', {}, ['Explorá el ', h('a', { href: 'index.html', text: 'Inicio' }), ' y tocá "Agregar al carrito".'])]));
          return;
        }
        var total = 0, aConvenir = 0;
        items.forEach(function (it) {
          var disponible = it.estado === 'activa';
          if (disponible) { if (it.precio > 0) total += it.precio; else aConvenir++; }
          cont.appendChild(h('article', { class: 'aero-panel carrito-item' + (disponible ? '' : ' vendida') }, [
            it.imagen ? h('img', { class: 'carrito-foto', src: it.imagen, alt: it.titulo, loading: 'lazy' }) : h('div', { class: 'carrito-foto carrito-sin-foto', ico: 'camisa' }),
            h('div', { class: 'carrito-info' }, [
              h('strong', { text: it.titulo || 'Publicación' }),
              h('p', { class: 'post-meta' }, ['Vende ', h('a', { class: 'post-username', href: perfilHref(it.vendedor.nombre), text: '@' + it.vendedor.nombre })]),
              h('p', { class: 'post-precio', text: disponible ? precioTexto(it.precio) : 'Ya no está disponible' })
            ]),
            h('div', { class: 'carrito-botones' }, [
              disponible ? h('a', { class: 'btn-react', href: 'chats.html?con=' + it.vendedor.id + '&pub=' + it.id, ico: 'sobre', text: 'Contactar' }) : null,
              h('button', {
                type: 'button', class: 'btn-react btn-report-flag', style: 'margin-left:0;', ico: 'papelera', text: 'Quitar',
                onclick: function () { api('/carrito/' + it.id, 'DELETE').then(function () { cargar(); actualizarInsignias(); }); }
              })
            ])
          ]));
        });
        resumen.hidden = false;
        $('totalCarrito').textContent = '$' + total.toLocaleString('es-AR') + ' ARS' + (aConvenir ? ' + ' + aConvenir + (aConvenir === 1 ? ' trueque' : ' trueques') : '');
      });
    }
    $('btnVaciar').onclick = function () {
      dialogo({ titulo: 'Vaciar carrito', texto: '¿Querés quitar todo del carrito?', ok: 'Vaciar', peligro: true }).then(function (si) {
        if (si) api('/carrito', 'DELETE').then(function () { cargar(); actualizarInsignias(); });
      });
    };
    cargar();
  }

  // ============================== CHATS ==============================
  function paginaChats() {
    var lista = $('chatLista'), historial = $('chatHistorial'), titulo = $('chatTitulo'), caja = $('chatTexto');
    var btnEnviar = $('btnEnviar'), btnFoto = $('btnFotoChat'), btnEmoji = $('btnEmoji'), archivo = $('chatArchivo');
    var paleta = $('chatEmojis'), contexto = $('chatContexto'), vista = $('chatFotoPreview');
    var btnBloquear = $('btnChatBloquear'), btnDenunciar = $('btnChatDenunciar');
    var envoltorio = document.querySelector('.chat-wrapper');

    if (!yo) {
      lista.textContent = '';
      lista.appendChild(h('p', { class: 'sin-datos' }, ['Iniciá sesión para chatear. ', h('a', { href: 'login.html?next=chats.html', text: 'Iniciar sesión' })]));
      [caja, btnEnviar, btnFoto, btnEmoji, btnBloquear, btnDenunciar].forEach(function (e) { e.disabled = true; });
      return;
    }

    var activo = null, ultimoId = 0, bloqueo = { yo: false, ellos: false }, fotoPendiente = '', pubContexto = null, timerChat = null, buscando = false;
    var prefs = { fijado: false, silenciado: false };

    // Fijar arriba, silenciar y vaciar la conversación (solo para vos: la otra persona no se entera).
    var btnFijar = h('button', { type: 'button', class: 'btn-react', style: 'display:inline-flex;', disabled: true, ico: 'pin', text: 'Fijar' });
    var btnSilenciar = h('button', { type: 'button', class: 'btn-react', style: 'display:inline-flex;', disabled: true, ico: 'campanaOff', text: 'Silenciar' });
    var btnVaciar = h('button', { type: 'button', class: 'btn-react', style: 'display:inline-flex;', disabled: true, ico: 'papelera', text: 'Vaciar chat' });
    [btnFijar, btnSilenciar, btnVaciar].forEach(function (b) { btnDenunciar.parentNode.insertBefore(b, btnDenunciar); });
    function pintarPrefs() {
      conIcono(btnFijar, 'pin', prefs.fijado ? 'Desfijar' : 'Fijar');
      btnFijar.classList.toggle('activo', !!prefs.fijado);
      conIcono(btnSilenciar, prefs.silenciado ? 'campana' : 'campanaOff', prefs.silenciado ? 'Activar avisos' : 'Silenciar');
      btnSilenciar.classList.toggle('activo', !!prefs.silenciado);
    }
    function cambiarPref(cambio, aviso1) {
      if (!activo) return;
      api('/chats/' + activo.id + '/prefs', 'POST', cambio).then(function (r) {
        if (!r.ok) { aviso(r.data.error || 'No se pudo completar.', 'error'); return; }
        prefs.fijado = r.data.fijado; prefs.silenciado = r.data.silenciado;
        pintarPrefs(); cargarLista(); actualizarInsignias();
        aviso(aviso1(r.data));
      });
    }
    btnFijar.onclick = function () { cambiarPref({ fijado: !prefs.fijado }, function (d) { return d.fijado ? 'Chat fijado arriba.' : 'Chat desfijado.'; }); };
    btnSilenciar.onclick = function () { cambiarPref({ silenciado: !prefs.silenciado }, function (d) { return d.silenciado ? 'Chat silenciado: no suma al numerito del menú.' : 'Avisos activados.'; }); };
    btnVaciar.onclick = function () {
      if (!activo) return;
      dialogo({ titulo: 'Vaciar chat', texto: 'Se borran los mensajes de esta conversación solo para vos. @' + activo.nombre + ' los sigue viendo. ¿Seguro?', ok: 'Vaciar', peligro: true }).then(function (si) {
        if (!si) return;
        api('/chats/' + activo.id + '/vaciar', 'POST').then(function (r) {
          if (!r.ok) { aviso(r.data.error || 'No se pudo vaciar.', 'error'); return; }
          aviso('Chat vaciado.');
          abrir(activo.id);
        });
      });
    };

    ['😀', '😂', '😍', '👍', '🙏', '👕', '👗', '👟', '🧥', '♻️', '💙', '🎉'].forEach(function (e) {
      paleta.appendChild(h('button', { type: 'button', class: 'btn-react', text: e, 'aria-label': 'Emoji ' + e, onclick: function () { caja.value += e; caja.focus(); } }));
    });
    btnEmoji.onclick = function () { paleta.hidden = !paleta.hidden; };

    // ---- lista de conversaciones ----
    function itemChat(usuario, linea, sinLeer, pf) {
      pf = pf || {};
      return h('button', {
        type: 'button', class: 'chat-user-item' + (activo && activo.id === usuario.id ? ' activo' : ''),
        onclick: function () { abrir(usuario.id); }
      }, [
        avatarDe(usuario, 'comentario-avatar'),
        h('div', { class: 'chat-user-info' }, [
          h('strong', { text: '@' + usuario.nombre }),
          h('span', { class: 'post-meta', text: linea })
        ]),
        pf.fijado || pf.silenciado ? h('span', { class: 'chat-marcas' }, [
          pf.fijado ? h('span', { title: 'Fijado', 'aria-label': 'Fijado' }, [ico('pin')]) : null,
          pf.silenciado ? h('span', { title: 'Silenciado', 'aria-label': 'Silenciado' }, [ico('campanaOff')]) : null
        ]) : null,
        sinLeer > 0 ? h('span', { class: 'nav-badge' + (pf.silenciado ? ' silenciado' : ''), text: String(sinLeer) }) : null
      ]);
    }
    function cargarLista() {
      if (buscando) return;
      api('/chats').then(function (r) {
        if (!r.ok || buscando) return;
        lista.textContent = '';
        if (!r.data.chats.length) { lista.appendChild(h('p', { class: 'sin-datos', text: 'Sin conversaciones recientes. Buscá un usuario arriba o tocá "Contactar" en una publicación.' })); return; }
        r.data.chats.forEach(function (c) {
          lista.appendChild(itemChat(c.usuario, (c.mio ? 'Vos: ' : '') + c.ultimo, c.sinLeer, c));
        });
        actualizarInsignias();
      });
    }

    // ---- buscador de usuarios (el de la barra superior) ----
    var barra = document.querySelector('.search-bar');
    var inputBuscar = barra.querySelector('input');
    function buscarUsuarios() {
      var q = inputBuscar.value.trim();
      if (q.length < 2) { buscando = false; cargarLista(); if (q) aviso('Escribí al menos 2 letras.'); return; }
      buscando = true;
      api('/usuarios?q=' + encodeURIComponent(q)).then(function (r) {
        lista.textContent = '';
        if (!r.ok || !r.data.usuarios.length) { lista.appendChild(h('p', { class: 'sin-datos', text: 'No encontramos usuarios con ese nombre.' })); return; }
        r.data.usuarios.forEach(function (u) { lista.appendChild(itemChat(u, 'Tocá para chatear', 0)); });
      });
    }
    barra.querySelector('button').addEventListener('click', buscarUsuarios);
    inputBuscar.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); buscarUsuarios(); } });
    inputBuscar.addEventListener('input', function () { if (!inputBuscar.value.trim() && buscando) { buscando = false; cargarLista(); } });

    // ---- mensajes ----
    function burbuja(m) {
      return h('div', { class: 'chat-msg ' + (m.mio ? 'me' : 'them'), 'data-id': m.id }, [
        m.publicacion ? h('a', { class: 'chat-sobre', href: 'index.html?pub=' + m.publicacion.id, text: 'Sobre: ' + (m.publicacion.titulo || 'una publicación') }) : null,
        m.texto ? h('span', { class: 'chat-texto', text: m.texto }) : null,
        m.imagen ? h('img', { class: 'chat-foto', src: m.imagen, alt: 'Foto enviada', loading: 'lazy' }) : null,
        h('span', { class: 'chat-time', text: horaCorta(m.fecha) })
      ]);
    }
    function agregarMensajes(msgs, reemplazar) {
      var cerca = historial.scrollHeight - historial.scrollTop - historial.clientHeight < 80;
      if (reemplazar) historial.textContent = '';
      var vacioMsg = historial.querySelector('.sin-datos');
      if (vacioMsg && msgs.length) vacioMsg.remove();
      msgs.forEach(function (m) { historial.appendChild(burbuja(m)); ultimoId = Math.max(ultimoId, m.id); });
      if (reemplazar && !msgs.length) historial.appendChild(h('p', { class: 'sin-datos', text: 'Todavía no hay mensajes. ¡Saludá!' }));
      if (reemplazar || cerca) historial.scrollTop = historial.scrollHeight;
    }
    function estadoBloqueo() {
      var bloqueado = bloqueo.yo || bloqueo.ellos;
      caja.disabled = bloqueado; btnEnviar.disabled = bloqueado; btnFoto.disabled = bloqueado;
      caja.placeholder = bloqueo.yo ? 'Bloqueaste a este usuario. Desbloquealo para escribirle.' : bloqueo.ellos ? 'No podés enviar mensajes a este usuario.' : 'Escribí un mensaje…';
      conIcono(btnBloquear, bloqueo.yo ? 'candado' : 'prohibido', bloqueo.yo ? 'Desbloquear' : 'Bloquear');
    }
    function abrir(id) {
      clearInterval(timerChat);
      api('/chats/' + id).then(function (r) {
        if (!r.ok) { aviso(r.data.error || 'No se pudo abrir el chat.', 'error'); return; }
        activo = r.data.usuario; ultimoId = 0; bloqueo = r.data.bloqueo;
        titulo.textContent = '';
        titulo.appendChild(h('a', { href: perfilHref(activo.nombre), class: 'post-username', text: '@' + activo.nombre }));
        btnBloquear.disabled = false; btnDenunciar.disabled = false;
        btnFijar.disabled = false; btnSilenciar.disabled = false; btnVaciar.disabled = false;
        prefs.fijado = !!r.data.fijado; prefs.silenciado = !!r.data.silenciado; pintarPrefs();
        estadoBloqueo();
        agregarMensajes(r.data.mensajes, true);
        envoltorio.classList.add('con-chat');
        cargarLista();
        actualizarInsignias();
        timerChat = setInterval(function () {
          if (document.hidden || !activo) return;
          api('/chats/' + activo.id + '?desde=' + ultimoId).then(function (rr) {
            if (!rr.ok) return;
            bloqueo = rr.data.bloqueo; estadoBloqueo();
            prefs.fijado = !!rr.data.fijado; prefs.silenciado = !!rr.data.silenciado; pintarPrefs();
            if (rr.data.mensajes.length) { agregarMensajes(rr.data.mensajes, false); actualizarInsignias(); }
          });
        }, 4000);
      });
    }

    function enviar() {
      if (!activo) { aviso('Elegí un chat primero.'); return; }
      var t = caja.value.trim();
      if (!t && !fotoPendiente) return;
      btnEnviar.disabled = true;
      api('/chats/' + activo.id, 'POST', { texto: t, imagen: fotoPendiente || undefined, publicacionId: pubContexto ? pubContexto.id : undefined }).then(function (r) {
        btnEnviar.disabled = false;
        if (!r.ok) { aviso(r.data.error || 'No se pudo enviar.', 'error'); return; }
        caja.value = ''; fotoPendiente = ''; vista.hidden = true; vista.removeAttribute('src'); paleta.hidden = true;
        pubContexto = null; contexto.hidden = true;
        api('/chats/' + activo.id + '?desde=' + ultimoId).then(function (rr) {
          if (rr.ok) { agregarMensajes(rr.data.mensajes, false); historial.scrollTop = historial.scrollHeight; }
          cargarLista();
        });
      });
    }
    btnEnviar.onclick = enviar;
    caja.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } });

    btnFoto.onclick = function () { archivo.click(); };
    archivo.onchange = function () {
      var f = archivo.files[0];
      archivo.value = '';
      if (!f) return;
      leerImagen(f, 800, 0.8, 380000).then(function (url) { fotoPendiente = url; vista.src = url; vista.hidden = false; })
        .catch(function (e) { aviso(e.message, 'error'); });
    };
    vista.addEventListener('click', function () { fotoPendiente = ''; vista.hidden = true; vista.removeAttribute('src'); aviso('Foto quitada.'); });

    btnBloquear.onclick = function () {
      if (!activo) return;
      api('/bloqueos/' + activo.id, 'POST').then(function (r) {
        if (!r.ok) { aviso(r.data.error || 'No se pudo completar.', 'error'); return; }
        bloqueo.yo = r.data.bloqueado; estadoBloqueo();
        aviso(r.data.bloqueado ? 'Usuario bloqueado.' : 'Usuario desbloqueado.');
      });
    };
    btnDenunciar.onclick = function () {
      if (!activo) return;
      dialogo({ titulo: 'Denunciar usuario', texto: '¿Qué pasó con @' + activo.nombre + '?', campo: { placeholder: 'Contanos el motivo…', max: 300 }, ok: 'Enviar denuncia' }).then(function (motivo) {
        if (!motivo) return;
        api('/denuncias', 'POST', { tipo: 'usuario', id: activo.id, motivo: motivo }).then(function (r) {
          aviso(r.ok ? (r.data.mensaje || 'Denuncia enviada.') : (r.data.error || 'No se pudo enviar.'), r.ok ? 'ok' : 'error');
        });
      });
    };
    $('btnVolverLista').onclick = function () { envoltorio.classList.remove('con-chat'); };

    // ---- arranque: ?con=ID (desde "Contactar") y ?pub=ID (para saludar mencionando la prenda) ----
    cargarLista();
    setInterval(function () { if (!document.hidden) cargarLista(); }, 8000);
    var params = new URLSearchParams(location.search);
    var con = parseInt(params.get('con'), 10);
    var pub = parseInt(params.get('pub'), 10);
    if (con > 0) {
      if (con === yo.id) { aviso('No podés chatear con vos mismo.'); return; }
      abrir(con);
      if (pub > 0) {
        api('/publicaciones/' + pub).then(function (r) {
          if (!r.ok) return;
          pubContexto = { id: r.data.publicacion.id, titulo: r.data.publicacion.titulo };
          contexto.textContent = 'Sobre: ' + (pubContexto.titulo || 'la publicación') + '  ✕';
          contexto.hidden = false;
          if (!caja.value) caja.value = '¡Hola! Me interesa «' + (pubContexto.titulo || 'tu publicación') + '». ¿Sigue disponible?';
        });
        contexto.onclick = function () { pubContexto = null; contexto.hidden = true; };
      }
    }
  }

  // Solo para quienes moderan (ADMIN_USERS en el .env del servidor).
  function agregarEnlaceModeracion() {
    var ul = document.querySelector('.main-nav ul');
    if (!ul || ul.querySelector('a[href="admin.html"]')) return;
    ul.appendChild(h('li', {}, [h('a', { href: 'admin.html', ico: 'bandera', text: 'Moderación' })]));
  }

  // ============================== arranque ==============================
  document.addEventListener('DOMContentLoaded', function () {
    decorarIconos();
    vigilarIconos();
    configurarFiltrosPlegables();
    configurarBuscador();
    api('/me').then(function (r) {
      yo = r.ok && r.data.usuario ? r.data.usuario : null;
      if (yo && yo.admin) agregarEnlaceModeracion();
      actualizarInsignias();
      if (PAGINA === 'inicio') paginaInicio();
      else if (PAGINA === 'perfil') paginaPerfil();
      else if (PAGINA === 'guardados') paginaGuardados();
      else if (PAGINA === 'carrito') paginaCarrito();
      else if (PAGINA === 'chats') paginaChats();
    });
  });
})();