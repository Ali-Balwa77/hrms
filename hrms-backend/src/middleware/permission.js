import User from '../models/User.js';

export const checkPermission = (module, action = "read") => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).populate("role");

      if (!user || !user.role) {
        return res.status(403).json({ message: "No role assigned" });
      }

      if (user.role.isActive === false) {
        return res.status(403).json({ message: "Role is inactive" });
      }

      const permissions = Array.isArray(user.role.permissions) ? user.role.permissions : [];
      const hasAccess = permissions.some(
        (p) => p.module === module && Array.isArray(p.actions) && p.actions.includes(action)
      );

      if (!hasAccess) {
        return res.status(403).json({ message: "Access Denied" });
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

export const checkAnyPermission = (checks = []) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).populate("role");

      if (!user || !user.role) {
        return res.status(403).json({ message: "No role assigned" });
      }

      if (user.role.isActive === false) {
        return res.status(403).json({ message: "Role is inactive" });
      }

      const permissions = Array.isArray(user.role.permissions) ? user.role.permissions : [];
      const hasAccess = checks.some((check) =>
        permissions.some(
          (p) =>
            p.module === check.module &&
            Array.isArray(p.actions) &&
            p.actions.includes(check.action || "read")
        )
      );

      if (!hasAccess) {
        return res.status(403).json({ message: "Access Denied" });
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
