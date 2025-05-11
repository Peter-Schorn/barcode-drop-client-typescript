import "./BarcodeScannerDialog.css";
import {
    useContext,
    useState,
    type JSX
} from "react";

import Modal from "react-modal";

import Spinner from "react-bootstrap/Spinner";

import { type DetectedBarcode } from "barcode-detector/pure";
import { AppContext } from "../../model/AppContext";
import { AxiosError } from "axios";

type BarcodeScannerDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    user: string;
    barcode: DetectedBarcode | null;
};

export function BarcodeScannerDialog(
    props: BarcodeScannerDialogProps
): JSX.Element {

    const context = useContext(AppContext);

    const [title, setTitle] = useState("");

    const [spinnerIsVisible, setSpinnerIsVisible] = useState(false);

    async function afterOpenModal(): Promise<void> {

        console.log("BarcodeScannerDialog.afterOpenModal()");
        setTitle("");

        if (!props.barcode) {
            console.log("BarcodeScannerDialog.afterOpenModal(): no barcode");
            return;
        }

        try {
            setSpinnerIsVisible(true);

            const response = await context.api!.scanBarcode({
                user: props.user,
                barcode: props.barcode.rawValue
            });

            console.log(
                "BarcodeScannerDialog.afterOpenModal(): post barcode response:",
                response
            );

            setTitle(`Scanned "${props.barcode.rawValue}"`);

        } catch (error) {
            console.error(
                "BarcodeScannerDialog.afterOpenModal(): error posting barcode:",
                error
            );

            let errorMessage: string;

            if (error instanceof AxiosError) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                errorMessage = error.response?.data ?? error.message;
            }
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
            else {
                errorMessage = String(error);
            }

            setTitle(
                `Error scanning "${props.barcode.rawValue}": ${errorMessage}`
            );

        } finally {
            setSpinnerIsVisible(false);
        }
    }

    return (
        <Modal
            isOpen={props.isOpen}
            onRequestClose={props.onClose}
            onAfterOpen={afterOpenModal}
            contentLabel="Barcode Scanner Dialog"
            className="barcode-scanner-dialog"
            overlayClassName="barcode-scanner-dialog-overlay"
        >
            <div className="barcode-scanner-dialog-title-container">
                {spinnerIsVisible ? (
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
                        <strong>{title}</strong>
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

/*
 Scanned "xdasdfdvas
;jk;ljkh;lkj;lkjlk;jk;kjh;kljhl
fasdfasdf
asdf
asdf
asdf
asd
f
sdfasdfasdfasdf
asdf asdf asdf asdf asdf asdf asdf as
dfas
dfasdfasdfasdfas dfas df asdfa
sdfasdf"
*/
