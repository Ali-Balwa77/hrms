import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Mispunch from "../models/Mispunch.js";
import { sendResponse } from "../utils/apiResponse.js";
import { sendSocketNotification, sendSocketEvent } from "../server.js";
import { createNotificationForUsers, clearRequestNotifications, normalizeNotificationForUser } from "../utils/notificationHelper.js";

const populateQuery = (query) =>
  query
    .populate("employeeId", "employeeNo firstName lastName officeEmail employeeType reportingTo")
    .populate("forwardTo", "employeeNo firstName lastName officeEmail employeeType")
    .populate("sanctionedBy", "name empID email");

const formatDate = (date) => {
  if (!date) return "";

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

const normalizeTime = (value) => {
  if (!value) return "";
  const [hh = "00", mm = "00"] = String(value).split(":");
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
};

const timeToSeconds = (time) => {
  if (!time) return null;
  const [h = 0, m = 0, s = 0] = String(time).split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

const secondsToTime = (totalSeconds) => {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const h = Math.floor(safeSeconds / 3600);
  const m = Math.floor((safeSeconds % 3600) / 60);
  const s = safeSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const minutesToHHMM = (totalMinutes) => {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const h = Math.floor(safeMinutes / 60);
  const m = safeMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const calculateMispunchDuration = (startTime, endTime) => {
  const startSeconds = timeToSeconds(startTime);
  const endSeconds = timeToSeconds(endTime);

  if (startSeconds === null || endSeconds === null) {
    return { durationMinutes: 0, durationHours: "00:00" };
  }

  if (endSeconds <= startSeconds) {
    throw new Error("End time must be greater than start time");
  }

  const durationMinutes = Math.floor((endSeconds - startSeconds) / 60);

  return {
    durationMinutes,
    durationHours: minutesToHHMM(durationMinutes),
  };
};

const addSecondsToTotalHours = (currentTotalHours, secondsToAdd) => {
  const currentSeconds = timeToSeconds(currentTotalHours || "00:00:00") || 0;
  const extraSeconds = Math.max(0, Number(secondsToAdd) || 0);

  return secondsToTime(currentSeconds + extraSeconds);
};

const getMispunchDurationSeconds = (mispunch) => {
  if (Number(mispunch?.durationMinutes) > 0) {
    return Number(mispunch.durationMinutes) * 60;
  }

  const startSeconds = timeToSeconds(normalizeTime(mispunch?.startTime));
  const endSeconds = timeToSeconds(normalizeTime(mispunch?.endTime));

  if (startSeconds === null || endSeconds === null || endSeconds <= startSeconds) {
    throw new Error("Invalid mispunch time range");
  }

  return endSeconds - startSeconds;
};


const isValidTimeRange = (start, end) => {
  const startSeconds = timeToSeconds(normalizeTime(start));
  const endSeconds = timeToSeconds(normalizeTime(end));
  return startSeconds !== null && endSeconds !== null && endSeconds > startSeconds;
};

const getPunchIdentity = (punch) => {
  const mispunchId = punch?.mispunchId ? String(punch.mispunchId) : "";
  return [punch?.type || "", normalizeTime(punch?.in), normalizeTime(punch?.out), punch?.action || "", mispunchId].join("|");
};

const getPlainPunch = (punch = {}) => {
  if (punch?.toObject) return punch.toObject();
  if (punch?._doc) return { ...punch._doc };
  return { ...punch };
};

const cleanAttendancePunches = (punches = []) => {
  if (!Array.isArray(punches)) return [];

  const unique = new Map();

  punches.filter(Boolean).forEach((punch, index) => {
    const plainPunch = getPlainPunch(punch);

    const normalizedPunch = {
      ...plainPunch,
      type: plainPunch?.type,
      in: plainPunch?.in ? normalizeTime(plainPunch.in) : plainPunch?.in,
      out: plainPunch?.out ? normalizeTime(plainPunch.out) : plainPunch?.out,
      action: plainPunch?.action || null,
      mispunchId: plainPunch?.mispunchId || null,
      _sortIndex: index,
    };

    if (
      normalizedPunch.in &&
      normalizedPunch.out &&
      normalizedPunch.in === normalizedPunch.out
    ) {
      return;
    }

    const key = getPunchIdentity(normalizedPunch);
    if (!unique.has(key)) unique.set(key, normalizedPunch);
  });

  let cleaned = Array.from(unique.values());

  cleaned = cleaned.filter((punch, index, list) => {
    if (punch?.type !== "work") return true;

    const punchIn = normalizeTime(punch?.in);
    const punchOut = normalizeTime(punch?.out);

    if (!punchIn || punchOut) return true;

    const hasCompletedAfterOrSame = list.some((item, itemIndex) => {
      if (itemIndex === index) return false;
      if (item?.type !== "work") return false;
      if (!isValidTimeRange(item?.in, item?.out)) return false;
      return normalizeTime(item.in) >= punchIn;
    });

    return !hasCompletedAfterOrSame;
  });

  return cleaned
    .sort((a, b) => {
      const aTime = normalizeTime(a?.in || a?.out);
      const bTime = normalizeTime(b?.in || b?.out);
      const timeCompare = aTime.localeCompare(bTime);

      if (timeCompare !== 0) return timeCompare;

      return (a._sortIndex || 0) - (b._sortIndex || 0);
    })
    .map(({ _sortIndex, ...punch }) => punch);
};

const recalculateAttendanceTotalHours = (attendance) => {
  const punches = cleanAttendancePunches(attendance?.punches || []);
  let totalSeconds = 0;

  punches.forEach((punch) => {
    if (punch?.type !== "work") return;
    const startSeconds = timeToSeconds(normalizeTime(punch?.in));
    const endSeconds = timeToSeconds(normalizeTime(punch?.out));
    if (startSeconds === null || endSeconds === null || endSeconds <= startSeconds) return;
    totalSeconds += endSeconds - startSeconds;
  });

  attendance.punches = punches;
  attendance.totalHours = secondsToTime(totalSeconds);

  const completedWorkPunches = punches.filter((punch) => punch?.type === "work" && isValidTimeRange(punch?.in, punch?.out));

  if (completedWorkPunches.length) {
    attendance.checkIn = completedWorkPunches[0].in;
    attendance.checkOut = completedWorkPunches[completedWorkPunches.length - 1].out;
  } else if (attendance.checkIn) {
    attendance.checkOut = null;
  }
};

const getRoleName = (user) => user?.role?.name?.toLowerCase?.() || "";
const isHrOwnRequest = (req, employeeId) =>
  getRoleName(req.user) === "hr" &&
  String(employeeId?._id || employeeId || "") === String(getEmployeeId(req.user) || "");

const hasFeature = (user, feature) => Array.isArray(user?.role?.features) && user.role.features.includes(feature);
const hasPermissionAction = (user, module, action) =>
  Array.isArray(user?.role?.permissions) &&
  user.role.permissions.some((p) => p.module === module && Array.isArray(p.actions) && p.actions.includes(action));

const getEmployeeId = (user) => user?.employeeId?._id || user?.employeeId;

const getTeamEmployeeIds = async (managerId) => {
  if (!managerId) return [];
  const employees = await Employee.find({
    status: "active",
    $or: [{ reportingTo: managerId }, { leaveForwardTo: managerId }],
  }).select("_id");

  return employees.map((employee) => employee._id);
};

const clearMispunchNotifications = async (mispunchId) => {
  const userIds = await clearRequestNotifications({
    linkId: mispunchId,
    type: "MISPUNCH",
  });

  userIds.forEach((userId) => {
    sendSocketEvent(userId, "remove_notification", {
      linkId: mispunchId,
      type: "MISPUNCH",
    });
  });
};

const applyMispunchToAttendance = async (mispunch) => {
  const date = formatDate(mispunch.mispunchDate);
  const startTime = normalizeTime(mispunch.startTime);
  const endTime = normalizeTime(mispunch.endTime);

  const startSeconds = timeToSeconds(startTime);
  const endSeconds = timeToSeconds(endTime);

  if (startSeconds === null || endSeconds === null || endSeconds <= startSeconds) {
    throw new Error("Invalid mispunch time range");
  }

  let attendance = await Attendance.findOne({
    employeeId: mispunch.employeeId,
    date,
  });

  if (!attendance) {
    attendance = new Attendance({
      employeeId: mispunch.employeeId,
      date,
      punches: [
        {
          type: "work",
          in: startTime,
          out: endTime,
          action: "mispunch",
          mispunchId: mispunch._id,
        },
      ],
      checkIn: startTime,
      checkOut: endTime,
      totalHours: "00:00:00",
    });

    recalculateAttendanceTotalHours(attendance);

    attendance.markModified("punches");
    attendance.markModified("checkIn");
    attendance.markModified("checkOut");
    attendance.markModified("totalHours");

    await attendance.save();
    return attendance;
  }

  let punches = cleanAttendancePunches(attendance.punches || []);

  const existingMispunchIndex = punches.findIndex(
    (punch) =>
      punch?.mispunchId &&
      String(punch.mispunchId) === String(mispunch._id)
  );

  const openWorkIndex = punches.findIndex(
    (punch) =>
      punch?.type === "work" &&
      normalizeTime(punch?.in) === startTime &&
      !punch?.out
  );

  const sameStartCompletedIndex = punches.findIndex(
    (punch) =>
      punch?.type === "work" &&
      normalizeTime(punch?.in) === startTime &&
      isValidTimeRange(punch?.in, punch?.out)
  );

  if (openWorkIndex >= 0) {
    punches[openWorkIndex] = {
      ...punches[openWorkIndex],
      type: "work",
      in: startTime,
      out: endTime,
      action: "mispunch",
      mispunchId: mispunch._id,
    };

    // duplicate mispunch object already created hoy to remove kari de
    punches = punches.filter((_, index) => {
      if (index === openWorkIndex) return true;

      const punch = punches[index];

      const isSameMispunch =
        punch?.mispunchId &&
        String(punch.mispunchId) === String(mispunch._id);

      const isDuplicateSameRange =
        punch?.type === "work" &&
        normalizeTime(punch?.in) === startTime &&
        normalizeTime(punch?.out) === endTime;

      return !isSameMispunch && !isDuplicateSameRange;
    });
  } else if (existingMispunchIndex >= 0) {
    punches[existingMispunchIndex] = {
      ...punches[existingMispunchIndex],
      type: "work",
      in: startTime,
      out: endTime,
      action: "mispunch",
      mispunchId: mispunch._id,
    };
  } else if (sameStartCompletedIndex >= 0) {
    punches[sameStartCompletedIndex] = {
      ...punches[sameStartCompletedIndex],
      type: "work",
      in: startTime,
      out: endTime,
      action: "mispunch",
      mispunchId: mispunch._id,
    };
  } else {
    punches.push({
      type: "work",
      in: startTime,
      out: endTime,
      action: "mispunch",
      mispunchId: mispunch._id,
    });
  }

  attendance.punches = punches;

  recalculateAttendanceTotalHours(attendance);

  attendance.markModified("punches");
  attendance.markModified("checkIn");
  attendance.markModified("checkOut");
  attendance.markModified("totalHours");

  await attendance.save();

  return attendance;
};

export const createMispunch = async (req, res) => {
  const employeeId = getEmployeeId(req.user) || req.body.employeeId;

  const parseDMYToDate = (dateStr) => {
    const [day, month, year] = dateStr.split('/');

    return new Date(`${year}-${month}-${day}`);
  };

  const payload = {
    employeeId,
    forwardTo: req.body.forwardTo,
    appliedDate: parseDMYToDate(req.body.appliedDate),
    mispunchDate: req.body.mispunchDate,
    startTime: normalizeTime(req.body.startTime),
    endTime: normalizeTime(req.body.endTime),
    reason: req.body.reason,
    remarks: req.body.remarks || "",
    mispunchOccurs: req.body.mispunchOccurs,
  };

  let duration;
  try {
    duration = calculateMispunchDuration(payload.startTime, payload.endTime);
  } catch (error) {
    return sendResponse(res, 400, error.message || "Invalid mispunch time", null, {});
  }

  Object.assign(payload, duration);

  const mispunch = await Mispunch.create(payload);
  const data = await populateQuery(Mispunch.findById(mispunch._id));

  const mispunchDateMsg = formatDate(payload.mispunchDate);

  const notificationUserIds = new Set();

  if (payload.forwardTo) {
    notificationUserIds.add(String(payload.forwardTo));
  }

  const adminAndHRUsers = await Employee.find({
    employeeType: { $in: ["Admin", "HR"] },
    status: "active",
  }).select("_id");

  const employeeName = `${data.employeeId?.firstName || ""} ${data.employeeId?.lastName || ""}`.trim();

  const message = `${employeeName} submitted mispunch request for ${mispunchDateMsg}`;

  for (const user of adminAndHRUsers) {
    if (user?._id) {
      notificationUserIds.add(String(user._id));
    }
  }

  const notification = await createNotificationForUsers({
    userIds: [...notificationUserIds],
    title: "New Mispunch Request",
    message,
    type: "MISPUNCH",
    linkId: mispunch._id,
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

  return sendResponse(res, 201, "Mispunch request submitted successfully", data, {});
};

export const getMispunches = async (req, res) => {
  const roleName = getRoleName(req.user);
  const loginEmployeeId = getEmployeeId(req.user);
  let filter = {};

  if (roleName === "hr" && loginEmployeeId) {
    filter.employeeId = { $ne: loginEmployeeId };
  } else if (!["admin", "hr"].includes(roleName) && !hasPermissionAction(req.user, "mispunch", "approve")) {
    filter.employeeId = loginEmployeeId;
  } else if (hasFeature(req.user, "team_leave_scope")) {
    const teamIds = await getTeamEmployeeIds(loginEmployeeId);
    filter = { $or: [{ employeeId: { $in: teamIds } }, { forwardTo: loginEmployeeId }] };
  }

  const mispunches = await populateQuery(Mispunch.find(filter).sort({ createdAt: -1 }));
  return sendResponse(res, 200, "Success", mispunches, {});
};

export const getEmployeeMispunches = async (req, res) => {
  const loginEmployeeId = String(getEmployeeId(req.user) || "");
  const requestedEmployeeId = String(req.params.employeeId || "");
  const roleName = getRoleName(req.user);

  if (!["admin", "hr"].includes(roleName) && loginEmployeeId !== requestedEmployeeId) {
    return sendResponse(res, 403, "Access Denied", null, {});
  }

  const mispunches = await populateQuery(Mispunch.find({ employeeId: requestedEmployeeId }).sort({ createdAt: -1 }));
  return sendResponse(res, 200, "Success", mispunches, {});
};

export const getPendingMispunches = async (req, res) => {
  const roleName = getRoleName(req.user);
  const loginEmployeeId = getEmployeeId(req.user);
  let filter = { status: "pending" };

  if (roleName === "hr" && loginEmployeeId) {
    filter.employeeId = { $ne: loginEmployeeId };
  } else if (!["admin", "hr"].includes(roleName)) {
    if (hasFeature(req.user, "team_leave_scope")) {
      const teamIds = await getTeamEmployeeIds(loginEmployeeId);
      filter.$or = [{ employeeId: { $in: teamIds } }, { forwardTo: loginEmployeeId }];
    } else {
      filter.forwardTo = loginEmployeeId;
    }
  }

  const mispunches = await populateQuery(Mispunch.find(filter).sort({ createdAt: -1 }));
  return sendResponse(res, 200, "Success", mispunches, {});
};

export const getMispunchById = async (req, res) => {
  const mispunch = await populateQuery(Mispunch.findById(req.params.id));
  if (!mispunch) return sendResponse(res, 404, "Mispunch request not found", null, {});

  const roleName = getRoleName(req.user);
  const loginEmployeeId = String(getEmployeeId(req.user) || "");
  const employeeId = String(mispunch.employeeId?._id || mispunch.employeeId);
  const forwardTo = String(mispunch.forwardTo?._id || mispunch.forwardTo);

  if (!["admin", "hr"].includes(roleName) && loginEmployeeId !== employeeId && loginEmployeeId !== forwardTo) {
    return sendResponse(res, 403, "Access Denied", null, {});
  }

  return sendResponse(res, 200, "Success", mispunch, {});
};

export const updateMispunch = async (req, res) => {
  const mispunch = await Mispunch.findById(req.params.id);
  if (!mispunch) return sendResponse(res, 404, "Mispunch request not found", null, {});
  if (mispunch.status !== "pending") return sendResponse(res, 400, "Only pending mispunch request can be updated", null, {});

  const loginEmployeeId = String(getEmployeeId(req.user) || "");
  if (String(mispunch.employeeId) !== loginEmployeeId && !["admin", "hr"].includes(getRoleName(req.user))) {
    return sendResponse(res, 403, "Access Denied", null, {});
  }

  const update = {
    forwardTo: req.body.forwardTo || mispunch.forwardTo,
    mispunchDate: req.body.mispunchDate || mispunch.mispunchDate,
    startTime: normalizeTime(req.body.startTime || mispunch.startTime),
    endTime: normalizeTime(req.body.endTime || mispunch.endTime),
    reason: req.body.reason ?? mispunch.reason,
    remarks: req.body.remarks ?? mispunch.remarks,
    mispunchOccurs: req.body.mispunchOccurs || mispunch.mispunchOccurs,
  };

  let duration;
  try {
    duration = calculateMispunchDuration(update.startTime, update.endTime);
  } catch (error) {
    return sendResponse(res, 400, error.message || "Invalid mispunch time", null, {});
  }

  Object.assign(update, duration);

  const updated = await populateQuery(Mispunch.findByIdAndUpdate(req.params.id, update, { new: true }));
  return sendResponse(res, 200, "Mispunch request updated successfully", updated, {});
};

export const deleteMispunch = async (req, res) => {
  const mispunch = await Mispunch.findById(req.params.id);
  if (!mispunch) return sendResponse(res, 404, "Mispunch request not found", null, {});
  if (mispunch.status !== "pending") return sendResponse(res, 400, "Only pending mispunch request can be deleted", null, {});

  const loginEmployeeId = String(getEmployeeId(req.user) || "");
  if (String(mispunch.employeeId) !== loginEmployeeId && !["admin", "hr"].includes(getRoleName(req.user))) {
    return sendResponse(res, 403, "Access Denied", null, {});
  }

  await Mispunch.findByIdAndDelete(req.params.id);
  await clearMispunchNotifications(req.params.id);
  return sendResponse(res, 200, "Mispunch request deleted successfully", null, {});
};

export const approveMispunch = async (req, res) => {
  const { status, sanctionRemarks } = req.body;

  const mispunch = await Mispunch.findById(req.params.id);
  if (!mispunch) return sendResponse(res, 404, "Mispunch request not found", null, {});
  if (mispunch.status !== "pending") return sendResponse(res, 400, "Mispunch request already processed", null, {});

  if (isHrOwnRequest(req, mispunch.employeeId)) {
    return sendResponse(
      res,
      403,
      "HR cannot approve or reject their own mispunch request",
      null,
      {}
    );
  }

  if (status === "approved") {
    await applyMispunchToAttendance(mispunch);
  }

  mispunch.status = status;
  mispunch.sanctionedBy = req.user._id || req.user.id;
  mispunch.sanctionOn = new Date();
  mispunch.sanctionRemarks = sanctionRemarks || "";
  await mispunch.save();

  await clearMispunchNotifications(mispunch._id);
  const updated = await populateQuery(Mispunch.findById(mispunch._id));

  return sendResponse(
    res,
    200,
    status === "approved" ? "Mispunch request approved successfully" : "Mispunch request rejected successfully",
    updated,
    {}
  );
};
