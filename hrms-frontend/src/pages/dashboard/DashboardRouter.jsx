import React from 'react';
import { useSelector } from "react-redux";
import AdminDashboard from "./AdminDashboard.jsx";
import HRDashboard from "./HRDashboard.jsx";
import EmployeeDashboard from "./EmployeeDashboard.jsx";
import { hasPermission } from "../../utils/permissions.js";

const normalizeRoleName = (value = "") =>
  String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "");

const DashboardRouter = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <div>Loading...</div>;
  }

  const roleName = normalizeRoleName(user?.role?.name);

  // Existing roles - do not change old functionality
  if (roleName === "admin" || roleName === "superadmin") {
    return <AdminDashboard />;
  }

  if (roleName === "hr") {
    return <HRDashboard />;
  }

  if (roleName === "teamlead" || roleName === "employee" || roleName === "intern") {
    return <EmployeeDashboard />;
  }

  // Custom roles like CEO / Director / Manager
  const canViewAdminDashboard =
    hasPermission(user, "employee", "read") ||
    hasPermission(user, "organization", "read") ||
    hasPermission(user, "user", "read") ||
    hasPermission(user, "role", "read") ||
    hasPermission(user, "designation", "read") ||
    hasPermission(user, "leave-type", "read");

  const canViewHRDashboard =
    hasPermission(user, "leave", "approve") ||
    hasPermission(user, "leave", "reject");

  if (canViewAdminDashboard) {
    return <AdminDashboard />;
  }

  if (canViewHRDashboard) {
    return <HRDashboard />;
  }

  return <EmployeeDashboard />;
};

export default DashboardRouter;
