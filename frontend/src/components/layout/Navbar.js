import { AiFillBell, AiFillCompass, AiFillHome, AiFillMessage, AiFillShopping, AiOutlineBarChart, AiOutlineBell, AiOutlineCompass, AiOutlineHome, AiOutlineLogout, AiOutlineMessage, AiOutlineSearch, AiOutlineSetting, AiOutlineShoppingCart } from "react-icons/ai";
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../redux/reducers/authSlice";
import toast from "react-hot-toast";
import { MdOutlineVideoLibrary, MdVideoLibrary } from "react-icons/md";
import { BsSunFill, BsMoonFill, BsStars } from "react-icons/bs";
import { HiMenu, HiX } from "react-icons/hi";

const Navbar = ({ darkMode, toggleDark }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { unreadCount } = useSelector((s) => s.notifications);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logged out!");
    navigate("/login");
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/", icon: isActive("/") ? <AiFillHome /> : <AiOutlineHome />, label: "Home" },
    { to: "/explore", icon: isActive("/explore") ? <AiFillCompass /> : <AiOutlineCompass />, label: "Explore" },
    { to: "/reels", icon: isActive("/reels") ? <MdVideoLibrary /> : <MdOutlineVideoLibrary />, label: "Reels" },
    { to: "/marketplace", icon: isActive("/marketplace") ? <AiFillShopping /> : <AiOutlineShoppingCart />, label: "Market" },
    { to: "/chat", icon: isActive("/chat") ? <AiFillMessage /> : <AiOutlineMessage />, label: "Chat" },
    { to: "/search", icon: <AiOutlineSearch />, label: "Search" },
    { to: "/analytics", icon: <AiOutlineBarChart />, label: "Analytics" },
    { to: "/ai-caption", icon: <BsStars />, label: "AI Studio" },
    { to: "/settings", icon: <AiOutlineSetting />, label: "Settings" },
  ];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">VibeSpace</Link>
      <div className="navbar-icons desktop-nav">
        {navLinks.map((link) => (
          <Link key={link.to} to={link.to} title={link.label} className={isActive(link.to) ? "nav-active" : ""}>{link.icon}</Link>
        ))}
        <Link to="/notifications" title="Notifications" style={{ position: "relative" }} className={isActive("/notifications") ? "nav-active" : ""}>
          {isActive("/notifications") ? <AiFillBell /> : <AiOutlineBell />}
          {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </Link>
        <button onClick={toggleDark} className="dark-toggle" title="Toggle theme">{darkMode ? <BsSunFill /> : <BsMoonFill />}</button>
        <Link to={`/profile/${user?.username}`} title="Profile">
          {user?.avatar?.url
            ? <img src={user.avatar.url} alt={user.username} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)", verticalAlign: "middle" }} />
            : <div className="avatar-fallback" style={{ width: 28, height: 28, fontSize: 12 }}>{user?.username?.[0]?.toUpperCase()}</div>
          }
        </Link>
        <button onClick={handleLogout} title="Logout"><AiOutlineLogout /></button>
      </div>
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <HiX /> : <HiMenu />}</button>
      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="mobile-menu-item" onClick={() => setMenuOpen(false)}>{link.icon} {link.label}</Link>
          ))}
          <Link to="/notifications" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
            <AiOutlineBell /> Notifications {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </Link>
          <Link to={`/profile/${user?.username}`} className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
            {user?.avatar?.url
              ? <img src={user.avatar.url} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} />
              : <div className="avatar-fallback" style={{ width: 22, height: 22, fontSize: 11 }}>{user?.username?.[0]?.toUpperCase()}</div>
            } Profile
          </Link>
          <button className="mobile-menu-item" onClick={toggleDark}>{darkMode ? <BsSunFill /> : <BsMoonFill />} {darkMode ? "Light Mode" : "Dark Mode"}</button>
          <button className="mobile-menu-item danger" onClick={handleLogout}><AiOutlineLogout /> Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;