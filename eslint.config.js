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
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-console": "off",
      "comma-dangle": ["warn", "only-multiline"],
      "prefer-destructuring": ["error", { object: true, array: false }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./*", "../*"],
              message: "import statements should have an absolute path",
            },
          ],
        },
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
