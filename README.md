# VibeSpace 🌊
### A Full-Stack Social Media App built with MERN + Socket.io + Stripe

---

## ✨ Features
- 🔐 JWT Authentication (Register/Login/Logout)
- 📸 Create Posts with Image Upload (Cloudinary)
- ❤️ Like, Comment, Save Posts
- 👥 Follow/Unfollow Users
- 💬 Real-Time Chat (Socket.io)
- 🛍️ Buy/Sell Posts (Stripe Payments)
- 👤 User Profiles

---

## 🛠️ Tech Stack
- **Frontend**: React.js, Redux Toolkit, Tailwind-like CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Real-time**: Socket.io
- **Image Storage**: Cloudinary
- **Payments**: Stripe

---

## ⚙️ Setup Instructions

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create `backend/config/config.env`:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/vibespace

JWT_SECRET=yourSuperSecretKey
JWT_EXPIRE=7d
COOKIE_EXPIRE=7

CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=sk_test_your_key

FRONTEND_URL=http://localhost:3000
```

Create `frontend/.env`:
```env
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Run the App

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

Open **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
vibespace/
├── backend/
│   ├── config/          # DB + env config
│   ├── controllers/     # Business logic
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/       # Auth middleware
│   └── server.js
└── frontend/
    └── src/
        ├── pages/       # Login, Home, Chat, Profile, Marketplace
        ├── components/  # Navbar, etc.
        ├── redux/       # State management
        └── utils/       # Axios config
```
