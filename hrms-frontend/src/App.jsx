import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import ErrorBoundary from './ErrorBoundary';
import AppRoute from './routes/AppRoutes';
import { logout } from './redux/slices/authSlice';
import { showErrorToast } from './utils/toastHelper';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    const clearSession = (message) => {
      dispatch(logout());
      localStorage.clear();
      sessionStorage.clear();
      showErrorToast(message || 'Session expired');
      navigate('/login', { replace: true });
    };

    const handleUnauthorized = (event) => clearSession(event?.detail);
    const handleOffline = () => showErrorToast('Internet connection lost');
    const handleOnline = () => toast.success('Internet connection restored');

    window.addEventListener('unauthorized', handleUnauthorized);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [dispatch, navigate]);

  useEffect(() => {
    const loggedInUserId = user?.id || user?._id;

    const loggedInEmployeeId =
      typeof user?.employeeId === "object"
        ? user?.employeeId?._id
        : user?.employeeId;

    if (!token || (!loggedInUserId && !loggedInEmployeeId)) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit("register_user", {
        userId: loggedInUserId,
        employeeId: loggedInEmployeeId,
      });
      socketRef.current.emit("register_user", loggedInUserId);
      socketRef.current.emit("registerUser", loggedInUserId);
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    const registerLoggedInUser = () => {
      socket.emit("register_user", {
        userId: loggedInUserId,
        employeeId: loggedInEmployeeId,
      });

      // Backward compatibility: if backend expects only userId string.
      socket.emit("register_user", loggedInUserId);
      socket.emit("registerUser", loggedInUserId);
    };

    const logoutFromSocketEvent = (payload) => {
      const message =
        payload?.message ||
        payload?.detail ||
        "Your access has been updated. Please login again.";

      showErrorToast(message);
      localStorage.clear();
      sessionStorage.clear();
      dispatch(logout());
      socket.disconnect();
      socketRef.current = null;
      navigate("/login", { replace: true });
    };

    socket.on("connect", registerLoggedInUser);

    socket.on("new_notification", (notification) => {
      toast.success(notification?.message || "New notification received");

      window.dispatchEvent(
        new CustomEvent("socketNotificationReceived", {
          detail: notification,
        })
      );
    });

    socket.on("remove_notification", (payload) => {
      window.dispatchEvent(
        new CustomEvent("removeNotification", {
          detail: payload,
        })
      );
    });

    socket.on("force_logout", logoutFromSocketEvent);
    socket.on("role_permission_updated", logoutFromSocketEvent);
    socket.on("permission_updated", logoutFromSocketEvent);
    socket.on("role_updated", logoutFromSocketEvent);
    socket.on("access_updated", logoutFromSocketEvent);
    socket.on("user_role_updated", logoutFromSocketEvent);

    const handleManualLogout = () => {
      socket.disconnect();
      socketRef.current = null;
    };

    window.addEventListener("manualLogout", handleManualLogout);

    return () => {
      window.removeEventListener("manualLogout", handleManualLogout);
      socket.off("connect", registerLoggedInUser);
      socket.off("new_notification");
      socket.off("remove_notification");
      socket.off("force_logout", logoutFromSocketEvent);
      socket.off("role_permission_updated", logoutFromSocketEvent);
      socket.off("permission_updated", logoutFromSocketEvent);
      socket.off("role_updated", logoutFromSocketEvent);
      socket.off("access_updated", logoutFromSocketEvent);
      socket.off("user_role_updated", logoutFromSocketEvent);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id, user?._id, user?.employeeId, dispatch, navigate]);

  return (
    <ErrorBoundary>
      <AppRoute />
    </ErrorBoundary>
  );
}

export default App;
