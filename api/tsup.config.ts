import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // node_modules paketlari bundle'ga kirmaydi (Prisma engine, argon2 native)
  skipNodeModulesBundle: true,
});
