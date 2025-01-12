import React, {
    type JSX,
} from "react";
import Modal from "react-modal";
import { type ViewportSize } from "../types/ViewportSize";

type ConfigureLinkModalProps = {
    formattedLink: string | null;
    showFormattedLinkModal: boolean;
    viewportSize: ViewportSize;
    onChangeConfigureLinkInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    closeConfigureLinkModal: (e: React.MouseEvent | React.KeyboardEvent) => void;
    onSubmitConfigureLinkForm: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function ConfigureLinkModal(
    props: ConfigureLinkModalProps
): JSX.Element {

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

    return (
        <Modal
            className="configure-link-modal rounded-3 m-5 mx-auto p-5 shadow-lg text-black border border-primary"
            isOpen={props.showFormattedLinkModal}
            onRequestClose={props.closeConfigureLinkModal}
            style={{
                overlay: {
                    position: "fixed",
                    // TODO: Do we need to set the top, left, right, and bottom
                    // TODO: properties to 0?
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(255, 255, 255, 0.75)"
                },
                content: {
                    position: "fixed",
                    top: "20px",
                    left: offset,
                    right: offset,
                    background: "#cdcfd1",
                    // overflow: "auto",
                    // WebkitOverflowScrolling: "touch",
                    borderRadius: "4px",
                    outline: "none",
                    maxWidth: "1000px",
                    // padding: "20px"
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
                    onSubmit={props.onSubmitConfigureLinkForm}
                >

                    <div
                        className="configure-link-form-text text-center mx-auto m-2 mb-4"
                    >
                        <p>
                            Enter a link to open. Replace the barcode with %s.
                        </p>
                        <p className="">
                            For example: <br />
                        </p>
                        <code className="">
                            {exampleFormattedURL}
                        </code>
                    </div>

                    <div className="form-floating mb-3 mx-5 mx-auto">
                        <input
                            autoFocus={true}
                            id="configure-link-input"
                            className="form-control"
                            type="text"
                            value={props.formattedLink ?? ""}
                            onChange={props.onChangeConfigureLinkInput}
                        />
                        {/* <label for="configure-link-input">
                            Link:
                        </label> */}
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
