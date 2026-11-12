'use strict';
// Clothes4Us - capa de datos sobre Firestore (reemplaza a MySQL).
// server.js y rutas.js solo hablan con este archivo: si algún día cambia la base, se toca acá.
//
// Colecciones de Firestore que se crean solas al usarlas:
//   usuarios, nombres, contactos, sesiones, recuperaciones, contadores,
//   publicaciones, medios, estados, comentarios, votos, calificaciones, bloqueos, denuncias, chats
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const num = (x) => Number(x) || 0;
// Error con código HTTP: rutas.js lo convierte en una respuesta JSON.
const fallo = (status, mensaje) => Object.assign(new Error(mensaje), { status, mensaje });

// Cuánto tiempo se recuerda algo en memoria para no gastar lecturas de Firestore.
const TTL_USUARIO = 60 * 1000;
const TTL_BLOQUEOS = 30 * 1000;
const TTL_SESION = 30 * 1000;

// ---------------------------------------------------------------------------
// Conexión con Firebase. La llave se busca (en este orden) en:
//   FIREBASE_SERVICE_ACCOUNT  -> el contenido del .json completo (útil en Render)
//   FIREBASE_KEY_PATH         -> la ruta al archivo .json (útil en tu PC)
//   GOOGLE_APPLICATION_CREDENTIALS -> igual que la anterior (nombre estándar de Google)
// Con el emulador de Firestore (FIRESTORE_EMULATOR_HOST) no hace falta llave.
// ---------------------------------------------------------------------------
function iniciarFirebase() {
  if (admin.apps.length) return;
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'clothes4us' });
    return;
  }
  let cuenta;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      cuenta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT no tiene un JSON válido.');
    }
  } else {
    const ruta = process.env.FIREBASE_KEY_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!ruta) {
      throw new Error('Falta la llave de Firebase. Agregá en tu archivo .env una línea: FIREBASE_KEY_PATH=C:/ruta/a/tu/llave.json');
    }
    const abs = path.resolve(ruta);
    if (!fs.existsSync(abs)) throw new Error('No encuentro la llave de Firebase en: ' + abs);
    try {
      cuenta = JSON.parse(fs.readFileSync(abs, 'utf8'));
    } catch (e) {
      throw new Error('El archivo de la llave no es un JSON válido: ' + abs);
    }
  }
  admin.initializeApp({ credential: admin.credential.cert(cuenta) });
}

