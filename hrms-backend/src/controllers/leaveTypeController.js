import Employee from '../models/Employee.js';
import LeaveType from '../models/LeaveType.js';
import { sendResponse } from '../utils/apiResponse.js';
import LeaveBalanceArchive from "../models/LeaveBalanceArchive.js";

const archiveAndRemoveLeaveBalance = async ({
  employeeQuery,
  oldLeaveCode,
  leaveCode,
}) => {
  const codes = [...new Set([oldLeaveCode, leaveCode].filter(Boolean))];

  const employees = await Employee.find({
    ...employeeQuery,
    "leaveBalance.leaveType": {
      $in: codes,
    },
  });

  const archiveOps = [];

  for (const emp of employees) {
    const balancesToArchive = emp.leaveBalance.filter((lb) =>
      codes.includes(lb.leaveType)
    );

    for (const balance of balancesToArchive) {
      archiveOps.push({
        updateOne: {
          filter: {
            employee: emp._id,
            leaveType: balance.leaveType,
            "balanceData.allocationMode": balance.allocationMode || "normal",
            "balanceData.quarter": balance.quarter || null,
            "balanceData.year": balance.year || null,
          },
          update: {
            $set: {
              employee: emp._id,
              leaveType: balance.leaveType,
              balanceData: {
                leaveType: balance.leaveType,
                totalLeave: Number(balance.totalLeave || 0),
                originalTotalLeave: Number(balance.originalTotalLeave || 0),
                allocationMode: balance.allocationMode || "normal",
                quarter: balance.quarter || null,
                year: balance.year || null,
                validFrom: balance.validFrom || null,
                validTo: balance.validTo || null,
              },
              reason: "leave_type_inactive",
            },
          },
          upsert: true,
        },
      });
    }
  }

  if (archiveOps.length > 0) {
    await LeaveBalanceArchive.bulkWrite(archiveOps);
  }

  await Employee.updateMany(
    employeeQuery,
    {
      $pull: {
        leaveBalance: {
          leaveType: {
            $in: codes,
          },
        },
      },
    }
  );
};

const restoreArchivedLeaveBalance = async ({
  employeeQuery,
  oldLeaveCode,
  leaveCode,
}) => {
  const codes = [...new Set([oldLeaveCode, leaveCode].filter(Boolean))];

  const archives = await LeaveBalanceArchive.find({
    $or: [
      {
        leaveType: {
          $in: codes,
        },
      },
      {
        "balanceData.leaveType": {
          $in: codes,
        },
      },
    ],
  });

  for (const archive of archives) {
    const emp = await Employee.findOne({
      _id: archive.employee,
      ...employeeQuery,
    });

    if (!emp) continue;

    const balanceData = {
      leaveType: leaveCode,
      totalLeave: Number(archive.balanceData?.totalLeave || 0),
      originalTotalLeave: Number(archive.balanceData?.originalTotalLeave || 0),
      isActive: true,
      allocationMode: archive.balanceData?.allocationMode || "normal",
      quarter: archive.balanceData?.quarter || null,
      year: archive.balanceData?.year || null,
      validFrom: archive.balanceData?.validFrom || null,
      validTo: archive.balanceData?.validTo || null,
    };

    const alreadyExists = emp.leaveBalance.some((lb) => {
      return (
        lb.leaveType === balanceData.leaveType &&
        lb.allocationMode === balanceData.allocationMode &&
        String(lb.quarter || "") === String(balanceData.quarter || "") &&
        Number(lb.year || 0) === Number(balanceData.year || 0)
      );
    });

    if (!alreadyExists) {
      emp.leaveBalance.push(balanceData);
      await emp.save();
    }
  }

  // Optional: restore pachi archive delete karvu hoy to
  await LeaveBalanceArchive.deleteMany({ leaveType: leaveCode });
};

const getCurrentYearDateRange = () => {
  const year = new Date().getFullYear();

  return {
    year,
    validFrom: new Date(year, 0, 1),   // Jan 1
    validTo: new Date(year, 11, 31),   // Dec 31
  };
};

const getLeaveTypeEmployeeQuery = (leaveCode) => {
  if (leaveCode === "PROBATION") {
    return { employeeType: "Intern" };
  }

  if (leaveCode === "LWP") {
    return {};
  }

  return { employeeType: { $ne: "Intern" } };
};


