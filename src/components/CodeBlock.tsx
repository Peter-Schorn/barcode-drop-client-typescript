import "./CodeBlock.css";
import { type JSX, useState } from "react";

import { codeBlockLogger as logger } from "../utils/loggers";

type CodeBlockProps = {
    className?: string;
    code: string;
};

export function CodeBlock(props: CodeBlockProps): JSX.Element {

    const [checkmarkVisible, setCheckmarkVisible] = useState(false);

    function onClickCopyButton(): void {

        navigator.clipboard.writeText(props.code).then(() => {
            logger.debug("copied code block to clipboard");
        }, (error) => {
            logger.error(
                "Failed to copy code block to clipboard: ", error
            );
        });

        setCheckmarkVisible(true);
        setTimeout(() => {
            setCheckmarkVisible(false);
        }, 2_000);

    }

    return (
        <pre className={`code-block ${props.className ?? ""}`}>
            <div className="code-block-copy-button-container">
                <button
                    className="code-block-copy-button"
                    onClick={onClickCopyButton}
                >
                    {checkmarkVisible ? (
                        <i className="code-block-copy-check-mark fa fa-check"></i>
                    ) : (
                        <i className="fa fa-copy"></i>
                    )}
                </button>
            </div>
            {props.code}
        </pre>
    );
}
