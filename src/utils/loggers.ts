import log, { type MethodFactory } from "loglevel";

declare global {
    interface Window {
        log: typeof log;
    }
}

// expose the log object to the global scope for access in the browser console
window.log = log;

const originalFactory = log.methodFactory;

// prefixes the log message with the logger name
log.methodFactory = (methodName, logLevel, loggerName): MethodFactory => {

    const rawMethod = originalFactory(methodName, logLevel, loggerName);

    // create a method that preserves the call site
    const method = Function.prototype.bind.call(
        rawMethod,  // the function to bind
        console,  // the `this` context
        `[${String(loggerName)}]` // permanent first argument
    ) as MethodFactory;

    // preserve the name of the method
    Object.defineProperty(method, "name", {
        value: methodName
    });

    return method;
};
log.rebuild();

export const appLogger = log.getLogger("App");
appLogger.setLevel("trace");

export const barcodeScannerDialogLogger = log.getLogger(
    "BarcodeScannerDialog"
);
barcodeScannerDialogLogger.setLevel("warn");

export const barcodeScannerLoginViewLogger = log.getLogger(
    "BarcodeScannerLoginView"
);
barcodeScannerLoginViewLogger.setLevel("warn");

export const barcodeScannerViewLogger = log.getLogger(
    "BarcodeScannerView"
);
barcodeScannerViewLogger.setLevel("warn");

export const userScanBarcodeCellLogger = log.getLogger(
    "UserScanBarcodeCell"
);
userScanBarcodeCellLogger.setLevel("warn");

export const userScanRowLogger = log.getLogger(
    "UserScanRow"
);
userScanRowLogger.setLevel("warn");

export const userScanRowDropdownMenuLogger = log.getLogger(
    "UserScanRowDropdownMenu"
);
userScanRowDropdownMenuLogger.setLevel("warn");

export const barcodeImageModalSymbologyMenuLogger = log.getLogger(
    "BarcodeImageModalSymbologyMenu"
);

export const barcodeImageModalViewLogger = log.getLogger(
    "BarcodeImageModalView"
);
barcodeImageModalViewLogger.setLevel("warn");

export const codeBlockLogger = log.getLogger(
    "CodeBlock"
);
codeBlockLogger.setLevel("warn");

export const configureLinkModalLogger = log.getLogger(
    "ConfigureLinkModal"
);
configureLinkModalLogger.setLevel("warn");

export const enterBarcodeViewLogger = log.getLogger(
    "EnterBarcodeView"
);
enterBarcodeViewLogger.setLevel("warn");

export const homeViewLogger = log.getLogger(
    "HomeView"
);
homeViewLogger.setLevel("warn");

export const mainDropdownMenuLogger = log.getLogger(
    "MainDropdownMenu"
);
mainDropdownMenuLogger.setLevel("warn");

export const mainNavbarLogger = log.getLogger(
    "MainNavbar"
);
mainNavbarLogger.setLevel("warn");

export const setupViewLogger = log.getLogger(
    "SetupView"
);
setupViewLogger.setLevel("warn");

export const userScansRootLogger = log.getLogger(
    "UserScansRoot"
);
userScansRootLogger.setLevel("warn");

export const userScansTableLogger = log.getLogger(
    "UserScansTable"
);
userScansTableLogger.setLevel("warn");

export const userScansToastLogger = log.getLogger(
    "UserScansToast"
);
userScansToastLogger.setLevel("warn");

export const useUrlFragmentParamLogger = log.getLogger(
    "useURLFragmentParam"
);
useUrlFragmentParamLogger.setLevel("warn");
