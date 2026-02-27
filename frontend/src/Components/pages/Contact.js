import React, { useEffect, useState } from "react";
import axios from "axios";

export const Contact = () => {
  const [user, setUser] = useState({ name: "", email: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("auth"); // Retrieve token from localStorage
        if (!token) return; // If no token, exit (user is not logged in)

        const response = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser({ name: response.data.name, email: response.data.email });
        setIsLoggedIn(true); // User is logged in
      } catch (error) {
        console.error("Error fetching user:", error);
        setIsLoggedIn(false); // Ensure login status is false if fetch fails
      }
    };

    fetchUser();
  }, []);

  return (
    <div>
      <div className="bg-white p-0">
        {/* Page Header Start */}
        <div
          className="container-fluid page-header mb-5 p-0"
          style={{ backgroundImage: "url(/Images/contact.jpg)" }}
        >
          <div className="container-fluid page-header-inner py-5">
            <div className="container text-center pb-5">
              <h1 className="display-3 text-white text1 animated slideInDown">
                Contact
              </h1>
            </div>
          </div>
        </div>
        {/* Page Header End */}

        {/* Contact Start */}
        <div className="py-5">
          <div className="container">
            <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
              <h6 className="section-title text-center text-color text-uppercase">
                Contact Us
              </h6>
              <h1 className="mb-5">
                <span className="text-color text-uppercase">Contact</span> For
                Any Query
              </h1>
            </div>
            <div className="row g-4">
              <div className="col-md-6 wow fadeIn" data-wow-delay="0.1s">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d59510.13240780569!2d72.75026122167966!3d21.21664490000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be04fb32cb262e1%3A0xdf63b74926e5a783!2sRoyal%20Hotel!5e0!3m2!1sen!2sin!4v1707409212682!5m2!1sen!2sin"
                  style={{ minHeight: 370, width: "100%", border: 0 }}
                  allowFullScreen=""
                  aria-hidden="false"
                  tabIndex={0}
                />
              </div>

              <div className="col-md-6">
                <div className="wow fadeInUp" data-wow-delay="0.2s">
                  <form>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-floating">
                          <input
                            type="text"
                            className="form-control"
                            id="name"
                            placeholder="Your Name"
                            value={isLoggedIn ? user.name : ""} // Show only if logged in
                            readOnly
                          />
                          <label htmlFor="name">Your Name</label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-floating">
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            placeholder="Your Email"
                            value={isLoggedIn ? user.email : ""} // Show only if logged in
                            readOnly
                          />
                          <label htmlFor="email">Your Email</label>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-floating">
                          <input
                            type="text"
                            className="form-control"
                            id="subject"
                            placeholder="Subject"
                          />
                          <label htmlFor="subject">Subject</label>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-floating">
                          <textarea
                            className="form-control"
                            placeholder="Leave a message here"
                            id="message"
                            style={{ height: 150 }}
                          />
                          <label htmlFor="message">Message</label>
                        </div>
                      </div>
                      <div className="col-12">
                        <button
                          className="btn btn-color w-100 py-3"
                          type="submit"
                        >
                          Send Message
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Contact End */}

        {/* Back to Top */}
        <a href="#" className="btn btn-lg btn-color btn-lg-square back-to-top">
          <i className="bi bi-arrow-up" />
        </a>
      </div>
    </div>
  );
};
