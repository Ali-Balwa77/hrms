import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/mailgun.js';
import LeaveType from '../models/LeaveType.js';
import Holiday from '../models/Holiday.js';
import { removeExpiredQuarterlyBalances } from "../utils/quarterlyBalanceHelper.js";
import { sendResponse } from '../utils/apiResponse.js';
import { sendSocketEvent, sendSocketNotification } from "../server.js";
import { createNotificationForUsers, clearRequestNotifications, normalizeNotificationForUser } from "../utils/notificationHelper.js";

 
export const getEmployeeLeaves = async (req, res) => {
  try {
    const { employeeId } = req.params;
 
    const leaves = await Leave.find({ employeeId })
      .populate('employeeId', 'firstName lastName email, employeeNo')
      .populate('forwardTo', 'firstName lastName employeeNo')
      .populate('leaveType', 'name code')
      .populate('sanctionedBy', 'empID name')
      .sort({ createdAt: -1 });
    
    const formattedLeaves = leaves.map(l => ({
      ...l.toObject(),
      leaveDisplay: buildLeaveDisplay(l)
    }));
 
    sendResponse(res, 200, 'Success', formattedLeaves, {});
  } catch (error) {
    console.error('[leaveController.js] API error:', error);
    sendResponse(res, 500, 'Failed to fetch employee leaves', null, {});
  }
};
 
