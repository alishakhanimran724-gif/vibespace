import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { loadUser } from "../redux/reducers/authSlice";
import toast from "react-hot-toast";
import { AiOutlineCamera, AiOutlineClose } from "react-icons/ai";

const EditProfile = () => {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileRef  = useRef();

  const [form, setForm] = useState({
    name:    user?.name    || "",
    bio:     user?.bio     || "",
    website: user?.website || "",
  });
  const [avatar,   setAvatar]   = useState(null);
  const [preview,  setPreview]  = useState(user?.avatar?.url || null);
  const [loading,  setLoading]  = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /* Drag & drop avatar */
  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) { setAvatar(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append("name",    form.name);
      data.append("bio",     form.bio);
      data.append("website", form.website);
      if (avatar) data.append("avatar", avatar);

      await API.put("/user/update", data);
      await dispatch(loadUser());
      toast.success("Profile updated!");
      navigate(`/profile/${user.username}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
    setLoading(false);
  };

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-card">
        <div className="edit-profile-header">
          <h2>Edit Profile</h2>
          <button onClick={() => navigate(-1)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", fontSize:20, display:"flex" }}>
            <AiOutlineClose />
          </button>
        </div>

        {/* Avatar upload — drag & drop */}
        <div className="edit-avatar-section">
          <div
            className={`edit-avatar-wrap ${dragOver ? "drag-over" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            {preview
              ? <img src={preview} alt="avatar" className="edit-avatar-img" />
              : <div className="avatar-fallback edit-avatar-img" style={{ fontSize:36 }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
            }
            <div className="edit-avatar-overlay">
              <AiOutlineCamera style={{ fontSize:22 }} />
              <span style={{ fontSize:11, marginTop:4 }}>Change</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          <div style={{ fontSize:12, color:"var(--text-3)", marginTop:8, textAlign:"center" }}>
            Click or drag & drop to change photo
          </div>
        </div>

        {/* Form fields */}
        <div className="edit-fields">
          <div className="edit-field">
            <label>Full Name</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Your full name"
              maxLength={50}
            />
          </div>

          <div className="edit-field">
            <label>Username</label>
            <input value={user?.username || ""} disabled
              style={{ opacity:0.5, cursor:"not-allowed" }} />
            <span style={{ fontSize:11, color:"var(--text-3)", marginTop:4 }}>Username cannot be changed</span>
          </div>

          <div className="edit-field">
            <label>Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Tell people about yourself…"
              rows={3}
              maxLength={150}
            />
            <span style={{ fontSize:11, color:"var(--text-3)", marginTop:4, textAlign:"right", display:"block" }}>
              {form.bio.length}/150
            </span>
          </div>

          <div className="edit-field">
            <label>Website</label>
            <input
              value={form.website}
              onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
              type="url"
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button className="btn-cancel" onClick={() => navigate(-1)} style={{ flex:1 }}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={loading} style={{ flex:2 }}>
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;