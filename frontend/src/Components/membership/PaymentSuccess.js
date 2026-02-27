import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      navigate(`/stripe-payment?session_id=${encodeURIComponent(sessionId)}`);
    } else {
      navigate("/membership-plan");
    }
  }, [navigate, searchParams]);

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#FFD700", background: "#2a2a3b", padding: 24, borderRadius: 12, border: "1px solid #3a3a4a" }}>
        Verifying your payment...
      </div>
    </div>
  );
};

export default PaymentSuccess;




