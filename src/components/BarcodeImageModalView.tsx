import "./BarcodeImageModalView.css";

import React, {
    type JSX,
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import Modal from "react-modal";

import bwipjs, {
    type RenderOptions
} from "bwip-js/browser";

import { type BarcodeSymbology } from "../model/BarcodeSymbology";
import {
    BarcodeImageModalSymbologyMenu
} from "./BarcodeImageModalSymbologyMenu";

import { type ScannedBarcodeResponse } from "../types/ScannedBarcodesResponse";

type BarcodeImageModalViewProps = {
    barcode: ScannedBarcodeResponse;
    generateBarcodeModalIsOpen: boolean;
    closeGenerateBarcodeModal: () => void;
};

export function BarcodeImageModalView(props: BarcodeImageModalViewProps): JSX.Element {

    type CanvasDimensions = {
        widthMM: number;
        heightMM: number;
        minLengthMM: number;
    };

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    const [
        barcodeSymbology,
        setBarcodeSymbology
    ] = useState<BarcodeSymbology | null>(null);

    const barcodeText = props.barcode.barcode;

    const calculateCanvasDimensions = useCallback((
        canvasContainer: HTMLDivElement
    ): CanvasDimensions => {
        const canvasHeight = canvasContainer.offsetHeight;
        const canvasWidth = canvasContainer.offsetWidth;

        console.log(
            `drawBarcodeToCanvas: canvasContainer height: ${canvasHeight}; ` +
            `width: ${canvasWidth}`
        );

        const canvasWidthMM = canvasWidth / 2.835;
        const canvasHeightMM = canvasHeight / 2.835;

        const minLengthMM = Math.min(canvasHeightMM, canvasWidthMM);

        return {
            widthMM: canvasWidthMM,
            heightMM: canvasHeightMM,
            minLengthMM: minLengthMM
        };

    }, []);

    const drawBarcodeToCanvas = useCallback((
        barcodeSymbology: BarcodeSymbology
    ): void => {

        const canvas = canvasRef.current;

        if (!canvas) {
            console.error(
                "Barcode canvas element not found"
            );
            return;
        }

        const canvasContainer = canvasContainerRef.current;
        if (!canvasContainer) {
            console.error(
                "Canvas container element not found"
            );
            return;
        }

        console.log("drawBarcodeToCanvas: symbology:", barcodeSymbology);

        const canvasRenderOptions: RenderOptions = {
            bcid: barcodeSymbology.id,
            text: barcodeText,
            includetext: false,
            scale: 1
        };

        if (barcodeSymbology.isSquareSymbology) {
            canvasContainer.style.height = "100%";
            // we must calculate the canvas dimensions after the height is set
            const dimensions = calculateCanvasDimensions(canvasContainer);
            canvasRenderOptions.width = dimensions.minLengthMM;
            canvasRenderOptions.height = dimensions.minLengthMM;
        }
        else {
            canvasContainer.style.height = "auto";
            // we must calculate the canvas dimensions after the height is set
            const dimensions = calculateCanvasDimensions(canvasContainer);
            canvasRenderOptions.width = dimensions.widthMM;
            canvasRenderOptions.height = Math.min(50, dimensions.heightMM);
        }

        console.log(
            "drawBarcodeToCanvas: canvasRenderOptions:",
            canvasRenderOptions
        );

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

    }, [barcodeText, calculateCanvasDimensions]);

    useEffect(() => {

        function hotUpdateHandler(): void {
            // Only redraw if the modal is currently open
            if (props.generateBarcodeModalIsOpen) {
                console.log(
                    "Vite HMR: Hot update detected; redrawing barcode"
                );
                if (barcodeSymbology) {
                    drawBarcodeToCanvas(barcodeSymbology);

                }
            }
        }

        window.addEventListener("vite:after-update", hotUpdateHandler);

        return (): void => {
            window.removeEventListener("vite:after-update", hotUpdateHandler);
        };
    }, [barcodeSymbology, drawBarcodeToCanvas, props.generateBarcodeModalIsOpen]);

    /**
     * Called after the Modal view for this component is opened.
     */
    function afterOpenGenerateBarcodeModal(): void {
        console.log(
            "Generate Barcode Modal is now open"
        );
        if (barcodeSymbology) {
            drawBarcodeToCanvas(barcodeSymbology);
        }
    }

    function closeGenerateBarcodeModal(): void {
        props.closeGenerateBarcodeModal();
    }

    function formattedBarcodeText(): string {

        let formattedBarcodeText = barcodeText;

        if (formattedBarcodeText.split("\n").length > 3) {
            formattedBarcodeText = formattedBarcodeText
                .split("\n")
                .slice(0, 3)
                .join("\n");
        }
        if (formattedBarcodeText.length > 40) {
            formattedBarcodeText = formattedBarcodeText.substring(0, 40) + "...";
        }

        return formattedBarcodeText;

    }

    function handleSymbologyChange(
        symbology: BarcodeSymbology | null
    ): void {
        console.log("handleSymbologyChange: symbology:", symbology);
        setBarcodeSymbology(symbology);
        if (props.generateBarcodeModalIsOpen && symbology) {
            drawBarcodeToCanvas(symbology);
        }
    }

    return (
        <Modal
            isOpen={props.generateBarcodeModalIsOpen}
            onAfterOpen={afterOpenGenerateBarcodeModal}
            onRequestClose={closeGenerateBarcodeModal}
            className="barcode-image-modal"
            contentLabel="Barcode"
        >
            <div
                className="barcode-image-modal-content"
            >
                <div
                    ref={canvasContainerRef}
                    className="barcode-image-canvas-container"
                >
                    <canvas ref={canvasRef} />
                </div>
                <p
                    className="barcode-image-modal-text"
                >
                    {formattedBarcodeText()}
                </p>
                <BarcodeImageModalSymbologyMenu
                    barcode={barcodeText}
                    setSymbology={handleSymbologyChange}
                    symbology={barcodeSymbology}
                />
            </div>
        </Modal>
    );

}
