import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Rpg-OnePiece/', // Nome do repositório no GitHub (respeitando maiúsculas/minúsculas)
})
