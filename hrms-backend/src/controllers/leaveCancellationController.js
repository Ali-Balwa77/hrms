import Employee from "../models/Employee.js";
import Leave from "../models/Leave.js";
import LeaveCancellation from "../models/LeaveCancellation.js";
import { sendEmail } from "../utils/mailgun.js";
import { removeExpiredQuarterlyBalances } from "../utils/quarterlyBalanceHelper.js";
import { sendResponse } from '../utils/apiResponse.js';
import { sendSocketNotification, sendSocketEvent } from "../server.js";
import { createNotificationForUsers, clearRequestNotifications, normalizeNotificationForUser } from "../utils/notificationHelper.js";


const getLoginEmployeeId = (user) => String(user?.employeeId?._id || user?.employeeId || "");

const getUserRoleName = (user) =>
  String(user?.role?.name || user?.employeeType || "").toLowerCase().trim();

const isHrOwnRequest = (req, employeeId) =>
  getUserRoleName(req.user) === "hr" &&
  String(employeeId?._id || employeeId || "") === getLoginEmployeeId(req.user);

const clearLeaveCancellationNotifications = async (cancellationId) => {
  const userIds = await clearRequestNotifications({
    linkId: cancellationId,
    type: "LEAVE_CANCELLATION",
  });

  userIds.forEach((userId) => {
    sendSocketEvent(userId, "remove_notification", {
      linkId: cancellationId,
      type: "LEAVE_CANCELLATION",
    });
  });
};

export const createLeaveCancellation = async (req, res) => {
  try {
    const leave = await Leave.findById(req.body.leaveId)
      .populate("forwardTo")
      .populate("employeeId");

    if (!leave) {
      return sendResponse(res, 404, "Leave not found", null, {});
    }

    const leaveCancelData = {
      ...req.body,
      employeeId: req.user.employeeId || req.body.employeeId,

      // જો cancellation form mathi forwardTo na aave to original leave na forwardTo use karo
      forwardTo: req.body.forwardTo || leave.forwardTo,
    };

    const cancellation = new LeaveCancellation(leaveCancelData);
    await cancellation.save();

    const data = await LeaveCancellation.findById(cancellation._id)
      .populate({
        path: "leaveId",
        populate: {
          path: "leaveType",
        },
      })
      .populate({
        path: "employeeId",
        populate: {
          path: "organization",
        },
      })
      .populate("forwardTo");

    const notificationUserIds = new Set();

    // TL / selected approver
    if (Array.isArray(data.forwardTo)) {
      data.forwardTo.forEach((user) => {
        if (user?._id) {
          notificationUserIds.add(String(user._id));
        }
      });
    } else if (data.forwardTo?._id) {
      notificationUserIds.add(String(data.forwardTo._id));
    }

    // Admin + HR
    const adminAndHRUsers = await Employee.find({
      employeeType: { $in: ["Admin", "HR"] },
    });

    for (const user of adminAndHRUsers) {
      if (user?._id) {
        notificationUserIds.add(String(user._id));
      }
    }

    const message =
      leaveCancelData.from === leaveCancelData.to
        ? `${data.employeeId.firstName} ${data.employeeId.lastName} cancellation leave on ${leaveCancelData.from}`
        : `${data.employeeId.firstName} ${data.employeeId.lastName} cancellation leave from ${leaveCancelData.from} to ${leaveCancelData.to}`;

    const notification = await createNotificationForUsers({
      userIds: [...notificationUserIds],
      title: "Leave Cancellation Request",
      message,
      type: "LEAVE_CANCELLATION",
      linkId: cancellation._id,
      excludeUserId: data.employeeId?._id || data.employeeId,
    });

    if (notification) {
      notification.recipients.forEach((recipient) => {
        sendSocketNotification(
          recipient.userId,
          normalizeNotificationForUser(notification, recipient.userId)
        );
      });
    }

    await sendEmail(data.forwardTo.officeEmail, `${data.employeeId.firstName} ${data.employeeId.lastName}`, 'leave_cancel_application', { data });

    sendResponse(res, 201, "Leave cancellation request created", cancellation, {});

  } catch (error) {
    console.error('[leaveCancellationController.js] API error:', error);

    sendResponse(res, 500, 'Failed to create leave cancellation', null, {});
  }
};

