// CU-BKN-01 · Pruebas de login y sesiones (HTTP real en localhost, base en memoria, usuarios ficticios).
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBaseDatos } from '../src/db/base-datos.js';
import { crearApp } from '../src/app.js';
import { crearUsuario } from '../src/nucleo/usuarios.js';

const CLAVE = 'clave-de-prueba-123';
let db, servidor, base;

beforeEach(async () => {
  db = abrirBaseDatos(':memory:');
  crearUsuario(db, { nombre: 'Laura', correo: 'laura@seguros-ejemplo.test', rol: 'agente', contrasena: CLAVE });
  crearUsuario(db, { nombre: 'Pedro', correo: 'pedro@seguros-ejemplo.test', rol: 'agente', contrasena: CLAVE });
  const app = crearApp({ db, appSecret: 'secreto-de-prueba', verifyToken: 'token-de-prueba', log: () => {} });
  await new Promise((listo) => { servidor = app.listen(0, '127.0.0.1', listo); });
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});
afterEach(() => new Promise((listo) => servidor.close(listo)));

const login = (correo, contrasena) => fetch(`${base}/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo, contrasena }),
});
const cookieDe = (res) => res.headers.get('set-cookie')?.split(';')[0];
const yo = (cookie) => fetch(`${base}/yo`, { headers: cookie ? { Cookie: cookie } : {} });

test('login: contraseña incorrecta o correo inexistente → 401 con el mismo mensaje y sin cookie', async () => {
  const malaClave = await login('laura@seguros-ejemplo.test', 'otra-clave-123');
  const sinUsuario = await login('nadie@seguros-ejemplo.test', CLAVE);
  for (const res of [malaClave, sinUsuario]) {
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('set-cookie'), null);
    assert.deepEqual(await res.json(), { error: 'Correo o contraseña incorrectos' });
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM sesiones').get().total, 0);
});

test('login correcto → cookie HttpOnly y SameSite=Strict; sin cookie la API responde 401', async () => {
  const res = await login('laura@seguros-ejemplo.test', CLAVE);
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).usuario, { id: 1, nombre: 'Laura', correo: 'laura@seguros-ejemplo.test', rol: 'agente' });
  const encabezado = res.headers.get('set-cookie');
  assert.match(encabezado, /HttpOnly/);
  assert.match(encabezado, /SameSite=Strict/);

  assert.equal((await yo(cookieDe(res))).status, 200);
  assert.equal((await yo()).status, 401);
  assert.equal((await yo('sesion=token-inventado')).status, 401);

  // En la base no queda el token de la cookie, solo su hash.
  const token = cookieDe(res).split('=')[1];
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM sesiones WHERE token_hash = ?').get(token).total, 0);
});

test('dos usuarios con sesión propia; al cerrar sesión la cookie deja de servir', async () => {
  const cookieLaura = cookieDe(await login('laura@seguros-ejemplo.test', CLAVE));
  const cookiePedro = cookieDe(await login('PEDRO@seguros-ejemplo.test', CLAVE));
  assert.equal((await (await yo(cookieLaura)).json()).usuario.nombre, 'Laura');
  assert.equal((await (await yo(cookiePedro)).json()).usuario.nombre, 'Pedro');

  const salir = await fetch(`${base}/logout`, { method: 'POST', headers: { Cookie: cookieLaura } });
  assert.equal(salir.status, 204);
  assert.equal((await yo(cookieLaura)).status, 401);
  assert.equal((await yo(cookiePedro)).status, 200, 'la sesión de Pedro sigue abierta');
});

test('una sesión vencida ya no sirve y se borra', async () => {
  const cookie = cookieDe(await login('laura@seguros-ejemplo.test', CLAVE));
  db.prepare("UPDATE sesiones SET expira_en = '2000-01-01T00:00:00.000Z'").run();
  assert.equal((await yo(cookie)).status, 401);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM sesiones').get().total, 0);
});
