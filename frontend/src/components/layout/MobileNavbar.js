import { AiFillBell, AiFillCompass, AiFillHome, AiOutlineBell, AiOutlineCamera, AiOutlineClose, AiOutlineCompass, AiOutlineHome, AiOutlinePlus, AiOutlineUser } from "react-icons/ai";
import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getFeedPosts } from "../../redux/reducers/postSlice";
import API from "../../utils/api";
import toast from "react-hot-toast";
/* ── Mini create post modal ── */
const CreatePostModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const [caption, setCaption]   = useState("");
  const [image, setImage]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [isForSale, setIsForSale] = useState(false);
  const [price, setPrice]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleImage = e => {
    const file = e.target.files[0];
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async () => {
    if (!image) return toast.error("Please select an image");
    setLoading(true);
    const data = new FormData();
    data.append("image", image);
    data.append("caption", caption);
    data.append("isForSale", isForSale);
    if (isForSale && price) data.append("price", price);
    try {
      await API.post("/post/new", data);
      toast.success("Post shared!");
      dispatch(getFeedPosts());
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex:500, alignItems:"flex-end", padding:0 }}>
      <div className="mobile-create-modal" onClick={e => e.stopPropagation()}>
        {/* Handle bar */}
        <div className="mobile-modal-handle" />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ margin:0, fontFamily:"var(--font-serif)", fontStyle:"italic", fontWeight:500 }}>New Post</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", fontSize:20 }}>
            <AiOutlineClose />
          </button>
        </div>

        <label htmlFor="mob-post-img" className="upload-area" style={{ cursor:"pointer", marginBottom:14, minHeight:120 }}>
          {preview
            ? <img src={preview} alt="preview" style={{ maxHeight:220, borderRadius:10, objectFit:"cover", width:"100%" }} />
            : <><AiOutlineCamera style={{ fontSize:36, color:"var(--text-3)", display:"block", marginBottom:8 }} /><p style={{ fontSize:13 }}>Tap to select image</p></>
          }
        </label>
        <input id="mob-post-img" type="file" accept="image/*" hidden onChange={handleImage} />

        <textarea
          value={caption} onChange={e => setCaption(e.target.value)}
          placeholder="Write a caption…" rows={3}
          style={{ width:"100%", padding:"10px 14px", border:"1.5px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:14, resize:"none", outline:"none", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--font-body)", boxSizing:"border-box", marginBottom:12 }}
        />

        <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:14, marginBottom:10, cursor:"pointer" }}>
          <input type="checkbox" checked={isForSale} onChange={e => setIsForSale(e.target.checked)} />
          💰 List for sale
        </label>
        {isForSale && (
          <input type="number" placeholder="Price (USD)" value={price} onChange={e => setPrice(e.target.value)}
            style={{ width:"100%", padding:"10px 14px", border:"1.5px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:14, outline:"none", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--font-body)", boxSizing:"border-box", marginBottom:10 }} />
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading || !image} style={{ marginTop:4 }}>
          {loading ? "Posting…" : "Share Post"}
        </button>
      </div>
    </div>
  );
};

export default function MobileNavbar() {
  const { user }          = useSelector(s => s.auth);
  const { unreadCount }   = useSelector(s => s.notifications);
  const location          = useLocation();
  const navigate          = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const isActive = path => location.pathname === path;

  return (
    <>
      <nav className="mobile-bottom-nav">
        {/* Home */}
        <NavLink to="/" className={`mobile-nav-item ${isActive("/") ? "active" : ""}`}>
          <span className="mobile-nav-icon">
            {isActive("/") ? <AiFillHome /> : <AiOutlineHome />}
          </span>
          {isActive("/") && <span className="mobile-nav-dot" />}
        </NavLink>

        {/* Explore */}
        <NavLink to="/explore" className={`mobile-nav-item ${isActive("/explore") ? "active" : ""}`}>
          <span className="mobile-nav-icon">
            {isActive("/explore") ? <AiFillCompass /> : <AiOutlineCompass />}
          </span>
          {isActive("/explore") && <span className="mobile-nav-dot" />}
        </NavLink>

        {/* Create post — center button */}
        <button className="mobile-nav-item create" onClick={() => setShowCreate(true)}>
          <span className="mobile-nav-create-icon"><AiOutlinePlus /></span>
        </button>

        {/* Notifications */}
        <NavLink to="/notifications" className={`mobile-nav-item ${isActive("/notifications") ? "active" : ""}`}>
          <span className="mobile-nav-icon" style={{ position:"relative" }}>
            {isActive("/notifications") ? <AiFillBell /> : <AiOutlineBell />}
            {unreadCount > 0 && (
              <span className="mobile-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </span>
          {isActive("/notifications") && <span className="mobile-nav-dot" />}
        </NavLink>

        {/* Profile */}
        <NavLink
          to={user ? `/profile/${user.username}` : "/login"}
          className={`mobile-nav-item ${location.pathname.startsWith("/profile") ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">
            {user?.avatar?.url
              ? <img src={user.avatar.url} alt="" className={`mobile-nav-avatar ${location.pathname.startsWith("/profile") ? "active" : ""}`} />
              : <AiOutlineUser />
            }
          </span>
          {location.pathname.startsWith("/profile") && <span className="mobile-nav-dot" />}
        </NavLink>
      </nav>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </>
  );
}