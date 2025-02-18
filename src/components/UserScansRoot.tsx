import React, {
    type JSX,
    Component,
    useContext,
    useState,
    useRef,
    useEffect,
    useCallback
} from "react";
import { useParams } from "react-router-dom";

import { AppContext } from "../model/AppContext.ts";

import { Container, Button, Dropdown, Stack } from "react-bootstrap";
// import Toast from 'react-bootstrap/Toast';
import { toast } from "react-hot-toast";

// import csv from 'csv'
import { stringify as csvStringify } from "csv-stringify/browser/esm/sync";

import MainNavbar from "./MainNavbar.tsx";
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
    setToString
} from "../utils/MiscellaneousUtilities.ts";
import { SocketMessageTypes } from "../model/SocketMessageTypes.ts";

import UserScansTable from "./UserScansTable.tsx";
import { ConfigureLinkModal } from "./ConfigureLinkModal.tsx";
import { UserScansToast } from "./UserScansToast.tsx";
import { ScanBarcodeView } from "./ScanBarcodeView.tsx";

import {
    type ScannedBarcodeResponse,
    type ScannedBarcodesResponse
} from "../types/ScannedBarcodesResponse.ts";

import { type ViewportSize } from "../types/ViewportSize.ts";
import { type UserScansRootParams } from "../types/UserScansRootParams.ts";

import { scannedBarcodesReviver } from "../utils/parsing.ts";

// MARK: path="/scans/:user"
export default function UserScansRoot(): JSX.Element {

    const params = useParams<UserScansRootParams>();

    return (
        <UserScansRootCore
            router={{
                params: params
            }}
        />
    );

}

type WriteBarcodeToClipboardOptions = {
    showNotification: boolean;
    highlight: boolean;
    barcode: ScannedBarcodeResponse;
};

