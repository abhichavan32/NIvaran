import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';

export default function Navbar() {
  const { user, logout, isAuthenticated, isSuperAdmin, isAreaAdmin, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      // silently fail
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll({ page: 1 });
      setNotifications(res.data.results || res.data);
    } catch (err) {
      // silently fail
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      // silently fail
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
        </svg>
        CivicAI
      </Link>

      <div className="navbar-links">
        <Link to="/" className={isActive('/')}>Issues</Link>
        <Link to="/map" className={isActive('/map')}>Map</Link>

        {isAuthenticated ? (
          <>
            <Link to="/report" className={isActive('/report')}>Report Issue</Link>
            <Link to="/my-issues" className={isActive('/my-issues')}>My Issues</Link>

            {isAdmin && (
              <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
            )}

            {isSuperAdmin && (
              <Link to="/admin/users" className={isActive('/admin/users')}>Users</Link>
            )}

            <div className="notification-badge" style={{ position: 'relative' }}>
              <button className="btn-icon" onClick={toggleNotifications} title="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && <span className="count">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px' }}>Notifications</strong>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="btn btn-sm btn-secondary">
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '14px' }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => {
                          if (n.issue) navigate(`/issues/${n.issue}`);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="notif-message">{n.message}</div>
                        <div className="notif-time">{formatTime(n.created_at)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="navbar-user">
              <Link to="/profile" className="user-info" style={{ textDecoration: 'none' }}>
                <div className="name">{user?.first_name || user?.username}</div>
                <div className="role">{user?.role?.replace('_', ' ')}</div>
              </Link>
              <button onClick={handleLogout} className="btn btn-sm btn-secondary">
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className={`btn btn-secondary btn-sm ${isActive('/login')}`}>
              Login
            </Link>
            <Link to="/register" className={`btn btn-primary btn-sm ${isActive('/register')}`}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
