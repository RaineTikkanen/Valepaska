import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['app', 'localhost'],
    proxy: {
      '/socket.io': {
        target: 'http://backend:3000 ',
        changeOrigin: true,
      },
      '/api' : {
        target: 'http://backend:3000 ',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
});
