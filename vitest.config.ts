import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests cover pure logic and sprite data only. UI is verified in the browser.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { environment: "node", include: ["lib/**/*.test.ts", "components/**/*.test.ts"] },
});
