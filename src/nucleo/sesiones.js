// CU-BKN-01 · Inicio y cierre de sesión del panel.
// El token aleatorio va en la cookie; en la base solo se guarda su hash SHA-256.
import crypto from 'node:crypto';
import { contrasenaCorrecta, hashContrasena } from './usuarios.js';

export const DURACION_SESION_MS = 8 * 60 * 60 * 1000; // 8 horas: un turno de trabajo
// Hash de relleno: si el correo no existe se compara igual, para tardar lo mismo y no revelar qué correos existen.
const HASH_RELLENO = hashContrasena(crypto.randomBytes(16).toString('hex'));

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const datosPublicos = ({ id, nombre, correo, rol }) => ({ id, nombre, correo, rol });

// Devuelve { token, usuario } si el correo y la contraseña son correctos; si no, null.
export function iniciarSesion(db, correo, contrasena) {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(String(correo ?? ''));
  const correcta = contrasenaCorrecta(String(contrasena ?? ''), usuario?.hash_contrasena ?? HASH_RELLENO);
  if (!usuario || !correcta) return null;

  const token = crypto.randomBytes(32).toString('base64url');
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS).toISOString();
  db.prepare('INSERT INTO sesiones (token_hash, usuario_id, expira_en) VALUES (?, ?, ?)').run(hashToken(token), usuario.id, expiraEn);
  return { token, usuario: datosPublicos(usuario) };
}

// Devuelve el usuario dueño de una sesión vigente, o null. Las sesiones vencidas se borran.
export function usuarioDeSesion(db, token) {
  if (!token) return null;
  db.prepare('DELETE FROM sesiones WHERE expira_en <= ?').run(new Date().toISOString());
  const usuario = db.prepare(
    'SELECT u.id, u.nombre, u.correo, u.rol FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token_hash = ?',
  ).get(hashToken(token));
  return usuario ? datosPublicos(usuario) : null;
}

export function cerrarSesion(db, token) {
  if (token) db.prepare('DELETE FROM sesiones WHERE token_hash = ?').run(hashToken(token));
}
