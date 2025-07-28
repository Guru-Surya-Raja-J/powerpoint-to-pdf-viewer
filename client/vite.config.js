    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      server: {
        proxy: {
          '/api': {
            target: 'http://localhost:3001', // Your local Node.js backend URL
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
          },
          '/converted_pdfs': { // For serving converted PDFs during local dev
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
      },
      build: {
        outDir: 'dist', // Default output directory for Vite
      },
      define: {
        // Expose the backend URL from Render's environment variables
        // During build, process.env.VITE_API_BASE_URL will be replaced with its actual value
        // If VITE_API_BASE_URL is not set (e.g., local dev), it falls back to a default
        // or you can configure it to use the proxy in dev.
        'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || '/api'),
      },
      // --- CRITICAL ADDITION FOR JSX COMPILATION ---
      // This section must be directly inside the defineConfig object,
      // parallel to `plugins`, `server`, `build`, and `define`.
      esbuild: {
        // This explicitly tells esbuild to treat .js files as if they contain JSX.
        // This is necessary because some environments or configurations might default
        // to treating .js files as plain JavaScript, even if they contain JSX.
        loader: 'jsx',
        // You can also specify which files to include, but a broad loader often works.
        // include: /src\/.*\.jsx?$/, // This line is often not strictly needed if loader is set globally
      },
      optimizeDeps: {
        esbuildOptions: {
          loader: {
            // Ensure that files with .js extension are processed as JSX during dependency optimization
            '.js': 'jsx',
          },
        },
      },
      // --- END CRITICAL ADDITION ---
    });
    
