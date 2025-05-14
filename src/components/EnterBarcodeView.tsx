import "./EnterBarcodeView.css";

import React, {
    type JSX,
    useContext,
    useState,
    useRef
} from "react";

import { AppContext } from "../model/AppContext";

import Modal from "react-modal";

import { type ToastMessageType } from "../types/ToastMessageType";

type EnterBarcodeViewProps = {
    isOpen: boolean;
    user: string;
    onClose: () => void;
    insertClientScannedBarcodeID: (barcodeID: string) => void;
    showToast: (message: string, type?: ToastMessageType) => void;
};


export function EnterBarcodeView(props: EnterBarcodeViewProps): JSX.Element {
    console.log("EnterBarcodeView: render");

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
            "EnterBarcodeView.handleInputChange(): " +
            `"${newBarcode}"`
        );
        setBarcode(newBarcode);
    }

    function onClickCancelButton(): void {
        if (barcode) {
            setBarcode("");
            barcodeInput.current?.focus();
        }
        else {
            props.onClose();
        }
    }

    /**
     * Called when the modal is opened.
     */
    function onAfterOpen(): void {
        console.log("EnterBarcodeView.onAfterOpen():");
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
            `EnterBarcodeView.onSubmitForm(): user: "${props.user}"; ` +
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
            "EnterBarcodeView.scanBarcode(): will scan barcode " +
            `for user "${user}": "${barcode}" (id: "${id}")`
        );

        try {
            const response = await context.api!.scanBarcode({
                user, barcode, id
            });
            console.log(
                "EnterBarcodeView.scanBarcode(): response: " +
                `"${response}"`
            );
            setBarcode("");
        } catch (error) {
            console.error(
                "EnterBarcodeView.scanBarcode(): error:",
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
            className="enter-barcode-modal"
            overlayClassName="enter-barcode-modal-overlay"
            isOpen={props.isOpen}
            onAfterOpen={onAfterOpen}
            onRequestClose={props.onClose}
        >
            <form
                onSubmit={onSubmitForm}
                className="enter-barcode-form"
            >
                <div className="enter-barcode-icon-container">
                    <i
                        className="fa-solid fa-barcode"
                    />
                </div>
                <button
                    onClick={onClickCancelButton}
                    className="enter-barcode-cancel-button"
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
                    className="enter-barcode-input"
                />
                <button
                    disabled={!barcode}
                    className="enter-barcode-submit-button"
                    type="submit"
                >
                    Submit
                </button>
            </form>
        </Modal>
    );

}
