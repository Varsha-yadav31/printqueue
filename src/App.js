import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SHOPS = [
  { id: "b25", name: "Block 25 Basement", label: "Tack Shop", color: "#6366F1" },
  { id: "b26", name: "Block 26 Basement", label: "Tack Shop", color: "#8B5CF6" },
  { id: "b28", name: "Block 28", label: "Tack Shop", color: "#EC4899" },
  { id: "b29", name: "Block 29", label: "Tack Shop", color: "#F59E0B" },
  { id: "b31", name: "Block 31", label: "Tack Shop", color: "#10B981" },
  { id: "b32", name: "Block 32", label: "Tack Shop", color: "#3B82F6" },
  { id: "b33", name: "Block 33", label: "Tack Shop", color: "#EF4444" },
];

const TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
];

const BW_PRICE = 1; // per page
const COLOR_PRICE = 4; // per page
const PLATFORM_FEE = 3;

// ─── INITIAL DATA ──────────────────────────────────────────────────────────────
const INIT_ORDERS = [
  { id: "PQ001", studentId: "s1", studentName: "Aditya Sharma", shopId: "b25", fileName: "Sem5_Notes.pdf", pages: 24, copies: 2, color: "bw", orientation: "portrait", pageRange: "all", slot: "11:00 AM", status: "printing", payment: "paid", timestamp: Date.now() - 3600000, workerId: "w1", price: 51 },
  { id: "PQ002", studentId: "s2", studentName: "Priya Patel", shopId: "b25", fileName: "Lab_Report.pdf", pages: 8, copies: 1, color: "color", orientation: "portrait", pageRange: "all", slot: "11:00 AM", status: "queue", payment: "paid", timestamp: Date.now() - 2400000, workerId: null, price: 35 },
  { id: "PQ003", studentId: "s3", studentName: "Rohan Mehta", shopId: "b25", fileName: "Project_PPT.pdf", pages: 16, copies: 3, color: "bw", orientation: "landscape", pageRange: "all", slot: "11:30 AM", status: "ready", payment: "paid", timestamp: Date.now() - 7200000, workerId: "w1", price: 51 },
  { id: "PQ004", studentId: "s4", studentName: "Sneha Roy", shopId: "b25", fileName: "Assignment_2.pdf", pages: 6, copies: 1, color: "bw", orientation: "portrait", pageRange: "1-4", slot: "12:00 PM", status: "queue", payment: "paid", timestamp: Date.now() - 1800000, workerId: null, price: 9 },
];

const INIT_WORKERS = [
  { id: "w1", name: "Ramesh Kumar", shopId: "b25", status: "active", assignedOrders: ["PQ001"] },
  { id: "w2", name: "Suresh Das", shopId: "b25", status: "active", assignedOrders: [] },
];

const INIT_FEEDBACK = [
  { id: "f1", userId: "s3", orderId: "PQ003", studentName: "Rohan Mehta", rating: 5, comment: "Super fast service! Got my prints in 10 min.", timestamp: Date.now() - 3600000 },
  { id: "f2", userId: "s1", orderId: "PQ001", studentName: "Aditya Sharma", rating: 4, comment: "Good quality prints. Minor delay.", timestamp: Date.now() - 7200000 },
];

// ─── UTILITIES ─────────────────────────────────────────────────────────────────
function calcPrice(pages, copies, color) {
  const perPage = color === "color" ? COLOR_PRICE : BW_PRICE;
  return pages * copies * perPage + PLATFORM_FEE;
}

function genId(prefix) {
  return prefix + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 60000);
  if (d < 1) return "just now";
  if (d < 60) return `${d}m ago`;
  return `${Math.floor(d / 60)}h ago`;
}

function Stars({ rating, interactive = false, onRate }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => interactive && onRate && onRate(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{
            fontSize: 24,
            cursor: interactive ? "pointer" : "default",
            color: s <= (hover || rating) ? "#F59E0B" : "#E5E7EB",
            transition: "color 0.15s",
          }}
        >★</span>
      ))}
    </div>
  );
}

// ─── STATUS BADGE ──────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    queue: { bg: "#FEF3C7", color: "#92400E", label: "In Queue" },
    printing: { bg: "#DBEAFE", color: "#1E40AF", label: "Printing" },
    ready: { bg: "#D1FAE5", color: "#065F46", label: "Ready ✓" },
    completed: { bg: "#F3F4F6", color: "#374151", label: "Completed" },
    rejected: { bg: "#FEE2E2", color: "#991B1B", label: "Rejected" },
    paid: { bg: "#D1FAE5", color: "#065F46", label: "Paid" },
    pending: { bg: "#FEF3C7", color: "#92400E", label: "Pending" },
  };
  const s = map[status] || { bg: "#F3F4F6", color: "#374151", label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20,
      whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

// ─── AVATAR ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36, bg = "#4F46E5" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.38,
      fontWeight: 800, color: "#fff", flexShrink: 0,
    }}>{initials}</div>
  );
}

