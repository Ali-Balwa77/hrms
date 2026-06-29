import Employee from '../models/Employee.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/mailgun.js';
import LeaveType from '../models/LeaveType.js';
import { sendResponse } from '../utils/apiResponse.js';


const EMPLOYEE_LIST_SELECT =
  "_id employeeNo firstName lastName email officeEmail phone department designation employeeType status joinDate dob organization leaveForwardTo reportingTo punchId leaveBalance createdAt updatedAt";

const EMPLOYEE_MIN_SELECT =
  "_id employeeNo firstName lastName email officeEmail employeeType status department designation";

const EMPLOYEE_TL_SELECT =
  "_id employeeNo firstName lastName email officeEmail employeeType status department designation";

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
  }).select("employeeId").lean();

  return new Set(activeUsers.map((user) => String(user.employeeId)));
};

const getActiveFallbackApprovers = async (applicantEmployeeId) => {
  const activeUsers = await User.find({ isActive: true })
    .select("employeeId role isActive")
    .populate("role", "name")
    .populate("employeeId", "_id firstName lastName employeeNo officeEmail status employeeType");

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

  return fallbackUsers
    .sort((a, b) => {
      const aRole = String(a.role?.name || a.employeeId?.employeeType || "").toLowerCase().trim();
      const bRole = String(b.role?.name || b.employeeId?.employeeType || "").toLowerCase().trim();

      if (aRole === "hr" && bRole !== "hr") return -1;
      if (aRole !== "hr" && bRole === "hr") return 1;
      return 0;
    })
    .map((user) => user.employeeId);
};

export const createEmployee = async (req, res) => {
  try {
    const existingEmail = await Employee.findOne({
      $or: [{ email: req.body.email }, { officeEmail: req.body.officeEmail }]
    });

    if (existingEmail?.email === req.body.email) {
      return sendResponse(res, 400, "Personal Email already exists", null, {});
    }

    if (existingEmail?.officeEmail === req.body.officeEmail) {
      return sendResponse(res, 400, "Office Email already exists", null, {});
    }

    const inputDOBDate = new Date(req.body.dob);
    const inpotJODDAte = new Date(req.body.joinDate);
    const today = new Date();

    
    today.setHours(0, 0, 0, 0);

    if (inputDOBDate > today) {
      return sendResponse(res, 400, "Date of Birth cannot be in the future!", null, {});
    }

    if (inpotJODDAte > today) {
      return sendResponse(res, 400, "Joining Date cannot be in the future!", null, {});
    }

    if (req.body.employeeType === "Admin") {
      return sendResponse(res, 400, "Admin cannot be selected as employee type. Assign Admin access from User Access Master.", null, {});
    }

    const leaveTypes = await LeaveType.find({
      status: true
    });

    const roleName = req.body.employeeType;

    const leaveBalance = leaveTypes
      .filter((leave) => {
        const leaveCode = String(leave.code || "").toLowerCase().trim();
        const leaveName = String(leave.name || "").toLowerCase().trim();
        const isProbationLeave = leaveCode.includes("probation") || leaveName.includes("probation");

        if (isProbationLeave) {
          return roleName === "Intern";
        }

        // Quarterly leave should be allocated only from Quarterly Leave Policy module.
        if (leave.allocationMode === "quarterly") {
          return false;
        }

        return true;
      })
      .map((leave) => ({
        leaveType: leave.code,
        totalLeave: Number(leave.totalDays || 0),
        originalTotalLeave: Number(leave.totalDays || 0),
        allocationMode: leave.allocationMode || "normal",
        quarter: null,
        year: null,
        validFrom: null,
        validTo: null,
      }));

    const newEmployee = new Employee({
      ...req.body,
      status: "active",
      leaveBalance
    });

    const employee = await newEmployee.save();
    await createEmployeeUser(employee);
    sendResponse(res, 201, 'Created successfully', employee, {});
  } catch (error) {
    console.error('[employeeController.js] API error:', error);
    sendResponse(res, 500, 'Failed to create employee', null, {});
  }
};

