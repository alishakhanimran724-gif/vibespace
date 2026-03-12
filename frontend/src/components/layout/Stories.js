import { AiOutlineCamera, AiOutlineCaretRight, AiOutlineClose, AiOutlineDelete, AiOutlinePause, AiOutlinePlus, AiOutlineSend } from "react-icons/ai";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import React, { useEffect, useState, useRef } from "react";
import API from "../../utils/api";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

/* ── Full Screen Story Viewer ── */
const StoryViewer = ({ groups, startIndex, onClose }) => {
  const { user } = useSelector(s => s.auth);
  const [groupIdx, setGroupIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress,  setProgress]  = useState(0);
  const [paused,    setPaused]    = useState(false);
  const [reply,     setReply]     = useState("");
  const [sending,   setSending]   = useState(false);
  const intervalRef = useRef(null);
  const holdTimer   = useRef(null);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];
  const DURATION = 5000; // 5 seconds per story

  // reset progress on story change
  useEffect(() => {
    setProgress(0);
    if (story) API.put(`/story/view/${story._id}`).catch(() => {});
  }, [groupIdx, storyIdx]);

  // auto-advance timer
  useEffect(() => {
    if (paused || !story) return;
    clearInterval(intervalRef.current);
    const step = 100 / (DURATION / 50);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p + step >= 100) {
          clearInterval(intervalRef.current);
          goNext();
          return 100;
        }
        return p + step;
      });
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [groupIdx, storyIdx, paused]);

  const goNext = () => {
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(i => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(i => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(i => i - 1);
      setStoryIdx(0);
    }
  };

  const handleHoldStart = () => {
    holdTimer.current = setTimeout(() => setPaused(true), 150);
  };
  const handleHoldEnd = () => {
    clearTimeout(holdTimer.current);
    setPaused(false);
  };

  const handleReply = async e => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      toast.success("Reply sent!");
      setReply("");
    } catch { toast.error("Failed"); }
    setSending(false);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/story/delete/${story._id}`);
      toast.success("Story deleted");
      goNext();
    } catch { toast.error("Failed"); }
  };

  if (!story) return null;
  const isOwn = story.owner?._id?.toString() === user?._id?.toString() ||
                group.user?._id?.toString() === user?._id?.toString();

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer-container" onClick={e => e.stopPropagation()}>

        {/* Prev group arrow */}
        {groupIdx > 0 && (
          <button className="story-nav-arrow prev" onClick={e => { e.stopPropagation(); setGroupIdx(i => i-1); setStoryIdx(0); }}>
            <BsChevronLeft />
          </button>
        )}

        {/* Story card */}
        <div
          className="story-viewer"
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
        >
          {/* Progress bars */}
          <div className="story-progress-bars">
            {group.stories.map((_, i) => (
              <div key={i} className="story-progress-track">
                <div className="story-progress-fill" style={{
                  width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%",
                  transition: i === storyIdx ? "width 0.05s linear" : "none"
                }} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="story-header">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {group.user?.avatar?.url
                ? <img src={group.user.avatar.url} alt="" className="story-header-avatar" />
                : <div className="avatar-fallback story-header-avatar">{group.user?.username?.[0]?.toUpperCase()}</div>
              }
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:"#fff" }}>{group.user?.username}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>
                  {new Date(story.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setPaused(p => !p)} className="story-ctrl-btn">
                {paused ? <AiOutlineCaretRight /> : <AiOutlinePause />}
              </button>
              {isOwn && (
                <button onClick={handleDelete} className="story-ctrl-btn" style={{ color:"#ff6b6b" }}>
                  <AiOutlineDelete />
                </button>
              )}
              <button onClick={onClose} className="story-ctrl-btn"><AiOutlineClose /></button>
            </div>
          </div>

          {/* Image */}
          <img src={story.image?.url} alt="" className="story-img" draggable={false} />

          {/* Caption */}
          {story.caption && (
            <div className="story-caption">{story.caption}</div>
          )}

          {/* Tap zones */}
          <div className="story-tap-left"  onClick={goPrev} />
          <div className="story-tap-right" onClick={goNext} />

          {/* Paused badge */}
          {paused && (
            <div className="story-paused-badge">⏸ Hold</div>
          )}

          {/* Reply */}
          {!isOwn && (
            <div className="story-bottom">
              <form className="story-reply-form" onSubmit={handleReply}>
                <input
                  className="story-reply-input"
                  placeholder={`Reply to ${group.user?.username}…`}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
                <button type="submit" disabled={!reply.trim() || sending} className="story-reply-send">
                  <AiOutlineSend />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Next group arrow */}
        {groupIdx < groups.length - 1 && (
          <button className="story-nav-arrow next" onClick={e => { e.stopPropagation(); setGroupIdx(i => i+1); setStoryIdx(0); }}>
            <BsChevronRight />
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Create Story Modal ── */
const CreateStoryModal = ({ onClose, onCreated }) => {
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = f => {
    if (!f?.type.startsWith("image/")) return toast.error("Images only");
    setFile(f); setPreview(URL.createObjectURL(f));
  };

  const handleDrop = e => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return toast.error("Select an image");
    setLoading(true);
    const fd = new FormData();
    fd.append("image", file);
    fd.append("caption", caption);
    try {
      await API.post("/story/new", fd);
      toast.success("Story posted!");
      onCreated?.();
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontFamily:"var(--font-serif)", fontStyle:"italic", fontWeight:500 }}>Add to Story</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"var(--text-3)" }}><AiOutlineClose /></button>
        </div>

        <div
          className={`create-post-drop ${preview ? "has-preview" : ""}`}
          style={{ minHeight:200 }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !preview && fileRef.current?.click()}
        >
          {preview
            ? <img src={preview} alt="preview" style={{ width:"100%", maxHeight:280, objectFit:"cover", borderRadius:8, display:"block" }} />
            : <div className="create-post-drop-hint">
                <AiOutlineCamera style={{ fontSize:36, color:"var(--text-3)", marginBottom:8 }} />
                <div style={{ fontWeight:600 }}>Drag & drop or click</div>
                <div style={{ fontSize:12, color:"var(--text-3)", marginTop:4 }}>Your story disappears in 24h</div>
              </div>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files[0])} />

        {preview && (
          <input
            value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption…"
            style={{ width:"100%", marginTop:12, padding:"10px 14px", border:"1.5px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:14, fontFamily:"var(--font-body)", background:"var(--bg)", color:"var(--text)", outline:"none", boxSizing:"border-box" }}
          />
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading || !file} style={{ marginTop:14 }}>
          {loading ? "Posting…" : "Share Story"}
        </button>
      </div>
    </div>
  );
};

/* ── Stories Bar ── */
const Stories = () => {
  const { user } = useSelector(s => s.auth);
  const [groups,       setGroups]       = useState([]);
  const [viewerOpen,   setViewerOpen]   = useState(false);
  const [viewerStart,  setViewerStart]  = useState(0);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [myStory,      setMyStory]      = useState(null);
  const scrollRef = useRef();

  const fetchStories = async () => {
    try {
      const res = await API.get("/story/feed");
      const rawGroups = res.data.stories || [];
      setGroups(rawGroups);
      const mine = rawGroups.find(g => g.user?._id?.toString() === user?._id?.toString());
      setMyStory(mine || null);
    } catch {}
  };

  useEffect(() => { fetchStories(); }, []);

  // Only other users' stories (exclude mine)
  const otherGroups = groups.filter(g => g.user?._id?.toString() !== user?._id?.toString());

  const openViewer = (idx) => { setViewerStart(idx); setViewerOpen(true); };

  const handleMyStoryClick = () => {
    if (myStory) {
      // find index in groups array
      const idx = groups.findIndex(g => g.user?._id?.toString() === user?._id?.toString());
      openViewer(idx >= 0 ? idx : 0);
    } else {
      setCreateOpen(true);
    }
  };

  const scroll = dir => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior:"smooth" });
  };

  const hasOtherStories = otherGroups.length > 0;

  return (
    <>
      <div className="stories-bar-wrap">
        {hasOtherStories && (
          <button className="stories-scroll-btn left" onClick={() => scroll(-1)}><BsChevronLeft /></button>
        )}

        <div className="stories-bar" ref={scrollRef}>
          {/* My Story bubble */}
          <div className="story-bubble-wrap" onClick={handleMyStoryClick}>
            <div className={`story-bubble my-story ${myStory ? "has-story" : ""}`}>
              {user?.avatar?.url
                ? <img src={user.avatar.url} alt="" />
                : <div className="avatar-fallback" style={{ width:"100%", height:"100%", borderRadius:"50%", fontSize:18 }}>{user?.username?.[0]?.toUpperCase()}</div>
              }
              {/* + badge: only show when no story */}
              {!myStory && <div className="story-add-btn">+</div>}
              {/* Camera icon when has story — to add more */}
              {myStory && (
                <div className="story-add-btn" style={{ background:"#555" }}
                  onClick={e => { e.stopPropagation(); setCreateOpen(true); }}>
                  +
                </div>
              )}
            </div>
            <span className="story-bubble-name">{myStory ? "Your Story" : "Add Story"}</span>
          </div>

          {/* Other users' stories */}
          {otherGroups.map((g, i) => {
            const seen = g.stories?.every(s => s.views?.some(v => (v._id||v)?.toString() === user?._id?.toString()));
            const groupsIdx = groups.findIndex(gr => gr.user?._id?.toString() === g.user?._id?.toString());
            return (
              <div key={g.user?._id} className="story-bubble-wrap" onClick={() => openViewer(groupsIdx)}>
                <div className={`story-bubble ${seen ? "seen" : "unseen"}`}>
                  {g.user?.avatar?.url
                    ? <img src={g.user.avatar.url} alt="" />
                    : <div className="avatar-fallback" style={{ width:"100%", height:"100%", borderRadius:"50%", fontSize:16 }}>{g.user?.username?.[0]?.toUpperCase()}</div>
                  }
                </div>
                <span className="story-bubble-name">{g.user?.username?.slice(0,9)}</span>
              </div>
            );
          })}
        </div>

        {hasOtherStories && (
          <button className="stories-scroll-btn right" onClick={() => scroll(1)}><BsChevronRight /></button>
        )}
      </div>

      {viewerOpen && (
        <StoryViewer groups={groups} startIndex={viewerStart} onClose={() => setViewerOpen(false)} />
      )}
      {createOpen && (
        <CreateStoryModal onClose={() => setCreateOpen(false)} onCreated={fetchStories} />
      )}
    </>
  );
};

export default Stories;