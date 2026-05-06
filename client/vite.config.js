import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false, // Disable sourcemaps to reduce memory usage
    cssCodeSplit: false, // Disable CSS code splitting to reduce memory
    assetsInlineLimit: 0, // Disable inlining assets to avoid data:base64 URL issues
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash][extname]'
      }
    },
    chunkSizeWarningLimit: 1500,
    emptyOutDir: true,
    reportCompressedSize: false
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'axios',
      'antd',
      'react-redux',
      '@reduxjs/toolkit',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
      '@components': path.resolve(process.cwd(), './src/components'),
      '@pages': path.resolve(process.cwd(), './src/pages'),
      '@store': path.resolve(process.cwd(), './src/store'),
      '@assets': path.resolve(process.cwd(), './src/assets'),
      '@styles': path.resolve(process.cwd(), './src/styles'),
      '@utils': path.resolve(process.cwd(), './src/utils'),
      '@hooks': path.resolve(process.cwd(), './src/hooks'),
      '@config': path.resolve(process.cwd(), './src/config'),
      '@api': path.resolve(process.cwd(), './src/api')
    }
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
});
