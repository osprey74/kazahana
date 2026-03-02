import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages: deploy to docs/ja/demo/ path
  // For local dev, use '/'
  base: process.env.BUILD_FOR_PAGES ? '/kazahana/ja/demo/' : '/',
})
