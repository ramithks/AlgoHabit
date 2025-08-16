/* Basic ESLint config for React + TypeScript (Vite). */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: "detect" } },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react/jsx-runtime",
  ],
  rules: {
    // TS-centric tweaks
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-types": "off",
    // General ergonomics
    "no-empty": ["warn", { allowEmptyCatch: true }],
    // React 17+ with new JSX transform
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
  },
  ignorePatterns: [
    "dist/",
    "build/",
    "node_modules/",
    "*.config.*",
    "vite.config.*",
    "tsconfig.*.json",
    "tsconfig.tsbuildinfo",
    "src/types/**",
  ],
};
