import { AiOutlineArrowLeft, AiOutlineCamera, AiOutlineClose, AiOutlineDelete, AiOutlineMessage, AiOutlinePhone, AiOutlineSearch, AiOutlineSmile, AiOutlineVideoCamera } from "react-icons/ai";
import { BsCheck, BsCheckAll, BsMic, BsMicFill, BsReply, BsStop } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMyChats, getOrCreateChat, sendMessage, addMessage } from "../redux/reducers/chatSlice";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import API from "../utils/api";
import { format } from "timeago.js";
import { Link } from "react-router-dom";

let socket;
const REACTIONS = ["❤️","😂","😮","😢","👍","🔥"];
const GIPHY_KEY  = ""; // add your giphy key here if needed

const formatTime = dateStr => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  return format(dateStr);
};

/* ── GIF Picker (Giphy) ── */
const GifPicker = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState("");
  const [gifs, setGifs]   = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const endpoint = GIPHY_KEY
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=12`
        : `https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=12`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data || []);
    } catch { toast.error("GIF load failed"); }
    setLoading(false);
  };

  useEffect(() => { search("trending"); }, []);

  return (
    <div className="gif-picker" onClick={e => e.stopPropagation()}>
      <div className="gif-picker-header">
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search(query)}
          placeholder="Search GIFs…"
          className="gif-search-input"
        />
        <button onClick={onClose} className="gif-close-btn"><AiOutlineClose /></button>
      </div>
      <div className="gif-grid">
        {loading
          ? [...Array(8)].map((_,i) => <div key={i} className="gif-skeleton" />)
          : gifs.map(g => (
            <img
              key={g.id}
              src={g.images?.fixed_height_small?.url}
              alt={g.title}
              className="gif-item"
              onClick={() => onSelect(g.images?.original?.url, g.images?.fixed_height_small?.url)}
            />
          ))
        }
      </div>
    </div>
  );
};

/* ── Voice Recorder ── */
const useVoiceRecorder = () => {
  const [recording,  setRecording]  = useState(false);
  const [audioBlob,  setAudioBlob]  = useState(null);
  const [audioUrl,   setAudioUrl]   = useState(null);
  const [duration,   setDuration]   = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef  = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type:"audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d+1), 1000);
    } catch { toast.error("Microphone access denied"); }
  };

  const stop = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const cancel = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
  };

  return { recording, audioBlob, audioUrl, duration, start, stop, cancel };
};

/* ── Single Message Bubble ── */
const MessageBubble = ({ msg, isOwn, onReact, onReply, currentUser }) => {
  const [showReactions, setShowReactions] = useState(false);
  const isGif   = msg.gif || msg.image?.includes("giphy");
  const isAudio = msg.audio;
  const isImage = msg.image && !isGif;

  return (
    <div className={`msg-row ${isOwn ? "own" : "other"}`}>
      {!isOwn && (
        msg.sender?.avatar?.url
          ? <img src={msg.sender.avatar.url} alt="" className="msg-avatar" />
          : <div className="avatar-fallback msg-avatar">{msg.sender?.username?.[0]?.toUpperCase()}</div>
      )}

      <div className="msg-col">
        {/* Reply preview */}
        {msg.replyTo && (
          <div className="msg-reply-preview">
            <span className="msg-reply-name">{msg.replyTo.sender?.username}</span>
            <span>{msg.replyTo.content?.slice(0,60) || "📎 Media"}</span>
          </div>
        )}

        <div
          className={`msg-bubble ${isOwn ? "own" : "other"}`}
          onDoubleClick={() => onReact?.(msg._id, "❤️")}
          onContextMenu={e => { e.preventDefault(); setShowReactions(r => !r); }}
        >
          {isImage && <img src={msg.image} alt="img" className="msg-image" onClick={() => window.open(msg.image)} />}
          {isGif   && <img src={msg.gif || msg.image} alt="gif" className="msg-gif" />}
          {isAudio && (
            <audio controls src={msg.audio} className="msg-audio" style={{ maxWidth:220 }} />
          )}
          {msg.content && !isGif && (
            <span className="msg-text">{msg.content}</span>
          )}

          {/* Reactions */}
          {msg.reactions?.length > 0 && (
            <div className="msg-reactions">
              {Object.entries(
                msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji]||0)+1; return acc; }, {})
              ).map(([emoji, count]) => (
                <span key={emoji} className="msg-reaction-tag" onClick={() => onReact?.(msg._id, emoji)}>
                  {emoji} {count > 1 && count}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={`msg-meta ${isOwn ? "own" : ""}`}>
          <span className="msg-time">{formatTime(msg.createdAt)}</span>
          {isOwn && (
            msg.read
              ? <BsCheckAll style={{ color:"#3b82f6", fontSize:13 }} />
              : <BsCheck style={{ color:"var(--text-3)", fontSize:13 }} />
          )}
        </div>

        {/* Reaction picker */}
        {showReactions && (
          <div className="msg-reaction-picker">
            {REACTIONS.map(e => (
              <button key={e} onClick={() => { onReact?.(msg._id, e); setShowReactions(false); }}>
                {e}
              </button>
            ))}
            <button onClick={() => onReply?.(msg)} className="msg-react-reply">
              <BsReply />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Typing Indicator ── */
const TypingIndicator = () => (
  <div className="typing-indicator">
    <span /><span /><span />
  </div>
);

/* ── Main Chat Component ── */
const Chat = () => {
  const dispatch   = useDispatch();
  const { user }   = useSelector(s => s.auth);
  const { chats, activeChat, loading } = useSelector(s => s.chat || {});

  const [message,    setMessage]    = useState("");
  const [search,     setSearch]     = useState("");
  const [replyTo,    setReplyTo]    = useState(null);
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [showGif,    setShowGif]    = useState(false);
  const [showEmoji,  setShowEmoji]  = useState(false);
  const [typing,     setTyping]     = useState(false);
  const [otherTyping,setOtherTyping]= useState(false);
  const [onlineUsers,setOnlineUsers]= useState([]);
  const [sidebarOpen,setSidebarOpen]= useState(true);
  const [messages,   setMessages]   = useState([]);
  const [msgsLoading,setMsgsLoading]= useState(false);

  const bottomRef  = useRef();
  const typingTimer = useRef();
  const imgRef     = useRef();
  const inputRef   = useRef();
  const voice = useVoiceRecorder();

  const otherUser = activeChat?.participants?.find(p => p._id !== user?._id);
  const isOnline  = onlineUsers.includes(otherUser?._id);

  /* ── Socket setup ── */
  useEffect(() => {
    socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:4000", { withCredentials: true, transports: ["websocket", "polling"] });
    socket.emit("setup", user);
    socket.on("connected", () => {});
    socket.on("online-users", users => setOnlineUsers(users));
    socket.on("message-received", msg => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on("typing", () => setOtherTyping(true));
    socket.on("stop-typing", () => setOtherTyping(false));
    socket.on("message-reacted", ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    });
    return () => socket.disconnect();
  }, [user]);

  /* ── Fetch chats ── */
  useEffect(() => { dispatch(getMyChats()); }, []);

  /* ── Fetch messages when chat changes ── */
  useEffect(() => {
    if (!activeChat?._id) return;
    socket.emit("join-chat", activeChat._id);
    setMsgsLoading(true);
    API.get(`/chat/${activeChat._id}`)
      .then(res => setMessages(res.data.messages || []))
      .catch(() => {})
      .finally(() => setMsgsLoading(false));
  }, [activeChat?._id]);

  /* ── Auto scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length > 20 ? "auto" : "smooth" });
  }, [messages, otherTyping]);

  /* ── Typing events ── */
  const handleTyping = e => {
    setMessage(e.target.value);
    if (!socket || !activeChat) return;
    if (!typing) { socket.emit("typing", activeChat._id); setTyping(true); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("stop-typing", activeChat._id);
      setTyping(false);
    }, 1500);
  };

  /* ── Send message ── */
  const handleSend = async () => {
    if (!message.trim() && !imgFile && !voice.audioBlob) return;
    if (!activeChat?._id) return;

    const fd = new FormData();
    fd.append("chatId", activeChat._id);
    if (replyTo) fd.append("replyTo", replyTo._id);

    let endpoint = "/chat/message";
    if (imgFile) {
      fd.append("image", imgFile);
      fd.append("content", message || "Photo");
      endpoint = `/chat/message/${activeChat._id}/image`;
    } else if (voice.audioBlob) {
      fd.append("audio", voice.audioBlob, "voice.webm");
      fd.append("content", "🎤 Voice message");
      endpoint = `/chat/message/${activeChat._id}/audio`;
    } else {
      fd.append("content", message);
    }

    socket.emit("stop-typing", activeChat._id);
    setTyping(false);

    try {
      const res = await API.post(endpoint, fd);
      const newMsg = res.data.message;
      socket.emit("new-message", { ...newMsg, chatId: activeChat._id });
      setMessages(prev => [...prev, newMsg]);
      setMessage(""); setImgFile(null); setImgPreview(null);
      setReplyTo(null); voice.cancel();
    } catch { toast.error("Send failed"); }
  };

  /* ── React to message ── */
  const handleReact = async (messageId, emoji) => {
    try {
      const res = await API.put(`/chat/message/${messageId}/react`, { emoji });
      socket.emit("react-message", { messageId, reactions: res.data.reactions, chatId: activeChat._id });
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions: res.data.reactions } : m));
    } catch {}
  };

  /* ── Send GIF ── */
  const handleGif = async (gifUrl, previewUrl) => {
    if (!activeChat?._id) return;
    setShowGif(false);
    try {
      const res = await API.post("/chat/message", {
        chatId: activeChat._id, content: "", gif: gifUrl
      });
      const newMsg = { ...res.data.message, gif: gifUrl };
      socket.emit("new-message", { ...newMsg, chatId: activeChat._id });
      setMessages(prev => [...prev, newMsg]);
    } catch { toast.error("GIF send failed"); }
  };

  /* ── Send voice ── */
  const handleSendVoice = async () => {
    if (!voice.audioBlob || !activeChat?._id) return;
    await handleSend();
  };

  const filteredChats = (chats || []).filter(c => {
    const other = c.participants?.find(p => p._id !== user?._id);
    return other?.username?.toLowerCase().includes(search.toLowerCase());
  });

  /* ── No chat selected ── */
  if (!activeChat) return (
    <div className="chat-page">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Messages</h2>
          <div className="chat-search-wrap">
            <AiOutlineSearch className="chat-search-icon" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="chat-search-input" />
          </div>
        </div>
        <div className="chat-list">
          {loading
            ? [...Array(5)].map((_,i) => <div key={i} className="chat-item-skeleton" />)
            : filteredChats.length === 0
              ? <div className="chat-empty-state">
                  <AiOutlineMessage style={{ fontSize:40, color:"var(--text-3)", display:"block", margin:"0 auto 12px" }} />
                  <p>No conversations yet</p>
                </div>
              : filteredChats.map(c => {
                  const other = c.participants?.find(p => p._id !== user?._id);
                  const isOtherOnline = onlineUsers.includes(other?._id);
                  return (
                    <div key={c._id} className="chat-item" onClick={() => dispatch(getOrCreateChat(other._id))}>
                      <div className="chat-item-avatar-wrap">
                        {other?.avatar?.url
                          ? <img src={other.avatar.url} alt="" />
                          : <div className="avatar-fallback" style={{ width:44, height:44, fontSize:16 }}>{other?.username?.[0]?.toUpperCase()}</div>
                        }
                        {isOtherOnline && <span className="chat-online-dot" />}
                      </div>
                      <div className="chat-item-info">
                        <span className="chat-item-name">{other?.username}</span>
                        <span className="chat-item-last">
                          {c.latestMessage?.content?.slice(0,35) || "Start chatting"}
                        </span>
                      </div>
                      {c.unreadCount > 0 && <span className="chat-unread-badge">{c.unreadCount}</span>}
                    </div>
                  );
                })
          }
        </div>
      </div>

      {/* Empty right panel */}
      <div className="chat-main empty">
        <AiOutlineMessage style={{ fontSize:52, color:"var(--text-3)", display:"block", margin:"0 auto 16px" }} />
        <h3>Select a conversation</h3>
        <p>Choose from your existing conversations or start a new one</p>
      </div>
    </div>
  );

  return (
    <div className="chat-page">
      {/* ── Sidebar ── */}
      <div className={`chat-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="chat-sidebar-header">
          <h2>Messages</h2>
          <div className="chat-search-wrap">
            <AiOutlineSearch className="chat-search-icon" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="chat-search-input" />
          </div>
        </div>
        <div className="chat-list">
          {filteredChats.map(c => {
            const other = c.participants?.find(p => p._id !== user?._id);
            const isOtherOnline = onlineUsers.includes(other?._id);
            const isActive = c._id === activeChat?._id;
            return (
              <div key={c._id} className={`chat-item ${isActive ? "active" : ""}`}
                onClick={() => dispatch(getOrCreateChat(other._id))}>
                <div className="chat-item-avatar-wrap">
                  {other?.avatar?.url
                    ? <img src={other.avatar.url} alt="" />
                    : <div className="avatar-fallback" style={{ width:44, height:44, fontSize:16 }}>{other?.username?.[0]?.toUpperCase()}</div>
                  }
                  {isOtherOnline && <span className="chat-online-dot" />}
                </div>
                <div className="chat-item-info">
                  <span className="chat-item-name">{other?.username}</span>
                  <span className="chat-item-last">
                    {c.latestMessage?.content?.slice(0,35) || "Start chatting"}
                  </span>
                </div>
                {c.unreadCount > 0 && <span className="chat-unread-badge">{c.unreadCount}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Chat Panel ── */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <button className="chat-back-btn" onClick={() => setSidebarOpen(true)}>
            <AiOutlineArrowLeft />
          </button>
          <Link to={`/profile/${otherUser?.username}`} className="chat-header-user">
            <div className="chat-header-avatar-wrap">
              {otherUser?.avatar?.url
                ? <img src={otherUser.avatar.url} alt="" className="chat-header-avatar" />
                : <div className="avatar-fallback" style={{ width:40,height:40,fontSize:15 }}>{otherUser?.username?.[0]?.toUpperCase()}</div>
              }
              {isOnline && <span className="chat-online-dot" />}
            </div>
            <div>
              <div className="chat-header-name">{otherUser?.username}</div>
              <div className="chat-header-status">{isOnline ? "Online" : "Offline"}</div>
            </div>
          </Link>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <button className="chat-icon-btn"><AiOutlinePhone /></button>
            <button className="chat-icon-btn"><AiOutlineVideoCamera /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" onClick={() => { setShowGif(false); setShowEmoji(false); }}>
          {msgsLoading
            ? [...Array(6)].map((_,i) => (
                <div key={i} className={`msg-skeleton ${i%2===0?"other":"own"}`} />
              ))
            : messages.map((msg, i) => (
                <MessageBubble
                  key={msg._id || i}
                  msg={msg}
                  isOwn={msg.sender?._id === user?._id || msg.sender === user?._id}
                  onReact={handleReact}
                  onReply={m => { setReplyTo(m); inputRef.current?.focus(); }}
                  currentUser={user}
                />
              ))
          }
          {otherTyping && (
            <div className="msg-row other">
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* GIF Picker */}
        {showGif && (
          <div className="gif-picker-wrap">
            <GifPicker onSelect={handleGif} onClose={() => setShowGif(false)} />
          </div>
        )}

        {/* Reply preview bar */}
        {replyTo && (
          <div className="chat-reply-bar">
            <BsReply />
            <div className="chat-reply-preview">
              <span className="chat-reply-name">{replyTo.sender?.username}</span>
              <span>{replyTo.content?.slice(0,60) || "Media"}</span>
            </div>
            <button onClick={() => setReplyTo(null)}><AiOutlineClose /></button>
          </div>
        )}

        {/* Image preview bar */}
        {imgPreview && (
          <div className="chat-img-preview">
            <img src={imgPreview} alt="preview" />
            <button onClick={() => { setImgFile(null); setImgPreview(null); }}><AiOutlineClose /></button>
          </div>
        )}

        {/* Voice recording UI */}
        {voice.recording && (
          <div className="chat-voice-bar">
            <div className="voice-pulse" />
            <span className="voice-duration">
              {String(Math.floor(voice.duration/60)).padStart(2,"0")}:{String(voice.duration%60).padStart(2,"0")}
            </span>
            <button onClick={voice.cancel} className="voice-cancel-btn"><AiOutlineClose /> Cancel</button>
            <button onClick={() => { voice.stop(); setTimeout(handleSendVoice, 300); }} className="voice-send-btn">
              <BsStop /> Send
            </button>
          </div>
        )}

        {/* Audio preview before send */}
        {voice.audioUrl && !voice.recording && (
          <div className="chat-img-preview">
            <audio controls src={voice.audioUrl} style={{ flex:1 }} />
            <button onClick={voice.cancel}><AiOutlineClose /></button>
            <button onClick={handleSendVoice} className="chat-send-btn" style={{ marginLeft:8 }}>
              <IoSend />
            </button>
          </div>
        )}

        {/* Input bar */}
        {!voice.recording && !voice.audioUrl && (
          <div className="chat-input-bar">
            <button className="chat-icon-btn" onClick={() => { setShowGif(g => !g); setShowEmoji(false); }}>
              GIF
            </button>
            <button className="chat-icon-btn" onClick={() => imgRef.current?.click()}>
              <AiOutlineCamera />
            </button>
            <input ref={fileRef => imgRef.current = fileRef} type="file" accept="image/*" hidden
              onChange={e => {
                const f = e.target.files[0];
                if (f) { setImgFile(f); setImgPreview(URL.createObjectURL(f)); }
              }}
            />
            <input
              ref={inputRef}
              className="chat-text-input"
              value={message}
              onChange={handleTyping}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message…"
            />
            {message.trim() || imgFile
              ? <button className="chat-send-btn" onClick={handleSend}><IoSend /></button>
              : <button
                  className="chat-icon-btn voice-btn"
                  onMouseDown={voice.start}
                  onMouseUp={voice.stop}
                  onTouchStart={voice.start}
                  onTouchEnd={voice.stop}
                >
                  <BsMic />
                </button>
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;