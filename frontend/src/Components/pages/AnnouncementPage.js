import React, { useState, useEffect } from 'react';
import Layout from '../../Components/layout/Layout';
import '../../css/AnnouncementPage.css';
import { http } from "../../api/http";

const AnnouncementPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await http.get('/announcements/all-announcements?role=Member',);
        const data = await response.json();

        let announcementsList = [];
        if (data.success) {
          announcementsList = data.data || [];
        } else if (Array.isArray(data)) {
          announcementsList = data;
        }

        // Filter: Only show announcements created 24+ hours ago
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const filtered = announcementsList.filter(ann => {
          if (!ann.active) return false;
          const createdAt = new Date(ann.date || ann.createdAt);
          return createdAt <= twentyFourHoursAgo;
        });

        setAnnouncements(filtered);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        setAnnouncements([]);
      }
    };

    fetchAnnouncements();
  }, []);

  // Handle announcement click to show details
  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
  };

  // Handle close of selected announcement detail
  const handleCloseDetail = () => {
    setSelectedAnnouncement(null);
  };

  return (
    <Layout> {/* Wrap the whole page in Layout */}
      <div className="announcement-page">
        <h2>Gym Announcements</h2>

        {/* List of Announcements */}
        <div className="announcement-list">
          {announcements.map((announcement) => (
            <div
              key={announcement._id}
              className="announcement-item"
              onClick={() => handleAnnouncementClick(announcement)}
            >
              <h3>{announcement.title}</h3>
              <p>{announcement.date && new Date(announcement.date).toLocaleDateString()}</p>
              <span className="new-badge" style={{ background: '#28a745', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem', marginLeft: '1rem' }}>New</span>
            </div>
          ))}
        </div>

        {/* Display selected announcement details */}
        {selectedAnnouncement && (
          <div className="announcement-detail">
            <h3>{selectedAnnouncement.title}</h3>
            <p>{selectedAnnouncement.date && new Date(selectedAnnouncement.date).toLocaleDateString()}</p>
            <p>{selectedAnnouncement.description}</p>
            <button onClick={handleCloseDetail}>Close</button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AnnouncementPage;
