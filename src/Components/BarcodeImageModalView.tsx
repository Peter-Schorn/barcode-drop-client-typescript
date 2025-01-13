import React, {
    type JSX
} from "react";
import { Component } from "react";

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

export class BarcodeImageModalView extends Component<BarcodeImageModalViewProps> {

    canvasRef: React.RefObject<HTMLCanvasElement | null>;

    is2DSymbology: boolean;
    canvasRenderOptions: RenderOptions;

    constructor(props: BarcodeImageModalViewProps) {
        super(props);

        this.canvasRef = React.createRef<HTMLCanvasElement>();

        const barcodeText = this.props.barcode.barcode;

        this.is2DSymbology = false;

        let symbology: string;

        // Cannot differentiate between UPC-E and EAN-8, so don't
        // automatically use either
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
            this.is2DSymbology = true;
        }

        this.canvasRenderOptions = {
            bcid: symbology,
            text: barcodeText,
            includetext: true,
            textxalign: "center",
            textsize: 13,
            textyoffset: 10,
            paddingwidth: 5,
            paddingheight: 5
        };

        if (this.is2DSymbology) {
            if (window.innerWidth <= 600) {
                this.canvasRenderOptions.scale = 2;
            }
            else {
                this.canvasRenderOptions.scale = 3;
            }
        }
        else {

            if (window.innerWidth <= 600) {
                this.canvasRenderOptions.scale = 1;
            }
            else if (window.innerWidth <= 1024) {
                this.canvasRenderOptions.scale = 2;
            }
            else {
                this.canvasRenderOptions.scale = 3;
            }
        }

        if (this.is2DSymbology) {
            const size = 30;
            this.canvasRenderOptions.width = size;
            this.canvasRenderOptions.height = size;
        }
        else {
            this.canvasRenderOptions.width = 60;
            this.canvasRenderOptions.height = 20;
        }

    }

    drawBarcodeToCanvas = (): void => {

        const canvas = this.canvasRef.current;

        if (!canvas) {
            console.error(
                "Barcode canvas element not found"
            );
            return;
        }

        try {
            bwipjs.toCanvas(
                canvas,
                this.canvasRenderOptions
            );

        } catch (error) {
            console.error(
                "Error drawing barcode to canvas:", error
            );

        }


    };

    /**
     * Called after the Modal view for this component is opened.
     */
    afterOpenGenerateBarcodeModal = (): void => {
        console.log(
            "Generate Barcode Modal is now open"
        );
        this.drawBarcodeToCanvas();
    };

    closeGenerateBarcodeModal = (): void => {
        this.props.closeGenerateBarcodeModal();
    };

    formattedBarcodeText(): string {
        let barcodeText = this.props?.barcode?.barcode;

        if (!barcodeText) {
            return " --- ";
        }
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

    override render(): JSX.Element {
        let header;
        if (this.is2DSymbology) {
            header = (
                <h3
                    className="text-break"
                    style={{
                        textAlign: "center",
                        margin: "10px auto 20px auto",
                    }}
                >
                    {this.formattedBarcodeText()}
                </h3>
            );
        }
        else {
            header = null;
        }

        return (
            <Modal
                isOpen={this.props.generateBarcodeModalIsOpen}
                onAfterOpen={this.afterOpenGenerateBarcodeModal}
                onRequestClose={this.closeGenerateBarcodeModal}
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
                    {header}
                    <canvas
                        className="barcode-image-canvas"
                        ref={this.canvasRef}
                    >
                    </canvas>
                </div>
            </Modal>
        );
    }


}
