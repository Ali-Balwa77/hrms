import Employee from "../models/Employee.js";
import LeaveType from "../models/LeaveType.js";
import { getCurrentYearDateRange, getLeaveBalanceDays, isProbationLeaveType } from "./leaveBalancePolicy.js";

const shouldRefillLeaveForEmployee = (leaveCode, employee) => {
  if (leaveCode === "LWP") return true;

  if (leaveCode === "PL") {
    return employee.employeeType !== "Intern";
  }

  return employee.employeeType !== "Intern";
};

export const refillAnnualLeaveBalances = async (date = new Date()) => {
  const yearRange = getCurrentYearDateRange(date);
  const annualLeaveTypes = await LeaveType.find({
    $or: [{ allocationCycle: "annual" }, { allocationCycle: { $exists: false } }],
    status: true,
  });

  if (!annualLeaveTypes.length) {
    return { employeesChecked: 0, refilledBalances: 0, addedBalances: 0 };
  }

  const employees = await Employee.find({ status: "active" }).populate(
    "organization",
    "quarterlyLeaveAllocationEnabled"
  );

  let refilledBalances = 0;
  let addedBalances = 0;

  for (const employee of employees) {
    let changed = false;

    for (const leaveType of annualLeaveTypes) {
      const leaveCode = String(leaveType.code || "").toUpperCase();

      if (isProbationLeaveType(leaveType)) continue;
      if (!shouldRefillLeaveForEmployee(leaveCode, employee)) continue;

      const balance = employee.leaveBalance.find(
        (item) =>
          String(item.leaveType || "").toUpperCase() === leaveCode &&
          item.allocationMode !== "quarterly"
      );

      if (!balance) {
        const leaveDays = getLeaveBalanceDays(leaveType, employee, yearRange);

        employee.leaveBalance.push({
          leaveType: leaveCode,
          totalLeave: leaveDays,
          originalTotalLeave: leaveDays,
          allocationMode: "normal",
          quarter: null,
          year: yearRange.year,
          validFrom: yearRange.validFrom,
          validTo: yearRange.validTo,
        });
        addedBalances++;
        changed = true;
        continue;
      }

      if (Number(balance.year) === Number(yearRange.year)) continue;

      balance.totalLeave = Number(leaveType.totalDays || 0);
      balance.originalTotalLeave = Number(leaveType.totalDays || 0);
      balance.allocationMode = "normal";
      balance.quarter = null;
      balance.year = yearRange.year;
      balance.validFrom = yearRange.validFrom;
      balance.validTo = yearRange.validTo;

      refilledBalances++;
      changed = true;
    }

    if (changed) {
      employee.markModified("leaveBalance");
      await employee.save();
    }
  }

  return {
    employeesChecked: employees.length,
    refilledBalances,
    addedBalances,
  };
};
