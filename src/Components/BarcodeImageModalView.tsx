import React, {
    type JSX,
    useRef
} from "react";

import Modal from "react-modal";

import bwipjs, {
    type RenderOptions
} from "bwip-js/browser";

import { type ScannedBarcodeResponse } from "../types/ScannedBarcodesResponse";

type BarcodeImageModalViewProps = {
    barcode: ScannedBarcodeResponse;
    generateBarcodeModalIsOpen: boolean;
    closeGenerateBarcodeModal: () => void;
};

export function BarcodeImageModalView(props: BarcodeImageModalViewProps): JSX.Element {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const barcodeText = props.barcode.barcode;

    let is2DSymbology = false;


    let symbology: string;

    // Cannot differentiate between UPC-E and EAN-8, so don't automatically use
    // either
    if (/^[0-9]{12}$/.test(barcodeText)) {
        symbology = "upca";
    }
    else if (/^[0-9]{13}$/.test(barcodeText)) {
        symbology = "ean13";
    }
    else if (barcodeText.length <= 20) {
        symbology = "code128";
    }
    else {
        symbology = "datamatrix";
        is2DSymbology = true;
    }

    const canvasRenderOptions: RenderOptions = {
        bcid: symbology,
        text: barcodeText,
        includetext: true,
        textxalign: "center",
        textsize: 13,
        textyoffset: 10,
        paddingwidth: 5,
        paddingheight: 5
    };

    if (is2DSymbology) {
        if (window.innerWidth <= 600) {
            canvasRenderOptions.scale = 2;
        }
        else {
            canvasRenderOptions.scale = 3;
        }
    }
    else {

        if (window.innerWidth <= 600) {
            canvasRenderOptions.scale = 1;
        }
        else if (window.innerWidth <= 1024) {
            canvasRenderOptions.scale = 2;
        }
        else {
            canvasRenderOptions.scale = 3;
        }
    }

    if (is2DSymbology) {
        const size = 30;
        canvasRenderOptions.width = size;
        canvasRenderOptions.height = size;
    }
    else {
        canvasRenderOptions.width = 60;
        canvasRenderOptions.height = 20;
    }

    function drawBarcodeToCanvas(): void {

        const canvas = canvasRef.current;

        console.log(
            `drawBarcodeToCanvas: symbology: ${symbology}`
        );

        if (!canvas) {
            console.error(
                "Barcode canvas element not found"
            );
            return;
        }

        try {
            bwipjs.toCanvas(
                canvas,
                canvasRenderOptions
            );

        } catch (error) {
            console.error(
                "Error drawing barcode to canvas:", error
            );

        }

    }

    /**
     * Called after the Modal view for this component is opened.
     */
    function afterOpenGenerateBarcodeModal(): void {
        console.log(
            "Generate Barcode Modal is now open"
        );
        drawBarcodeToCanvas();
    }

    function closeGenerateBarcodeModal(): void {
        props.closeGenerateBarcodeModal();
    }

    function formattedBarcodeText(): string {

        let barcodeText = props.barcode.barcode;

        if (barcodeText.split("\n").length > 3) {
            barcodeText = barcodeText
                .split("\n")
                .slice(0, 3)
                .join("\n");
        }
        if (barcodeText.length > 40) {
            barcodeText = barcodeText.substring(0, 40) + "...";
        }

        return barcodeText;

    }

    return (
        <Modal
            isOpen={props.generateBarcodeModalIsOpen}
            onAfterOpen={afterOpenGenerateBarcodeModal}
            onRequestClose={closeGenerateBarcodeModal}
            style={{
                content: {
                    top: "50%",
                    left: "50%",
                    right: "auto",
                    bottom: "auto",
                    transform: "translate(-50%, -50%)",
                    maxWidth: "90vw",
                    maxHeight: "80vh",
                }
            }}
            contentLabel="Barcode"
        >
            <div
                className="barcode-image-modal text-center m-5"
            >
                {is2DSymbology ? (
                    <h3
                    className="text-break"
                    style={{
                        textAlign: "center",
                        margin: "10px auto 20px auto",
                    }}
                    >
                        {formattedBarcodeText()}
                    </h3>
                ) : null}
                <canvas ref={canvasRef} />
            </div>
        </Modal>
    );

}
