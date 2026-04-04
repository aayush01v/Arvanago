import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: 3000,
      host: "localhost",
      proxy: {
        // Forward /api/* to local Express API server during dev
        '/api': {
          target: 'http://localhost:3002',
          changeOrigin: true,
        }
      }
    },
    plugins: [
      react(),
      viteCompression(),
      // PWA disabled temporarily to fix navigation caching issues
      // VitePWA({
      //   registerType: 'autoUpdate',
      //   includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt'],
      //   manifest: {
      //     name: 'Edusimulate - Smart Learning',
      //     short_name: 'Edusimulate',
      //     description: 'Interactive learning platform for IIT JEE, NEET, UPSC, and more',
      //     theme_color: '#2B83C6',
      //     background_color: '#ffffff',
      //     display: 'standalone',
      //     icons: [
      //       {
      //         src: '/favicon.svg',
      //         sizes: 'any',
      //         type: 'image/svg+xml'
      //       }
      //     ]
      //   },
      //   workbox: {
      //     globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      //     // Enable navigation fallback for SPA, but don't cache navigations
      //     navigateFallback: null,
      //     cleanupOutdatedCaches: true,
      //     skipWaiting: true,
      //     clientsClaim: true,
      //     runtimeCaching: [
      //       {
      //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      //         handler: 'CacheFirst',
      //         options: {
      //           cacheName: 'google-fonts-cache',
      //           expiration: {
      //             maxEntries: 10,
      //             maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      //           }
      //         }
      //       },
      //       {
      //         urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      //         handler: 'CacheFirst',
      //         options: {
      //           cacheName: 'gstatic-fonts-cache',
      //           expiration: {
      //             maxEntries: 10,
      //             maxAgeSeconds: 60 * 60 * 24 * 365
      //           }
      //         }
      //       },
      //       {
      //         urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
      //         handler: 'CacheFirst',
      //         options: {
      //           cacheName: 'firebase-storage-cache',
      //           expiration: {
      //             maxEntries: 50,
      //             maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      //           }
      //         }
      //       }
      //     ]
      //   }
      // })
    ],
    define: {
      "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY),
      "import.meta.env.VITE_IMGBB_KEY": JSON.stringify(env.VITE_IMGBB_KEY),
      "import.meta.env.VITE_RAZORPAY_KEY_ID": JSON.stringify(env.VITE_RAZORPAY_KEY_ID)
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./", import.meta.url))
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Separate heavy security library
              if (id.includes('dompurify')) {
                return 'security';
              }
              // Separate markdown rendering
              if (id.includes('react-markdown') || id.includes('remark-') || id.includes('rehype-')) {
                return 'markdown';
              }
              // Separate chart library
              if (id.includes('apexcharts') || id.includes('react-apexcharts')) {
                return 'charts';
              }
              // Firebase (already good)
              if (id.includes('firebase')) {
                if (id.includes('/auth')) return 'firebase-auth';
                if (id.includes('/firestore')) return 'firebase-firestore';
                if (id.includes('/storage')) return 'firebase-storage';
                return 'firebase-core';
              }
              // React core (already good)
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'react-vendor';
              }
              // UI libraries (already good)
              if (id.includes('framer-motion') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
              // Everything else
              return 'vendor';
            }
          }
        }
      },
      chunkSizeWarningLimit: 1500
    }
  };
});