// ─── PROGRESS STEPS ────────────────────────────────────────────────────────────
function ProgressBar({ current }) {
  const steps = ["Uploaded", "Options", "Slot", "Payment", "Confirmed"];
  const idx = steps.indexOf(current);
  return (
    <div style={{ padding: "16px 24px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: i <= idx ? "#4F46E5" : "#E5E7EB",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
              color: i <= idx ? "#fff" : "#9CA3AF",
              transition: "all 0.3s", flexShrink: 0,
            }}>
              {i < idx ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: i < idx ? "#4F46E5" : "#E5E7EB",
                transition: "background 0.3s",
              }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {steps.map((s, i) => (
          <span key={s} style={{
            fontSize: 9, fontWeight: i === idx ? 700 : 500,
            color: i <= idx ? "#4F46E5" : "#9CA3AF",
            width: i === 0 ? "auto" : i === steps.length - 1 ? "auto" : "auto",
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

// ─── INPUT COMPONENT ───────────────────────────────────────────────────────────
function Input({ label, type = "text", value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "13px 16px",
          border: "1.5px solid #E5E7EB", borderRadius: 12,
          fontFamily: "inherit", fontSize: 15, color: "#111827",
          background: "#F9FAFB", outline: "none",
          boxSizing: "border-box", transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "#4F46E5"}
        onBlur={e => e.target.style.borderColor = "#E5E7EB"}
      />
    </div>
  );
}

// ─── BUTTON COMPONENT ──────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", disabled, style: extra, size = "md" }) {
  const variants = {
    primary: { background: "#4F46E5", color: "#fff", border: "none" },
    secondary: { background: "#F3F4F6", color: "#374151", border: "none" },
    danger: { background: "#EF4444", color: "#fff", border: "none" },
    success: { background: "#10B981", color: "#fff", border: "none" },
    amber: { background: "#F59E0B", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "#4F46E5", border: "1.5px solid #4F46E5" },
    outline: { background: "transparent", color: "#6B7280", border: "1.5px solid #E5E7EB" },
  };
  const sizes = {
    sm: { padding: "8px 14px", fontSize: 13, borderRadius: 10 },
    md: { padding: "13px 20px", fontSize: 15, borderRadius: 13 },
    lg: { padding: "16px 24px", fontSize: 16, borderRadius: 14 },
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        ...variants[variant], ...sizes[size],
        fontFamily: "inherit", fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s", width: "100%",
        ...extra,
      }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
    >{children}</button>
  );
}

// ─── TOGGLE COMPONENT ──────────────────────────────────────────────────────────
function Toggle({ options, value, onChange }) {
  return (
    <div style={{
      display: "flex", background: "#F3F4F6",
      borderRadius: 12, padding: 4, gap: 2,
    }}>
      {options.map(opt => (
        <button
          key={opt.value} onClick={() => onChange(opt.value)}
          style={{
            flex: 1, padding: "10px 8px",
            borderRadius: 10, border: "none",
            fontFamily: "inherit", fontSize: 14, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
            background: value === opt.value ? "#fff" : "transparent",
            color: value === opt.value ? "#111827" : "#6B7280",
            boxShadow: value === opt.value ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
          }}
        >{opt.label}</button>
      ))}
    </div>
  );
}

// ─── CARD COMPONENT ────────────────────────────────────────────────────────────
function Card({ children, style: extra }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid #F3F4F6",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      ...extra,
    }}>{children}</div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── SPLASH SCREEN ─────────────────────────────────────────────────────────────
function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      flex: 1, background: "linear-gradient(160deg,#4F46E5 0%,#6D28D9 50%,#4F46E5 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 0,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", width: 300, height: 300,
        background: "rgba(255,255,255,0.05)", borderRadius: "50%",
        top: -80, right: -80,
      }} />
      <div style={{
        position: "absolute", width: 200, height: 200,
        background: "rgba(255,255,255,0.04)", borderRadius: "50%",
        bottom: 60, left: -60,
      }} />
      <div style={{
        width: 88, height: 88, background: "rgba(255,255,255,0.18)",
        borderRadius: 26, display: "flex", alignItems: "center",
        justifyContent: "center", marginBottom: 24,
        border: "1px solid rgba(255,255,255,0.25)",
        animation: "pulsePrint 1.5s ease infinite",
        fontSize: 40,
      }}>🖨️</div>
      <div style={{ fontSize: 38, fontWeight: 900, color: "#fff", letterSpacing: -1, marginBottom: 8 }}>PrintQueue</div>
      <div style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>Skip the line, print on time.</div>
      <div style={{
        marginTop: 60, display: "flex", gap: 6,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: i === 0 ? 24 : 8, height: 8,
            background: "rgba(255,255,255,0.6)",
            borderRadius: 4,
          }} />
        ))}
      </div>
      <style>{`@keyframes pulsePrint{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}`}</style>
    </div>
  );
}

// ─── AUTH SCREENS ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onGoSignup, onAdminLogin }) {
  const [email, setEmail] = useState("student@university.edu");
  const [pass, setPass] = useState("password123");
  const [err, setErr] = useState("");

  const handle = () => {
    if (!email || !pass) { setErr("Please fill all fields"); return; }
    onLogin({ name: email.split("@")[0], email, role: "student", id: "s_new" });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          width: 52, height: 52, background: "#4F46E5", borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, marginBottom: 20,
        }}>🖨️</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#111827", marginBottom: 6 }}>Welcome back</div>
        <div style={{ fontSize: 15, color: "#6B7280" }}>Log in to your PrintQueue account</div>
      </div>
      {err && <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>{err}</div>}
      <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@university.edu" required />
      <Input label="Password" type="password" value={pass} onChange={setPass} placeholder="Your password" required />
      <div style={{ textAlign: "right", marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: "#4F46E5", fontWeight: 600, cursor: "pointer" }}>Forgot password?</span>
      </div>
      <Btn onClick={handle} size="lg">Log In →</Btn>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
      }}>
        <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
      </div>
      <button
        onClick={() => onLogin({ name: "Aditya Sharma", email: "demo@univ.edu", role: "student", id: "s_new" })}
        style={{
          width: "100%", padding: "13px", border: "1.5px solid #E5E7EB",
          borderRadius: 13, background: "#fff", fontFamily: "inherit",
          fontSize: 15, fontWeight: 600, color: "#374151", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
        Continue with Google
      </button>
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#6B7280" }}>
        No account? <span style={{ color: "#4F46E5", fontWeight: 700, cursor: "pointer" }} onClick={onGoSignup}>Create one →</span>
      </div>
      <div style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: "#9CA3AF" }}>
        Admin? <span style={{ color: "#6B7280", fontWeight: 600, cursor: "pointer" }} onClick={onAdminLogin}>Admin Login →</span>
      </div>
    </div>
  );
}

function SignupScreen({ onSignup, onGoLogin }) {
  const [form, setForm] = useState({ name: "", email: "", pass: "", confirm: "" });
  const [err, setErr] = useState("");
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handle = () => {
    if (!form.name || !form.email || !form.pass) { setErr("All fields required"); return; }
    if (form.pass !== form.confirm) { setErr("Passwords do not match"); return; }
    if (form.pass.length < 6) { setErr("Password must be at least 6 characters"); return; }
    onSignup({ name: form.name, email: form.email, role: "student", id: "s_" + Date.now() });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#111827", marginBottom: 6 }}>Create Account</div>
        <div style={{ fontSize: 15, color: "#6B7280" }}>Join PrintQueue — skip the queue forever</div>
      </div>
      {err && <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>{err}</div>}
      <Input label="Full Name" value={form.name} onChange={set("name")} placeholder="Rahul Sharma" required />
      <Input label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="you@university.edu" required />
      <Input label="Password" type="password" value={form.pass} onChange={set("pass")} placeholder="Min 6 characters" required />
      <Input label="Confirm Password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" required />
      <Btn onClick={handle} size="lg">Create Account →</Btn>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#6B7280" }}>
        Already have an account? <span style={{ color: "#4F46E5", fontWeight: 700, cursor: "pointer" }} onClick={onGoLogin}>Log in →</span>
      </div>
    </div>
  );
}

