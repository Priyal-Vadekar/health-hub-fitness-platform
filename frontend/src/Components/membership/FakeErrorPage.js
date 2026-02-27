import React from "react";
import { useNavigate } from "react-router-dom";
import "./FakeErrorPage.css";

const FakeErrorPage = ({ message = "Unexpected Error Occurred" }) => {
    const navigate = useNavigate();

    return (
        <div className="fake-error-container">
            <h1>500 | Internal Server Error</h1>
            <p>{message}</p>
            <p className="error-subtext">
                Our server encountered an unexpected condition that prevented it from fulfilling the request.
            </p>

            <button onClick={() => navigate("/membership")} className="back-btn">
                Go Back
            </button>
        </div>
    );
};

export default FakeErrorPage;
