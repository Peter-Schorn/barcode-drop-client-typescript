import { type ScannedBarcodeResponse } from "./ScannedBarcodesResponse";

export type WriteBarcodeToClipboardOptions = {
    showNotification: boolean;
    highlight: boolean;
    barcode: ScannedBarcodeResponse;
};
