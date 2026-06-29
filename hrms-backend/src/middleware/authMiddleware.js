import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { errorResponse } from "../utils/errorResponse.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return errorResponse(
      res,
      401,
      "Please login to continue.",
      "Unauthorized"
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password").populate('role').populate('employeeId', 'status');

    if (!req.user) {
      return errorResponse(
        res,
        401,
        "User account no longer exists. Please login again.",
        "UserNotFound"
      );
    }

    if (Number(decoded.version) !== Number(req.user.tokenVersion)) {
      return errorResponse(
        res,
        401,
        "Session expired. Logged in elsewhere.",
        "TokenVersionMismatch"
      );
    }

    if (!req.user.isActive) {
      return errorResponse(
        res,
        401,
        "Your account is inactive. Please contact admin.",
        "InactiveUser"
      );
    }

    if (req.user.employeeId?.status === "inactive") {
      return errorResponse(
        res,
        401,
        "Employee account is inactive. Please contact admin.",
        "InactiveEmployee"
      );
    }

    next();

  } catch (error) {

    if (error.name === "TokenExpiredError") {
      return errorResponse(
        res,
        401,
        "Session expired. Please login again.",
        "TokenExpired"
      );
    }

    // return errorResponse(
    //   res,
    //   401,
    //   "Invalid session. Please login again.",
    //   "InvalidToken"
    // );
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
};