export function UserScansRootNew(): JSX.Element {

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

    // TODO: Renamed to autoCopyIsEnabled
    const [enableAutoCopy, setEnableAutoCopy] = useState<boolean>(
        enableAutoCopyValue
    );

    const [
        highlightedBarcode,
        setHighlightedBarcode
    ] = useState<ScannedBarcodeResponse | null>(null);

    const [formattedLink, setFormattedLink] = useState<string | null>(
        formattedLinkValue
    );

    const [showFormattedLinkModal, setShowFormattedLinkModal] = useState(false);

    const [showScanBarcodeView, setShowScanBarcodeView] = useState(false);

    const [viewportSize, setViewportSize] = useState<ViewportSize>({
        width: window.innerWidth,
        height: window.innerHeight
    });

    // MARK: End State

    const deleteIDs = new Set<string>();
    // clearInterval takes number | undefined, so we can't use null for
    // pingPongInterval, removeHighlightedBarcodeTimer, and
    // copyBarcodeAfterDelayTimeout
    let removeHighlightedBarcodeTimer: number | undefined = undefined;

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

    // MARK: - Effects -

    useEffect(() => {

        console.log("UserScansRoot.useEffect(): begin");

        getUserScans({ user: user });

        configureSocket();

        window.addEventListener("hashchange", handleHashChange);
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("resize", windowDidResize);

        promptForClipboardPermission();

        return (): void => {
            console.log("UserScansRoot.useEffect(): cleanup");

            clearTimeout(removeHighlightedBarcodeTimer);

            window.removeEventListener("hashchange", handleHashChange);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", windowDidResize);

            socket.current?.close();

        };

    }, []);

    function handleHashChange(): void {
        console.log(
            "UserScansRootCore.handleHashChange(): " +
            `hash: ${window.location.hash}`
        );
        const urlFragmentParams = new URLSearchParams(
            window.location.hash.slice(1)
        );
        const enableAutoCopy = urlFragmentParams.get("auto-copy") === "true";
        const formattedLink = urlFragmentParams.get("formatted-link");

        console.log(
            "UserScansRootCore.handleHashChange(): " +
            `enableAutoCopy: ${enableAutoCopy}`
        );

        setEnableAutoCopy(enableAutoCopy);
        setFormattedLink(formattedLink);

    }

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

    function promptForClipboardPermission(): void {

        console.log("promptForClipboardPermission");

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

    }

    function handleKeyDown(e: KeyboardEvent): void {

        // console.log(
        //     `UserScansRootCore.handleKeyDown(): key: ${e.key}; code: ${e.code}; ` +
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
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"k\" pressed: copying barcode"
                );
                const latestBarcode = barcodes[0];
                if (latestBarcode) {
                    _writeBarcodeToClipboard({
                        barcode: latestBarcode,
                        showNotification: true,
                        highlight: true
                    });
                    e.preventDefault();
                }
                else {
                    console.log(
                        "UserScansRootCore.handleKeyDown(): " +
                        "latest barcode is null or undefined"
                    );
                }
            }
            else if (e.key === "d" && !e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"d\" pressed: DELETING all barcodes"
                );
                deleteAllUserBarcodes();
                e.preventDefault();
            }
            else if (e.key === "e" && e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + shift + \"e\" pressed: EXPORTING all barcodes as CSV"
                );
                exportAsCSV();
                e.preventDefault();
            }
            else if (e.key === "e" && !e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"e\" pressed: COPYING all barcodes as CSV"
                );
                copyAsCSV();
                e.preventDefault();
            }
            else if (e.key === "l" && !e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"l\" pressed: " +
                    "SHOWING formatted link"
                );
                setShowFormattedLinkModal(true);
                e.preventDefault();
            }
            else if (e.key === "z" && !e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"a\" pressed: " +
                    "toggling auto copy"
                );
                toggleAutoCopy();
                e.preventDefault();
            }
            else if (e.key === "s" && !e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"s\" pressed: " +
                    "SHOWING scan barcode view"
                );
                setShowScanBarcodeView(true);
                e.preventDefault();
            }
            else {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    `Platform modifier key + "${e.key}" pressed`
                );
            }

        }

    }

    function configureSocket(): void {

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

    }

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
                    "UserScansRootCore.receiveSocketMessage(): " +
                    "socket could not handle message:", message
                );
            }
        }

    }

    /**
     * Determines if the current barcode is different from the previous barcode
     * AND if the current barcode is *NEWER* than the previous barcode.
     *
     * @param previousBarcode the previous barcode
     * @param currentBarcode the current barcode
     * @returns `true` if the current barcode is different from the
     * previous barcode AND if the current barcode is *NEWER* than the previous
     * barcode; otherwise, `false`
     */
    function latestBarcodeChanged(
        previousBarcode: ScannedBarcodeResponse | null | undefined,
        currentBarcode: ScannedBarcodeResponse | null | undefined
    ): boolean {

        if (!currentBarcode || currentBarcode.id === previousBarcode?.id) {
            console.log(
                "UserScansRootCore.latestBarcodeChanged(): " +
                "most recent barcode has *NOT* changed at all/is null: " +
                `${JSON.stringify(currentBarcode)}`
            );
            return false;
        }

        /*
         We only want to auto-copy the most recent barcode if the most recent
         barcode is **NEWER** than the previously auto-copied barcode.

         For example, if the user deletes a barcode, then the most recent
         barcode will be older than the previously auto-copied barcode. In this
         case, we do *NOT* want to auto-copy the most recent barcode.
         */

        if (
            !previousBarcode ||
            currentBarcode.scanned_at >= previousBarcode.scanned_at
        ) {
            console.log(
                "UserScansRootCore.latestBarcodeChanged(): " +
                "most *RECENT* barcode *HAS* changed from " +
                `${JSON.stringify(previousBarcode)} to ` +
                `${JSON.stringify(currentBarcode)}`
            );
            return true;
        }
        else {
            console.log(
                "UserScansRootCore.latestBarcodeChanged(): " +
                "most *RECENT* barcode has *NOT* changed from " +
                `${JSON.stringify(previousBarcode)} to ` +
                `${JSON.stringify(currentBarcode)}`
            );
            return false;
        }
    }

    // MARK: - Auto-Copy -
    // copies the most recent barcode to the clipboard
    function autoCopyIfEnabled(): void {

        if (!enableAutoCopy) {
            console.log(
                "Auto-copy is disabled; not copying latest barcode"
            );
            return;
        }

        // `barcodes` could be empty, in which case indexing into the
        // array will return undefined
        const mostRecentBarcode = barcodes[0];
        if (!mostRecentBarcode) {
            console.log(
                "Auto-copy failed: most recent barcode is null or undefined"
            );
            return;
        }

        if (clientScannedBarcodeIDs.has(mostRecentBarcode.id)) {
            console.log(
                "will NOT copy barcode scanned from CLIENT:",
                mostRecentBarcode
            );
            return;
        }

        if (lastAutoCopiedBarcode?.id === mostRecentBarcode.id) {
            console.log(
                "AUTO-Copy failed: most recent barcode is the same as the " +
                "last auto-copied barcode:",
                mostRecentBarcode
            );
            return;

        }

        setLastAutoCopiedBarcode(mostRecentBarcode);

        console.log(
            `Auto-copying most recent barcode: "${JSON.stringify(mostRecentBarcode)}"`
        );

        _writeBarcodeToClipboard({
            barcode: mostRecentBarcode,
            showNotification: true,
            highlight: true
        });

    }

    function showBarcodeCopiedToast(barcodeText: string): void {
        console.log(`showBarcodeCopiedToast(): barcode: ${barcodeText}`);

        const barcodeTextMessage = barcodeText.truncated(30);

        // we will use the toast ID to dismiss the toast later
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const toastID = toast.success(
            `Copied "${barcodeTextMessage}" to the Clipboard`,
            {
                duration: 5_000
            }
        );

        // TODO: Toast can be dismissed by clicking on it
        // toast.dismiss(toastID);

    }

    /**
     * Get the user's scans and assign the result to state.barcodes.
     *
     * @param options the options
     * @param options.user the user
     *
     */
    function getUserScans({ user }: { user: string }): void {

        const dateString = new Date().toISOString();

        console.log(
            "UserScansRootCore.getUserScans(): Getting scans for " +
            `user "${user}" at date ${dateString}`
        );

        context.api!.getUserScans(user)
            .then((result) => {

                console.log(
                    "UserScansRootCore.getUserScans(): result:", result
                );
                setBarcodes(result);

            }).catch((error) => {
                console.error(
                    `UserScansRootCore.getUserScans(): error: ${error}`
                );
            });

    }

    function deleteAllUserBarcodes(): void {

        console.log(
            "UserScansRootCore.deleteAllUserBarcodes(): " +
            "Deleting all user barcodes"
        );

        // delete the barcodes
        setBarcodes([]);

        context.api!.deleteUserScans({ user: user })
            .then((result) => {
                console.log(
                    "UserScansRootCore.deleteAllUserBarcodes(): " +
                    `result: ${result}`
                );
            })
            .catch((error) => {
                console.error(
                    "UserScansRootCore.deleteAllUserBarcodes(): " +
                    `could not delete all user barcodes: ${error}`
                );
            });

    }

    function removeBarcodesFromState(barcodeIDs: Set<string>): void {
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

    }

    function handleAutoCopyChange(e: React.ChangeEvent<HTMLInputElement>): void {

        const enableAutoCopy = e.target.checked;
        console.log(
            "UserScansRootCore.handleAutoCopyChange(): " +
            `e.target.checked (enable auto-copy): ${enableAutoCopy}`
        );

        const urlFragmentParams = new URLSearchParams(
            // the first character is the # character
            window.location.hash.slice(1)
        );
        urlFragmentParams.set("auto-copy", enableAutoCopy.toString());
        window.location.hash = urlFragmentParams.toString();

        console.log(
            "UserScansRootCore.handleAutoCopyChange(): " +
            `set URL fragment to: ${window.location.hash}`
        );

        setEnableAutoCopy(enableAutoCopy);

    }

    function copyLastBarcodeToClipboard(): void {

        const latestBarcode = barcodes[0];

        if (latestBarcode) {

            console.log(
                "UserScansRootCore.copyLastBarcodeToClipboard(): " +
                "Copying latest barcode to clipboard: " +
                `"${JSON.stringify(latestBarcode)}"`
            );

            _writeBarcodeToClipboard({
                barcode: latestBarcode,
                showNotification: true,
                highlight: true
            });
        }
        else {
            console.log(
                "UserScansRootCore.copyLastBarcodeToClipboard(): " +
                "latest barcode is null or undefined"
            );
        }
    }

    function deleteAllUserBarcodesKeyboardShortcutString(): string {
        return isApplePlatform() ? "⌘D" : "Ctrl+D";
    }

    function copyAsCSVKeyboardShortcutString(): string {
        return isApplePlatform() ? "⌘E" : "Ctrl+E";
    }

    function exportAsCSVKeyboardShortcutString(): string {
        return isApplePlatform() ? "⌘⇧E" : "Ctrl+Shift+E";
    }

    function copyLastBarcodeKeyboardShortcutString(): string {
        return isApplePlatform() ? "⌘K" : "Ctrl+K";
    }

    function configureLinkKeyboardShortcutString(): string {
        return isApplePlatform() ? "⌘L" : "Ctrl+L";
    }

    function scanBarcodeKeyboardShortcutString(): string {
        return isApplePlatform() ? "⌘S" : "Ctrl+S";
    }

    function toggleAutoCopyKeyboardShortcutString(): string {
        return isApplePlatform() ? "⌘Z" : "Ctrl+Z";
    }

    function toggleAutoCopy(): void {

        setEnableAutoCopy((enableAutoCopy) => {
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

    /**
     * Makes a CSV string from the scanned barcodes for the user.
     *
     * @returns the CSV string.
     */
    function makeCSVString(): string {
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
    }

    function copyAsCSV(): void {

        console.log("copyAsCSV()");

        if (_copyLastBarcodeIsDisabled()) {
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
                toast.success("Copied CSV to clipboard");
            })
            .catch((error) => {
                console.error(
                    `copyAsCSV(): could not copy CSV to clipboard: ${error}`
                );
                toast.error("Could not copy CSV to clipboard");
            });

    }

    function exportAsCSV(): void {

        console.log(
            "exportAsCSV(): barcodes:", barcodes
        );

        if (_copyLastBarcodeIsDisabled()) {
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

    }

    function disabledClassIfZeroBarcodes(): string {
        return _copyLastBarcodeIsDisabled() ? "disabled" : "";
    }

    // MARK: - Links -

    function onClickOpenLink(barcode: ScannedBarcodeResponse): void {

        console.log("onClickOpenLink(): barcode:", barcode);

        const barcodeText = barcode.barcode;

        // TODO: Probably don't need to check for null or undefined
        if (barcodeText === null || barcodeText === undefined) {
            console.error(
                "onClickOpenLink(): barcode text is null or undefined"
            );
            return;
        }

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
        setShowFormattedLinkModal(true);
    }

    /**
     * Called every time the input field for the formatted link in
     * `ConfigureLinkModal` changes.
     *
     * @param e the event
     */
    function onChangeConfigureLinkInput(e: React.ChangeEvent<HTMLInputElement>): void {

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
        e: React.FormEvent<HTMLFormElement>
    ): void {

        console.log("onSubmitConfigureLinkForm()");

        // prevent the form from submitting
        e.preventDefault();

        setShowFormattedLinkModal(false);

        updateFormattedLinkInURLFragment();

    }

    /**
     * Called when the user closes the `ConfigureLinkModal`.
     */
    function closeConfigureLinkModal(): void {
        console.log("closeConfigureLinkModal()");
        setShowFormattedLinkModal(false);
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

    function onOpenScanBarcodeView(): void {
        setShowScanBarcodeView(true);
    }

    function closeScanBarcodeView(): void {
        console.log("closeScanBarcodeView()");
        setShowScanBarcodeView(false);
    }

    function insertClientScannedBarcodeID(barcodeID: string): void {
        setClientScannedBarcodeIDs((ids) => {
            ids.add(barcodeID);
            return ids;
        });
    }

    // MARK: Private Interface

    /**
     * Determines if the "Copy Latest Barcode" button is disabled, which
     * occurs when there are no barcodes.
     *
     * @returns `true` if the "Copy Latest Barcode" button is disabled.
     */
    function _copyLastBarcodeIsDisabled(): boolean {
        return barcodes.length === 0;
    }

    /**
     * Writes the barcode to the clipboard.
     *
     * @param options the options
     * @param options.barcode the barcode to write to the clipboard
     * @param options.showNotification whether or not to show a notification to
     * the user
     * @param options.highlight whether or not to highlight the barcode
     */
    function _writeBarcodeToClipboard(
        {
            barcode,
            showNotification,
            highlight
        }: WriteBarcodeToClipboardOptions
    ): void {

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
                    _setHighlightedBarcode(barcode);
                }

            })
            .catch((error) => {
                console.error(
                    "_writeTextToClipboard: Could not copy text to clipboard: " +
                    `"${barcodeText}": ${error}`
                );
            });

    }

    function _setHighlightedBarcode(barcode: ScannedBarcodeResponse): void {

        setHighlightedBarcode(barcode);

        clearTimeout(removeHighlightedBarcodeTimer);
        removeHighlightedBarcodeTimer = setTimeout(() => {
            setHighlightedBarcode(null);
        }, 5_000);
    }

    // MARK: --- Rendering ---

    function renderMainContextMenu(): JSX.Element {
        return (
            <Dropdown>
                <Dropdown.Toggle variant="success">
                    <i className="fa fa-ellipsis-v px-2"></i>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Dropdown.Item
                        className={disabledClassIfZeroBarcodes()}
                        onClick={copyAsCSV}
                    >
                        <div className="hstack gap-3">
                            <i className="fa fa-file-csv"></i>
                            <span>Copy as CSV</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {copyAsCSVKeyboardShortcutString()}
                            </span>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Item
                        className={disabledClassIfZeroBarcodes()}
                        onClick={exportAsCSV}
                    >
                        <div className="hstack gap-3">
                            <i className="fa-solid fa-file-export"></i>
                            <span>Export as CSV</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {exportAsCSVKeyboardShortcutString()}
                            </span>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Divider className="" />
                    <Dropdown.Item
                        className={disabledClassIfZeroBarcodes()}
                        onClick={copyLastBarcodeToClipboard}
                    >
                        <div className="hstack gap-3">
                            <i className="fa-solid fa-copy"></i>
                            <span>Copy Latest Barcode</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {copyLastBarcodeKeyboardShortcutString()}
                            </span>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Divider className="" />
                    {/* *** === Open Scan Barcode View === *** */}
                    <Dropdown.Item
                        onClick={onOpenScanBarcodeView}
                    >
                        <div className="hstack gap-3">
                            <i className="fa-solid fa-camera"></i>
                            <span>Scan Barcode...</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {scanBarcodeKeyboardShortcutString()}
                            </span>

                        </div>
                    </Dropdown.Item>
                    {/* *** === Configure Link *** === */}
                    <Dropdown.Item
                        onClick={showConfigureLinkModal}
                    >
                        <div className="hstack gap-3">
                            <i className="fa fa-link"></i>
                            <span>Configure Link...</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {configureLinkKeyboardShortcutString()}
                            </span>
                        </div>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        );
    }

    return (
        <div className="vw-100 vh-100">

            <title>
                {prefixTitleWithDocumentHostIfPort(
                    `Scans for ${user} | BarcodeDrop`
                )}
            </title>

            {/* if (process.env?.NODE_ENV === "development") {
                <DebugBreakpointView />
            } */}

            {/* {process.env?.NODE_ENV === "development" ?
                <DebugBreakpointView /> :
                null
            } */}

            {/* *** =====================-=== */}
            {/* *** === Scan Barcode View === */}
            {/* *** =====================-=== */}

            <ScanBarcodeView
                showScanBarcodeModal={showScanBarcodeView}
                user={user}
                onClose={closeScanBarcodeView}
                insertClientScannedBarcodeID={insertClientScannedBarcodeID}
            />

            <ConfigureLinkModal
                formattedLink={formattedLink}
                showFormattedLinkModal={showFormattedLinkModal}
                viewportSize={viewportSize}
                onChangeConfigureLinkInput={onChangeConfigureLinkInput}
                closeConfigureLinkModal={closeConfigureLinkModal}
                onSubmitConfigureLinkForm={onSubmitConfigureLinkForm}
            />
            <UserScansToast />

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
                        {renderMainContextMenu()}
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
                                checked={enableAutoCopy}
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
                        _setHighlightedBarcode
                    }
                    onClickOpenLink={onClickOpenLink}
                />

            </Container>
            {/* /div> */}
        </div>
    );

}

