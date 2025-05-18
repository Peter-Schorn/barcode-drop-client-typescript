import "./HomeView.css";

import React from "react";
import {
    useRef,
    useState,
    type JSX
} from "react";

import { Form, Button } from "react-bootstrap";

import { useNavigate } from "react-router-dom";

import { MainNavbar } from "./MainNavbar";

import { prefixWithHostIfPort } from "../utils/MiscellaneousUtilities.ts";

import barcodeDropBackground from "../assets/images/barcode_drop_background.svg";

import { homeViewLogger as logger } from "../utils/loggers.ts";

export function HomeView(): JSX.Element {

    // const context = useContext(AppContext);

    const navigate = useNavigate();

    const usernameField = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState("");

    // Whether or not the form has been validated
    const [validated, setValidated] = useState(false);

    function onSubmitForm(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        logger.debug(`onSubmitForm(): user: "${user}"`);

        // Validate the form
        const form = event.currentTarget;

        if (form.checkValidity()) {
            void navigate(`/scans/${user}`);
        }

        setValidated(true);

    }

    function handleUserInputChange(
        event: React.ChangeEvent<HTMLInputElement>
    ): void {

        logger.debug(
            "handleFormChange() event.target.value: " +
            `"${event.target.value}"`
        );

        setUser(event.target.value);

    }

    function renderForm(): JSX.Element {
        return (
            <div
                className="home-view-username-form-container"
            >
                <Form
                    className="home-view-username-form shine"
                    onSubmit={onSubmitForm}
                    noValidate
                    validated={validated}
                >
                    <Form.Group
                        controlId="HomeView-username"
                    >
                        <Form.Label>
                            <h2 className="mb-3"> Enter Your Username</h2>
                        </Form.Label>

                        <Form.Control
                            autoFocus
                            ref={usernameField}
                            className="form-floating"
                            size="lg"
                            type="text"
                            placeholder=""
                            value={user}
                            onChange={handleUserInputChange}
                            maxLength={30}
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
        );
    }


    return (
        <div className="home-view-root">
            <title>
                {prefixWithHostIfPort("BarcodeDrop")}
            </title>
            <MainNavbar />
            <div
                className={
                    "d-flex justify-content-center align-items-center " +
                    "flex-grow-1"
                }
                style={{
                    backgroundImage: `url(${barcodeDropBackground})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                }}
            >
                {/* <div className="splash-text text-center">
                    <p className="display-1">
                        {this.state.splashText}
                    </p>
                </div> */}
                {/* *** === FORM === *** */}
                {renderForm()}
            </div>
        </div>
    );

}
