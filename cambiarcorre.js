'use strict';
// Cambia el correo (o teléfono) registrado de una cuenta, desde tu PC.
// Uso (en la carpeta del proyecto):  node cambiar-correo.js TU_USUARIO nuevo@correo.com
const { crearAlmacen } = require('./almacen');

async function main() {
  const usuario = (process.argv[2] || '').trim();
  const crudo = (process.argv[3] || '').trim();
  if (!usuario || !crudo) { console.log('Uso: node cambiar-correo.js TU_USUARIO nuevo@correo.com'); process.exit(1); }
  const nuevo = crudo.includes('@') ? crudo.toLowerCase() : crudo.replace(/[\s().\-]/g, '');

  const A = crearAlmacen();
  const uid = await A.uidPorNombre(usuario);
  if (!uid) { console.log('No existe un usuario llamado "' + usuario + '".'); process.exit(1); }
  const u = await A.usuarioFresco(uid);
  const dueno = await A.uidPorContacto(nuevo);
  if (dueno && dueno !== uid) { console.log('Ese correo/número ya lo usa otra cuenta.'); process.exit(1); }
  await A.cambiarContacto(uid, u.contacto, nuevo);
  console.log('Listo. @' + u.username + ':  ' + u.contacto + '  ->  ' + nuevo);
  process.exit(0);
}
main().catch((e) => { console.error('Error:', e.message); process.exit(1); });