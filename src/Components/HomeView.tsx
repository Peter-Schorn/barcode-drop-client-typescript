import React from "react";
import {
    // useContext,
    useRef,
    useState,
    type JSX,
    type CSSProperties,
} from "react";

import { Form, Button } from "react-bootstrap";

import { useNavigate } from "react-router-dom";

import MainNavbar from "./MainNavbar";

import { prefixTitleWithDocumentHostIfPort } from "../MiscellaneousUtilities.ts";

import barcodeDropBackground from "../assets/images/barcode_drop_background.svg";

export default function HomeView(): JSX.Element {

    // const context = useContext(AppContext);

    const navigate = useNavigate();

    const usernameField = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState("");

    const usernameFormBackground: CSSProperties = {
        background: "linear-gradient(to right, rgba(0, 210, 255, 0.9), rgba(58, 123, 213, 0.9))",
        // background: "rgb(0, 0, 0)"
        // backgroundColor: "#071f5c"
        // backgroundColor: "white"
        // backgroundColor: "rgba(255, 240, 200, 1)"
        // opacity: "0.9"
    };

    function onSubmitForm(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        console.log(`HomeView.onSubmitForm(): user: "${user}"`);
        void navigate(`/scans/${user}`);
    };

    function handleUserInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
        console.log(
            "HomeView.handleFormChange() event.target.value: " +
            `"${event.target.value}"`
        );

        setUser(event.target.value);

    };

    function renderForm(): JSX.Element {
        return (
            <div
                className="username-form-container rounded"
                style={{
                    backgroundColor: "white"
                }}
            >
                <Form
                    className="username-form p-5 rounded text-center shine"
                    onSubmit={onSubmitForm}
                    style={usernameFormBackground}
                >
                    <Form.Group className="" controlId="userForm.userInput">
                        <Form.Label>
                            <h2 className=" mb-3"> Enter Your Username</h2>
                        </Form.Label>

                        <Form.Control
                            autoFocus
                            ref={usernameField}
                            className="form-floating"
                            size="lg"
                            type="text"
                            placeholder=""
                            onChange={handleUserInputChange}
                        />
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
        <div className="vw-100 vh-100">
            <title>
                {prefixTitleWithDocumentHostIfPort("BarcodeDrop")}
            </title>
            <MainNavbar />
            <div
                className={
                    "d-flex justify-content-center align-items-center " +
                    "w-100 h-75 "
                    // "bg-secondary"
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

};