type UserScansRootCoreProps = {
    router: {
        params: Readonly<Partial<UserScansRootParams>>;
    };
};

type UserScansRootCoreState = {
    barcodes: ScannedBarcodesResponse;
    clientScannedBarcodeIDs: Set<string>;
    lastAutoCopiedBarcode: ScannedBarcodeResponse | null;
    enableAutoCopy: boolean;
    highlightedBarcode: ScannedBarcodeResponse | null;
    formattedLink: string | null;
    showFormattedLinkModal: boolean;
    showScanBarcodeView: boolean;
    viewportSize: ViewportSize;
};

class UserScansRootCore extends Component<UserScansRootCoreProps, UserScansRootCoreState> {

    // TODO: Add second app context for UserScansRootCore to pass to child
    // TODO: components (or maybe not)
    static override contextType = AppContext;

    declare context: React.ContextType<typeof AppContext>;

    deleteIDs: Set<string>;
    removeHighlightedBarcodeTimer: number | undefined;
    user: string;
    socketURL: URL;
    socket: React.RefObject<WebSocket | null>;

    constructor(props: UserScansRootCoreProps) {
        super(props);

        // MARK: - URL Fragment Parameters -
        // the parameters in the URL fragment; e.g.: `auto-copy=true` in
        // https://www.barcodedrop.com/scans/schornpe#auto-copy=true
        const urlFragmentParams = new URLSearchParams(
            window.location.hash.slice(1)
        );

        const enableAutoCopy = urlFragmentParams.get("auto-copy") === "true";
        const formattedLink = urlFragmentParams.get("formatted-link");
        console.log(
            `UserScansRootCore.constructor(): enableAutoCopy: ${enableAutoCopy}`
        );

        this.state = {
            barcodes: [],
            // the ids of barcodes scanned directly in the client that we don't
            // want to auto-copy even if auto-copy is enabled
            clientScannedBarcodeIDs: new Set<string>(),
            lastAutoCopiedBarcode: null,
            enableAutoCopy: enableAutoCopy,
            highlightedBarcode: null,
            formattedLink: formattedLink,
            showFormattedLinkModal: false,
            showScanBarcodeView: false,
            viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };


        this.deleteIDs = new Set<string>();
        // clearInterval takes number | undefined, so we can't use null for
        // pingPongInterval, removeHighlightedBarcodeTimer, and
        // copyBarcodeAfterDelayTimeout
        this.removeHighlightedBarcodeTimer = undefined;
        this.user = props.router.params.user!;

        if (this.user) {
            console.log(
                `UserScansRootCore.constructor(): user: ${this.user}`
            );
        }
        else {
            console.error(
                `UserScansRootCore.constructor(): invalid user: ${this.user}`
            );
        }

        // MARK: - WebSockets -

        const socketURL = new URL(import.meta.env.VITE_BACKEND_URL);
        if (import.meta.env.DEV) {
            socketURL.protocol = "ws";
        }
        else {
            socketURL.protocol = "wss";
        }

        this.socketURL = socketURL;

        this.socketURL.pathname = `/watch/${this.user}`;

        this.socket = React.createRef();

        console.log(
            `UserScansRootCore.constructor(): socketURL: ${this.socketURL}`
        );

    }

