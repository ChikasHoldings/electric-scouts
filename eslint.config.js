import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  {
    files: [
      "src/components/**/*.{js,mjs,cjs,jsx}",
      "src/pages/**/*.{js,mjs,cjs,jsx}",
      "src/Layout.jsx",
    ],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      // The explicit rules below replace the recommended presets spread above
      // rather than extending them, so no-undef was switched off along with
      // everything else it brings. That is the one rule this codebase most
      // needed: AdminUsers referenced a `viewerCount` that was never declared,
      // and the page threw a ReferenceError on render while lint stayed green.
      // A typo'd identifier is a crash, not a style question.
      "no-undef": "error",
      "react/jsx-no-undef": "error",
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      // `fetchpriority` is lowercase deliberately. The rule tells you to write
      // `fetchPriority`, which is right for React 19 — but this project is on
      // React 18.3.1, where React drops the camelCase spelling and logs
      // "React does not recognize the `fetchPriority` prop ... spell it as
      // lowercase `fetchpriority` instead" on every page that renders one.
      // React's own runtime is the authority here, so the rule yields to it.
      // Revisit when upgrading to React 19.
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close", "fetchpriority"] },
      ],
      "react-hooks/rules-of-hooks": "error",
    },
  },
];
