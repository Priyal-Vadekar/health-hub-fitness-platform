import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { http } from '../../api/http';

const UserProgressTracker = () => {
  const navigate = useNavigate();
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberProgress, setMemberProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignedMembers();
  }, []);

  const fetchAssignedMembers = async () => {
    try {
      setLoading(true);
      const response = await http.get("/trainer/assigned-members");
      if (response.data.success) {
        setAssignedMembers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching assigned members:", error);
      toast.error("Failed to load assigned members");
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberProgress = async (memberId) => {
    try {
      setLoading(true);
      const response = await http.get(`/trainer/member/${memberId}/progress`);
      if (response.data.success) {
        setMemberProgress(response.data.data);
        setSelectedMember(memberId);
      }
    } catch (error) {
      console.error("Error fetching member progress:", error);
      toast.error("Failed to load member progress");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mt-5 pt-4" style={{ background: '#1e1e2f', color: '#fff', padding: '2rem', borderRadius: '12px' }}>
        <h2 className="mb-4" style={{ color: '#FFD700' }}>Assigned User Progress Overview</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#FFD700' }}>Loading...</div>
        ) : assignedMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ccc' }}>
            <p>No assigned members yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            <div>
              <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Assigned Members</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {assignedMembers.map((member) => (
                  <div
                    key={member._id}
                    onClick={() => fetchMemberProgress(member._id)}
                    style={{
                      background: selectedMember === member._id ? '#2a2a3b' : '#1e1e2f',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: selectedMember === member._id ? '2px solid #FFD700' : '1px solid #3a3a4a',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    <h4 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>{member.name}</h4>
                    <p style={{ color: '#ccc', fontSize: '0.9rem', margin: '0.25rem 0' }}>{member.email}</p>
                    {member.latestWeight && (
                      <p style={{ color: '#ccc', fontSize: '0.9rem' }}>Weight: {member.latestWeight} kg</p>
                    )}
                    {member.mealAdherence !== undefined && (
                      <p style={{ color: '#ccc', fontSize: '0.9rem' }}>Meal Adherence: {member.mealAdherence}%</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {memberProgress && (
              <div style={{ background: '#2a2a3b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #3a3a4a' }}>
                <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>{memberProgress.member.name} - Progress</h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>Weight Trend</h4>
                  {memberProgress.progress.length > 0 ? (
                    <div>
                      <p style={{ color: '#ccc' }}>
                        Latest: {memberProgress.progress[memberProgress.progress.length - 1].weight} kg
                      </p>
                      <p style={{ color: '#ccc' }}>
                        First: {memberProgress.progress[0].weight} kg
                      </p>
                      {memberProgress.progress.length > 1 && (
                        <p style={{ color: '#28a745' }}>
                          Change: {(
                            memberProgress.progress[memberProgress.progress.length - 1].weight - 
                            memberProgress.progress[0].weight
                          ).toFixed(1)} kg
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: '#888' }}>No progress data</p>
                  )}
                </div>

                <div>
                  <h4 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>Recent Meal Logs</h4>
                  {memberProgress.mealLogs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {memberProgress.mealLogs.map((log) => (
                        <div key={log._id} style={{ background: '#1e1e2f', padding: '0.75rem', borderRadius: '6px' }}>
                          <p style={{ color: '#ccc', fontSize: '0.9rem' }}>
                            {new Date(log.date).toLocaleDateString()} - {log.meals.length} meals - {log.totalCalories} cal
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#888' }}>No meal logs</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserProgressTracker;
