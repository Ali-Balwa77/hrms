import Designation from "../models/Designation.js";
import { sendResponse } from '../utils/apiResponse.js';


export const createDesignation = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return sendResponse(res, 400, "Designation name is required", null, {});
    }

    const exists = await Designation.findOne({
      name: name.trim(),
    });

    if (exists) {
      return sendResponse(res, 400, "Designation already exists", null, {});
    }

    const designation = await Designation.create({
      name: name.trim(),
    });

    sendResponse(res, 201, "Designation created successfully", designation, {});
  } catch (error) {
    console.error('[designationController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};


export const getDesignations = async (req, res) => {
  try {
    const designations = await Designation.find().sort({ createdAt: -1 });

    sendResponse(res, 200, 'Success', designations, {});
  } catch (error) {
    console.error('[designationController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};


export const getActiveDesignations = async (req, res) => {
  try {
    const designations = await Designation.find({
      status: true,
    }).sort({ name: 1 });

    sendResponse(res, 200, 'Success', designations, {});
  } catch (error) {
    console.error('[designationController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};


export const updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const designation = await Designation.findById(id);

    if (!designation) {
      return sendResponse(res, 404, "Designation not found", null, {});
    }
    
    if (name) {
      designation.name = name.trim();
    }
    
    if (typeof status === "boolean") {
      designation.status = status;
    }

    await designation.save();

    sendResponse(res, 200, "Designation updated successfully", designation, {});
  } catch (error) {
    console.error('[designationController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};


export const deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    const designation = await Designation.findById(id);

    if (!designation) {
      return sendResponse(res, 404, "Designation not found", null, {});
    }

    await designation.deleteOne();

    sendResponse(res, 200, "Designation deleted successfully", null, {});
  } catch (error) {
    console.error('[designationController.js] API error:', error);
    sendResponse(res, 500, error.message, null, {});
  }
};