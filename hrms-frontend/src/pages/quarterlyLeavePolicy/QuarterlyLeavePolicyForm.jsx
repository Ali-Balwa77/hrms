import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import FormInput from '../../components/formValidation/FormInput';
import FormSelect from '../../components/formValidation/FromSelect';
import Loader from '../../components/common/Loader';
import { route } from '../../utils/routeHelper';
import { quarterlyLeavePolicySchema } from '../../validation/quarterlyLeavePolicy.schema';
const QuarterlyLeavePolicyForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      policyName: '',
      leaveType: '',
      year: new Date().getFullYear(),
      quarter: '',
      leaveDays: '',
      allocationType: 'fixed',
      carryForward: false,
      status: true,
    },
    enableReinitialize: true,
    validationSchema: quarterlyLeavePolicySchema(),
    onSubmit: async (values) => {
      try {
        setLoading(true);

        const payload = {
          ...values,
          year: Number(values.year),
          leaveDays: Number(values.leaveDays),
          carryForward: Boolean(values.carryForward),
          status: Boolean(values.status),
        };

        if (!isEdit) {
          await api.post('/quarterly-leave-policy', payload);
          toast.success('Quarterly leave policy created successfully');
        } else {
          await api.patch(`/quarterly-leave-policy/${id}`, payload);
          toast.success('Quarterly leave policy updated successfully');
        }

        navigate(route(user, '/leaves/quarterly-leave-policy'));
      } catch (error) {
      console.error('Request failed:', error);
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    const loadLeaveTypes = async () => {
      try {
        const { data } = await api.get('/leave-type');
        const list = Array.isArray(data) ? data : [];

        const quarterlyLeaveTypes = list.filter(
          (item) => item.allocationMode === "quarterly"
        );

        setLeaveTypes(
          quarterlyLeaveTypes.map((item) => ({
            value: item._id,
            label: item.code,
          }))
        );
      } catch (error) {
      console.error('Request failed:', error);
      }
    };

    loadLeaveTypes();
  }, []);

  useEffect(() => {
    const loadPolicy = async () => {
      if (!isEdit) return;

      try {
        setLoading(true);
        const { data } = await api.get(`/quarterly-leave-policy/${id}`);
        const policy = data || {};

        formik.setValues({
          policyName: policy.policyName || '',
          leaveType: policy.leaveType || '',
          year: policy.year || new Date().getFullYear(),
          quarter: policy.quarter || '',
          leaveDays: policy.leaveDays || '',
          allocationType: policy.allocationType || 'fixed',
          carryForward: Boolean(policy.carryForward),
          status: Boolean(policy.status),
        });
      } catch (error) {
      console.error('Request failed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, [id, isEdit]);

  const leaveTypeOptions = leaveTypes;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {loading && <Loader />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => navigate(route(user, '/dashboard'))}>Dashboard</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => navigate(route(user, '/leaves/quarterly-leave-policy'))}>Quarterly Policies</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">{isEdit ? 'Edit Policy' : 'New Policy'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isEdit ? 'Edit Quarterly Policy' : 'Create Quarterly Policy'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure allocation rates, carry forward policies, and parameters for quarterly leave items.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate(route(user, '/leaves/quarterly-leave-policy'))}
          className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm"
        >
          &larr; Back to List
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl mx-auto">
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <h3 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-4 mb-2">Policy Configuration</h3>
          
          <FormInput
            label="Policy Name"
            name="policyName"
            formik={formik}
            type="text"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Leave Type"
              name="leaveType"
              formik={formik}
              options={leaveTypeOptions}
              required
            />
            <FormInput
              label="Year"
              name="year"
              formik={formik}
              type="text"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Quarter"
              name="quarter"
              formik={formik}
              options={[
                { label: 'Q1 (Jan - Mar)', value: 'Q1' },
                { label: 'Q2 (Apr - Jun)', value: 'Q2' },
                { label: 'Q3 (Jul - Sep)', value: 'Q3' },
                { label: 'Q4 (Oct - Dec)', value: 'Q4' },
              ]}
              required
            />
            <FormInput
              label="Accrued Leave Days"
              name="leaveDays"
              formik={formik}
              type="number"
              required
            />
          </div>

          <FormSelect
            label="Allocation Type"
            name="allocationType"
            formik={formik}
            options={[
              { label: 'Fixed (Full amount on quarter start)', value: 'fixed' },
              { label: 'Prorated (Calculated based on hire date)', value: 'prorated' },
              { label: 'Manual (Sanctioned individually)', value: 'manual' },
            ]}
            required
          />

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 cursor-pointer hover:border-slate-200 transition-all duration-150">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700">Carry Forward Allowed</span>
                <span className="text-[10px] text-slate-400">Roll unused leaves to next quarter</span>
              </div>
              <input
                type="checkbox"
                name="carryForward"
                checked={formik.values.carryForward}
                onChange={(e) => formik.setFieldValue('carryForward', e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer transition-colors"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 cursor-pointer hover:border-slate-200 transition-all duration-150">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700">Policy Status</span>
                <span className="text-[10px] text-slate-400">Make policy active immediately</span>
              </div>
              <input
                type="checkbox"
                name="status"
                checked={formik.values.status}
                onChange={(e) => formik.setFieldValue('status', e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer transition-colors"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(route(user, '/leaves/quarterly-leave-policy'))}
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
    </div>
  );
};

export default QuarterlyLeavePolicyForm;
