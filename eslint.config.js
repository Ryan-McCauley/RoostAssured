import js from "@eslint/js"
import globals from "globals"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"

// The Ruby side has Rubocop, Brakeman, and bundler-audit; until now the ~6k lines of JSX next to
// it had nothing. This is deliberately close to the recommended sets rather than a bespoke style:
// the value is catching real mistakes (unused bindings, missing hook dependencies, bad JSX), not
// litigating formatting.
export default [
  { ignores: [ "public/**", "node_modules/**", "vendor/**" ] },
  js.configs.recommended,
  {
    files: [ "app/frontend/**/*.{js,jsx}" ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // The new JSX transform is in use, so React need not be in scope for JSX.
      "react/react-in-jsx-scope": "off",
      // This codebase passes plenty of props without declaring propTypes; enforcing it now would
      // be a large mechanical change with little safety benefit next to the hooks rules.
      "react/prop-types": "off",
      // Apostrophes and quotes in prose render correctly; this rule fires ~100 times across the
      // legal pages alone and would only add entity noise to readable copy.
      "react/no-unescaped-entities": "off",
      // Fires on every fetch-on-mount in the app. The setState calls it flags happen inside async
      // callbacks, not synchronously in the effect body -- the rule can't see through the function
      // call. Kept as a warning rather than disabled: the cascading-render problem it describes is
      // real, and the honest fix is a data-fetching layer (Suspense or a query library), which is
      // a bigger change than this pass.
      "react-hooks/set-state-in-effect": "warn",
      "no-unused-vars": [ "error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" } ],
    },
  },
]
