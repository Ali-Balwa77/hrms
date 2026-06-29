import React, { useState } from 'react';
import toast from "react-hot-toast";
import { api } from "../../services/api.js";
import Loader from "../../components/common/Loader.jsx";
import { useFormik } from "formik";
import FormInput from "../../components/formValidation/FormInput.jsx";
import { changePasswordSchema } from "../../validation/changePassword.schema.js";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice.js";
import { FiEye, FiEyeOff } from 'react-icons/fi';

const ChangePasswordPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const togglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const initialValues = {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: changePasswordSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);

        await api.patch(`/auth/change-password`, values, {
          headers: {
            Authorization: localStorage.getItem("hrms-token"),
          },
        });

        toast.success("Password change successful");

        localStorage.clear();
        dispatch(logout());
        formik.resetForm();
        navigate("/login");
      } catch (err) {
        const message = err.response?.data?.message;

        if (message === "Old password is incorrect" && formik) {
          formik.setFieldError("oldPassword", message);
          return;
        }

        toast.error(message || "Failed to change password");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="p-6">
      {loading && <Loader />}

      <div className="max-w-xl">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-800">
            Change Password
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Update your account password securely.
          </p>
        </div>

        <form
          className="bg-white rounded-2xl shadow-premium border border-slate-100 p-5"
          onSubmit={formik.handleSubmit}
        >
          <div className="space-y-3">
            <div className="relative">
              <FormInput
                label="Old Password"
                name="oldPassword"
                formik={formik}
                type={showPassword.oldPassword ? "text" : "password"}
                required
              />

              <button
                type="button"
                onClick={() => togglePassword("oldPassword")}
                className="absolute right-3 top-[35px] text-slate-400 hover:text-brand-600 transition-colors focus:outline-none"
              >
                {showPassword.oldPassword ? (
                  <FiEye className="w-4 h-4" />
                ) : (
                  <FiEyeOff className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="relative">
              <FormInput
                label="New Password"
                name="newPassword"
                formik={formik}
                type={showPassword.newPassword ? "text" : "password"}
                required
              />

              <button
                type="button"
                onClick={() => togglePassword("newPassword")}
                className="absolute right-3 top-[35px] text-slate-400 hover:text-brand-600 transition-colors focus:outline-none"
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
                label="Confirm Password"
                name="confirmPassword"
                formik={formik}
                type={showPassword.confirmPassword ? "text" : "password"}
                required
              />

              <button
                type="button"
                onClick={() => togglePassword("confirmPassword")}
                className="absolute right-3 top-[35px] text-slate-400 hover:text-brand-600 transition-colors focus:outline-none"
              >
                {showPassword.confirmPassword ? (
                  <FiEye className="w-4 h-4" />
                ) : (
                  <FiEyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;