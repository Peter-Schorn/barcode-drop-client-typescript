import { type JSX } from "react";
import { Toaster, toast } from "react-hot-toast";

import { userScansToastLogger as logger } from "../utils/loggers";

type UserScansToastProps = {
    currentToastID: string | null;
};

export function UserScansToast(props: UserScansToastProps): JSX.Element {

    function onClick(): void {
        logger.debug("UserScansToast.onClick() called");
        if (props.currentToastID) {
            toast.remove(props.currentToastID);
        }
    }

    return (
        <div onClick={onClick}>
            <Toaster
                gutter={10}
                toastOptions={{
                    style: {
                        background: "lightblue",
                    }
                }}
            />
        </div>
    );

}
