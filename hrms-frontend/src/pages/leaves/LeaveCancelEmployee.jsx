import React, { useEffect, useState } from 'react';
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";

import { api } from "../../services/api.js";
import Loader from "../../components/common/Loader.jsx";
import PermissionGuard from "../../components/auth/PermissionGuard.jsx";
import { Link } from "react-router-dom";
import { route } from "../../utils/routeHelper.js";
import { hasPermission } from "../../utils/permissions.js";

DataTable.use(DT);

const LeaveCancelEmployee = () => {
    const { user } = useSelector((state) => state.auth);

    const [items, setItems] = useState([]);

    const [loading, setLoading] = useState(false);

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

                const res = await api.get(`/leave-cancel/employee/${user.employeeId}`);

                setItems((Array.isArray(res?.data) ? res.data : (res?.data?.data || [])));
            } catch (err) {
                console.error('Failed to load leave cancellation data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.employeeId) loadData();
    }, [user?.employeeId]);

    const columns = [
        {
            title: "Leave Name",
            data: "leaveId.leaveType",
            render: (data) => {
                return `<span class="font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">${data?.code || "N/A"}</span>`
            }
        },
        {
            title: "From Date",
            data: "leaveId.from",
            render: (data) => `<span class="text-slate-600 font-medium">${formatDate(data)}</span>`,
        },
        {
            title: "To Date",
            data: "leaveId.to",
            render: (data) => `<span class="text-slate-600 font-medium">${formatDate(data)}</span>`,
        },
        {
            title: "Status",
            data: "status",
            render: (data) => {
                let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                if (data === "approved") badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
                if (data === "rejected") badgeClass = "bg-rose-50 text-rose-700 border-rose-200/60";
                if (data === "pending") badgeClass = "bg-amber-50 text-amber-700 border-amber-200/60";

                return `
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeClass}">
                        ${data || ""}
                    </span>
                `;
            },
        },
        {
            title: "Forwarded To",
            data: null,
            render: (data) => {
                const name = `${data?.forwardTo?.firstName || ""} ${data?.forwardTo?.lastName || ""}`.trim() || "Manager";
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                return `
                    <div class="flex items-center gap-2">
                        <div class="h-7 w-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-brand-600">
                            ${initials}
                        </div>
                        <span class="text-slate-600 text-xs font-medium">${name}</span>
                    </div>
                `;
            }
        },
        {
            title: "Applied Date",
            data: "createdAt",
            render: (data) => `<span class="text-slate-400 text-xs">${formatDate(data)}</span>`,
        },
        {
            title: "No of Days",
            data: "leaveId.noOfDays",
            render: (data) => `<span class="font-bold text-slate-800 text-sm">${data}</span>`
        },
        {
            title: "Half Leave",
            data: "leaveId.isHalfDay",
            render: (data) => data ? `<span class="bg-indigo-50/60 text-brand-700 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-100/50">Half</span>` : `<span class="text-slate-300">-</span>`,
        },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {loading && <Loader />}

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Leave Cancellation Requests</h1>
                    <p className="text-xs text-slate-500 mt-1">Submit or track cancellation requests for your approved leaves.</p>
                </div>

                <PermissionGuard module="leave" action="create">
                    {hasPermission(user, "leave", "read") && (
                        <Link
                            to={route(user, "/leaves/cancel/new")}
                            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            Request Leave Cancellation
                        </Link>
                    )}
                </PermissionGuard>
            </div>

            {/* Table Wrapper */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto w-full p-6">
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
                            document.querySelectorAll('.dataTable tbody td').forEach(td => {
                                td.style.setProperty('font-size', '13px', 'important');
                                td.style.setProperty('padding', '12px 16px', 'important');
                                td.style.setProperty('border-bottom', '1px solid #f1f5f9', 'important');
                                td.style.setProperty('color', '#334155', 'important');
                            });

                            document.querySelectorAll('.dataTable thead th').forEach(th => {
                                th.style.setProperty('font-size', '11px', 'important');
                                th.style.setProperty('text-transform', 'uppercase', 'important');
                                th.style.setProperty('letter-spacing', '0.05em', 'important');
                                th.style.setProperty('color', '#64748b', 'important');
                                th.style.setProperty('padding', '12px 16px', 'important');
                                th.style.setProperty('border-bottom', '2px solid #f1f5f9', 'important');
                            });
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default LeaveCancelEmployee;
