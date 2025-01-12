import React, { type CSSProperties, type JSX } from "react";
import { Component } from "react";

import { AppContext } from "../Model/AppContext";

import { Button, Dropdown, Stack } from "react-bootstrap";

import { setIntervalImmediately } from "../MiscellaneousUtilities";

import BarcodeImageModalView from "./BarcodeImageModalView";

import {
    type ScannedBarcodeResponse
} from "../types/ScannedBarcodesResponse";

import { type UserScansRootRouter } from "../types/UserScansRootRouter";

import { type ViewportSize } from "../types/ViewportSize";

type UserScansRowProps = {
    index: number;
    barcode: ScannedBarcodeResponse;
    user: string;
    viewportSize: ViewportSize;
    isHighlighted: boolean;
    // TODO: Don't pass router down through the component tree.
    // TODO: Use `useParams` and `useSearchParams` instead.
    router: UserScansRootRouter;
    removeBarcodesFromState: (barcodeIDs: Set<string>) => void;
    setHighlightedBarcode: (barcode: ScannedBarcodeResponse) => void;
    onClickOpenLink: (url: ScannedBarcodeResponse) => void;
};

type UserScansRowState = {
    dateDifference: string;
    generateBarcodeModalIsOpen: boolean;
    isCopying: boolean;
};

export default class UserScansRow extends Component<UserScansRowProps, UserScansRowState> {

    static override contextType = AppContext;

    declare context: React.ContextType<typeof AppContext>;

    // can't use `null` because `clearInterval` takes `number | undefined`
    intervalID: number | undefined;

    /**
     * A formatted string representing the date the barcode was scanned.
     */
    formattedDateString: string;

    constructor(props: UserScansRowProps) {
        super(props);

        this.intervalID = undefined;

        const date = new Date(this.props.barcode.scanned_at);
        this.formattedDateString = date.toLocaleString();

        const dateDifference = this.dateDifferenceFromNow(
            this.props.barcode.scanned_at
        );

        this.state = {
            dateDifference: dateDifference,
            generateBarcodeModalIsOpen: false,
            isCopying: false
        };

    }

    override componentDidMount(): void {
        this.intervalID = setIntervalImmediately(
            () => this.tick(),
            5_000
        );
    }

    override componentWillUnmount(): void {
        clearInterval(this.intervalID);
    }

    tick = (): void => {
        this.updateDateDifference();
    };

    updateDateDifference = (): void => {
        const dateDifference = this.dateDifferenceFromNow(
            this.props.barcode.scanned_at
        );

        this.setState({
            dateDifference: dateDifference
        });
    };

    rowStyleClassName(): string {
        // TODO: figure out why table variants cover borders
        // return this.props.index === 0 ? "table-success" : "";
        return "";
    }

    /**
     * Returns a string representing the difference between the current date
     * and the date passed in.
     */
    dateDifferenceFromNow(dateString: string): string {

        const now = new Date();
        const then = new Date(dateString);  // date passed in
        const diffMS = now.getTime() - then.getTime();
        const diffSecs = Math.floor(diffMS / 1_000);

        if (diffSecs <= 3) {
            return "Just now";
        }
        if (diffSecs <= 10 /* 3 - 10 seconds */) {
            return "About 5 seconds ago";
        }
        if (diffSecs <= 20 /* 10 - 20 seconds */) {
            return "About 15 seconds ago";
        }
        if (diffSecs <= 45 /* 20 - 45 seconds */) {
            return "About 30 seconds ago";
        }
        if (diffSecs <= 120 /* (2 minutes) 45 seconds - 2 minutes */) {
            return "About a minute ago";
        }
        if (diffSecs <= 300 /* (5 minutes) 2 - 5 minutes */) {
            return "A few minutes ago";
        }
        if (diffSecs <= 600 /* (10 minutes) 5 - 10 minutes */) {
            return "About 5 minutes ago";
        }
        if (diffSecs <= 900 /* (15 minutes) 10 - 15 minutes */) {
            return "About 10 minutes ago";
        }
        if (diffSecs <= 1_800 /* (30 minutes) 15 - 30 minutes */) {
            return "About 15 minutes ago";
        }
        if (diffSecs <= 3_600 /* (1 hours) 30 minutes - 1 hour */) {
            return "About 30 minutes ago";
        }
        if (diffSecs <= 7_200 /* (2 hours) 1 - 2 hours */) {
            return "About an hour ago";
        }
        if (diffSecs <= 14_400 /* (4 hours) 2 - 4 hours */) {
            return "About two hours ago";
        }
        if (diffSecs <= 21_600 /* (6 hours) 4 - 6 hours */) {
            return "About four hours ago";
        }
        if (diffSecs <= 86_400 /* (24 hours) 6 - 24 hours */) {
            return "More than six hours ago";
        }

        // > 24 hours
        return "More than one day ago";

    }

    onClickCopyButton = async (): Promise<void> => {

        const barcodeText = this.props.barcode.barcode;

        this.setState({
            isCopying: true
        });

        try {
            // TODO: Use UserScansRootCore._writeBarcodeToClipboard instead
            // TODO: of duplicating the logic here.
            // one difference in this method is that it uses the `isCopying`
            // state variable to animate the position of the copy button.

            await navigator.clipboard.writeText(barcodeText);
            // throw new Error("Test cannot copy to clipboard");

            console.log(
                "UserScansRow: Copied barcode to clipboard: " +
                `"${barcodeText}"`
            );
            this.props.setHighlightedBarcode(this.props.barcode);
            setTimeout(() => {
                this.setState({
                    isCopying: false
                });
            }, 250);

        } catch (error) {
            console.error(
                "UserScansRow: Error copying barcode to clipboard: " +
                `"${barcodeText}": ${error}`
            );
            this.setState({
                isCopying: false
            });
        }

    };

