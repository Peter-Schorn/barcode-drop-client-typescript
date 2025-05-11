import "./BarcodeScannerDialog.css";
import {
    type JSX
} from "react";

import Modal from "react-modal";

import Spinner from "react-bootstrap/Spinner";

type BarcodeScannerDialogProps = {
    isOpen: boolean;
    isScanning: boolean;
    title: string;
    onClose: () => void;
    user: string;
};

export function BarcodeScannerDialog(
    props: BarcodeScannerDialogProps
): JSX.Element {

    return (
        <Modal
            isOpen={props.isOpen}
            onRequestClose={props.onClose}
            contentLabel="Barcode Scanner Dialog"
            className="barcode-scanner-dialog"
            overlayClassName="barcode-scanner-dialog-overlay"
        >
            <div className="barcode-scanner-dialog-title-container">
                {props.isScanning ? (
                    <>
                        <Spinner
                            animation="border"
                            role="status"
                            className="m-2"
                        />
                        <p className="m-2">
                            Scanning...
                        </p>
                    </>
                ) : (
                    <p className="barcode-scanner-dialog-title">
                        <strong>{props.title}</strong>
                    </p>
                )}
            </div>
            <div className="barcode-scanner-dialog-button-container">
                <button
                    onClick={props.onClose}
                    className="barcode-scanner-dialog-button"
                    autoFocus
                >
                    <strong>Ok</strong>
                </button>
            </div>
        </Modal>
    );
}
