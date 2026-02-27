import React from 'react';
import Sidebar from './Sidebar';
import '../../css/Dashboard.css'; // Optional for styling

const Layout = ({ children }) => (
    <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-content">
            {children}
        </div>
    </div>
);

export default Layout;
