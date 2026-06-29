import React from 'react';
const FormSelect = ({ label, name, formik, required, options = [], disabled }) => {
  const isError = formik.errors[name] && formik.touched[name];

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label} {required && <span className="text-red-500 font-bold">*</span>}
      </label>

      <select
        name={name}
        value={formik.values[name] || ''}
        onChange={!disabled ? formik.handleChange : undefined}
        onBlur={formik.handleBlur}
        disabled={disabled}
        className={`w-full bg-white border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat ${
          isError
            ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/10"
            : "hover:border-slate-300"
        } ${disabled ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed" : ""}`}
      >
        <option value="">Select {label}</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {isError && (
        <p className="text-red-500 text-xs font-medium mt-1 animate-slideIn">
          {formik.errors[name]}
        </p>
      )}
    </div>
  );
};

export default FormSelect;
