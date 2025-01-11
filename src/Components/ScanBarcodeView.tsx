import React from "react";
import { Component } from "react";

import { AppContext } from "../Model/AppContext";

import { Button, Dropdown, Stack, Form, InputGroup, Col, Row } from "react-bootstrap";
import FloatingLabel from 'react-bootstrap/FloatingLabel';

import Modal from "react-modal";

export default class ScanBarcodeView extends Component {

    static contextType = AppContext;

    constructor(props) {
        super(props);

        this.state = {
            barcode: ""
        };

        this.barcodeField = React.createRef();

    }

    componentDidMount() {

        console.log("ScanBarcodeView.componentDidMount()");

        document.addEventListener("keydown", this.handleKeyDown);
        this.barcodeField?.current?.focus();

    }

    componentWillUnmount() {
        
        console.log("ScanBarcodeView.componentWillUnmount()");
        document.removeEventListener("keydown", this.handleKeyDown);

    }

    handleInputChange = (event) => {

        const newBarcode = event?.target?.value;

        console.log(
            `ScanBarcodeView.handleInputChange(): ` +
            `"${newBarcode}"`
        );

        this.setState({ 
            barcode: newBarcode
        });
    };

    onSubmitForm = (event) => {

        event.preventDefault();
        
        const barcode = this.state?.barcode;

        console.log(
            `ScanBarcodeView.onSubmitForm(): user: "${this.state.user}"; ` +
            `barcode: "${barcode}"`
        );
        
        this.scanBarcode(barcode);

    };

    onClose = () => {
        console.log("ScanBarcodeView.onClose()");
        this.props.onClose();
    }

    scanBarcode = (barcode) => {
        
        const user = this.props?.user;

        if (!user) {
            console.error(
                "ScanBarcodeView.scanBarcode(): user is EMPTY"
            );
            return;
        }
        if (!barcode) {
            console.error(
                "ScanBarcodeView.scanBarcode(): barcode is EMPTY"
            );
            return;
        }

        const id = crypto.randomUUID();
        this.props.insertClientScannedBarcodeID(id);

        console.log(
            `ScanBarcodeView.scanBarcode(): will scan barcode ` +
            `for user "${user}": "${barcode}" (id: "${id}")`
        );

        this.context.api.scanBarcode({user, barcode, id})
            .then((response) => {
                console.log(
                    `ScanBarcodeView.scanBarcode(): response: ` +
                    `"${response}"`
                );
                // this.setState({ 
                //     barcode: "" 
                // });
            })
            .catch((error) => {
                console.error(
                    `ScanBarcodeView.scanBarcode(): error: ` +
                    `"${error}"`
                );
                // this.setState({ 
                //     barcode: "" 
                // });
            })
            .finally(() => {
                this.setState({ 
                    barcode: "" 
                });
            });



    }

    handleKeyDown = (event) => {
        console.log(
            `ScanBarcodeView.handleKeyDown(): ` +
            `keyCode: "${event.keyCode}"`
        );
        if (event.key === "Escape") {
            console.log(
                "ScanBarcodeView.handleKeyDown(): ESCAPE"
            );
            event.preventDefault();
            this.onClose();
        }
    }