const calculateWorkingDays = async (fromDate, toDate) => {
  let count = 0;
  let current = new Date(fromDate);

  while (current <= toDate) {
    const day = current.getDay(); 

    
    if (day !== 0 && day !== 6) {
      const holiday = await Holiday.findOne({ date: current });

      if (!holiday) {
        count++;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
};

const buildLeaveDisplay = (leave) => {
  if (!leave.isHalfDay) return 'Full Day';

  if (leave.halfDayType) {
    return `Half Day (${leave.halfDayType === 'pre' ? 'Pre Leave' : 'Post Leave'})`;
  }

  const parts = [];

  if (leave.halfLeaveForFirstDay) {
    parts.push(`First Day ${leave.firstDayHalfType === 'pre' ? 'Pre Leave' : 'Post Leave'}`);
  }

  if (leave.halfLeaveForLastDay) {
    parts.push(`Last Day ${leave.lastDayHalfType === 'pre' ? 'Pre Leave' : 'Post Leave'}`);
  }

  return parts.length ? `Half Day (${parts.join(', ')})` : 'Half Day';
};


const getLoginEmployeeId = (user) => String(user?.employeeId?._id || user?.employeeId || "");

const getUserRoleName = (user) =>
  String(user?.role?.name || user?.employeeType || "").toLowerCase().trim();

const isHrOwnRequest = (req, employeeId) =>
  getUserRoleName(req.user) === "hr" &&
  String(employeeId?._id || employeeId || "") === getLoginEmployeeId(req.user);

const normalizeIdList = (value) => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.filter((item) => item && item !== "null" && item !== "undefined" && item !== "");
};

const getActiveUserEmployeeIds = async (employeeIds = []) => {
  const ids = normalizeIdList(employeeIds);
  if (!ids.length) return new Set();

  const activeUsers = await User.find({
    employeeId: { $in: ids },
    isActive: true,
  }).select("employeeId");

  return new Set(activeUsers.map((user) => String(user.employeeId)));
};

const getActiveFallbackApprover = async (applicantEmployeeId) => {
  const activeUsers = await User.find({ isActive: true })
    .select("employeeId role isActive")
    .populate("role", "name")
    .populate("employeeId", "firstName lastName employeeNo officeEmail status employeeType");

  const fallbackUsers = activeUsers.filter((user) => {
    const employee = user.employeeId;
    const roleName = String(user.role?.name || employee?.employeeType || "").toLowerCase().trim();

    return (
      employee &&
      employee.status === "active" &&
      String(employee._id) !== String(applicantEmployeeId) &&
      ["hr", "admin"].includes(roleName)
    );
  });

  const hrUser = fallbackUsers.find((user) =>
    [user.role?.name, user.employeeId?.employeeType]
      .map((value) => String(value || "").toLowerCase().trim())
      .includes("hr")
  );

  return (hrUser || fallbackUsers[0])?.employeeId || null;
};

const resolveLeaveForwardTo = async (requestedForwardTo, applicantEmployeeId) => {
  const requestedIds = normalizeIdList(requestedForwardTo);

  if (requestedIds.length) {
    const employees = await Employee.find({
      _id: { $in: requestedIds },
      status: "active",
    }).select("_id");

    const employeeIds = employees.map((employee) => employee._id);
    const activeUserEmployeeIds = await getActiveUserEmployeeIds(employeeIds);

    const activeRequestedId = requestedIds.find((id) =>
      activeUserEmployeeIds.has(String(id))
    );

    if (activeRequestedId) {
      return activeRequestedId;
    }
  }

  const fallbackApprover = await getActiveFallbackApprover(applicantEmployeeId);

  if (!fallbackApprover?._id) {
    return null;
  }

  return fallbackApprover._id;
};

const getActiveAdminAndHRApprovers = async (applicantEmployeeId) => {
  const activeUsers = await User.find({ isActive: true })
    .select("employeeId role isActive")
    .populate("role", "name")
    .populate("employeeId", "firstName lastName employeeNo officeEmail status employeeType");

  return activeUsers
    .filter((user) => {
      const employee = user.employeeId;
      const roleName = String(user.role?.name || employee?.employeeType || "").toLowerCase().trim();

      return (
        employee &&
        employee.status === "active" &&
        String(employee._id) !== String(applicantEmployeeId) &&
        ["hr", "admin"].includes(roleName)
      );
    })
    .map((user) => user.employeeId);
};

const applyHalfDayRules = async (leaveData, fromDate, toDate) => {
  const requestedDay = await calculateWorkingDays(fromDate, toDate);
  const isSameDay = fromDate.toDateString() === toDate.toDateString();

  if (!leaveData.isHalfDay) {
    leaveData.halfDayType = undefined;
    leaveData.halfLeaveForFirstDay = false;
    leaveData.firstDayHalfType = undefined;
    leaveData.halfLeaveForLastDay = false;
    leaveData.lastDayHalfType = undefined;
    leaveData.noOfDays = requestedDay;
    return leaveData;
  }

  if (isSameDay) {
    if (!leaveData.halfDayType) {
      const error = new Error('Half day type (pre/post) is required');
      error.statusCode = 400;
      throw error;
    }

    leaveData.halfLeaveForFirstDay = false;
    leaveData.firstDayHalfType = undefined;
    leaveData.halfLeaveForLastDay = false;
    leaveData.lastDayHalfType = undefined;
    leaveData.noOfDays = 0.5;
    return leaveData;
  }

  leaveData.halfDayType = undefined;

  if (!leaveData.halfLeaveForFirstDay && !leaveData.halfLeaveForLastDay) {
    const error = new Error('Please select half leave for first day or last day');
    error.statusCode = 400;
    throw error;
  }

  if (leaveData.halfLeaveForFirstDay && !leaveData.firstDayHalfType) {
    const error = new Error('First day half leave type (pre/post) is required');
    error.statusCode = 400;
    throw error;
  }

  if (leaveData.halfLeaveForLastDay && !leaveData.lastDayHalfType) {
    const error = new Error('Last day half leave type (pre/post) is required');
    error.statusCode = 400;
    throw error;
  }

  let totalDays = requestedDay;

  if (leaveData.halfLeaveForFirstDay) totalDays -= 0.5;
  if (leaveData.halfLeaveForLastDay) totalDays -= 0.5;

  leaveData.noOfDays = Number(Math.max(totalDays, 0).toFixed(1));

  return leaveData;
};

const clearForwardedApprovalNotifications = async (leaveId) => {
  const userIds = await clearRequestNotifications({
    linkId: leaveId,
    type: "FORWARDED_APPROVAL",
  });

  userIds.forEach((userId) => {
    sendSocketEvent(userId, "remove_notification", {
      linkId: leaveId,
      type: "FORWARDED_APPROVAL",
    });
  });
};
 
export const applyLeave = async (req, res) => {
  try {
 
    const parseDMYToDate = (dateStr) => {
      const [day, month, year] = dateStr.split('/');

      return new Date(`${year}-${month}-${day}`);
    };
    const leaveData = {
      ...req.body,
      appliedDate: parseDMYToDate(req.body.appliedDate),
      employeeId: req.user.employeeId || req.body.employeeId,
      status: 'pending'
    };
    
    const fromDate = new Date(leaveData.from);
    const toDate = new Date(leaveData.to);
 
    
    let current = new Date(fromDate);
   
    while (current <= toDate) {
       const day = current.getDay(); 
        
      if (day === 0 || day === 6) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      const holiday = await Holiday.findOne({
        date: current
      });
 
      if (holiday) {
        return sendResponse(res, 400, `Leave cannot be applied on holiday: ${holiday.name}`, null, {});
      }
 
      current.setDate(current.getDate() + 1);
    }
 
    const existingLeave = await Leave.findOne({
      employeeId: req.user.employeeId,
      status: { $nin: ['rejected', 'cancelled'] },
 
      $or: [
        {
          from: { $lte: toDate },
          to: { $gte: fromDate }
        }
      ]
    });
 
    if (existingLeave) {
      return sendResponse(res, 400, 'Leave already applied for selected date', null, {});
    }
    
    try {
      await applyHalfDayRules(leaveData, fromDate, toDate);
    } catch (error) {
    console.error('[leaveController.js] API error:', error);
      return sendResponse(res, error.statusCode || 400, error.message, null, {});
    }
   
    await removeExpiredQuarterlyBalances();

    const employee = await Employee.findById(req.user.employeeId);
    const leaveType = await LeaveType.findById(req.body.leaveType);
    
    const leaveBalanceItem = employee.leaveBalance.find(
      (x) => x.leaveType === leaveType.code
    );

    const balance = Number(leaveBalanceItem?.totalLeave || 0);
     
    const pendingLeaves = await Leave.find({
      employeeId: req.user.employeeId,
      leaveType: req.body.leaveType,
      status: 'pending'
    });
 
    const pendingDays = pendingLeaves.reduce(
      (total, leave) => total + (leave.noOfDays || 0),
      0
    );
 
    const availableBalance = balance - pendingDays;
   
    const requestedDays = leaveData.noOfDays || req.body.noOfDays;
 
    if (requestedDays > availableBalance) {
      return sendResponse(res, 400, `Only ${availableBalance} ${leaveType.name} available`, null, {});
    }

    const roleName = req.user?.role?.name;

    if (roleName === "Intern") {
      const allowedLeaves = ["LWP", "PROBATION"];

      if (!allowedLeaves.includes(leaveType.code)) {
        return sendResponse(res, 400, "Intern can apply only LWP or Probation Leave.", null, {});
      }
    }

    if (roleName !== "Intern" && leaveType.code === "PROBATION") {
      return sendResponse(res, 400, "Probation Leave is allowed only for Intern.", null, {});
    }

    const resolvedForwardTo = await resolveLeaveForwardTo(
      req.body.forwardTo,
      req.user.employeeId
    );

    if (!resolvedForwardTo) {
      return sendResponse(res, 400, "No active approver found. Please contact HR/Admin.", null, {});
    }

    leaveData.forwardTo = resolvedForwardTo;

    const leave = new Leave(leaveData);
    await leave.save();
 
    const data = await Leave.findById(leave._id)
      .populate({
        path: "employeeId",
        populate: {
          path: "organization",
        },
      })
      .populate("forwardTo")
      .populate("leaveType");

    const formatDate = (date) => {
      if (!date) return "";

      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();

      return `${day}/${month}/${year}`;
    };

    const fromDateMsg = formatDate(leave.from);
    const toDateMsg = formatDate(leave.to);

    const notificationUserIds = new Set();
    
    if (Array.isArray(data.forwardTo)) {
      data.forwardTo.forEach((user) => {
        if (user?._id) {
          notificationUserIds.add(String(user._id));
        }
      });
    } else if (data.forwardTo?._id) {
      notificationUserIds.add(String(data.forwardTo._id));
    }
    
    const adminAndHRUsers = await getActiveAdminAndHRApprovers(data.employeeId?._id);
    
    const message =
      fromDateMsg === toDateMsg
        ? `${data.employeeId.firstName} ${data.employeeId.lastName} applied leave on ${fromDateMsg}`
        : `${data.employeeId.firstName} ${data.employeeId.lastName} applied leave from ${fromDateMsg} to ${toDateMsg}`;

    for (const user of adminAndHRUsers) {
      if (user?._id) {
        notificationUserIds.add(String(user._id));
      }
    }

    const notification = await createNotificationForUsers({
      userIds: [...notificationUserIds],
      title: "New Leave Request",
      message,
      type: "FORWARDED_APPROVAL",
      linkId: leave._id,
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
 
    if (data.forwardTo?.officeEmail) {
      await sendEmail(data.forwardTo.officeEmail, `${data.employeeId.firstName} ${data.employeeId.lastName}`, 'leave_application', { data });
    }
    await leave.save();
 
    sendResponse(res, 201, 'Leave request created successfully', leave, {});
  } catch (error) {
    console.error('[leaveController.js] API error:', error);
    sendResponse(res, 500, 'Failed to create leave request', null, {});
  }
};
 
export const getLeaves = async (req, res) => {
  try {
    const loginEmployeeId = getLoginEmployeeId(req.user);
    const roleName = getUserRoleName(req.user);

    const query =
      roleName === "hr" && loginEmployeeId
        ? { employeeId: { $ne: loginEmployeeId } }
        : {};

    const leaves = await Leave.find(query)
      .populate('employeeId', 'firstName lastName email employeeNo department')
      .populate('forwardTo', 'firstName lastName employeeNo')
      .populate('leaveType', 'name code')
      .populate('sanctionedBy', 'empID name')
      .sort({ createdAt: -1 });
 
    const formattedLeaves = leaves.map(l => ({
        ...l.toObject(),
        leaveDisplay: buildLeaveDisplay(l)
      }));
 
    sendResponse(res, 200, 'Success', formattedLeaves, {});  
  } catch (error) {
    console.error('[leaveController.js] API error:', error);
    sendResponse(res, 500, 'Failed to fetch leaves', null, {});
  }
};
 
export const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId')
      .populate('forwardTo', 'firstName lastName employeeNo')
      .populate('leaveType', 'name code')
      .populate('sanctionedBy', 'empID name')
 
    if (!leave) {
      return sendResponse(res, 404, 'Leave not found', null, {});
    }
 
    sendResponse(res, 200, 'Success', leave, {});
  } catch (error) {
    console.error('[leaveController.js] API error:', error);
    sendResponse(res, 500, 'Failed to fetch leave', null, {});
  }
};
 
export const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const parseDMYToDate = (dateStr) => {
      const [day, month, year] = dateStr.split('/');

      return new Date(`${year}-${month}-${day}`);
    };
    const updateData = {
      ...req.body,
      appliedDate: parseDMYToDate(req.body.appliedDate),
    };
    
    const fromDate = new Date(updateData.from);
    const toDate = new Date(updateData.to);

    await applyHalfDayRules(updateData, fromDate, toDate);
  
    const leave = await Leave.findByIdAndUpdate(id, updateData, { new: true })
      .populate('employeeId', 'firstName lastName email employeeNo')
      .populate('leaveType', 'name code')
      .populate('sanctionedBy', 'empID name')
 
    if (!leave) {
      return sendResponse(res, 404, 'Leave not found', null, {});
    }
 
    sendResponse(res, 200, 'Success', leave, {});
  } catch (error) {
    console.error('[leaveController.js] API error:', error);
    sendResponse(res, 500, 'Failed to update leave', null, {});
  }
};
 