export const getEmployees = async (req, res) => {
  try {
    const user = req.user;

    let query = {
      employeeType: { $ne: "Admin" },
      status: "active",
    };

    const roleFeatures = Array.isArray(user?.role?.features)
      ? user.role.features
      : [];

    const isTeamScoped = roleFeatures.includes("team_employee_list");

    if (isTeamScoped) {
      query = {
        employeeType: { $ne: "Admin" },
        status: "active",
        $or: [{ leaveForwardTo: user.employeeId }, { _id: user.employeeId }],
      };
    }

    const employees = await Employee.find(query)
      .select(EMPLOYEE_LIST_SELECT)
      .populate("organization", "_id name")
      .populate("leaveForwardTo", EMPLOYEE_MIN_SELECT)
      .populate("reportingTo", EMPLOYEE_MIN_SELECT)
      .sort({ createdAt: -1 })
      .lean();

    return sendResponse(res, 200, 'Success', employees, {});
  } catch (error) {
    console.error('[employeeController.js] getEmployees error:', error);
    return sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("organization")
      .populate({
        path: "leaveForwardTo",
        match: { status: "active" },
        select: "_id firstName lastName employeeNo officeEmail email status employeeType",
      })
      .lean();

    if (!employee) {
      return sendResponse(res, 404, 'Employee not found', null, {});
    }

    const employeeUser = await User.findOne({ employeeId: employee._id })
      .select('role')
      .populate('role')
      .lean();

    const employeeObj = {
      ...employee,
      role: employeeUser?.role || null,
    };

    const forwardToIds = (employeeObj.leaveForwardTo || []).map((approver) => approver._id);
    const activeUserEmployeeIds = await getActiveUserEmployeeIds(forwardToIds);

    employeeObj.leaveForwardTo = (employeeObj.leaveForwardTo || []).filter((approver) =>
      activeUserEmployeeIds.has(String(approver._id))
    );

    if (!employeeObj.leaveForwardTo.length) {
      employeeObj.leaveForwardTo = await getActiveFallbackApprovers(employeeObj._id);
    }

    return sendResponse(res, 200, 'Success', employeeObj, {});
  } catch (error) {
    console.error('[employeeController.js] getEmployeeById error:', error);
    return sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

const syncLeaveBalanceByEmployeeType = async (employee, employeeType) => {
  const lwpLeave = await LeaveType.findOne({
    code: "LWP",
  });

  const probationLeave = await LeaveType.findOne({
    code: "PROBATION",
  });

  const plLeave = await LeaveType.findOne({
    code: "PL",
  });

  
  const makeLeaveBalanceObj = (leaveType) => {
    return {
      leaveType: leaveType.code,
      totalLeave: Number(leaveType.totalDays || 0),
      originalTotalLeave: Number(leaveType.totalDays || 0),
      isActive: leaveType.status === true,
      allocationMode: leaveType.allocationMode || "normal",
      quarter: null,
      year: null,
      validFrom: null,
      validTo: null,
    };
  };

  
  
  if (employeeType === "Intern") {
    const newLeaveBalance = [];

    const existingLWP = employee.leaveBalance.find(
      (leave) => leave.leaveType === "LWP"
    );

    if (existingLWP) {
      newLeaveBalance.push(existingLWP);
    } else if (lwpLeave) {
      newLeaveBalance.push(makeLeaveBalanceObj(lwpLeave));
    }

    const existingProbation = employee.leaveBalance.find(
      (leave) => leave.leaveType === "PROBATION"
    );

    if (existingProbation) {
      newLeaveBalance.push(existingProbation);
    } else if (probationLeave) {
      newLeaveBalance.push(makeLeaveBalanceObj(probationLeave));
    }

    employee.leaveBalance = newLeaveBalance;
  }

  
  
  if (employeeType !== "Intern") {
    
    employee.leaveBalance = employee.leaveBalance.filter(
      (leave) => leave.leaveType !== "PROBATION"
    );

    
    const existingPL = employee.leaveBalance.find(
      (leave) => leave.leaveType === "PL"
    );

    if (!existingPL && plLeave && plLeave.allocationMode !== "quarterly") {
      employee.leaveBalance.push(makeLeaveBalanceObj(plLeave));
    }

    
    const existingLWP = employee.leaveBalance.find(
      (leave) => leave.leaveType === "LWP"
    );

    if (!existingLWP && lwpLeave) {
      employee.leaveBalance.push(makeLeaveBalanceObj(lwpLeave));
    }
  }

  return employee;
};

export const updateEmployee = async (req, res) => {
  try {
    const updateData = { ...req.body };

    const existingEmployee = await Employee.findById(req.params.id);

    if (!existingEmployee) {
      return sendResponse(res, 404, "Employee not found", null, {});
    }

    // ✅ Clean leaveForwardTo array
    if (Array.isArray(updateData.leaveForwardTo)) {
      updateData.leaveForwardTo = updateData.leaveForwardTo.filter(
        (item) => item && item !== "null" && item !== ""
      );

      updateData.leaveForwardTo = [...new Set(updateData.leaveForwardTo)];

      const activeApproverEmployees = await Employee.find({
        _id: { $in: updateData.leaveForwardTo },
        status: "active",
      }).select("_id");

      const activeApproverIds = activeApproverEmployees.map((employee) => employee._id);
      const activeUserEmployeeIds = await getActiveUserEmployeeIds(activeApproverIds);

      updateData.leaveForwardTo = updateData.leaveForwardTo.filter((id) =>
        activeUserEmployeeIds.has(String(id))
      );
    }

    // ✅ Employee type validation + leave balance sync
    if (req.body.employeeType) {
      if (req.body.employeeType === "Admin") {
        return sendResponse(
          res,
          400,
          "Admin cannot be selected as employee type. Assign Admin access from User Access Master.",
          null,
          {}
        );
      }

      if (req.body.employeeType !== existingEmployee.employeeType) {
        await syncLeaveBalanceByEmployeeType(
          existingEmployee,
          req.body.employeeType
        );

        updateData.leaveBalance = existingEmployee.leaveBalance;
      }
    }

    // ✅ Old/New employee type check BEFORE update
    const oldEmployeeType = existingEmployee.employeeType;
    const newEmployeeType = req.body.employeeType || existingEmployee.employeeType;

    const wasApprover = ["Team Lead", "HR"].includes(oldEmployeeType);
    const isApprover = ["Team Lead", "HR"].includes(newEmployeeType);

    const isRemovedFromApproverRole = wasApprover && !isApprover;
    const isAddedToApproverRole = !wasApprover && isApprover;

    // ✅ Update employee
    let employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    // ✅ Update related user data
    const userUpdateData = {};

    // status form mathi remove kari didhu hoy to aa only safe condition che
    if (req.body.status !== undefined) {
      userUpdateData.isActive = req.body.status === "active";
    }

    if (req.body.employeeType) {
      const role = await findRoleByEmployeeType(req.body.employeeType);

      if (!role) {
        return sendResponse(
          res,
          400,
          `Role not found for employee type: ${req.body.employeeType}`,
          null,
          {}
        );
      }

      userUpdateData.role = role._id;
    }

    if (req.body.officeEmail) {
      userUpdateData.email = req.body.officeEmail;
    }

    await User.findOneAndUpdate(
      { employeeId: employee._id },
      {
        ...userUpdateData,
        $inc: {
          tokenVersion: 1,
        },
      }
    );

    // ✅ CASE 1:
    // Team Lead / HR mathi Employee / Intern bane to
    // assigned employees na leaveForwardTo mathi remove karvu
    if (isRemovedFromApproverRole) {
      const mappedEmployees = await Employee.find({
        leaveForwardTo: employee._id,
      }).select("_id");

      const mappedEmployeeIds = mappedEmployees.map((emp) => emp._id);

      // old assigned employees save karo
      await Employee.findByIdAndUpdate(employee._id, {
        previousEmployees: mappedEmployeeIds,
      });

      // assigned employees mathi aa employee remove karo
      await Employee.updateMany(
        {
          leaveForwardTo: employee._id,
        },
        {
          $pull: {
            leaveForwardTo: employee._id,
          },
        }
      );
    }

    // ✅ CASE 2:
    // Employee / Intern mathi fari Team Lead / HR bane to
    // previousEmployees ma saved employees ma j restore karvu
    if (isAddedToApproverRole) {
      const updatedApprover = await Employee.findById(employee._id);

      if (
        updatedApprover.previousEmployees &&
        updatedApprover.previousEmployees.length > 0
      ) {
        await Employee.updateMany(
          {
            _id: {
              $in: updatedApprover.previousEmployees,
            },
          },
          {
            $addToSet: {
              leaveForwardTo: employee._id,
            },
          }
        );
      }
    }

    // ✅ If leaveForwardTo manually changed from form, keep it updated
    if (Array.isArray(updateData.leaveForwardTo)) {
      employee = await Employee.findByIdAndUpdate(
        req.params.id,
        {
          leaveForwardTo: updateData.leaveForwardTo,
        },
        {
          new: true,
          runValidators: true,
        }
      );
    } else {
      employee = await Employee.findById(req.params.id);
    }

    return sendResponse(res, 200, "Success", employee, {});
  } catch (error) {
    console.error("[employeeController.js] API error:", error);
    return sendResponse(res, 500, error.message, null, {});
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return sendResponse(res, 404, "Employee not found", null, {});
    }

    const loginEmployeeId = req.user?.employeeId?._id || req.user?.employeeId;

    if (loginEmployeeId && String(loginEmployeeId) === String(employee._id)) {
      return sendResponse(res, 400, "You cannot deactivate your own employee account", null, {});
    }

    employee.status = "inactive";
    await employee.save();

    await User.findOneAndUpdate(
      { employeeId: employee._id },
      {
        isActive: false,
        $inc: { tokenVersion: 1 },
      }
    );

    await Employee.updateMany(
      { leaveForwardTo: employee._id },
      { $pull: { leaveForwardTo: employee._id } }
    );

    sendResponse(res, 200, "Employee deactivated successfully", null, {});
  } catch (error) {
    console.error('[employeeController.js] API error:', error);
    sendResponse(res, 500, "Failed to deactivate employee", null, {});
  }
};

const normalizeRoleName = (value = "") =>
  String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "");

