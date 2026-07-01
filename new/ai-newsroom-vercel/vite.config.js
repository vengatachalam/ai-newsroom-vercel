import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local dev, forward /api calls to the Vercel dev server
      // (run `vercel dev` instead of `npm run dev` to test the API route locally)
    },
  },
});
