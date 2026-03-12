import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMarketplacePosts } from "../redux/reducers/postSlice";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import API from "../utils/api";
import toast from "react-hot-toast";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || "pk_test_your_key");

const CheckoutForm = ({ post, clientSecret, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (error) { toast.error(error.message); setLoading(false); return; }
      if (paymentIntent.status === "succeeded") {
        await API.post("/payment/confirm", { postId: post._id, paymentIntentId: paymentIntent.id });
        toast.success("🎉 Post purchased successfully!");
        onSuccess();
        onClose();
      }
    } catch (err) { toast.error("Payment failed"); }
    setLoading(false);
  };

  return (
    <form onSubmit={handlePay}>
      <div style={{ border: "1px solid #efefef", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
        <CardElement options={{ style: { base: { fontSize: "16px", fontFamily: "DM Sans, sans-serif" } } }} />
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" type="button" onClick={onClose}>Cancel</button>
        <button className="btn-primary" style={{ width: "auto", padding: "8px 24px" }} type="submit" disabled={loading || !stripe}>
          {loading ? "Processing..." : `Pay $${post.price}`}
        </button>
      </div>
    </form>
  );
};

const BuyModal = ({ post, onClose, onSuccess }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createIntent = async () => {
      try {
        const res = await API.post(`/payment/intent/${post._id}`);
        setClientSecret(res.data.clientSecret);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to initiate payment");
        onClose();
      }
      setLoading(false);
    };
    createIntent();
  }, [post._id, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Buy Post</h3>
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
          <img src={post.image?.url} alt="post" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
          <div>
            <div style={{ fontWeight: 600 }}>@{post.owner?.username}</div>
            <div style={{ color: "#737373", fontSize: 14 }}>{post.caption?.slice(0, 50)}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0095f6", marginTop: 4 }}>${post.price}</div>
          </div>
        </div>
        {loading ? <div style={{ textAlign: "center", padding: 20 }}>Loading payment...</div> :
          clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm post={post} clientSecret={clientSecret} onSuccess={onSuccess} onClose={onClose} />
            </Elements>
          )
        }
      </div>
    </div>
  );
};

const Marketplace = () => {
  const dispatch = useDispatch();
  const { marketplacePosts, loading } = useSelector((s) => s.posts);
  const [buyingPost, setBuyingPost] = useState(null);

  useEffect(() => { dispatch(getMarketplacePosts()); }, [dispatch]);

  return (
    <div className="marketplace-page">
      <div className="marketplace-header">
        <h2>Marketplace</h2>
        <span style={{ color: "#737373", fontSize: 14 }}>{marketplacePosts.length} posts for sale</span>
      </div>

      {loading ? <div className="loader" style={{ height: 200 }} /> :
        marketplacePosts.length === 0 ? (
          <div style={{ textAlign: "center", color: "#737373", padding: 60 }}>
            <div style={{ fontSize: 48 }}>🛍️</div>
            <p style={{ marginTop: 16 }}>No posts for sale yet.</p>
          </div>
        ) : (
          <div className="marketplace-grid">
            {marketplacePosts.map((post) => (
              <div key={post._id} className="marketplace-card">
                <img src={post.image?.url} alt="post" />
                <div className="marketplace-card-info">
                  <strong>@{post.owner?.username}</strong>
                  <div style={{ color: "#737373", fontSize: 13, marginBottom: 4 }}>{post.caption?.slice(0, 40)}...</div>
                  <div className="marketplace-card-price">${post.price}</div>
                  <button className="btn-buy" onClick={() => setBuyingPost(post)}>Buy Now</button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {buyingPost && (
        <BuyModal post={buyingPost} onClose={() => setBuyingPost(null)} onSuccess={() => dispatch(getMarketplacePosts())} />
      )}
    </div>
  );
};

export default Marketplace;
