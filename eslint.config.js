import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.js"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
        // jQuery and lodash are peer dependencies, provided as globals at runtime.
        $: "readonly",
        _: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-console": "off",
      // Unused callback arguments and caught errors are part of the signatures.
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "comma-dangle": ["warn", "only-multiline"],
      "prefer-destructuring": ["error", { object: true, array: false }],
      "max-len": [
        "error",
        {
          code: 120,
          ignoreComments: true,
        },
      ],
    },
  },
  {
    // The test helpers run inside Jest.
    files: ["src/simpleDomControl/sdc_test_utils.js"],
    languageOptions: {
      globals: {
        jest: "readonly",
      },
    },
  },
];
