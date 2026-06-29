import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config();

const { EMAIL_USER, EMAIL_PASS } = process.env;

class MailService {
    init() {
    try {
      return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
      });
    } catch (error) {
      console.warn("Missing email credentials");
    }
  }
}

const transporter = new MailService().init();

export const sendEmail = async (email, name, type, data) => {    
    try {
        const message = prepareTemplate(name, type, data);
        
        const config = {
            from: 'hrms@test.com',
            to: email,
            subject: message.subject,
            html: message.html
        };
        const info = await transporter.sendMail(config);
        return info;
    } catch (error) {
        return error;
    }
};

const prepareTemplate = (name, type, data) => {
    let message;
        
    switch (type) {
        case 'reset_password':
            message = {
                subject: 'Password Reset Request Testing',
                html: `
                    <h2>Password Reset Request</h2>
                    <p>Hello ${name || 'User'},</p>
                    <p>You requested a password reset for your HRMS account.</p>
                    <p>Click the link below to reset your password:</p>
                    <a href="${data.resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p>This link will expire in 5 minute.</p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    <p>Thank you,<br>HRMS Team</p>
                `
            };
            break;
        case 'random_password':
            message = {
                subject: 'Your HRMS Account Password Testing',
                html: `
                    <h2>Your HRMS Account Password</h2>
                    <p>Hello ${name || 'User'},</p>
                    <p>Your HRMS account has been created successfully.</p>
                    <p>Employee No: <strong style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${data.employeeNo}</strong></p>
                    <p>Your password is: <strong style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${data.password}</strong></p>
                    <p>Please login and change your password immediately.</p>
                    <p>Thank you,<br>HRMS Team</p>
                `
            };
            break;

        case 'leave_application':    
            message = {
                subject: 'Leave Application Testing',
                html: `
                    <p>Dear Sir/Madam,</p>
                    <p>I had applied my leave in HRMS, as per below details.</p>

                    <table style="width:700px; border-collapse:collapse; border:1px solid #000; font-family: Arial, sans-serif;">
                        
                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Name:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.firstName} ${data.data.employeeId.lastName}</td>
                            <td style="border:1px solid #000; padding:8px;"><b>Emp. Code:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.employeeNo}</td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Division:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.organization.name || 'Information Technology'}</td>
                            <td style="border:1px solid #000; padding:8px;"><b>Department:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.department || 'PHP'}</td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"><b>Designation:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.designation || 'JR. SOFTWARE ENGINEER'}</td>
                        </tr>

                        <tr>
                            <td colspan="4" style="border:1px solid #000; padding:8px; font-weight:bold; text-decoration:underline;">
                                Leave Detail:
                            </td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Leave Type:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.leaveType.code || 'PROBATION'}</td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>From:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${new Date(data.data.from).toLocaleDateString("en-GB")}</td>
                            <td style="border:1px solid #000; padding:8px;"><b>To Date:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${new Date(data.data.to).toLocaleDateString("en-GB")}</td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>No of Day:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.noOfDays}</td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Reason for Leave:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.reason}</td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Address while leave:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.address || ''}</td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Ph:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.phone || ''}</td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                    </table>

                    <p>Regards,<br>${name}</p>
                `
            };
            break;

        case 'leave_sanctioned':    

            const leaveStatus =
            data.data.status === 'approved'
                ? 'Sanctioned'
                : 'Rejected';    

            message = {
                subject: `Leave ${leaveStatus} Testing`,
                html: `
                    <p>Dear ${name},</p>
                    <p>Your leave has been ${leaveStatus} in HRMS, as per below details.</p>

                    <table style="width:700px; border-collapse:collapse; border:1px solid #000; font-family: Arial, sans-serif;">
                        
                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Name:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.firstName} ${data.data.employeeId.lastName}</td>
                            <td style="border:1px solid #000; padding:8px;"><b>Emp. Code:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.employeeNo}</td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Division:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.organization.name || 'Information Technology'}</td>
                            <td style="border:1px solid #000; padding:8px;"><b>Department:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.department || 'PHP'}</td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"><b>Designation:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.designation || 'JR. SOFTWARE ENGINEER'}</td>
                        </tr>

                        <tr>
                            <td colspan="4" style="border:1px solid #000; padding:8px; font-weight:bold; text-decoration:underline;">
                                Leave Detail:
                            </td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Leave Type:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.leaveType.code || 'PROBATION'}</td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>From:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${new Date(data.data.from).toLocaleDateString("en-GB")}</td>
                            <td style="border:1px solid #000; padding:8px;"><b>To Date:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${new Date(data.data.to).toLocaleDateString("en-GB")}</td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>No of Day:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.noOfDays}</td>
                            <td style="border:1px solid #000; padding:8px;"><b>${leaveStatus}By:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.sanctionedBy.name}</td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Reason for Leave:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.reason}</td>
                            ${
                                leaveStatus === "Rejected"
                                ? `
                                    <td style="border:1px solid #000; padding:8px;"><b>Reason for Leave Rejection:</b></td>
                                    <td style="border:1px solid #000; padding:8px;">${data.data.sanctionRemarks || "-"}</td>
                                `
                                : `
                                    <td style="border:1px solid #000; padding:8px;"></td>
                                    <td style="border:1px solid #000; padding:8px;"></td>
                                `
                            }
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Address while leave:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.address || ''}</td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Ph:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.phone || ''}</td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                    </table>
                `
            };
        break;

        case 'leave_cancel_application':    
            message = {
                subject: 'Leave Cancellation Application Testing',
                html: `
                    <p>Dear Sir/Madam,</p>

                    <p>
                        I would like to inform you that I had applied for leave in HRMS. 
                        Kindly find the details below for your reference.
                    </p>

                    <table style="width:700px; border-collapse:collapse; border:1px solid #000; font-family: Arial, sans-serif;">

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Name</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${data.data.employeeId.firstName} ${data.data.employeeId.lastName}
                            </td>

                            <td style="border:1px solid #000; padding:8px;"><b>Emp. Code</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${data.data.employeeId.employeeNo}
                            </td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Division</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${data.data.employeeId.organization?.name || 'Information Technology'}
                            </td>

                            <td style="border:1px solid #000; padding:8px;"><b>Department</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${data.data.employeeId.department || 'PHP'}
                            </td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Designation</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${data.data.employeeId.designation || 'JR. SOFTWARE ENGINEER'}
                            </td>

                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td colspan="4" style="border:1px solid #000; padding:8px; font-weight:bold; text-decoration:underline;">
                                Leave Details
                            </td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Leave Type</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${data.data.leaveId.leaveType?.code || 'PROBATION'}
                            </td>

                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>From Date</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${new Date(data.data.leaveId.from).toLocaleDateString("en-GB")}
                            </td>

                            <td style="border:1px solid #000; padding:8px;"><b>To Date</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${new Date(data.data.leaveId.to).toLocaleDateString("en-GB")}
                            </td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Total Days</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${data.data.leaveId.noOfDays}
                            </td>

                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Reason</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${data.data.leaveId.reason}
                            </td>

                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Address During Leave</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${data.data.leaveId.address || ''}
                            </td>

                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Phone</b></td>
                            <td style="border:1px solid #000; padding:8px;">
                                ${data.data.leaveId.phone || ''}
                            </td>

                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                    </table>

                    <p>
                        Regards,<br/>
                        ${name}
                    </p>
                `
            };
        break;

        case 'leave_cancellation_status':    

            const leaveCancelStatus =
            data.data.status === 'approved'
                ? 'Sanctioned'
                : 'Rejected';    

            message = {
                subject: `Leave Cancellation ${leaveCancelStatus} Testing`,
                html: `
                    <p>Dear ${name},</p>
                    <p>Your leave cancellation has been ${leaveCancelStatus} in HRMS, as per below details.</p>

                    <table style="width:700px; border-collapse:collapse; border:1px solid #000; font-family: Arial, sans-serif;">
                        
                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Name:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.firstName} ${data.data.employeeId.lastName}</td>
                            <td style="border:1px solid #000; padding:8px;"><b>Emp. Code:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.employeeNo}</td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Division:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.organization.name || 'Information Technology'}</td>
                            <td style="border:1px solid #000; padding:8px;"><b>Department:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.department || 'PHP'}</td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"><b>Designation:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.employeeId.designation || 'JR. SOFTWARE ENGINEER'}</td>
                        </tr>

                        <tr>
                            <td colspan="4" style="border:1px solid #000; padding:8px; font-weight:bold; text-decoration:underline;">
                                Leave Detail:
                            </td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Leave Type:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.leaveId.leaveType.code || 'PROBATION'}</td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>From:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${new Date(data.data.leaveId.from).toLocaleDateString("en-GB")}</td>
                            <td style="border:1px solid #000; padding:8px;"><b>To Date:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${new Date(data.data.leaveId.to).toLocaleDateString("en-GB")}</td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>No of Day:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.leaveId.noOfDays}</td>
                            <td style="border:1px solid #000; padding:8px;"><b>Leave Cancellation ${leaveCancelStatus}By:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.forwardTo.firstName} ${data.data.forwardTo.lastName}</td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Reason for Leave:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.leaveId.reason}</td>
                            ${
                                leaveCancelStatus === "Rejected"
                                ? `
                                    <td style="border:1px solid #000; padding:8px;"><b>Reason for Leave Cancellation Rejection:</b></td>
                                    <td style="border:1px solid #000; padding:8px;">${data.data.sanctionRemarks || "-"}</td>
                                `
                                : `
                                    <td style="border:1px solid #000; padding:8px;"></td>
                                    <td style="border:1px solid #000; padding:8px;"></td>
                                `
                            }
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Address while leave:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.leaveId.address || ''}</td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                        <tr>
                            <td style="border:1px solid #000; padding:8px;"><b>Ph:</b></td>
                            <td style="border:1px solid #000; padding:8px;">${data.data.leaveId.phone || ''}</td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                            <td style="border:1px solid #000; padding:8px;"></td>
                        </tr>

                    </table>
                `
            };
        break;

        default:
            message = '';
    }

    return message;
};