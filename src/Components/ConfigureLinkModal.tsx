import React, {
    Component,
    createRef,
    type JSX,
} from "react";
import Modal, { /* type OnAfterOpenCallbackOptions */ } from "react-modal";
import { type ViewportSize } from "../types/ViewportSize";

type ConfigureLinkModalProps = {
    formattedLink: string | null;
    showFormattedLinkModal: boolean;
    viewportSize: ViewportSize;
    onChangeConfigureLinkInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    closeConfigureLinkModal: (e: React.MouseEvent | React.KeyboardEvent) => void;
    onSubmitConfigureLinkForm: (e: React.FormEvent<HTMLFormElement>) => void;
};

export default class ConfigureLinkModal extends Component<ConfigureLinkModalProps> {

    configureLinkInputRef: React.RefObject<HTMLInputElement | null>;

    constructor(props: ConfigureLinkModalProps) {
        super(props);

        this.configureLinkInputRef = createRef();

    }

    // TODO: Change to property
    exampleFormattedURL = (): string => {
        // return `https://example.com/scan?barcode=%s`;
        return "https://www.google.com/search?q=%s";
    };

    onAfterOpen = (
        /* options: OnAfterOpenCallbackOptions | undefined */
    ): void => {
        this.configureLinkInputRef?.current?.focus();
    };

    // modalWidth = () => {
    //     // return this.props.viewportSize.width <= 1000 ? "w-100" : "w-50";
    //     return this.props.viewportSize.width <= 1000 ? "" : "w-75";
    // }

    override render(): JSX.Element {
        let offset;

        if (this.props.viewportSize.width <= 600) {
            offset = "10px";
        }
        else if (this.props.viewportSize.width <= 1000) {
            offset = "50px";
        }
        else {
            offset = "100px";
        }

        return (

            <Modal
                className={"configure-link-modal rounded-3 m-5 mx-auto p-5 shadow-lg text-black border border-primary"}
                isOpen={this.props.showFormattedLinkModal}
                onAfterOpen={this.onAfterOpen}
                onRequestClose={this.props.closeConfigureLinkModal}
                style={{
                    overlay: {
                        position: "fixed",
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
            // style={this.customStyles}
            // contentLabel="configure-link-modal"
            >

                <div
                    className="configure-link-modal-container text-center"
                >
                    <h3 className="pb-3">
                        Configure Link
                    </h3>

                    <form
                        className="configure-link-form form-floating text-center"
                        onSubmit={this.props.onSubmitConfigureLinkForm}
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
                                {this.exampleFormattedURL()}
                            </code>
                        </div>

                        <div className="form-floating mb-3 mx-5 mx-auto">
                            <input
                                ref={this.configureLinkInputRef}
                                id="configure-link-input"
                                className="form-control"
                                type="text"
                                placeholder={this.exampleFormattedURL()}
                                value={this.props.formattedLink || ""}
                                onChange={this.props.onChangeConfigureLinkInput}
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

}
