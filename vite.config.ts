import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This maps the process.env.API_KEY in your code to the variable during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
