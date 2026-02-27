import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import Layout from '../layout/Layout';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import '../../css/ProgressTracking.css';
import { fetchFoodData } from '../../services/nutritionApi';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [foodQuery, setFoodQuery] = useState('');
  const [foodData, setFoodData] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddProgressModal, setShowAddProgressModal] = useState(false);
  const [newProgress, setNewProgress] = useState({
    weight: '',
    bodyFatPercentage: '',
    bmi: '',
    waterIntake: '',
    workoutAdherence: '',
    notes: ''
  });

  // Chart data from backend
  const [data, setData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Weight (kg)',
        data: [],
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#FFD700',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Body Fat %',
        data: [],
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

  useEffect(() => {
    fetchProgressData();
  }, []);

  useEffect(() => {
    fetchProgressForDate();
  }, [selectedDate]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const response = await http.get("/progress/summary", {
        params: { days: 30 }
      });

      if (response.data.success) {
        const summary = response.data.data;

        setProgressData(summary);

        // Update chart data
        setData({
          labels: summary.weight.map(w => new Date(w.date).toLocaleDateString()),
          datasets: [
            {
              label: 'Weight (kg)',
              data: summary.weight.map(w => w.value),
              borderColor: '#FFD700',
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#FFD700',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'Body Fat %',
              data: summary.bodyFat.map(b => b.value),
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
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressForDate = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await http.get("/progress", {
        params: { startDate: dateStr, endDate: dateStr }
      });

      if (response.data.success && response.data.data.length > 0) {
        setCurrentProgress(response.data.data[0]);
      } else {
        setCurrentProgress(null);
      }
    } catch (error) {
      console.error("Error fetching progress for date:", error);
      setCurrentProgress(null);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleSaveProgress = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await http.post("/progress", {
        date: dateStr,
        weight: newProgress.weight ? parseFloat(newProgress.weight) : null,
        bodyFatPercentage: newProgress.bodyFatPercentage ? parseFloat(newProgress.bodyFatPercentage) : null,
        bmi: newProgress.bmi ? parseFloat(newProgress.bmi) : null,
        waterIntake: newProgress.waterIntake ? parseFloat(newProgress.waterIntake) : 0,
        workoutAdherence: newProgress.workoutAdherence ? parseFloat(newProgress.workoutAdherence) : 0,
        notes: newProgress.notes || ''
      });

      if (response.data.success) {
        toast.success("Progress saved!");
        setShowAddProgressModal(false);
        setNewProgress({
          weight: '',
          bodyFatPercentage: '',
          bmi: '',
          waterIntake: '',
          workoutAdherence: '',
          notes: ''
        });
        fetchProgressForDate();
        fetchProgressData();
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
    }
  };

  const handleSearch = async () => {
    if (!foodQuery.trim()) {
      setSearchError('Please enter a food item to search');
      return;
    }

    setSearchError('');
    setIsSearching(true);

    try {
      const result = await fetchFoodData(foodQuery);
      if (result.error) {
        setSearchError(result.error || 'API configuration error. Please contact support.');
        setFoodData(null);
      } else if (!result || result.name === 'Food not found' || result.calories === 0) {
        setSearchError('No nutrition data found.');
        setFoodData(null);
      } else {
        setFoodData(result);
      }
    } catch (error) {
      console.error(error);
      setSearchError('Error fetching nutrition data.');
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
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.parsed.y}${
              context.dataset.label.includes('Weight')
                ? ' kg'
                : context.dataset.label.includes('Body Fat')
                ? '%'
                : ''
            }`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false }
      },
      x: { grid: { display: false } }
    }
  };

  return (
    <Layout>
      <h2 className="title">Progress Tracking</h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          margin: '10px 30px 10px 0',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() => navigate('/meal-logging')}
          style={{
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📝 Meal Logging
        </button>
        <button
          onClick={() => setShowAddProgressModal(true)}
          style={{
            backgroundColor: '#FFD700',
            color: '#1e1e2f',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          + Add Progress Entry
        </button>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🔍 Nutrition Search
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
        </div>

        <div className="chart-wrapper" style={{ height: '400px' }}>
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#FFD700'
              }}
            >
              Loading progress data...
            </div>
          ) : data.labels.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#ccc'
              }}
            >
              No progress data yet. Add your first entry to see your progress
              chart!
            </div>
          ) : (
            <Line data={data} options={chartOptions} />
          )}
        </div>

        {currentProgress && (
          <div
            style={{
              marginTop: '2rem',
              background: '#2a2a3b',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #3a3a4a'
            }}
          >
            <h3
              style={{ color: '#FFD700', marginBottom: '1rem' }}
            >
              Progress for {selectedDate.toLocaleDateString()}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem'
              }}
            >
              {currentProgress.weight && (
                <div>
                  <strong>Weight:</strong> {currentProgress.weight} kg
                </div>
              )}
              {currentProgress.bodyFatPercentage && (
                <div>
                  <strong>Body Fat:</strong>{' '}
                  {currentProgress.bodyFatPercentage}%
                </div>
              )}
              {currentProgress.bmi && (
                <div>
                  <strong>BMI:</strong> {currentProgress.bmi}
                </div>
              )}
              {currentProgress.waterIntake > 0 && (
                <div>
                  <strong>Water:</strong> {currentProgress.waterIntake} L
                </div>
              )}
              {currentProgress.workoutAdherence > 0 && (
                <div>
                  <strong>Workout Adherence:</strong>{' '}
                  {currentProgress.workoutAdherence}%
                </div>
              )}
            </div>
            {currentProgress.notes && (
              <p style={{ marginTop: '1rem', color: '#ccc' }}>
                {currentProgress.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {showAddProgressModal && (
  <div className="progress-modal-overlay">
    <div className="progress-modal">
      <div className="progress-modal-header">
        <h2>Add Progress Entry</h2>
        <button
          type="button"
          className="close-button"
          onClick={() => setShowAddProgressModal(false)}
        >
          ✕
        </button>
      </div>

      <form
        className="progress-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveProgress();
        }}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={newProgress.weight}
              onChange={(e) =>
                setNewProgress({
                  ...newProgress,
                  weight: e.target.value
                })
              }
              placeholder="e.g., 75.5"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Body Fat %</label>
            <input
              type="number"
              step="0.1"
              value={newProgress.bodyFatPercentage}
              onChange={(e) =>
                setNewProgress({
                  ...newProgress,
                  bodyFatPercentage: e.target.value
                })
              }
              placeholder="e.g., 15.5"
            />
          </div>
          <div className="form-group">
            <label>BMI</label>
            <input
              type="number"
              step="0.1"
              value={newProgress.bmi}
              onChange={(e) =>
                setNewProgress({
                  ...newProgress,
                  bmi: e.target.value
                })
              }
              placeholder="e.g., 22.5"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Water Intake (L)</label>
            <input
              type="number"
              step="0.1"
              value={newProgress.waterIntake}
              onChange={(e) =>
                setNewProgress({
                  ...newProgress,
                  waterIntake: e.target.value
                })
              }
              placeholder="e.g., 2.5"
            />
          </div>
          <div className="form-group">
            <label>Workout Adherence (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={newProgress.workoutAdherence}
              onChange={(e) =>
                setNewProgress({
                  ...newProgress,
                  workoutAdherence: e.target.value
                })
              }
              placeholder="e.g., 80"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            rows="3"
            value={newProgress.notes}
            onChange={(e) =>
              setNewProgress({
                ...newProgress,
                notes: e.target.value
              })
            }
            placeholder="Optional notes..."
          />
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowAddProgressModal(false)}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save Entry
          </button>
        </div>
      </form>
    </div>
  </div>
)}


      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              position: 'relative'
            }}
          >
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                fontSize: '22px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            <h3
              style={{
                textAlign: 'center',
                marginBottom: '20px'
              }}
            >
              🍎 Nutrition Tracker
            </h3>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px'
              }}
            >
              <input
                type="text"
                placeholder="Search for food"
                value={foodQuery}
                onChange={(e) => {
                  setFoodQuery(e.target.value);
                  setSearchError('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: searchError
                    ? '1px solid #dc3545'
                    : '1px solid #ccc'
                }}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                style={{
                  backgroundColor: isSearching ? '#6c757d' : '#28a745',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  cursor: isSearching ? 'not-allowed' : 'pointer'
                }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchError && (
              <div
                style={{
                  color: '#dc3545',
                  marginBottom: '15px'
                }}
              >
                {searchError}
              </div>
            )}

            {!isSearching && foodData && !searchError && (
              <div
                style={{
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}
              >
                <h4 style={{ marginBottom: '0.5rem' }}>
                  {foodData.name}
                </h4>
                <p>
                  <strong>Calories:</strong> {foodData.calories} kcal
                </p>
                {foodData.protein > 0 && (
                  <p>
                    <strong>Protein:</strong> {foodData.protein}g
                  </p>
                )}
                {foodData.carbs > 0 && (
                  <p>
                    <strong>Carbs:</strong> {foodData.carbs}g
                  </p>
                )}
                {foodData.fats > 0 && (
                  <p>
                    <strong>Fats:</strong> {foodData.fats}g
                  </p>
                )}
                {foodData.servingSize && (
                  <p>
                    <strong>Serving:</strong> {foodData.servingSize}{' '}
                    {foodData.servingSizeUnit}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProgressTracking;

