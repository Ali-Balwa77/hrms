import React, { useEffect, useState } from 'react';
import { api } from "../../services/api.js";
import { normalizeNotifications } from "../../utils/notificationHelper.js";

const NotificationPopup = () => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/unread");
      setNotifications(normalizeNotifications(res));
    } catch (error) {
      console.error('Request failed:', error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
    window.addEventListener('refreshNotifications', fetchNotifications);

    return () => {
      window.removeEventListener('refreshNotifications', fetchNotifications);
    };
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications([]);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  return (
    <>
      {notifications.map((n, index) => (
        <div
          key={n._id || index}
          className="fixed right-5 w-[320px] bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[9999]"
          style={{
            top: `${20 + index * 90}px`,
          }}
        >
          <div className="font-semibold text-gray-800 mb-1">
            🔔 {n.title}
          </div>

          <div className="text-sm text-gray-600">
            {n.message}
          </div>
        </div>
      ))}
    </>
  );
};

export default NotificationPopup;
