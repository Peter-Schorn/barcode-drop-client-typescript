import "./UserScanRowDropdownMenu.css";

import { type JSX } from "react";

import {
    MDBDropdown,
    MDBDropdownMenu,
    MDBDropdownToggle,
    MDBDropdownItem
} from "mdb-react-ui-kit";

import { DropdownItem } from "../DropdownItem.tsx";

// import { userScanRowDropdownMenuLogger as logger } from "../../utils/loggers";

type UserScanRowDropdownMenuProps = {
    didClickGenerateBarcode: () => void;
    onClickDeleteButton: () => void;
};

export function UserScanRowDropdownMenu(
    props: UserScanRowDropdownMenuProps
): JSX.Element {

    return (
        <MDBDropdown className="ms-1">
            <MDBDropdownToggle variant="success" className="text-center">
                <i className="fa fa-ellipsis-v px-2" />
            </MDBDropdownToggle>

            <MDBDropdownMenu>

                <DropdownItem
                    icon="fa-solid fa-barcode"
                    text="Generate Barcode"
                    onClick={props.didClickGenerateBarcode}
                />

                <MDBDropdownItem divider />

                <DropdownItem
                    icon="fa fa-trash"
                    text="Delete"
                    onClick={props.onClickDeleteButton}
                    additionalClasses="user-scan-row-delete-dropdown-item"
                />

            </MDBDropdownMenu>
        </MDBDropdown>
    );

}
