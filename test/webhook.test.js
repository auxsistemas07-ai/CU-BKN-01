// CU-BKN-01 · Pruebas del webhook de punta a punta (HTTP real en localhost, base en memoria, datos ficticios).
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { abrirBaseDatos } from '../src/db/base-datos.js';
import { crearApp } from '../src/app.js';

const APP_SECRET = 'secreto-de-prueba';
const VERIFY_TOKEN = 'token-de-prueba';

const payload = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{ changes: [{ field: 'messages', value: {
    contacts: [{ wa_id: '5210000000000', profile: { name: 'Asegurado Ficticio' } }],
    messages: [{ id: 'wamid.FICTICIO1', from: '5210000000000', timestamp: '1795000000', type: 'text', text: { body: 'Choqué, ¿qué hago?' } }],
  } }] }],
});
const firmar = (cuerpo, secreto = APP_SECRET) => 'sha256=' + crypto.createHmac('sha256', secreto).update(cuerpo).digest('hex');

let db, servidor, url;
beforeEach(async () => {
  db = abrirBaseDatos(':memory:');
  const app = crearApp({ db, appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN, log: () => {} });
  await new Promise((listo) => { servidor = app.listen(0, '127.0.0.1', listo); });
  url = `http://127.0.0.1:${servidor.address().port}/webhook`;
});
afterEach(() => new Promise((listo) => servidor.close(listo)));

const enviar = (encabezados = {}) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...encabezados }, body: payload });
const contar = (tabla) => db.prepare(`SELECT COUNT(*) AS total FROM ${tabla}`).get().total;

test('webhook: sin firma responde 401 y no guarda nada (criterio 2)', async () => {
  const res = await enviar();
  assert.equal(res.status, 401);
  assert.equal(contar('mensajes'), 0);
  assert.equal(contar('conversaciones'), 0);
});

test('webhook: con firma de otro secreto responde 401 y no guarda nada (criterio 2)', async () => {
  const res = await enviar({ 'X-Hub-Signature-256': firmar(payload, 'otro-secreto') });
  assert.equal(res.status, 401);
  assert.equal(contar('mensajes'), 0);
});

test('webhook: con firma válida responde 200 y guarda el mensaje y su conversación', async () => {
  const inicio = Date.now();
  const res = await enviar({ 'X-Hub-Signature-256': firmar(payload) });
  assert.equal(res.status, 200);
  assert.ok(Date.now() - inicio < 5000, 'debe responder en menos de 5 s');
  const mensaje = db.prepare('SELECT wa_message_id, direccion, texto FROM mensajes').get();
  assert.deepEqual({ ...mensaje }, { wa_message_id: 'wamid.FICTICIO1', direccion: 'entrante', texto: 'Choqué, ¿qué hago?' });
  assert.equal(db.prepare('SELECT nombre_contacto FROM conversaciones').get().nombre_contacto, 'Asegurado Ficticio');
});

test('webhook: el mismo mensaje enviado dos veces se guarda una sola vez (criterio 3)', async () => {
  const firma = firmar(payload);
  const primera = await enviar({ 'X-Hub-Signature-256': firma });
  const segunda = await enviar({ 'X-Hub-Signature-256': firma });
  assert.equal(primera.status, 200);
  assert.equal(segunda.status, 200, 'Meta debe recibir 200 también en el repetido para que no siga reintentando');
  assert.equal(contar('mensajes'), 1);
  assert.equal(contar('conversaciones'), 1);
});

test('webhook: verificación GET con token correcto devuelve el challenge y con incorrecto 403', async () => {
  const ok = await fetch(`${url}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=4321`);
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), '4321');
  const mal = await fetch(`${url}?hub.mode=subscribe&hub.verify_token=incorrecto&hub.challenge=4321`);
  assert.equal(mal.status, 403);
});
