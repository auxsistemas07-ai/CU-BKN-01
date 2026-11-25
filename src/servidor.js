// CU-BKN-01 · Punto de arranque: lee .env, abre la base y levanta el servidor.
// Uso: npm start
import { abrirBaseDatos } from './db/base-datos.js';
import { crearApp } from './app.js';

const { PORT = '3000', APP_SECRET, VERIFY_TOKEN } = process.env;
if (!APP_SECRET || !VERIFY_TOKEN) {
  console.error('Faltan variables en .env: APP_SECRET y/o VERIFY_TOKEN');
  process.exit(1);
}

const db = abrirBaseDatos();
const app = crearApp({ db, appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN });
// En Express 5 el error de arranque (por ejemplo, puerto ocupado) llega como argumento del callback.
app.listen(Number(PORT), (error) => {
  if (error) {
    console.error(error.code === 'EADDRINUSE'
      ? `El puerto ${PORT} ya está en uso: probablemente el servidor ya está encendido en otra ventana.`
      : `No se pudo arrancar el servidor: ${error.message}`);
    process.exit(1);
  }
  console.log(`Servidor CU-BKN-01 escuchando en http://localhost:${PORT} (webhook en /webhook)`);
});
