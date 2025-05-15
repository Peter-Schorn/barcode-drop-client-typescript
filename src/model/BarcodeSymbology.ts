type BarcodeSymbologyConstructor = {
    name: string;
    id: string;
    is2DSymbology: boolean;
};

export class BarcodeSymbology {

    static readonly allSymbologies: BarcodeSymbology[] = [
        new BarcodeSymbology({
            name: "Code 128",
            id: "code128",
            is2DSymbology: false
        }),
        new BarcodeSymbology({
            name: "Code 39",
            id: "code39",
            is2DSymbology: false
        }),
        new BarcodeSymbology({
            name: "EAN-13",
            id: "ean13",
            is2DSymbology: false
        }),
        new BarcodeSymbology({
            name: "EAN-8",
            id: "ean8",
            is2DSymbology: false
        }),
        new BarcodeSymbology({
            name: "UPC-A",
            id: "upca",
            is2DSymbology: false
        }),
        new BarcodeSymbology({
            name: "UPC-E",
            id: "upce",
            is2DSymbology: false
        }),
        new BarcodeSymbology({
            name: "QR Code",
            id: "qrcode",
            is2DSymbology: true
        }),
        new BarcodeSymbology({
            name: "Data Matrix",
            id: "datamatrix",
            is2DSymbology: true
        }),
        new BarcodeSymbology({
            name: "ITF-14",
            id: "itf14",
            is2DSymbology: false
        }),
        new BarcodeSymbology({
            name: "PDF417",
            id: "pdf417",
            is2DSymbology: true
        }),
        new BarcodeSymbology({
            name: "Codabar",
            id: "rationalizedCodabar",
            is2DSymbology: false
        })
    ];

    /**
     * Get a list of all symbologies that can encode the given text.
     *
     * @param barcodeText The text to check.
     *
     * @returns A list of symbologies that can encode the given text.
     */
    static allowSymbologies(
        barcodeText: string,
    ): BarcodeSymbology[] {
        return BarcodeSymbology.allSymbologies.filter(
            (symbology) => symbology.canEncodeString(barcodeText)
        );
    }

    /**
     * Get the default symbology for the given text.
     *
     * @param barcodeText The text to check.
     *
     * @returns The default symbology for the given text.
     */
    static defaultSymbology(
        barcodeText: string
    ): BarcodeSymbology {
        // cannot differentiate between UPC-E and EAN-8, so don't automatically
        // use either
        if (/^[0-9]{12}$/.test(barcodeText)) {
            return BarcodeSymbology.allSymbologies.find(
                symbology => symbology.id === "upca"
            )!;
        }
        else if (/^[0-9]{13}$/.test(barcodeText)) {
            return BarcodeSymbology.allSymbologies.find(
                symbology => symbology.id === "ean13"
            )!;
        }
        else if (barcodeText.length <= 20) {
            return BarcodeSymbology.allSymbologies.find(
                symbology => symbology.id === "code128"
            )!;
        }
        else {
            return BarcodeSymbology.allSymbologies.find(
                symbology => symbology.id === "datamatrix"
            )!;
        }

    }

    name: string;
    id: string;
    is2DSymbology: boolean;

    constructor(
        {
            name,
            id,
            is2DSymbology
        }: BarcodeSymbologyConstructor
    ) {
        this.name = name;
        this.id = id;
        this.is2DSymbology = is2DSymbology;
    }

    /**
     * Check if the barcode text can be encoded in this symbology.
     *
     * @param barcodeText The text to check.
     * @returns True if the text can be encoded; false otherwise.
     */
    canEncodeString(
        barcodeText: string
    ): boolean {
        switch (this.id) {
            /* eslint-disable no-useless-escape */
            case "upca":
                return /^[0-9]{12}$/.test(barcodeText);
            case "upce":
                return /^[0-9]{6,8}$/.test(barcodeText);
            case "ean13":
                return /^[0-9]{13}$/.test(barcodeText);
            case "ean8":
                return /^[0-9]{8}$/.test(barcodeText);
            case "itf14":
                return /^[0-9]{14}$/.test(barcodeText);
            case "code39":
                return /^[A-Z0-9\-\.\$\/\+\%\s]+$/.test(barcodeText);
            case "rationalizedCodabar":
                return /^[A-D][0-9\-\$\:\/\.\+]+[A-D]$/.test(barcodeText);
            default:
                // technically, many 1D symbologies can encode text of any
                // length, but we want to limit the length of the text to avoid
                // long barcodes that are hard to scan
                if (!this.is2DSymbology && barcodeText.length >= 30) {
                    return false;
                }
                return true;
            /* eslint-enable */
        }
    }

}
