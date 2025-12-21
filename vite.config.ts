import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // '' means load all env vars regardless of prefix
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Manually define specific process.env variables to ensure they are available
      // This is required because we are using process.env syntax in the client code
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ''),
      'process.env.STRIPE_KEY': JSON.stringify(env.STRIPE_KEY || env.VITE_STRIPE_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.VITE_TAVUS_API_KEY': JSON.stringify(env.VITE_TAVUS_API_KEY || ''),
      
      // Polyfill process.env to prevent "process is not defined" errors for other libraries
      // BUT do not overwrite the specific keys defined above
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
  }
})