import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig((config) => {

    const plugins: PluginOption[] = [react()];

    if (config.mode === "https") {
        plugins.push(basicSsl());
    }

    return {
        plugins: plugins,
        server: {
            open: "/scans/schornpe",
            host: true,
            https: config.mode === "https"
        }
    };
});
