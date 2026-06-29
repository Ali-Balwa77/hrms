import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { useFormik } from 'formik';
import { holidaySchema } from '../../validation/holiday.schema.js';
import FormInput from '../../components/formValidation/FormInput.jsx';
import { route } from '../../utils/routeHelper.js';
import { useSelector } from 'react-redux';

const initialState = {
  name: '',
  date: '',
  day: ''
};

const HolidayDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const user = useSelector(state => state.auth.user);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const initialValues =  {
    name: form.name || "",
    date: form.date || "",
    day: form.day || "",
  };

  useEffect(() => {
    const loadData = async () => {
      if (!isEdit) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/holidays/${id}`);
        setForm({
          ...initialState,
          ...data,
          date: data.date ? data.date.substring(0, 10) : '',
        });
      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isEdit]);

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

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: holidaySchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);

        const payload = {
          ...values,
          date: formatLocalDate(values.date),
        }
        if (!isEdit) {
          await api.post('/holidays', payload);
          toast.success('Holiday created');
        } else {
          await api.patch(`/holidays/${id}`, payload);
          toast.success('Holiday updated');
        }
        formik.resetForm();
        navigate(route(user,'/holidays'));
      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
      }
    }
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
            <span className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => navigate(route(user, '/holidays'))}>Holidays</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">{isEdit ? 'Edit Holiday' : 'New Holiday'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isEdit ? 'Edit Corporate Holiday' : 'Create Holiday Schedule'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure name, date, and description for company-wide holidays.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate(route(user,'/holidays'))}
          className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm"
        >
          &larr; Back to List
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl mx-auto">
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <h3 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-4 mb-2">Holiday Specifications</h3>
          
          <FormInput label="Holiday Name" name="name" formik={formik} type="text" required />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Date" name="date" formik={formik} type="date" required />
            <FormInput label="Day of Holiday" name="day" formik={formik} type="text" required />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(route(user,'/holidays'))}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
            >
              Save Holiday
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HolidayDetailPage;