    onClickDeleteButton = async (): Promise<void> => {

        const barcodeID = this.props.barcode.id;
        this.props.removeBarcodesFromState(new Set([barcodeID]));

        const barcodeString = JSON.stringify(this.props.barcode);

        try {
            const result = await this.context.api!.deleteScans([barcodeID]);
            console.log(
                `Delete barcode ${barcodeString} result: ${result}`
            );
        } catch (error) {
            console.error(
                `Error deleting barcode: "${barcodeString}":`, error
            );
        }

    };

    didClickGenerateBarcode = (): void => {
        this.setState({
            generateBarcodeModalIsOpen: true
        });
    };

    closeGenerateBarcodeModal = (): void => {
        this.setState({
            generateBarcodeModalIsOpen: false
        });
        console.log(
            "Generate Barcode Modal is now closed"
        );
    };

    copyButtonStyle(): CSSProperties {
        const isHighlighted = this.props.isHighlighted;
        return {
            backgroundColor: isHighlighted ? "#0fd626" : "lightblue",

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
            transform: this.state.isCopying ? "translateY(3px)" : undefined,
            transition: "all 0.5s ease-out"
        };
    }

    linkButtonStyle(): CSSProperties {
        return {
            padding: "6px 10px",
            margin: "0px 0px 0px 0px",
            color: "black",
            backgroundColor: "grey",
            borderTop: "1px solid black",
            borderBottom: "1px solid black",
            borderLeft: "0.5px solid black",
            borderRight: "1px solid black",
            borderRadius: "0px 5px 5px 0px"
        };
    }

    barcodeIDdebugText(smallSize: boolean): JSX.Element | null {
        const queryParams = this.props.router.searchParams;

        if (queryParams.get("debug") === "true") {
            return (
                <span
                    className="text-secondary"
                    style={{ fontSize: "12px" }}
                >
                    {smallSize ? "•" : null}
                    {` (${this.props.barcode.id})`}
                </span>
            );
        }
        else {
            return null;
        }

    }

    // MARK: - Barcode Image Modal -

    // MARK: - Components -

    renderDeleteButton(): JSX.Element {
        return (
            <Button
                style={{
                    margin: "5px 5px",
                    backgroundColor: "#e84846"
                }}
                onClick={this.onClickDeleteButton}
            >
                <i className="fa fa-trash"></i>
            </Button>
        );
    }

    renderBarcodeCell(): JSX.Element {

        let smallSize = false;
        if (this.props.viewportSize.width <= 600) {
            smallSize = true;
        }

        return (
            <td>
                <span
                    className="barcode-text line display-linebreaks text-break"
                >
                    {this.props.barcode.barcode}
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
                        {this.state.dateDifference}
                    </span>
                    // </div>
                ) : null}
                {/* --- BARCODE ID --- */}
                {this.barcodeIDdebugText(smallSize)}
            </td>
        );
    }

    renderDropdownMenu(): JSX.Element {
        return (
            <Dropdown className="ms-1">
                <Dropdown.Toggle variant="success" className="text-center">
                    <i className="fa fa-ellipsis-v px-2" />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Dropdown.Item
                        onClick={this.didClickGenerateBarcode}
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
                        onClick={this.onClickDeleteButton}
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


    override render(): JSX.Element {
        return (
            <tr
                data-barcode-id={this.props.barcode.id}
                key={this.props.barcode.id}
                className={this.rowStyleClassName()}
            >
                {/* {this.renderBarcodeImageModal()} */}

                <BarcodeImageModalView
                    barcode={this.props.barcode}
                    generateBarcodeModalIsOpen={this.state.generateBarcodeModalIsOpen}
                    closeGenerateBarcodeModal={this.closeGenerateBarcodeModal}
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
                            style={this.copyButtonStyle()}
                            onClick={this.onClickCopyButton}
                        >
                            {/* span>Copy</span> */}
                            <i className="fa-solid fa-copy"></i>
                        </button>
                        {/* --- Link Button --- */}
                        <button
                            className="link-button"
                            onClick={() => {
                                return this.props.onClickOpenLink(
                                    this.props.barcode
                                );
                            }}
                            style={this.linkButtonStyle()}
                        >
                            <i className="fa fa-link"></i>
                        </button>

                        {this.renderDropdownMenu()}

                    </Stack>
                    {/* --- Barcode Image Modal --- */}
                </td>
                {/* --- Barcode Cell --- */}
                {this.renderBarcodeCell()}
                {/* --- Time Cell (>600px) --- */}
                {
                    this.props.viewportSize?.width > 600 ? (
                        <td
                            data-toggle="tooltip"
                            data-placement="top"
                            title={this.formattedDateString}
                        >
                            {this.state.dateDifference}
                        </td>
                    ) : null
                }

                {/* --- Delete Button (>800px) --- */}
                {
                    this.props.viewportSize?.width > 800 ? (
                        <td
                            style={{
                                textAlign: "center",
                            }}
                            data-toggle="tooltip"
                            data-placement="top"
                            title="Delete this barcode"
                        >
                            {this.renderDeleteButton()}
                        </td>
                    ) : null
                }
            </tr>
        );
    }

}
