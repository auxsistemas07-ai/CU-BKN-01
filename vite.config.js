// CU-BKN-01 · Configuración del panel web (React + Vite).
// En desarrollo, Vite sirve el panel en http://localhost:5173 y reenvía /api al servidor Express,
// así la cookie de sesión es del mismo sitio (SameSite=Strict funciona).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const puertoApi = process.env.PORT || '3000';

export default defineConfig({
  root: 'web',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': `http://localhost:${puertoApi}` },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
