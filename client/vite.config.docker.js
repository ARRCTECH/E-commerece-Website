import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild', // Use esbuild for faster builds
    sourcemap: false, // Disable sourcemaps to reduce memory usage
    cssCodeSplit: false, // Disable CSS code splitting to reduce memory
    assetsInlineLimit: 0, // Disable inlining assets
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
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
