import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const buildGroupKey = (notification) => [
  String(notification.linkId || ''),
  String(notification.type || ''),
  String(notification.title || ''),
  String(notification.message || ''),
].join('|');

const migrateNotificationsToRecipients = async () => {
  await connectDB();

  const oldNotifications = await Notification.find({
    userId: { $ne: null },
    $or: [
      { recipients: { $exists: false } },
      { recipients: { $size: 0 } },
    ],
  }).sort({ createdAt: 1 });

  const groups = new Map();

  oldNotifications.forEach((notification) => {
    const key = buildGroupKey(notification);

    if (!groups.has(key)) {
      groups.set(key, {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        linkId: notification.linkId,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        recipients: new Map(),
        sourceIds: [],
      });
    }

    const group = groups.get(key);
    group.sourceIds.push(notification._id);

    if (notification.userId) {
      group.recipients.set(String(notification.userId), {
        userId: notification.userId,
        isRead: Boolean(notification.isRead),
        readAt: notification.readAt || null,
      });
    }
  });

  let createdCount = 0;
  let removedCount = 0;

  for (const group of groups.values()) {
    if (!group.recipients.size) continue;

    await Notification.create({
      title: group.title,
      message: group.message,
      type: group.type,
      linkId: group.linkId,
      recipients: [...group.recipients.values()],
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    });
    createdCount += 1;

    const deleteResult = await Notification.deleteMany({ _id: { $in: group.sourceIds } });
    removedCount += deleteResult.deletedCount || 0;
  }

  console.log(`Notification migration completed. Created grouped documents: ${createdCount}. Removed old documents: ${removedCount}.`);
  await mongoose.disconnect();
};

migrateNotificationsToRecipients().catch(async (error) => {
  console.error('Notification migration failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
