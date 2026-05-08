import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/NovaMD/' : '/';
  const appUrl = command === 'build' ? 'https://lyqteemo.github.io/NovaMD/' : '/';

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['pwa-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'NovaMD',
          short_name: 'NovaMD',
          description:
            'A local-first Markdown editor with live preview, themes, workspace files, and export tools.',
          id: appUrl,
          start_url: appUrl,
          scope: appUrl,
          theme_color: '#101828',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'any',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'novamd-images',
                expiration: {
                  maxEntries: 64,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'font',
              handler: 'CacheFirst',
              options: {
                cacheName: 'novamd-fonts',
                expiration: {
                  maxEntries: 16,
                  maxAgeSeconds: 365 * 24 * 60 * 60,
                },
              },
            },
          ],
        },
      }),
      {
        name: 'github-pages-spa-fallback',
        apply: 'build',
        closeBundle() {
          const distDir = path.resolve(__dirname, 'dist');
          const indexPath = path.join(distDir, 'index.html');
          const fallbackPath = path.join(distDir, '404.html');

          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, fallbackPath);
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor';
            if (id.includes('@uiw/react-codemirror')) return 'uiw-codemirror';
            if (id.includes('@codemirror/')) {
              const match = id.match(/node_modules\/@codemirror\/([^/]+)/);
              return match ? `codemirror-${match[1]}` : 'codemirror-vendor';
            }
            if (id.includes('@lezer/')) {
              const match = id.match(/node_modules\/@lezer\/([^/]+)/);
              return match ? `lezer-${match[1]}` : 'lezer-vendor';
            }
            if (
              id.includes('react-markdown') ||
              id.includes('react-syntax-highlighter') ||
              id.includes('remark-gfm') ||
              id.includes('refractor') ||
              id.includes('unified') ||
              id.includes('micromark') ||
              id.includes('hast') ||
              id.includes('mdast')
            ) {
              return 'markdown-vendor';
            }
            if (id.includes('motion')) return 'motion-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
          },
        },
      },
    },
  };
});
