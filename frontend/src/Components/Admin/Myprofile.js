import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import './css/Profile.css';
import axios from 'axios';
import { Header } from "./Header";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const AdminMyProfile = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    role: '',
  });

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      const rawToken = localStorage.getItem("auth");
      const token = rawToken ? JSON.parse(rawToken) : null;

      if (!token) {
        // No token, try fallback to localStorage
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (savedUser) setUser(savedUser);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data) {
          const userData = {
            name: response.data.name || "",
            email: response.data.email || "",
            role: response.data.role || "",
          };
          setUser(userData);
          // Save to localStorage as fallback
          localStorage.setItem("user", JSON.stringify(response.data));
        } else {
          throw new Error("No user data received");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user data. Using local storage fallback.");

        // Fallback to localStorage
        try {
          const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
          if (savedUser && savedUser.name) {
            setUser({
              name: savedUser.name || "",
              email: savedUser.email || "",
              role: savedUser.role || "",
            });
          }
        } catch (parseError) {
          console.error("Error parsing saved user:", parseError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEditClick = () => {
    setEditedUser({ currentPassword: '', newPassword: '' });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser({ ...editedUser, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editedUser.currentPassword || !editedUser.newPassword) {
      toast.error("Please enter both current and new passwords");
      return;
    }

    if (editedUser.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    try {
      const rawToken = localStorage.getItem('auth');
      const token = rawToken ? JSON.parse(rawToken) : null;
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      const response = await axios.put(
        `${API_URL}/auth/change-password`,
        { currentPassword: editedUser.currentPassword, newPassword: editedUser.newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.message || response.status === 200) {
        setEditedUser({ currentPassword: '', newPassword: '' });
        setIsEditing(false);
        toast.success('Password updated successfully!');
      } else {
        toast.error('Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.message || 'Failed to update password. Please check your current password.');
    }
  };

  return (
    <Layout>
      <div className="profile-container">
        <Header />
        <div className="profile-content">
          {loading ? (
            <p className="loading-text">Loading profile...</p>
          ) : (
            <>
              <div className="profile-info">
                <h2>Profile Information</h2>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <button className="edit-button" onClick={handleEditClick}>
                  Edit Profile
                </button>
              </div>

              {isEditing && (
                <div className="edit-form">
                  <h2>Edit Profile</h2>
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>Name:</label>
                      <input type="text" name="name" value={user.name} disabled />
                    </div>

                    <div className="form-group">
                      <label>Email:</label>
                      <input type="email" name="email" value={user.email} disabled />
                    </div>

                    <div className="form-group">
                      <label>Current Password:</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={editedUser.currentPassword}
                        onChange={handleInputChange}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="form-group">
                      <label>New Password:</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={editedUser.newPassword}
                        onChange={handleInputChange}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="modal-buttons">
                      <button type="submit">Save Changes</button>
                      <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminMyProfile;
