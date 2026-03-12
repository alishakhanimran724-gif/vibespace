const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

dotenv.config({ path: "./config/config.env" });
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", process.env.FRONTEND_URL].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001", process.env.FRONTEND_URL].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.includes(origin)) ? cb(null, true) : cb(new Error("CORS blocked")),
  credentials: true,
}));
app.use(fileUpload({ useTempFiles: true }));

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
let onlineUsers = {};
io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });
  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
    const receiverSocket = onlineUsers[receiverId];
    if (receiverSocket) io.to(receiverSocket).emit("receiveMessage", { senderId, message });
  });
  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers[receiverId];
    if (receiverSocket) io.to(receiverSocket).emit("typing", senderId);
  });
  socket.on("disconnect", () => {
    Object.keys(onlineUsers).forEach((key) => {
      if (onlineUsers[key] === socket.id) delete onlineUsers[key];
    });
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ VibeSpace Server running on http://localhost:${PORT}`);
});