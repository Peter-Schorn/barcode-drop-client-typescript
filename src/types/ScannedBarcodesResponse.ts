/**
 * Represents a single scanned barcode from the database.
 *
 * More specifically, it represents a single row from the `barcodes` table,
 * with all columns included.
 */
export type ScannedBarcodeResponse = {
    id: string;
    scanned_at: string;
    barcode: string;
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
