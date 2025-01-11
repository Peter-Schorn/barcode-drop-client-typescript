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
