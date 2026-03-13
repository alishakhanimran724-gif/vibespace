import { AiFillHeart, AiOutlineCamera, AiOutlineClose, AiOutlineDelete, AiOutlineFlag, AiOutlineHeart, AiOutlineLink, AiOutlineMessage, AiOutlineShareAlt, AiOutlineTag } from "react-icons/ai";
import { BsBookmark, BsBookmarkFill, BsThreeDots, BsTwitter, BsWhatsapp } from "react-icons/bs";
import { RiPlantLine } from "react-icons/ri";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFeedPosts } from "../redux/reducers/postSlice";
import { Link } from "react-router-dom";
import API from "../utils/api";
import toast from "react-hot-toast";
import { format } from "timeago.js";
import Stories from "../components/layout/Stories";

/* ── Post Skeleton ── */
const PostSkeleton = () => (
  <div className="post-card skeleton-card">
    <div className="post-header">
      <div className="skeleton-avatar" />
      <div style={{ flex:1 }}>
        <div className="skeleton-line" style={{ width:"40%", marginBottom:6 }} />
        <div className="skeleton-line" style={{ width:"25%" }} />
      </div>
    </div>
    <div className="skeleton-image" />
    <div style={{ padding:"0 16px 16px" }}>
      <div className="skeleton-line" style={{ width:"80%", marginBottom:8 }} />
      <div className="skeleton-line" style={{ width:"60%" }} />
    </div>
  </div>
);

/* ── Share Modal ── */
const ShareModal = ({ post, onClose }) => {
  const url = `${window.location.origin}/post/${post._id}`;
  const copy = () => { navigator.clipboard.writeText(url); toast.success("Link copied!"); onClose(); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share Post</h3>
          <button onClick={onClose} className="modal-close-btn"><AiOutlineClose /></button>
        </div>
        <div className="share-options">
          <button className="share-option" onClick={copy}><AiOutlineLink /> Copy Link</button>
          <button className="share-option" onClick={() => { window.open(`https://twitter.com/intent/tweet?url=${url}`); onClose(); }}>
            <BsTwitter /> Twitter / X
          </button>
          <button className="share-option" onClick={() => { window.open(`https://wa.me/?text=${url}`); onClose(); }}>
            <BsWhatsapp /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Comment Section ── */
const CommentSection = ({ post, currentUser }) => {
  const [comments, setComments] = useState(post.comments || []);
  const [text, setText]         = useState("");
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef();

  const submit = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await API.put(`/post/comment/${post._id}`, { comment: text });
      setComments(res.data.comments);
      setText("");
    } catch { toast.error("Failed"); }
    setLoading(false);
  };

  return (
    <div className="comment-section">
      {comments.slice(-3).map((c, i) => (
        <div key={i} className="comment-row">
          {c.user?.avatar?.url
            ? <img src={c.user.avatar.url} alt="" className="comment-avatar" />
            : <div className="avatar-fallback comment-avatar">{c.user?.username?.[0]?.toUpperCase()}</div>
          }
          <div>
            <Link to={`/profile/${c.user?.username}`} className="comment-username">{c.user?.username}</Link>
            {" "}<span className="comment-text">{c.comment}</span>
          </div>
        </div>
      ))}
      {comments.length > 3 && (
        <Link to={`/post/${post._id}`} className="view-all-comments">
          View all {comments.length} comments
        </Link>
      )}
      <form className="comment-form" onSubmit={submit}>
        {currentUser?.avatar?.url
          ? <img src={currentUser.avatar.url} alt="" className="comment-avatar" />
          : <div className="avatar-fallback comment-avatar">{currentUser?.username?.[0]?.toUpperCase()}</div>
        }
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a comment…"
          className="comment-input"
        />
        {text.trim() && (
          <button type="submit" disabled={loading} className="comment-submit">Post</button>
        )}
      </form>
    </div>
  );
};

