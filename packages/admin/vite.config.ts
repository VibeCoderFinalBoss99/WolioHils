import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

export default defineConfig(({ mode }) => {
  loadEnv(mode, repoRoot, "");
  return {
    envDir: repoRoot,
    plugins: [react(), tailwindcss()],
    server: {
      port: 3002,
      host: "0.0.0.0",
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react-dom")) return "react-dom";
            if (id.includes("node_modules/react/")) return "react";
            if (id.includes("node_modules/motion")) return "motion";
            if (id.includes("node_modules/lucide-react")) return "lucide";
          },
        },
      },
    },
  };
});
