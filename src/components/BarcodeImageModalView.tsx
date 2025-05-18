import "./BarcodeImageModalView.css";

import React, {
    type JSX,
    useCallback,
    useRef,
    useState,
    useEffect
} from "react";

import { throttle } from "throttle-debounce";

import Modal from "react-modal";

import bwipjs, {
    type RenderOptions
} from "bwip-js/browser";

import { type BarcodeSymbology } from "../model/BarcodeSymbology";
import {
    BarcodeImageModalSymbologyMenu
} from "./BarcodeImageModalSymbologyMenu";

import { type ScannedBarcodeResponse } from "../types/ScannedBarcodesResponse";

import { barcodeImageModalViewLogger as logger } from "../utils/loggers";

import {
    pixelsToMM,
    getErrorMessage
} from "../utils/MiscellaneousUtilities";

type BarcodeImageModalViewProps = {
    barcode: ScannedBarcodeResponse;
    generateBarcodeModalIsOpen: boolean;
    closeGenerateBarcodeModal: () => void;
};

export function BarcodeImageModalView(props: BarcodeImageModalViewProps): JSX.Element {

    type CanvasDimensions = {
        width: number;
        height: number;
        widthMM: number;
        heightMM: number;
        minLengthMM: number;
    };

    const barcodeImageModalRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const barcodeTextRef = useRef<HTMLSpanElement>(null);

    const throttledFnRef = useRef<ReturnType<typeof throttle>>(null);

    const [
        barcodeSymbology,
        setBarcodeSymbology
    ] = useState<BarcodeSymbology | null>(null);

    const [
        drawBarcodeErrorMessage,
        setDrawBarcodeErrorMessage
    ] = useState<string>("");

    const resizeObserver = new ResizeObserver((): void => {
        logger.debug("resizeObserver: barcodeImageModal resized");
        throttledDrawBarcodeToCanvas();
    });

    const barcodeText = props.barcode.barcode;

    const calculateCanvasDimensions = useCallback((
        canvasContainer: HTMLDivElement
    ): CanvasDimensions => {
        const canvasHeight = canvasContainer.offsetHeight;
        const canvasWidth = canvasContainer.offsetWidth;

        const canvasWidthMM = pixelsToMM(canvasWidth);
        const canvasHeightMM = pixelsToMM(canvasHeight);

        const minLengthMM = Math.min(canvasHeightMM, canvasWidthMM);

        const dimensions = {
            width: canvasWidth,
            height: canvasHeight,
            widthMM: canvasWidthMM,
            heightMM: canvasHeightMM,
            minLengthMM: minLengthMM
        };

        logger.debug(
            "calculateCanvasDimensions:",
            dimensions
        );

        return dimensions;

    }, []);

    const drawBarcodeToCanvas = useCallback((
        barcodeSymbology: BarcodeSymbology
    ): void => {

        setDrawBarcodeErrorMessage("");

        const canvas = canvasRef.current;

        if (!canvas) {
            logger.warn(
                "Barcode canvas element not found"
            );
            return;
        }

        const canvasContainer = canvasContainerRef.current;
        if (!canvasContainer) {
            logger.warn(
                "Canvas container element not found"
            );
            return;
        }

        logger.debug(
            "drawBarcodeToCanvas: symbology:",
            barcodeSymbology
        );

        const canvasRenderOptions: RenderOptions = {
            bcid: barcodeSymbology.id,
            text: barcodeText,
            includetext: false,
            scale: 1
        };

        canvasContainer.style.height = "100%";
        // we must calculate the canvas dimensions after the height is set
        const dimensions = calculateCanvasDimensions(canvasContainer);
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        if (barcodeSymbology.isSquareSymbology) {
            canvasRenderOptions.width = dimensions.minLengthMM;
            canvasRenderOptions.height = dimensions.minLengthMM;
        }
        else {
            canvasRenderOptions.width = dimensions.widthMM;
            canvasRenderOptions.height = Math.max(
                Math.min(
                    50,
                    dimensions.heightMM - pixelsToMM(20),
                ),
                10
            );
        }

        canvasContainer.style.height = "auto";

        if (barcodeText.length > 30 || barcodeText.split("\n").length > 2) {
            if (!barcodeTextRef.current) {
                logger.warn(
                    "Barcode text element not found"
                );
            }
            else {
                barcodeTextRef.current.style.fontSize = "0.8em";
            }
        }

        logger.debug(
            "drawBarcodeToCanvas: canvasRenderOptions:",
            canvasRenderOptions
        );

        try {
            bwipjs.toCanvas(
                canvas,
                canvasRenderOptions
            );

        } catch (error) {
            logger.error(
                "Error drawing barcode to canvas:", error
            );
            const errorMessage = getErrorMessage(error);
            setDrawBarcodeErrorMessage(
                `Error loading barcode image: ${errorMessage}`
            );

        }

    }, [barcodeText, calculateCanvasDimensions]);

    // create/recreate the throttled function when dependencies change
    useEffect(() => {
        // create new throttled function
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        throttledFnRef.current = throttle(100, () => {
            if (props.generateBarcodeModalIsOpen && barcodeSymbology) {
                logger.debug(
                    "throttledFnRef: drawing barcode with symbology:",
                    barcodeSymbology
                );
                drawBarcodeToCanvas(barcodeSymbology);
            }
        });

        // cleanup when dependencies change or component unmounts
        return (): void => {
            if (throttledFnRef.current) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                throttledFnRef.current.cancel();
            }
        };
    }, [
        props.generateBarcodeModalIsOpen,
        barcodeSymbology,
        drawBarcodeToCanvas
    ]);

    // create a stable function to call the throttled function
    const throttledDrawBarcodeToCanvas = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        throttledFnRef.current?.();
    }, []);

    /**
     * Called after the Modal view for this component is opened.
     */
    function afterOpenGenerateBarcodeModal(): void {
        logger.debug(
            "Generate Barcode Modal is now open"
        );
        if (barcodeSymbology) {
            drawBarcodeToCanvas(barcodeSymbology);
        }
        const barcodeImageModal = barcodeImageModalRef.current;
        if (barcodeImageModal) {
            logger.debug(
                "afterOpenGenerateBarcodeModal: barcodeImageModal element found"
            );
            resizeObserver.observe(barcodeImageModal);
        }
    }

    function closeGenerateBarcodeModal(): void {
        props.closeGenerateBarcodeModal();
        resizeObserver.disconnect();
    }

    function formattedBarcodeText(): string {

        let formattedBarcodeText = barcodeText;

        if (formattedBarcodeText.split("\n").length > 2) {
            formattedBarcodeText = formattedBarcodeText
                .split("\n")
                .slice(0, 2)
                .join("\n") + "...";
        }
        if (formattedBarcodeText.length > 80) {
            formattedBarcodeText = formattedBarcodeText.substring(0, 80) + "...";
        }

        return formattedBarcodeText;

    }

    function handleSymbologyChange(
        symbology: BarcodeSymbology | null
    ): void {
        logger.debug("handleSymbologyChange: symbology:", symbology);
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
                ref={barcodeImageModalRef}
            >
                <div
                    ref={canvasContainerRef}
                    className="barcode-image-canvas-container"
                >
                    <div className="barcode-image-canvas-container-background">
                        {drawBarcodeErrorMessage && (
                            drawBarcodeErrorMessage
                        )}
                    </div>
                    <canvas ref={canvasRef} />
                </div>
                <span
                    ref={barcodeTextRef}
                    className="barcode-image-modal-text barcode-text"
                >
                    {formattedBarcodeText()}
                </span>
                <BarcodeImageModalSymbologyMenu
                    barcode={barcodeText}
                    setSymbology={handleSymbologyChange}
                    symbology={barcodeSymbology}
                />
            </div>
        </Modal>
    );

}
