import React, { useState } from 'react';
import { Link } from "react-router-dom";
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { useFormik } from 'formik';
import { forgotPasswordSchema } from '../../validation/forgotPassword.schema.js';
import FormInput from '../../components/formValidation/FormInput.jsx';

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    enableReinitialize: true,
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values) => {
       try {
        setLoading(true);
        await api.post('/password/forgot', { email: values.email });
        toast.success('Password reset link has been sent successfully.');
        formik.resetForm();
      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4">
      {loading && <Loader />}
      
      {/* Abstract Glowing Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-brand-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/80 shadow-xl rounded-2xl p-8 relative z-10 hover:shadow-2xl transition-all duration-300">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/dp/hrms/hrms-mark.svg"
            alt="HRMS Logo"
            className="block h-20 sm:h-24 md:h-28 w-auto object-contain"
          />
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
            Forgot Password
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed px-2">
            Enter your corporate email address and we'll send you a secure link to reset your credentials.
          </p>
        </div>

        <form className="space-y-5" onSubmit={formik.handleSubmit}>
          <FormInput label="Email Address" name="email" formik={formik} type="email" required />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/25 transition-all duration-200 transform hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none font-display text-sm tracking-wide"
          >
            Send Reset Link
          </button>
        </form>

        {/* Footer Support Info & Navigation */}
        <div className="text-center mt-8 border-t border-slate-100 pt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-850 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
