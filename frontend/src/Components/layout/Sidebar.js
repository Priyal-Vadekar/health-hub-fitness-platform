import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Sidebar.css';
import axios from 'axios';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      fetchRole(storedUser.email);
    }
  }, []);

  const fetchRole = async (email) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/user-role?email=${email}`);
      if (response.data.role) {
        setRole(response.data.role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const handleNavigation = (path) => {
    if (path === '/logout') {
      localStorage.removeItem("user");
      localStorage.removeItem("auth");
      window.dispatchEvent(new Event("authChange"));
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  // 💠 Menus by role
  const memberMenu = [
    { name: 'My Profile', path: '/profile' },
    { name: 'Progress', path: '/progress' },
    { name: 'Announcements', path: '/announcement' }
  ];

  const trainerMenu = [
    { name: 'My Profile', path: '/profile' },
    { name: 'Workout Management', path: '/workout-management' },
    { name: 'Assigned Users', path: '/user-progress' },
    { name: 'Diet Plan Management', path: '/diet-plan' }
  ];

  const adminMenu = [
    { name: 'Backend', path: '/admin' },
    { name: 'Logout', path: '/logout' }
  ];

  const dietitianMenu = [
    { name: 'My Profile', path: '/profile' },
    { name: 'Dietitian Dashboard', path: '/dietitian' },
    { name: 'Diet Plan Management', path: '/diet-plan' }
  ];

  // 🔁 Role-based menu selection
  let menuItems = [];

  if (role === 'Trainer') {
    menuItems = [...trainerMenu, { name: 'Logout', path: '/logout' }];
  } else if (role === 'Admin') {
    menuItems = adminMenu;
  } else if (role === 'RD' || role === 'RDN') {
    menuItems = [...dietitianMenu, { name: 'Logout', path: '/logout' }];
  } else {
    menuItems = [...memberMenu, { name: 'Logout', path: '/logout' }];
  }

  if (!user || !role) return null;

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <i
          className={`fa-solid ${isCollapsed ? 'fa-bars' : 'fa-xmark'}`}
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ cursor: 'pointer', fontSize: '20px' }}
        />
      </div>
      <ul className="sidebar-menu" type="None">
        {menuItems.map((item, index) => (
          <li
            key={item.name}
            onClick={() => handleNavigation(item.path)}
            className="sidebar-item"
          >
            {!isCollapsed ? <span>{item.name}</span> : <i className="fa-solid fa-circle-dot" title={item.name}></i>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;

