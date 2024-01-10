import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: [
        resolve(__dirname, "src/client.ts"),
        resolve(__dirname, "src/server.ts"),
        resolve(__dirname, "src/mocking.ts"),
        resolve(__dirname, "src/vite-gas-plugin.ts"),
      ],
      formats: ["es"],
    },
  },
});
