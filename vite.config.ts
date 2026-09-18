import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "WorkOnSite",
        short_name: "WorkOnSite",
        theme_color: "#2E6BFF",
        background_color: "#0A1220",
        display: "standalone",
        icons: [], // add 192/512 app icons from the supplied favicon/app-icon set
      },
    }),
  ],
});
