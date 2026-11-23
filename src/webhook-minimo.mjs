// CU-BKN-01 · Webhook mínimo de la mañana 1 (se reemplaza por el webhook completo en la mañana 3).
// Uso: node --env-file=.env src/webhook-minimo.mjs
// - GET  /webhook: verificación con VERIFY_TOKEN.
// - POST /webhook: valida X-Hub-Signature-256 (HMAC SHA-256 del cuerpo crudo con APP_SECRET), responde 200 de inmediato
//   y muestra en consola solo el texto y la hora de cada mensaje, y el estado de entrega de los mensajes enviados.
//   Nunca imprime números, IDs ni secretos.
// Fuentes (consultadas 2026-11-23):
//   https://developers.facebook.com/docs/graph-api/webhooks/getting-started
//   https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples

import crypto from 'node:crypto';
import express from 'express';

const { PORT = '3000', APP_SECRET, VERIFY_TOKEN } = process.env;
if (!APP_SECRET || !VERIFY_TOKEN) {
  console.error('Faltan variables en .env: APP_SECRET y/o VERIFY_TOKEN');
  process.exit(1);
}

const iguales = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

const firmaValida = (cuerpoCrudo, encabezado) => {
  if (!Buffer.isBuffer(cuerpoCrudo) || !encabezado?.startsWith('sha256=')) return false;
  const esperada = crypto.createHmac('sha256', APP_SECRET).update(cuerpoCrudo).digest('hex');
  return iguales(encabezado.slice('sha256='.length), esperada);
};

const hora = (timestamp) => new Date(Number(timestamp) * 1000).toLocaleString('es-MX');

const app = express();

app.get('/webhook', (req, res) => {
  const modo = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const reto = req.query['hub.challenge'];
  if (modo === 'subscribe' && token && iguales(token, VERIFY_TOKEN)) {
    console.log('Webhook verificado por Meta');
    return res.status(200).send(reto);
  }
  console.log('Verificación rechazada (token incorrecto)');
  return res.sendStatus(403);
});

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!firmaValida(req.body, req.get('X-Hub-Signature-256'))) {
    console.log('POST rechazado: firma inválida o ausente (401)');
    return res.sendStatus(401);
  }
  res.sendStatus(200);

  let datos;
  try {
    datos = JSON.parse(req.body.toString('utf8'));
  } catch {
    console.log('POST con firma válida pero JSON inválido');
    return;
  }

  for (const entrada of datos.entry ?? []) {
    for (const cambio of entrada.changes ?? []) {
      const valor = cambio.value ?? {};
      for (const mensaje of valor.messages ?? []) {
        const texto = mensaje.type === 'text' ? mensaje.text?.body : `(mensaje de tipo ${mensaje.type}, fuera de alcance)`;
        console.log(`[${hora(mensaje.timestamp)}] Mensaje recibido: ${texto}`);
      }
      for (const estado of valor.statuses ?? []) {
        const error = (estado.errors ?? []).map((e) => ` · error ${e.code}: ${e.title}`).join('');
        console.log(`[${hora(estado.timestamp)}] Estado de un mensaje enviado: ${estado.status}${error}`);
      }
    }
  }
});

app.listen(Number(PORT), () => console.log(`Webhook mínimo escuchando en http://localhost:${PORT}/webhook`));
