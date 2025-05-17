import { type ScannedBarcodeResponse } from "../types/ScannedBarcodesResponse";

import { appLogger } from "./loggers";

/**
 * Calls the function immediately, then calls it every `interval` milliseconds.
 *
 * @param func The function to call.
 * @param interval The interval in milliseconds.
 * @returns The interval ID. (The same value returned by `setInterval()`.)
 */
export function setIntervalImmediately(
    func: () => void,
    interval: number
): number {
    func();
    return setInterval(func, interval);
}

/**
 * Returns whether the platform is Apple. Apple platforms use the command key
 * as the platform modifier key, while other platforms use the control key.
 *
 * @returns `true` if the platform is Apple, `false` otherwise.
 */
export function isApplePlatform(): boolean {
    if (import.meta.env.VITE_DEBUG_NON_APPLE_PLATFORM === "true") {
        return false;
    }
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

KeyboardEvent.prototype.isPlatformModifierKey = function (): boolean {
    if (isApplePlatform()) {
        return this.metaKey;
    }
    return this.ctrlKey;
};

String.prototype.truncated = function (this: string, maxLength: number): string {
    if (this.length <= maxLength) {
        return this;
    }
    const length = Math.max(0, maxLength - 3);
    return this.slice(0, length) + "...";
};

export function prefixWithHostIfPort(title: string): string {
    if (document.location.port) {
        const host = document.location.host;
        return `[${host}] ${title}`;
    }
    return title;
}

/**
 * Converts a set to a string.
 *
 * For example:
 * ```ts
 * const set = new Set(["a", "b", "c"]);
 * console.log(setToString(set)); // "{a, b, c}"
 * ```
 * @param set The set to convert.
 * @returns The string representation of the set.
 */
export function setToString<T>(set: Set<T>): string {

    if (set.size === 0) {
        return "{}";
    }

    let result = "{";
    for (const value of set) {
        const stringValue = value instanceof Object ?
            JSON.stringify(value) :
            value;

        result += `${stringValue}, `;
    }
    // remove the last ", " from the string
    result = result.slice(0, -2);
    result += "}";
    return result;
}

/**
 * Determines if the current barcode is different from the previous barcode AND
 * if the current barcode is *NEWER* (the scanned date is more recent) than the
 * previous barcode.
 *
 * @param previousBarcode the previous barcode
 * @param currentBarcode the current barcode
 * @returns `true` if the current barcode is different from the previous barcode
 * AND if the current barcode is *NEWER* than the previous barcode; otherwise,
 * `false`. If `true`, then `currentBarcode` is non-nullish.
 */
export function latestBarcodeChanged(
    previousBarcode: ScannedBarcodeResponse | null | undefined,
    currentBarcode: ScannedBarcodeResponse | null | undefined
): currentBarcode is ScannedBarcodeResponse {

    if (!currentBarcode || currentBarcode.id === previousBarcode?.id) {
        appLogger.debug(
            "latestBarcodeChanged(): " +
            "most recent barcode has *NOT* changed at all/is null: " +
            `${JSON.stringify(currentBarcode)}`
        );
        return false;
    }

    /*
     We only want to auto-copy the most recent barcode if the most recent
     barcode is **NEWER** than the previously auto-copied barcode.

     For example, if the user deletes a barcode, then the most recent
     barcode will be older than the previously auto-copied barcode. In this
     case, we do *NOT* want to auto-copy the most recent barcode.
     */

    if (
        !previousBarcode ||
        currentBarcode.scanned_at >= previousBarcode.scanned_at
    ) {
        appLogger.debug(
            "latestBarcodeChanged(): " +
            "most *RECENT* barcode *HAS* changed from " +
            `${JSON.stringify(previousBarcode)} to ` +
            `${JSON.stringify(currentBarcode)}`
        );
        return true;
    }
    else {
        appLogger.debug(
            "latestBarcodeChanged(): " +
            "most *RECENT* barcode has *NOT* changed from " +
            `${JSON.stringify(previousBarcode)} to ` +
            `${JSON.stringify(currentBarcode)}`
        );
        return false;
    }
}


/**
 * Creates a debounced version of the provided function. The debounced function
 * delays the execution of the original function until after the specified delay
 * has elapsed since the last time the debounced function was invoked.
 *
 * The first time the debounced function is called, the wrapped function will be
 * called immediately.
 *
 * @param func The function to debounce. It will be called with the provided
 * arguments after the delay period.
 * @param delay The time in milliseconds that must elapse after the last time
 * the debounced function was invoked before the original function is called.
 * @returns A debounced version of the provided function. When invoked, it
 * resets the delay timer and schedules the function to be called after the
 * delay period.
 */
export function debounce<This, Args extends unknown[]>(
    func: (this: This, ...args: Args) => void,
    delay: number
): (this: This, ...args: Args) => void {

    let timeoutId: ReturnType<typeof setTimeout>;
    let isFirstCall = true;

    appLogger.debug("making debounced function");

    return function (this: This, ...args: Args): void {

        if (isFirstCall) {
            isFirstCall = false;
            func.apply(this, args);
            return;
        }

        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Checks if the given value is a finite number and not zero.
 *
 * @param value The value to check.
 * @returns `true` if the value is a finite number and not zero; otherwise,
 * `false`.
 */
export function isFiniteNonZero(value: number): boolean {
    return Number.isFinite(value) && value !== 0;
}

/**
 * Sleeps for the given duration in milliseconds.
 *
 * @param ms The number of milliseconds to sleep for.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

CanvasRenderingContext2D.prototype.drawPathWithCorners = function (
    corners: {
        x: number;
        y: number;
    }[]
): void {

    if (corners.length === 0) {
        return;
    }
    this.beginPath();
    this.moveTo(corners[0]!.x, corners[0]!.y);

    for (let i = 1; i < corners.length; i++) {
        this.lineTo(corners[i]!.x, corners[i]!.y);
    }

    this.closePath();
};

CanvasRenderingContext2D.prototype.rotateAboutPoint = function (
    angle: number,
    x: number,
    y: number
): void {

    this.translate(x, y);
    this.rotate(angle);
    this.translate(-x, -y);
};

CanvasRenderingContext2D.prototype.rotateAboutCenter = function (
    angle: number
): void {

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.translate(centerX, centerY);
    this.rotate(angle);
    this.translate(-centerX, -centerY);
};

/**
 * Converts degrees to radians.
 *
 * @param degrees The angle in degrees.
 * @returns The angle in radians.
 */
export function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Checks if the given string contains only ASCII characters.
 *
 * @param str The string to check.
 * @returns `true` if the string contains only ASCII characters; otherwise,
 * `false`.
 */
export function isASCII(str: string): boolean {
    return /^[\x00-\x7F]*$/.test(str);
}
