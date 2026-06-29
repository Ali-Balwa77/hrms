import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Loader from "../../components/common/Loader.jsx";
import { api } from "../../services/api.js";
import { hasPermission } from "../../utils/permissions.js";

import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import {
  FiCheckCircle,
  FiKey,
  FiRefreshCw,
  FiShield,
  FiUserCheck,
  FiXCircle,
} from "react-icons/fi";

DataTable.use(DT);

const getEmployeeName = (item) => {
  const employee = item.employeeId;
  if (!employee) return item.name || "-";
  return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || item.name || "-";
};

const getEmployeeCode = (item) => item.employeeId?.employeeNo || item.empID || "-";

const UserAccessList = () => {
  const { user } = useSelector((state) => state.auth);
  const usersRef = useRef([]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [passwordUser, setPasswordUser] = useState(null);
  const [password, setPassword] = useState("");
  const [sendMail, setSendMail] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const canUpdate = hasPermission(user, "user", "update");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Request failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const { data } = await api.get("/role/active");
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      setRoles([]);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const handleStatusChange = async (id, nextStatus) => {
    try {
      setLoading(true);
      await api.patch(`/users/${id}`, { isActive: nextStatus });
      toast.success(
        nextStatus
          ? "Employee and login access activated successfully"
          : "Employee and login access deactivated successfully"
      );
      await loadUsers();
    } catch (error) {
      console.error("Request failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const openRoleModal = (item) => {
    setSelectedUser(item);
    setSelectedRole(item.role?._id || "");
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error("Please select role");
      return;
    }

    try {
      setLoading(true);
      await api.patch(`/users/${selectedUser._id}`, { role: selectedRole });
      toast.success("User role updated successfully");
      setSelectedUser(null);
      setSelectedRole("");
      await loadUsers();
    } catch (error) {
      console.error("Request failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const openPasswordModal = (item) => {
    setPasswordUser(item);
    setPassword("");
    setSendMail(true);
  };

  const handlePasswordReset = async () => {
    try {
      setLoading(true);
      const payload = {
        sendMail,
        ...(password.trim() ? { password: password.trim() } : {}),
      };

      await api.post(`/users/${passwordUser._id}/reset-password`, payload);
      toast.success("Password reset successfully");
      setPasswordUser(null);
      setPassword("");
      setSendMail(true);
    } catch (error) {
      console.error("Request failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((item) => item.isActive !== false).length;
    const inactive = users.filter((item) => item.isActive === false).length;

    usersRef.current = users;

    return { total, active, inactive };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (statusFilter === "active") {
      return users.filter((item) => item.isActive !== false);
    }

    if (statusFilter === "inactive") {
      return users.filter((item) => item.isActive === false);
    }

    return users;
  }, [users, statusFilter]);

  useEffect(() => {
    usersRef.current = filteredUsers;
  }, [filteredUsers]);

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
      all: isSelected ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600",
      active: isSelected
        ? "bg-emerald-600 text-white"
        : "bg-emerald-50 text-emerald-600",
      inactive: isSelected ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-600",
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
      title: "Employee",
      data: null,
      render: (data) => `
        <div>
          <div class="font-semibold text-slate-800 text-sm">${getEmployeeName(data)}</div>
          <div class="text-[11px] text-slate-400 font-medium">${getEmployeeCode(data)}</div>
        </div>
      `,
    },
    {
      title: "Login Email",
      data: "email",
      render: (data) =>
        `<span class="text-xs font-semibold text-slate-600">${data || "-"}</span>`,
    },
    {
      title: "Role",
      data: "role",
      render: (data) =>
        `<span class="inline-flex px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold">${data?.name || "-"}</span>`,
    },
    {
      title: "Account Status",
      data: "employeeId",
      render: (data) => {
        const active = data?.status !== "inactive";
        return `<span class="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${
          active
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-slate-50 text-slate-500 border-slate-200"
        }">${active ? "Active" : "Inactive"}</span>`;
      },
    },
    {
      title: "Login Access",
      data: "isActive",
      render: (data) => {
        const active = data !== false;
        return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
          active
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-rose-50 text-rose-700 border-rose-200"
        }"><span class="h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-rose-500"
        }"></span>${active ? "Active" : "Inactive"}</span>`;
      },
    },
    ...(canUpdate
      ? [
          {
            title: "Action",
            data: null,
            orderable: false,
            render: (data) => `
              <div class="flex items-center gap-1.5">
                <button class="role-btn p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Change Role">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A9.004 9.004 0 0112 15c2.21 0 4.235.797 5.802 2.118M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>

                <button class="password-btn p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-100 hover:border-amber-500 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Reset Password">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586l6.257-6.257A6 6 0 1121 9z"/>
                  </svg>
                </button>

                <button class="status-btn p-1.5 rounded-lg ${
                  data.isActive !== false
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-600"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600"
                } hover:text-white border ${
                  data.isActive !== false
                    ? "border-rose-100 hover:border-rose-600"
                    : "border-emerald-100 hover:border-emerald-600"
                } transition-all duration-200 cursor-pointer" data-id="${data._id}" data-status="${
                  data.isActive !== false ? "inactive" : "active"
                }" title="${data.isActive !== false ? "Deactivate" : "Activate"}">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 105.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                </button>
              </div>
            `,
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {loading && <Loader />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
            User Access Master
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage employee account status, login access, role assignment, and password reset.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div onClick={() => setStatusFilter("all")} className={getMetricCardClass("all")}>
          {statusFilter === "all" && (
            <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-indigo-600 shadow-sm" />
          )}

          <div className={getMetricIconClass("all")}>
            <FiUserCheck className="w-5 h-5" />
          </div>

          <div>
            <p className={getMetricTitleClass("all")}>Total Users</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
              {metrics.total}
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
            <p className={getMetricTitleClass("active")}>Active Accounts</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
              {metrics.active}
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
            <p className={getMetricTitleClass("inactive")}>Inactive Accounts</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
              {metrics.inactive}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto w-full">
        <DataTable
          key={`${statusFilter}-${
            JSON.stringify(
              filteredUsers.map((item) => [
                item?._id || item?.id,
                item?.updatedAt,
                item?.status,
                item?.isActive,
                item?.name,
                item?.code,
              ])
            ) || "empty"
          }`}
          data={filteredUsers}
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

              document.querySelectorAll(".role-btn").forEach((btn) => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute("data-id");
                  const item = usersRef.current.find((row) => row._id === id);
                  if (item) openRoleModal(item);
                };
              });

              document.querySelectorAll(".password-btn").forEach((btn) => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute("data-id");
                  const item = usersRef.current.find((row) => row._id === id);
                  if (item) openPasswordModal(item);
                };
              });

              document.querySelectorAll(".status-btn").forEach((btn) => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute("data-id");
                  const status =
                    e.currentTarget.getAttribute("data-status") === "active";
                  const message = status
                    ? "activate this employee and login access?"
                    : "deactivate this employee and login access?";

                  if (confirm(`Are you sure you want to ${message}`)) {
                    handleStatusChange(id, status);
                  }
                };
              });
            },
          }}
        />
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <FiShield className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">Change Role</h3>
                <p className="text-xs text-slate-500">
                  {getEmployeeName(selectedUser)} · {getEmployeeCode(selectedUser)}
                </p>
              </div>
            </div>

            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Role
            </label>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat"
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRoleUpdate}
                className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <FiKey className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Reset Password
                </h3>
                <p className="text-xs text-slate-500">
                  {getEmployeeName(passwordUser)} · {passwordUser.email}
                </p>
              </div>
            </div>

            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              New Password
            </label>

            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to auto-generate"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />

            <label className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={sendMail}
                onChange={(e) => setSendMail(e.target.checked)}
                className="rounded border-slate-300 text-indigo-650 focus:ring-brand-500 h-4 w-4"
              />
              Send password email to user
            </label>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setPasswordUser(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePasswordReset}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccessList;