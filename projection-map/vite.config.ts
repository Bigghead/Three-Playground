import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            // Use 'join' to ensure absolute pathing is bulletproof
            three: path.resolve(__dirname, "node_modules/three"),
        },
        // This is the most important setting for your specific setup
        preserveSymlinks: true,
    },
    server: {
        fs: {
            // Allow Vite to serve files from the Shared folder outside the project root
            allow: [".."],
        },
    },
});
