import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import { Carousel } from "antd";
import "../../css/Home.css";
import { http } from "../../api/http";

export const Home = () => {
  const navigate = useNavigate();

  const [staffData, setStaffData] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState({ members: 0, staff: 0, dietitians: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);

  useEffect(() => {
    http
      .get("/users/public-stats")
      .then((res) => {
        setStats({
          members: res.data.members || 0,
          staff: res.data.staff || 0,
          dietitians: res.data.dietitians || 0,
        });
      })
      .catch((err) => {
        console.error("Error fetching stats:", err);
      })
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    http
      .get("/staff")
      .then((res) => {
        // Handle both { data: [...] } and direct array responses
        const list = res.data.data || res.data;
        setStaffData(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("Error fetching staff:", err);
        setStaffData([]);
      })
      .finally(() => setStaffLoading(false));
  }, []);

  // ─── Fetch testimonials ───
  useEffect(() => {
    http
      .get("/testimonials/all-testimonials")
      .then((response) => {
        const active = response.data.filter((t) => t.active === true);
        setTestimonials(active);
      })
      .catch((err) => console.error("Error fetching testimonials:", err));
  }, []);

  const buttonStyle = {
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
  };

  return (
    <div>
      <div className="">

        {/* ── Carousel ─────────────────────────────────────────────────────── */}
        <div
          id="carouselExampleIndicators"
          className="carousel slide"
          data-bs-ride="carousel"
        >
          <div className="carousel-indicators">
            <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1" />
            <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" aria-label="Slide 2" />
            <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2" aria-label="Slide 3" />
          </div>
          <div className="carousel-inner">
            <div className="carousel-item active">
              <video muted loop autoPlay height={"1%"} width={"100%"}>
                <source src="Videos/gym.mp4" type="video/mp4" />
              </video>
              <div className="carousel-caption d-flex flex-column align-items-center justify-content-center">
                <div className="p-3 v1">
                  <h5 className="section-title text-white text-uppercase mb-3 animated slideInDown">Health Hub</h5>
                  <h1 className="display-3 text-white mb-4 animated slideInDown">Discover A Brand Health Hub</h1>
                </div>
              </div>
            </div>
            <div className="carousel-item">
              <video muted loop autoPlay height={"1%"} width={"100%"}>
                <source src="Videos/fitness.mp4" type="video/mp4" />
              </video>
              <div className="carousel-caption d-flex flex-column align-items-center justify-content-center">
                <div className="p-3 v1">
                  <h5 className="section-title text-white text-uppercase mb-3 animated slideInDown">Health Hub</h5>
                  <h1 className="display-3 text-white mb-4 animated slideInDown">Discover A Brand Health Hub</h1>
                </div>
              </div>
            </div>
            <div className="carousel-item">
              <video muted loop autoPlay height={"1%"} width={"100%"}>
                <source src="Videos/dor.mp4" type="video/mp4" />
              </video>
              <div className="carousel-caption d-flex flex-column align-items-center justify-content-center">
                <div className="p-3 v1">
                  <h5 className="section-title text-white text-uppercase mb-3 animated slideInDown">Health Hub</h5>
                  <h1 className="display-3 text-white mb-4 animated slideInDown">Discover A Brand Health Hub</h1>
                </div>
              </div>
            </div>
          </div>
          <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev" style={buttonStyle}>
            <span className="carousel-control-prev-icon" aria-hidden="true" />
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next" style={buttonStyle}>
            <span className="carousel-control-next-icon" aria-hidden="true" />
            <span className="visually-hidden">Next</span>
          </button>
        </div>
        {/* ── Carousel End ─────────────────────────────────────────────────── */}

        {/* ── Stats + About ────────────────────────────────────────────────── */}
        <div className="container-xxl py-5">
          <div className="container">
            <div className="row g-5 align-items-center">
              <div className="col-lg-6">
                <h1 className="mb-4">
                  Welcome to{" "}
                  <span className="text-color text-uppercase">Health Hub</span>
                </h1>
                <p className="mb-4">
                  Explore various fitness programs with our expert trainers. In
                  Gymnasiums, apparatus such as barbells, bumper plates,
                  kettlebells, dumbbells, resistance bands, jumping boards,
                  running paths, tennis balls, cricket fields, and fencing areas
                  are used for exercises.
                </p>

                {/* ── Bug 1 Fix: Stats cards now use `stats` from /public-stats ── */}
                <div className="row g-3 pb-4">
                  <div className="col-sm-4 wow fadeIn" data-wow-delay="0.1s">
                    <div className="border rounded p-1 card-hover-effect">
                      <div className="border rounded text-center p-4">
                        <i className="fa fa-users fa-2x text-color mb-2" />
                        <h2 className="mb-1">
                          {statsLoading ? "..." : stats.members}
                        </h2>
                        <p className="mb-0">Members</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-4 wow fadeIn" data-wow-delay="0.3s">
                    <div className="border rounded p-1 card-hover-effect">
                      <div className="border rounded text-center p-4">
                        <i className="fa fa-user-tie fa-2x text-color mb-2" />
                        <h2 className="mb-1">
                          {statsLoading ? "..." : stats.staff}
                        </h2>
                        <p className="mb-0">Staff</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-4 wow fadeIn" data-wow-delay="0.5s">
                    <div className="border rounded p-1 card-hover-effect">
                      <div className="border rounded text-center p-4">
                        <i className="fa fa-heartbeat fa-2x text-color mb-2" />
                        <h2 className="mb-1">
                          {statsLoading ? "..." : stats.dietitians}
                        </h2>
                        {/* NOTE: You had "Machines" here — changed to Dietitians.
                            Change back to "Machines" when you add that feature. */}
                        <p className="mb-0">Dietitians</p>
                      </div>
                    </div>
                  </div>
                </div>

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
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.3)";
                  }}
                >
                  Know More
                </button>
              </div>

              <div className="col-lg-6">
                <div className="row g-3">
                  <div className="col-6 text-end">
                    <img className="img-fluid rounded border border-dark w-75 img-effect" src="/Images/girl.jpg" alt="Trainer" style={{ marginTop: "9%" }} />
                  </div>
                  <div className="col-6 text-start">
                    <img className="img-fluid rounded border border-dark w-100 img-effect" src="/Images/OIP.jpg" alt="Workout" />
                  </div>
                  <div className="col-6 text-end">
                    <img className="img-fluid rounded border border-dark w-50 img-effect" src="/Images/th.jpg" alt="Gym" />
                  </div>
                  <div className="col-6 text-start">
                    <img className="img-fluid rounded border border-dark w-75 img-effect" src="/Images/OIP_01.jpg" alt="Health Hub" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ── Stats + About End ─────────────────────────────────────────────── */}

        {/* ── Video Section ────────────────────────────────────────────────── */}
        <div className="container-fluid">
          <div className="px-0 wow zoomIn" data-wow-delay="0.1s">
            <div className="row">
              <div className="col-lg-6 bg-dark">
                <div className="p-5">
                  <h6 className="section-title text-start text-light text-uppercase mb-3">GYM Management</h6>
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
        {/* ── Video End ─────────────────────────────────────────────────────── */}

        {/* ── Testimonials ─────────────────────────────────────────────────── */}
        {testimonials.length > 0 && (
          <div className="testimonial mt-5 py-4 bg-dark text-black wow zoomIn" data-wow-delay="0.1s">
            <div className="container">
              <Carousel autoplay dots={false} slidesToShow={1} arrows className="bg-white">
                {testimonials.map((testimonial) => (
                  <div key={testimonial._id} className="text-center p-4">
                    <p style={{ fontSize: "16px", color: "black", fontWeight: "500", marginBottom: "12px" }}>
                      "{testimonial.message}"
                    </p>
                    <div className="d-flex justify-content-center align-items-center">
                      <div
                        className="rounded-circle border border-white d-flex align-items-center justify-content-center"
                        style={{ width: 45, height: 45, marginRight: 12, backgroundColor: "#007bff", color: "white", fontSize: "18px", fontWeight: "bold" }}
                      >
                        {(testimonial.user?.name || "A").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h6 className="mb-0" style={{ fontSize: "16px", fontWeight: "600", color: "black" }}>
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
        {/* ── Testimonials End ──────────────────────────────────────────────── */}

        {/* ── Our Team / Staff ─────────────────────────────────────────────── */}
        <div className="container-xxl py-5">
          <div className="container">
            <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
              <h6 className="section-title text-center text-color text-uppercase">Our Team</h6>
              <h1 className="mb-5">
                Explore Our <span className="text-color text-uppercase">Staff</span>
              </h1>
            </div>
            <div className="row g-4">
              <div className="row row-cols-1 row-cols-md-3 g-4">
                {staffLoading ? (
                  // Show skeleton placeholders while loading instead of "Loading..."
                  [1, 2, 3].map((n) => (
                    <div className="col" key={n}>
                      <div className="card h-100" style={{ background: "#f0f0f0", minHeight: 280 }} />
                    </div>
                  ))
                ) : staffData.length > 0 ? (
                  staffData.map((staff) => (
                    <div className="col" key={staff._id}>
                      <div className="card h-100 card-hover-effect">
                        <img
                          src={
                            staff.image
                              ? staff.image.startsWith("http")
                                ? staff.image               // full URL → use as-is
                                : `/Images/${staff.image}`  // filename only → prepend path
                              : "/Images/user_default.jpg"
                          }
                          className="card-img-top"
                          alt={staff.user?.name || "Staff Member"}
                          style={{ height: 220, objectFit: "cover" }}
                          onError={(e) => { e.target.src = "/Images/user_default.jpg"; }}
                        />
                        <div className="card-body">
                          <h5 className="card-title">
                            {staff.user?.name || "Unnamed Staff"}
                          </h5>
                          <p className="card-text">
                            <strong>{staff.role}</strong>
                            {staff.specialty ? ` — ${staff.specialty}` : ""}
                          </p>
                          <p className="card-text">{staff.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center w-100">No staff members found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ── Our Team End ─────────────────────────────────────────────────── */}

        <a href="#" className="btn btn-lg btn-color btn-lg-square back-to-top">
          <i className="bi bi-arrow-up" />
        </a>
      </div>
    </div>
  );
};

export default Home;