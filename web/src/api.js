// CU-BKN-01 · Llamadas del panel a la API. La cookie de sesión la manda el navegador solo (HttpOnly).
export class SinSesion extends Error {}

async function pedir(ruta, opciones = {}) {
  const res = await fetch(`/api${ruta}`, { credentials: 'same-origin', ...opciones });
  if (res.status === 401) throw new SinSesion((await res.json().catch(() => ({}))).error || 'Inicia sesión');
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export const api = {
  yo: () => pedir('/yo'),
  entrar: (correo, contrasena) => pedir('/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo, contrasena }),
  }),
  salir: () => pedir('/logout', { method: 'POST' }),
  conversaciones: () => pedir('/conversaciones'),
  mensajes: (id) => pedir(`/conversaciones/${id}/mensajes`),
};
