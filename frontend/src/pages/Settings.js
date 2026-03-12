import { BsMoon, BsSun } from "react-icons/bs";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logoutUser, loadUser } from "../redux/reducers/authSlice";
import API from "../utils/api";
import toast from "react-hot-toast";
import {
  AiOutlineUser, AiOutlineLock, AiOutlineBell,
  AiOutlineEye, AiOutlineDelete, AiOutlineLogout,
  AiOutlineRight, AiOutlineCheck, AiOutlineMoon,
  AiOutlineInfoCircle, AiOutlineShoppingCart,
  AiOutlineWarning,
import { AiOutlineBell, AiOutlineDelete, AiOutlineEye, AiOutlineInfoCircle, AiOutlineLock, AiOutlineLogout, AiOutlineRight, AiOutlineShoppingCart, AiOutlineUser, AiOutlineWarning } from "react-icons/ai";

const SettingsSection = ({ title, children }) => (
  <div className="settings-section">
    <div className="settings-section-title">{title}</div>
    <div className="settings-section-body">{children}</div>
  </div>
);

const SettingsRow = ({ icon, label, sublabel, onClick, right, danger }) => (
  <button className={`settings-row ${danger ? "danger" : ""}`} onClick={onClick}>
    <span className="settings-row-icon">{icon}</span>
    <div className="settings-row-text">
      <span className="settings-row-label">{label}</span>
      {sublabel && <span className="settings-row-sub">{sublabel}</span>}
    </div>
    <span className="settings-row-right">{right || <AiOutlineRight />}</span>
  </button>
);

const ToggleRow = ({ icon, label, sublabel, value, onChange }) => (
  <div className="settings-row" style={{ cursor:"default" }}>
    <span className="settings-row-icon">{icon}</span>
    <div className="settings-row-text">
      <span className="settings-row-label">{label}</span>
      {sublabel && <span className="settings-row-sub">{sublabel}</span>}
    </div>
    <button
      className={`settings-toggle ${value ? "on" : ""}`}
      onClick={onChange}
    >
      <span className="settings-toggle-thumb" />
    </button>
  </div>
);

/* ── Change Password Modal ── */
const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({ oldPassword:"", newPassword:"", confirmPassword:"" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirmPassword) return toast.error("Passwords don't match");
    if (form.newPassword.length < 6) return toast.error("Min 6 characters");
    setLoading(true);
    try {
      await API.put("/user/password", { oldPassword: form.oldPassword, newPassword: form.newPassword });
      toast.success("Password changed!");
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom:20 }}>Change Password</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { key:"oldPassword",     label:"Current Password" },
            { key:"newPassword",     label:"New Password" },
            { key:"confirmPassword", label:"Confirm New Password" },
          ].map(f => (
            <div key={f.key} className="edit-field">
              <label>{f.label}</label>
              <input
                type="password"
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.label}
              />
            </div>
          ))}
        </div>
        <div className="modal-actions" style={{ marginTop:20 }}>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width:"auto", padding:"10px 24px" }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving…" : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Delete Account Modal ── */
