import { Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy } from "react";

import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import PermissionGuard from "../components/auth/PermissionGuard.jsx";
import Loader from "../components/common/Loader.jsx";

import "datatables.net-dt/css/dataTables.dataTables.min.css";
import "react-datepicker/dist/react-datepicker.css";


const LoginPage = lazy(() => import("../pages/auth/LoginPage.jsx"));
const UnauthorizedPage = lazy(() => import("../pages/auth/UnauthorizedPage.jsx"));
const DashboardRouter = lazy(() => import("../pages/dashboard/DashboardRouter.jsx"));

const EmployeeListPage = lazy(() => import("../pages/employees/EmployeeListPage.jsx"));
const EmployeeFormPage = lazy(() => import("../pages/employees/EmployeeFormPage.jsx"));
const NewEmployeeListPage = lazy(() => import("../pages/employees/NewEmployeeListPage.jsx"));
const TeamEmployees = lazy(() => import("../pages/employees/TeamEmployees.jsx"));

const OrganizationListPage = lazy(() => import("../pages/organizations/OrganizationListPage.jsx"));
const OrganizationDetailPage = lazy(() => import("../pages/organizations/OrganizationDetailPage.jsx"));

const AttendanceReportPage = lazy(() => import("../pages/attendance/AttendanceReportPage.jsx"));
const MispunchList = lazy(() => import("../pages/mispunch/MispunchList.jsx"));
const MispunchForm = lazy(() => import("../pages/mispunch/MispunchForm.jsx"));

const LeaveListPage = lazy(() => import("../pages/leaves/LeaveListPage.jsx"));
const LeaveDetailPage = lazy(() => import("../pages/leaves/LeaveDetailPage.jsx"));
const LeaveRequestEmployee = lazy(() => import("../pages/leaves/LeaveRequestEmployee.jsx"));
const LeaveApprovalForm = lazy(() => import("../pages/leaves/LeaveApprovalForm.jsx"));
const CalendarLeaveReports = lazy(() => import("../pages/leaves/CalendarLeaveReports.jsx"));
const LeaveCancelEmployee = lazy(() => import("../pages/leaves/LeaveCancelEmployee.jsx"));
const LeaveCancellationForm = lazy(() => import("../pages/leaves/LeaveCancellationForm.jsx"));
const LeaveCancellationApprovalForm = lazy(() => import("../pages/leaves/LeaveCancellationApprovalForm.jsx"));
const LeaveCancellationRequestEmployee = lazy(() => import("../pages/leaves/LeaveCancellationRequestEmployee.jsx"));
const AddLeaveType = lazy(() => import("../pages/leaveType/AddLeaveType.jsx"));
const LeaveTypeList = lazy(() => import("../pages/leaveType/LeaveTypeList.jsx"));
const QuarterlyLeavePolicyList = lazy(() => import("../pages/quarterlyLeavePolicy/QuarterlyLeavePolicyList.jsx"));
const QuarterlyLeavePolicyForm = lazy(() => import("../pages/quarterlyLeavePolicy/QuarterlyLeavePolicyForm.jsx"));

const HolidayListPage = lazy(() => import("../pages/holidays/HolidayListPage.jsx"));
const HolidayDetailPage = lazy(() => import("../pages/holidays/HolidayDetailPage.jsx"));

const RulesPage = lazy(() => import("../pages/rules/RulesPage.jsx"));
const Profile = lazy(() => import("../pages/profile.jsx"));

