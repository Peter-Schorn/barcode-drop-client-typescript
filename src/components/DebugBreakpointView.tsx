import { type ReactNode } from "react";

/**
 * Shows the bootstrap breakpoints in the top right corner of the screen. Only
 * visible when the VITE_SHOW_BREAKPOINT_VIEW environment variable is set to
 * "true".
 */
export function DebugBreakpointView(): ReactNode {

    if (import.meta.env.VITE_SHOW_BREAKPOINT_VIEW !== "true") {
        return null;
    }

    return (
        <div
            className="position-fixed text-nowrap rounded-3 p-1 m-3 bg-info opacity-50 top-0 end-0"
            style={{ zIndex: "100" }}
        >
            <div className="d-block d-sm-none">xs</div>
            <div className="d-none d-sm-block d-md-none">sm</div>
            <div className="d-none d-md-block d-lg-none">md</div>
            <div className="d-none d-lg-block d-xl-none">lg</div>
            <div className="d-none d-xl-block d-xxl-none">xl</div>
            <div className="d-none d-xxl-block">xxl</div>
        </div>
    );

}
