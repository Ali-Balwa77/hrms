import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasPermission } from '../../utils/permissions.js';

const RoleBasedRoute = ({ module, action = 'read', children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!module || hasPermission(user, module, action)) {
    return children;
  }

  return <Navigate to="/unauthorized" replace />;
};

export default RoleBasedRoute;
