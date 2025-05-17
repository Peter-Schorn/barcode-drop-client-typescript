import {
    type JSX
} from "react";

import Dropdown from "react-bootstrap/Dropdown";
import Stack from "react-bootstrap/Stack";

import { isApplePlatform } from "../utils/MiscellaneousUtilities.ts";

// import { mainDropdownMenuLogger as logger } from "../utils/loggers.ts";

type MainDropdownMenuProps = {
    disabledClassIfZeroBarcodes: () => string;
    copyAsCSV: () => void;
    exportAsCSV: () => void;
    copyLastBarcodeToClipboard: () => void;
    openEnterBarcodeView: () => void;
    showConfigureLinkModal: () => void;
};

export function MainDropdownMenu(props: MainDropdownMenuProps): JSX.Element {

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

    function enterBarcodeKeyboardShortcutString(): string {
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
                    <Stack direction="horizontal" gap={3}>
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
                    </Stack>
                </Dropdown.Item>
                <Dropdown.Item
                    className={props.disabledClassIfZeroBarcodes()}
                    onClick={props.exportAsCSV}
                >
                    <Stack direction="horizontal" gap={3}>
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
                    </Stack>
                </Dropdown.Item>
                <Dropdown.Divider className="" />
                <Dropdown.Item
                    className={props.disabledClassIfZeroBarcodes()}
                    onClick={props.copyLastBarcodeToClipboard}
                >
                    <Stack direction="horizontal" gap={3}>
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
                    </Stack>
                </Dropdown.Item>
                <Dropdown.Divider className="" />
                {/* *** === Open Enter Barcode View === *** */}
                <Dropdown.Item
                    onClick={props.openEnterBarcodeView}
                >
                    <Stack direction="horizontal" gap={3}>
                        <i className="fa-solid fa-barcode"></i>
                        <span>Enter Barcode...</span>
                        <span className="ms-auto">
                            {/* --- Spacer --- */}
                        </span>
                        <span style={{
                            color: "gray",
                        }}>
                            {enterBarcodeKeyboardShortcutString()}
                        </span>

                    </Stack>
                </Dropdown.Item>
                {/* *** === Configure Link *** === */}
                <Dropdown.Item
                    onClick={props.showConfigureLinkModal}
                >
                    <Stack direction="horizontal" gap={3}>
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
                    </Stack>
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );

}
