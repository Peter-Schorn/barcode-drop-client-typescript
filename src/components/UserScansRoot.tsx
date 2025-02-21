import {
    type JSX,
    type ChangeEvent,
    type FormEvent,
    useContext,
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo
} from "react";
import { useParams } from "react-router-dom";

import { AppContext } from "../model/AppContext.ts";

import { Container, Button, Stack } from "react-bootstrap";
// import Toast from 'react-bootstrap/Toast';
import { toast } from "react-hot-toast";

// import csv from 'csv'
import { stringify as csvStringify } from "csv-stringify/browser/esm/sync";

import { MainNavbar } from "./MainNavbar.tsx";
// import UserScansTable from "./UserScansTable";

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
    prefixTitleWithDocumentHostIfPort,
    setToString,
    latestBarcodeChanged
} from "../utils/MiscellaneousUtilities.ts";
import { SocketMessageTypes } from "../model/SocketMessageTypes.ts";

import { UserScansTable } from "./UserScansTable.tsx";
import { ConfigureLinkModal } from "./ConfigureLinkModal.tsx";
import { UserScansToast } from "./UserScansToast.tsx";
import { ScanBarcodeView } from "./ScanBarcodeView.tsx";
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

import { scannedBarcodesReviver } from "../utils/parsing.ts";


