import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      include: [/@polkadot-api/, /node_modules/]
    }
  },
  optimizeDeps: {
    include: ['@polkadot-api/descriptors'],
    esbuildOptions: {
      target: 'esnext'
    }
  }
})