import { AiOutlineArrowUp, AiOutlineBarChart, AiOutlineBulb, AiOutlineCamera, AiOutlineClockCircle, AiOutlineEye, AiOutlineFileText, AiOutlineHeart, AiOutlineMessage, AiOutlinePicture, AiOutlineRise, AiOutlineTrophy, AiOutlineUser } from "react-icons/ai";
import { BsPeopleFill } from "react-icons/bs";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import API from "../utils/api";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const StatCard = ({ icon, label, value, sub, color, delay }) => (
  <div className="stat-card" style={{ animationDelay: delay }}>
    <div className="stat-card-icon" style={{ background: color }}>{icon}</div>
    <div className="stat-card-body">
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const { user } = useSelector(s => s.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get("/analytics/me");
        setData(res.data.analytics);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="analytics-page">
      <div className="analytics-loading">
        <div className="analytics-pulse" />
        <div className="analytics-pulse" style={{ width: "60%", animationDelay: "0.1s" }} />
        <div className="analytics-grid-skeleton">
          {[1,2,3,4].map(i => <div key={i} className="stat-card-skeleton" style={{ animationDelay: `${i*0.08}s` }} />)}
        </div>
      </div>
    </div>
  );

  // Safe fallback — agar API fail ho toh crash nahi hoga
  const a = data || {
    totalLikes: 0, totalComments: 0, totalFollowers: 0,
    totalFollowing: 0, totalPosts: 0, avgEngagement: 0,
    followerGrowth: [], weeklyActivity: [], topPosts: [],
    audienceData: [], postPerformance: [], postStats: [],
    bestPost: null,
  };

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div className="analytics-header-left">
          <div className="analytics-avatar">
            {user?.avatar?.url
              ? <img src={user.avatar.url} alt={user.username} />
              : <div className="avatar-fallback large">{user?.username?.[0]?.toUpperCase()}</div>
            }
            <span className="analytics-verified"><AiOutlineBarChart /></span>
          </div>
          <div>
            <h1>{user?.username}</h1>
            <p>Creator Dashboard</p>
          </div>
        </div>
        <Link to={`/profile/${user?.username}`} className="btn-ghost" style={{ padding: "8px 20px", fontSize: 13 }}>
          View Profile
        </Link>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        {["overview", "posts", "audience"].map(tab => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          {/* Stat Cards */}
          <div className="stat-cards-grid">
            <StatCard icon={<AiOutlineHeart />} label="Total Likes" value={a.totalLikes.toLocaleString()} color="linear-gradient(135deg,#ff6b6b,#ee5a24)" delay="0s" />
            <StatCard icon={<AiOutlineMessage />} label="Comments" value={a.totalComments.toLocaleString()} color="linear-gradient(135deg,#a29bfe,#6c5ce7)" delay="0.05s" />
            <StatCard icon={<BsPeopleFill />} label="Followers" value={a.totalFollowers.toLocaleString()} sub={`Following ${a.totalFollowing}`} color="linear-gradient(135deg,#55efc4,#00b894)" delay="0.1s" />
            <StatCard icon={<AiOutlineRise />} label="Avg Engagement" value={`${a.avgEngagement}%`} sub="per post" color="linear-gradient(135deg,#fdcb6e,#e17055)" delay="0.15s" />
          </div>

          {/* Follower Growth Chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Follower Growth</h3>
              <span className="chart-badge">6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={a.followerGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0095f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0095f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="followers" name="Followers" stroke="#0095f6" fill="url(#followerGrad)" strokeWidth={2} dot={{ r: 4, fill: "#0095f6" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Activity */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Weekly Activity</h3>
              <span className="chart-badge">Last 7 days</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={a.weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="likes" name="Likes" fill="#ff6b6b" radius={[4,4,0,0]} />
                <Bar dataKey="posts" name="Posts" fill="#0095f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Best Post */}
          {a.bestPost && (
            <div className="best-post-card">
              <div className="best-post-badge"><AiOutlineTrophy /> Best Performing Post</div>
              <div className="best-post-content">
                <img src={a.bestPost.image} alt="best post" />
                <div className="best-post-info">
                  <p className="best-post-caption">{a.bestPost.caption || "No caption"}</p>
                  <div className="best-post-stats">
                    <span><AiOutlineHeart /> {a.bestPost.likes} likes</span>
                    <span><AiOutlineMessage /> {a.bestPost.comments} comments</span>
                    <span><AiOutlineRise /> {a.bestPost.engagementRate}% engagement</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* POSTS TAB */}
      {activeTab === "posts" && (
        <div className="posts-analytics">
          <div className="posts-analytics-header">
            <h3>Post Performance</h3>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{a.totalPosts} total posts</span>
          </div>
          {a.postStats.length === 0 ? (
            <div className="search-empty">
              <div className="search-empty-icon"><AiOutlineCamera /></div>
              <p>No posts yet. Create your first post!</p>
            </div>
          ) : (
            <div className="post-analytics-list">
              {a.postStats.map((post, i) => (
                <div key={post._id} className="post-analytics-item" style={{ animationDelay: `${i * 0.05}s` }}>
                  <span className="post-rank">#{i + 1}</span>
                  <img src={post.image} alt={post.caption} />
                  <div className="post-analytics-info">
                    <p>{post.caption}</p>
                    <div className="post-analytics-stats">
                      <span><AiOutlineHeart /> {post.likes}</span>
                      <span><AiOutlineMessage /> {post.comments}</span>
                      <span><AiOutlineRise /> {post.engagementRate}%</span>
                    </div>
                  </div>
                  <div className="post-engagement-bar">
                    <div style={{ width: `${Math.min(parseFloat(post.engagementRate) * 5, 100)}%`, background: "linear-gradient(90deg, #0095f6, #a855f7)", borderRadius: 4, height: "100%", transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AUDIENCE TAB */}
      {activeTab === "audience" && (
        <div className="audience-analytics">
          <div className="audience-stat-row">
            <div className="audience-stat-box">
              <div className="audience-stat-num">{a.totalFollowers}</div>
              <div className="audience-stat-label">Followers</div>
              <div className="audience-stat-icon" style={{ color: "#0095f6" }}><AiOutlineArrowUp /></div>
            </div>
            <div className="audience-stat-box">
              <div className="audience-stat-num">{a.totalFollowing}</div>
              <div className="audience-stat-label">Following</div>
            </div>
            <div className="audience-stat-box">
              <div className="audience-stat-num">{a.totalPosts}</div>
              <div className="audience-stat-label">Posts</div>
            </div>
            <div className="audience-stat-box">
              <div className="audience-stat-num">{a.avgEngagement}%</div>
              <div className="audience-stat-label">Avg Engagement</div>
            </div>
          </div>

          <div className="chart-card" style={{ marginTop: 20 }}>
            <div className="chart-card-header">
              <h3>Follower Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={a.followerGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="audienceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="followers" name="Followers" stroke="#a855f7" fill="url(#audienceGrad)" strokeWidth={2} dot={{ r: 4, fill: "#a855f7" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="creator-tips">
            <h3><AiOutlineBulb /> Creator Tips</h3>
            <div className="tips-grid">
              {[
                { icon: "clock", tip: "Post between 6-9 PM for best reach" },
                { icon: "file", tip: "Captions with 3-5 hashtags get 2x engagement" },
                { icon: "chat", tip: "Reply to comments in first hour to boost reach" },
                { icon: "photo", tip: "High contrast images get 40% more likes" },
              ].map((t, i) => (
                <div key={i} className="tip-card">
                  <span>{t.icon}</span>
                  <p>{t.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;