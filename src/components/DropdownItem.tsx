import {
    type JSX
} from "react";

import Dropdown from "react-bootstrap/Dropdown";
import Stack from "react-bootstrap/Stack";

type DropdownItemProps = {
    icon: string;
    text: string;
    keyboardShortcutString?: string;
    onClick: () => void;
    className?: (() => string) | string;
};

export function DropdownItem(props: DropdownItemProps): JSX.Element {

    function getClassName(): string | undefined {
        if (typeof props.className === "function") {
            return props.className();
        }
        return props.className;
    }

    return (
        <Dropdown.Item
            className={getClassName()}
            onClick={props.onClick}
        >
            <Stack direction="horizontal" gap={3}>
                <i className={props.icon}></i>
                <span>{props.text}</span>
                <span className="ms-auto">
                    {/* --- Spacer --- */}
                </span>
                {props.keyboardShortcutString && (
                    <span style={{
                        color: "gray",
                    }}>
                        {props.keyboardShortcutString}
                    </span>
                )}
            </Stack>
        </Dropdown.Item>
    );
}
