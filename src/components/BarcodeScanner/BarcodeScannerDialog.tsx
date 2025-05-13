import "./BarcodeScannerDialog.css";
import {
    useMemo,
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

    const transitionDuration = useMemo(() => {
        const rootStyle = getComputedStyle(document.documentElement);
        const duration = rootStyle.getPropertyValue(
            "--barcode-scanner-transition-duration"
        );
        return parseInt(duration, 10);
    }, []);

    // MARK: DEBUG close dialog 500ms after opening
    // function onAfterOpen(): void {
    //     setTimeout(() => {
    //         props.onClose();
    //     }, 500);
    // }

    return (
        <Modal
            closeTimeoutMS={transitionDuration}
            isOpen={props.isOpen}
            // onAfterOpen={onAfterOpen}
            onRequestClose={props.onClose}
            contentLabel="Barcode Scanner Dialog"
            className={{
                base: "barcode-scanner-dialog",
                afterOpen: "barcode-scanner-dialog-after-open",
                beforeClose: "barcode-scanner-dialog-before-close"
            }}
            overlayClassName={{
                base: "barcode-scanner-dialog-overlay",
                afterOpen: "barcode-scanner-dialog-overlay-after-open",
                beforeClose: "barcode-scanner-dialog-overlay-before-close"
            }}
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
