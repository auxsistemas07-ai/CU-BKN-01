# CU-BKN-01 · Bandeja de WhatsApp multiusuario con tickets

Contexto permanente del caso. Léelo completo antes de cada sesión.

## Quién soy y para quién
- Soy Carlos Ríos, practicante en Beaken (BEAKEN DEV · Prácticas).
- Este caso lo hago solo yo. La revisión de calidad y la prueba de levantar el sistema desde cero las hace Beaken.
- Clave del caso: **CU-BKN-01**. Va en el asunto de los correos y en el nombre de los archivos que entregue.
- Es un proyecto distinto al de comercio con crédito. No mezcles código, reglas ni stack de ese proyecto.

## Qué se entrega
Una solución que funcione, no un reporte. Una entrega que solo investiga no cuenta.
1. Demo funcionando en sandbox, con repositorio.
2. Roadmap decidido y justificado para conectar a un despacho real (4 a 8 páginas).
3. Runbook paso a paso para dar de alta a un cliente (también desde el lado del despacho) y su checklist de baja.
4. Matriz de riesgos y accesos.
5. Diagrama de arquitectura y diagrama de estados del ticket, una página cada uno, dentro del repositorio.
6. Riesgos abiertos: lo que no se pudo confirmar y cómo se confirmaría.

## Reglas de seguridad (no negociables)
- Solo el número de prueba de Meta y teléfonos de prueba registrados. Ningún número real.
- Datos ficticios en todo: asegurados, pólizas y siniestros. Ningún dato real, tampoco míos.
- Sin marcas de clientes: ni nombres, ni logos, ni textos. El producto es genérico. El despacho ficticio se llama «Seguros Ejemplo» solo en datos de prueba.
- Las cuentas de prueba (Meta, app, ngrok, repositorio) las creo yo con mi correo interno de Beaken, porque Beaken aún no tiene cuentas. Nada con correos personales. Nombres genéricos, sin marcas de clientes. No se manda a verificar ningún negocio.
- Secretos (token de acceso, app secret, verify token) solo en `.env`, ignorado por Git. Nunca en código, commits, logs, capturas, correos, chats ni documentos. Si uno se filtra, se avisa al director y se rota ese mismo día.
- Prohibidas las librerías no oficiales de WhatsApp (whatsapp-web.js, Baileys y similares). Solo WhatsApp Cloud API oficial vía HTTP.
- No desplegar nada, no usar servidores ni VPS propios, no gastar dinero, no registrar números reales ni mandar a verificar ningún negocio.
- ngrok solo durante la prueba, con la firma validada; cerrar el túnel al terminar.
- Nunca pedir que el cliente mande contraseñas, tokens o códigos por chat o correo (en la demo ni en el roadmap).

## Modo simulado (cómo trabajamos esta práctica)
- No existe cuenta de Beaken en Meta. Por indicación del director, yo creo las cuentas de prueba y simulo dos papeles:
  - **Beaken (proveedor):** construye y opera la plataforma.
  - **Despacho (primer cliente):** dueño de su portafolio, su cuenta de WhatsApp y su número.
- Simulado NO significa sin solución: la demo debe funcionar de verdad con el número de prueba de Meta y cumplir los 14 criterios. Lo único simulado son las cuentas y los roles.
- Cada paso que yo haga en Meta se registra en `docs/simulacion-cliente.md` con: qué hice, quién lo haría en la realidad (despacho, Beaken o Meta), cuánto tardó y qué dudas generó. Esa bitácora es la base del runbook y del roadmap.
- En la realidad el despacho es dueño de todo y nunca nos comparte contraseñas, tokens ni códigos.

## Entrega diaria
- A las 9:00, mensaje de tres líneas: Ayer / Hoy / Bloqueos.
- Mensaje y entregas a dev27@beaken.agency, con copia a hola@beaken.agency, desde el correo interno, antes de las 12:00.
- Asunto con la clave CU-BKN-01.
- Los enlaces de Drive o Docs se comparten con hola@beaken.agency para que puedan abrirlos.

