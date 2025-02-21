import {
    type JSX
} from "react";

import {
    Dropdown
} from "react-bootstrap";

import { isApplePlatform } from "../utils/MiscellaneousUtilities.ts";

type MainContextMenuProps = {
    disabledClassIfZeroBarcodes: () => string;
    copyAsCSV: () => void;
    exportAsCSV: () => void;
    copyLastBarcodeToClipboard: () => void;
    openScanBarcodeView: () => void;
    showConfigureLinkModal: () => void;
};

export function MainDropdownMenu(props: MainContextMenuProps): JSX.Element {

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

    return (
        <Dropdown>
            <Dropdown.Toggle variant="success">
                <i className="fa fa-ellipsis-v px-2"></i>
            </Dropdown.Toggle>

            <Dropdown.Menu>
                <Dropdown.Item
                    className={props.disabledClassIfZeroBarcodes()}
                    onClick={props.copyAsCSV}
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
                    className={props.disabledClassIfZeroBarcodes()}
                    onClick={props.exportAsCSV}
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
                    className={props.disabledClassIfZeroBarcodes()}
                    onClick={props.copyLastBarcodeToClipboard}
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
                    onClick={props.openScanBarcodeView}
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
                    onClick={props.showConfigureLinkModal}
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