// ─── HOME SCREEN ───────────────────────────────────────────────────────────────
function HomeScreen({ user, orders, onNewPrint, onTrack, onProfile }) {
  const myOrders = orders.filter(o => o.studentName === user.name || o.studentId === user.id).slice(0, 3);
  const activeCount = myOrders.filter(o => ["queue", "printing"].includes(o.status)).length;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F9FAFB" }}>
      {/* Header */}
      <div style={{ background: "#fff", padding: "20px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>Good morning,</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>{user.name.split(" ")[0]} 👋</div>
          </div>
          <Avatar name={user.name} size={42} />
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* Hero CTA */}
        <div
          onClick={onNewPrint}
          style={{
            background: "linear-gradient(135deg,#4F46E5,#7C3AED)",
            borderRadius: 20, padding: "24px 20px",
            marginBottom: 20, cursor: "pointer",
            position: "relative", overflow: "hidden",
          }}>
          <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginBottom: 6 }}>PrintQueue</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 16, lineHeight: 1.3 }}>Upload & print your<br />documents instantly</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.2)", borderRadius: 12,
            padding: "10px 18px", color: "#fff", fontSize: 14, fontWeight: 700,
          }}>📤 Start New Print</div>
        </div>

        {/* Active Status */}
        {activeCount > 0 && (
          <div style={{
            background: "#EEF2FF", border: "1px solid #C7D2FE",
            borderRadius: 14, padding: "14px 16px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ fontSize: 28, animation: "spin 2s linear infinite" }}>⏳</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#3730A3" }}>{activeCount} order{activeCount > 1 ? "s" : ""} in progress</div>
              <div style={{ fontSize: 13, color: "#6366F1" }}>Tap to track live status</div>
            </div>
            <Btn onClick={onTrack} variant="ghost" size="sm" style={{ width: "auto", marginLeft: "auto" }}>Track →</Btn>
          </div>
        )}

        {/* Recent Orders */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>Recent Orders</div>
          <span style={{ fontSize: 13, color: "#4F46E5", fontWeight: 600, cursor: "pointer" }} onClick={onTrack}>See all →</span>
        </div>

        {myOrders.length === 0 ? (
          <Card style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 6 }}>No orders yet</div>
            <div style={{ fontSize: 14, color: "#9CA3AF" }}>Your print history will appear here</div>
          </Card>
        ) : (
          myOrders.map(o => (
            <Card key={o.id} style={{ padding: 16, marginBottom: 10, cursor: "pointer" }} onClick={onTrack}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "#EEF2FF", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{o.fileName}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{o.copies}x · {o.color === "color" ? "Color" : "B&W"} · {o.slot}</div>
                </div>
                <Badge status={o.status} />
              </div>
            </Card>
          ))
        )}

        {/* Quick Actions */}
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: "📤", title: "New Print", sub: "Upload & submit", action: onNewPrint },
            { icon: "📍", title: "Track Order", sub: "Live status", action: onTrack },
            { icon: "💬", title: "Feedback", sub: "Rate service", action: onProfile },
            { icon: "👤", title: "Profile", sub: "Account info", action: onProfile },
          ].map(q => (
            <Card key={q.title} style={{ padding: 16, cursor: "pointer" }} onClick={q.action}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{q.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{q.title}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{q.sub}</div>
            </Card>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── UPLOAD SCREEN ─────────────────────────────────────────────────────────────
function UploadScreen({ onBack, onNext }) {
  const [shop, setShop] = useState("");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    setFile({ name: f.name, size: f.size, pages: Math.floor(Math.random() * 20) + 2 });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: 18 }}>←</button>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Upload Document</div>
      </div>
      <ProgressBar current="Uploaded" />
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Select Shop <span style={{ color: "#EF4444" }}>*</span></label>
          <select
            value={shop} onChange={e => setShop(e.target.value)}
            style={{
              width: "100%", padding: "13px 16px",
              border: "1.5px solid #E5E7EB", borderRadius: 12,
              fontFamily: "inherit", fontSize: 15, color: shop ? "#111827" : "#9CA3AF",
              background: "#F9FAFB", outline: "none", cursor: "pointer",
            }}>
            <option value="">Choose your campus shop…</option>
            {SHOPS.map(s => (
              <option key={s.id} value={s.id}>{s.name} – {s.label}</option>
            ))}
          </select>
        </div>

        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Upload File <span style={{ color: "#EF4444" }}>*</span></label>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById("fileInput").click()}
          style={{
            border: `2px dashed ${dragging ? "#4F46E5" : "#D1D5DB"}`,
            borderRadius: 16, padding: "40px 20px",
            textAlign: "center", cursor: "pointer",
            background: dragging ? "#EEF2FF" : "#FAFAFA",
            transition: "all 0.2s",
          }}>
          <input id="fileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Tap to browse files</div>
          <div style={{ fontSize: 13, color: "#9CA3AF" }}>PDF, JPG, PNG · Max 25 MB</div>
          <div style={{
            marginTop: 16, display: "inline-block",
            background: "#4F46E5", color: "#fff",
            padding: "10px 22px", borderRadius: 10,
            fontSize: 14, fontWeight: 700,
          }}>Browse Files</div>
        </div>

        {/* Demo files */}
        {!file && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 10 }}>— or try a demo file —</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Sem5_Notes.pdf", "Lab_Report.pdf", "Project_PPT.pdf"].map(n => (
                <button key={n} onClick={() => setFile({ name: n, size: 1024 * 500, pages: Math.floor(Math.random() * 20) + 4 })}
                  style={{
                    padding: "8px 14px", border: "1px solid #E5E7EB",
                    borderRadius: 8, background: "#fff", fontFamily: "inherit",
                    fontSize: 13, color: "#374151", cursor: "pointer",
                  }}>📄 {n}</button>
              ))}
            </div>
          </div>
        )}

        {file && (
          <div style={{
            marginTop: 16, background: "#EEF2FF",
            border: "1px solid #C7D2FE", borderRadius: 14,
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, background: "#4F46E5", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#3730A3" }}>{file.name}</div>
              <div style={{ fontSize: 12, color: "#6366F1" }}>
                {file.pages} pages · {(file.size / 1024).toFixed(0)} KB
              </div>
            </div>
            <button onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9CA3AF" }}>✕</button>
          </div>
        )}
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6" }}>
        <Btn onClick={() => file && shop && onNext({ file, shop })} disabled={!file || !shop} size="lg">
          Next: Print Options →
        </Btn>
      </div>
    </div>
  );
}

