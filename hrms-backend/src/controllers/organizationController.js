import Organization from '../models/Organization.js';
import { sendResponse } from '../utils/apiResponse.js';

export const getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find();
    sendResponse(res, 200, 'Success', orgs, {});
  } catch (error) {
    console.error('[organizationController.js] getOrganizations error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return sendResponse(res, 404, 'Organization not found', null, {});
    }
    sendResponse(res, 200, 'Success', org, {});
  } catch (error) {
    console.error('[organizationController.js] getOrganizationById error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const createOrganization = async (req, res) => {
  try {
    const existingOrg = await Organization.findOne({
      $or: [{ email: req.body.email }, { code: req.body.code }]
    });

    if (existingOrg) {
    
      if (existingOrg.email === req.body.email) {
        return sendResponse(res, 400, "Organization email already exists", null, {});
      }

    
      if (existingOrg.code === req.body.code) {
        return sendResponse(res, 400, "Organization code already exists", null, {});
      }
    }

    const org = await Organization.create(req.body);

    return sendResponse(res, 201, 'Created successfully', org, {});
  } catch (error) {
    console.error('[organizationController.js] createOrganization error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const updateOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!org) {
      return sendResponse(res, 404, 'Organization not found', null, {});
    }
    sendResponse(res, 200, 'Success', org, {});
  } catch (error) {
    console.error('[organizationController.js] updateOrganization error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

export const deleteOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) {
      return sendResponse(res, 404, 'Organization not found', null, {});
    }
    sendResponse(res, 200, 'Organization deleted', null, {});
  } catch (error) {
    console.error('[organizationController.js] deleteOrganization error:', error);
    sendResponse(res, 500, error?.message || 'Internal server error', null, {});
  }
};

