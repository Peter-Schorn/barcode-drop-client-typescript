import eslint from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";
import * as importPlugin from "eslint-plugin-import";
import sonarjs from "eslint-plugin-sonarjs";
import "eslint-import-resolver-typescript";

export default tseslint.config(
    { ignores: ["dist"] },
    {
        settings: {
            react: {
                version: "detect"
            },
            "import/resolver": {
                typescript: true,
                node: {
                    extensions: [".js", ".jsx", ".ts", ".tsx"]
                }
            }
        },
        extends: [
            eslint.configs.recommended,
            tseslint.configs.recommendedTypeChecked,
            jsdoc.configs["flat/recommended-typescript"]
        ],
        plugins: {
            "react": react,
            // @ts-ignore
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
            "@typescript-eslint": tseslint.plugin,
            "@stylistic": stylistic,
            "jsdoc": jsdoc,
            "import": importPlugin,
            "sonarjs": sonarjs,
        },
        files: [
            "**/*.{ts,tsx,js}",
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                },
                tsconfigRootDir: import.meta.dirname,
                projectService: {
                    allowDefaultProject: [
                        "eslint.config.js"
                    ]
                }
            },
        },
        // @ts-ignore
        rules: {
            ...reactHooks.configs.recommended.rules,
            ...react.configs.recommended.rules,
            // disables rules that require react to be in scope, since it's not
            // necessary anymore in react 17+
            ...react.configs["jsx-runtime"].rules,

            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],

            "react/no-unescaped-entities": ["error", {
                // allow " characters
                forbid: [">", "\\", "}"]
            }],

            "react-hooks/exhaustive-deps": "off",

            "jsdoc/require-jsdoc": "off",
            "jsdoc/tag-lines": "off",
            "jsdoc/require-param": "off",
            "jsdoc/require-returns": "off",

            "@typescript-eslint/explicit-function-return-type": "error",
            "@stylistic/semi": ["error", "always"],
            "@stylistic/no-extra-semi": "error",
            "@stylistic/member-delimiter-style": ["error", {
                multiline: {
                    delimiter: "semi",
                    requireLast: true
                },
                singleline: {
                    delimiter: "comma",
                    requireLast: false
                },
            }],
            "@stylistic/no-trailing-spaces": "warn",

            quotes: ["error", "double", { avoidEscape: true }],
            "no-console": "off",
            "prefer-const": "error",
            "@typescript-eslint/no-unused-vars": ["warn", {
                varsIgnorePattern: "^_+$",
                argsIgnorePattern: "^_+$"
            }],
            eqeqeq: "error",
            "no-unreachable": "warn",
            "@typescript-eslint/no-misused-promises": ["error", {
                checksVoidReturn: {
                    inheritedMethods: false,
                    // Disables checking an asynchronous function passed as a
                    // JSX attribute expected to be a function that returns
                    // void.
                    attributes: false,
                    arguments: false
                }
            }],
            // disallows c-style for-loops when a for-of loop could be used
            // instead
            "@typescript-eslint/prefer-for-of": "error",

            // TODO: Can't get this to work
            // "import/extensions": ["error", "ignorePackages", {
            //     js: "never",
            //     jsx: "never",
            //     ts: "never",
            //     tsx: "never"
            // }],

            // TODO: Reenable this
            // "@stylistic/max-len": ["error", {
            //     code: 80,
            //     // ignore eslint-disable comments
            //     ignorePattern: "^\\s*//\\s*eslint-disable",
            //     ignoreComments: false,
            // }],

            "no-var": "error",
            "@typescript-eslint/ban-ts-comment": "off",
            "func-style": ["error", "declaration", {
                allowArrowFunctions: false
            }],
            "curly": "error",
            "@typescript-eslint/switch-exhaustiveness-check": ["error", {
                requireDefaultForNonUnion: true
            }],

            // do not allow ignoring the return value of a function
            // https://sonarsource.github.io/rspec/#/rspec/S2201/javascript
            "sonarjs/no-ignored-return": "error",

            // TODO: might want to reenable these
            // "@typescript-eslint/no-unsafe-member-access": "off",
            // "@typescript-eslint/no-unsafe-assignment": "off",
            // "@typescript-eslint/no-unsafe-call": "off",
            // "@typescript-eslint/no-unsafe-argument": "off",

            // probably should stay off
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/restrict-template-expressions": "off"

        },
    },
    // Disables rules for the config file itself
    {
        files: ["eslint.config.js"],
        rules: {
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
        }
    }
);
