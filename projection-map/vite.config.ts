import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    resolve: {
        alias: [
            {
                find: /^three\/(.*)$/,
                replacement: path.resolve(__dirname, "node_modules/three/$1"),
            },
            {
                find: "three",
                replacement: path.resolve(__dirname, "node_modules/three"),
            },
        ],
        preserveSymlinks: false, // Try setting this to false to let Vite "flatten" the file structure
    },
    server: {
        fs: {
            // Allow Vite to serve files from the Shared folder outside the project root
            allow: [".."],
        },
    },
});
