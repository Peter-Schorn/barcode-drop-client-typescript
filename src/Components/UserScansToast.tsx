import { type JSX } from "react";
import { Toaster, /* ToastBar */ } from "react-hot-toast";

export function UserScansToast(): JSX.Element {

    return (
        // TODO: Is this top-level div necessary?
        <div style={{ /* height: "50px" */ }}>
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
