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

/**
 * Formats the date as a string with the time component before the date
 * component. For example: "1:20:22 PM, 3/16/2025".
 *
 * @param date The date to format.
 * @returns The formatted date string.
 */
export function formatScannedAtDate(date: Date): string {
    const time = date.toLocaleTimeString();
    const fullDate = date.toLocaleDateString();
    return `${time}, ${fullDate}`;
}
