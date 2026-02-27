import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Use useNavigate instead of useHistory
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import { Carousel } from "antd";
import axios from "axios";
import "../../css/Home.css";

const contentStyle = {
  height: "250px",
  fontsize: "35px",
  textAlign: "center",
  background: "#ffff",
};

export const Home = () => {
  const navigate = useNavigate(); // Updated from useHistory to useNavigate

  const [getdata, setData] = useState([]);
  const [getdata1, setData1] = useState([]);
  const [getbookdata, setBookData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users") // API returning all users
      .then((res) => setUsers(res.data))
      .catch((error) => console.log(error));
  }, []);

  // Fetch testimonials
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/testimonials/all-testimonials")
      .then((response) => {
        // Filter only active testimonials
        const activeTestimonials = response.data.filter(
          (testimonial) => testimonial.active === true
        );
        setTestimonials(activeTestimonials);
      })
      .catch((error) => {
        console.error("Error fetching testimonials:", error);
      });
  }, []);

  const totalMembers = getdata.filter(user => user.role === "Member").length;
  const totalStaff = staffData.filter(user => user.role === "Staff" || user.role === "Trainer").length;
  const totalDietitians = getbookdata.filter(user => user.role === "RD" || user.role === "RDN").length;

  const buttonStyle = {
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
  };
  return (
    <div>
      <div className="">
        {/*owl-carousel start*/}
        <div
          id="carouselExampleIndicators"
          class="carousel slide"
          data-bs-ride="carousel"
        >
          <div class="carousel-indicators">
            <button
              type="button"
              data-bs-target="#carouselExampleIndicators"
              data-bs-slide-to="0"
              class="active"
              aria-current="true"
              aria-label="Slide 1"
            ></button>
            <button
              type="button"
              data-bs-target="#carouselExampleIndicators"
              data-bs-slide-to="1"
              aria-label="Slide 2"
            ></button>
            <button
              type="button"
              data-bs-target="#carouselExampleIndicators"
              data-bs-slide-to="2"
              aria-label="Slide 3"
            ></button>
          </div>
          <div class="carousel-inner">
            <div class="carousel-item active">
              <video muted loop autoPlay height={"1%"} width={"100%"}>
                <source src="Videos/gym.mp4" type="video/mp4" />
              </video>
              <div class="carousel-caption d-flex flex-column align-items-center justify-content-center">
                <div class="p-3 v1">
                  <h5 class="section-title text-white text-uppercase mb-3 animated slideInDown">
                    Health Hub
                  </h5>
                  <h1 class="display-3 text-white mb-4 animated slideInDown">
                    Discover A Brand Health Hub
                  </h1>
                </div>
              </div>
            </div>
            <div class="carousel-item">
              <video muted loop autoPlay height={"1%"} width={"100%"}>
                <source src="Videos/fitness.mp4" type="video/mp4" />
              </video>
              <div class="carousel-caption d-flex flex-column align-items-center justify-content-center">
                <div class="p-3 v1">
                  <h5 class="section-title text-white text-uppercase mb-3 animated slideInDown">
                    Health Hub
                  </h5>
                  <h1 class="display-3 text-white mb-4 animated slideInDown">
                    Discover A Brand Health Hub
                  </h1>
                </div>
              </div>
            </div>
            <div class="carousel-item">
              <video muted loop autoPlay height={"1%"} width={"100%"}>
                <source src="Videos/dor.mp4" type="video/mp4" />
              </video>
              <div class="carousel-caption d-flex flex-column align-items-center justify-content-center">
                <div class="p-3 v1">
                  <h5 class="section-title text-white text-uppercase mb-3 animated slideInDown">
                    Health Hub
                  </h5>
                  <h1 class="display-3 text-white mb-4 animated slideInDown">
                    Discover A Brand Health Hub
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <button
            class="carousel-control-prev"
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide="prev"
            style={buttonStyle}
          >
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
          </button>
          <button
            class="carousel-control-next"
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide="next"
            style={buttonStyle}
          >
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
          </button>
        </div>
        {/*owl-carousel end*/}

        {/* About Start */}
        <div className="container-xxl py-5">
          <div className="container">
            <div className="row g-5 align-items-center">
              <div className="col-lg-6">
                <h1 className="mb-4">
                  Welcome to{" "}
                  <span className="text-color text-uppercase">Health Hub</span>
                </h1>
                <p className="mb-4">
                  Explore various fitness programs with our expert trainers.In
                  Gymnasiums, apparatus such as barbells, bumper plates,
                  kettlebells, dumbbells, resistance bands, jumping boards,
                  running paths, tennis balls, cricket fields, and fencing areas
                  are used for exercises.
                </p>
                <div className="row g-3 pb-4">
                  <div className="col-sm-4 wow fadeIn" data-wow-delay="0.1s">
                    <div className="border rounded p-1 card-hover-effect">
                      <div className="border rounded text-center p-4">
                        <i className="fa fa-users-cog fa-2x text-color mb-2" />
                        <h2 className="mb-1" data-toggle="counter-up">
                          {totalMembers}
                        </h2>
                        <p className="mb-0">Members</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-4 wow fadeIn" data-wow-delay="0.3s">
                    <div className="border rounded p-1 card-hover-effect">
                      <div className="border rounded text-center p-4">
                        <i className="fa fa-users-cog fa-2x text-color mb-2" />
                        <h2 className="mb-1" data-toggle="counter-up">
                          {totalStaff}
                        </h2>
                        <p className="mb-0">Staffs</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-4 wow fadeIn" data-wow-delay="0.5s">
                    <div className="border rounded p-1 card-hover-effect">
                      <div className="border rounded text-center p-4">
                        <i className="fa fa-users-cog fa-2x text-color mb-2" />
                        <h2 className="mb-1" data-toggle="counter-up">
                          {totalDietitians}
                        </h2>
                        <p className="mb-0">Machines</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* FIXED navigation */}
                <button
                  className="btn btn-color py-3 px-5 mt-2"
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                    transition: "all 0.3s ease",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                  }}
                  onClick={() => navigate("/About")}
                  onMouseOver={(e) => {
                    e.target.style.transform = "scale(1.05)";
                    e.target.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.3)";
                  }}
                >
                  Know More
                </button>
              </div>

              {/* FIXED: Moved Image Section to the Right Column */}
              <div className="col-lg-6">
                <div className="row g-3">
                  <div className="col-6 text-end">
                    <img
                      className="img-fluid rounded border border-dark w-75 img-effect"
                      src="/Images/girl.jpg"
                      alt="Trainer"
                      style={{ marginTop: "9%" }}
                    />
                  </div>
                  <div className="col-6 text-start">
                    <img
                      className="img-fluid rounded border border-dark w-100 img-effect"
                      data-wow-delay="0.3s"
                      src="/Images/OIP.jpg"
                      alt="Workout"
                    />
                  </div>
                  <div className="col-6 text-end">
                    <img
                      className="img-fluid rounded border border-dark w-50 img-effect"
                      data-wow-delay="0.5s"
                      src="/Images/th.jpg"
                      alt="Gym"
                    />
                  </div>
                  <div className="col-6 text-start">
                    <img
                      className="img-fluid rounded border border-dark w-75 img-effect"
                      data-wow-delay="0.7s"
                      src="/Images/OIP (1).jpg"
                      alt="Health Hub"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* About End */}

        {/* Video Start */}
        <div className="container-fluid">
          <div className="px-0 wow zoomIn" data-wow-delay="0.1s">
            <div className="row">
              <div className="col-lg-6 bg-dark">
                <div className="p-5">
                  <h6 className="section-title text-start text-light text-uppercase mb-3">
                    GYM Management
                  </h6>
                  <h1 className="text-light">Discover A Brand Health Hub</h1>
                  <p className="text-light">
                    A gym isn't just a place for exercise; it's the place you go
                    to unwind, socialize, and work out. The gym is a whole
                    experience. Some of the most successful facilities have
                    several gym features that contribute to the kind of member
                    experience that drives retention and sales.
                  </p>
                </div>
              </div>
              <div className="col-lg-6">
                <video muted loop autoPlay width="100%">
                  <source src="videos/health.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial Start */}
        {testimonials.length > 0 && (
          <div
            className="testimonial mt-5 py-4 bg-dark text-black wow zoomIn"
            data-wow-delay="0.1s"
          >
            <div className="container">
              <Carousel
                autoplay
                dots={false}
                slidesToShow={1}
                arrows
                className="bg-white"
              >
                {testimonials.map((testimonial, index) => (
                  <div key={testimonial._id} className="text-center p-4">
                    <p
                      style={{
                        fontSize: "16px",
                        color: "black",
                        fontWeight: "500",
                        marginBottom: "12px",
                      }}
                    >
                      "{testimonial.message}"
                    </p>
                    <div className="d-flex justify-content-center align-items-center">
                      {/* Avatar with fallback */}
                      <div
                        className="rounded-circle border border-white d-flex align-items-center justify-content-center"
                        style={{
                          width: 45,
                          height: 45,
                          marginRight: 12,
                          backgroundColor: "#007bff",
                          color: "white",
                          fontSize: "18px",
                          fontWeight: "bold",
                        }}
                      >
                        {(testimonial.user?.name || "A")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h6
                          className="mb-0"
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "black",
                          }}
                        >
                          {testimonial.user?.name || "Anonymous"}
                        </h6>
                        <small style={{ fontSize: "14px", color: "black" }}>
                          {new Date(testimonial.date).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
            </div>
          </div>
        )}
        {/* Testimonial End */}

        {/* Team Start */}
        <div className="container-xxl py-5">
          <div className="container">
            <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
              <h6 className="section-title text-center text-color text-uppercase">
                Our Team
              </h6>
              <h1 className="mb-5">
                Explore Our{" "}
                <span className="text-color text-uppercase">Staff</span>
              </h1>
            </div>
            <div className="row g-4">
              <div className="row row-cols-1 row-cols-md-3 g-4">
                {staffData.length > 0 ? (
                  staffData.map((staff) => (
                    <div className="col" key={staff._id}>
                      <div className="card h-100 card-hover-effect">
                        <img
                          src={
                            staff.image
                              ? `Images/${staff.image}`
                              : "Images/default.jpg"
                          }
                          className="card-img-top"
                          alt={staff.user?.name || "Staff Member"}
                        />
                        <div className="card-body">
                          <h5 className="card-title">
                            {staff.user?.name || "Unnamed Staff"}
                          </h5>
                          <p className="card-text">
                            <strong>{staff.role}</strong> -{" "}
                            {staff.specialty || "General Staff"}
                          </p>
                          <p className="card-text">{staff.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center">Loading staff data...</p>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Team End */}

        {/* Back to Top */}
        <a href="#" className="btn btn-lg btn-color btn-lg-square back-to-top">
          <i className="bi bi-arrow-up" />
        </a>
      </div>
    </div>
  );
};
export default Home;
