import crypto from 'crypto';
import User from '../models/User.js';
import { sendEmail } from '../utils/mailgun.js';
import Employee from '../models/Employee.js';
import { sendResponse } from '../utils/apiResponse.js';

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
 
    const employee = await Employee.findOne({ officeEmail: email });
 
    if (!employee) {
      return sendResponse(res, 404, 'Employee not found', null, {});
    }
 
    const user = await User.findOne({ employeeId: employee._id });
 
    if (!user) {
      return sendResponse(res, 404, 'User not found', null, {});
    }
 
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = undefined;
    
    const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    await sendEmail(email, employee.firstName, 'reset_password', { resetUrl });
    await user.save();
 
    sendResponse(res, 200, 'Password reset token generated', { resetToken }, {});
  } catch (error) {
    console.error('[passwordController.js] forgotPassword error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({ resetPasswordToken: token });
  
    if (!user) {
      return sendResponse(res, 400, 'Invalid reset link.', null, {});
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    sendResponse(res, 200, 'Reset password successfully and allow login with new password.', null, {});
  } catch (error) {
    console.error('[passwordController.js] resetPassword error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};
