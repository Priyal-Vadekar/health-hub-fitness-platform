// Membership.js
import React, { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { http } from "../../api/http";

const Membership = () => {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        // Fetch userId from /api/auth/me
        const meRes = await http.get(`/auth/me`);
        const userId = meRes.data && (meRes.data._id || meRes.data.data?._id);
        if (!userId) {
          setLoading(false);
          return;
        }
        // Now fetch the membership for this user
        const res = await http.get(`/user-membership-plans/user/${userId}`);
        setMembership(res.data.data);
      } catch (err) {
        console.error("Failed to fetch membership", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembership();
  }, []);

  if (loading)
    return (
      <Layout>
        <p>Loading membership...</p>
      </Layout>
    );

  return (
    <Layout>
      <div className="membership-summary">
        <h1>Your Membership</h1>
        {membership ? (
          <div className="membership-details">
            <h2>{membership.membershipPlan?.title}</h2>
            <p>{membership.membershipPlan?.description}</p>
            <p>
              <strong>Price: ₹{membership.totalPrice}</strong>
            </p>
            <p>
              <strong>
                Duration: {membership.membershipPlan?.duration} month
                {membership.membershipPlan?.duration > 1 ? "s" : ""}
              </strong>
            </p>
            <h3>Benefits:</h3>
            <ul>
              {membership.membershipPlan?.benefits?.map((benefit, idx) => (
                <li key={idx}>✓ {benefit}</li>
              ))}
            </ul>
            <p>
              <strong>
                {membership.membershipPlan?.personalTrainerCharge
                  ? "Personal Trainer: Added"
                  : "Personal Trainer: Not Added"}
              </strong>
            </p>
            <p>
              <strong>
                Status: {membership.isActive ? "Active" : "Inactive"}
              </strong>
            </p>
          </div>
        ) : (
          <p>No membership found for your account.</p>
        )}
      </div>
    </Layout>
  );
};

export default Membership;
