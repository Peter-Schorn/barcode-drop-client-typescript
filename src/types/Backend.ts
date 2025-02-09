import {
    type Method,
    type AxiosResponseTransformer
} from "axios";

/** The options for `Backend.prototype._get` */
export type GetRequestOptions = {
    queryParams?: Record<string, string>;
    headers?: Record<string, string>;
    responseTransformer?: AxiosResponseTransformer;
};

/** The options for `Backend.prototype._apiRequest` */
export type APIRequestOptions = {
    method: Method;
    path: string;
    queryParams?: Record<string, string>;
    body?: any;
    headers?: Record<string, string>;
    responseTransformer?: AxiosResponseTransformer;
};

/** The options for `Backend.prototype.deleteUserScans` */
export type DeleteUserScansOptions = {
    user: string;
    olderThan?: number;
};

/** The options for `Backend.prototype.scanBarcode` */
export type ScanBarcodeOptions = {
    user: string;
    barcode: string;
    id?: string;
};
