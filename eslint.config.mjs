// @ts-check

import eslint from "@eslint/js";
import path from "path";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  {
    ignores: [
      "./node_modules/*",
      "**/dist/**/*",
      "./",
      "**/.wrangler/**/*",
      "*.js",
      "*.mjs",
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./tsconfig.json",
        projectService: true,
      },
      globals: {
        process: "readonly",
        global: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },

    rules: {
      curly: ["error", "all"],
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-extraneous-class": "off",
    },
  }
);
