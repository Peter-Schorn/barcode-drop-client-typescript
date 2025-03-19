import { type JSX } from "react";
import { Dropdown, Stack } from "react-bootstrap";

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
                <Dropdown.Item
                    onClick={props.didClickGenerateBarcode}
                    style={{
                        color: "#076b05"
                    }}
                >
                    <Stack direction="horizontal" gap={3}>
                        <i className="fa-solid fa-barcode"></i>
                        <span>Generate Barcode</span>
                        <span className="ms-auto">
                            {/* --- Spacer --- */}
                        </span>
                        <span style={{
                            color: "gray",
                        }}>
                        </span>
                    </Stack>
                </Dropdown.Item>
                <Dropdown.Divider className="" />
                <Dropdown.Item
                    style={{
                        color: "#ed432d",
                    }}
                    onClick={props.onClickDeleteButton}
                >
                    <Stack direction="horizontal" gap={3}>
                        <i className="fa fa-trash"></i>
                        <span>Delete</span>
                        <span className="ms-auto">
                            {/* --- Spacer --- */}
                        </span>
                    </Stack>
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );

}
