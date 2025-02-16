import { createContext } from "react";
import { type Backend } from "../api/Backend";

export type AppContextType = {
    api?: Backend;
};

export const AppContext = createContext<AppContextType>({});
