import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Vite only looks for .env files next to vite.config.ts by default — the
  // real .env lives at the monorepo root, two levels up from apps/web.
  const envDir = path.resolve(import.meta.dirname, "../..");
  // vite.config.ts itself runs before Vite's normal env-loading pipeline
  // populates import.meta.env, so reading a .env value here needs this
  // helper rather than plain process.env.
  const env = loadEnv(mode, envDir, "VITE_");

  return {
    plugins: [react()],
    envDir,
    base: env.VITE_BASE_PATH || "/",
    server: {
      // Dev-only convenience so the browser calls same-origin `/api/*`
      // instead of hitting the API's port directly — avoids needing CORS
      // middleware.
      proxy: {
        "/api": "http://localhost:3000",
      },
    },
  };
});
