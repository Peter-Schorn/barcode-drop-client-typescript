import eslint from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";

export default tseslint.config(
    { ignores: ["dist"] },
    {
        settings: {
            react: {
                version: "detect"
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

            "jsdoc/require-jsdoc": "off",
            "jsdoc/tag-lines": "off",

            "@typescript-eslint/explicit-function-return-type": "error",
            "@stylistic/semi": ["error", "always"],
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
            quotes: ["error", "double", { avoidEscape: true }],
            "no-console": "off",
            "prefer-const": "error",
            "@typescript-eslint/no-unused-vars": ["warn", {
                varsIgnorePattern: "^_+$",
                argsIgnorePattern: "^_+$"
            }],
            eqeqeq: "error",
            "no-unreachable": "warn",

            // TODO: Reenable this
            // "@stylistic/max-len": ["error", {
            //     code: 80,
            //     // ignore eslint-disable comments
            //     ignorePattern: "^\\s*//\\s*eslint-disable",
            //     ignoreComments: false,
            // }],

            "no-var": "error",
            "@typescript-eslint/ban-ts-comment": "off",

            // might want to reenable these
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-argument": "off",

            // probably should stay off
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/restrict-template-expressions": "off"

        },
    },
);
