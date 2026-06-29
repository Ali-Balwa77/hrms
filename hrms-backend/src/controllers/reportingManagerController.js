import Employee from '../models/Employee.js';
import { sendResponse } from '../utils/apiResponse.js';


export const getEmployeesByReportingManager = async (req, res) => {

    try {

        const { tlId } = req.params;

        const employees = await Employee.find({
            leaveForwardTo: tlId,
            status: 'active'
        });

        sendResponse(res, 200, 'Success', employees, {});

    } catch (error) {
    console.error('[reportingManagerController.js] API error:', error);

        sendResponse(res, 500, error.message, null, {});

    }

};


export const transferEmployeesToNewTL = async (req, res) => {

    try {

        const {
            oldTlId,
            newTlId,
            employeeIds
        } = req.body;

        if (!oldTlId || !newTlId) {

            return sendResponse(res, 400, 'Old TL and New TL are required', null, {});

        }

        if (
            !Array.isArray(employeeIds) ||
            employeeIds.length === 0
        ) {

            return sendResponse(res, 400, 'Please select employees', null, {});

        }

        await Employee.updateMany(
            {
                _id: {
                    $in: employeeIds
                }
            },
            {
                $pull: {
                    leaveForwardTo: oldTlId
                }
            }
        );

        await Employee.updateMany(
            {
                _id: {
                    $in: employeeIds
                }
            },
            {
                $addToSet: {
                    leaveForwardTo: newTlId
                }
            }
        );

        sendResponse(res, 200, 'Employees transferred successfully', null, {});

    } catch (error) {
    console.error('[reportingManagerController.js] API error:', error);

        sendResponse(res, 500, error.message, null, {});

    }

};