export const approveLeave = async (req, res) => {
  try {
    await removeExpiredQuarterlyBalances();
    const { id } = req.params;
 
    const numberOfDays = req.body.sanctionedDays;
   
    const leaveType = await LeaveType.find({ code: req.body.leaveType});

    const employee = await Employee.findOne({
      employeeNo:
        req.body.employeeId.split(" - ")[0]
    });

    if (!employee) {

      return sendResponse(res, 404, "Employee not found", null, {});
    }

    if (isHrOwnRequest(req, employee._id)) {
      return sendResponse(
        res,
        403,
        "HR cannot approve or reject their own leave request",
        null,
        {}
      );
    }
 
    if (req.body.status === "approved") {
      
      const leaveIndex =
        employee.leaveBalance.findIndex(
          (x) =>
            x.leaveType === leaveType[0].code
        );
        
      
      if (leaveIndex === -1) {

        return sendResponse(res, 400, "Leave balance not found", null, {});
      }

      const currentBalance = Number(
        employee.leaveBalance[leaveIndex]
          .totalLeave || 0
      );

      if (currentBalance < numberOfDays) {

        return sendResponse(res, 400, `Not enough ${leaveType[0].code} balance`, null, {});
      }

      employee.leaveBalance[
        leaveIndex
      ].totalLeave =
        currentBalance - numberOfDays;

      await employee.save();
    }
 
    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      {
        status: req.body.status,
        sanctionedBy: req.user._id,
        sanctionOn: req.body.sanctionOn,
        sanctionFrom: req.body.sanctionFrom,
        sanctionTo: req.body.sanctionTo,
        sanctionRemarks: req.body.sanctionRemarks,
        sanctionedDays: numberOfDays
      },
      { new: true }
    )
      .populate({
        path: "employeeId",
        populate: {
          path: "organization",
        },
      })
      .populate("forwardTo")
      .populate("leaveType")
      .populate("sanctionedBy", "empID name");
 
    await clearForwardedApprovalNotifications(id);
 
    await sendEmail(updatedLeave.employeeId.officeEmail, `${updatedLeave.employeeId.firstName} ${updatedLeave.employeeId.lastName}`, 'leave_sanctioned', { data: updatedLeave });
    const message = req.body.status === "approved"
          ? "Leave approved successful"
          : "Leave rejected successful"
    sendResponse(res, 200, message, updatedLeave, {});
  } catch (error) {
    console.error('[leaveController.js] API error:', error);
    sendResponse(res, 500, 'Failed to approve leave', null, {});
  }
};
 
