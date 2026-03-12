import { AiFillHeart, AiOutlineClose, AiOutlineDollar, AiOutlineHeart, AiOutlineInbox, AiOutlineSearch, AiOutlineShop, AiOutlineShopping, AiOutlineShoppingCart, AiOutlineTag } from "react-icons/ai";
import { BsArrowCounterclockwise, BsBoxSeam, BsGraphUp, BsShieldLock, BsStar, BsStarFill, BsTruck } from "react-icons/bs";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import API from "../utils/api";
import toast from "react-hot-toast";
import CheckoutModal from "./CheckoutModal";

/* ── Star Rating ── */
const Stars = ({ rating }) => (
  <div style={{ display:"flex", gap:1 }}>
    {[1,2,3,4,5].map(s => (
      <span key={s}>
        {s <= Math.round(rating)
          ? <BsStarFill style={{ color:"#f59e0b", fontSize:11 }} />
          : <BsStar    style={{ color:"var(--border)", fontSize:11 }} />
        }
      </span>
    ))}
  </div>
);

/* ── Product Modal ── */
const ProductModal = ({ post, onClose, currentUser }) => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const isOwner = post.owner?._id?.toString() === currentUser?._id?.toString();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ margin:0, fontFamily:"var(--font-serif)", fontStyle:"italic" }}>{post.caption?.slice(0,40) || "Product"}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"var(--text-3)", display:"flex" }}>
            <AiOutlineClose />
          </button>
        </div>
        {post.image?.url && (
          <img src={post.image.url} alt="" style={{ width:"100%", borderRadius:"var(--radius-sm)", marginBottom:16, maxHeight:320, objectFit:"cover" }} />
        )}
        <div style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>${post.price}</div>
        {post.caption && <p style={{ fontSize:14, color:"var(--text-2)", lineHeight:1.5, marginBottom:16 }}>{post.caption}</p>}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          {["Free Shipping","Secure Pay","Returns OK"].map((tag, idx) => (
            <span key={idx} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, color:"var(--text-3)", background:"var(--hover)", padding:"4px 10px", borderRadius:20 }}>
              {idx === 0 ? <BsTruck /> : idx === 1 ? <BsShieldLock /> : <BsArrowCounterclockwise />}
              {tag}
            </span>
          ))}
        </div>
        {!isOwner && (
          <button className="btn-primary" style={{ width:"100%" }} onClick={() => setCheckoutOpen(true)}>
            <AiOutlineShoppingCart style={{ marginRight:6 }} /> Buy Now — ${post.price}
          </button>
        )}
        {checkoutOpen && <CheckoutModal post={post} onClose={() => setCheckoutOpen(false)} onSuccess={() => { setCheckoutOpen(false); onClose(); }} />}
      </div>
    </div>
  );
};

