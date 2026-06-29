import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Role from "../models/Role.js";

dotenv.config();

const p = (module, actions) => ({ module, actions });

const roleAccess = {
  admin: {
    permissions: [
      p("dashboard", ["read"]),
      p("employee", ["create", "read", "update", "delete"]),
      p("organization", ["create", "read", "update", "delete"]),
      p("attendance", ["create", "read", "update", "delete"]),
      p("mispunch", ["create", "read", "update", "delete", "approve", "reject"]),
      p("punch-card", ["read"]),
      p("holiday", ["create", "read", "update", "delete"]),
      p("rule", ["create", "read", "update", "delete"]),
      p("leave", ["create", "read", "update", "delete", "approve", "reject"]),
      p("leave-type", ["create", "read", "update", "delete"]),
      p("designation", ["create", "read", "update", "delete"]),
      p("role", ["create", "read", "update", "delete"]),
      p("user", ["read", "update"]),
    ],
    features: [
      "employee_menu",
      "reporting_manager_master",
      "leave_approval_menu",
      "leave_cancel_approval_menu",
      "leave_type_menu",
      "quarterly_leave_policy_menu",
      "leave_report_menu",
      "mispunch_self_menu",
      "mispunch_approval_menu",
      "designation_menu",
      "view_all_attendance",
      "manage_rules",
    ],
  },

  hr: {
    permissions: [
      p("dashboard", ["read"]),
      p("employee", ["create", "read", "update", "delete"]),
      p("organization", ["read"]),
      p("attendance", ["create", "read"]),
      p("mispunch", ["create", "read", "update", "delete", "approve", "reject"]),
      p("punch-card", ["read"]),
      p("holiday", ["create", "read", "update", "delete"]),
      p("rule", ["create", "read", "update", "delete"]),
      p("leave", ["create", "read", "update", "delete", "approve", "reject"]),
      p("leave-type", ["create", "read", "update", "delete"]),
      p("designation", ["create", "read", "update", "delete"]),
    ],
    features: [
      "employee_menu",
      "leave_self_menu",
      "leave_approval_menu",
      "leave_cancel_approval_menu",
      "leave_type_menu",
      "quarterly_leave_policy_menu",
      "leave_report_menu",
      "mispunch_self_menu",
      "mispunch_approval_menu",
      "designation_menu",
      "view_all_attendance",
      "manage_rules",
    ],
  },

  teamlead: {
    permissions: [
      p("dashboard", ["read"]),
      p("employee", ["read"]),
      p("attendance", ["create", "read"]),
      p("mispunch", ["create", "read", "update", "delete", "approve", "reject"]),
      p("punch-card", ["read"]),
      p("holiday", ["read"]),
      p("rule", ["read"]),
      p("leave", ["create", "read", "update", "delete", "approve", "reject"]),
    ],
    features: [
      "employee_menu",
      "team_employee_list",
      "leave_self_menu",
      "leave_approval_menu",
      "leave_cancel_approval_menu",
      "leave_report_menu",
      "mispunch_self_menu",
      "mispunch_approval_menu",
      "view_all_attendance",
      "team_leave_scope",
    ],
  },

  employee: {
    permissions: [
      p("dashboard", ["read"]),
      p("attendance", ["create", "read"]),
      p("mispunch", ["create", "read", "update", "delete"]),
      p("punch-card", ["read"]),
      p("holiday", ["read"]),
      p("rule", ["read"]),
      p("leave", ["create", "read", "update", "delete"]),
    ],
    features: ["leave_self_menu", "mispunch_self_menu"],
  },

  intern: {
    permissions: [
      p("dashboard", ["read"]),
      p("attendance", ["create", "read"]),
      p("mispunch", ["create", "read", "update", "delete"]),
      p("punch-card", ["read"]),
      p("holiday", ["read"]),
      p("rule", ["read"]),
      p("leave", ["create", "read", "update", "delete"]),
    ],
    features: ["leave_self_menu", "mispunch_self_menu"],
  },
};

const normalize = (name = "") =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "");

const run = async () => {
  try {
    await connectDB();

    const roles = await Role.find({});

    for (const role of roles) {
      const config = roleAccess[normalize(role.name)];

      if (!config) {
        continue;
      }

      role.permissions = config.permissions;
      role.features = config.features;
      role.isActive = true;

      await role.save();

    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    await mongoose.connection.close();
    process.exit(1);
  }
};

run();
