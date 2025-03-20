import { type JSX, type ReactNode } from "react";

import {
    OverlayTrigger,
    Tooltip
} from "react-bootstrap";

import { type ViewportSize } from "../../types/ViewportSize";
import { type ScannedBarcodeResponse } from "../../types/ScannedBarcodesResponse";

type UserScanBarcodeCellProps = {
    barcode: ScannedBarcodeResponse;
    dateDifference: string;
    viewportSize: ViewportSize;
    searchParams: URLSearchParams;
    formattedDateString: string;
};

export function UserScanBarcodeCell(
    props: UserScanBarcodeCellProps
): JSX.Element {

    let smallSize = false;
    if (props.viewportSize.width <= 600) {
        smallSize = true;
    }

    function barcodeIDdebugText(): ReactNode {

        if (props.searchParams.get("debug") === "true") {
            return (
                <span
                    className="text-secondary"
                    style={{ fontSize: "12px" }}
                >
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
                <OverlayTrigger
                    placement="bottom"
                    delay={{ show: 500, hide: 250 }}
                    overlay={
                        <Tooltip>
                            {props.formattedDateString}
                        </Tooltip>
                    }
                >
                    <span
                        className="text-secondary"
                        style={{
                            fontSize: "12px"
                        }}
                    >
                        {" • "}
                        {props.dateDifference}
                    </span>
                </OverlayTrigger>
            ) : null}
            {/* --- BARCODE ID --- */}
            {barcodeIDdebugText()}
        </td>
    );

}
