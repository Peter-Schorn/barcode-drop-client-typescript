import React, { type JSX } from "react";

import { Table } from "react-bootstrap";

import { UserScanRow } from "./UserScanRow";

import {
    type ScannedBarcodeResponse,
    type ScannedBarcodesResponse
} from "../types/ScannedBarcodesResponse";

import { type ViewportSize } from "../types/ViewportSize";

type UserScansTableProps = {
    barcodes: ScannedBarcodesResponse;
    user: string;
    highlightedBarcode: ScannedBarcodeResponse | null;
    viewportSize: ViewportSize;
    removeBarcodesFromState: (barcodeIDs: Set<string>) => void;
    setHighlightedBarcode: (barcode: ScannedBarcodeResponse) => void;
    onClickOpenLink: (url: ScannedBarcodeResponse) => void;
};


export default function UserScansTable(props: UserScansTableProps): JSX.Element {

    function barcodeIsHighlighted(
        barcode: ScannedBarcodeResponse
    ): boolean {
        return props.highlightedBarcode?.id === barcode.id;
    }

    return (
        <Table
            className="barcode-table border-dark"
            striped bordered hover
            style={{ maxWidth: "100%" }}
        >
            <thead>
                <tr>
                    <th
                        style={{ width: "100px" }}
                    >
                        {/* --- Primary Buttons --- */}
                    {/* </th> */}
                    {/* <th style={{ width: "100px" }}> */}
                        {/* --- Context Menu --- */}
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
        </Table>
    );

}
