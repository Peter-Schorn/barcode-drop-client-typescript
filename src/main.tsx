import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { appLogger } from "./utils/loggers.ts";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);


if (import.meta.hot) {
    import.meta.hot.on("vite:afterUpdate", () => {
        setTimeout(() => {
            appLogger.info("Vite HMR: App updated");
            window.dispatchEvent(new Event("vite:after-update"));
        }, 0);
    });
}
