// CU-BKN-01 · Demostración de los criterios 2 y 3 contra el servidor real (npm start debe estar corriendo).
// Uso: node --env-file=.env scripts/demo-duplicados.mjs
// Envía un mensaje FICTICIO: 1) sin firma, 2) con firma válida, 3) el mismo otra vez. Luego cuenta en SQLite.
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const { PORT = '3000', APP_SECRET, DB_PATH } = process.env;
if (!APP_SECRET) {
  console.error('Falta APP_SECRET en .env');
  process.exit(1);
}

const url = `http://localhost:${PORT}/webhook`;
const idMensaje = `wamid.DEMO-${Date.now()}`; // id ficticio y único para cada corrida
const cuerpo = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{ changes: [{ field: 'messages', value: {
    contacts: [{ wa_id: '5210000000001', profile: { name: 'Asegurado Ficticio (demo)' } }],
    messages: [{ id: idMensaje, from: '5210000000001', timestamp: String(Math.floor(Date.now() / 1000)), type: 'text', text: { body: 'Choqué, ¿qué hago? (demo de duplicados)' } }],
  } }] }],
});
const firma = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(cuerpo).digest('hex');

const db = new DatabaseSync(DB_PATH || 'data/bandeja.db', { readOnly: true });
const contar = () => db.prepare('SELECT COUNT(*) AS total FROM mensajes WHERE wa_message_id = ?').get(idMensaje).total;
const enviar = (encabezados) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...encabezados }, body: cuerpo });

try {
  console.log('Demostración CU-BKN-01 · mismo mensaje ficticio enviado varias veces al webhook\n');

  const sinFirma = await enviar({});
  console.log(`1) Sin firma            → HTTP ${sinFirma.status} · registros en la base: ${contar()}`);

  const primera = await enviar({ 'X-Hub-Signature-256': firma });
  console.log(`2) Con firma (1.ª vez)  → HTTP ${primera.status} · registros en la base: ${contar()}`);

  const segunda = await enviar({ 'X-Hub-Signature-256': firma });
  console.log(`3) Mismo mensaje otra vez → HTTP ${segunda.status} · registros en la base: ${contar()}`);

  const ok = sinFirma.status === 401 && primera.status === 200 && segunda.status === 200 && contar() === 1;
  console.log(ok
    ? '\nResultado: ✅ sin firma no se guarda nada; el mensaje repetido se guarda UNA sola vez.'
    : '\nResultado: ❌ algo no salió como se esperaba; revisa la consola del servidor.');
  process.exitCode = ok ? 0 : 1;
} catch (error) {
  console.error(`No se pudo conectar con ${url}. ¿Está corriendo "npm start"? (${error.cause?.code ?? error.message})`);
  process.exitCode = 1;
} finally {
  db.close();
}
