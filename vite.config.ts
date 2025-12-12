import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Garante compatibilidade caso alguma lib use process.env, 
    // mas nosso código usará import.meta.env
    'process.env': {} 
  }
});