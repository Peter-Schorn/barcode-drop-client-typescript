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

        /**
         * Sets the log level only in development mode.
         */
        setDevelopmentLogLevel(level: LogLevelDesc): void;
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

loggerProto.setDevelopmentLogLevel = function (level: LogLevelDesc): void {
    if (import.meta.env.PROD) {
        return;
    }
    this.setLevel(level);
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
        `[${String(loggerName)}]` // permanent first argument: the logger name
    ) as LoggingMethod;

    // preserve the name of the method
    Object.defineProperty(method, "name", {
        value: methodName
    });

    return method;
};
log.rebuild();

export const appLogger = log.getLogger("App");
appLogger.setDevelopmentLogLevel("trace");

export const barcodeChangedLogger = log.getLogger(
    "BarcodeChanged"
);
barcodeChangedLogger.setDevelopmentLogLevel("warn");

export const webSocketLogger = log.getLogger(
    "WebSocket"
);
webSocketLogger.setDevelopmentLogLevel("warn");

export const barcodeScannerDialogLogger = log.getLogger(
    "BarcodeScannerDialog"
);
barcodeScannerDialogLogger.setDevelopmentLogLevel("warn");

export const barcodeScannerLoginViewLogger = log.getLogger(
    "BarcodeScannerLoginView"
);
barcodeScannerLoginViewLogger.setDevelopmentLogLevel("warn");

export const barcodeScannerViewLogger = log.getLogger(
    "BarcodeScannerView"
);
barcodeScannerViewLogger.setDevelopmentLogLevel("warn");

export const userScanBarcodeCellLogger = log.getLogger(
    "UserScanBarcodeCell"
);
userScanBarcodeCellLogger.setDevelopmentLogLevel("warn");

export const userScanRowLogger = log.getLogger(
    "UserScanRow"
);
userScanRowLogger.setDevelopmentLogLevel("warn");

export const userScanRowDropdownMenuLogger = log.getLogger(
    "UserScanRowDropdownMenu"
);
userScanRowDropdownMenuLogger.setDevelopmentLogLevel("warn");

export const barcodeImageModalSymbologyMenuLogger = log.getLogger(
    "BarcodeImageModalSymbologyMenu"
);
barcodeImageModalSymbologyMenuLogger.setDevelopmentLogLevel("trace");

export const barcodeImageModalViewLogger = log.getLogger(
    "BarcodeImageModalView"
);
barcodeImageModalViewLogger.setDevelopmentLogLevel("trace");

export const codeBlockLogger = log.getLogger(
    "CodeBlock"
);
codeBlockLogger.setDevelopmentLogLevel("warn");

export const configureLinkModalLogger = log.getLogger(
    "ConfigureLinkModal"
);
configureLinkModalLogger.setDevelopmentLogLevel("warn");

export const enterBarcodeViewLogger = log.getLogger(
    "EnterBarcodeView"
);
enterBarcodeViewLogger.setDevelopmentLogLevel("warn");

export const homeViewLogger = log.getLogger(
    "HomeView"
);
homeViewLogger.setDevelopmentLogLevel("warn");

export const mainDropdownMenuLogger = log.getLogger(
    "MainDropdownMenu"
);
mainDropdownMenuLogger.setDevelopmentLogLevel("warn");

export const mainNavbarLogger = log.getLogger(
    "MainNavbar"
);
mainNavbarLogger.setDevelopmentLogLevel("warn");

export const setupViewLogger = log.getLogger(
    "SetupView"
);
setupViewLogger.setDevelopmentLogLevel("warn");

export const userScansRootLogger = log.getLogger(
    "UserScansRoot"
);
userScansRootLogger.setDevelopmentLogLevel("warn");

export const userScansTableLogger = log.getLogger(
    "UserScansTable"
);
userScansTableLogger.setDevelopmentLogLevel("warn");

export const userScansToastLogger = log.getLogger(
    "UserScansToast"
);
userScansToastLogger.setDevelopmentLogLevel("warn");

export const useUrlFragmentParamLogger = log.getLogger(
    "useURLFragmentParam"
);
useUrlFragmentParamLogger.setDevelopmentLogLevel("warn");
