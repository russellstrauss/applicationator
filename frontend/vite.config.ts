import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Plugin to inject module polyfill
const modulePolyfillPlugin = () => {
  return {
    name: 'module-polyfill',
    transformIndexHtml(html: string) {
      return html.replace(
        '<head>',
        `<head>
    <script>
      if (typeof module === 'undefined') {
        window.module = { exports: {} };
        globalThis.module = { exports: {} };
      }
    </script>`
      );
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [modulePolyfillPlugin(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/long/, /node_modules/],
    },
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress source map warnings for dependencies
        if (warning.code === 'SOURCEMAP_ERROR' || warning.message?.includes('source map')) {
          return;
        }
        warn(warning);
      },
    },
  },
  optimizeDeps: {
    include: ['long', '@tensorflow/tfjs'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  esbuild: {
    sourcemap: false,
  },
})

