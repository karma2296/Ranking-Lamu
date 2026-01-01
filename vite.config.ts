
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  define: {
    // Esto inyecta las variables en el código del navegador durante la compilación
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
});
