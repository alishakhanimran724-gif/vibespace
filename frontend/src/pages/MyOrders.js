import { AiOutlineCheckCircle, AiOutlineInbox } from "react-icons/ai";
import React, { useState, useEffect } from "react";
import API from "../utils/api";
import { Link } from "react-router-dom";
import { AiOutlineShoppingCart, AiOutlineArrowLeft, AiOutlineRight } from "react-icons/ai";
import { BsBoxSeam, BsTruck, BsCheckCircle, BsClockHistory, BsGear } from "react-icons/bs";
import { format } from "timeago.js";

const STATUS_STEPS = ["pending","confirmed","processing","shipped","delivered"];

const STATUS_META = {
  pending:    { icon: <BsClockHistory />,  color: "#f59e0b", label: "Pending" },
  confirmed:  { icon: <BsCheckCircle />,   color: "#3b82f6", label: "Confirmed" },
  processing: { icon: <BsGear />,          color: "#8b5cf6", label: "Processing" },
  shipped:    { icon: <BsTruck />,         color: "#06b6d4", label: "Shipped" },
  delivered:  { icon: <BsCheckCircle />,   color: "#22c55e", label: "Delivered" },
};

const OrderTimeline = ({ status }) => {
  const current = STATUS_STEPS.indexOf(status);
  return (
    <div className="order-timeline">
      {STATUS_STEPS.map((s, i) => {
        const meta = STATUS_META[s];
        const done = i <= current;
        const active = i === current;
        return (
          <div key={s} className={`timeline-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
            <div className="timeline-icon" style={{ color: done ? meta.color : "var(--border)" }}>
              {meta.icon}
            </div>
            <div className="timeline-label">{meta.label}</div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`timeline-line ${i < current ? "filled" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const OrderCard = ({ order, onClick }) => {
  const meta = STATUS_META[order.deliveryStatus] || STATUS_META.pending;
  return (
    <div className="order-card" onClick={onClick}>
      <img src={order.post?.image?.url} alt={order.post?.caption} className="order-thumb" />
      <div className="order-info">
        <div className="order-caption">{order.post?.caption?.slice(0, 50) || "Product"}</div>
        <div className="order-seller">
          Sold by <strong>@{order.seller?.username}</strong>
        </div>
        <div className="order-meta-row">
          <span className="order-amount">${order.amount}</span>
          <span className="order-status-badge" style={{ background: meta.color + "20", color: meta.color, border: `1px solid ${meta.color}40` }}>
            {meta.icon} {meta.label}
          </span>
        </div>
        <div className="order-date">{format(order.createdAt)}</div>
      </div>
      <AiOutlineRight style={{ color:"var(--text-3)", flexShrink:0 }} />
    </div>
  );
};

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-detail-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="order-detail-header">
          <button onClick={onClose} className="profile-back-btn" style={{ marginBottom:0 }}>
            <AiOutlineArrowLeft /> Back
          </button>
          <span style={{ fontSize:13, color:"var(--text-3)" }}>Order #{order._id?.slice(-8).toUpperCase()}</span>
        </div>

        {/* Product */}
        <div className="order-detail-product">
          <img src={order.post?.image?.url} alt="" />
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>{order.post?.caption?.slice(0,60) || "Product"}</div>
            <div style={{ fontSize:13, color:"var(--text-3)", marginTop:4 }}>
              Sold by <Link to={`/profile/${order.seller?.username}`} onClick={onClose} style={{ color:"var(--accent)", fontWeight:600, textDecoration:"none" }}>@{order.seller?.username}</Link>
            </div>
            <div style={{ fontSize:18, fontWeight:800, marginTop:8, color:"var(--text)" }}>${order.amount}</div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ padding:"0 20px 8px" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text-2)", marginBottom:14, textTransform:"uppercase", letterSpacing:0.5 }}>
            Order Status
          </div>
          <OrderTimeline status={order.deliveryStatus} />
        </div>

        {/* Estimated delivery */}
        {order.estimatedDelivery && (
          <div className="order-est-delivery">
            <BsTruck style={{ fontSize:16 }} />
            <div>
              <div style={{ fontSize:12, color:"var(--text-3)" }}>Estimated Delivery</div>
              <div style={{ fontSize:14, fontWeight:600 }}>
                {new Date(order.estimatedDelivery).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
              </div>
            </div>
          </div>
        )}

        {/* Order info */}
        <div className="order-detail-info">
          <div className="order-info-row">
            <span>Order ID</span>
            <span style={{ fontFamily:"monospace", fontSize:12 }}>#{order._id?.slice(-8).toUpperCase()}</span>
          </div>
          <div className="order-info-row">
            <span>Placed</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="order-info-row">
            <span>Payment</span>
            <span style={{ color:"#22c55e", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}><AiOutlineCheckCircle /> Paid</span>
          </div>
          <div className="order-info-row total">
            <span>Total</span>
            <span>${order.amount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MyOrders() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [tab, setTab]           = useState("all"); // all | active | delivered

  useEffect(() => {
    API.get("/payment/my-orders")
      .then(({ data }) => { if (data.success) setOrders(data.orders || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    if (tab === "active")    return o.deliveryStatus !== "delivered";
    if (tab === "delivered") return o.deliveryStatus === "delivered";
    return true;
  });

  if (loading) return (
    <div className="orders-page">
      <div className="orders-header"><h2>My Orders</h2></div>
      {[1,2,3].map(i => (
        <div key={i} className="order-card skeleton-card" style={{ height:100 }} />
      ))}
    </div>
  );

  return (
    <div className="orders-page">
      <div className="orders-header">
        <AiOutlineShoppingCart style={{ fontSize:22 }} />
        <h2>My Orders</h2>
        <span className="orders-count">{orders.length}</span>
      </div>

      {/* Tabs */}
      <div className="orders-tabs">
        {[
          { key:"all",       label:"All" },
          { key:"active",    label:"Active" },
          { key:"delivered", label:"Delivered" },
        ].map(t => (
          <button key={t.key}
            className={`orders-tab ${tab===t.key?"active":""}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="orders-empty">
          <AiOutlineInbox style={{ fontSize:52, color:"var(--text-3)", display:"block", margin:"0 auto 16px" }} />
          <div style={{ fontSize:16, fontWeight:600, marginTop:12 }}>No orders yet</div>
          <div style={{ fontSize:13, color:"var(--text-3)", marginTop:6 }}>
            {tab === "delivered" ? "No delivered orders" : "When you buy something, it'll show here"}
          </div>
          <Link to="/marketplace" className="btn-primary" style={{ marginTop:20, width:"auto", padding:"10px 24px", textDecoration:"none", display:"inline-flex" }}>
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map(o => (
            <OrderCard key={o._id} order={o} onClick={() => setSelected(o)} />
          ))}
        </div>
      )}

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}