/* ── Product Card ── */
const ProductCard = ({ post, onWishlist, isWishlisted, currentUser }) => {
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <div
        className="product-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ animation:"cardIn 0.3s ease both" }}
      >
        <div className="product-img-wrap" onClick={() => setModalOpen(true)}>
          {post.image?.url
            ? <img src={post.image.url} alt="" className="product-img" />
            : <div style={{ width:"100%", aspectRatio:"1", background:"var(--hover)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <AiOutlineInbox style={{ fontSize:32, color:"var(--text-3)" }} />
              </div>
          }
          <div className="product-price-tag"><AiOutlineTag /> ${post.price}</div>
          {hovered && (
            <div className="product-hover-overlay">
              <button className="product-quick-buy" onClick={e => { e.stopPropagation(); setModalOpen(true); }}>
                Quick View
              </button>
            </div>
          )}
        </div>
        <div className="product-info">
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
            <div>
              <Link to={`/profile/${post.owner?.username}`} className="product-seller">
                @{post.owner?.username}
              </Link>
              <p className="product-caption">{post.caption?.slice(0,60) || "No description"}</p>
            </div>
            <button
              className="product-wishlist-btn"
              onClick={() => onWishlist?.(post._id)}
              style={{ color: isWishlisted ? "#ef4444" : "var(--text-3)" }}
            >
              {isWishlisted ? <AiFillHeart /> : <AiOutlineHeart />}
            </button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
            <Stars rating={post.avgRating || 4} />
            <span style={{ fontSize:11, color:"var(--text-3)" }}>({post.reviewCount || 0})</span>
          </div>
        </div>
      </div>
      {modalOpen && <ProductModal post={post} onClose={() => setModalOpen(false)} currentUser={currentUser} />}
    </>
  );
};

/* ── Main Seller Dashboard ── */
const SellerDashboard = () => {
  const { user } = useSelector(s => s.auth);
  const [tab,       setTab]       = useState("browse");
  const [posts,     setPosts]     = useState([]);
  const [myPosts,   setMyPosts]   = useState([]);
  const [wishlist,  setWishlist]  = useState([]);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [stats,     setStats]     = useState({ sales:0, revenue:0, listed:0 });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mpRes, myRes] = await Promise.all([
        API.get("/post/marketplace"),
        API.get(`/post/user/${user._id}`),
      ]);
      const mp = mpRes.data.posts || [];
      const my = (myRes.data.posts || []).filter(p => p.price);
      setPosts(mp);
      setMyPosts(my);
      setStats({ listed: my.length, sales: my.filter(p => p.sold).length, revenue: my.reduce((a,p) => a + (p.sold ? Number(p.price||0) : 0), 0) });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleWishlist = (postId) => {
    const id = postId?.toString();
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    toast.success(wishlist.includes(postId?.toString()) ? "Removed from saved" : "Saved!");
  };

  const TABS = [
    { key:"browse",   label:"Browse",  icon:<AiOutlineShopping /> },
    { key:"listings", label:"My Shop", icon:<AiOutlineShop /> },
    { key:"wishlist", label:"Saved",   icon:<AiOutlineHeart /> },
  ];

  const filtered = posts.filter(p =>
    !search || p.caption?.toLowerCase().includes(search.toLowerCase()) ||
    p.owner?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const wishlistPosts = posts.filter(p => wishlist.includes(p._id?.toString()));

  return (
    <div className="seller-page">

      {/* Header */}
      <div className="seller-header">
        <div>
          <h2 style={{ fontFamily:"var(--font-serif)", fontStyle:"italic", fontWeight:500, margin:0 }}>Marketplace</h2>
          <p style={{ fontSize:13, color:"var(--text-3)", margin:"4px 0 0" }}>Buy and sell with the community</p>
        </div>
      </div>

      {/* Stats (my shop view) */}
      {tab === "listings" && (
        <div className="seller-stats-row">
          {[
            { icon:<BsBoxSeam />, label:"Listed",  val:stats.listed  },
            { icon:<BsBoxSeam style={{color:"#22c55e"}}/>, label:"Sold", val:stats.sales },
            { icon:<BsGraphUp style={{color:"#8b5cf6"}}/>, label:"Revenue", val:`$${stats.revenue}` },
          ].map((s, i) => (
            <div key={i} className="seller-stat-card">
              <div className="seller-stat-icon">{s.icon}</div>
              <div className="seller-stat-val">{s.val}</div>
              <div className="seller-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="seller-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`seller-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
            {t.key === "wishlist" && wishlist.length > 0 && (
              <span className="seller-tab-badge">{wishlist.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search bar (browse tab) */}
      {tab === "browse" && (
        <div className="seller-search-wrap">
          <AiOutlineSearch style={{ color:"var(--text-3)", fontSize:16, flexShrink:0 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="seller-search-input"
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", display:"flex", fontSize:16 }}>
              <AiOutlineClose />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="seller-content">
        {loading ? (
          <div className="product-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="product-card-skeleton" style={{ animationDelay:`${i*0.05}s` }} />
            ))}
          </div>
        ) : tab === "browse" ? (
          filtered.length === 0 ? (
            <div className="seller-empty">
              <AiOutlineShopping style={{ fontSize:52, color:"var(--text-3)", display:"block", margin:"0 auto 16px" }} />
              <h3>No products found</h3>
              <p>Try a different search</p>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map(p => (
                <ProductCard
                  key={p._id?.toString()}
                  post={p}
                  currentUser={user}
                  onWishlist={toggleWishlist}
                  isWishlisted={wishlist.includes(p._id?.toString())}
                />
              ))}
            </div>
          )
        ) : tab === "listings" ? (
          myPosts.length === 0 ? (
            <div className="seller-empty">
              <AiOutlineShop style={{ fontSize:52, color:"var(--text-3)", display:"block", margin:"0 auto 16px" }} />
              <h3>No listings yet</h3>
              <p>Create a post with a price to list it for sale</p>
              <Link to="/" className="btn-primary" style={{ marginTop:16, display:"inline-block" }}>Create Post</Link>
            </div>
          ) : (
            <div className="product-grid">
              {myPosts.map(p => (
                <ProductCard key={p._id?.toString()} post={p} currentUser={user} onWishlist={toggleWishlist} isWishlisted={wishlist.includes(p._id?.toString())} />
              ))}
            </div>
          )
        ) : (
          wishlistPosts.length === 0 ? (
            <div className="seller-empty">
              <AiOutlineHeart style={{ fontSize:52, color:"var(--text-3)", display:"block", margin:"0 auto 16px" }} />
              <h3>Nothing saved yet</h3>
              <p>Tap the heart on any product to save it</p>
            </div>
          ) : (
            <div className="product-grid">
              {wishlistPosts.map(p => (
                <ProductCard key={p._id?.toString()} post={p} currentUser={user} onWishlist={toggleWishlist} isWishlisted={true} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;