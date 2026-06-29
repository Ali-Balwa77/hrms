import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import FormInput from '../../components/formValidation/FormInput.jsx';
import { route } from '../../utils/routeHelper.js';
import FormSelect from '../../components/formValidation/FromSelect.jsx';

const LeaveCancellationForm = () => {
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);

    const [leaveList, setLeaveList] = useState([]);
    const [forwardTo, setForwardTo] = useState('');
    const [employeeList, setEmployeeList] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedLeaveId, setSelectedLeaveId] = useState('');

    const formatDate = (date) => {
        if (!date) return '';

        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        const loadLeaves = async () => {
            try {
                setLoading(true);


                const leaveRes = await api.get(
                    `/leaves/employee/${user.employeeId}`
                );

                const data = (Array.isArray(leaveRes?.data) ? leaveRes.data : (leaveRes?.data?.data || []));


                const cancelRes = await api.get(
                    `/leave-cancel/employee/${user.employeeId}`
                );

                const cancellations = (Array.isArray(cancelRes?.data) ? cancelRes.data : (cancelRes?.data?.data || []));


                const cancelledLeaveIds = cancellations.map(
                    (item) => item.leaveId?._id
                );


                const approvedLeaves = data.filter(
                    (leave) =>
                        leave.status === 'approved' &&
                        !cancelledLeaveIds.includes(leave._id)
                );

                setLeaveList(approvedLeaves);

                setForwardTo(
                    approvedLeaves[0]?.employeeId?._id
                );

            } catch (error) {
            console.error('Request failed:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.employeeId) loadLeaves();
    }, [user?.employeeId]);

    useEffect(() => {
    const loadEmployees = async () => {
        if (!forwardTo) return;

        try {
        const res = await api.get(`/employees/${forwardTo}`);
        setEmployeeList(res?.data?.data || res?.data || null);
        } catch (error) {
        console.error('Request failed:', error);
        }
    };

    loadEmployees();
    }, [forwardTo]);

    const formik = useFormik({
        initialValues: {
            employeeId: `${user?.empID || ''} - ${user?.name || ''}`,
            forwardTo: '',

            leaveType: '',
            appliedDate: '',
            from: '',
            to: '',
            resumeDate: '',
            noOfDays: '',

            isHalfDay: false,
            halfDayType: '',
            halfLeaveForFirstDay: false,
            firstDayHalfType: '',
            halfLeaveForLastDay: false,
            lastDayHalfType: '',

            reason: '',
            remarks: ''
        },

        onSubmit: async (values) => {
            try {
                if (!selectedLeaveId) {
                    return
                }

                setLoading(true);

                const payload = {
                    ...values,
                    leaveId: selectedLeaveId,
                    employeeId: user.employeeId
                };

                await api.post(`/leave-cancel`, payload);

                toast.success('Leave cancelled successfully');
                formik.resetForm();
                navigate(route(user, '/leaves/cancellation'));
            } catch (error) {
            console.error('Request failed:', error);
            } finally {
                setLoading(false);
            }
        }
    });

    const handleSelectLeave = (leave) => {
        setSelectedLeaveId(leave._id);

        formik.setValues({
            ...formik.values,

            forwardTo: leave.forwardTo?._id,

            leaveType: leave.leaveType?.code || '',
            appliedDate: formatDate(leave.appliedDate),
            from: formatDate(leave.from),
            to: formatDate(leave.to),
            resumeDate: formatDate(leave.resumeDate),
            noOfDays: leave.noOfDays || '',

            isHalfDay: leave.isHalfDay || false,
            halfDayType: leave.halfDayType || '',
            halfLeaveForFirstDay: leave.halfLeaveForFirstDay || false,
            firstDayHalfType: leave.firstDayHalfType || '',
            halfLeaveForLastDay: leave.halfLeaveForLastDay || false,
            lastDayHalfType: leave.lastDayHalfType || '',

            reason: leave.reason || '',
            remarks: ''
        });
    };

    return (
        <div>
            {loading && <Loader />}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                    Leave Cancellation
                </h2>
            </div>

            <div className="flex justify-center items-center">
                <form
                    className="bg-white rounded shadow p-4 w-full space-y-4"
                    onSubmit={formik.handleSubmit}
                >
                    <h2 className="text-lg font-semibold">Leave Detail</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Employee"
                            name="employeeId"
                            formik={formik}
                            type="text"
                            disabled
                        />

                        <FormSelect
                            label="Forward To"
                            name="forwardTo"
                            formik={formik}
                            options={employeeList?.leaveForwardTo?.map((emp => ({
                                label: `${emp.employeeNo} - ${emp.firstName} ${emp.lastName}`,
                                value: emp._id
                            })))}
                        />
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">
                            Select Leave to apply for Cancellation
                        </h3>

                        <div className="overflow-x-auto border rounded">
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="border p-2">Select</th>
                                        <th className="border p-2">Leave</th>
                                        <th className="border p-2">From</th>
                                        <th className="border p-2">To</th>
                                        <th className="border p-2">Status</th>
                                        <th className="border p-2">Forward To</th>
                                        <th className="border p-2">Applied Date</th>
                                        <th className="border p-2">Days</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {leaveList?.length > 0 ? (
                                        leaveList.map((leave) => (
                                            <tr key={leave._id} className="text-center">
                                                <td className="border p-2">
                                                    <input
                                                        type="radio"
                                                        name="selectedLeave"
                                                        value={leave._id}
                                                        checked={selectedLeaveId === leave._id}
                                                        onChange={() => handleSelectLeave(leave)}
                                                    />
                                                </td>

                                                <td className="border p-2">
                                                    {leave.leaveType?.code}
                                                </td>

                                                <td className="border p-2">
                                                    {formatDate(leave.from)}
                                                </td>

                                                <td className="border p-2">
                                                    {formatDate(leave.to)}
                                                </td>

                                                <td className="border p-2 capitalize">
                                                    {leave.status}
                                                </td>

                                                <td className="border p-2">
                                                    {leave.forwardTo?.firstName} {leave.forwardTo?.lastName}
                                                </td>

                                                <td className="border p-2">
                                                    {formatDate(leave.appliedDate)}
                                                </td>

                                                <td className="border p-2">
                                                    {leave.noOfDays}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="8"
                                                className="text-center p-4 text-slate-500"
                                            >
                                                No approved leaves found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Leave"
                            name="leaveType"
                            formik={formik}
                            type="text"
                            disabled
                        />

                        <FormInput
                            label="Applied Date"
                            name="appliedDate"
                            formik={formik}
                            type="text"
                            disabled
                        />

                        <FormInput
                            label="Leave From"
                            name="from"
                            formik={formik}
                            type="text"
                            disabled
                        />

                        <FormInput
                            label="Leave To"
                            name="to"
                            formik={formik}
                            type="text"
                            disabled
                        />

                        <FormInput
                            label="Resume Date"
                            name="resumeDate"
                            formik={formik}
                            type="text"
                            disabled
                        />

                        <FormInput
                            label="No of Days"
                            name="noOfDays"
                            formik={formik}
                            type="text"
                            disabled
                        />

                        <div className="flex flex-col gap-2">
                        <label className="flex items-center">
                            <input
                            type="checkbox"
                            checked={formik.values.isHalfDay}
                            disabled
                            />
                            <span className="ml-2">Half Leave</span>
                        </label>

                        {formik.values.isHalfDay && (
                            <div className="ml-6 space-y-2">
                            {formik.values.halfDayType ? (
                                <div className="flex items-center gap-4">
                                <label className="flex items-center">
                                    <input
                                    type="radio"
                                    name="halfDayType"
                                    checked={formik.values.halfDayType === "post"}
                                    disabled
                                    />
                                    <span className="ml-2">Post Leave</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                    type="radio"
                                    name="halfDayType"
                                    checked={formik.values.halfDayType === "pre"}
                                    disabled
                                    />
                                    <span className="ml-2">Pre Leave</span>
                                </label>
                                </div>
                            ) : (
                                <>
                                <div className="flex flex-wrap items-center gap-4">
                                    <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formik.values.halfLeaveForFirstDay}
                                        disabled
                                    />
                                    <span className="ml-2">Half Leave For Firstday</span>
                                    </label>

                                    <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="firstDayHalfType"
                                        checked={formik.values.firstDayHalfType === "post"}
                                        disabled
                                    />
                                    <span className="ml-2">Post Leave</span>
                                    </label>

                                    <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="firstDayHalfType"
                                        checked={formik.values.firstDayHalfType === "pre"}
                                        disabled
                                    />
                                    <span className="ml-2">Pre Leave</span>
                                    </label>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formik.values.halfLeaveForLastDay}
                                        disabled
                                    />
                                    <span className="ml-2">Half Leave For Last Day</span>
                                    </label>

                                    <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="lastDayHalfType"
                                        checked={formik.values.lastDayHalfType === "post"}
                                        disabled
                                    />
                                    <span className="ml-2">Post Leave</span>
                                    </label>

                                    <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="lastDayHalfType"
                                        checked={formik.values.lastDayHalfType === "pre"}
                                        disabled
                                    />
                                    <span className="ml-2">Pre Leave</span>
                                    </label>
                                </div>
                                </>
                            )}
                            </div>
                        )}
                        </div>

                        <FormInput
                            label="Reason"
                            name="reason"
                            formik={formik}
                            type="text"
                            disabled
                        />

                        <FormInput
                            label="Remarks"
                            name="remarks"
                            formik={formik}
                            type="text"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={() => navigate(route(user, '/leaves/cancellation'))}
                            className="px-5 py-2.5 border border-slate-205 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-500/10"
                        >
                            Cancel Leave
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeaveCancellationForm;
