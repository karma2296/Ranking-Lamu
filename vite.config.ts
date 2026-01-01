
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  define: {
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
});
