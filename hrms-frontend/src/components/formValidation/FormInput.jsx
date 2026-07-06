import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaRegCalendarAlt } from "react-icons/fa";
import React, { useRef } from "react";

const FormInput = ({
  label,
  name,
  formik,
  required,
  type,
  disabled,
  placeholder,
  inputRef,
  trailingSpace = false,
  allowWeekends = false,
  showMonthYearDropdown = true,
}) => {

  const datePickerRef = useRef(null);

  const handleInputChange = (e) => {
    let value = e.target.value;

    if (type === "text") {
      value = value
        .replace(/\s+/g, " ")
        .trimStart();
    }

    formik.setFieldValue(name, value);
  };

  const isError = formik.errors[name] && formik.touched[name];
  const fieldValue = formik.values[name] || '';

  // Intelligent Contextual Placeholder Generator
  const computedPlaceholder = placeholder || (() => {
    if (!label) return "";
    const cleanLabel = label.replace(/\*/g, '').trim();
    const lower = cleanLabel.toLowerCase();
    
    if (type === "password") return "••••••••";
    if (lower.includes("email")) return "e.g. employee@company.com";
    if (lower.includes("phone") || lower.includes("contact") || lower.includes("mobile")) return "e.g. +1 (555) 000-0000";
    if (lower.includes("website") || lower.includes("url")) return "e.g. https://example.com";
    if (lower.includes("code")) return "e.g. ORG-100";
    if (lower.includes("employee")) return "e.g. EMP-101";
    
    return `Enter ${lower.toLowerCase()}...`;
  })();

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label} {required && (
          <span className="text-red-500 font-bold">*</span>
        )}
      </label>

      {type === "date" ? (
        <div className="relative">
          <DatePicker
            ref={datePickerRef}
            selected={
              formik.values[name]
                ? new Date(formik.values[name])
                : null
            }
            onChange={(date) =>
              formik.setFieldValue(name, date)
            }
            onBlur={() =>
              formik.setFieldTouched(name, true)
            }
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
            disabled={disabled}

            showMonthDropdown={showMonthYearDropdown}
            showYearDropdown={showMonthYearDropdown}
            dropdownMode="select"

            filterDate={(date) => {
              if (allowWeekends) return true;

              const day = date.getDay();
              return day !== 0 && day !== 6;
            }}
            wrapperClassName="w-full"
            className={`w-full bg-white border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl pr-10 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200 ${
              isError
                ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/10"
                : "hover:border-slate-300"
            }`}
          />
          <FaRegCalendarAlt
            onClick={() =>
              !disabled && datePickerRef.current.setOpen(true)
            }
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-brand-500 transition-colors"
          />
        </div>
      ) : (
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={fieldValue}
          onChange={!disabled ? handleInputChange : undefined}
          onBlur={formik.handleBlur}
          disabled={disabled}
          placeholder={computedPlaceholder}
          title={typeof fieldValue === "string" ? fieldValue : ""}
          className={`w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap bg-white border border-slate-200 text-slate-800 text-sm py-2.5 pl-4 ${trailingSpace ? "pr-12" : "pr-4"} rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200 ${
            isError
              ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/10"
              : "hover:border-slate-300"
          } disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed`}
          style={{ textOverflow: "ellipsis" }}
        />
      )}

      {isError && (
        <p className="text-red-500 text-xs font-medium mt-1 animate-slideIn">
          {formik.errors[name]}
        </p>
      )}
    </div>
  );
};

export default FormInput;
