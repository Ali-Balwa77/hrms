import Rule from '../models/Rule.js';
import { sendResponse } from '../utils/apiResponse.js';
 
export const createRule = async (req, res) => {
  try {
    const { title, content } = req.body;
   
    if (!title || !content) {
      return sendResponse(res, 400, 'Title and content are required', null, {});
    }
 
    const existingRule = await Rule.findOne({ title });
    if (existingRule) {
      return sendResponse(res, 400, 'A rule with this title already exists', null, {});
    }
 
    await Rule.create(req.body);
    return sendResponse(res, 201, 'Rule created', null, {});
  } catch (error) {
    console.error('[ruleController.js] API error:', error);
    return sendResponse(res, 500, error.message || 'Internal Server Error', null, {});
  }
};
 
export const updateRule = async (req, res) => {
  try {
    const { title } = req.body;
 
    if (title) {
      const existingRule = await Rule.findOne({
        title,
        _id: { $ne: req.params.id }
      });
      if (existingRule) {
        return sendResponse(res, 400, 'A rule with this title already exists', null, {});
      }
    }
 
    const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) {
      return sendResponse(res, 404, 'Rule not found', null, {});
    }
    return sendResponse(res, 200, 'Success', rule, {});
  } catch (error) {
    console.error('[ruleController.js] API error:', error);
    return sendResponse(res, 500, error.message || 'Internal Server Error', null, {});
  }
};
 
export const deleteRule = async (req, res) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return sendResponse(res, 404, 'Rule not found', null, {});
    }
    return sendResponse(res, 200, 'Rule deleted', null, {});
  } catch (error) {
    console.error('[ruleController.js] API error:', error);
    return sendResponse(res, 500, error.message || 'Internal Server Error', null, {});
  }
};
 
export const getRules = async (req, res) => {
  try {
    const rules = await Rule.find().sort({ createdAt: -1 });
    return sendResponse(res, 200, 'Success', rules, {});
  } catch (error) {
    console.error('[ruleController.js] API error:', error);
    return sendResponse(res, 500, error.message || 'Internal Server Error', null, {});
  }
};
 
export const deleteMultipleRules = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return sendResponse(res, 400, 'Invalid IDs provided', null, {});
    }
    await Rule.deleteMany({ _id: { $in: ids } });
    return sendResponse(res, 200, 'Selected rules deleted', null, {});
  } catch (error) {
    console.error('[ruleController.js] API error:', error);
    return sendResponse(res, 500, error.message || 'Internal Server Error', null, {});
  }
};