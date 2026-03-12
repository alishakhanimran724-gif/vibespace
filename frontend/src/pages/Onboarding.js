import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import API from "../utils/api";
import toast from "react-hot-toast";
import { loadUser } from "../redux/reducers/authSlice";
import { AiOutlineCamera, AiOutlineCheck, AiOutlineArrowRight, AiOutlineUser, AiOutlineEdit, AiOutlineHeart, AiOutlineCheckCircle } from "react-icons/ai";
import { BsPersonBoundingBox, BsPalette, BsMusicNote, BsGlobe, BsController, BsBook, BsTree, BsCpu, BsCameraVideo } from "react-icons/bs";
import { MdSportsGymnastics, MdOutlineFastfood, MdOutlinePhotoCamera } from "react-icons/md";
import { RiPlane2Line } from "react-icons/ri";

const STEPS = ["welcome", "avatar", "bio", "interests", "done"];

const INTERESTS = [
  "Photography", "Art & Design", "Music", "Travel",
  "Food", "Fitness", "Books", "Gaming",
  "Nature", "Tech", "Film", "Fashion",
];

export default function Onboarding() {
  const navigate   = useNavigate();
  const dispatch   = useDispatch();
  const { user }   = useSelector(s => s.auth);
  const fileRef    = useRef();

  const [step,          setStep]          = useState(0);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bio,           setBio]           = useState("");
  const [website,       setWebsite]       = useState("");
  const [interests,     setInterests]     = useState([]);
  const [saving,        setSaving]        = useState(false);
  const [dragOver,      setDragOver]      = useState(false);

  const progress = ((step + 1) / STEPS.length) * 100;

  const handleAvatarFile = f => {
    if (!f?.type.startsWith("image/")) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const toggleInterest = tag => {
    setInterests(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("bio", bio + (interests.length ? "\n" + interests.join(" ") : ""));
      fd.append("website", website);
      if (avatarFile) fd.append("avatar", avatarFile);
      await API.put("/user/update", fd);
      await dispatch(loadUser());
      toast.success("Profile set up! Welcome to VibeSpace");
      navigate("/");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    setSaving(false);
  };

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const skip = () => {
    if (step < STEPS.length - 2) next();
    else navigate("/");
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">

        {/* Progress bar */}
        <div className="onboarding-progress-track">
          <div className="onboarding-progress-fill" style={{ width:`${progress}%` }} />
        </div>

        {/* Step counter */}
        <div className="onboarding-step-label">
          Step {step + 1} of {STEPS.length}
        </div>

        {/* ── STEP 0: Welcome ── */}
        {step === 0 && (
          <div className="onboarding-step">
            <div className="onboarding-emoji"><AiOutlineUser /></div>
            <h2>Welcome to VibeSpace{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!</h2>
            <p>Let's set up your profile in just a few steps. It only takes a minute.</p>
            <button className="btn-primary onboarding-cta" onClick={next}>
              Get Started <AiOutlineArrowRight />
            </button>
            <button className="onboarding-skip" onClick={() => navigate("/")}>Skip for now</button>
          </div>
        )}

        {/* ── STEP 1: Avatar ── */}
        {step === 1 && (
          <div className="onboarding-step">
            <div className="onboarding-emoji"><AiOutlineCamera /></div>
            <h2>Add a profile photo</h2>
            <p>Let people know who you are. You can always change this later.</p>

            <div
              className={`onboarding-avatar-drop ${dragOver ? "drag-over" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleAvatarFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="onboarding-avatar-img" />
                : <div className="onboarding-avatar-placeholder">
                    <AiOutlineCamera style={{ fontSize:36, color:"var(--text-3)" }} />
                    <span style={{ fontSize:13 }}>Click or drag photo here</span>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleAvatarFile(e.target.files[0])} />

            <div className="onboarding-actions">
              <button className="onboarding-skip" onClick={next}>Skip</button>
              <button className="btn-primary onboarding-cta" onClick={next} disabled={!avatarPreview} style={{ opacity: avatarPreview ? 1 : 0.4 }}>
                Continue <AiOutlineArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Bio ── */}
        {step === 2 && (
          <div className="onboarding-step">
            <div className="onboarding-emoji"><AiOutlineEdit /></div>
            <h2>Tell us about yourself</h2>
            <p>A short bio helps others discover and connect with you.</p>

            <textarea
              className="onboarding-input"
              placeholder="e.g. Photographer based in NYC | Travel lover"
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              maxLength={150}
              style={{ resize:"none" }}
            />
            <div style={{ fontSize:12, color:"var(--text-3)", textAlign:"right", marginTop:4 }}>{bio.length}/150</div>

            <input
              className="onboarding-input"
              placeholder="Website or link (optional)"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              style={{ marginTop:10 }}
              type="url"
            />

            <div className="onboarding-actions">
              <button className="onboarding-skip" onClick={next}>Skip</button>
              <button className="btn-primary onboarding-cta" onClick={next}>
                Continue <AiOutlineArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Interests ── */}
        {step === 3 && (
          <div className="onboarding-step">
            <div className="onboarding-emoji"><AiOutlineHeart /></div>
            <h2>What are you into?</h2>
            <p>Pick topics you love. We'll personalize your feed.</p>

            <div className="onboarding-interests-grid">
              {INTERESTS.map(tag => (
                <button
                  key={tag}
                  className={`onboarding-interest-tag ${interests.includes(tag) ? "selected" : ""}`}
                  onClick={() => toggleInterest(tag)}
                >
                  {interests.includes(tag) && <AiOutlineCheck style={{ fontSize:12, marginRight:4 }} />}
                  {tag}
                </button>
              ))}
            </div>

            <div className="onboarding-actions">
              <button className="onboarding-skip" onClick={next}>Skip</button>
              <button className="btn-primary onboarding-cta" onClick={next}>
                Continue <AiOutlineArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === 4 && (
          <div className="onboarding-step">
            <AiOutlineCheckCircle style={{ fontSize:64, color:"var(--accent)", display:"block", margin:"0 auto 16px" }} />
            <h2>You're all set!</h2>
            <p>Your profile is ready. Start sharing moments, connecting with people, and discovering what inspires you.</p>
            <button className="btn-primary onboarding-cta" onClick={handleSave} disabled={saving}>
              {saving ? "Setting up…" : "Go to VibeSpace"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}