import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This allows access to process.env in client-side code if needed, but primarily 
    // we use import.meta.env. This shim prevents crashes if libraries access process.env.
    'process.env': {} 
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
        output: {
            manualChunks: {
                'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                'vendor-charts': ['recharts'],
                'vendor-icons': ['lucide-react']
            }
        }
    }
  }
})