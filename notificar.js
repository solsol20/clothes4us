'use strict';
// Clothes4Us - envío del código para recuperar la contraseña.
//
// CORREO (elegí UNA forma, se prueba en este orden):
//   1) BREVO_API_KEY + MAIL_FROM  -> Brevo por internet (HTTPS). ES LA QUE FUNCIONA EN RENDER GRATIS.
//   2) MAIL_USER + MAIL_PASS      -> Gmail por SMTP (solo sirve en tu PC; Render gratis bloquea SMTP).
// SMS (opcional, es de pago): TWILIO_SID + TWILIO_TOKEN + TWILIO_NUMERO.
// Si no hay nada configurado, el código se escribe en la consola del servidor (en Render: pestaña Logs).

const NOMBRE_SITIO = 'Clothes4Us';

function textoCorreo(usuario, codigo) {
  return `Hola ${usuario},\n\nTu código para recuperar la contraseña de ${NOMBRE_SITIO} es: ${codigo}\n\n` +
    'Vence en 15 minutos. Si no lo pediste vos, ignorá este mensaje: tu cuenta sigue segura.\n';
}

async function correoBrevo(destino, usuario, codigo) {
  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: NOMBRE_SITIO, email: process.env.MAIL_FROM },
      to: [{ email: destino }],
      subject: `Tu código para recuperar la contraseña: ${codigo}`,
      textContent: textoCorreo(usuario, codigo)
    })
  });
  if (!respuesta.ok) throw new Error('Brevo respondió ' + respuesta.status + ': ' + (await respuesta.text()).slice(0, 200));
}

async function correoGmail(destino, usuario, codigo) {
  const nodemailer = require('nodemailer');
  const transporte = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.MAIL_USER, pass: String(process.env.MAIL_PASS || '').replace(/\s+/g, '') },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000
  });
  await transporte.sendMail({
    from: `"${NOMBRE_SITIO}" <${process.env.MAIL_USER}>`,
    to: destino,
    subject: `Tu código para recuperar la contraseña: ${codigo}`,
    text: textoCorreo(usuario, codigo)
  });
}

async function smsTwilio(telefono, codigo) {
  const sid = process.env.TWILIO_SID;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_TOKEN}`).toString('base64');
  const cuerpo = new URLSearchParams({
    To: telefono.startsWith('+') ? telefono : '+' + telefono,
    From: process.env.TWILIO_NUMERO,
    Body: `${NOMBRE_SITIO}: tu código es ${codigo} (vence en 15 min)`
  });
  const respuesta = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST', headers: { Authorization: 'Basic ' + auth, 'content-type': 'application/x-www-form-urlencoded' }, body: cuerpo
  });
  if (!respuesta.ok) throw new Error('Twilio respondió ' + respuesta.status + ': ' + (await respuesta.text()).slice(0, 200));
}

// tipo: 'email' o 'telefono'. Nunca tira error hacia afuera: si algo falla, deja el código en la consola.
async function enviarCodigo(contacto, tipo, usuario, codigo) {
  try {
    if (tipo === 'email') {
      if (process.env.BREVO_API_KEY && process.env.MAIL_FROM) { await correoBrevo(contacto, usuario, codigo); console.log('Código enviado por correo (Brevo) a', contacto); return; }
      if (process.env.MAIL_USER && process.env.MAIL_PASS) { await correoGmail(contacto, usuario, codigo); console.log('Código enviado por correo (Gmail) a', contacto); return; }
    } else if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_NUMERO) {
      await smsTwilio(contacto, codigo); console.log('Código enviado por SMS a', contacto); return;
    }
    console.log(`[SIN ENVÍO CONFIGURADO] Código de recuperación para @${usuario} (${contacto}): ${codigo}`);
  } catch (e) {
    console.error('No se pudo enviar el código:', e.message);
    console.log(`[CÓDIGO DE RESPALDO] @${usuario} (${contacto}): ${codigo}`);
  }
}

module.exports = { enviarCodigo };