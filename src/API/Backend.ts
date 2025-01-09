import axios, { type AxiosInstance } from "axios";
import {
    type ScannedBarcodesResponse
} from "../types/ScannedBarcodesResponse.ts";
import {
    type GetRequestOptions,
    type APIRequestOptions,
    type DeleteUserScansOptions,
    type ScanBarcodeOptions
} from "../types/Backend.ts";


export class Backend {

    backendURL: URL;
    httpClient: AxiosInstance;

    constructor() {
        this.backendURL = new URL(import.meta.env.VITE_BACKEND_URL as string);
        this.httpClient = axios.create();
    }

    /**
     * Get all of the scans for a user.
     *
     * @param user the user to get the scans for
     * @returns an array of scan objects in JSON format
     */
    async getUserScans(user: string): Promise<ScannedBarcodesResponse> {
        return await this._get(
            `/scans/${user}`
        ) as ScannedBarcodesResponse;
    }

    /**
     * Scan a barcode for a user.
     *
     * @param options the options for scanning a barcode
     * @param options.user the user to scan the barcode for
     * @param options.barcode the barcode to scan
     * @param [options.id] the id of the barcode
     * @returns the response from the server
     */
    async scanBarcode(
        {
            user,
            barcode,
            id
        }: ScanBarcodeOptions
    ): Promise<string> {

        return await this._apiRequest({
            method: "POST",
            path: `/scan/${user}`,
            body: {
                barcode: barcode,
                id: id
            }
        }) as string;
    }

    /**
     * Delete scans by ID.
     *
     * @param scanIds an array of scan IDs to delete
     * @returns the response from the server
     */
    async deleteScans(scanIds: string[]): Promise<void> {
        return await this._apiRequest({
            method: "DELETE",
            path: "/scans",
            body: {
                ids: scanIds
            }
        }) as void;
    }

    /**
     * Delete all scans for a user, or just those older than t seconds before
     * the current date.
     *
     * @param options the options for deleting user scans
     * @param options.user the user to delete the scans for
     * @param [options.olderThan] the number of seconds before the
     * current date to delete scans for
     * @returns the response from the server
     */
    async deleteUserScans(
        {
            user,
            olderThan
        }: DeleteUserScansOptions
    ): Promise<void> {
        // !olderThan returns false for 0
        if (olderThan !== undefined) {
            return await this._apiRequest({
                method: "DELETE",
                path: `/scans/${user}/older`,
                queryParams: {
                    seconds: olderThan.toString()
                }
            }) as void;
        }
        else {
            return await this._apiRequest({
                method: "DELETE",
                path: `/scans/${user}`
            }) as void;
        }
    }

    // WARNING: NOT implemented on the backend
    /**
     * Gets all splash texts.
     *
     * @returns an array of splash text objects in JSON format
     */
    async getSplashTexts(): Promise<any> {
        return await this._get(
            "/splash-text",
        );
    }

    // WARNING: NOT implemented on the backend
    /**
     * Gets a random splash text.
     *
     * @returns a splash text object in JSON format
     */
    async getRandomSplashText(): Promise<any> {
        const splashText = "This is a random splash text.";
        return Promise.resolve(splashText);
        // return await this._get(
        //     "/splash-text/random",
        // );
    }

    // MARK: Wrappers

    async _get(
        path: string,
        {
            queryParams,
            headers
        }: GetRequestOptions = {}
    ): Promise<any> {
        return await this._apiRequest({
            method: "GET",
            path: path,
            queryParams: queryParams,
            headers: headers
        });
    }

    async _apiRequest({
        method,
        path,
        queryParams,
        body,
        headers
    }: APIRequestOptions): Promise<any> {

        const response = await this.httpClient.request({
            baseURL: this.backendURL.toString(),
            method: method,
            url: path,
            headers: headers,
            params: queryParams,
            data: body
        });
        return response.data;
    }

}
