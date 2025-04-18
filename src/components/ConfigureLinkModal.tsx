import React, {
    type JSX,
    useCallback,
    useState,
    useEffect
} from "react";
import Modal from "react-modal";
import { type ViewportSize } from "../types/ViewportSize";

import { getURLFragmentParam } from "../hooks/useURLFragment";

type ConfigureLinkModalProps = {
    formattedLink: string | null;
    configureLinkInputRef: React.RefObject<HTMLInputElement | null>;
    showFormattedLinkModal: boolean;
    viewportSize: ViewportSize;
    // onChangeConfigureLinkInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    closeConfigureLinkModal: (
        e: React.MouseEvent | React.KeyboardEvent,
        formattedLink: string | null
    ) => void;
    onSubmitConfigureLinkForm: (
        e: React.FormEvent<HTMLFormElement>,
        formattedLink: string | null
    ) => void;
};

export function ConfigureLinkModal(
    props: ConfigureLinkModalProps
): JSX.Element {

    const [formattedLink, setFormattedLink] = useState<string | null>(
        props.formattedLink
    );

    const exampleFormattedURL = "https://www.google.com/search?q=%s";

    let offset: string;

    if (props.viewportSize.width <= 600) {
        offset = "10px";
    }
    else if (props.viewportSize.width <= 1000) {
        offset = "50px";
    }
    else {
        offset = "100px";
    }

    // MARK: On Hash Change
    useEffect(() => {
        // This effect is only needed when the modal is open
        if (!props.showFormattedLinkModal) {
            return;
        }
        function handleHashChange(): void {
            const formattedLinkParam = getURLFragmentParam("formatted-link");
            setFormattedLink(formattedLinkParam);
        }
        window.addEventListener("hashchange", handleHashChange);
        return (): void => {
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, [props.showFormattedLinkModal]);


    const onChangeConfigureLinkInput = useCallback((
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormattedLink(e.target.value);
    }, []);

    const onOpenConfigureLinkModal = useCallback((
        // e: Modal.OnAfterOpenCallbackOptions | undefined
    ) => {
        setFormattedLink(props.formattedLink);
    }, [props.formattedLink]);


    return (
        <Modal
            className="configure-link-modal rounded-3 m-5 mx-auto p-5 shadow-lg text-black border border-primary"
            isOpen={props.showFormattedLinkModal}
            onRequestClose={(e) => {
                props.closeConfigureLinkModal(e, formattedLink);
            }}
            onAfterOpen={onOpenConfigureLinkModal}
            style={{
                content: {
                    position: "fixed",
                    top: "20px",
                    left: offset,
                    right: offset,
                    background: "#cdcfd1",
                    borderRadius: "4px",
                    outline: "none",
                    maxWidth: "1000px",
                }
            }}
        >
            <div
                className="configure-link-modal-container text-center"
            >
                <h3 className="pb-3">
                    Configure Link
                </h3>

                <form
                    className="configure-link-form form-floating text-center"
                    onSubmit={e => {
                        props.onSubmitConfigureLinkForm(e, formattedLink);
                    }}
                >

                    <div
                        className="configure-link-form-text text-center mx-auto m-2 mb-4"
                    >
                        <p>
                            Enter a link to open. Replace the barcode with %s.
                        </p>
                        <p className="">
                            For example:
                        </p>
                        <code className="">
                            {exampleFormattedURL}
                        </code>
                    </div>

                    <div className="form-floating mb-3 mx-5 mx-auto">
                        <input
                            ref={props.configureLinkInputRef}
                            type="text"
                            autoFocus={true}
                            id="configure-link-input"
                            className="form-control"
                            // placeholder is required for floating label to
                            // work
                            placeholder={exampleFormattedURL}
                            value={formattedLink ?? ""}
                            onChange={onChangeConfigureLinkInput}
                        />
                        <label htmlFor="configure-link-input">
                            Link
                        </label>
                    </div>
                    <div className="form-group pt-3">
                        <button
                            type="submit"
                            className="btn btn-primary shadow-lg"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );

}
