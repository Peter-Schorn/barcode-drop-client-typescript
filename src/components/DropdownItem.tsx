import {
    type JSX,
    type PropsWithChildren,
} from "react";

import Stack from "react-bootstrap/Stack";

import {
    MDBDropdownItem
} from "mdb-react-ui-kit";

// import { dropdownItemLogger as logger } from "../utils/loggers";

type DropdownItemProps = PropsWithChildren & {
    text: string;
    icon?: string;
    keyboardShortcutString?: string;
    onClick?: () => void;
    additionalClasses?: string;
};

export function DropdownItem(props: DropdownItemProps): JSX.Element {

    const isSubmenu = props.children !== undefined;

    function handleClick(
        event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ): void {

        props.onClick?.();
        if (isSubmenu) {
            event.stopPropagation();
        }

    }

    return (
        <MDBDropdownItem
            data-component-name="MDBDropdownItem"
        >

            <a
                className={"dropdown-item " + (props.additionalClasses ?? "")}
                onClick={handleClick}
            >
                <Stack direction="horizontal" gap={3}>
                    <i
                        className={props.icon}
                        style={{
                            width: "20px",
                            height: "16px",
                        }}
                    />
                    <span>{props.text}</span>
                    <span className="ms-auto">
                    </span>
                    {props.keyboardShortcutString && (
                        <span className="border-" style={{
                            color: "gray",
                        }}>
                            {props.keyboardShortcutString}
                        </span>
                    )}
                    {isSubmenu && (
                        <span>
                            <i className="fa-solid fa-caret-right pe-2"></i>
                        </span>
                    )}
                </Stack>
            </a>
            {isSubmenu && (
                <ul className="dropdown-menu dropdown-submenu">
                    {props.children}
                </ul>
            )}
        </MDBDropdownItem>
    );
}