const findRoleByEmployeeType = async (employeeType) => {
  const roles = await Role.find({ isActive: true });
  return roles.find((role) => normalizeRoleName(role.name) === normalizeRoleName(employeeType));
};

const createEmployeeUser = async (employee) => {
  
  const randomPassword = crypto.randomBytes(8).toString('hex').slice(0, 8);
  const roles = await findRoleByEmployeeType(employee.employeeType);

  if (!roles) {
    throw new Error(`Role not found for employee type: ${employee.employeeType}`);
  }

  const user = new User({
    email: employee.officeEmail,
    password: randomPassword,
    role: roles._id,
    name: `${employee.firstName} ${employee.lastName}`,
    employeeId: employee._id,
    empID: employee.employeeNo || 'MC0000001'
  });

  await sendEmail(user.email, user.name, 'random_password', { employeeNo: employee.employeeNo, password: randomPassword });
  await user.save();

  return user;
};

export const getEmployeesByTL = async (req, res) => {
  try {
    const tlId = req.params._id;

    const employees = await Employee.find({
      status: "active",
      leaveForwardTo: tlId,
    })
      .select(EMPLOYEE_LIST_SELECT)
      .populate("organization", "_id name")
      .populate("leaveForwardTo", EMPLOYEE_MIN_SELECT)
      .populate("reportingTo", EMPLOYEE_MIN_SELECT)
      .sort({ createdAt: -1 })
      .lean();

    return sendResponse(res, 200, 'Success', employees, {});
  } catch (error) {
    console.error('[employeeController.js] getEmployeesByTL error:', error);
    return sendResponse(res, 500, "Error fetching team employees", null, {});
  }
};

