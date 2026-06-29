import Holiday from '../models/Holiday.js';
import { sendResponse } from '../utils/apiResponse.js';

export const createHoliday = async (req, res) => {
  try {
    const holidayDate = new Date(req.body.date);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    holidayDate.setHours(0, 0, 0, 0);

    if (holidayDate < today) {
      return sendResponse(res, 400, "Past holiday date is not allowed", null, {});
    }
  
    const existingHoliday = await Holiday.findOne({
      date: req.body.date
    });

    if (existingHoliday) {
      return sendResponse(res, 400, "Holiday already exists for this date", null, {});
    }
    const holiday = await Holiday.create(req.body);
    sendResponse(res, 201, 'Created successfully', holiday, {});
  } catch (error) {
    console.error('[holidayController.js] createHoliday error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find();
    sendResponse(res, 200, 'Success', holidays, {});
  } catch (error) {
    console.error('[holidayController.js] getHolidays error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const getHolidayById = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return sendResponse(res, 404, 'Holiday not found', null, {});
    }
    sendResponse(res, 200, 'Success', holiday, {});
  } catch (error) {
    console.error('[holidayController.js] getHolidayById error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!holiday) {
      return sendResponse(res, 404, 'Holiday not found', null, {});
    }
    sendResponse(res, 200, 'Success', holiday, {});
  } catch (error) {
    console.error('[holidayController.js] updateHoliday error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      return sendResponse(res, 404, 'Holiday not found', null, {});
    }
    sendResponse(res, 200, 'Holiday deleted', null, {});
  } catch (error) {
    console.error('[holidayController.js] deleteHoliday error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

