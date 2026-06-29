export const MODULES = [
  { key: "dashboard", label: "Dashboard", actions: ["read"] },
  {
    key: "employee",
    label: "Employees",
    actions: [
      "create",
      "read",
      "update",
      "delete",
      "employee_menu",
      "team_employee_list",
      "reporting_manager_master",
    ],
  },
  { key: "organization", label: "Organizations", actions: ["create", "read", "update", "delete"] },
  {
    key: "attendance",
    label: "Attendance",
    actions: ["create", "read", "update", "delete", "view_all_attendance"],
  },
  { key: "punch-card", label: "Punch Card", actions: ["read"] },
  {
    key: "mispunch",
    label: "Mispunch",
    actions: ["create", "read", "update", "delete", "approve", "reject", "mispunch_self_menu", "mispunch_approval_menu"],
  },
  { key: "holiday", label: "Holidays", actions: ["create", "read", "update", "delete"] },
  {
    key: "rule",
    label: "Rules & Regulation",
    actions: ["create", "read", "update", "delete", "manage_rules"],
  },
  {
    key: "leave",
    label: "Leaves",
    actions: [
      "create",
      "read",
      "update",
      "delete",
      "approve",
      "reject",
      "leave_self_menu",
      "leave_approval_menu",
      "leave_cancel_approval_menu",
      "leave_report_menu",
      "team_leave_scope",
    ],
  },
  {
    key: "leave-type",
    label: "Leave Types",
    actions: ["create", "read", "update", "delete", "leave_type_menu", "quarterly_leave_policy_menu"],
  },
  {
    key: "designation",
    label: "Designation Master",
    actions: ["create", "read", "update", "delete", "designation_menu"],
  },
  { key: "role", label: "Role Management", actions: ["create", "read", "update", "delete"] },
  { key: "user", label: "User Access Master", actions: ["read", "update"] },
];

// Feature UI has been removed. These entries keep old saved roles working by
// converting old feature flags into equivalent permission actions.
const LEGACY_FEATURE_PERMISSION_MAP = {
  employee_menu: [{ module: "employee", action: "employee_menu" }],
  team_employee_list: [{ module: "employee", action: "team_employee_list" }],
  reporting_manager_master: [{ module: "employee", action: "reporting_manager_master" }],
  leave_self_menu: [{ module: "leave", action: "leave_self_menu" }],
  leave_approval_menu: [{ module: "leave", action: "leave_approval_menu" }],
  leave_cancel_approval_menu: [{ module: "leave", action: "leave_cancel_approval_menu" }],
  leave_type_menu: [{ module: "leave-type", action: "leave_type_menu" }],
  quarterly_leave_policy_menu: [{ module: "leave-type", action: "quarterly_leave_policy_menu" }],
  leave_report_menu: [{ module: "leave", action: "leave_report_menu" }],
  designation_menu: [{ module: "designation", action: "designation_menu" }],
  view_all_attendance: [{ module: "attendance", action: "view_all_attendance" }],
  manage_rules: [{ module: "rule", action: "manage_rules" }],
  team_leave_scope: [{ module: "leave", action: "team_leave_scope" }],
  mispunch_self_menu: [{ module: "mispunch", action: "mispunch_self_menu" }],
  mispunch_approval_menu: [{ module: "mispunch", action: "mispunch_approval_menu" }],
};

const normalizePermissionList = (permissions = []) => {
  const permissionMap = new Map();

  permissions.forEach((permission) => {
    if (!permission?.module) return;

    const existingActions = permissionMap.get(permission.module) || [];
    const nextActions = Array.isArray(permission.actions) ? permission.actions : [];

    permissionMap.set(
      permission.module,
      Array.from(new Set([...existingActions, ...nextActions]))
    );
  });

  return Array.from(permissionMap.entries())
    .filter(([, actions]) => actions.length > 0)
    .map(([module, actions]) => ({ module, actions }));
};

export const getPermissionsFromLegacyFeatures = (features = []) => {
  if (!Array.isArray(features)) return [];

  return features.flatMap((featureKey) => LEGACY_FEATURE_PERMISSION_MAP[featureKey] || []);
};

export const normalizePermissionsFromFeatures = (permissions = [], features = []) => {
  const mappedPermissions = getPermissionsFromLegacyFeatures(features).map((item) => ({
    module: item.module,
    actions: [item.action],
  }));

  return normalizePermissionList([...permissions, ...mappedPermissions]);
};

export const getEffectivePermissions = (user) => {
  const permissions = user?.role?.permissions;
  const features = user?.role?.features;

  return normalizePermissionsFromFeatures(
    Array.isArray(permissions) ? permissions : [],
    Array.isArray(features) ? features : []
  );
};

export const hasPermission = (user, module, action = "read") => {
  if (!module) return true;

  return getEffectivePermissions(user).some(
    (permission) =>
      permission.module === module &&
      Array.isArray(permission.actions) &&
      permission.actions.includes(action)
  );
};

export const hasAnyPermission = (user, checks = []) => {
  return checks.some((check) => hasPermission(user, check.module, check.action || "read"));
};

export const hasAllPermissions = (user, checks = []) => {
  return checks.every((check) => hasPermission(user, check.module, check.action || "read"));
};

// Compatibility wrapper for old imports only. New code should use permission actions directly.
export const hasFeature = (user, featureKey) => {
  if (!featureKey) return true;

  const permissionChecks = LEGACY_FEATURE_PERMISSION_MAP[featureKey] || [];
  return permissionChecks.some((check) => hasPermission(user, check.module, check.action));
};

export const hasAnyFeature = (user, featureKeys = []) => {
  return featureKeys.some((featureKey) => hasFeature(user, featureKey));
};

export const isSelfServiceRole = (user) => {
  return !hasAnyPermission(user, [
    { module: "employee", action: "employee_menu" },
    { module: "leave", action: "leave_approval_menu" },
    { module: "leave", action: "leave_cancel_approval_menu" },
    { module: "attendance", action: "view_all_attendance" },
    { module: "rule", action: "manage_rules" },
  ]);
};
