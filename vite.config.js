import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    open: false,
    host: true
  },

  preview: {
    port: 4173
  },

  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Separa vendors pesados para que o Firebase nao seja rebaixado
        // junto com o app a cada deploy (melhora o cache do navegador).
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('canvas-confetti')) return 'confetti';
          return 'vendor';
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },

  esbuild: {
    // Remove logs de desenvolvimento do bundle de producao.
    drop: ['debugger'],
    pure: ['console.debug']
  }
});
