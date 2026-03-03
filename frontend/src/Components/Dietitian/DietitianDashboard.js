// frontend/src/Components/Dietitian/DietitianDashboard.js
import React, { useState, useEffect } from "react";
import { http } from "../../api/http";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/DietitianDashboard.css";
import {
  FiCheckCircle, FiAlertTriangle, FiXCircle,
  FiEdit2, FiTrash2, FiUserPlus, FiChevronDown, FiChevronUp,
  FiThumbsUp, FiThumbsDown, FiMinus,
  FiZap, FiPlusCircle, FiMessageSquare, FiCheckSquare, FiSquare,
  FiUser, FiX, FiCheck, FiBarChart2
} from "react-icons/fi";

// ─── helpers ─────────────────────────────────────────────────────────────────
// NOTE: localStorage "user" is unreliable — the login flow in this project
// stores { displayName, email } (no _id) while /auth/me stores the full object.
// We fetch /auth/me on mount to always get the correct _id.
const getStoredUserId = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    // Accept either _id or id field
    return u?._id || u?.id || null;
  } catch { return null; }
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const statusColors = {
  ok: { bg: "#28a74520", border: "#28a745", text: "#28a745", icon: "ok" },
  warning: { bg: "#ffc10720", border: "#ffc107", text: "#ffc107", icon: "warning" },
  needs_attention: { bg: "#dc354520", border: "#dc3545", text: "#dc3545", icon: "attention" },
};

