import { AiOutlineGlobal, AiOutlineVideoCamera, AiOutlineSound, AiOutlineDribbble } from "react-icons/ai";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerUser } from "../redux/reducers/authSlice";
import toast from "react-hot-toast";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    const res = await dispatch(registerUser(data));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Account created! Let's set up your profile");
      navigate("/welcome"); // → onboarding
    } else {
      toast.error(res.payload || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-logo">VibeSpace</div>
        <p className="auth-left-tagline">
          Join thousands of creators sharing their world every day.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          {[<AiOutlineGlobal />, <AiOutlineVideoCamera />, <AiOutlineSound />, <AiOutlineDribbble />].map((e, i) => (
            <span key={i} style={{ fontSize: 24, opacity: 0.6 }}>{e}</span>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-logo">VibeSpace</div>
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginBottom: 20, marginTop: -16 }}>
            Create your account
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="text" placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="text" placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
              required
            />
            <input
              type="email" placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              type="password" placeholder="Password (min 6 characters)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button type="submit" className="btn-primary" style={{ marginTop: 4 }} disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;