import { type JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { HomeView } from "./components/HomeView.tsx";
import { UserScansRoot } from "./components/UserScansRoot.tsx";
import { SetupView } from "./components/SetupView.tsx";
import { BarcodeScannerView } from "./components/BarcodeScanner/BarcodeScannerView.tsx";
import {
    BarcodeScannerLoginView
} from "./components/BarcodeScanner/BarcodeScannerLoginView.tsx";

import { AppContext } from "./model/AppContext.ts";

import { Backend } from "./api/Backend.ts";

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

                    {/* --- Barcode Scanner --- */}
                    <Route
                        path="/scanner"
                        element={<BarcodeScannerLoginView />}
                    />

                    <Route
                        path="/scanner/:user"
                        element={<BarcodeScannerView />}
                    />

                </Routes>
            </BrowserRouter>
        </AppContext.Provider>
    );

}
