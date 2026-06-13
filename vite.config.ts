import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// `base` permite servir la app desde una subruta (GitHub Pages de proyecto:
// https://<usuario>.github.io/<repo>/). El workflow de despliegue define
// BASE_PATH automáticamente con el nombre del repositorio; en local es "/".
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
});
