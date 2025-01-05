import React from "react";
import { 
    Component, 
    type JSX, 
    type CSSProperties,
    type ChangeEventHandler,
    type FormEventHandler
} from "react";

import { Form, Button } from "react-bootstrap";

import { useNavigate, type NavigateFunction } from "react-router-dom";

import MainNavbar from "./MainNavbar";

import { AppContext } from "../Model/AppContext.ts";

import { prefixTitleWithDocumentHostIfPort } from "../MiscellaneousUtilities.ts";

import barcodeDropBackground from "../assets/images/barcode_drop_background.svg";

export default function HomeView(): JSX.Element {

    const navigate = useNavigate();

    return (
        <HomeViewCore
            navigate={navigate}
        />
    );

};

type HomeViewCoreProps = {
    navigate: NavigateFunction;
};

type HomeViewCoreState = {
    user: string | null;
    splashText: string | null;
};

class HomeViewCore extends Component<HomeViewCoreProps, HomeViewCoreState> {

    static override contextType = AppContext;

    declare context: React.ContextType<typeof AppContext>;

    private usernameField = React.createRef<HTMLInputElement>();

    constructor(props: HomeViewCoreProps) {
        super(props);

        const title = "BarcodeDrop";
        document.title = prefixTitleWithDocumentHostIfPort(title);

        this.state = {
            user: null,
            splashText: null
        };

    }

    override componentDidMount(): void {

        this.usernameField?.current?.focus();

        this.context.api!.getRandomSplashText()
            .then((splashText) => {
                console.log(`HomeView.componentDidMount(): splashText: "${splashText}"`);
                this.setState({
                    splashText: splashText
                });
            })
            .catch((error) => {
                console.error(`HomeView.componentDidMount(): error: "${error}"`);
            });

    }

    onSubmitForm: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        console.log(`HomeView.onSubmitForm(): user: "${this.state.user}"`);
        void this.props.navigate(`/scans/${this.state.user}`);
    };

    handleUserInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        console.log(
            "HomeView.handleFormChange() event.target.value: " +
            `"${event.target.value}"`
        );

        this.setState({
            user: event.target.value
        });

        
    };

    usernameFormBackground = (): CSSProperties => {
        return {
            background: "linear-gradient(to right, rgba(0, 210, 255, 0.9), rgba(58, 123, 213, 0.9))" ,
            // background: "rgb(0, 0, 0)"
            // backgroundColor: "#071f5c"
            // backgroundColor: "white"
            // backgroundColor: "rgba(255, 240, 200, 1)"
            // opacity: "0.9"
        };
    };

    renderForm(): JSX.Element {
        return  (
            <div 
                className="username-form-container rounded"
                style={{
                    backgroundColor: "white"
                }}
            >
                <Form 
                    className="username-form p-5 rounded text-center shine" 
                    onSubmit={this.onSubmitForm}
                    style={this.usernameFormBackground()}   
                    // style={{
                    //     background: "rgba(255, 250, 255, 255) !important"
                    // }}   
                >
                    <Form.Group className="" controlId="userForm.userInput">
                        <Form.Label>
                            <h2 className=" mb-3"> Enter Your Username</h2>
                        </Form.Label>
                        
                        <Form.Control
                            ref={this.usernameField}
                            className="form-floating"
                            size="lg"
                            type="text"
                            placeholder=""
                            onChange={this.handleUserInputChange}
                        />
                    </Form.Group>
                    <Button 
                        className="mt-4" 
                        variant="dark" 
                        type="submit"
                    >
                        Submit
                    </Button>
                </Form>
            </div>
        );
    }


    override render(): JSX.Element {
        return (
            <div className="vw-100 vh-100">
                <MainNavbar />
                <div 
                    className={
                        "d-flex justify-content-center align-items-center " +
                        "w-100 h-75 "
                        // "bg-secondary"
                    }
                    style={{
                        backgroundImage: `url(${barcodeDropBackground})`,
                        // backgroundImage: `url(${process.env.PUBLIC_URL + "images/barcode_drop_background.svg"})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                    }}
                >
                    {/* <div className="splash-text text-center">
                        <p className="display-1">
                            {this.state.splashText}
                        </p>
                    </div> */}
                    {/* *** === FORM === *** */}
                    {this.renderForm()}
                </div>
            </div>
        );
    }

}
