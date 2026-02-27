import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flex } from "antd";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Sidebar = (props) => {
    const [collapsed, setCollapsed] = useState(true);
    const navigate = useNavigate();
    const basePath = props.basePath || "/admin"; // Default basePath is /admin

    const navItems = [
        { path: `${basePath}/`, icon: "fa-house", label: "Dashboard" },
        { path: `${basePath}/users`, icon: "fa-users", label: "Users" },
        { path: `${basePath}/staff`, icon: "fa-user-tie", label: "Staffs" },
        { path: `${basePath}/trainer`, icon: "fa-dumbbell", label: "Trainers" },
        { path: `${basePath}/dietitians`, icon: "fa-user-md", label: "Dietitians" },
        { path: `${basePath}/membershipplan`, icon: "fa-id-card", label: "Membership Plans" },
        { path: `${basePath}/workout`, icon: "fa-running", label: "Workouts" },
        { path: `${basePath}/dietplan`, icon: "fa-apple-alt", label: "Diet Plans" },
        { path: `${basePath}/transaction`, icon: "fa-receipt", label: "Transactions" },
        { path: `${basePath}/announcement`, icon: "fa-bullhorn", label: "Announcements" },
        { path: `${basePath}/feedback`, icon: "fa-comment-dots", label: "Feedbacks" },
        { path: `${basePath}/role-simulator`, icon: "fa-eye", label: "Role Simulator" },
        { path: `${basePath}/myprofile`, icon: "fa-user", label: "My Profile" },
    ];

    return (
        <Flex>
            {/* Sidebar Section */}
            <Flex
                vertical
                className="sidebar"
                style={{
                    width: collapsed ? "60px" : "200px",
                    transition: "width 0.3s ease-in-out",
                    height: "auto",
                    background: "#12121a",
                }}
            >
                {/* Sidebar Toggle Button */}
                <Flex justify="center" align="center" className="logo-details" style={{ marginBottom: "20px" }}>
                    <i
                        className={`fa-solid ${collapsed ? "fa-bars" : "fa-xmark"}`}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            cursor: "pointer",
                            fontSize: "24px",
                            color: "white",
                            padding: "10px",
                        }}
                    />
                </Flex>

                {/* Navigation List */}
                <ul className="nav-list" style={{ listStyle: "none", padding: "0" }}>
                    {navItems.map((item, index) => (
                        <li
                            key={index}
                            onClick={() => navigate(item.path)}
                            className="nav-item"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                color: "white",
                                padding: "12px",
                                cursor: "pointer",
                                transition: "background 0.3s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#1c1c28")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                            <i
                                className={`fa-solid ${item.icon}`}
                                style={{
                                    fontSize: "18px",
                                    width: "30px",
                                    textAlign: "center",
                                    color: "white",
                                }}
                            />
                            {!collapsed && (
                                <span className="links_name" style={{ marginLeft: "10px" }}>
                                    {item.label}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </Flex>

            {/* Main Content Section */}
            <Flex
                className="main-part"
                style={{
                    width: collapsed ? "calc(100% - 60px)" : "calc(100% - 200px)",
                    transition: "width 0.3s ease-in-out",
                }}
            >
                <div className="main" style={{ width: "100%" }}>
                    {props.index}
                    {props.users}
                    {props.staffs}
                    {props.trainer}
                    {props.membershipplan}
                    {props.workout}
                    {props.dietplan}
                    {props.transaction}
                    {props.feedback}
                    {props.Myprofile}
                    {props.login}
                </div>
            </Flex>
        </Flex>
    );
};

export default Sidebar;
