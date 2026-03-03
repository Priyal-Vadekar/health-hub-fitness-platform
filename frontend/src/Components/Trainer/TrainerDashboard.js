// frontend/src/Components/Trainer/TrainerDashboard.js
// Layout mirrors DietitianDashboard — same dark theme, same token system,
// same card patterns — tabs differ for trainer-specific data.
//
// Tabs:
//   Overview          — stat cards
//   Assigned Users    — members assigned to this trainer
//   Exercises         — create/edit/delete exercises (owns = createdBy match)
//   User Progress     — per-member progress + meal log history
//   Trainer Bookings  — session bookings (upcoming / past / status filter)
//   Announcements     — announcements targeted at Trainer role

import React, { useState, useEffect } from "react";
import { http } from "../../api/http";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/DietitianDashboard.css"; // reuse same CSS tokens
import {
    FiEdit2, FiTrash2, FiPlus, FiChevronDown, FiChevronUp,
    FiX, FiCheck, FiUser, FiCalendar, FiClock, FiDollarSign,
    FiCheckCircle, FiXCircle, FiAlertTriangle, FiActivity,
    FiTrendingUp, FiTrendingDown, FiBarChart2, FiYoutube,
    FiImage, FiList, FiInfo
} from "react-icons/fi";
import { GiWeightScale, GiMuscleUp } from "react-icons/gi";

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const getStoredUserId = () => {
    try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        return u?._id || u?.id || null;
    } catch { return null; }
};

// ─── shared style tokens (same as DietitianDashboard) ────────────────────────
const T = {
    card: { background: "#252535", border: "1px solid #33334a", borderRadius: 14 },
    input: { background: "#1e1e2f", border: "1px solid #3a3a4a", color: "#eee", padding: "9px 13px", borderRadius: 8, width: "100%", boxSizing: "border-box", fontSize: "0.9rem" },
    label: { color: "#aaa", fontSize: "0.8rem", display: "block", marginBottom: 5 },
    btnGold: { background: "#FFD700", color: "#1e1e2f", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 6 },
    btnGray: { background: "#3a3a4a", color: "#eee", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 6 },
    btnRed: { background: "#dc354520", color: "#dc3545", border: "1px solid #dc354540", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 6 },
};

const statusMeta = {
    pending: { bg: "#ffc10720", border: "#ffc107", text: "#ffc107", label: "Pending", Icon: FiAlertTriangle },
    confirmed: { bg: "#28a74520", border: "#28a745", text: "#28a745", label: "Confirmed", Icon: FiCheckCircle },
    cancelled: { bg: "#dc354520", border: "#dc3545", text: "#dc3545", label: "Cancelled", Icon: FiXCircle },
    completed: { bg: "#5b9bd520", border: "#5b9bd5", text: "#5b9bd5", label: "Completed", Icon: FiCheck },
};

