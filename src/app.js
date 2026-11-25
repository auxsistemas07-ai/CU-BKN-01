// CU-BKN-01 · Aplicación Express. Se crea con sus dependencias para poder probarla sin red ni secretos reales.
import express from 'express';
import { verificarSuscripcion, firmaValida, extraerEventos } from './adaptadores/whatsapp-cloud.js';
import { guardarMensajeEntrante, actualizarEstadoEnvio } from './nucleo/mensajes.js';

export function crearApp({ db, appSecret, verifyToken, log = console.log }) {
  const app = express();

  // Verificación del webhook por Meta.
  app.get('/webhook', (req, res) => {
    const reto = verificarSuscripcion(req.query, verifyToken);
    if (reto === null) return res.sendStatus(403);
    return res.status(200).send(reto);
  });

  // Notificaciones de Meta. El cuerpo se lee crudo para poder validar la firma.
  app.post('/webhook', express.raw({ type: '*/*', limit: '1mb' }), (req, res) => {
    if (!firmaValida(req.body, req.get('X-Hub-Signature-256'), appSecret)) {
      log('Webhook: petición rechazada por firma inválida o ausente (401). No se guardó nada.');
      return res.sendStatus(401);
    }

    let payload;
    try {
      payload = JSON.parse(req.body.toString('utf8'));
    } catch {
      return res.sendStatus(400);
    }

    // Se guarda antes de responder: SQLite tarda milisegundos y, si algo fallara, Meta reintentaría.
    try {
      const { mensajes, estados } = extraerEventos(payload);
      for (const mensaje of mensajes) {
        const { guardado } = guardarMensajeEntrante(db, mensaje);
        log(guardado
          ? `Webhook: mensaje guardado (${mensaje.tipo}): ${mensaje.texto ?? ''}`
          : 'Webhook: mensaje repetido; ya estaba guardado, se ignora.');
      }
      for (const estado of estados) actualizarEstadoEnvio(db, estado);
      return res.sendStatus(200);
    } catch (error) {
      log(`Webhook: error al guardar (${error.message}). Meta lo reintentará.`);
      return res.sendStatus(500);
    }
  });

  return app;
}
