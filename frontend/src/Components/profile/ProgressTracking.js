// frontend/src/Components/profile/ProgressTracking.js
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import '../../css/ProgressTracking.css';
import { fetchFoodData } from '../../services/nutritionApi';
import { http } from '../../api/http';
import {
  FiInfo, FiChevronUp, FiChevronDown,
  FiBook, FiSearch, FiX,
} from 'react-icons/fi';
import { FaCalculator, FaApple } from 'react-icons/fa';
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

// ─── Shared dark-theme style tokens ───────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem'
  },
  modal: {
    background: '#1e1e2e', borderRadius: 16, padding: '2rem',
    width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto',
    position: 'relative', border: '1px solid #3a3a4a', color: '#eee'
  },
  label: { display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 4 },
  input: {
    width: '100%', background: '#2a2a3b', border: '1px solid #444',
    color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: '0.9rem',
    boxSizing: 'border-box'
  },
  infoBox: {
    background: '#252535', border: '1px solid #3a3a4a', borderRadius: 10,
    padding: '1rem', marginTop: 8, fontSize: '0.83rem', color: '#ccc', lineHeight: 1.6
  },
  calcBox: {
    background: '#1a1a2e', border: '1px solid #FFD70044', borderRadius: 10,
    padding: '1rem', marginTop: 8
  },
  calcInput: {
    background: '#2a2a3b', border: '1px solid #444', color: '#fff',
    padding: '6px 10px', borderRadius: 6, fontSize: '0.82rem', width: '100%', boxSizing: 'border-box'
  },
  calcResult: {
    background: '#FFD70022', border: '1px solid #FFD700', borderRadius: 8,
    padding: '8px 14px', color: '#FFD700', fontWeight: 'bold', fontSize: '0.9rem', marginTop: 8
  },
  useBtn: {
    background: '#28a745', color: '#fff', border: 'none', borderRadius: 6,
    padding: '5px 14px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', marginLeft: 8
  },
  badge: (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 12,
    fontSize: '0.72rem', fontWeight: 'bold', background: color + '22', color: color, marginLeft: 6
  }),
  sectionTitle: { color: '#FFD700', fontSize: '0.88rem', fontWeight: 'bold', marginBottom: 6, marginTop: 14 }
};

