import { type JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { Container, Navbar, Nav, NavDropdown } from "react-bootstrap";

import { Component } from "react";

import HomeView from "./Components/HomeView.tsx";
import UserScansRoot from "./Components/UserScansRoot.tsx";
import SetupView from "./Components/SetupView.tsx";


import { AppContext } from "./Model/AppContext.ts";

import { Backend } from "./API/Backend.ts";

import Modal from "react-modal";

Modal.setAppElement("#root");

// TODO: Convert to Functional Component
export default class App extends Component {

    static override contextType = AppContext;

    constructor(props: Record<string, never>) {
        super(props);

        const api = new Backend();

        this.state = {
            api: api
        };

    }

    override componentDidMount(): void {
        console.log("App.componentDidMount():");
    }

    override render(): JSX.Element {
        return (
            <AppContext.Provider value={this.state}>
                <BrowserRouter>
                    <Routes>

                        {/* --- Home --- */}
                        <Route
                            path="/"
                            element={<HomeView />}
                        />

                        {/* --- Setup Instructions --- */}
                        <Route
                            path="/setup"
                            element={
                                <SetupView />
                            }
                        />

                        {/* --- User Scans Table --- */}
                        <Route
                            path="/scans/:user"
                            element={<UserScansRoot />}
                        />

                    </Routes>
                </BrowserRouter>
            </AppContext.Provider>
        );
    }

}
