-- CU-BKN-01 · Esquema de la base de datos (SQLite)
-- Se ejecuta al abrir la base; "IF NOT EXISTS" permite correrlo varias veces sin borrar datos.

-- Una conversación por cliente de WhatsApp.
CREATE TABLE IF NOT EXISTS conversaciones (
  id                INTEGER PRIMARY KEY,
  wa_id             TEXT    NOT NULL UNIQUE,  -- identificador del cliente que entrega el webhook (se responde siempre a este valor)
  nombre_contacto   TEXT,
  ultimo_mensaje_en TEXT,
  creado_en         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Mensajes entrantes y salientes.
CREATE TABLE IF NOT EXISTS mensajes (
  id              INTEGER PRIMARY KEY,
  conversacion_id INTEGER NOT NULL REFERENCES conversaciones(id),
  wa_message_id   TEXT    NOT NULL UNIQUE,     -- criterio 3: el mismo mensaje de WhatsApp no se guarda dos veces
  direccion       TEXT    NOT NULL CHECK (direccion IN ('entrante', 'saliente')),
  tipo            TEXT    NOT NULL DEFAULT 'text',
  texto           TEXT,
  estado_envio    TEXT,                        -- sent | delivered | read | failed (solo salientes)
  fecha           TEXT    NOT NULL,            -- fecha del mensaje según WhatsApp (ISO 8601)
  creado_en       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes (conversacion_id, fecha);
