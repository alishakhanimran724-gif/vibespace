import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  AiOutlineShoppingCart, AiOutlineCheckCircle,
  AiOutlineClockCircle, AiOutlineCar, AiOutlineGift,
  AiOutlineClose,
import { AiOutlineCar, AiOutlineCheckCircle, AiOutlineClockCircle, AiOutlineClose, AiOutlineGift, AiOutlineShoppingCart } from "react-icons/ai";

const API = process.env.REACT_APP_API_URL || "http://localhost:4000/api/v1";

const STATUS_STEPS = [
  { key: "pending",    label: "Order Placed",  icon: <AiOutlineShoppingCart />,  color: "#c8a97e" },
  { key: "confirmed",  label: "Confirmed",     icon: <AiOutlineCheckCircle />,   color: "#2563eb" },
  { key: "processing", label: "Processing",    icon: <AiOutlineClockCircle />,   color: "#7c3aed" },
  { key: "shipped",    label: "Shipped",       icon: <AiOutlineCar />,           color: "#0891b2" },
  { key: "delivered",  label: "Delivered",     icon: <AiOutlineGift />,          color: "#16a34a" },
];

export default function OrderTracking({ orderId, onClose }) {
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    axios.get(`${API}/payment/order/${orderId}`, { withCredentials: true })
      .then(({ data }) => { if (data.success) setOrder(data.order); })
      .catch(() => toast.error("Could not load order"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === order?.deliveryStatus) ?? 0;

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal" style={{ textAlign: "center", padding: 40 }}>
        <div className="loader" style={{ width: 40, height: 40, margin: "0 auto" }} />
      </div>
    </div>
  );

  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17 }}>Order Tracking</h3>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              #{order._id?.slice(-8).toUpperCase()}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 20 }}>
            <AiOutlineClose />
          </button>
        </div>

        {/* Product info */}
        {order.post && (
          <div style={{ display: "flex", gap: 12, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 12, marginBottom: 20 }}>
            {order.post.image?.url && (
              <img src={order.post.image.url} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }} />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{order.post.caption?.slice(0, 60) || "Item"}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>${order.amount}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                Ordered {new Date(order.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ position: "relative", paddingLeft: 28 }}>
          {/* vertical line */}
          <div style={{ position: "absolute", left: 11, top: 12, bottom: 12, width: 2, background: "var(--border)" }} />
          <div
            style={{
              position: "absolute", left: 11, top: 12, width: 2,
              height: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%`,
              background: "var(--accent)", transition: "height 0.8s ease",
            }}
          />

          {STATUS_STEPS.map((step, i) => {
            const done    = i <= currentStep;
            const current = i === currentStep;
            return (
              <div key={step.key} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: i < STATUS_STEPS.length - 1 ? 24 : 0 }}>
                {/* dot */}
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0, marginLeft: -12,
                  background: done ? step.color : "var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "#fff",
                  boxShadow: current ? `0 0 0 4px ${step.color}30` : "none",
                  transition: "all 0.4s ease",
                  position: "relative", zIndex: 1,
                }}>
                  {step.icon}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: current ? 700 : 500, color: done ? "var(--text)" : "var(--text-3)" }}>
                    {step.label}
                  </div>
                  {current && order.statusUpdatedAt && (
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                      {new Date(order.statusUpdatedAt).toLocaleString()}
                    </div>
                  )}
                  {current && order.trackingNote && (
                    <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, fontStyle: "italic" }}>
                      "{order.trackingNote}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Estimated delivery */}
        {order.deliveryStatus !== "delivered" && order.estimatedDelivery && (
          <div style={{ marginTop: 20, padding: "10px 14px", background: "var(--accent-soft)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--accent)", display: "flex", alignItems: "center", gap: 8 }}>
            <AiOutlineClockCircle />
            Estimated delivery: <strong>{new Date(order.estimatedDelivery).toLocaleDateString()}</strong>
          </div>
        )}

        {order.deliveryStatus === "delivered" && (
          <div style={{ marginTop: 20, padding: "12px 14px", background: "#dcfce7", borderRadius: "var(--radius-sm)", fontSize: 13, color: "#16a34a", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
            <AiOutlineGift /> Order delivered!
          </div>
        )}
      </div>
    </div>
  );
}