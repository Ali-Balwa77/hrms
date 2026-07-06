import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { api } from "../../services/api.js";
import Loader from "../../components/common/Loader.jsx";
import PermissionGuard from "../../components/auth/PermissionGuard.jsx";
import { hasPermission } from "../../utils/permissions.js";
import { route } from "../../utils/routeHelper.js";

DataTable.use(DT);

const pad = (value) => String(value).padStart(2, "0");

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const formatTime = (value) => String(value || "-").split(":").slice(0, 2).join(":");

const timeToMinutes = (value) => {
  if (!value) return null;
  const [hh = "0", mm = "0"] = String(value).split(":");
  const hours = Number(hh);
  const minutes = Number(mm);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const formatDuration = (data) => {
  if (data?.durationHours) {
    return String(data.durationHours).split(":").slice(0, 2).join(":");
  }

  if (Number(data?.durationMinutes) > 0) {
    const totalMinutes = Number(data.durationMinutes);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${pad(hours)}:${pad(minutes)}`;
  }

  const startMinutes = timeToMinutes(data?.startTime);
  const endMinutes = timeToMinutes(data?.endTime);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return "-";
  }

  const totalMinutes = endMinutes - startMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${pad(hours)}:${pad(minutes)}`;
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getCurrentEmployeeId = (user) =>
  String(user?.employeeId?._id || user?.employeeId || "");

const getEmployeeIdFromRecord = (employee) =>
  String(employee?._id || employee || "");

const isHrUser = (user) =>
  String(user?.role?.name || user?.employeeId?.employeeType || user?.employeeType || "")
    .toLowerCase()
    .trim() === "hr";

export default function MispunchList({ approval = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const canUpdate = hasPermission(user, "mispunch", "update");
  const canDelete = hasPermission(user, "mispunch", "delete");
  const canCreate = hasPermission(user, "mispunch", "create");

  const loadData = async () => {
    try {
      setLoading(true);
      const employeeId = user?.employeeId?._id || user?.employeeId;
      const res = approval
        ? await api.get("/mispunch/pending")
        : await api.get(`/mispunch/employee/${employeeId}`);

      const rows = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      const loginEmployeeId = getCurrentEmployeeId(user);

      const filteredRows =
        approval && isHrUser(user)
          ? rows.filter(
              (item) => getEmployeeIdFromRecord(item.employeeId) !== loginEmployeeId
            )
          : rows;

      setItems(filteredRows);
    } catch (error) {
      console.error("Request failed:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, approval, location.key]);

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/mispunch/${id}`);
      toast.success("Mispunch request deleted");
      await loadData();
    } catch (error) {
      console.error("Request failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status = "pending") => {
    const normalized = String(status || "pending").toLowerCase();
    const className =
      normalized === "approved"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
        : normalized === "rejected"
          ? "bg-rose-50 text-rose-700 border-rose-200/60"
          : "bg-amber-50 text-amber-700 border-amber-200/60";

    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${className}">${escapeHtml(normalized)}</span>`;
  };

  const showActionColumn =
    approval ||
    items.some(
      (item) => String(item?.status || "pending").toLowerCase() !== "pending"
    ) ||
    items.some(
      (item) =>
        String(item?.status || "pending").toLowerCase() === "pending" &&
        (canUpdate || canDelete)
    );

  const columns = useMemo(() => [
    {
      title: "Employee Name",
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
      title: "Mispunch Date",
      data: "mispunchDate",
      render: (data) =>
        `<span class="inline-flex items-center gap-1.5 text-slate-600 font-medium text-xs">
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          ${formatDate(data)}
        </span>`,
    },
    {
      title: "Mispunch Time",
      data: null,
      render: (data) =>
        `<span class="font-sans font-medium text-slate-600 bg-slate-50">
          ${formatTime(data?.startTime)} - ${formatTime(data?.endTime)}
        </span>`,
    },
    {
      title: "Duration",
      data: null,
      render: (data) =>
        `<span class="font-mono text-xs font-bold px-2.5 py-1 rounded-lg border bg-indigo-50 text-brand-700 border-indigo-100">
          ${escapeHtml(formatDuration(data))}
        </span>`,
    },
    {
      title: "Forwarded To",
      data: null,
      render: (data) => {
        const name =
          `${data?.forwardTo?.firstName || ""} ${data?.forwardTo?.lastName || ""}`.trim() || "-";
        return `<span class="text-slate-600 text-xs font-medium">${escapeHtml(name)}</span>`;
      },
    },
    {
      title: "Status",
      data: "status",
      render: (data) => statusBadge(data),
    },
    {
      title: "Reason",
      data: "reason",
      render: (data) =>
        `<span class="text-slate-500 text-xs italic font-normal">${escapeHtml(data || "-")}</span>`,
    },
    ...(showActionColumn
      ? [
          {
            title: "Action",
            data: null,
            orderable: false,
            searchable: false,
            render: (data) => {
              const isPending =
                String(data?.status || "pending").toLowerCase() === "pending";

              if (approval) {
                return isPending
                  ? `<button class="review-btn p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all duration-200 border border-indigo-100 hover:border-indigo-600 bg-indigo-50 shadow-sm inline-flex items-center justify-center" data-id="${data._id}" title="Review">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>`
                  : "";
              }

              if (!isPending) {
                return `
                  <button class="view-btn p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white border border-slate-100 hover:border-slate-600 transition-all duration-200 cursor-pointer inline-flex items-center justify-center" data-id="${data._id}" title="View">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                `;
              }

              return `
                <div class="flex items-center gap-1.5">
                  ${canUpdate ? `
                    <button class="edit-btn p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Edit">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>` : ""}

                  ${canDelete ? `
                    <button class="delete-btn p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Delete">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>` : ""}
                </div>
              `;
            },
          },
        ]
      : []),
  ], [approval, canDelete, canUpdate, showActionColumn]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {loading && <Loader />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
            {approval ? "Mispunch Requests" : "My Mispunch Applications"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {approval
              ? "Review and approve employee attendance correction requests."
              : "Create and track missed punch correction requests."}
          </p>
        </div>

        {!approval && canCreate && (
          <PermissionGuard module="mispunch" action="create">
            <Link
              to={route(user, "/mispunch/new")}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              New Mispunch
            </Link>
          </PermissionGuard>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-auto p-6">
        <DataTable
          key={
            JSON.stringify(
              items.map((item) => [
                item?._id,
                item?.updatedAt,
                item?.status,
                item?.mispunchDate,
                item?.durationHours,
                item?.durationMinutes,
              ])
            ) || "empty"
          }
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

              document.querySelectorAll(".view-btn").forEach((btn) => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute("data-id");
                  navigate(route(user, `/mispunch/${id}`));
                };
              });

              document.querySelectorAll(".edit-btn").forEach((btn) => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute("data-id");
                  navigate(route(user, `/mispunch/${id}`));
                };
              });

              document.querySelectorAll(".review-btn").forEach((btn) => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute("data-id");
                  navigate(route(user, `/mispunch/approval/${id}`));
                };
              });

              document.querySelectorAll(".delete-btn").forEach((btn) => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute("data-id");
                  if (confirm("Are you sure you want to delete this mispunch request?")) {
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
}
