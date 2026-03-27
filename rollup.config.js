import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { isBuiltin } from "node:module";

const config = {
    input: "index.js",
    output: {
        file: "dist/index.cjs",
        format: "cjs",
        sourcemap: true,
        exports: "auto",
        inlineDynamicImports: true
    },
    plugins: [nodeResolve({
        preferBuiltins: true,
    }),
    commonjs({ignore: (id) => isBuiltin(id) || id.startsWith('node:')}),
    json()],
};

export default config;
