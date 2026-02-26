import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Code splitting for better caching and faster loads
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk - rarely changes, cached long-term
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase chunk
          'vendor-supabase': ['@supabase/supabase-js'],
          // Icons chunk - large but cacheable
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
})
