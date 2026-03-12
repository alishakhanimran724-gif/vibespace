import { AiOutlineCamera, AiOutlinePicture, AiOutlineBgColors, AiOutlineMessage } from "react-icons/ai";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginUser } from "../redux/reducers/authSlice";
import toast from "react-hot-toast";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await dispatch(loginUser(form));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Welcome back!");
      navigate("/");
    } else {
      toast.error(res.payload || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-logo">VibeSpace</div>
        <p className="auth-left-tagline">Share moments, connect with people, discover what inspires you.</p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          {[<AiOutlineCamera />, <AiOutlinePicture />, <AiOutlineBgColors />, <AiOutlineMessage />].map((e, i) => (
            <span key={i} style={{ fontSize: 24, opacity: 0.6 }}>{e}</span>
          ))}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-logo">VibeSpace</div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="email" placeholder="Email address"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              type="password" placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
            <button type="submit" className="btn-primary" style={{ marginTop: 4 }} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="auth-switch">
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;