import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dev: /api so'rovlari backendga proksi qilinadi (cookie bir origin'da qoladi).
const apiTarget = process.env.VITE_API_PROXY || "http://localhost:3000";
const port = Number(process.env.WEB_PORT) || 5173;
const proxy = { "/api": { target: apiTarget, changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  // Bir nechta dev server bir vaqtda ishlasa, umumiy deps keshi "Invalid hook call" ga olib keladi
  cacheDir: process.env.VITE_CACHE_DIR || `node_modules/.vite-${port}`,
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port, strictPort: true, proxy },
  preview: { port, strictPort: true, proxy },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
        },
      },
    },
  },
});
