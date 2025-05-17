import "./BarcodeImageModalSymbologyMenu.css";

import React, {
    type JSX,
    type ChangeEvent,
    useMemo,
    useCallback
} from "react";

import { BarcodeSymbology } from "../model/BarcodeSymbology";

import { barcodeImageModalSymbologyMenuLogger as logger } from "../utils/loggers";

type BarcodeImageModalSymbologyMenuProps = {
    barcode: string;
    symbology: BarcodeSymbology | null;
    setSymbology: (symbology: BarcodeSymbology | null) => void;
};

export function BarcodeImageModalSymbologyMenu(
    props: BarcodeImageModalSymbologyMenuProps
): JSX.Element {

    const allowedSymbologies: BarcodeSymbology[] = useMemo(() => {
        return BarcodeSymbology.allowSymbologies(props.barcode);
    }, [props.barcode]);

    const getDefaultSymbology = useCallback((): BarcodeSymbology => {
        return BarcodeSymbology.defaultSymbology(
            props.barcode,
        );
    }, [props.barcode]);

    const selectedSymbology = useMemo((): BarcodeSymbology => {
        if (props.symbology) {
            return props.symbology;
        }
        else {
            const symbology = getDefaultSymbology();
            // set the default symbology if the symbology is currently null
            props.setSymbology(symbology);
            return symbology;
        }
    }, [props, getDefaultSymbology]);

    function handleSymbologyChange(
        event: ChangeEvent<HTMLSelectElement>
    ): void {
        const selectedSymbologyValue = event.target.value;
        const selectedSymbology = allowedSymbologies.find(
            symbology => symbology.id === selectedSymbologyValue
        );
        if (selectedSymbology) {
            props.setSymbology(selectedSymbology);
        }
        else {
            logger.error(
                "handleSymbologyChange: selectedSymbology not found",
                selectedSymbologyValue
            );
        }
    }

    return (
        <div className="barcode-image-modal-symbology-menu">
            <label
                htmlFor="barcode-image-modal-symbology-menu"
                className="barcode-image-modal-symbology-menu-label"
            >
                Symbology:
            </label>
            <select
                id="barcode-image-modal-symbology-menu"
                name="barcode-image-modal-symbology-menu"
                value={selectedSymbology.id}
                onChange={handleSymbologyChange}
            >
                {allowedSymbologies.map(symbology => (
                    <option
                        key={symbology.id}
                        value={symbology.id}
                    >
                        {symbology.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
