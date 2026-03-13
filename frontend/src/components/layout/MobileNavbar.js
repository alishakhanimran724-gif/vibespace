import {
  AiFillBell, AiFillCompass, AiFillHome,
  AiOutlineBell, AiOutlineCamera, AiOutlineClose,
  AiOutlineCompass, AiOutlineHome, AiOutlinePlus,
  AiOutlineUser, AiOutlineShoppingCart, AiOutlineMessage,
  AiOutlineVideoCamera,
} from "react-icons/ai";
import { BsFillChatFill, BsChat, BsShop, BsShopWindow, BsCameraVideo, BsCameraVideoFill } from "react-icons/bs";
import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getFeedPosts } from "../../redux/reducers/postSlice";
import API from "../../utils/api";
import toast from "react-hot-toast";

/* ── Mini create post modal ── */
const CreatePostModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const [caption, setCaption]     = useState("");
  const [image, setImage]         = useState(null);
  const [preview, setPreview]     = useState(null);
  const [isForSale, setIsForSale] = useState(false);
  const [price, setPrice]         = useState("");
  const [loading, setLoading]     = useState(false);

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
    if (isForSale) {
      data.append("isForSale", "true");
      if (price) data.append("price", price);
    }
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
        <div className="mobile-modal-handle" />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ margin:0, fontFamily:"var(--font-serif)", fontWeight:700 }}>New Post</h3>
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

/* ── Nav Item ── */
const NavItem = ({ to, icon, activeIcon, label, badge, isActive }) => (
  <NavLink to={to} className={`mobile-nav-item ${isActive ? "active" : ""}`}>
    <span className="mobile-nav-icon" style={{ position:"relative" }}>
      {isActive ? activeIcon : icon}
      {badge > 0 && (
        <span className="mobile-notif-badge">{badge > 9 ? "9+" : badge}</span>
      )}
    </span>
    <span className="mobile-nav-label">{label}</span>
  </NavLink>
);

export default function MobileNavbar() {
  const { user }        = useSelector(s => s.auth);
  const { unreadCount } = useSelector(s => s.notifications);
  const location        = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [showMore, setShowMore]     = useState(false);

  const p = location.pathname;

  // Hide on reels page (fullscreen)
  if (p === "/reels") return null;

  return (
    <>
      <nav className="mobile-bottom-nav">

        {/* Home */}
        <NavItem to="/" icon={<AiOutlineHome />} activeIcon={<AiFillHome />}
          label="Home" isActive={p === "/"} />

        {/* Explore */}
        <NavItem to="/explore" icon={<AiOutlineCompass />} activeIcon={<AiFillCompass />}
          label="Explore" isActive={p === "/explore"} />

        {/* Create — center gradient button */}
        <button className="mobile-nav-item create" onClick={() => setShowCreate(true)}>
          <span className="mobile-nav-create-icon"><AiOutlinePlus /></span>
          <span className="mobile-nav-label">Post</span>
        </button>

        {/* Reels */}
        <NavItem to="/reels" icon={<BsCameraVideo />} activeIcon={<BsCameraVideoFill />}
          label="Reels" isActive={p === "/reels"} />

        {/* Chat */}
        <NavItem to="/chat" icon={<BsChat />} activeIcon={<BsFillChatFill />}
          label="Chat" isActive={p === "/chat"} />

        {/* More — dots menu */}
        <button className="mobile-nav-item" onClick={() => setShowMore(m => !m)}
          style={{ background:"none", border:"none", cursor:"pointer" }}>
          <span className="mobile-nav-icon" style={{ fontSize:20 }}>⋯</span>
          <span className="mobile-nav-label">More</span>
        </button>

      </nav>

      {/* More drawer */}
      {showMore && (
        <div className="mobile-more-drawer" onClick={() => setShowMore(false)}>
          <div className="mobile-more-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-more-handle" />
            <div className="mobile-more-grid">

              <NavLink to="/shop" className="mobile-more-item" onClick={() => setShowMore(false)}>
                <span className="mobile-more-icon"><BsShopWindow /></span>
                <span>Shop</span>
              </NavLink>

              <NavLink to="/notifications" className="mobile-more-item" onClick={() => setShowMore(false)}>
                <span className="mobile-more-icon" style={{ position:"relative" }}>
                  {unreadCount > 0 ? <AiFillBell style={{ color:"var(--accent)" }} /> : <AiOutlineBell />}
                  {unreadCount > 0 && <span className="mobile-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </span>
                <span>Alerts</span>
              </NavLink>

              <NavLink
                to={user ? `/profile/${user.username}` : "/login"}
                className="mobile-more-item"
                onClick={() => setShowMore(false)}
              >
                <span className="mobile-more-icon">
                  {user?.avatar?.url
                    ? <img src={user.avatar.url} alt="" style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }} />
                    : <AiOutlineUser />
                  }
                </span>
                <span>Profile</span>
              </NavLink>

              <NavLink to="/analytics" className="mobile-more-item" onClick={() => setShowMore(false)}>
                <span className="mobile-more-icon">📊</span>
                <span>Analytics</span>
              </NavLink>

            </div>
          </div>
        </div>
      )}

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </>
  );
}