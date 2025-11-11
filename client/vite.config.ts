// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs'; 
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: true, 
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../server/localhost+1-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../server/localhost+1.pem')),
    },

    proxy: {
      '/socket.io': {
        target: 'http://localhost:4000', 
        ws: true,
        secure: false,
      }
    }
  }
});