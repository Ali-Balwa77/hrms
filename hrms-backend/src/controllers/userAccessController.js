import crypto from "crypto";
import User from "../models/User.js";
import Role from "../models/Role.js";
import { sendEmail } from "../utils/mailgun.js";
import Employee from "../models/Employee.js";
import { sendResponse } from '../utils/apiResponse.js';
import { sendSocketEvent } from "../server.js";

const normalizeBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true" || String(value).toLowerCase() === "active";
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  empID: user.empID,
  isActive: user.isActive,
  role: user.role,
  employeeId: user.employeeId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const emitForceLogoutForUser = (user, message, reason = "access_updated") => {
  if (!user?._id) return;

  const payload = { message, reason };

  sendSocketEvent(user._id, "force_logout", payload);
  sendSocketEvent(user._id, "user_role_updated", payload);
  sendSocketEvent(user._id, "access_updated", payload);

  if (user.employeeId?._id || user.employeeId) {
    const employeeId = user.employeeId?._id || user.employeeId;
    sendSocketEvent(employeeId, "force_logout", payload);
    sendSocketEvent(employeeId, "user_role_updated", payload);
    sendSocketEvent(employeeId, "access_updated", payload);
  }
};

export const getAccessUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("role", "name isActive permissions features dashboardType")
      .populate("employeeId", "employeeNo firstName lastName officeEmail email employeeType designation department status")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Success', users, {});
  } catch (error) {
    console.error('[userAccessController.js] API error:', error);
    sendResponse(res, 500, "Failed to load users", null, {});
  }
};

export const getAccessUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("role", "name isActive permissions features dashboardType")
      .populate("employeeId", "employeeNo firstName lastName officeEmail email employeeType designation department status");

    if (!user) {
      return sendResponse(res, 404, "User not found", null, {});
    }

    sendResponse(res, 200, 'Success', user, {});
  } catch (error) {
    console.error('[userAccessController.js] API error:', error);
    sendResponse(res, 500, "Failed to load user", null, {});
  }
};

export const updateAccessUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("employeeId")
      .populate("role", "name");

    if (!user) {
      return sendResponse(res, 404, "User not found", null, {});
    }

    const isSelf = String(user._id) === String(req.user._id || req.user.id);

    let selectedRole = null;
    let shouldForceLogout = false;
    let forceLogoutMessage = "Your access has been updated. Please login again.";
    let forceLogoutReason = "access_updated";

    // ✅ Old role and employee type
    const oldRoleName = user.role?.name;
    const oldEmployeeType = user.employeeId?.employeeType;

    // ✅ Active / inactive login access
    if (req.body.isActive !== undefined) {
      const nextStatus = normalizeBoolean(req.body.isActive, user.isActive);

      if (isSelf && nextStatus === false) {
        return sendResponse(
          res,
          400,
          "You cannot deactivate your own login access",
          null,
          {}
        );
      }

      user.isActive = nextStatus;
      shouldForceLogout = true;
      forceLogoutMessage = nextStatus
        ? "Your login access has been activated. Please login again."
        : "Your login access has been deactivated. Please contact Admin.";
      forceLogoutReason = "access_updated";

      if (user.employeeId?._id) {
        await Employee.findByIdAndUpdate(user.employeeId._id, {
          status: nextStatus ? "active" : "inactive",
        });
      }
    }

    // ✅ Role change from User Access Master
    if (req.body.role) {
      if (isSelf) {
        return sendResponse(
          res,
          400,
          "You cannot change your own role from User Access Master",
          null,
          {}
        );
      }

      selectedRole = await Role.findOne({
        _id: req.body.role,
        isActive: true,
      });

      if (!selectedRole) {
        return sendResponse(res, 400, "Active role not found", null, {});
      }

      const newRoleName = selectedRole.name;

      // ✅ Same TL / HR remove-restore logic
      if (user.employeeId?._id) {
        const employeeId = user.employeeId._id;

        const oldType = oldEmployeeType || oldRoleName;
        const newType = newRoleName;

        const wasApprover = ["Team Lead", "HR"].includes(oldType);
        const isApprover = ["Team Lead", "HR"].includes(newType);

        const isRemovedFromApproverRole = wasApprover && !isApprover;
        const isAddedToApproverRole = !wasApprover && isApprover;

        // ✅ CASE 1:
        // Team Lead / HR mathi Employee / Intern bane to
        // assigned employees na leaveForwardTo mathi remove
        if (isRemovedFromApproverRole) {
          const mappedEmployees = await Employee.find({
            leaveForwardTo: employeeId,
          }).select("_id");

          const mappedEmployeeIds = mappedEmployees.map((emp) => emp._id);

          await Employee.findByIdAndUpdate(employeeId, {
            previousEmployees: mappedEmployeeIds,
          });

          await Employee.updateMany(
            {
              leaveForwardTo: employeeId,
            },
            {
              $pull: {
                leaveForwardTo: employeeId,
              },
            }
          );
        }

        // ✅ CASE 2:
        // Employee / Intern mathi Team Lead / HR bane to
        // previousEmployees ma saved employees ma j restore
        if (isAddedToApproverRole) {
          const updatedApprover = await Employee.findById(employeeId);

          if (
            updatedApprover?.previousEmployees &&
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
                  leaveForwardTo: employeeId,
                },
              }
            );
          }
        }

        // ✅ Employee collection ma employeeType pan update karvu
        await Employee.findByIdAndUpdate(employeeId, {
          employeeType: newRoleName,
        });
      }

      user.role = selectedRole._id;
      shouldForceLogout = true;
      forceLogoutMessage = "Your role has been updated. Please login again.";
      forceLogoutReason = "role_updated";
    }

    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();

    if (shouldForceLogout) {
      emitForceLogoutForUser(user, forceLogoutMessage, forceLogoutReason);
    }

    const updatedUser = await User.findById(user._id)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("role", "name isActive permissions features dashboardType")
      .populate(
        "employeeId",
        "employeeNo firstName lastName officeEmail email employeeType designation department status"
      );

    return sendResponse(res, 200, "Success", updatedUser, {});
  } catch (error) {
    console.error("[userAccessController.js] API error:", error);
    return sendResponse(res, 500, "Failed to update user access", null, {});
  }
};

export const resetAccessUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("employeeId", "employeeNo");

    if (!user) {
      return sendResponse(res, 404, "User not found", null, {});
    }

    const password = req.body.password?.trim() || crypto.randomBytes(8).toString("hex").slice(0, 8);

    if (password.length < 6) {
      return sendResponse(res, 400, "Password must be at least 6 characters", null, {});
    }

    user.password = password;
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();

    emitForceLogoutForUser(
      user,
      "Your password has been reset by Admin. Please login again.",
      "password_updated"
    );

    if (req.body.sendMail !== false) {
      await sendEmail(user.email, user.name, "random_password", {
        employeeId: user.employeeId?.employeeNo || user.empID,
        password,
      });
    }

    sendResponse(res, 200, "Password reset successfully", null, {});
  } catch (error) {
    console.error('[userAccessController.js] API error:', error);
    sendResponse(res, 500, "Failed to reset password", null, {});
  }
};
