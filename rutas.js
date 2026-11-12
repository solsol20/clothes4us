'use strict';
// Clothes4Us - todo el "resto" del sitio (publicaciones, comentarios con respuestas y votos, guardados,
// carrito, perfil, calificaciones, chats, bloqueos y denuncias) sobre Firestore.
// El login vive en server.js. Se conecta con: registrarRutas(app, { almacen, ... }).
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const CATEGORIAS = { ropa: 'Ropa', muebles: 'Muebles', musica: 'Música', anuncio: 'Anuncio' };
function normCategoria(c) {
  const k = String(c || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return CATEGORIAS[k] || null;
}

// ---- imágenes: además del formato declarado se revisa la "firma" real del archivo ----
const IMG_RE = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/;
function firmaCoincide(tipo, b64) {
  const b = Buffer.from(b64.slice(0, 24), 'base64');
  if (tipo === 'png') return b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (tipo === 'jpeg') return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (tipo === 'gif') return b.length >= 4 && b.toString('latin1', 0, 4) === 'GIF8';
  if (tipo === 'webp') return b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP';
  return false;
}
function imagenValida(img, max) {
  if (typeof img !== 'string' || img.length > max) return false;
  const m = IMG_RE.exec(img);
  return !!m && firmaCoincide(m[1], m[2]);
}
const MAX_IMG_PUBLICACION = 600000;
const MAX_IMG_AVATAR = 200000;
const MAX_IMG_CHAT = 400000;
const MAX_IMG_FONDO = 600000;
const MAX_IMG_COMENTARIO = 400000;
const MAX_PINES = 5; // cuántos chats se pueden fijar arriba

const TEMAS = ['', 'rosa', 'menta', 'violeta', 'atardecer', 'grafito'];
const RE_TEMA_PROPIO = /^custom:#[0-9a-fA-F]{6}:#[0-9a-fA-F]{6}:#[0-9a-fA-F]{6}$/;

const idNum = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
const iso = (ms) => new Date(Number(ms) || 0).toISOString();

// Cuántas denuncias de cuentas con más de 1 día hacen falta para ocultar algo hasta que se revise.
const UMBRAL_OCULTAR = Number(process.env.DENUNCIAS_OCULTAR) || 5;
const EDAD_MIN_DENUNCIANTE_MS = 24 * 3600 * 1000;

function fallo(status, mensaje) { return Object.assign(new Error(mensaje), { status, mensaje }); }

function registrarRutas(app, ctx) {
  const { almacen: A, requiereSesion: sesion, limitar, validarUsername, validarPassword, sha256, leerCookie, COOKIE, esAdmin, normalizarContacto, enviarCodigo } = ctx;
  const { db, FV, col } = A;
  const lectura = limitar(600, 5);
  const sondeo = limitar(900, 5);

  // Caché de los numeritos del menú (carrito y mensajes sin leer).
  const resumenes = new Map();

  // Envuelve cada ruta: errores inesperados -> JSON, y nunca se cuelga el servidor.
  const ruta = (fn) => async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err && err.status) return res.status(err.status).json({ error: err.mensaje });
      if (err && err.codigo === 'DUP') return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso.' });
      console.error(req.method, req.path, err);
      res.status(500).json({ error: 'Error en el servidor.' });
    }
  };
  const uidDe = (req) => (req.usuario ? req.usuario.id : 0);
  const soloAdmin = (req, res, next) => (esAdmin(req.usuario) ? next() : res.status(403).json({ error: 'No autorizado.' }));

  const urlAvatar = (u) => (u && u.avatarV ? `/api/imagen/avatar/${u.id}?v=${u.avatarV}` : '');
  const infoUsuario = (u, id) => (u
    ? { id: u.id, nombre: u.username, avatar: urlAvatar(u) }
    : { id: id || 0, nombre: 'usuario-eliminado', avatar: '' });

  // ------------------------------ imágenes ------------------------------
  function enviarImagen(res, dataUrl, privado) {
    const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/.exec(dataUrl || '');
    if (!m) return res.status(404).end();
    res.set('Content-Type', m[1]);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Security-Policy', "default-src 'none'; sandbox");
    res.set('Cache-Control', privado ? 'private, max-age=3600' : 'public, max-age=31536000, immutable');
    res.send(Buffer.from(m[2], 'base64'));
  }
  app.get('/api/imagen/:tipo/:id', lectura, ruta(async (req, res) => {
    const id = idNum(req.params.id);
    const tipo = req.params.tipo;
    if (!id || !['avatar', 'pub', 'com'].includes(tipo)) return res.status(404).end();
    const s = await col('medios').doc(tipo + '_' + id).get();
    if (!s.exists) return res.status(404).end();
    enviarImagen(res, s.data().data, false);
  }));

  // ------------------------------ publicaciones ------------------------------
  function mapPub(p, u, est, uid) {
    return {
      id: p.id,
      titulo: p.titulo,
      texto: p.texto,
      precio: p.precio,
      categoria: p.categoria,
      imagen: p.imgV ? `/api/imagen/pub/${p.id}?v=${p.imgV}` : '',
      estado: p.estado,
      fecha: iso(p.fecha),
      usuario: infoUsuario(u, p.uid),
      likes: p.likes,
      comentarios: p.ncomentarios,
      yoLike: !!est.like,
      guardado: !!est.guardado,
      enCarrito: !!est.carrito,
      mia: p.uid === uid,
      oculta: p.uid === uid ? !!p.oculta : undefined
    };
  }

  // Convierte publicaciones en memoria al formato de la API (con autor y "mis" me gusta / guardados).
  async function armarPublicaciones(lista, uid) {
    const us = await A.usuariosVarios(lista.map((p) => p.uid));
    const est = new Map();
    if (uid && lista.length) {
      const snaps = await db.getAll(...lista.map((p) => col('estados').doc(`${uid}_${p.id}`)));
      snaps.forEach((s, i) => { if (s.exists) est.set(lista[i].id, s.data()); });
    }
    return lista.map((p) => mapPub(p, us.get(p.uid), est.get(p.id) || {}, uid));
  }
  async function publicacionPorId(pid, uid) {
    const p = A.posts.get(pid);
    if (!p || (p.oculta && p.uid !== uid)) return null;
    return (await armarPublicaciones([p], uid))[0];
  }

  function validarPublicacion(b) {
    const titulo = String(b.titulo || '').trim();
    const texto = String(b.texto || '').trim();
    if (titulo.length < 3 || titulo.length > 80) return { error: 'El título debe tener entre 3 y 80 caracteres.' };
    if (texto.length < 5 || texto.length > 1000) return { error: 'La descripción debe tener entre 5 y 1000 caracteres.' };
    const categoria = normCategoria(b.categoria) || 'Ropa';
    const vacio = b.precio === undefined || b.precio === null || b.precio === '';
    const precio = vacio ? 0 : Number(b.precio);
    if (!Number.isFinite(precio) || precio < 0 || precio > 99999999) return { error: 'El precio no es válido (usá 0 para trueque).' };
    // Un anuncio (ej: una feria presencial) no tiene precio.
    return { titulo, texto, categoria, precio: categoria === 'Anuncio' ? 0 : Math.round(precio * 100) / 100 };
  }

  const LIMITE = 15;
  app.get('/api/publicaciones', lectura, ruta(async (req, res) => {
    const uid = uidDe(req);
    const q = req.query;

    let duenoId = null;
    if (q.usuario) {
      duenoId = await A.uidPorNombre(String(q.usuario));
      if (!duenoId) return res.json({ publicaciones: [], hayMas: false });
    }
    let guardadas = null;
    if (q.guardadas === '1') {
      if (!uid) return res.status(401).json({ error: 'Tenés que iniciar sesión.' });
      const snap = await col('estados').where('uid', '==', uid).where('guardado', '==', true).get();
      guardadas = new Set();
      snap.forEach((d) => guardadas.add(Number(d.data().pid)));
    }
    // "Seguidos": solo publicaciones de la gente que seguís.
    let seguidos = null;
    if (q.seguidos === '1') {
      if (!uid) return res.status(401).json({ error: 'Tenés que iniciar sesión.' });
      seguidos = new Set((await A.listarRed(uid, 'siguiendo', 1000)).map((x) => x.id));
    }
    const verTodas = !!duenoId || !!guardadas;
    const texto = String(q.q || '').trim().slice(0, 80).toLowerCase();
    const cats = new Set(String(q.cat || '').split(',').map(normCategoria).filter(Boolean));
    const min = q.min === undefined || q.min === '' ? NaN : Number(q.min);
    const max = q.max === undefined || q.max === '' ? NaN : Number(q.max);
    let bloq = new Set();
    if (uid) { const b = await A.bloqueosDe(uid); bloq = new Set([...b.yo, ...b.ellos]); }

    const filtradas = A.porFecha().filter((p) => {
      if (p.oculta && p.uid !== uid) return false;
      if (!verTodas && p.estado !== 'activa') return false;
      if (duenoId && p.uid !== duenoId) return false;
      if (guardadas && !guardadas.has(p.id)) return false;
      if (bloq.has(p.uid)) return false;
      if (seguidos && !seguidos.has(p.uid)) return false;
      if (cats.size && !cats.has(p.categoria)) return false;
      if (Number.isFinite(min) && p.precio < min) return false;
      if (Number.isFinite(max) && p.precio > max) return false;
      if (q.trueque === '1' && !(p.precio === 0 && p.categoria !== 'Anuncio')) return false;
      if (texto && !(`${p.titulo} ${p.texto} ${p.categoria} ${p.username}`.toLowerCase().includes(texto))) return false;
      return true;
    });

    // Inicio al azar: publicaciones de otras personas que todavía no viste.
    if (q.modo === 'azar' && !verTodas && !seguidos) {
      const vistas = new Set(String(q.vistas || '').split(',').map(Number).filter(Boolean).slice(0, 400));
      const candidatas = filtradas.filter((p) => p.uid !== uid);
      let nuevas = candidatas.filter((p) => !vistas.has(p.id));
      let reinicio = false;
      if (!nuevas.length) { nuevas = candidatas; reinicio = true; } // ya viste todo: empieza otra ronda
      const n = nuevas.length;
      const puntuadas = nuevas.map((p, i) => ({ p, s: Math.random() + 0.35 * (1 - i / n) })); // al azar, con un poco de ventaja para lo reciente
      puntuadas.sort((a, b) => b.s - a.s);
      const pagina = puntuadas.slice(0, LIMITE).map((x) => x.p);
      return res.json({ publicaciones: await armarPublicaciones(pagina, uid), hayMas: n > LIMITE, reinicio });
    }

    const offset = Math.max(0, parseInt(q.offset, 10) || 0);
    const pagina = filtradas.slice(offset, offset + LIMITE);
    res.json({ publicaciones: await armarPublicaciones(pagina, uid), hayMas: filtradas.length > offset + LIMITE });
  }));

  app.get('/api/publicaciones/:id', lectura, ruta(async (req, res) => {
    const pid = idNum(req.params.id);
    if (!pid) return res.status(400).json({ error: 'Publicación inválida.' });
    const p = await publicacionPorId(pid, uidDe(req));
    if (!p) return res.status(404).json({ error: 'Esa publicación no existe.' });
    res.json({ publicacion: p });
  }));

  app.post('/api/publicaciones', sesion, limitar(30, 15), ruta(async (req, res) => {
    const b = req.body || {};
    const v = validarPublicacion(b);
    if (v.error) return res.status(400).json({ error: v.error });
    let imagen = null;
    if (b.imagen) {
      if (!imagenValida(b.imagen, MAX_IMG_PUBLICACION)) return res.status(400).json({ error: 'La imagen no es válida o pesa demasiado.' });
      imagen = b.imagen;
    }
    const p = await A.crearPublicacion({ uid: req.usuario.id, username: req.usuario.nombre, ...v }, imagen);
    res.status(201).json({ publicacion: await publicacionPorId(p.id, req.usuario.id) });
  }));

  function publicacionPropia(req) {
    const pid = idNum(req.params.id);
    if (!pid) throw fallo(400, 'Publicación inválida.');
    const p = A.posts.get(pid);
    if (!p) throw fallo(404, 'Esa publicación no existe.');
    if (p.uid !== req.usuario.id && !esAdmin(req.usuario)) throw fallo(403, 'Solo podés modificar tus publicaciones.');
    return p;
  }

  app.put('/api/publicaciones/:id', sesion, limitar(60, 15), ruta(async (req, res) => {
    const p = publicacionPropia(req);
    const v = validarPublicacion(req.body || {});
    if (v.error) return res.status(400).json({ error: v.error });
    await A.cambiarPublicacion(p.id, { titulo: v.titulo, texto: v.texto, precio: v.precio, categoria: v.categoria });
    res.json({ publicacion: await publicacionPorId(p.id, req.usuario.id) });
  }));

  app.delete('/api/publicaciones/:id', sesion, ruta(async (req, res) => {
    const p = publicacionPropia(req);
    await A.borrarPublicacion(p.id);
    res.json({ ok: true });
  }));

  app.post('/api/publicaciones/:id/vendida', sesion, ruta(async (req, res) => {
    const p = publicacionPropia(req);
    const nuevo = p.estado === 'vendida' ? 'activa' : 'vendida';
    await A.cambiarPublicacion(p.id, { estado: nuevo });
    res.json({ estado: nuevo });
  }));

  // "Me gusta" y "Guardar": si ya estaba lo saca, si no estaba lo pone.
  const NUEVO_ESTADO = (uid, pid) => ({ uid, pid, like: false, guardado: false, carrito: false, fecha: Date.now() });

  app.post('/api/publicaciones/:id/like', sesion, limitar(120, 5), ruta(async (req, res) => {
    const pid = idNum(req.params.id);
    const p = pid && A.posts.get(pid);
    if (!p) throw fallo(404, 'Esa publicación no existe.');
    const uid = req.usuario.id;
    const refE = col('estados').doc(`${uid}_${pid}`);
    const refP = col('publicaciones').doc(String(pid));
    const r = await db.runTransaction(async (t) => {
      const e = await t.get(refE);
      const ps = await t.get(refP);
      if (!ps.exists) throw fallo(404, 'Esa publicación no existe.');
      const activo = !(e.exists && e.data().like);
      const likes = Math.max(0, (Number(ps.data().likes) || 0) + (activo ? 1 : -1));
      if (e.exists) t.update(refE, { like: activo }); else t.set(refE, { ...NUEVO_ESTADO(uid, pid), like: true });
      t.update(refP, { likes });
      return { activo, total: likes };
    });
    p.likes = r.total;
    res.json(r);
  }));

  app.post('/api/publicaciones/:id/guardar', sesion, limitar(120, 5), ruta(async (req, res) => {
    const pid = idNum(req.params.id);
    if (!pid || !A.posts.get(pid)) throw fallo(404, 'Esa publicación no existe.');
    const uid = req.usuario.id;
    const refE = col('estados').doc(`${uid}_${pid}`);
    const activo = await db.runTransaction(async (t) => {
      const e = await t.get(refE);
      const nuevo = !(e.exists && e.data().guardado);
      if (e.exists) t.update(refE, { guardado: nuevo }); else t.set(refE, { ...NUEVO_ESTADO(uid, pid), guardado: true });
      return nuevo;
    });
    res.json({ activo });
  }));

  // ------------------------------ comentarios (con respuestas y votos) ------------------------------
  app.get('/api/publicaciones/:id/comentarios', lectura, ruta(async (req, res) => {
    const pid = idNum(req.params.id);
    if (!pid) return res.status(400).json({ error: 'Publicación inválida.' });
    const p = A.posts.get(pid);
    const uid = uidDe(req);
    if (!p || (p.oculta && p.uid !== uid)) return res.status(404).json({ error: 'Esa publicación no existe.' });
    const snap = await col('comentarios').where('pid', '==', pid).get();
    const lista = snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }))
      .filter((c) => !c.oculto || c.uid === uid)
      .sort((a, b) => a.id - b.id).slice(0, 400);
    const misVotos = new Map();
    if (uid) {
      const vs = await col('votos').where('uid', '==', uid).where('pid', '==', pid).get();
      vs.forEach((d) => misVotos.set(Number(d.data().cid), Number(d.data().v)));
    }
    const us = await A.usuariosVarios(lista.map((c) => c.uid));
    res.json({
      comentarios: lista.map((c) => ({
        id: c.id, texto: c.texto, fecha: iso(c.fecha),
        imagen: c.imgV ? `/api/imagen/com/${c.id}?v=${c.imgV}` : '',
        usuario: infoUsuario(us.get(c.uid), c.uid),
        padre: c.padre || null, respondeA: c.respondeA || '',
        likes: Number(c.likes) || 0, dislikes: Number(c.dislikes) || 0, miVoto: misVotos.get(c.id) || 0,
        mia: c.uid === uid, oculto: !!c.oculto && c.uid === uid,
        puedeBorrar: !!uid && (c.uid === uid || p.uid === uid || esAdmin(req.usuario))
      }))
    });
  }));

  app.post('/api/publicaciones/:id/comentarios', sesion, limitar(40, 5), ruta(async (req, res) => {
    const pid = idNum(req.params.id);
    const p = pid && A.posts.get(pid);
    if (!p || (p.oculta && p.uid !== req.usuario.id)) throw fallo(404, 'Esa publicación no existe.');
    const uid = req.usuario.id;
    const texto = String((req.body && req.body.texto) || '').trim();
    const imagen = (req.body && req.body.imagen) || null;
    if (!texto && !imagen) return res.status(400).json({ error: 'Escribí un comentario o agregá una foto.' });
    if (texto.length > 500) return res.status(400).json({ error: 'El comentario es muy largo (máximo 500 caracteres).' });
    if (imagen && !imagenValida(imagen, MAX_IMG_COMENTARIO)) return res.status(400).json({ error: 'La foto no es válida o pesa demasiado.' });
    const b = await A.bloqueosDe(uid);
    if (b.yo.has(p.uid) || b.ellos.has(p.uid)) throw fallo(403, 'No podés comentar en esta publicación.');

    // Respuesta: se cuelga siempre del comentario principal (como en Facebook) y menciona a quién respondés.
    let padre = 0;
    let respondeA = '';
    const padreId = idNum(req.body && req.body.padreId);
    if (padreId) {
      const s = await col('comentarios').doc(String(padreId)).get();
      if (!s.exists || Number(s.data().pid) !== pid) throw fallo(404, 'Ese comentario ya no existe.');
      padre = s.data().padre || padreId;
      const autor = await A.usuario(s.data().uid);
      respondeA = autor ? autor.username : '';
    }
    const id = await A.nextId('comentarios');
    const doc = { pid, uid, texto, fecha: Date.now(), imgV: imagen ? Date.now() : 0, padre, respondeA, likes: 0, dislikes: 0, oculto: false, dv: 0 };
    const lote = db.batch();
    lote.set(col('comentarios').doc(String(id)), doc);
    if (imagen) lote.set(col('medios').doc('com_' + id), { data: imagen });
    lote.update(col('publicaciones').doc(String(pid)), { ncomentarios: FV.increment(1) });
    await lote.commit();
    p.ncomentarios += 1;
    res.status(201).json({
      comentario: {
        id, texto, fecha: iso(doc.fecha), imagen: doc.imgV ? `/api/imagen/com/${id}?v=${doc.imgV}` : '',
        usuario: { id: uid, nombre: req.usuario.nombre, avatar: req.usuario.avatar || '' },
        padre: padre || null, respondeA, likes: 0, dislikes: 0, miVoto: 0, mia: true, oculto: false, puedeBorrar: true
      }
    });
  }));

  // Borra un comentario (y, si es principal, todas sus respuestas) con sus fotos y votos, y ajusta el contador.
  async function borrarHiloDeComentario(cid, c) {
    const ids = [cid];
    if (!c.padre) {
      const hijas = await col('comentarios').where('pid', '==', Number(c.pid)).where('padre', '==', cid).get();
      hijas.forEach((d) => ids.push(Number(d.id)));
    }
    await A.borrarComentarios(ids);
    const p = A.posts.get(Number(c.pid));
    if (p) {
      try { await col('publicaciones').doc(String(p.id)).update({ ncomentarios: FV.increment(-ids.length) }); } catch (e) { /* la publicación ya no está */ }
      p.ncomentarios = Math.max(0, p.ncomentarios - ids.length);
    }
    return ids;
  }

  app.delete('/api/comentarios/:id', sesion, ruta(async (req, res) => {
    const cid = idNum(req.params.id);
    if (!cid) return res.status(400).json({ error: 'Comentario inválido.' });
    const s = await col('comentarios').doc(String(cid)).get();
    if (!s.exists) return res.status(404).json({ error: 'Ese comentario no existe.' });
    const c = s.data();
    const p = A.posts.get(Number(c.pid));
    if (c.uid !== req.usuario.id && !(p && p.uid === req.usuario.id) && !esAdmin(req.usuario)) {
      return res.status(403).json({ error: 'No podés borrar ese comentario.' });
    }
    const ids = await borrarHiloDeComentario(cid, c);
    res.json({ ok: true, borrados: ids });
  }));

  // Me gusta / No me gusta en un comentario. Tocar el mismo voto otra vez lo saca; tocar el otro lo cambia.
  app.post('/api/comentarios/:id/voto', sesion, limitar(120, 5), ruta(async (req, res) => {
    const cid = idNum(req.params.id);
    const valor = Number(req.body && req.body.valor);
    if (!cid || (valor !== 1 && valor !== -1)) return res.status(400).json({ error: 'Voto inválido.' });
    const uid = req.usuario.id;
    const refC = col('comentarios').doc(String(cid));
    const refV = col('votos').doc(`${uid}_${cid}`);
    const r = await db.runTransaction(async (t) => {
      const c = await t.get(refC);
      const v = await t.get(refV);
      if (!c.exists) throw fallo(404, 'Ese comentario ya no existe.');
      const antes = v.exists ? Number(v.data().v) : 0;
      const ahora = antes === valor ? 0 : valor;
      let likes = Number(c.data().likes) || 0;
      let dislikes = Number(c.data().dislikes) || 0;
      if (antes === 1) likes--;
      if (antes === -1) dislikes--;
      if (ahora === 1) likes++;
      if (ahora === -1) dislikes++;
      likes = Math.max(0, likes); dislikes = Math.max(0, dislikes);
      t.update(refC, { likes, dislikes });
      if (ahora === 0) t.delete(refV); else t.set(refV, { uid, cid, pid: Number(c.data().pid), v: ahora });
      return { likes, dislikes, miVoto: ahora };
    });
    res.json(r);
  }));

  // ------------------------------ carrito ------------------------------
  async function pidsDelCarrito(uid) {
    const snap = await col('estados').where('uid', '==', uid).where('carrito', '==', true).get();
    return snap.docs.map((d) => ({ pid: Number(d.data().pid), fecha: Number(d.data().fecha) || 0, ref: d.ref }));
  }

  app.get('/api/carrito', sesion, lectura, ruta(async (req, res) => {
    const filas = (await pidsDelCarrito(req.usuario.id)).sort((a, b) => b.fecha - a.fecha);
    const items = filas.map((f) => A.posts.get(f.pid)).filter(Boolean);
    const us = await A.usuariosVarios(items.map((p) => p.uid));
    res.json({
      items: items.map((p) => ({
        id: p.id, titulo: p.titulo, texto: p.texto, precio: p.precio,
        imagen: p.imgV ? `/api/imagen/pub/${p.id}?v=${p.imgV}` : '',
        estado: p.estado, vendedor: { id: p.uid, nombre: us.get(p.uid) ? us.get(p.uid).username : p.username }
      }))
    });
  }));

  app.post('/api/carrito/:id', sesion, limitar(120, 5), ruta(async (req, res) => {
    const pid = idNum(req.params.id);
    const p = pid && A.posts.get(pid);
    if (!p || p.oculta) return res.status(404).json({ error: 'Esa publicación no existe.' });
    if (p.uid === req.usuario.id) return res.status(400).json({ error: 'No podés agregar tus propias publicaciones al carrito.' });
    if (p.estado !== 'activa') return res.status(400).json({ error: 'Esa prenda ya fue vendida.' });
    await col('estados').doc(`${req.usuario.id}_${pid}`).set({ uid: req.usuario.id, pid, carrito: true, fecha: Date.now() }, { merge: true });
    resumenes.delete(req.usuario.id);
    res.json({ ok: true });
  }));

  app.delete('/api/carrito', sesion, ruta(async (req, res) => {
    const filas = await pidsDelCarrito(req.usuario.id);
    for (let i = 0; i < filas.length; i += 400) {
      const lote = db.batch();
      filas.slice(i, i + 400).forEach((f) => lote.update(f.ref, { carrito: false }));
      await lote.commit();
    }
    resumenes.delete(req.usuario.id);
    res.json({ ok: true });
  }));

  app.delete('/api/carrito/:id', sesion, ruta(async (req, res) => {
    const pid = idNum(req.params.id);
    if (!pid) return res.status(400).json({ error: 'Publicación inválida.' });
    const ref = col('estados').doc(`${req.usuario.id}_${pid}`);
    const s = await ref.get();
    if (s.exists) await ref.update({ carrito: false });
    resumenes.delete(req.usuario.id);
    res.json({ ok: true });
  }));

  // Numeritos del menú (carrito y mensajes sin leer). Se guarda 8 segundos para no gastar lecturas.
  app.get('/api/resumen', sesion, sondeo, ruta(async (req, res) => {
    const uid = req.usuario.id;
    const c = resumenes.get(uid);
    if (c && Date.now() - c.t < 8000) return res.json(c.r);
    const [carr, chats, prefs] = await Promise.all([
      pidsDelCarrito(uid),
      col('chats').where('miembros', 'array-contains', uid).get(),
      A.prefsChat(uid)
    ]);
    let sinLeer = 0;
    chats.forEach((d) => {
      const c = d.data();
      const otro = (c.miembros || []).find((x) => x !== uid);
      const pf = prefs.get(otro);
      if (pf && pf.silenciado) return; // los chats silenciados no suman al numerito del menú
      sinLeer += Number(c['sl_' + uid]) || 0;
    });
    const r = {
      carrito: carr.filter((f) => { const p = A.posts.get(f.pid); return p && p.estado === 'activa'; }).length,
      sinLeer
    };
    resumenes.set(uid, { r, t: Date.now() });
    res.json(r);
  }));

  // ------------------------------ usuarios y perfil ------------------------------
  app.get('/api/usuarios', sesion, lectura, ruta(async (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 30).toLowerCase();
    if (q.length < 2) return res.json({ usuarios: [] });
    // Busca nombres que EMPIEZAN con lo escrito.
    const snap = await col('usuarios').where('usernameLower', '>=', q).where('usernameLower', '<=', q + '\uf8ff').limit(11).get();
    const lista = snap.docs.map((d) => ({ id: Number(d.id), ...d.data() })).filter((u) => u.id !== req.usuario.id).slice(0, 10);
    res.json({ usuarios: lista.map((u) => ({ id: u.id, nombre: u.username, avatar: urlAvatar(u) })) });
  }));

  app.get('/api/usuarios/:nombre', lectura, ruta(async (req, res) => {
    const uid = uidDe(req);
    const id = await A.uidPorNombre(String(req.params.nombre));
    const u = id && await A.usuario(id);
    if (!u) return res.status(404).json({ error: 'Ese usuario no existe.' });
    let miCalificacion = 0;
    let bloqueado = false;
    let rel = { loSigo: false, meSigue: false, amigos: false };
    if (uid && uid !== u.id) {
      const mi = await col('calificaciones').doc(`${uid}_${u.id}`).get();
      if (mi.exists) miCalificacion = Number(mi.data().estrellas) || 0;
      bloqueado = (await A.bloqueosDe(uid)).yo.has(u.id);
      rel = await A.relacion(uid, u.id);
    }
    const n = Number(u.calN) || 0;
    res.json({
      usuario: {
        id: u.id, nombre: u.username, avatar: urlAvatar(u), bio: u.bio || '', desde: iso(u.fecha),
        tema: u.tema || '', fondoV: Number(u.fondoV) || 0,
        calificacion: n ? Number((u.calSuma / n).toFixed(1)) : null,
        cantidadCalificaciones: n,
        seguidores: Number(u.nSeguidores) || 0, siguiendo: Number(u.nSiguiendo) || 0, amigos: Number(u.nAmigos) || 0,
        loSigo: rel.loSigo, meSigue: rel.meSigue, esAmigo: rel.amigos,
        miCalificacion, bloqueado, soyYo: u.id === uid
      }
    });
  }));

  // Quiénes lo siguen, a quiénes sigue o quiénes son sus amigos (se siguen entre sí). Listas públicas.
  app.get('/api/usuarios/:nombre/red', lectura, ruta(async (req, res) => {
    const tipo = String(req.query.tipo || 'seguidores');
    if (!['seguidores', 'siguiendo', 'amigos'].includes(tipo)) return res.status(400).json({ error: 'Lista inválida.' });
    const uid = uidDe(req);
    const id = await A.uidPorNombre(String(req.params.nombre));
    if (!id) return res.status(404).json({ error: 'Ese usuario no existe.' });
    let lista = await A.listarRed(id, tipo, 200);
    let bloq = new Set();
    let mios = new Set();
    if (uid) {
      const b = await A.bloqueosDe(uid);
      bloq = new Set([...b.yo, ...b.ellos]);
      mios = new Set((await A.listarRed(uid, 'siguiendo', 1000)).map((x) => x.id));
    }
    lista = lista.filter((x) => !bloq.has(x.id)).slice(0, 100);
    const us = await A.usuariosVarios(lista.map((x) => x.id));
    res.json({
      usuarios: lista.filter((x) => us.get(x.id)).map((x) => {
        const u = us.get(x.id);
        return { id: u.id, nombre: u.username, avatar: urlAvatar(u), loSigo: mios.has(u.id), soyYo: u.id === uid };
      })
    });
  }));

  // Seguir / dejar de seguir. Si el otro también te sigue, son amigos.
  app.post('/api/seguir/:id', sesion, limitar(120, 5), ruta(async (req, res) => {
    const otro = idNum(req.params.id);
    if (!otro || otro === req.usuario.id) return res.status(400).json({ error: 'Usuario inválido.' });
    const b = await A.bloqueosDe(req.usuario.id);
    if (b.yo.has(otro) || b.ellos.has(otro)) throw fallo(403, 'No podés seguir a este usuario.');
    res.json(await A.alternarSeguir(req.usuario.id, otro));
  }));

  // Cambiar nombre de usuario, descripción, foto, tema y/o fondo ("Guardar cambios").
  app.put('/api/perfil', sesion, limitar(30, 15), ruta(async (req, res) => {
    const b = req.body || {};
    const yo = req.usuario;
    const cambios = {};
    const medios = []; // [clave, datos|null]
    let nuevoNombre = null;

    if (b.nombre !== undefined && String(b.nombre) !== yo.nombre) {
      const nombre = String(b.nombre).trim();
      const e = validarUsername(nombre);
      if (e) return res.status(400).json({ error: e });
      const otro = await A.uidPorNombre(nombre);
      if (otro && otro !== yo.id) return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso.' });
      nuevoNombre = nombre;
    }
    if (b.bio !== undefined) {
      const bio = String(b.bio).trim();
      if (bio.length > 300) return res.status(400).json({ error: 'La descripción es muy larga (máximo 300 caracteres).' });
      cambios.bio = bio;
    }
    if (b.avatar !== undefined) {
      if (b.avatar === '' || b.avatar === null) { cambios.avatarV = 0; medios.push(['avatar_' + yo.id, null]); }
      else if (imagenValida(b.avatar, MAX_IMG_AVATAR)) { cambios.avatarV = Date.now(); medios.push(['avatar_' + yo.id, b.avatar]); }
      else return res.status(400).json({ error: 'La foto no es válida o pesa demasiado.' });
    }
    if (b.tema !== undefined) {
      const tema = String(b.tema);
      if (!TEMAS.includes(tema) && !RE_TEMA_PROPIO.test(tema)) return res.status(400).json({ error: 'Ese tema no existe.' });
      cambios.tema = tema;
    }
    if (b.fondo !== undefined) {
      if (b.fondo === '' || b.fondo === null) { cambios.fondoV = 0; medios.push(['fondo_' + yo.id, null]); }
      else if (imagenValida(b.fondo, MAX_IMG_FONDO)) { cambios.fondoV = Date.now(); medios.push(['fondo_' + yo.id, b.fondo]); }
      else return res.status(400).json({ error: 'La imagen de fondo no es válida o pesa demasiado.' });
    }

    for (const [clave, datos] of medios) {
      if (datos) await col('medios').doc(clave).set({ data: datos }); else await col('medios').doc(clave).delete();
    }
    if (nuevoNombre) await A.renombrarUsuario(yo.id, yo.nombre, nuevoNombre);
    if (Object.keys(cambios).length) await A.actualizarUsuario(yo.id, cambios);
    const u = await A.usuario(yo.id);
    res.json({
      ok: true,
      usuario: { id: u.id, nombre: u.username, avatar: urlAvatar(u), bio: u.bio || '', tema: u.tema || '', fondoV: Number(u.fondoV) || 0 }
    });
  }));

  // Fondo de pantalla del perfil de un usuario (público: lo ve cualquiera que visite ese perfil).
  app.get('/api/usuarios/:nombre/fondo', lectura, ruta(async (req, res) => {
    const id = await A.uidPorNombre(String(req.params.nombre));
    if (!id) return res.status(404).end();
    const s = await col('medios').doc('fondo_' + id).get();
    if (!s.exists) return res.status(404).end();
    enviarImagen(res, s.data().data, false);
  }));

  // Cambiar contraseña estando logueado.
  app.post('/api/perfil/password', sesion, limitar(10, 15), ruta(async (req, res) => {
    const { actual, nueva, confirmar } = req.body || {};
    const e = validarPassword(nueva);
    if (e) return res.status(400).json({ error: e });
    if (nueva !== confirmar) return res.status(400).json({ error: 'Las contraseñas nuevas no coinciden.' });
    const u = await A.usuario(req.usuario.id);
    const ok = u && typeof actual === 'string' && (await bcrypt.compare(actual, u.password));
    if (!ok) return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
    await A.actualizarUsuario(u.id, { password: await bcrypt.hash(nueva, 12) });
    // Cierra el resto de las sesiones abiertas (otros dispositivos) y deja esta.
    await A.borrarSesionesDe(u.id, leerCookie(req, COOKIE));
    res.json({ ok: true });
  }));

  // Cambiar el correo o teléfono de la cuenta. Dos pasos: (1) contraseña + contacto nuevo -> se manda un
  // código AL CONTACTO NUEVO (así se comprueba que es tuyo); (2) con ese código se confirma el cambio.
  app.post('/api/perfil/contacto/pedir', sesion, limitar(5, 15), ruta(async (req, res) => {
    const { password } = req.body || {};
    const c = normalizarContacto(req.body && req.body.contacto);
    if (c.error) return res.status(400).json({ error: c.error });
    const u = await A.usuarioFresco(req.usuario.id);
    const ok = u && typeof password === 'string' && (await bcrypt.compare(password, u.password));
    if (!ok) return res.status(400).json({ error: 'La contraseña no es correcta.' });
    if (c.valor === u.contacto) return res.status(400).json({ error: 'Ese ya es tu correo o número actual.' });
    const dueno = await A.uidPorContacto(c.valor);
    if (dueno && dueno !== u.id) return res.status(400).json({ error: 'Ya hay una cuenta con ese correo o número.' });
    const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    await col('cambiosContacto').doc(String(u.id)).set({
      nuevo: c.valor, tipo: c.tipo, codigoHash: sha256(codigo + ':cc:' + u.id), intentos: 0,
      expira: Date.now() + 15 * 60 * 1000
    });
    await enviarCodigo(c.valor, c.tipo, u.username, codigo);
    res.json({ ok: true, mensaje: 'Te enviamos un código de 6 números a ' + c.valor + '. Vence en 15 minutos.' });
  }));

  app.post('/api/perfil/contacto/confirmar', sesion, limitar(15, 15), ruta(async (req, res) => {
    const codigo = String((req.body && req.body.codigo) || '').trim();
    const malCodigo = { error: 'El código es incorrecto o venció. Pedí uno nuevo.' };
    if (!/^[0-9]{6}$/.test(codigo)) return res.status(400).json({ error: 'El código tiene 6 números.' });
    const u = await A.usuarioFresco(req.usuario.id);
    if (!u) return res.status(401).json({ error: 'Iniciá sesión de nuevo.' });
    const ref = col('cambiosContacto').doc(String(u.id));
    const snap = await ref.get();
    const rec = snap.exists ? snap.data() : null;
    if (!rec || Number(rec.expira) < Date.now() || Number(rec.intentos) >= 5) return res.status(400).json(malCodigo);
    const dado = Buffer.from(sha256(codigo + ':cc:' + u.id));
    const guardado = Buffer.from(String(rec.codigoHash));
    if (dado.length !== guardado.length || !crypto.timingSafeEqual(dado, guardado)) {
      await ref.update({ intentos: FV.increment(1) });
      return res.status(400).json(malCodigo);
    }
    try {
      await A.cambiarContacto(u.id, u.contacto, rec.nuevo);
    } catch (e) {
      if (e && e.codigo === 'DUP_CONTACTO') return res.status(400).json({ error: 'Ya hay una cuenta con ese correo o número.' });
      throw e;
    }
    await ref.delete();
    res.json({ ok: true, contacto: rec.nuevo });
  }));

  app.post('/api/usuarios/:id/calificar', sesion, limitar(30, 15), ruta(async (req, res) => {
    const otro = idNum(req.params.id);
    const estrellas = Number(req.body && req.body.estrellas);
    if (!otro) return res.status(400).json({ error: 'Usuario inválido.' });
    if (otro === req.usuario.id) return res.status(400).json({ error: 'No podés calificarte a vos mismo.' });
    if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) return res.status(400).json({ error: 'Elegí de 1 a 5 estrellas.' });
    const refU = col('usuarios').doc(String(otro));
    const refK = col('calificaciones').doc(`${req.usuario.id}_${otro}`);
    const r = await db.runTransaction(async (t) => {
      const u = await t.get(refU);
      const k = await t.get(refK);
      if (!u.exists) throw fallo(404, 'Ese usuario no existe.');
      const antes = k.exists ? Number(k.data().estrellas) : 0;
      const suma = (Number(u.data().calSuma) || 0) - antes + estrellas;
      const n = (Number(u.data().calN) || 0) + (k.exists ? 0 : 1);
      t.update(refU, { calSuma: suma, calN: n });
      t.set(refK, { de: req.usuario.id, para: otro, estrellas, fecha: Date.now() });
      return { calificacion: Number((suma / n).toFixed(1)), cantidad: n, miCalificacion: estrellas };
    });
    A.olvidarUsuario(otro);
    res.json(r);
  }));

  // ------------------------------ bloqueos y denuncias ------------------------------
  app.post('/api/bloqueos/:id', sesion, limitar(60, 15), ruta(async (req, res) => {
    const otro = idNum(req.params.id);
    if (!otro || otro === req.usuario.id) return res.status(400).json({ error: 'Usuario inválido.' });
    if (!(await A.usuario(otro))) return res.status(404).json({ error: 'Ese usuario no existe.' });
    const ref = col('bloqueos').doc(`${req.usuario.id}_${otro}`);
    const bloqueado = await db.runTransaction(async (t) => {
      const s = await t.get(ref);
      if (s.exists) { t.delete(ref); return false; }
      t.set(ref, { uid: req.usuario.id, otro, fecha: Date.now() });
      return true;
    });
    A.olvidarBloqueos(req.usuario.id, otro);
    if (bloqueado) await A.cortarVinculos(req.usuario.id, otro); // al bloquear, dejan de seguirse
    res.json({ bloqueado });
  }));

  // Denuncias: una sola por persona y por cosa denunciada. Las de cuentas con más de 1 día suman;
  // al llegar al umbral el contenido queda oculto hasta que alguien lo revise.
  app.post('/api/denuncias', sesion, limitar(10, 15), ruta(async (req, res) => {
    const b = req.body || {};
    const tipo = String(b.tipo || '');
    const objetivo = idNum(b.id);
    const motivo = String(b.motivo || '').trim();
    if (!['publicacion', 'usuario', 'comentario'].includes(tipo) || !objetivo) return res.status(400).json({ error: 'Denuncia inválida.' });
    if (motivo.length < 3 || motivo.length > 300) return res.status(400).json({ error: 'Contanos el motivo (entre 3 y 300 caracteres).' });
    const uid = req.usuario.id;

    // ¿Existe lo denunciado? ¿Es mío?
    let dueno = 0;
    let refObjetivo = null;
    if (tipo === 'publicacion') {
      const p = A.posts.get(objetivo);
      if (!p) throw fallo(404, 'Eso ya no existe.');
      dueno = p.uid;
    } else if (tipo === 'comentario') {
      refObjetivo = col('comentarios').doc(String(objetivo));
      const s = await refObjetivo.get();
      if (!s.exists) throw fallo(404, 'Eso ya no existe.');
      dueno = Number(s.data().uid);
    } else {
      if (!(await A.usuario(objetivo))) throw fallo(404, 'Ese usuario no existe.');
      dueno = objetivo;
    }
    if (dueno === uid) throw fallo(400, 'No podés denunciarte a vos mismo.');

    const ref = col('denuncias').doc(`${tipo}_${objetivo}_${uid}`);
    const yaEstaba = await db.runTransaction(async (t) => {
      const s = await t.get(ref);
      if (s.exists) return true;
      t.set(ref, { tipo, objetivo, dueno, denunciante: uid, motivo, fecha: Date.now(), estado: 'pendiente' });
      return false;
    });
    if (yaEstaba) return res.status(409).json({ error: 'Ya denunciaste esto. Lo estamos revisando.' });

    const me = await A.usuario(uid);
    const cuentaVieja = me && Date.now() - Number(me.fecha) >= EDAD_MIN_DENUNCIANTE_MS;
    if (cuentaVieja && tipo === 'publicacion') {
      const p = A.posts.get(objetivo);
      const dv = p.dv + 1;
      await A.cambiarPublicacion(objetivo, dv >= UMBRAL_OCULTAR ? { dv, oculta: true } : { dv });
    } else if (cuentaVieja && tipo === 'comentario') {
      const s = await refObjetivo.get();
      const dv = (Number(s.data().dv) || 0) + 1;
      await refObjetivo.update(dv >= UMBRAL_OCULTAR ? { dv, oculto: true } : { dv });
    }
    res.status(201).json({ ok: true, mensaje: 'Gracias. Revisamos la denuncia.' });
  }));

  // ---- Moderación (solo cuentas listadas en ADMIN_USERS) ----
  app.get('/api/admin/denuncias', sesion, soloAdmin, lectura, ruta(async (req, res) => {
    const snap = await col('denuncias').where('estado', '==', 'pendiente').get();
    const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.fecha - a.fecha).slice(0, 100);
    const us = await A.usuariosVarios(lista.flatMap((d) => [d.denunciante, d.dueno]));
    const salida = [];
    for (const d of lista) {
      let resumen = '';
      let oculto = false;
      if (d.tipo === 'publicacion') {
        const p = A.posts.get(d.objetivo);
        resumen = p ? `${p.titulo} — ${p.texto}`.slice(0, 200) : '(ya no existe)';
        oculto = !!(p && p.oculta);
      } else if (d.tipo === 'comentario') {
        const s = await col('comentarios').doc(String(d.objetivo)).get();
        resumen = s.exists ? String(s.data().texto).slice(0, 200) : '(ya no existe)';
        oculto = !!(s.exists && s.data().oculto);
      } else {
        const u = us.get(d.objetivo) || await A.usuario(d.objetivo);
        resumen = u ? '@' + u.username : '(ya no existe)';
      }
      salida.push({
        id: d.id, tipo: d.tipo, objetivo: d.objetivo, motivo: d.motivo, fecha: iso(d.fecha), oculto, resumen,
        denunciante: us.get(d.denunciante) ? us.get(d.denunciante).username : '?',
        dueno: us.get(d.dueno) ? us.get(d.dueno).username : '?'
      });
    }
    res.json({ denuncias: salida });
  }));

  app.post('/api/admin/denuncias/:id', sesion, soloAdmin, limitar(120, 5), ruta(async (req, res) => {
    const m = /^(publicacion|usuario|comentario)_(\d+)_(\d+)$/.exec(String(req.params.id));
    const accion = String((req.body && req.body.accion) || '');
    if (!m || !['descartar', 'ocultar', 'restaurar', 'eliminar'].includes(accion)) return res.status(400).json({ error: 'Acción inválida.' });
    const tipo = m[1];
    const objetivo = Number(m[2]);
    if (tipo === 'publicacion') {
      if (accion === 'eliminar') await A.borrarPublicacion(objetivo);
      else if (accion === 'ocultar' && A.posts.get(objetivo)) await A.cambiarPublicacion(objetivo, { oculta: true });
      else if (accion === 'restaurar' && A.posts.get(objetivo)) await A.cambiarPublicacion(objetivo, { oculta: false, dv: 0 });
    } else if (tipo === 'comentario') {
      const ref = col('comentarios').doc(String(objetivo));
      const s = await ref.get();
      if (s.exists) {
        if (accion === 'eliminar') await borrarHiloDeComentario(objetivo, s.data());
        else if (accion === 'ocultar') await ref.update({ oculto: true });
        else if (accion === 'restaurar') await ref.update({ oculto: false, dv: 0 });
      }
    }
    // Cierra todas las denuncias pendientes sobre lo mismo.
    const todas = await col('denuncias').where('objetivo', '==', objetivo).where('estado', '==', 'pendiente').get();
    const lote = db.batch();
    todas.docs.forEach((d) => { if (d.data().tipo === tipo) lote.update(d.ref, { estado: accion === 'descartar' ? 'descartada' : 'resuelta', accion, resuelta: Date.now() }); });
    await lote.commit();
    res.json({ ok: true });
  }));

  // ------------------------------ chats ------------------------------
  const parKey = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);

  // Preferencias de chat de cada persona (fijar arriba, silenciar, vaciar). Se recuerdan 30 segundos.
  const cachePrefs = new Map();
  async function prefDe(yo, otro) {
    const k = yo + '_' + otro;
    const c = cachePrefs.get(k);
    if (c && Date.now() - c.t < 30000) return c.p;
    const p = await A.prefChat(yo, otro);
    cachePrefs.set(k, { p, t: Date.now() });
    return p;
  }

  app.get('/api/chats', sesion, sondeo, ruta(async (req, res) => {
    const yo = req.usuario.id;
    const [snap, prefs] = await Promise.all([col('chats').where('miembros', 'array-contains', yo).get(), A.prefsChat(yo)]);
    const lista = snap.docs.map((d) => {
      const c = d.data();
      const otro = c.miembros.find((x) => x !== yo);
      return { c, otro, pf: prefs.get(otro) || { fijado: false, silenciado: false, vaciadoHasta: 0, fijadoFecha: 0 } };
    })
      .filter((x) => Number(x.c.ultimaFecha) > x.pf.vaciadoHasta) // chats vaciados: no aparecen hasta que haya mensajes nuevos
      .sort((a, b) => (Number(b.pf.fijado) - Number(a.pf.fijado)) || (a.pf.fijado ? b.pf.fijadoFecha - a.pf.fijadoFecha : b.c.ultimaFecha - a.c.ultimaFecha))
      .slice(0, 100);
    const us = await A.usuariosVarios(lista.map((x) => x.otro));
    res.json({
      chats: lista.map((x) => ({
        usuario: infoUsuario(us.get(x.otro), x.otro),
        ultimo: x.c.ultimo || (x.c.ultimoImagen ? '[Foto]' : ''),
        fecha: iso(x.c.ultimaFecha), mio: x.c.ultimoDe === yo, sinLeer: Number(x.c['sl_' + yo]) || 0,
        fijado: x.pf.fijado, silenciado: x.pf.silenciado
      }))
    });
  }));

  app.get('/api/chats/:id', sesion, sondeo, ruta(async (req, res) => {
    const yo = req.usuario.id;
    const otro = idNum(req.params.id);
    if (!otro) return res.status(400).json({ error: 'Usuario inválido.' });
    const u = await A.usuario(otro);
    if (!u) return res.status(404).json({ error: 'Ese usuario no existe.' });
    const desde = Number(req.query.desde) || 0;
    const pf = await prefDe(yo, otro);
    const snap = await col('chats').doc(parKey(yo, otro)).collection('mensajes')
      .where('id', '>', desde).orderBy('id', 'desc').limit(200).get();
    const todos = snap.docs.map((d) => d.data()).reverse();
    const msgs = todos.filter((m) => Number(m.fecha) > pf.vaciadoHasta);
    if (todos.some((m) => m.de === otro)) {
      await col('chats').doc(parKey(yo, otro)).set({ ['sl_' + yo]: 0 }, { merge: true });
      resumenes.delete(yo);
    }
    const b = await A.bloqueosDe(yo);
    res.json({
      usuario: infoUsuario(u),
      mensajes: msgs.map((m) => {
        const p = m.pid ? A.posts.get(m.pid) : null;
        return {
          id: m.id, mio: m.de === yo, texto: m.texto, imagen: m.imagen || '', fecha: iso(m.fecha),
          publicacion: p ? { id: p.id, titulo: p.titulo } : null
        };
      }),
      bloqueo: { yo: b.yo.has(otro), ellos: b.ellos.has(otro) },
      fijado: pf.fijado, silenciado: pf.silenciado
    });
  }));

  // Fijar arriba / silenciar un chat. Es solo para quien lo pide (la otra persona no se entera).
  app.post('/api/chats/:id/prefs', sesion, limitar(120, 5), ruta(async (req, res) => {
    const yo = req.usuario.id;
    const otro = idNum(req.params.id);
    if (!otro || otro === yo) return res.status(400).json({ error: 'Usuario inválido.' });
    if (!(await A.usuario(otro))) return res.status(404).json({ error: 'Ese usuario no existe.' });
    const b = req.body || {};
    const cambios = {};
    if (b.silenciado !== undefined) cambios.silenciado = !!b.silenciado;
    if (b.fijado !== undefined) {
      cambios.fijado = !!b.fijado;
      if (cambios.fijado) {
        const todas = await A.prefsChat(yo);
        const yaFijados = [...todas.entries()].filter(([id, p]) => p.fijado && id !== otro).length;
        if (yaFijados >= MAX_PINES) return res.status(400).json({ error: `Podés fijar hasta ${MAX_PINES} chats.` });
        cambios.fijadoFecha = Date.now();
      }
    }
    if (!Object.keys(cambios).length) return res.status(400).json({ error: 'Nada para cambiar.' });
    await A.cambiarPrefChat(yo, otro, cambios);
    cachePrefs.delete(yo + '_' + otro);
    resumenes.delete(yo);
    const p = await prefDe(yo, otro);
    res.json({ fijado: p.fijado, silenciado: p.silenciado });
  }));

  // Vaciar el chat: se borran los mensajes SOLO para quien lo pide.
  app.post('/api/chats/:id/vaciar', sesion, limitar(30, 5), ruta(async (req, res) => {
    const yo = req.usuario.id;
    const otro = idNum(req.params.id);
    if (!otro || otro === yo) return res.status(400).json({ error: 'Usuario inválido.' });
    await A.cambiarPrefChat(yo, otro, { vaciadoHasta: Date.now() });
    cachePrefs.delete(yo + '_' + otro);
    await col('chats').doc(parKey(yo, otro)).set({ ['sl_' + yo]: 0 }, { merge: true });
    resumenes.delete(yo);
    res.json({ ok: true });
  }));

  app.post('/api/chats/:id', sesion, limitar(60, 5), ruta(async (req, res) => {
    const yo = req.usuario.id;
    const otro = idNum(req.params.id);
    const b = req.body || {};
    if (!otro || otro === yo) return res.status(400).json({ error: 'Usuario inválido.' });
    const texto = String(b.texto || '').trim();
    const imagen = b.imagen || null;
    if (!texto && !imagen) return res.status(400).json({ error: 'Escribí un mensaje.' });
    if (texto.length > 1000) return res.status(400).json({ error: 'El mensaje es muy largo (máximo 1000 caracteres).' });
    if (imagen && !imagenValida(imagen, MAX_IMG_CHAT)) return res.status(400).json({ error: 'La foto no es válida o pesa demasiado.' });
    if (!(await A.usuario(otro))) return res.status(404).json({ error: 'Ese usuario no existe.' });
    const bl = await A.bloqueosDe(yo);
    if (bl.yo.has(otro) || bl.ellos.has(otro)) return res.status(403).json({ error: 'No se puede enviar mensajes a este usuario.' });
    const pid = idNum(b.publicacionId);
    const id = await A.nextId('mensajes');
    const refChat = col('chats').doc(parKey(yo, otro));
    const lote = db.batch();
    lote.set(refChat.collection('mensajes').doc(String(id)), { id, de: yo, para: otro, texto, imagen, pid: pid || 0, fecha: Date.now() });
    lote.set(refChat, {
      miembros: [Math.min(yo, otro), Math.max(yo, otro)], ultimo: texto, ultimoDe: yo, ultimaFecha: Date.now(),
      ultimoImagen: !!imagen, ['sl_' + otro]: FV.increment(1)
    }, { merge: true });
    await lote.commit();
    resumenes.delete(otro);
    res.status(201).json({ id });
  }));
}

module.exports = { registrarRutas, imagenValida };