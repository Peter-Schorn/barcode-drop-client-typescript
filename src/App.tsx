import { type JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomeView from "./Components/HomeView.tsx";
import UserScansRoot from "./Components/UserScansRoot.tsx";
import SetupView from "./Components/SetupView.tsx";

import { AppContext } from "./Model/AppContext.ts";

import { Backend } from "./API/Backend.ts";

import Modal from "react-modal";

Modal.setAppElement("#root");

export function App(): JSX.Element {

    const api = new Backend();

    return (
        <AppContext.Provider value={{ api: api }}>
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
