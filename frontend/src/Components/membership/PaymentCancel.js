import React from "react";
import { useNavigate } from "react-router-dom";

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#2a2a3b", padding: 28, borderRadius: 12, border: "1px solid #3a3a4a", textAlign: "center", maxWidth: 520 }}>
        <div style={{ width: 80, height: 80, background: "#dc3545", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 36 }}>✗</div>
        <h2 style={{ color: "#FFD700", margin: "8px 0 12px" }}>Payment canceled</h2>
        <p style={{ color: "#ccc", marginBottom: 16 }}>Your checkout was canceled. You can try again anytime.</p>
        <button
          onClick={() => navigate("/membership-plan")}
          style={{ background: "#FFD700", color: "#1e1e2f", border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
        >
          Back to Plans
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;




