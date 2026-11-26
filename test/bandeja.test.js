// CU-BKN-01 · Pruebas de la API de la bandeja (HTTP real en localhost, base en memoria, datos ficticios).
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { abrirBaseDatos } from '../src/db/base-datos.js';
import { crearApp } from '../src/app.js';
import { crearUsuario } from '../src/nucleo/usuarios.js';

const APP_SECRET = 'secreto-de-prueba';
const CLAVE = 'clave-de-prueba-123';
let db, servidor, raiz;

beforeEach(async () => {
  db = abrirBaseDatos(':memory:');
  crearUsuario(db, { nombre: 'Laura', correo: 'laura@seguros-ejemplo.test', rol: 'agente', contrasena: CLAVE });
  crearUsuario(db, { nombre: 'Pedro', correo: 'pedro@seguros-ejemplo.test', rol: 'agente', contrasena: CLAVE });
  const app = crearApp({ db, appSecret: APP_SECRET, verifyToken: 'token-de-prueba', log: () => {} });
  await new Promise((listo) => { servidor = app.listen(0, '127.0.0.1', listo); });
  raiz = `http://127.0.0.1:${servidor.address().port}`;
});
afterEach(() => new Promise((listo) => servidor.close(listo)));

// Simula a Meta: manda al webhook un mensaje ficticio firmado.
async function llegaMensaje({ id, waId, nombre, texto, timestamp }) {
  const cuerpo = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: {
    contacts: [{ wa_id: waId, profile: { name: nombre } }],
    messages: [{ id, from: waId, timestamp: String(timestamp), type: 'text', text: { body: texto } }],
  } }] }] });
  const firma = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(cuerpo).digest('hex');
  const res = await fetch(`${raiz}/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': firma }, body: cuerpo });
  assert.equal(res.status, 200);
}
async function entrar(correo) {
  const res = await fetch(`${raiz}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo, contrasena: CLAVE }) });
  return res.headers.get('set-cookie').split(';')[0];
}
const pedir = (ruta, cookie) => fetch(`${raiz}/api${ruta}`, { headers: cookie ? { Cookie: cookie } : {} });

test('bandeja: sin sesión la API no muestra conversaciones ni mensajes (401)', async () => {
  await llegaMensaje({ id: 'wamid.F1', waId: '5210000000001', nombre: 'Asegurado Uno', texto: 'Choqué, ¿qué hago?', timestamp: 1795000000 });
  assert.equal((await pedir('/conversaciones')).status, 401);
  assert.equal((await pedir('/conversaciones/1/mensajes')).status, 401);
});

test('bandeja: el mensaje que llega por el webhook lo ven Laura y Pedro en la misma lista, el más reciente primero', async () => {
  await llegaMensaje({ id: 'wamid.F1', waId: '5210000000001', nombre: 'Asegurado Uno', texto: 'Choqué, ¿qué hago?', timestamp: 1795000000 });
  await llegaMensaje({ id: 'wamid.F2', waId: '5210000000002', nombre: 'Asegurada Dos', texto: 'Quiero un endoso', timestamp: 1795000100 });

  const [laura, pedro] = await Promise.all([entrar('laura@seguros-ejemplo.test'), entrar('pedro@seguros-ejemplo.test')]);
  const listaLaura = (await (await pedir('/conversaciones', laura)).json()).conversaciones;
  const listaPedro = (await (await pedir('/conversaciones', pedro)).json()).conversaciones;

  assert.deepEqual(listaLaura, listaPedro, 'los dos ven exactamente lo mismo');
  assert.deepEqual(listaLaura.map((c) => c.nombre_contacto), ['Asegurada Dos', 'Asegurado Uno']);
  assert.equal(listaLaura[1].ultimo_texto, 'Choqué, ¿qué hago?');
  assert.equal(listaLaura[1].ultima_direccion, 'entrante');
  assert.equal(listaLaura[1].total_mensajes, 1);
});

test('bandeja: los mensajes de una conversación salen en orden; id inexistente → 404 e inválido → 400', async () => {
  await llegaMensaje({ id: 'wamid.F2', waId: '5210000000001', nombre: 'Asegurado Uno', texto: 'Es la póliza ficticia POL-0001', timestamp: 1795000060 });
  await llegaMensaje({ id: 'wamid.F1', waId: '5210000000001', nombre: 'Asegurado Uno', texto: 'Choqué, ¿qué hago?', timestamp: 1795000000 });
  const cookie = await entrar('laura@seguros-ejemplo.test');

  const { conversaciones } = await (await pedir('/conversaciones', cookie)).json();
  assert.equal(conversaciones.length, 1);
  assert.equal(conversaciones[0].ultimo_texto, 'Es la póliza ficticia POL-0001', 'el último es el más reciente por fecha, no por orden de llegada');

  const { mensajes } = await (await pedir(`/conversaciones/${conversaciones[0].id}/mensajes`, cookie)).json();
  assert.deepEqual(mensajes.map((m) => m.texto), ['Choqué, ¿qué hago?', 'Es la póliza ficticia POL-0001']);

  assert.equal((await pedir('/conversaciones/999/mensajes', cookie)).status, 404);
  assert.equal((await pedir('/conversaciones/abc/mensajes', cookie)).status, 400);
});