    override componentWillUnmount(): void {
        console.log("UserScansRootCore.componentWillUnmount():");

        clearTimeout(this.removeHighlightedBarcodeTimer);

        window.removeEventListener("hashchange", this.handleHashChange);
        document.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("resize", this.windowDidResize);

        this.socket.current?.close();

    }

    override componentDidMount(): void {

        console.log("UserScansRootCore.componentDidMount():");

        this.getUserScans({ user: this.user });

        // MARK: Configure event listeners

        window.addEventListener("hashchange", this.handleHashChange);
        document.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("resize", this.windowDidResize);

        // MARK: Configure WebSocket
        this.configureSocket();

        // MARK: Prompt for clipboard permissions
        console.log("componentDidMount(): Prompting for clipboard permissions");
        this.promptForClipboardPermission();

    }

    override componentDidUpdate(
        // prevProps: UserScansRootCoreProps,
        // prevState: UserScansRootCoreState
    ): void {
        console.log("UserScansRootCore.componentDidUpdate():");

        // if we use this, then the barcode could change from x to undefined,
        // and then back to x again, which would trigger the auto-copy again

        // const previousBarcode = prevState.barcodes[0];

        // instead, we use the last auto-copied barcode
        const previousBarcode = this.state.lastAutoCopiedBarcode;
        const currentBarcode = this.state.barcodes[0];

        if (this.latestBarcodeChanged(previousBarcode, currentBarcode)) {
            this.autoCopyIfEnabled();
        }

    }

