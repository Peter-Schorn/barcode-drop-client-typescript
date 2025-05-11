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
    prefixWithHostIfPort
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
    const controlsRef = useRef<HTMLDivElement>(null);

    const animationFrameId = useRef<number | null>(null);

    const scanLoopIsRunning = useRef(false);

    const [scannedBarcode, setScannedBarcode] = useState<DetectedBarcode | null>(null);

    const [dialogIsOpen, setDialogIsOpen] = useState(false);

    const [flashIsOn, setFlashIsOn] = useState(false);
    const [flashIsSupported, setFlashIsSupported] = useState(false);

    const didRequestVideo = useRef(false);

    const isProcessingBarcode = useRef(false);

    const barcodeDetector = useMemo(() => new BarcodeDetector(), []);

    /** delay before resuming the scan loop after closing the dialog */
    const resumeScanDelay = 600;  // milliseconds

    function updateFlashSupport(): void {
        if (videoRef.current) {
            const track = (videoRef.current.srcObject as MediaStream | null)
                ?.getVideoTracks()[0];
            if (track) {
                const capabilities = track.getCapabilities();
                if (capabilities.torch) {
                    console.log("flash is supported");
                    setFlashIsSupported(true);
                }
                else {
                    console.error("flash is not supported");
                    setFlashIsSupported(false);
                }
            }
            else {
                console.error("video track not found");
                setFlashIsSupported(false);
            }
        }
        else {
            console.error("video element not found");
            setFlashIsSupported(false);
        }
    }

    function toggleFlash(): void {
        console.log("toggleFlash");

        if (videoRef.current) {
            const track = (videoRef.current.srcObject as MediaStream | null)
                ?.getVideoTracks()[0];
            if (track) {
                const capabilities = track.getCapabilities();
                if (capabilities.torch) {
                    const settings = track.getSettings();
                    if (settings.torch) {
                        console.log("turning off flash");
                        track.applyConstraints({
                            advanced: [{ torch: false }]
                        }).then(() => {
                            console.log("flash turned off");
                            setFlashIsOn(false);
                        }).catch(error => {
                            console.error("error turning off flash:", error);
                        });
                    }
                    else {
                        console.log("turning on flash");
                        track.applyConstraints({
                            advanced: [{ torch: true }]
                        }).then(() => {
                            console.log("flash turned on");
                            setFlashIsOn(true);
                        }).catch(error => {
                            console.error("error turning on flash:", error);
                        });
                    }
                }
                else {
                    console.error("flash not supported");
                }
            }
            else {
                console.error("video track not found");
            }
        }
        else {
            console.error("video element not found");
        }
    }

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

        stopScanLoop();
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

        if (scanLoopIsRunning.current) {
            animationFrameId.current = requestAnimationFrame(scanLoop);
        }

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

    const restartScanLoop = useCallback((): void => {
        console.log("restartScanLoop");
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        scanLoopIsRunning.current = true;
        animationFrameId.current = requestAnimationFrame(scanLoop);
    }, [scanLoop]);

    function stopScanLoop(): void {
        console.log("stopScanLoop");
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        animationFrameId.current = null;
        scanLoopIsRunning.current = false;
    }

    useEffect(() => {

        console.log("BarcodeScanner useEffect begin");

        const video = videoRef.current;

        function loadeddataHandler(): void {
            console.log(
                "loadeddataHandler: video loaded; starting scan loop"
            );
            updateFlashSupport();
            restartScanLoop();
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

            if (!video.srcObject && !didRequestVideo.current) {
                console.log("BarcodeScanner useEffect: setting up camera stream");
                didRequestVideo.current = true;
                video.srcObject = await navigator.mediaDevices.getUserMedia({
                    // https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints
                    video: {
                        facingMode: "environment",
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 30 },
                        // improve focus for close-up scanning
                        focusMode: "continuous",
                        // improve exposure for various lighting conditions
                        exposureMode: "continuous",
                        whiteBalanceMode: "continuous",

                    }
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

    }, [restartScanLoop, scanLoop]);

    function handleBarcodeDialogClose(): void {
        console.log("handleBarcodeDialogClose");
        setDialogIsOpen(false);
        setScannedBarcode(null);
        isProcessingBarcode.current = false;

        // add a delay before resuming the scan loop
        setTimeout(() => {
            console.log("resuming scan loop after closing dialog");
            restartScanLoop();
        }, resumeScanDelay);
    }

    useEffect(() => {

        console.log("BarcodeScanner useEffect: updateControlsPosition");

        const video = videoRef.current;
        const controls = controlsRef.current;

        function updateControlsPosition(): void {
            if (!video || !controls) {
                return;
            }

            console.log("updateControlsPosition");

            const videoRect = video.getBoundingClientRect();
            const actualWidth = video.videoWidth;
            const actualHeight = video.videoHeight;

            // calculate scaling factor
            const scale = Math.min(
                videoRect.width / actualWidth,
                videoRect.height / actualHeight
            );

            // calculate actual displayed video dimensions
            const displayWidth = actualWidth * scale;
            const displayHeight = actualHeight * scale;

            // calculate offset from container edges
            const offsetX = (videoRect.width - displayWidth) / 2;
            const offsetY = (videoRect.height - displayHeight) / 2;

            controls.style.top = `${offsetY + 10}px`;
            controls.style.right = `${offsetX + 10}px`;

            // the controls are hidden by default
            controls.style.display = "flex";
        }

        // Update position when video metadata is loaded
        video?.addEventListener("loadedmetadata", updateControlsPosition);
        // Update on resize
        window.addEventListener("resize", updateControlsPosition);

        return (): void => {
            video?.removeEventListener("loadedmetadata", updateControlsPosition);
            window.removeEventListener("resize", updateControlsPosition);
        };
    }, []);

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
                <div className="barcode-scanner-video-container">
                    <video
                        id="barcode-scanner-video"
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                    >
                    </video>
                    <div
                        className="barcode-scanner-view-camera-controls"
                        ref={controlsRef}
                    >
                        {flashIsSupported && (
                            <button
                                onClick={toggleFlash}
                                className="barcode-scanner-view-toggle-flash-button"
                            >
                                <span className="material-symbols-outlined flex-center">
                                    {flashIsOn ? "flashlight_on" : "flashlight_off"}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
