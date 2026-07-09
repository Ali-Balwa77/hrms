import QuarterlyLeavePolicy from "../models/QuarterlyLeavePolicy.js";
import QuarterlyLeaveAllocationLog from "../models/QuarterlyLeaveAllocationLog.js";
import Employee from "../models/Employee.js";
import LeaveType from "../models/LeaveType.js";
import Organization from "../models/Organization.js";
import { sendResponse } from '../utils/apiResponse.js';

const getCurrentQuarter = (date = new Date()) => {
  const month = date.getMonth() + 1;

  if (month >= 1 && month <= 3) return "Q1";
  if (month >= 4 && month <= 6) return "Q2";
  if (month >= 7 && month <= 9) return "Q3";

  return "Q4";
};

const getQuarterDateRange = (quarter, year) => {
  const ranges = {
    Q1: {
      validFrom: new Date(year, 0, 1),
      validTo: new Date(year, 2, 31, 23, 59, 59),
    },
    Q2: {
      validFrom: new Date(year, 3, 1),
      validTo: new Date(year, 5, 30, 23, 59, 59),
    },
    Q3: {
      validFrom: new Date(year, 6, 1),
      validTo: new Date(year, 8, 30, 23, 59, 59),
    },
    Q4: {
      validFrom: new Date(year, 9, 1),
      validTo: new Date(year, 11, 31, 23, 59, 59),
    },
  };

  return ranges[quarter];
};