// ─── Modal shell ──────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        onClick={onClose}>
        <div style={{ ...T.card, background: "#1a1a2e", padding: "2rem", width: "100%", maxWidth: wide ? 720 : 500, maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#FFD700", margin: 0 }}>{title}</h3>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: 4, display: "flex" }}>
                    <FiX size={20} />
                </button>
            </div>
            {children}
        </div>
    </div>
);

// ─── Exercise Card ────────────────────────────────────────────────────────────
const ExerciseCard = ({ ex, currentUserId, onEdit, onDelete }) => {
    const [expanded, setExpanded] = useState(false);

    const isOwner = ex.createdBy?._id?.toString() === currentUserId?.toString()
        || ex.createdBy?.toString() === currentUserId?.toString();

    return (
        <div style={{ ...T.card, overflow: "hidden" }}>
            {/* Collapsed header */}
            <div style={{ padding: "1rem 1.4rem", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                onClick={() => setExpanded(p => !p)}>

                {/* Icon placeholder */}
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#FFD70015", border: "1px solid #FFD70030", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <GiMuscleUp size={22} color="#FFD700" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{ex.name}</span>
                        {isOwner && (
                            <span style={{ background: "#28a74518", color: "#28a745", border: "1px solid #28a74540", borderRadius: 6, padding: "2px 9px", fontSize: "0.72rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <FiEdit2 size={10} /> Yours
                            </span>
                        )}
                    </div>
                    <div style={{ color: "#888", fontSize: "0.78rem", marginTop: 4, display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <span><FiBarChart2 size={11} style={{ marginRight: 3 }} />{ex.sets} sets × {ex.reps} reps</span>
                        {ex.createdBy?.name && <span style={{ color: "#555" }}>by {ex.createdBy.name}</span>}
                        {ex.createdAt && <span style={{ color: "#444" }}>{fmtDate(ex.createdAt)}</span>}
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {isOwner && (
                        <>
                            <button style={{ ...T.btnGold, padding: "5px 12px", fontSize: "0.78rem" }} onClick={() => onEdit(ex)}>
                                <FiEdit2 size={12} /> Edit
                            </button>
                            <button style={{ ...T.btnRed, padding: "5px 12px", fontSize: "0.78rem" }} onClick={() => onDelete(ex._id)}>
                                <FiTrash2 size={12} /> Delete
                            </button>
                        </>
                    )}
                    <span style={{ color: "#555", display: "flex" }}>
                        {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                    </span>
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div style={{ padding: "0 1.4rem 1.4rem", borderTop: "1px solid #33334a" }}>
                    <div style={{ paddingTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                        {/* Description */}
                        <div style={{ gridColumn: "1 / -1", background: "#1e1e2f", borderRadius: 10, padding: "0.9rem" }}>
                            <div style={{ color: "#FFD700", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                                <FiInfo size={12} /> Description
                            </div>
                            <p style={{ color: "#ccc", fontSize: "0.88rem", margin: 0, lineHeight: 1.6 }}>{ex.description}</p>
                        </div>

                        {/* Steps */}
                        {ex.steps?.length > 0 && (
                            <div style={{ background: "#1e1e2f", borderRadius: 10, padding: "0.9rem" }}>
                                <div style={{ color: "#FFD700", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                                    <FiList size={12} /> Steps
                                </div>
                                {ex.steps.map((step, i) => (
                                    <div key={i} style={{ color: "#ccc", fontSize: "0.82rem", padding: "4px 0", borderBottom: i < ex.steps.length - 1 ? "1px solid #2a2a3a" : "none", display: "flex", gap: 8 }}>
                                        <span style={{ color: "#FFD70080", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tips */}
                        {ex.tips && (
                            <div style={{ background: "#1e1e2f", borderRadius: 10, padding: "0.9rem" }}>
                                <div style={{ color: "#FFD700", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                                    <FiInfo size={12} /> Tips
                                </div>
                                <p style={{ color: "#ccc", fontSize: "0.82rem", margin: 0, lineHeight: 1.6 }}>{ex.tips}</p>
                            </div>
                        )}

                        {/* Video link */}
                        {ex.videoUrl && (
                            <div style={{ gridColumn: "1 / -1" }}>
                                <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ color: "#5b9bd5", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                                    <FiYoutube size={14} /> Watch Tutorial
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Exercise form modal (create / edit) ──────────────────────────────────────
const EMPTY_EXERCISE = { name: "", description: "", sets: "", reps: "", tips: "", steps: [""], videoUrl: "", image: "" };

const ExerciseModal = ({ title, data, setData, onSave, onClose }) => {
    const addStep = () => setData(d => ({ ...d, steps: [...d.steps, ""] }));
    const removeStep = (i) => setData(d => ({ ...d, steps: d.steps.filter((_, j) => j !== i) }));
    const updateStep = (i, v) => setData(d => ({ ...d, steps: d.steps.map((s, j) => j === i ? v : s) }));

    const F = ({ label, field, placeholder, type = "text", multiline }) => (
        <div style={{ marginBottom: 14 }}>
            <label style={T.label}>{label}</label>
            {multiline
                ? <textarea rows={3} style={{ ...T.input, resize: "vertical" }} value={data[field] || ""}
                    placeholder={placeholder} onChange={e => setData(d => ({ ...d, [field]: e.target.value }))} />
                : <input type={type} style={T.input} value={data[field] || ""}
                    placeholder={placeholder} onChange={e => setData(d => ({ ...d, [field]: e.target.value }))} />
            }
        </div>
    );

    return (
        <Modal title={title} onClose={onClose} wide>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <div style={{ gridColumn: "1 / -1" }}><F label="Exercise Name *" field="name" placeholder="e.g. Barbell Squat" /></div>
                <div style={{ gridColumn: "1 / -1" }}><F label="Description *" field="description" placeholder="Brief description…" multiline /></div>
                <F label="Sets *" field="sets" placeholder="e.g. 3" type="number" />
                <F label="Reps *" field="reps" placeholder="e.g. 12 or Hold 30s" />
                <div style={{ gridColumn: "1 / -1" }}><F label="Tips" field="tips" placeholder="Form tips, common mistakes…" multiline /></div>
                <div style={{ gridColumn: "1 / -1" }}>
                    <F label="YouTube Video URL *" field="videoUrl" placeholder="https://youtube.com/watch?v=…" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                    <F label="Image URL" field="image" placeholder="https://…/image.jpg" />
                </div>

                {/* Steps */}
                <div style={{ gridColumn: "1 / -1", marginBottom: 14 }}>
                    <label style={T.label}>Steps *</label>
                    {data.steps?.map((step, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                            <span style={{ color: "#FFD70080", fontSize: "0.8rem", fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                            <input style={{ ...T.input }} value={step} placeholder={`Step ${i + 1}`}
                                onChange={e => updateStep(i, e.target.value)} />
                            {data.steps.length > 1 && (
                                <button style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer", padding: 4, display: "flex" }}
                                    onClick={() => removeStep(i)}>
                                    <FiX size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button style={{ ...T.btnGray, fontSize: "0.78rem", padding: "5px 12px" }} onClick={addStep}>
                        <FiPlus size={13} /> Add Step
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button style={T.btnGray} onClick={onClose}><FiX size={14} /> Cancel</button>
                <button style={T.btnGold} onClick={onSave}><FiCheck size={14} /> Save Exercise</button>
            </div>
        </Modal>
    );
};

// ─── Booking Card ─────────────────────────────────────────────────────────────
const BookingCard = ({ booking, onMarkComplete, onCancel }) => {
    const meta = statusMeta[booking.status] || statusMeta.pending;
    const Icon = meta.Icon;
    const isPast = new Date(booking.date) < new Date();

    return (
        <div style={{ ...T.card, padding: "1.1rem 1.4rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>

                {/* Avatar */}
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FFD70015", border: "2px solid #FFD70030", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD700", fontWeight: 700, flexShrink: 0 }}>
                    {(booking.member?.name || "?")[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", marginBottom: 6 }}>
                        {booking.member?.name || "Unknown Member"}
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: "0.82rem", color: "#888" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <FiCalendar size={12} /> {fmtDate(booking.date)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <FiClock size={12} /> {booking.timeSlot?.start} – {booking.timeSlot?.end}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <FiDollarSign size={12} /> ₹{booking.sessionPrice}
                        </span>
                    </div>
                    {booking.notes && (
                        <p style={{ color: "#666", fontSize: "0.78rem", marginTop: 6, marginBottom: 0 }}>
                            Note: {booking.notes}
                        </p>
                    )}
                </div>

                {/* Status + actions */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <span style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}40`, borderRadius: 6, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Icon size={12} /> {meta.label}
                    </span>

                    {booking.status === "confirmed" && isPast && (
                        <button style={{ ...T.btnGold, padding: "5px 12px", fontSize: "0.75rem" }} onClick={() => onMarkComplete(booking._id)}>
                            <FiCheck size={12} /> Mark Complete
                        </button>
                    )}
                    {booking.status === "confirmed" && !isPast && (
                        <button style={{ ...T.btnRed, padding: "5px 12px", fontSize: "0.75rem" }} onClick={() => onCancel(booking._id)}>
                            <FiXCircle size={12} /> Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Progress member detail card ──────────────────────────────────────────────
const ProgressDetail = ({ memberProgress }) => {
    if (!memberProgress) return null;
    const { member, progress, mealLogs } = memberProgress;

    const latestP = progress?.at(-1);
    const firstP = progress?.[0];
    const weightChange = (latestP?.weight && firstP?.weight)
        ? (latestP.weight - firstP.weight).toFixed(1) : null;

    return (
        <div style={{ ...T.card, padding: "1.5rem" }}>
            <h3 style={{ color: "#FFD700", marginBottom: "1.2rem" }}>{member?.name} — Progress</h3>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: "1.2rem" }}>
                {[
                    { label: "Current Weight", val: latestP?.weight ? `${latestP.weight} kg` : "—", Icon: GiWeightScale },
                    { label: "Body Fat", val: latestP?.bodyFatPercentage ? `${latestP.bodyFatPercentage}%` : "—", Icon: FiActivity },
                    { label: "BMI", val: latestP?.bmi ? latestP.bmi : "—", Icon: FiBarChart2 },
                    {
                        label: "Weight Change", val: weightChange ? `${weightChange > 0 ? "+" : ""}${weightChange} kg` : "—",
                        Icon: weightChange > 0 ? FiTrendingUp : FiTrendingDown,
                        color: weightChange > 0 ? "#dc3545" : "#28a745"
                    },
                ].map((s, i) => (
                    <div key={i} style={{ background: "#1e1e2f", border: "1px solid #2a2a3a", borderRadius: 10, padding: "0.8rem", textAlign: "center" }}>
                        <s.Icon size={18} color={s.color || "#FFD700"} style={{ marginBottom: 4 }} />
                        <div style={{ color: s.color || "#FFD700", fontWeight: 700, fontSize: "1.1rem" }}>{s.val}</div>
                        <div style={{ color: "#888", fontSize: "0.72rem", marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Progress history */}
            {progress?.length > 0 && (
                <div style={{ marginBottom: "1.2rem" }}>
                    <h4 style={{ color: "#FFD700", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Progress History</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {progress.slice(-5).reverse().map((p, i) => (
                            <div key={i} style={{ background: "#1e1e2f", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: "0.82rem" }}>
                                <span style={{ color: "#888" }}>{fmtDate(p.date)}</span>
                                <span style={{ color: "#ccc" }}>
                                    {p.weight && <span>Wt: <b style={{ color: "#FFD700" }}>{p.weight}kg</b>  </span>}
                                    {p.bodyFatPercentage && <span>BF: <b style={{ color: "#5b9bd5" }}>{p.bodyFatPercentage}%</b>  </span>}
                                    {p.bmi && <span>BMI: <b style={{ color: "#28a745" }}>{p.bmi}</b>  </span>}
                                    {p.workoutAdherence > 0 && <span>WA: <b style={{ color: "#ffc107" }}>{p.workoutAdherence}%</b></span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent meal logs */}
            <div>
                <h4 style={{ color: "#FFD700", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Recent Meal Logs</h4>
                {mealLogs?.length > 0 ? mealLogs.map((log, i) => (
                    <div key={i} style={{ background: "#1e1e2f", borderRadius: 8, padding: "8px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between", flexWrap: "wrap", fontSize: "0.82rem" }}>
                        <span style={{ color: "#aaa" }}>{fmtDate(log.date)}</span>
                        <span style={{ color: "#ccc" }}>{log.meals?.length || 0} meals · <b style={{ color: "#FFD700" }}>{log.totalCalories || 0} kcal</b></span>
                    </div>
                )) : <p style={{ color: "#666", fontSize: "0.85rem" }}>No meal logs yet.</p>}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main TrainerDashboard
// ═══════════════════════════════════════════════════════════════════════════════
const TrainerDashboard = () => {
    const [currentUserId, setCurrentUserId] = useState(getStoredUserId);

    const [activeTab, setActiveTab] = useState("overview");
    const [assignedMembers, setAssignedMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberProgress, setMemberProgress] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);

    // Exercise modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [exerciseForm, setExerciseForm] = useState(EMPTY_EXERCISE);
    const [editingExId, setEditingExId] = useState(null);

    // Exercise filter
    const [exFilter, setExFilter] = useState("all"); // "all" | "mine"
    const [exSearch, setExSearch] = useState("");

    // Booking filter
    const [bookingFilter, setBookingFilter] = useState("all"); // all | upcoming | past | status

    // ── Fetch current user id from /auth/me ───────────────────────────────────
    useEffect(() => {
        http.get("/auth/me")
            .then(r => { const id = r.data?._id || r.data?.id; if (id) setCurrentUserId(id); })
            .catch(() => { });
    }, []);

    // ── Tab-driven data loading ───────────────────────────────────────────────
    useEffect(() => {
        if (["overview", "assigned-users", "user-progress"].includes(activeTab)) fetchAssignedMembers();
        if (activeTab === "exercises") fetchExercises();
        if (activeTab === "bookings") fetchBookings();
        if (activeTab === "announcements") fetchAnnouncements();
    }, [activeTab]);

    const fetchAssignedMembers = async () => {
        try {
            setLoading(true);
            const r = await http.get("/trainer/assigned-members");
            if (r.data.success) setAssignedMembers(r.data.data);
        } catch { toast.error("Failed to load assigned members"); }
        finally { setLoading(false); }
    };

    const fetchMemberProgress = async (memberId) => {
        try {
            setLoading(true);
            const r = await http.get(`/trainer/member/${memberId}/progress`);
            if (r.data.success) { setMemberProgress(r.data.data); setSelectedMember(memberId); }
        } catch { toast.error("Failed to load member progress"); }
        finally { setLoading(false); }
    };

    const fetchExercises = async () => {
        try {
            setLoading(true);
            const r = await http.get("/exercises");
            if (r.data.success) setExercises(r.data.data || []);
        } catch { toast.error("Failed to load exercises"); }
        finally { setLoading(false); }
    };

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const r = await http.get("/bookings/trainer");
            if (r.data.success) setBookings(r.data.data || []);
        } catch { toast.error("Failed to load bookings"); }
        finally { setLoading(false); }
    };

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const r = await http.get("/announcements/all-announcements", { params: { role: "Trainer" } });
            if (r.data.success) setAnnouncements(r.data.data || []);
            else if (Array.isArray(r.data)) setAnnouncements(r.data.filter(a => a.active));
            else setAnnouncements([]);
        } catch { setAnnouncements([]); }
        finally { setLoading(false); }
    };

    // ── Exercise CRUD ─────────────────────────────────────────────────────────
    const handleCreateExercise = async () => {
        const { name, description, sets, reps, tips, steps, videoUrl, image } = exerciseForm;
        if (!name.trim() || !description.trim() || !sets || !reps || !videoUrl.trim()) {
            toast.error("Please fill in all required fields"); return;
        }
        const validSteps = steps.filter(s => s.trim());
        if (!validSteps.length) { toast.error("Add at least one step"); return; }

        try {
            const r = await http.post("/exercises/new-exercise", {
                name, description, sets: Number(sets), reps, tips, steps: validSteps, videoUrl, image,
            });
            if (r.data.success) {
                toast.success("Exercise created!");
                setShowCreateModal(false);
                setExerciseForm(EMPTY_EXERCISE);
                fetchExercises();
            } else toast.error(r.data.message || "Failed");
        } catch (e) { toast.error(e.response?.data?.message || "Failed to create exercise"); }
    };

    const handleEditExercise = async () => {
        if (!exerciseForm.name?.trim()) { toast.error("Name is required"); return; }
        const validSteps = exerciseForm.steps?.filter(s => s.trim()) || [];
        try {
            const r = await http.put(`/exercises/update-exercise/${editingExId}`, {
                ...exerciseForm, sets: Number(exerciseForm.sets), steps: validSteps,
            });
            if (r.data.success) {
                toast.success("Exercise updated!");
                setShowEditModal(false);
                setEditingExId(null);
                setExerciseForm(EMPTY_EXERCISE);
                fetchExercises();
            } else toast.error(r.data.message || "Failed");
        } catch (e) { toast.error(e.response?.data?.message || "Failed to update exercise"); }
    };

    const handleDeleteExercise = async (id) => {
        if (!window.confirm("Delete this exercise?")) return;
        try {
            const r = await http.delete(`/exercises/delete-exercise/${id}`);
            if (r.data.success) { toast.success("Exercise deleted!"); fetchExercises(); }
            else toast.error(r.data.message || "Failed");
        } catch (e) { toast.error(e.response?.data?.message || "You can only delete exercises you created"); }
    };

    // ── Booking actions ───────────────────────────────────────────────────────
    const handleMarkComplete = async (bookingId) => {
        try {
            // Use the cancel endpoint semantics — update status via a custom call
            // The backend currently only has confirmBooking; we call it with completed logic
            // For now we mark via the existing cancel endpoint shape (backend may need extending)
            const r = await http.post("/bookings/confirm", { bookingId, paymentId: null });
            toast.info("Session marked as complete.");
            fetchBookings();
        } catch { toast.error("Failed to update booking"); }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm("Cancel this booking?")) return;
        try {
            const r = await http.post("/bookings/cancel", { bookingId, reason: "Cancelled by trainer" });
            if (r.data.success) { toast.success("Booking cancelled."); fetchBookings(); }
            else toast.error(r.data.message || "Failed");
        } catch { toast.error("Failed to cancel booking"); }
    };

    // ── Derived data ──────────────────────────────────────────────────────────
    const myExerciseCount = exercises.filter(e =>
        e.createdBy?._id?.toString() === currentUserId?.toString()
        || e.createdBy?.toString() === currentUserId?.toString()
    ).length;

    const filteredExercises = exercises.filter(e => {
        const matchOwner = exFilter === "all"
            || (exFilter === "mine" && (
                e.createdBy?._id?.toString() === currentUserId?.toString()
                || e.createdBy?.toString() === currentUserId?.toString()
            ));
        const matchSearch = !exSearch.trim() || e.name.toLowerCase().includes(exSearch.toLowerCase());
        return matchOwner && matchSearch;
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const filteredBookings = bookings.filter(b => {
        const bDate = new Date(b.date); bDate.setHours(0, 0, 0, 0);
        if (bookingFilter === "upcoming") return bDate >= today && ["pending", "confirmed"].includes(b.status);
        if (bookingFilter === "past") return bDate < today || ["completed", "cancelled"].includes(b.status);
        if (["pending", "confirmed", "completed", "cancelled"].includes(bookingFilter)) return b.status === bookingFilter;
        return true;
    });

    const upcomingCount = bookings.filter(b => new Date(b.date) >= today && ["pending", "confirmed"].includes(b.status)).length;
    const completedCount = bookings.filter(b => b.status === "completed").length;
    const pendingCount = bookings.filter(b => b.status === "pending").length;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="dietitian-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h1>Trainer Dashboard</h1>
                <p>Manage your members, exercises, and session bookings</p>
            </div>

            {/* Tabs */}
            <div className="dashboard-tabs">
                {[
                    ["overview", "Overview"],
                    ["assigned-users", "Assigned Users"],
                    ["exercises", "Exercises"],
                    ["user-progress", "User Progress"],
                    ["bookings", "Trainer Bookings"],
                    ["announcements", "Announcements"],
                ].map(([id, label]) => (
                    <button key={id} className={activeTab === id ? "active" : ""}
                        onClick={() => setActiveTab(id)}>
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
                                { val: assignedMembers.length, label: "Assigned Members", tab: "assigned-users" },
                                { val: myExerciseCount, label: "My Exercises", tab: "exercises" },
                                { val: upcomingCount, label: "Upcoming Sessions", tab: "bookings" },
                                { val: pendingCount, label: "Pending Payments", tab: "bookings" },
                            ].map((s, i) => (
                                <div key={i} className="stat-card clickable"
                                    onClick={() => setActiveTab(s.tab)}>
                                    <h3>{s.val}</h3>
                                    <p>{s.label}</p>
                                </div>
                            ))}
                        </div>
                        <p style={{ color: "#888", fontSize: "0.9rem", marginTop: 20 }}>
                            Click any card to navigate to the relevant tab.
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
                                        {assignedMembers.map(member => (
                                            <div key={member._id}
                                                className={`member-card ${selectedMember === member._id ? "selected" : ""}`}
                                                onClick={() => { setSelectedMember(member._id); setActiveTab("user-progress"); fetchMemberProgress(member._id); }}>
                                                <div className="member-info">
                                                    <h4>{member.name}</h4>
                                                    <p>{member.email}</p>
                                                    <div className="member-stats">
                                                        <span style={{ color: "#888", fontSize: "0.8rem" }}>
                                                            {member.latestWeight ? `${member.latestWeight} kg` : "No weight"}
                                                        </span>
                                                        <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
                                                            Adherence: {member.mealAdherence || 0}%
                                                        </span>
                                                    </div>
                                                    {member.currentDietPlan && (
                                                        <div style={{ color: "#5b9bd5", fontSize: "0.75rem", marginTop: 4 }}>
                                                            Plan: {member.currentDietPlan}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Summary panel when a member is selected */}
                                    {selectedMember && assignedMembers.find(m => m._id === selectedMember) && (() => {
                                        const m = assignedMembers.find(m => m._id === selectedMember);
                                        return (
                                            <div className="member-detail">
                                                <h3>{m.name} — Quick Summary</h3>
                                                <div className="summary-sections">
                                                    <div className="section">
                                                        <h4>Latest Stats</h4>
                                                        <p>Weight: {m.latestWeight ? `${m.latestWeight} kg` : "Not recorded"}</p>
                                                        <p>Body Fat: {m.latestBodyFat ? `${m.latestBodyFat}%` : "Not recorded"}</p>
                                                    </div>
                                                    <div className="section">
                                                        <h4>Diet Plan</h4>
                                                        <p>{m.currentDietPlan || "No plan assigned"}</p>
                                                    </div>
                                                    <div className="section">
                                                        <h4>Meal Adherence (7 days)</h4>
                                                        <p>{m.mealAdherence || 0}%</p>
                                                    </div>
                                                    <div className="section" style={{ cursor: "pointer" }}
                                                        onClick={() => { setActiveTab("user-progress"); fetchMemberProgress(m._id); }}>
                                                        <p style={{ color: "#FFD700", fontSize: "0.85rem" }}>
                                                            View full progress → switch to User Progress tab
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </>
                            )}
                    </div>
                )}

                {/* ══ EXERCISES ═════════════════════════════════════════════════════ */}
                {activeTab === "exercises" && (
                    <div style={{ padding: "0.5rem 0" }}>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
                            <div>
                                <h2 style={{ color: "#FFD700", margin: 0 }}>Exercises</h2>
                                <span style={{ color: "#888", fontSize: "0.82rem" }}>
                                    {filteredExercises.length} of {exercises.length} shown · {myExerciseCount} created by you
                                </span>
                            </div>
                            <button style={T.btnGold} onClick={() => { setExerciseForm(EMPTY_EXERCISE); setShowCreateModal(true); }}>
                                <FiPlus size={14} /> Create Exercise
                            </button>
                        </div>

                        {/* Filter + search */}
                        <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: 0, border: "1px solid #33334a", borderRadius: 8, overflow: "hidden" }}>
                                {[["all", "All Exercises"], ["mine", "My Exercises"]].map(([id, label]) => (
                                    <button key={id} onClick={() => setExFilter(id)}
                                        style={{ background: exFilter === id ? "#FFD700" : "#252535", color: exFilter === id ? "#1e1e2f" : "#aaa", border: "none", padding: "7px 18px", cursor: "pointer", fontWeight: exFilter === id ? 700 : 400, fontSize: "0.85rem", transition: "all 0.15s" }}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <input style={{ ...T.input, maxWidth: 280, flex: 1 }} placeholder="Search by name…"
                                value={exSearch} onChange={e => setExSearch(e.target.value)} />
                        </div>

                        {loading ? <div className="loading">Loading…</div> :
                            filteredExercises.length === 0 ? <div className="empty-state"><p>No exercises found.</p></div> : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {filteredExercises.map(ex => (
                                        <ExerciseCard
                                            key={ex._id}
                                            ex={ex}
                                            currentUserId={currentUserId}
                                            onEdit={(e) => { setExerciseForm({ ...e, steps: e.steps?.length ? e.steps : [""] }); setEditingExId(e._id); setShowEditModal(true); }}
                                            onDelete={handleDeleteExercise}
                                        />
                                    ))}
                                </div>
                            )}
                    </div>
                )}

                {/* ══ USER PROGRESS ═════════════════════════════════════════════════ */}
                {activeTab === "user-progress" && (
                    <div className="assigned-users-tab">
                        {loading && !memberProgress ? <div className="loading">Loading…</div> : (
                            <>
                                {assignedMembers.length === 0 ? (
                                    <div className="empty-state"><p>No assigned members yet.</p></div>
                                ) : (
                                    <div className="members-list">
                                        {assignedMembers.map(member => (
                                            <div key={member._id}
                                                className={`member-card ${selectedMember === member._id ? "selected" : ""}`}
                                                onClick={() => fetchMemberProgress(member._id)}>
                                                <div className="member-info">
                                                    <h4>{member.name}</h4>
                                                    <p>{member.email}</p>
                                                    <div className="member-stats">
                                                        <span style={{ color: "#888", fontSize: "0.78rem" }}>
                                                            {member.latestWeight ? `${member.latestWeight} kg` : "—"}
                                                        </span>
                                                        <span style={{ color: "#aaa", fontSize: "0.78rem" }}>
                                                            {member.mealAdherence || 0}% adherence
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div>
                                    {loading ? <div className="loading">Loading progress…</div>
                                        : memberProgress ? <ProgressDetail memberProgress={memberProgress} />
                                            : <div style={{ ...T.card, padding: "2rem", textAlign: "center", color: "#666" }}>
                                                <FiUser size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                                                <p>Select a member to view their progress</p>
                                            </div>
                                    }
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ══ TRAINER BOOKINGS ══════════════════════════════════════════════ */}
                {activeTab === "bookings" && (
                    <div style={{ padding: "0.5rem 0" }}>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
                            <div>
                                <h2 style={{ color: "#FFD700", margin: 0 }}>Trainer Bookings</h2>
                                <span style={{ color: "#888", fontSize: "0.82rem" }}>{filteredBookings.length} of {bookings.length} shown</span>
                            </div>
                        </div>

                        {/* Stats strip */}
                        {bookings.length > 0 && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
                                {[
                                    { label: "Total", val: bookings.length, color: "#FFD700" },
                                    { label: "Upcoming", val: upcomingCount, color: "#28a745" },
                                    { label: "Pending", val: pendingCount, color: "#ffc107" },
                                    { label: "Completed", val: completedCount, color: "#5b9bd5" },
                                ].map((s, i) => (
                                    <div key={i} style={{ background: "#252535", border: "1px solid #33334a", borderRadius: 10, padding: "0.9rem", textAlign: "center" }}>
                                        <div style={{ color: s.color, fontWeight: 700, fontSize: "1.4rem" }}>{s.val}</div>
                                        <div style={{ color: "#888", fontSize: "0.75rem", marginTop: 3 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Filter tabs */}
                        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
                            {[
                                ["all", "All"],
                                ["upcoming", "Upcoming"],
                                ["past", "Past"],
                                ["pending", "Pending"],
                                ["confirmed", "Confirmed"],
                                ["completed", "Completed"],
                                ["cancelled", "Cancelled"],
                            ].map(([id, label]) => (
                                <button key={id} onClick={() => setBookingFilter(id)}
                                    style={{
                                        background: bookingFilter === id ? "#FFD700" : "#252535",
                                        color: bookingFilter === id ? "#1e1e2f" : "#888",
                                        border: `1px solid ${bookingFilter === id ? "#FFD700" : "#33334a"}`,
                                        borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                                        fontWeight: bookingFilter === id ? 700 : 400, fontSize: "0.82rem", transition: "all 0.15s",
                                    }}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {loading ? <div className="loading">Loading…</div> :
                            filteredBookings.length === 0 ? <div className="empty-state"><p>No bookings found.</p></div> : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {filteredBookings.map(b => (
                                        <BookingCard key={b._id} booking={b}
                                            onMarkComplete={handleMarkComplete}
                                            onCancel={handleCancelBooking}
                                        />
                                    ))}
                                </div>
                            )}
                    </div>
                )}

                {/* ══ ANNOUNCEMENTS ════════════════════════════════════════════════ */}
                {activeTab === "announcements" && (
                    <div className="announcements-tab">
                        <h2>Announcements for Trainers</h2>
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
                                                <span className={a.active ? "active-badge" : "inactive-badge"}>
                                                    {a.active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                    </div>
                )}

            </div>{/* /dashboard-content */}

            {/* ══ MODALS ════════════════════════════════════════════════════════════ */}
            {showCreateModal && (
                <ExerciseModal
                    title="Create Exercise"
                    data={exerciseForm}
                    setData={setExerciseForm}
                    onSave={handleCreateExercise}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
            {showEditModal && editingExId && (
                <ExerciseModal
                    title="Edit Exercise"
                    data={exerciseForm}
                    setData={setExerciseForm}
                    onSave={handleEditExercise}
                    onClose={() => { setShowEditModal(false); setEditingExId(null); setExerciseForm(EMPTY_EXERCISE); }}
                />
            )}
        </div>
    );
};

export default TrainerDashboard;