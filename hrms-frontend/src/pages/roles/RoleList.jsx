import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Loader from "../../components/common/Loader.jsx";
import { api } from "../../services/api.js";
import { route } from "../../utils/routeHelper.js";
import { hasPermission } from "../../utils/permissions.js";

import { FiShield, FiCheckCircle, FiXCircle, FiPlus } from "react-icons/fi";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";

DataTable.use(DT);

const RoleList = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadRoles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/role");
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load roles list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/role/${id}`);
      toast.success("Role deleted successfully");
      await loadRoles();
    } catch (error) {
      console.error("Failed to delete role", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRoles = roles.length;
  const activeRoles = roles.filter((role) => role.isActive !== false).length;
  const inactiveRoles = roles.filter((role) => role.isActive === false).length;

  const filteredRoles = useMemo(() => {
    if (statusFilter === "active") {
      return roles.filter((role) => role.isActive !== false);
    }

    if (statusFilter === "inactive") {
      return roles.filter((role) => role.isActive === false);
    }

    return roles;
  }, [roles, statusFilter]);

  const getMetricCardClass = (type) => {
    const isSelected = statusFilter === type;

    const activeStyles = {
      all: "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-lg shadow-indigo-100/70",
      active:
        "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-200 shadow-lg shadow-emerald-100/70",
      inactive:
        "border-rose-500 bg-rose-50/70 ring-2 ring-rose-200 shadow-lg shadow-rose-100/70",
    };

    const hoverStyles = {
      all: "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30",
      active: "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30",
      inactive: "border-slate-200 hover:border-rose-300 hover:bg-rose-50/30",
    };

    return `relative bg-white p-5 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all duration-200 ${
      isSelected ? activeStyles[type] : `shadow-sm ${hoverStyles[type]}`
    }`;
  };

  const getMetricIconClass = (type) => {
    const isSelected = statusFilter === type;

    const styles = {
      all: isSelected
        ? "bg-indigo-600 text-white"
        : "bg-indigo-50 text-indigo-600",
      active: isSelected
        ? "bg-emerald-600 text-white"
        : "bg-emerald-50 text-emerald-600",
      inactive: isSelected
        ? "bg-rose-600 text-white"
        : "bg-rose-50 text-rose-600",
    };

    return `p-3 rounded-xl transition-all duration-200 ${styles[type]}`;
  };

  const getMetricTitleClass = (type) => {
    const isSelected = statusFilter === type;

    const styles = {
      all: "text-indigo-600",
      active: "text-emerald-600",
      inactive: "text-rose-600",
    };

    return `text-[10px] font-bold uppercase tracking-wider ${
      isSelected ? styles[type] : "text-slate-400"
    }`;
  };

  const columns = [
    {
      title: "Role Name",
      data: "name",
      render: (data) =>
        `<span class="text-slate-800 font-semibold text-sm leading-tight">${
          data || "-"
        }</span>`,
    },
    {
      title: "Status",
      data: "isActive",
      render: (data) => {
        const active = data !== false;
        return `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
              active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                : "bg-rose-50 text-rose-700 border-rose-200/80"
            }">
                <span class="h-1.5 w-1.5 rounded-full ${
                  active ? "bg-emerald-500" : "bg-rose-500"
                } animate-pulse"></span>
                ${active ? "Active" : "Inactive"}
            </span>
        `;
      },
    },
    {
      title: "Permissions",
      data: "permissions",
      render: (data) => {
        const count = Array.isArray(data) ? data.length : 0;
        return `<span class="font-semibold text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg shadow-sm">${count} Modules</span>`;
      },
    },
    ...(hasPermission(user, "role", "update") ||
    hasPermission(user, "role", "delete")
      ? [
          {
            title: "Action",
            data: null,
            render: (data) => `
              <div class="flex items-center gap-1.5">
                ${
                  hasPermission(user, "role", "update")
                    ? `
                  <button class="edit-btn p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Edit">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                `
                    : ""
                }
                ${
                  hasPermission(user, "role", "delete")
                    ? `
                  <button class="delete-btn p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Delete">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                `
                    : ""
                }
              </div>
            `,
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {loading && <Loader />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
            Role Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure structural credentials and module permissions.
          </p>
        </div>

        {hasPermission(user, "role", "create") && (
          <Link
            to={route(user, "/roles/new")}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
          >
            <FiPlus className="w-4 h-4" /> Create Role
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div
          onClick={() => setStatusFilter("all")}
          className={getMetricCardClass("all")}
        >
          {statusFilter === "all" && (
            <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-indigo-600 shadow-sm" />
          )}

          <div className={getMetricIconClass("all")}>
            <FiShield className="w-5 h-5" />
          </div>

          <div>
            <p className={getMetricTitleClass("all")}>Total Roles</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
              {totalRoles}
            </h3>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("active")}
          className={getMetricCardClass("active")}
        >
          {statusFilter === "active" && (
            <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-emerald-600 shadow-sm" />
          )}

          <div className={getMetricIconClass("active")}>
            <FiCheckCircle className="w-5 h-5" />
          </div>

          <div>
            <p className={getMetricTitleClass("active")}>Active Roles</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
              {activeRoles}
            </h3>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("inactive")}
          className={getMetricCardClass("inactive")}
        >
          {statusFilter === "inactive" && (
            <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-rose-600 shadow-sm" />
          )}

          <div className={getMetricIconClass("inactive")}>
            <FiXCircle className="w-5 h-5" />
          </div>

          <div>
            <p className={getMetricTitleClass("inactive")}>Inactive Roles</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
              {inactiveRoles}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto w-full">
        <DataTable
          key={`${statusFilter}-${
            JSON.stringify(
              filteredRoles.map((item) => [
                item?._id || item?.id,
                item?.updatedAt,
                item?.status,
                item?.isActive,
                item?.name,
                item?.code,
              ])
            ) || "empty"
          }`}
          data={filteredRoles}
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

              document.querySelectorAll(".edit-btn").forEach((btn) => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute("data-id");
                  navigate(route(user, `/roles/${id}`));
                };
              });

              document.querySelectorAll(".delete-btn").forEach((btn) => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute("data-id");
                  if (confirm("Are you sure you want to delete this role?")) {
                    handleDelete(id);
                  }
                };
              });
            },
          }}
        />
      </div>
    </div>
  );
};

export default RoleList;