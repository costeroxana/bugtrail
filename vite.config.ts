import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This forwards frontend requests for /graphql to the backend
    proxy: {
      "/graphql": "http://localhost:4000",
    },
  },
});
