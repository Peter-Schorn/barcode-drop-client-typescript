import React from "react";
import { Component } from "react";

import { AppContext } from "../Model/AppContext";

import { Button, Dropdown, Stack } from "react-bootstrap";

import Modal from "react-modal";

import bwipjs from "bwip-js/browser";
// import { setIntervalImmediately } from "../MiscellaneousUtilities";

export default class BarcodeImageModalView extends Component {

    static contextType = AppContext;

    constructor(props) {
        super(props);

        this.customStyles = {
            content: {
                top: "50%",
                left: "50%",
                right: "auto",
                bottom: "auto",
                transform: "translate(-50%, -50%)",
                maxWidth: "90vw",
                maxHeight: "80vh",
            },
        };

        this.canvasRef = React.createRef();
        this.configureBarcodePropsForCanvas();

    }

    componentDidMount() {

        console.log(
            "BarcodeModalView.componentDidMount()"
        );

        this.configureBarcodePropsForCanvas();

    }

    configureBarcodePropsForCanvas = () => {

        const barcodeText = this.props.barcode.barcode;

        if (!barcodeText) {
            console.error(
                "Barcode text is empty"
            );
            return;
        }

        this.canvasProps = {
            is2DSymbology: false,
            viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            options: {}
        }

        // Cannot differentiate between UPC-E and EAN-8, so don't
        // automatically use either

        let symbology;

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
            this.canvasProps.is2DSymbology = true;
        }

        this.canvasProps.options = {
            bcid: symbology,
            text: barcodeText,
            includetext: true,
            textxalign: "center",
            textsize: 13,
            textyoffset: 10,
            paddingwidth: 5,
            paddingheight: 5
        };

        if (this.canvasProps.is2DSymbology) {
            if (this.canvasProps.viewportSize.width <= 600) {
                this.canvasProps.options.scale = 2;
            }
            else {
                this.canvasProps.options.scale = 3;
            }
        }
        else {

            if (this.canvasProps.viewportSize.width <= 600) {
                this.canvasProps.options.scale = 1;
            }
            else if (this.canvasProps.viewportSize.width <= 1024) {
                this.canvasProps.options.scale = 2;
            }
            else {
                this.canvasProps.options.scale = 3
            }
        }

        if (this.canvasProps.is2DSymbology) {
            const size = 30;
            this.canvasProps.options.width = size;
            this.canvasProps.options.height = size;
        }
        else {
            this.canvasProps.options.width = 60;
            this.canvasProps.options.height = 20;
        }

    }

    drawBarcodeToCanvas = () => {

        // const canvas = document.getElementById("barcode-image-canvas");
        const canvas = this.canvasRef.current;

        if (!canvas) {
            console.error(
                "Barcode canvas element not found"
            );
            return;
        }

        const barcodeText = this.props.barcode.barcode;

        if (!barcodeText) {
            console.error(
                "Barcode text is empty"
            );
            return;
        }

        bwipjs.toCanvas(
            canvas,
            this.canvasProps.options,
            (error, canvas) => {
                if (error) {
                    console.error(
                        `Error drawing barcode "${barcodeText}" to canvas: ${error}`
                    );
                }
                else {
                    console.log(
                        `Barcode drawn to canvas: "${barcodeText}"`
                    );
                }
            }
        );

    };

    afterOpenGenerateBarcodeModal = () => {
        console.log(
            "Generate Barcode Modal is now open"
        );
        this.drawBarcodeToCanvas();
    };

    closeGenerateBarcodeModal = () => {
        this.props.closeGenerateBarcodeModal();
    };

    formattedBarcodeText() {
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

    render() {
        let header;
        if (this.canvasProps.is2DSymbology) {
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
                style={this.customStyles}
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