// ─── OPTIONS SCREEN ────────────────────────────────────────────────────────────
function OptionsScreen({ file, onBack, onNext }) {
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState("bw");
  const [pageRange, setPageRange] = useState("all");
  const [customRange, setCustomRange] = useState("");
  const [orient, setOrient] = useState("portrait");
  const pages = file?.pages || 12;
  const price = calcPrice(pages, copies, color);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: 18 }}>←</button>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Print Options</div>
      </div>
      <ProgressBar current="Options" />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px" }}>
        {/* File pill */}
        <div style={{
          background: "#F9FAFB", border: "1px solid #E5E7EB",
          borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
        }}>
          <span style={{ fontSize: 22 }}>📄</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{file?.name || "document.pdf"}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>{pages} pages detected</div>
          </div>
        </div>

        {/* Copies */}
        <Card style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Number of Copies</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setCopies(c => Math.max(1, c - 1))}
              style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 20, cursor: "pointer", fontWeight: 700, color: "#374151" }}>−</button>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#111827", minWidth: 40, textAlign: "center" }}>{copies}</span>
            <button onClick={() => setCopies(c => Math.min(50, c + 1))}
              style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 20, cursor: "pointer", fontWeight: 700, color: "#374151" }}>+</button>
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>copies</span>
          </div>
        </Card>

        {/* Color */}
        <Card style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Color Mode</div>
          <Toggle
            options={[{ value: "bw", label: "⬛ Black & White" }, { value: "color", label: "🌈 Color" }]}
            value={color} onChange={setColor}
          />
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 8, textAlign: "right" }}>
            ₹{color === "bw" ? BW_PRICE : COLOR_PRICE}/page
          </div>
        </Card>

        {/* Page Range */}
        <Card style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Page Range</div>
          <Toggle
            options={[{ value: "all", label: `All (${pages} pages)` }, { value: "custom", label: "Custom Range" }]}
            value={pageRange} onChange={setPageRange}
          />
          {pageRange === "custom" && (
            <input
              type="text" value={customRange} onChange={e => setCustomRange(e.target.value)}
              placeholder="e.g. 1-5, 8, 10-12"
              style={{
                marginTop: 12, width: "100%", padding: "11px 14px",
                border: "1.5px solid #E5E7EB", borderRadius: 10,
                fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box",
              }} />
          )}
        </Card>

        {/* Orientation */}
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Orientation</div>
          <Toggle
            options={[{ value: "portrait", label: "Portrait" }, { value: "landscape", label: "Landscape" }]}
            value={orient} onChange={setOrient}
          />
        </Card>

        {/* Price */}
        <div style={{
          background: "linear-gradient(135deg,#4F46E5,#6366F1)",
          borderRadius: 16, padding: 20, color: "#fff",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8, opacity: .85 }}>
            <span>{color === "bw" ? "B&W" : "Color"} × {pages} pages × {copies} cop{copies > 1 ? "ies" : "y"}</span>
            <span>₹{(color === "bw" ? BW_PRICE : COLOR_PRICE) * pages * copies}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8, opacity: .85 }}>
            <span>Platform fee</span><span>₹{PLATFORM_FEE}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 900, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 6 }}>
            <span>Total</span><span>₹{price}</span>
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6" }}>
        <Btn onClick={() => onNext({ copies, color, pageRange, customRange, orient, pages, price })} size="lg">
          Continue: Choose Slot →
        </Btn>
      </div>
    </div>
  );
}

