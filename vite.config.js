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
          // UI components chunk
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-slot'],
          // Query chunk
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
    // Enable minification with terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers for smaller output
    target: 'es2020',
    // Optimize asset inlining threshold (4KB)
    assetsInlineLimit: 4096,
  },
})
