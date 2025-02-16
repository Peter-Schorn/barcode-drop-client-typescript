/**
 * Represents a single scanned barcode from the database.
 *
 * More specifically, it represents a single row from the `barcodes` table,
 * with all columns included.
 */
export type ScannedBarcodeResponse = {

    /** The ID of the scanned barcode. */
    id: string;

    /** The date the barcode was scanned. */
    scanned_at: Date;

    /** The scanned barcode. */
    barcode: string;

    /** The username of the user who scanned the barcode. */
    username: string;

};

/**
 * Represents an array of scanned barcodes from the database.
 *
 * More specifically, it represents an array of rows from the `barcodes` table,
 * with all columns included.
 *
 * Used in GET /scans/:user
 */
export type ScannedBarcodesResponse = ScannedBarcodeResponse[];