// ─── Collapsible info + calculator for a metric ───────────────────────────────
const MetricHelper = ({ metric, onUseValue }) => {
  const [open, setOpen] = useState(false);
  const [calc, setCalc] = useState({});
  const [result, setResult] = useState(null);

  const configs = {
    bodyFat: {
      label: 'Body Fat %',
      info: [
        'Body Fat % is the proportion of fat to your total body weight.',
        'Healthy ranges: Men 10–20% | Women 20–30%',
        'Above 25% (men) / 32% (women) is considered obese.',
        'Below 5% (men) / 13% (women) is essential-fat only — risky.',
      ],
      method: 'U.S. Navy Method',
      fields: [
        { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female'] },
        { key: 'height', label: 'Height (cm)', type: 'number', placeholder: 'e.g. 170' },
        { key: 'neck', label: 'Neck circumference (cm)', type: 'number', placeholder: 'e.g. 38' },
        { key: 'waist', label: 'Waist circumference (cm)', type: 'number', placeholder: 'e.g. 85' },
        { key: 'hip', label: 'Hip circumference (cm) — women only', type: 'number', placeholder: 'e.g. 95' },
      ],
      calculate: (v) => {
        const h = parseFloat(v.height), neck = parseFloat(v.neck), waist = parseFloat(v.waist), hip = parseFloat(v.hip);
        if (!h || !neck || !waist) return null;
        let bf;
        if (v.gender === 'male') {
          bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450;
        } else {
          if (!hip) return null;
          bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(h)) - 450;
        }
        return Math.max(0, Math.round(bf * 10) / 10);
      },
      unit: '%',
      ranges: [
        { label: 'Essential fat', color: '#5b9bd5', men: '2–5%', women: '10–13%' },
        { label: 'Athletes', color: '#28a745', men: '6–13%', women: '14–20%' },
        { label: 'Fitness', color: '#FFD700', men: '14–17%', women: '21–24%' },
        { label: 'Acceptable', color: '#ffa500', men: '18–24%', women: '25–31%' },
        { label: 'Obese', color: '#dc3545', men: '25%+', women: '32%+' },
      ]
    },
    bmi: {
      label: 'BMI',
      info: [
        'Body Mass Index (BMI) = weight (kg) ÷ height² (m²)',
        'It is a simple screening tool — not a direct body fat measure.',
        'Underweight: < 18.5 | Normal: 18.5–24.9 | Overweight: 25–29.9 | Obese: ≥ 30',
      ],
      method: 'Standard BMI Formula',
      fields: [
        { key: 'weight', label: 'Weight (kg)', type: 'number', placeholder: 'e.g. 70' },
        { key: 'height', label: 'Height (cm)', type: 'number', placeholder: 'e.g. 170' },
      ],
      calculate: (v) => {
        const w = parseFloat(v.weight), h = parseFloat(v.height) / 100;
        if (!w || !h) return null;
        return Math.round((w / (h * h)) * 10) / 10;
      },
      unit: '',
      ranges: [
        { label: 'Underweight', color: '#5b9bd5', range: '< 18.5' },
        { label: 'Normal', color: '#28a745', range: '18.5–24.9' },
        { label: 'Overweight', color: '#ffa500', range: '25–29.9' },
        { label: 'Obese', color: '#dc3545', range: '≥ 30' },
      ]
    },
    workoutAdherence: {
      label: 'Workout Adherence (%)',
      info: [
        'Workout Adherence = (workouts completed ÷ workouts planned) × 100',
        'Example: 4 workouts done out of 5 planned = 80% adherence.',
        '100% means you completed every planned session.',
        'Aim for ≥ 80% consistently for good fitness progress.',
      ],
      method: 'Adherence Calculator',
      fields: [
        { key: 'completed', label: 'Workouts completed this week', type: 'number', placeholder: 'e.g. 4' },
        { key: 'planned', label: 'Workouts planned this week', type: 'number', placeholder: 'e.g. 5' },
      ],
      calculate: (v) => {
        const c = parseFloat(v.completed), p = parseFloat(v.planned);
        if (!c || !p || p === 0) return null;
        return Math.min(100, Math.round((c / p) * 1000) / 10);
      },
      unit: '%',
      ranges: [
        { label: 'Excellent', color: '#28a745', range: '≥ 90%' },
        { label: 'Good', color: '#FFD700', range: '75–89%' },
        { label: 'Fair', color: '#ffa500', range: '50–74%' },
        { label: 'Needs improvement', color: '#dc3545', range: '< 50%' },
      ]
    }
  };

  const cfg = configs[metric];
  if (!cfg) return null;

  const handleCalc = () => {
    const r = cfg.calculate(calc);
    setResult(r);
  };

  const getRangeColor = (val) => {
    if (!val) return '#aaa';
    if (metric === 'bmi') {
      if (val < 18.5) return '#5b9bd5';
      if (val < 25) return '#28a745';
      if (val < 30) return '#ffa500';
      return '#dc3545';
    }
    if (metric === 'workoutAdherence') {
      if (val >= 90) return '#28a745';
      if (val >= 75) return '#FFD700';
      if (val >= 50) return '#ffa500';
      return '#dc3545';
    }
    return '#aaa';
  };

  return (
    <div style={{ marginTop: 4 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: '1px solid #444', borderRadius: 6,
          color: '#FFD700', fontSize: '0.75rem', cursor: 'pointer',
          padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4
        }}
      >
        {open ? <FiChevronUp size={14} style={{ marginRight: 6 }} /> : <FiInfo size={14} style={{ marginRight: 6 }} />}{open ? 'Hide' : 'What is this & How to calculate?'}
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          {/* Info section */}
          <div style={S.infoBox}>
            <div style={{ color: '#FFD700', fontWeight: 'bold', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><FiInfo size={14} /> About {cfg.label}</div>
            {cfg.info.map((line, i) => <div key={i} style={{ marginBottom: 3 }}>• {line}</div>)}

            {/* Range reference */}
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {cfg.ranges.map((r, i) => (
                <span key={i} style={S.badge(r.color)}>
                  {r.label}: {r.men ? `M: ${r.men} / F: ${r.women}` : r.range}
                </span>
              ))}
            </div>
          </div>

          {/* Calculator section */}
          <div style={S.calcBox}>
            <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '0.83rem', marginBottom: 10 }}>
              <FaCalculator size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />{cfg.method}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {cfg.fields.map(f => (
                <div key={f.key}>
                  <label style={{ ...S.label, fontSize: '0.78rem' }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select
                      value={calc[f.key] || 'male'}
                      onChange={e => setCalc(p => ({ ...p, [f.key]: e.target.value }))}
                      style={S.calcInput}
                    >
                      {f.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                    </select>
                  ) : (
                    <input
                      type="number"
                      placeholder={f.placeholder}
                      value={calc[f.key] || ''}
                      onChange={e => setCalc(p => ({ ...p, [f.key]: e.target.value }))}
                      style={S.calcInput}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={handleCalc}
                style={{ background: '#FFD700', color: '#1e1e2f', border: 'none', borderRadius: 6, padding: '7px 18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}>
                Calculate
              </button>
              {result !== null && (
                <button type="button" onClick={() => { onUseValue(result); setOpen(false); }} style={S.useBtn}>
                  Use this value
                </button>
              )}
            </div>
            {result !== null && (
              <div style={{ ...S.calcResult, borderColor: getRangeColor(result) + '88', background: getRangeColor(result) + '11', color: getRangeColor(result) }}>
                Result: <strong>{result}{cfg.unit}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Safe local-date helper ───────────────────────────────────────────────────
// toISOString() converts to UTC, so for UTC+ timezones (e.g. IST UTC+5:30)
// midnight local time = previous day in UTC → wrong date string.
// This helper reads local year/month/day directly — no timezone shift.
const localDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ─── Main ProgressTracking component ──────────────────────────────────────────
const ProgressTracking = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);           // Nutrition Search
  const [showAddModal, setShowAddModal] = useState(false);     // Add Progress Entry
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [foodQuery, setFoodQuery] = useState('');
  const [foodData, setFoodData] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newProgress, setNewProgress] = useState({
    weight: '', bodyFatPercentage: '', bmi: '',
    waterIntake: '', workoutAdherence: '', notes: ''
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      { label: 'Weight (kg)', data: [], borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 2, tension: 0.4, fill: true, pointBackgroundColor: '#FFD700', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6 },
      { label: 'Body Fat %', data: [], borderColor: '#007bff', backgroundColor: 'rgba(0,123,255,0.1)', borderWidth: 2, tension: 0.4, fill: true, pointBackgroundColor: '#007bff', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6 }
    ]
  });

  useEffect(() => { fetchProgressData(); }, []);
  useEffect(() => { fetchProgressForDate(); }, [selectedDate]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const res = await http.get('/progress/summary', { params: { days: 30 } });
      if (res.data.success) {
        const s = res.data.data;
        setProgressData(s);
        setChartData({
          labels: s.weight.map(w => new Date(w.date).toLocaleDateString()),
          datasets: [
            { label: 'Weight (kg)', data: s.weight.map(w => w.value), borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 2, tension: 0.4, fill: true, pointBackgroundColor: '#FFD700', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6 },
            { label: 'Body Fat %', data: s.bodyFat.map(b => b.value), borderColor: '#007bff', backgroundColor: 'rgba(0,123,255,0.1)', borderWidth: 2, tension: 0.4, fill: true, pointBackgroundColor: '#007bff', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6 }
          ]
        });
      }
    } catch (e) { console.error('Progress data error:', e); }
    finally { setLoading(false); }
  };

  const fetchProgressForDate = async () => {
    try {
      const dateStr = localDateStr(selectedDate);
      const res = await http.get('/progress', { params: { startDate: dateStr, endDate: dateStr } });
      setCurrentProgress(res.data.success && res.data.data.length > 0 ? res.data.data[0] : null);
    } catch (e) { setCurrentProgress(null); }
  };

  const handleSaveProgress = async () => {
    try {
      const dateStr = localDateStr(selectedDate);
      const res = await http.post('/progress', {
        date: dateStr,
        weight: newProgress.weight ? parseFloat(newProgress.weight) : null,
        bodyFatPercentage: newProgress.bodyFatPercentage ? parseFloat(newProgress.bodyFatPercentage) : null,
        bmi: newProgress.bmi ? parseFloat(newProgress.bmi) : null,
        waterIntake: newProgress.waterIntake ? parseFloat(newProgress.waterIntake) : 0,
        workoutAdherence: newProgress.workoutAdherence ? parseFloat(newProgress.workoutAdherence) : 0,
        notes: newProgress.notes || ''
      });
      if (res.data.success) {
        toast.success('Progress saved!');
        setShowAddModal(false);
        setNewProgress({ weight: '', bodyFatPercentage: '', bmi: '', waterIntake: '', workoutAdherence: '', notes: '' });
        fetchProgressForDate();
        fetchProgressData();
      }
    } catch (e) { toast.error('Failed to save progress'); }
  };

  const handleSearch = async () => {
    if (!foodQuery.trim()) { setSearchError('Please enter a food item to search'); return; }
    setSearchError(''); setIsSearching(true);
    try {
      const result = await fetchFoodData(foodQuery);
      if (result.error) { setSearchError(result.error || 'API error'); setFoodData(null); }
      else if (!result || result.calories === 0) { setSearchError('No nutrition data found.'); setFoodData(null); }
      else setFoodData(result);
    } catch (e) { setSearchError('Error fetching nutrition data.'); setFoodData(null); }
    finally { setIsSearching(false); }
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}${ctx.dataset.label.includes('Weight') ? ' kg' : ctx.dataset.label.includes('Body Fat') ? '%' : ''}` } }
    },
    scales: {
      y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false } },
      x: { grid: { display: false } }
    }
  };

  // ─── Field group for inputs ──────────────────────────────────────────────
  const Field = ({ label, field, type = 'number', step, placeholder, children }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>{label}</label>
      <input
        type={type} step={step} placeholder={placeholder}
        value={newProgress[field]}
        onChange={e => setNewProgress(p => ({ ...p, [field]: e.target.value }))}
        style={S.input}
      />
      {children}
    </div>
  );

  return (
    <div>
      <h2>Progress Tracking</h2>

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, margin: '10px 30px 10px 0', flexWrap: 'wrap' }}>
        <button onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: '#FFD700', color: '#1e1e2f', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
          + Add Progress Entry
        </button>
        <button onClick={() => setShowModal(true)}
          style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
          <FiSearch size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Nutrition Search
        </button>
      </div>

      {/* ── Main content ── */}
      <div className="progress-container">
        <div className="calendar-wrapper">
          <Calendar onChange={setSelectedDate} value={selectedDate} maxDate={new Date()} />
          <p>Selected Date: {selectedDate.toDateString()}</p>
        </div>
        <div className="chart-wrapper" style={{ height: 400 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#FFD700' }}>Loading progress data...</div>
          ) : chartData.labels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#ccc' }}>No progress data yet. Add your first entry!</div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>

        {currentProgress && (
          <div style={{ marginTop: '2rem', background: '#2a2a3b', padding: '1.5rem', borderRadius: 12, border: '1px solid #3a3a4a' }}>
            <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Progress for {selectedDate.toLocaleDateString()}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', color: '#eee' }}>
              {currentProgress.weight && <div><strong>Weight:</strong> {currentProgress.weight} kg</div>}
              {currentProgress.bodyFatPercentage && <div><strong>Body Fat:</strong> {currentProgress.bodyFatPercentage}%</div>}
              {currentProgress.bmi && <div><strong>BMI:</strong> {currentProgress.bmi}</div>}
              {currentProgress.waterIntake > 0 && <div><strong>Water:</strong> {currentProgress.waterIntake} L</div>}
              {currentProgress.workoutAdherence > 0 && <div><strong>Workout Adherence:</strong> {currentProgress.workoutAdherence}%</div>}
            </div>
            {currentProgress.notes && <p style={{ marginTop: '1rem', color: '#ccc' }}>{currentProgress.notes}</p>}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ADD PROGRESS ENTRY MODAL — dark theme + info + calculators
      ════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div style={S.overlay} onClick={() => setShowAddModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#FFD700', margin: 0, fontSize: '1.4rem' }}>Add Progress Entry</h2>
              <button onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>

            {/* ── Date (read-only) ── */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Date</label>
              <input type="date" value={localDateStr(selectedDate)} readOnly style={{ ...S.input, opacity: 0.7 }} />
            </div>

            {/* ── Weight ── */}
            <Field label="Weight (kg)" field="weight" step="0.1" placeholder="e.g. 75.5" />

            {/* ── Water Intake ── */}
            <Field label="Water Intake (L)" field="waterIntake" step="0.1" placeholder="e.g. 2.5" />

            {/* ── Body Fat % ── with info + calculator */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Body Fat %</label>
              <input type="number" step="0.1" placeholder="e.g. 18.5"
                value={newProgress.bodyFatPercentage}
                onChange={e => setNewProgress(p => ({ ...p, bodyFatPercentage: e.target.value }))}
                style={S.input} />
              <MetricHelper
                metric="bodyFat"
                onUseValue={v => setNewProgress(p => ({ ...p, bodyFatPercentage: String(v) }))}
              />
            </div>

            {/* ── BMI ── with info + calculator */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>BMI</label>
              <input type="number" step="0.1" placeholder="e.g. 22.5"
                value={newProgress.bmi}
                onChange={e => setNewProgress(p => ({ ...p, bmi: e.target.value }))}
                style={S.input} />
              <MetricHelper
                metric="bmi"
                onUseValue={v => setNewProgress(p => ({ ...p, bmi: String(v) }))}
              />
            </div>

            {/* ── Workout Adherence ── with info + calculator */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Workout Adherence (%)</label>
              <input type="number" min="0" max="100" placeholder="e.g. 80"
                value={newProgress.workoutAdherence}
                onChange={e => setNewProgress(p => ({ ...p, workoutAdherence: e.target.value }))}
                style={S.input} />
              <MetricHelper
                metric="workoutAdherence"
                onUseValue={v => setNewProgress(p => ({ ...p, workoutAdherence: String(v) }))}
              />
            </div>

            {/* ── Notes ── */}
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Notes (optional)</label>
              <textarea rows={3} placeholder="e.g. Felt strong today..."
                value={newProgress.notes}
                onChange={e => setNewProgress(p => ({ ...p, notes: e.target.value }))}
                style={{ ...S.input, resize: 'vertical' }} />
            </div>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAddModal(false)}
                style={{ background: '#444', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveProgress}
                style={{ background: '#FFD700', color: '#1e1e2f', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          NUTRITION SEARCH MODAL — fixed dark theme (white-on-white bug)
      ════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div style={S.overlay} onClick={() => { setShowModal(false); setFoodQuery(''); setFoodData(null); setSearchError(''); }}>
          <div style={{ ...S.modal, maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#FFD700', margin: 0 }}><FaApple size={16} style={{ marginRight: 7 }} />Nutrition Tracker</h3>
              <button onClick={() => { setShowModal(false); setFoodQuery(''); setFoodData(null); setSearchError(''); }}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input
                type="text" placeholder="Search for a food item..."
                value={foodQuery}
                onChange={e => { setFoodQuery(e.target.value); setSearchError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ ...S.input, flex: 1 }}
              />
              <button onClick={handleSearch} disabled={isSearching}
                style={{ background: isSearching ? '#555' : '#28a745', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: isSearching ? 'not-allowed' : 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                {isSearching ? '...' : 'Search'}
              </button>
            </div>

            {searchError && (
              <div style={{ color: '#ff6b6b', marginBottom: 12, fontSize: '0.88rem' }}>{searchError}</div>
            )}

            {!isSearching && foodData && !searchError && (
              <div style={{ background: '#2a2a3b', border: '1px solid #3a3a4a', borderRadius: 10, padding: '1rem' }}>
                <h4 style={{ color: '#FFD700', marginBottom: '0.75rem' }}>{foodData.name}</h4>
                {[
                  ['Calories', `${foodData.calories} kcal`, !!foodData.calories],
                  ['Protein', `${foodData.protein}g`, foodData.protein > 0],
                  ['Carbohydrates', `${foodData.carbs}g`, foodData.carbs > 0],
                  ['Fats', `${foodData.fats}g`, foodData.fats > 0],
                  ['Serving Size', `${foodData.servingSize} ${foodData.servingSizeUnit}`, !!foodData.servingSize],
                ].filter(([, , show]) => show).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #3a3a4a', color: '#eee', fontSize: '0.9rem' }}>
                    <span style={{ color: '#aaa' }}>{label}:</span>
                    <span style={{ fontWeight: 'bold' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && !foodData && !searchError && (
              <p style={{ color: '#888', textAlign: 'center', marginTop: '1rem', fontSize: '0.88rem' }}>
                Type a food name (e.g. "banana", "grilled chicken") and press Search.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracking;