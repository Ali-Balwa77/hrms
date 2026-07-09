import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { showErrorToast } from '../../utils/toastHelper';
import { useSelector } from 'react-redux';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import PermissionGuard from '../../components/auth/PermissionGuard.jsx';
import { useFormik } from 'formik';
import { employeeSchema } from '../../validation/employee.schema.js';
import FormInput from '../../components/formValidation/FormInput.jsx';
import FormSelect from '../../components/formValidation/FromSelect.jsx';
import MultiSelect from '../../components/formValidation/MultiSelect.jsx';

import { route } from '../../utils/routeHelper.js';


const EmployeeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [organizations, setOrganizations] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [designationList, setDesignationList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.auth.user);

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

  useEffect(() => {
    const loadEmployee = async () => {
      if (!isEdit) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/employees/${id}`);

        formik.setValues({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          officeEmail: data.officeEmail || "",
          gender: data.gender || "",
          phone: data.phone ? `+91 ${data.phone}` : "+91 ",
          dob: data.dob ? data.dob.substring(0, 10) : "",
          joinDate: data.joinDate ? data.joinDate.substring(0, 10) : "",
          probationPeriodMonths: data.probationPeriodMonths ?? 6,
          department: data.department || "",
          designation: data.designation || "",
          organization: data.organization?._id || "",
          employeeType: data.employeeType || "",
          leaveForwardTo: data.leaveForwardTo?.map(emp => ({
            label: `${emp.firstName} ${emp.lastName}`,
            value: emp._id
          })) || [],
        });

      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const loadOrganizations = async () => {
      try {
        const { data } = await api.get('/organizations');
        setOrganizations(data);
      } catch (err) {
      console.error('Request failed:', err);
      }
    };

    const loadTlEmployee = async () => {
      try {
        const res = await api.get(`/employees/teamLeads`);

        setEmployeeList((Array.isArray(res?.data) ? res.data : (res?.data?.data || [])));
      } catch (err) {
      console.error('Request failed:', err);
      }
    }

    const fetchDesignations = async () => {
      try {
        const res = await api.get("/designations/active");

        setDesignationList((Array.isArray(res?.data) ? res.data : (res?.data?.data || [])));
      } catch (error) {
        showErrorToast("Failed to load designations");
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await api.get("/role/active");

        const roles = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

        const filteredRoles = roles.filter((role) => {
          const roleName = role?.name?.toLowerCase()?.trim();

          return roleName !== "admin";
        });

        setRoleList(filteredRoles);
      } catch (error) {
        console.error("Role load failed:", error);
        showErrorToast("Failed to load roles");
      }
    };

    loadEmployee();
    loadOrganizations();
    loadTlEmployee();
    fetchDesignations();
    fetchRoles();
  }, [isEdit, id]);

  const initialValues = {
    firstName: "",
    lastName: "",
    email: "",
    officeEmail: "",
    gender: "",
    phone: "+91 ",
    dob: "",
    designation: "",
    department: "",
    joinDate: "",
    probationPeriodMonths: 6,
    employeeType: "",
    organization: "",
    leaveForwardTo: [],
  };

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: employeeSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setLoading(true);

        const probationPeriodMonths =
          values.probationPeriodMonths === "" ||
          values.probationPeriodMonths === null ||
          values.probationPeriodMonths === undefined
            ? undefined
            : Number(values.probationPeriodMonths);

        const payload = {
          ...values,
          leaveForwardTo: values.leaveForwardTo.map(item => item.value),
          dob: formatLocalDate(values.dob),
          joinDate: formatLocalDate(values.joinDate),
          phone: values.phone.replace(/^\+91\s?/, "").trim(),
        };

        if (probationPeriodMonths !== undefined) {
          payload.probationPeriodMonths = probationPeriodMonths;
        } else {
          delete payload.probationPeriodMonths;
        }

        if (!isEdit) {
          await api.post('/employees', payload);
          toast.success('Employee created successfully!');
        } else {
          await api.patch(`/employees/${id}`, payload);
          toast.success('Employee updated');
        }

        navigate(route(user,'/employees'));
        formik.resetForm();
      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    }
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {loading && <Loader />}
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
        <div>
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2.5 py-1 rounded-full"> Roster Control</span>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-2.5">
            {isEdit ? 'Update Employee Profile' : 'Register New Employee'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isEdit ? 'Modify employee data records securely.' : 'Register new employee with basic metadata, organization metrics, and approvals.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(route(user,'/employees'))}
          className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm"
        >
          &larr; Back to List
        </button>
      </div>

      <form className="space-y-6" onSubmit={formik.handleSubmit}>
        
        {/* Section 1: Personal Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h3 className="text-sm font-semibold text-slate-800">1. Personal Information</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Basic identity credentials and birth records.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormInput label="First Name" name="firstName" formik={formik} type="text" pattern="/^[A-Za-z\s]+$/" patternMessage='Last Name can only contain letters' required />
            <FormInput label="Last Name" name="lastName" formik={formik} type="text" pattern="/^[A-Za-z\s]+$/" patternMessage='Last Name can only contain letters' required />
            <FormSelect label="Gender" name="gender" formik={formik} options={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }]} required />
            <FormInput label="Phone Number" name="phone" formik={formik} type="text" required />
            <FormInput label="Personal Email" name="email" formik={formik} type="email" required />
            <FormInput label="Date Of Birth" name="dob" formik={formik} type="date" required allowWeekends={true} />
          </div>
        </div>

        {/* Section 2: Deployment & Corporate info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h3 className="text-sm font-semibold text-slate-800">2. Organization & Professional Placement</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Deployment metrics, job title, and active office mail address.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormInput label="Office Email Address" name="officeEmail" formik={formik} type="email" required />
            <FormInput label="Department" name="department" formik={formik} type="text" required />
            <FormSelect label="Designation" name="designation" formik={formik} options={designationList.map((des) => ({ label: des.name, value: des.name }))} required />
            <FormInput label="Corporate Join Date" name="joinDate" formik={formik} type="date" required />
            <FormInput label="Probation Period Months" name="probationPeriodMonths" formik={formik} type="number" />
            <FormSelect label="Employee Category Role" name="employeeType" formik={formik} options={roleList.map((role) => ({ label: role.name, value: role.name }))} required />
            <FormSelect label="Organization Tenant" name="organization" formik={formik} options={organizations.map((org) => ({ label: org.name, value: org._id }))} required />
          </div>
        </div>

        {/* Section 3: Approver settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h3 className="text-sm font-semibold text-slate-800">3. Leave Reporting & Approver Setup</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Assign reporting officers to forward and evaluate leaves.</p>
          </div>

      
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <MultiSelect
              label="Leave Forward To"
              required
              name="leaveForwardTo"
              options={employeeList.map(emp => ({
                label: `${emp.firstName} ${emp.lastName}`,
                value: emp._id
              }))}
              value={formik.values.leaveForwardTo}
              formik={formik}
              placeholder="Select Employees"
            />      
          </div>    
        </div>

        {/* Button Actions Footer */}
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={() => navigate(route(user,'/employees'))}
            className="px-5 py-2.5 border border-slate-205 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-6 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-500/10"
          >
            {isEdit ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeFormPage;
