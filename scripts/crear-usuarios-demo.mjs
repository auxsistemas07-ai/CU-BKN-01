// CU-BKN-01 · Crea los usuarios FICTICIOS de «Seguros Ejemplo» para la demo.
// Uso: node --env-file=.env scripts/crear-usuarios-demo.mjs
// La contraseña de la demo se lee de DEMO_PASSWORD en .env (nunca va en el código ni se imprime).
// Si un usuario ya existe, se deja como está.
import { abrirBaseDatos } from '../src/db/base-datos.js';
import { crearUsuario } from '../src/nucleo/usuarios.js';

const USUARIOS_DEMO = [
  { nombre: 'Laura', correo: 'laura@seguros-ejemplo.test', rol: 'agente' },
  { nombre: 'Pedro', correo: 'pedro@seguros-ejemplo.test', rol: 'agente' },
  { nombre: 'Coordinadora', correo: 'coordinadora@seguros-ejemplo.test', rol: 'coordinadora' },
];

const { DEMO_PASSWORD } = process.env;
if (!DEMO_PASSWORD || DEMO_PASSWORD.length < 8) {
  console.error('Falta DEMO_PASSWORD en .env (mínimo 8 caracteres)');
  process.exit(1);
}

const db = abrirBaseDatos();
try {
  for (const u of USUARIOS_DEMO) {
    const existe = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(u.correo);
    if (existe) {
      console.log(`· ${u.correo} ya existía (${u.rol})`);
      continue;
    }
    crearUsuario(db, { ...u, contrasena: DEMO_PASSWORD });
    console.log(`✔ ${u.correo} creado (${u.rol})`);
  }
} finally {
  db.close();
}
