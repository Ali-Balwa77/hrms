import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../services/api.js";
import Loader from "../../components/common/Loader.jsx";
import { useSelector } from "react-redux";
import { route } from "../../utils/routeHelper.js";
import { hasPermission } from "../../utils/permissions.js";

import { FiTag, FiCheckCircle, FiXCircle, FiPlus } from "react-icons/fi";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";

DataTable.use(DT);

const DesignationList = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const { user } = useSelector((state) => state.auth);

    const canCreateDesignation = hasPermission(user, "designation", "create");
    const canUpdateDesignation = hasPermission(user, "designation", "update");
    const canDeleteDesignation = hasPermission(user, "designation", "delete");
    const canManageDesignation = canUpdateDesignation || canDeleteDesignation;

    const fetchDesignations = async () => {
        try {
            setLoading(true);
            const res = await api.get("/designations");
            setItems((Array.isArray(res?.data) ? res.data : (res?.data?.data || [])));
        } catch (error) {
        console.error('Request failed:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDesignations();
    }, []);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/designations/${id}`);
            toast.success("Designation deleted successfully");
            await fetchDesignations();
        } catch (error) {
        console.error('Request failed:', error);
        }
    };

    const handleStatusChange = async (id, currentStatus) => {
        try {
            const booleanStatus = currentStatus === "true";
            await api.patch(`/designations/${id}`, {
                status: !booleanStatus,
            });
            toast.success("Designation status updated successfully");
            await fetchDesignations();
        } catch (error) {
        console.error('Request failed:', error);
        }
    };

    // Computations for metrics
    const totalDesignations = items.length;
    const activeDesignations = items.filter(item => item.status).length;
    const inactiveDesignations = items.filter(item => !item.status).length;

    const columns = [
        {
            title: "Designation Name",
            data: "name",
            render: (data) => `<span class="text-slate-800 font-semibold text-sm leading-tight">${data || "-"}</span>`,
        },
        {
            title: "Status",
            data: "status",
            render: (data, type, row) => {
                const statusClass = data
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                    : "bg-rose-50 text-rose-700 border-rose-200/80";

                if (!canUpdateDesignation) {
                    return `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusClass}">
                            <span class="h-1.5 w-1.5 rounded-full ${data ? "bg-emerald-500" : "bg-rose-500"} animate-pulse"></span>
                            ${data ? "Active" : "Inactive"}
                        </span>
                    `;
                }

                return `
                    <button
                        class="designation-status-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all duration-150 cursor-pointer ${data 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70" 
                            : "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/70"
                        }"
                        data-id="${row._id}"
                        data-status="${data}"
                    >
                        <span class="h-1.5 w-1.5 rounded-full ${data ? "bg-emerald-500" : "bg-rose-500"} animate-pulse"></span>
                        ${data ? "Active" : "Inactive"}
                    </button>
                `;
            },
        },
        ...(canManageDesignation ? [{
            title: "Action",
            data: null,
            render: (data) => {
                return `
                    <div class="flex items-center gap-1.5">
                      ${canUpdateDesignation ? `
                      <button class="edit-btn p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Edit">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      ` : ""}
                      ${canDeleteDesignation ? `
                      <button class="delete-btn p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Delete">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                      ` : ""}
                    </div>
                `;
            },
        }] : []),
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {loading && <Loader />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">Designations</h1>
                    <p className="text-xs text-slate-500 mt-1">Configure and manage corporate title structures and role tiers.</p>
                </div>
                {canCreateDesignation && (
                    <Link
                        to={route(user, "/designations/new")}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                        Create Designation
                    </Link>
                )}
            </div>

            {/* KPI metrics row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {/* Metric 1 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <FiTag className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tiers</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalDesignations}</h3>
                    </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <FiCheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Designations</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{activeDesignations}</h3>
                    </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                        <FiXCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inactive Designations</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{inactiveDesignations}</h3>
                    </div>
                </div>
            </div>

            {/* Table wrapper with scroll containment */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto w-full">
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

                            document.querySelectorAll('.edit-btn').forEach(btn => {
                                btn.onclick = (e) => {
                                    const id = e.currentTarget.getAttribute('data-id');
                                    navigate(route(user, `/designations/${id}`));
                                };
                            });

                            document.querySelectorAll('.delete-btn').forEach(btn => {
                                btn.onclick = (e) => {
                                    const id = e.currentTarget.getAttribute('data-id');

                                    if (confirm("Are you sure you want to delete this designation?")) {
                                        handleDelete(id);
                                    }
                                };
                            });

                            document
                                .querySelectorAll(".designation-status-btn")
                                .forEach((btn) => {
                                    btn.onclick = (e) => {
                                        const id = e.currentTarget.getAttribute("data-id");
                                        const status =
                                            e.currentTarget.getAttribute("data-status");

                                        handleStatusChange(id, status);
                                    };
                                });
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default DesignationList;
