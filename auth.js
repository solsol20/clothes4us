/* Clothes4Us - lógica del navegador para login, registro y recuperación de contraseña.
   Cada página de acceso tiene <body data-page="login|registro|recuperar|restablecer">.
   Además, en CUALQUIER página con <div class="user-quick-auth"> muestra "Hola, usuario" y "Salir". */
(function () {
  'use strict';

  // 👉 A dónde ir después de iniciar sesión / registrarse:
  var PAGINA_DESPUES_DE_LOGIN = 'index.html';
  var PAGINA_LOGIN = 'login.html';
  // Dónde se guarda el usuario en el navegador (por si tus otras páginas lo leen de localStorage).
  var CLAVE_USUARIO = 'usuario';

  var $ = function (id) { return document.getElementById(id); };

  // ---------- comunicación con el servidor ----------
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
      return { ok: false, status: 0, data: { error: 'No pudimos conectarnos al servidor. Abrí el sitio desde http://localhost:3000 (o la IP de tu PC) y revisá que el servidor esté encendido.' } };
    });
  }

  function guardarUsuario(u) { try { localStorage.setItem(CLAVE_USUARIO, JSON.stringify(u)); } catch (e) { /* modo privado */ } }
  function borrarUsuario() { try { localStorage.removeItem(CLAVE_USUARIO); } catch (e) { /* ignorar */ } }

  // ---------- avisos en pantalla ----------
  function mostrarAlerta(texto, tipo) {
    var el = $('alerta');
    if (!el) return;
    el.textContent = texto;
    el.className = 'auth-alert show ' + (tipo || 'error');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function limpiarAlerta() {
    var el = $('alerta');
    if (el) { el.className = 'auth-alert'; el.textContent = ''; }
  }
  function mensaje(id, texto, tipo) {
    var el = $(id);
    if (!el) return;
    el.textContent = texto || '';
    el.className = 'auth-msg' + (tipo ? ' ' + tipo : '');
  }
  function marcarInvalido(id, invalido) {
    var el = $(id);
    if (!el) return;
    if (invalido) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }
  function ocupado(si, texto) {
    var b = $('btn-enviar');
    if (!b) return;
    if (si) { b.dataset.texto = b.textContent; b.textContent = texto || 'Procesando…'; b.disabled = true; }
    else { b.textContent = b.dataset.texto || b.textContent; b.disabled = false; }
  }
  // Solo se vuelve a páginas internas del sitio (evita redirecciones a sitios externos).
  function destino() {
    var n = new URLSearchParams(location.search).get('next');
    return n && /^[A-Za-z0-9_\-]+\.html$/.test(n) ? n : PAGINA_DESPUES_DE_LOGIN;
  }

  // ---------- botón de ojo "ver contraseña" ----------
  document.querySelectorAll('[data-ver]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var campo = $(btn.getAttribute('data-ver'));
      if (!campo) return;
      var mostrar = campo.type === 'password';
      campo.type = mostrar ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(mostrar));
      btn.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
      campo.focus();
    });
  });

  // ---------- reglas (las mismas que valida el servidor) ----------
  function revisarUsuario(u) {
    if (u.length < 4 || u.length > 20) return 'Debe tener entre 4 y 20 caracteres.';
    if (!/^[A-Za-z0-9_.\-#$!]+$/.test(u)) return 'Solo letras, números y los símbolos _ . - # $ ! (sin espacios).';
    if (!/[_.\-#$!]/.test(u)) return 'Falta al menos un símbolo (_ . - # $ !).';
    if (!/[A-Za-z]/.test(u)) return 'Debe incluir al menos una letra.';
    return null;
  }
  function reglasPassword(p) {
    return { largo: p.length >= 8, minuscula: /[a-z]/.test(p), mayuscula: /[A-Z]/.test(p), numero: /[0-9]/.test(p), simbolo: /[^A-Za-z0-9]/.test(p) };
  }
  function passwordValida(p) {
    var r = reglasPassword(p);
    return r.largo && r.minuscula && r.mayuscula && r.numero && r.simbolo && p.length <= 72;
  }
  function revisarContacto(v) {
    v = v.trim();
    if (!v) return 'Ingresá un correo o un teléfono.';
    if (v.indexOf('@') !== -1) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : 'El correo no es válido.';
    return /^\+?[0-9]{8,15}$/.test(v.replace(/[\s().\-]/g, '')) ? null : 'El teléfono no es válido (8 a 15 números, podés empezar con +).';
  }
  function activarReglasPassword() {
    var lista = document.querySelector('[data-reglas-de]');
    if (!lista) return;
    var campo = $(lista.getAttribute('data-reglas-de'));
    campo.addEventListener('input', function () {
      var r = reglasPassword(campo.value);
      lista.querySelectorAll('li').forEach(function (li) {
        li.classList.toggle('cumple', !!r[li.getAttribute('data-regla')]);
      });
    });
  }
  function activarCoincidencia(idPass, idConfirmar) {
    var p = $(idPass), c = $(idConfirmar);
    if (!p || !c) return;
    function revisar() {
      if (!c.value) { mensaje('msg-confirmar', ''); marcarInvalido(idConfirmar, false); return; }
      if (p.value === c.value) { mensaje('msg-confirmar', 'Las contraseñas coinciden.', 'ok'); marcarInvalido(idConfirmar, false); }
      else { mensaje('msg-confirmar', 'Las contraseñas no coinciden.', 'error'); marcarInvalido(idConfirmar, true); }
    }
    p.addEventListener('input', revisar);
    c.addEventListener('input', revisar);
  }

  // Si ya hay sesión iniciada, no tiene sentido ver login ni registro.
  function irSiYaIniciada() {
    return api('/me').then(function (r) { if (r.ok) location.replace(destino()); });
  }

  // ====================== LOGIN ======================
  function paginaLogin() {
    irSiYaIniciada();
    $('form-login').addEventListener('submit', function (e) {
      e.preventDefault();
      limpiarAlerta();
      var ident = $('identificador').value.trim();
      var pass = $('password').value;
      if (!ident || !pass) { mostrarAlerta('Completá tu usuario y tu contraseña.'); return; }
      ocupado(true, 'Ingresando…');
      api('/login', 'POST', { identificador: ident, password: pass, recordar: $('recordar').checked }).then(function (r) {
        if (r.ok) { guardarUsuario(r.data.usuario); location.href = destino(); return; }
        ocupado(false);
        mostrarAlerta(r.data.error || 'No pudimos iniciar sesión.');
        $('password').value = '';
        $('password').focus();
      });
    });
  }

  // ====================== REGISTRO ======================
  function paginaRegistro() {
    irSiYaIniciada();
    activarReglasPassword();
    activarCoincidencia('password', 'confirmar');

    var campoUser = $('username');
    var temporizador = null, numPedido = 0;
    var AYUDA_USER = '4 a 20 caracteres, con al menos una letra y un símbolo (_ . - # $ !). Ej: lola_vintage';

    campoUser.addEventListener('input', function () {
      var u = campoUser.value;
      campoUser.classList.remove('es-valido');
      clearTimeout(temporizador);
      if (!u) { mensaje('msg-username', AYUDA_USER); marcarInvalido('username', false); return; }
      var error = revisarUsuario(u);
      if (error) { mensaje('msg-username', error, 'error'); marcarInvalido('username', true); return; }
      marcarInvalido('username', false);
      mensaje('msg-username', 'Revisando si está disponible…');
      var mio = ++numPedido;
      temporizador = setTimeout(function () {
        api('/usuario-disponible?u=' + encodeURIComponent(u)).then(function (r) {
          if (mio !== numPedido) return; // llegó una respuesta vieja
          if (r.status === 0) { mensaje('msg-username', ''); return; }
          if (r.data.disponible) {
            campoUser.classList.add('es-valido');
            mensaje('msg-username', '¡Ese usuario está disponible!', 'ok');
          } else {
            marcarInvalido('username', true);
            mensaje('msg-username', r.data.motivo || 'Ese usuario no está disponible.', 'error');
          }
        });
      }, 400);
    });

    $('form-registro').addEventListener('submit', function (e) {
      e.preventDefault();
      limpiarAlerta();
      ['username', 'contacto', 'confirmar'].forEach(function (c) { marcarInvalido(c, false); });
      var datos = {
        username: campoUser.value.trim(),
        contacto: $('contacto').value.trim(),
        password: $('password').value,
        confirmar: $('confirmar').value
      };

      var eUser = revisarUsuario(datos.username);
      if (eUser) { mensaje('msg-username', eUser, 'error'); marcarInvalido('username', true); campoUser.focus(); return; }
      var eCont = revisarContacto(datos.contacto);
      if (eCont) { mensaje('msg-contacto', eCont, 'error'); marcarInvalido('contacto', true); $('contacto').focus(); return; }
      mensaje('msg-contacto', '');
      if (!passwordValida(datos.password)) { mostrarAlerta('La contraseña debe tener 8 o más caracteres, una mayúscula, una minúscula, un número y un símbolo.'); $('password').focus(); return; }
      if (datos.password !== datos.confirmar) { mensaje('msg-confirmar', 'Las contraseñas no coinciden.', 'error'); marcarInvalido('confirmar', true); $('confirmar').focus(); return; }

      ocupado(true, 'Creando cuenta…');
      api('/registro', 'POST', datos).then(function (r) {
        if (r.ok) { guardarUsuario(r.data.usuario); location.href = destino(); return; }
        ocupado(false);
        var err = r.data.errores || {};
        if (err.username) { mensaje('msg-username', err.username, 'error'); marcarInvalido('username', true); }
        if (err.contacto) { mensaje('msg-contacto', err.contacto, 'error'); marcarInvalido('contacto', true); }
        if (err.confirmar) { mensaje('msg-confirmar', err.confirmar, 'error'); marcarInvalido('confirmar', true); }
        if (err.password) mostrarAlerta(err.password);
        else if (!Object.keys(err).length) mostrarAlerta(r.data.error || 'No pudimos crear la cuenta.');
        else mostrarAlerta('Revisá los campos marcados.');
      });
    });
  }

  // ====================== "ME OLVIDÉ LA CONTRASEÑA" (paso 1) ======================
  function paginaRecuperar() {
    $('form-recuperar').addEventListener('submit', function (e) {
      e.preventDefault();
      limpiarAlerta();
      var contacto = $('contacto').value.trim();
      var error = revisarContacto(contacto);
      if (error) { mostrarAlerta(error); return; }
      ocupado(true, 'Enviando…');
      api('/recuperar', 'POST', { contacto: contacto }).then(function (r) {
        if (!r.ok) { ocupado(false); mostrarAlerta(r.data.error || 'No pudimos enviar el código.'); return; }
        try { sessionStorage.setItem('c4u_recuperar', contacto); } catch (err) { /* ignorar */ }
        location.href = 'restablecer.html';
      });
    });
  }

  // ====================== NUEVA CONTRASEÑA (paso 2) ======================
  function paginaRestablecer() {
    activarReglasPassword();
    activarCoincidencia('password', 'confirmar');
    try {
      var guardado = sessionStorage.getItem('c4u_recuperar');
      if (guardado) { $('contacto').value = guardado; $('codigo').focus(); }
    } catch (err) { /* ignorar */ }

    $('codigo').addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(0, 6);
    });

    $('form-restablecer').addEventListener('submit', function (e) {
      e.preventDefault();
      limpiarAlerta();
      var datos = {
        contacto: $('contacto').value.trim(),
        codigo: $('codigo').value.trim(),
        password: $('password').value,
        confirmar: $('confirmar').value
      };
      var eCont = revisarContacto(datos.contacto);
      if (eCont) { mostrarAlerta(eCont); $('contacto').focus(); return; }
      if (!/^[0-9]{6}$/.test(datos.codigo)) { mostrarAlerta('El código tiene 6 números.'); $('codigo').focus(); return; }
      if (!passwordValida(datos.password)) { mostrarAlerta('La contraseña debe tener 8 o más caracteres, una mayúscula, una minúscula, un número y un símbolo.'); $('password').focus(); return; }
      if (datos.password !== datos.confirmar) { mostrarAlerta('Las contraseñas no coinciden.'); $('confirmar').focus(); return; }

      ocupado(true, 'Guardando…');
      api('/restablecer', 'POST', datos).then(function (r) {
        if (!r.ok) { ocupado(false); mostrarAlerta(r.data.error || 'No pudimos cambiar la contraseña.'); return; }
        try { sessionStorage.removeItem('c4u_recuperar'); } catch (err) { /* ignorar */ }
        borrarUsuario();
        mostrarAlerta('¡Contraseña actualizada! Te llevamos al inicio de sesión…', 'exito');
        setTimeout(function () { location.href = PAGINA_LOGIN; }, 1800);
      });
    });
  }

  // ====================== ENCABEZADO: "Hola, usuario" en cualquier página ======================
  function widgetSesion() {
    var caja = document.querySelector('.user-quick-auth');
    if (!caja) return;
    api('/me').then(function (r) {
      if (r.status === 401) borrarUsuario();
      if (!r.ok || !r.data.usuario) return; // sin sesión: queda tu botón "Iniciar Sesión / Registrarse"
      var u = r.data.usuario;
      guardarUsuario({ id: u.id, nombre: u.nombre, avatar: u.avatar, bio: u.bio });

      caja.textContent = '';
      var hola = document.createElement('span');
      hola.className = 'auth-hola';
      hola.textContent = 'Hola, ' + u.nombre;

      var perfil = document.createElement('a');
      perfil.className = 'btn-glass';
      perfil.href = 'perfil.html';
      perfil.setAttribute('data-ico', 'usuario');
      perfil.textContent = 'Mi perfil';

      var salir = document.createElement('a');
      salir.className = 'btn-glass';
      salir.href = '#';
      salir.setAttribute('data-ico', 'salir');
      salir.textContent = 'Salir';
      salir.addEventListener('click', function (e) {
        e.preventDefault();
        api('/logout', 'POST').then(function () { borrarUsuario(); location.href = PAGINA_LOGIN; });
      });

      caja.appendChild(hola);
      caja.appendChild(perfil);
      caja.appendChild(salir);
    });
  }

  var pagina = document.body.getAttribute('data-page');
  if (pagina === 'login') paginaLogin();
  else if (pagina === 'registro') paginaRegistro();
  else if (pagina === 'recuperar') paginaRecuperar();
  else if (pagina === 'restablecer') paginaRestablecer();
  else widgetSesion();
})();