import { type SocketMessageTypes } from "../model/SocketMessageTypes";
import { type ScannedBarcodesResponse } from "./ScannedBarcodesResponse";

export interface UpsertScansSocketMessage {
    type: SocketMessageTypes.UpsertScans;
    newScans: ScannedBarcodesResponse;
}

export interface DeleteScansSocketMessage {
    type: SocketMessageTypes.DeleteScans;
    ids: string[];
}

export interface ReplaceAllScansSocketMessage {
    type: SocketMessageTypes.ReplaceAllScans;
    scans: ScannedBarcodesResponse;
}

export type SocketMessage =
    | UpsertScansSocketMessage
    | DeleteScansSocketMessage
    | ReplaceAllScansSocketMessage;
