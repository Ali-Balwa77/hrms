import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { useSelector } from 'react-redux';
import { useFormik } from 'formik';
import FormInput from '../../components/formValidation/FormInput.jsx';
import FormSelect from '../../components/formValidation/FromSelect.jsx';
import { route } from '../../utils/routeHelper.js';
import { leaveApprovalSchema } from '../../validation/leaveApproval.schema.js';

const getCurrentEmployeeId = (user) =>
  String(user?.employeeId?._id || user?.employeeId || "");

const getEmployeeIdFromRecord = (employee) =>
  String(employee?._id || employee || "");

const isHrUser = (user) =>
  String(user?.role?.name || user?.employeeId?.employeeType || user?.employeeType || "")
    .toLowerCase()
    .trim() === "hr";

const LeaveApprovalForm = () => {
  const { id } = useParams();
  const isEdit = id ? true : false;
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [leaveDetail, setLeaveDetail] = useState(null);
  const leaveBalance = leaveDetail?.employeeId?.leaveBalance || [];
  const [loading, setLoading] = useState(false);
  const [initialValues, setIntialValues] = useState({});

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/leaves/${id}`);

        if (
          isHrUser(user) &&
          getEmployeeIdFromRecord(data?.employeeId) === getCurrentEmployeeId(user)
        ) {
          toast.error("You cannot review your own leave request");
          navigate(route(user, '/leaves/leave-requests'));
          return;
        }

        setLeaveDetail(data);
        setIntialValues({
          employeeId: `${data.employeeId?.employeeNo || ""} - ${data.employeeId?.firstName || ""} ${data.employeeId?.lastName || ""}`,
          forwardTo: `${data.forwardTo?.employeeNo || ""} - ${data.forwardTo?.firstName || ""} ${data.forwardTo?.lastName || ""}`,

          leaveType: data.leaveType?.code || "",
          appliedDate: formatDate(data.appliedDate) || "",
          from: formatDate(data.from) || "",
          to: formatDate(data.to) || "",
          resumeDate: formatDate(data.resumeDate) || "",
          noOfDays: data.noOfDays || "",

          isHalfDay: data.isHalfDay || false,
          halfDayType: data.halfDayType || "",
          halfLeaveForFirstDay: data.halfLeaveForFirstDay || false,
          firstDayHalfType: data.firstDayHalfType || "",
          halfLeaveForLastDay: data.halfLeaveForLastDay || false,
          lastDayHalfType: data.lastDayHalfType || "",

          reason: data.reason || "",
          remarks: data.remarks || "",
          address: data.address || "",
          phone: data.phone || "",


          sanctionedDays: data.noOfDays || "",
          sanctionOn: new Date().toISOString().split("T")[0],
          sanctionFrom: data.from?.split("T")[0],
          sanctionTo: data.to?.split("T")[0],
          sanctionedBy: `${data.forwardTo?.employeeNo || ""} - ${data.forwardTo?.firstName || ""} ${data.forwardTo?.lastName || ""}` ,
          sanctionRemarks: data.sanctionRemarks || "",
          status: data.status === "pending" ? "" : data.status,
        });
      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id ,isEdit]);

  const mode = isEdit ? 'edit' : 'create'
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: leaveApprovalSchema(mode),
    onSubmit: async (values, { validateForm }) => {
      const errors = await validateForm();

      if (Object.keys(errors).length > 0) {
        return;
      }


      try {
        setLoading(true);
        const res = await api.patch(`/leaves/${id}/approve`, values);
        
        toast.success(res.apiMessage);

        window.dispatchEvent(new Event('refreshNotifications'));

        formik.resetForm();
        navigate(route(user,'/leaves/leave-requests'));
      } catch (error) {
        console.error('Request failed:', error);
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {loading && <Loader />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => navigate(route(user, '/dashboard'))}>Dashboard</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => navigate(route(user, '/leaves/leave-requests'))}>Leave Requests</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">Approval</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Leave Approval Review
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review the requested leave details and make a determination.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate(route(user, '/leaves/leave-requests'))}
          className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm"
        >
          &larr; Back to Requests
        </button>
      </div>

      <form className="space-y-6" onSubmit={formik.handleSubmit}>
        
        {/* Leave Request Facts card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <h3 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-4">
            Employee Leave Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Employee" name="employeeId" formik={formik} type='text' disabled />
            <FormInput label="Forwarded To" name="forwardTo" formik={formik} type='text' disabled />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Leave Type Code" name="leaveType" formik={formik} type='text' disabled />
            <FormInput label="Applied Date" name="appliedDate" formik={formik} type="text" disabled />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Leave From" name="from" formik={formik} type="text" disabled />
            <FormInput label="Leave To" name="to" formik={formik} type="text" disabled />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Resume Date" name="resumeDate" formik={formik} type="text" disabled />
            <FormInput label="No of Days Requested" name="noOfDays" formik={formik} type='text' disabled />
          </div>

          {/* Half Day Details */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formik.values.isHalfDay}
                disabled
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded disabled:cursor-not-allowed"
              />
              <span className="ml-3 text-sm font-medium text-slate-700">
                Half Leave
              </span>
            </div>

            {formik.values.isHalfDay && (
              <div className="mt-3 ml-7 space-y-3">
                {/* Single Day Half Leave */}
                {formik.values.halfDayType && (
                  <div className="flex gap-6 items-center">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formik.values.halfDayType === "post"}
                        disabled
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <span className="ml-2 text-sm text-slate-600">
                        Post Leave
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formik.values.halfDayType === "pre"}
                        disabled
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <span className="ml-2 text-sm text-slate-600">
                        Pre Leave
                      </span>
                    </label>
                  </div>
                )}

                {/* First Day Half Leave */}
                {formik.values.halfLeaveForFirstDay && (
                  <div className="flex items-center gap-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formik.values.halfLeaveForFirstDay}
                        disabled
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-slate-700">
                        Half Leave For Firstday
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="firstDayHalfType"
                        checked={formik.values.firstDayHalfType === "post"}
                        disabled
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <span className="ml-2 text-sm text-slate-600">
                        Post Leave
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="firstDayHalfType"
                        checked={formik.values.firstDayHalfType === "pre"}
                        disabled
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <span className="ml-2 text-sm text-slate-600">
                        Pre Leave
                      </span>
                    </label>
                  </div>
                )}

                {/* Last Day Half Leave */}
                {formik.values.halfLeaveForLastDay && (
                  <div className="flex items-center gap-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formik.values.halfLeaveForLastDay}
                        disabled
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-slate-700">
                        Half Leave For Last Day
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="lastDayHalfType"
                        checked={formik.values.lastDayHalfType === "post"}
                        disabled
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <span className="ml-2 text-sm text-slate-600">
                        Post Leave
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="lastDayHalfType"
                        checked={formik.values.lastDayHalfType === "pre"}
                        disabled
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <span className="ml-2 text-sm text-slate-600">
                        Pre Leave
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Reason for Leave" name="reason" formik={formik} type='text' disabled />
            <FormInput label="Remarks" name="remarks" formik={formik} type='text' disabled />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Address while on leave" name="address" formik={formik} type='text' disabled />
            <FormInput label="Phone no while on leave" name="phone" formik={formik} type='text' disabled />
          </div>
        </div>

        {/* Leave Balances and Determination card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <h3 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-4">
            Sanction & Decision Panel
          </h3>

          {/* Balance Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100/60">
            <div className="bg-white rounded-lg p-3.5 border border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Leave Balance Available</span>
              <span className="text-2xl font-bold text-slate-800">
                {leaveBalance?.find(x => x.leaveType === formik.values.leaveType)?.totalLeave || 0}
              </span>
            </div>
            <div className="bg-white rounded-lg p-3.5 border border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Under Consideration Request</span>
              <span className="text-2xl font-bold text-brand-600">
                {formik.values.noOfDays}
              </span>
            </div>
          </div>

          {/* Sanction inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Sanctioned No. of Days" name="sanctionedDays" formik={formik} />
            <FormInput label="Sanctioned On" name="sanctionOn" formik={formik} type="date" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Sanction From" name="sanctionFrom" formik={formik} type="date" />
            <FormInput label="Sanction To" name="sanctionTo" formik={formik} type="date" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Sanctioned By" name="sanctionedBy" formik={formik} type='text' disabled />
            <FormInput label="Remarks/Reason" name="sanctionRemarks" formik={formik} />
          </div>

          {/* Radio actions for determination */}
          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Decision Status <span className="text-red-500 font-bold">*</span>
            </label>
            
            <div className="flex flex-wrap gap-4">
              <label className={`flex items-center cursor-pointer px-5 py-3 rounded-xl border transition-all duration-200 ${
                formik.values.status === "approved"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="approved"
                  checked={formik.values.status === "approved"}
                  onChange={() => formik.setFieldValue("status", "approved")}
                  onBlur={() => formik.setFieldTouched("status", true)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-colors"
                />
                <span className="ml-2.5 text-sm font-semibold">Sanction (Approve)</span>
              </label>

              <label className={`flex items-center cursor-pointer px-5 py-3 rounded-xl border transition-all duration-200 ${
                formik.values.status === "rejected"
                  ? "bg-rose-50 border-rose-300 text-rose-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="rejected"
                  checked={formik.values.status === "rejected"}
                  onChange={() => formik.setFieldValue("status", "rejected")}
                  onBlur={() => formik.setFieldTouched("status", true)}
                  className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-slate-300 transition-colors"
                />
                <span className="ml-2.5 text-sm font-semibold">Reject</span>
              </label>
            </div>
            
            {formik.touched.status && formik.errors.status && (
              <p className="text-red-500 text-xs font-medium mt-2 animate-slideIn">
                {formik.errors.status}
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(route(user, '/leaves/leave-requests'))}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
          >
            Save Decision
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveApprovalForm;
