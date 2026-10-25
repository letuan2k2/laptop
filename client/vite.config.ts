import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";

const API_URL = process.env.API_URL || "http://localhost:4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
  server: {
    port: 3001,
    // Gọi API qua cùng cổng 3001 nên cookie đăng nhập hoạt động, không cần cấu hình CORS
    proxy: {
      "/api": API_URL,
      "/uploads": API_URL,
    },
  },
  test: {
    environment: "jsdom",
  },
});
