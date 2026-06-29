import React from 'react';
const FormTextarea = ({ label, name, formik, required, rows = 4, disabled, placeholder }) => {
    const handleInputChange = (e) => {
        let value = e.target.value;

        value = value
        .replace(/\s+/g, " ")
        .trimStart();

        formik.setFieldValue(name, value);
    };

    const isError = formik.errors[name] && formik.touched[name];

    // Contextual Placeholder Generator
    const computedPlaceholder = placeholder || (() => {
        if (!label) return "";
        const cleanLabel = label.replace(/\*/g, '').trim();
        const lower = cleanLabel.toLowerCase();
        
        return `Enter ${lower.toLowerCase()} details or description...`;
    })();

    return (
        <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                {label} {required && <span className="text-red-500 font-bold">*</span>}
            </label>

            <textarea
                name={name}
                rows={rows}
                value={formik.values[name] || ''}
                onChange={!disabled ? handleInputChange : undefined}
                onBlur={formik.handleBlur}
                placeholder={computedPlaceholder}
                className={`w-full bg-white border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200 resize-none ${
                    isError
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/10"
                        : "hover:border-slate-300"
                } disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed`}
                disabled={disabled}
            />

            {isError && (
                <p className="text-red-500 text-xs font-medium mt-1 animate-slideIn">
                    {formik.errors[name]}
                </p>
            )}
        </div>
    );
};

export default FormTextarea;
