import {
    type JSX
} from "react";

import Dropdown from "react-bootstrap/Dropdown";

import { DropdownItem } from "./DropDownItem.tsx";

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

                <DropdownItem
                    icon="fa fa-file-csv"
                    text="Copy as CSV"
                    keyboardShortcutString={copyAsCSVKeyboardShortcutString()}
                    onClick={props.copyAsCSV}
                    className={props.disabledClassIfZeroBarcodes}
                />

                <DropdownItem
                    icon="fa-solid fa-file-export"
                    text="Export as CSV"
                    keyboardShortcutString={exportAsCSVKeyboardShortcutString()}
                    onClick={props.exportAsCSV}
                    className={props.disabledClassIfZeroBarcodes}
                />

                <Dropdown.Divider/>

                <DropdownItem
                    icon="fa-solid fa-copy"
                    text="Copy Latest Barcode"
                    keyboardShortcutString={copyLastBarcodeKeyboardShortcutString()}
                    onClick={props.copyLastBarcodeToClipboard}
                    className={props.disabledClassIfZeroBarcodes}
                />

                <Dropdown.Divider/>

                <DropdownItem
                    icon="fa-solid fa-barcode"
                    text="Enter Barcode..."
                    keyboardShortcutString={enterBarcodeKeyboardShortcutString()}
                    onClick={props.openEnterBarcodeView}
                />

                <DropdownItem
                    icon="fa fa-link"
                    text="Configure Link..."
                    keyboardShortcutString={configureLinkKeyboardShortcutString()}
                    onClick={props.showConfigureLinkModal}
                />

            </Dropdown.Menu>
        </Dropdown>
    );

}
