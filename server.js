require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { enviarCodigo } = require('./notificar');
const { crearAlmacen } = require('./almacen');
const { registrarRutas } = require('./rutas');

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCCION = process.env.NODE_ENV === 'production';
if (PRODUCCION) app.set('trust proxy', 1); // detrás de Render, Railway, Nginx, etc.

app.disable('x-powered-by');

// ---------------------------------------------------------------------------
// Seguridad general: cabeceras, mismo-origen (anti-CSRF) y tamaños de datos
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.set('Cross-Origin-Opener-Policy', 'same-origin');
  // Solo corre código de este mismo sitio (style 'unsafe-inline' porque las páginas usan estilos en línea).
  res.set('Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; " +
    "connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  if (PRODUCCION) res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  next();
});
// Los pedidos que cambian datos solo valen si vienen de este mismo sitio.
app.use((req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origen = req.headers.origin;
  if (origen) {
    let host = '';
    try { host = new URL(origen).host; } catch (e) { return res.status(403).json({ error: 'Origen no permitido.' }); }
    if (host !== req.headers.host) return res.status(403).json({ error: 'Origen no permitido.' });
  }
  next();
});
// El login usa JSON chico; solo publicaciones, perfil y chats aceptan fotos (hasta 1 MB).
const jsonChico = express.json({ limit: '10kb' });
const jsonGrande = express.json({ limit: '1mb' });
app.use((req, res, next) => (/^\/api\/(publicaciones|perfil|chats)/.test(req.path) ? jsonGrande : jsonChico)(req, res, next));

// ---------------------------------------------------------------------------
// Base de datos: Firestore (Firebase). La llave se configura en el archivo .env
// (ver almacen.js). Ya no hacen falta XAMPP ni MySQL.
// ---------------------------------------------------------------------------
let A;
try {
  A = crearAlmacen();
} catch (e) {
  console.error('No se pudo conectar con Firebase.');
  console.error(e.message);
  process.exit(1);
}

// Borra sesiones y códigos vencidos. Se corre al iniciar y cada hora.
async function limpiarVencidos() {
  try {
    const ahora = Date.now();
    await A.borrarConsulta(A.col('sesiones').where('expira', '<', ahora));
    await A.borrarConsulta(A.col('recuperaciones').where('expira', '<', ahora - 24 * 60 * 60 * 1000));
  } catch (e) {
    console.error('Limpieza de sesiones:', e.message);
  }
}