const ForgotPasswordPage = lazy(() => import("../pages/password/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("../pages/password/ResetPasswordPage.jsx"));
const ChangePasswordPage = lazy(() => import("../pages/password/changePassword.jsx"));

const ReportingManagerMaster = lazy(() => import("../pages/admin/ReportingManagerMaster.jsx"));

const DesignationList = lazy(() => import("../pages/designations/DesignationList.jsx"));
const DesignationForm = lazy(() => import("../pages/designations/DesignationForm.jsx"));
const RoleList = lazy(() => import("../pages/roles/RoleList.jsx"));
const RoleForm = lazy(() => import("../pages/roles/RoleForm.jsx"));
const UserAccessList = lazy(() => import("../pages/users/UserAccessList.jsx"));

const ReportsDashboard = lazy(() => import("../pages/reports/ReportsDashboard.jsx"));
const SettingsCenter = lazy(() => import("../pages/settings/SettingsCenter.jsx"));


function Guarded({ module, action, children }) {
    if (!module) return children;

    return (
        <PermissionGuard module={module} action={action} redirect>
            {children}
        </PermissionGuard>
    );
}


export default function AppRoutes() {
    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/password/forgot" element={<ForgotPasswordPage />} />
                <Route path="/password/reset/:token" element={<ResetPasswordPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<DashboardLayout />}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardRouter />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="change-password" element={<ChangePasswordPage />} />
                        <Route
                            path="employees"
                            element={
                                <Guarded module="employee" action="read">
                                    <EmployeeListPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="newHireEmployee"
                            element={
                                <Guarded module="employee" action="read">
                                    <NewEmployeeListPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="teamEmployee"
                            element={
                                <Guarded module="employee" action="read">
                                    <TeamEmployees />
                                </Guarded>
                            }
                        />
                        <Route
                            path="employees/new"
                            element={
                                <Guarded module="employee" action="create">
                                    <EmployeeFormPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="employees/:id"
                            element={
                                <Guarded module="employee" action="update">
                                    <EmployeeFormPage />
                                </Guarded>
                            }
                        />

                        <Route
                            path="reporting-manager-master"
                            element={
                                <Guarded module="employee" action="update">
                                    <ReportingManagerMaster />
                                </Guarded>
                            }
                        />

                        <Route
                            path="designations"
                            element={
                                <PermissionGuard module="designation" action="read" redirect>
                                    <DesignationList />
                                </PermissionGuard>
                            }
                        />

                        <Route
                            path="designations/new"
                            element={
                                <PermissionGuard module="designation" action="create" redirect>
                                    <DesignationForm />
                                </PermissionGuard>
                            }
                        />

                        <Route
                            path="designations/:id"
                            element={
                                <PermissionGuard module="designation" action="update" redirect>
                                    <DesignationForm />
                                </PermissionGuard>
                            }
                        />
                        <Route
                            path="roles"
                            element={
                                <Guarded module="role" action="read">
                                    <RoleList />
                                </Guarded>
                            }
                        />
                        <Route
                            path="roles/new"
                            element={
                                <Guarded module="role" action="create">
                                    <RoleForm />
                                </Guarded>
                            }
                        />
                        <Route
                            path="roles/:id"
                            element={
                                <Guarded module="role" action="update">
                                    <RoleForm />
                                </Guarded>
                            }
                        />
                        <Route
                            path="users"
                            element={
                                <Guarded module="user" action="read">
                                    <UserAccessList />
                                </Guarded>
                            }
                        />
                        <Route
                            path="organizations"
                            element={
                                <Guarded module="organization" action="read">
                                    <OrganizationListPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="organizations/new"
                            element={
                                <Guarded module="organization" action="create">
                                    <OrganizationDetailPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="organizations/:id"
                            element={
                                <Guarded module="organization" action="update">
                                    <OrganizationDetailPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/quarterly-leave-policy"
                            element={
                                <Guarded module="leave-type" action="read">
                                    <QuarterlyLeavePolicyList />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/quarterly-leave-policy/new"
                            element={
                                <Guarded module="leave-type" action="create">
                                    <QuarterlyLeavePolicyForm />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/quarterly-leave-policy/:id"
                            element={
                                <Guarded module="leave-type" action="update">
                                    <QuarterlyLeavePolicyForm />
                                </Guarded>
                            }
                        />
                        <Route
                            path="attendance"
                            element={
                                <Guarded module="attendance" action="read">
                                    <AttendanceReportPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="mispunch/application"
                            element={
                                <Guarded module="mispunch" action="read">
                                    <MispunchList />
                                </Guarded>
                            }
                        />
                        <Route
                            path="mispunch/requests"
                            element={
                                <Guarded module="mispunch" action="approve">
                                    <MispunchList approval />
                                </Guarded>
                            }
                        />
                        <Route
                            path="mispunch/new"
                            element={
                                <Guarded module="mispunch" action="create">
                                    <MispunchForm />
                                </Guarded>
                            }
                        />
                        <Route
                            path="mispunch/approval/:id"
                            element={
                                <Guarded module="mispunch" action="approve">
                                    <MispunchForm />
                                </Guarded>
                            }
                        />
                        <Route
                            path="mispunch/:id"
                            element={
                                <Guarded module="mispunch" action="read">
                                    <MispunchForm />
                                </Guarded>
                            }
                        />

                        <Route
                            path="leaves/application"
                            element={
                                <Guarded module="leave" action="read">
                                    <LeaveListPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/cancellation"
                            element={
                                <Guarded module="leave" action="read">
                                    <LeaveCancelEmployee />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/leave-reports"
                            element={
                                <Guarded module="leave" action="read">
                                    <CalendarLeaveReports />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/leave-type"
                            element={
                                <Guarded module="leave-type" action="read">
                                    <LeaveTypeList />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/leave-type/new"
                            element={
                                <Guarded module="leave-type" action="create">
                                    <AddLeaveType />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/leave-type/:id"
                            element={
                                <Guarded module="leave-type" action="update">
                                    <AddLeaveType />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/leave-requests"
                            element={
                                <Guarded module="leave" action="approve">
                                    <LeaveRequestEmployee />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/leave-requests-cancel"
                            element={
                                <Guarded module="leave" action="approve">
                                    <LeaveCancellationRequestEmployee />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/new"
                            element={
                                <Guarded module="leave" action="create">
                                    <LeaveDetailPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/cancel/new"
                            element={
                                <Guarded module="leave" action="create">
                                    <LeaveCancellationForm />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/approval/:id"
                            element={
                                <Guarded module="leave" action="approve">
                                    <LeaveApprovalForm />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/cancel/approval/:id"
                            element={
                                <Guarded module="leave" action="approve">
                                    <LeaveCancellationApprovalForm />
                                </Guarded>
                            }
                        />
                        <Route
                            path="leaves/:id"
                            element={
                                <Guarded module="leave" action="read">
                                    <LeaveDetailPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="holidays"
                            element={
                                <Guarded module="holiday" action="read">
                                    <HolidayListPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="holidays/new"
                            element={
                                <Guarded module="holiday" action="create">
                                    <HolidayDetailPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="holidays/:id"
                            element={
                                <Guarded module="holiday" action="update">
                                    <HolidayDetailPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="rules"
                            element={
                                <Guarded module="rule" action="read">
                                    <RulesPage />
                                </Guarded>
                            }
                        />
                        <Route
                            path="reports"
                            element={<ReportsDashboard />}
                        />
                        <Route
                            path="settings"
                            element={<SettingsCenter />}
                        />
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Suspense>
    );
}
