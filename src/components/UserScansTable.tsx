import "./UserScansTable.css";

import React, { type JSX } from "react";

import { UserScanRow } from "./UserScanRow/UserScanRow";

import {
    type ScannedBarcodeResponse,
    type ScannedBarcodesResponse
} from "../types/ScannedBarcodesResponse";

import { type ViewportSize } from "../types/ViewportSize";

// import { userScansTableLogger as logger } from "../utils/loggers";

type UserScansTableProps = {
    barcodes: ScannedBarcodesResponse;
    user: string;
    highlightedBarcode: ScannedBarcodeResponse | null;
    viewportSize: ViewportSize;
    removeBarcodesFromState: (barcodeIDs: Set<string>) => void;
    setHighlightedBarcode: (barcode: ScannedBarcodeResponse) => void;
    onClickOpenLink: (url: ScannedBarcodeResponse) => void;
};


export function UserScansTable(props: UserScansTableProps): JSX.Element {

    function barcodeIsHighlighted(
        barcode: ScannedBarcodeResponse
    ): boolean {
        return props.highlightedBarcode?.id === barcode.id;
    }

    return (
        <table
            className="user-scans-table"
        >
            <thead>
                <tr>
                    <th
                        style={{ width: "100px" }}
                    >
                        {/* buttons and context menu */}
                    </th>
                    <th>Barcode</th>
                    { props.viewportSize.width > 600 ? (
                        <th>Time</th>
                    ) : null }
                    { props.viewportSize.width > 800 ? (
                        <th style={{ width: "80px" }}>Delete</th>
                    ) : null }
                </tr>
            </thead>
            <tbody>
                {props.barcodes.map((barcode, index) =>
                    // TODO: These parameters could be passed automatically
                    // TODO: by the parent component via context.
                    <UserScanRow
                        key={barcode.id}
                        index={index}
                        barcode={barcode}
                        user={props.user}
                        viewportSize={props.viewportSize}
                        isHighlighted={barcodeIsHighlighted(barcode)}
                        removeBarcodesFromState={
                            props.removeBarcodesFromState
                        }
                        setHighlightedBarcode={
                            props.setHighlightedBarcode
                        }
                        onClickOpenLink={props.onClickOpenLink}
                    />
                )}
            </tbody>
        </table>
    );

}
