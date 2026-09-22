import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ebaySearchPlugin } from './vite-plugin-ebay.ts'

export default defineConfig({
  plugins: [react(), ebaySearchPlugin()],
})
