import { defineConfig } from "vite";
import path from "path";
import glsl from "vite-plugin-glsl";

export default defineConfig({
    plugins: [glsl()],
    resolve: {
        alias: [
            { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "$1") },
            {
                find: /^three\/(.*)$/,
                replacement: path.resolve(__dirname, "node_modules/three/$1"),
            },
            {
                find: "three",
                replacement: path.resolve(__dirname, "node_modules/three"),
            },
        ],
        preserveSymlinks: false,
    },
    server: {
        fs: {
            allow: [".."],
        },
    },
});
