import js from "@eslint/js";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import reactPlugin from "eslint-plugin-react";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.js"],
    languageOptions: {
      parser: babelParser,
      sourceType: "module",
      ecmaVersion: "latest",
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
        },
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: reactPlugin,
      "no-relative-import-paths": noRelativeImportPaths,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      "no-console": "off",
      "comma-dangle": ["warn", "only-multiline"],
      "react/jsx-filename-extension": ["warn", { extensions: [".js", ".jsx"] }],
      "prefer-destructuring": ["error", { object: true, array: false }],
      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        { allowSameFolder: false, rootDir: "src/js" },
      ],
      "max-len": [
        "error",
        {
          code: 120,
          ignoreComments: true,
        },
      ],
    },
  },
];
