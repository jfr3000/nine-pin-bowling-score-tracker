import globals from "globals"
import path from "node:path"
import { fileURLToPath } from "node:url"
import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [...compat.extends("eslint:recommended"), {
  languageOptions: {
    globals: {
      ...globals.browser,
      Alpine: 'readonly'
    }
  },

  rules: {
    eqeqeq: 2,
    "guard-for-in": 2,
    "wrap-iife": 2,
    "new-cap": 2,
    "no-empty": 2,
    "no-irregular-whitespace": 2,
    "no-unused-vars": 2,
    strict: [2, "safe"],
    "max-depth": [2, 3],
    "max-len": [2, 120],
    "brace-style": 2,
    "no-with": 2,
    "no-mixed-spaces-and-tabs": 2,
    "no-multiple-empty-lines": 2,
    "no-multi-str": 2,

    "one-var": [2, {
      initialized: "never"
    }],

    "padded-blocks": [2, "never"],

    "key-spacing": [2, {
      beforeColon: false,
      afterColon: true
    }],

    "space-unary-ops": [2, {
      words: false,
      nonwords: false
    }],

    "no-spaced-func": 2,
    "no-trailing-spaces": 2,
    yoda: [2, "never"],
    "eol-last": 2,

    "keyword-spacing": [2, {
      overrides: {
        else: {
          before: true
        },

        while: {
          before: true
        },

        catch: {
          before: true
        }
      }
    }],

    "spaced-comment": [2, "always"],
    "space-before-blocks": [2, "always"],

    indent: [2, 2, {
      SwitchCase: 1
    }],

    "linebreak-style": [2, "unix"],
    semi: [2, "never"],
    "no-dupe-keys": [2],
    "quote-props": [2, "as-needed"]
  }
}]
