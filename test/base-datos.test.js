// CU-BKN-01 · Pruebas de la base de datos (datos ficticios).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBaseDatos } from '../src/db/base-datos.js';

test('la base crea las tablas conversaciones y mensajes', () => {
  const db = abrirBaseDatos(':memory:');
  const tablas = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all().map((t) => t.name);
  assert.deepEqual(tablas, ['conversaciones', 'mensajes']);
});

test('la base rechaza un wa_message_id repetido (índice UNIQUE)', () => {
  const db = abrirBaseDatos(':memory:');
  const { lastInsertRowid: conversacionId } = db.prepare('INSERT INTO conversaciones (wa_id) VALUES (?)').run('5210000000000');
  const insertar = db.prepare(
    "INSERT INTO mensajes (conversacion_id, wa_message_id, direccion, texto, fecha) VALUES (?, ?, 'entrante', ?, ?)",
  );
  insertar.run(conversacionId, 'wamid.FICTICIO1', 'Choqué, ¿qué hago?', '2026-11-25T14:40:00.000Z');
  assert.throws(
    () => insertar.run(conversacionId, 'wamid.FICTICIO1', 'Choqué, ¿qué hago?', '2026-11-25T14:40:00.000Z'),
    /UNIQUE constraint failed: mensajes.wa_message_id/,
  );
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM mensajes').get().total, 1);
});
