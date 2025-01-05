import { type JSX } from "react";

export default function MainNavbar(): JSX.Element {

    return (
        <nav className="navbar navbar-expand-lg bg-light">
            <div className="container-md">
                {/* <div className="container text-center"> */}
                <a className="navbar-brand" href="/">
                    <strong>
                        Barcode Drop
                        <i
                            style={{ margin: "0px 20px" }}
                            className="fa-solid fa-barcode"
                        >
                        </i>
                    </strong>
                </a>
                {/* --- </div> --- */}
                
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div
                    className="collapse navbar-collapse"
                    id="navbarSupportedContent"
                >
                    <div className="ms-auto">
                        <ul
                            className="navbar-nav me-auto mb-2 mb-lg-0"
                        >
                            <li className="nav-item">
                                <a
                                    className="nav-link active"
                                    // aria-current="page"
                                    href="/setup"
                                >
                                    Setup
                                </a>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </nav>
    );

}
