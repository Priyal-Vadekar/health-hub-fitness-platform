import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import Layout from './layout/Layout';
import 'react-calendar/dist/Calendar.css';
import '../../css/ProgressTracking.css';
import { fetchFoodData } from '../services/nutritionApi';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ProgressTracking = () => {
  const [data, setData] = useState({
    labels: ['January', 'February', 'March', 'April'],
    datasets: [
      {
        label: 'Weight Lifted (kg)',
        data: [50, 55, 60, 65],
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#007bff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [progressForDate, setProgressForDate] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [foodQuery, setFoodQuery] = useState('');
  const [foodData, setFoodData] = useState(null);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Generate a random progress value for demonstration
    const randomProgress = Math.floor(Math.random() * 100);
    setProgressForDate(randomProgress);
    
    // Update the chart data based on the month
    setData(prevData => {
      const month = date.toLocaleString('default', { month: 'long' });
      const newData = { ...prevData };
      
      // Find if the month already exists in labels
      const monthIndex = newData.labels.indexOf(month);
      
      if (monthIndex === -1) {
        // If month doesn't exist, add it
        newData.labels.push(month);
        newData.datasets[0].data.push(randomProgress);
      } else {
        // If month exists, update its value
        newData.datasets[0].data[monthIndex] = randomProgress;
      }
      
      return newData;
    });
  };

  const handleSearch = async () => {
    // Validate search input
    if (!foodQuery.trim()) {
      setSearchError('Please enter a food item to search');
      return;
    }
    
    setSearchError('');
    setIsSearching(true);
    try {
      const result = await fetchFoodData(foodQuery);
      if (result.name === 'Food not found' || result.calories === 0) {
        setSearchError('No nutrition data found for this food item. Please try a different search term.');
        setFoodData(null);
      } else {
        setFoodData(result);
      }
    } catch (error) {
      console.error('Error searching for food:', error);
      setSearchError('Error fetching nutrition data. Please try again.');
      setFoodData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFoodQuery('');
    setFoodData(null);
    setSearchError('');
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: "'Segoe UI', 'Helvetica Neue', 'Arial', sans-serif"
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 4,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} kg`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          },
          padding: 10
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          },
          padding: 10
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  return (
    <Layout>
      <h2 className="title">Progress Tracking</h2>

      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px 30px 10px 0' }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Open Nutrition Tracker
        </button>
      </div>

      <div className="progress-container">
        <div className="calendar-wrapper">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            maxDate={new Date()}
          />
          <p>Selected Date: {selectedDate.toDateString()}</p>
          <p>Progress: {progressForDate} grams</p>
        </div>
        <div className="chart-wrapper" style={{ height: '400px' }}>
          <Line data={data} options={chartOptions} />
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 0 25px rgba(0,0,0,0.2)',
            position: 'relative',
            fontFamily: 'Arial, sans-serif',
            color: '#000'
          }}>
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#333',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
              aria-label="Close"
            >
              ×
            </button>

            <h3 style={{
              marginBottom: '20px',
              fontSize: '20px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              🍎 Nutrition Tracker
            </h3>

            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <input
                type="text"
                placeholder="Search for food (e.g., apple, chicken, rice)"
                value={foodQuery}
                onChange={(e) => {
                  setFoodQuery(e.target.value);
                  setSearchError(''); // Clear error when user types
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: searchError ? '1px solid #dc3545' : '1px solid #ccc',
                  fontSize: '16px'
                }}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                style={{
                  backgroundColor: isSearching ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  minWidth: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isSearching ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>

            {searchError && (
              <div style={{
                color: '#dc3545',
                padding: '10px',
                marginBottom: '15px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {searchError}
              </div>
            )}

            {isSearching && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#666'
              }}>
                Searching for nutrition data...
              </div>
            )}

            {!isSearching && foodData && !searchError && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '6px',
                boxShadow: 'inset 0 0 5px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ marginBottom: '10px', fontSize: '18px' }}>
                  {foodData.name}
                </h4>
                <p style={{ margin: 0, fontSize: '16px' }}>
                  Calories: <strong>{foodData.calories}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProgressTracking;
