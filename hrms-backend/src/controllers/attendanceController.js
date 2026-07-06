import Attendance from '../models/Attendance.js';
import ExcelJS from 'exceljs';
import { sendResponse } from '../utils/apiResponse.js';

const getFormattedTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}:00`;
};

const normalizeTime = (value) => {
  if (!value) return "";
  const [hh = "00", mm = "00", ss = "00"] = String(value).split(":");
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss || "00").padStart(2, "0")}`;
};

const timeToSeconds = (time) => {
  if (!time) return null;
  const [h = 0, m = 0, s = 0] = String(time).split(":").map(Number);
  if ([h, m, s].some((value) => Number.isNaN(value))) return null;
  return h * 3600 + m * 60 + s;
};

const secondsToTime = (totalSeconds) => {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const h = Math.floor(safeSeconds / 3600);
  const m = Math.floor((safeSeconds % 3600) / 60);
  const s = safeSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const isMispunchPunch = (punch) =>
  String(punch?.action || "").toLowerCase() === "mispunch";

const isValidTimeRange = (start, end) => {
  const startSeconds = timeToSeconds(normalizeTime(start));
  const endSeconds = timeToSeconds(normalizeTime(end));
  return startSeconds !== null && endSeconds !== null && endSeconds > startSeconds;
};

const convertToEvents = (punches = []) => {
  if (!Array.isArray(punches) || punches.length === 0) return [];

  const lunchInTimes = new Set(
    punches
      .filter((punch) => punch?.type === "lunch" && punch?.out)
      .map((punch) => normalizeTime(punch.out))
  );

  const lunchOutTimes = new Set(
    punches
      .filter((punch) => punch?.type === "lunch" && punch?.in)
      .map((punch) => normalizeTime(punch.in))
  );

  const normalWorkInTimes = new Set(
    punches
      .filter((punch) => punch?.type === "work" && !isMispunchPunch(punch) && punch?.in)
      .map((punch) => normalizeTime(punch.in))
  );

  const events = [];

  const sortedPunches = cleanPunches(punches);

  sortedPunches.forEach((punch) => {
    const corrected = isMispunchPunch(punch);
    const punchIn = normalizeTime(punch?.in);
    const punchOut = normalizeTime(punch?.out);

    if (punch?.type === "work") {
      if (punchIn && punchOut && punchIn === punchOut) return;

      if (corrected) {
        const correctedInAlreadyRepresented = lunchInTimes.has(punchIn) || normalWorkInTimes.has(punchIn);

        if (punchIn && !correctedInAlreadyRepresented) {
          events.push({ time: punchIn, label: "In", corrected: true });
        }

        if (punchOut && isValidTimeRange(punchIn, punchOut)) {
          events.push({ time: punchOut, label: "Out", corrected: true });
        }

        return;
      }

      if (punchIn && !lunchInTimes.has(punchIn)) {
        events.push({ time: punchIn, label: "In", corrected: false });
      }

      if (punchOut && isValidTimeRange(punchIn, punchOut) && !lunchOutTimes.has(punchOut)) {
        events.push({ time: punchOut, label: "Out", corrected: false });
      }
    }

    if (punch?.type === "lunch") {
      if (punchIn) events.push({ time: punchIn, label: "Lunch-Out", corrected: false });
      if (punchOut) events.push({ time: punchOut, label: "Lunch-In", corrected: false });
    }
  });

  const order = { Out: 1, "Lunch-Out": 2, "Lunch-In": 3, In: 4 };

  return events
    .sort((a, b) => {
      const timeCompare = String(a.time).localeCompare(String(b.time));
      if (timeCompare !== 0) return timeCompare;
      return (order[a.label] || 9) - (order[b.label] || 9);
    })
    .filter(
      (event, index, list) =>
        list.findIndex(
          (item) =>
            item.time === event.time &&
            item.label === event.label &&
            item.corrected === event.corrected
        ) === index
    );
};

const formatPunchRecord = (events = [], item = {}) => {
  const timelineEvents = events.length
    ? events
    : [
        item.checkIn ? { time: item.checkIn, label: "In" } : null,
        item.checkOut ? { time: item.checkOut, label: "Out" } : null,
      ].filter(Boolean);

  return timelineEvents
    .map((event) => `${String(event.time || "").slice(0, 5)} (${event.label})`)
    .join(", ");
};

const getPunchIdentity = (punch) => {
  const mispunchId = punch?.mispunchId ? String(punch.mispunchId) : "";
  return [punch?.type || "", normalizeTime(punch?.in), normalizeTime(punch?.out), punch?.action || "", mispunchId].join("|");
};

const getPlainPunch = (punch = {}) => {
  if (punch?.toObject) {
    return punch.toObject();
  }

  if (punch?._doc) {
    return { ...punch._doc };
  }

  return { ...punch };
};

const cleanPunches = (punches = []) => {
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
    .map(({ _sortIndex, _id, ...punch }) => punch);
};

const getAttendancePunchStatus = (attendance = {}) => {
  const punches = cleanPunches(attendance?.punches || []);
  const lastPunch = punches[punches.length - 1];

  if (lastPunch?.type === "lunch" && lastPunch?.in && !lastPunch?.out) {
    return "ON_LUNCH";
  }

  if (lastPunch?.type === "work" && lastPunch?.in && !lastPunch?.out) {
    return "WORKING";
  }

  if (attendance?.checkIn && !attendance?.checkOut) {
    return "WORKING";
  }

  return "CHECKED_OUT";
};

const formatAttendanceResponse = (attendance) => {
  if (!attendance) return null;

  const plainAttendance = attendance?.toObject
    ? attendance.toObject()
    : attendance?._doc
    ? { ...attendance._doc }
    : { ...attendance };

  plainAttendance.punches = cleanPunches(plainAttendance.punches || []);
  plainAttendance.punchStatus = getAttendancePunchStatus(plainAttendance);

  return plainAttendance;
};

const calculateWorkingHours = (attendance, latestTime = null) => {
  const punches = cleanPunches(attendance?.punches || []);
  let totalSeconds = 0;

  punches.forEach((punch) => {
    if (punch?.type !== "work") return;

    const startSeconds = timeToSeconds(punch?.in);
    const endTime = punch?.out || latestTime;
    const endSeconds = timeToSeconds(endTime);

    if (
      startSeconds === null ||
      endSeconds === null ||
      endSeconds <= startSeconds
    ) {
      return;
    }

    totalSeconds += endSeconds - startSeconds;
  });

  attendance.punches = punches;
  attendance.totalHours = secondsToTime(totalSeconds);
};

const syncAttendanceSummary = (attendance, latestTime = null, forceLatestCheckOut = false) => {
  const punches = cleanPunches(attendance?.punches || []);
  attendance.punches = punches;

  const workPunches = punches.filter((punch) => punch?.type === "work" && punch?.in);
  const completedWorkPunches = workPunches.filter((punch) =>
    isValidTimeRange(punch?.in, punch?.out)
  );

  if (workPunches.length > 0) {
    attendance.checkIn = workPunches[0].in;
  }

  if (forceLatestCheckOut && latestTime) {
    attendance.checkOut = latestTime;
  } else if (completedWorkPunches.length > 0) {
    attendance.checkOut = completedWorkPunches[completedWorkPunches.length - 1].out;
  } else if (attendance.checkIn) {
    attendance.checkOut = null;
  }

  calculateWorkingHours(attendance, latestTime);
};

const getLastOpenWorkPunch = (punches = []) => {
  for (let index = punches.length - 1; index >= 0; index -= 1) {
    const punch = punches[index];
    if (punch?.type === "work" && punch?.in && !punch?.out) return punch;
  }
  return null;
};

const getLastOpenLunchPunch = (punches = []) => {
  for (let index = punches.length - 1; index >= 0; index -= 1) {
    const punch = punches[index];
    if (punch?.type === "lunch" && punch?.in && !punch?.out) return punch;
  }
  return null;
};

const parseDateTime = (dateStr, timeStr) => {
  const [day, month, year] = dateStr.split("/");
  const [hours = 0, minutes = 0, seconds = 0] = normalizeTime(timeStr).split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
};

export const checkIn = async (req, res) => {
  try {
    const { employeeId, date, time } = req.body;
    const punchTime = normalizeTime(time || getFormattedTime());

    let attendance = await Attendance.findOne({ employeeId, date });

    if (!attendance) {
      attendance = new Attendance({
        employeeId,
        date,
        checkIn: punchTime,
        checkOut: null,
        totalHours: "00:00:00",
        punches: [{ type: "work", in: punchTime }],
      });
    } else {
      attendance.punches = cleanPunches(attendance.punches || []);

      const openLunch = getLastOpenLunchPunch(attendance.punches);
      if (openLunch) {
        return sendResponse(res, 400, "Please lunch-in before check-in", null, {});
      }

      const openWork = getLastOpenWorkPunch(attendance.punches);
      if (!openWork) {
        attendance.punches.push({ type: "work", in: punchTime });
      }

      attendance.checkOut = null;
    }

    syncAttendanceSummary(attendance, punchTime, false);

    await attendance.save();
    sendResponse(res, 200, "Success", formatAttendanceResponse(attendance), {});
  } catch (error) {
    console.error("[attendanceController.js] checkIn error:", error);
    sendResponse(res, 500, error?.message || "Internal server error", null, {});
  }
};

export const checkOut = async (req, res) => {
  try {
    const { employeeId, date, time } = req.body;
    const punchTime = normalizeTime(time || getFormattedTime());

    const attendance = await Attendance.findOne({ employeeId, date });

    if (!attendance) {
      return sendResponse(res, 400, "Check-in first", null, {});
    }

    attendance.punches = cleanPunches(attendance.punches || []);

    const openLunch = getLastOpenLunchPunch(attendance.punches);
    if (openLunch) {
      openLunch.out = punchTime;
    }

    const openWork = getLastOpenWorkPunch(attendance.punches);
    if (openWork) {
      openWork.out = punchTime;
    }

    attendance.checkOut = punchTime;
    syncAttendanceSummary(attendance, punchTime, true);
    attendance.checkOut = punchTime;

    await attendance.save();
    sendResponse(res, 200, "Success", formatAttendanceResponse(attendance), {});
  } catch (error) {
    console.error("[attendanceController.js] checkOut error:", error);
    sendResponse(res, 500, error?.message || "Internal server error", null, {});
  }
};

export const lunchOut = async (req, res) => {
  try {
    const { employeeId, date, time } = req.body;
    const punchTime = normalizeTime(time || getFormattedTime());

    const attendance = await Attendance.findOne({ employeeId, date });

    if (!attendance) {
      return sendResponse(res, 400, "Check-in first", null, {});
    }

    attendance.punches = cleanPunches(attendance.punches || []);

    const openLunch = getLastOpenLunchPunch(attendance.punches);
    if (openLunch) {
      return sendResponse(res, 400, "Lunch already started", null, {});
    }

    const openWork = getLastOpenWorkPunch(attendance.punches);
    if (!openWork) {
      return sendResponse(res, 400, "No active work session", null, {});
    }

    openWork.out = punchTime;
    attendance.punches.push({ type: "lunch", in: punchTime });

    syncAttendanceSummary(attendance, punchTime, true);

    await attendance.save();
    sendResponse(res, 200, "Success", formatAttendanceResponse(attendance), {});
  } catch (error) {
    console.error("[attendanceController.js] lunchOut error:", error);
    sendResponse(res, 500, error?.message || "Internal server error", null, {});
  }
};

export const lunchIn = async (req, res) => {
  try {
    const { employeeId, date, time } = req.body;
    const punchTime = normalizeTime(time || getFormattedTime());

    const attendance = await Attendance.findOne({ employeeId, date });

    if (!attendance) {
      return sendResponse(res, 400, "Check-in first", null, {});
    }

    attendance.punches = cleanPunches(attendance.punches || []);

    const openLunch = getLastOpenLunchPunch(attendance.punches);
    if (!openLunch) {
      return sendResponse(res, 400, "Lunch not started", null, {});
    }

    openLunch.out = punchTime;
    attendance.punches.push({ type: "work", in: punchTime });

    syncAttendanceSummary(attendance, punchTime, true);

    await attendance.save();
    sendResponse(res, 200, "Success", formatAttendanceResponse(attendance), {});
  } catch (error) {
    console.error("[attendanceController.js] lunchIn error:", error);
    sendResponse(res, 500, error?.message || "Internal server error", null, {});
  }
};

export const getAttendanceList = async (req, res) => {
  try {
    const { employeeId } = req.query;

    let filter = {};
    if (employeeId) filter.employeeId = employeeId;

    const data = await Attendance.find(filter);

    const result = data.map((item) => formatAttendanceResponse(item));

    sendResponse(res, 200, 'Success', result, {});
  } catch (error) {
    console.error('[attendanceController.js] getAttendanceList error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const data = await Attendance.find({ employeeId }).sort({ date: -1 });

    const result = data.map((item) => formatAttendanceResponse(item));

    sendResponse(res, 200, 'Success', result, {});
  } catch (error) {
    console.error('[attendanceController.js] getEmployeeAttendance error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const getAttendanceReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { from, to } = req.query;

    const formatDate = (dateStr) => {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    };

    const fromDate = formatDate(from);
    const toDate = formatDate(to);

    const data = await Attendance.find({
      employeeId,
      date: {
        $gte: fromDate,
        $lte: toDate
      }
    });

    const result = data.map((item) => formatAttendanceResponse(item));

    sendResponse(res, 200, 'Success', result, {});
  } catch (error) {
    console.error('[attendanceController.js] getAttendanceReport error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const getExprtReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { from, to } = req.query;


    const formatDate = (dateStr) => {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    };

    const fromDate = formatDate(from);
    const toDate = formatDate(to);

    const data = await Attendance.find({
      employeeId,
      date: { $gte: fromDate, $lte: toDate }
    }).sort({ date: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Working Hours");


    worksheet.columns = [
      { header: "LOG DATE", key: "date", width: 15 },
      { header: "PUNCH IN", key: "checkIn", width: 15 },
      { header: "PUNCH OUT", key: "checkOut", width: 15 },
      { header: "Activity Timeline Records", key: "punches", width: 50 },
      { header: "Total Shift Duration", key: "totalHours", width: 20 }
    ];


    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: false };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" }
      };
    });


    data.forEach((item) => {
      const events = convertToEvents(item.punches);
      const punchRecord = formatPunchRecord(events, item);

      const row = worksheet.addRow({
        date: item.date,
        checkIn: item.checkIn
          ? `${item.checkIn}`
          : "--",
        checkOut: item.checkOut
          ? `${item.checkOut}`
          : "--",
        punches: punchRecord,
        totalHours: item.totalHours || "00:00:00"
      });


      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.font = { size: 10 }
      });
    });


    worksheet.autoFilter = "A1:E1";


    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=WorkingHoursReport.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('[attendanceController.js] API error:', err);
    sendResponse(res, 500, "Server Error", null, {});
  }
};
