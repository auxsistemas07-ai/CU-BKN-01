// CU-BKN-01 · Núcleo: consultas de la bandeja compartida. Todos los usuarios ven las mismas conversaciones.

// Conversaciones con su último mensaje, la más reciente primero.
export function listarConversaciones(db) {
  return db.prepare(`
    SELECT c.id, c.wa_id, c.nombre_contacto, c.ultimo_mensaje_en,
           (SELECT m.texto     FROM mensajes m WHERE m.conversacion_id = c.id ORDER BY m.fecha DESC, m.id DESC LIMIT 1) AS ultimo_texto,
           (SELECT m.direccion FROM mensajes m WHERE m.conversacion_id = c.id ORDER BY m.fecha DESC, m.id DESC LIMIT 1) AS ultima_direccion,
           (SELECT COUNT(*)    FROM mensajes m WHERE m.conversacion_id = c.id) AS total_mensajes
    FROM conversaciones c
    ORDER BY c.ultimo_mensaje_en DESC, c.id DESC
  `).all();
}

// Mensajes de una conversación en orden cronológico; null si la conversación no existe.
export function mensajesDeConversacion(db, conversacionId) {
  const existe = db.prepare('SELECT id FROM conversaciones WHERE id = ?').get(conversacionId);
  if (!existe) return null;
  return db.prepare(`
    SELECT id, direccion, tipo, texto, estado_envio, fecha
    FROM mensajes WHERE conversacion_id = ?
    ORDER BY fecha ASC, id ASC
  `).all(conversacionId);
}
