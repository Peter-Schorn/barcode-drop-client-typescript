import React, {
    type JSX,
    Component,
} from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { AppContext } from "../Model/AppContext";

import { Container, Button, Dropdown, Stack } from "react-bootstrap";
// import Toast from 'react-bootstrap/Toast';
import { toast } from "react-hot-toast";

// import csv from 'csv'
import { stringify as csvStringify } from "csv-stringify/browser/esm/sync";

import MainNavbar from "./MainNavbar";
// import UserScansTable from "./UserScansTable";

import { WebSocket } from "partysocket";

import { type ErrorEvent } from "partysocket/ws";

import {
    type SocketMessage
} from "../types/SocketMessage.ts";

import {
    isApplePlatform,
    prefixTitleWithDocumentHostIfPort,
    setToString
} from "../MiscellaneousUtilities";
import { SocketMessageTypes } from "../Model/SocketMessageTypes";

import UserScansTable from "./UserScansTable";
import { ConfigureLinkModal } from "./ConfigureLinkModal.tsx";
import { UserScansToast } from "./UserScansToast.tsx";
import { ScanBarcodeView } from "./ScanBarcodeView.tsx";

import {
    type ScannedBarcodeResponse,
    type ScannedBarcodesResponse
} from "../types/ScannedBarcodesResponse.ts";

import { type ViewportSize } from "../types/ViewportSize.ts";
import { type UserScansRootParams } from "../types/UserScansRootParams.ts";
import { type UserScansRootRouter } from "../types/UserScansRootRouter.ts";

import { scannedBarcodesReviver } from "../Model/parsing.ts";

// MARK: path="/scans/:user"
export default function UserScansRoot(): JSX.Element {

    // https://reactrouter.com/en/main/start/faq#what-happened-to-withrouter-i-need-it

    const params = useParams<UserScansRootParams>();
    const [searchParams, setSearchParams] = useSearchParams();
    // const location = useLocation();
    // const navigate = useNavigate();

    return (
        <UserScansRootCore
            router={{
                params: params,
                searchParams: searchParams,
                setSearchParams: setSearchParams
            }}
        />
    );

}

type WriteBarcodeToClipboardOptions = {
    showNotification: boolean;
    highlight: boolean;
    barcode: ScannedBarcodeResponse;
};

