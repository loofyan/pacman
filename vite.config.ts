import { defineConfig } from 'vite';

export default defineConfig({
  base: '/pacman/',
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
