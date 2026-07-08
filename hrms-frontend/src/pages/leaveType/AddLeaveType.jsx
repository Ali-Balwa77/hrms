import { useFormik } from 'formik';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import FormInput from '../../components/formValidation/FormInput';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { leaveTypeSchema } from '../../validation/LeaveType.schema';
import React, { useEffect, useState } from 'react';
import { route } from '../../utils/routeHelper';
import Loader from '../../components/common/Loader';

const AddLeaveType = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!isEdit) return;
      try {
        setLoading(true);
        if (isEdit && id) {
          const response = await api.get(`/leave-type/${id}`);
          const data = (response?.data?.data || response?.data || {});

          formik.setValues({
            name: data.name || "",
            code: data.code || "",
            totalDays: data.totalDays || "",
          });
        }
      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isEdit]);

  const mode = isEdit ? 'edit' : 'create'
  const formik = useFormik({
    initialValues: {
      name: '',
      code: '',
      totalDays: '',
    },
    enableReinitialize: true,
    validationSchema: leaveTypeSchema(mode),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        if (!isEdit) {
          await api.post('/leave-type', values);
          toast.success('Leave type created successfully');
        } else {
          await api.patch(`/leave-type/${id}`, values);
          toast.success('Leave type updated successfully');
        }
        navigate(route(user,'/leaves/leave-type'));
      } catch (error) {
      console.error('Request failed:', error);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {loading && <Loader />}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => navigate(route(user, '/dashboard'))}>Dashboard</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => navigate(route(user, '/leaves/leave-type'))}>Leave Types</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">{isEdit ? 'Edit Type' : 'New Type'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isEdit ? 'Edit Leave Type' : 'Create Leave Type'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure leave names, codes, and annual day limits.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate(route(user,'/leaves/leave-type'))}
          className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm"
        >
          &larr; Back to List
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl mx-auto">
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <h3 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-4 mb-2">Leave Configuration</h3>
          
          <FormInput label="Leave Name" name="name" formik={formik} type='text' required />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Leave Code" name="code" formik={formik} type='text' required />
            <FormInput label="Total Days per Annum" name="totalDays" formik={formik} type='number' required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(route(user,'/leaves/leave-type'))}
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

export default AddLeaveType;