export const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) {
      return sendResponse(res, 404, 'Leave not found', null, {});
    }
    await clearForwardedApprovalNotifications(req.params.id);
    sendResponse(res, 200, 'Leave deleted', null, {});
  } catch (error) {
    console.error('[leaveController.js] API error:', error);
    sendResponse(res, 500, 'Failed to delete leave', null, {});
  }
};
 
export const leavesTrends = async (req, res) => {
  try {
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 6);
 
    const leaves = await Leave.find({
      status: "approved",
    });

    const result = {};
 
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0]; 
      result[key] = 0;
    }
 
    leaves.forEach(l => {
      let start = new Date(l.from);
      const end = new Date(l.to);
 
      while (start <= end) {
        const key = start.toISOString().split('T')[0];
 
        if (result[key] !== undefined) {
          result[key]++;
        }
 
        start.setDate(start.getDate() + 1);
      }
    });
 
    
    const leaveData = Object.keys(result)
      .sort()
      .map(date => ({
        date,
        count: result[date]
      }));
 
    sendResponse(res, 200, 'Success', leaveData, {});
  } catch (err) {
    console.error('[leaveController.js] API error:', err);
    sendResponse(res, 500, err.message, null, {});
  }
};
 
 
export const getTeamLeaves = async (req, res) => {
  try {
    const tlId = req.user.employeeId;
 
    
    const employees = await Employee.find({ leaveForwardTo: tlId }).select("_id");
 
    let employeeIds = employees.map(emp => emp._id);

    if (getUserRoleName(req.user) === "hr") {
      employeeIds = employeeIds.filter(
        (employeeId) => String(employeeId) !== getLoginEmployeeId(req.user)
      );
    }
 
    
    const leaves = await Leave.find({
      employeeId: { $in: employeeIds }
    })
      .populate({
        path: "employeeId",
        select: "firstName lastName email employeeNo department",
      })
      .populate("forwardTo", "firstName lastName employeeNo")
      .populate('leaveType', 'name code')
      .sort({ createdAt: -1 });
 
    sendResponse(res, 200, 'Success', leaves, {});
 
  } catch (err) {
    console.error('[leaveController.js] API error:', err);
    sendResponse(res, 500, err.message, null, {});
  }
};
 
export const getPendingLeaveCountForTL = async (req, res) => {
  try {
    const tlId = req.user.employeeId;
 
    
    const employees = await Employee.find({ leaveForwardTo: tlId }).select("_id");
 
    const employeeIds = employees.map(emp => emp._id);
 
    
    const count = await Leave.countDocuments({
      employeeId: { $in: employeeIds },
      status: 'pending'
    });
 
    sendResponse(res, 200, 'Success', { count }, {});
 
  } catch (err) {
    console.error('[leaveController.js] API error:', err);
    sendResponse(res, 500, err.message, null, {});
  }
}
 
export const getLeaveCalendar = async (req, res) => {
  try {
    const { month, year } = req.query;
    const user = req.user;
 
    
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
 
    let query = {
      from: { $lte: end },
      to: { $gte: start }
    };
 
    
    const leaves = await Leave.find(query)
      .populate("employeeId", "firstName lastName employeeNo")
      .populate("forwardTo", "firstName lastName employeeNo")
      .populate('leaveType', 'name code')
 
    sendResponse(res, 200, 'Success', leaves, {});
 
  } catch (err) {
    console.error('[leaveController.js] API error:', err);
    sendResponse(res, 500, "Error fetching calendar leaves", null, {});
  }
};
 