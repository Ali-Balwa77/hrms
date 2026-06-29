import React, { useState, useRef, useEffect } from 'react';

const MultiSelect = ({
  label,
  required = false,
  options = [],
  value = [],
  formik,
  name,
  onChange,
  placeholder = "Select Employees",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedValue = Array.isArray(value) ? value : [];
  const isError = formik?.errors?.[name] && formik?.touched?.[name];
  const hasValue = selectedValue.length > 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDropdown = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const updateValue = (newValue) => {
    if (formik?.setFieldValue) {
      formik.setFieldValue(name, newValue, true);
    }

    if (formik?.setFieldTouched) {
      formik.setFieldTouched(name, true, false);
    }

    if (onChange) {
      onChange(newValue);
    }
  };

  const toggleOption = (opt) => {
    if (disabled) return;

    const exists = selectedValue.some((v) => v.value === opt.value);

    const newValue = exists
      ? selectedValue.filter((v) => v.value !== opt.value)
      : [...selectedValue, opt];

    updateValue(newValue);
  };

  return (
    <div className="mb-3" ref={wrapperRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label} {required && <span className="text-red-500 font-bold">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={handleToggleDropdown}
          className={`w-full bg-white border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat ${
              isError
                ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/10"
                : "hover:border-slate-300"
          }`}
        >
          <span
            className={`block flex-1 text-left truncate ${
              hasValue ? "text-slate-800" : "text-slate-400"
            }`}
          >
            {hasValue
              ? selectedValue.map((v) => v.label).join(", ")
              : placeholder}
          </span>
        </button>

        {open && !disabled && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-soft max-h-44 overflow-y-auto">
            {options.length > 0 ? (
              options.map((opt) => {
                const checked = selectedValue.some(
                  (v) => v.value === opt.value
                );

                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOption(opt)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />

                    <span className="truncate">
                      {opt.label}
                    </span>
                  </label>
                );
              })
            ) : (
              <div className="px-4 py-2.5 text-sm text-slate-400">
                No options found
              </div>
            )}
          </div>
        )}
      </div>

      {isError && !hasValue && (
        <p className="text-red-500 text-xs font-medium mt-1 animate-slideIn">
          {formik.errors[name]}
        </p>
      )}
    </div>
  );
};

export default MultiSelect;