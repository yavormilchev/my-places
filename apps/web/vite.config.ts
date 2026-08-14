import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Vite only looks for .env files next to vite.config.ts by default — the
  // real .env lives at the monorepo root, two levels up from apps/web.
  envDir: path.resolve(import.meta.dirname, "../.."),
  server: {
    // Dev-only convenience so the browser calls same-origin `/api/*` instead
    // of hitting the API's port directly — avoids needing CORS middleware.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
