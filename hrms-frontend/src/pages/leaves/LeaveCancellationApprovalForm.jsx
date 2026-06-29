import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { useSelector } from 'react-redux';
import { useFormik } from 'formik';
import FormInput from '../../components/formValidation/FormInput.jsx';
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

const LeaveCancellationApprovalForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const user = useSelector((state) => state.auth.user);

    const [loading, setLoading] = useState(false);
    const [initialValues, setInitialValues] = useState({});

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

                const { data } = await api.get(`/leave-cancel/${id}`);

                if (
                    isHrUser(user) &&
                    getEmployeeIdFromRecord(data?.employeeId) === getCurrentEmployeeId(user)
                ) {
                    toast.error("You cannot review your own leave cancellation request");
                    navigate(route(user, '/leaves/leave-requests-cancel'));
                    return;
                }

                const leave = data.leaveId || {};

                setInitialValues({
                    employeeId: `${data.employeeId?.employeeNo || ''} - ${data.employeeId?.firstName || ''} ${data.employeeId?.lastName || ''}`,

                    forwardTo: `${data.forwardTo?.employeeNo || ''} - ${data.forwardTo?.firstName || ''} ${data.forwardTo?.lastName || ''}`,

                    leaveType: leave.leaveType?.code || '',

                    appliedDate: formatDate(leave.appliedDate),

                    from: formatDate(leave.from),

                    to: formatDate(leave.to),

                    resumeDate: formatDate(leave.resumeDate),

                    noOfDays: leave.noOfDays || '',

                    isHalfDay: leave.isHalfDay || false,

                    halfDayType: leave.halfDayType || '',

                    halfLeaveForFirstDay: leave.halfLeaveForFirstDay || false,
                    firstDayHalfType: leave.firstDayHalfType || '',
                    halfLeaveForLastDay: leave.halfLeaveForLastDay || false,
                    lastDayHalfType: leave.lastDayHalfType || '',

                    reason: leave.reason || '',

                    remarks: data.remarks || '',

                    sanctionedDays:
                        data.sanctionedDays || leave.noOfDays || '',

                    sanctionOn: data.sanctionOn
                        ? data.sanctionOn.split('T')[0]
                        : new Date().toISOString().split('T')[0],

                    sanctionFrom: data.sanctionFrom
                        ? data.sanctionFrom.split('T')[0]
                        : leave.from?.split('T')[0],

                    sanctionTo: data.sanctionTo
                        ? data.sanctionTo.split('T')[0]
                        : leave.to?.split('T')[0],

                    sanctionedBy: `${data.forwardTo?.employeeNo || ""} - ${data.forwardTo?.firstName || ""} ${data.forwardTo?.lastName || ""}`,

                    sanctionRemarks: data.sanctionRemarks || '',

                    status: data.status === "pending" ? "" : data.status,
                });
            } catch (err) {
            console.error('Request failed:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        validationSchema: leaveApprovalSchema('edit'),

        onSubmit: async (values) => {
            try {
                setLoading(true);

                const res = await api.patch(`/leave-cancel/${id}/approve`, values);
                console.log(res,'data');
                
                toast.success(
                    res.apiMessage
                );

                window.dispatchEvent(new Event('refreshNotifications'));

                formik.resetForm();
                navigate(route(user, '/leaves/leave-requests-cancel'));
            } catch (error) {
            console.error('Request failed:', error);
            } finally {
                setLoading(false);
            }
        },
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
            <span className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => navigate(route(user, '/leaves/leave-requests-cancel'))}>Cancellation Requests</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">Cancellation Review</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Leave Cancellation Review
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review the cancellation details and make a determination.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate(route(user, '/leaves/leave-requests-cancel'))}
          className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm"
        >
          &larr; Back to Requests
        </button>
      </div>

      <form className="space-y-6" onSubmit={formik.handleSubmit}>
        
        {/* Facts Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <h3 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-4">
            Original Leave Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Employee" name="employeeId" formik={formik} type="text" disabled />
            <FormInput label="Forward To" name="forwardTo" formik={formik} type="text" disabled />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Leave Type Code" name="leaveType" formik={formik} type="text" disabled />
            <FormInput label="Applied Date" name="appliedDate" formik={formik} type="text" disabled />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Leave From" name="from" formik={formik} type="text" disabled />
            <FormInput label="Leave To" name="to" formik={formik} type="text" disabled />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Resume Date" name="resumeDate" formik={formik} type="text" disabled />
            <FormInput label="No of Days" name="noOfDays" formik={formik} type="text" disabled />
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
            <FormInput label="Reason for Leave" name="reason" formik={formik} type="text" disabled />
            <FormInput label="Employee Remarks" name="remarks" formik={formik} type="text" disabled />
          </div>
        </div>

        {/* Sanction Details Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <h3 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-4">
            Sanction & Decision Panel
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Sanctioned Days" name="sanctionedDays" formik={formik} disabled />
            <FormInput label="Sanctioned On" name="sanctionOn" formik={formik} type="date" disabled />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Sanctioned From" name="sanctionFrom" formik={formik} type="date" disabled />
            <FormInput label="Sanctioned To" name="sanctionTo" formik={formik} type="date" disabled />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Sanctioned By" name="sanctionedBy" formik={formik} type="text" disabled />
            <FormInput label="Cancellation Remarks/Reason" name="sanctionRemarks" formik={formik} />
          </div>

          {/* Cancellation radio actions */}
          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Cancellation Decision <span className="text-red-500 font-bold">*</span>
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
                <span className="ml-2.5 text-sm font-semibold">Approve Cancellation</span>
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
                <span className="ml-2.5 text-sm font-semibold">Reject Cancellation</span>
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
            onClick={() => navigate(route(user, '/leaves/leave-requests-cancel'))}
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

export default LeaveCancellationApprovalForm;