export const getMyLeaveCancellations = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const cancellations = await LeaveCancellation.find({
      employeeId: employeeId
    })
      .populate({
        path: 'leaveId',
        populate: {
          path: 'leaveType'
        }
      })
      .populate("employeeId", "employeeNo firstName lastName")
      .populate("forwardTo", "employeeNo firstName lastName")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Success', cancellations, {});
  } catch (error) {
    console.error('[leaveCancellationController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};

export const getPendingLeaveCancellations = async (req, res) => {
  try {
    const loginEmployeeId = getLoginEmployeeId(req.user);
    const roleName = getUserRoleName(req.user);

    const query =
      roleName === "hr" && loginEmployeeId
        ? { status: "pending", employeeId: { $ne: loginEmployeeId } }
        : { status: "pending" };

    const cancellations = await LeaveCancellation.find(query)
      .populate({
        path: 'leaveId',
        populate: {
          path: 'leaveType'
        }
      })
      .populate("employeeId", "employeeNo firstName lastName")
      .populate("forwardTo", "employeeNo firstName lastName")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Success', cancellations, {});
  } catch (error) {
    console.error('[leaveCancellationController.js] API error:', error);
    
    sendResponse(res, 500, 'Failed to get leave cancellation', null, {});
  }
};

export const getCancellationLeave = async (req, res) => {
  try {
    const loginEmployeeId = getLoginEmployeeId(req.user);
    const roleName = getUserRoleName(req.user);

    const query =
      roleName === "hr" && loginEmployeeId
        ? { employeeId: { $ne: loginEmployeeId } }
        : {};

    const leaveCencel = await LeaveCancellation.find(query)
      .populate({
        path: "leaveId",
        populate: {
          path: "leaveType",
          select: "name code",
        },
      })
      .populate('employeeId', 'firstName lastName email employeeNo')
      .populate('forwardTo', 'firstName lastName employeeNo')

    if (!leaveCencel) {
      return sendResponse(res, 404, 'Leave not found', null, {});
    }

    sendResponse(res, 200, 'Success', leaveCencel, {});
  } catch (error) {
    console.error('[leaveCancellationController.js] API error:', error);
    sendResponse(res, 500, 'Failed to fetch leave', null, {});
  }
};

export const getCancellationById = async (req, res) => {
  try {
    
    const leaveCencel = await LeaveCancellation.findById(req.params.id)
      .populate({
        path: "leaveId",
        populate: {
          path: "leaveType",
          select: "name code",
        },
      })
      .populate('employeeId', 'firstName lastName email employeeNo')
      .populate('forwardTo', 'firstName lastName employeeNo')

    if (!leaveCencel) {
      return sendResponse(res, 404, 'Leave not found', null, {});
    }

    sendResponse(res, 200, 'Success', leaveCencel, {});
  } catch (error) {
    console.error('[leaveCancellationController.js] API error:', error);
    sendResponse(res, 500, 'Failed to fetch leave', null, {});
  }
};

export const approveCancellation = async (req, res) => {
  try {
    
    const cancellation = await LeaveCancellation.findById(req.params.id)
      .populate({
        path: 'leaveId',
        populate: {
          path: 'leaveType'
        }
      })
      .populate("employeeId")
      .populate("forwardTo")
      
    if (!cancellation) {
      return sendResponse(res, 404, "Cancellation request not found", null, {});
    }

    if (isHrOwnRequest(req, cancellation.employeeId?._id || cancellation.employeeId)) {
      return sendResponse(
        res,
        403,
        "HR cannot approve or reject their own leave cancellation request",
        null,
        {}
      );
    }
    
    cancellation.status = req.body.status;
    
    cancellation.sanctionedDays = req.body.sanctionedDays;
    cancellation.sanctionOn = req.body.sanctionOn;
    cancellation.sanctionFrom = req.body.sanctionFrom;
    cancellation.sanctionTo = req.body.sanctionTo;
    cancellation.sanctionRemarks = req.body.sanctionRemarks;
    cancellation.sanctionedBy = req.user.id;
    
    await cancellation.save();
    
    
    if (req.body.status === "approved") {
      
      await removeExpiredQuarterlyBalances();
      
      await Leave.findByIdAndUpdate(
        cancellation.leaveId._id,
        {
          status: "cancelled"
        }
      );
      
      const employee = cancellation.employeeId;
      
      const leaveType = cancellation.leaveId.leaveType?.code;
      
      const noOfDays = Number(
        cancellation.leaveId.noOfDays || 0
      );
      
      const leaveIndex = employee.leaveBalance.findIndex(
        (x) => x.leaveType === leaveType
      );

      if (leaveIndex !== -1) {

        employee.leaveBalance[leaveIndex].totalLeave =
          Number(
            employee.leaveBalance[leaveIndex]
              .totalLeave || 0
          ) + noOfDays;
      }

      await employee.save();
    }
    
    await clearLeaveCancellationNotifications(req.params.id);

    await sendEmail(
      cancellation.employeeId.officeEmail,
      `${cancellation.employeeId.firstName} ${cancellation.employeeId.lastName}`,
      'leave_cancellation_status',
      {
        data: cancellation
      }
    );
    const message = req.body.status === "approved"
          ? "Leave cancellation approved successful"
          : "Leave cancellation rejected successful"

    sendResponse(res, 200, message, null, {});

  } catch (error) {
    console.error('[leaveCancellationController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};

export const getTeamCancelLeaves = async (req, res) => {
  try {
    const tlId = req.user.employeeId;
 
    
    const employees = await Employee.find({ leaveForwardTo: tlId }).select("_id");

    let employeeIds = employees.map(emp => emp._id);

    if (getUserRoleName(req.user) === "hr") {
      employeeIds = employeeIds.filter(
        (employeeId) => String(employeeId) !== getLoginEmployeeId(req.user)
      );
    }

    
    const leavesCancel = await LeaveCancellation.find({
      employeeId: { $in: employeeIds }
    })
      .populate({
        path: 'leaveId',
        populate: {
          path: 'leaveType'
        }
      })
      .populate({
        path: "employeeId",
        select: "firstName lastName email employeeNo",
      })
      .populate("forwardTo", "firstName lastName employeeNo")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Success', leavesCancel, {});

  } catch (err) {
    console.error('[leaveCancellationController.js] API error:', err);
    sendResponse(res, 500, err.message, null, {});
  }
};