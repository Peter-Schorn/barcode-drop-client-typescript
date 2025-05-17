import "./BarcodeScannerLoginView.css";

import {
    type JSX,
    type FormEvent,
    type ChangeEvent,
    useState
} from "react";

import { MainNavbar } from "../MainNavbar";
import { Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { prefixWithHostIfPort } from "../../utils/MiscellaneousUtilities";

import { barcodeScannerLoginViewLogger as logger } from "../../utils/loggers";

export function BarcodeScannerLoginView(): JSX.Element {

    const navigate = useNavigate();

    const [user, setUser] = useState("");

    // Whether or not the form has been validated
    const [validated, setValidated] = useState(false);

    function onSubmitForm(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        logger.debug(
            `BarcodeScannerLoginView.onSubmitForm(): user: "${user}"`
        );

        // validate the form
        const form = event.currentTarget;

        if (form.checkValidity()) {
            void navigate(`/scanner/${user}`);
        }

        setValidated(true);
    }

    function handleUserInputChange(
        event: ChangeEvent<HTMLInputElement>
    ): void {
        setUser(event.target.value);
    }

    return (
        <div className="barcode-scanner-login-view-root">
            <title>
                {prefixWithHostIfPort("Scanner Login | BarcodeDrop")}
            </title>
            <MainNavbar />
            {/* <div className="barcode-scanner-login-view-title-container">
                <h1>Barcode Scanner</h1>
            </div> */}
            <div className="barcode-scanner-login-view-form-container">
                <Form
                    className="barcode-scanner-login-view-form"
                    noValidate
                    validated={validated}
                    onSubmit={onSubmitForm}
                >
                    <h1 className="barcode-scanner-login-view-form-scanner-label">
                        Barcode Scanner
                    </h1>

                    <Form.Group
                        controlId="scanner-username"
                    >
                        <Form.Label>
                            <h4 className="mb-3"> Enter Your Username</h4>
                        </Form.Label>

                        <Form.Control
                            autoFocus
                            className="form-floating"
                            size="lg"
                            type="text"
                            placeholder=""
                            value={user}
                            onChange={handleUserInputChange}
                            required // requires a value
                        />

                        <Form.Control.Feedback type="invalid">
                            <strong>
                                Please enter a username.
                            </strong>
                        </Form.Control.Feedback>

                    </Form.Group>
                    <Button
                        className="mt-4"
                        variant="dark"
                        type="submit"
                    >
                        Submit
                    </Button>
                </Form>
            </div>
        </div>
    );
}