export const createQuarterlyLeavePolicy = async (req, res) => {
  try {
    const {
      organization,
      leaveType,
      year,
      quarter,
      leaveDays,
      allocationType,
      carryForward,
      status,
    } = req.body;

    const [leaveTypeData, organizationData] = await Promise.all([
      LeaveType.findById(leaveType),
      Organization.findById(organization),
    ]);

    if (!leaveTypeData) {
      return sendResponse(res, 404, "Leave type not found", null, {});
    }

    if (!organizationData) {
      return sendResponse(res, 404, "Organization not found", null, {});
    }

    if (leaveTypeData.status === false) {
      return sendResponse(res, 400, "Inactive leave type cannot be used for quarterly allocation", null, {});
    }

    if (leaveTypeData.allocationCycle !== "quarterly") {
      return sendResponse(res, 400, "Only quarterly leave types can be used for quarterly allocation", null, {});
    }

    const exists = await QuarterlyLeavePolicy.findOne({
      organization,
      leaveType,
      year,
      quarter,
    });

    if (exists) {
      return sendResponse(res, 400, "Policy already exists for this leave type, year and quarter", null, {});
    }

    const policy = await QuarterlyLeavePolicy.create({
      organization,
      leaveType,
      year,
      quarter,
      leaveDays,
      allocationType,
      carryForward,
      status,
    });

    sendResponse(res, 201, "Quarterly leave policy created successfully", policy, {});
  } catch (error) {
    console.error('[quarterlyLeavePolicyController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};

export const getQuarterlyLeavePolicies = async (req, res) => {
  try {
    const policies = await QuarterlyLeavePolicy.find()
      .populate("organization", "name code")
      .populate("leaveType", "name code")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Success', policies, {});
  } catch (error) {
    console.error('[quarterlyLeavePolicyController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};

export const getQuarterlyLeavePolicyById = async (req, res) => {
  try {
    const policy = await QuarterlyLeavePolicy.findById(req.params.id);

    if (!policy) {
      return sendResponse(res, 404, "Policy not found", null, {});
    }

    sendResponse(res, 200, 'Success', policy, {});
  } catch (error) {
    console.error('[quarterlyLeavePolicyController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};

export const updateQuarterlyLeavePolicy = async (req, res) => {
  try {
    
    const policyId = req.params.id;

    const alreadyApplied = await QuarterlyLeaveAllocationLog.exists({
      policyId,
    });

    if (alreadyApplied) {
      return sendResponse(res, 400, "Allocation already applied. This policy cannot be updated.", null, {});
    }

    const {
      organization,
      leaveType,
      year,
      quarter,
      leaveDays,
      allocationType,
      carryForward,
      status,
    } = req.body;

    if (Number(leaveDays) <= 0) {
      return sendResponse(res, 400, "Leave days must be greater than 0", null, {});
    }

    const [leaveTypeData, organizationData] = await Promise.all([
      LeaveType.findById(leaveType),
      Organization.findById(organization),
    ]);

    if (!leaveTypeData) {
      return sendResponse(res, 404, "Leave type not found", null, {});
    }

    if (!organizationData) {
      return sendResponse(res, 404, "Organization not found", null, {});
    }

    if (leaveTypeData.status === false) {
      return sendResponse(res, 400, "Inactive leave type cannot be used for quarterly allocation", null, {});
    }

    if (leaveTypeData.allocationCycle !== "quarterly") {
      return sendResponse(res, 400, "Only quarterly leave types can be used for quarterly allocation", null, {});
    }

    const duplicate = await QuarterlyLeavePolicy.findOne({
      _id: { $ne: policyId },
      organization,
      leaveType,
      year,
      quarter,
    });

    if (duplicate) {
      return sendResponse(res, 400, "Policy already exists for this leave type, year and quarter", null, {});
    }

    const policy = await QuarterlyLeavePolicy.findByIdAndUpdate(
      policyId,
      {
        organization,
        leaveType,
        year,
        quarter,
        leaveDays,
        allocationType,
        carryForward,
        status,
      },
      { new: true }
    );

    sendResponse(res, 200, "Quarterly leave policy updated successfully", policy, {});
  } catch (error) {
    console.error('[quarterlyLeavePolicyController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};

export const deleteQuarterlyLeavePolicy = async (req, res) => {
  try {
    const policyId = req.params.id;

    const policy = await QuarterlyLeavePolicy.findById(policyId).populate(
      "leaveType",
      "code"
    );

    if (!policy) {
      return sendResponse(res, 404, "Quarterly leave policy not found", null, {});
    }

    const leaveTypeData = policy.leaveType?.code
      ? policy.leaveType
      : await LeaveType.findById(policy.leaveType).select("code").lean();
    const leaveCode = leaveTypeData?.code;

    if (!leaveCode) {
      return sendResponse(res, 400, "Leave type code not found for this policy", null, {});
    }

    const employees = await Employee.find({
      organization: policy.organization,
      "leaveBalance.leaveType": leaveCode,
    });

    let removedEmployeeBalances = 0;

    for (const employee of employees) {
      const originalLength = employee.leaveBalance.length;

      employee.leaveBalance = employee.leaveBalance.filter((balance) => {
        const isSameLeaveType =
          String(balance.leaveType || "").trim().toUpperCase() ===
          String(leaveCode || "").trim().toUpperCase();
        const isSameQuarter =
          String(balance.quarter || "").trim().toUpperCase() ===
          String(policy.quarter || "").trim().toUpperCase();
        const isSameYear = Number(balance.year) === Number(policy.year);

        return !(isSameLeaveType && isSameQuarter && isSameYear);
      });

      const removedCount = originalLength - employee.leaveBalance.length;

      if (removedCount > 0) {
        removedEmployeeBalances += removedCount;
        employee.markModified("leaveBalance");
        await employee.save();
      }
    }

    // ✅ First delete related allocation logs
    await QuarterlyLeaveAllocationLog.deleteMany({
      policyId: policy._id,
    });

    // ✅ Then delete policy
    await QuarterlyLeavePolicy.findByIdAndDelete(policy._id);

    sendResponse(
      res,
      200,
      "Quarterly leave policy deleted successfully",
      { removedEmployeeBalances },
      {}
    );
  } catch (error) {
    console.error('[quarterlyLeavePolicyController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};

export const applyQuarterlyLeaveAllocation = async (req, res) => {
  try {
    const policy = await QuarterlyLeavePolicy.findById(req.params.id).populate(
      "leaveType",
      "name code status allocationCycle"
    ).populate("organization", "name code quarterlyLeaveAllocationEnabled");

    if (!policy) {
      return sendResponse(res, 404, "Policy not found", null, {});
    }

    if (!policy.status) {
      return sendResponse(res, 400, "Inactive policy cannot be applied", null, {});
    }

    if (!policy.organization?._id) {
      return sendResponse(res, 400, "Please assign an organization before applying this policy", null, {});
    }

    if (policy.organization?.quarterlyLeaveAllocationEnabled !== true) {
      return sendResponse(res, 400, "Quarterly leave allocation is disabled for this organization", null, {});
    }

    if (policy.leaveType?.status === false) {
      return sendResponse(res, 400, "Inactive leave type cannot be allocated", null, {});
    }

    if (policy.leaveType?.allocationCycle !== "quarterly") {
      return sendResponse(res, 400, "Only quarterly leave types can be allocated from quarterly policy", null, {});
    }

    const leaveKey = policy.leaveType?.code;

    if (!leaveKey) {
      return sendResponse(res, 400, "Leave type code not found", null, {});
    }

    const leaveCode = String(policy.leaveType?.code || "").toUpperCase();

    const isProbationLeave = leaveCode === "PROBATION"

    const isPLLeave = leaveCode === "PL";

    const currentQuarter = getCurrentQuarter();
    const currentYear = new Date().getFullYear();

    if (
      policy.quarter !== currentQuarter ||
      Number(policy.year) !== Number(currentYear)
    ) {
      return sendResponse(
        res,
        400,
        `Only current quarter allocation is allowed. Current quarter is ${currentQuarter} ${currentYear}`,
        null,
        {}
      );
    }

    const { validFrom, validTo } = getQuarterDateRange(
      policy.quarter,
      policy.year
    );

    const employeeFilter = {
      status: "active",
      organization: policy.organization?._id || policy.organization,
    };

    // Probation leave all non-admin employees ne allocate thavi joiye
    if (isProbationLeave) {
      employeeFilter.employeeType = { $ne: "Admin" };
    }

    // PL leave Intern ne allocate na thavi joiye
    if (isPLLeave) {
      employeeFilter.employeeType = { $ne: "Intern" };
    }

    const employees = await Employee.find(employeeFilter);

    let applied = 0;
    let skipped = 0;

    for (const employee of employees) {
      // extra safety: Probation admin ma never allocate na thay
      if (isProbationLeave && employee.employeeType === "Admin") {
        skipped++;
        continue;
      }

      // extra safety: PL intern ma never allocate na thay
      if (isPLLeave && employee.employeeType === "Intern") {
        skipped++;
        continue;
      }

      const alreadyApplied = await QuarterlyLeaveAllocationLog.exists({
        policyId: policy._id,
        employeeId: employee._id,
      });

      if (alreadyApplied) {
        skipped++;
        continue;
      }

      const allocatedDays = Number(policy.leaveDays);

      const leaveIndex = employee.leaveBalance.findIndex(
        (x) => x.leaveType === leaveKey
      );

      if (leaveIndex !== -1) {
        const currentTotal = Number(
          employee.leaveBalance[leaveIndex].totalLeave || 0
        );

        employee.leaveBalance[leaveIndex].totalLeave = policy.carryForward
          ? currentTotal + allocatedDays
          : allocatedDays;

        employee.leaveBalance[leaveIndex].originalTotalLeave = allocatedDays;
        employee.leaveBalance[leaveIndex].allocationMode = "quarterly";
        employee.leaveBalance[leaveIndex].quarter = policy.quarter;
        employee.leaveBalance[leaveIndex].year = policy.year;
        employee.leaveBalance[leaveIndex].validFrom = validFrom;
        employee.leaveBalance[leaveIndex].validTo = validTo;
      } else {
        employee.leaveBalance.push({
          leaveType: leaveKey,
          totalLeave: allocatedDays,
          originalTotalLeave: allocatedDays,
          allocationMode: "quarterly",
          quarter: policy.quarter,
          year: policy.year,
          validFrom,
          validTo,
        });
      }

      employee.markModified("leaveBalance");
      await employee.save();

      await QuarterlyLeaveAllocationLog.create({
        policyId: policy._id,
        employeeId: employee._id,
        leaveType: policy.leaveType._id,
        year: policy.year,
        quarter: policy.quarter,
        allocatedDays,
        carryForward: policy.carryForward,
        validFrom,
        validTo,
      });

      applied++;
    }

    return sendResponse(
      res,
      200,
      "Quarterly leave allocation applied successfully",
      { applied, skipped },
      {}
    );
  } catch (error) {
    console.error("[quarterlyLeavePolicyController.js] API error:", error);
    return sendResponse(res, 500, error.message, null, {});
  }
};

export const getQuarterlyLeaveAllocationLogs = async (req, res) => {
  try {
    const logs = await QuarterlyLeaveAllocationLog.find({
      policyId: req.params.id,
    })
      .populate("employeeId", "firstName lastName employeeNo")
      .populate("leaveType", "name code")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Success', logs, {});
  } catch (error) {
    console.error('[quarterlyLeavePolicyController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};
