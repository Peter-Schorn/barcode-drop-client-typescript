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

/**
 * Returns a string representing the difference between the current date
 * and the date passed in.
 *
 * @param date The date to compare to the current date.
 * @returns A string representing the difference between the current date
 * and the date passed in.
 */
export function dateDifferenceFromNow(date: Date): string {

    const now = new Date();
    const diffMS = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMS / 1_000);

    if (diffSecs <= 3) {
        return "Just now";
    }
    if (diffSecs <= 10 /* 3 - 10 seconds */) {
        return "About 5 seconds ago";
    }
    if (diffSecs <= 20 /* 10 - 20 seconds */) {
        return "About 15 seconds ago";
    }
    if (diffSecs <= 45 /* 20 - 45 seconds */) {
        return "About 30 seconds ago";
    }
    if (diffSecs <= 120 /* (2 minutes) 45 seconds - 2 minutes */) {
        return "About a minute ago";
    }
    if (diffSecs <= 300 /* (5 minutes) 2 - 5 minutes */) {
        return "A few minutes ago";
    }
    if (diffSecs <= 600 /* (10 minutes) 5 - 10 minutes */) {
        return "About 5 minutes ago";
    }
    if (diffSecs <= 900 /* (15 minutes) 10 - 15 minutes */) {
        return "About 10 minutes ago";
    }
    if (diffSecs <= 1_800 /* (30 minutes) 15 - 30 minutes */) {
        return "About 15 minutes ago";
    }
    if (diffSecs <= 3_600 /* (1 hours) 30 minutes - 1 hour */) {
        return "About 30 minutes ago";
    }
    if (diffSecs <= 7_200 /* (2 hours) 1 - 2 hours */) {
        return "About an hour ago";
    }
    if (diffSecs <= 14_400 /* (4 hours) 2 - 4 hours */) {
        return "About two hours ago";
    }
    if (diffSecs <= 21_600 /* (6 hours) 4 - 6 hours */) {
        return "About four hours ago";
    }
    if (diffSecs <= 86_400 /* (24 hours) 6 - 24 hours */) {
        return "More than six hours ago";
    }

    // > 24 hours
    return "More than one day ago";

}
