// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(async ({ mode }) => {
  const plugins = [react()]

  // carrega o plugin do Replit apenas no dev, se existir
  if (mode === 'development') {
    try {
      const mod = await import('@replit/vite-plugin-runtime-error-modal')
      if (mod?.default) plugins.push(mod.default())
    } catch {
      // ignora se o pacote não existir (como na Vercel)
    }
  }

  return {
    plugins,
    build: {
      outDir: 'dist'
    }
  }
})
