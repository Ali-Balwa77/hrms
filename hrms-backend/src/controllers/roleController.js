import Role from "../models/Role.js";
import User from "../models/User.js";
import { sendSocketEvent } from "../server.js";
import { FEATURES, MODULES } from "../config/roleAccess.js";
import { sendResponse } from '../utils/apiResponse.js';


const normalizePayload = (body) => ({
  name: body.name?.trim(),
  dashboardType: body.dashboardType || "employee",
  permissions: Array.isArray(body.permissions) ? body.permissions : [],
  features: Array.isArray(body.features) ? body.features : [],
  isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
});

const emitForceLogoutForUser = (user, message) => {
  if (!user?._id) return;

  const payload = {
    message,
    reason: "permission_updated",
  };

  sendSocketEvent(user._id, "force_logout", payload);
  sendSocketEvent(user._id, "role_permission_updated", payload);

  if (user.employeeId) {
    sendSocketEvent(user.employeeId, "force_logout", payload);
    sendSocketEvent(user.employeeId, "role_permission_updated", payload);
  }
};

const forceLogoutUsersByRole = async (roleId, message) => {
  const users = await User.find({ role: roleId }).select("_id employeeId tokenVersion");

  if (!users.length) return;

  await User.updateMany(
    { _id: { $in: users.map((user) => user._id) } },
    { $inc: { tokenVersion: 1 } }
  );

  users.forEach((user) => emitForceLogoutForUser(user, message));
};

export const getPermissionMaster = async (req, res) => {
  try {
    sendResponse(res, 200, 'Success', { modules: MODULES, features: FEATURES }, {});
  } catch (error) {
    console.error('[roleController.js] getPermissionMaster error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const createRole = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);

    if (!payload.name) {
      return sendResponse(res, 400, "Role name is required", null, {});
    }

    const role = await Role.create(payload);
    sendResponse(res, 201, 'Created successfully', role, {});
  } catch (err) {
    console.error('[roleController.js] API error:', err);
    if (err.code === 11000) {
      return sendResponse(res, 400, "Role already exists", null, {});
    }
    sendResponse(res, 500, err.message, null, {});
  }
};

export const getRole = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    sendResponse(res, 200, 'Success', roles, {});
  } catch (err) {
    console.error('[roleController.js] API error:', err);
    sendResponse(res, 500, err.message, null, {});
  }
};

export const getActiveRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true }).sort({ name: 1 });
    sendResponse(res, 200, 'Success', roles, {});
  } catch (err) {
    console.error('[roleController.js] API error:', err);
    sendResponse(res, 500, err.message, null, {});
  }
};

export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return sendResponse(res, 404, "Role not found", null, {});
    sendResponse(res, 200, 'Success', role, {});
  } catch (err) {
    console.error('[roleController.js] API error:', err);
    sendResponse(res, 500, err.message, null, {});
  }
};

export const updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return sendResponse(res, 404, "Role not found", null, {});

    const payload = normalizePayload(req.body);
    role.name = payload.name || role.name;
    role.dashboardType = payload.dashboardType;
    role.permissions = payload.permissions;
    role.features = payload.features;
    role.isActive = payload.isActive;

    await role.save();

    await forceLogoutUsersByRole(
      role._id,
      role.isActive
        ? "Your role permissions have been updated. Please login again."
        : "Your assigned role has been inactive. Please contact Admin."
    );

    sendResponse(res, 200, 'Success', role, {});
  } catch (err) {
    console.error('[roleController.js] API error:', err);
    if (err.code === 11000) {
      return sendResponse(res, 400, "Role already exists", null, {});
    }
    sendResponse(res, 500, err.message, null, {});
  }
};

export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return sendResponse(res, 404, "Role not found", null, {});

    await forceLogoutUsersByRole(
      role._id,
      "Your assigned role has been deleted. Please contact Admin."
    );

    await role.deleteOne();
    sendResponse(res, 200, "Role deleted successfully", null, {});
  } catch (err) {
    console.error('[roleController.js] API error:', err);
    sendResponse(res, 500, err.message, null, {});
  }
};
