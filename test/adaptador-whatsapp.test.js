// CU-BKN-01 · Pruebas del adaptador de WhatsApp Cloud API (datos ficticios, sin llamar a Meta).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { firmaValida, verificarSuscripcion, extraerEventos } from '../src/adaptadores/whatsapp-cloud.js';

const SECRETO = 'secreto-de-prueba';
const firmar = (cuerpo) => 'sha256=' + crypto.createHmac('sha256', SECRETO).update(cuerpo).digest('hex');

test('firma: acepta la firma correcta y rechaza la alterada o ausente', () => {
  const cuerpo = Buffer.from('{"object":"whatsapp_business_account"}');
  assert.equal(firmaValida(cuerpo, firmar(cuerpo), SECRETO), true);
  assert.equal(firmaValida(Buffer.from('{"object":"otro"}'), firmar(cuerpo), SECRETO), false);
  assert.equal(firmaValida(cuerpo, 'sha256=' + '0'.repeat(64), SECRETO), false);
  assert.equal(firmaValida(cuerpo, undefined, SECRETO), false);
});

test('verificación: devuelve el challenge solo con el token correcto', () => {
  const query = { 'hub.mode': 'subscribe', 'hub.verify_token': 'token-ok', 'hub.challenge': '123' };
  assert.equal(verificarSuscripcion(query, 'token-ok'), '123');
  assert.equal(verificarSuscripcion({ ...query, 'hub.verify_token': 'otro' }, 'token-ok'), null);
  assert.equal(verificarSuscripcion({ ...query, 'hub.mode': 'unsubscribe' }, 'token-ok'), null);
});

test('extraer: convierte un mensaje de texto y un estado fallido al formato interno', () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field: 'messages', value: {
      contacts: [{ wa_id: '5210000000000', profile: { name: 'Asegurado Ficticio' } }],
      messages: [{ id: 'wamid.FICTICIO1', from: '5210000000000', timestamp: '1795000000', type: 'text', text: { body: 'Choqué, ¿qué hago?' } }],
      statuses: [{ id: 'wamid.FICTICIO2', status: 'failed', timestamp: '1795000100', errors: [{ code: 131031, title: 'Business Account locked' }] }],
    } }] }],
  };
  const { mensajes, estados } = extraerEventos(payload);
  assert.deepEqual(mensajes, [{
    waMessageId: 'wamid.FICTICIO1', waId: '5210000000000', nombreContacto: 'Asegurado Ficticio',
    tipo: 'text', texto: 'Choqué, ¿qué hago?', fecha: new Date(1795000000 * 1000).toISOString(),
  }]);
  assert.deepEqual(estados, [{
    waMessageId: 'wamid.FICTICIO2', estado: 'failed', fecha: new Date(1795000100 * 1000).toISOString(),
    errores: [{ codigo: 131031, titulo: 'Business Account locked' }],
  }]);
});

test('extraer: ignora payloads que no son de WhatsApp', () => {
  assert.deepEqual(extraerEventos({ object: 'page', entry: [] }), { mensajes: [], estados: [] });
  assert.deepEqual(extraerEventos(null), { mensajes: [], estados: [] });
});