## El caso
Un despacho de seguros con 6 agentes y una coordinadora atiende WhatsApp en celulares personales. Quiere:
- Un solo número de WhatsApp que todos atienden desde la computadora.
- Que cada solicitud seria (siniestro, endoso, aclaración de cobranza) se vuelva un ticket con folio, estados, responsable y bitácora.
- Que el cliente sepa en qué va su trámite sin llamar.

### Día normal (es lo que se valida en la demo)
1. **Cliente, 8:40:** escribe «Choqué, ¿qué hago?» y recibe una respuesta automática de que su mensaje llegó.
2. **Bandeja, 8:41:** el mensaje aparece en la bandeja compartida. Lo ven Laura y Pedro. Laura lo toma y la bandeja muestra que es suyo, así que Pedro no contesta lo mismo.
3. **Laura, 8:45:** convierte la conversación en ticket (con un botón o porque el cliente escribió una palabra clave como «reporte»). Folio `TK-2026-0001`, tipo Siniestro, prioridad Alta, responsable Laura. El cliente recibe: «Tu reporte quedó registrado con el folio TK-2026-0001».
4. **Coordinadora, 10:00:** ve en seguimiento 1 siniestro abierto, de Laura, en proceso. Reasigna a Pedro. La bitácora guarda quién, cuándo, valor anterior y nuevo.
5. **Pedro, días después:** pasa a «En espera del cliente» (falta un documento ficticio); luego a Resuelto y a Cerrado, con motivo y solución. El cliente recibe el aviso de cierre con su folio.
6. **Cliente:** si responde que no quedó resuelto, el ticket se reabre (desde Resuelto) y vuelve a la bandeja.

### Estados del ticket
`Nuevo → Asignado → En proceso → En espera del cliente → Resuelto → Cerrado`, más `Reabierto` desde `Resuelto`.
- Cualquier otro salto se rechaza (por ejemplo, Nuevo → Cerrado).
- Define la tabla de transiciones en un solo lugar del código y pruébala.
- Pendiente de definir conmigo: transiciones de regreso dentro del flujo (por ejemplo, En espera del cliente → En proceso, Reabierto → En proceso). Pregunta antes de agregarlas.

## Alcance mínimo
- **Recepción:** webhook de WhatsApp Cloud API que recibe mensajes de texto, valida la firma `X-Hub-Signature-256` (HMAC SHA-256 del cuerpo crudo con el app secret) y el token de verificación, responde 200 en menos de 5 s y no guarda dos veces el mismo mensaje (índice UNIQUE sobre el id del mensaje de WhatsApp). Sin firma válida responde 401 o 403 y no guarda nada.
- **Bandeja compartida:** al menos 2 usuarios con login propio ven las mismas conversaciones, responden desde la web y se asignan conversaciones; se ve quién tiene cada una.
- **Tickets:** folio consecutivo con prefijo configurable; tipo (siniestro, endoso, cobranza, aclaración u otro), prioridad, responsable, fechas y conversación ligada. Se crean con botón o con palabra clave.
- **Estados y bitácora:** solo transiciones permitidas; cada cambio de estado, responsable o nota guarda quién, cuándo, valor anterior y nuevo. La bitácora no se edita ni se borra, ni desde el panel ni desde la API (sin endpoints de edición o borrado y con protección en la base de datos, por ejemplo triggers que bloqueen UPDATE y DELETE).
- **Cierre:** exige motivo y solución y avisa al cliente con su folio, dentro de la ventana de 24 h o con una plantilla aprobada.
- **Seguimiento:** lista de tickets con filtros por estado y responsable, y detalle con su bitácora.
- **Arquitectura:** la conexión con WhatsApp va en un adaptador aparte, para cambiar de proveedor sin reescribir la plataforma.
- **Fuera de alcance:** fotos y archivos, integración con aseguradoras, reportes avanzados, IA, despliegue en producción, varios despachos en una instalación y cualquier pago.

