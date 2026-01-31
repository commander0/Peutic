
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Map '@' to the project root directory
        '@': (process as any).cwd(),
      }
    },
    define: {
      // Manually define specific process.env variables to ensure they are available
      'process.env.STRIPE_KEY': JSON.stringify(env.STRIPE_KEY || env.VITE_STRIPE_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || ''),

      // Polyfill process.env to prevent "process is not defined" errors for other libraries
      'process.env': {}
    },
    build: {
      chunkSizeWarningLimit: 800,
      minify: false,
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    }
  }
})