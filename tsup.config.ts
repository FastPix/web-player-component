import { defineConfig } from "tsup";
import { version } from "./package.json";

export default defineConfig({
  entry: { player: "src/player.ts" },
  format: ["esm", "iife"],
  globalName: "FastPixPlayer",
  target: "es2020",
  minify: true,
  dts: {
    banner: 'import type {} from "react";',
  },
  clean: true,
  define: {
    __FP_PLAYER_VERSION__: JSON.stringify(version),
  },
  esbuildOptions(options) {
    options.drop = ["console", "debugger"];
    options.legalComments = "none";
  },
  outExtension({ format }) {
    return { js: format === "iife" ? ".js" : ".esm.js" };
  },
});
