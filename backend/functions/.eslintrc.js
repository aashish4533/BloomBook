module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "google",
        "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: ["tsconfig.json", "tsconfig.dev.json"],
        sourceType: "module",
    },
    ignorePatterns: [
        "lib/", // Ignore built files.
        "generated/", // Ignore generated files.
    ],
    plugins: [
        "@typescript-eslint",
        "import",
    ],
    rules: {
        // Project uses selective comments; full @param/@returns on every helper is not enforced.
        "require-jsdoc": "off",
        "valid-jsdoc": "off",
        "quotes": "off",
        "import/no-unresolved": 0,
        "indent": "off",
        "linebreak-style": 0,
        "object-curly-spacing": "off",
        "max-len": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "warn",
    },
};
