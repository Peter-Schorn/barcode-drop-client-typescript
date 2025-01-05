import { type JSX } from "react";
import { Container } from "react-bootstrap";
import MainNavbar from "./MainNavbar";
import { prefixTitleWithDocumentHostIfPort } from "../MiscellaneousUtilities";
import postBarcodeIcloudShortcut from "../assets/images/postBarcodeIcloudShortcut.svg";
import QRBarcodeScanner from "../assets/images/QRBarcodeScanner.svg";
import QRBot from "../assets/images/QRBot.svg";

export default function SetupView(): JSX.Element {

    const icloudShortcutURL = "https://www.icloud.com/shortcuts/0f7f0a8a0bc3476f807324d922b44fe2";

    const title = "Setup | BarcodeDrop";

    document.title = prefixTitleWithDocumentHostIfPort(title);

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
    };

    return (
        <div className="vw-100 vh-100">
            <MainNavbar />
            <Container className="text-center px-3 pb-5" fluid="md">

                <h1 className="p-5">Setup</h1>

                <p>
                    To scan barcodes with your <strong>iOS device</strong>,
                    you can use the following  {newTabLink(icloudShortcutURL,
                        <strong>Apple Shortcut</strong>
                    )}:
                </p>
                <img
                    src={postBarcodeIcloudShortcut}
                    alt="Post Barcode iCloud Shortcut"
                    className="mb-5"
                    style={{ maxWidth: "175px", maxHeight: "175px", padding: "10px" }}
                />

                <h3>Mobile Apps</h3>

                <p>
                    You can use the following apps to scan barcodes:
                </p>

                {/* --- QR Bot --- */}
                <p>
                    {newTabLink("https://qrbot.net",
                        <strong>QR Bot</strong>
                    )}{" "}
                    <span className="text-secondary">(iOS and Android)</span>
                </p>
                <img
                    src={QRBot}
                    alt="QR Bot App QR Code"
                    className="mb-3"
                    style={{ maxWidth: "175px", maxHeight: "175px", padding: "10px" }}
                />
                <p className="text-secondary">
                    In the settings, enable the business scanner mode and
                    configure the URL as specified in the API Request
                    section below. Enter the following for the body:
                </p>
                <span style={{ padding: "0px 0px", fontFamily: "'Courier New', monospace" }}>
                    {"barcode={code}"}
                </span>

                {/* <hr className="padded-hr" /> */}

                {/* --- QR & Barcode Scanner --- */}
                <p className="pt-4">
                    {newTabLink(
                        "https://play.google.com/store/apps/details?id=com.scanner.kataykin.icamesscaner.free",
                        <strong>QR & Barcode Scanner</strong>
                    )}{" "}
                    <span className="text-secondary">(Android)</span>
                </p>
                <img
                    src={QRBarcodeScanner}
                    alt="QR & Barcode Scanner App QR Code"
                    className="mb-3"
                    style={{ maxWidth: "175px", maxHeight: "175px", padding: "10px" }}
                />
                <p className="text-secondary">
                    In the settings, select the "POST" option, select "HTTPS", and enter the
                    URL as specified in the API Request section below. No
                    additional parameters need to be supplied.
                </p>

                <h3 className="pt-3">API Request</h3>

                <p>
                    Make a POST request to the following endpoint
                    in your barcode scanner app
                    (replace {"<user>"} with your username):
                </p>

                {/* --- <code style={{ all: "revert"}}> --- */}
                <code>
                    {"https://api.barcodedrop.com/scan/<user>"}
                </code>

                {/* <a href="https://api.barcodedrop.com/scan/<user>">
                    {"https://api.barcodedrop.com/scan/<user>"}
                </a> */}

                <p className="pt-3">
                    <strong>Request Body:</strong>
                </p>

                <p className="">
                    URL Query string/form-url-encoded in the body:
                    <span style={{ padding: "0px 10px", fontFamily: "'Courier New', monospace" }}>
                        {"barcode=<barcode>"}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: " or " }} />
                    <span style={{ padding: "0px 10px", fontFamily: "'Courier New', monospace" }}>
                        {"text=<barcode>"}
                    </span>
                </p>

                <p className="pb-2">
                    In the body as JSON:
                    <span style={{ padding: "0px 10px", fontFamily: "'Courier New', monospace" }}>
                        {'{ "barcode": "<barcode>" }'}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: " or " }} />
                    <span style={{ padding: "0px 10px", fontFamily: "'Courier New', monospace" }}>
                        {'{ "text": "<barcode>" }'}
                    </span>
                </p>

                <hr className="padded-hr" />

                <p className="pt-1">
                    <strong>
                        Access your scanned barcodes at the following URL
                        (replace {"<user>"} with your username):
                    </strong>
                </p>

                <code className="">
                    {"https://barcodedrop.com/scans/<user>"}
                </code>

            </Container>
        </div>
    );

}
