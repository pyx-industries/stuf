import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    watch: {
      usePolling: true,
    },
    // Allow all origins for Docker networking
    cors: true,
    // Disable host checking for containers
    hmr: {
      clientPort: 3000,
    },
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
  define: {
    // Make process.env available in the browser for compatibility with existing code
    "process.env": JSON.stringify(process.env),
  },
});
