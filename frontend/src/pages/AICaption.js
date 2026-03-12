import { AiOutlineCamera, AiOutlineCheck, AiOutlineClose, AiOutlineCopy, AiOutlineEdit, AiOutlineMessage, AiOutlinePicture, AiOutlineRobot, AiOutlineThunderbolt, AiOutlineUser } from "react-icons/ai";
import { BsStars } from "react-icons/bs";
import React, { useState, useRef } from "react";
import API from "../utils/api";
import toast from "react-hot-toast";


const TABS = [
  { key:"caption",   label:"Captions"  },
  { key:"hashtags",  label:"# Hashtags"   },
  { key:"bio",       label:"Bio"        },
  { key:"sentiment", label:"Sentiment"  },
  { key:"image",     label:"Image AI"   },
];
const TONES = ["Casual","Professional","Funny","Inspirational","Aesthetic","Viral"];

export default function AICaption() {
  const [tab, setTab]           = useState("caption");
  const [tone, setTone]         = useState("Casual");
  const [keywords, setKeywords] = useState("");
  const [comment, setComment]   = useState("");
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDesc, setImageDesc] = useState("");
  const [imageModel, setImageModel] = useState("");
  const [copied, setCopied]     = useState(null);
  const fileRef = useRef();

  const generate = async () => {
    if (tab !== "sentiment" && tab !== "image" && !keywords.trim())
      return toast.error("Enter some keywords first");
    if (tab === "sentiment" && !comment.trim())
      return toast.error("Enter a comment to analyze");
    setLoading(true); setResults(null);
    try {
      const { data } = await API.post("/ai/caption", { tab, tone, keywords, comment });
      if (data.success) setResults(data.result);
    } catch (err) { toast.error(err.response?.data?.message || "AI request failed"); }
    setLoading(false);
  };

  const analyzeImage = async () => {
    if (!imageFile) return toast.error("Select an image first");
    setLoading(true); setImageDesc(""); setImageModel("");
    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      const { data } = await API.post("/ai/describe-image", fd, {
        headers: { "Content-Type":"multipart/form-data" },
      });
      if (data.success) {
        setImageDesc(data.description);
        if (data.model) setImageModel(data.model);
        toast.success("Image analyzed!");
      } else { toast.error(data.message || "Failed"); }
    } catch (err) { toast.error(err.response?.data?.message || "Image analysis failed"); }
    setLoading(false);
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleImageSelect = e => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); setImageDesc(""); }
  };

  const parseResults = () => {
    if (!results) return [];
    if (Array.isArray(results)) return results.map((r, i) => ({ key:i, text:r }));
    if (typeof results === "string") {
      return results.split("\n").filter(l => l.trim()).map((l, i) => ({ key:i, text:l.replace(/^\d+\.\s*/, "") }));
    }
    return [{ key:0, text: String(results) }];
  };

  return (
    <div className="ai-page">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-icon"><BsStars /></div>
        <div>
          <h2>AI Studio</h2>
          <p>Generate captions, hashtags, bios & more with AI</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="ai-tabs">
        {TABS.map(t => (
          <button key={t.key}
            className={`ai-tab ${tab===t.key?"active":""}`}
            onClick={() => { setTab(t.key); setResults(null); setImageDesc(""); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Input card */}
      <div className="ai-card">

        {/* Tone selector — not for sentiment/image */}
        {tab !== "sentiment" && tab !== "image" && (
          <>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>Tone</div>
            <div className="ai-tone-pills">
              {TONES.map(t => (
                <button key={t} className={`ai-tone-pill ${tone===t?"active":""}`} onClick={() => setTone(t)}>{t}</button>
              ))}
            </div>
          </>
        )}

        {/* Image tab */}
        {tab === "image" ? (
          <>
            <label htmlFor="ai-img-upload" style={{ display:"block" }}>
              {imagePreview ? (
                <div style={{ position:"relative", display:"inline-block", width:"100%" }}>
                  <img src={imagePreview} alt="preview" className="ai-image-preview" />
                  <button
                    onClick={e => { e.preventDefault(); setImageFile(null); setImagePreview(null); setImageDesc(""); }}
                    style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.6)", border:"none", color:"#fff", borderRadius:"50%", width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <AiOutlineClose />
                  </button>
                </div>
              ) : (
                <div className="ai-image-upload">
                  <AiOutlinePicture style={{ fontSize:40, color:"var(--text-3)", display:"block", marginBottom:8 }} />
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Upload an image</div>
                  <div style={{ fontSize:12, color:"var(--text-3)" }}>AI will describe it & suggest captions</div>
                </div>
              )}
            </label>
            <input id="ai-img-upload" ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageSelect} />
            <button className="ai-generate-btn" onClick={analyzeImage} disabled={loading || !imageFile}>
              {loading ? <><span className="ai-spinner" /> Analyzing…</> : <><BsStars /> Analyze Image</>}
            </button>
          </>
        ) : tab === "sentiment" ? (
          <>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>Comment to analyze</div>
            <textarea
              className="ai-input"
              rows={4}
              placeholder="Paste a comment here to analyze its sentiment…"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button className="ai-generate-btn" onClick={generate} disabled={loading || !comment.trim()}>
              {loading ? <><span className="ai-spinner" /> Analyzing…</> : <><AiOutlineRobot /> Analyze Sentiment</>}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>
              {tab === "caption" ? "Keywords / topic" : tab === "hashtags" ? "Post topic" : "About you"}
            </div>
            <textarea
              className="ai-input"
              rows={3}
              placeholder={
                tab === "caption"  ? "e.g. sunset at the beach, golden hour vibes…" :
                tab === "hashtags" ? "e.g. fitness, workout, gym motivation…" :
                "e.g. photographer, traveler, coffee lover…"
              }
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
            />
            <button className="ai-generate-btn" onClick={generate} disabled={loading || !keywords.trim()}>
              {loading ? <><span className="ai-spinner" /> Generating…</> : <><BsStars /> Generate</>}
            </button>
          </>
        )}
      </div>

      {/* Results */}
      {tab === "image" && imageDesc && (
        <div className="ai-result-card">
          <div className="ai-result-header">
            <span>AI Analysis</span>
            {imageModel && <span className="ai-model-badge"><AiOutlineThunderbolt /> {imageModel.split("/").pop()}</span>}
          </div>
          <div className="ai-result-body">
            {imageDesc.split("\n\n").filter(s => s.trim()).map((section, i) => (
              <div key={i} className="ai-result-item">
                <span style={{ whiteSpace:"pre-wrap", lineHeight:1.6 }}>{section}</span>
                <button className="ai-copy-btn" onClick={() => copy(section, `img-${i}`)}>
                  {copied === `img-${i}` ? <AiOutlineCheck style={{ color:"#22c55e" }} /> : <AiOutlineCopy />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {results && tab !== "image" && (
        <div className="ai-result-card">
          <div className="ai-result-header">
            <span>{TABS.find(t => t.key===tab)?.label} Results</span>
            <span style={{ fontSize:11, color:"var(--text-3)" }}>{parseResults().length} generated</span>
          </div>
          <div className="ai-result-body">
            {parseResults().map(({ key, text }) => (
              <div key={key} className="ai-result-item">
                <span>{text}</span>
                <button className="ai-copy-btn" onClick={() => copy(text, key)}>
                  {copied === key ? <AiOutlineCheck style={{ color:"#22c55e" }} /> : <AiOutlineCopy />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}