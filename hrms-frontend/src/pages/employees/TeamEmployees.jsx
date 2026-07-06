import React, { useEffect, useState } from "react";
import { api } from "../../services/api.js";
import { useSelector } from "react-redux";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

import { FiUsers, FiLayers, FiCheckSquare, FiMail, FiCpu } from "react-icons/fi";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";

DataTable.use(DT);

const TeamEmployees = () => {
  const { user } = useSelector(state => state.auth);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    if (!user?.employeeId) return;

    try {
      setLoading(true);

      const res = await api.get(`/employees/teamEmployee/${user.employeeId}`);
      const activeEmployees = (Array.isArray(res?.data) ? res.data : (res?.data?.data || [])).filter(
        (emp) => emp.status === "active"
      );
      setEmployees(activeEmployees);

    } catch (err) {
      console.error('Failed to fetch team employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user?.employeeId]);

  // Compute metrics dynamically from local array
  const totalTeamSize = employees.length;
  const uniqueDepts = [...new Set(employees.map(emp => emp.department || 'Staff'))].filter(Boolean).length;
  const activeRoles = [...new Set(employees.map(emp => emp.designation || 'Staff Member'))].filter(Boolean).length;

  const columns = [
    {
      title: "Employee No",
      data: "employeeNo",
      render: (data) => `<span class="font-mono text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-lg shadow-sm">${data}</span>`
    },
    {
      title: "Name",
      data: null,
      render: (data) => {
        const name = `${data?.firstName || ''} ${data?.lastName || ''}`.trim() || "Employee";
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        // Dynamic pastel gradient colors for avatars
        const colors = [
          "from-indigo-500 to-purple-600 ring-indigo-50",
          "from-emerald-500 to-teal-600 ring-emerald-50",
          "from-amber-500 to-orange-600 ring-amber-50",
          "from-rose-500 to-pink-600 ring-rose-50",
          "from-sky-500 to-blue-600 ring-sky-50"
        ];
        // Determinstic index based on name length
        const colorIdx = (name.length) % colors.length;
        const selectedColor = colors[colorIdx];

        return `
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-full bg-gradient-to-br ${selectedColor} flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2">
              ${initials}
            </div>
            <div class="flex flex-col">
              <span class="text-slate-800 font-semibold text-sm leading-tight">${name}</span>
              <span class="text-slate-400 text-[10px] leading-tight">${data?.designation || 'Team Member'}</span>
            </div>
          </div>
        `;
      }
    },
    {
      title: "Email Address",
      data: "email",
      render: (data) => `
        <a href="mailto:${data}" class="text-indigo-600 hover:text-indigo-800 font-semibold text-xs transition-colors duration-150 inline-flex items-center gap-1">
          <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          ${data}
        </a>
      `
    },
    {
      title: "Department",
      data: "department",
      render: (data) => `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/50 shadow-sm">${data || "Staff"}</span>`
    },
    {
      title: "Designation",
      data: "designation",
      render: (data) => `<span class="text-slate-600 font-medium text-xs">${data || "-"}</span>`
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {loading && <Loader />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">Team Employees</h1>
          <p className="text-xs text-slate-500 mt-1">View list of employees reporting in your team structure.</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
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

export default TeamEmployees;
