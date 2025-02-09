import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode, ssrBuild }) => {
    const env = loadEnv(mode, process.cwd())
    return {
        root: "client",
        build: {
            outDir: "../dist",
            emptyOutDir: true
        },
        publicDir: "static",
        base: env.VITE_BASE_URL
    };
})