/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BACKEND_URL: string;
    readonly VITE_DISABLE_WEBSOCKET?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
