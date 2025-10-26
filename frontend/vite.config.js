import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "./", // project root
  publicDir: "public",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        icon: "src/icon.html",
        panel: "src/panel.html"
      }
    }
  },
  server: {
    port: 5173,
    open: false
  }
});
