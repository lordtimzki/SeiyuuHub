import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api/anilist": {
        target: "https://graphql.anilist.co",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anilist/, ""),
      },
    },
  },
  plugins: [react(), tailwindcss()],
});
