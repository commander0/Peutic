import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Stringify variables for browser accessibility during Vercel build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.TAVUS_API_KEY': JSON.stringify(process.env.TAVUS_API_KEY || ''),
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
    'process.env.SUPABASE_KEY': JSON.stringify(process.env.SUPABASE_KEY || ''),
    'process.env.STRIPE_KEY': JSON.stringify(process.env.STRIPE_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'core-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'recharts'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true
  }
})