function crearAlmacen() {
  iniciarFirebase();
  const db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  const FV = admin.firestore.FieldValue;
  const col = (nombre) => db.collection(nombre);

  // ------------------------------ borrados en tandas ------------------------------
  async function borrarRefs(refs) {
    for (let i = 0; i < refs.length; i += 400) {
      const lote = db.batch();
      refs.slice(i, i + 400).forEach((r) => lote.delete(r));
      await lote.commit();
    }
  }

  // Borra todos los documentos que devuelve una consulta (de a 400, que es lo que aguanta un lote).
  async function borrarConsulta(consulta) {
    for (;;) {
      const snap = await consulta.limit(400).get();
      if (snap.empty) break;
      const lote = db.batch();
      snap.docs.forEach((d) => lote.delete(d.ref));
      await lote.commit();
      if (snap.size < 400) break;
    }
  }

  // ------------------------------ ids numéricos ------------------------------
  // Firestore no tiene "autoincrement": se lleva un contador por colección. Para gastar menos
  // escrituras se reservan de a 10 números (los mensajes de a 1, así el orden nunca se mezcla).
  const bloquesId = new Map();
  const colasId = new Map();
  async function asignarId(nombre) {
    const b = bloquesId.get(nombre);
    if (b && b.sig <= b.fin) return b.sig++;
    const tam = nombre === 'mensajes' ? 1 : 10;
    const ref = col('contadores').doc(nombre);
    const fin = await db.runTransaction(async (t) => {
      const s = await t.get(ref);
      const actual = s.exists ? Number(s.data().n) || 0 : 0;
      t.set(ref, { n: actual + tam });
      return actual + tam;
    });
    const nuevo = { sig: fin - tam + 1, fin };
    bloquesId.set(nombre, nuevo);
    return nuevo.sig++;
  }
  function nextId(nombre) {
    // En fila, para que dos pedidos a la vez no se pisen.
    const anterior = colasId.get(nombre) || Promise.resolve();
    const p = anterior.then(() => asignarId(nombre));
    colasId.set(nombre, p.catch(() => {}));
    return p;
  }

  // ------------------------------ usuarios ------------------------------
  const usuarios = new Map(); // id -> { u, t }
  const aUsuario = (id, datos) => ({ ...datos, id: Number(id) });
  const olvidarUsuario = (id) => { usuarios.delete(Number(id)); };

  async function usuario(id) {
    id = Number(id);
    if (!id) return null;
    const c = usuarios.get(id);
    if (c && Date.now() - c.t < TTL_USUARIO) return c.u;
    const s = await col('usuarios').doc(String(id)).get();
    if (!s.exists) { usuarios.delete(id); return null; }
    const u = aUsuario(id, s.data());
    usuarios.set(id, { u, t: Date.now() });
    return u;
  }
  // Para el login: siempre lee de Firestore (intentos fallidos y bloqueos tienen que estar al día).
  async function usuarioFresco(id) {
    olvidarUsuario(id);
    return usuario(id);
  }
  // Devuelve un Map id -> usuario (lee de a 100 con una sola consulta).
  async function usuariosVarios(ids) {
    const salida = new Map();
    const faltan = [];
    const vistos = new Set();
    for (const crudo of ids || []) {
      const id = Number(crudo);
      if (!id || vistos.has(id)) continue;
      vistos.add(id);
      const c = usuarios.get(id);
      if (c && Date.now() - c.t < TTL_USUARIO) salida.set(id, c.u); else faltan.push(id);
    }
    for (let i = 0; i < faltan.length; i += 100) {
      const tanda = faltan.slice(i, i + 100);
      const snaps = await db.getAll(...tanda.map((id) => col('usuarios').doc(String(id))));
      snaps.forEach((s, j) => {
        if (!s.exists) return;
        const u = aUsuario(tanda[j], s.data());
        usuarios.set(tanda[j], { u, t: Date.now() });
        salida.set(tanda[j], u);
      });
    }
    return salida;
  }

  // Los nombres y contactos únicos se controlan con colecciones aparte (el id del documento es la clave).
  // El prefijo evita ids reservados por Firestore (como "__algo__").
  const idNombre = (n) => 'u_' + String(n).toLowerCase();
  const idContacto = (c) => 'c_' + sha256(String(c));

  async function uidPorNombre(nombre) {
    const n = String(nombre || '').trim();
    if (!n || n.length > 60 || n.includes('/')) return 0;
    const s = await col('nombres').doc(idNombre(n)).get();
    return s.exists ? Number(s.data().uid) : 0;
  }
  async function uidPorContacto(contacto) {
    if (!contacto) return 0;
    const s = await col('contactos').doc(idContacto(contacto)).get();
    return s.exists ? Number(s.data().uid) : 0;
  }

  // Crea la cuenta. Si el nombre o el contacto ya existen, tira un error con codigo DUP_NOMBRE / DUP_CONTACTO.
  async function crearUsuario({ username, contacto, password }) {
    const id = await nextId('usuarios');
    const refN = col('nombres').doc(idNombre(username));
    const refC = col('contactos').doc(idContacto(contacto));
    const refU = col('usuarios').doc(String(id));
    await db.runTransaction(async (t) => {
      const n = await t.get(refN);
      const c = await t.get(refC);
      if (n.exists) throw Object.assign(new Error('nombre repetido'), { codigo: 'DUP_NOMBRE' });
      if (c.exists) throw Object.assign(new Error('contacto repetido'), { codigo: 'DUP_CONTACTO' });
      t.set(refN, { uid: id });
      t.set(refC, { uid: id });
      t.set(refU, {
        id, username, usernameLower: username.toLowerCase(), contacto, password,
        avatarV: 0, bio: '', tema: '', fondoV: 0, calSuma: 0, calN: 0,
        nSeguidores: 0, nSiguiendo: 0, nAmigos: 0,
        intentos: 0, bloqueadoHasta: 0, fecha: Date.now()
      });
    });
    return usuario(id);
  }

  async function actualizarUsuario(id, cambios) {
    await col('usuarios').doc(String(id)).update(cambios);
    olvidarUsuario(id);
  }

  // Cambia el nombre de usuario (y el nombre que se ve en sus publicaciones).
  async function renombrarUsuario(id, viejo, nuevo) {
    id = Number(id);
    const bajoNuevo = nuevo.toLowerCase();
    const refNuevo = col('nombres').doc(idNombre(nuevo));
    const refViejo = col('nombres').doc(idNombre(viejo));
    await db.runTransaction(async (t) => {
      const s = await t.get(refNuevo);
      if (s.exists && Number(s.data().uid) !== id) throw Object.assign(new Error('nombre repetido'), { codigo: 'DUP' });
      if (idNombre(viejo) !== idNombre(nuevo)) {
        t.delete(refViejo);
        t.set(refNuevo, { uid: id });
      }
      t.update(col('usuarios').doc(String(id)), { username: nuevo, usernameLower: bajoNuevo });
    });
    olvidarUsuario(id);
    const propias = await col('publicaciones').where('uid', '==', id).get();
    for (let i = 0; i < propias.docs.length; i += 400) {
      const lote = db.batch();
      propias.docs.slice(i, i + 400).forEach((d) => lote.update(d.ref, { username: nuevo }));
      await lote.commit();
    }
    for (const p of posts.values()) if (p.uid === id) p.username = nuevo;
  }

  // ------------------------------ sesiones ------------------------------
  const sesiones = new Map(); // hash -> { uid, expira, t }
  async function sesion(hash) {
    const c = sesiones.get(hash);
    if (c && Date.now() - c.t < TTL_SESION) return c.expira > Date.now() ? c : null;
    const s = await col('sesiones').doc(hash).get();
    if (!s.exists) { sesiones.delete(hash); return null; }
    const v = { uid: Number(s.data().uid), expira: Number(s.data().expira), t: Date.now() };
    sesiones.set(hash, v);
    return v.expira > Date.now() ? v : null;
  }
  async function crearSesion(uid, hash, expira) {
    await col('sesiones').doc(hash).set({ uid, expira, creada: Date.now() });
  }
  async function borrarSesion(hash) {
    sesiones.delete(hash);
    await col('sesiones').doc(hash).delete();
  }
  // Cierra todas las sesiones de una persona, menos la del token que se indique (si se indica).
  async function borrarSesionesDe(uid, tokenActual) {
    const conservar = tokenActual ? sha256(String(tokenActual)) : null;
    const snap = await col('sesiones').where('uid', '==', Number(uid)).get();
    const refs = [];
    snap.forEach((d) => {
      if (d.id === conservar) return;
      sesiones.delete(d.id);
      refs.push(d.ref);
    });
    await borrarRefs(refs);
  }

  // ------------------------------ bloqueos ------------------------------
  const bloqueos = new Map(); // uid -> { v: { yo, ellos }, t }
  // yo = a quiénes bloqueé; ellos = quiénes me bloquearon a mí.
  async function bloqueosDe(uid) {
    uid = Number(uid);
    const c = bloqueos.get(uid);
    if (c && Date.now() - c.t < TTL_BLOQUEOS) return c.v;
    const [a, b] = await Promise.all([
      col('bloqueos').where('uid', '==', uid).get(),
      col('bloqueos').where('otro', '==', uid).get()
    ]);
    const v = { yo: new Set(), ellos: new Set() };
    a.forEach((d) => v.yo.add(Number(d.data().otro)));
    b.forEach((d) => v.ellos.add(Number(d.data().uid)));
    bloqueos.set(uid, { v, t: Date.now() });
    return v;
  }
  function olvidarBloqueos(a, b) {
    bloqueos.delete(Number(a));
    bloqueos.delete(Number(b));
  }

  // ------------------------------ publicaciones ------------------------------
  // Todas las publicaciones viven también en memoria (sin la foto): así buscar, filtrar y
  // mezclar el inicio al azar no gasta lecturas. La foto se guarda aparte, en "medios".
  const posts = new Map();
  let ordenado = null;
  const normalizarPost = (x, id) => ({
    id: Number(id), uid: Number(x.uid), username: x.username || '', titulo: x.titulo || '', texto: x.texto || '',
    precio: Number(x.precio) || 0, categoria: x.categoria || 'Ropa', imgV: Number(x.imgV) || 0,
    estado: x.estado || 'activa', fecha: Number(x.fecha) || 0, likes: Number(x.likes) || 0,
    ncomentarios: Number(x.ncomentarios) || 0, oculta: !!x.oculta, dv: Number(x.dv) || 0
  });

  function aplicarCambio(tipo, id, datos) {
    id = Number(id);
    if (tipo === 'removed') { posts.delete(id); return; }
    const nuevo = normalizarPost(datos, id);
    const actual = posts.get(id);
    if (actual) Object.assign(actual, nuevo); else posts.set(id, nuevo);
  }

  // Lee todas las publicaciones y se queda escuchando: si alguien cambia o borra una publicación
  // (desde otra PC, desde la consola de Firebase o desde el panel), este servidor se entera solo.
  let escucha = null;
  function cargar() {
    return new Promise((resolve, reject) => {
      let primera = true;
      if (escucha) escucha();
      escucha = col('publicaciones').onSnapshot((snap) => {
        snap.docChanges().forEach((c) => aplicarCambio(c.type, c.doc.id, c.doc.data()));
        ordenado = null;
        if (primera) { primera = false; resolve(posts.size); }
      }, (err) => {
        if (primera) { primera = false; reject(err); } else console.error('Escucha de publicaciones:', err.message);
      });
    });
  }

  // Más nuevas primero.
  function porFecha() {
    if (!ordenado) ordenado = [...posts.values()].sort((a, b) => (b.fecha - a.fecha) || (b.id - a.id));
    return ordenado;
  }

  async function crearPublicacion(datos, imagen) {
    const id = await nextId('publicaciones');
    const ahora = Date.now();
    const doc = {
      id, uid: datos.uid, username: datos.username, titulo: datos.titulo, texto: datos.texto,
      precio: datos.precio, categoria: datos.categoria, imgV: imagen ? ahora : 0, estado: 'activa',
      fecha: ahora, likes: 0, ncomentarios: 0, oculta: false, dv: 0
    };
    const lote = db.batch();
    lote.set(col('publicaciones').doc(String(id)), doc);
    if (imagen) lote.set(col('medios').doc('pub_' + id), { data: imagen });
    await lote.commit();
    const p = normalizarPost(doc, id);
    posts.set(id, p);
    ordenado = null;
    return p;
  }

  async function cambiarPublicacion(id, cambios) {
    await col('publicaciones').doc(String(id)).update(cambios);
    const p = posts.get(Number(id));
    if (p) Object.assign(p, cambios);
  }

  async function borrarPublicacion(id) {
    id = Number(id);
    posts.delete(id);
    ordenado = null;
    await col('publicaciones').doc(String(id)).delete();
    await col('medios').doc('pub_' + id).delete();
    const coms = await col('comentarios').where('pid', '==', id).get();
    await borrarComentarios(coms.docs.map((d) => Number(d.id)));
    await borrarConsulta(col('votos').where('pid', '==', id));
    await borrarConsulta(col('estados').where('pid', '==', id));
  }

  // Borra comentarios con todo lo suyo: la foto que tuvieran y los "me gusta / no me gusta".
  async function borrarComentarios(ids) {
    ids = [...new Set((ids || []).map(Number).filter(Boolean))];
    for (let i = 0; i < ids.length; i += 150) {
      const lote = db.batch();
      ids.slice(i, i + 150).forEach((id) => {
        lote.delete(col('comentarios').doc(String(id)));
        lote.delete(col('medios').doc('com_' + id));
      });
      await lote.commit();
    }
    for (const id of ids) await borrarConsulta(col('votos').where('cid', '==', id));
  }

  // ------------------------------ seguidores y amigos ------------------------------
  // seguidores/{de}_{a} significa "de" sigue a "a". Si los dos se siguen entre sí, son amigos.
  // Los contadores (nSeguidores, nSiguiendo, nAmigos) viven en el documento de cada usuario.
  const docSeg = (de, a) => col('seguidores').doc(`${de}_${a}`);

  // modo 'alternar': sigue / deja de seguir según el estado actual. modo 'quitar': solo deja de seguir.
  async function cambiarSeguimiento(de, a, modo) {
    de = Number(de); a = Number(a);
    if (!de || !a || de === a) throw fallo(400, 'Usuario inválido.');
    const refDe = col('usuarios').doc(String(de));
    const refA = col('usuarios').doc(String(a));
    const r = await db.runTransaction(async (t) => {
      const [sDe, sA, directo, inverso] = await Promise.all([t.get(refDe), t.get(refA), t.get(docSeg(de, a)), t.get(docSeg(a, de))]);
      if (!sDe.exists || !sA.exists) throw fallo(404, 'Ese usuario no existe.');
      if (!directo.exists && modo === 'quitar') return { siguiendo: false, amigos: false, seguidores: num(sA.data().nSeguidores) };
      const quitar = directo.exists;
      const d = quitar ? -1 : 1;
      const cDe = { nSiguiendo: Math.max(0, num(sDe.data().nSiguiendo) + d) };
      const cA = { nSeguidores: Math.max(0, num(sA.data().nSeguidores) + d) };
      if (inverso.exists) {
        cDe.nAmigos = Math.max(0, num(sDe.data().nAmigos) + d);
        cA.nAmigos = Math.max(0, num(sA.data().nAmigos) + d);
      }
      if (quitar) t.delete(docSeg(de, a)); else t.set(docSeg(de, a), { de, a, fecha: Date.now() });
      t.update(refDe, cDe);
      t.update(refA, cA);
      return { siguiendo: !quitar, amigos: !quitar && inverso.exists, seguidores: cA.nSeguidores };
    });
    olvidarUsuario(de);
    olvidarUsuario(a);
    return r;
  }
  const alternarSeguir = (de, a) => cambiarSeguimiento(de, a, 'alternar');
  // Al bloquear a alguien se cortan los dos sentidos (dejan de seguirse).
  async function cortarVinculos(a, b) {
    await cambiarSeguimiento(a, b, 'quitar');
    await cambiarSeguimiento(b, a, 'quitar');
  }
  async function relacion(yo, otro) {
    const [l, m] = await db.getAll(docSeg(yo, otro), docSeg(otro, yo));
    return { loSigo: l.exists, meSigue: m.exists, amigos: l.exists && m.exists };
  }
  // [{ id, fecha }] de seguidores, siguiendo o amigos de alguien (lo más reciente primero).
  async function listarRed(uid, tipo, tope) {
    uid = Number(uid);
    tope = tope || 200;
    const siguiendo = async () => (await col('seguidores').where('de', '==', uid).limit(tope).get())
      .docs.map((d) => ({ id: Number(d.data().a), fecha: num(d.data().fecha) }));
    const seguidores = async () => (await col('seguidores').where('a', '==', uid).limit(tope).get())
      .docs.map((d) => ({ id: Number(d.data().de), fecha: num(d.data().fecha) }));
    let lista;
    if (tipo === 'siguiendo') lista = await siguiendo();
    else if (tipo === 'seguidores') lista = await seguidores();
    else {
      const [s1, s2] = await Promise.all([siguiendo(), seguidores()]);
      const losQueMeSiguen = new Set(s2.map((x) => x.id));
      lista = s1.filter((x) => losQueMeSiguen.has(x.id));
    }
    return lista.sort((x, y) => y.fecha - x.fecha);
  }

  // ------------------------------ preferencias de chat (fijar, silenciar, vaciar) ------------------------------
  const docPref = (uid, otro) => col('chatPrefs').doc(`${uid}_${otro}`);
  const aPref = (x) => ({ fijado: !!x.fijado, silenciado: !!x.silenciado, vaciadoHasta: num(x.vaciadoHasta), fijadoFecha: num(x.fijadoFecha) });
  async function prefsChat(uid) { // Map otro -> preferencias
    const snap = await col('chatPrefs').where('uid', '==', Number(uid)).get();
    const m = new Map();
    snap.forEach((d) => m.set(Number(d.data().otro), aPref(d.data())));
    return m;
  }
  async function prefChat(uid, otro) {
    const s = await docPref(uid, otro).get();
    return aPref(s.exists ? s.data() : {});
  }
  async function cambiarPrefChat(uid, otro, cambios) {
    await docPref(uid, otro).set({ uid: Number(uid), otro: Number(otro), ...cambios }, { merge: true });
  }

  return {
    db, FV, col, sha256,
    cargar, posts, porFecha, crearPublicacion, cambiarPublicacion, borrarPublicacion, borrarComentarios,
    alternarSeguir, cortarVinculos, relacion, listarRed, prefsChat, prefChat, cambiarPrefChat,
    usuario, usuarioFresco, usuariosVarios, uidPorNombre, uidPorContacto, crearUsuario,
    actualizarUsuario, renombrarUsuario, olvidarUsuario,
    sesion, crearSesion, borrarSesion, borrarSesionesDe,
    bloqueosDe, olvidarBloqueos,
    nextId, borrarConsulta
  };
}

module.exports = { crearAlmacen };