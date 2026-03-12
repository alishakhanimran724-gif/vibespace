import { AiFillHeart, AiOutlineCaretRight, AiOutlineClose, AiOutlineComment, AiOutlineDelete, AiOutlineHeart, AiOutlinePlus, AiOutlineSend, AiOutlineShareAlt, AiOutlineVideoCamera } from "react-icons/ai";
import { BsMusicNote, BsVolumeMute, BsVolumeUp } from "react-icons/bs";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import API from "../utils/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { format } from "timeago.js";

/* ── Comment Bottom Sheet ── */
const CommentModal = ({ reel, onClose, currentUser }) => {
  const [comments, setComments] = useState(reel.comments || []);
  const [text, setText]         = useState("");
  const [loading, setLoading]   = useState(false);
  const endRef = useRef();

  const handleSubmit = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data } = await API.put(`/reel/comment/${reel._id}`, { comment: text });
      setComments(data.comments || []);
      setText("");
      setTimeout(() => endRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
    } catch { toast.error("Failed"); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex:400, alignItems:"flex-end", padding:0 }}>
      <div className="reel-comments-modal" onClick={e => e.stopPropagation()}>
        <div className="reel-comments-header">
          <span>Comments · {comments.length}</span>
          <button onClick={onClose}><AiOutlineClose /></button>
        </div>
        <div className="reel-comments-body">
          {comments.length === 0 && (
            <div style={{ textAlign:"center", color:"var(--text-3)", padding:"40px 0", fontSize:13 }}>
              No comments yet — be first!
            </div>
          )}
          {comments.map((c, i) => (
            <div key={i} className="reel-comment-item">
              {c.user?.avatar?.url
                ? <img src={c.user.avatar.url} alt="" />
                : <div className="avatar-fallback" style={{ width:30, height:30, fontSize:11, flexShrink:0 }}>{c.user?.username?.[0]?.toUpperCase()}</div>
              }
              <div>
                <span style={{ fontWeight:700, fontSize:13 }}>{c.user?.username}</span>
                {" "}<span style={{ fontSize:13 }}>{c.comment}</span>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form className="reel-comments-input" onSubmit={handleSubmit}>
          {currentUser?.avatar?.url
            ? <img src={currentUser.avatar.url} alt="" style={{ width:30, height:30, borderRadius:"50%", objectFit:"cover" }} />
            : <div className="avatar-fallback" style={{ width:30, height:30, fontSize:11 }}>{currentUser?.username?.[0]?.toUpperCase()}</div>
          }
          <input
            value={text} onChange={e => setText(e.target.value)}
            placeholder="Add a comment…"
          />
          <button type="submit" disabled={!text.trim() || loading}><AiOutlineSend /></button>
        </form>
      </div>
    </div>
  );
};

/* ── Upload Reel Modal ── */
const UploadModal = ({ onClose, onUploaded }) => {
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [caption,  setCaption]  = useState("");
  const [progress, setProgress] = useState(0);
  const [loading,  setLoading]  = useState(false);
  const fileRef = useRef();

  const handleFile = f => {
    if (!f?.type.startsWith("video/")) return toast.error("Videos only");
    setFile(f); setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) return toast.error("Select a video");
    setLoading(true); setProgress(0);
    const fd = new FormData();
    fd.append("video", file);
    fd.append("caption", caption);
    try {
      await API.post("/reel/new", fd, {
        onUploadProgress: e => setProgress(Math.round((e.loaded * 100) / e.total))
      });
      toast.success("Reel uploaded!");
      onUploaded?.();
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Upload failed"); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontFamily:"var(--font-serif)", fontStyle:"italic", fontWeight:500 }}>Upload Reel</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"var(--text-3)" }}><AiOutlineClose /></button>
        </div>

        <div className="create-post-drop" style={{ minHeight:160 }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => !preview && fileRef.current?.click()}>
          {preview
            ? <video src={preview} style={{ width:"100%", maxHeight:200, borderRadius:8 }} controls />
            : <div className="create-post-drop-hint">
                <AiOutlineVideoCamera style={{ fontSize:40, color:"var(--text-3)", marginBottom:8 }} />
                <div style={{ fontWeight:600 }}>Select video</div>
                <div style={{ fontSize:12, color:"var(--text-3)", marginTop:4 }}>MP4, MOV up to 60s</div>
              </div>
          }
        </div>
        <input ref={fileRef} type="file" accept="video/*" hidden onChange={e => handleFile(e.target.files[0])} />

        {preview && (
          <textarea value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="Write a caption… #reels #fyp"
            rows={2} style={{ width:"100%", marginTop:12, padding:"10px 14px", border:"1.5px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:14, fontFamily:"var(--font-body)", background:"var(--bg)", color:"var(--text)", outline:"none", resize:"none", boxSizing:"border-box" }} />
        )}

        {loading && (
          <div style={{ marginTop:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text-3)", marginBottom:4 }}>
              <span>Uploading…</span><span>{progress}%</span>
            </div>
            <div style={{ background:"var(--border)", borderRadius:4, height:6 }}>
              <div style={{ width:`${progress}%`, background:"linear-gradient(90deg,#8b5cf6,#ec4899)", height:"100%", borderRadius:4, transition:"width 0.3s" }} />
            </div>
          </div>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading || !file} style={{ marginTop:14 }}>
          {loading ? `Uploading ${progress}%…` : "Post Reel"}
        </button>
      </div>
    </div>
  );
};

/* ── Single Reel ── */
const ReelCard = ({ reel: initialReel, isActive, currentUser }) => {
  const [reel, setReel]         = useState(initialReel);
  const [liked, setLiked]       = useState(reel.likes?.some(l => (l._id||l)?.toString() === currentUser?._id?.toString()));
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
  const [muted,   setMuted]     = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [playing, setPlaying]   = useState(false);
  const videoRef = useRef();

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else         { videoRef.current.play();  setPlaying(true);  }
  };

  const handleLike = async () => {
    try {
      const res = await API.put(`/reel/like/${reel._id}`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount ?? (liked ? likesCount-1 : likesCount+1));
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this reel?")) return;
    try {
      await API.delete(`/reel/delete/${reel._id}`);
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  };

  const isOwner = reel.owner?._id?.toString() === currentUser?._id?.toString();

  return (
    <div className="reel-card">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video?.url}
        className="reel-video"
        loop muted={muted}
        playsInline
        onClick={togglePlay}
      />

      {/* Gradient */}
      <div className="reel-gradient" />

      {/* Play/Pause overlay */}
      {!playing && (
        <div className="reel-play-overlay" onClick={togglePlay}><AiOutlineCaretRight /></div>
      )}

      {/* Right sidebar actions */}
      <div className="reel-actions">
        {/* Owner avatar */}
        <Link to={`/profile/${reel.owner?.username}`} className="reel-owner-avatar">
          {reel.owner?.avatar?.url
            ? <img src={reel.owner.avatar.url} alt="" />
            : <div className="avatar-fallback" style={{ width:44, height:44, fontSize:16 }}>{reel.owner?.username?.[0]?.toUpperCase()}</div>
          }
          <div className="reel-follow-plus">+</div>
        </Link>

        {/* Like */}
        <button className="reel-action-btn" onClick={handleLike}>
          {liked ? <AiFillHeart style={{ color:"#ef4444", fontSize:28 }} /> : <AiOutlineHeart style={{ fontSize:28 }} />}
          <span>{likesCount}</span>
        </button>

        {/* Comment */}
        <button className="reel-action-btn" onClick={() => setShowComments(true)}>
          <AiOutlineComment style={{ fontSize:28 }} />
          <span>{reel.comments?.length || 0}</span>
        </button>

        {/* Share */}
        <button className="reel-action-btn" onClick={() => {
          navigator.clipboard.writeText(`${window.location.origin}/reel/${reel._id}`);
          toast.success("Link copied!");
        }}>
          <AiOutlineShareAlt style={{ fontSize:26 }} />
          <span>Share</span>
        </button>

        {/* Mute */}
        <button className="reel-action-btn" onClick={() => setMuted(m => !m)}>
          {muted ? <BsVolumeMute style={{ fontSize:24 }} /> : <BsVolumeUp style={{ fontSize:24 }} />}
        </button>

        {/* Delete (owner only) */}
        {isOwner && (
          <button className="reel-action-btn" onClick={handleDelete} style={{ color:"#ff6b6b" }}>
            <AiOutlineDelete style={{ fontSize:22 }} />
          </button>
        )}
      </div>

      {/* Bottom info */}
      <div className="reel-info">
        <Link to={`/profile/${reel.owner?.username}`} className="reel-username">
          @{reel.owner?.username}
        </Link>
        {reel.caption && <p className="reel-caption">{reel.caption}</p>}
        <div className="reel-music">
          <BsMusicNote style={{ fontSize:12 }} />
          <span>Original Audio</span>
        </div>
      </div>

      {showComments && (
        <CommentModal reel={reel} onClose={() => setShowComments(false)} currentUser={currentUser} />
      )}
    </div>
  );
};

/* ── Main Reels Page ── */
const Reels = () => {
  const { user } = useSelector(s => s.auth);
  const [reels,      setReels]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const containerRef = useRef();

  const fetchReels = async () => {
    setLoading(true);
    try {
      const res = await API.get("/reel");
      setReels(res.data.reels || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchReels(); }, []);

  // IntersectionObserver for active reel
  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll(".reel-card");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.dataset.idx);
          setActiveIdx(idx);
        }
      });
    }, { threshold: 0.6 });
    cards.forEach(c => observer.observe(c));
    return () => observer.disconnect();
  }, [reels]);

  return (
    <div className="reels-page">
      {/* Upload button */}
      <button className="reels-upload-btn" onClick={() => setShowUpload(true)}>
        <AiOutlinePlus />
      </button>

      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"#fff", fontSize:16 }}>
          Loading reels…
        </div>
      ) : reels.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", color:"#fff", gap:16 }}>
          <AiOutlineVideoCamera style={{ fontSize:52, color:"#fff", opacity:0.6 }} />
          <h3>No reels yet</h3>
          <button className="btn-primary" onClick={() => setShowUpload(true)}>Upload First Reel</button>
        </div>
      ) : (
        <div className="reels-container" ref={containerRef}>
          {reels.map((reel, i) => (
            <div key={reel._id} data-idx={i} className="reel-card-wrapper">
              <ReelCard reel={reel} isActive={activeIdx === i} currentUser={user} />
            </div>
          ))}
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={fetchReels} />}
    </div>
  );
};

export default Reels;