import "./UserScanRow.css";

import React, {
    useState,
    useEffect,
    useContext,
    type CSSProperties,
    type JSX,
    type ReactNode
} from "react";

import { useSearchParams } from "react-router-dom";

import { AppContext } from "../../model/AppContext";

import {
    Button,
    Stack,
    OverlayTrigger,
    Tooltip
} from "react-bootstrap";

import {
    dateDifferenceFromNow,
    formatScannedAtDate
} from "../../utils/dateFormatting";

import { BarcodeImageModalView } from "../BarcodeImageModalView";

import {
    type ScannedBarcodeResponse
} from "../../types/ScannedBarcodesResponse";

import { type ViewportSize } from "../../types/ViewportSize";

import { UserScanRowDropdownMenu } from "./UserScanRowDropdownMenu";
import { UserScanBarcodeCell } from "./UserScanBarcodeCell";

type UserScansRowProps = {
    index: number;
    barcode: ScannedBarcodeResponse;
    user: string;
    viewportSize: ViewportSize;
    isHighlighted: boolean;
    removeBarcodesFromState: (barcodeIDs: Set<string>) => void;
    setHighlightedBarcode: (barcode: ScannedBarcodeResponse) => void;
    onClickOpenLink: (url: ScannedBarcodeResponse) => void;
};

export function UserScanRow(props: UserScansRowProps): JSX.Element {

    const context = useContext(AppContext);

    const [searchParams, _] = useSearchParams();

    const [dateDifference, setDateDifference] = useState(
        dateDifferenceFromNow(props.barcode.scanned_at)
    );

    const [
        generateBarcodeModalIsOpen,
        setGenerateBarcodeModalIsOpen
    ] = useState(false);

    const [isCopying, setIsCopying] = useState(false);

    /**
     * A formatted string representing the date the barcode was scanned.
     */
    const formattedDateString = formatScannedAtDate(
        props.barcode.scanned_at
    );

    useEffect(() => {

        // console.log("UserScansRow: useEffect(): begin");

        const intervalID = setInterval(() => {
            // console.log("UserScansRow: updateDateDifference()");
            const dateDifference = dateDifferenceFromNow(
                props.barcode.scanned_at
            );
            setDateDifference(dateDifference);
        }, 5_000);

        return (): void => {
            // console.log("UserScansRow: useEffect(): cleanup");
            clearInterval(intervalID);
        };

    }, [props.barcode.scanned_at]);

    async function onClickCopyButton(): Promise<void> {

        const barcodeText = props.barcode.barcode;

        setIsCopying(true);

        try {

            await navigator.clipboard.writeText(barcodeText);
            // throw new Error("Test cannot copy to clipboard");

            console.log(
                "UserScansRow: Copied barcode to clipboard: " +
                `"${barcodeText}"`
            );
            props.setHighlightedBarcode(props.barcode);
            setTimeout(() => {
                setIsCopying(false);
            }, 250);

        } catch (error) {
            console.error(
                "UserScansRow: Error copying barcode to clipboard: " +
                `"${barcodeText}": ${error}`
            );
            setIsCopying(false);
        }

    }

    async function onClickDeleteButton(): Promise<void> {

        const barcodeID = props.barcode.id;
        props.removeBarcodesFromState(new Set([barcodeID]));

        const barcodeString = JSON.stringify(props.barcode);

        try {
            const result = await context.api!.deleteScans([barcodeID]);
            console.log(
                `Delete barcode ${barcodeString} result: ${result}`
            );
        } catch (error) {
            console.error(
                `Error deleting barcode: "${barcodeString}":`, error
            );
        }

    }

    function didClickGenerateBarcode(): void {
        setGenerateBarcodeModalIsOpen(true);
    }

    function closeGenerateBarcodeModal(): void {
        setGenerateBarcodeModalIsOpen(false);
        console.log(
            "Generate Barcode Modal is now closed"
        );
    }

    function copyButtonStyle(): CSSProperties {
        return {
            backgroundColor: props.isHighlighted ? "#0fd626" : "lightblue",
            transform: isCopying ? "translateY(3px)" : undefined,
        };
    }

    // MARK: - Components -

    function renderDeleteButton(): ReactNode {
        return (
            props.viewportSize?.width > 800 ? (
                <td
                    className="user-scan-row-delete-button-cell"
                >
                    <Button
                        variant="danger"
                        className="user-scan-row-delete-button"
                        onClick={onClickDeleteButton}
                    >
                        <i className="fa fa-trash"></i>
                    </Button>
                </td>
            ) : null
        );
    }

    return (
        <tr
            data-barcode-id={props.barcode.id}
        >
            <BarcodeImageModalView
                barcode={props.barcode}
                generateBarcodeModalIsOpen={generateBarcodeModalIsOpen}
                closeGenerateBarcodeModal={closeGenerateBarcodeModal}
            />

            <td style={{
                textAlign: "center",
            }}>

                <Stack
                    direction="horizontal"
                    gap={0}
                >
                    {/* --- Copy Button --- */}
                    <button
                        className="copy-button"
                        style={copyButtonStyle()}
                        onClick={onClickCopyButton}
                    >
                        <i className="fa-solid fa-copy"></i>
                    </button>
                    {/* --- Link Button --- */}
                    <button
                        className="open-link-button"
                        onClick={() => {
                            return props.onClickOpenLink(
                                props.barcode
                            );
                        }}
                    >
                        <i className="fa fa-link"></i>
                    </button>

                    <UserScanRowDropdownMenu
                        didClickGenerateBarcode={didClickGenerateBarcode}
                        onClickDeleteButton={onClickDeleteButton}
                    />

                </Stack>
            </td>
            {/* --- Barcode Cell --- */}
            <UserScanBarcodeCell
                barcode={props.barcode}
                dateDifference={dateDifference}
                viewportSize={props.viewportSize}
                searchParams={searchParams}
                formattedDateString={formattedDateString}
            />
            {/* --- Time Cell (>600px) --- */}
            {
                props.viewportSize?.width > 600 ? (
                    <td>
                        <OverlayTrigger
                            placement="bottom"
                            delay={{ show: 500, hide: 250 }}
                            overlay={
                                <Tooltip>
                                    {formattedDateString}
                                </Tooltip>
                            }
                        >
                            <span>
                                {dateDifference}
                            </span>
                        </OverlayTrigger>
                    </td>
                ) : null
            }

            {/* --- Delete Button (>800px) --- */}
            {renderDeleteButton()}
        </tr>
    );

}