// ---------------------------------------------------------------------------
// Validaciones (el navegador usa las mismas reglas, pero el servidor SIEMPRE revisa)
// ---------------------------------------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validarUsername(u) {
  if (typeof u !== 'string') return 'Ingresá un nombre de usuario.';
  if (u.length < 4 || u.length > 20) return 'El usuario debe tener entre 4 y 20 caracteres.';
  if (!/^[A-Za-z0-9_.\-#$!]+$/.test(u)) return 'Solo letras, números y los símbolos _ . - # $ ! (sin espacios).';
  if (!/[_.\-#$!]/.test(u)) return 'El usuario debe incluir al menos un símbolo (_ . - # $ !).';
  if (!/[A-Za-z]/.test(u)) return 'El usuario debe incluir al menos una letra.';
  return null;
}

function validarPassword(p) {
  if (typeof p !== 'string' || p.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (p.length > 72) return 'La contraseña es demasiado larga (máximo 72 caracteres).';
  if (!/[a-z]/.test(p)) return 'La contraseña debe incluir una minúscula.';
  if (!/[A-Z]/.test(p)) return 'La contraseña debe incluir una mayúscula.';
  if (!/[0-9]/.test(p)) return 'La contraseña debe incluir un número.';
  if (!/[^A-Za-z0-9]/.test(p)) return 'La contraseña debe incluir un símbolo (por ejemplo ! ? # $ _).';
  return null;
}

// Un mismo campo "contacto": si tiene @ es correo, si no es teléfono.
function normalizarContacto(raw) {
  const v = String(raw || '').trim();
  if (!v) return { error: 'Ingresá un correo o un número de teléfono.' };
  if (v.includes('@')) {
    const mail = v.toLowerCase();
    if (mail.length > 100 || !EMAIL_RE.test(mail)) return { error: 'El correo no es válido.' };
    return { valor: mail, tipo: 'email' };
  }
  const tel = v.replace(/[\s().\-]/g, '');
  if (!/^\+?[0-9]{8,15}$/.test(tel)) return { error: 'El teléfono no es válido (8 a 15 números, podés empezar con +).' };
  return { valor: tel, tipo: 'telefono' };
}

// ---------------------------------------------------------------------------
// Sesiones (cookie httpOnly: el JavaScript de la página no puede leerla)
// ---------------------------------------------------------------------------
const COOKIE = 'c4u_session';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function leerCookie(req, nombre) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const parte of header.split(';')) {
    const i = parte.indexOf('=');
    if (i < 0) continue;
    if (parte.slice(0, i).trim() === nombre) {
      try { return decodeURIComponent(parte.slice(i + 1).trim()); } catch (e) { return null; }
    }
  }
  return null;
}

async function crearSesion(res, usuarioId, recordar) {
  const token = crypto.randomBytes(32).toString('hex');
  const ahora = Date.now();
  const dias = recordar ? 30 : 1;
  await A.crearSesion(usuarioId, sha256(token), ahora + dias * 86400000);
  const opciones = { httpOnly: true, sameSite: 'lax', secure: PRODUCCION, path: '/' };
  if (recordar) opciones.maxAge = dias * 86400000; // sin "recordarme": se borra al cerrar el navegador
  res.cookie(COOKIE, token, opciones);
}

async function cerrarSesion(req, res) {
  const token = leerCookie(req, COOKIE);
  if (token) await A.borrarSesion(sha256(token));
  res.clearCookie(COOKIE, { path: '/' });
}

const urlAvatar = (u) => (u && u.avatarV ? `/api/imagen/avatar/${u.id}?v=${u.avatarV}` : '');

// Carga req.usuario si hay una sesión válida (no obliga a estar logueado).
async function cargarUsuario(req, res, next) {
  req.usuario = null;
  try {
    const token = leerCookie(req, COOKIE);
    if (token) {
      const s = await A.sesion(sha256(token));
      if (s) {
        const u = await A.usuario(s.uid);
        if (u) {
          req.usuario = {
            id: u.id, nombre: u.username, contacto: u.contacto, avatar: urlAvatar(u), bio: u.bio || '',
            tema: u.tema || '', fondoV: Number(u.fondoV) || 0
          };
        }
      }
    }
  } catch (e) {
    console.error('cargarUsuario:', e.message);
  }
  next();
}

// 👉 Usalo en las rutas que solo pueden usar usuarios logueados. Ejemplo:
//    app.post('/api/publicaciones', requiereSesion, (req, res) => { ... req.usuario.id ... });
function requiereSesion(req, res, next) {
  if (!req.usuario) return res.status(401).json({ error: 'Tenés que iniciar sesión.' });
  next();
}

app.use(cargarUsuario);

// Moderadores: nombres de usuario separados por coma en ADMIN_USERS (en el .env). Ej: ADMIN_USERS=sol.admin,ana_mod
const ADMINS = new Set(String(process.env.ADMIN_USERS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
const esAdmin = (u) => !!u && ADMINS.has(String(u.nombre).toLowerCase());

// Límite de intentos por IP (frena a quien prueba contraseñas sin parar)
const limitar = (max, minutos) => rateLimit({
  windowMs: minutos * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá de nuevo en unos minutos.' }
});

// Tope general por IP para toda la API (además de los límites de cada ruta).
app.use('/api', limitar(2000, 5));

const MAX_FALLIDOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
const CODIGO_VIDA_MS = 15 * 60 * 1000;
const CODIGO_MAX_INTENTOS = 5;
const HASH_FALSO = bcrypt.hashSync('contraseña-falsa-para-igualar-tiempos', 10);

const usuarioPublico = (u) => ({ id: u.id, nombre: u.username, avatar: urlAvatar(u), bio: u.bio || '' });

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

// ¿Está libre el nombre de usuario? (la página avisa mientras escribís)
app.get('/api/usuario-disponible', limitar(80, 5), async (req, res) => {
  const u = String(req.query.u || '');
  const error = validarUsername(u);
  if (error) return res.json({ disponible: false, motivo: error });
  try {
    const existe = await A.uidPorNombre(u);
    res.json(existe ? { disponible: false, motivo: 'Ese nombre de usuario ya está en uso.' } : { disponible: true });
  } catch (e) {
    console.error('usuario-disponible:', e.message);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

app.post('/api/registro', limitar(10, 15), async (req, res) => {
  try {
    const { username, password, confirmar } = req.body || {};
    const c = normalizarContacto(req.body && req.body.contacto);

    const errores = {};
    const eUser = validarUsername(username);
    if (eUser) errores.username = eUser;
    if (c.error) errores.contacto = c.error;
    const ePass = validarPassword(password);
    if (ePass) errores.password = ePass;
    else if (confirmar !== undefined && password !== confirmar) errores.confirmar = 'Las contraseñas no coinciden.';
    if (Object.keys(errores).length) return res.status(400).json({ error: 'Revisá los datos ingresados.', errores });

    const errorNombre = { error: 'Revisá los datos ingresados.', errores: { username: 'Ese nombre de usuario ya está en uso.' } };
    const errorContacto = { error: 'Revisá los datos ingresados.', errores: { contacto: 'Ya existe una cuenta con este correo o número. Iniciá sesión.' } };
    if (await A.uidPorNombre(username)) return res.status(409).json(errorNombre);
    if (await A.uidPorContacto(c.valor)) return res.status(409).json(errorContacto);

    const passwordHash = await bcrypt.hash(password, 12);
    let nuevo;
    try {
      nuevo = await A.crearUsuario({ username, contacto: c.valor, password: passwordHash });
    } catch (e) {
      // Dos personas registrándose a la vez con el mismo dato: la base lo detecta acá.
      if (e.codigo === 'DUP_NOMBRE') return res.status(409).json(errorNombre);
      if (e.codigo === 'DUP_CONTACTO') return res.status(409).json(errorContacto);
      throw e;
    }

    await crearSesion(res, nuevo.id, false);
    res.status(201).json({
      mensaje: 'Usuario registrado con éxito',
      usuario: { id: nuevo.id, nombre: username, avatar: '', bio: null }
    });
  } catch (err) {
    console.error('registro:', err);
    res.status(500).json({ error: 'Error en el servidor al registrar el usuario.' });
  }
});

app.post('/api/login', limitar(20, 15), async (req, res) => {
  try {
    const body = req.body || {};
    // "username" se sigue aceptando por compatibilidad con tu script.js anterior.
    const ident = String(body.identificador !== undefined ? body.identificador : body.username || '').trim();
    const password = String(body.password || '');
    if (!ident || !password) return res.status(400).json({ error: 'Completá todos los campos.' });

    const c = normalizarContacto(ident);
    let uid = await A.uidPorNombre(ident);
    if (!uid && !c.error) uid = await A.uidPorContacto(c.valor);
    const usuario = uid ? await A.usuarioFresco(uid) : null;

    if (usuario && Number(usuario.bloqueadoHasta) > Date.now()) {
      const min = Math.ceil((Number(usuario.bloqueadoHasta) - Date.now()) / 60000);
      return res.status(429).json({ error: `Demasiados intentos fallidos. Probá de nuevo en ${min} min o recuperá tu contraseña.` });
    }

    const ok = await bcrypt.compare(password, usuario ? usuario.password : HASH_FALSO);
    if (!usuario || !ok) {
      if (usuario) {
        const intentos = (Number(usuario.intentos) || 0) + 1;
        if (intentos >= MAX_FALLIDOS) {
          await A.actualizarUsuario(usuario.id, { intentos: 0, bloqueadoHasta: Date.now() + BLOQUEO_MS });
        } else {
          await A.actualizarUsuario(usuario.id, { intentos });
        }
      }
      // Mismo mensaje exista o no el usuario: así nadie puede averiguar quién está registrado.
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    if (usuario.intentos || usuario.bloqueadoHasta) {
      await A.actualizarUsuario(usuario.id, { intentos: 0, bloqueadoHasta: 0 });
    }
    await crearSesion(res, usuario.id, !!body.recordar);
    res.status(200).json({ mensaje: 'Inicio de sesión exitoso', usuario: usuarioPublico(usuario) });
  } catch (err) {
    console.error('login:', err);
    res.status(500).json({ error: 'Error en el servidor al verificar usuario.' });
  }
});

app.post('/api/logout', async (req, res) => {
  try { await cerrarSesion(req, res); } catch (e) { console.error('logout:', e.message); }
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (!req.usuario) return res.status(401).json({ error: 'No hay sesión iniciada.' });
  res.json({ usuario: { ...req.usuario, admin: esAdmin(req.usuario) } });
});

// Paso 1 de "me olvidé la contraseña": manda un código de 6 números al correo o teléfono.
app.post('/api/recuperar', limitar(5, 15), async (req, res) => {
  const generica = { ok: true, mensaje: 'Si el contacto está registrado, te enviamos un código de 6 números.' };
  const c = normalizarContacto(req.body && req.body.contacto);
  if (c.error) return res.status(400).json({ error: c.error });
  try {
    const uid = await A.uidPorContacto(c.valor);
    const u = uid ? await A.usuarioFresco(uid) : null;
    if (u) {
      const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      // Un solo código vigente por persona: el nuevo reemplaza al anterior.
      await A.col('recuperaciones').doc(String(u.id)).set({
        codigoHash: sha256(codigo + ':' + u.id), intentos: 0, usado: false,
        expira: Date.now() + CODIGO_VIDA_MS, creada: Date.now()
      });
      await enviarCodigo(c.valor, c.tipo, u.username, codigo);
    }
  } catch (e) {
    console.error('recuperar:', e.message);
  }
  // Siempre la misma respuesta: no revela si la cuenta existe.
  res.json(generica);
});

// Paso 2: con el código recibido, elegís la contraseña nueva.
app.post('/api/restablecer', limitar(15, 15), async (req, res) => {
  try {
    const { codigo, password, confirmar } = req.body || {};
    const c = normalizarContacto(req.body && req.body.contacto);
    const malCodigo = { error: 'El código es incorrecto o venció. Pedí uno nuevo.' };

    if (c.error) return res.status(400).json({ error: c.error });
    if (!/^[0-9]{6}$/.test(String(codigo || ''))) return res.status(400).json({ error: 'El código tiene 6 números.' });
    const ePass = validarPassword(password);
    if (ePass) return res.status(400).json({ error: ePass });
    if (password !== confirmar) return res.status(400).json({ error: 'Las contraseñas no coinciden.' });

    const usuarioId = await A.uidPorContacto(c.valor);
    if (!usuarioId) return res.status(400).json(malCodigo);

    const refRec = A.col('recuperaciones').doc(String(usuarioId));
    const snap = await refRec.get();
    const rec = snap.exists ? snap.data() : null;
    if (!rec || rec.usado || Number(rec.expira) < Date.now() || Number(rec.intentos) >= CODIGO_MAX_INTENTOS) {
      return res.status(400).json(malCodigo);
    }

    const dado = Buffer.from(sha256(String(codigo) + ':' + usuarioId));
    const guardado = Buffer.from(String(rec.codigoHash));
    if (dado.length !== guardado.length || !crypto.timingSafeEqual(dado, guardado)) {
      await refRec.update({ intentos: A.FV.increment(1) });
      return res.status(400).json(malCodigo);
    }

    const hash = await bcrypt.hash(password, 12);
    await A.actualizarUsuario(usuarioId, { password: hash, intentos: 0, bloqueadoHasta: 0 });
    await refRec.update({ usado: true });
    await A.borrarSesionesDe(usuarioId, null); // cierra todas las sesiones abiertas

    res.json({ ok: true, mensaje: 'Contraseña actualizada. Ya podés iniciar sesión.' });
  } catch (err) {
    console.error('restablecer:', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// Publicaciones, comentarios, guardados, carrito, perfil, chats, bloqueos y denuncias.
registrarRutas(app, { almacen: A, requiereSesion, limitar, validarUsername, validarPassword, sha256, leerCookie, COOKIE, esAdmin });

// Errores al leer el JSON (muy grande o mal formado) -> respuesta en JSON, no HTML.
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'El archivo es demasiado pesado.' });
  if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'Datos inválidos.' });
  next(err);
});

app.use('/api', (req, res) => res.status(404).json({ error: 'No encontrado.' }));

// ---------------------------------------------------------------------------
// Páginas del sitio (así también funciona desde el celular/tablet: http://IP-DE-TU-PC:3000)
// Solo se publican páginas, estilos, imágenes y los .js del navegador. Nunca server.js,
// almacen.js, rutas.js, data.sql, package.json, .env, llaves .json ni node_modules.
// ---------------------------------------------------------------------------
const EXTENSIONES_PUBLICAS = new Set(['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.jfif', '.gif', '.svg', '.webp', '.ico']);
const JS_PUBLICOS = new Set(['script.js', 'auth.js', 'idioma.js', 'faq.js', 'admin.js']); // 👉 si agregás otro .js para el navegador, sumalo acá

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  let ruta;
  try { ruta = decodeURIComponent(req.path).toLowerCase(); } catch (e) { return res.status(400).end(); }
  if (ruta === '/') return next();
  const ext = path.extname(ruta);
  const archivo = path.basename(ruta);
  const prohibido =
    ruta.includes('node_modules') ||
    !EXTENSIONES_PUBLICAS.has(ext) ||
    (ext === '.js' && !JS_PUBLICOS.has(archivo));
  if (prohibido) return res.status(404).send('Página no encontrada');
  next();
});
app.use(express.static(__dirname, { dotfiles: 'ignore', index: 'index.html' }));

app.use((req, res) => res.status(404).send('Página no encontrada'));

// ---------------------------------------------------------------------------
A.cargar()
  .then((cantidad) => {
    console.log(`Conectado a Firestore (${cantidad} publicaciones cargadas).`);
    limpiarVencidos();
    setInterval(limpiarVencidos, 60 * 60 * 1000);
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log('Desde el celular o la tablet (misma wifi): http://IP-DE-TU-PC:' + PORT);
    });
  })
  .catch((err) => {
    console.error('No se pudo leer Firestore. Revisá que la base esté creada y que la llave sea del proyecto correcto.');
    console.error(err.message);
    process.exit(1);
  });