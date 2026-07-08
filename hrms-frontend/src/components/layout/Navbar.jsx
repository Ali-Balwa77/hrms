import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logout } from '../../redux/slices/authSlice.js';
import { api } from '../../services/api.js';
import { route } from '../../utils/routeHelper.js';
import { hasAnyFeature } from '../../utils/permissions.js';
import { normalizeNotification, normalizeNotifications } from '../../utils/notificationHelper.js';
import { FiSearch, FiBell, FiChevronDown, FiKey, FiLogOut, FiMenu, FiX, FiCalendar, FiClock } from 'react-icons/fi';

const notificationRoutes = {
  FORWARDED_APPROVAL: (id) => `/leaves/approval/${id}`,
  LEAVE_CANCELLATION: (id) => `/leaves/cancel/approval/${id}`,
  MISPUNCH: (id) => `/mispunch/approval/${id}`,
};

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread');
      setNotifications(normalizeNotifications(response));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    fetchNotifications();

    const handleSocketNotification = (event) => {
      const notification = normalizeNotification(event.detail);

      if (!notification?._id) {
        fetchNotifications();
        return;
      }

      setNotifications((prev) => {
        const alreadyExists = prev.some(
          (item) => String(item._id) === String(notification._id)
        );

        if (alreadyExists) return prev;

        return [notification, ...prev];
      });
    };

    const handleRemoveNotification = (event) => {
      const { linkId, type } = event.detail || {};

      if (!linkId) {
        fetchNotifications();
        return;
      }

      setNotifications((prev) =>
        prev.filter((notification) => {
          const sameLink = String(notification.linkId) === String(linkId);
          const sameType = type ? notification.type === type : true;

          return !(sameLink && sameType);
        })
      );
    };

    window.addEventListener("refreshNotifications", fetchNotifications);
    window.addEventListener("socketNotificationReceived", handleSocketNotification);
    window.addEventListener("removeNotification", handleRemoveNotification);

    return () => {
      window.removeEventListener("refreshNotifications", fetchNotifications);
      window.removeEventListener("socketNotificationReceived", handleSocketNotification);
      window.removeEventListener("removeNotification", handleRemoveNotification);
    };
  }, [user, fetchNotifications]);

  const handleNotificationClick = (notification) => {
    const buildPath = notificationRoutes[notification.type];

    setShowNotifications(false);

    if (buildPath && notification.linkId) {
      navigate(route(user, buildPath(notification.linkId)));
    }
  };

  const handleLogout = () => {
    window.dispatchEvent(new Event("manualLogout"));

    dispatch(logout());
    localStorage.clear();
    sessionStorage.clear();

    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      {/* Brand logo container */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(route(user, '/dashboard'))}
          className="flex items-center gap-3 rounded-xl focus:outline-none transition-transform hover:scale-[1.02]"
          aria-label="Go to dashboard"
        >
          <img
            src="/dp/hrms/hrms-logo.svg"
            alt="HRMS Logo"
            className="hidden sm:block h-12 w-auto object-contain"
          />
        </button>
      </div>

      {/* User Actions panel */}
      <div className="flex items-center gap-4">
        {/* Notifications Popover */}
        {hasAnyFeature(user, ['leave_approval_menu', 'leave_cancel_approval_menu','mispunch_approval_menu']) && (
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications((value) => !value);
                setOpen(false);
              }}
              className={`p-2.5 rounded-xl transition-all duration-200 relative ${showNotifications ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:text-brand-600 hover:bg-slate-50'}`}
              aria-label="View notifications"
            >
              <FiBell className="h-5 w-5" />
              {notifications.length > 0 && (
                <>
                  <span className="absolute top-1 right-1 h-5 w-5 bg-rose-500 rounded-full animate-ping opacity-75"></span>
                  <span className="absolute top-1 right-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-black h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-md leading-none z-10">
                    {notifications.length}
                  </span>
                </>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white shadow-dropdown rounded-2xl border border-slate-100 z-50 overflow-hidden transform origin-top-right transition-all animate-slideIn">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="font-display font-semibold text-sm text-slate-800">Notifications</span>
                  {notifications.length > 0 && (
                    <span className="text-[10px] bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {notifications.length} New
                    </span>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                        <FiBell className="h-6 w-6" />
                      </div>
                      <p className="text-sm text-slate-500">All caught up!</p>
                      <p className="text-xs text-slate-400 mt-1">No new notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification._id}
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left px-5 py-4 hover:bg-slate-50/50 transition-colors flex gap-3.5 group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-brand-50 flex-shrink-0 flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all duration-200">
                            <FiCalendar className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 mb-0.5 group-hover:text-brand-600 transition-colors">{notification.title}</p>
                            <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">{notification.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                              <FiClock className="h-3 w-3" />
                              {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Account Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            className="cursor-pointer flex items-center gap-2 group p-1.5 hover:bg-slate-50 rounded-xl transition-all duration-200"
            onClick={() => {
              setOpen((value) => !value);
              setShowNotifications(false);
            }}
          >
            <div className="w-9 h-9 bg-brand-500 text-white rounded-xl flex items-center justify-center font-display font-semibold text-sm shadow-md shadow-brand-500/10 group-hover:bg-brand-600 transition-colors">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            
            <div className="hidden sm:block text-left max-w-[120px]">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{user?.name}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5 capitalize truncate">{user?.designation || 'Staff'}</p>
            </div>
            
            <FiChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 group-hover:text-slate-600 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-56 bg-white shadow-dropdown rounded-2xl border border-slate-100 z-50 overflow-hidden transform origin-top-right transition-all animate-slideIn">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
                <p className="text-xs font-bold text-slate-700 truncate">{user?.email}</p>
              </div>
              
              <div className="p-2">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all duration-200 flex items-center gap-2.5"
                  onClick={() => {
                    navigate(route(user, '/change-password'));
                    setOpen(false);
                  }}
                >
                  <FiKey className="h-4 w-4" />
                  Change Password
                </button>
                
                <div className="h-px bg-slate-100 my-1.5 mx-1" />
                
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 flex items-center gap-2.5"
                  onClick={handleLogout}
                >
                  <FiLogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

