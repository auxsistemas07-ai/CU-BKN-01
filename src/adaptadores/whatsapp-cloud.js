// CU-BKN-01 · Adaptador de WhatsApp Cloud API.
// Es el ÚNICO módulo que conoce el formato de Meta. El resto de la plataforma trabaja con objetos internos;
// para cambiar de proveedor se escribe otro adaptador con las mismas funciones.
// Fuentes (consultadas 2026-11-23):
//   https://developers.facebook.com/docs/graph-api/webhooks/getting-started
//   https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
import crypto from 'node:crypto';

const igualesSeguro = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// Verificación del webhook (GET). Devuelve el challenge si todo coincide, o null.
export function verificarSuscripcion(query, verifyToken) {
  const { 'hub.mode': modo, 'hub.verify_token': token, 'hub.challenge': reto } = query ?? {};
  if (modo === 'subscribe' && token && verifyToken && igualesSeguro(token, verifyToken)) return reto ?? '';
  return null;
}

// Firma X-Hub-Signature-256: "sha256=" + HMAC SHA-256 (hex) del cuerpo crudo con el App Secret.
export function firmaValida(cuerpoCrudo, encabezado, appSecret) {
  if (!Buffer.isBuffer(cuerpoCrudo) || !appSecret || typeof encabezado !== 'string' || !encabezado.startsWith('sha256=')) {
    return false;
  }
  const esperada = crypto.createHmac('sha256', appSecret).update(cuerpoCrudo).digest('hex');
  return igualesSeguro(encabezado.slice('sha256='.length), esperada);
}

const aIso = (timestamp) => new Date(Number(timestamp) * 1000).toISOString();

// Convierte el payload de Meta en eventos internos: mensajes entrantes y estados de mensajes enviados.
export function extraerEventos(payload) {
  const mensajes = [];
  const estados = [];
  if (payload?.object !== 'whatsapp_business_account') return { mensajes, estados };

  for (const entrada of payload.entry ?? []) {
    for (const cambio of entrada.changes ?? []) {
      if (cambio.field !== 'messages') continue;
      const valor = cambio.value ?? {};
      const contactos = new Map((valor.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? null]));

      for (const m of valor.messages ?? []) {
        const waId = m.from ?? m.from_user_id;
        if (!m.id || !waId) continue;
        mensajes.push({
          waMessageId: m.id,
          waId,
          nombreContacto: contactos.get(waId) ?? null,
          tipo: m.type,
          texto: m.type === 'text' ? m.text?.body ?? '' : null,
          fecha: aIso(m.timestamp),
        });
      }

      for (const s of valor.statuses ?? []) {
        estados.push({
          waMessageId: s.id,
          estado: s.status,
          fecha: aIso(s.timestamp),
          errores: (s.errors ?? []).map((e) => ({ codigo: e.code, titulo: e.title })),
        });
      }
    }
  }
  return { mensajes, estados };
}
