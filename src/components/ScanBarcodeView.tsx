import "./ScanBarcodeView.css";

import React, {
    type JSX,
    useContext,
    useState,
    useRef
} from "react";

import { AppContext } from "../model/AppContext";

import Modal from "react-modal";

import { type ToastMessageType } from "../types/ToastMessageType";

type ScanBarcodeViewProps = {
    scanBarcodeViewIsOpen: boolean;
    user: string;
    onClose: () => void;
    insertClientScannedBarcodeID: (barcodeID: string) => void;
    showToast: (message: string, type?: ToastMessageType) => void;
};


export function ScanBarcodeView(props: ScanBarcodeViewProps): JSX.Element {
    console.log("ScanBarcodeView: render");

    const context = useContext(AppContext);

    const barcodeInput = useRef<HTMLInputElement>(null);

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

    function onClickCancelButton(): void {
        setBarcode("");
        barcodeInput.current?.focus();
    }

    /**
     * Called when the modal is opened.
     */
    function onAfterOpen(): void {
        console.log("ScanBarcodeView.onAfterOpen():");
        barcodeInput.current?.select();
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

        barcodeInput.current?.focus();

        if (!barcode) {
            return;
        }

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
            setBarcode("");
        } catch (error) {
            console.error(
                "ScanBarcodeView.scanBarcode(): error:",
                error
            );
            const errorMessage = error instanceof Error ?
                error.message : String(error);
            props.showToast(
                `Error scanning barcode: ${errorMessage}`,
                "error"
            );
        }
    }

    return (
        <Modal
            className="scan-barcode-modal"
            overlayClassName="scan-barcode-modal-overlay"
            isOpen={props.scanBarcodeViewIsOpen}
            onAfterOpen={onAfterOpen}
            onRequestClose={props.onClose}
        >
            <form
                onSubmit={onSubmitForm}
                className="scan-barcode-form"
            >
                <div className="scan-barcode-icon-container">
                    <i
                        className="fa-solid fa-barcode"
                    />
                </div>
                <button
                    onClick={onClickCancelButton}
                    className="scan-barcode-cancel-button"
                    type="button"
                >
                    X
                </button>
                <input
                    type="text"
                    ref={barcodeInput}
                    autoFocus={true}
                    value={barcode}
                    onChange={handleInputChange}
                    placeholder="Enter Barcode"
                    className="scan-barcode-input"
                />
                <button
                    disabled={!barcode}
                    className="scan-barcode-submit-button"
                    type="submit"
                >
                    Submit
                </button>
            </form>
        </Modal>
    );

}