// ─── SLOT SCREEN ───────────────────────────────────────────────────────────────
function SlotScreen({ shopId, onBack, onNext }) {
  const [selected, setSelected] = useState(null);
  const shopName = SHOPS.find(s => s.id === shopId)?.name || "Shop";

  const slotData = TIME_SLOTS.map((t, i) => ({
    time: t,
    count: Math.floor(Math.random() * 22),
    max: 20,
  }));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: 18 }}>←</button>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Choose Time Slot</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>{shopName}</div>
        </div>
      </div>
      <ProgressBar current="Slot" />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Queue info */}
        <div style={{
          background: "#EEF2FF", border: "1px solid #C7D2FE",
          borderRadius: 14, padding: "16px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#4F46E5", lineHeight: 1 }}>#4</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#3730A3" }}>You'll be #4 in queue</div>
            <div style={{ fontSize: 13, color: "#6366F1" }}>Est. wait: ~12 minutes</div>
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Available Slots — Today</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {slotData.map(sl => {
            const full = sl.count >= sl.max;
            const busy = sl.count >= 15;
            return (
              <div
                key={sl.time}
                onClick={() => !full && setSelected(sl.time)}
                style={{
                  border: `1.5px solid ${selected === sl.time ? "#4F46E5" : "#E5E7EB"}`,
                  borderRadius: 14, padding: "14px 12px", cursor: full ? "not-allowed" : "pointer",
                  background: selected === sl.time ? "#EEF2FF" : full ? "#F9FAFB" : "#fff",
                  opacity: full ? 0.5 : 1, textAlign: "center", transition: "all 0.15s",
                }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{sl.time}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>~{Math.max(0, sl.count * 2)}m wait</div>
                <div style={{
                  marginTop: 6, display: "inline-block", fontSize: 11, fontWeight: 700,
                  padding: "3px 8px", borderRadius: 20,
                  background: full ? "#FEE2E2" : busy ? "#FEF3C7" : "#D1FAE5",
                  color: full ? "#991B1B" : busy ? "#92400E" : "#065F46",
                }}>{full ? "Slot Full" : busy ? "Almost Full" : "Open"}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{sl.count}/{sl.max} booked</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6" }}>
        <Btn onClick={() => selected && onNext({ slot: selected })} disabled={!selected} size="lg">
          Proceed to Payment →
        </Btn>
      </div>
    </div>
  );
}

// ─── PAYMENT SCREEN ────────────────────────────────────────────────────────────
function PaymentScreen({ order, onBack, onPay }) {
  const [method, setMethod] = useState("upi");
  const [paying, setPaying] = useState(false);

  const methods = [
    { id: "upi", icon: "💳", name: "UPI", sub: "GPay, PhonePe, Paytm" },
    { id: "card", icon: "🏦", name: "Debit / Credit Card", sub: "Visa, Mastercard, RuPay" },
    { id: "wallet", icon: "👝", name: "Wallet", sub: "Paytm Wallet, Amazon Pay" },
  ];

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => { setPaying(false); onPay(); }, 1800);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: 18 }}>←</button>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Payment</div>
      </div>
      <ProgressBar current="Payment" />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Summary */}
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", marginBottom: 12 }}>Order Summary</div>
          {[
            ["File", order.file?.name || "document.pdf"],
            ["Pages", order.options?.pages || "—"],
            ["Copies", `× ${order.options?.copies || 1}`],
            ["Mode", order.options?.color === "color" ? "Color" : "B&W"],
            ["Slot", order.slot || "—"],
            ["Print cost", `₹${(order.options?.price || 0) - PLATFORM_FEE}`],
            ["Platform fee", `₹${PLATFORM_FEE}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#6B7280", marginBottom: 8 }}>
              <span>{k}</span><span style={{ color: "#111827", fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, paddingTop: 12, borderTop: "1px solid #F3F4F6", marginTop: 4 }}>
            <span>Total</span><span style={{ color: "#4F46E5" }}>₹{order.options?.price || 0}</span>
          </div>
        </Card>

        {/* Payment Methods */}
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Payment Method</div>
        {methods.map(m => (
          <div key={m.id} onClick={() => setMethod(m.id)}
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: 14,
              border: `1.5px solid ${method === m.id ? "#4F46E5" : "#E5E7EB"}`,
              borderRadius: 14, marginBottom: 10, cursor: "pointer",
              background: method === m.id ? "#EEF2FF" : "#fff", transition: "all 0.15s",
            }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{m.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{m.sub}</div>
            </div>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${method === m.id ? "#4F46E5" : "#D1D5DB"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {method === m.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4F46E5" }} />}
            </div>
          </div>
        ))}

        <div style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
          🔒 Secured by Razorpay · 256-bit SSL encryption
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6" }}>
        <Btn onClick={handlePay} disabled={paying} size="lg">
          {paying ? "Processing…" : `Pay ₹${order.options?.price || 0} & Confirm`}
        </Btn>
      </div>
    </div>
  );
}

// ─── SUCCESS SCREEN ────────────────────────────────────────────────────────────
function SuccessScreen({ order, onTrack, onHome }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", textAlign: "center" }}>
      <div style={{
        width: 90, height: 90, background: "#D1FAE5", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44,
        marginBottom: 24, animation: "popIn .4s ease",
      }}>✓</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#111827", marginBottom: 8 }}>Order Confirmed!</div>
      <div style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.6, marginBottom: 32 }}>
        Your print job has been added to the queue. You'll be notified when it's ready.
      </div>
      <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 16, padding: "16px 20px", width: "100%", marginBottom: 28, textAlign: "left" }}>
        {[["Order ID", order.id || "#PQ" + Date.now().toString().slice(-6)], ["Queue Position", "#4"], ["Slot", order.slot || "12:00 PM"], ["Pickup", "Within 30 mins of slot"]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
            <span style={{ color: "#6366F1", fontWeight: 500 }}>{k}</span>
            <span style={{ fontWeight: 700, color: "#3730A3" }}>{v}</span>
          </div>
        ))}
      </div>
      <Btn onClick={onTrack} size="lg" style={{ marginBottom: 10 }}>Track My Order →</Btn>
      <Btn onClick={onHome} variant="ghost" size="md">Back to Home</Btn>
      <style>{`@keyframes popIn{0%{transform:scale(.5);opacity:0}80%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ─── TRACKING SCREEN ───────────────────────────────────────────────────────────
function TrackingScreen({ orders, user, onHome, onFeedback }) {
  const myOrders = orders.filter(o => o.studentName === user.name || o.studentId === user.id || true).slice(0, 4);
  const [selected, setSelected] = useState(myOrders[0] || null);

  const stageMap = { queue: 0, printing: 1, ready: 2, completed: 3 };
  const stages = ["In Queue", "Printing", "Ready", "Completed"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#4F46E5", padding: "44px 24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>My Orders</div>
          <button onClick={onHome} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "8px 14px", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Home</button>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>{myOrders.length} orders found</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "#F9FAFB" }}>
        {/* Order list */}
        <div style={{ padding: "16px 16px 8px" }}>
          {myOrders.map(o => (
            <Card key={o.id} style={{ padding: 16, marginBottom: 10, cursor: "pointer", border: selected?.id === o.id ? "2px solid #4F46E5" : "1px solid #F3F4F6" }} onClick={() => setSelected(o)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 28 }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{o.fileName}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{o.slot} · {o.copies}x · {o.color === "color" ? "Color" : "B&W"}</div>
                </div>
                <Badge status={o.status} />
              </div>
            </Card>
          ))}
        </div>

        {/* Selected order detail */}
        {selected && (
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Order #{selected.id} — Live Status</div>

            {/* Progress */}
            <Card style={{ padding: 24, marginBottom: 12 }}>
              <div style={{ position: "relative", paddingBottom: 20 }}>
                <div style={{ position: "absolute", top: 18, left: 20, right: 20, height: 3, background: "#E5E7EB" }} />
                <div style={{
                  position: "absolute", top: 18, left: 20, height: 3,
                  background: "#4F46E5",
                  width: `${(stageMap[selected.status] / 3) * 100}%`,
                  transition: "width .5s",
                }} />
                <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                  {stages.map((s, i) => {
                    const done = i <= stageMap[selected.status];
                    const active = i === stageMap[selected.status];
                    return (
                      <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: done ? "#4F46E5" : "#fff",
                          border: `3px solid ${done ? "#4F46E5" : "#E5E7EB"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, color: done ? "#fff" : "#9CA3AF",
                          fontWeight: 700,
                        }}>{done && !active ? "✓" : i + 1}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: done ? "#4F46E5" : "#9CA3AF", textAlign: "center" }}>{s}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* ETA */}
            <div style={{ background: "#D1FAE5", border: "1px solid #A7F3D0", borderRadius: 14, padding: 16, marginBottom: 12, display: "flex", gap: 12 }}>
              <span style={{ fontSize: 28 }}>⏱️</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#065F46" }}>Pickup: {selected.slot} – {selected.slot.replace(/:00/, ":30")}</div>
                <div style={{ fontSize: 13, color: "#047857" }}>Head to the shop when status is "Ready"</div>
              </div>
            </div>

            {/* Details */}
            <Card style={{ padding: 16, marginBottom: 12 }}>
              {[
                ["File", selected.fileName],
                ["Pages", selected.pages],
                ["Copies", selected.copies],
                ["Color", selected.color === "color" ? "Color" : "B&W"],
                ["Status", selected.status],
                ["Amount", `₹${selected.price || "—"}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderBottom: "1px solid #F9FAFB" }}>
                  <span style={{ color: "#6B7280" }}>{k}</span>
                  <span style={{ fontWeight: 600, color: "#111827" }}>{v}</span>
                </div>
              ))}
            </Card>

            {selected.status === "ready" && (
              <Btn onClick={() => onFeedback(selected)} variant="success" size="md">
                ⭐ Rate this Order
              </Btn>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FEEDBACK SCREEN ───────────────────────────────────────────────────────────
function FeedbackScreen({ order, onSubmit, onSkip }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!rating) return;
    setDone(true);
    setTimeout(() => onSubmit({ rating, comment, orderId: order.id }), 1500);
  };

  if (done) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🙏</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 8 }}>Thank You!</div>
      <div style={{ fontSize: 15, color: "#6B7280" }}>Your feedback helps us improve.</div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Rate Your Experience</div>
        <button onClick={onSkip} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer", fontFamily: "inherit" }}>Skip</button>
      </div>
      <div style={{ flex: 1, padding: "32px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🖨️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>How was your print?</div>
          <div style={{ fontSize: 14, color: "#6B7280" }}>{order?.fileName || "Your recent order"}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Stars rating={rating} interactive onRate={setRating} />
        </div>

        {rating > 0 && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>
              {["", "Poor 😞", "Fair 😐", "Good 🙂", "Great 😊", "Excellent 🤩"][rating]}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Comments (optional)</label>
          <textarea
            value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Tell us about your experience…"
            rows={4}
            style={{
              width: "100%", padding: "13px 16px",
              border: "1.5px solid #E5E7EB", borderRadius: 12,
              fontFamily: "inherit", fontSize: 15, color: "#111827",
              background: "#F9FAFB", outline: "none", resize: "none",
              boxSizing: "border-box",
            }} />
        </div>

        <Btn onClick={submit} disabled={!rating} size="lg">Submit Feedback ⭐</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

function AdminLoginScreen({ onLogin, onBack }) {
  const [form, setForm] = useState({ email: "admin@printqueue.com", pass: "admin123" });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const [tab, setTab] = useState("login");
  const [shopForm, setShopForm] = useState({ shopName: "", block: "", email: "", pass: "" });
  const sset = k => v => setShopForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px 24px" }}>
      <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: 18, marginBottom: 24 }}>←</button>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 48, height: 48, background: "#111827", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏪</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>Admin Panel</div>
          <div style={{ fontSize: 14, color: "#6B7280" }}>Shop management console</div>
        </div>
      </div>

      <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 24 }}>
        {["login", "signup"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "10px", borderRadius: 10, border: "none",
            fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer",
            background: tab === t ? "#fff" : "transparent",
            color: tab === t ? "#111827" : "#6B7280",
            boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
          }}>{t === "login" ? "Admin Login" : "Register Shop"}</button>
        ))}
      </div>

      {tab === "login" ? (
        <>
          <Input label="Admin Email" type="email" value={form.email} onChange={set("email")} placeholder="admin@shop.com" />
          <Input label="Password" type="password" value={form.pass} onChange={set("pass")} placeholder="Admin password" />
          <Btn onClick={() => onLogin({ name: "Shop Admin", email: form.email, role: "admin", id: "admin_1", shopId: "b25" })} size="lg">
            Login as Admin →
          </Btn>
        </>
      ) : (
        <>
          <Input label="Shop Name" value={shopForm.shopName} onChange={sset("shopName")} placeholder="My Print Shop" />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Block Number</label>
            <select onChange={e => sset("block")(e.target.value)} style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontFamily: "inherit", fontSize: 15, background: "#F9FAFB", outline: "none" }}>
              <option value="">Select block…</option>
              {SHOPS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Input label="Email" type="email" value={shopForm.email} onChange={sset("email")} placeholder="shop@email.com" />
          <Input label="Password" type="password" value={shopForm.pass} onChange={sset("pass")} placeholder="Set password" />
          <Btn onClick={() => onLogin({ name: shopForm.shopName || "New Shop", email: shopForm.email, role: "admin", id: "admin_new", shopId: shopForm.block })} size="lg">
            Register Shop →
          </Btn>
        </>
      )}
    </div>
  );
}

