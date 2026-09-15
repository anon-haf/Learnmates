import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// When vercel dev manages the dev server it passes $PORT + $VERCEL and routes
// /api/* to the serverless functions itself. In that case Vite must NOT proxy
// /api to localhost:3000 (itself), or API requests loop back and hang.
const runningUnderVercelDev = Boolean(process.env.VERCEL && process.env.PORT);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: runningUnderVercelDev
      ? undefined
      : {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
          },
        },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
