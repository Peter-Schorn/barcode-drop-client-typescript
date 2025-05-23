import {
    type JSX,
    type ChangeEvent,
    useContext,
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo
} from "react";
import { useParams } from "react-router-dom";

import { AppContext } from "../model/AppContext.ts";

import {
    Container,
    Button,
    Stack,
    OverlayTrigger,
    Tooltip
} from "react-bootstrap";

import { toast } from "react-hot-toast";

// import csv from 'csv'
import { stringify as csvStringify } from "csv-stringify/browser/esm/sync";

import { MainNavbar } from "./MainNavbar.tsx";

import { WebSocket } from "partysocket";
import {
    type Options as WebSocketOptions,
    type ErrorEvent
} from "partysocket/ws";

import {
    type SocketMessage
} from "../types/SocketMessage.ts";

import {
    isApplePlatform,
    prefixWithHostIfPort,
    setToString,
    latestBarcodeChanged
} from "../utils/MiscellaneousUtilities.ts";
import { SocketMessageTypes } from "../model/SocketMessageTypes.ts";

import { UserScansTable } from "./UserScansTable.tsx";
import { ConfigureLinkModal } from "./ConfigureLinkModal.tsx";
import { UserScansToast } from "./UserScansToast.tsx";
import { EnterBarcodeView } from "./EnterBarcodeView.tsx";
import { MainDropdownMenu } from "./MainDropdownMenu.tsx";
import { DebugBreakpointView } from "./DebugBreakpointView.tsx";

import {
    type ScannedBarcodeResponse,
    type ScannedBarcodesResponse
} from "../types/ScannedBarcodesResponse.ts";

import {
    type WriteBarcodeToClipboardOptions
} from "../types/WriteBarcodeToClipboardOptions.ts";

import { type ViewportSize } from "../types/ViewportSize.ts";
import { type UserScansRootParams } from "../types/UserScansRootParams.ts";
import { type ToastMessageType } from "../types/ToastMessageType.ts";

import { scannedBarcodesReviver } from "../utils/parsing.ts";

import { useURLFragmentParam } from "../hooks/useURLFragmentParam.ts";

import {
    userScansRootLogger as logger,
    webSocketLogger
 } from "../utils/loggers.ts";