// MARK: path="/scans/:user"
export function UserScansRoot(): JSX.Element {

    const params = useParams<UserScansRootParams>();

    const context = useContext(AppContext);

    // MARK: - URL Fragment Parameters -
    // the parameters in the URL fragment; e.g.: `auto-copy=true` in
    // https://www.barcodedrop.com/scans/schornpe#auto-copy=true
    const urlFragmentParams = new URLSearchParams(
        window.location.hash.slice(1)
    );

    const enableAutoCopyValue = urlFragmentParams.get("auto-copy") === "true";
    const formattedLinkValue = urlFragmentParams.get("formatted-link");

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

    const [autoCopyIsEnabled, setAutoCopyIsEnabled] = useState<boolean>(
        enableAutoCopyValue
    );

    const [
        highlightedBarcode,
        _setHighlightedBarcode
    ] = useState<ScannedBarcodeResponse | null>(null);

    const [formattedLink, setFormattedLink] = useState<string | null>(
        formattedLinkValue
    );

    const [configureLinkModalIsOpen, setConfigureLinkModalIsOpen] = useState(false);

    const [scanBarcodeViewIsOpen, setScanBarcodeViewIsOpen] = useState(false);

    const [viewportSize, setViewportSize] = useState<ViewportSize>({
        width: window.innerWidth,
        height: window.innerHeight
    });

    /** The ID of the current toast show on the screen */
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

    const socketURL = new URL(import.meta.env.VITE_BACKEND_URL);
    if (import.meta.env.DEV) {
        socketURL.protocol = "ws";
    }
    else {
        socketURL.protocol = "wss";
    }
    socketURL.pathname = `/watch/${user}`;

    console.log(
        `UserScansRoot: socketURL: ${socketURL}`
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
    const getUserScans = useCallback(({ user }: { user: string }): void => {

        const dateString = new Date().toISOString();

        console.log(
            "UserScansRoot.getUserScans(): Getting scans for " +
            `user "${user}" at date ${dateString}`
        );

        context.api!.getUserScans(user)
            .then((result) => {

                console.log(
                    "UserScansRoot.getUserScans(): result:", result
                );
                setBarcodes(result);

            }).catch((error) => {
                console.error(
                    `UserScansRoot.getUserScans(): error: ${error}`
                );
            });

    }, [context.api]);

    const deleteAllUserBarcodes = useCallback((): void => {

        console.log(
            "UserScansRoot.deleteAllUserBarcodes(): " +
            "Deleting all user barcodes"
        );

        // delete the barcodes
        setBarcodes([]);

        context.api!.deleteUserScans({ user: user })
            .then((result) => {
                console.log(
                    "UserScansRoot.deleteAllUserBarcodes(): " +
                    `result: ${result}`
                );
            })
            .catch((error) => {
                console.error(
                    "UserScansRoot.deleteAllUserBarcodes(): " +
                    `could not delete all user barcodes: ${error}`
                );
            });

    }, [context.api, user]);

    const removeBarcodesFromState = useCallback((barcodeIDs: Set<string>): void => {
        const barcodeIDsString = setToString(barcodeIDs);
        console.log(
            `Removing barcode with IDs from state: ${barcodeIDsString}`
        );

        setBarcodes((prevBarcodes) => {
            barcodeIDs.forEach(element => deleteIDs.add(element));

            console.log(
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
        type: "success" | "error" = "success"
    ): void => {

        if (currentToastID) {
            toast.dismiss(currentToastID);
        }

        // we will use the toast ID to dismiss the toast later
        const toastID = toast[type](
            message,
            { duration: 5_000 }
        );

        setCurrentToastID(toastID);

    }, [currentToastID]);

    const showBarcodeCopiedToast = useCallback((barcodeText: string): void => {
        console.log(`showBarcodeCopiedToast(): barcode: ${barcodeText}`);

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
    const writeBarcodeToClipboard = useCallback((
        {
            barcode,
            showNotification,
            highlight
        }: WriteBarcodeToClipboardOptions
    ): void => {

        const barcodeText = barcode.barcode;
        if (barcodeText === null || barcodeText === undefined) {
            console.error(
                "_writeBarcodeToClipboard: barcode text is null or undefined"
            );
            return;
        }

        navigator.clipboard.writeText(barcodeText)
            .then(() => {

                console.log(
                    "_writeTextToClipboard: Copied text to clipboard: " +
                    `"${barcodeText}"`
                );

                if (showNotification) {
                    console.log(
                        "_writeTextToClipboard: " +
                        "--- SHOWING BARCODE COPIED TOAST ---" +
                        `(id: ${barcode?.id})`
                    );
                    showBarcodeCopiedToast(barcodeText);
                }

                if (highlight) {
                    console.log(
                        "_writeTextToClipboard: --- HIGHLIGHT --- " +
                        `(id: ${barcode?.id})`
                    );
                    setHighlightedBarcode(barcode);
                }

            })
            .catch((error) => {
                console.error(
                    "_writeTextToClipboard: Could not copy text to clipboard: " +
                    `"${barcodeText}": ${error}`
                );
            });

    }, [setHighlightedBarcode, showBarcodeCopiedToast]);

    const copyLastBarcodeToClipboard = useCallback((): void => {

        const latestBarcode = barcodes[0];

        if (latestBarcode) {

            console.log(
                "UserScansRoot.copyLastBarcodeToClipboard(): " +
                "Copying latest barcode to clipboard: " +
                `"${JSON.stringify(latestBarcode)}"`
            );

            writeBarcodeToClipboard({
                barcode: latestBarcode,
                showNotification: true,
                highlight: true
            });
        }
        else {
            console.log(
                "UserScansRoot.copyLastBarcodeToClipboard(): " +
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

    const copyAsCSV = useCallback((): void => {

        console.log("copyAsCSV()");

        if (copyLastBarcodeIsDisabled()) {
            console.error(
                "copyAsCSV(): cannot copy CSV to clipboard: no barcodes"
            );
            return;
        }

        const csvString = makeCSVString();

        console.log("copyAsCSV(): csvString:", csvString);

        navigator.clipboard.writeText(csvString)
            .then(() => {
                console.log("copyAsCSV(): copied CSV to clipboard");
                showToast("Copied CSV to clipboard");
            })
            .catch((error) => {
                console.error(
                    `copyAsCSV(): could not copy CSV to clipboard: ${error}`
                );
                showToast("Could not copy CSV to clipboard", "error");
            });

    }, [copyLastBarcodeIsDisabled, makeCSVString, showToast]);

    const exportAsCSV = useCallback((): void => {

        console.log(
            "exportAsCSV(): barcodes:", barcodes
        );

        if (copyLastBarcodeIsDisabled()) {
            console.error(
                "exportAsCSV(): cannot export CSV: no barcodes"
            );
            return;
        }

        const date = new Date();
        const dateString = date.toISOString();

        const csvString = makeCSVString();

        console.log("exportAsCSV(): csvString:", csvString);

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
            console.log(
                "Auto-copy is disabled; not copying latest barcode"
            );
            return;
        }

        if (clientScannedBarcodeIDs.has(barcode.id)) {
            console.log(
                "will NOT copy barcode scanned from CLIENT:",
                barcode
            );
            return;
        }

        setLastAutoCopiedBarcode(barcode);

        console.log(
            `Auto-copying most recent barcode: "${JSON.stringify(barcode)}"`
        );

        writeBarcodeToClipboard({
            barcode: barcode,
            showNotification: true,
            highlight: true
        });

    }, [
        writeBarcodeToClipboard,
        clientScannedBarcodeIDs,
        autoCopyIsEnabled,
    ]);

    // MARK: - Effects -

    // MARK: handleHashChange effect
    useEffect(() => {

        console.log("UserScansRoot: useEffect: handleHashChange: begin");

        function handleHashChange(): void {
            console.log(
                "UserScansRoot.handleHashChange(): " +
                `hash: ${window.location.hash}`
            );
            const urlFragmentParams = new URLSearchParams(
                window.location.hash.slice(1)
            );
            const enableAutoCopy = urlFragmentParams.get("auto-copy") === "true";
            const formattedLink = urlFragmentParams.get("formatted-link");

            console.log(
                "UserScansRoot.handleHashChange(): " +
                `enableAutoCopy: ${enableAutoCopy}`
            );

            setAutoCopyIsEnabled(enableAutoCopy);
            setFormattedLink(formattedLink);

        }

        window.addEventListener("hashchange", handleHashChange);

        return (): void => {
            console.log("UserScansRoot: useEffect: handleHashChange: cleanup");
            window.removeEventListener("hashchange", handleHashChange);
        };

    }, []);

    // MARK: handleKeyDown effect
    useEffect(() => {

        console.log("UserScansRoot: useEffect: handleKeyDown: begin");

        function handleKeyDown(e: KeyboardEvent): void {

            // console.log(
            //     `UserScansRoot.handleKeyDown(): key: ${e.key}; code: ${e.code}; ` +
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
                    console.log(
                        "UserScansRoot.handleKeyDown(): " +
                        "Platform modifier key + \"k\" pressed: copying barcode"
                    );
                    copyLastBarcodeToClipboard();
                    e.preventDefault();
                }
                else if (e.key === "d" && !e.shiftKey && !e.altKey) {
                    console.log(
                        "UserScansRoot.handleKeyDown(): " +
                        "Platform modifier key + \"d\" pressed: DELETING all barcodes"
                    );
                    deleteAllUserBarcodes();
                    e.preventDefault();
                }
                else if (e.key === "e" && e.shiftKey && !e.altKey) {
                    console.log(
                        "UserScansRoot.handleKeyDown(): " +
                        "Platform modifier key + shift + \"e\" pressed: EXPORTING all barcodes as CSV"
                    );
                    exportAsCSV();
                    e.preventDefault();
                }
                else if (e.key === "e" && !e.shiftKey && !e.altKey) {
                    console.log(
                        "UserScansRoot.handleKeyDown(): " +
                        "Platform modifier key + \"e\" pressed: COPYING all barcodes as CSV"
                    );
                    copyAsCSV();
                    e.preventDefault();
                }
                else if (e.key === "l" && !e.shiftKey && !e.altKey) {
                    console.log(
                        "UserScansRoot.handleKeyDown(): " +
                        "Platform modifier key + \"l\" pressed: " +
                        "SHOWING configure link"
                    );
                    showConfigureLinkModal();
                    e.preventDefault();
                }
                else if (e.key === "z" && !e.shiftKey && !e.altKey) {
                    console.log(
                        "UserScansRoot.handleKeyDown(): " +
                        "Platform modifier key + \"a\" pressed: " +
                        "toggling auto copy"
                    );
                    toggleAutoCopy();
                    e.preventDefault();
                }
                else if (e.key === "s" && !e.shiftKey && !e.altKey) {
                    console.log(
                        "UserScansRoot.handleKeyDown(): " +
                        "Platform modifier key + \"s\" pressed: " +
                        "SHOWING scan barcode view"
                    );
                    openScanBarcodeView();
                    e.preventDefault();
                }
                else {
                    console.log(
                        "UserScansRoot.handleKeyDown(): " +
                        `Platform modifier key + "${e.key}" pressed`
                    );
                }

            }

        }

        window.addEventListener("keydown", handleKeyDown);

        return (): void => {
            console.log("UserScansRoot: useEffect: handleKeyDown: cleanup");
            window.removeEventListener("keydown", handleKeyDown);
        };

    }, [
        copyLastBarcodeToClipboard,
        barcodes,
        copyAsCSV,
        deleteAllUserBarcodes,
        exportAsCSV
    ]);

    // MARK: windowDidResize effect
    useEffect(() => {

        console.log("UserScansRoot: useEffect: windowDidResize: begin");

        function windowDidResize(): void {

            const size = {
                width: window.innerWidth,
                height: window.innerHeight
            };

            console.log(
                "UserScansTableCore.windowDidResize(): size:",
                size
            );

            setViewportSize(size);

        }

        window.addEventListener("resize", windowDidResize);

        return (): void => {
            console.log("UserScansRoot: useEffect: windowDidResize: cleanup");
            window.removeEventListener("resize", windowDidResize);
        };

    }, []);

    // MARK: promptForClipboardPermission effect
    useEffect(() => {

        console.log(
            "UserScansRoot: useEffect: promptForClipboardPermission: begin"
        );

        // clipboard-write is supported by some browsers, but not all
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        navigator.permissions.query({ name: "clipboard-write" as any })
            .then(result => {
                if (result.state === "granted" || result.state === "prompt") {
                    console.log(
                        `Clipboard permissions granted: ${result.state}`
                    );
                }
                else {
                    console.error(
                        `Clipboard permissions denied: ${result.state}`
                    );
                }
            }).catch(error => {
                console.error(
                    "Error querying clipboard permissions:", error
                );
            });

    }, []);

    // MARK: getUserScans effect
    useEffect(() => {
        console.log("UserScansRoot: useEffect: getUserScans: begin");
        getUserScans({ user: user });
    }, [getUserScans, user]);

    // MARK: configureSocket effect
    useEffect(() => {

        console.log("UserScansRoot: useEffect: configureSocket: begin");

        function receiveSocketMessage(event: MessageEvent): void {

            console.log(
                `[${new Date().toISOString()}] ` +
                "UserScansRoot.receiveSocketMessage(): " +
                "event:", event
            );

            let message: SocketMessage; // the parsed JSON message
            try {
                message = JSON.parse(
                    event.data as string,
                    scannedBarcodesReviver
                ) as SocketMessage;
            }
            catch (error) {
                console.error(
                    "UserScansRoot.receiveSocketMessage(): " +
                    "could not parse JSON message:", error
                );
                return;
            }

            switch (message.type) {
                // MARK: Insert new scans
                case SocketMessageTypes.UpsertScans: {
                    const newScans = message.newScans;

                    console.log(
                        "UserScansRoot.receiveSocketMessage(): " +
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

                        console.log(
                            "UserScansRoot.receiveSocketMessage(): " +
                            "Returning new barcodes:", newBarcodes
                        );
                        return newBarcodes;

                    });

                    break;
                }
                // MARK: Delete scans
                case SocketMessageTypes.DeleteScans: {
                    const ids = message.ids;

                    console.log(
                        `socket will delete barcodes with IDs ${ids}`
                    );
                    const idsSet = new Set(ids);
                    removeBarcodesFromState(idsSet);
                    break;
                }
                // MARK: Replace all scans
                case SocketMessageTypes.ReplaceAllScans: {
                    const scans = message.scans;

                    console.log(
                        `socket will replace all scans for user ${user}:`,
                        scans
                    );
                    setBarcodes(scans);
                    deleteIDs.clear();
                    break;
                }
                default: {
                    console.error(
                        "UserScansRoot.receiveSocketMessage(): " +
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
            connectionTimeout: 10_000,  //
            debug: true
        };

        socket.current = new WebSocket(
            socketURL.href,
            [],
            wsOptions
        );

        socket.current.onopen = (event: Event): void => {

            console.log(
                `[${new Date().toISOString()}] socket.onopen(): event:`, event
            );

            getUserScans({ user: user });

        };

        socket.current.onmessage = (event: MessageEvent): void => {
            receiveSocketMessage(event);
        };

        socket.current.onclose = (event: CloseEvent): void => {

            console.log(
                `[${new Date().toISOString()}] socket.onclose(): event:`,
                event
            );

        };

        socket.current.onerror = (event: ErrorEvent): void => {

            console.error(
                `[${new Date().toISOString()}] socket.onerror(): event:`, event
            );

        };

        return (): void => {
            console.log("UserScansRoot: useEffect: configureSocket: cleanup");
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

        console.log("UserScansRoot: useEffect: barcodes changed: begin");

        // fast path; might improve performance
        if (barcodes.length === 0) {
            return;
        }

        // const previousBarcode = lastAutoCopiedBarcode;
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
        console.log(
            "UserScansRoot.handleAutoCopyChange(): " +
            `e.target.checked (enable auto-copy): ${enableAutoCopy}`
        );

        const urlFragmentParams = new URLSearchParams(
            // the first character is the # character
            window.location.hash.slice(1)
        );
        urlFragmentParams.set("auto-copy", enableAutoCopy.toString());
        window.location.hash = urlFragmentParams.toString();

        console.log(
            "UserScansRoot.handleAutoCopyChange(): " +
            `set URL fragment to: ${window.location.hash}`
        );

        setAutoCopyIsEnabled(enableAutoCopy);

    }

    function deleteAllUserBarcodesKeyboardShortcutString(): string {
        return isApplePlatform() ? "⌘D" : "Ctrl+D";
    }

    function toggleAutoCopyKeyboardShortcutString(): string {
        return isApplePlatform() ? "⌘Z" : "Ctrl+Z";
    }

    function toggleAutoCopy(): void {

        setAutoCopyIsEnabled((enableAutoCopy) => {
            const newValue = !enableAutoCopy;
            console.log(
                `UserScansRoot.toggleAutoCopy(): set to ${newValue}`
            );

            const urlFragmentParams = new URLSearchParams(
                // the first character is the # character
                window.location.hash.slice(1)
            );

            urlFragmentParams.set(
                "auto-copy",
                newValue.toString()
            );
            window.location.hash = urlFragmentParams.toString();

            return newValue;
        });

    }

    function disabledClassIfZeroBarcodes(): string {
        return copyLastBarcodeIsDisabled() ? "disabled" : "";
    }

    // MARK: - Links -

    function onClickOpenLink(barcode: ScannedBarcodeResponse): void {

        console.log("onClickOpenLink(): barcode:", barcode);

        const barcodeText = barcode.barcode;

        if (!formattedLink) {
            console.error(
                "onClickOpenLink(): formatted link is null or undefined"
            );
            return;
        }

        const urlString = formattedLink.replace("%s", barcodeText);
        console.log(
            `onClickOpenLink(): opening link: "${urlString}" ` +
            `for barcode: "${barcodeText}"`
        );

        try {

            const url = new URL(urlString);

            const barcodedropHost = "www.barcodedrop.com";
            if ([barcodedropHost, document.location.host].includes(url.host)) {
                console.log(
                    "onClickOpenLink(): will NOT open link because same host: " +
                    `"${urlString}" `
                );
                return;
            }

            window.open(url, "_blank");

        } catch (error) {
            console.error(
                `onClickOpenLink(): could not open link: "${urlString}": ${error}`
            );
        }

    }

    function showConfigureLinkModal(): void {
        console.log("showConfigureLinkModal():");
        setConfigureLinkModalIsOpen(true);
    }

    /**
     * Called every time the input field for the formatted link in
     * `ConfigureLinkModal` changes.
     *
     * @param e the event
     */
    function onChangeConfigureLinkInput(e: ChangeEvent<HTMLInputElement>): void {

        const formattedLink = e.target.value;
        console.log(
            `onChangeConfigureLinkInput(): formattedLink: ${formattedLink}`
        );

        setFormattedLink(formattedLink);

    }

    /**
     * Called when the user submits the `ConfigureLinkModal` form.
     *
     * @param e the event
     */
    function onSubmitConfigureLinkForm(
        e: FormEvent<HTMLFormElement>
    ): void {

        console.log("onSubmitConfigureLinkForm()");

        // prevent the form from submitting
        e.preventDefault();

        setConfigureLinkModalIsOpen(false);

        updateFormattedLinkInURLFragment();

    }

    /**
     * Called when the user closes the `ConfigureLinkModal`.
     */
    function closeConfigureLinkModal(): void {
        console.log("closeConfigureLinkModal()");
        setConfigureLinkModalIsOpen(false);
        updateFormattedLinkInURLFragment();
    }

    /**
     * Updates the formatted link in the URL fragment based on the value of the
     * `formattedLink` state variable.
     */
    function updateFormattedLinkInURLFragment(): void {

        const urlFragmentParams = new URLSearchParams(
            window.location.hash.slice(1)
        );

        // check if `formattedLink` is null or an empty string.
        if (!formattedLink) {
            urlFragmentParams.delete("formatted-link");
        }
        else {
            urlFragmentParams.set("formatted-link", formattedLink);
        }
        window.location.hash = urlFragmentParams.toString();

    }

    // MARK: - Scan Barcode View -

    function openScanBarcodeView(): void {
        setScanBarcodeViewIsOpen(true);
    }

    function closeScanBarcodeView(): void {
        console.log("closeScanBarcodeView()");
        setScanBarcodeViewIsOpen(false);
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
                {prefixTitleWithDocumentHostIfPort(
                    `Scans for ${user} | BarcodeDrop`
                )}
            </title>

            {/* only shows when VITE_SHOW_BREAKPOINT_VIEW = true */}
            <DebugBreakpointView />

            <ScanBarcodeView
                showScanBarcodeModal={scanBarcodeViewIsOpen}
                user={user}
                onClose={closeScanBarcodeView}
                insertClientScannedBarcodeID={insertClientScannedBarcodeID}
            />

            <ConfigureLinkModal
                formattedLink={formattedLink}
                showFormattedLinkModal={configureLinkModalIsOpen}
                viewportSize={viewportSize}
                onChangeConfigureLinkInput={onChangeConfigureLinkInput}
                closeConfigureLinkModal={closeConfigureLinkModal}
                onSubmitConfigureLinkForm={onSubmitConfigureLinkForm}
            />
            <UserScansToast currentToastID={currentToastID} />

            <MainNavbar />

            <Container fluid="md" style={{
                maxWidth: "1000px"
                // maxWidth: "300px"
                // maxWidth: "vw-100"
            }}>
                {/* <div className="container-md"> */}

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

                        <Button
                            variant="danger"
                            style={{ margin: "0px 0px" }}
                            onClick={deleteAllUserBarcodes}
                            data-toggle="tooltip"
                            data-placement="top"
                            title={deleteAllUserBarcodesKeyboardShortcutString()}
                        >
                            Delete All Barcodes
                        </Button>
                    </div>
                    <div className="p-1">
                        {/* *** ==================================== *** */}
                        {/* *** === Dropdown - Main Context Menu === *** */}
                        {/* *** ==================================== *** */}
                        <MainDropdownMenu
                            disabledClassIfZeroBarcodes={disabledClassIfZeroBarcodes}
                            copyAsCSV={copyAsCSV}
                            exportAsCSV={exportAsCSV}
                            copyLastBarcodeToClipboard={copyLastBarcodeToClipboard}
                            openScanBarcodeView={openScanBarcodeView}
                            showConfigureLinkModal={showConfigureLinkModal}
                        />
                    </div>
                    <div className="p-1">
                        {/* Auto-Copy */}

                        <label
                            style={{ padding: "5px 10px" }}
                            className=""
                            data-toggle="tooltip"
                            data-placement="top"
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

                {/* --- spacer --- */}

                {/* *** ===================================== *** */}
                {/* *** ========= Table of Barcodes ========= *** */}
                {/* *** ===================================== *** */}

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
            {/* /div> */}
        </div>
    );

}
