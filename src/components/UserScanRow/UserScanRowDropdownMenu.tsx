import "./UserScanRowDropdownMenu.css";

import { type JSX } from "react";
import { Dropdown } from "react-bootstrap";

import { DropdownItem } from "../DropDownItem";

// import { userScanRowDropdownMenuLogger as logger } from "../../utils/loggers";

type UserScanRowDropdownMenuProps = {
    didClickGenerateBarcode: () => void;
    onClickDeleteButton: () => void;
};

export function UserScanRowDropdownMenu(
    props: UserScanRowDropdownMenuProps
): JSX.Element {

    return (
        <Dropdown className="ms-1">
            <Dropdown.Toggle variant="success" className="text-center">
                <i className="fa fa-ellipsis-v px-2" />
            </Dropdown.Toggle>

            <Dropdown.Menu>

                <DropdownItem
                    icon="fa-solid fa-barcode"
                    text="Generate Barcode"
                    onClick={props.didClickGenerateBarcode}
                />

                <Dropdown.Divider/>

                <DropdownItem
                    icon="fa fa-trash"
                    text="Delete"
                    onClick={props.onClickDeleteButton}
                    className="user-scan-row-delete-dropdown-item"
                />

            </Dropdown.Menu>
        </Dropdown>
    );

}
