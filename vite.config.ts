import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Renderer-Build. Electron lädt dist/index.html über file://,
// deshalb relative Pfade (base: './').
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'shared/**/*.test.ts', 'electron/**/*.test.ts'],
  },
});
