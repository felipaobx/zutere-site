import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';
const directory = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: path.join(directory, 'frontend'),
  base: '/fotos/', publicDir: false,
  plugins: [react()],
  resolve: { alias: { '@': directory } },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: { outDir: path.join(directory, 'dist/client'), emptyOutDir: false, assetsDir: 'browser-assets' },
});
