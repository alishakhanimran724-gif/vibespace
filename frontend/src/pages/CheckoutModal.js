import { AiOutlineClose, AiOutlineCloseCircle, AiOutlineGift, AiOutlineLock } from "react-icons/ai";
import React, { useState, useEffect } from "react";
import API from "../utils/api";
import toast from "react-hot-toast";

/* 
  Simple checkout modal — uses Stripe.js loaded via CDN script tag.
  No npm package needed.
  Add to index.html: <script src="https://js.stripe.com/v3/"></script>
*/

const STRIPE_PK = process.env.REACT_APP_STRIPE_PUBLIC_KEY || "";

export default function CheckoutModal({ post, onClose, onSuccess }) {
  const [step, setStep]       = useState("confirm"); // confirm | paying | done | error
  const [errMsg, setErrMsg]   = useState("");
  const [cardEl, setCardEl]   = useState(null);
  const [stripe, setStripe]   = useState(null);
  const [elements, setElements] = useState(null);
  const cardRef = React.useRef();

  /* Load Stripe + mount card element */
  useEffect(() => {
    if (!window.Stripe) {
      // Stripe.js CDN not loaded — show error
      setErrMsg("Stripe.js not loaded. Add script to index.html");
      setStep("error");
      return;
    }
    const s = window.Stripe(STRIPE_PK);
    const els = s.elements();
    const card = els.create("card", {
      style: {
        base: {
          fontSize: "15px",
          color: "#1a1714",
          fontFamily: "'Geist', sans-serif",
          "::placeholder": { color: "#aaa" },
        },
      },
    });
    // Mount after DOM ready
    setTimeout(() => {
      if (cardRef.current) {
        card.mount(cardRef.current);
        setCardEl(card);
        setStripe(s);
        setElements(els);
      }
    }, 100);
    return () => card.unmount?.();
  }, []);

  const handlePay = async () => {
    if (!stripe || !cardEl) return;
    setStep("paying");
    setErrMsg("");
    try {
      // 1. Create payment intent on backend
      const { data } = await API.post(`/payment/intent/${post._id}`);
      if (!data.success) throw new Error(data.message);

      const { clientSecret, orderId } = data;

      // 2. Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardEl },
      });

      if (result.error) throw new Error(result.error.message);

      // 3. Confirm on backend
      await API.post("/payment/confirm", {
        paymentIntentId: result.paymentIntent.id,
      });

      setStep("done");
      toast.success("Payment successful!");
      onSuccess?.({ orderId });

    } catch (err) {
      setErrMsg(err.message || "Payment failed");
      setStep("error");
    }
  };

  if (!post) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="checkout-header">
          <div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>Checkout</div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px" }}>
              ${post.price}
            </div>
          </div>
          <button className="modal-close-btn" style={{ position:"static", background:"var(--surface-2)", color:"var(--text)" }} onClick={onClose}>
            <AiOutlineClose />
          </button>
        </div>

        {/* Product preview */}
        <div className="checkout-product">
          <img src={post.image?.url} alt={post.caption} />
          <div className="checkout-product-info">
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {post.caption?.slice(0, 60) || "Product"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
              Sold by @{post.owner?.username}
            </div>
          </div>
        </div>

        {/* Steps */}
        {step === "confirm" || step === "paying" ? (
          <>
            {/* Card input */}
            <div className="checkout-card-wrap">
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, display: "block" }}>
                Card Details
              </label>
              <div ref={cardRef} className="stripe-card-element" />
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
                <AiOutlineLock style={{ color: "var(--text-3)", fontSize: 13 }} />
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>Secured by Stripe · SSL Encrypted</span>
              </div>
            </div>

            {/* Order summary */}
            <div className="checkout-summary">
              <div className="checkout-summary-row">
                <span>Item price</span>
                <span>${post.price}</span>
              </div>
              <div className="checkout-summary-row">
                <span>Shipping</span>
                <span style={{ color: "#22c55e" }}>Free</span>
              </div>
              <div className="checkout-summary-row total">
                <span>Total</span>
                <span>${post.price}</span>
              </div>
            </div>

            <button
              className="checkout-pay-btn"
              onClick={handlePay}
              disabled={step === "paying" || !stripe}
            >
              {step === "paying" ? (
                <><span className="ai-spinner" /> Processing…</>
              ) : (
                <><AiOutlineLock /> Pay ${post.price}</>
              )}
            </button>
          </>
        ) : step === "done" ? (
          <div className="checkout-done">
            <AiOutlineGift style={{ fontSize:52, color:"#22c55e", display:"block", margin:"0 auto 16px" }} />
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>Payment Successful!</div>
            <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6 }}>
              Your order has been placed. Check My Orders to track it.
            </div>
            <button className="btn-primary" style={{ width: "auto", padding: "10px 28px", marginTop: 20 }} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <div className="checkout-done">
            <AiOutlineCloseCircle style={{ fontSize:46, color:"#ef4444", display:"block", margin:"0 auto 16px" }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 12, color: "var(--danger)" }}>Payment Failed</div>
            <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6, textAlign: "center" }}>{errMsg}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" style={{ padding: "9px 20px" }} onClick={() => setStep("confirm")}>Try Again</button>
              <button className="btn-cancel" style={{ padding: "9px 20px" }} onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}