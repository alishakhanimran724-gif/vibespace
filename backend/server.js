const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const cloudinary = require("cloudinary").v2;

dotenv.config({ path: "./config/config.env" });
connectDB();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => (!origin || origin.endsWith(".vercel.app") || ["http://localhost:3000","http://localhost:3001",process.env.FRONTEND_URL].includes(origin))
      ? cb(null, true) : cb(new Error("CORS blocked")),
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://vibespace-mu.vercel.app",
  "https://vibespace.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.some(o => origin === o || origin.endsWith(".vercel.app")))
    ? cb(null, true)
    : cb(new Error("CORS blocked")),
  credentials: true,
}));
app.use(fileUpload({ 
  useTempFiles: true, 
  tempFileDir: "/tmp/",
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
}));

// Routes
app.use("/api/v1/user",         require("./routes/userRoutes"));
app.use("/api/v1/post",         require("./routes/postRoutes"));
app.use("/api/v1/chat",         require("./routes/chatRoutes"));
app.use("/api/v1/payment",      require("./routes/paymentRoutes"));
app.use("/api/v1/story",        require("./routes/storyRoutes"));
app.use("/api/v1/reel",         require("./routes/reelRoutes"));
app.use("/api/v1/notification", require("./routes/notificationRoutes"));
app.use("/api/v1/analytics",    require("./routes/analyticsRoutes"));
app.use("/api/v1/ai",           require("./routes/aiRoutes"));

// Socket.io
let onlineUsers = {}; // userId -> socketId

io.on("connection", (socket) => {

  // User identifies themselves
  socket.on("setup", (user) => {
    if (user?._id) {
      onlineUsers[user._id] = socket.id;
      socket.join(user._id); // personal room
      socket.emit("connected");
      io.emit("online-users", Object.keys(onlineUsers));
    }
  });

  // Join a chat room
  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
  });

  // New message — broadcast to chat room
  socket.on("new-message", (msg) => {
    const chatId = msg.chatId || msg.chat;
    if (chatId) {
      socket.to(chatId).emit("message-received", msg);
    }
  });

  // Typing indicators
  socket.on("typing", (chatId) => {
    socket.to(chatId).emit("typing");
  });
  socket.on("stop-typing", (chatId) => {
    socket.to(chatId).emit("stop-typing");
  });

  // Message reactions
  socket.on("react-message", ({ messageId, reactions, chatId }) => {
    socket.to(chatId).emit("message-reacted", { messageId, reactions });
  });

  // Disconnect
  socket.on("disconnect", () => {
    Object.keys(onlineUsers).forEach((key) => {
      if (onlineUsers[key] === socket.id) delete onlineUsers[key];
    });
    io.emit("online-users", Object.keys(onlineUsers));
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ VibeSpace Server running on http://localhost:${PORT}`);
});