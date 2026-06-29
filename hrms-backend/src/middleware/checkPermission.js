export const canReadEmployeeDetail = async (req, res, next) => {
  const loginEmployeeId = req.user?.employeeId?._id || req.user?.employeeId;
  const requestedEmployeeId = req.params.id;
  
  const hasEmployeeRead = req.user?.role?.permissions?.some(
    (p) =>
      p.module === "employee" &&
      Array.isArray(p.actions) &&
      p.actions.includes("read")
  );

  
  if (hasEmployeeRead) {
    return next();
  }

  
  if (
    loginEmployeeId &&
    requestedEmployeeId &&
    String(loginEmployeeId) === String(requestedEmployeeId)
  ) {
    return next();
  }

  return res.status(403).json({
    message: "Access denied",
  });
};