// CU-BKN-01 · Rutas de la bandeja compartida. Todas exigen sesión.
import express from 'express';
import { requerirSesion } from './sesion.js';
import { listarConversaciones, mensajesDeConversacion } from '../nucleo/bandeja.js';

export function rutasBandeja(db) {
  const rutas = express.Router();
  rutas.use(requerirSesion(db));

  rutas.get('/conversaciones', (req, res) => res.json({ conversaciones: listarConversaciones(db) }));

  rutas.get('/conversaciones/:id/mensajes', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Conversación no válida' });
    const mensajes = mensajesDeConversacion(db, id);
    if (!mensajes) return res.status(404).json({ error: 'La conversación no existe' });
    return res.json({ mensajes });
  });

  return rutas;
}
