import log, {
    type LoggingMethod,
    type LogLevelDesc,
    type Logger
} from "loglevel";

// MARK: Log Levels:
// 0: trace
// 1: debug
// 2: info
// 3: warn
// 4: error
// 5: silent

declare global {
    interface Window {
        log: typeof log;
        setLogLevelAllLoggers: (level: LogLevelDesc) => void;
    }
}

// extend the Logger type to include getLevelName
declare module "loglevel" {
    interface Logger {
        getLevelName(): string;
    }
}

const loggerProto = Object.getPrototypeOf(log.getLogger("_")) as Logger;

loggerProto.getLevelName = function (): string {
    const level = this.getLevel();
    switch (level) {
        case 0:
            return "trace";
        case 1:
            return "debug";
        case 2:
            return "info";
        case 3:
            return "warn";
        case 4:
            return "error";
        case 5:
            return "silent";
        default:
            return "unknown";
    }
};


// expose the log object to the global scope for access in the browser console
window.log = log;

// expose a function to set the log level for all loggers
window.setLogLevelAllLoggers = (level: LogLevelDesc): void => {
    for (const logger of Object.values(log.getLoggers())) {
        logger.setLevel(level);
    }
};

const originalFactory = log.methodFactory;

// prefixes the log message with the logger name
log.methodFactory = (methodName, logLevel, loggerName): LoggingMethod => {

    const rawMethod = originalFactory(methodName, logLevel, loggerName);

    // create a method that preserves the call site
    const method = Function.prototype.bind.call(
        rawMethod,  // the function to bind
        console,  // the `this` context
        `[${String(loggerName)}]` // permanent first argument
    ) as LoggingMethod;

    // preserve the name of the method
    Object.defineProperty(method, "name", {
        value: methodName
    });

    return method;
};
log.rebuild();

export const appLogger = log.getLogger("App");
appLogger.setLevel("trace");

export const barcodeChangedLogger = log.getLogger(
    "BarcodeChanged"
);
barcodeChangedLogger.setLevel("warn");

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
barcodeImageModalSymbologyMenuLogger.setLevel("trace");

export const barcodeImageModalViewLogger = log.getLogger(
    "BarcodeImageModalView"
);
barcodeImageModalViewLogger.setLevel("trace");

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
