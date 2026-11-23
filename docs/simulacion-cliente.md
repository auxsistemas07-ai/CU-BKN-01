# CU-BKN-01 · Simulación del cliente

| Paso | Qué hice | Quién lo haría en la realidad (despacho, Beaken o Meta) | Tiempo | Dudas |
|---|---|---|---|---|

| 3a | Intenté crear el portafolio; Meta lo bloqueó por cuenta nueva («espera 1 hora») | Despacho | | ¿Cuánto debe tener de antigüedad la cuenta? En la realidad el despacho usaría una cuenta ya existente |

| 3b | Pasado el tiempo de espera, creé la cartera de negocios «Cu-Bkn-01» sin verificar y la seleccioné al crear la app | Despacho (dueño de su cartera) | | ¿La verificación del negocio será obligatoria con el cliente real? Va al roadmap |
| 3c | Creé la app «Bandeja CU-BKN-01» con el caso de uso «Connect with customers through WhatsApp», ligada a la cartera; queda en estado «Inédito» (sin publicar) | Beaken (su app como proveedor) | | El panel ofrece «Conviértete en proveedor de tecnología»; no se hizo. Se evalúa en el roadmap (Tech Provider) |
| 3d | En «Basic setup → Step 1. Try it out», Meta creó automáticamente el número de prueba (+1 555…) y la cuenta de WhatsApp Business de prueba | Meta (en la realidad el número y la cuenta de WhatsApp son del despacho) | | El panel muestra como ejemplo una plantilla distinta a hello_world; confirmar en el paso 6 que hello_world existe en la cuenta de prueba |
| 4a | Registré mi teléfono de prueba en «Beneficiario» y lo verifiqué con el código que Meta mandó por WhatsApp (el código solo se escribió en el panel de Meta) | Despacho (en la realidad no hay lista de destinatarios: el número real atiende a cualquier cliente) | | La lista de destinatarios solo existe con el número de prueba; confirmar el límite de destinatarios en la documentación |
| 4b | Generé el token temporal con «Generar token» y lo guardé solo en `.env` junto con el ID del número y el teléfono de prueba | Beaken (en la realidad, token permanente de usuario del sistema, otorgado por el despacho sin compartir contraseñas) | | El token temporal caduca (aprox. 24 h). Tipo de token, guardado y rotación para el cliente real van al roadmap |
| 6a | El token temporal caducó; generé uno nuevo con «Generar token» y lo reemplacé en `.env` | Beaken (en la realidad no aplica: se usa un token de usuario del sistema que no caduca a diario) | | Confirma que el token temporal no sirve para operar; va al roadmap como razón para el token de usuario del sistema |
| 6b | Envié la plantilla hello_world con el script del repositorio (Graph API v26.0); Meta respondió «accepted» | Beaken (la plataforma envía; las plantillas reales las crea y aprueba Meta en la cuenta del despacho) | | Plantillas propias del despacho (aviso de folio, cierre) necesitan aprobación de Meta; tiempos van al roadmap |
