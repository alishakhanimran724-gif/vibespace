import { AiFillHeart, AiOutlineCamera, AiOutlineClose, AiOutlineHeart, AiOutlineMessage, AiOutlinePicture, AiOutlineSearch, AiOutlineTag, AiOutlineUser } from "react-icons/ai";
import { BsHash } from "react-icons/bs";
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import API from "../utils/api";
import toast from "react-hot-toast";
/* ── Post detail mini modal ── */
const PostMiniModal = ({ post, onClose }) => {
  const [liked, setLiked]   = useState(false);
  const [likes, setLikes]   = useState(post.likes?.length || 0);
  const handleLike = async () => {
    try {
      const res = await API.put(`/post/like/${post._id}`);
      setLiked(res.data.liked); setLikes(res.data.likesCount);
    } catch {}
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="post-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="post-detail-left">
          <img src={post.image?.url} alt={post.caption} />
        </div>
        <div className="post-detail-right">
          <div className="post-detail-header">
            <Link to={`/profile/${post.owner?.username}`} onClick={onClose}>
              {post.owner?.avatar?.url
                ? <img src={post.owner.avatar.url} alt="" />
                : <div className="avatar-fallback" style={{width:32,height:32,fontSize:12}}>{post.owner?.username?.[0]?.toUpperCase()}</div>
              }
              <strong>{post.owner?.username}</strong>
            </Link>
            <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-3)",fontSize:18,marginLeft:"auto"}}>
              <AiOutlineClose />
            </button>
          </div>
          {post.caption && (
            <div className="post-detail-caption">
              <strong>{post.owner?.username}</strong> {post.caption}
            </div>
          )}
          <div style={{padding:"12px 16px",display:"flex",gap:16,borderTop:"1px solid var(--border-soft)",marginTop:"auto"}}>
            <button onClick={handleLike} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color: liked?"#ef4444":"var(--text-2)",fontSize:13}}>
              {liked ? <AiFillHeart style={{fontSize:20,color:"#ef4444"}}/> : <AiOutlineHeart style={{fontSize:20}}/>} {likes}
            </button>
            <span style={{display:"flex",alignItems:"center",gap:5,fontSize:13,color:"var(--text-3)"}}>
              <AiOutlineMessage style={{fontSize:18}}/> {post.comments?.length||0}
            </span>
            {post.isForSale && !post.isSold && (
              <span style={{marginLeft:"auto",fontWeight:700,fontSize:14,color:"var(--accent)"}}>
                <AiOutlineTag /> ${post.price}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Search() {
  const { user: currentUser } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const [query, setQuery]       = useState("");
  const [tab, setTab]           = useState("people"); // people | posts | tags
  const [users, setUsers]       = useState([]);
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [followState, setFollowState] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [trendingTags] = useState([
    "photography","art","fashion","travel","food",
    "nature","fitness","music","design","technology"
  ]);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setUsers([]); setPosts([]); return; }
    setLoading(true);
    try {
      const [userRes, postRes] = await Promise.all([
        API.get(`/user/search?query=${q}`),
        API.get(`/post/marketplace?search=${q}`).catch(() => ({ data: { posts: [] } })),
      ]);
      setUsers(userRes.data.users || []);
      // Also search feed posts by caption/hashtag
      setPosts(postRes.data.posts?.filter(p =>
        p.caption?.toLowerCase().includes(q.toLowerCase()) ||
        p.hashtags?.some(h => h.toLowerCase().includes(q.toLowerCase()))
      ) || []);
    } catch { toast.error("Search failed"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const handleFollow = async (userId) => {
    try {
      const res = await API.put(`/user/follow/${userId}`);
      setFollowState(p => ({ ...p, [userId]: res.data.followed }));
    } catch { toast.error("Failed"); }
  };

  const isFollowing = (u) =>
    followState[u._id] !== undefined
      ? followState[u._id]
      : u.followers?.some(f => (f._id||f)?.toString() === currentUser?._id?.toString());

  const theyFollowMe = (u) =>
    u.followers?.some(f => (f._id||f)?.toString() === currentUser?._id?.toString()) || false;

  const isEmpty = !loading && query && users.length === 0 && posts.length === 0;

  return (
    <div className="search-page">
      {/* ── Search bar ── */}
      <div className="search-bar-wrap">
        <AiOutlineSearch className="search-icon" />
        <input
          className="search-input"
          placeholder="Search people, posts, #tags…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(""); setUsers([]); setPosts([]); }}>
            <AiOutlineClose />
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      {query && (
        <div className="search-tabs">
          {[
            { key:"people", icon:<AiOutlineUser />, label:"People", count: users.length },
            { key:"posts",  icon:<AiOutlinePicture />, label:"Posts", count: posts.length },
          ].map(t => (
            <button key={t.key}
              className={`search-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
              {t.count > 0 && <span className="search-tab-count">{t.count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── Skeleton ── */}
      {loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ display:"flex", gap:12, padding:"12px", alignItems:"center" }}>
              <div className="skeleton-avatar" />
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                <div className="skeleton-line" style={{ width:"40%" }} />
                <div className="skeleton-line" style={{ width:"25%" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && isEmpty && (
        <div className="search-empty">
          <div className="search-empty-icon"><AiOutlineSearch /></div>
          <div>No results for "{query}"</div>
        </div>
      )}

      {/* ── No query — trending tags ── */}
      {!query && (
        <div className="search-trending">
          <div className="search-trending-title">Trending Tags</div>
          <div className="search-tags-grid">
            {trendingTags.map(tag => (
              <button key={tag} className="search-tag-pill"
                onClick={() => { setQuery("#"+tag); setTab("posts"); }}>
                <BsHash style={{ fontSize:15 }} />
                {tag}
              </button>
            ))}
          </div>

          <div className="search-trending-title" style={{ marginTop:20 }}>Discover People</div>
          <DiscoverSection currentUser={currentUser} onFollow={handleFollow} followState={followState} />
        </div>
      )}

      {/* ── Results: People ── */}
      {!loading && query && tab === "people" && users.map(u => {
        const following = isFollowing(u);
        const theyFollow = theyFollowMe(u);
        const isMe = u._id === currentUser?._id;
        return (
          <div key={u._id} className="search-user-item">
            <Link to={`/profile/${u.username}`} style={{ flex:1, display:"flex", alignItems:"center", gap:12, textDecoration:"none", color:"var(--text)" }}>
              <div style={{ position:"relative" }}>
                {u.avatar?.url
                  ? <img src={u.avatar.url} alt={u.username} style={{ width:46, height:46, borderRadius:"50%", objectFit:"cover" }} />
                  : <div className="avatar-fallback" style={{ width:46, height:46, fontSize:17 }}>{u.username?.[0]?.toUpperCase()}</div>
                }
                {u.isOnline && <span className="online-dot online" style={{ position:"absolute", bottom:1, right:1 }} />}
              </div>
              <div>
                <strong style={{ fontSize:14, display:"block" }}>{u.username}</strong>
                <span style={{ fontSize:12, color:"var(--text-3)" }}>
                  {u.followers?.length || 0} followers
                  {theyFollow && <span style={{ marginLeft:6, fontSize:11 }}>· Follows you</span>}
                </span>
              </div>
            </Link>
            {!isMe && (
              <button onClick={() => handleFollow(u._id)}
                className={following ? "btn-ghost" : "btn-primary"}
                style={{ width:"auto", padding:"6px 16px", fontSize:12 }}>
                {following ? "Following" : theyFollow ? "Follow Back" : "Follow"}
              </button>
            )}
          </div>
        );
      })}

      {/* ── Results: Posts ── */}
      {!loading && query && tab === "posts" && (
        posts.length === 0 ? (
          <div className="search-empty">
            <div className="search-empty-icon"><AiOutlineCamera /></div>
            <div>No posts found for "{query}"</div>
          </div>
        ) : (
          <div className="search-posts-grid">
            {posts.map(post => (
              <div key={post._id} className="search-post-item" onClick={() => setSelectedPost(post)}>
                <img src={post.image?.url} alt={post.caption} />
                <div className="search-post-overlay">
                  <span style={{display:"flex",alignItems:"center",gap:2}}><AiOutlineHeart />{post.likes?.length||0}</span>
                  <span style={{display:"flex",alignItems:"center",gap:2}}><AiOutlineMessage />{post.comments?.length||0}</span>
                </div>
                {post.isForSale && !post.isSold && (
                  <div className="search-post-price">${post.price}</div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Post mini modal */}
      {selectedPost && (
        <PostMiniModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}

/* ── Discover people section ── */
function DiscoverSection({ currentUser, onFollow, followState }) {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    API.get("/user/search?query=").then(r => {
      setUsers((r.data.users || []).filter(u => u._id !== currentUser?._id).slice(0, 6));
    }).catch(() => {});
  }, []);
  if (!users.length) return null;
  return (
    <div className="discover-grid">
      {users.map(u => {
        const isFollowing = followState[u._id] !== undefined
          ? followState[u._id]
          : u.followers?.some(f => (f._id||f)?.toString() === currentUser?._id?.toString());
        return (
          <div key={u._id} className="discover-card">
            <Link to={`/profile/${u.username}`}>
              {u.avatar?.url
                ? <img src={u.avatar.url} alt={u.username} />
                : <div className="avatar-fallback" style={{width:52,height:52,fontSize:18,margin:"0 auto"}}>{u.username?.[0]?.toUpperCase()}</div>
              }
            </Link>
            <Link to={`/profile/${u.username}`} style={{textDecoration:"none",color:"inherit"}}>
              <strong style={{fontSize:13,display:"block",marginTop:6,textAlign:"center"}}>{u.username}</strong>
            </Link>
            <span style={{fontSize:11,color:"var(--text-3)",textAlign:"center",display:"block"}}>
              {u.followers?.length||0} followers
            </span>
            <button onClick={() => onFollow(u._id)}
              className={isFollowing ? "btn-ghost" : "btn-primary"}
              style={{width:"100%",padding:"6px 0",fontSize:12,marginTop:8}}>
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        );
      })}
    </div>
  );
}