export const createLeaveType = async (req, res) => {
  try {

    const { name, code, totalDays } = req.body;

    
    if (totalDays < 0) {
      return sendResponse(res, 400, "Total days cannot be negative", null, {});
    }

    
    const existingName = await LeaveType.findOne({
      name: {
        $regex: `^${name}$`,
        $options: "i"
      }
    });

    if (existingName) {
      return sendResponse(res, 400, "Leave Type name already exists", null, {});
    }

    
    const existingCode = await LeaveType.findOne({
      code: {
        $regex: `^${code}$`,
        $options: "i"
      }
    });

    if (existingCode) {
      return sendResponse(res, 400, "Leave Type code already exists", null, {});
    }

    const leaveType = await LeaveType.create(req.body);

    if (leaveType.allocationMode === "quarterly") {
      return sendResponse(res, 201, "Leave type saved successfully. Balance will be updated through quarterly allocation.", leaveType, {});
    }

    if (leaveType.status === true) {

      const employees = await Employee.find(getLeaveTypeEmployeeQuery(leaveType.code));
      const yearRange = getCurrentYearDateRange();

      for (const emp of employees) {

        const alreadyExists = emp.leaveBalance.find(
          (x) => x.leaveType === leaveType.code
        );

        if (!alreadyExists) {

          emp.leaveBalance.push({
            leaveType: leaveType.code,
            totalLeave: leaveType.totalDays,
            originalTotalLeave: leaveType.totalDays,
            allocationMode: leaveType.allocationMode,
            quarter: null,
            year: yearRange.year,
            validFrom: yearRange.validFrom,
            validTo: yearRange.validTo,
          });

          await emp.save();
        }
      }
    }

    sendResponse(res, 201, 'Created successfully', leaveType, {});

  } catch (error) {
    console.error('[leaveTypeController.js] API error:', error);

    sendResponse(res, 500, 'Failed to create leave type', null, {});
  }
};

export const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find({
      status: true,
    }).sort({ createdAt: -1 });

    sendResponse(res, 200, 'Success', leaveTypes, {});
  } catch (error) {
    console.error('[leaveTypeController.js] API error:', error);
    sendResponse(res, 500, 'Failed to get leave types', null, {});
  }
};

export const getAllLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find();

    sendResponse(res, 200, 'Success', leaveTypes, {});
  } catch (error) {
    console.error('[leaveTypeController.js] API error:', error);
    sendResponse(res, 500, 'Failed to get all leave types', null, {});
  }
};

export const getLeaveTypeById = async (req, res) => {
  try {
    const leaveType = await LeaveType.findById(req.params.id);

    if (!leaveType) {
      return sendResponse(res, 404, 'Leave Type not found', null, {});
    }

    sendResponse(res, 200, 'Success', leaveType, {});
  } catch (error) {
    console.error('[leaveTypeController.js] API error:', error);
    sendResponse(res, 500, 'Failed to get leave types', null, {});
  }
};

