import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { olxSearchPlugin } from './vite-plugin-olx.ts'

export default defineConfig({
  plugins: [react(), olxSearchPlugin()],
})
