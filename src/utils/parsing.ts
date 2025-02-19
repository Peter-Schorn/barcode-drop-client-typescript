

/**
 * A reviver function for parsing JSON data representing scanned barcodes(s).
 *
 * Converts the value for the `scanned_at` key to a `Date` object.
 *
 * @param key the key in the JSON data
 * @param value the value for the specified key in the JSON data
 * @returns the value converted to a `Date` object if the key is `scanned_at`;
 * otherwise, the original value
 */
export function scannedBarcodesReviver(key: string, value: unknown): unknown {
    if (key === "scanned_at" && typeof value === "string") {
        return new Date(value);
    }
    return value;
}
