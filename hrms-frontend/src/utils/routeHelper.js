export const route = (_user, path = "") => {
  if (!path) return "/dashboard";
  return path.startsWith("/") ? path : `/${path}`;
};

export const roleSlug = (role) => {
  const rawRole = typeof role === "string" ? role : role?.name || "employee";
  return rawRole.toLowerCase().trim().replace(/[^a-z0-9]+/g, "") || "employee";
};

export const routeRoleSlug = roleSlug;
