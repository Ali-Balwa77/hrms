import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiArrowLeft, FiLogIn, FiShield } from "react-icons/fi";
import { logout } from "../../redux/slices/authSlice.js";

const UnauthorizedPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleGoToLogin = () => {
    dispatch(logout());

    localStorage.clear();
    sessionStorage.clear();

    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4">
      {/* Background Glow */}
      <div className="absolute top-[-12%] left-[-10%] w-[45vw] h-[45vw] bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[-12%] right-[-10%] w-[45vw] h-[45vw] bg-brand-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="w-full max-w-lg bg-white border border-slate-200/80 shadow-xl rounded-2xl p-8 text-center relative z-10 animate-fadeIn">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-sm mb-6">
          <FiAlertTriangle className="w-10 h-10" />
        </div>

        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50 border border-rose-100 px-3 py-1 rounded-full mb-3">
          <FiShield className="w-3.5 h-3.5" />
          Permission Restricted
        </span>

        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          Access Denied
        </h1>

        <p className="text-sm text-slate-500 mt-2 leading-6">
          Sorry,{" "}
          <span className="font-semibold text-slate-700">
            {user?.name || "User"}
          </span>
          . You don&apos;t have permission to access this page.
        </p>

        {user && (
          <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Your Role
              </span>

              <span className="px-3 py-1 rounded-full bg-indigo-50 text-brand-600 border border-indigo-100 text-xs font-bold capitalize">
                {user?.role?.name || "User"}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 leading-5">
              If you believe this is an error, please contact your administrator
              to review your access permissions.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
          <button
            type="button"
            onClick={handleGoToLogin}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-500/10"
          >
            <FiLogIn className="w-3.5 h-3.5" />
            Go to Login
          </button>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>
        </div>

        <div className="text-center mt-7 border-t border-slate-100 pt-5">
          <p className="text-[10px] text-slate-400 font-medium">
            HRMS access control protects restricted modules based on assigned
            role permissions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;