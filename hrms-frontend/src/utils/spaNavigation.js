export const normalizePath = (path = '') => {
  if (!path) return '/dashboard';
  return path.startsWith('/') ? path : `/${path}`;
};

export const buildNestedPath = (parent = '', child = '') => {
  const parentPath = normalizePath(parent);

  if (!child) return parentPath;
  if (child.startsWith('/')) return child;

  return `${parentPath}/${child}`.replace(/\/+/g, '/');
};

export const redirectToLogin = (navigate, options = {}) => {
  navigate('/login', { replace: true, ...options });
};
