export const isProbationLeaveType = (leaveType) => {
  const leaveCode = String(leaveType?.code || "").toUpperCase();
  const leaveName = String(leaveType?.name || "").toLowerCase();

  return leaveCode === "PROBATION" || leaveName.includes("probation");
};

export const isProratedAnnualLeaveType = (leaveType) => {
  const leaveCode = String(leaveType?.code || "").toUpperCase();

  return leaveCode === "PL";
};

export const getCurrentYearDateRange = (date = new Date()) => {
  const year = date.getFullYear();

  return {
    year,
    validFrom: new Date(year, 0, 1),
    validTo: new Date(year, 11, 31, 23, 59, 59),
  };
};

const toUtcDateOnly = (value) => {
  const date = value ? new Date(value) : new Date();

  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
};

export const getLeaveBalanceDateRange = (leaveType, employeeOrData = {}) => {
  if (isProbationLeaveType(leaveType)) {
    const validFrom = toUtcDateOnly(employeeOrData.joinDate);

    const probationPeriodMonths = Number(employeeOrData.probationPeriodMonths ?? 6);
    if (probationPeriodMonths <= 0) {
      return null;
    }

    const validTo = new Date(validFrom);
    validTo.setUTCMonth(validTo.getUTCMonth() + probationPeriodMonths);
    validTo.setUTCDate(validTo.getUTCDate() - 1);
    validTo.setUTCHours(23, 59, 59, 999);

    return {
      year: validFrom.getFullYear(),
      validFrom,
      validTo,
    };
  }

  return getCurrentYearDateRange();
};

export const getLeaveBalanceDays = (leaveType, employeeOrData = {}, dateRange = null) => {
  const totalDays = Number(leaveType?.totalDays || 0);

  if (isProbationLeaveType(leaveType)) {
    return Number(employeeOrData.probationPeriodMonths ?? totalDays);
  }

  if (!isProratedAnnualLeaveType(leaveType)) {
    return totalDays;
  }

  const probationPeriodMonths = Number(employeeOrData.probationPeriodMonths ?? 6);
  if (probationPeriodMonths > 0 || !employeeOrData.joinDate) {
    return totalDays;
  }

  const range = dateRange || getCurrentYearDateRange();
  const joinDate = toUtcDateOnly(employeeOrData.joinDate);
  const rangeStart = toUtcDateOnly(range.validFrom);
  const rangeEnd = toUtcDateOnly(range.validTo);

  if (joinDate <= rangeStart) {
    return totalDays;
  }

  if (joinDate > rangeEnd) {
    return 0;
  }

  const remainingMonths = 12 - joinDate.getUTCMonth();
  const proratedDays = (totalDays / 12) * remainingMonths;

  return Number(proratedDays.toFixed(2));
};

export const getAdjustedLeaveBalanceDays = (
  leaveType,
  employeeOrData = {},
  existingBalance = null,
  dateRange = null
) => {
  const originalTotalLeave = getLeaveBalanceDays(leaveType, employeeOrData, dateRange);

  if (!existingBalance) {
    return {
      totalLeave: originalTotalLeave,
      originalTotalLeave,
    };
  }

  const existingOriginalTotal = Number(existingBalance.originalTotalLeave || 0);
  const existingAvailable = Number(existingBalance.totalLeave || 0);
  const usedLeave = Math.max(existingOriginalTotal - existingAvailable, 0);
  const totalLeave = Math.max(Number((originalTotalLeave - usedLeave).toFixed(2)), 0);

  return {
    totalLeave,
    originalTotalLeave,
  };
};
