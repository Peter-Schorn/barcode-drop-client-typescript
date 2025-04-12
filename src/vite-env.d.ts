/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BACKEND_URL: string;
    readonly VITE_BACKEND_WEBSOCKET_URL: string;
    readonly VITE_DISABLE_WEBSOCKET?: string;
    readonly VITE_DEBUG_NON_APPLE_PLATFORM?: string;
    readonly VITE_SHOW_BREAKPOINT_VIEW?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
