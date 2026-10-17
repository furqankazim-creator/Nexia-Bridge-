import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

// Builds the web app as ONE self-contained HTML file for embedding in the Expo WebView.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {alias: {'@': path.resolve(__dirname, '.')}},
  base: './',
  build: {outDir: 'dist-mobile', emptyOutDir: true},
});

