import React, {
    type JSX,
    useContext,
    useState
} from "react";

import { AppContext } from "../Model/AppContext";

import { Form, InputGroup } from "react-bootstrap";

import Modal from "react-modal";

type ScanBarcodeViewProps = {
    showScanBarcodeModal: boolean;
    user: string;
    onClose: () => void;
    insertClientScannedBarcodeID: (barcodeID: string) => void;
};

export function ScanBarcodeView(props: ScanBarcodeViewProps): JSX.Element {

    const context = useContext(AppContext);

    const [barcode, setBarcode] = useState("");

    /**
     * Called when the user types in the barcode input field.
     */
    function handleInputChange(
        event: React.ChangeEvent<HTMLInputElement>
    ): void {
        const newBarcode = event.target.value;
        console.log(
            "ScanBarcodeView.handleInputChange(): " +
            `"${newBarcode}"`
        );
        setBarcode(newBarcode);
    }

    /**
     * Called when the user submits the barcode form.
     */
    async function onSubmitForm(
        event: React.FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();
        console.log(
            `ScanBarcodeView.onSubmitForm(): user: "${props.user}"; ` +
            `barcode: "${barcode}"`
        );
        await scanBarcode(barcode);
    }

    /**
     * Scans the barcode.
     */
    async function scanBarcode(barcode: string): Promise<void> {

        const user = props.user;

        const id = crypto.randomUUID();
        props.insertClientScannedBarcodeID(id);

        console.log(
            "ScanBarcodeView.scanBarcode(): will scan barcode " +
            `for user "${user}": "${barcode}" (id: "${id}")`
        );

        try {
            const response = await context.api!.scanBarcode({
                user, barcode, id
            });
            console.log(
                "ScanBarcodeView.scanBarcode(): response: " +
                `"${response}"`
            );
        } catch (error) {
            console.error(
                "ScanBarcodeView.scanBarcode(): error:",
                error
            );
        } finally {
            setBarcode("");
        }
    }

    return (
        <Modal
            className="translate-middle top-50 start-50 position-absolute rounded z-index-1"
            isOpen={props.showScanBarcodeModal}
            onRequestClose={props.onClose}
            style={{
                overlay: {
                    backgroundColor: "transparent"
                },
                content: {
                    boxShadow: " 0px 0px 40px 2px rgba(0, 0, 0, 0.4)",
                    height: "38px",
                    width: "500px",
                    maxWidth: "90vw",
                    marginLeft: "auto",
                    marginRight: "10px",
                    marginTop: "-35vh",
                    backgroundColor: "lightgray",
                    border: "0px solid black",
                }
            }}
        >
            <Form
                onSubmit={onSubmitForm}
            >
                <div
                    className="d-flex"
                >
                    <div
                        className=""
                    >
                        {/* *** === Close Button === *** */}
                        <button
                            onClick={props.onClose}
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
                                value={barcode}
                                onChange={handleInputChange}
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
                    >
                        {/* ============================== */}
                        {/* *** ==== SUBMIT BUTTON === *** */}
                        {/* ============================== */}
                        <button
                            className="scan-barcode-submit-button"
                            type="submit"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </Form>
        </Modal>
    );

}
