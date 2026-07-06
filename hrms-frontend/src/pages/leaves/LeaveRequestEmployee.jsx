import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { route } from '../../utils/routeHelper.js';

import { FiClock, FiCheckSquare, FiAlertCircle, FiChevronRight, FiCalendar } from 'react-icons/fi';
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

const LeaveRequestEmployee = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const canReviewLeaveRequest = hasPermission(user, "leave", "approve") || hasPermission(user, "leave", "reject");

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
          url = '/leaves/team_leaves';
        } else {
          url = '/leaves';
        }
        
        const res = await api.get(url);

        const leaves = (Array.isArray(res?.data) ? res.data : (res?.data?.data || []));

        const loginEmployeeId = getCurrentEmployeeId(user);

        const pendingLeaves = leaves.filter((leave) => {
          const isPending = leave.status === 'pending';
          const isOwnHrRequest =
            isHrUser(user) &&
            getEmployeeIdFromRecord(leave.employeeId) === loginEmployeeId;

          return isPending && !isOwnHrRequest;
        });

        setItems(pendingLeaves);

      } catch (err) {
        if (
          err.response?.status === 404 ||
          err.response?.data?.message === "No leaves found"
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

  const leaveColorPalette = [
    "bg-rose-50 text-rose-700 border-rose-200/60",
    "bg-indigo-50 text-indigo-700 border-indigo-200/60",
    "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    "bg-amber-50 text-amber-700 border-amber-200/60",
    "bg-sky-50 text-sky-700 border-sky-200/60",
    "bg-purple-50 text-purple-700 border-purple-200/60",
    "bg-cyan-50 text-cyan-700 border-cyan-200/60",
    "bg-orange-50 text-orange-700 border-orange-200/60",
    "bg-pink-50 text-pink-700 border-pink-200/60",
    "bg-teal-50 text-teal-700 border-teal-200/60",
  ];

  const getLeaveColorClass = (leaveName = "") => {
    const value = String(leaveName || "").trim();

    if (!value) {
      return "bg-slate-50 text-slate-700 border-slate-200";
    }

    const hash = value
      .toUpperCase()
      .split("")
      .reduce((total, char) => total + char.charCodeAt(0), 0);

    return leaveColorPalette[hash % leaveColorPalette.length];
  };

  // Calculations for dashboard indicators
  const pendingCount = items.length;
  const sickLeavesCount = items.filter(i => {
    const code = (i.leaveType?.code || '').toUpperCase();
    return code.includes('S') || code.includes('M');
  }).length;
  
  const casualOrPersonalCount = items.filter(i => {
    const code = (i.leaveType?.code || '').toUpperCase();
    return code.includes('C') || code.includes('P') || code.includes('E');
  }).length;

  const columns = [
    {
      title: "Employee ID",
      data: null,
      render: (data) => `<span class="font-mono text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-lg shadow-sm">${data?.employeeId?.employeeNo || ''}</span>`
    },
    {
      title: "Employee Name",
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
      title: "Leave Name",
      data: "leaveType",
      render: (data) => {
        const leaveName = data?.code || '-';
        const halfDay =
          data?.isHalfDay && data?.halfDayType
            ? ` (${data.halfDayType === 'pre' ? 'FH' : 'SH'})`
            : '';
        
        const code = leaveName.toUpperCase();
        let colorClasses = getLeaveColorClass(code);

        return `<span class="font-semibold text-xs px-2.5 py-1 rounded-lg border shadow-sm ${colorClasses}">${leaveName}${halfDay}</span>`;
      }
    },
    {
      title: "Leave From",
      data: "from",
      render: (data) => `
        <span class="inline-flex items-center gap-1.5 text-slate-600 font-medium text-xs">
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          ${formatDate(data)}
        </span>
      `
    },
    {
      title: "Leave To",
      data: "to",
      render: (data) => `
        <span class="inline-flex items-center gap-1.5 text-slate-600 font-medium text-xs">
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          ${formatDate(data)}
        </span>
      `
    },
    {
      title: "Status",
      data: "status",
      render: () =>
        `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200/60 shadow-sm">
          <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Pending
         </span>`
    },
    {
      title: "Reason",
      data: "reason",
      render: (data) => `<span class="text-slate-500 text-xs italic font-normal">${data || "No reason specified"}</span>`
    },
    ...(canReviewLeaveRequest ? [{
      title: "Action",
      data: null,
      render: (data) =>
        `<button class="view-approval p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all duration-200 border border-indigo-100 hover:border-indigo-600 bg-indigo-50 shadow-sm inline-flex items-center justify-center" data-id="${data._id}" title="Review Approval">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.3">
            <polyline points="9 11 12 14 22 4" stroke-linecap="round" stroke-linejoin="round"></polyline>
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </button>`
    }] : [])
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {loading && <Loader />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
            {hasPermission(user, "leave", "team_leave_scope") ? "Leave Requests for Approval" : "Pending Leave Requests"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review active and pending leave request claims reporting to you.</p>
        </div>
      </div>

      {/* Metric Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <FiClock className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awaiting Action</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{pendingCount}</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FiCheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Casual & Personal Requests</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{casualOrPersonalCount}</h3>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
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
              document.querySelectorAll('.view-approval').forEach(el => {
                el.onclick = () => {
                  const id = el.getAttribute('data-id');
                  navigate(route(user, `/leaves/approval/${id}`));
                };
              });

              document.querySelectorAll('.dataTable tbody td').forEach(td => {
                td.style.setProperty('font-size', '13px', 'important');
                td.style.setProperty('padding', '14px 16px', 'important');
                td.style.setProperty('border-bottom', '1px solid #f1f5f9', 'important');
                td.style.setProperty('color', '#334155', 'important');
              });

              document.querySelectorAll('.dataTable thead th').forEach(th => {
                th.style.setProperty('font-size', '11px', 'important');
                th.style.setProperty('text-transform', 'uppercase', 'important');
                th.style.setProperty('letter-spacing', '0.05em', 'important');
                th.style.setProperty('color', '#64748b', 'important');
                th.style.setProperty('padding', '12px 16px', 'important');
                th.style.setProperty('border-bottom', '2px solid #e2e8f0', 'important');
                th.style.setProperty('font-weight', '700', 'important');
              });
            }
          }}
        />
      </div>
    </div>
  );
};

export default LeaveRequestEmployee;
