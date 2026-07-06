import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import { login } from '../../redux/slices/authSlice.js';
import Loader from '../../components/common/Loader.jsx';
import FormInput from '../../components/formValidation/FormInput.jsx';
import { loginSchema } from '../../validation/login.schema.js';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const { token, user, loading } = useSelector((state) => state.auth);
  const redirectPath = '/dashboard';

  useEffect(() => {
    if (token && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [token, user, redirectPath, navigate]);

  const formik = useFormik({
    initialValues: {
      emailOrEmployeeId: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      const emailOrEmployeeId = values.emailOrEmployeeId.trim();
      const loginData = {
        password: values.password,
        [emailOrEmployeeId.includes('@') ? 'email' : 'employeeId']: emailOrEmployeeId,
      };

      const action = await dispatch(login(loginData));

      if (login.rejected.match(action)) {
        const errorMessage = String(action.payload || '').toLowerCase();

        if (errorMessage.includes('employee not found') || errorMessage.includes('email')) {
          emailInputRef.current?.focus();
          setTimeout(() => {
            formik.resetForm({
              values: { emailOrEmployeeId: '', password: '' },
              errors: {},
              touched: {},
            });
            emailInputRef.current?.focus();
          }, 0);
          return;
        }

        passwordInputRef.current?.focus();
        setTimeout(() => {
          formik.setFieldValue('password', '', false);
          formik.setErrors({});
          formik.setFieldTouched('password', false, false);
          passwordInputRef.current?.focus();
        }, 0);
        return;
      }

      toast.success('Logged in successfully');
      navigate(redirectPath, { replace: true });
    },
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
        <div className="flex flex-col items-center text-center mb-8">
            <img
              src="/dp/hrms/hrms-mark.svg"
              alt="HRMS Logo"
              className="block h-20 sm:h-24 md:h-28 w-auto object-contain"
            />
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
              Login
            </h2>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">Welcome back! Please sign in to access your portal.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <FormInput
            label="Email or Employee No"
            name="emailOrEmployeeId"
            formik={formik}
            type="text"
            inputRef={emailInputRef}
            required
          />
          <div>
            <div className="relative">
              <FormInput
                label="Password"
                name="password"
                formik={formik}
                type={showPassword ? "text" : "password"}
                inputRef={passwordInputRef}
                trailingSpace
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[35px] text-slate-400 hover:text-brand-600 transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <FiEye className="w-4 h-4" />
                ) : (
                  <FiEyeOff className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex justify-end mt-1.5">
              <Link
                to="/password/forgot"
                className="text-xs font-semibold text-brand-600 hover:text-brand-850 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/25 transition-all duration-200 transform hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none font-display text-sm tracking-wide"
          >
            Sign In
          </button>
        </form>

        {/* Footer Support Info */}
        <div className="text-center mt-8 border-t border-slate-100 pt-6">
          <p className="text-[10px] text-slate-400 font-medium">
            Contact HR administration if you've forgotten your employee credentials or need access assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
