// CU-BKN-01 · Pruebas de usuarios y contraseñas (datos ficticios).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBaseDatos } from '../src/db/base-datos.js';
import { crearUsuario, hashContrasena, contrasenaCorrecta } from '../src/nucleo/usuarios.js';

const CLAVE_PRUEBA = 'clave-de-prueba-123';

test('la contraseña se guarda como hash con sal y solo la correcta coincide', () => {
  const guardado = hashContrasena(CLAVE_PRUEBA);
  assert.match(guardado, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.ok(!guardado.includes(CLAVE_PRUEBA));
  assert.notEqual(hashContrasena(CLAVE_PRUEBA), guardado, 'cada hash lleva su propia sal');
  assert.equal(contrasenaCorrecta(CLAVE_PRUEBA, guardado), true);
  assert.equal(contrasenaCorrecta('otra-clave-123', guardado), false);
  assert.equal(contrasenaCorrecta(CLAVE_PRUEBA, 'formato-raro'), false);
});

test('se crean usuarios con rol agente o coordinadora; el correo no se repite', () => {
  const db = abrirBaseDatos(':memory:');
  crearUsuario(db, { nombre: 'Laura', correo: 'laura@seguros-ejemplo.test', rol: 'agente', contrasena: CLAVE_PRUEBA });
  crearUsuario(db, { nombre: 'Coordinadora', correo: 'coordinadora@seguros-ejemplo.test', rol: 'coordinadora', contrasena: CLAVE_PRUEBA });

  const fila = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get('laura@seguros-ejemplo.test');
  assert.equal(fila.rol, 'agente');
  assert.equal(contrasenaCorrecta(CLAVE_PRUEBA, fila.hash_contrasena), true);

  assert.throws(
    () => crearUsuario(db, { nombre: 'Laura 2', correo: 'LAURA@seguros-ejemplo.test', rol: 'agente', contrasena: CLAVE_PRUEBA }),
    /UNIQUE constraint failed: usuarios.correo/,
  );
  assert.throws(
    () => crearUsuario(db, { nombre: 'X', correo: 'x@seguros-ejemplo.test', rol: 'admin', contrasena: CLAVE_PRUEBA }),
    /Rol no válido/,
  );
  assert.throws(
    () => db.prepare("INSERT INTO usuarios (nombre, correo, hash_contrasena, rol) VALUES ('X', 'y@seguros-ejemplo.test', 'h', 'admin')").run(),
    /CHECK constraint failed/,
  );
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM usuarios').get().total, 2);
});
