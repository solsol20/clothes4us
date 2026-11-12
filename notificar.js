const nodemailer = require('nodemailer');

let transporte = null;
function obtenerTransporte() {
  if (transporte) return transporte;
  if (!process.env.SMTP_HOST) return null;
  transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporte;
}

function escaparHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function enviarMail(para, username, codigo) {
  const t = obtenerTransporte();
  if (!t) {
    console.log(`\n[PRUEBA] Mail a ${para} -> código de recuperación: ${codigo}\n`);
    return;
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: para,
    subject: 'Tu código para recuperar la contraseña - Clothes4Us',
    text: `Hola ${username},\n\nTu código de recuperación es: ${codigo}\nVence en 15 minutos. Si no lo pediste vos, ignorá este mensaje.\n\nClothes4Us`,
    html:
      '<div style="font-family:Arial,sans-serif;max-width:480px">' +
      '<h2>Recuperá tu contraseña</h2>' +
      `<p>Hola <b>${escaparHtml(username)}</b>, tu código de recuperación es:</p>` +
      `<p style="font-size:32px;letter-spacing:6px;font-weight:bold">${codigo}</p>` +
      '<p>Vence en 15 minutos. Si no lo pediste vos, ignorá este mensaje.</p></div>'
  });
}

async function enviarSms(para, codigo) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const desde = process.env.TWILIO_FROM;
  if (!sid || !token || !desde) {
    console.log(`\n[PRUEBA] SMS a ${para} -> código de recuperación: ${codigo}\n`);
    return;
  }
  const respuesta = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      To: para,
      From: desde,
      Body: `Clothes4Us: tu código de recuperación es ${codigo}. Vence en 15 minutos.`
    })
  });
  if (!respuesta.ok) throw new Error('Twilio respondió ' + respuesta.status);
}

async function enviarCodigo(contacto, tipo, username, codigo) {
  if (tipo === 'email') return enviarMail(contacto, username, codigo);
  return enviarSms(contacto, codigo);
}

module.exports = { enviarCodigo };
