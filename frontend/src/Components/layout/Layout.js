import React from 'react';
import Sidebar from './Sidebar';
import '../../css/Dashboard.css'; // Optional for styling

const Layout = ({ children }) => (
    <div className="dashboard-container">
        
        <div className="dashboard-content">
            {children}
        </div>
    </div>
);

export default Layout;
