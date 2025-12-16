
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Explicitly define environment variables needed by the app
      // This ensures that if the environment (like a cloud IDE) provides these, they are available in the browser code.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL),
      // Polyfill process.env for other accesses to avoid "process is not defined" reference errors
      'process.env': {},
    },
  };
});