## Stack
El caso permite solo Node.js (Express o NestJS) o Python (FastAPI), con SQLite o PostgreSQL.
- **Decidido:** Node.js con Express (JavaScript), SQLite, frontend React con Vite (JavaScript). SQLite porque otra persona debe levantar todo desde cero en menos de 30 min.
- La bandeja se actualiza por consulta periódica o WebSocket; el mensaje debe aparecer en menos de 10 s.
- Pruebas: al menos 8 automatizadas con `npm test` (webhook, firma, duplicados, transiciones y bitácora). Pruebas de punta a punta con Cypress.
- Verifica en la documentación oficial de Meta la versión vigente de Graph API y los formatos exactos; no inventes campos.

## Criterios de evaluación (demo en vivo de 20 min)
1. Mensaje del teléfono de prueba aparece en la bandeja en menos de 10 s.
2. Webhook rechaza una petición sin firma válida (401 o 403) y no guarda nada.
3. El mismo mensaje enviado dos veces se guarda una sola vez.
4. Dos usuarios en dos navegadores ven la misma conversación y la asignación se respeta.
5. La respuesta escrita en el panel llega al teléfono de prueba.
6. Ticket con folio consecutivo, con botón y con palabra clave.
7. Una transición no permitida se rechaza.
8. Bitácora con usuario, fecha y valores; no se edita ni se borra desde el panel ni la API.
9. Al cerrar se exige motivo y el cliente recibe el mensaje de cierre con su folio.
10. Sin secretos en Git: historial limpio y `.env` ignorado (se revisa con gitleaks).
11. Otra persona levanta el sistema desde cero con el README en menos de 30 min.
12. Al menos 8 pruebas automatizadas pasan.
13. Diagrama de arquitectura y de estados, una página cada uno.
14. Ninguna marca de cliente ni dato real.

## Roadmap para un cliente real (segunda parte)
Debe ser una decisión justificada, no una lista de opciones. Metas: que el despacho intervenga lo menos posible y el menor riesgo de seguridad.
- Revisar Embedded Signup y el esquema de Tech Provider de Meta, y recomendar uno con su porqué.
- Cada respuesta lleva fuente: enlace a la documentación oficial de Meta y fecha de consulta. Si algo no se puede confirmar, se marca como riesgo abierto; nunca se inventa.
- Reprueba automáticamente cualquier paso que pida al cliente mandar contraseñas, tokens o códigos por chat o correo, que use librerías no oficiales, o que deje el número o la cuenta de WhatsApp Business del cliente a nombre de Beaken.
- Formato: 4 a 8 páginas, con fases, quién hace cada paso (despacho, Beaken o Meta), tiempos estimados y respuesta a cada pregunta con fuente (enlace oficial de Meta + fecha de consulta).
- Se evalúa: exactitud técnica con fuentes vigentes 30 %; pasos mínimos y claros para el cliente 20 %; seguridad (dueños, mínimo privilegio, rotación, revocación y baja) 30 %; claridad para un dueño de despacho sin conocimientos técnicos 10 %; honestidad sobre lo que no se sabe 10 %.
- Preguntas que debe responder (textuales del correo):
  1. ¿Qué pasos le tocan al despacho, cuántos son y cuánto tarda cada uno? ¿Cuáles hacemos nosotros?
  2. ¿Qué es Embedded Signup, qué pasos le quita al cliente y cómo se ve desde su lado, pantalla por pantalla?
  3. ¿Qué es ser Tech Provider de Meta, en qué se diferencia de un Solution Partner o BSP, qué necesita Beaken para serlo y cuánto tarda? Mientras no lo seamos, ¿cuál es la alternativa segura para el primer cliente?
  4. ¿Qué necesita el despacho para la verificación del negocio, cómo se aprueban el nombre visible y las plantillas, y cuánto tardan?
  5. Si el despacho ya usa ese número en la app de WhatsApp Business: ¿coexistencia o migración? ¿Qué se pierde en cada caso y cuánto tiempo queda sin servicio?
  6. ¿Quién paga los mensajes a Meta y cómo se estima el costo mensual de un despacho de 6 agentes?
  7. ¿Quién es dueño del portafolio, la cuenta de WhatsApp Business, el número, la app y el token? ¿Quién tiene acceso a qué y con qué rol?
  8. ¿Qué permisos delegados exactos recibe Beaken y por qué basta con esos y no más?
  9. ¿Qué tipo de token se usa (de usuario del sistema o de integración, no de una persona), dónde se guarda, cada cuánto y cómo se rota, y qué hacemos si se filtra?
  10. ¿Quién recibe el código de verificación al registrar el número y quién define y guarda el PIN?
  11. ¿Qué se revoca, quién lo hace y en cuánto tiempo cuando sale un agente del despacho, un empleado de Beaken o cuando se cambia de proveedor?
  12. ¿Qué pasa cuando el cliente se va? ¿Cómo se queda con su número y su historial, y qué datos borramos y cómo lo comprobamos?
  13. ¿Qué datos personales pasan por Meta y por nuestro servidor y cómo se cumple el aviso de privacidad?
  14. ¿Qué cosas no se pueden hacer sin que intervenga el cliente, aunque queramos?
