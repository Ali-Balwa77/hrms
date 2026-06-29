export const normalizeNotification = (notification = {}) => {
  const payload = notification?.data && typeof notification.data === 'object'
    ? notification.data
    : notification;

  if (!payload || typeof payload !== 'object') return null;

  return {
    ...payload,
    _id: payload._id || payload.id || payload.notificationId || `${payload.type || 'notification'}-${payload.linkId || Date.now()}`,
    title: payload.title || 'Notification',
    message: payload.message || '',
    type: payload.type || '',
    linkId: payload.linkId || payload.link || payload.requestId || '',
    createdAt: payload.createdAt || new Date().toISOString(),
    isRead: Boolean(payload.isRead),
  };
};

export const normalizeNotifications = (responseOrPayload) => {
  const payload = responseOrPayload?.data !== undefined
    ? responseOrPayload.data
    : responseOrPayload;

  const data = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.notifications)
        ? payload.notifications
        : [];

  return data
    .map((notification) => normalizeNotification(notification))
    .filter(Boolean);
};