const DeleteAccountModal = ({ onClose, onConfirm }) => {
  const [confirm, setConfirm] = useState("");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <AiOutlineWarning style={{ fontSize:44, color:"#ef4444" }} />
          <h3 style={{ marginTop:10, color:"#ef4444" }}>Delete Account</h3>
          <p style={{ fontSize:14, color:"var(--text-2)", marginTop:8, lineHeight:1.6 }}>
            This will permanently delete your account, all posts, and data. This cannot be undone.
          </p>
        </div>
        <div className="edit-field">
          <label>Type <strong>DELETE</strong> to confirm</label>
          <input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Type DELETE"
            style={{ borderColor: confirm === "DELETE" ? "#ef4444" : undefined }}
          />
        </div>
        <div className="modal-actions" style={{ marginTop:20 }}>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            onClick={() => confirm === "DELETE" && onConfirm()}
            style={{ width:"auto", padding:"10px 20px", background:"#ef4444", color:"#fff", border:"none", borderRadius:"var(--radius-sm)", fontSize:14, fontWeight:600, cursor: confirm==="DELETE"?"pointer":"not-allowed", opacity: confirm==="DELETE"?1:0.5, fontFamily:"var(--font-body)" }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Settings({ darkMode, toggleDark }) {
  const { user }    = useSelector(s => s.auth);
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const [modal, setModal]   = useState(null); // "password" | "delete"
  const [notifs, setNotifs] = useState({ likes:true, comments:true, follows:true, messages:true });
  const [privacy, setPrivacy] = useState({ privateAccount:false, showActivity:true });

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logged out!");
    navigate("/login");
  };

  const handleDelete = async () => {
    try {
      await API.delete("/user/me");
      toast.success("Account deleted");
      navigate("/login");
    } catch { toast.error("Failed to delete account"); }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <h2>Settings</h2>
      </div>

      {/* Profile quick card */}
      <div className="settings-profile-card">
        {user?.avatar?.url
          ? <img src={user.avatar.url} alt={user.username} />
          : <div className="avatar-fallback" style={{ width:52, height:52, fontSize:18 }}>{user?.username?.[0]?.toUpperCase()}</div>
        }
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>{user?.username}</div>
          <div style={{ fontSize:13, color:"var(--text-3)" }}>{user?.email}</div>
        </div>
        <Link to="/edit-profile" className="btn-ghost" style={{ fontSize:12, padding:"6px 14px" }}>
          Edit
        </Link>
      </div>

      {/* Account */}
      <SettingsSection title="Account">
        <SettingsRow icon={<AiOutlineUser />}  label="Edit Profile"     sublabel="Name, bio, avatar"       onClick={() => navigate("/edit-profile")} />
        <SettingsRow icon={<AiOutlineLock />}  label="Change Password"  sublabel="Update your password"    onClick={() => setModal("password")} />
        <SettingsRow icon={<AiOutlineShoppingCart />} label="My Orders"  sublabel="Track your purchases"   onClick={() => navigate("/my-orders")} />
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance">
        <ToggleRow
          icon={darkMode ? <BsMoon /> : <BsSun />}
          label="Dark Mode"
          sublabel={darkMode ? "Currently dark" : "Currently light"}
          value={darkMode}
          onChange={toggleDark}
        />
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="Notifications">
        <ToggleRow icon={<AiOutlineBell />} label="Likes"     sublabel="When someone likes your post" value={notifs.likes}    onChange={() => setNotifs(p => ({ ...p, likes:    !p.likes    }))} />
        <ToggleRow icon={<AiOutlineBell />} label="Comments"  sublabel="When someone comments"        value={notifs.comments} onChange={() => setNotifs(p => ({ ...p, comments: !p.comments }))} />
        <ToggleRow icon={<AiOutlineBell />} label="New Followers" sublabel="When someone follows you" value={notifs.follows}  onChange={() => setNotifs(p => ({ ...p, follows:  !p.follows  }))} />
        <ToggleRow icon={<AiOutlineBell />} label="Messages"  sublabel="New message notifications"    value={notifs.messages} onChange={() => setNotifs(p => ({ ...p, messages: !p.messages }))} />
      </SettingsSection>

      {/* Privacy */}
      <SettingsSection title="Privacy">
        <ToggleRow icon={<AiOutlineEye />}  label="Private Account" sublabel="Only followers see your posts" value={privacy.privateAccount} onChange={() => setPrivacy(p => ({ ...p, privateAccount:!p.privateAccount }))} />
        <ToggleRow icon={<AiOutlineEye />}  label="Show Activity"   sublabel="Show when you were last active" value={privacy.showActivity}   onChange={() => setPrivacy(p => ({ ...p, showActivity:  !p.showActivity   }))} />
      </SettingsSection>

      {/* About */}
      <SettingsSection title="About">
        <SettingsRow icon={<AiOutlineInfoCircle />} label="Version" sublabel="VibeSpace v1.0.0" right={<span style={{ fontSize:12, color:"var(--text-3)" }}>v1.0</span>} onClick={() => {}} />
      </SettingsSection>

      {/* Danger zone */}
      <SettingsSection title="Account Actions">
        <SettingsRow icon={<AiOutlineLogout />} label="Log Out"        sublabel="Sign out of your account" onClick={handleLogout} danger />
        <SettingsRow icon={<AiOutlineDelete />} label="Delete Account" sublabel="Permanently delete everything" onClick={() => setModal("delete")} danger />
      </SettingsSection>

      {/* Modals */}
      {modal === "password" && <ChangePasswordModal onClose={() => setModal(null)} />}
      {modal === "delete"   && <DeleteAccountModal  onClose={() => setModal(null)} onConfirm={handleDelete} />}
    </div>
  );
}