// ─── shared dark-theme token ──────────────────────────────────────────────────
const T = {
  card: { background: "#252535", border: "1px solid #33334a", borderRadius: 14 },
  input: { background: "#1e1e2f", border: "1px solid #3a3a4a", color: "#eee", padding: "9px 13px", borderRadius: 8, width: "100%", boxSizing: "border-box", fontSize: "0.9rem" },
  label: { color: "#aaa", fontSize: "0.8rem", display: "block", marginBottom: 5 },
  btnGold: { background: "#FFD700", color: "#1e1e2f", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" },
  btnGray: { background: "#3a3a4a", color: "#eee", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" },
  btnRed: { background: "#dc354520", color: "#dc3545", border: "1px solid #dc354540", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" },
};

// ─── Overlay Modal shell ──────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
    onClick={onClose}>
    <div style={{ ...T.card, background: "#1a1a2e", padding: "2rem", width: "100%", maxWidth: wide ? 700 : 480, maxHeight: "90vh", overflowY: "auto" }}
      onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h3 style={{ color: "#FFD700", margin: 0 }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: "1.6rem", cursor: "pointer", lineHeight: 1 }}><FiX size={20} /></button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Diet Plan Card — collapsed by default, expandable ───────────────────────
const DietPlanCard = ({ plan, currentUserId, onEdit, onDelete, onAssign }) => {
  const [expanded, setExpanded] = useState(false);

  // The plan.trainer field is populated: { _id, name, email, role }
  const isOwner = plan.trainer?._id?.toString() === currentUserId?.toString()
    || plan.trainer?.toString() === currentUserId?.toString(); // fallback if not populated

  const totalItems = plan.meals?.reduce((acc, m) => acc + (m.items?.length || 0), 0) || 0;
  const mealCount = plan.meals?.length || 0;

  return (
    <div style={{ ...T.card, overflow: "hidden", transition: "box-shadow 0.2s" }}>
      {/* ── Collapsed header ── */}
      <div style={{ padding: "1.1rem 1.4rem", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        onClick={() => setExpanded(p => !p)}>

        {/* Category badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ background: "#FFD70022", color: "#FFD700", border: "1px solid #FFD70044", borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em" }}>
              {plan.category}
            </span>
            {isOwner && (
              <span style={{ background: "#28a74518", color: "#28a745", border: "1px solid #28a74540", borderRadius: 6, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <FiEdit2 size={11} /> Yours
              </span>
            )}
          </div>
          <div style={{ color: "#888", fontSize: "0.78rem", marginTop: 5 }}>
            {mealCount} meal{mealCount !== 1 ? "s" : ""} · {totalItems} item{totalItems !== 1 ? "s" : ""} · Created {fmtDate(plan.createdAt)}
            {plan.trainer?.name && (
              <span style={{ marginLeft: 8, color: "#666" }}>by {plan.trainer.name}</span>
            )}
          </div>
        </div>

        {/* Quick actions (always visible) */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button style={{ ...T.btnGray, padding: "6px 14px", fontSize: "0.78rem" }} onClick={() => onAssign(plan)}>
            Assign
          </button>
          {isOwner && (
            <>
              <button style={{ ...T.btnGold, padding: "6px 14px", fontSize: "0.78rem" }} onClick={() => onEdit(plan)}>
                Edit
              </button>
              <button style={{ ...T.btnRed, padding: "6px 14px", fontSize: "0.78rem" }} onClick={() => onDelete(plan._id)}>
                Delete
              </button>
            </>
          )}
          <span style={{ color: "#555", fontSize: "1.1rem", userSelect: "none" }}>
            {expanded ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
          </span>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div style={{ padding: "0 1.4rem 1.4rem", borderTop: "1px solid #33334a" }}>
          <div style={{ paddingTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {plan.meals?.map((meal, i) => (
              <div key={i} style={{ background: "#1e1e2f", borderRadius: 10, padding: "0.9rem", border: "1px solid #2a2a3a" }}>
                <div style={{ color: "#FFD700", fontWeight: 700, fontSize: "0.82rem", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {meal.timeOfDay}
                </div>
                {meal.items?.map((item, j) => (
                  <div key={j} style={{ color: "#ccc", fontSize: "0.85rem", padding: "3px 0", borderBottom: j < meal.items.length - 1 ? "1px solid #2a2a3a" : "none", display: "flex", alignItems: "center", gap: 6 }}>
                    <FiCheckSquare size={11} style={{ color: "#FFD70080", flexShrink: 0 }} /> {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Meal Log Card — rich but compact ────────────────────────────────────────
const MealLogCard = ({ log, onFeedback }) => {
  const [expanded, setExpanded] = useState(false);
  const hasFeedback = !!log.feedback?.rating;

  const ratingColors = { good: "#28a745", average: "#ffc107", poor: "#dc3545" };
  const RatingIcon = ({ r, size = 13 }) => r === "good" ? <FiThumbsUp size={size} /> : r === "poor" ? <FiThumbsDown size={size} /> : <FiMinus size={size} />;

  return (
    <div style={{ ...T.card, overflow: "hidden" }}>
      {/* ── Header row ── */}
      <div style={{ padding: "1rem 1.4rem", display: "flex", alignItems: "center", gap: 14 }}>
        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FFD70022", border: "2px solid #FFD70044", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD700", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>
          {(log.user?.name || "?")[0].toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{log.user?.name || "Unknown"}</span>
            <span style={{ color: "#888", fontSize: "0.8rem" }}>·</span>
            <span style={{ color: "#aaa", fontSize: "0.82rem" }}>{fmtDate(log.date)}</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ color: "#FFD700", fontSize: "0.8rem", fontWeight: 600 }}>
              <FiZap size={13} style={{ marginRight: 4, verticalAlign: "middle", color: "#FFD700" }} />{log.totalCalories || 0} kcal
            </span>
            {log.totalMacros && (
              <>
                <span style={{ color: "#5b9bd5", fontSize: "0.78rem" }}>P: {log.totalMacros.protein || 0}g</span>
                <span style={{ color: "#f0a500", fontSize: "0.78rem" }}>C: {log.totalMacros.carbs || 0}g</span>
                <span style={{ color: "#e07c5a", fontSize: "0.78rem" }}>F: {log.totalMacros.fats || 0}g</span>
              </>
            )}
            <span style={{ color: "#666", fontSize: "0.78rem" }}>{log.meals?.length || 0} meals</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {hasFeedback ? (
            <span style={{ background: ratingColors[log.feedback.rating] + "20", color: ratingColors[log.feedback.rating], border: `1px solid ${ratingColors[log.feedback.rating]}40`, borderRadius: 6, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>
              <RatingIcon r={log.feedback.rating} /> {log.feedback.rating}
            </span>
          ) : (
            <button style={{ ...T.btnGold, padding: "6px 14px", fontSize: "0.78rem" }} onClick={() => onFeedback(log._id)}>
              + Feedback
            </button>
          )}
          <button style={{ background: "none", border: "1px solid #33334a", color: "#888", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: "0.8rem" }}
            onClick={() => setExpanded(p => !p)}>
            {expanded ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* ── Expanded meals ── */}
      {expanded && (
        <div style={{ padding: "0 1.4rem 1.2rem", borderTop: "1px solid #2a2a3a" }}>
          <div style={{ paddingTop: "0.9rem", display: "flex", flexDirection: "column", gap: 6 }}>
            {log.meals?.map((meal, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto auto", gap: 10, alignItems: "center", background: "#1e1e2f", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ color: "#FFD700", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{meal.timeOfDay}</span>
                <span style={{ color: "#ddd", fontSize: "0.88rem" }}>{meal.name}</span>
                <span style={{ color: "#888", fontSize: "0.8rem" }}>{meal.calories || 0} cal</span>
                {meal.isFromPlan && <span style={{ background: "#28a74518", color: "#28a745", border: "1px solid #28a74540", borderRadius: 4, padding: "2px 7px", fontSize: "0.7rem" }}>Plan</span>}
              </div>
            ))}
          </div>

          {/* Feedback display */}
          {hasFeedback && (
            <div style={{ marginTop: "1rem", background: "#1e1e2f", border: "1px solid #33334a", borderRadius: 10, padding: "0.9rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ color: ratingColors[log.feedback.rating], fontWeight: 700, fontSize: "0.85rem" }}>
                  <RatingIcon r={log.feedback.rating} size={14} /> {log.feedback.rating.toUpperCase()}
                </span>
                <span style={{ color: "#555", fontSize: "0.75rem" }}>· {fmtDate(log.feedback.givenAt)}</span>
              </div>
              {log.feedback.notes && <p style={{ color: "#aaa", fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>{log.feedback.notes}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Diet Plan editor modal (create / edit) ───────────────────────────────────
const DietPlanModal = ({ title, plan, setPlan, onSave, onClose }) => {
  const updateItem = (mi, ii, val) => {
    const m = plan.meals.map((meal, i) => i !== mi ? meal : { ...meal, items: meal.items.map((it, j) => j !== ii ? it : val) });
    setPlan({ ...plan, meals: m });
  };
  const addItem = (mi) => {
    const m = plan.meals.map((meal, i) => i !== mi ? meal : { ...meal, items: [...meal.items, ""] });
    setPlan({ ...plan, meals: m });
  };
  const removeItem = (mi, ii) => {
    const m = plan.meals.map((meal, i) => i !== mi ? meal : { ...meal, items: meal.items.filter((_, j) => j !== ii) });
    setPlan({ ...plan, meals: m });
  };

  return (
    <Modal title={title} onClose={onClose} wide>
      <div style={{ marginBottom: 16 }}>
        <label style={T.label}>Category *</label>
        <input style={T.input} value={plan.category} placeholder="e.g. Weight Loss, Muscle Gain…"
          onChange={e => setPlan({ ...plan, category: e.target.value })} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
        {plan.meals.map((meal, mi) => (
          <div key={mi} style={{ background: "#252535", border: "1px solid #33334a", borderRadius: 10, padding: "1rem" }}>
            <div style={{ color: "#FFD700", fontWeight: 700, fontSize: "0.85rem", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {meal.timeOfDay}
            </div>
            {meal.items.map((item, ii) => (
              <div key={ii} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input style={{ ...T.input }} value={item} placeholder={`Item ${ii + 1}`}
                  onChange={e => updateItem(mi, ii, e.target.value)} />
                {meal.items.length > 1 && (
                  <button style={{ ...T.btnRed, padding: "6px 12px", flexShrink: 0 }} onClick={() => removeItem(mi, ii)}><FiX size={14} /></button >
                )}
              </div>
            ))}
            <button style={{ ...T.btnGray, fontSize: "0.78rem", padding: "5px 12px" }} onClick={() => addItem(mi)}>+ Add Item</button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button style={T.btnGray} onClick={onClose}>Cancel</button>
        <button style={T.btnGold} onClick={onSave}>Save Plan</button>
      </div>
    </Modal>
  );
};

// ─── Do's & Don'ts editor ────────────────────────────────────────────────────
const DosDontsEditor = ({ memberId, dosDonts, onUpdate }) => {
  const [dos, setDos] = useState(dosDonts.dos || []);
  const [donts, setDonts] = useState(dosDonts.donts || []);
  const [notes, setNotes] = useState(dosDonts.notes || "");
  const [newDo, setNewDo] = useState("");
  const [newDont, setNewDont] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Do's */}
      <div>
        <label style={{ ...T.label, color: "#28a745", fontWeight: 700, fontSize: "0.85rem" }}><FiCheck size={14} style={{ marginRight: 5, verticalAlign: "middle" }} />Do's</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input style={T.input} value={newDo} placeholder="Add a Do…" onChange={e => setNewDo(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && newDo.trim()) { setDos([...dos, newDo.trim()]); setNewDo(""); } }} />
          <button style={{ ...T.btnGold, flexShrink: 0 }} onClick={() => { if (newDo.trim()) { setDos([...dos, newDo.trim()]); setNewDo(""); } }}>Add</button>
        </div>
        {dos.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#28a74510", border: "1px solid #28a74530", borderRadius: 8, padding: "7px 12px", marginBottom: 6 }}>
            <span style={{ color: "#ccc", fontSize: "0.88rem" }}><FiCheck size={12} style={{ marginRight: 6, color: "#28a745" }} />{item}</span>
            <button style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "1rem" }} onClick={() => setDos(dos.filter((_, j) => j !== i))}><FiX size={14} /></button>
          </div>
        ))}
      </div>

      {/* Don'ts */}
      <div>
        <label style={{ ...T.label, color: "#dc3545", fontWeight: 700, fontSize: "0.85rem" }}><FiX size={14} style={{ marginRight: 5, verticalAlign: "middle" }} />Don'ts</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input style={T.input} value={newDont} placeholder="Add a Don't…" onChange={e => setNewDont(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && newDont.trim()) { setDonts([...donts, newDont.trim()]); setNewDont(""); } }} />
          <button style={{ ...T.btnGold, flexShrink: 0 }} onClick={() => { if (newDont.trim()) { setDonts([...donts, newDont.trim()]); setNewDont(""); } }}>Add</button>
        </div>
        {donts.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#dc354510", border: "1px solid #dc354530", borderRadius: 8, padding: "7px 12px", marginBottom: 6 }}>
            <span style={{ color: "#ccc", fontSize: "0.88rem" }}><FiX size={12} style={{ marginRight: 6, color: "#dc3545" }} />{item}</span>
            <button style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "1rem" }} onClick={() => setDonts(donts.filter((_, j) => j !== i))}><FiX size={14} /></button>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label style={T.label}>Notes</label>
        <textarea rows={3} style={{ ...T.input, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes…" />
      </div>

      <button style={{ ...T.btnGold, alignSelf: "flex-end" }} onClick={() => onUpdate(memberId, dos, donts, notes)}>
        Save Do's & Don'ts
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main DietitianDashboard
// ═══════════════════════════════════════════════════════════════════════════════
const DietitianDashboard = () => {
  // currentUserId: fetched from /auth/me on mount for reliability
  // Falls back to localStorage until the fetch completes
  const [currentUserId, setCurrentUserId] = useState(getStoredUserId);

  const [activeTab, setActiveTab] = useState("overview");
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberSummary, setMemberSummary] = useState(null);
  const [mealLogs, setMealLogs] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [dosDonts, setDosDonts] = useState(null);
  const [selectedMemberForDosDonts, setSelectedMemberForDosDonts] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // modals
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMealLog, setSelectedMealLog] = useState(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [assigningPlan, setAssigningPlan] = useState(null);
  const [assignMemberId, setAssignMemberId] = useState("");

  // Diet plan search/filter
  const [planFilter, setPlanFilter] = useState("all"); // "all" | "mine"
  const [planSearch, setPlanSearch] = useState("");

  // ── Fetch logged-in user ID reliably from /auth/me ──────────────────────────
  useEffect(() => {
    http.get("/auth/me")
      .then(r => {
        const id = r.data?._id || r.data?.id;
        if (id) setCurrentUserId(id);
      })
      .catch(() => { }); // silently ignore — localStorage fallback still works
  }, []);

  const [newPlan, setNewPlan] = useState({
    category: "",
    meals: [
      { timeOfDay: "Breakfast", items: [""] },
      { timeOfDay: "Lunch", items: [""] },
      { timeOfDay: "Dinner", items: [""] },
      { timeOfDay: "Snack", items: [""] },
    ]
  });

  // ── data fetchers ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (["overview", "assigned-users", "reports"].includes(activeTab)) fetchAssignedMembers();
    if (activeTab === "meal-logs") fetchMealLogs();
    if (activeTab === "diet-plans") fetchDietPlans();
    if (activeTab === "announcements") fetchAnnouncements();
  }, [activeTab]);

  const fetchAssignedMembers = async () => {
    try {
      setLoading(true);
      const r = await http.get("/dietitian/assigned-members");
      if (r.data.success) setAssignedMembers(r.data.data);
    } catch (e) { toast.error("Failed to load assigned members"); }
    finally { setLoading(false); }
  };

  const fetchMemberSummary = async (memberId) => {
    try {
      setLoading(true);
      const r = await http.get(`/dietitian/member/${memberId}/summary`);
      if (r.data.success) { setMemberSummary(r.data.data); setSelectedMember(memberId); }
    } catch (e) { toast.error("Failed to load member summary"); }
    finally { setLoading(false); }
  };

  const fetchMealLogs = async (memberId = null) => {
    try {
      setLoading(true);
      const r = await http.get("/dietitian/meal-logs", { params: memberId ? { memberId } : {} });
      if (r.data.success) setMealLogs(r.data.data);
    } catch (e) { toast.error("Failed to load meal logs"); }
    finally { setLoading(false); }
  };

  const fetchDietPlans = async () => {
    try {
      setLoading(true);
      const r = await http.get("/dietitian/diet-plans");
      if (r.data.success) setDietPlans(r.data.data || []);
    } catch (e) { toast.error("Failed to load diet plans"); }
    finally { setLoading(false); }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const r = await http.get("/announcements/all-announcements", { params: { role: "RD" } });
      if (r.data.success) setAnnouncements(r.data.data || []);
      else if (Array.isArray(r.data)) setAnnouncements(r.data.filter(a => a.active));
      else setAnnouncements([]);
    } catch (e) { setAnnouncements([]); }
    finally { setLoading(false); }
  };

  const fetchDosDonts = async (memberId) => {
    try {
      const r = await http.get(`/dos-donts/${memberId}`);
      if (r.data.success) { setDosDonts(r.data.data); setSelectedMemberForDosDonts(memberId); }
    } catch { setDosDonts({ dos: [], donts: [], notes: "" }); }
  };

  // ── actions ────────────────────────────────────────────────────────────────
  const handleUpdateDosDonts = async (memberId, dos, donts, notes) => {
    try {
      const r = await http.put(`/dos-donts/${memberId}`, { dos, donts, notes });
      if (r.data.success) { toast.success("Do's & Don'ts updated!"); fetchDosDonts(memberId); }
    } catch { toast.error("Failed to update"); }
  };

  const handleGenerateReport = async (memberId) => {
    try {
      setLoading(true);
      const r = await http.get(`/dietitian/report/${memberId}`);
      if (r.data.success) { setReportData(r.data.data); setSelectedMemberForDosDonts(memberId); }
    } catch { toast.error("Failed to generate report"); }
    finally { setLoading(false); }
  };

  const handleAddFeedback = async () => {
    if (!selectedRating || !selectedMealLog) { toast.error("Please select a rating"); return; }
    try {
      const r = await http.post(`/dietitian/meal-logs/${selectedMealLog}/feedback`, { rating: selectedRating, notes: feedbackNotes });
      if (r.data.success) {
        toast.success("Feedback added!");
        setShowFeedbackModal(false); setSelectedMealLog(null); setFeedbackNotes(""); setSelectedRating("");
        fetchMealLogs(selectedMember);
      }
    } catch { toast.error("Failed to add feedback"); }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.category.trim()) { toast.error("Please enter a category"); return; }
    const validMeals = newPlan.meals.map(m => ({ ...m, items: m.items.filter(i => i.trim()) })).filter(m => m.items.length > 0);
    if (!validMeals.length) { toast.error("Add at least one meal item"); return; }
    try {
      const r = await http.post("/dietitian/diet-plans", { category: newPlan.category, meals: validMeals });
      if (r.data.success) {
        toast.success("Diet plan created!");
        setShowCreatePlanModal(false);
        setNewPlan({ category: "", meals: [{ timeOfDay: "Breakfast", items: [""] }, { timeOfDay: "Lunch", items: [""] }, { timeOfDay: "Dinner", items: [""] }, { timeOfDay: "Snack", items: [""] }] });
        fetchDietPlans();
      } else toast.error(r.data.message || "Failed");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to create plan"); }
  };

  const handleEditPlan = async () => {
    if (!editingPlan?.category?.trim()) { toast.error("Please enter a category"); return; }
    const validMeals = editingPlan.meals.map(m => ({ ...m, items: m.items.filter(i => i.trim()) })).filter(m => m.items.length > 0);
    if (!validMeals.length) { toast.error("Add at least one meal item"); return; }
    try {
      const r = await http.put(`/dietitian/diet-plans/${editingPlan._id}`, { category: editingPlan.category, meals: validMeals });
      if (r.data.success) { toast.success("Plan updated!"); setShowEditPlanModal(false); setEditingPlan(null); fetchDietPlans(); }
      else toast.error(r.data.message || "Failed");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to update plan"); }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Delete this diet plan?")) return;
    try {
      const r = await http.delete(`/dietitian/diet-plans/${planId}`);
      if (r.data.success) { toast.success("Plan deleted!"); fetchDietPlans(); }
      else toast.error(r.data.message || "Failed");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to delete plan"); }
  };

  const handleAssignPlan = async () => {
    if (!assignMemberId || !assigningPlan) { toast.error("Please select a member"); return; }
    try {
      const r = await http.post("/dietitian/assign-diet-plan", { memberId: assignMemberId, dietPlanId: assigningPlan._id });
      if (r.data.success) { toast.success("Plan assigned!"); setShowAssignPlanModal(false); setAssigningPlan(null); setAssignMemberId(""); fetchAssignedMembers(); }
      else toast.error(r.data.message || "Failed");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to assign plan"); }
  };

  // ── Filtered diet plans ────────────────────────────────────────────────────
  const filteredPlans = dietPlans.filter(p => {
    const matchesOwner = planFilter === "all" ||
      (planFilter === "mine" && (p.trainer?._id?.toString() === currentUserId?.toString() || p.trainer?.toString() === currentUserId?.toString()));
    const matchesSearch = !planSearch.trim() || p.category.toLowerCase().includes(planSearch.toLowerCase());
    return matchesOwner && matchesSearch;
  });

  const myPlanCount = dietPlans.filter(p =>
    p.trainer?._id?.toString() === currentUserId?.toString() || p.trainer?.toString() === currentUserId?.toString()
  ).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dietitian-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Dietitian Dashboard</h1>
        <p>Manage your assigned members and nutrition plans</p>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        {[
          ["overview", "Overview"],
          ["assigned-users", "Assigned Users"],
          ["diet-plans", "Diet Plans"],
          ["meal-logs", "Meal Logs Review"],
          ["reports", "Reports & Do's/Don'ts"],
          ["announcements", "Announcements"],
        ].map(([id, label]) => (
          <button key={id} className={activeTab === id ? "active" : ""}
            onClick={() => { setActiveTab(id); if (id === "meal-logs") fetchMealLogs(); if (id === "announcements") fetchAnnouncements(); }}>
            {label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="stats-grid">
              {[
                { val: assignedMembers.length, label: "Assigned Members" },
                { val: assignedMembers.filter(m => m.status === "ok").length, label: "On Track" },
                { val: assignedMembers.filter(m => m.status === "needs_attention").length, label: "Needs Attention" },
                { val: myPlanCount, label: "My Diet Plans" },
              ].map((s, i) => (
                <div key={i} className="stat-card clickable"
                  onClick={() => { fetchAssignedMembers(); setActiveTab("assigned-users"); }}>
                  <h3>{s.val}</h3>
                  <p>{s.label}</p>
                </div>
              ))}
            </div>
            <p style={{ color: "#888", marginTop: 20, fontSize: "0.9rem" }}>
              Click any card to drill into details, or use the tabs above.
            </p>
          </div>
        )}

        {/* ══ ASSIGNED USERS ════════════════════════════════════════════════ */}
        {activeTab === "assigned-users" && (
          <div className="assigned-users-tab">
            {loading ? <div className="loading">Loading…</div> :
              assignedMembers.length === 0 ? <div className="empty-state"><p>No assigned members yet.</p></div> : (
                <>
                  <div className="members-list">
                    {assignedMembers.map(member => {
                      const sc = statusColors[member.status] || statusColors.ok;
                      return (
                        <div key={member._id}
                          className={`member-card ${selectedMember === member._id ? "selected" : ""}`}
                          onClick={() => fetchMemberSummary(member._id)}>
                          <div className="member-info">
                            <h4>{member.name}</h4>
                            <p>{member.email}</p>
                            <div className="member-stats">
                              <span>Adherence: {member.adherence || 0}%</span>
                              <span className={`status ${member.status}`} style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 6, padding: "3px 10px" }}>
                                {sc.icon === "ok" ? <FiCheckCircle size={13} style={{ marginRight: 4, verticalAlign: "middle" }} /> : sc.icon === "warning" ? <FiAlertTriangle size={13} style={{ marginRight: 4, verticalAlign: "middle" }} /> : <FiXCircle size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />}{sc.icon === "ok" ? "On Track" : sc.icon === "warning" ? "Warning" : "Attention"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {memberSummary && (
                    <div className="member-detail">
                      <h3>{memberSummary.member?.name} – Summary</h3>
                      <div className="summary-sections">
                        <div className="section">
                          <h4>Current Diet Plan</h4>
                          <p>{memberSummary.dietPlan?.category || "No diet plan assigned"}</p>
                        </div>
                        <div className="section">
                          <h4>Weight Trend</h4>
                          {memberSummary.progress?.length > 0 ? (
                            <p>Latest: {memberSummary.progress.at(-1).weight} kg · First: {memberSummary.progress[0].weight} kg</p>
                          ) : <p>No progress data</p>}
                        </div>
                        <div className="section">
                          <h4>Recent Meal Logs</h4>
                          {memberSummary.mealLogs?.length > 0
                            ? memberSummary.mealLogs.slice(0, 5).map(log => (
                              <div key={log._id} className="meal-log-item">
                                <p>{fmtDate(log.date)} · {log.meals?.length || 0} meals · {log.totalCalories || 0} cal</p>
                              </div>
                            ))
                            : <p>No meal logs yet</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
          </div>
        )}

        {/* ══ DIET PLANS ════════════════════════════════════════════════════ */}
        {activeTab === "diet-plans" && (
          <div className="diet-plans-tab">
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ color: "#FFD700", margin: 0 }}>Diet Plans</h2>
                <span style={{ color: "#888", fontSize: "0.82rem" }}>{filteredPlans.length} of {dietPlans.length} shown · {myPlanCount} created by you</span>
              </div>
              <button style={T.btnGold} onClick={() => setShowCreatePlanModal(true)}>+ Create New Plan</button>
            </div>

            {/* Filter + search bar */}
            <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 0, border: "1px solid #33334a", borderRadius: 8, overflow: "hidden" }}>
                {[["all", "All Plans"], ["mine", "My Plans"]].map(([id, label]) => (
                  <button key={id} onClick={() => setPlanFilter(id)}
                    style={{ background: planFilter === id ? "#FFD700" : "#252535", color: planFilter === id ? "#1e1e2f" : "#aaa", border: "none", padding: "7px 18px", cursor: "pointer", fontWeight: planFilter === id ? 700 : 400, fontSize: "0.85rem", transition: "all 0.15s" }}>
                    {label}
                  </button>
                ))}
              </div>
              <input
                style={{ ...T.input, maxWidth: 280, flex: 1 }}
                placeholder="Search by category…"
                value={planSearch}
                onChange={e => setPlanSearch(e.target.value)}
              />
            </div>

            {/* Plan list */}
            {loading ? <div className="loading">Loading…</div> :
              filteredPlans.length === 0 ? <div className="empty-state"><p>No plans found.</p></div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredPlans.map(plan => (
                    <DietPlanCard
                      key={plan._id}
                      plan={plan}
                      currentUserId={currentUserId}
                      onEdit={(p) => { setEditingPlan({ ...p, meals: p.meals?.length ? p.meals : [{ timeOfDay: "Breakfast", items: [""] }] }); setShowEditPlanModal(true); }}
                      onDelete={handleDeletePlan}
                      onAssign={(p) => { setAssigningPlan(p); setAssignMemberId(""); setShowAssignPlanModal(true); }}
                    />
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ══ MEAL LOGS REVIEW ══════════════════════════════════════════════ */}
        {activeTab === "meal-logs" && (
          <div className="meal-logs-tab">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ color: "#FFD700", margin: 0 }}>Meal Logs Review</h2>
                <span style={{ color: "#888", fontSize: "0.82rem" }}>{mealLogs.length} log{mealLogs.length !== 1 ? "s" : ""} found</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ ...T.label, margin: 0, whiteSpace: "nowrap" }}>Filter member:</label>
                <select
                  style={{ ...T.input, width: "auto", minWidth: 180 }}
                  onChange={e => { const id = e.target.value; fetchMealLogs(id || null); setSelectedMember(id || null); }}>
                  <option value="">All Assigned Members</option>
                  {assignedMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            {/* Stats strip */}
            {mealLogs.length > 0 && (() => {
              const withFeedback = mealLogs.filter(l => l.feedback?.rating).length;
              const avgCal = Math.round(mealLogs.reduce((acc, l) => acc + (l.totalCalories || 0), 0) / mealLogs.length);
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
                  {[
                    { label: "Total Logs", val: mealLogs.length, color: "#FFD700" },
                    { label: "Feedback Given", val: withFeedback, color: "#28a745" },
                    { label: "Pending Feedback", val: mealLogs.length - withFeedback, color: "#ffc107" },
                    { label: "Avg Calories", val: `${avgCal} kcal`, color: "#5b9bd5" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#252535", border: "1px solid #33334a", borderRadius: 10, padding: "0.9rem 1.1rem", textAlign: "center" }}>
                      <div style={{ color: s.color, fontWeight: 700, fontSize: "1.4rem" }}>{s.val}</div>
                      <div style={{ color: "#888", fontSize: "0.75rem", marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {loading ? <div className="loading">Loading…</div> :
              mealLogs.length === 0 ? <div className="empty-state"><p>No meal logs found.</p></div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {mealLogs.map(log => (
                    <MealLogCard
                      key={log._id}
                      log={log}
                      onFeedback={(id) => { setSelectedMealLog(id); setShowFeedbackModal(true); }}
                    />
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ══ REPORTS & DOS/DONTS ═══════════════════════════════════════════ */}
        {activeTab === "reports" && (
          <div className="reports-tab">
            <div className="reports-header"><h2>Reports & Do's/Don'ts</h2></div>
            <div className="reports-content">
              <div className="reports-section">
                <h3>Generate Member Report</h3>
                <select style={{ ...T.input, marginBottom: 16 }} onChange={e => { if (e.target.value) handleGenerateReport(e.target.value); }}>
                  <option value="">Select Member</option>
                  {assignedMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                {reportData && (
                  <div className="report-display">
                    <h4>Report for {reportData.member?.name}</h4>
                    <div className="report-stats">
                      <p><strong>Avg Calories:</strong> {reportData.statistics?.avgCalories} kcal</p>
                      <p><strong>Avg Adherence:</strong> {reportData.statistics?.avgAdherence}%</p>
                      <p><strong>Weight Change:</strong> {reportData.statistics?.weightChange != null ? `${reportData.statistics.weightChange > 0 ? "+" : ""}${reportData.statistics.weightChange} kg` : "N/A"}</p>
                      <p><strong>Total Meals:</strong> {reportData.statistics?.totalMeals}</p>
                      <p><strong>Plan Meals:</strong> {reportData.statistics?.planMeals}</p>
                    </div>
                    {reportData.topFoods?.length > 0 && (
                      <div className="top-foods">
                        <h5>Most Frequent Foods</h5>
                        <ul>{reportData.topFoods.map((f, i) => <li key={i}>{f.name} ({f.count} times)</li>)}</ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="dos-donts-section">
                <h3>Do's & Don'ts Management</h3>
                <select style={{ ...T.input, marginBottom: 16 }} onChange={e => { if (e.target.value) fetchDosDonts(e.target.value); }}>
                  <option value="">Select Member</option>
                  {assignedMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                {selectedMemberForDosDonts && dosDonts && (
                  <DosDontsEditor memberId={selectedMemberForDosDonts} dosDonts={dosDonts} onUpdate={handleUpdateDosDonts} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ ANNOUNCEMENTS ════════════════════════════════════════════════ */}
        {activeTab === "announcements" && (
          <div className="announcements-tab">
            <h2>Announcements for Dietitians</h2>
            {loading ? <div className="loading">Loading…</div> :
              announcements.length === 0 ? <div className="empty-state"><p>No announcements available.</p></div> : (
                <div className="announcements-list">
                  {announcements.map(a => (
                    <div key={a._id} className="announcement-card">
                      <div className="announcement-header">
                        <h3>{a.title}</h3>
                        <span>{fmtDate(a.date)}</span>
                      </div>
                      <p>{a.description}</p>
                      <div className="announcement-meta">
                        <span>Type: {a.type}</span>
                        <span className={a.active ? "active-badge" : "inactive-badge"}>{a.active ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

      </div>{/* /dashboard-content */}

      {/* ══ MODALS ════════════════════════════════════════════════════════════ */}

      {showCreatePlanModal && (
        <DietPlanModal title="Create New Diet Plan" plan={newPlan} setPlan={setNewPlan} onSave={handleCreatePlan} onClose={() => setShowCreatePlanModal(false)} />
      )}

      {showEditPlanModal && editingPlan && (
        <DietPlanModal title="Edit Diet Plan" plan={editingPlan} setPlan={setEditingPlan} onSave={handleEditPlan}
          onClose={() => { setShowEditPlanModal(false); setEditingPlan(null); }} />
      )}

      {showAssignPlanModal && assigningPlan && (
        <Modal title={`Assign: ${assigningPlan.category}`} onClose={() => setShowAssignPlanModal(false)}>
          <div style={{ marginBottom: 16 }}>
            <label style={T.label}>Select Member *</label>
            <select style={T.input} value={assignMemberId} onChange={e => setAssignMemberId(e.target.value)}>
              <option value="">Choose a member…</option>
              {assignedMembers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={T.btnGray} onClick={() => setShowAssignPlanModal(false)}>Cancel</button>
            <button style={T.btnGold} onClick={handleAssignPlan}>Assign Plan</button>
          </div>
        </Modal>
      )}

      {showFeedbackModal && (
        <Modal title="Add Feedback" onClose={() => setShowFeedbackModal(false)}>
          <div style={{ marginBottom: 14 }}>
            <label style={T.label}>Rating *</label>
            <select style={T.input} value={selectedRating} onChange={e => setSelectedRating(e.target.value)}>
              <option value="">Select rating…</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={T.label}>Notes (optional)</label>
            <textarea rows={4} style={{ ...T.input, resize: "vertical" }} value={feedbackNotes}
              onChange={e => setFeedbackNotes(e.target.value)} placeholder="Add any additional notes…" />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={T.btnGray} onClick={() => setShowFeedbackModal(false)}>Cancel</button>
            <button style={T.btnGold} onClick={handleAddFeedback}>Save Feedback</button>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default DietitianDashboard;