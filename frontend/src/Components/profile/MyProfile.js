import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import '../../css/Profile.css';
import DietPlanReportForm from '../DietPlanReportForm';
import http from '../../api/http'; // <-- your axios instance that adds Authorization header

const MyProfile = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    height: '',
    weight: '',
    profilePic: 'https://via.placeholder.com/150',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [showDietPlanReportForm, setShowDietPlanReportForm] = useState(false);

  // Fetch profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await http.get('/profile'); // GET /api/profile
        if (res.data?.success) {
          const data = res.data.data;
          setUser({
            name: data.name || '',
            email: data.email || '',
            height: data.height ?? '',
            weight: data.weight ?? '',
            profilePic: data.profilePic || 'https://via.placeholder.com/150',
          });
          setEditedUser({
            name: data.name || '',
            email: data.email || '',
            height: data.height ?? '',
            weight: data.weight ?? '',
            profilePic: data.profilePic || 'https://via.placeholder.com/150',
          });

          // optional: also store in localStorage
          localStorage.setItem('user', JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // fallback to localStorage if needed
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if (savedUser) {
          setUser((prev) => ({
            ...prev,
            name: savedUser.name,
            email: savedUser.email,
            height: savedUser.height ?? '',
            weight: savedUser.weight ?? '',
          }));
          setEditedUser((prev) => ({
            ...prev,
            name: savedUser.name,
            email: savedUser.email,
            height: savedUser.height ?? '',
            weight: savedUser.weight ?? '',
          }));
        }
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser({ ...editedUser, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email: editedUser.email,
        height: editedUser.height ? Number(editedUser.height) : null,
        weight: editedUser.weight ? Number(editedUser.weight) : null,
      };

      const res = await http.put('/profile', payload); // PUT /api/profile
      if (res.data?.success) {
        const updated = res.data.data;
        setUser((prev) => ({
          ...prev,
          email: updated.email,
          height: updated.height,
          weight: updated.weight,
        }));

        localStorage.setItem('user', JSON.stringify(updated));
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <Layout>
      <div className="profile-container">
        <div className="profile-header">
          <h1>Welcome, {user.name}</h1>
          <p>To Gym Management System</p>
        </div>

        <div className="profile-content">
          <div className="profile-info">
            <h2>Profile Information</h2>
            <p><strong>Email:</strong> {user.email}</p>

            <button
              className="diet-plan-btn"
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={() => setShowDietPlanReportForm(true)}
            >
              Search Your Diet Plan
            </button>

            
          </div>
        </div>

        <DietPlanReportForm
          isOpen={showDietPlanReportForm}
          onClose={() => setShowDietPlanReportForm(false)}
        />

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Edit Profile</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={editedUser.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Height (cm):</label>
                  <input
                    type="number"
                    name="height"
                    value={editedUser.height}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Weight (kg):</label>
                  <input
                    type="number"
                    name="weight"
                    value={editedUser.weight}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="modal-buttons">
                  <button type="submit">Save Changes</button>
                  <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyProfile;
