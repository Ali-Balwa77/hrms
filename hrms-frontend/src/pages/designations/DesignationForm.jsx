import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../services/api.js";
import Loader from "../../components/common/Loader.jsx";
import { useFormik } from "formik";
import * as Yup from "yup";
import FormInput from "../../components/formValidation/FormInput.jsx";
import FormSelect from "../../components/formValidation/FromSelect.jsx";
import { useSelector } from "react-redux";
import { route } from "../../utils/routeHelper.js";

const DesignationForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);

    const { user } = useSelector((state) => state.auth);

    const validationSchema = Yup.object({
        name: Yup.string()
            .trim()
            .required("Designation name is required")
            .matches(/^[A-Za-z\s.]+$/, "Designation Name can only contain letters.")
            .min(2, "Designation name must be at least 2 characters")
            .max(35, "Designation name must be at most 35 characters"),
        status: Yup.boolean(),
    });

    const formik = useFormik({
        initialValues: {
            name: "",
            status: true,
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                setLoading(true);

                const payload = {
                    name: values.name.trim(),
                    status: values.status,
                };

                if (isEdit) {
                    await api.patch(`/designations/${id}`, payload);
                    toast.success("Designation updated successfully");
                } else {
                    await api.post("/designations", payload);
                    toast.success("Designation created successfully");
                }

                navigate(route(user, "/designations"));
            } catch (error) {
            console.error('Request failed:', error);
            } finally {
                setLoading(false);
            }
        },
    });

    const fetchDesignation = async () => {
        try {
            setLoading(true);

            const res = await api.get("/designations");

            const designation = (Array.isArray(res?.data) ? res.data : (res?.data?.data || [])).find(
                (item) => item._id === id
            ) || {};

            formik.setValues({
                name: designation.name || "",
                status: designation.status ?? true,
            });
        } catch (error) {
        console.error('Request failed:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isEdit) {
            fetchDesignation();
        }
    }, [id]);

    if (loading) return <Loader />;

    return (
        <div className="max-w-xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
                        {isEdit ? "Edit Designation" : "Add Designation"}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Configure structural designations for employee profiles.</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(route(user, '/designations'))}
                    className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm"
                    >
                    &larr; Back to List
                </button>
            </div>

            <form className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6" onSubmit={formik.handleSubmit}>
                <div className="grid grid-cols-1 gap-5">
                    <FormInput
                        label="Designation Name"
                        name="name"
                        type="text"
                        formik={formik}
                        required
                    />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 mt-4">
                    <button
                        type="button"
                        onClick={() => navigate(route(user, '/designations'))}
                        className="px-5 py-2.5 border border-slate-205 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-500/10"
                    >
                        {isEdit ? "Update" : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DesignationForm;
