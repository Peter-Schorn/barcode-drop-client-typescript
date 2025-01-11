import React from "react";
import { Component } from "react";

import { AppContext } from "../Model/AppContext";

import { Button, Dropdown, Stack } from "react-bootstrap";

import Modal from "react-modal";

import bwipjs from "bwip-js";

import { setIntervalImmediately } from "../MiscellaneousUtilities";

import BarcodeImageModalView from "./BarcodeImageModalView";

export default class UserScansRow extends Component {

    static contextType = AppContext;

    constructor(props) {
        super(props);

        this.removeHighlightedBarcodeTimer = null;

        const dateDifference = this.dateDifferenceFromNow(
            this.props.barcode.scanned_at
        );

        this.state = {
            dateDifference: dateDifference,
            generateBarcodeModalIsOpen: false,
            isHighlighted: this.props.isHighlighted
        };

    }

    componentDidMount() {
        this.intervalID = setIntervalImmediately(
            () => this.tick(),
            5_000
        );
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    tick = () => {
        this.updateDateDifference();
    };

    updateDateDifference = () => {
        const dateDifference = this.dateDifferenceFromNow(
            this.props.barcode.scanned_at
        );
        this.setState({
            dateDifference: dateDifference
        });
    };

    rowStyleClassName = () => {
        // TODO: figure out why table variants cover borders
        // return this.props.index === 0 ? "table-success" : "";
        return "";
    };

    dateDifferenceFromNow(date) {

        const now = new Date();
        const then = new Date(date);  // date passed in
        const diffMS = now - then;
        let diffSecs = Math.floor(diffMS / 1_000);

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
        if (diffSecs <= 120 /* 45 seconds - 2 minutes */) {
            return "About a minute ago";
        }
        if (diffSecs <= 300 /* 2 - 5 minutes */) {
            return "A few minutes ago";
        }
        if (diffSecs <= 600 /* 5 - 10 minutes */) {
            return "About 5 minutes ago";
        }
        if (diffSecs <= 900 /* 10 - 15 minutes */) {
            return "About 10 minutes ago";
        }
        if (diffSecs <= 1_800 /* 15 - 30 minutes */) {
            return "About 15 minutes ago";
        }
        if (diffSecs <= 3_600 /* 30 minutes - 1 hour */) {
            return "About 30 minutes ago";
        }
        if (diffSecs <= 7_200 /* 1 - 2 hours */) {
            return "About an hour ago";
        }
        if (diffSecs > 7_200 /* 2 - 4 hours */) {
            return "About two hours ago";
        }
        if (diffSecs > 14_400 /* 4 - 6 hours */) {
            return "About four hours ago";
        }
        if (diffSecs > 21_600 /* 6 - 24 hours */) {
            return "More than six hours ago";
        }
        if (diffSecs > 86_400 /* more than 1 day old */) {
            return `More than one day ago`;
        }

    }

    isHighlighted() {
        return this.props.isHighlighted || this.state.isHighlighted;
    }

    onClickCopyButton = (barcode) => {
        return (e) => {

            const barcodeText = barcode.barcode;

            this.setState({
                isCopying: true
            });
            navigator.clipboard.writeText(barcodeText)
                .then(() => {
                    console.log(
                        `UserScansRow: Copied barcode to clipboard: ` +
                        `"${barcodeText}"`
                    );
                    // this._highlightBarcode();
                    this.props.setHighlightedBarcode(barcode);
                    setTimeout(() => {
                        this.setState({
                            isCopying: false
                        });
                    }, 250);

                })
                .catch((error) => {
                    console.error(
                        `UserScansRow: Error copying barcode to clipboard: ` +
                        `"${barcodeText}": ${error}`
                    );
                    setTimeout(() => {
                        this.setState({
                            isCopying: false
                        });
                    }, 1_000);
                });
        };
    };

    onClickDeleteButton = (barcode) => {
        return (e) => {

            console.log(`Deleting barcode: "${barcode}"`);
            const barcodeID = barcode.id;

            this.props.removeBarcodesFromState([barcodeID]);

            this.context.api.deleteScans([barcodeID])
                .then((result) => {
                    console.log(
                        `Delete barcode "${barcode}" result: ${result}`
                    );
                })
                .catch((error) => {
                    console.error(
                        `Error deleting barcode: "${barcode}": ${error}`
                    );
                });
        };
    };

    formattedDateString(date) {
        const dateObj = new Date(date);
        return dateObj.toLocaleTimeString();
    }

    didClickGenerateBarcode = (e) => {
        console.log(
            "Generate Barcode button was clicked:", e
        );
        this.setState({
            generateBarcodeModalIsOpen: true
        });
    };

    closeGenerateBarcodeModal = () => {
        this.setState({
            generateBarcodeModalIsOpen: false
        });
        console.log(
            "Generate Barcode Modal is now closed"
        );
    };

    copyButtonStyle() {
        const isHighlighted = this.isHighlighted();
        return {
            backgroundColor: isHighlighted ? "#0fd626" : "lightblue",

            padding: "6px 15px",
            margin: "0px 0px 0px 0px",
            borderTop: "1px solid black",
            borderBottom: "1px solid black",
            borderLeft: "1px solid black",
            borderRight: "0.5px solid black",
            borderRadius: "5px 0px 0px 5px",
            // rounded: "10px",  // probably don't need; should be `borderRadius`
            color: "black",

            // borderLeft: isHighlighted ? "1px solid green" : "1px solid",
            // borderTop: isHighlighted ? "1px solid green" : "1px solid",
            // borderBottom: isHighlighted ? "1px solid green" : "1px solid",
            transform: this.state.isCopying ? "translateY(3px)" : null,
            transition: "all 0.5s ease-out"
        };
    }

    linkButtonStyle() {
        return {
            padding: "6px 10px",
            margin: "0px 0px 0px 0px",
            color: "black",
            backgroundColor: "grey",
            borderTop: "1px solid black",
            borderBottom: "1px solid black",
            borderLeft: "0.5px solid black",
            borderRight: "1px solid black",
            borderRadius: "0px 5px 5px 0px",
            rounded: "10px"

        };

    }

    barcodeIsFalsy() {
        return !this.props?.barcode?.barcode;
    }

    barcodeIDdebugText(smallSize) {
        const queryParams = this.props.router.searchParams;

        if (queryParams.get("debug") === "true") {
            return (
                <span
                    className="text-secondary"
                    style={{ fontSize: "12px" }}
                >
                    { smallSize ? "•" : null }
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

    renderDeleteButton() {
        return (
            <Button
                style={{
                    margin: "5px 5px",
                    backgroundColor: "#e84846"
                }}
                onClick={this.onClickDeleteButton(
                    this.props.barcode
                )}
            >
                <i className="fa fa-trash"></i>
            </Button>
        );
    }

    renderBarcodeCell() {

        let smallSize = false
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
                { smallSize ? (
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
                ) : null }
                {/* --- BARCODE ID --- */}
                {this.barcodeIDdebugText(smallSize)}
            </td>
        );
    }

    renderDropdownMenu() {
        return (
            <Dropdown className="ms-1">
                <Dropdown.Toggle variant="success" className="text-center">
                    <i className="fa fa-ellipsis-v px-2" />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Dropdown.Item
                        onClick={this.didClickGenerateBarcode}
                        disabled={this.barcodeIsFalsy()}
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
                        onClick={this.onClickDeleteButton(
                            this.props.barcode
                        )}
                        disabled={this.barcodeIsFalsy()}
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


    render() {
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
                        onClick={this.onClickCopyButton(
                            this.props.barcode
                        )}
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
                            title={this.formattedDateString(this.props.barcode.scanned_at)}
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
