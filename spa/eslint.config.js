import storybook from "eslint-plugin-storybook";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // JavaScript
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  // React
  pluginReact.configs.flat.recommended,

  // TypeScript
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // Tailwind
  {
    files: ["tailwind.config.js"],
    languageOptions: {
      globals: {
        require: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Storybook
  storybook.configs["flat/recommended"],
  {
    files: ["src/**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)"],
    rules: {},
  },
]);
