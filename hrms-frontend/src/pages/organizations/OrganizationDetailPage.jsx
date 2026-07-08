import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { organizationSchema } from '../../validation/organization.schema.js';
import { useFormik } from 'formik';
import FormInput from '../../components/formValidation/FormInput.jsx';
import { route } from '../../utils/routeHelper.js';
import { useSelector } from 'react-redux';
import FormTextarea from '../../components/formValidation/FormTextarea.jsx';

const initialState = {
  name: '',
  code: '',
  address: '',
  website: '',
  email: '',
  phone: '',
  description: '',
  quarterlyLeaveAllocationEnabled: false
};

const OrganizationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const user = useSelector(state => state.auth.user);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const initialValues =  {
    name: form.name || '',
    code: form.code || '',
    address: form.address || '',
    website: form.website || '',
    email: form.email || '',
    phone: form.phone || '',
    description: form.description || '',
    quarterlyLeaveAllocationEnabled: Boolean(form.quarterlyLeaveAllocationEnabled)
  };

  useEffect(() => {
    const loadOrg = async () => {
      if (!isEdit) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/organizations/${id}`);
        setForm({ ...initialState, ...data });
      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOrg();
  }, [id, isEdit]);

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: organizationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        if (!isEdit) {
          await api.post('/organizations', values);
          toast.success('Organization created');
        } else {
          await api.patch(`/organizations/${id}`, values);
          toast.success('Organization updated');
        }
        formik.resetForm();
        navigate(route(user,'/organizations'));
      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
      }
    }
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {loading && <Loader />}
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
            {isEdit ? 'Edit Organization' : 'Create Organization'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure parameters and profile settings for your business entity.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(route(user,'/organizations'))}
          className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm"
        >
          &larr; Back to List
        </button>
      </div>

      <form className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={formik.handleSubmit}>
        <FormInput label="Name" name="name" formik={formik} type="text" required />
        <FormInput label="Code" name="code" formik={formik} type="text" required />
        <FormInput label="Email" name="email" formik={formik} type="email" required />
        <FormInput label="Phone" name="phone" formik={formik} type="text" required />
        <FormTextarea label="Address" name="address" formik={formik} rows={2} required />
        <FormInput label="Website" name="website" formik={formik} type="text" required />
        <FormTextarea label="Description" name="description" formik={formik} rows={4} required />
        <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="quarterlyLeaveAllocationEnabled"
            checked={Boolean(formik.values.quarterlyLeaveAllocationEnabled)}
            onChange={(event) => formik.setFieldValue("quarterlyLeaveAllocationEnabled", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="font-medium">Quarterly leave allocation</span>
        </label>

        <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={() => navigate(route(user,'/organizations'))}
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

export default OrganizationDetailPage;
