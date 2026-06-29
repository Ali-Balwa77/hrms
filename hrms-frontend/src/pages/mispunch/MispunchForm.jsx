import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import { api } from "../../services/api.js";
import Loader from "../../components/common/Loader.jsx";
import FormInput from "../../components/formValidation/FormInput.jsx";
import FormSelect from "../../components/formValidation/FromSelect.jsx";
import { route } from "../../utils/routeHelper.js";
import {
  mispunchSchema,
  mispunchDecisionSchema,
} from "../../validation/mispunch.schema.js";

const pad = (value) => String(value).padStart(2, "0");
const hours = Array.from({ length: 24 }, (_, index) => pad(index));
const minutes = Array.from({ length: 60 }, (_, index) => pad(index));

const formatDateDisplay = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

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

const splitTime = (value) => {
  const [hh = "00", mm = "00"] = String(value || "00:00").split(":");
  return { hh: pad(hh), mm: pad(mm) };
};

const getCurrentEmployeeId = (user) =>
  String(user?.employeeId?._id || user?.employeeId || "");

const getEmployeeIdFromRecord = (employee) =>
  String(employee?._id || employee || "");

const isHrUser = (user) =>
  String(user?.role?.name || user?.employeeId?.employeeType || user?.employeeType || "")
    .toLowerCase()
    .trim() === "hr";