export const updateLeaveType = async (req, res) => {
  try {
    const { name, code, totalDays } = req.body;

    if (totalDays !== undefined && Number(totalDays) < 0) {
      return sendResponse(res, 400, "Total days cannot be negative", null, {});
    }

    if (name) {
      const existingName = await LeaveType.findOne({
        _id: { $ne: req.params.id },
        name: {
          $regex: `^${name}$`,
          $options: "i",
        },
      });

      if (existingName) {
        return sendResponse(
          res,
          400,
          "Leave Type name already exists",
          null,
          {}
        );
      }
    }

    if (code) {
      const existingCode = await LeaveType.findOne({
        _id: { $ne: req.params.id },
        code: {
          $regex: `^${code}$`,
          $options: "i",
        },
      });

      if (existingCode) {
        return sendResponse(
          res,
          400,
          "Leave Type code already exists",
          null,
          {}
        );
      }
    }

    const oldLeaveType = await LeaveType.findById(req.params.id);

    if (!oldLeaveType) {
      return sendResponse(res, 404, "Leave Type not found", null, {});
    }

    const leaveType = await LeaveType.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!leaveType) {
      return sendResponse(res, 404, "Leave Type not found", null, {});
    }

    const oldLeaveCode = oldLeaveType.code;
    const leaveCode = leaveType.code;

    const oldStatus =
      oldLeaveType.status === true || oldLeaveType.status === "true";

    const newStatus =
      leaveType.status === true || leaveType.status === "true";

    const wasInactiveAndNowActive =
      oldStatus === false && newStatus === true;

    const isProbationLeave =
      oldLeaveCode === "PROBATION" || leaveCode === "PROBATION";

    const isLWP = leaveCode === "LWP";

    let employeeQuery = {};

    if (isProbationLeave) {
      employeeQuery = {
        employeeType: "Intern",
      };
    } else if (isLWP) {
      employeeQuery = {};
    } else {
      employeeQuery = {
        employeeType: { $ne: "Intern" },
      };
    }

    // ✅ IMPORTANT:
    // Leave type inactive thay tyare archive + remove karvu
    if (newStatus === false) {
      await archiveAndRemoveLeaveBalance({
        employeeQuery,
        oldLeaveCode,
        leaveCode,
      });

      if (isProbationLeave) {
        await Employee.updateMany(
          {
            employeeType: { $ne: "Intern" },
          },
          {
            $pull: {
              leaveBalance: {
                leaveType: {
                  $in: [oldLeaveCode, leaveCode, "PROBATION"],
                },
              },
            },
          }
        );
      }

      return sendResponse(
        res,
        200,
        "Leave Type updated successfully",
        leaveType,
        {}
      );
    }

    // ✅ Leave type inactive mathi active thay tyare archive mathi restore karvu
    if (wasInactiveAndNowActive) {
      await restoreArchivedLeaveBalance({
        employeeQuery,
        oldLeaveCode,
        leaveCode,
      });

      // ✅ Quarterly and Normal leave ma fresh balance add/update na karvu
      // Restore archive mathi thai gayu etle direct return
      return sendResponse(
        res,
        200,
        "Leave Type updated successfully",
        leaveType,
        {}
      );
    }

    const employees = await Employee.find(employeeQuery);

    for (const emp of employees) {
      const existingIndex = emp.leaveBalance.findIndex(
        (x) => x.leaveType === oldLeaveCode || x.leaveType === leaveCode
      );

      if (existingIndex === -1) {
        // ✅ Quarterly leave fresh add na karvi
        // Quarterly leave only manual allocation thi add thavi joie
        if (leaveType.allocationMode !== "quarterly") {
          const yearRange = getCurrentYearDateRange();

          emp.leaveBalance.push({
            leaveType: leaveCode,
            totalLeave: Number(leaveType.totalDays || 0),
            originalTotalLeave: Number(leaveType.totalDays || 0),
            isActive: leaveType.status === true,
            allocationMode: leaveType.allocationMode || "normal",
            quarter: leaveType.quarter || null,
            year: yearRange.year || null,
            validFrom: yearRange.validFrom || null,
            validTo: yearRange.validTo || null,
          });
        }
      } else {
        const existingBalance = emp.leaveBalance[existingIndex];
        const isExistingQuarterlyBalance =
          existingBalance.allocationMode === "quarterly" ||
          existingBalance.quarter ||
          existingBalance.validFrom ||
          existingBalance.validTo;

        emp.leaveBalance[existingIndex].leaveType = leaveCode;
        emp.leaveBalance[existingIndex].isActive = leaveType.status === true;

        // ✅ Normal leave mate fields update karva
        // Quarterly allocated balances are organization policy overrides; preserve them.
        if (leaveType.allocationMode !== "quarterly" && !isExistingQuarterlyBalance) {
          const yearRange = getCurrentYearDateRange();
          
          emp.leaveBalance[existingIndex].allocationMode =
            leaveType.allocationMode || "normal";
          emp.leaveBalance[existingIndex].quarter = null;
          emp.leaveBalance[existingIndex].year = yearRange.year;
          emp.leaveBalance[existingIndex].validFrom = yearRange.validFrom;
          emp.leaveBalance[existingIndex].validTo = yearRange.validTo;

          emp.leaveBalance[existingIndex].totalLeave = Number(
            leaveType.totalDays || 0
          );

          emp.leaveBalance[existingIndex].originalTotalLeave = Number(
            leaveType.totalDays || 0
          );
        }
      }

      await emp.save();
    }

    if (isProbationLeave) {
      await Employee.updateMany(
        {
          employeeType: { $ne: "Intern" },
        },
        {
          $pull: {
            leaveBalance: {
              leaveType: {
                $in: [oldLeaveCode, leaveCode, "PROBATION"],
              },
            },
          },
        }
      );
    }

    if (!isProbationLeave && !isLWP) {
      await Employee.updateMany(
        {
          employeeType: "Intern",
        },
        {
          $pull: {
            leaveBalance: {
              leaveType: leaveCode,
            },
          },
        }
      );
    }

    return sendResponse(
      res,
      200,
      "Leave Type updated successfully",
      leaveType,
      {}
    );
  } catch (error) {
    console.error("[leaveTypeController.js] API error:", error);
    return sendResponse(res, 500, "Failed to update leave types", null, {});
  }
};


export const deleteLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.findById(req.params.id);

    await Employee.updateMany(
      {},
      {
        $pull: {
          leaveBalance: {
            leaveType: leaveType.code
          }
        }
      }
    );

    await LeaveType.findByIdAndDelete(
      req.params.id
    );

    if (!leaveType) {
      return sendResponse(res, 404, 'Leave Type not found', null, {});
    }

    sendResponse(res, 200, 'Leave Type deleted successfully', null, {});
  } catch (error) {
    console.error('[leaveTypeController.js] API error:', error);
    sendResponse(res, 500, 'Failed to delete leave types', null, {});
  }
};
