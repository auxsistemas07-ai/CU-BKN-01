// CU-BKN-01 · Panel: login y bandeja compartida que se actualiza sola.
import { useCallback, useEffect, useState } from 'react';
import { api, SinSesion } from './api.js';

// Cada cuánto se consulta la bandeja. El criterio 1 pide que el mensaje aparezca en menos de 10 s.
const INTERVALO_MS = 3000;

const hora = (iso) => (iso ? new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '');
// En pantalla solo se muestran los últimos 4 dígitos del número del cliente (mínimo de datos personales).
const numeroCorto = (waId) => `···${String(waId).slice(-4)}`;

export default function App() {
  const [usuario, setUsuario] = useState(undefined); // undefined = revisando sesión; null = sin sesión

  useEffect(() => {
    api.yo().then((r) => setUsuario(r.usuario)).catch(() => setUsuario(null));
  }, []);

  if (usuario === undefined) return <p className="cargando">Cargando…</p>;
  if (!usuario) return <Login alEntrar={setUsuario} />;
  return <Bandeja usuario={usuario} alSalir={() => setUsuario(null)} />;
}

function Login({ alEntrar }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      alEntrar((await api.entrar(correo, contrasena)).usuario);
    } catch (err) {
      setError(err instanceof SinSesion ? err.message : 'No se pudo conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login">
      <form onSubmit={enviar}>
        <h1>Bandeja de WhatsApp</h1>
        <p className="sub">Seguros Ejemplo · entorno de prueba</p>
        <label>Correo
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="username" required />
        </label>
        <label>Contraseña
          <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  );
}

function Bandeja({ usuario, alSalir }) {
  const [conversaciones, setConversaciones] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [actualizado, setActualizado] = useState(null);
  const [aviso, setAviso] = useState('');

  const actualizar = useCallback(async () => {
    try {
      setConversaciones((await api.conversaciones()).conversaciones);
      if (seleccionada) setMensajes((await api.mensajes(seleccionada)).mensajes);
      setActualizado(new Date());
      setAviso('');
    } catch (err) {
      if (err instanceof SinSesion) return alSalir();
      setAviso('Sin conexión con el servidor; se reintenta…');
    }
  }, [seleccionada, alSalir]);

  // Consulta periódica: al abrir y luego cada INTERVALO_MS.
  useEffect(() => {
    actualizar();
    const temporizador = setInterval(actualizar, INTERVALO_MS);
    return () => clearInterval(temporizador);
  }, [actualizar]);

  async function salir() {
    await api.salir().catch(() => {});
    alSalir();
  }

  const actual = conversaciones.find((c) => c.id === seleccionada);

  return (
    <div className="bandeja">
      <header>
        <strong>Bandeja compartida</strong>
        <span className="estado">{aviso || (actualizado && `Actualizada ${actualizado.toLocaleTimeString('es-MX')}`)}</span>
        <span className="usuario">{usuario.nombre} · {usuario.rol}</span>
        <button onClick={salir}>Salir</button>
      </header>

      <aside>
        {conversaciones.length === 0 && <p className="vacio">Aún no hay conversaciones.</p>}
        <ul>
          {conversaciones.map((c) => (
            <li key={c.id} className={c.id === seleccionada ? 'activa' : ''}
              onClick={() => { setSeleccionada(c.id); setMensajes([]); }}>
              <div className="fila">
                <b>{c.nombre_contacto || 'Sin nombre'}</b>
                <small>{hora(c.ultimo_mensaje_en)}</small>
              </div>
              <div className="fila">
                <span className="vista-previa">{c.ultima_direccion === 'saliente' ? 'Tú: ' : ''}{c.ultimo_texto ?? '(sin texto)'}</span>
                <small>{numeroCorto(c.wa_id)}</small>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <section className="chat">
        {!actual && <p className="vacio">Elige una conversación.</p>}
        {actual && (
          <>
            <h2>{actual.nombre_contacto || 'Sin nombre'} <small>{numeroCorto(actual.wa_id)}</small></h2>
            <div className="mensajes">
              {mensajes.map((m) => (
                <div key={m.id} className={`burbuja ${m.direccion}`}>
                  <p>{m.texto ?? `(${m.tipo})`}</p>
                  <small>{hora(m.fecha)}{m.estado_envio ? ` · ${m.estado_envio}` : ''}</small>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
