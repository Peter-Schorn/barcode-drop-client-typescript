import React, {
    type JSX,
    useRef,
    useState
} from "react";
import { Component } from "react";

import { AppContext } from "../Model/AppContext";

import { Form, InputGroup } from "react-bootstrap";

// TODO: Use Modal component so that we can detect clicks outside of the modal
// TODO: and close the modal when the user clicks outside of it.
// import Modal from "react-modal";

type ScanBarcodeViewProps = {
    user: string;
    onClose: () => void;
    insertClientScannedBarcodeID: (barcodeID: string) => void;
};

type ScanBarcodeViewState = {
    barcode: string;
};

export function ScanBarcodeView_FC(): JSX.Element {

    


    return (
        <div>
            <h1>Scan Barcode</h1>
        </div>
    );
}

export class ScanBarcodeView extends Component<ScanBarcodeViewProps, ScanBarcodeViewState> {

    static override contextType = AppContext;

    declare context: React.ContextType<typeof AppContext>;

    constructor(props: ScanBarcodeViewProps) {
        super(props);

        this.state = {
            barcode: ""
        };

    }

    override componentDidMount(): void {

        console.log("ScanBarcodeView.componentDidMount()");

        document.addEventListener("keydown", this.handleKeyDown);

    }

    override componentWillUnmount(): void {

        console.log("ScanBarcodeView.componentWillUnmount()");
        document.removeEventListener("keydown", this.handleKeyDown);

    }

    handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {

        const newBarcode = event.target.value;

        console.log(
            "ScanBarcodeView.handleInputChange(): " +
            `"${newBarcode}"`
        );

        this.setState({
            barcode: newBarcode
        });
    };

    onSubmitForm = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {

        event.preventDefault();

        const barcode = this.state.barcode;

        console.log(
            `ScanBarcodeView.onSubmitForm(): user: "${this.props.user}"; ` +
            `barcode: "${barcode}"`
        );

        await this.scanBarcode(barcode);

    };

    onClose = (): void => {
        console.log("ScanBarcodeView.onClose()");
        this.props.onClose();
    };

    scanBarcode = async (barcode: string): Promise<void> => {

        const user = this.props.user;

        const id = crypto.randomUUID();
        this.props.insertClientScannedBarcodeID(id);

        console.log(
            "ScanBarcodeView.scanBarcode(): will scan barcode " +
            `for user "${user}": "${barcode}" (id: "${id}")`
        );

        try {

            const response = await this.context.api!.scanBarcode({
                user, barcode, id
            });

            console.log(
                "ScanBarcodeView.scanBarcode(): response: " +
                `"${response}"`
            );

        } catch (error) {
            console.error(
                "ScanBarcodeView.scanBarcode(): error: " +
                `"${error}"`
            );
        } finally {
            this.setState({
                barcode: ""
            });
        }

    };

    handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key === "Escape") {
            this.onClose();
        }
    };

    override render(): JSX.Element {
        return (
            <div
                className="scan-barcode-container translate-middle top-50 start-50 position-absolute rounded z-index-1"
                style={{
                    zIndex: 1,
                    height: "38px",
                    width: "500px",
                    maxWidth: "90vw",
                    marginLeft: "auto",
                    marginRight: "10px",
                    marginTop: "-35vh",
                    backgroundColor: "lightgray",
                    border: "0px solid black",
                }}
            >
                <Form
                    onSubmit={this.onSubmitForm}
                >
                    <div
                        className="d-flex"
                    >

                        {/* COLUMN */}
                        <div
                            className=""
                        >
                            {/* *** === Close Button === *** */}
                            <button
                                onClick={this.onClose}
                                className="scan-barcode-close-button"
                                type="button"
                                style={{
                                    width: "30px",
                                    height: "48px",
                                    position: "absolute",
                                    margin: "0px 44px",
                                    color: "gray",
                                    backgroundColor: "rgba(0, 0, 0, 0)",
                                    border: "none",
                                    zIndex: 6
                                }}
                            >
                                X
                            </button>
                        </div>
                        <div
                            className="flex-fill"
                        >
                            <InputGroup>

                                <InputGroup.Text
                                    style={{
                                        border: "2px solid white"
                                    }}
                                >
                                    <i
                                        className="fa-solid fa-barcode"
                                        style={{
                                            color: "black",
                                            width: "16px",
                                            height: "16px"
                                        }}
                                    >
                                    </i>
                                </InputGroup.Text>

                                <Form.Control
                                    autoFocus={true}
                                    type="text"
                                    size="lg"
                                    value={this.state.barcode}
                                    onChange={this.handleInputChange}
                                    placeholder="Enter Barcode"
                                    className="scan-barcode-input"
                                    style={{
                                        paddingRight: "70px",
                                        paddingLeft: "25px",
                                        border: "0px solid black"
                                    }}
                                />
                            </InputGroup>
                        </div>

                        <div
                            className=""
                        >
                            {/* ============================== */}
                            {/* *** ==== SUBMIT BUTTON === *** */}
                            {/* ============================== */}
                            <button
                                className="scan-barcode-submit-button"
                                type="submit"
                                style={{
                                    maxWidth: "80px",
                                    height: "48px",
                                    position: "absolute",
                                    margin: "0px -63px",
                                    color: "gray",
                                    backgroundColor: "#f0eded",
                                    borderRadius: "0px 8px 8px 0px",
                                    border: "none",
                                    zIndex: 5
                                }}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </Form>
            </div>
        );
    }
}
