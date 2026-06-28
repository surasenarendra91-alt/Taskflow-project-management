import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import '../../styles/navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    loadNotifications();

    const socket = getSocket();
    if (socket) {
      socket.on('notification:new', () => {
        loadNotifications();
      });
    }

    return () => {
      if (socket) socket.off('notification:new');
    };
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unreadCount || 0);
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <span>⚡</span>
        <span className="brand-name">TaskFlow</span>
      </Link>

      <div className="navbar-actions" ref={notifRef}>
        {/* Notifications */}
        <div className="notif-wrapper">
          <button className="icon-btn" onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}>
            🔔
            {unread > 0 && <span className="badge-dot">{unread}</span>}
          </button>

          {showNotifs && (
            <div className="dropdown notif-dropdown">
              <div className="dropdown-header">
                <span>Notifications</span>
                {unread > 0 && <button className="btn-link" onClick={handleMarkAllRead}>Mark all read</button>}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <p className="notif-empty">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                      <div className="notif-content">
                        <p className="notif-message">{n.message}</p>
                        <span className="notif-time text-xs text-muted">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="user-wrapper">
          <button className="user-btn" onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}>
            <div className="avatar">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="user-name">{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="dropdown user-dropdown">
              <div className="dropdown-user-info">
                <div className="avatar avatar-lg">{user?.name?.[0]?.toUpperCase()}</div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted">{user?.email}</p>
                </div>
              </div>
              <hr />
              <button className="dropdown-item" onClick={handleLogout}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
