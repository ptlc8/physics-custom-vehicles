import globals from "globals";
import pluginJs from "@eslint/js";

export default [
    {
        ignores: ["dist/*"]
    },
    {
        files: ["client/**/*"],
        languageOptions: {
            globals: globals.browser
        }
    },
    {
        files: ["server/**/*", "*.js"],
        languageOptions: {
            globals: globals.node
        }
    },
    {
        files: ["common/**/*"],
        languageOptions: {
            globals: globals["shared-node-browser"]
        }
    },
    pluginJs.configs.recommended,
    {
        files: ["**/*.js"],
        rules: {
            "no-unused-vars": "off",
            "no-empty": "off"
        }
    }
];