import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import Loader from "../../components/common/Loader.jsx";
import FormInput from "../../components/formValidation/FormInput.jsx";
import FormSelect from "../../components/formValidation/FromSelect.jsx";
import { api } from "../../services/api.js";
import { route } from "../../utils/routeHelper.js";
import { MODULES as FALLBACK_MODULES, normalizePermissionsFromFeatures } from "../../utils/permissions.js";
import { roleSchema } from "../../validation/role.schema.js";

const mergePermissionModules = (apiModules = []) => {
  const moduleMap = new Map();

  FALLBACK_MODULES.forEach((moduleItem) => {
    moduleMap.set(moduleItem.key, {
      ...moduleItem,
      actions: [...moduleItem.actions],
    });
  });

  apiModules.forEach((moduleItem) => {
    const current = moduleMap.get(moduleItem.key);

    if (!current) {
      moduleMap.set(moduleItem.key, moduleItem);
      return;
    }

    moduleMap.set(moduleItem.key, {
      ...current,
      ...moduleItem,
      actions: Array.from(new Set([
        ...(current.actions || []),
        ...(moduleItem.actions || []),
      ])),
    });
  });

  return Array.from(moduleMap.values());
};

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const RoleForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState(FALLBACK_MODULES);

  const formik = useFormik({
    initialValues: {
      name: "",
      status: "",
      permissions: [],
    },
    validationSchema: roleSchema,
    enableReinitialize: false,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const payload = {
          name: values.name.trim(),
          isActive: values.status,
          permissions: values.permissions,
          features: [],
        };

        if (isEdit) {
          await api.patch(`/role/${id}`, payload);
          toast.success("Role updated");
        } else {
          await api.post("/role", payload);
          toast.success("Role created");
        }

        navigate(route(user, "/roles"));
      } catch (error) {
        toast.error(error.response?.data?.message || error.message || "Failed to save role");
      } finally {
        setLoading(false);
      }
    },
  });

  const loadMaster = async () => {
    try {
      const response = await api.get("/role/permission-master");
      const data = (response?.data?.data || response?.data || {});
      setModules(mergePermissionModules(data.modules || []));
    } catch (error) {
      console.error('Failed to load permission master:', error);
      setModules(FALLBACK_MODULES);
    }
  };

  const loadRole = async () => {
    if (!isEdit) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/role/${id}`);
      formik.setValues({
        name: data.name || "",
        status: data.isActive !== false ? "active" : "inactive",
        permissions: normalizePermissionsFromFeatures(
          Array.isArray(data.permissions) ? data.permissions : [],
          Array.isArray(data.features) ? data.features : []
        ),
      });
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaster();
    loadRole();
  }, [id]);

  const isActionChecked = (moduleKey, action) => {
    const permission = formik.values.permissions.find((item) => item.module === moduleKey);
    return Array.isArray(permission?.actions) && permission.actions.includes(action);
  };

  const togglePermission = (moduleKey, action) => {
    const permissions = [...formik.values.permissions];
    const index = permissions.findIndex((item) => item.module === moduleKey);

    if (index === -1) {
      permissions.push({ module: moduleKey, actions: [action] });
    } else {
      const actions = permissions[index].actions || [];
      const nextActions = actions.includes(action)
        ? actions.filter((item) => item !== action)
        : [...actions, action];

      if (nextActions.length === 0) {
        permissions.splice(index, 1);
      } else {
        permissions[index] = { ...permissions[index], actions: nextActions };
      }
    }

    formik.setFieldValue("permissions", permissions);
    formik.setFieldTouched("permissions", true, false);
  };

  const toggleAllModuleActions = (moduleItem) => {
    const permissions = formik.values.permissions.filter((item) => item.module !== moduleItem.key);
    const current = formik.values.permissions.find((item) => item.module === moduleItem.key);
    const allSelected = moduleItem.actions.every((action) => current?.actions?.includes(action));

    if (!allSelected) {
      permissions.push({ module: moduleItem.key, actions: moduleItem.actions });
    }

    formik.setFieldValue("permissions", permissions);
    formik.setFieldTouched("permissions", true, false);
  };

  const getActionLabel = (action) => {
    const labels = {
      read: "Read",
      create: "Create",
      update: "Update",
      delete: "Delete",
      approve: "Approve",
      reject: "Reject",
      employee_menu: "Employee Menu",
      team_employee_list: "Team Employee List",
      reporting_manager_master: "Reporting Manager Master",
      leave_self_menu: "Leave Application/Cancellation Menu",
      leave_approval_menu: "Leave Approval Menu",
      leave_cancel_approval_menu: "Leave Cancellation Approval Menu",
      leave_report_menu: "Month Wise Leave Reports Menu",
      team_leave_scope: "Team Leave Scope",
      leave_type_menu: "Leave Type Menu",
      quarterly_leave_policy_menu: "Quarterly Leave Policy Menu",
      designation_menu: "Designation Master Menu",
      view_all_attendance: "View All Attendance",
      manage_rules: "Manage Rules",
      mispunch_self_menu: "Mispunch Self Menu",
      mispunch_approval_menu: "Mispunch Approval Menu"
    };

    return labels[action] || action.replace(/_/g, " ");
  };

  const permissionError = formik.touched.permissions && typeof formik.errors.permissions === "string"
    ? formik.errors.permissions
    : "";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {loading && <Loader />}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">{isEdit ? "Edit Role" : "Create Role"}</h1>
          <p className="text-xs text-slate-500 mt-1">Configure role access using module permissions and scope actions.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(route(user, '/roles'))}
          className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm"
        >
          &larr; Back to List
        </button>
      </div>

      <form onSubmit={formik.handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Role Name"
            name="name"
            formik={formik}
            type="text"
            required
            placeholder="e.g. Senior Manager"
          />

          <FormSelect
            label="Status"
            name="status"
            formik={formik}
            options={statusOptions}
            required
          />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Module Permissions</h3>
          <div className={`overflow-x-auto rounded-2xl shadow-sm ring-1 ${permissionError ? "ring-red-300" : "ring-slate-200"}`}>
            <table className="role-permission-table w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Module</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Actions</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Select All</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {modules.map((moduleItem) => {
                  const current = formik.values.permissions.find((item) => item.module === moduleItem.key);
                  const allSelected = moduleItem.actions.every((action) => current?.actions?.includes(action));

                  return (
                    <tr key={moduleItem.key} className="hover:bg-slate-50/20 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-800 text-xs uppercase tracking-wider">{moduleItem.label}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {moduleItem.actions.map((action) => (
                            <label key={`${moduleItem.key}-${action}`} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${isActionChecked(moduleItem.key, action) ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-white border-slate-200 text-slate-500 hover:border-brand-100"}`}>
                              <input
                                type="checkbox"
                                checked={isActionChecked(moduleItem.key, action)}
                                onChange={() => togglePermission(moduleItem.key, action)}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                              />
                              {getActionLabel(action)}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => toggleAllModuleActions(moduleItem)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${allSelected ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-100"}`}
                        >
                          {allSelected ? "Clear" : "Select All"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {permissionError && <p className="text-red-500 text-xs font-medium mt-2 animate-slideIn">{permissionError}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(route(user, "/roles"))}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isEdit ? "Update Role" : "Create Role"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;
