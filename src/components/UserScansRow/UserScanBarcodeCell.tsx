import { type JSX, type ReactNode } from "react";

import { type ViewportSize } from "../../types/ViewportSize";
import { type ScannedBarcodeResponse } from "../../types/ScannedBarcodesResponse";

type UserScanBarcodeCellProps = {
    barcode: ScannedBarcodeResponse;
    dateDifference: string;
    viewportSize: ViewportSize;
    searchParams: URLSearchParams;
};

export function UserScanBarcodeCell(
    props: UserScanBarcodeCellProps
): JSX.Element {

    let smallSize = false;
    if (props.viewportSize.width <= 600) {
        smallSize = true;
    }

    function barcodeIDdebugText(smallSize: boolean): ReactNode {

            if (props.searchParams.get("debug") === "true") {
                return (
                    <span
                        className="text-secondary"
                        style={{ fontSize: "12px" }}
                    >
                        {smallSize ? "•" : null}
                        {` (${props.barcode.id})`}
                    </span>
                );
            }
            else {
                return null;
            }

        }

    return (
        <td>
            <span
                className="barcode-text line display-linebreaks text-break"
            >
                {props.barcode.barcode}
            </span>
            {smallSize ? (
                <span
                    className="text-secondary px-2"
                    style={{
                        fontSize: "12px"
                    }}
                >
                    {"• "}
                    {props.dateDifference}
                </span>
            ) : null}
            {/* --- BARCODE ID --- */}
            {barcodeIDdebugText(smallSize)}
        </td>
    );

}