/* ── Post Card ── */
const PostCard = ({ post: initialPost, currentUser, onDeleted }) => {
  const [post,      setPost]      = useState(initialPost);
  const [liked,     setLiked]     = useState(post.likes?.some(l => l?._id?.toString() === currentUser?._id?.toString() || l?.toString() === currentUser?._id?.toString()));
  const [likesCount,setLikesCount]= useState(post.likes?.length || 0);
  const [saved,     setSaved]     = useState(post.savedBy?.some(s => s?._id?.toString() === currentUser?._id?.toString() || s?.toString() === currentUser?._id?.toString()));
  const [showShare, setShowShare] = useState(false);
  const [showMenu,  setShowMenu]  = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likeAnim,  setLikeAnim]  = useState(false);
  const lastTap = useRef(0);

  const isOwner = post.owner?._id?.toString() === currentUser?._id?.toString();

  /* double-tap like */
  const handleTap = useCallback(e => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleLike();
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 800);
    }
    lastTap.current = now;
  }, [liked]);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount(c => wasLiked ? c-1 : c+1);
    try {
      await API.put(`/post/like/${post._id}`);
    } catch {
      setLiked(wasLiked);
      setLikesCount(c => wasLiked ? c+1 : c-1);
    }
  };

  const handleSave = async () => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      await API.put(`/post/save/${post._id}`);
      toast.success(!wasSaved ? "Saved!" : "Removed from saved");
    } catch { setSaved(wasSaved); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await API.delete(`/post/delete/${post._id}`);
      toast.success("Post deleted");
      onDeleted?.(post._id);
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="post-card" style={{ animation: "cardIn 0.35s ease both" }}>
      {/* Header */}
      <div className="post-header">
        <Link to={`/profile/${post.owner?.username}`} className="post-owner-link">
          {post.owner?.avatar?.url
            ? <img src={post.owner.avatar.url} alt="" className="post-avatar" />
            : <div className="avatar-fallback post-avatar">{post.owner?.username?.[0]?.toUpperCase()}</div>
          }
          <div>
            <div className="post-username">{post.owner?.username}</div>
            <div className="post-time">{format(post.createdAt)}</div>
          </div>
        </Link>

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
          {post.price && (
            <div className="post-sale-badge"><AiOutlineTag /> ${post.price}</div>
          )}
          <div style={{ position:"relative" }}>
            <button className="post-menu-btn" onClick={() => setShowMenu(m => !m)}>
              <BsThreeDots />
            </button>
            {showMenu && (
              <div className="post-menu-dropdown" onClick={() => setShowMenu(false)}>
                {isOwner && (
                  <button className="post-menu-item danger" onClick={handleDelete}>
                    <AiOutlineDelete /> Delete
                  </button>
                )}
                <button className="post-menu-item" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
                  toast.success("Link copied!");
                }}>
                  <AiOutlineLink /> Copy link
                </button>
                {!isOwner && (
                  <button className="post-menu-item danger" onClick={() => toast.success("Reported")}>
                    <AiOutlineFlag /> Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image with double-tap */}
      {post.image?.url && (
        <div className="post-image-wrap" onClick={handleTap}>
          <img src={post.image.url} alt="" className="post-image" loading="lazy" />
          {likeAnim && (
            <div className="post-like-burst">
              <AiFillHeart />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <div style={{ display:"flex", gap:4 }}>
          <button className="post-action-btn" onClick={handleLike}>
            {liked
              ? <AiFillHeart style={{ color:"#ef4444", fontSize:22 }} />
              : <AiOutlineHeart style={{ fontSize:22 }} />
            }
          </button>
          <button className="post-action-btn" onClick={() => setShowComments(s => !s)}>
            <AiOutlineMessage style={{ fontSize:22 }} />
          </button>
          <button className="post-action-btn" onClick={() => setShowShare(true)}>
            <AiOutlineShareAlt style={{ fontSize:22 }} />
          </button>
        </div>
        <button className="post-action-btn" onClick={handleSave}>
          {saved
            ? <BsBookmarkFill style={{ fontSize:20, color:"var(--text)" }} />
            : <BsBookmark style={{ fontSize:20 }} />
          }
        </button>
      </div>

      {/* Likes */}
      {likesCount > 0 && (
        <div className="post-likes-count">
          <AiFillHeart style={{ color:"#ef4444", fontSize:13, marginRight:4 }} />
          {likesCount} {likesCount === 1 ? "like" : "likes"}
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="post-caption">
          <Link to={`/profile/${post.owner?.username}`} className="post-caption-user">{post.owner?.username}</Link>
          {" "}{post.caption}
        </div>
      )}

      {/* Comments */}
      {showComments && <CommentSection post={post} currentUser={currentUser} />}
      {!showComments && post.comments?.length > 0 && (
        <button className="post-view-comments" onClick={() => setShowComments(true)}>
          View {post.comments.length} comment{post.comments.length > 1 ? "s" : ""}
        </button>
      )}

      {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}
    </div>
  );
};

/* ── Create Post Card ── */
const CreatePost = ({ currentUser, onPosted }) => {
  const [caption,  setCaption]  = useState("");
  const [image,    setImage]    = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [price,    setPrice]    = useState("");
  const [forSale,  setForSale]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef();

  const handleFile = f => {
    if (!f?.type.startsWith("image/")) return;
    setImage(f); setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !image) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("caption", caption);
    if (image) fd.append("image", image);
    if (forSale && price) {
      fd.append("isForSale", "true");
      fd.append("price", price);
    }
    try {
      await API.post("/post/new", fd);
      toast.success("Posted!");
      setCaption(""); setImage(null); setPreview(null);
      setPrice(""); setForSale(false); setExpanded(false);
      onPosted?.();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    setLoading(false);
  };

  return (
    <div className={`create-post-card ${expanded ? "expanded" : ""}`}>
      {/* Compact bar */}
      {!expanded ? (
        <div className="create-post-compact" onClick={() => setExpanded(true)}>
          {currentUser?.avatar?.url
            ? <img src={currentUser.avatar.url} alt="" className="post-avatar" />
            : <div className="avatar-fallback post-avatar">{currentUser?.username?.[0]?.toUpperCase()}</div>
          }
          <div className="create-post-placeholder">What's on your mind, {currentUser?.name?.split(" ")[0] || currentUser?.username}?</div>
          <button className="create-post-photo-btn"><AiOutlineCamera /></button>
        </div>
      ) : (
        <>
          {/* Drop zone */}
          <div
            className={`create-post-drop ${dragOver ? "drag-over" : ""} ${preview ? "has-preview" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => !preview && fileRef.current?.click()}
          >
            {preview ? (
              <>
                <img src={preview} alt="preview" className="create-post-preview-img" />
                <button className="create-post-remove-img" onClick={e => { e.stopPropagation(); setImage(null); setPreview(null); }}>
                  <AiOutlineClose />
                </button>
              </>
            ) : (
              <div className="create-post-drop-hint">
                <AiOutlineCamera style={{ fontSize:32, marginBottom:6, color:"var(--text-3)" }} />
                <div style={{ fontWeight:600 }}>Drag & drop or click to add photo</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files[0])} />

          {/* Caption */}
          <div className="create-post-author">
            {currentUser?.avatar?.url
              ? <img src={currentUser.avatar.url} alt="" className="post-avatar" />
              : <div className="avatar-fallback post-avatar">{currentUser?.username?.[0]?.toUpperCase()}</div>
            }
            <textarea
              value={caption} onChange={e => setCaption(e.target.value)}
              placeholder={`What's on your mind, ${currentUser?.name?.split(" ")[0] || currentUser?.username}?`}
              className="create-post-textarea"
              rows={3}
            />
          </div>

          {/* For sale toggle */}
          <div className="create-post-options">
            <label className="for-sale-toggle">
              <input type="checkbox" checked={forSale} onChange={e => setForSale(e.target.checked)} />
              <AiOutlineTag /> List for sale
            </label>
            {forSale && (
              <input
                type="number" value={price} onChange={e => setPrice(e.target.value)}
                placeholder="Price (USD)" className="price-input" min="0"
              />
            )}
          </div>

          {/* Actions */}
          <div className="create-post-actions">
            <button className="btn-secondary" onClick={() => { setExpanded(false); setImage(null); setPreview(null); }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit}
              disabled={loading || (!caption.trim() && !image)}
              style={{ minWidth:80 }}>
              {loading ? "Posting…" : "Post"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ── Home Feed ── */
const Home = () => {
  const dispatch   = useDispatch();
  const { user }   = useSelector(s => s.auth);
  const { posts, loading } = useSelector(s => s.posts || { posts: [], loading: false });

  const [displayed, setDisplayed] = useState([]);
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(true);
  const loaderRef = useRef();
  const PAGE_SIZE = 5;

  const reload = useCallback(() => dispatch(getFeedPosts()), [dispatch]);
  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!posts?.length) return;
    setDisplayed(posts.slice(0, PAGE_SIZE));
    setPage(1);
    setHasMore(posts.length > PAGE_SIZE);
  }, [posts]);

  /* IntersectionObserver for infinite scroll */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(p => {
          const next = p + 1;
          const slice = posts.slice(0, next * PAGE_SIZE);
          setDisplayed(slice);
          setHasMore(slice.length < posts.length);
          return next;
        });
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, posts]);

  return (
    <div className="main-layout">
      <div className="feed">
        <Stories />

        <CreatePost currentUser={user} onPosted={reload} />

        {loading && displayed.length === 0
          ? [1,2,3].map(i => <PostSkeleton key={i} />)
          : displayed.length === 0
            ? (
              <div className="feed-empty">
                <RiPlantLine className="feed-empty-icon" />
                <h3>Your feed is empty</h3>
                <p>Follow people to see their posts here</p>
                <Link to="/explore" className="btn-primary" style={{ marginTop:16, display:"inline-block" }}>
                  Explore
                </Link>
              </div>
            )
            : displayed.map(post => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={user}
                onDeleted={id => setDisplayed(prev => prev.filter(p => p._id !== id))}
              />
            ))
        }

        {/* Infinite scroll loader */}
        <div ref={loaderRef} style={{ padding:"8px 0", textAlign:"center" }}>
          {hasMore && !loading && <div className="skeleton-line" style={{ width:60, margin:"0 auto", borderRadius:20 }} />}
          {!hasMore && displayed.length > 0 && (
            <div style={{ fontSize:13, color:"var(--text-3)", padding:"12px 0" }}>You're all caught up</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;