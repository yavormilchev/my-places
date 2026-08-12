import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Vite only looks for .env files next to vite.config.ts by default — the
  // real .env lives at the monorepo root, two levels up from apps/web.
  envDir: path.resolve(import.meta.dirname, "../.."),
  server: {
    // Dev-only convenience so the browser calls same-origin `/places` etc.
    // instead of hitting the API's port directly — avoids needing CORS
    // middleware on the API for what's currently a same-machine dev setup.
    proxy: {
      "/places": "http://localhost:3000",
      "/health": "http://localhost:3000",
      "/auth": "http://localhost:3000",
    },
  },
});
