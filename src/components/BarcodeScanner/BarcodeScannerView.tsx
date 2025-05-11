import "./BarcodeScannerView.css";

import scannerBeepSound from "../../assets/audio/scanner-beep.mp3";

import {
    type JSX,
    useRef,
    useEffect,
    useState,
    useMemo,
    useCallback
} from "react";
import { useParams } from "react-router-dom";

import { BarcodeDetector, type DetectedBarcode } from "barcode-detector/pure";

import { BarcodeScannerDialog } from "./BarcodeScannerDialog";
import {
    prefixWithHostIfPort,
    setIntervalImmediately
} from "../../utils/MiscellaneousUtilities";
import { MainNavbar } from "../MainNavbar";

type BarcodeScannerViewParams = {
    user: string;
};

export function BarcodeScannerView(): JSX.Element {

    const params = useParams<BarcodeScannerViewParams>();
    // the user parameter cannot be undefined because it is required by the
    // route
    const user = params.user!;

    const videoRef = useRef<HTMLVideoElement>(null);

    const scanLoopTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const [scannedBarcode, setScannedBarcode] = useState<DetectedBarcode | null>(null);

    const [dialogIsOpen, setDialogIsOpen] = useState(false);

    const didRequestVideo = useRef(false);

    const isProcessingBarcode = useRef(false);

    const scanInterval = 200; // milliseconds

    const barcodeDetector = useMemo(() => new BarcodeDetector(), []);

    const handleDetectedBarcode = useCallback((barcode: DetectedBarcode): void => {

        if (isProcessingBarcode.current) {
            console.log(
                "handleDetectedBarcode: already processing a barcode; ignoring"
            );
            return;
        }
        isProcessingBarcode.current = true;
        console.log("handleDetectedBarcode:", barcode);

        setScannedBarcode(barcode);

        clearInterval(scanLoopTimer.current);
        scanLoopTimer.current = undefined;
        console.log("handleDetectedBarcode: stopped scan loop");

        if (navigator.vibrate) {
            console.log("vibrating for 200ms");
            try {
                navigator.vibrate(200);
            } catch (error) {
                console.error("error vibrating:", error);
            }
        }
        const audio = new Audio(scannerBeepSound);
        audio.play().catch(error => {
            console.error(
                "error playing scanner beep sound effect:", error
            );
        });

    }, []);

    const scanLoop = useCallback(async (): Promise<void> => {
        const dateString = new Date().toISOString();
        // console.log(`[${dateString}] begin scanLoop`);
        try {
            const video = videoRef.current;
            if (!video) {
                console.error("video element not found");
                return;
            }
            const barcodes = await barcodeDetector.detect(video);

            if (barcodes.length) {
                console.log(`[${dateString}] scanLoop detected barcodes:`, barcodes);
                setDialogIsOpen(isOpen => {
                    if (isOpen) {
                        console.log(
                            "scanLoop: dialog is open; ignoring detected barcode"
                        );
                        return true;
                    }
                    else {
                        console.log(
                            "scanLoop: dialog is closed; handling detected barcode"
                        );
                        handleDetectedBarcode(barcodes[0]!);
                        // open the dialog
                        return true;
                    }
                });
            }

        } catch (error) {
            console.error("scanLoop error:", error);
        }

    }, [barcodeDetector, handleDetectedBarcode]);

    useEffect(() => {

        console.log("BarcodeScanner useEffect begin");

        const video = videoRef.current;

        // 3) scan frames
        function loadeddataHandler(): void {
            console.log(
                "loadeddataHandler: video loaded; starting scan loop"
            );
            clearInterval(scanLoopTimer.current);
            scanLoopTimer.current = setIntervalImmediately(scanLoop, scanInterval);
        }

        async function startScanning(): Promise<void> {

            console.log("startScanning begin");

            if (navigator.mediaDevices === undefined) {
                console.error(
                    "cannot access camera: navigator.mediaDevices is undefined"
                );
                return;
            }

            if (!video) {
                console.error("video element not found");
                return;
            }

            // 1) get camera stream
            if (!video.srcObject && !didRequestVideo.current) {
                console.log("BarcodeScanner useEffect: setting up camera stream");
                didRequestVideo.current = true;
                video.srcObject = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });
                video.addEventListener("loadeddata", loadeddataHandler);
            }
            else {
                console.log(
                    "BarcodeScanner useEffect: camera stream already requested"
                );
            }

        }

        void startScanning().catch(error => {
            console.error("error starting barcode scanner:", error);
        });

        // return (): void => {
        //     console.log("BarcodeScanner useEffect cleanup");

        // };

    }, [scanLoop]);

    function handleBarcodeDialogClose(): void {
        console.log("handleBarcodeDialogClose");
        setDialogIsOpen(false);
        setScannedBarcode(null);
        isProcessingBarcode.current = false;

        // add a delay before resuming the scan loop
        setTimeout(() => {
            console.log("resuming scan loop after closing dialog");
            clearInterval(scanLoopTimer.current);
            scanLoopTimer.current = setIntervalImmediately(
                scanLoop, scanInterval
            );
        }, 1_000);
    }

    return (
        <div className="barcode-scanner-view">
            <BarcodeScannerDialog
                isOpen={dialogIsOpen}
                onClose={handleBarcodeDialogClose}
                user={user}
                barcode={scannedBarcode}
            />
            <title>
                {prefixWithHostIfPort("Scanner | BarcodeDrop")}
            </title>
            <MainNavbar />
            <div className="barcode-scanner-view-content-container">
                <video
                    id="barcode-scanner-video"
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                >
                </video>
            </div>
        </div>
    );
}
