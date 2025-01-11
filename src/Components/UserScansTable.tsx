import React from 'react';
import { Component } from "react";
import { useParams } from 'react-router-dom';

import { AppContext } from "../Model/AppContext";

import { Button, Table } from 'react-bootstrap';

import UserScansRow from "./UserScanRow";

import Badge from 'react-bootstrap/Badge';

export default function UserScansTable(props) {

    // https://reactrouter.com/en/main/start/faq#what-happened-to-withrouter-i-need-it

    // let params = useParams();
    // let location = useLocation();
    // let navigate = useNavigate();

    return (
        <UserScansTableCore
            {...props}
            onClickOpenLink={props.onClickOpenLink}
        />
    );

};

class UserScansTableCore extends Component {

    static contextType = AppContext;

    constructor(props) {

        super(props);

        /*
         <UserScansTable
             barcodes={this.state.barcodes}
             user={this.user}
             highlightedBarcode={this.state.highlightedBarcode}
             viewportSize={this.state.viewportSize}
             router={this.props.router}
             removeBarcodesFromState={
                 this.removeBarcodesFromState
             }
             setHighlightedBarcode={
                 this._setHighlightedBarcode
             }
             onClickOpenLink={this.onClickOpenLink}
         />

         */

        if (this.props.user) {
            console.log(
                `UserScansTableCore.constructor(): user: ${this.props.user}`
            );
        }
        else {
            console.error(
                `UserScansTableCore.constructor(): invalid user: ${this.props.user}`
            );
        }
    }

    barcodeIsHighlighted(barcode) {
        return this.props.highlightedBarcode?.id === barcode.id;
    }

    render() {
        console.log("UserScansTableCore.render()");
        return (
            <Table
                className="barcode-table border-dark"
                striped bordered hover
                style={{ maxWidth: "100%" }}
            >
                <thead>
                    <tr>
                        <th
                            style={{ width: "100px" }}
                        >
                            {/* --- Primary Buttons --- */}
                        {/* </th> */}
                        {/* <th style={{ width: "100px" }}> */}
                            {/* --- Context Menu --- */}
                        </th>
                        <th>Barcode</th>
                        { this.props.viewportSize.width > 600 ? (
                            <th>Time</th>
                        ) : null }
                        { this.props.viewportSize.width > 800 ? (
                            <th style={{ width: "80px" }}>Delete</th>
                        ) : null }
                    </tr>
                </thead>
                <tbody>
                    {this.props.barcodes.map((barcode, index) =>
                        // TODO: These parameters could be passed automatically
                        // TODO: by the parent component via context.
                        <UserScansRow
                            key={barcode.id}
                            index={index}
                            barcode={barcode}
                            user={this.props.user}
                            viewportSize={this.props.viewportSize}
                            isHighlighted={this.barcodeIsHighlighted(barcode)}
                            router={this.props.router}
                            removeBarcodesFromState={
                                this.props.removeBarcodesFromState
                            }
                            setHighlightedBarcode={
                                this.props.setHighlightedBarcode
                            }
                            onClickOpenLink={this.props.onClickOpenLink}
                        />
                    )}
                </tbody>
            </Table>
        );
    }

}
