// frontend\src\Components\Footer.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
// import "font-awesome/css/font-awesome.min.css";

export const Footer = () => {
    const navigate = useNavigate();
    const [workoutDropdown, setWorkoutDropdown] = useState(false);

    return (
        <footer className="container-fluid bg-black text-light mt-5 wow fadeIn p-4" data-wow-delay="0.1s">
            <div className="container bg-white py-5">
                <div className="row g-5">
                    {/* Health Hub Section */}
                    <div className="col-md-6 col-lg-4">
                        <ul className="bg-dark rounded p-4">
                            <li onClick={() => navigate("/")} style={{ listStyle: "none", cursor: "pointer" }}>
                                <h1 className="text-warning text-uppercase mb-3 text-start">Health Hub</h1>
                            </li>
                            <p className="text-white mb-0">
                                A gym, short for gymnasium, is an indoor venue for exercise and sports. The word is derived from the ancient Greek term "gymnasion".
                            </p>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div className="col-md-7 col-lg-2">
                        <h6 className="text-start text-warning text-uppercase mb-4">Contact</h6>
                        <p className="mb-2 text-dark"><i className="fa fa-map-marker-alt me-2 text-warning" /> Katargram, Surat</p>
                        <p className="mb-2 text-dark"><i className="fa fa-phone-alt me-2 text-warning" /> +012 345 67890</p>
                        <p className="mb-2 text-dark"><i className="fa fa-envelope me-2 text-warning" /> Healthhub@gmail.com</p>

                        {/* Social Media Links */}
                        <div className="d-flex justify-content-start pt-2">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline-warning btn-social me-2"><i className="fa fa-instagram"></i></a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline-warning btn-social me-2"><i className="fa fa-facebook-f"></i></a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline-warning btn-social me-2"><i className="fa fa-youtube"></i></a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline-warning btn-social"><i className="fa fa-linkedin"></i></a>
                        </div>
                    </div>

                    {/* Quick Links & Image Section */}
                    <div className="col-lg-4">
                        <div className="row">
                            {/* Quick Links */}
                            <div className="col-md-7">
                                <h6 className="text-start text-warning text-uppercase mb-4">Quick Links</h6>
                                <ul className="list-unstyled">
                                    <li className="d-flex align-items-center">
                                        <i className="fa fa-chevron-right text-warning me-2"></i>
                                        <a href="/Dietplan" className="text-dark text-decoration-none">Diet Plan</a>
                                    </li>
                                    <li className="d-flex align-items-center">
                                        <i className="fa fa-chevron-right text-warning me-2"></i>
                                        <a href="/membership-plan" className="text-dark text-decoration-none">Membership Plan</a>
                                    </li>
                                    <li className="d-flex align-items-center">
                                        <i className="fa fa-chevron-right text-warning me-2"></i>
                                        <a href="/Trainer" className="text-dark text-decoration-none">Trainer</a>
                                    </li>

                                    {/* Workout Dropdown - Arrow first */}
                                    <li className="position-relative d-flex align-items-center">
                                        <i className={`fa ${workoutDropdown ? "fa-caret-down" : "fa-caret-right"} text-warning me-2`}></i>
                                        <a href="#" className="text-dark text-decoration-none" onClick={(e) => { e.preventDefault(); setWorkoutDropdown(!workoutDropdown); }}>
                                            Workout
                                        </a>
                                    </li>
                                    {workoutDropdown && (
                                        <ul className="list-unstyled ms-3  bg-white  p-2 rounded shadow">
                                            <li className="d-flex align-items-center">
                                                <i className="fa fa-chevron-right text-warning me-2"></i>
                                                <a href="/home-workout" className="text-dark text-decoration-none">Home Workout</a>
                                            </li>
                                            <li className="d-flex align-items-center">
                                                <i className="fa fa-chevron-right text-warning me-2"></i>
                                                <a href="/gym-workout" className="text-dark text-decoration-none">Gym Workout</a>
                                            </li>
                                        </ul>
                                    )}

                                    <li className="d-flex align-items-center">
                                        <i className="fa fa-chevron-right text-warning me-2"></i>
                                        <a href="/About" className="text-dark text-decoration-none">About Us</a>
                                    </li>
                                    <li className="d-flex align-items-center">
                                        <i className="fa fa-chevron-right text-warning me-2"></i>
                                        <a href="/Contact" className="text-dark text-decoration-none">Contact Us</a>
                                    </li>
                                </ul>
                            </div>

                            {/* Image Beside Quick Links */}
                            <div className="col-md-5 d-flex align-items-center">
                                <img src="Images/fo.jpg" alt="Fitness" className="img-fluid rounded shadow" style={{ maxWidth: "200%", height: "100%" }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright Section */}
            <div className="container  bg-white ">
                <div className="copyright text-center py-4 px-3">
                     <span className="border-bottom text-dark" onClick={() => navigate("/")} role="button" style={{ cursor: "pointer" }}> © Health Hub , All Rights Reserved.
                    Designed By </span><span className="border-bottom text-dark">Borad Gopi, Patel Dharmi, Vadekar Priyal, Sheladiya Vidhi</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;