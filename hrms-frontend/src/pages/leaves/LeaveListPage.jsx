import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { useSelector } from 'react-redux';
import PermissionGuard from '../../components/auth/PermissionGuard.jsx';

import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import { route } from '../../utils/routeHelper.js';
import { hasPermission } from '../../utils/permissions.js';

DataTable.use(DT);

const LeaveListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  var status = searchParams.get("status");

  const canUpdateLeave = hasPermission(user, "leave", "update");
  const canDeleteLeave = hasPermission(user, "leave", "delete");
  const canManageLeave = canUpdateLeave || canDeleteLeave;


  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const loadData = async () => {
    try {
      setLoading(true);

      let data = [];
      const employeeId = user?.employeeId?._id || user?.employeeId;

      let res;

      if (status === "leaveToday") {
        if ((hasPermission(user, "leave", "approve") || hasPermission(user, "leave", "reject")) || hasPermission(user, "leave", "read")) {
          res = await api.get("/leaves");
        } else {
          res = await api.get(`/leaves/employee/${employeeId}`);
        }
      } else {
        res = await api.get(`/leaves/employee/${employeeId}`);
      }

      const sortedData = [...(res.data || [])].sort(
        (a, b) => new Date(b.from) - new Date(a.from)
      );

      data = sortedData;

      if (status === "leaveToday") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        data = data.filter((item) => {
          if (!item.from || !item.to) return false;

          const from = new Date(item.from);
          const to = new Date(item.to);

          from.setHours(0, 0, 0, 0);
          to.setHours(23, 59, 59, 999);

          return (
            item.status?.toLowerCase() === "approved" &&
            today >= from &&
            today <= to
          );
        });
      }

      setItems(data);

    } catch (err) {
    console.error('Request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, searchParams, location.key]);

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/leaves/${id}`);
      toast.success('Leave deleted');
      await loadData();
    } catch (err) {
    console.error('Request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Employee No / Employee Name",
      data: null,
      render: (data) => {
        const empNo = data?.employeeId?.employeeNo || '';
        const name = `${data?.employeeId?.firstName || ''} ${data?.employeeId?.lastName || ''}`.trim();
        const initials = name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "E";

        return `
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-brand-650 flex items-center justify-center font-bold text-xs flex-shrink-0">
              ${initials}
            </div>
            <div>
              <span class="font-semibold text-slate-800 block">${name || 'Self'}</span>
              <span class="text-[10px] text-slate-400 font-mono block mt-0.5">${empNo || '-'}</span>
            </div>
          </div>
        `;
      }
    },
    {
      title: "Leave Category",
      data: null,
      render: (data) => {
        const leaveName = data?.leaveType?.code || data?.leaveType?.name || '-';
        const halfDay = data?.isHalfDay && data?.halfDayType
          ? ` <span class="text-[9px] font-bold bg-amber-50 text-amber-600 px-1 py-0.5 rounded ml-1 uppercase">${data.halfDayType === 'pre' ? '(FH)' : '(SH)'}</span>`
          : '';

        return `<div class="flex items-center"><span class="font-medium text-slate-700">${leaveName}</span>${halfDay}</div>`;
      }
    },
    {
      title: "From Date",
      data: "from",
      render: (data) => `<span class="font-medium text-slate-600">${formatDate(data)}</span>`
    },
    {
      title: "To Date",
      data: "to",
      render: (data) => `<span class="font-medium text-slate-600">${formatDate(data)}</span>`
    },
    {
      title: "Decision Date",
      data: "sanctionOn",
      render: (data) => `
        <span class="text-slate-500 font-medium">${data ? formatDate(data) : '<span class="text-slate-350 italic">Awaiting decision</span>'}</span>
      `
    },
    {
      title: "Status",
      data: "status",
      render: (data) => {
        let badgeClass = "bg-slate-50 text-slate-600 border-slate-200/50";

        if (data === "approved") badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100/50";
        else if (data === "rejected") badgeClass = "bg-rose-50 text-rose-700 border-rose-100/50";
        else if (data === "pending") badgeClass = "bg-slate-50 text-slate-500 border-slate-100/50";

        return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass} uppercase tracking-wider text-[10px]">${data}</span>`;
      }
    },
    {
      title: "Forwarded To",
      data: null,
      render: (data) => {
        const name = `${data?.forwardTo?.firstName || ''} ${data?.forwardTo?.lastName || ''}`.trim();
        if (!name) return `<span class="text-slate-400 italic">None</span>`;
        return `<span class="font-medium text-slate-600">${name}</span>`;
      }
    },
    ...(status !== "leaveToday" ? [{
      title: "Action",
      data: null,
      render: (data) => {
        if (data.status !== "pending") return `
          <button class="view-btn p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white border border-slate-100 hover:border-slate-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="View">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>`;     
        return `
          <div class="flex items-center gap-1.5">
            ${canUpdateLeave ? `
            <button class="edit-btn p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Edit">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            ` : ""}
            ${canDeleteLeave ? `
            <button class="delete-btn p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Delete">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
            ` : ""}
          </div>
        `;
      }
    }] : [])
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {loading && <Loader />}

      {/* Header panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
        <div>
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2.5 py-1 rounded-full">Vacation Logs</span>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-2.5">
            {status === "leaveToday" ? "Active Leave Roster Today" : "My Leave History"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {status === "leaveToday" ? "Review employees on approved leave shifts today." : "View personal vacation applications, tracking metrics, and states."}
          </p>
        </div>
        {status !== "leaveToday" && (
          <div>
            <PermissionGuard module="leave" action="create">
              {hasPermission(user, "leave", "read") && (
                <Link
                  to={route(user, "/leaves/new")}
                  className="inline-flex items-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                  Apply Leave
                </Link>
              )}
            </PermissionGuard>
          </div>
        )}
      </div>

      {/* DataTable Wrapper */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
        <DataTable
          key={JSON.stringify(items.map((item) => [item?._id || item?.id, item?.updatedAt, item?.status, item?.isActive, item?.name, item?.code])) || 'empty'}
          data={items}
          columns={columns}
          options={{
            paging: true,
            searching: true,
            ordering: false,
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
              // Custom draw adjustments for clean row layout
              document.querySelectorAll('.dataTable tbody td').forEach(td => {
                td.style.setProperty('font-size', '13px', 'important');
                td.style.setProperty('padding', '10px 14px', 'important');
                td.style.setProperty('border-bottom', '1px solid #f1f5f9', 'important');
              });

              document.querySelectorAll('.dataTable thead th').forEach(th => {
                th.style.setProperty('font-size', '11px', 'important');
                th.style.setProperty('padding', '12px 14px', 'important');
                th.style.setProperty('background-color', '#f8fafc', 'important');
                th.style.setProperty('color', '#64748b', 'important');
                th.style.setProperty('font-weight', '600', 'important');
                th.style.setProperty('border-bottom', '1px solid #e2e8f0', 'important');
              });

              document.querySelectorAll(".view-btn").forEach((btn) => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute("data-id");
                  navigate(route(user, `/leaves/${id}`));
                };
              });

              document.querySelectorAll('.edit-btn').forEach(el => {
                el.onclick = () => {
                  const id = el.getAttribute('data-id');
                  navigate(route(user,`/leaves/${id}`));
                };
              });

              document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute('data-id');
                  if (confirm("Are you sure you want to delete this leave request?")) {
                    handleDelete(id);
                  }
                };
              });
            }
          }}
        />
      </div>
    </div>
  );
};

export default LeaveListPage;
