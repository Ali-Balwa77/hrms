import Organization from '../models/Organization.js';
import Employee from '../models/Employee.js';
import LeaveType from '../models/LeaveType.js';
import { sendResponse } from '../utils/apiResponse.js';

const isQuarterlyManagedLeaveType = (leaveType) =>
  String(leaveType?.code || "").toUpperCase() === "PL";

const getCurrentYearDateRange = () => {
  const year = new Date().getFullYear();

  return {
    year,
    validFrom: new Date(year, 0, 1),
    validTo: new Date(year, 11, 31),
  };
};

const isLeaveApplicableForEmployee = (leaveType, employee) => {
  const leaveCode = String(leaveType.code || "").toUpperCase();
  const leaveName = String(leaveType.name || "").toLowerCase();
  const isProbationLeave =
    leaveCode === "PROBATION" || leaveName.includes("probation");

  if (isProbationLeave) return employee.employeeType === "Intern";
  if (leaveCode === "LWP") return true;

  return employee.employeeType !== "Intern";
};

const syncNonQuarterlyOrganizationLeaveBalances = async (organizationId) => {
  const [leaveTypes, employees] = await Promise.all([
    LeaveType.find({ status: true }),
    Employee.find({ organization: organizationId, status: "active" }),
  ]);

  const yearRange = getCurrentYearDateRange();

  for (const employee of employees) {
    let changed = false;

    for (const leaveType of leaveTypes) {
      if (!isQuarterlyManagedLeaveType(leaveType)) continue;
      if (!isLeaveApplicableForEmployee(leaveType, employee)) continue;

      const existingBalance = employee.leaveBalance.find(
        (balance) => balance.leaveType === leaveType.code
      );

      if (existingBalance) {
        existingBalance.allocationMode = "normal";
        existingBalance.quarter = null;
        existingBalance.year = yearRange.year;
        existingBalance.validFrom = yearRange.validFrom;
        existingBalance.validTo = yearRange.validTo;
        existingBalance.totalLeave = Number(leaveType.totalDays || 0);
        existingBalance.originalTotalLeave = Number(leaveType.totalDays || 0);
        changed = true;

        continue;
      }

      employee.leaveBalance.push({
        leaveType: leaveType.code,
        totalLeave: Number(leaveType.totalDays || 0),
        originalTotalLeave: Number(leaveType.totalDays || 0),
        allocationMode: "normal",
        quarter: null,
        year: yearRange.year,
        validFrom: yearRange.validFrom,
        validTo: yearRange.validTo,
      });
      changed = true;
    }

    if (changed) {
      employee.markModified("leaveBalance");
      await employee.save();
    }
  }
};

const removeQuarterlyManagedAnnualBalances = async (organizationId) => {
  const employees = await Employee.find({ organization: organizationId, status: "active" });

  for (const employee of employees) {
    const originalLength = employee.leaveBalance.length;

    employee.leaveBalance = employee.leaveBalance.filter((balance) => {
      const leaveCode = String(balance.leaveType || "").toUpperCase();
      const isQuarterlyManaged = leaveCode === "PL";
      const isPolicyBalance = balance.allocationMode === "quarterly" || balance.quarter;

      return !isQuarterlyManaged || isPolicyBalance;
    });

    if (employee.leaveBalance.length !== originalLength) {
      employee.markModified("leaveBalance");
      await employee.save();
    }
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find();
    sendResponse(res, 200, 'Success', orgs, {});
  } catch (error) {
    console.error('[organizationController.js] getOrganizations error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return sendResponse(res, 404, 'Organization not found', null, {});
    }
    sendResponse(res, 200, 'Success', org, {});
  } catch (error) {
    console.error('[organizationController.js] getOrganizationById error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const createOrganization = async (req, res) => {
  try {
    const existingOrg = await Organization.findOne({
      $or: [{ email: req.body.email }, { code: req.body.code }]
    });

    if (existingOrg) {
    
      if (existingOrg.email === req.body.email) {
        return sendResponse(res, 400, "Organization email already exists", null, {});
      }

    
      if (existingOrg.code === req.body.code) {
        return sendResponse(res, 400, "Organization code already exists", null, {});
      }
    }

    const org = await Organization.create(req.body);

    if (org.quarterlyLeaveAllocationEnabled === true) {
      await removeQuarterlyManagedAnnualBalances(org._id);
    } else {
      await syncNonQuarterlyOrganizationLeaveBalances(org._id);
    }

    return sendResponse(res, 201, 'Created successfully', org, {});
  } catch (error) {
    console.error('[organizationController.js] createOrganization error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const updateOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!org) {
      return sendResponse(res, 404, 'Organization not found', null, {});
    }

    if (org.quarterlyLeaveAllocationEnabled === true) {
      await removeQuarterlyManagedAnnualBalances(org._id);
    } else {
      await syncNonQuarterlyOrganizationLeaveBalances(org._id);
    }

    sendResponse(res, 200, 'Success', org, {});
  } catch (error) {
    console.error('[organizationController.js] updateOrganization error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const deleteOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) {
      return sendResponse(res, 404, 'Organization not found', null, {});
    }
    sendResponse(res, 200, 'Organization deleted', null, {});
  } catch (error) {
    console.error('[organizationController.js] deleteOrganization error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};
