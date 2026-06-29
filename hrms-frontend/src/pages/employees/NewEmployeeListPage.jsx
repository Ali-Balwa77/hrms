import React, { useEffect, useState, useCallback } from 'react';
import { api } from "../../services/api.js";
import Loader from "../../components/common/Loader.jsx";

import {
  FiUsers,
  FiCalendar,
  FiBriefcase,
} from "react-icons/fi";

import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";

DataTable.use(DT);

const NewEmployeeListPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatDate = useCallback((date) => {
    if (!date) return "";

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/employees");

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const newHires = data.filter((emp) => {
        const joinDate = new Date(emp.joinDate);

        return (
          joinDate.getMonth() === currentMonth &&
          joinDate.getFullYear() === currentYear
        );
      });

      setEmployees(newHires);
    } catch (err) {
    console.error('Request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const totalNewHires = employees.length;

  const uniqueDepts = [
    ...new Set(employees.map((emp) => emp.department || "Staff")),
  ].filter(Boolean).length;

  const uniqueDesignations = [
    ...new Set(employees.map((emp) => emp.designation || "Staff Member")),
  ].filter(Boolean).length;

  const columns = [
    {
      title: "Employee No",
      data: "employeeNo",
      render: (data) =>
        `<span class="font-mono text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-lg shadow-sm">${data || "-"}</span>`,
    },
    {
      title: "Employee Name",
      data: null,
      render: (data) => {
        const name = `${data?.firstName || ""} ${data?.lastName || ""}`.trim() || "Employee";

        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2);

        const colors = [
          "from-indigo-500 to-purple-600 ring-indigo-50",
          "from-emerald-500 to-teal-600 ring-emerald-50",
          "from-amber-500 to-orange-600 ring-amber-50",
          "from-rose-500 to-pink-600 ring-rose-50",
          "from-sky-500 to-blue-600 ring-sky-50",
        ];

        const colorIdx = name.length % colors.length;
        const selectedColor = colors[colorIdx];

        return `
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-full bg-gradient-to-br ${selectedColor} flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2">
              ${initials}
            </div>
            <div class="flex flex-col">
              <span class="text-slate-800 font-semibold text-sm leading-tight">${name}</span>
              <span class="text-slate-400 text-[10px] leading-tight">${data?.designation || "New Hire"}</span>
            </div>
          </div>
        `;
      },
    },
    {
      title: "Email Address",
      data: "officeEmail",
      render: (data) =>
        data
          ? `
            <a href="mailto:${data}" class="text-indigo-600 hover:text-indigo-800 font-semibold text-xs transition-colors duration-150 inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              ${data}
            </a>
          `
          : `<span class="text-slate-400 text-xs">-</span>`,
    },
    {
      title: "Department",
      data: "department",
      render: (data) =>
        `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/50 shadow-sm">${data || "Staff"}</span>`,
    },
    {
      title: "Designation",
      data: "designation",
      render: (data) =>
        `<span class="text-slate-600 font-medium text-xs">${data || "-"}</span>`,
    },
    {
      title: "Join Date",
      data: "joinDate",
      render: (data) =>
        `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/50 shadow-sm">${formatDate(data) || "-"}</span>`,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {loading && <Loader />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
            New Hire Employee
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View list of employees who joined in the current month.
          </p>
        </div>
      </div>

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
              document.querySelectorAll(".dataTable tbody td").forEach((td) => {
                td.style.setProperty("font-size", "13px", "important");
                td.style.setProperty("padding", "14px 16px", "important");
                td.style.setProperty("border-bottom", "1px solid #f1f5f9", "important");
                td.style.setProperty("color", "#334155", "important");
              });

              document.querySelectorAll(".dataTable thead th").forEach((th) => {
                th.style.setProperty("font-size", "11px", "important");
                th.style.setProperty("text-transform", "uppercase", "important");
                th.style.setProperty("letter-spacing", "0.05em", "important");
                th.style.setProperty("color", "#64748b", "important");
                th.style.setProperty("padding", "12px 16px", "important");
                th.style.setProperty("border-bottom", "2px solid #e2e8f0", "important");
                th.style.setProperty("font-weight", "700", "important");
              });

              // document.querySelectorAll(".dt-search input").forEach((input) => {
              //   input.style.setProperty("border", "1px solid #e2e8f0", "important");
              //   input.style.setProperty("border-radius", "12px", "important");
              //   input.style.setProperty("padding", "8px 12px", "important");
              //   input.style.setProperty("font-size", "13px", "important");
              //   input.style.setProperty("outline", "none", "important");
              // });

              // document.querySelectorAll(".dt-length select").forEach((select) => {
              //   select.style.setProperty("border", "1px solid #e2e8f0", "important");
              //   select.style.setProperty("border-radius", "10px", "important");
              //   select.style.setProperty("padding", "6px 10px", "important");
              //   select.style.setProperty("font-size", "13px", "important");
              //   select.style.setProperty("outline", "none", "important");
              // });
            },
          }}
        />
      </div>
    </div>
  );
};

export default NewEmployeeListPage;