- **Matriz de riesgos y accesos** debe cubrir: dueño del portafolio, número, app y token; permisos delegados; rotación y revocación; qué pasa si el cliente se va; migración si ya usa la app de WhatsApp Business.
- **Runbook:** alta paso a paso contada también desde el lado del despacho, más checklist de baja.

## Cómo se comprueba cada criterio en la demo
- 1, 4, 5, 9: demo en vivo (4 con 2 sesiones en 2 navegadores). 2: curl sin firma. 3: reenvío del mismo payload con curl. 6: demo y consulta a la base de datos. 7: demo o prueba automatizada. 8: demo. 10: gitleaks o búsqueda manual. 11: lo prueba otra persona con el README. 12: salida de `npm test`. 13: archivos en el repositorio. 14: revisión del repositorio y de la demo.
- Fecha de la demo: por confirmar.

## Plan por mañanas (unas 4 h cada una)
1. Alta en Meta, app, número de prueba, hello_world y webhook recibiendo la respuesta. Entregable: nota con capturas sin token ni identificadores. **Sin esto no se avanza.**
2. Modelo de datos, diagramas de estados y de arquitectura, esqueleto del repositorio. Primer commit.
3. Webhook con verificación, firma y duplicados (criterios 2 y 3, con pruebas).
4. Login, usuarios, roles y bandeja (criterio 1).
5. Responder desde el panel y asignar (criterios 4 y 5). Borrador del roadmap.
6. Tickets con folio, botón y palabra clave (criterio 6).
7. Transiciones válidas y bitácora inmutable (criterios 7 y 8).
8. Cierre con aviso, filtros y seguimiento (criterio 9). Runbook y matriz.
9. Pruebas, revisión de secretos, README y limpieza (criterios 10 a 13). Roadmap final.
10. Ensayo y demo.

