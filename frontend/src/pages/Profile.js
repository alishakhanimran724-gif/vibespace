import { AiOutlineAppstore, AiOutlineArrowLeft, AiOutlineCamera, AiOutlineClose, AiOutlineHeart, AiOutlineLink, AiOutlineMessage, AiOutlineTag } from "react-icons/ai";
import { BsBookmark, BsHandbag } from "react-icons/bs";
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getOrCreateChat } from "../redux/reducers/chatSlice";
import API from "../utils/api";
import toast from "react-hot-toast";

/* ── Followers / Following Modal ── */
const FollowListModal = ({ title, users, currentUserId, onClose, onFollowToggle }) => {
  const [followState, setFollowState] = useState({});

  const handleToggle = async (userId, isFollowing) => {
    try {
      const res = await API.put(`/user/follow/${userId}`);
      setFollowState(p => ({ ...p, [userId]: res.data.followed }));
      onFollowToggle?.();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="follow-list-modal" onClick={e => e.stopPropagation()}>
        <div className="follow-list-header">
          <span>{title}</span>
          <button onClick={onClose}><AiOutlineClose /></button>
        </div>
        <div className="follow-list-body">
          {users.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:"var(--text-3)", fontSize:14 }}>
              No {title.toLowerCase()} yet
            </div>
          ) : users.map(u => {
            const isMe = u._id?.toString() === currentUserId?.toString();
            const isFollowing = followState[u._id] ?? u.isFollowedByMe;
            return (
              <div key={u._id} className="follow-list-item">
                <Link to={`/profile/${u.username}`} onClick={onClose} style={{ display:"flex", alignItems:"center", gap:10, flex:1, textDecoration:"none", color:"inherit" }}>
                  {u.avatar?.url
                    ? <img src={u.avatar.url} alt={u.username} />
                    : <div className="avatar-fallback" style={{ width:42, height:42, fontSize:15 }}>{u.username?.[0]?.toUpperCase()}</div>
                  }
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{u.username}</div>
                    {u.name && <div style={{ fontSize:12, color:"var(--text-3)" }}>{u.name}</div>}
                  </div>
                </Link>
                {!isMe && (
                  <button
                    onClick={() => handleToggle(u._id, isFollowing)}
                    className={isFollowing ? "btn-ghost" : "btn-primary"}
                    style={{ width:"auto", padding:"6px 16px", fontSize:12 }}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── Post Preview Modal ── */
const PostPreviewModal = ({ post, onClose }) => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(post?.comments || []);

  const handleComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await API.put(`/post/comment/${post._id}`, { comment });
      setComments(res.data.comments);
      setComment("");
    } catch { toast.error("Failed"); }
  };

  if (!post) return null;
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
                ? <img src={post.owner.avatar.url} alt={post.owner.username} />
                : <div className="avatar-fallback" style={{ width:32, height:32, fontSize:12 }}>{post.owner?.username?.[0]?.toUpperCase()}</div>
              }
              <strong>{post.owner?.username}</strong>
            </Link>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", fontSize:18 }}>
              <AiOutlineClose />
            </button>
          </div>
          {post.caption && (
            <div className="post-detail-caption">
              <strong>{post.owner?.username}</strong> {post.caption}
            </div>
          )}
          <div className="post-detail-stats">
            <span style={{display:"flex",alignItems:"center",gap:3}}><AiOutlineHeart />{post.likes?.length||0} likes</span>
            <span style={{display:"flex",alignItems:"center",gap:3}}><AiOutlineMessage />{comments.length} comments</span>
          </div>
          <div className="post-detail-comments">
            {comments.map((c, i) => (
              <div key={i} className="post-detail-comment">
                <strong>{c.user?.username}</strong> {c.comment}
              </div>
            ))}
          </div>
          <form className="post-detail-comment-form" onSubmit={handleComment}>
            <input placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} />
            <button type="submit">Post</button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ── Main Profile ── */
const Profile = () => {
  const { username } = useParams();
  const navigate     = useNavigate();
  const dispatch     = useDispatch();
  const { user: currentUser } = useSelector(s => s.auth);

  const [profile, setProfile]     = useState(null);
  const [posts, setPosts]         = useState([]);
  const [tab, setTab]             = useState("posts");
  const [loading, setLoading]     = useState(true);
  const [following, setFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [followModal, setFollowModal] = useState(null); // "followers" | "following"
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (!username || username === "undefined" || username === "null") {
      navigate("/"); return;
    }
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/user/${username}`);
      const u = data.user;
      setProfile(u);
      setFollowing(u.followers?.some(f => (f._id||f)?.toString() === currentUser?._id?.toString()));
      setFollowsMe(u.following?.some(f => (f._id||f)?.toString() === currentUser?._id?.toString()));
      try {
        const p = await API.get(`/post/user/${u._id}`);
        setPosts(p.data.posts || []);
      } catch { setPosts([]); }
    } catch {
      toast.error("User not found");
      navigate("/");
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    try {
      const res = await API.put(`/user/follow/${profile._id}`);
      setFollowing(res.data.followed);
      setProfile(prev => ({
        ...prev,
        followers: res.data.followed
          ? [...(prev.followers||[]), currentUser]
          : (prev.followers||[]).filter(f => (f._id||f)?.toString() !== currentUser?._id?.toString()),
      }));
    } catch { toast.error("Failed"); }
  };

  const handleMessage = async () => {
    try {
      await dispatch(getOrCreateChat(profile._id));
      navigate("/chat");
    } catch { toast.error("Could not open chat"); }
  };

  const isOwnProfile = currentUser?.username === username;

  /* Follow button styles */
  const followBtnStyle = following
    ? { background:"var(--surface-2)", color:"var(--text)", border:"1px solid var(--border)" }
    : followsMe
    ? { background:"var(--text)", color:"var(--bg)", border:"1px solid var(--text)" }
    : { background:"var(--accent)", color:"#fff", border:"none" };

  const followBtnLabel = following ? "Following" : followsMe ? "Follow Back" : "Follow";

  /* Build follow list with isFollowedByMe flag */
  const buildList = (arr) =>
    (arr || []).map(u => ({
      ...u,
      isFollowedByMe: currentUser?.following?.some(f => (f._id||f)?.toString() === (u._id||u)?.toString()),
    }));

  if (loading) return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="skeleton" style={{ width:86, height:86, borderRadius:"50%", flexShrink:0 }} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
          <div className="skeleton skeleton-line" style={{ width:"35%", height:18 }} />
          <div className="skeleton skeleton-line" style={{ width:"55%", height:12 }} />
          <div className="skeleton skeleton-line" style={{ width:"25%", height:12 }} />
        </div>
      </div>
      <div className="profile-grid">
        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ aspectRatio:"1" }} />)}
      </div>
    </div>
  );

  if (!profile) return null;

  const savedPosts   = isOwnProfile ? posts.filter(p => currentUser?.savedPosts?.includes(p._id)) : [];
  const forSalePosts = posts.filter(p => p.isForSale && !p.isSold);
  const displayPosts = tab === "saved" ? savedPosts : tab === "tagged" ? forSalePosts : posts;

  return (
    <div className="profile-page">
      {!isOwnProfile && (
        <button onClick={() => navigate(-1)} className="profile-back-btn">
          <AiOutlineArrowLeft /> Back
        </button>
      )}

      {/* ── Header ── */}
      <div className="profile-header">
        {/* Avatar */}
        <div className="profile-avatar-wrap">
          {profile.avatar?.url
            ? <img src={profile.avatar.url} alt={profile.username} />
            : <div className="avatar-fallback large">{profile.username?.[0]?.toUpperCase()}</div>
          }
        </div>

        <div className="profile-info">
          {/* Username row */}
          <div className="profile-username-row">
            <h2>{profile.username}</h2>

            {!isOwnProfile && followsMe && !following && (
              <span className="follows-you-badge">Follows you</span>
            )}

            {isOwnProfile ? (
              <Link to="/edit-profile" className="btn-ghost" style={{ fontSize:12, padding:"6px 16px" }}>
                Edit Profile
              </Link>
            ) : (
              <>
                <button onClick={handleFollow}
                  style={{ ...followBtnStyle, padding:"7px 18px", borderRadius:"var(--radius-sm)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)", transition:"all .2s" }}>
                  {followBtnLabel}
                </button>
                <button onClick={handleMessage} className="btn-ghost" style={{ fontSize:12, padding:"6px 16px" }}>
                  Message
                </button>
              </>
            )}
          </div>

          {/* Stats — clickable */}
          <div className="profile-stats">
            <span><strong>{posts.length}</strong> posts</span>
            <button className="profile-stat-btn" onClick={() => setFollowModal("followers")}>
              <strong>{profile.followers?.length || 0}</strong> followers
            </button>
            <button className="profile-stat-btn" onClick={() => setFollowModal("following")}>
              <strong>{profile.following?.length || 0}</strong> following
            </button>
          </div>

          {profile.name    && <p className="profile-name">{profile.name}</p>}
          {profile.bio     && <p className="profile-bio">{profile.bio}</p>}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noreferrer" className="profile-website">
              <AiOutlineLink style={{marginRight:4}} />{profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        {[
          { key:"posts",  icon:<AiOutlineAppstore />,  label:"Posts" },
          ...(isOwnProfile ? [{ key:"saved", icon:<BsBookmark />, label:"Saved" }] : []),
          { key:"tagged", icon:<AiOutlineTag />, label:"Shop" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`profile-tab ${tab===t.key ? "active" : ""}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {displayPosts.length === 0 ? (
        <div className="profile-empty">
          <div style={{ fontSize:42 }}>{tab==="saved" ? <BsBookmark /> : tab==="tagged" ? <BsHandbag /> : <AiOutlineCamera />}</div>
          <p>{tab==="saved" ? "No saved posts" : tab==="tagged" ? "No items for sale" : "No posts yet"}</p>
        </div>
      ) : (
        <div className="profile-grid">
          {displayPosts.map(post => (
            <div key={post._id} className="profile-grid-item" onClick={() => setSelectedPost(post)}>
              <img src={post.image?.url} alt={post.caption || "post"} />
              <div className="profile-grid-overlay">
                <span style={{display:"flex",alignItems:"center",gap:2}}><AiOutlineHeart />{post.likes?.length||0}</span>
                <span style={{display:"flex",alignItems:"center",gap:2}}><AiOutlineMessage />{post.comments?.length||0}</span>
              </div>
              {post.isForSale && !post.isSold && (
                <div className="profile-grid-sale-tag"><AiOutlineTag /> ${post.price}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Followers / Following Modal ── */}
      {followModal && (
        <FollowListModal
          title={followModal === "followers" ? "Followers" : "Following"}
          users={buildList(followModal === "followers" ? profile.followers : profile.following)}
          currentUserId={currentUser?._id}
          onClose={() => setFollowModal(null)}
          onFollowToggle={fetchProfile}
        />
      )}

      {/* ── Post Preview Modal ── */}
      {selectedPost && (
        <PostPreviewModal
          post={{ ...selectedPost, owner: profile }}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default Profile;