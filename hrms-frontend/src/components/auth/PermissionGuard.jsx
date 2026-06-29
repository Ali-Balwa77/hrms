import React from 'react';
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasPermission } from "../../utils/permissions";

const PermissionGuard = ({ module, action, children, redirect = false, fallback = null }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return redirect ? <Navigate to="/login" replace /> : fallback;
  }

  if (!hasPermission(user, module, action)) {
    return redirect ? <Navigate to="/unauthorized" replace /> : fallback;
  }

  return children;
};

export default PermissionGuard;
