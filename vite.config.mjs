import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    proxy: {
      '^/devapi': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/devapi/, '/'),
      },
      '/vatusa': {
        target: 'https://api.vatusa.net/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/vatusa/, '/'),
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/assets/css/styles";`,
      },
    },
  },
  define: {
    'process.env': process.env,
  },
});