// ─── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminDashboard({ orders, workers, feedback, admin, onLogout, onWorkers, onFeedbackView, onSlots }) {
  const shopOrders = orders.filter(o => o.shopId === admin.shopId);
  const stats = {
    total: shopOrders.length,
    queue: shopOrders.filter(o => o.status === "queue").length,
    printing: shopOrders.filter(o => o.status === "printing").length,
    ready: shopOrders.filter(o => o.status === "ready").length,
    earnings: shopOrders.filter(o => o.payment === "paid").reduce((s, o) => s + (o.price || 0), 0),
  };
  const shopName = SHOPS.find(s => s.id === admin.shopId)?.name || "Your Shop";

  const [localOrders, setLocalOrders] = useState(shopOrders);
  const [activeTab, setActiveTab] = useState("orders");

  const updateStatus = (id, status) => {
    setLocalOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#111827", padding: "44px 24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: ".08em" }}>Shop Admin</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{shopName}</div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "8px 14px", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: "#111827", padding: "0 16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Total", val: stats.total, color: "#6366F1" },
            { label: "In Queue", val: stats.queue, color: "#F59E0B" },
            { label: "Printing", val: stats.printing, color: "#3B82F6" },
            { label: "Ready", val: stats.ready, color: "#10B981" },
            { label: "Earnings", val: `₹${stats.earnings}`, color: "#F59E0B" },
            { label: "Workers", val: workers.filter(w => w.shopId === admin.shopId).length, color: "#8B5CF6" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #F3F4F6", overflowX: "auto" }}>
        {[["orders", "📋 Orders"], ["workers", "👷 Workers"], ["slots", "🕐 Slots"], ["feedback", "⭐ Feedback"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex: 1, padding: "14px 12px", border: "none", background: "transparent",
            fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer",
            color: activeTab === id ? "#4F46E5" : "#6B7280",
            borderBottom: `2px solid ${activeTab === id ? "#4F46E5" : "transparent"}`,
            whiteSpace: "nowrap",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "#F9FAFB", padding: "16px" }}>
        {activeTab === "orders" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Incoming Orders (FIFO)</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", background: "#D1FAE5", padding: "4px 10px", borderRadius: 20 }}>● Live</div>
            </div>
            {localOrders.length === 0 && (
              <Card style={{ padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>No orders yet</div>
              </Card>
            )}
            {localOrders.map((o, idx) => (
              <Card key={o.id} style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{o.studentName}</div>
                    <div style={{ fontSize: 13, color: "#6B7280" }}>{o.fileName}</div>
                  </div>
                  <div style={{ background: "#EEF2FF", color: "#4F46E5", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>#{idx + 1} in queue</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {[`📄 ${o.pages} pages`, `${o.color === "color" ? "🌈 Color" : "⬛ B&W"}`, `× ${o.copies} copies`, `🕐 ${o.slot}`, `₹${o.price || "—"}`].map(tag => (
                    <span key={tag} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#F3F4F6", color: "#374151" }}>{tag}</span>
                  ))}
                  <Badge status={o.payment} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {o.status === "queue" && (
                    <>
                      <button onClick={() => updateStatus(o.id, "printing")} style={{ flex: 1, padding: "10px", background: "#F59E0B", color: "#fff", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🖨 Start Printing</button>
                      <button onClick={() => updateStatus(o.id, "rejected")} style={{ flex: 1, padding: "10px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✕ Reject</button>
                    </>
                  )}
                  {o.status === "printing" && (
                    <button onClick={() => updateStatus(o.id, "ready")} style={{ flex: 1, padding: "10px", background: "#10B981", color: "#fff", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✓ Mark Ready</button>
                  )}
                  {o.status === "ready" && (
                    <button onClick={() => updateStatus(o.id, "completed")} style={{ flex: 1, padding: "10px", background: "#6366F1", color: "#fff", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>📦 Mark Collected</button>
                  )}
                  {(o.status === "completed" || o.status === "rejected") && (
                    <span style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic" }}>Order {o.status}</span>
                  )}
                </div>
              </Card>
            ))}
          </>
        )}

        {activeTab === "workers" && <WorkerPanel workers={workers.filter(w => w.shopId === admin.shopId)} orders={localOrders} />}
        {activeTab === "slots" && <SlotPanel />}
        {activeTab === "feedback" && <FeedbackPanel feedback={feedback} />}
      </div>
    </div>
  );
}

// ─── WORKER PANEL ──────────────────────────────────────────────────────────────
function WorkerPanel({ workers: initWorkers, orders }) {
  const [workers, setWorkers] = useState(initWorkers);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  const addWorker = () => {
    if (!newName) return;
    setWorkers(ws => [...ws, { id: genId("w"), name: newName, shopId: "b25", status: "active", assignedOrders: [] }]);
    setNewName(""); setShowAdd(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Workers ({workers.length})</div>
        <button onClick={() => setShowAdd(true)} style={{ background: "#4F46E5", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add Worker</button>
      </div>

      {showAdd && (
        <Card style={{ padding: 16, marginBottom: 12 }}>
          <Input label="Worker Name" value={newName} onChange={setNewName} placeholder="Full name" />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={addWorker} size="sm" style={{ width: "auto", flex: 1 }}>Add</Btn>
            <Btn onClick={() => setShowAdd(false)} variant="secondary" size="sm" style={{ width: "auto", flex: 1 }}>Cancel</Btn>
          </div>
        </Card>
      )}

      {workers.map(w => {
        const assigned = orders.filter(o => o.workerId === w.id);
        return (
          <Card key={w.id} style={{ padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Avatar name={w.name} size={40} bg="#6366F1" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{w.name}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{assigned.length} assigned order{assigned.length !== 1 ? "s" : ""}</div>
              </div>
              <Badge status={w.status === "active" ? "printing" : "completed"} />
            </div>
            {assigned.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 8 }}>Assigned Orders:</div>
                {assigned.map(o => (
                  <div key={o.id} style={{ fontSize: 13, color: "#374151", padding: "6px 0", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between" }}>
                    <span>{o.fileName}</span><Badge status={o.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      {workers.length === 0 && (
        <Card style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👷</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>No workers yet</div>
          <div style={{ fontSize: 14, color: "#9CA3AF" }}>Add your first worker above</div>
        </Card>
      )}
    </div>
  );
}

// ─── SLOT PANEL ────────────────────────────────────────────────────────────────
function SlotPanel() {
  const [slots, setSlots] = useState(
    TIME_SLOTS.map(t => ({ time: t, max: 20, enabled: true, booked: Math.floor(Math.random() * 15) }))
  );

  const toggle = (i) => setSlots(ss => ss.map((s, idx) => idx === i ? { ...s, enabled: !s.enabled } : s));
  const setMax = (i, max) => setSlots(ss => ss.map((s, idx) => idx === i ? { ...s, max: Number(max) } : s));

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Slot Management</div>
      {slots.map((sl, i) => (
        <Card key={sl.time} style={{ padding: 14, marginBottom: 8, opacity: sl.enabled ? 1 : 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{sl.time}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{sl.booked}/{sl.max} booked</div>
              <div style={{ marginTop: 6, height: 4, background: "#F3F4F6", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (sl.booked / sl.max) * 100)}%`, background: sl.booked / sl.max > .8 ? "#EF4444" : "#4F46E5", borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="number" value={sl.max} min={1} max={100} onChange={e => setMax(i, e.target.value)}
                style={{ width: 50, padding: "6px", border: "1px solid #E5E7EB", borderRadius: 8, fontFamily: "inherit", fontSize: 13, textAlign: "center" }} />
              <button onClick={() => toggle(i)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", fontFamily: "inherit",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: sl.enabled ? "#D1FAE5" : "#FEE2E2",
                color: sl.enabled ? "#065F46" : "#991B1B",
              }}>{sl.enabled ? "On" : "Off"}</button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── FEEDBACK PANEL ────────────────────────────────────────────────────────────
function FeedbackPanel({ feedback }) {
  const avg = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "—";

  return (
    <div>
      {/* Average */}
      <Card style={{ padding: 20, marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#F59E0B" }}>{avg}</div>
        <Stars rating={Math.round(Number(avg))} />
        <div style={{ fontSize: 14, color: "#6B7280", marginTop: 8 }}>Average from {feedback.length} reviews</div>
      </Card>

      {feedback.map(f => (
        <Card key={f.id} style={{ padding: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Avatar name={f.studentName} size={36} bg="#8B5CF6" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{f.studentName}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>{timeAgo(f.timestamp)}</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <Stars rating={f.rating} />
            </div>
          </div>
          {f.comment && <div style={{ fontSize: 14, color: "#374151", background: "#F9FAFB", padding: "10px 14px", borderRadius: 10 }}>{f.comment}</div>}
        </Card>
      ))}

      {feedback.length === 0 && (
        <Card style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>No feedback yet</div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════════════════════════════════════
function BottomNav({ active, onChange }) {
  const items = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "upload", icon: "📤", label: "Print" },
    { id: "orders", icon: "📋", label: "Orders" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  return (
    <div style={{
      display: "flex", background: "#fff", borderTop: "1px solid #F3F4F6",
      padding: "8px 0 16px", flexShrink: 0,
    }}>
      {items.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          background: "none", border: "none", cursor: "pointer", padding: "6px",
          borderRadius: 10, transition: "background .15s",
        }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: active === item.id ? "#4F46E5" : "#9CA3AF" }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── PROFILE SCREEN ────────────────────────────────────────────────────────────
function ProfileScreen({ user, onLogout }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F9FAFB" }}>
      <div style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", padding: "48px 24px 32px", textAlign: "center" }}>
        <Avatar name={user.name} size={72} bg="rgba(255,255,255,0.2)" />
        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginTop: 12 }}>{user.name}</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>{user.email}</div>
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, display: "inline-block", padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#fff", marginTop: 8, textTransform: "uppercase" }}>Student</div>
      </div>
      <div style={{ padding: 16 }}>
        {[
          { icon: "📋", label: "My Orders", sub: "View print history" },
          { icon: "💳", label: "Payment History", sub: "Past transactions" },
          { icon: "🔔", label: "Notifications", sub: "Order alerts" },
          { icon: "🔒", label: "Change Password", sub: "Security settings" },
          { icon: "📞", label: "Help & Support", sub: "Contact us" },
        ].map(item => (
          <Card key={item.label} style={{ padding: 16, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, background: "#EEF2FF", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>{item.sub}</div>
            </div>
            <span style={{ fontSize: 18, color: "#D1D5DB" }}>›</span>
          </Card>
        ))}
        <div style={{ marginTop: 8 }}>
          <Btn onClick={onLogout} variant="danger" size="md">Logout</Btn>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState(INIT_ORDERS);
  const [workers] = useState([]);
  const [feedback, setFeedback] = useState(INIT_FEEDBACK);
  const [nav, setNav] = useState("home");
  const [uploadData, setUploadData] = useState(null);
  const [optionsData, setOptionsData] = useState(null);
  const [slotData, setSlotData] = useState(null);
  const [feedbackOrder, setFeedbackOrder] = useState(null);

  const go = useCallback((s) => setScreen(s), []);

  const handleLogin = (u) => { setUser(u); go(u.role === "admin" ? "admin" : "home"); };
  const handleLogout = () => { setUser(null); setScreen("login"); };

  const handlePaySuccess = () => {
    const newOrder = {
      id: genId("PQ"),
      studentId: user.id,
      studentName: user.name,
      shopId: uploadData?.shop || "b25",
      fileName: uploadData?.file?.name || "document.pdf",
      pages: optionsData?.pages || 12,
      copies: optionsData?.copies || 1,
      color: optionsData?.color || "bw",
      orientation: optionsData?.orient || "portrait",
      pageRange: optionsData?.pageRange || "all",
      slot: slotData?.slot || "12:00 PM",
      status: "queue",
      payment: "paid",
      timestamp: Date.now(),
      workerId: null,
      price: optionsData?.price || 0,
    };
    setOrders(os => [newOrder, ...os]);
    go("success");
  };

  // Screen routing
  if (screen === "splash") return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'DM Sans','Nunito','Segoe UI',sans-serif" }}>
      <Splash onDone={() => go("login")} />
    </div>
  );

  const containerStyle = {
    width: "100%", minHeight: "100vh",
    display: "flex", flexDirection: "column",
    fontFamily: "'DM Sans','Nunito','Segoe UI',sans-serif",
    background: "#fff", maxWidth: 430, margin: "0 auto",
    boxShadow: "0 0 60px rgba(0,0,0,0.1)",
  };

  // Auth screens
  if (!user || screen === "login") return (
    <div style={containerStyle}>
      {screen === "admin-login"
        ? <AdminLoginScreen onLogin={handleLogin} onBack={() => go("login")} />
        : screen === "signup"
          ? <SignupScreen onSignup={handleLogin} onGoLogin={() => go("login")} />
          : <LoginScreen onLogin={handleLogin} onGoSignup={() => go("signup")} onAdminLogin={() => go("admin-login")} />
      }
    </div>
  );

  // Admin screens
  if (user.role === "admin") return (
    <div style={containerStyle}>
      {screen === "admin" && <AdminDashboard orders={orders} workers={workers} feedback={feedback} admin={user} onLogout={handleLogout} />}
    </div>
  );

  // Student screens
  return (
    <div style={containerStyle}>
      {screen === "home" && nav === "home" && <HomeScreen user={user} orders={orders} onNewPrint={() => { go("upload"); setNav("upload"); }} onTrack={() => { go("track"); setNav("orders"); }} onProfile={() => { setNav("profile"); go("profile"); }} />}
      {screen === "home" && nav === "profile" && <ProfileScreen user={user} onLogout={handleLogout} />}
      {screen === "home" && nav === "orders" && <TrackingScreen orders={orders} user={user} onHome={() => setNav("home")} onFeedback={(o) => { setFeedbackOrder(o); go("feedback"); }} />}
      {screen === "home" && nav === "upload" && <UploadScreen onBack={() => setNav("home")} onNext={d => { setUploadData(d); go("options"); }} />}

      {screen === "upload" && <UploadScreen onBack={() => { go("home"); setNav("home"); }} onNext={d => { setUploadData(d); go("options"); }} />}
      {screen === "options" && <OptionsScreen file={uploadData?.file} onBack={() => go("upload")} onNext={d => { setOptionsData(d); go("slot"); }} />}
      {screen === "slot" && <SlotScreen shopId={uploadData?.shop} onBack={() => go("options")} onNext={d => { setSlotData(d); go("payment"); }} />}
      {screen === "payment" && <PaymentScreen order={{ file: uploadData?.file, options: optionsData, slot: slotData?.slot }} onBack={() => go("slot")} onPay={handlePaySuccess} />}
      {screen === "success" && <SuccessScreen order={{ id: genId("PQ"), slot: slotData?.slot }} onTrack={() => { go("home"); setNav("orders"); }} onHome={() => { go("home"); setNav("home"); }} />}
      {screen === "track" && <TrackingScreen orders={orders} user={user} onHome={() => { go("home"); setNav("home"); }} onFeedback={(o) => { setFeedbackOrder(o); go("feedback"); }} />}
      {screen === "feedback" && <FeedbackScreen order={feedbackOrder} onSubmit={fb => { setFeedback(f => [...f, { id: genId("f"), ...fb, studentName: user.name, timestamp: Date.now() }]); go("home"); setNav("home"); }} onSkip={() => { go("home"); setNav("home"); }} />}

      {/* Bottom Nav — show on home screens */}
      {screen === "home" && (
        <BottomNav active={nav} onChange={n => { setNav(n); if (n === "upload") go("upload"); }} />
      )}
    </div>
  );
}
