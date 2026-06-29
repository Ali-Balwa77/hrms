import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { sendResponse } from '../utils/apiResponse.js';
import {
  getUnreadNotificationQuery,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
  normalizeNotificationForUser,
} from '../utils/notificationHelper.js';

export const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.employeeId?._id || req.user.employeeId;
    
    const notifications = await Notification.find(getUnreadNotificationQuery(userId)).sort({ createdAt: -1 });
    const activeNotifications = [];

    for (const notification of notifications) {
      if (notification.type === "FORWARDED_APPROVAL" && notification.linkId) {
        const leave = await mongoose.model('Leave').findById(notification.linkId);

        if (!leave || leave.status !== 'pending') {
          await markNotificationReadForUser(notification._id, userId);
          continue;
        }
      }

      if (notification.type === "LEAVE_CANCELLATION" && notification.linkId) {
        const leaveCancel = await mongoose.model('LeaveCancellation').findById(notification.linkId);

        if (!leaveCancel || leaveCancel.status !== 'pending') {
          await markNotificationReadForUser(notification._id, userId);
          continue;
        }
      }

      if (notification.type === "MISPUNCH" && notification.linkId) {
        const mispunch = await mongoose.model('Mispunch').findById(notification.linkId);

        if (!mispunch || mispunch.status !== 'pending') {
          await markNotificationReadForUser(notification._id, userId);
          continue;
        }
      }

      activeNotifications.push(normalizeNotificationForUser(notification, userId));
    }

    sendResponse(res, 200, 'Success', activeNotifications, {});
  } catch (error) {
    console.error('[notificationController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.employeeId?._id || req.user.employeeId;
    await markAllNotificationsReadForUser(userId);
    sendResponse(res, 200, "All notifications marked as read", null, {});
  } catch (error) {
    console.error('[notificationController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.employeeId?._id || req.user.employeeId;
    const notification = await markNotificationReadForUser(req.params.id, userId);
    sendResponse(res, 200, 'Success', normalizeNotificationForUser(notification, userId), {});
  } catch (error) {
    console.error('[notificationController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};
