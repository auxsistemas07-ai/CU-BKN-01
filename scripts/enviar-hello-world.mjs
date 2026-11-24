// CU-BKN-01 · Envía la plantilla hello_world al teléfono de prueba.
// Uso: node --env-file=.env scripts/enviar-hello-world.mjs
// Todo se lee de .env. No imprime token, IDs ni el teléfono completo.
// Fuente: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages (consultada 2026-11-23)

const { GRAPH_API_VERSION, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, TEST_RECIPIENT_PHONE } = process.env;

const faltan = Object.entries({ GRAPH_API_VERSION, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, TEST_RECIPIENT_PHONE })
  .filter(([, valor]) => !valor)
  .map(([nombre]) => nombre);
if (faltan.length) {
  console.error('Faltan variables en .env:', faltan.join(', '));
  process.exit(1);
}

const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
const cuerpo = {
  messaging_product: 'whatsapp',
  to: TEST_RECIPIENT_PHONE,
  type: 'template',
  template: { name: 'hello_world', language: { code: 'en_US' } },
};

const respuesta = await fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(cuerpo),
});
const datos = await respuesta.json();

if (!respuesta.ok) {
  console.error(`Error HTTP ${respuesta.status} · código ${datos.error?.code}: ${datos.error?.message}`);
  process.exitCode = 1;
} else {
  console.log(`OK HTTP ${respuesta.status} · estado: ${datos.messages?.[0]?.message_status ?? 'sin estado'}`);
  console.log(`Enviado a: ***${TEST_RECIPIENT_PHONE.slice(-4)}`);
}