## Forma de trabajo
- Antes de cada paso, Claude cita la parte del correo del caso (o del director) que ese paso cumple, y luego hace la tarea.
- Paso a paso: haz un solo paso, explica qué hiciste y por qué, dime qué comandos ejecutar y espera a que diga «continuar».
- Las acciones en el panel de Meta, ngrok y GitHub las hago yo; tú me dices qué hacer y dónde.
- Nunca me pidas que pegue un token, secreto o identificador en el chat. Si necesitas probar algo con secretos, que el código los lea de `.env`.
- Si algo es ambiguo o falta una decisión, pregúntame en lugar de suponer.
- Explica en español y de forma sencilla.
- Commits pequeños y descriptivos. **Desde el 2026-11-25 los mensajes de commit empiezan con `TI006:`** (indicación de Carlos).
- Los commits y push los hago yo. Claude escribe el código, llena los documentos y ejecuta los demás comandos; al terminar cada tarea me pasa los comandos exactos para el commit.
- Repositorio: https://github.com/auxsistemas07-ai/CU-BKN-01 (rama `main`). Identidad de Git configurada solo en el repositorio local.
- Claude documenta cada paso al terminarlo en `docs/diario/AAAA-MM-DD.md` (un archivo por día): qué se hizo, por qué, archivos tocados y qué sigue. Sin secretos ni identificadores.
- Los documentos de entrega en Word van **fuera del proyecto**, en `C:\Users\Carlos Rios\Desktop\BEAKEN\WhatsApp multiusuario\`, nunca dentro del repositorio.
- `docs/simulacion-cliente.md` la llena Claude cuando yo confirmo que terminé un paso en Meta (yo solo completo el tiempo si hace falta).

## Avance
- **2026-11-20 · Mañana 1:** pasos 1, 2 y 5 hechos (primer push hecho). Paso 3 hecho: cartera «Cu-Bkn-01», app «Bandeja CU-BKN-01» y número de prueba. Paso 4 hecho (destinatario verificado, token temporal en `.env`). Sigue: paso 6 (script hello_world).
- **2026-11-23:** pasos 6, 7 y 8 hechos en lo posible: hello_world aceptado por Meta (formato México `521…`), webhook mínimo con firma validada, registrado en Meta y recibiendo el «Test» del panel; verify token rotado por aparecer en una captura. **Bloqueo:** con la app sin publicar no llegan al teléfono ni al webhook los mensajes reales. Sigue: decidir si se publica la app (sin verificación ni pagos), terminar la prueba real y la nota de evidencia (paso 9).
- **2026-11-24:** app publicada y suscrita a la cuenta de WhatsApp (`subscribed_apps`); **recepción real funcionando** (mensajes del teléfono llegan al webhook con firma validada). **Envío bloqueado:** Meta restringió la cartera desde el 21/11 por «proceso automatizado» (Integridad de la Cuenta) → error 131031; se pidió revisión. No hay acceso a cartera ni datos de Beaken: se trabaja con esta cuenta. Mañana 2 adelantada: `docs/diagramas/` (estados, arquitectura, modelo de datos). Word de entrega fuera del repositorio.
- **2026-11-25 · Indicación del director (Alex):** seguir con la base del proyecto y el webhook; dejar algo implementable y probable (control de duplicados con prueba de mensaje repetido); si Meta sigue bloqueando, avanzar con datos ficticios; en el primer resultado, compartirle qué funciona, dónde revisarlo, qué se propone después y qué decisión necesita; confirmar si el flujo le sirve a Beaken.
- **2026-11-25 · Hecho:** base del proyecto con SQLite (`node:sqlite`), adaptador de WhatsApp (`src/adaptadores/whatsapp-cloud.js`), webhook completo (`src/app.js`, `npm start`) con firma y control de duplicados, **11 pruebas** con `npm test`, demo `scripts/demo-duplicados.mjs` (401 sin firma, mismo mensaje → 1 registro) y **mensaje real del teléfono guardado en SQLite**. Word del día fuera del repo. Sigue: enviar a Alex el primer resultado (qué funciona, dónde revisarlo, propuesta y decisión); mañana 4 (usuarios, login y bandeja).
- **2026-11-26 · Mañana 4:** `txt` en `.gitignore` y webhook mínimo borrado. Usuarios con rol (scrypt), usuarios ficticios Laura/Pedro/Coordinadora (`scripts/crear-usuarios-demo.mjs`, contraseña en `DEMO_PASSWORD` del `.env`), login con cookie HttpOnly y token guardado como hash, API de la bandeja protegida, panel React + Vite (`npm run web`) con actualización cada 3 s. **20 pruebas** con `npm test` y prueba del panel en Chrome: mensaje visible en 3 s en dos navegadores. Sigue: prueba manual de Carlos con el teléfono (criterio 1 real); mañana 5 (responder desde el panel y asignar).
