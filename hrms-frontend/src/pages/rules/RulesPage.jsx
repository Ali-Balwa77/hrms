import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { useSelector } from 'react-redux';
import { useFormik } from 'formik';
import { rulesSchema } from '../../validation/rules.schema.js';
import FormInput from '../../components/formValidation/FormInput.jsx';
import { useNavigate } from 'react-router-dom';
import FormTextarea from '../../components/formValidation/FormTextarea.jsx';
import { hasPermission } from '../../utils/permissions.js';

const initialState = {
  title: '',
  content: '',
};

const RulesPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialState);
  const [selectedId, setSelectedId] = useState(null);
  const [expandedRules, setExpandedRules] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const isAuthorized = hasPermission(user, "rule", "create") || hasPermission(user, "rule", "update") || hasPermission(user, "rule", "delete");

  const toggleExpand = (id) => {
    setExpandedRules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const initialValues = {
    title: form.title || '',
    content: form.content || '',
  };

  const loadRules = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/rules');
      setRules(data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load rules';
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: rulesSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        if (!selectedId) {
          await api.post('/rules', values);
          toast.success('Rule created');
        } else {
          await api.patch(`/rules/${selectedId}`, values);
          toast.success('Rule updated');
        }
        loadRules();
        setIsModalOpen(false);
        setForm(initialState);
        setSelectedId(null);
        formik.resetForm();
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'An unexpected error occurred';
      } finally {
        setLoading(false);
      }
    }
  });

  const handleEdit = (rule) => {
    setSelectedId(rule._id);
    setForm({
      title: rule.title,
      content: rule.content,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!ruleToDelete && !isBulkDelete) return;
    try {
      setLoading(true);
      if (isBulkDelete) {
        await api.post('/rules/bulk-delete', { ids: selectedIds });
        toast.success('Selected rules deleted');
      } else {
        await api.delete(`/rules/${ruleToDelete}`);
        toast.success('Rule deleted');
      }
      setForm(initialState);
      setSelectedId(null);
      setIsDeleteModalOpen(false);
      setRuleToDelete(null);
      setIsBulkDelete(false);
      setSelectedIds([]);
      await loadRules();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to perform deletion';
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === rules.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rules.map(r => r._id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {loading && <Loader />}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rules & Regulations</h1>
          <p className="text-xs text-slate-500 mt-1">Manage and view company guidelines, dress codes, and employee handbook sections.</p>
        </div>
        {isAuthorized && (
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <button
                onClick={() => {
                  setIsBulkDelete(true);
                  setIsDeleteModalOpen(true);
                }}
                className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-100 transition-all flex items-center gap-2 border border-rose-200 shadow-sm active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete ({selectedIds.length})
              </button>
            )}
            <button
              onClick={() => {
                setSelectedId(null);
                setForm(initialState);
                formik.resetForm();
                setIsModalOpen(true);
              }}
              className="group px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all duration-300 flex items-center gap-2 shadow-md shadow-brand-600/10 active:scale-95"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
              Create Rule
            </button>
          </div>
        )}
      </div>

      {rules.length > 0 && isAuthorized && (
        <div className="flex items-center gap-2 mb-4 px-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedIds.length === rules.length && rules.length > 0}
                onChange={handleSelectAll}
              />
              <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedIds.length === rules.length && rules.length > 0
                ? 'bg-brand-600 border-brand-600'
                : 'border-slate-300 bg-white group-hover:border-slate-400'
                }`}>
                {selectedIds.length === rules.length && rules.length > 0 && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {selectedIds.length > 0 && selectedIds.length < rules.length && (
                  <div className="w-2 h-0.5 bg-brand-600 rounded"></div>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors uppercase tracking-wider">
              {selectedIds.length === rules.length ? 'Deselect All' : 'Select All Rules'}
            </span>
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => {
          const isExpanded = expandedRules[rule._id];
          const isLongContent = (rule.content || '').length > 250;

          return (
            <div
              key={rule._id}
              className={`w-full text-left px-6 py-6 bg-white rounded-2xl shadow-sm border transition-all duration-300 group flex gap-4 ${selectedIds.includes(rule._id) ? 'border-brand-400 ring-1 ring-brand-100 bg-brand-50/10' : 'border-slate-200 hover:shadow-md hover:border-brand-100'
                }`}
            >
              {isAuthorized && (
                <div className="pt-1">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedIds.includes(rule._id)}
                      onChange={() => handleSelectOne(rule._id)}
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedIds.includes(rule._id)
                      ? 'bg-brand-600 border-brand-600'
                      : 'border-slate-200 bg-white group-hover:border-slate-300'
                      }`}>
                      {selectedIds.includes(rule._id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-brand-600 transition-colors">
                    {rule.title}
                  </h3>
                  {isAuthorized && (
                    <div className="flex items-center gap-2 lg:opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 transition-all duration-200 cursor-pointer"
                        title="Edit"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button
                        onClick={() => {
                          setRuleToDelete(rule._id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all duration-200 cursor-pointer"
                        title="Delete"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className={`text-sm text-slate-600 leading-relaxed overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-12 line-clamp-2 opacity-80'
                    }`}
                >
                  {rule.content}
                </div>

                {isLongContent && (
                  <button
                    onClick={() => toggleExpand(rule._id)}
                    className="group/btn text-[10px] font-bold text-brand-600 mt-4 hover:text-brand-800 transition-all duration-300 uppercase tracking-widest flex items-center gap-2"
                  >
                    <span className="relative">
                      {isExpanded ? 'Show Less' : 'Read More'}
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-brand-600/20 rounded-full"></span>
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-600 rounded-full transition-all duration-300 group-hover/btn:w-full"></span>
                    </span>
                    <div className={`p-1 rounded-full bg-brand-50 transition-transform duration-500 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-brand-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {rules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-slate-800 font-semibold">No Rules Listed</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-xs">There are currently no rules defined for the company calendar.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 scale-100 opacity-100 animate-in fade-in zoom-in duration-300 border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                {selectedId ? 'Edit Rule' : 'Create New Rule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-5" onSubmit={formik.handleSubmit}>
                <FormInput label="Title" name="title" formik={formik} type={'text'} placeholder="e.g., Working Hours Policy" required />
                <FormTextarea label="Content" name="content" formik={formik} rows={8} placeholder="Enter the detailed rule content here..." required />
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setForm(initialState);
                      setSelectedId(null);
                      formik.resetForm();
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/10 transition-all active:scale-95"
                  >
                    {selectedId ? 'Update Rule' : 'Save Rule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in slide-in-from-bottom-4 border border-slate-100">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 border border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">
                {isBulkDelete ? `Delete ${selectedIds.length} Rules?` : 'Delete Rule?'}
              </h3>
              <p className="text-slate-500 text-xs mb-8 leading-relaxed">
                {isBulkDelete
                  ? `Are you sure you want to delete these ${selectedIds.length} selected rules? This action cannot be undone.`
                  : 'Are you sure you want to delete this rule? This action cannot be undone.'
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setRuleToDelete(null);
                    setIsBulkDelete(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-600/10 active:scale-95"
                >
                  {loading ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesPage;
