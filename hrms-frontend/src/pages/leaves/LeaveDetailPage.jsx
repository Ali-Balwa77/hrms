import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { useSelector } from 'react-redux';
import { useFormik } from 'formik';
import FormInput from '../../components/formValidation/FormInput.jsx';
import FormSelect from '../../components/formValidation/FromSelect.jsx';
import { leaveSchema } from '../../validation/leave.schema.js';
import { route } from '../../utils/routeHelper.js';
import DatePicker from "react-datepicker";


const LeaveDetailPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [forwardTo, setForwardTo] = useState('');
  const [employeeList, setEmployeeList] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState('');

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const initialValues = {
    forwardTo: "",
    leaveType: "",
    appliedDate: formatDate(new Date()),
    from: "",
    to: "",
    resumeDate: "",
    coffDate: "",
    noOfDays: "",
    isHalfDay: false,
    halfDayType: "",
    halfLeaveForFirstDay: false,
    firstDayHalfType: "",
    halfLeaveForLastDay: false,
    lastDayHalfType: "",
    prefix: "",
    suffix: "",
    reason: "",
    remarks: "",
    address: "",
    phone: ""
  };


  useEffect(() => {
    const loadData = async () => {
      try {

        setLoading(true);


        if (isEdit && id) {
          const { data } = await api.get(`/leaves/${id}`);

          setEmployeeName(
            data?.employeeId
              ? `${data.employeeId.employeeNo} - ${data.employeeId.firstName} ${data.employeeId.lastName}`
              : ''
          );

          setForwardTo(data?.employeeId?._id || '');

          formik.setValues({
            forwardTo: data.forwardTo?._id || "",
            leaveType: data.leaveType?._id || "",
            appliedDate: formatDate(data.appliedDate) || "",
            from: data.from?.split("T")[0] || "",
            to: data.to?.split("T")[0] || "",
            resumeDate: data.resumeDate?.split("T")[0] || "",
            coffDate: data.coffDate?.split("T")[0] || "",
            noOfDays: data.noOfDays || "",
            isHalfDay: data.isHalfDay || false,
            halfDayType: data.halfDayType || "",
            halfLeaveForFirstDay: data.halfLeaveForFirstDay || false,
            firstDayHalfType: data.firstDayHalfType || "",
            halfLeaveForLastDay: data.halfLeaveForLastDay || false,
            lastDayHalfType: data.lastDayHalfType || "",
            prefix: data.prefix || "",
            suffix: data.suffix || "",
            reason: data.reason || "",
            remarks: data.remarks || "",
            address: data.address || "",
            phone: data.phone || "",
            sanctionOn: formatDate(data.sanctionOn) || "",
            sanctionedDays: data.sanctionedDays || data.noOfDays || "",
            sanctionFrom: formatDate(data.sanctionFrom) || "",
            sanctionTo: formatDate(data.sanctionTo) || "",
            sanctionedBy: data.sanctionedBy ? `${data?.sanctionedBy?.empID} - ${data?.sanctionedBy?.name}` : null,
            sanctionRemarks: data.sanctionRemarks || "",
            status: data.status || "pending"
          });
        }


        if (!isEdit && user) {
          setEmployeeName(`${user.empID} - ${user.name}`);

          const employeeId =
            typeof user.employeeId === "object"
              ? user.employeeId?._id
              : user.employeeId;

          setForwardTo(employeeId || "");
        }

      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEdit, user]);

  useEffect(() => {
    const loadEmployees = async () => {
      const employeeId =
        typeof forwardTo === "object" ? forwardTo?._id : forwardTo;

      if (!employeeId) return;

      try {
        const res = await api.get(`/employees/${employeeId}`);
        setEmployeeList(res?.data?.data || res?.data || null);
      } catch (error) {
        console.error("Request failed:", error);
        setEmployeeList(null);
      }
    };

    loadEmployees();
  }, [forwardTo]);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const res = await api.get('/leave-type');

        setLeaveTypes((Array.isArray(res?.data) ? res.data : (res?.data?.data || [])));
      } catch (error) {
      console.error('Request failed:', error);
      }
    };

    fetchLeaveTypes();
  }, []);

  const formatLocalDate = (date) => {

    if (!date) return '';

    const d = new Date(date);

    const year = d.getFullYear();

    const month = String(
      d.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      d.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const mode = isEdit ? 'edit' : 'create'
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: leaveSchema(mode),
    isEdit: !isEdit,
    onSubmit: async (values) => {

      try {
        setLoading(true);
        const payload = {

          ...values,

          from: formatLocalDate(values.from),

          to: formatLocalDate(values.to),

          resumeDate: formatLocalDate(values.resumeDate),

          coffDate: values.coffDate
            ? formatLocalDate(values.coffDate)
            : '',

          noOfDays: values.noOfDays
        };
        if (!isEdit) {
          await api.post('/leaves', payload);
          toast.success('Leave request submitted successfully');
        } else {
          await api.patch(`/leaves/${id}`, payload);
          toast.success('Leave request updated successfully');
        }
        formik.resetForm();
        navigate(route(user,'/leaves/application'), { state: { refreshAt: Date.now() } });
      } catch (error) {
      console.error('Request failed:', error);
      } finally {
        setLoading(false);
      }
    }
  });

  const forwardToOptions = useMemo(() => {
    return (employeeList?.leaveForwardTo || [])
      .filter((emp) => emp?.status === "active")
      .map((emp) => ({
        label: `${emp.employeeNo} - ${emp.firstName} ${emp.lastName}`,
        value: emp._id,
      }));
  }, [employeeList]);

  const isApproved = formik.values.status === "approved";
  const isRejected = formik.values.status === "rejected";
  const isCancelled = formik.values.status === "cancelled";

  const isReadOnly = isApproved || isRejected || isCancelled

  const parseInputDate = (dateStr) => {
    if (!dateStr) return null;

    if (dateStr instanceof Date) {
      return dateStr;
    }

    if (typeof dateStr !== "string") {
      return null;
    }

    const parts = dateStr.split("-");

    if (parts.length !== 3) {
      return null;
    }

    const [year, month, day] = parts;

    return new Date(year, month - 1, day);
  };

  const isMultiDayLeave = (() => {
    const start = parseInputDate(formik.values.from);
    const end = parseInputDate(formik.values.to);

    if (!start || !end) return false;

    return start.toDateString() !== end.toDateString();
  })();

  useEffect(() => {
    if (!formik.values.isHalfDay) {
      formik.setFieldValue("halfDayType", "", false);
      formik.setFieldValue("halfLeaveForFirstDay", false, false);
      formik.setFieldValue("firstDayHalfType", "", false);
      formik.setFieldValue("halfLeaveForLastDay", false, false);
      formik.setFieldValue("lastDayHalfType", "", false);
      return;
    }

    if (!isMultiDayLeave) {
      formik.setFieldValue("halfLeaveForFirstDay", false, false);
      formik.setFieldValue("firstDayHalfType", "", false);
      formik.setFieldValue("halfLeaveForLastDay", false, false);
      formik.setFieldValue("lastDayHalfType", "", false);
    } else {
      formik.setFieldValue("halfDayType", "", false);
    }
  }, [formik.values.isHalfDay, isMultiDayLeave]);

  useEffect(() => {
    const {
      from,
      to,
      isHalfDay,
      halfLeaveForFirstDay,
      halfLeaveForLastDay
    } = formik.values;

    if (from && to) {
      const start = parseInputDate(from);
      const end = parseInputDate(to);

      if (!start || !end || start > end) {
        formik.setFieldValue("noOfDays", "");
        return;
      }

      let count = 0;
      let current = new Date(start);

      while (current <= end) {
        const day = current.getDay();

        if (day !== 0 && day !== 6) {
          count++;
        }

        current.setDate(current.getDate() + 1);
      }

      const isSingleDay = start.toDateString() === end.toDateString();

      if (isHalfDay) {
        if (isSingleDay) {
          count = 0.5;
        } else {
          if (halfLeaveForFirstDay) count -= 0.5;
          if (halfLeaveForLastDay) count -= 0.5;
        }
      }

      formik.setFieldValue("noOfDays", Number(Math.max(count, 0).toFixed(1)));
    }
  }, [
    formik.values.from,
    formik.values.to,
    formik.values.isHalfDay,
    formik.values.halfLeaveForFirstDay,
    formik.values.halfLeaveForLastDay
  ]);

  const getLeaveKey = (value) => String(value || "").trim().toUpperCase();

  const getBalanceLeaveKey = (balance) => {
    if (!balance) return "";

    if (typeof balance.leaveType === "object") {
      return getLeaveKey(balance.leaveType?.code || balance.leaveType?.name);
    }

    return getLeaveKey(balance.leaveType);
  };

  const employeeLeaveBalance = Array.isArray(employeeList?.leaveBalance)
    ? employeeList.leaveBalance
    : [];

  const employeeType = employeeList?.employeeType || user?.role?.name || "";
  const isIntern = String(employeeType).toLowerCase() === "intern";

  const filteredLeaveTypes = leaveTypes.filter((leave) => {
    const isActive = leave.status === true;

    if (!isActive) return false;

    const leaveCode = getLeaveKey(leave.code);
    const allocationMode = String(leave.allocationMode || "").toLowerCase();

    const isProbationLeave =
      leaveCode === "PROBATION"
    const isQuarterlyLeave = allocationMode === "quarterly";

    // Probation leave only Intern employee ne show thavi joiye
    if (isProbationLeave && !isIntern) {
      return false;
    }

    // Intern ne Probation + LWP only show karvu
    if (isIntern && !["LWP", "PROBATION", "PROB"].includes(leaveCode)) {
      return false;
    }

    // Quarterly leave employee na leaveBalance ma allocated hoy to j dropdown ma show thavi joiye
    if (isQuarterlyLeave) {
      return employeeLeaveBalance.some((balance) => {
        const balanceLeaveKey = getBalanceLeaveKey(balance);

        return (
          balanceLeaveKey === leaveCode
        );
      });
    }

    // Non-intern employee ne Probation na show karvi
    if (!isIntern && isProbationLeave) {
      return false;
    }

    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {loading && <Loader />}
      
      {/* Breadcrumbs and Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => navigate(route(user, '/dashboard'))}>Dashboard</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => navigate(route(user, '/leaves/application'))}>Leave Application</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">{isEdit ? 'Edit Request' : 'New Request'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isEdit ? 'Edit Leave Request' : 'Apply for Leave'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Submit your leave request for approval and track its status.</p>
        </div>
        
        <button
          type="button"
          onClick={() => navigate(route(user,'/leaves/application'))}
          className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm"
        >
          &larr; Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Container */}
        <form className="lg:col-span-2 space-y-6" onSubmit={formik.handleSubmit}>
          
          {/* Card 1: Leave Basics */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-semibold text-slate-800 text-base">Leave Period & Type</h3>
              <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">Applied on: {formik.values.appliedDate || formatDate(new Date())}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Employee
                </label>

                <div title={employeeName} className="w-full">
                  <input
                    type="text"
                    value={employeeName}
                    disabled
                    className="w-full bg-slate-50 border border-slate-100 text-slate-500 text-sm px-4 py-2.5 rounded-xl cursor-not-allowed truncate overflow-hidden whitespace-nowrap text-ellipsis"
                  />
                </div>
              </div>

              <FormSelect
                label="Forward To"
                name="forwardTo"
                formik={formik}
                options={forwardToOptions}
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Leave Type"
                name="leaveType"
                formik={formik}
                options={filteredLeaveTypes.map((leave) => ({
                  label: leave.code,
                  value: leave._id
                }))}
                required
                disabled={isReadOnly}
              />

              <FormInput
                label="No of Days"
                name="noOfDays"
                type="text"
                formik={formik}
                disabled
                required
              />
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <FormInput
                label="Leave From"
                name="from"
                type="date"
                formik={formik}
                required
                disabled={isReadOnly}
              />

              <FormInput
                label="Leave To"
                name="to"
                type="date"
                formik={formik}
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Resume Date"
                name="resumeDate"
                type="date"
                formik={formik}
                required
                disabled={isReadOnly}
              />

              <FormInput
                label="C/off Present Date (If applicable)"
                name="coffDate"
                type="date"
                formik={formik}
                disabled={isReadOnly}
              />
            </div>

            {/* Half Day Option */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80 space-y-3">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="isHalfDay"
                  id="isHalfDay"
                  checked={formik.values.isHalfDay}
                  onChange={(e) => formik.setFieldValue("isHalfDay", e.target.checked)}
                  disabled={isReadOnly}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="ml-3 text-sm font-medium text-slate-700">Half Leave</span>
              </label>

              {formik.values.isHalfDay && !isMultiDayLeave && (
                <div className="ml-7 flex flex-wrap gap-6 items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="halfDayType"
                      value="pre"
                      checked={formik.values.halfDayType === "pre"}
                      onChange={() => formik.setFieldValue("halfDayType", "pre")}
                      disabled={isReadOnly}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 transition-colors cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-slate-600">Pre Leave</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="halfDayType"
                      value="post"
                      checked={formik.values.halfDayType === "post"}
                      onChange={() => formik.setFieldValue("halfDayType", "post")}
                      disabled={isReadOnly}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 transition-colors cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-slate-600">Post Leave</span>
                  </label>
                </div>
              )}

              {formik.values.isHalfDay && isMultiDayLeave && (
                <div className="space-y-3 ml-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center cursor-pointer min-w-[170px]">
                      <input
                        type="checkbox"
                        name="halfLeaveForFirstDay"
                        checked={formik.values.halfLeaveForFirstDay}
                        onChange={(e) => {
                          formik.setFieldValue("halfLeaveForFirstDay", e.target.checked);
                          if (!e.target.checked) formik.setFieldValue("firstDayHalfType", "");
                        }}
                        disabled={isReadOnly}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-slate-700">Half Leave For Firstday</span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="firstDayHalfType"
                        value="pre"
                        checked={formik.values.firstDayHalfType === "pre"}
                        onChange={() => formik.setFieldValue("firstDayHalfType", "pre")}
                        disabled={isReadOnly || !formik.values.halfLeaveForFirstDay}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="ml-2 text-sm text-slate-600">Pre Leave</span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="firstDayHalfType"
                        value="post"
                        checked={formik.values.firstDayHalfType === "post"}
                        onChange={() => formik.setFieldValue("firstDayHalfType", "post")}
                        disabled={isReadOnly || !formik.values.halfLeaveForFirstDay}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="ml-2 text-sm text-slate-600">Post Leave</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center cursor-pointer min-w-[170px]">
                      <input
                        type="checkbox"
                        name="halfLeaveForLastDay"
                        checked={formik.values.halfLeaveForLastDay}
                        onChange={(e) => {
                          formik.setFieldValue("halfLeaveForLastDay", e.target.checked);
                          if (!e.target.checked) formik.setFieldValue("lastDayHalfType", "");
                        }}
                        disabled={isReadOnly}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-slate-700">Half Leave For Last Day</span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="lastDayHalfType"
                        value="pre"
                        checked={formik.values.lastDayHalfType === "pre"}
                        onChange={() => formik.setFieldValue("lastDayHalfType", "pre")}
                        disabled={isReadOnly || !formik.values.halfLeaveForLastDay}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="ml-2 text-sm text-slate-600">Pre Leave</span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="lastDayHalfType"
                        value="post"
                        checked={formik.values.lastDayHalfType === "post"}
                        onChange={() => formik.setFieldValue("lastDayHalfType", "post")}
                        disabled={isReadOnly || !formik.values.halfLeaveForLastDay}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="ml-2 text-sm text-slate-600">Post Leave</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Prefix & Suffix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <FormInput
                label="Prefix"
                name="prefix"
                formik={formik}
                disabled={isReadOnly}
              />
              <FormInput
                label="Suffix"
                name="suffix"
                formik={formik}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Card 2: Contact and Reason */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-4">Reason & Contact Details</h3>

            <FormInput
              label="Reason for Leave"
              name="reason"
              type="text"
              formik={formik}
              required
              disabled={isReadOnly}
            />

            <FormInput
              label="Address while on leave"
              name="address"
              type="text"
              formik={formik}
              disabled={isReadOnly}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Phone number on leave"
                name="phone"
                type="text"
                formik={formik}
                disabled={isReadOnly}
              />
              <FormInput
                label="Handover remarks"
                name="remarks"
                type="text"
                formik={formik}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Card 3: Sanction Details (Read-only View) */}
          {isReadOnly && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-semibold text-slate-800 text-base">Sanction Details</h3>
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  isApproved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  isRejected ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {formik.values.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Sanctioned On" name="sanctionOn" formik={formik} type="text" disabled />
                <FormInput label="Sanctioned Days" name="sanctionedDays" formik={formik} disabled />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Sanctioned From" name="sanctionFrom" formik={formik} type="text" disabled />
                <FormInput label="Sanctioned To" name="sanctionTo" formik={formik} type="text" disabled />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Sanctioned By" name="sanctionedBy" formik={formik} type='text' disabled />
                <FormInput label="Remarks/Reason" name="sanctionRemarks" formik={formik} disabled />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(route(user,'/leaves/application'))}
              className="px-5 py-2.5 border border-slate-205 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-500/10"
              >
                {isEdit ? "Update" : "Save"}
              </button>
            )}
          </div>
        </form>

        {/* Right Info Sidebar Panel */}
        {/* <div className="space-y-6">
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 text-white rounded-2xl shadow-sm p-6 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-10">
              <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-2-1.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
            </div>
            
            <h4 className="font-semibold text-white/90 text-sm tracking-wider uppercase mb-1">Leave Policy Tip</h4>
            <h3 className="text-xl font-bold mb-4">Planning your off?</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Ensure you apply at least 3 days in advance for short leaves, and 2 weeks in advance for planned long holidays. 
              Always list a backup team member as a point of contact in your handover remarks!
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-50 pb-2">Guidelines</h4>
            <ul className="space-y-3 text-xs text-slate-500">
              <li className="flex gap-2.5">
                <span className="text-brand-500 font-bold">•</span>
                <span>Weekends (Saturdays and Sundays) are automatically excluded from the leave count logic.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-brand-500 font-bold">•</span>
                <span>First and Second half checkboxes will calibrate the number of days as 0.5 automatically.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-brand-500 font-bold">•</span>
                <span>Once approved, you will have to file a Cancellation Request instead of editing the form.</span>
              </li>
            </ul>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default LeaveDetailPage;