// MARK: path="/scans/:user"
export function UserScansRoot(): JSX.Element {

    logger.debug("Rendering");

    const params = useParams<UserScansRootParams>();

    const context = useContext(AppContext);

    // MARK: - Refs -

    const configureLinkInputRef = useRef<HTMLInputElement>(null);

    // MARK: - URL Fragment Parameters -

    const [autoCopyIsEnabled, setAutoCopyIsEnabled] = useURLFragmentParam(
        "auto-copy", {
        parseValue: (value) => value === "true",
        encodeValue: (value) => value.toString()
    });

    const [formattedLink, setFormattedLink] = useURLFragmentParam(
        "formatted-link"
    );

    // MARK: State

    const [barcodes, setBarcodes] = useState<ScannedBarcodesResponse>([]);

    // the ids of barcodes scanned directly in the client that we don't want to
    // auto-copy even if auto-copy is enabled
    const [
        clientScannedBarcodeIDs,
        setClientScannedBarcodeIDs
    ] = useState<Set<string>>(new Set());

    const [
        lastAutoCopiedBarcode,
        setLastAutoCopiedBarcode
    ] = useState<ScannedBarcodeResponse | null>(null);

    const [
        highlightedBarcode,
        _setHighlightedBarcode
    ] = useState<ScannedBarcodeResponse | null>(null);

    const [configureLinkModalIsOpen, setConfigureLinkModalIsOpen] = useState(false);

    const [enterBarcodeViewIsOpen, setEnterBarcodeViewIsOpen] = useState(false);

    const [viewportSize, setViewportSize] = useState<ViewportSize>({
        width: window.innerWidth,
        height: window.innerHeight
    });

    /** The ID of the current toast shown on the screen */
    const [currentToastID, setCurrentToastID] = useState<string | null>(null);

    // MARK: End State

    const deleteIDs = useMemo(() => new Set<string>(), []);
    // clearInterval takes number | undefined, so we can't use null for
    // removeHighlightedBarcodeTimer
    const removeHighlightedBarcodeTimer = useRef<number | undefined>(undefined);

    // it should not be possible to navigate to this component without a user in
    // the path parameters
    const user = params.user!;

    // MARK: - WebSockets -

    const socketURL = new URL(import.meta.env.VITE_BACKEND_WEBSOCKET_URL);

    socketURL.pathname = `/watch/${user}`;

    logger.debug(
        `socketURL: ${socketURL}`
    );

    const socket = useRef<WebSocket>(null);

    // MARK: - useCallback -

    /**
     * Get the user's scans and assign the result to state.barcodes.
     *
     * @param options the options
     * @param options.user the user
     *
     */
    const getUserScans = useCallback(async (
        { user }: { user: string }
    ): Promise<void> => {

        const dateString = new Date().toISOString();

        logger.debug(
            "getUserScans(): Getting scans for " +
            `user "${user}" at date ${dateString}`
        );

        try {
            const barcodes = await context.api!.getUserScans(user);
            logger.debug(
                "getUserScans(): result:", barcodes
            );
            setBarcodes(barcodes);

        } catch (error) {
            logger.error(
                `getUserScans(): error: ${error}`
            );
        }

    }, [context.api]);

    const deleteAllUserBarcodes = useCallback(async (): Promise<void> => {

        logger.debug(
            "deleteAllUserBarcodes(): " +
            "Deleting all user barcodes"
        );

        // delete the barcodes
        setBarcodes([]);

        try {
            const result = await context.api!.deleteUserScans({ user: user });
            logger.debug(
                "deleteAllUserBarcodes(): " +
                `result: ${result}`
            );
        } catch (error) {
            logger.error(
                "deleteAllUserBarcodes(): " +
                `could not delete all user barcodes: ${error}`
            );
        }

    }, [context.api, user]);

    const removeBarcodesFromState = useCallback((barcodeIDs: Set<string>): void => {
        const barcodeIDsString = setToString(barcodeIDs);
        logger.debug(
            `Removing barcode with IDs from state: ${barcodeIDsString}`
        );

        setBarcodes((prevBarcodes) => {
            barcodeIDs.forEach(element => deleteIDs.add(element));

            logger.debug(
                `removeBarcodesFromState(): ${deleteIDs.size} deleteIDs:`,
                deleteIDs
            );

            const newBarcodes = prevBarcodes.filter((barcode) => {
                return !deleteIDs.has(barcode.id);
            });

            return newBarcodes;

        });

    }, [deleteIDs]);

    /**
     * Determines if the "Copy Latest Barcode" button is disabled, which
     * occurs when there are no barcodes.
     *
     * @returns `true` if the "Copy Latest Barcode" button is disabled.
     */
    const copyLastBarcodeIsDisabled = useCallback((): boolean => {
        return barcodes.length === 0;
    }, [barcodes]);

    const setHighlightedBarcode = useCallback((barcode: ScannedBarcodeResponse): void => {

        _setHighlightedBarcode(barcode);

        clearTimeout(removeHighlightedBarcodeTimer.current);
        removeHighlightedBarcodeTimer.current = setTimeout(() => {
            _setHighlightedBarcode(null);
        }, 5_000);

    }, []);

    const showToast = useCallback((
        message: string,
        type: ToastMessageType = "success"
    ): void => {

        if (currentToastID) {
            toast.dismiss(currentToastID);
        }

        const toastID = toast[type](
            message,
            { duration: 5_000 }
        );

        setCurrentToastID(toastID);

    }, [currentToastID]);

    const showBarcodeCopiedToast = useCallback((barcodeText: string): void => {
        logger.debug(`showBarcodeCopiedToast(): barcode: ${barcodeText}`);

        const formattedBarcodeText = barcodeText.truncated(30);
        const message = `Copied "${formattedBarcodeText}" to the Clipboard`;

        showToast(message);
    }, [showToast]);

    /**
     * Writes the barcode to the clipboard.
     *
     * @param options the options
     * @param options.barcode the barcode to write to the clipboard
     * @param options.showNotification whether or not to show a notification to
     * the user
     * @param options.highlight whether or not to highlight the barcode
     */
    const writeBarcodeToClipboard = useCallback(async (
        {
            barcode,
            showNotification,
            highlight
        }: WriteBarcodeToClipboardOptions
    ): Promise<void> => {

        const barcodeText = barcode.barcode;
        if (barcodeText === null || barcodeText === undefined) {
            logger.error(
                "_writeBarcodeToClipboard: barcode text is null or undefined"
            );
            return;
        }

        try {
            await navigator.clipboard.writeText(barcodeText);

            logger.debug(
                "_writeTextToClipboard: Copied text to clipboard: " +
                `"${barcodeText}"`
            );

            if (showNotification) {
                logger.debug(
                    "_writeTextToClipboard: " +
                    "--- SHOWING BARCODE COPIED TOAST ---" +
                    `(id: ${barcode?.id})`
                );
                showBarcodeCopiedToast(barcodeText);
            }

            if (highlight) {
                logger.debug(
                    "_writeTextToClipboard: --- HIGHLIGHT --- " +
                    `(id: ${barcode?.id})`
                );
                setHighlightedBarcode(barcode);
            }

        } catch (error) {
            logger.error(
                "_writeTextToClipboard: could not copy text to clipboard: " +
                `"${barcodeText}": ${error}`
            );

        }

    }, [setHighlightedBarcode, showBarcodeCopiedToast]);

    const copyLastBarcodeToClipboard = useCallback((): void => {

        const latestBarcode = barcodes[0];

        if (latestBarcode) {

            logger.debug(
                "copyLastBarcodeToClipboard(): " +
                "Copying latest barcode to clipboard: " +
                `"${JSON.stringify(latestBarcode)}"`
            );

            void writeBarcodeToClipboard({
                barcode: latestBarcode,
                showNotification: true,
                highlight: true
            });
        }
        else {
            logger.debug(
                "copyLastBarcodeToClipboard(): " +
                "latest barcode is null or undefined"
            );
        }
    }, [barcodes, writeBarcodeToClipboard]);

    /**
     * Makes a CSV string from the scanned barcodes for the user.
     *
     * @returns the CSV string.
     */
    const makeCSVString = useCallback((): string => {
        const csvString = csvStringify(barcodes, {
            cast: {
                // specify how to convert Date objects to strings
                date: (value) => value.toLocaleString()
            },
            header: true,
            columns: [
                { key: "barcode", header: "Barcode" },
                { key: "scanned_at", header: "Date" },
                { key: "id", header: "ID" }
            ]

        });
        return csvString;
    }, [barcodes]);

    const copyAsCSV = useCallback(async (): Promise<void> => {

        logger.debug("copyAsCSV()");

        if (copyLastBarcodeIsDisabled()) {
            logger.error(
                "copyAsCSV(): cannot copy CSV to clipboard: no barcodes"
            );
            return;
        }

        const csvString = makeCSVString();

        logger.debug("copyAsCSV(): csvString:", csvString);

        try {
            await navigator.clipboard.writeText(csvString);
            logger.debug("copyAsCSV(): copied CSV to clipboard");
            showToast("Copied CSV to clipboard");

        } catch (error) {
            logger.error(
                `copyAsCSV(): could not copy CSV to clipboard: ${error}`
            );
            showToast("Could not copy CSV to clipboard", "error");
        }

    }, [copyLastBarcodeIsDisabled, makeCSVString, showToast]);

    const exportAsCSV = useCallback((): void => {

        logger.debug(
            "exportAsCSV(): barcodes:", barcodes
        );

        if (copyLastBarcodeIsDisabled()) {
            logger.error(
                "exportAsCSV(): cannot export CSV: no barcodes"
            );
            return;
        }

        const date = new Date();
        const dateString = date.toISOString();

        const csvString = makeCSVString();

        logger.debug("exportAsCSV(): csvString:", csvString);

        const blob = new Blob([csvString], { type: "text/csv" });
        const blobURL = URL.createObjectURL(blob);

        const blobLinkElement = document.createElement("a");

        blobLinkElement.download = `barcodes-${dateString}.csv`;
        blobLinkElement.href = blobURL;

        blobLinkElement.click();

    }, [copyLastBarcodeIsDisabled, barcodes, makeCSVString]);

    // MARK: Auto-Copy
    /** Copies the given barcode to the clipboard if auto copy is enabled. */
    const autoCopyIfEnabled = useCallback((
        barcode: ScannedBarcodeResponse
    ): void => {

        if (!autoCopyIsEnabled) {
            logger.debug(
                "Auto-copy is disabled; not copying latest barcode"
            );
            return;
        }

        if (clientScannedBarcodeIDs.has(barcode.id)) {
            logger.debug(
                "will NOT copy barcode scanned from CLIENT:",
                barcode
            );
            return;
        }

        setLastAutoCopiedBarcode(barcode);

        logger.debug(
            `Auto-copying most recent barcode: "${JSON.stringify(barcode)}"`
        );

        void writeBarcodeToClipboard({
            barcode: barcode,
            showNotification: true,
            highlight: true
        });

    }, [
        writeBarcodeToClipboard,
        clientScannedBarcodeIDs,
        autoCopyIsEnabled,
    ]);

    const toggleAutoCopy = useCallback((): void => {

        setAutoCopyIsEnabled(isEnabled => !isEnabled);

    }, [setAutoCopyIsEnabled]);

    // MARK: - Effects -

    // MARK: handleKeyDown effect
    useEffect(() => {

        logger.debug("useEffect: handleKeyDown: begin");

        function handleKeyDown(e: KeyboardEvent): void {

            // logger.debug(
            //     `handleKeyDown(): key: ${e.key}; code: ${e.code}; ` +
            //     `ctrlKey: ${e.ctrlKey}; metaKey: ${e.metaKey}; ` +
            //     `altKey: ${e.altKey}; shiftKey: ${e.shiftKey}`
            // );

            // if the user is holding down a key, then events will repeatedly be
            // generated; we only want to handle the first event
            if (e.repeat) {
                return;
            }

            if (e.isPlatformModifierKey()) {

                if (e.key === "k" && !e.shiftKey && !e.altKey) {
                    logger.debug(
                        "handleKeyDown(): " +
                        "Platform modifier key + \"k\" pressed: copying barcode"
                    );
                    copyLastBarcodeToClipboard();
                    e.preventDefault();
                }
                else if (e.key === "d" && !e.shiftKey && !e.altKey) {
                    logger.debug(
                        "handleKeyDown(): " +
                        "Platform modifier key + \"d\" pressed: DELETING all barcodes"
                    );
                    void deleteAllUserBarcodes();
                    e.preventDefault();
                }
                else if (e.key === "e" && e.shiftKey && !e.altKey) {
                    logger.debug(
                        "handleKeyDown(): " +
                        "Platform modifier key + shift + \"e\" pressed: EXPORTING all barcodes as CSV"
                    );
                    exportAsCSV();
                    e.preventDefault();
                }
                else if (e.key === "e" && !e.shiftKey && !e.altKey) {
                    logger.debug(
                        "handleKeyDown(): " +
                        "Platform modifier key + \"e\" pressed: COPYING all barcodes as CSV"
                    );
                    void copyAsCSV();
                    e.preventDefault();
                }
                else if (e.key === "l" && !e.shiftKey && !e.altKey) {
                    logger.debug(
                        "handleKeyDown(): " +
                        "Platform modifier key + \"l\" pressed: " +
                        "SHOWING configure link"
                    );
                    showConfigureLinkModal();
                    configureLinkInputRef.current?.focus();
                    e.preventDefault();
                }
                else if (e.key === "z" && !e.shiftKey && !e.altKey) {
                    logger.debug(
                        "handleKeyDown(): " +
                        "Platform modifier key + \"a\" pressed: " +
                        "toggling auto copy"
                    );
                    toggleAutoCopy();
                    e.preventDefault();
                }
                else if (e.key === "s" && !e.shiftKey && !e.altKey) {
                    logger.debug(
                        "handleKeyDown(): " +
                        "Platform modifier key + \"s\" pressed: " +
                        "SHOWING enter barcode view"
                    );
                    openEnterBarcodeView();
                    e.preventDefault();
                }
                else {
                    logger.debug(
                        "handleKeyDown(): " +
                        `Platform modifier key + "${e.key}" pressed`
                    );
                }

            }

        }

        window.addEventListener("keydown", handleKeyDown);

        return (): void => {
            logger.debug("useEffect: handleKeyDown: cleanup");
            window.removeEventListener("keydown", handleKeyDown);
        };

    }, [
        copyLastBarcodeToClipboard,
        barcodes,
        copyAsCSV,
        deleteAllUserBarcodes,
        exportAsCSV,
        toggleAutoCopy
    ]);

    // MARK: windowDidResize effect
    useEffect(() => {

        logger.debug("useEffect: windowDidResize: begin");

        function windowDidResize(): void {

            const size = {
                width: window.innerWidth,
                height: window.innerHeight
            };

            logger.debug(
                "windowDidResize(): size:",
                size
            );

            setViewportSize(size);

        }

        window.addEventListener("resize", windowDidResize);

        return (): void => {
            logger.debug("useEffect: windowDidResize: cleanup");
            window.removeEventListener("resize", windowDidResize);
        };

    }, []);

    // MARK: promptForClipboardPermission effect
    useEffect(() => {

        logger.debug(
            "useEffect: promptForClipboardPermission: begin"
        );

        async function checkClipboardPermissions(): Promise<void> {
            try {
                // the clipboard-write permission is supported by some browsers,
                // but not all
                const result = await navigator.permissions.query({
                    name: "clipboard-write" as unknown as PermissionName
                });

                if (["granted", "prompt"].includes(result.state)) {
                    logger.debug(
                        `Clipboard permissions granted: ${result.state}`
                    );
                } else {
                    logger.error(
                        `Clipboard permissions denied: ${result.state}`
                    );
                }
            } catch (error) {
                logger.error(
                    "Error querying clipboard permissions:", error
                );
            }
        }

        void checkClipboardPermissions();

    }, []);

    // MARK: getUserScans effect
    useEffect(() => {
        logger.debug("useEffect: getUserScans: begin");
        async function getUserScansEffect(): Promise<void> {
            await getUserScans({ user: user });
        }
        void getUserScansEffect();
    }, [getUserScans, user]);

    // MARK: configureSocket effect
    useEffect(() => {

        logger.debug("useEffect: configureSocket: begin");

        function receiveSocketMessage(event: MessageEvent): void {

            logger.debug(
                `[${new Date().toISOString()}] ` +
                "receiveSocketMessage(): " +
                "event:", event
            );

            let message: SocketMessage; // the parsed JSON message
            try {
                message = JSON.parse(
                    event.data as string,
                    scannedBarcodesReviver
                ) as SocketMessage;

            } catch (error) {
                logger.error(
                    "receiveSocketMessage(): " +
                    "could not parse JSON message:", error
                );
                return;
            }

            switch (message.type) {
                // MARK: Insert new scans
                case SocketMessageTypes.UpsertScans: {
                    const newScans = message.newScans;

                    logger.debug(
                        "receiveSocketMessage(): " +
                        `will insert newScans for user ${user}:`, newScans
                    );

                    setBarcodes((prevBarcodes) => {
                        // MARK: insert the new scans in sorted order by date
                        // and remove any existing scans with the same ID

                        const newBarcodes = prevBarcodes
                            .filter((barcode) => {
                                for (const newScan of newScans) {
                                    if (barcode.id === newScan.id) {
                                        return false;
                                    }
                                }
                                return true;
                            })
                            .concat(newScans);

                        newBarcodes.sort((lhs, rhs) => {
                            return rhs.scanned_at.getTime() -
                                lhs.scanned_at.getTime();
                        });

                        logger.debug(
                            "receiveSocketMessage(): " +
                            "returning new barcodes:", newBarcodes
                        );
                        return newBarcodes;

                    });

                    break;
                }
                // MARK: Delete scans
                case SocketMessageTypes.DeleteScans: {
                    const ids = message.ids;

                    logger.debug(
                        `socket will delete barcodes with IDs ${ids}`
                    );
                    const idsSet = new Set(ids);
                    removeBarcodesFromState(idsSet);
                    break;
                }
                // MARK: Replace all scans
                case SocketMessageTypes.ReplaceAllScans: {
                    const scans = message.scans;

                    logger.debug(
                        `socket will replace all scans for user ${user}:`,
                        scans
                    );
                    setBarcodes(scans);
                    deleteIDs.clear();
                    break;
                }
                default: {
                    logger.error(
                        "receiveSocketMessage(): " +
                        "socket could not handle message:", message
                    );
                }
            }

        }

        if (import.meta.env.VITE_DISABLE_WEBSOCKET === "true") {
            return;
        }

        /*
         https://www.npmjs.com/package/partysocket#available-options

         For each reconnection attempt, the delay is calculated as follows:

            delay = minReconnectionDelay *
                Math.pow(reconnectionDelayGrowFactor, this._retryCount - 1);

            if (delay > maxReconnectionDelay) {
                delay = maxReconnectionDelay;
            }

         The first reconnection attempt will have a delay of
         minReconnectionDelay, the second will have a delay of
         minReconnectionDelay * reconnectionDelayGrowFactor, and the max
         delay will be maxReconnectionDelay.

         https://www.desmos.com/calculator/cv5yene4jw

         */
        const wsOptions: WebSocketOptions = {
            minReconnectionDelay: 500,  // half a second
            maxReconnectionDelay: 10_000,  // 10 seconds
            connectionTimeout: 10_000,  // 10 seconds
            debug: true,
            debugLogger: webSocketLogger.debug.bind(webSocketLogger),
        };

        socket.current = new WebSocket(
            socketURL.href,
            [],
            wsOptions
        );

        socket.current.onopen = (event: Event): void => {

            logger.debug(
                `[${new Date().toISOString()}] socket.onopen(): event:`, event
            );

            void getUserScans({ user: user });

        };

        socket.current.onmessage = (event: MessageEvent): void => {
            receiveSocketMessage(event);
        };

        socket.current.onclose = (event: CloseEvent): void => {

            logger.debug(
                `[${new Date().toISOString()}] socket.onclose(): event:`,
                event
            );

        };

        socket.current.onerror = (event: ErrorEvent): void => {

            logger.error(
                `[${new Date().toISOString()}] socket.onerror(): event:`, event
            );

        };

        return (): void => {
            logger.debug("useEffect: configureSocket: cleanup");
            socket.current?.close();
        };

    }, [
        deleteIDs,
        getUserScans,
        removeBarcodesFromState,
        socketURL.href, user
    ]);

    // MARK: Barcodes changed effect
    useEffect(() => {

        logger.debug("useEffect: barcodes changed: begin");

        // fast path; might improve performance
        if (barcodes.length === 0) {
            return;
        }

        const currentBarcode = barcodes[0];

        if (latestBarcodeChanged(lastAutoCopiedBarcode, currentBarcode)) {
            // auto-copy the most recent barcode if auto-copy is enabled
            autoCopyIfEnabled(currentBarcode);
        }

    }, [
        barcodes,
        autoCopyIfEnabled,
        lastAutoCopiedBarcode
    ]);

    function handleAutoCopyChange(e: ChangeEvent<HTMLInputElement>): void {

        const enableAutoCopy = e.target.checked;
        logger.debug(
            "handleAutoCopyChange(): " +
            `e.target.checked (enable auto-copy): ${enableAutoCopy}`
        );

        setAutoCopyIsEnabled(enableAutoCopy);

    }

    function deleteAllUserBarcodesKeyboardShortcutString(): string {
        return isApplePlatform() ? "⌘D" : "Ctrl+D";
    }

    function toggleAutoCopyKeyboardShortcutString(): string {
        return isApplePlatform() ? "⌘Z" : "Ctrl+Z";
    }

    function disabledClassIfZeroBarcodes(): string {
        return copyLastBarcodeIsDisabled() ? "disabled" : "";
    }

    // MARK: - Links -

    function onClickOpenLink(barcode: ScannedBarcodeResponse): void {

        logger.debug("onClickOpenLink(): barcode:", barcode);

        const barcodeText = barcode.barcode;

        if (!formattedLink) {
            logger.error(
                "onClickOpenLink(): formatted link is null or undefined"
            );
            return;
        }

        const urlString = formattedLink.replace("%s", barcodeText);
        logger.debug(
            `onClickOpenLink(): opening link: "${urlString}" ` +
            `for barcode: "${barcodeText}"`
        );

        try {

            const url = new URL(urlString);

            window.open(url, "_blank");

        } catch (error) {
            logger.error(
                `onClickOpenLink(): could not open link: "${urlString}": ${error}`
            );
        }

    }

    // MARK: --- Configure Link Modal ---

    function showConfigureLinkModal(): void {
        logger.debug("showConfigureLinkModal():");
        setConfigureLinkModalIsOpen(true);
    }

    /**
     * Called when the user submits the `ConfigureLinkModal` form.
     *
     * @param e the event
     */
    function onSubmitConfigureLinkForm(
        e: React.FormEvent<HTMLFormElement>,
        formattedLink: string | null
    ): void {

        logger.debug("onSubmitConfigureLinkForm()");

        // prevent the form from submitting
        e.preventDefault();

        setConfigureLinkModalIsOpen(false);
        setFormattedLink(formattedLink);

    }

    /**
     * Called when the user closes the `ConfigureLinkModal`.
     */
    function closeConfigureLinkModal(
        e: React.MouseEvent | React.KeyboardEvent,
        formattedLink: string | null
    ): void {
        logger.debug("closeConfigureLinkModal()");
        setConfigureLinkModalIsOpen(false);
        setFormattedLink(formattedLink);
    }

    // MARK: - Enter Barcode View -

    function openEnterBarcodeView(): void {
        setEnterBarcodeViewIsOpen(true);
    }

    function closeEnterBarcodeView(): void {
        logger.debug("closeEnterBarcodeView()");
        setEnterBarcodeViewIsOpen(false);
    }

    function insertClientScannedBarcodeID(barcodeID: string): void {
        setClientScannedBarcodeIDs((ids) => {
            ids.add(barcodeID);
            return ids;
        });
    }

    // MARK: --- Rendering ---

    return (
        <div className="vw-100 vh-100">

            <title>
                {prefixWithHostIfPort(
                    `Scans for ${user} | BarcodeDrop`
                )}
            </title>

            {/* only shows when VITE_SHOW_BREAKPOINT_VIEW = true */}
            <DebugBreakpointView />

            <EnterBarcodeView
                isOpen={enterBarcodeViewIsOpen}
                user={user}
                onClose={closeEnterBarcodeView}
                insertClientScannedBarcodeID={insertClientScannedBarcodeID}
                showToast={showToast}
            />

            <ConfigureLinkModal
                configureLinkInputRef={configureLinkInputRef}
                formattedLink={formattedLink}
                showFormattedLinkModal={configureLinkModalIsOpen}
                viewportSize={viewportSize}
                closeConfigureLinkModal={closeConfigureLinkModal}
                onSubmitConfigureLinkForm={onSubmitConfigureLinkForm}
            />
            <UserScansToast currentToastID={currentToastID} />

            <MainNavbar user={user}/>

            <Container fluid="md" className="pb-5" style={{
                maxWidth: "1000px"
            }}>
                <div className="row">
                    <h2 style={{ margin: "30px 0px 0px 0px" }}>
                        <strong className="scans-for-user-text">
                            Scanned Barcodes for <em style={{ color: "gray" }}>{user}</em>
                        </strong>
                    </h2>
                </div>

                {/* --- Spacer --- */}

                <Stack direction="horizontal" className="pt-4 pb-3" gap={2}>
                    <div className="pe-1">
                        {/* --- Delete All --- */}
                        <OverlayTrigger
                            placement="top"
                            delay={{ show: 500, hide: 250 }}
                            overlay={
                                <Tooltip>
                                    {deleteAllUserBarcodesKeyboardShortcutString()}
                                </Tooltip>
                            }
                        >
                            <Button
                                variant="danger"
                                onClick={deleteAllUserBarcodes}
                            >
                                Delete All Barcodes
                            </Button>
                        </OverlayTrigger>

                    </div>
                    <div className="p-1">
                        {/* MARK: Main Dropdown Menu */}
                        <MainDropdownMenu
                            disabledClassIfZeroBarcodes={disabledClassIfZeroBarcodes}
                            copyAsCSV={copyAsCSV}
                            exportAsCSV={exportAsCSV}
                            copyLastBarcodeToClipboard={copyLastBarcodeToClipboard}
                            openEnterBarcodeView={openEnterBarcodeView}
                            showConfigureLinkModal={showConfigureLinkModal}
                        />
                    </div>
                    <div className="p-1">
                        {/* MARK: Auto-Copy */}
                        <label
                            style={{ padding: "5px 10px" }}
                            className=""
                            title={`(${toggleAutoCopyKeyboardShortcutString()}) Automatically copy the most recent barcode to the clipboard`}
                        >
                            <input
                                type="checkbox"
                                name="enable-auto-copy"
                                id="enable-auto-copy"
                                checked={autoCopyIsEnabled}
                                onChange={handleAutoCopyChange}
                            />
                            <span style={{ marginLeft: "5px" }}>
                                Auto-Copy
                            </span>
                        </label>
                    </div>
                </Stack>

                {/* MARK: User Scans Table */}
                <UserScansTable
                    barcodes={barcodes}
                    user={user}
                    highlightedBarcode={highlightedBarcode}
                    viewportSize={viewportSize}
                    removeBarcodesFromState={
                        removeBarcodesFromState
                    }
                    setHighlightedBarcode={
                        setHighlightedBarcode
                    }
                    onClickOpenLink={onClickOpenLink}
                />

            </Container>
        </div>
    );

}
