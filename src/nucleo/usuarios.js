// CU-BKN-01 · Usuarios del panel y sus contraseñas.
// Las contraseñas se guardan con scrypt (incluido en Node) y una sal aleatoria por usuario.
import crypto from 'node:crypto';

export const ROLES = ['agente', 'coordinadora'];
const LARGO_CLAVE = 64;

// Devuelve "scrypt$<sal>$<hash>" (hex). Nunca guarda ni devuelve la contraseña original.
export function hashContrasena(contrasena) {
  const sal = crypto.randomBytes(16);
  const hash = crypto.scryptSync(contrasena, sal, LARGO_CLAVE);
  return `scrypt$${sal.toString('hex')}$${hash.toString('hex')}`;
}

// Compara en tiempo constante; un formato desconocido cuenta como contraseña incorrecta.
export function contrasenaCorrecta(contrasena, guardado) {
  const [algoritmo, salHex, hashHex] = String(guardado).split('$');
  if (algoritmo !== 'scrypt' || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = crypto.scryptSync(contrasena, Buffer.from(salHex, 'hex'), esperado.length);
  return crypto.timingSafeEqual(calculado, esperado);
}

export function crearUsuario(db, { nombre, correo, rol, contrasena }) {
  if (!ROLES.includes(rol)) throw new Error(`Rol no válido: ${rol}`);
  if (!contrasena || contrasena.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
  const { lastInsertRowid } = db
    .prepare('INSERT INTO usuarios (nombre, correo, hash_contrasena, rol) VALUES (?, ?, ?, ?)')
    .run(nombre, correo, hashContrasena(contrasena), rol);
  return Number(lastInsertRowid);
}
