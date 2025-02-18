import React, {
    useState,
    useEffect,
    useContext,
    type CSSProperties,
    type JSX,
    type ReactNode
} from "react";

import { useSearchParams } from "react-router-dom";

import { AppContext } from "../model/AppContext";

import { Button, Dropdown, Stack } from "react-bootstrap";

import {
    dateDifferenceFromNow
} from "../utils/MiscellaneousUtilities";

import { BarcodeImageModalView } from "./BarcodeImageModalView";

import {
    type ScannedBarcodeResponse
} from "../types/ScannedBarcodesResponse";

import { type ViewportSize } from "../types/ViewportSize";

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
    const formattedDateString = props.barcode.scanned_at.toLocaleString();

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
            padding: "6px 15px",
            margin: "0px 0px 0px 0px",
            borderTop: "1px solid black",
            borderBottom: "1px solid black",
            borderLeft: "1px solid black",
            borderRight: "0.5px solid black",
            borderRadius: "5px 0px 0px 5px",
            color: "black",

            // borderLeft: isHighlighted ? "1px solid green" : "1px solid",
            // borderTop: isHighlighted ? "1px solid green" : "1px solid",
            // borderBottom: isHighlighted ? "1px solid green" : "1px solid",
            transform: isCopying ? "translateY(3px)" : undefined,
            transition: "all 0.5s ease-out"
        };
    }

    // MARK: - Components -

    function barcodeIDdebugText(smallSize: boolean): ReactNode {

        if (searchParams.get("debug") === "true") {
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

    function renderDeleteButton(): JSX.Element {
        return (
            <Button
                style={{
                    margin: "5px 5px",
                    backgroundColor: "#e84846"
                }}
                onClick={onClickDeleteButton}
            >
                <i className="fa fa-trash"></i>
            </Button>
        );
    }

    function renderBarcodeCell(): JSX.Element {

        let smallSize = false;
        if (props.viewportSize.width <= 600) {
            smallSize = true;
        }

        return (
            <td>
                <span
                    className="barcode-text line display-linebreaks text-break"
                >
                    {props.barcode.barcode}
                </span>
                {smallSize ? (
                    // <div>
                    <span
                        className="text-secondary px-2"
                        style={{
                            fontSize: "12px"
                        }}
                    >
                        {"• "}
                        {dateDifference}
                    </span>
                    // </div>
                ) : null}
                {/* --- BARCODE ID --- */}
                {barcodeIDdebugText(smallSize)}
            </td>
        );
    }

    function renderDropdownMenu(): JSX.Element {
        return (
            <Dropdown className="ms-1">
                <Dropdown.Toggle variant="success" className="text-center">
                    <i className="fa fa-ellipsis-v px-2" />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Dropdown.Item
                        onClick={didClickGenerateBarcode}
                        style={{
                            color: "#076b05"
                        }}
                    >
                        <div className="hstack gap-3">
                            <i className="fa-solid fa-barcode"></i>
                            <span>Generate Barcode</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {/* {this.copyAsCSVKeyboardShortcutString()} */}
                            </span>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Divider className="" />
                    <Dropdown.Item
                        style={{
                            color: "#ed432d",
                            // color: "white",
                            // backgroundColor: "#ed432d"
                        }}
                        onClick={onClickDeleteButton}
                    >
                        <div
                            className="hstack gap-3"
                            style={{
                                // padding: "5px 10px",
                            }}
                        >
                            <i className="fa fa-trash"></i>
                            <span>Delete</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {/* {this.copyAsCSVKeyboardShortcutString()} */}
                            </span>
                        </div>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        );
    }

    return (
        <tr
            data-barcode-id={props.barcode.id}
            key={props.barcode.id}
        >
            {/* {this.renderBarcodeImageModal()} */}

            <BarcodeImageModalView
                barcode={props.barcode}
                generateBarcodeModalIsOpen={generateBarcodeModalIsOpen}
                closeGenerateBarcodeModal={closeGenerateBarcodeModal}
            />

            <td style={{
                textAlign: "center",
                // minWidth: "120px",
                // maxHeight: "10px"
                // height: "20px"
                // margin: "2px !important",
                // padding: "2px !important"
            }}>

                <Stack
                    direction="horizontal"
                    className=""
                    gap={0}
                >
                    {/* --- Copy Button --- */}
                    <button
                        // variant=""
                        className="copy-button"
                        style={copyButtonStyle()}
                        onClick={onClickCopyButton}
                    >
                        {/* span>Copy</span> */}
                        <i className="fa-solid fa-copy"></i>
                    </button>
                    {/* --- Link Button --- */}
                    <button
                        className="link-button"
                        onClick={() => {
                            return props.onClickOpenLink(
                                props.barcode
                            );
                        }}
                        style={{
                            padding: "6px 10px",
                            margin: "0px 0px 0px 0px",
                            color: "black",
                            backgroundColor: "grey",
                            borderTop: "1px solid black",
                            borderBottom: "1px solid black",
                            borderLeft: "0.5px solid black",
                            borderRight: "1px solid black",
                            borderRadius: "0px 5px 5px 0px"
                        }}
                    >
                        <i className="fa fa-link"></i>
                    </button>

                    {renderDropdownMenu()}

                </Stack>
                {/* --- Barcode Image Modal --- */}
            </td>
            {/* --- Barcode Cell --- */}
            {renderBarcodeCell()}
            {/* --- Time Cell (>600px) --- */}
            {
                props.viewportSize?.width > 600 ? (
                    <td
                        data-toggle="tooltip"
                        data-placement="top"
                        title={formattedDateString}
                    >
                        {dateDifference}
                    </td>
                ) : null
            }

            {/* --- Delete Button (>800px) --- */}
            {
                props.viewportSize?.width > 800 ? (
                    <td
                        style={{
                            textAlign: "center",
                        }}
                        data-toggle="tooltip"
                        data-placement="top"
                        title="Delete this barcode"
                    >
                        {/* TODO: ternary for viewport size should be within
                        renderDeleteButton */}
                        {renderDeleteButton()}
                    </td>
                ) : null
            }
        </tr>
    );

}