export default function MispunchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

  const isEdit = Boolean(id);
  const isApproval = location.pathname.includes("/approval/");

  const [loading, setLoading] = useState(false);
  const [approvers, setApprovers] = useState([]);
  const [originalStatus, setOriginalStatus] = useState("pending");

  const employeeId = useMemo(
    () => user?.employeeId?._id || user?.employeeId || "",
    [user]
  );

  const loadEmployeeApprovers = async (targetEmployeeId) => {
    if (!targetEmployeeId) return;

    const res = await api.get(`/employees/${targetEmployeeId}`);
    const employee = res?.data || {};
    const forwardToList = Array.isArray(employee.leaveForwardTo)
      ? employee.leaveForwardTo
      : [];

    const displayName = `${employee.employeeNo || user?.empID || ""} - ${
      employee.firstName || ""
    } ${employee.lastName || ""}`.trim();

    setApprovers(forwardToList);

    formik.setValues((prev) => ({
      ...prev,
      employeeName: displayName,
      forwardTo: prev.forwardTo || "",
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (isEdit && id) {
          const res = await api.get(`/mispunch/${id}`);
          const data = res?.data || {};

          if (
            isApproval &&
            isHrUser(user) &&
            getEmployeeIdFromRecord(data?.employeeId) === getCurrentEmployeeId(user)
          ) {
            toast.error("You cannot review your own mispunch request");
            navigate(route(user, "/mispunch/requests"));
            return;
          }

          const start = splitTime(data.startTime);
          const end = splitTime(data.endTime);

          const displayName = data.employeeId
            ? `${data.employeeId.employeeNo || ""} - ${
                data.employeeId.firstName || ""
              } ${data.employeeId.lastName || ""}`.trim()
            : "";

          setApprovers(data.forwardTo ? [data.forwardTo] : []);
          setOriginalStatus(data.status || "pending");    
          formik.setValues({
            employeeName: displayName,
            forwardTo: data.forwardTo?._id || "",
            appliedDate: formatDate(data.appliedDate),
            mispunchDate: data.mispunchDate?.split('T')[0],
            startHour: start.hh,
            startMinute: start.mm,
            endHour: end.hh,
            endMinute: end.mm,
            reason: data.reason || "",
            remarks: data.remarks || "",
            mispunchOccurs: data.mispunchOccurs || "post",
            sanctionRemarks: data.sanctionRemarks || "",
            status: isApproval ? "" : data.status || "pending",
          });
        } else {
          const displayName = `${user?.empID || ""} - ${user?.name || ""}`.trim();

          formik.setValues((prev) => ({
            ...prev,
            employeeName: displayName,
            appliedDate: formatDate(new Date()),
          }));

          await loadEmployeeApprovers(employeeId);
        }
      } catch (error) {
        console.error("Request failed:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, employeeId]);


  const formik = useFormik({
    initialValues: {
      employeeName: "",
      forwardTo: "",
      appliedDate: formatDate(new Date()),
      mispunchDate: null,
      startHour: "00",
      startMinute: "00",
      endHour: "00",
      endMinute: "00",
      reason: "",
      remarks: "",
      mispunchOccurs: "post",
      sanctionRemarks: "",
      status: "",
    },
    enableReinitialize: true,
    validationSchema: isApproval
      ? mispunchDecisionSchema("edit")
      : mispunchSchema(isEdit ? "edit" : "create"),
    onSubmit: async (values) => {
      try {
        setLoading(true);

        const payload = {
          ...values,
          mispunchDate: formatLocalDate(values.mispunchDate),
          startTime: `${values.startHour}:${values.startMinute}`,
          endTime: `${values.endHour}:${values.endMinute}`,
        };

        if (isEdit) {
          await api.patch(`/mispunch/${id}`, payload);
          toast.success("Mispunch request updated successfully");
        } else {
          await api.post("/mispunch", payload);
          toast.success("Mispunch request submitted successfully");
        }

        navigate(route(user, "/mispunch/application"), {
          state: { refreshAt: Date.now() },
        });
      } catch (error) {
        console.error(
          error.response?.data?.message ||
            error.message ||
            "Failed to save mispunch request"
        );
      } finally {
        setLoading(false);
      }
    },
  });

  const readOnly = isApproval || (isEdit && formik.values.status !== "pending");

  const handleDecision = async () => {
    try {
      const values = {
        status: formik.values.status,
        sanctionRemarks: formik.values.sanctionRemarks,
      }
    
      await mispunchDecisionSchema("edit").validate(values, {
        abortEarly: false,
      });

      setLoading(true);

      const res = await api.patch(`/mispunch/${id}/approve`, {
        status: formik.values.status,
        sanctionRemarks: formik.values.sanctionRemarks.trim(),
      });

      toast.success(res.apiMessage);

      window.dispatchEvent(new Event('refreshNotifications'));

      navigate(route(user, "/mispunch/requests"))
    } catch (error) {
      if (error?.name === "ValidationError") {
        const formErrors = {};

        error.inner?.forEach((err) => {
          if (err.path) {
            formErrors[err.path] = err.message;
            formik.setFieldTouched(err.path, true, false);
          }
        });

        formik.setErrors(formErrors);
        return;
      }
      console.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit decision"
      );
    } finally {
      setLoading(false);
    }
  };

  const approverOptions = approvers.map((employee) => ({
    value: employee._id,
    label: `${employee.employeeNo ? `${employee.employeeNo} - ` : ""}${
      employee.firstName
    } ${employee.lastName}`,
  }));

  const hourOptions = hours.map((hour) => ({
    value: hour,
    label: hour,
  }));

  const minuteOptions = minutes.map((minute) => ({
    value: minute,
    label: minute,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {loading && <Loader />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span
              className="cursor-pointer hover:text-brand-500 transition-colors"
              onClick={() => navigate(route(user, "/dashboard"))}
            >
              Dashboard
            </span>
            <span>/</span>
            <span
              className="cursor-pointer hover:text-brand-500 transition-colors"
              onClick={() =>
                navigate(
                  route(
                    user,
                    isApproval ? "/mispunch/requests" : "/mispunch/application"
                  )
                )
              }
            >
              Mispunch
            </span>
            <span>/</span>
            <span className="text-slate-600 font-medium">
              {isApproval ? "Approval" : isEdit ? "Edit" : "New"}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isApproval
              ? "Mispunch Approval"
              : isEdit
              ? "Edit Mispunch Application"
              : "Mispunch Application"}
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Manage missed attendance punch correction details.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              route(
                user,
                isApproval ? "/mispunch/requests" : "/mispunch/application"
              )
            )
          }
          className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm"
        >
          &larr; Back to List
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <h3 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-4 mb-2">
            Mispunch Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
            <FormInput
              label="Employees"
              name="employeeName"
              formik={formik}
              type="text"
              disabled
            />

            <FormSelect
              label="Forward To"
              name="forwardTo"
              formik={formik}
              options={approverOptions}
              disabled={readOnly}
              required
            />

            <FormInput
              label="Applied Date"
              name="appliedDate"
              formik={formik}
              type="text"
              disabled
            />

            <FormInput 
              label="Mispunch Date" 
              name="mispunchDate" 
              formik={formik} 
              type="date" 
              required 
              disabled={readOnly} 
              allowWeekends={true} 
            />


            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Start Time <span className="text-red-500 font-bold">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  name="startHour"
                  formik={formik}
                  options={hourOptions}
                  disabled={readOnly}
                />

                <FormSelect
                  name="startMinute"
                  formik={formik}
                  options={minuteOptions}
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                End Time <span className="text-red-500 font-bold">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  name="endHour"
                  formik={formik}
                  options={hourOptions}
                  disabled={readOnly}
                />

                <FormSelect
                  name="endMinute"
                  formik={formik}
                  options={minuteOptions}
                  disabled={readOnly}
                />
              </div>

              {formik.touched.endMinute && formik.errors.endMinute && (
                <p className="text-xs text-red-500 mt-1">
                  {formik.errors.endMinute}
                </p>
              )}
            </div>
          </div>

          <FormInput
            label="Reason"
            name="reason"
            formik={formik}
            type="text"
            disabled={readOnly}
            placeholder="Enter reason..."
            required
          />

          <FormInput
            label="Remarks"
            name="remarks"
            formik={formik}
            type="text"
            disabled={readOnly}
            placeholder="Enter remarks..."
          />

          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Mispunch Occurs
            </label>

            <div className="flex items-center gap-6 text-sm text-slate-600 bg-slate-50/70 border border-slate-100 rounded-xl px-4 py-3">
              <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="mispunchOccurs"
                  value="post"
                  checked={formik.values.mispunchOccurs === "post"}
                  onChange={formik.handleChange}
                  disabled={readOnly}
                  className="accent-brand-600"
                />
                Post
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="mispunchOccurs"
                  value="pre"
                  checked={formik.values.mispunchOccurs === "pre"}
                  onChange={formik.handleChange}
                  disabled={readOnly}
                  className="accent-brand-600"
                />
                Pre
              </label>
            </div>
          </div>

          {isApproval && (
            <div className="border-t border-slate-100 pt-5">
              <h3 className="font-semibold text-slate-800 text-base mb-4">
                Approval Decision
              </h3>

              <FormInput
                label="Decision Remarks"
                name="sanctionRemarks"
                formik={formik}
                type="text"
                placeholder="Enter decision remarks..."
              />

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
                      onChange={() => {
                        formik.setFieldValue("status", "approved");
                        formik.setFieldTouched("status", true, false);
                        formik.setFieldError("status", "");
                      }} 
                      onBlur={() => formik.setFieldTouched("status", true)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-colors"
                    />
                    <span className="ml-2.5 text-sm font-semibold">Approve</span>
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
                      onChange={() => {
                        formik.setFieldValue("status", "rejected");
                        formik.setFieldTouched("status", true, false);
                        formik.setFieldError("status", "");
                      }}  
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
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() =>
                navigate(
                  route(
                    user,
                    isApproval ? "/mispunch/requests" : "/mispunch/application"
                  )
                )
              }
              className="px-5 py-2.5 border border-slate-205 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              Cancel
            </button>

            {!isApproval && originalStatus === "pending" && (
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-500/10"
              >
                {isEdit ? "Update" : "Save"}
              </button>
            )}

            {isApproval && originalStatus === "pending" && (
              <button
                type="button"
                onClick={handleDecision}
                className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
              >
                Save
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}