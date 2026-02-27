import React, { useState, useEffect } from "react";
import ResetPassword from "./ResetPassword";

const ResetPasswordPage = () => {
    const [showModal, setShowModal] = useState(true);

    useEffect(() => {
        setShowModal(true); // open when page loads
    }, []);

    return (
        <ResetPassword
            show={showModal}
            onHide={() => setShowModal(false)}
        />
    );
};

export default ResetPasswordPage;
