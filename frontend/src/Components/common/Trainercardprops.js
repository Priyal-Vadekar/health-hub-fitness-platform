import React from 'react';

const Trainercardprops = ({ image, name, profession, isCertified }) => {
  return (
    <div className="trainer-card wow fadeInUp" data-wow-delay="0.1s">
      <div className="rounded border border-dark shadow bg-dark overflow-hidden card-hover-effect">
        <div className="position-relative">
          <img
            className="img-fluid trainer-card-img"
            src={image || "/Images/default-profile.jpg"}
            onError={(e) => (e.target.src = "/Images/default-profile.jpg")}
            alt={name || "Trainer"}
          />
          {isCertified && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#FFD700',
                color: '#1e1e2f',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              ✔ Certified
            </div>
          )}
        </div>
        <div className="text-center teams b1 border border-light p-4">
          <h5 className="fw-bold text-white mb-0">{name || "Unnamed Staff"}</h5>
          <small className="text-light">{profession}</small>
        </div>
      </div>
    </div>
  );
};

export default Trainercardprops;
