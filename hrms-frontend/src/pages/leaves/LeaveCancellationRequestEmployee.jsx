import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { route } from '../../utils/routeHelper.js';

import { FiFileMinus, FiRefreshCw, FiAlertTriangle, FiChevronRight, FiShield } from 'react-icons/fi';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import { useSelector } from 'react-redux';
import { hasPermission } from '../../utils/permissions.js';

DataTable.use(DT);

const getCurrentEmployeeId = (user) =>
    String(user?.employeeId?._id || user?.employeeId || "");

const getEmployeeIdFromRecord = (employee) =>
    String(employee?._id || employee || "");

const isHrUser = (user) =>
    String(user?.role?.name || user?.employeeId?.employeeType || user?.employeeType || "")
        .toLowerCase()
        .trim() === "hr";

const LeaveCancellationRequestEmployee = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const canReviewCancellationRequest = hasPermission(user, "leave", "approve") || hasPermission(user, "leave", "reject");

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                let url = '';

                if (hasPermission(user, "leave", "team_leave_scope")) {
                    url = '/leave-cancel/team_cancellations';
                } else {
                    url = '/leave-cancel';
                }

                const res = await api.get(url);

                const cancellations = (Array.isArray(res?.data) ? res.data : (res?.data?.data || []));

                const loginEmployeeId = getCurrentEmployeeId(user);

                const pendingCancellations = cancellations.filter((item) => {
                    const isPending = item.status === 'pending';
                    const isOwnHrRequest =
                        isHrUser(user) &&
                        getEmployeeIdFromRecord(item.employeeId) === loginEmployeeId;

                    return isPending && !isOwnHrRequest;
                });

                setItems(pendingCancellations);
            } catch (err) {
                if (
                    err.response?.status === 404 ||
                    err.response?.data?.message ===
                    'No leave cancellations found'
                ) {
                    setItems([]);
                } else {

                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // Dynamic calculations for stats
    const calculateDays = (from, to) => {
        if (!from || !to) return 0;
        const diffTime = Math.abs(new Date(to) - new Date(from));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const pendingCount = items.length;
    const totalRestorableDays = items.reduce((sum, item) => {
        const days = item.leaveId?.days || calculateDays(item.leaveId?.from, item.leaveId?.to);
        return sum + days;
    }, 0);

    const columns = [
        {
            title: 'Employee ID',
            data: null,
            render: (data) =>
                `<span class="font-mono text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-lg shadow-sm">${data?.employeeId?.employeeNo || ''}</span>`,
        },
        {
            title: 'Employee Name',
            data: null,
            render: (data) => {
                const name = `${data?.employeeId?.firstName || ''} ${data?.employeeId?.lastName || ''}`.trim() || "Staff Member";
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

                const colors = [
                    "from-indigo-500 to-purple-600 ring-indigo-50",
                    "from-emerald-500 to-teal-600 ring-emerald-50",
                    "from-amber-500 to-orange-600 ring-amber-50",
                    "from-rose-500 to-pink-600 ring-rose-50",
                    "from-sky-500 to-blue-600 ring-sky-50"
                ];
                const colorIdx = (name.length) % colors.length;
                const selectedColor = colors[colorIdx];

                return `
                  <div class="flex items-center gap-3">
                    <div class="h-8 w-8 rounded-full bg-gradient-to-br ${selectedColor} flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2">
                      ${initials}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-slate-800 font-semibold text-sm leading-tight">${name}</span>
                      <span class="text-slate-400 text-[10px] leading-tight">${data?.employeeId?.department || 'Staff'}</span>
                    </div>
                  </div>
                `;
            }
        },
        {
            title: 'Leave Name',
            data: 'leaveId.leaveType',
            render: (data) => {
                const leaveName = data?.code || '-';
                const halfDay =
                    data?.isHalfDay && data?.halfDayType
                        ? ` (${data.halfDayType === 'pre' ? 'FH' : 'SH'})`
                        : '';

                let colorClasses = "bg-slate-50 text-slate-700 border-slate-200";
                const code = leaveName.toUpperCase();
                if (code.includes("SL") || code.includes("SICK")) {
                    colorClasses = "bg-rose-50 text-rose-700 border-rose-200/60";
                } else if (code.includes("CL") || code.includes("CASUAL")) {
                    colorClasses = "bg-indigo-50 text-indigo-700 border-indigo-200/60";
                } else if (code.includes("PL") || code.includes("PRIVILEGE") || code.includes("EL") || code.includes("EARNED")) {
                    colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
                } else if (code.includes("LWP") || code.includes("UNPAID")) {
                    colorClasses = "bg-amber-50 text-amber-700 border-amber-200/60";
                }

                return `<span class="font-semibold text-xs px-2.5 py-1 rounded-lg border shadow-sm ${colorClasses}">${leaveName}${halfDay}</span>`;
            },
        },
        {
            title: 'Leave From',
            data: 'leaveId.from',
            render: (data) =>
                `
                <span class="inline-flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  ${formatDate(data)}
                </span>
                `,
        },
        {
            title: 'Leave To',
            data: 'leaveId.to',
            render: (data) =>
                `
                <span class="inline-flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  ${formatDate(data)}
                </span>
                `,
        },
        {
            title: 'Status',
            data: 'status',
            render: () =>
                `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200/60 shadow-sm">
                  <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Pending Cancel
                 </span>`,
        },
        ...(canReviewCancellationRequest ? [{
            title: 'Action',
            data: null,
            render: (data) =>
                `<button class="view-approval p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all duration-200 border border-indigo-100 hover:border-indigo-600 bg-indigo-50 shadow-sm inline-flex items-center justify-center" data-id="${data._id}" title="Review Cancellation">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.3">
                        <polyline points="9 11 12 14 22 4" stroke-linecap="round" stroke-linejoin="round"></polyline>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                </button>`,
        }] : []),
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {loading && <Loader />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
                        Pending Leave Cancellations
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Review active employee request claims to cancel previously approved leaves.</p>
                </div>
            </div>

            {/* Warning Policy Alert Box */}
            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-amber-100/80 text-amber-800 rounded-xl mt-0.5">
                    <FiAlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-900 font-display">Automatic Balance Restoration Notice</h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Approving an employee's leave cancellation request will <strong>automatically restore the deducted leave days</strong> back to their active quarterly and annual balance sheets. Please verify request logs carefully.
                    </p>
                </div>
            </div>

            {/* Metrics Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                {/* Metric 1 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <FiFileMinus className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cancellations Pending</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{pendingCount}</h3>
                    </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <FiRefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Restorable Days</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalRestorableDays}</h3>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto w-full p-6">
                <DataTable
                    key={JSON.stringify(items.map((item) => [item?._id || item?.id, item?.updatedAt, item?.status, item?.isActive, item?.name, item?.code])) || 'empty'}
                    data={items}
                    columns={columns}
                    options={{
                        paging: true,
                        searching: true,
                        ordering: true,
                        pageLength: 10,
                        lengthMenu: [10, 25, 50, 100],
                        language: {
                            search: "",
                            searchPlaceholder: "Search here...",
                            lengthMenu: "Show _MENU_ records",
                            info: "Showing _START_ to _END_ of _TOTAL_ entries",
                            infoEmpty: "No records found",
                            zeroRecords: "No matching records found",
                            paginate: {
                                first: "«",
                                previous: "Previous",
                                next: "Next",
                                last: "»",
                            },
                        },
                        drawCallback: function () {
                            document.querySelectorAll('.view-approval').forEach((el) => {
                                el.onclick = () => {
                                    const id = el.getAttribute('data-id');

                                    navigate(route(user, `/leaves/cancel/approval/${id}`));
                                };
                            });

                            document.querySelectorAll('.dataTable tbody td').forEach((td) => {
                                td.style.setProperty('font-size','13px','important');
                                td.style.setProperty('padding','14px 16px','important');
                                td.style.setProperty('border-bottom','1px solid #f1f5f9','important');
                                td.style.setProperty('color','#334155','important');
                            });

                            document.querySelectorAll('.dataTable thead th').forEach((th) => {
                                th.style.setProperty('font-size','11px','important');
                                th.style.setProperty('text-transform','uppercase','important');
                                th.style.setProperty('letter-spacing','0.05em','important');
                                th.style.setProperty('color','#64748b','important');
                                th.style.setProperty('padding','12px 16px','important');
                                th.style.setProperty('border-bottom','2px solid #e2e8f0','important');
                                th.style.setProperty('font-weight','700','important');
                            });
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default LeaveCancellationRequestEmployee;
