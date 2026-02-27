import axios from "axios";
import React, { useEffect, useState } from "react";
import Trainercardprops from "./Trainercardprops";

export const Trainer = () => {
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/staff/") // ✅ Correct API URL
      .then((res) => {
        setTrainers(res.data.data.filter((staff) => staff.role === "Trainer")); // Only show Trainers
      })
      .catch((error) => {
        console.error("Error fetching trainers:", error);
      });
  }, []);

  return (
    <div>
      <div className="bg-white p-0">
        {/* Page Header Start */}
        <div
          className="container-fluid page-header mb-5 p-0"
          style={{ backgroundImage: "url(/Images/Trainer.jpg)" }}
        >
          <div className="container-fluid page-header-inner py-5">
            <div className="container text-center pb-5">
              <h1 className="display-3 text-white text1 animated slideInDown">
                Trainers
              </h1>
            </div>
          </div>
        </div>
        {/* Page Header End */}

        {/* Trainers Section Start */}
        <div className="container-xxl py-5">
          <div className="container">
            <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
              <h6 className="section-title text-center text-color text-uppercase">
                Our Trainers
              </h6>
              <h1 className="mb-5">
                Meet Our <span className="text-color text-uppercase">Experts</span>
              </h1>
            </div>
            <div className="row g-4">
              {trainers.length > 0 ? (
                trainers.map((trainer) => (
                  <div key={trainer._id} className="col-lg-3 col-md-6">
                    <Trainercardprops
                      image={`/Images/${trainer.image}`}
                      name={trainer.user?.name || "Unnamed Staff"}
                      profession={trainer.specialty || trainer.role}
                      description={trainer.description}
                      isCertified={trainer.isCertified || trainer.user?.isCertified}
                    />
                    <div className="text-center mt-3">
                      <a
                        href={`/book-trainer/${trainer.user?._id || trainer.user}`}
                        className="btn"
                        style={{ background: '#FFD700', color: '#1e1e2f', border: 'none', fontWeight: 'bold', padding: '0.5rem 1.5rem' }}
                      >
                        Book Session
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center">No trainers available.</p>
              )}
            </div>
          </div>
        </div>
        {/* Trainers Section End */}

        {/* Back to Top */}
        <a href="#" className="btn btn-lg btn-color btn-lg-square back-to-top">
          <i className="bi bi-arrow-up" />
        </a>
      </div>
    </div>
  );
};

export default Trainer;
