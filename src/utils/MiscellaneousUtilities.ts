import { type ScannedBarcodeResponse } from "../types/ScannedBarcodesResponse";

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

export function prefixTitleWithDocumentHostIfPort(title: string): string {
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
        console.log(
            "UserScansRoot.latestBarcodeChanged(): " +
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
        console.log(
            "UserScansRoot.latestBarcodeChanged(): " +
            "most *RECENT* barcode *HAS* changed from " +
            `${JSON.stringify(previousBarcode)} to ` +
            `${JSON.stringify(currentBarcode)}`
        );
        return true;
    }
    else {
        console.log(
            "UserScansRoot.latestBarcodeChanged(): " +
            "most *RECENT* barcode has *NOT* changed from " +
            `${JSON.stringify(previousBarcode)} to ` +
            `${JSON.stringify(currentBarcode)}`
        );
        return false;
    }
}
