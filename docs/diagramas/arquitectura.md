# CU-BKN-01 · Diagrama de arquitectura

```mermaid
flowchart LR
    Cliente["📱 Cliente<br/>(teléfono de prueba)"]
    Meta["WhatsApp Cloud API<br/>(Meta)"]

    subgraph Servidor["Servidor Node.js + Express (local; ngrok solo en pruebas)"]
        direction TB
        Webhook["/webhook<br/>verifica token y firma<br/>X-Hub-Signature-256"]
        Adaptador["Adaptador WhatsApp<br/>(único módulo que habla con Meta)"]
        Nucleo["Núcleo de la plataforma<br/>bandeja · tickets · estados · bitácora"]
        API["API REST + login<br/>(sesión por usuario)"]
        DB[("SQLite<br/>UNIQUE id de mensaje<br/>bitácora sin UPDATE/DELETE")]
    end

    Panel["💻 Panel web React + Vite<br/>agentes y coordinadora<br/>(consulta cada pocos segundos)"]

    Cliente -- "mensaje" --> Meta
    Meta -- "POST firmado" --> Webhook
    Webhook --> Adaptador
    Adaptador -- "mensaje normalizado" --> Nucleo
    Nucleo --> DB
    Panel <--> API
    API <--> Nucleo
    Nucleo -- "responder / avisar folio / cierre" --> Adaptador
    Adaptador -- "POST /messages (Graph API)" --> Meta
    Meta -- "mensaje" --> Cliente
```

## Piezas
- **Webhook:** recibe de Meta; rechaza (401) lo que no trae firma válida; responde 200 rápido.
- **Adaptador WhatsApp:** traduce entre el formato de Meta y el formato interno. Es el **único** archivo que conoce Meta; para cambiar de proveedor se escribe otro adaptador sin tocar el núcleo.
- **Núcleo:** reglas del negocio: conversaciones, asignación, tickets con folio, tabla de transiciones y bitácora.
- **SQLite:** un archivo local, sin instalar servidor de base de datos (otra persona lo levanta en minutos).
- **Panel web:** bandeja compartida, seguimiento de tickets y detalle con bitácora.
- **Secretos:** token, app secret y verify token solo en `.env` (ignorado por Git).