export const getTeamLeads = async (req, res) => {
  try {
    const eligibleUsers = await User.find({ isActive: true })
      .select("employeeId role isActive")
      .populate("role", "features name")
      .lean();

    const eligibleEmployeeIds = eligibleUsers
      .filter((item) =>
        Array.isArray(item.role?.features) &&
        (item.role.features.includes("team_employee_list") ||
          item.role.features.includes("leave_approval_menu") ||
          item.role.features.includes("reporting_manager_master"))
      )
      .map((item) => item.employeeId)
      .filter(Boolean);

    const teamLeads = await Employee.find({
      status: "active",
      $or: [
        { _id: { $in: eligibleEmployeeIds } },
        { employeeType: { $in: ["Team Lead", "HR", "Admin"] } },
      ],
    })
      .select(EMPLOYEE_TL_SELECT)
      .sort({ firstName: 1, lastName: 1 })
      .lean();

    const formattedTL = teamLeads.map((emp) => ({
      _id: emp._id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      employeeNo: emp.employeeNo,
      officeEmail: emp.officeEmail,
      email: emp.email,
      employeeType: emp.employeeType,
      status: emp.status,
      department: emp.department,
      designation: emp.designation,
    }));

    return sendResponse(res, 200, 'Success', formattedTL, {});
  } catch (error) {
    console.error('[employeeController.js] getTeamLeads error:', error);
    return sendResponse(res, 500, "Error fetching team employees", null, {});
  }
};

export const promoteToTL = async (req, res) => {
  try {
    const { employeeId, oldManagerId } = req.body;

    const employee = await Employee.findById(employeeId);

    employee.employeeType = "Team Lead";
    employee.reportingManagerId = null;

    if (!employee.originalReportingManagerId) {
      employee.originalReportingManagerId = oldManagerId;
    }

    await employee.save();

    await Employee.updateMany(
      { reportingManagerId: employeeId },
      { reportingManagerId: null }
    );

    sendResponse(res, 200, "Promoted successfully", null, {});
  } catch (err) {
    console.error('[employeeController.js] API error:', err);
    sendResponse(res, 500, err.message, null, {});
  }
};

export const demoteToEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const employee = await Employee.findById(employeeId);

    employee.employeeType = "Employee";

    employee.reportingManagerId =
      employee.originalReportingManagerId;

    await employee.save();

    sendResponse(res, 200, "Demoted successfully", null, {});
  } catch (err) {
    console.error('[employeeController.js] API error:', err);
    sendResponse(res, 500, err.message, null, {});
  }
};