import Notification from "../models/Notification.js";

export const getNotificationRecipientUserId = (recipient) =>
  recipient?.userId?._id || recipient?.userId || recipient;

export const normalizeNotificationForUser = (notification, userId = null) => {
  if (!notification) return null;

  const plain = notification?.toObject ? notification.toObject() : { ...notification };
  const loginUserId = userId ? String(userId) : "";
  const recipient = Array.isArray(plain.recipients)
    ? plain.recipients.find((item) => String(getNotificationRecipientUserId(item)) === loginUserId)
    : null;

  return {
    _id: plain._id,
    title: plain.title,
    message: plain.message,
    type: plain.type,
    linkId: plain.linkId,
    isRead: recipient ? Boolean(recipient.isRead) : Boolean(plain.isRead),
    readAt: recipient?.readAt || plain.readAt || null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const createNotificationForUsers = async ({
  userIds = [],
  title,
  message,
  type,
  linkId,
  excludeUserId = null,
}) => {
  const excludedId = excludeUserId ? String(excludeUserId) : "";
  const uniqueUserIds = [
    ...new Set(
      userIds
        .filter(Boolean)
        .map((id) => String(id?._id || id))
        .filter((id) => id && id !== excludedId)
    ),
  ];

  if (!uniqueUserIds.length) return null;

  return Notification.create({
    title,
    message,
    type,
    linkId,
    recipients: uniqueUserIds.map((userId) => ({
      userId,
      isRead: false,
      readAt: null,
    })),
  });
};

export const getUnreadNotificationQuery = (userId) => ({
  $or: [
    { userId, isRead: false },
    { recipients: { $elemMatch: { userId, isRead: false } } },
  ],
});

export const markNotificationReadForUser = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) return null;

  if (Array.isArray(notification.recipients) && notification.recipients.length) {
    let changed = false;

    notification.recipients.forEach((recipient) => {
      if (String(recipient.userId) === String(userId)) {
        recipient.isRead = true;
        recipient.readAt = recipient.readAt || new Date();
        changed = true;
      }
    });

    if (changed) {
      notification.markModified("recipients");
      await notification.save();
    }

    return notification;
  }

  notification.isRead = true;
  notification.readAt = notification.readAt || new Date();
  await notification.save();
  return notification;
};

export const markAllNotificationsReadForUser = async (userId) => {
  await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  const notifications = await Notification.find({
    recipients: { $elemMatch: { userId, isRead: false } },
  });

  for (const notification of notifications) {
    notification.recipients.forEach((recipient) => {
      if (String(recipient.userId) === String(userId)) {
        recipient.isRead = true;
        recipient.readAt = recipient.readAt || new Date();
      }
    });
    notification.markModified("recipients");
    await notification.save();
  }
};

export const clearRequestNotifications = async ({ linkId, type }) => {
  const notifications = await Notification.find({ linkId, type });
  const affectedUserIds = new Set();

  for (const notification of notifications) {
    if (Array.isArray(notification.recipients) && notification.recipients.length) {
      let changed = false;

      notification.recipients.forEach((recipient) => {
        if (!recipient.isRead) {
          recipient.isRead = true;
          recipient.readAt = recipient.readAt || new Date();
          changed = true;
        }
        if (recipient.userId) affectedUserIds.add(String(recipient.userId));
      });

      if (changed) {
        notification.markModified("recipients");
        await notification.save();
      }
      continue;
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = notification.readAt || new Date();
      await notification.save();
    }

    if (notification.userId) affectedUserIds.add(String(notification.userId));
  }

  return [...affectedUserIds];
};
