import React, { useEffect, useState } from "react";
import axios from "axios";

export const About = () => {
  
  const [getdata, setData] = useState([]);
  const [getdata1, setData1] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [getbookdata, setBookData] = useState([]);

  const [testimonials, setTestimonials] = useState([]);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users") // API returning all users
      .then((res) => setUsers(res.data))
      .catch((error) => console.log(error));
  }, []);

 
  const totalMembers = getdata.filter(user => user.role === "Member").length;
  const totalStaff = staffData.filter(user => user.role === "Staff" || user.role === "Trainer").length;
  const totalDietitians = getbookdata.filter(user => user.role === "RD" || user.role === "RDN").length;

  return (
    <div>
      <div className="bg-white p-0">
        {/* Page Header Start */}
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
        {/* Page Header End */}

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
                        <p className="mb-0">Dietitians</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="row g-3">
                  <div className="col-6 text-end">
                    <img
                      className="img-fluid rounded border border-dark w-75 img-effect"
                      data-wow-delay="0.1s"
                      src="\Images\girl.jpg"
                      style={{ marginTop: "9%" }}
                    />
                  </div>
                  <div className="col-6 text-start">
                    <img
                      className="img-fluid rounded border border-dark w-100 img-effect"
                      data-wow-delay="0.3s"
                      src="\Images\OIP.jpg"
                    />
                  </div>
                  <div className="col-6 text-end">
                    <img
                      className="img-fluid rounded border border-dark w-50 img-effect"
                      data-wow-delay="0.5s"
                      src="\Images\th.jpg"
                    />
                  </div>
                  <div className="col-6 text-start">
                    <img
                      className="img-fluid rounded border border-dark w-75 img-effect"
                      data-wow-delay="0.7s"
                      src="\Images\OIP (1).jpg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* About End */}

        {/*More info Start*/}
        <div className="about">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-5 col-md-6">
                <div className="about-img">
                  <img src="Images\a.jpg" width={"70%"} alt="Image" />
                </div>
              </div>
              <div className="col-lg-7 col-md-6">
                <div className="section-header text-left">
                  <h1 className="mb-4">
                    <span className=" text-uppercase">30 Year Experience</span>
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
        {/*More info end*/}

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