    render() {
        return (
            <div 
                className="scan-barcode-container translate-middle top-50 start-50 position-absolute rounded z-index-1"
                // className="scan-barcode-container position-absolute translate-middle rounded"
                style={{
                    zIndex: 1,
                    // width: "90%",
                    // width: "100%",
                    height: "38px",
                    width: "500px",
                    maxWidth: "90vw",
                    marginLeft: "auto",
                    marginRight: "10px",
                    marginTop: "-35vh",
                         /* top    | right | bottom | left */
                    // margin: "120px   0px    10px      50%",
                    // margin: "auto",
                    // padding: "100px",
                    backgroundColor: "lightgray",

                    border: "0px solid black",

                    // position: "absolute"

                    // shadow: "2px 2px 2px 2px",
                    // top: "40px",
                    // left: "auto"
                }}
            >
                {/* <div
                    // className="position-sticky "
                    style={{
                        top: 0,
                        height: "200px"
                        // maxWidth: "90vw"
                    }}
                > */}
                    <Form
                        onSubmit={this.onSubmitForm}
                        
                    >
                        
                        {/* <div 
                            className="row justify-content-start"
                        > */}
                        <div 
                            className="d-flex"
                        >

                                {/* COLUMN */}
                                <div 
                                    className=""
                                >
                                    {/* *** === Close Button === *** */}
                                    <button 
                                        onClick={this.onClose}
                                        className="scan-barcode-close-button"
                                        // variant="dark" 
                                        // size="sm"
                                        type="button"
                                        style={{
                                            width: "30px",
                                            height: "48px",
                                            position: "absolute",
                                            margin: "0px 44px",
                                            color: "gray",
                                            // backgroundColor: "clear",
                                            backgroundColor: "rgba(0, 0, 0, 0)",
                                            // backgroundColor: "#f0eded",
                                            // borderRadius: "0px 0px 0px 0px",
                                            // borderRadius: "40px",
                                            border: "none",
                                            // opacity: "0.4"
                                            zIndex: 6
                                        }}
                                    >
                                        X
                                    </button>
                                </div>

                                {/* COLUMN */}
                                <div 
                                    className="flex-fill"
                                >
                                        
                                    <InputGroup>
                                    
                                        <InputGroup.Text
                                            style={{
                                                // width: "16px",
                                                // height: "60px"
                                                border: "2px solid white"
                                            }}
                                        >
                                            <i
                                                className="fa-solid fa-barcode"
                                                style={{
                                                    color: "black",
                                                    width: "16px",
                                                    height: "16px"
                                                }}
                                            >
                                            </i>
                                        </InputGroup.Text>

                                        <Form.Control
                                            ref={this.barcodeField}
                                            type="text"
                                            size="lg"
                                            value={this.state.barcode}
                                            onChange={this.handleInputChange}
                                            placeholder="Enter Barcode"
                                            className="scan-barcode-input"
                                            style={{
                                                // maxWidth: "300px"
                                                paddingRight: "70px",
                                                paddingLeft: "25px",
                                                border: "0px solid black"
                                            }}
                                        >
                                        </Form.Control>

                                    </InputGroup>
                                </div>
                                
                                {/* COLUMN */}
                                <div 
                                    className=""
                                >
                                    {/* ============================== */}
                                    {/* *** ==== SUBMIT BUTTON === *** */}
                                    {/* ============================== */}
                                    <button 
                                        className="scan-barcode-submit-button"
                                        // variant="dark" 
                                        // size="sm"
                                        type="submit"
                                        style={{
                                            maxWidth: "80px",
                                            height: "48px",
                                            position: "absolute",
                                            margin: "0px -63px",
                                            color: "gray",
                                            // backgroundColor: "rgba(0, 0, 0, 0.1)",
                                            backgroundColor: "#f0eded",
                                            borderRadius: "0px 8px 8px 0px",
                                            border: "none",
                                            // opacity: "0.43
                                            // hidden: true
                                            zIndex: 5
                                        }}
                                    >
                                        Submit
                                        {/* {"  ↳  "} */}
                                    </button>
                                </div>
                        </div>
                    </Form>
                {/* </div> */}
            </div>
        );
    }
}

// className={
//     "d-flex justify-content-center align-items-center " +
//     "w-100 h-75 "
//     // "bg-secondary"
// }

// <Form
//     onSubmit={this.onSubmitForm}
// >
    
//     <div className="row justify-content-start">
//             <div className="col-sm-8">

//                 {/* <FloatingLabel
//                     controlId="floatingInput"
//                     label="Enter Barcode"
//                     className=""  // "mb-3"
//                     size="sm"
//                 > */}
//                     <Form.Control
//                         ref={this.barcodeField}
//                         type="text"
//                         // size="sm"
//                         value={this.state.barcode}
//                         onChange={this.handleInputChange}
//                         placeholder="Enter Barcode"
//                         style={{
//                             maxWidth: "300px"
//                         }}
//                     />
//                 {/* </FloatingLabel> */}
//             </div>
//             {/* <Col xs={3}> */}
//             <div className="col-sm-2">
//                 <Button 
//                     // className="m-3" 
//                     variant="dark" 
//                     type="submit"
//                     style={{
//                         maxWidth: "80px"
//                     }}
//                 >
//                     Submit
//                 </Button>
//             </div>
//     </div>
// </Form>