type UserScansRootCoreProps = {
    router: UserScansRootRouter;
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
    pingPongInterval: number | undefined;
    lastPongDate: Date | null;
    removeHighlightedBarcodeTimer: number | undefined;
    copyBarcodeAfterDelayTimeout: number | undefined;
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
        this.pingPongInterval = undefined;
        this.lastPongDate = null;
        this.removeHighlightedBarcodeTimer = undefined;
        this.copyBarcodeAfterDelayTimeout = undefined;
        this.user = props.router.params.user!;

        // MARK: Document Title
        // TODO: Use HTML title element instead
        const title = `Scans for ${this.user} | BarcodeDrop`;
        document.title = prefixTitleWithDocumentHostIfPort(title);

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

        clearInterval(this.pingPongInterval);
        clearTimeout(this.removeHighlightedBarcodeTimer);
        clearTimeout(this.copyBarcodeAfterDelayTimeout);

        window.removeEventListener("hashchange", this.handleHashChange);
        document.removeEventListener("focusin", this.handleFocusIn);
        document.removeEventListener("focusout", this.handleFocusOut);
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        document.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("resize", this.windowDidResize);
    }

    override componentDidMount(): void {

        console.log("UserScansRootCore.componentDidMount():");

        this.getUserScans({ user: this.user });

        // MARK: Configure event listeners

        window.addEventListener("hashchange", this.handleHashChange);
        document.addEventListener("focusin", this.handleFocusIn);
        document.addEventListener("focusout", this.handleFocusOut);
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
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

    handleFocusOut = (/* e: FocusEvent */): void => {
        // console.log(
        //     "focusout: document does NOT have focus; " +
        //     `visibility: ${document.visibilityState}`
        // );
    };

    handleFocusIn = (/* e: FocusEvent */): void => {
        // console.log(
        //     "focusin: document has focus; " +
        //     `visibility: ${document.visibilityState}`
        // );
    };

    handleVisibilityChange = (/* e: Event */): void => {

        // console.log(
        //     `visibilitychange: document.hidden: ${document.hidden}; ` +
        //     `focused: ${document.hasFocus()}`
        // );

        // console.log(
        //     `visibilitychange: document.hidden: ${document.hidden}; ` +
        //     `focused: ${document.hasFocus()}`
        // );

        if (!document.hidden) {
            console.log(
                "visibilitychange: will reconnect to websocket if needed"
            );
            if (this.socket?.current?.readyState === WebSocket.CLOSED) {
                console.log(
                    "visibilitychange: re-connecting to WebSocket " +
                    `(readyState: ${this.socket.current.readyState})`
                );
                this.socket.current.reconnect();
            }
            else {
                console.log(
                    "visibilitychange: WebSocket is already " +
                    "connected/connecting " +
                    `(readyState: ${this.socket?.current?.readyState})`
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
            connectionTimeout: 15_000,  //
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
            // MARK: Disable high-level ping-pong for now; probably not needed
            // this.configurePingPongInterval();
            this.lastPongDate = new Date();

        };

        this.socket.current.onmessage = (event: MessageEvent): void => {
            this.receiveSocketMessage(event);
        };

        this.socket.current.onclose = (event: CloseEvent): void => {

            console.log(
                `[${new Date().toISOString()}] socket.onclose(): event:`,
                event
            );

            clearInterval(this.pingPongInterval);
            this.lastPongDate = null;

        };

        this.socket.current.onerror = (event: ErrorEvent): void => {

            console.error(
                `[${new Date().toISOString()}] socket.onerror(): event:`, event
            );

            clearInterval(this.pingPongInterval);
            this.lastPongDate = null;

        };

    };

    configurePingPongInterval = (): void => {

        if (this.pingPongInterval) {
            clearInterval(this.pingPongInterval);
        }

        this.pingPongInterval = setInterval(() => {

            console.log(
                `[${new Date().toISOString()}] ` +
                "Sending ping to WebSocket server"
            );

            // MARK: - Send a ping to the server -
            this.socket.current?.send("ping");

            console.log(
                `[${new Date().toISOString()}] configurePingPongInterval: ` +
                "calling checkWebSocketConnection()"
            );
            this.checkWebSocketConnection();

        }, 5_000);

    };

    checkWebSocketConnection = (): void => {

        console.log(
            `[${new Date().toISOString()}] ` +
            "UserScansRootCore.checkWebSocketConnection():"
        );

        const now = new Date();
        const nowString = now.toISOString();

        const lastPongDate = this.lastPongDate;
        const lastPongDateString = lastPongDate?.toISOString();

        let diffMS: number | null;

        if (lastPongDate) {
            diffMS = now.getTime() - lastPongDate.getTime();
        }
        else {
            // lastPongDate is `null`, so the server has not responded to
            // *ANY* pings
            diffMS = null;
        }

        if (diffMS === null || diffMS > 10_000) {
            // The server has *NOT* responded to a ping within the last 10
            // seconds. The effective tolerance is 10-15 seconds because
            // this function is only called every 5 seconds.
            console.error(
                `[${nowString}] ` +
                "server has *NOT* responded to a ping in over 10 seconds " +
                `(diffMS: ${diffMS}; lastPongDate: ${lastPongDateString}); ` +
                "TRYING TO RECONNECT..."
            );
            // MARK: - Attempt to reconnect the WebSocket -
            this.socket.current?.reconnect();
        }
        else {
            console.log(
                `[${nowString}] ` +
                "server *HAS* responded to a ping within the last 10 " +
                `seconds (diffMS: ${diffMS}; lastPongDate: ${lastPongDateString})`
            );
        }

    };

    handlePong = (event: MessageEvent): void => {
        console.log(
            `[${new Date().toISOString()}] UserScansRootCore.handlePong(): ` +
            "Received pong (updating lastPongDate): event:",
            event
        );
        this.lastPongDate = new Date();
    };

    receiveSocketMessage = (event: MessageEvent): void => {

        console.log(
            `[${new Date().toISOString()}] ` +
            "UserScansRootCore.receiveSocketMessage(): " +
            "event:", event
        );

        if (event.data === "pong") {
            this.handlePong(event);
            return;
        }

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

        })
            .catch((error) => {
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

                <div dangerouslySetInnerHTML={{ __html: `<!-- fetch("https://api.barcodedrop.com/scan/${this.user}?barcode=barcode", { method: "POST" }) -->` }} />

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
                        router={this.props.router}
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
