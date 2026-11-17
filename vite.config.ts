import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths, so the build works at any GitHub Pages URL (user or project site).
  base: "./",
  plugins: [react()],
  server: { port: 8080, open: true },
});
