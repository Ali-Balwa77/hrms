import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import { route } from '../../utils/routeHelper.js';
import { hasPermission } from '../../utils/permissions.js';

DataTable.use(DT);

const EmployeeListPage = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const canUpdateEmployee = hasPermission(user, "employee", "update");
  const canDeleteEmployee = hasPermission(user, "employee", "delete");
  const canManageEmployee = canUpdateEmployee || canDeleteEmployee;
  const canCreateEmployee = hasPermission(user, "employee", "create");
  var present = searchParams.get("present");;

  const loadEmployees = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/employees");

      let filtered = data;

      if (present === "today") {
        const today = new Date();

        const dd = String(today.getDate()).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const yyyy = today.getFullYear();

        const todayStr = `${dd}/${mm}/${yyyy}`;


        const { data: attendanceData } = await api.get("/attendance");


        const checkedInIds = attendanceData
        .filter((att) => {
          return (
            att.date === todayStr &&
            att.checkIn &&
              att.checkIn !== ""
            );
          })
          .map((att) => att.employeeId?._id || att.employeeId);


        filtered = data.filter((emp) =>
          checkedInIds.includes(emp._id)
        );
      }

      setEmployees(filtered);

    } catch (err) {
    console.error('Request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [searchParams]);

  const handleDelete = async (id) => {
    try {
      setLoading(true);

      await api.delete(`/employees/${id}`);
      toast.success("Employee deactivated successfully");
      await loadEmployees();
    } catch (err) {
    console.error('Request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const isPresentTodayPage = present === "today";
  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]));

  const columns = [
    { 
      title: "Employee No", 
      data: "employeeNo",
      render: (data) => `<span class="font-mono font-semibold text-slate-600">${data}</span>`
    },
    {
      title: "Employee Name",
      data: null,
      render: (data) => {
        const firstName = data?.firstName || "";
        const lastName = data?.lastName || "";
        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}` || "E";
        const fullName = `${firstName} ${lastName}`.trim() || "Employee";
        const employeeEmail = data?.officeEmail || data?.email || "";
        const safeInitials = escapeHtml(initials);
        const safeFullName = escapeHtml(fullName);
        const safeEmployeeEmail = escapeHtml(employeeEmail);

        return `
        <div class="flex items-center gap-3 min-w-[220px]">
          <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
            ${safeInitials}
          </div>
          <div class="min-w-0">
            <span class="block font-semibold text-slate-800 leading-tight">${safeFullName}</span>
            ${
              employeeEmail
                ? `<span class="mt-1 flex items-center gap-1.5 text-[11px] text-brand-600 leading-tight">
                    <svg class="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <span class="truncate max-w-[190px]" title="${safeEmployeeEmail}">${safeEmployeeEmail}</span>
                  </span>`
                : `<span class="mt-1 block text-[11px] text-slate-300">No email</span>`
            }
          </div>
        </div>
      `;
      }
    },
    { 
      title: "Department", 
      data: "department",
      render: (data) => `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">${data || 'Other'}</span>`
    },
    { title: "Designation", data: "designation" },
    { 
      title: "Role", 
      data: "employeeType",
      render: (data) => `<span class="capitalize font-medium text-slate-600">${data || 'Staff'}</span>`
    },
    ...(!isPresentTodayPage ? [
      {
        title: "Leave Balance",
        data: "leaveBalance",
        render: (data) => {
          if (!data || data.length === 0) return `<span class="text-slate-400 text-xs">No balance</span>`;
          return `
            <div class="flex flex-wrap gap-1 max-w-[180px]">
              ${data?.map((leave) => `
                <span class="text-[10px] font-semibold bg-indigo-50/50 text-brand-600 border border-brand-100/50 px-1.5 py-0.5 rounded">
                  ${leave?.leaveType?.slice(0, 3)}: ${Number(leave?.totalLeave || 0)}
                </span>
              `).join("")}
            </div>
          `;
        }
      },
    ] : []),
    {
      title: "Status",
      data: "status",
      render: (data) =>
        data === 'active'
          ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/50">Active</span>`
          : `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100/50">Inactive</span>`
    },
    ...(!isPresentTodayPage && canManageEmployee ? [
      {
        title: "Action",
        data: null,
        render: (data) =>
          `
              <div class="flex items-center gap-1.5">
                ${canUpdateEmployee ? `
                <button class="edit-btn p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Edit">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
                ` : ""}

                ${canDeleteEmployee ? `
                <button class="delete-btn p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Deactivate">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
                ` : ""}
              </div>
            `
      }
    ] : [])
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {loading && <Loader />}

      {/* Header panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
        <div>
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2.5 py-1 rounded-full">Database</span>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-2.5">
            {present === "today" ? "Today's Active Attendance Logs" : "Employee Master"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {present === "today" ? "View present roster list on today's shift." : "Access and manage employee visual records."}
          </p>
        </div>
        <div>
          {present !== "today" && canCreateEmployee && (
            <Link
              to={route(user, "/employees/new")}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
              Create Employee
            </Link>
          )}
        </div>
      </div>

      {/* Modern Card wrapped DataTable with horizontal scroll safety */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft overflow-x-auto w-full">
        <DataTable
          key={JSON.stringify(employees.map((item) => [item?._id || item?.id, item?.updatedAt, item?.status, item?.isActive, item?.name, item?.code])) || 'empty'}
          data={employees}
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

              document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute('data-id');
                  navigate(route(user, `/employees/${id}`));
                };
              });

              document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute('data-id');
                  if (confirm("Are you sure you want to deactivate this employee? Login access will also be disabled.")) {
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

export default EmployeeListPage;
