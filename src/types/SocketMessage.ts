import { type SocketMessageTypes } from "../model/SocketMessageTypes";
import { type ScannedBarcodesResponse } from "./ScannedBarcodesResponse";

export type UpsertScansSocketMessage = {
    type: SocketMessageTypes.UpsertScans;
    newScans: ScannedBarcodesResponse;
};

export type DeleteScansSocketMessage = {
    type: SocketMessageTypes.DeleteScans;
    ids: string[];
};

export type ReplaceAllScansSocketMessage = {
    type: SocketMessageTypes.ReplaceAllScans;
    scans: ScannedBarcodesResponse;
};

export type SocketMessage =
    | UpsertScansSocketMessage
    | DeleteScansSocketMessage
    | ReplaceAllScansSocketMessage;
