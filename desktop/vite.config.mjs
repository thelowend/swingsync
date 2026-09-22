import {
  defineConfig,
} from "vite";

import react from
  "@vitejs/plugin-react";

import path from "node:path";
import {
  fileURLToPath,
} from "node:url";

const currentDirectory =
  path.dirname(
    fileURLToPath(
      import.meta.url
    )
  );

export default defineConfig({
  root: path.join(
    currentDirectory,
    "renderer"
  ),

  base: "./",

  plugins: [
    react(),
  ],

  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },

  build: {
    outDir: path.join(
      currentDirectory,
      "dist"
    ),
    emptyOutDir: true,
    target: "chrome152",
  },
});
