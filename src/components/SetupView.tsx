import "./SetupView.css";
import { type JSX } from "react";
import { Container } from "react-bootstrap";
import { MainNavbar } from "./MainNavbar";
import { CodeBlock } from "./CodeBlock";
import { prefixTitleWithDocumentHostIfPort } from "../utils/MiscellaneousUtilities";
import postBarcodeIcloudShortcut from "../assets/images/postBarcodeIcloudShortcut.svg";
import QRBarcodeScanner from "../assets/images/QRBarcodeScanner.svg";
import QRBot from "../assets/images/QRBot.svg";
import QRBotScreenshot from "../assets/images/QRBotScreenshot.jpeg";

export function SetupView(): JSX.Element {

    const icloudShortcutURL = "https://www.icloud.com/shortcuts/0f7f0a8a0bc3476f807324d922b44fe2";

    function newTabLink(url: string, body: JSX.Element): JSX.Element {
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
            >
                {body}
            </a>
        );
    }

    function apiRequestURLCodeSnippet(): JSX.Element {
        return (
            <code>
                {"https://api.barcodedrop.com/scan/<user>"}
            </code>
        );
    }

    return (
        <div className="vw-100 vh-100">
            <title>
                {prefixTitleWithDocumentHostIfPort("Setup | BarcodeDrop")}
            </title>
            <MainNavbar />
            <Container className="px-3 pb-5" fluid="md">
                <div className="text-center">
                    <h1 className="p-5">Setup</h1>

                    <p>
                        To scan barcodes with your mobile device, you can use
                        the following methods.
                    </p>

                    {/* MARK: iCloud Shortcut */}

                    <h3 className="pt-2">iCloud Shortcut</h3>

                    <p className="pt-2">
                        To scan barcodes with your <strong>iOS device</strong>,
                        you can use the following  {newTabLink(icloudShortcutURL,
                            <strong>Apple Shortcut</strong>
                        )}:
                    </p>
                    <img
                        src={postBarcodeIcloudShortcut}
                        alt="Post Barcode iCloud Shortcut"
                        className="qr-code-img"
                    />
                    <h3 className="pt-5">Mobile Apps</h3>
                    <p className="pt-2">
                        You can use the following apps to scan barcodes:
                    </p>
                    {/* MARK: QR Bot */}
                    <p>
                        {newTabLink("https://qrbot.net",
                            <strong>QR Bot</strong>
                        )}{" "}
                        (iOS and Android)
                    </p>
                    <img
                        src={QRBot}
                        alt="QR Bot App QR Code"
                        className="mb-3 qr-code-img"
                    />
                    <p className="pb-1">
                        In the settings, enable the business scanner mode and
                        configure the following URL
                        (replace &lt;user&gt; with your username):
                    </p>
                    {apiRequestURLCodeSnippet()}

                    <p className="pt-3">
                        Enter the following for the body:
                    </p>

                    <div className="pt-1 pb-3">
                        <code>
                            {"barcode={code}"}
                        </code>
                    </div>

                    <p>
                        For example:
                    </p>

                    <img
                        src={QRBotScreenshot}
                        alt="QR Bot App Screenshot"
                        className="qr-bot-app-screenshot"
                    />

                    <hr className="padded-hr" />

                    {/* MARK: QR & Barcode Scanner */}
                    <p className="pt-4">
                        {newTabLink(
                            "https://play.google.com/store/apps/details?id=com.scanner.kataykin.icamesscaner.free",
                            <strong>QR & Barcode Scanner</strong>
                        )}{" "}
                        (Android)
                    </p>
                    <img
                        src={QRBarcodeScanner}
                        alt="QR & Barcode Scanner App QR Code"
                        className="mb-3 qr-code-img"
                    />
                    <p>
                        In the settings, select the "POST" option, select
                        "HTTPS", and enter the following URL (replace
                        &lt;user&gt; with your username). No additional
                        parameters need to be supplied.
                    </p>

                    {apiRequestURLCodeSnippet()}

                    {/* MARK: API Request */}
                    <h3 id="api-request" className="pt-5">API Request</h3>
                    <p>
                        Make a POST request to the following endpoint
                        (replace {"<user>"} with your username):
                    </p>
                    {apiRequestURLCodeSnippet()}
                    <p className="pt-3">
                        <strong>Request Parameters:</strong>
                    </p>
                    <p>
                        <span className="px-1">
                            The barcode can be sent in the body of the request
                            or in the URL query string as follows:
                        </span>
                    </p>
                    <p className="">
                        <span className="px-1">
                            URL query string/form-url-encoded in the body:
                        </span>
                        <code>
                            {"barcode=<barcode>"}
                        </code>
                        <span className="px-1">
                            or
                        </span>
                        <code>
                            {"text=<barcode>"}
                        </code>
                    </p>
                    <p className="pb-2">
                        <span className="px-1">
                            In the body as JSON:
                        </span>
                        <code>
                            {'{ "barcode": "<barcode>" }'}
                        </code>
                        <span className="px-1">
                            or
                        </span>
                        <code>
                            {'{ "text": "<barcode>" }'}
                        </code>
                    </p>
                    <p>
                        For example:
                    </p>
                </div>

                <CodeBlock
                    className="post-barcode-curl-code-block"
                    code={`curl --request POST \\
    'https://api.barcodedrop.com/scan/peter?barcode=hello+world'`}
                />

                <p className="pt-1 text-center">
                    Or:
                </p>

                <CodeBlock
                    className="post-barcode-curl-code-block"
                    code={`curl --request POST \\
    --header "Content-Type: application/json" \\
    --data '{"barcode": "hello world"}' \\
    'https://api.barcodedrop.com/scan/peter'`}
                />

                <div className="text-center">
                    <hr className="padded-hr" />
                    <p className="pt-1">
                        <strong>
                            Access your scanned barcodes at the following URL
                            (replace &lt;user&gt; with your username):
                        </strong>
                    </p>
                    <code>
                        {"https://barcodedrop.com/scans/<user>"}
                    </code>
                </div>

            </Container>
        </div>
    );

}
