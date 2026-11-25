# CU-BKN-01 · Modelo de datos (SQLite)

```mermaid
erDiagram
    USUARIOS ||--o{ CONVERSACIONES : "tiene asignadas"
    CONVERSACIONES ||--o{ MENSAJES : contiene
    CONVERSACIONES ||--o{ TICKETS : "se convierte en"
    USUARIOS ||--o{ TICKETS : "es responsable"
    TICKETS ||--o{ BITACORA : registra
    USUARIOS ||--o{ BITACORA : "hizo el cambio"

    USUARIOS {
        int id PK
        text nombre
        text correo UK
        text hash_contrasena
        text rol "agente | coordinadora"
        text creado_en
    }
    CONVERSACIONES {
        int id PK
        text wa_id UK "id de WhatsApp del cliente (del webhook)"
        text nombre_contacto
        int asignada_a FK "usuario o NULL"
        text ultimo_mensaje_en
        text creado_en
    }
    MENSAJES {
        int id PK
        int conversacion_id FK
        text wa_message_id UK "evita guardar dos veces"
        text direccion "entrante | saliente"
        text texto
        text estado_envio "sent | delivered | read | failed"
        int enviado_por FK "usuario (salientes)"
        text fecha
    }
    TICKETS {
        int id PK
        text folio UK "TK-2026-0001"
        int conversacion_id FK
        text tipo "siniestro | endoso | cobranza | aclaracion | otro"
        text prioridad "baja | media | alta"
        text estado
        int responsable_id FK
        text origen "boton | palabra_clave"
        text motivo_cierre
        text solucion
        text creado_en
        text actualizado_en
        text cerrado_en
    }
    BITACORA {
        int id PK
        int ticket_id FK
        int usuario_id FK "NULL si fue el cliente o el sistema"
        text campo "estado | responsable | nota"
        text valor_anterior
        text valor_nuevo
        text fecha
    }
    FOLIOS {
        text prefijo PK "TK, configurable"
        int anio PK
        int ultimo_numero
    }
```

## Reglas en la base de datos
- `MENSAJES.wa_message_id` **UNIQUE**: si Meta reenvía el mismo mensaje, no se guarda dos veces (criterio 3).
- `BITACORA` **solo se inserta**: triggers que rechazan `UPDATE` y `DELETE` (criterio 8). La API no tendrá endpoints para editarla ni borrarla.
- `TICKETS.folio` **UNIQUE**; el consecutivo sale de `FOLIOS` dentro de una transacción, con prefijo configurable (`TK-2026-0001`).
- `CONVERSACIONES.wa_id` guarda el identificador que entrega el webhook; las respuestas siempre se mandan a ese valor (evita el problema 52/521 de México).
- Contraseñas guardadas como hash, nunca en texto.
