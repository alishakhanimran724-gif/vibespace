import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { TbError404 } from "react-icons/tb";
import { AiOutlineHome, AiOutlineArrowLeft } from "react-icons/ai";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="notfound-page">
      <div className="notfound-content">
        <div className="notfound-code">404</div>
        <div className="notfound-emoji"><TbError404 /></div>
        <h2>Page not found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div style={{ display:"flex", gap:12, marginTop:24, justifyContent:"center" }}>
          <button className="btn-ghost" onClick={() => navigate(-1)} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px" }}>
            <AiOutlineArrowLeft /> Go Back
          </button>
          <Link to="/" className="btn-primary" style={{ display:"flex", alignItems:"center", gap:6, textDecoration:"none", width:"auto", padding:"10px 20px" }}>
            <AiOutlineHome /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}