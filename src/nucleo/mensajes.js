// CU-BKN-01 · Núcleo: guardar mensajes y estados. No conoce a Meta; recibe objetos internos del adaptador.

// Guarda un mensaje entrante. Si el wa_message_id ya existe, no lo vuelve a guardar.
// Devuelve { guardado: true } la primera vez y { guardado: false } si era repetido.
export function guardarMensajeEntrante(db, mensaje) {
  db.exec('BEGIN');
  try {
    const { id: conversacionId } = db.prepare(`
      INSERT INTO conversaciones (wa_id, nombre_contacto, ultimo_mensaje_en) VALUES (?, ?, ?)
      ON CONFLICT (wa_id) DO UPDATE SET
        nombre_contacto   = COALESCE(excluded.nombre_contacto, conversaciones.nombre_contacto),
        ultimo_mensaje_en = MAX(COALESCE(conversaciones.ultimo_mensaje_en, ''), excluded.ultimo_mensaje_en)
      RETURNING id
    `).get(mensaje.waId, mensaje.nombreContacto, mensaje.fecha);

    const { changes } = db.prepare(`
      INSERT INTO mensajes (conversacion_id, wa_message_id, direccion, tipo, texto, fecha)
      VALUES (?, ?, 'entrante', ?, ?, ?)
      ON CONFLICT (wa_message_id) DO NOTHING
    `).run(conversacionId, mensaje.waMessageId, mensaje.tipo, mensaje.texto, mensaje.fecha);

    db.exec('COMMIT');
    return { guardado: changes === 1 };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// Actualiza el estado de entrega de un mensaje que enviamos (sent, delivered, read, failed).
export function actualizarEstadoEnvio(db, estado) {
  const { changes } = db.prepare(
    "UPDATE mensajes SET estado_envio = ? WHERE wa_message_id = ? AND direccion = 'saliente'",
  ).run(estado.estado, estado.waMessageId);
  return { actualizado: changes === 1 };
}
