import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000, // Default port (can be overridden via CLI in docker-entrypoint.sh)
    watch: {
      usePolling: true,
    },
    // Allow all origins for Docker networking
    cors: true,
    // Allow Docker container hostnames
    allowedHosts: ["spa-e2e", "localhost", "127.0.0.1", "all"],
  },
  build: {
    outDir: "build",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