    handleHashChange = (/* e: Event */): void => {
        console.log(
            "UserScansRootCore.handleHashChange(): " +
            `hash: ${window.location.hash}`
        );
        const urlFragmentParams = new URLSearchParams(
            window.location.hash.slice(1)
        );
        const enableAutoCopy = urlFragmentParams.get("auto-copy") === "true";
        const formattedLink = urlFragmentParams.get("formatted-link");

        console.log(
            "UserScansRootCore.handleHashChange(): " +
            `enableAutoCopy: ${enableAutoCopy}`
        );

        this.setState({
            enableAutoCopy: enableAutoCopy,
            formattedLink: formattedLink
        });

    };

    windowDidResize = (/* e: UIEvent */): void => {

        const size = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        console.log(
            "UserScansTableCore.windowDidResize(): size:",
            size
        );

        this.setState({
            viewportSize: size
        });

    };

    promptForClipboardPermission = (): void => {

        console.log("promptForClipboardPermission");

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

    };

    handleKeyDown = (e: KeyboardEvent): void => {

        // console.log(
        //     `UserScansRootCore.handleKeyDown(): key: ${e.key}; code: ${e.code}; ` +
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
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"k\" pressed: copying barcode"
                );
                const latestBarcode = this.state.barcodes[0];
                if (latestBarcode) {
                    this._writeBarcodeToClipboard({
                        barcode: latestBarcode,
                        showNotification: true,
                        highlight: true
                    });
                    e.preventDefault();
                }
                else {
                    console.log(
                        "UserScansRootCore.handleKeyDown(): " +
                        "latest barcode is null or undefined"
                    );
                }
            }
            else if (e.key === "d" && !e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"d\" pressed: DELETING all barcodes"
                );
                this.deleteAllUserBarcodes();
                e.preventDefault();
            }
            else if (e.key === "e" && e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + shift + \"e\" pressed: EXPORTING all barcodes as CSV"
                );
                this.exportAsCSV();
                e.preventDefault();
            }
            else if (e.key === "e" && !e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"e\" pressed: COPYING all barcodes as CSV"
                );
                this.copyAsCSV();
                e.preventDefault();
            }
            else if (e.key === "l" && !e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"l\" pressed: " +
                    "SHOWING formatted link"
                );
                this.setState({
                    showFormattedLinkModal: true
                });
                e.preventDefault();
            }
            else if (e.key === "z" && !e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"a\" pressed: " +
                    "toggling auto copy"
                );
                this.toggleAutoCopy();
                e.preventDefault();
            }
            else if (e.key === "s" && !e.shiftKey && !e.altKey) {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    "Platform modifier key + \"s\" pressed: " +
                    "SHOWING scan barcode view"
                );
                this.setState({
                    showScanBarcodeView: true
                });
                e.preventDefault();
            }
            else {
                console.log(
                    "UserScansRootCore.handleKeyDown(): " +
                    `Platform modifier key + "${e.key}" pressed`
                );
            }

        }

    };

    configureSocket = (): void => {

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
        const wsOptions = {
            minReconnectionDelay: 500,  // half a second
            maxReconnectionDelay: 10_000,  // 10 seconds
            connectionTimeout: 10_000,  //
            debug: true
        };

        this.socket.current = new WebSocket(
            this.socketURL.href,
            [],
            wsOptions
        );

        this.socket.current.onopen = (event: Event): void => {

            console.log(
                `[${new Date().toISOString()}] socket.onopen(): event:`, event
            );

            this.getUserScans({ user: this.user });

        };

        this.socket.current.onmessage = (event: MessageEvent): void => {
            this.receiveSocketMessage(event);
        };

        this.socket.current.onclose = (event: CloseEvent): void => {

            console.log(
                `[${new Date().toISOString()}] socket.onclose(): event:`,
                event
            );

        };

        this.socket.current.onerror = (event: ErrorEvent): void => {

            console.error(
                `[${new Date().toISOString()}] socket.onerror(): event:`, event
            );

        };

    };

    receiveSocketMessage = (event: MessageEvent): void => {

        console.log(
            `[${new Date().toISOString()}] ` +
            "UserScansRootCore.receiveSocketMessage(): " +
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
                "UserScansRootCore.receiveSocketMessage(): " +
                "could not parse JSON message:", error
            );
            return;
        }

        switch (message.type) {
            // MARK: Insert new scans
            case SocketMessageTypes.UpsertScans: {
                const newScans = message.newScans;

                console.log(
                    `socket will insert newScans for user ${this.user}:`,
                    newScans
                );
                this.setState(state => {
                    // MARK: insert the new scans in sorted order by date
                    // and remove any existing scans with the same ID

                    const newBarcodes = state.barcodes
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

                    return {
                        barcodes: newBarcodes
                    };

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
                this.removeBarcodesFromState(idsSet);
                break;
            }
            // MARK: Replace all scans
            case SocketMessageTypes.ReplaceAllScans: {
                const scans = message.scans;

                console.log(
                    `socket will replace all scans for user ${this.user}:`,
                    scans
                );

                this.setState({
                    barcodes: scans
                });
                this.deleteIDs.clear();
                break;
            }
            default: {
                console.error(
                    "UserScansRootCore.receiveSocketMessage(): " +
                    "socket could not handle message:", message
                );
            }
        }

    };

    /**
     * Determines if the current barcode is different from the previous barcode
     * AND if the current barcode is *NEWER* than the previous barcode.
     *
     * @param previousBarcode the previous barcode
     * @param currentBarcode the current barcode
     * @returns `true` if the current barcode is different from the
     * previous barcode AND if the current barcode is *NEWER* than the previous
     * barcode; otherwise, `false`
     */
    latestBarcodeChanged = (
        previousBarcode: ScannedBarcodeResponse | null | undefined,
        currentBarcode: ScannedBarcodeResponse | null | undefined
    ): boolean => {

        if (!currentBarcode || currentBarcode.id === previousBarcode?.id) {
            console.log(
                "UserScansRootCore.latestBarcodeChanged(): " +
                "most recent barcode has *NOT* changed at all/is null: " +
                `${JSON.stringify(currentBarcode)}`
            );
            return false;
        }

        /*
         We only want to auto-copy the most recent barcode if the most recent
         barcode is **NEWER** than the previously auto-copied barcode.

         For example, if the user deletes a barcode, then the most recent
         barcode will be older than the previously auto-copied barcode. In this
         case, we do *NOT* want to auto-copy the most recent barcode.
         */

        if (
            !previousBarcode ||
            currentBarcode.scanned_at >= previousBarcode.scanned_at
        ) {
            console.log(
                "UserScansRootCore.latestBarcodeChanged(): " +
                "most *RECENT* barcode *HAS* changed from " +
                `${JSON.stringify(previousBarcode)} to ` +
                `${JSON.stringify(currentBarcode)}`
            );
            return true;
        }
        else {
            console.log(
                "UserScansRootCore.latestBarcodeChanged(): " +
                "most *RECENT* barcode has *NOT* changed from " +
                `${JSON.stringify(previousBarcode)} to ` +
                `${JSON.stringify(currentBarcode)}`
            );
            return false;
        }
    };

    // MARK: - Auto-Copy -
    // copies the most recent barcode to the clipboard
    autoCopyIfEnabled = (): void => {

        if (!this.state.enableAutoCopy) {
            console.log(
                "Auto-copy is disabled; not copying latest barcode"
            );
            return;
        }

        // `this.state.barcodes` could be empty, in which case indexing into the
        // array will return undefined
        const mostRecentBarcode = this.state.barcodes[0];
        if (!mostRecentBarcode) {
            console.log(
                "Auto-copy failed: most recent barcode is null or undefined"
            );
            return;
        }

        const clientScannedBarcodeIDs = this.state.clientScannedBarcodeIDs;

        if (clientScannedBarcodeIDs.has(mostRecentBarcode?.id)) {
            console.log(
                "will NOT copy barcode scanned from CLIENT:",
                mostRecentBarcode
            );
            return;
        }

        if (this.state.lastAutoCopiedBarcode?.id === mostRecentBarcode?.id) {
            console.log(
                "AUTO-Copy failed: most recent barcode is the same as the " +
                "last auto-copied barcode:",
                mostRecentBarcode
            );
            return;

        }

        this.setState({
            lastAutoCopiedBarcode: mostRecentBarcode
        });

        console.log(
            `Auto-copying most recent barcode: "${JSON.stringify(mostRecentBarcode)}"`
        );

        this._writeBarcodeToClipboard({
            barcode: mostRecentBarcode,
            showNotification: true,
            highlight: true
        });

    };

    showBarcodeCopiedToast = (barcodeText: string): void => {
        console.log(`showBarcodeCopiedToast(): barcode: ${barcodeText}`);

        const barcodeTextMessage = barcodeText.truncated(30);

        // we will use the toast ID to dismiss the toast later
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const toastID = toast.success(
            `Copied "${barcodeTextMessage}" to the Clipboard`,
            {
                duration: 5_000
            }
        );

        // TODO: Toast can be dismissed by clicking on it
        // toast.dismiss(toastID);

    };

    /**
     * Get the user's scans and assign the result to state.barcodes.
     *
     * @param options the options
     * @param options.user the user
     *
     */
    getUserScans = ({ user }: { user: string }): void => {

        const dateString = new Date().toISOString();

        console.log(
            "UserScansRootCore.getUserScans(): Getting scans for " +
            `user "${user}" at date ${dateString}`
        );

        this.context.api!.getUserScans(user).then((result) => {

            console.log(
                "UserScansRootCore.getUserScans(): result:", result
            );

            this.setState({
                barcodes: result
            });

        }).catch((error) => {
            console.error(
                `UserScansRootCore.getUserScans(): error: ${error}`
            );
        });

    };

    deleteAllUserBarcodes = (): void => {

        console.log(
            "UserScansRootCore.deleteAllUserBarcodes(): " +
            "Deleting all user barcodes"
        );

        // delete the barcodes
        this.setState({
            barcodes: []
        });

        this.context.api!.deleteUserScans({
            user: this.user
        })
            .then((result) => {
                console.log(
                    "UserScansRootCore.deleteAllUserBarcodes(): " +
                    `result: ${result}`
                );
            })
            .catch((error) => {
                console.error(
                    "UserScansRootCore.deleteAllUserBarcodes(): " +
                    `could not delete all user barcodes: ${error}`
                );
            });

    };

    removeBarcodesFromState = (barcodeIDs: Set<string>): void => {
        const barcodeIDsString = setToString(barcodeIDs);
        console.log(
            `Removing barcode with IDs from state: ${barcodeIDsString}`
        );

        this.setState((state) => {

            barcodeIDs.forEach(element => this.deleteIDs.add(element));
            console.log(
                `removeBarcodesFromState(): ${this.deleteIDs.size} deleteIDs:`,
                this.deleteIDs
            );

            const newBarcodes = state.barcodes.filter((barcode) => {
                return !this.deleteIDs.has(barcode.id);
            });

            return {
                barcodes: newBarcodes
            };

        });

    };

    handleAutoCopyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const enableAutoCopy = e.target.checked;
        console.log(
            "UserScansRootCore.handleAutoCopyChange(): " +
            `e.target.checked (enable auto-copy): ${enableAutoCopy}`
        );

        const urlFragmentParams = new URLSearchParams(
            // the first character is the # character
            window.location.hash.slice(1)
        );
        urlFragmentParams.set("auto-copy", enableAutoCopy.toString());
        window.location.hash = urlFragmentParams.toString();

        console.log(
            "UserScansRootCore.handleAutoCopyChange(): " +
            `set URL fragment to: ${window.location.hash}`
        );

        this.setState({
            enableAutoCopy: enableAutoCopy
        });

    };

    copyLastBarcodeToClipboard = (): void => {

        const latestBarcode = this.state.barcodes[0];

        if (latestBarcode) {

            console.log(
                "UserScansRootCore.copyLastBarcodeToClipboard(): " +
                "Copying latest barcode to clipboard: " +
                `"${JSON.stringify(latestBarcode)}"`
            );

            this._writeBarcodeToClipboard({
                barcode: latestBarcode,
                showNotification: true,
                highlight: true
            });
        }
        else {
            console.log(
                "UserScansRootCore.copyLastBarcodeToClipboard(): " +
                "latest barcode is null or undefined"
            );
        }
    };

    deleteAllUserBarcodesKeyboardShortcutString = (): string => {
        return isApplePlatform() ? "⌘D" : "Ctrl+D";
    };

    copyAsCSVKeyboardShortcutString = (): string => {
        return isApplePlatform() ? "⌘E" : "Ctrl+E";
    };

    exportAsCSVKeyboardShortcutString = (): string => {
        return isApplePlatform() ? "⌘⇧E" : "Ctrl+Shift+E";
    };

    copyLastBarcodeKeyboardShortcutString = (): string => {
        return isApplePlatform() ? "⌘K" : "Ctrl+K";
    };

    configureLinkKeyboardShortcutString = (): string => {
        return isApplePlatform() ? "⌘L" : "Ctrl+L";
    };

    scanBarcodeKeyboardShortcutString = (): string => {
        return isApplePlatform() ? "⌘S" : "Ctrl+S";
    };

    toggleAutoCopyKeyboardShortcutString = (): string => {
        return isApplePlatform() ? "⌘Z" : "Ctrl+Z";
    };

    toggleAutoCopy = (): void => {
        this.setState((state) => {
            const newValue = !state.enableAutoCopy;
            console.log(`toggleAutoCopy(): set to ${newValue}`);
            return {
                enableAutoCopy: newValue
            };
        });

        const urlFragmentParams = new URLSearchParams(
            // the first character is the # character
            window.location.hash.slice(1)
        );
        urlFragmentParams.set(
            "auto-copy",
            (!this.state.enableAutoCopy).toString()
        );
        window.location.hash = urlFragmentParams.toString();

    };

    /**
     * Makes a CSV string from the scanned barcodes for the user.
     *
     * @returns the CSV string.
     */
    makeCSVString = (): string => {
        const csvString = csvStringify(this.state.barcodes, {
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
    };

    copyAsCSV = (): void => {

        console.log("copyAsCSV()");

        if (this._copyLastBarcodeIsDisabled()) {
            console.error(
                "copyAsCSV(): cannot copy CSV to clipboard: no barcodes"
            );
            return;
        }

        const csvString = this.makeCSVString();

        console.log("copyAsCSV(): csvString:", csvString);

        navigator.clipboard.writeText(csvString)
            .then(() => {
                console.log("copyAsCSV(): copied CSV to clipboard");
                toast.success("Copied CSV to clipboard");
            })
            .catch((error) => {
                console.error(
                    `copyAsCSV(): could not copy CSV to clipboard: ${error}`
                );
                toast.error("Could not copy CSV to clipboard");
            });

    };

    exportAsCSV = (): void => {

        console.log(
            "exportAsCSV(): barcodes:", this.state.barcodes
        );

        if (this._copyLastBarcodeIsDisabled()) {
            console.error(
                "exportAsCSV(): cannot export CSV: no barcodes"
            );
            return;
        }

        const date = new Date();
        const dateString = date.toISOString();

        const csvString = this.makeCSVString();

        console.log("exportAsCSV(): csvString:", csvString);

        const blob = new Blob([csvString], { type: "text/csv" });
        const blobURL = URL.createObjectURL(blob);

        const blobLinkElement = document.createElement("a");

        blobLinkElement.download = `barcodes-${dateString}.csv`;
        blobLinkElement.href = blobURL;

        blobLinkElement.click();

    };

    disabledClassIfZeroBarcodes = (): string => {
        return this._copyLastBarcodeIsDisabled() ? "disabled" : "";
    };

    // MARK: - Links -

    onClickOpenLink = (barcode: ScannedBarcodeResponse): void => {

        console.log("onClickOpenLink(): barcode:", barcode);

        const barcodeText = barcode.barcode;

        // TODO: Probably don't need to check for null or undefined
        if (barcodeText === null || barcodeText === undefined) {
            console.error(
                "onClickOpenLink(): barcode text is null or undefined"
            );
            return;
        }

        const formattedLink = this.state?.formattedLink;
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

    };

    showConfigureLinkModal = (): void => {

        console.log("showConfigureLinkModal():");

        this.setState({
            showFormattedLinkModal: true
        });


    };

    /**
     * Called every time the input field for the formatted link in
     * `ConfigureLinkModal` changes.
     *
     * @param e the event
     */
    onChangeConfigureLinkInput = (e: React.ChangeEvent<HTMLInputElement>): void => {

        const formattedLink = e.target.value;
        console.log(
            `onChangeConfigureLinkInput(): formattedLink: ${formattedLink}`
        );

        this.setState({
            formattedLink: formattedLink
        });

    };

    /**
     * Called when the user submits the `ConfigureLinkModal` form.
     *
     * @param e the event
     */
    onSubmitConfigureLinkForm = (
        e: React.FormEvent<HTMLFormElement>
    ): void => {

        console.log("onSubmitConfigureLinkForm()");

        // prevent the form from submitting
        e.preventDefault();

        this.setState({
            showFormattedLinkModal: false,
        });

        this.updateFormattedLinkInURLFragment();

    };

    /**
     * Called when the user closes the `ConfigureLinkModal`.
     */
    closeConfigureLinkModal = (
        // e: React.MouseEvent | React.KeyboardEvent
    ): void => {

        console.log("closeConfigureLinkModal()");

        this.setState({
            showFormattedLinkModal: false
        });

        this.updateFormattedLinkInURLFragment();

    };

    /**
     * Updates the formatted link in the URL fragment based on the value of the
     * `formattedLink` state variable.
     */
    updateFormattedLinkInURLFragment = (): void => {

        const urlFragmentParams = new URLSearchParams(
            window.location.hash.slice(1)
        );

        const formattedLink = this.state.formattedLink;

        // check if `formattedLink` is null or an empty string.
        if (!formattedLink) {
            urlFragmentParams.delete("formatted-link");
        }
        else {
            urlFragmentParams.set("formatted-link", formattedLink);
        }
        window.location.hash = urlFragmentParams.toString();

    };

    // MARK: - Scan Barcode View -

    onOpenScanBarcodeView = (
        e: React.MouseEvent<HTMLElement, MouseEvent>
    ): void => {

        console.log("onOpenScanBarcodeView():", e);

        this.setState({
            showScanBarcodeView: true
        });

    };

    closeScanBarcodeView = (): void => {

        console.log("closeScanBarcodeView()");

        this.setState({
            showScanBarcodeView: false
        });

    };

    insertClientScannedBarcodeID = (barcodeID: string): void => {

        this.setState((state) => {
            const clientScannedBarcodeIDs = state.clientScannedBarcodeIDs;
            clientScannedBarcodeIDs.add(barcodeID);
            return {
                clientScannedBarcodeIDs: clientScannedBarcodeIDs
            };
        });

    };

    // MARK: Private Interface

    /**
     * Determines if the "Copy Latest Barcode" button is disabled, which
     * occurs when there are no barcodes.
     *
     * @returns `true` if the "Copy Latest Barcode" button is disabled.
     */
    _copyLastBarcodeIsDisabled = (): boolean => {
        return !this.state?.barcodes?.length;
    };

    /**
     * Writes the barcode to the clipboard.
     *
     * @param options the options
     * @param options.barcode the barcode to write to the clipboard
     * @param options.showNotification whether or not to show a notification to
     * the user
     * @param options.highlight whether or not to highlight the barcode
     */
    _writeBarcodeToClipboard = (
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
                    this.showBarcodeCopiedToast(barcodeText);
                }

                if (highlight) {
                    console.log(
                        "_writeTextToClipboard: --- HIGHLIGHT --- " +
                        `(id: ${barcode?.id})`
                    );
                    this._setHighlightedBarcode(barcode);
                }

            })
            .catch((error) => {
                console.error(
                    "_writeTextToClipboard: Could not copy text to clipboard: " +
                    `"${barcodeText}": ${error}`
                );
            });

    };

    _setHighlightedBarcode = (barcode: ScannedBarcodeResponse): void => {

        this.setState({
            highlightedBarcode: barcode
        });

        clearTimeout(this.removeHighlightedBarcodeTimer);
        this.removeHighlightedBarcodeTimer = setTimeout(() => {
            this.setState({
                highlightedBarcode: null
            });
        }, 5_000);

    };

    // MARK: --- Rendering ---

    renderMainContextMenu(): JSX.Element {
        return (
            <Dropdown>
                <Dropdown.Toggle variant="success">
                    <i className="fa fa-ellipsis-v px-2"></i>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Dropdown.Item
                        className={this.disabledClassIfZeroBarcodes()}
                        onClick={this.copyAsCSV}
                    >
                        <div className="hstack gap-3">
                            <i className="fa fa-file-csv"></i>
                            <span>Copy as CSV</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {this.copyAsCSVKeyboardShortcutString()}
                            </span>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Item
                        className={this.disabledClassIfZeroBarcodes()}
                        onClick={this.exportAsCSV}
                    >
                        <div className="hstack gap-3">
                            <i className="fa-solid fa-file-export"></i>
                            <span>Export as CSV</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {this.exportAsCSVKeyboardShortcutString()}
                            </span>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Divider className="" />
                    <Dropdown.Item
                        className={this.disabledClassIfZeroBarcodes()}
                        onClick={this.copyLastBarcodeToClipboard}
                    >
                        <div className="hstack gap-3">
                            <i className="fa-solid fa-copy"></i>
                            <span>Copy Latest Barcode</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {this.copyLastBarcodeKeyboardShortcutString()}
                            </span>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Divider className="" />
                    {/* *** === Open Scan Barcode View === *** */}
                    <Dropdown.Item
                        onClick={this.onOpenScanBarcodeView}
                    >
                        <div className="hstack gap-3">
                            <i className="fa-solid fa-camera"></i>
                            <span>Scan Barcode...</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {this.scanBarcodeKeyboardShortcutString()}
                            </span>

                        </div>
                    </Dropdown.Item>
                    {/* *** === Configure Link *** === */}
                    <Dropdown.Item
                        onClick={this.showConfigureLinkModal}
                    >
                        <div className="hstack gap-3">
                            <i className="fa fa-link"></i>
                            <span>Configure Link...</span>
                            <span className="ms-auto">
                                {/* --- Spacer --- */}
                            </span>
                            <span style={{
                                color: "gray",
                            }}>
                                {this.configureLinkKeyboardShortcutString()}
                            </span>
                        </div>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        );
    }

    override render(): JSX.Element {
        return (
            <div className="vw-100 vh-100">

                <title>
                    {prefixTitleWithDocumentHostIfPort(
                        `Scans for ${this.user} | BarcodeDrop`
                    )}
                </title>

                {/* if (process.env?.NODE_ENV === "development") {
                    <DebugBreakpointView />
                } */}

                {/* {process.env?.NODE_ENV === "development" ?
                    <DebugBreakpointView /> :
                    null
                } */}

                {/* *** =====================-=== */}
                {/* *** === Scan Barcode View === */}
                {/* *** =====================-=== */}

                <ScanBarcodeView
                    showScanBarcodeModal={this.state.showScanBarcodeView}
                    user={this.user}
                    onClose={this.closeScanBarcodeView}
                    insertClientScannedBarcodeID={this.insertClientScannedBarcodeID}
                />

                <ConfigureLinkModal
                    formattedLink={this.state.formattedLink}
                    showFormattedLinkModal={this.state.showFormattedLinkModal}
                    viewportSize={this.state.viewportSize}
                    onChangeConfigureLinkInput={this.onChangeConfigureLinkInput}
                    closeConfigureLinkModal={this.closeConfigureLinkModal}
                    onSubmitConfigureLinkForm={this.onSubmitConfigureLinkForm}
                />
                <UserScansToast />

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
                                Scanned Barcodes for <em style={{ color: "gray" }}>{this.user}</em>
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
                                onClick={this.deleteAllUserBarcodes}
                                data-toggle="tooltip"
                                data-placement="top"
                                title={this.deleteAllUserBarcodesKeyboardShortcutString()}
                            >
                                Delete All Barcodes
                            </Button>
                        </div>
                        <div className="p-1">
                            {/* *** ==================================== *** */}
                            {/* *** === Dropdown - Main Context Menu === *** */}
                            {/* *** ==================================== *** */}
                            {this.renderMainContextMenu()}
                        </div>
                        <div className="p-1">
                            {/* Auto-Copy */}

                            <label
                                style={{ padding: "5px 10px" }}
                                className=""
                                data-toggle="tooltip"
                                data-placement="top"
                                title={`(${this.toggleAutoCopyKeyboardShortcutString()}) Automatically copy the most recent barcode to the clipboard`}
                            >
                                <input
                                    type="checkbox"
                                    name="enable-auto-copy"
                                    id="enable-auto-copy"
                                    checked={this.state.enableAutoCopy}
                                    onChange={this.handleAutoCopyChange}
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
                        barcodes={this.state.barcodes}
                        user={this.user}
                        highlightedBarcode={this.state.highlightedBarcode}
                        viewportSize={this.state.viewportSize}
                        removeBarcodesFromState={
                            this.removeBarcodesFromState
                        }
                        setHighlightedBarcode={
                            this._setHighlightedBarcode
                        }
                        onClickOpenLink={this.onClickOpenLink}
                    />

                </Container>
                {/* /div> */}
            </div>
        );
    }

}
