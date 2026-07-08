import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getApiMessage } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { useFormik } from 'formik';
import { resetPasswordSchema } from '../../validation/resetpassword.js';
import FormInput from '../../components/formValidation/FormInput.jsx';
import { FiEye, FiEyeOff } from 'react-icons/fi';


const ResetPasswordPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const togglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      confirmPassword: ""
    },
    enableReinitialize: true,
    validationSchema: resetPasswordSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response = await api.post(`/password/reset/${token}`, { password: values.newPassword });
        if(response.status === 200) {
          toast.success(getApiMessage(response, 'Password reset successfully.'));
          formik.resetForm();
          navigate('/login');
        }
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
            Reset Password
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed px-2">
            Configure a strong new password to protect and secure your corporate credentials.
          </p>
        </div>

        <form className="space-y-5" onSubmit={formik.handleSubmit}>
          <div className="relative">
            <FormInput
              label="New Password"
              name="newPassword"
              formik={formik}
              type={showPassword.newPassword ? "text" : "password"}
              trailingSpace
              required
            />

            <button
              type="button"
              onClick={() => togglePassword("newPassword")}
              className="absolute right-3 top-[35px] text-slate-400 hover:text-brand-600 transition-colors focus:outline-none"
              aria-label={showPassword.newPassword ? "Hide password" : "Show password"}
            >
              {showPassword.newPassword ? (
                <FiEye className="w-4 h-4" />
              ) : (
                <FiEyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
          
          <div className="relative">
            <FormInput
              label="Confirm New Password"
              name="confirmPassword"
              formik={formik}
              type={showPassword.confirmPassword ? "text" : "password"}
              trailingSpace
              required
            />

            <button
              type="button"
              onClick={() => togglePassword("confirmPassword")}
              className="absolute right-3 top-[35px] text-slate-400 hover:text-brand-600 transition-colors focus:outline-none"
              aria-label={showPassword.confirmPassword ? "Hide password" : "Show password"}
            >
              {showPassword.confirmPassword ? (
                <FiEye className="w-4 h-4" />
              ) : (
                <FiEyeOff className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/25 transition-all duration-200 transform hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none font-display text-sm tracking-wide"
          >
            Reset Password
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

export default ResetPasswordPage;
