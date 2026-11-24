# CU-BKN-01 · Política de privacidad (entorno de prueba)

Última actualización: 2026-11-24

## 1. Qué es esta aplicación
«Bandeja CU-BKN-01» es una aplicación **de prueba (sandbox)** que demuestra una bandeja compartida de WhatsApp con tickets para despachos de seguros. Usa exclusivamente la **WhatsApp Cloud API oficial de Meta** y el **número de prueba** que Meta proporciona. No está en producción ni se ofrece al público.

## 2. Qué datos se procesan
Solo durante las pruebas, y solo de **teléfonos de prueba registrados** por el propio equipo de desarrollo:
- El identificador de WhatsApp (número) del teléfono de prueba.
- El texto de los mensajes enviados y recibidos.
- La fecha y hora de cada mensaje y su estado de entrega.

Todos los datos de asegurados, pólizas y siniestros que aparecen en la demostración son **ficticios**. No se procesan fotos, archivos ni datos de pago.

## 3. Para qué se usan
Únicamente para mostrar el funcionamiento de la bandeja: recibir mensajes, responderlos y darles seguimiento mediante tickets. No se usan con fines publicitarios ni se venden o comparten con terceros.

## 4. Dónde se guardan
Los mensajes pasan por los servidores de Meta (WhatsApp Cloud API), conforme a las políticas de Meta, y se guardan en una base de datos local del equipo de pruebas. No se despliega la aplicación en servidores de producción.

## 5. Cuánto tiempo se conservan
Solo mientras dura la prueba. Al terminar, la base de datos local se elimina.

## 6. Eliminación de datos
Cualquier persona cuyo teléfono de prueba se haya usado puede pedir que se borren sus datos abriendo una solicitud en el repositorio del proyecto (sección «Issues»), **sin incluir su número ni ningún dato personal en la solicitud**. Los datos se eliminan borrando los registros de la base de datos local; además, la persona puede borrar el chat desde su propia aplicación de WhatsApp.

**Nunca se piden contraseñas, tokens ni códigos de verificación** por chat, correo ni por ningún otro medio.

## 7. Cambios a esta política
Cualquier cambio se publica en este mismo archivo, con su fecha de actualización.
