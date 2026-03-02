import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages: set base to repo name when deploying
  // For local dev, use '/'
  base: process.env.GITHUB_ACTIONS ? '/kazahana/' : '/',
})
