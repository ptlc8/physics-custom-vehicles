import globals from "globals";
import pluginJs from "@eslint/js";

export default [
    {
        ignores: ["**/*Box2D*"],
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "commonjs"
        }
    },
    {
        files: ["static/**/*.js"],
        languageOptions: {
            globals: Object.assign({
                Box2D: true,
                Items: false,
                AmbiEngine: true,
                Game: false,
                Gamemodes: false,
                Player: false,
                WorldMap: false,
            }, globals.browser)
        }
    },
    {
        files: ["*.js"],
        languageOptions: {
            globals: globals.node
        }
    },
    {
        files: ["scripts/*"],
        languageOptions: {
            globals: globals["shared-node-browser"]
        }
    },
    pluginJs.configs.recommended,
];