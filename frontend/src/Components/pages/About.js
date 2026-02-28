import React, { useEffect, useState } from "react";
import axios from "axios";

export const About = () => {
  const [stats, setStats] = useState({ members: 0, staff: 0, dietitians: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [staffData, setStaffData] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);

  // ── Bug 1 Fix: Use /public-stats instead of /api/users ──────────────────
  // Previously fetched users into `users` state but computed counts
  // from `getdata`, `getbookdata`, `staffData` which were never fetched → always 0
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users/public-stats")
      .then((res) => {
        setStats({
          members: res.data.members || 0,
          staff: res.data.staff || 0,
          dietitians: res.data.dietitians || 0,
        });
      })
      .catch((err) => console.error("Error fetching stats:", err))
      .finally(() => setStatsLoading(false));
  }, []);

  // ── Bug 2 Fix: Actually fetch staff data ─────────────────────────────────
  // Previously staffData was declared but no useEffect ever fetched it → always []
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/staff")
      .then((res) => {
        const list = res.data.data || res.data;
        setStaffData(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("Error fetching staff:", err);
        setStaffData([]);
      })
      .finally(() => setStaffLoading(false));
  }, []);

  return (
    <div>
      <div className="bg-white p-0">

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div
          className="container-fluid page-header mb-5 p-0"
          style={{ backgroundImage: "url(/Images/About-us.jpg)" }}
        >
          <div className="container-fluid page-header-inner py-5">
            <div className="container text-center pb-5">
              <h1 className="display-3 text-white text1 animated slideInDown">
                About Us
              </h1>
            </div>
          </div>
        </div>
        {/* ── Page Header End ───────────────────────────────────────────── */}

        {/* ── About + Stats ─────────────────────────────────────────────── */}
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

                {/* ── Stats Cards ─────────────────────────────────────── */}
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
                        <p className="mb-0">Dietitians</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* ── Stats Cards End ─────────────────────────────────── */}
              </div>

              {/* ── Images — fixed backslash paths to forward slashes ─── */}
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
                      src="/Images/OIP.jpg"
                      alt="Workout"
                    />
                  </div>
                  <div className="col-6 text-end">
                    <img
                      className="img-fluid rounded border border-dark w-50 img-effect"
                      src="/Images/th.jpg"
                      alt="Gym"
                    />
                  </div>
                  <div className="col-6 text-start">
                    <img
                      className="img-fluid rounded border border-dark w-75 img-effect"
                      src="/Images/OIP_01.jpg"
                      alt="Health Hub"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ── About + Stats End ─────────────────────────────────────────── */}

        {/* ── More Info ─────────────────────────────────────────────────── */}
        <div className="about">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-5 col-md-6">
                <div className="about-img">
                  {/* Fixed backslash path */}
                  <img src="/Images/a.jpg" width={"70%"} alt="Experience" />
                </div>
              </div>
              <div className="col-lg-7 col-md-6">
                <div className="section-header text-left">
                  <h1 className="mb-4">
                    <span className="text-uppercase">30 Year Experience</span>
                  </h1>
                </div>
                <div className="about-text">
                  <p>
                    If you are someone who only walks for the sake of physical
                    activity and has never lifted weights in your life, it is
                    time to get started. Many people avoid weight lifting
                    because they believe it will make them bulky, but weight
                    lifting helps build muscle, which boosts metabolism. Weight
                    lifting is also a great way to gain strength while avoiding
                    bodily pain. The only thing to remember is that before
                    lifting weights, you should check your body's mobility
                    because you may have stiff muscle groups, which can cause
                    injury. The other best way is to start doing bodyweight
                    workouts, which are a great substitute for weights and help
                    with muscle building and calorie burning.
                  </p>
                  <p>
                    I recommend two types of stretching. Dynamic stretching is
                    to be done before a workout as it helps warm up the target
                    muscles. Conversely, static stretches are to be done after a
                    workout as they help your muscles relax and flush out the
                    metabolites from your muscle tissues, kickstarting recovery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ── More Info End ─────────────────────────────────────────────── */}

        {/* ── Our Team / Staff ──────────────────────────────────────────── */}
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
                {staffLoading ? (
                  // Skeleton placeholders while loading
                  [1, 2, 3].map((n) => (
                    <div className="col" key={n}>
                      <div
                        className="card h-100"
                        style={{ background: "#f0f0f0", minHeight: 280 }}
                      />
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
                                ? staff.image            // full URL → use as-is
                                : `/Images/${staff.image}` // filename → prepend path
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
        {/* ── Our Team End ──────────────────────────────────────────────── */}

        <a href="#" className="btn btn-lg btn-color btn-lg-square back-to-top">
          <i className="bi bi-arrow-up" />
        </a>
      </div>
    </div>
  );
};

export default About;