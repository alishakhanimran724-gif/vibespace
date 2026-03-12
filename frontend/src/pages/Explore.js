import { AiFillHeart, AiOutlineClose, AiOutlineGlobal, AiOutlineHeart, AiOutlineMessage, AiOutlineSend, AiOutlineShoppingCart, AiOutlineTag } from "react-icons/ai";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import API from "../utils/api";
import toast from "react-hot-toast";
const SkeletonGrid = () => (
  <div className="explore-grid">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="skeleton-post-block" style={{ animationDelay:`${i*0.04}s` }} />
    ))}
  </div>
);

/* ── Post Detail Modal ── */
const ExploreModal = ({ post: initialPost, onClose, currentUser }) => {
  const [liked, setLiked]     = useState(initialPost.likes?.some(l => (l._id||l)?.toString() === currentUser?._id?.toString()));
  const [likes, setLikes]     = useState(initialPost.likes?.length || 0);
  const [saved, setSaved]     = useState(currentUser?.savedPosts?.includes(initialPost._id));
  const [comments, setComments] = useState(initialPost.comments || []);
  const [text, setText]       = useState("");

  const handleLike = async () => {
    try {
      const res = await API.put(`/post/like/${initialPost._id}`);
      setLiked(res.data.liked); setLikes(res.data.likesCount);
    } catch { toast.error("Failed"); }
  };

  const handleSave = async () => {
    try {
      const res = await API.put(`/post/save/${initialPost._id}`);
      setSaved(res.data.saved);
      toast.success(res.data.saved ? "Saved!" : "Removed");
    } catch { toast.error("Failed"); }
  };

  const handleComment = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await API.put(`/post/comment/${initialPost._id}`, { comment: text });
      setComments(res.data.comments);
      setText("");
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="explore-modal" onClick={e => e.stopPropagation()}>
        {/* Left — image */}
        <div className="explore-modal-img">
          <img src={initialPost.image?.url} alt={initialPost.caption} />
        </div>

        {/* Right — details */}
        <div className="explore-modal-right">
          {/* Header */}
          <div className="explore-modal-header">
            <Link to={`/profile/${initialPost.owner?.username}`} onClick={onClose}>
              {initialPost.owner?.avatar?.url
                ? <img src={initialPost.owner.avatar.url} alt="" />
                : <div className="avatar-fallback" style={{width:34,height:34,fontSize:12}}>{initialPost.owner?.username?.[0]?.toUpperCase()}</div>
              }
            </Link>
            <div style={{ flex:1 }}>
              <Link to={`/profile/${initialPost.owner?.username}`} onClick={onClose} style={{ fontWeight:700, fontSize:14, color:"var(--text)", textDecoration:"none" }}>
                {initialPost.owner?.username}
              </Link>
              {initialPost.isForSale && !initialPost.isSold && (
                <div style={{ fontSize:12, color:"var(--accent)", fontWeight:600 }}><AiOutlineTag /> ${initialPost.price}</div>
              )}
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", fontSize:20, display:"flex" }}>
              <AiOutlineClose />
            </button>
          </div>

          {/* Caption */}
          {initialPost.caption && (
            <div style={{ padding:"12px 16px", fontSize:14, color:"var(--text-2)", borderBottom:"1px solid var(--border-soft)" }}>
              <strong style={{ color:"var(--text)" }}>{initialPost.owner?.username}</strong>
              {" "}{initialPost.caption}
            </div>
          )}

          {/* Comments */}
          <div className="explore-modal-comments">
            {comments.length === 0 && (
              <div style={{ textAlign:"center", color:"var(--text-3)", padding:"20px 0", fontSize:13 }}>
                No comments yet
              </div>
            )}
            {comments.map((c, i) => (
              <div key={i} className="explore-modal-comment">
                {c.user?.avatar?.url
                  ? <img src={c.user.avatar.url} alt="" />
                  : <div className="avatar-fallback" style={{width:28,height:28,fontSize:10,flexShrink:0}}>{c.user?.username?.[0]?.toUpperCase()}</div>
                }
                <div>
                  <strong style={{ fontSize:13, color:"var(--text)" }}>{c.user?.username}</strong>
                  {" "}<span style={{ fontSize:13 }}>{c.comment}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="explore-modal-actions">
            <div className="explore-modal-stats">
              <button onClick={handleLike} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:liked?"#ef4444":"var(--text-2)", fontSize:14 }}>
                {liked ? <AiFillHeart style={{ fontSize:22, color:"#ef4444" }} /> : <AiOutlineHeart style={{ fontSize:22 }} />}
                {likes} likes
              </button>
              <button onClick={handleSave} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:"var(--text-2)", fontSize:14, marginLeft:"auto" }}>
                {saved ? <BsBookmarkFill style={{ fontSize:18 }} /> : <BsBookmark style={{ fontSize:18 }} />}
              </button>
            </div>

            {/* Buy button */}
            {initialPost.isForSale && !initialPost.isSold && (
              <Link
                to="/marketplace"
                onClick={onClose}
                className="btn-primary"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, textDecoration:"none", fontSize:14 }}
              >
                <AiOutlineShoppingCart /> Buy Now — ${initialPost.price}
              </Link>
            )}

            {/* Comment form */}
            <form className="explore-modal-comment-form" onSubmit={handleComment}>
              <input
                placeholder="Add a comment…"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button type="submit" disabled={!text.trim()}>
                <AiOutlineSend />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Explore ── */
const Explore = () => {
  const { user: currentUser }   = useSelector(s => s.auth);
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activePost, setActivePost] = useState(null);
  const [filter, setFilter]     = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await API.get("/post/feed");
        setPosts(res.data.posts || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = filter === "sale"
    ? posts.filter(p => p.isForSale && !p.isSold)
    : posts;

  return (
    <div className="explore-page">
      <div className="explore-header">
        <h2>Explore</h2>
        <div className="explore-filters">
          <button className={filter==="all"  ? "active":""} onClick={() => setFilter("all")}>All</button>
          <button className={filter==="sale" ? "active":""} onClick={() => setFilter("sale")}><AiOutlineTag /> For Sale</button>
        </div>
      </div>

      {loading ? <SkeletonGrid /> : filtered.length === 0 ? (
        <div className="search-empty">
          <div className="search-empty-icon"><AiOutlineGlobal /></div>
          <p>No posts to explore yet</p>
        </div>
      ) : (
        <div className="explore-grid">
          {filtered.map((post, i) => (
            <div
              key={post._id}
              className={`explore-item ${i % 7 === 0 ? "large" : ""}`}
              onClick={() => setActivePost(post)}
              style={{ animationDelay:`${i * 0.03}s` }}
            >
              <img src={post.image?.url} alt={post.caption} />
              <div className="explore-overlay">
                <span style={{display:"flex",alignItems:"center",gap:3}}><AiOutlineHeart />{post.likes?.length || 0}</span>
                <span style={{display:"flex",alignItems:"center",gap:3}}><AiOutlineMessage />{post.comments?.length || 0}</span>
              </div>
              {post.isForSale && !post.isSold && (
                <div className="explore-sale-tag"><AiOutlineTag /> ${post.price}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {activePost && (
        <ExploreModal
          post={activePost}
          onClose={() => setActivePost(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default Explore;