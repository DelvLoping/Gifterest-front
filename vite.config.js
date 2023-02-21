import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        // Replace "/assets" with "Gifterest-front/assets" in output files
        chunkFileNames: 'Gifterest-front/assets/[name]-[hash].js',
        assetFileNames: 'Gifterest-front/assets/[name]-[hash][extname]',
        entryFileNames: 'Gifterest-front/assets/[name]-[hash].js',
      }
    }
  }
})
