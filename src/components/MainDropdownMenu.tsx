import {
    type JSX
} from "react";

import {
    MDBDropdown,
    MDBDropdownMenu,
    MDBDropdownToggle,
    MDBDropdownItem
} from "mdb-react-ui-kit";

import { DropdownItem } from "./DropdownItem.tsx";

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
        <MDBDropdown>
            <MDBDropdownToggle>
                <i className="fa fa-ellipsis-v px-2"></i>
            </MDBDropdownToggle>

            <MDBDropdownMenu>

                <DropdownItem
                    text="Export"
                >
                    <DropdownItem
                        text="Copy as CSV"
                        icon="fa fa-file-csv"
                        keyboardShortcutString={copyAsCSVKeyboardShortcutString()}
                        onClick={props.copyAsCSV}
                        additionalClasses={props.disabledClassIfZeroBarcodes()}
                    />

                    <DropdownItem
                        text="Export as CSV"
                        icon="fa-solid fa-file-export"
                        keyboardShortcutString={exportAsCSVKeyboardShortcutString()}
                        onClick={props.exportAsCSV}
                        additionalClasses={props.disabledClassIfZeroBarcodes()}
                    />
                </DropdownItem>


                <MDBDropdownItem divider />

                <DropdownItem
                    text="Copy Latest Barcode"
                    icon="fa-solid fa-copy"
                    keyboardShortcutString={copyLastBarcodeKeyboardShortcutString()}
                    onClick={props.copyLastBarcodeToClipboard}
                    additionalClasses={props.disabledClassIfZeroBarcodes()}
                />

                <MDBDropdownItem divider />

                <DropdownItem
                    text="Enter Barcode..."
                    icon="fa-solid fa-barcode"
                    keyboardShortcutString={enterBarcodeKeyboardShortcutString()}
                    onClick={props.openEnterBarcodeView}
                />

                <DropdownItem
                    text="Configure Link..."
                    icon="fa fa-link"
                    keyboardShortcutString={configureLinkKeyboardShortcutString()}
                    onClick={props.showConfigureLinkModal}
                />

            </MDBDropdownMenu>
        </MDBDropdown>
    );

}
