import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';


const runningUnderVercelDev = Boolean(process.env.VERCEL && process.env.PORT);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.API_BASE_URL || 'https://api.learnmates.org';
  const apiSecret = env.API_SHARED_SECRET || '';

  return {
    plugins: [
      react(),
      svgr({
        // Import SVGs as React components only when the `?react` suffix is used.
        // Plain `import x from './foo.svg'` still returns the URL — no breaking changes.
        include: '**/*.svg?react',
        svgrOptions: {
          // Use currentColor + inherit sizing so it drops in next to lucide icons
          icon: true,
        },
      }),
    ],
    server: {
      port: 5173,
      strictPort: true,
      proxy: runningUnderVercelDev
        ? undefined
        : {
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
