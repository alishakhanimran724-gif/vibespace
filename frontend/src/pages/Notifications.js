import { AiOutlineBell, AiOutlineHeart, AiOutlineMessage, AiOutlineShoppingCart, AiOutlineSound, AiOutlineUser } from "react-icons/ai";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getNotifications, markAllRead, markOneRead } from "../redux/reducers/notificationSlice";
import API from "../utils/api";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const timeAgo = date => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const getNotifIcon = type => {
  switch (type) {
    case "like":    return <AiOutlineHeart style={{color:'#ef4444'}} />;
    case "comment": return <AiOutlineMessage style={{color:'#3b82f6'}} />;
    case "follow":  return <AiOutlineUser style={{color:'#22c55e'}} />;
    case "mention": return <AiOutlineSound style={{color:'#f59e0b'}} />;
    case "sale":    return <AiOutlineShoppingCart style={{color:'#8b5cf6'}} />;
    default:        return <AiOutlineBell />;
  }
};

const getNotifText = n => {
  switch (n.type) {
    case "like":    return "liked your post";
    case "comment": return `commented: "${n.text?.slice(0, 40) || ""}"`;
    case "follow":  return "started following you";
    case "mention": return "mentioned you in a post";
    case "sale":    return "purchased your item";
    default:        return "sent you a notification";
  }
};

const NotifSkeleton = () => (
  <div className="notif-item" style={{ gap:12 }}>
    <div className="skeleton-avatar" style={{ width:44, height:44, flexShrink:0 }} />
    <div style={{ flex:1 }}>
      <div className="skeleton-line" style={{ width:"60%", marginBottom:6 }} />
      <div className="skeleton-line" style={{ width:"30%" }} />
    </div>
  </div>
);

export default function Notifications() {
  const dispatch = useDispatch();
  const { notifications, loading } = useSelector(s => s.notifications);
  const { user } = useSelector(s => s.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    dispatch(getNotifications());
    dispatch(markAllRead());

    // Real-time socket for live notifications
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:4000");
    socketRef.current.emit("join", user?._id);

    socketRef.current.on("newNotification", () => {
      dispatch(getNotifications());
    });

    return () => socketRef.current?.disconnect();
  }, [dispatch, user]);

  const grouped = {
    today:    notifications.filter(n => {
      const d = new Date(n.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }),
    earlier: notifications.filter(n => {
      const d = new Date(n.createdAt);
      const now = new Date();
      return d.toDateString() !== now.toDateString();
    }),
  };

  const renderNotif = n => (
    <div key={n._id} className={`notif-item ${!n.read ? "unread" : ""}`}
      onClick={() => dispatch(markOneRead(n._id))}>
      {/* Avatar with icon badge */}
      <div style={{ position:"relative", flexShrink:0 }}>
        {n.sender?.avatar?.url
          ? <img src={n.sender.avatar.url} alt="" className="notif-avatar" />
          : <div className="avatar-fallback" style={{ width:44, height:44, fontSize:15 }}>
              {n.sender?.username?.[0]?.toUpperCase() || "?"}
            </div>
        }
        <span className="notif-type-badge">{getNotifIcon(n.type)}</span>
      </div>

      {/* Text */}
      <div className="notif-content">
        <span>
          <Link to={`/profile/${n.sender?.username}`}
            style={{ fontWeight:700, color:"var(--text)", textDecoration:"none" }}
            onClick={e => e.stopPropagation()}>
            {n.sender?.username}
          </Link>
          {" "}{getNotifText(n)}
        </span>
        <div className="notif-time">{timeAgo(n.createdAt)}</div>
      </div>

      {/* Post thumb */}
      {n.post?.image?.url && (
        <img src={n.post.image.url} alt="" className="notif-post-thumb" />
      )}

      {/* Unread dot */}
      {!n.read && <div className="notif-unread-dot" />}
    </div>
  );

  return (
    <div className="notif-page">
      <div className="notif-header">
        <h2>Notifications</h2>
        {notifications.some(n => !n.read) && (
          <button className="btn-ghost" style={{ fontSize:13, padding:"6px 14px" }}
            onClick={() => dispatch(markAllRead())}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div>{[1,2,3,4,5].map(i => <NotifSkeleton key={i} />)}</div>
      ) : notifications.length === 0 ? (
        <div className="notif-empty">
          <AiOutlineBell style={{ fontSize:48, color:"var(--border)", display:"block", margin:"0 auto 12px" }} />
          <p style={{ textAlign:"center", color:"var(--text-3)", fontSize:14 }}>
            No notifications yet.<br />Start interacting to see activity here!
          </p>
        </div>
      ) : (
        <>
          {grouped.today.length > 0 && (
            <div className="notif-group">
              <div className="notif-group-label">Today</div>
              {grouped.today.map(renderNotif)}
            </div>
          )}
          {grouped.earlier.length > 0 && (
            <div className="notif-group">
              <div className="notif-group-label">Earlier</div>
              {grouped.earlier.map(renderNotif)}
            </div>
          )}
        </>
      )}
    </div>
  );
}