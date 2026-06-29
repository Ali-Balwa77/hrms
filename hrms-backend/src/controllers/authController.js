import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { generateToken } from '../utils/generateToken.js';
import { io, activeUsers } from '../server.js';
import { sendResponse } from '../utils/apiResponse.js';

export const login = async (req, res, next) => {
  try {
    const { email, password, employeeId } = req.body;
    const loginIdentifier = email || employeeId;

    if (!loginIdentifier || !password) {
      return sendResponse(res, 400, 'Email/Employee ID and password are required.', null, {});
    }

    const user = await User.findOne({
      $or: [{ email: loginIdentifier }, { empID: loginIdentifier }],
    }).populate('role').populate('employeeId', 'status designation');

    if (!user) {
      return sendResponse(res, 401, 'Employee not found.', null, {});
    }

    if (!user.isActive) {
      return sendResponse(res, 403, 'Your account is inactive. Please contact admin.', null, {});
    }

    if (user.employeeId?.status === 'inactive') {
      return sendResponse(res, 403, 'Employee account is inactive. Please contact admin.', null, {});
    }

    if (user.role.isActive === false) {
      return sendResponse(res, 403, "Your assigned role is inactive. Please contact Admin.", null, {});
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return sendResponse(res, 401, 'Invalid Password.', null, {});
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { tokenVersion: 1 } },
      { new: true }
    ).populate('role');

    if (activeUsers[updatedUser._id]) {
      io.to(activeUsers[updatedUser._id]).emit('force_logout');
    }

    const token = generateToken(updatedUser);
    const employee = await Employee.findById(updatedUser.employeeId).select('designation');

    return sendResponse(res, 200, 'Success', { token, user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        designation: employee?.designation || '',
        role: updatedUser.role,
        employeeId: updatedUser.employeeId,
        empID: updatedUser.empID,
      } }, {});
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return sendResponse(res, 200, 'Profile loaded successfully', user, {});
  } catch (error) {
    console.error('Profile load error:', error);
    return sendResponse(res, 500, error?.message || 'Failed to load profile', null, {});
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true }).select('-password');
    return sendResponse(res, 200, 'Profile updated successfully', user, {});
  } catch (error) {
    console.error('Profile update error:', error);
    return sendResponse(res, 500, error?.message || 'Failed to update profile', null, {});
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return sendResponse(res, 400, 'Old password and new password are required.', null, {});
    }

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return sendResponse(res, 400, 'Old password is incorrect', null, {});
    }

    user.password = newPassword;
    await user.save();

    return sendResponse(res, 200, 'Password changed successfully', null, {});
  } catch (error) {
    console.error('Change password error:', error);
    return sendResponse(res, 500, error?.message || 'Failed to change password', null, {});
  }
};
