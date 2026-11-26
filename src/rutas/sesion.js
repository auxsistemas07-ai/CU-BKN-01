// CU-BKN-01 · Rutas de login del panel y protección de la API.
import express from 'express';
import { iniciarSesion, usuarioDeSesion, cerrarSesion, DURACION_SESION_MS } from '../nucleo/sesiones.js';

export const NOMBRE_COOKIE = 'sesion';
// HttpOnly: el JavaScript de la página no puede leerla. SameSite=Strict: otros sitios no la pueden usar.
const OPCIONES_COOKIE = { httpOnly: true, sameSite: 'strict', path: '/' };

// Lee la cookie de sesión sin librerías extra.
export function tokenDeCookie(req) {
  for (const parte of (req.get('Cookie') ?? '').split(';')) {
    const [nombre, ...valor] = parte.trim().split('=');
    if (nombre === NOMBRE_COOKIE) return valor.join('=');
  }
  return null;
}

// Middleware: solo deja pasar peticiones con sesión vigente y deja el usuario en req.usuario.
export function requerirSesion(db) {
  return (req, res, next) => {
    const usuario = usuarioDeSesion(db, tokenDeCookie(req));
    if (!usuario) return res.status(401).json({ error: 'Inicia sesión para continuar' });
    req.usuario = usuario;
    return next();
  };
}

export function rutasSesion(db) {
  const rutas = express.Router();

  rutas.post('/login', express.json({ limit: '10kb' }), (req, res) => {
    const sesion = iniciarSesion(db, req.body?.correo, req.body?.contrasena);
    // Mismo mensaje para correo o contraseña incorrectos: no se revela cuál falló.
    if (!sesion) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    res.cookie(NOMBRE_COOKIE, sesion.token, { ...OPCIONES_COOKIE, maxAge: DURACION_SESION_MS });
    return res.json({ usuario: sesion.usuario });
  });

  rutas.post('/logout', (req, res) => {
    cerrarSesion(db, tokenDeCookie(req));
    res.clearCookie(NOMBRE_COOKIE, OPCIONES_COOKIE);
    return res.sendStatus(204);
  });

  rutas.get('/yo', requerirSesion(db), (req, res) => res.json({ usuario: req.usuario }));

  return rutas;
}
