import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// When vercel dev manages the dev server it passes $PORT + $VERCEL and routes
// /api/* to the serverless functions itself. In that case Vite must NOT proxy
// /api to localhost:3000 (itself), or API requests loop back and hang.
const runningUnderVercelDev = Boolean(process.env.VERCEL && process.env.PORT);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env.local so we can read API_BASE_URL / API_SHARED_SECRET for the proxy
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.API_BASE_URL || 'https://api.learnmates.org';
  const apiSecret = env.API_SHARED_SECRET || '';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: runningUnderVercelDev
        ? undefined
        : {
            // Proxy /api/ask → upstream Oracle API with auth header injected
            '/api/ask': {
              target: apiBase,
              changeOrigin: true,
              rewrite: (p: string) => p.replace(/^\/api/, ''),
              headers: {
                Authorization: `Bearer ${apiSecret}`,
              },
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
  };
});
