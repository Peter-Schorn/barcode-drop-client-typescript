import "./BarcodeScannerView.css";

import scannerBeepSound from "../../assets/audio/scanner-beep.mp3";

import {
    type JSX,
    useRef,
    useEffect,
    useState,
    useMemo,
    useCallback,
    useContext
} from "react";
import { useParams } from "react-router-dom";

import Spinner from "react-bootstrap/Spinner";

// import { BarcodeDetector, type DetectedBarcode } from "barcode-detector/pure";
import "barcode-detector/polyfill";

import { BarcodeScannerDialog } from "./BarcodeScannerDialog";
import {
    prefixWithHostIfPort,
    isFiniteNonZero,
    sleep,
    degreesToRadians
} from "../../utils/MiscellaneousUtilities";
import { MainNavbar } from "../MainNavbar";
import { AxiosError } from "axios";
import { AppContext } from "../../model/AppContext";

type BarcodeScannerViewParams = {
    user: string;
};

export function BarcodeScannerView(): JSX.Element {

    type VideoDimensions = {
        displayWidth: number;
        displayHeight: number;
        containerWidth: number;
        containerHeight: number;
        scale: number;
        offsetX: number;
        offsetY: number;
    };

    const context = useContext(AppContext);

    const params = useParams<BarcodeScannerViewParams>();
    // the user parameter cannot be undefined because it is required by the
    // route
    const user = params.user!;

    const videoRef = useRef<HTMLVideoElement>(null);

    /**
     * The canvas used for applying transformations to the video frame before
     * trying to detect a barcode.
     */
    const videoCanvasRef = useRef<HTMLCanvasElement>(
        document.createElement("canvas")
    );

    /** The canvas used to draw the barcode box. */
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraControlsRef = useRef<HTMLDivElement>(null);

    const animationFrameId = useRef<number | null>(null);
    const scanLoopIsRunning = useRef(false);

    const [isScanning, setIsScanning] = useState(false);

    const [barcodeDialogTitle, setBarcodeDialogTitle] = useState("");
    const [dialogIsOpen, setDialogIsOpen] = useState(false);

    const [flashIsSupported, setFlashIsSupported] = useState(false);
    const [flashIsOn, setFlashIsOn] = useState(false);
    const [isTogglingFlash, setIsTogglingFlash] = useState(false);

    const [cameraIsLoading, setCameraIsLoading] = useState(false);
    const [cameraLoadErrorMessage, setCameraLoadErrorMessage] = useState("");

    const didRequestVideo = useRef(false);

    const isProcessingBarcode = useRef(false);

    const barcodeDetector = useMemo(() => new BarcodeDetector(), []);

    /** delay before resuming the scan loop after closing the dialog */
    const resumeScanDelay = 500;  // milliseconds

    /** how long the barcode box remains displayed on the screen */
    const barcodeBoxDisplayDuration = 150; // milliseconds

    const getVideoSrcObject = useCallback((): MediaStream | null => {
        const video = videoRef.current;
        if (!video) {
            console.error("video element not found");
            return null;
        }
        let videoSrcObject: MediaStream | null;
        if ("srcObject" in video) {
            videoSrcObject = video.srcObject as MediaStream | null;
        }
        else {
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            videoSrcObject = video.src;
        }
        return videoSrcObject;
    }, []);

    const calculateVideoDimensions = useCallback((): VideoDimensions | null => {
        const video = videoRef.current;

        if (!video) {
            console.error("video element not found");
            return null;
        }

        const videoRect = video.getBoundingClientRect();

        const intrinsicVideoWidth = video.videoWidth;
        const intrinsicVideoHeight = video.videoHeight;

        if (
            !isFiniteNonZero(intrinsicVideoWidth) ||
            !isFiniteNonZero(intrinsicVideoHeight)
        ) {
            console.error("video dimensions are not finite");
            return null;
        }

        const scale = Math.min(
            videoRect.width / intrinsicVideoWidth,
            videoRect.height / intrinsicVideoHeight
        );

        // calculate actual displayed video dimensions
        const displayWidth = intrinsicVideoWidth * scale;
        const displayHeight = intrinsicVideoHeight * scale;

        const offsetX = (videoRect.width - displayWidth) / 2;
        const offsetY = (videoRect.height - displayHeight) / 2;

        const videoDimensions: VideoDimensions = {
            displayWidth,
            displayHeight,
            containerWidth: videoRect.width,
            containerHeight: videoRect.height,
            scale,
            offsetX,
            offsetY
        };

        return videoDimensions;
    }, []);

    const updateFlashSupport = useCallback((): void => {

        const videoSrcObject = getVideoSrcObject();

        const track = videoSrcObject?.getVideoTracks()[0];
        if (track) {
            const capabilities = track.getCapabilities();
            if (capabilities.torch) {
                console.log("camera flash is supported");
                setFlashIsSupported(true);
            }
            else {
                console.warn("camera flash is not supported");
                setFlashIsSupported(false);
            }
        }
        else {
            console.error("video track not found");
            setFlashIsSupported(false);
        }

    }, [getVideoSrcObject]);

    async function toggleFlash(): Promise<void> {
        console.log("toggleFlash");
        setIsTogglingFlash(true);

        const videoSrcObject = getVideoSrcObject();

        const track = videoSrcObject?.getVideoTracks()[0];
        if (track) {
            const capabilities = track.getCapabilities();
            if (capabilities.torch) {
                const settings = track.getSettings();
                if (settings.torch) {
                    console.log("turning off camera flash");
                    try {
                        await track.applyConstraints({
                            advanced: [{ torch: false }]
                        });
                        console.log("camera flash turned off");
                        setFlashIsOn(false);

                    } catch (error) {
                        console.error("error turning off camera flash:", error);
                    }
                }
                else {
                    console.log("turning on camera flash");
                    try {
                        await track.applyConstraints({
                            advanced: [{ torch: true }]
                        });
                        console.log("camera flash turned on");
                        setFlashIsOn(true);

                    } catch (error) {
                        console.error("error turning on camera flash:", error);
                    }
                }
            }
            else {
                console.warn("camera flash not supported");
            }
        }
        else {
            console.error("video track not found");
        }

        setIsTogglingFlash(false);

    }

    const drawBarcodeBox = useCallback((
        barcode: DetectedBarcode,
        rotation: number = 0
    ): void => {

        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) {
            return;
        }

        const canvasContext = canvas.getContext("2d");
        if (!canvasContext) {
            return;
        }

        console.log("drawBarcodeBox: will draw box for barcode:", barcode);

        // clear previous drawings
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.resetTransform();

        const videoDimensions = calculateVideoDimensions();
        if (!videoDimensions) {
            console.error("could not get video dimensions");
            return;
        }

        canvas.width = videoDimensions.containerWidth;
        canvas.height = videoDimensions.containerHeight;

        // draw the box
        canvasContext.strokeStyle = "#00FF00";
        canvasContext.fillStyle = "rgba(0, 255, 0, 0.3)";
        canvasContext.lineWidth = 2;

        const corners = barcode.cornerPoints.map(corner => ({
            x: (corner.x * videoDimensions.scale) + videoDimensions.offsetX,
            y: (corner.y * videoDimensions.scale) + videoDimensions.offsetY
        }));

        if (rotation) {
            canvasContext.rotateAboutCenter(-degreesToRadians(rotation));
        }

        canvasContext.drawPathWithCorners(corners);

        canvasContext.fill();
        canvasContext.stroke();

        setTimeout(() => {
            console.log("drawBarcodeBox: clearing canvas");
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            canvasContext.resetTransform();
        }, barcodeBoxDisplayDuration);

    }, [calculateVideoDimensions]);

    const postBarcode = useCallback(async (barcode: DetectedBarcode): Promise<void> => {

        console.log(`postBarcode: ${barcode.rawValue}`);
        setBarcodeDialogTitle("");
        setIsScanning(true);

        try {

            const response = await context.api!.scanBarcode({
                user: user,
                barcode: barcode.rawValue
            });

            console.log(
                "postBarcode: post barcode response:",
                response
            );

            setBarcodeDialogTitle(`Scanned "${barcode.rawValue}"`);

        } catch (error) {
            console.error(
                "postBarcode: error posting barcode:",
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

            setBarcodeDialogTitle(
                `Error scanning "${barcode.rawValue}": ${errorMessage}`
            );

        } finally {
            setIsScanning(false);
        }
    }, [context.api, user]);

    const handleDetectedBarcode = useCallback(async (
        barcode: DetectedBarcode,
        rotation: number = 0
    ): Promise<void> => {

        console.log("handleDetectedBarcode:", barcode);

        stopScanLoop();

        if (isProcessingBarcode.current) {
            console.log(
                "handleDetectedBarcode: already processing a barcode; ignoring"
            );
            return;
        }
        isProcessingBarcode.current = true;

        void postBarcode(barcode);

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

        drawBarcodeBox(barcode, rotation);
        await sleep(barcodeBoxDisplayDuration);

        setDialogIsOpen(isOpen => {
            if (isOpen) {
                console.log(
                    "handleDetectedBarcode: dialog is open; ignoring detected barcode"
                );
                return true;
            }
            else {
                console.log(
                    "handleDetectedBarcode: dialog is closed; handling detected barcode"
                );
                // open the dialog
                return true;
            }
        });

    }, [drawBarcodeBox, postBarcode]);

    const scanLoop = useCallback(async (): Promise<void> => {

        const dateString = new Date().toISOString();
        // console.log(`[${dateString}] begin scanLoop`);

        if (isProcessingBarcode.current) {
            console.log(
                "scanLoop: already processing a barcode; ignoring scan loop"
            );
            return;
        }

        const video = videoRef.current;
        if (!video) {
            console.error("video element not found");
            return;
        }

        const videoCanvas = videoCanvasRef.current;
        if (!videoCanvas) {
            console.error("video canvas element not found");
            return;
        }

        const videoCanvasCtx = videoCanvas.getContext("2d");
        if (!videoCanvasCtx) {
            console.error("video canvas context not found");
            return;
        }

        try {

            // detect barcodes on frame
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length) {
                console.log(
                    `[${dateString}] scanLoop detected barcodes:`,
                    barcodes
                );
                await handleDetectedBarcode(barcodes[0]!, 0);
                return;
            }

            // set to video frame size
            videoCanvas.width = video.videoWidth;
            videoCanvas.height = video.videoHeight;

            for (const rotation of [-45, -22.5, 22.5, 45]) {
                if (isProcessingBarcode.current) {
                    console.log(
                        "scanLoop: already processing a barcode; ignoring"
                    );
                }
                videoCanvasCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
                videoCanvasCtx.save();
                videoCanvasCtx.rotateAboutCenter(degreesToRadians(rotation));
                videoCanvasCtx.drawImage(video, 0, 0);
                barcodeDetector.detect(videoCanvas)
                    .then(async barcodes => {
                        if (barcodes.length) {
                            console.log(
                                `[${dateString}] scanLoop detected barcodes ${rotation}:`,
                                barcodes
                            );
                            await handleDetectedBarcode(barcodes[0]!, rotation);
                        }
                    })
                    .catch(error => {
                        console.error("scanLoop barcodeDetector.detect error:", error);
                    });
                videoCanvasCtx.restore();
            }


        } catch (error) {
            console.error("scanLoop error:", error);
        }

        if (scanLoopIsRunning.current) {
            animationFrameId.current = requestAnimationFrame(scanLoop);
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

    const loadeddataHandler = useCallback((): void => {
        console.log(
            "loadeddataHandler: video loaded; starting scan loop"
        );
        const videoTrack = getVideoSrcObject()
            ?.getVideoTracks()[0];

        const videoSettings = videoTrack?.getSettings();
        const videoCapabilities = videoTrack?.getCapabilities();

        console.log("video track:", videoTrack);
        console.log("video settings:", videoSettings);
        console.log("video capabilities:", videoCapabilities);

        updateFlashSupport();
        restartScanLoop();
    }, [getVideoSrcObject, restartScanLoop, updateFlashSupport]);

    const shutdownCameraStream = useCallback((): void => {
        console.log("shutdownCameraStream");

        didRequestVideo.current = false;

        const video = videoRef.current;
        if (!video) {
            console.error("video element not found");
            return;
        }

        stopScanLoop();

        const videoSrcObject = getVideoSrcObject();

        if (videoSrcObject) {
            const tracks = videoSrcObject.getTracks();
            for (const track of tracks) {
                console.log("stopping track:", track);
                track.stop();
            }
            if ("srcObject" in video) {
                video.srcObject = null;
            }
            else {
                // @ts-expect-error
                video.src = null;
            }

            video.load();
        }

        video.removeEventListener("loadeddata", loadeddataHandler);

        setFlashIsOn(false);
        setFlashIsSupported(false);

    }, [getVideoSrcObject, loadeddataHandler]);

    const configureScanLoop = useCallback((): void => {
        console.log("configureScanLoop");
        const video = videoRef.current;

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

            console.log("BarcodeScanner: setting up camera stream");
            didRequestVideo.current = true;

            try {
                setCameraIsLoading(true);

                if ("srcObject" in video) {
                    video.srcObject = null;
                }
                else {
                    // @ts-expect-error
                    video.src = null;
                }
                video.load();

                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    // https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints
                    video: {
                        facingMode: "environment",
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        zoom: { ideal: 1.5 },
                        frameRate: { ideal: 30 },
                        // improve focus for close-up scanning
                        focusMode: "continuous",
                        // improve exposure for various lighting conditions
                        exposureMode: "continuous",
                        whiteBalanceMode: "continuous"
                    },
                    audio: false
                });

                if ("srcObject" in video) {
                    video.srcObject = mediaStream;
                }
                else {
                    // @ts-expect-error
                    video.src = window.URL.createObjectURL(mediaStream);
                }

                video.removeEventListener("loadeddata", loadeddataHandler);
                video.addEventListener("loadeddata", loadeddataHandler);

            } catch (error) {
                console.error("error starting camera stream:", error);
                didRequestVideo.current = false;
                shutdownCameraStream();
                const errorMessage = error instanceof Error
                    ? error.message
                    : String(error);
                setCameraLoadErrorMessage(
                    `Error loading camera: ${errorMessage}`
                );
            } finally {
                setCameraIsLoading(false);
            }

        }

        void startScanning().catch(error => {
            console.error("error starting barcode scanner:", error);
        });

    }, [loadeddataHandler, shutdownCameraStream]);

    function handleBarcodeDialogClose(): void {
        console.log("handleBarcodeDialogClose");
        setDialogIsOpen(false);
        isProcessingBarcode.current = false;

        // add a delay before resuming the scan loop
        setTimeout(() => {
            console.log("resuming scan loop after closing dialog");
            restartScanLoop();
        }, resumeScanDelay);
    }

    useEffect(() => {

        console.log("BarcodeScanner configureScanLoop useEffect begin");

        const video = videoRef.current;

        if (!video) {
            console.error("video element not found");
            return;
        }

        if (!(video.srcObject || video.src) && !didRequestVideo.current) {
            configureScanLoop();
        }
        else {
            console.log(
                "BarcodeScanner useEffect: camera stream already requested"
            );
        }

        function visibilityChangeHandler(): void {
            console.log(
                `visibilityChangeHandler: state: ${document.visibilityState}`
            );

            if (document.visibilityState === "visible") {
                console.log("document is visible; configuring scan loop");
                configureScanLoop();
            }
            else {
                console.log("document is hidden; shutting down camera stream");
                shutdownCameraStream();
            }
        }

        window.addEventListener("visibilitychange", visibilityChangeHandler);

        window.addEventListener("beforeunload", shutdownCameraStream);

        return (): void => {
            console.log("BarcodeScanner configureScanLoop useEffect cleanup");
            window.removeEventListener("visibilitychange", visibilityChangeHandler);
            window.removeEventListener("beforeunload", shutdownCameraStream);
        };

    }, [configureScanLoop, shutdownCameraStream]);


    useEffect(() => {

        console.log("BarcodeScanner useEffect: updateControlsPosition");

        const video = videoRef.current;
        const cameraControls = cameraControlsRef.current;

        function updateControlsPosition(event?: Event): void {

            console.log("updateControlsPosition event:", event?.type);

            if (!video || !cameraControls) {
                return;
            }

            const videoDimensions = calculateVideoDimensions();
            if (!videoDimensions) {
                console.error("could not get video dimensions");
                return;
            }

            const padding = 10;

            // // calculate offset from container edges
            const offsetX = videoDimensions.offsetX + padding;
            const offsetY = videoDimensions.offsetY + padding;

            cameraControls.style.top = `${offsetY}px`;
            cameraControls.style.right = `${offsetX}px`;

            // the controls are hidden by default
            cameraControls.style.display = "flex";
        }

        function screenOrientationChangeHandler(event: Event): void {
            console.log("screenOrientationChangeHandler");
            updateControlsPosition(event);
            setTimeout(
                () => updateControlsPosition(event),
                500
            );
        }

        // update position when video data is loaded
        video?.addEventListener("loadeddata", updateControlsPosition);

        const resizeObserver = new ResizeObserver(() => {
            console.log(`[${new Date().toISOString()}] resizeObserver: resize event`);
            updateControlsPosition();
        });
        if (video) {
            resizeObserver.observe(video);
        }

        screen.orientation.addEventListener(
            "change", screenOrientationChangeHandler
        );

        return (): void => {
            video?.removeEventListener("loadeddata", updateControlsPosition);
            resizeObserver.disconnect();
            screen.orientation.removeEventListener(
                "change", screenOrientationChangeHandler
            );
        };
    }, [calculateVideoDimensions]);

    return (
        <div className="barcode-scanner-view-root">
            <BarcodeScannerDialog
                isOpen={dialogIsOpen}
                title={barcodeDialogTitle}
                isScanning={isScanning}
                onClose={handleBarcodeDialogClose}
                user={user}
            />
            <title>
                {prefixWithHostIfPort("Scanner | BarcodeDrop")}
            </title>
            <MainNavbar />
            <div className="barcode-scanner-view-content-container">
                <div className="barcode-scanner-view-scanned-barcodes-container">
                    {/* <i className="fa-solid fa-left-long barcode-scanner-view-scanned-barcodes-back-icon" /> */}
                    <a
                        href={`/scans/${user}`}
                        className="barcode-scanner-view-scanned-barcodes-link btn btn-primary"
                    >
                        View Scanned Barcodes
                    </a>
                </div>
                <div className="barcode-scanner-video-container">
                    <div className="barcode-scanner-video-container-background">
                        {cameraIsLoading ? (
                            <>
                                <Spinner
                                    animation="border"
                                    role="status"
                                    className="m-4"
                                />
                                <p className="barcode-scanner-video-loading-text">
                                    <strong>Loading Camera...</strong>
                                </p>
                            </>
                        ) : (
                            cameraLoadErrorMessage && (
                                <p className="barcode-scanner-video-error-text">
                                    <strong>{cameraLoadErrorMessage}</strong>
                                </p>
                            )
                        )}
                    </div>
                    <video
                        id="barcode-scanner-video"
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                    />
                    <canvas
                        className="barcode-scanner-video-canvas-overlay"
                        ref={canvasRef}
                    />
                    <div
                        className="barcode-scanner-view-camera-controls"
                        ref={cameraControlsRef}
                    >
                        {flashIsSupported && (
                            <button
                                onClick={toggleFlash}
                                className="barcode-scanner-view-toggle-flash-button"
                            >
                                {isTogglingFlash ? (
                                    <Spinner
                                        animation="border"
                                        role="status"
                                        size="sm"
                                    />
                                ) : (
                                    <span className="material-symbols-outlined flex-center">
                                        {flashIsOn ? "flashlight_on" : "flashlight_off"}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
