import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/vite-gas-plugin.ts", "src/index.ts"],
  dts: true,
  clean: true,
});
