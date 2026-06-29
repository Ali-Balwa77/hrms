import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import PermissionGuard from '../../components/auth/PermissionGuard.jsx';
import { hasPermission } from '../../utils/permissions.js';
import { api } from '../../services/api.js';
import AttendanceChart from '../../components/cart/attendanceCart.jsx';
import { route } from '../../utils/routeHelper.js';
import Loader from '../../components/common/Loader.jsx';
import { logError } from '../../utils/errorLogger.js';
import { 
  FiUsers, FiCheckSquare, FiCalendar, FiActivity, FiLayers, FiUserPlus, 
  FiGift, FiPlus, FiGrid, FiArrowRight, FiSliders, FiBriefcase, FiFileText
} from 'react-icons/fi';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      onLeaveToday: 0,
      presentEmployees: 0,
      attendanceRate: 0,
      organizations: 0,
      activeEmployees: 0,
    },
    recentActivities: [],
    upcomingHolidays: [],
    pendingLeaveRequests: [],
    attendanceData: [],
    leavesData: [],
  });
  const {
    stats,
    recentActivities,
    upcomingHolidays,
    pendingLeaveRequests,
    attendanceData,
    leavesData,
  } = dashboardData;
  const [loading, setLoading] = useState(true);

  const normalizedRoleName = String(user?.role?.name || "")
    .toLowerCase()
    .trim();

  const isAdminUser = normalizedRoleName === "admin";

  const dashboardCopy = useMemo(() => {
    if (isAdminUser) {
      return {
        badge: "Control Center",
        title: "System Administrator Workspace",
        description:
          "Manage tenant organizations, database models, policies, and company wide metrics.",
        securityLabel: "Security: Admin Level",
        versionLabel: "AG-HRMS v1.0",
        metadataBadge: "Metadata",
        metadataTitle: "Core Instance Stats",
        firstMetricTitle: "Active Database",
        firstMetricSubTitle: "Total Employees",
        secondMetricTitle: "Retention Rate",
        secondMetricSubTitle: "Active status percentage",
        thirdMetricTitle: "Tenants",
        thirdMetricSubTitle: "Organizations Registered",
      };
    }

    return {
      badge: "Overview",
      title: `${user?.role?.name || "Executive"} Workspace`,
      description:
        "Review employee insights, attendance performance, leave activity, and company updates.",
      securityLabel: `Role: ${user?.role?.name || "User"}`,
      versionLabel: "HRMS Portal",
      metadataBadge: "Insights",
      metadataTitle: "Organization Overview",
      firstMetricTitle: "Employee Profiles",
      firstMetricSubTitle: "Total Employees",
      secondMetricTitle: "Active Ratio",
      secondMetricSubTitle: "Active employee percentage",
      thirdMetricTitle: "Organizations",
      thirdMetricSubTitle: "Registered companies",
    };
  }, [isAdminUser, user?.role?.name]);

  const access = useMemo(() => ({
    employee: {
      read: hasPermission(user, "employee", "read"),
      create: hasPermission(user, "employee", "create"),
    },
    organization: {
      read: hasPermission(user, "organization", "read"),
      create: hasPermission(user, "organization", "create"),
    },
    holiday: {
      read: hasPermission(user, "holiday", "read"),
      create: hasPermission(user, "holiday", "create"),
    },
    leave: {
      read: hasPermission(user, "leave", "read"),
      create: hasPermission(user, "leave", "create"),
      approve: hasPermission(user, "leave", "approve"),
      reject: hasPermission(user, "leave", "reject"),
    },
    attendance: {
      read: hasPermission(user, "attendance", "read"),
      create: hasPermission(user, "attendance", "create"),
    },
    rule: {
      read: hasPermission(user, "rule", "read"),
      create: hasPermission(user, "rule", "create"),
    },
  }), [user]);

  const getDashboardData = (result) => {
    if (result.status !== "fulfilled") return [];
    const responseData = result.value?.data;
    return Array.isArray(responseData) ? responseData : responseData?.data || [];
  };

  const getTimeAgo = useCallback((createdAt) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  }, []);

  const getOnLeaveToday = (leaves) => {
    const today = new Date();

    return leaves.reduce((total, l) => {
      const from = new Date(l.from);
      const to = new Date(l.to);

      to.setHours(23, 59, 59, 999);

      if (
        l.status === "approved" &&
        today >= from &&
        today <= to
      ) {
        return total + 1;
      }

      return total;
    }, 0);
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [employeesResponse, organizationsResponse, holidaysResponse, leavesResponse, attendanceResponse] = await Promise.allSettled([
        access.employee.read
          ? api.get('/employees', { forceRefetch: true })
          : Promise.resolve({ data: [] }),
        access.organization.read
          ? api.get('/organizations', { forceRefetch: true })
          : Promise.resolve({ data: [] }),
        access.holiday.read
          ? api.get('/holidays', { forceRefetch: true })
          : Promise.resolve({ data: [] }),
        access.leave.read
          ? api.get('/leaves', { forceRefetch: true })
          : Promise.resolve({ data: [] }),
        access.attendance.read
          ? api.get('/attendance', { forceRefetch: true })
          : Promise.resolve({ data: [] }),
      ]);

      const employees = getDashboardData(employeesResponse);
      const organizations = getDashboardData(organizationsResponse);
      const holidays = getDashboardData(holidaysResponse);
      const leaves = getDashboardData(leavesResponse);
      const attendance = getDashboardData(attendanceResponse);

      const today = new Date();
      const activeEmployees = employees.filter(emp => emp.status === 'active').length;
      const presentToday = attendance.filter(
        a => a.date === formatDate(today) && a.checkIn
      );

      const nextStats = {
        totalUsers: employees.length,
        onLeaveToday: getOnLeaveToday(leaves),
        presentEmployees: presentToday.length,
        attendanceRate: employees.length > 0 ? Math.round((presentToday.length / employees.length) * 100) : 0,
        organizations: organizations.length,
        activeEmployees
      };

      const upcoming = holidays
        .filter(holiday => new Date(holiday.date) > today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);



      const pending = leaves
        .filter(leave => leave.status === 'pending')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);



      const activities = [];

      const recentEmployees = employees
        .filter(emp => emp.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);

      recentEmployees.forEach(emp => {
        activities.push({
          user: `${emp.firstName} ${emp.lastName}`,
          action: `Created new employee - ${emp.designation}`,
          time: getTimeAgo(emp.createdAt)
        });
      });

      activities.push(
        {
          user: 'System',
          action: `${activeEmployees} active employees today`,
          time: 'Today'
        },
        {
          user: 'System',
          action: `${organizations.length} organizations registered`,
          time: 'Today'
        }
      );

      setDashboardData((prev) => ({
        ...prev,
        stats: nextStats,
        attendanceData: attendance,
        leavesData: leaves,
        upcomingHolidays: upcoming,
        pendingLeaveRequests: pending,
        recentActivities: activities.slice(0, 6),
      }));
    } catch (error) {
      logError('Admin dashboard data load failed:', error);
    } finally {
      setLoading(false);
    }
  }, [access, getTimeAgo]);

  const formatDate = useCallback((date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statsArray = useMemo(() => [
    access.employee.read && {
      title: 'Total Employees',
      value: stats.totalUsers,
      change: `${stats.activeEmployees} active profiles`,
      changeType: 'positive',
      icon: FiUsers,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-indigo-650',
      bgColor: 'bg-indigo-50/50 border-indigo-100/50',
      link: '/employees'
    },
    access.attendance.read && {
      title: 'Present Today',
      value: stats.presentEmployees,
      change: 'Active in office',
      changeType: 'positive',
      icon: FiCheckSquare,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/50 border-emerald-100/50',
      link: '/employees?present=today'
    },
    access.leave.read && {
      title: 'On Leave',
      value: stats.onLeaveToday,
      change: 'Approved leaves today',
      changeType: 'positive',
      icon: FiCalendar,
      color: 'from-rose-500 to-pink-500',
      textColor: 'text-rose-650',
      bgColor: 'bg-rose-50/50 border-rose-100/50',
      link: '/leaves/application?status=leaveToday'
    },
    access.attendance.read && {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      change: 'Punctuality check',
      changeType: 'positive',
      icon: FiActivity,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50/50 border-amber-100/50',
      link: '/attendance'
    }
  ].filter(Boolean), [access, stats.totalUsers, stats.activeEmployees, stats.presentEmployees, stats.onLeaveToday, stats.attendanceRate]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {loading && <Loader />}
      
      {/* Greeting Header panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
        <div>
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2.5 py-1 rounded-full">
            {dashboardCopy.badge}
          </span>

          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-2.5">
            {dashboardCopy.title}
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            {dashboardCopy.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-2 ${
              isAdminUser
                ? "bg-rose-50 text-rose-600 border-rose-100/50"
                : "bg-indigo-50 text-brand-600 border-indigo-100/50"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full animate-pulse ${
                isAdminUser ? "bg-rose-500" : "bg-brand-500"
              }`}
            />
            {dashboardCopy.securityLabel}
          </span>

          <span className="px-3 py-1.5 bg-slate-100 text-slate-550 border border-slate-200/50 rounded-xl text-xs font-semibold">
            {dashboardCopy.versionLabel}
          </span>
        </div>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsArray.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={route(user, stat.link)}
              className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.title}</span>
                  <p className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">{loading ? '...' : stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${stat.color} text-white flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition-all`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className={`mt-4 px-3 py-1.5 rounded-lg border text-[11px] font-medium ${stat.bgColor} ${stat.textColor}`}>
                {stat.change}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts & lists row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance overview donut chart */}

        {(access.employee.read || access.attendance.read || access.leave.read) && (
          <div className="flex items-center justify-center w-full min-h-[220px]">
            {!loading && (
              <AttendanceChart
                employeeData={stats.totalUsers}
                attendanceData={attendanceData}
                leavesData={leavesData}
              />
            )}
          </div>
        )}

        {/* Holidays list */}
        {access.holiday.read && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calendar</span>
                <h2 className="text-sm font-semibold text-slate-800 mt-0.5">Upcoming Holidays</h2>
              </div>
              <PermissionGuard module="holiday" action="read">
                <Link to={route(user, "/holidays")} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
                  View All
                  <FiArrowRight />
                </Link>
              </PermissionGuard>
            </div>
            
            <div className="space-y-3.5">
              {upcomingHolidays.map((holiday, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100/40 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                      <FiGift className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-850">{holiday.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{holiday.type || 'Corporate'} Holiday</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700">{formatDate(holiday.date)}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{holiday.day}</p>
                  </div>
                </div>
              ))}
              {upcomingHolidays.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  No upcoming holidays scheduled
                </div>
              )}
            </div>
          </div>
        </div>
        )}

      </div>

      {/* Quick actions panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <PermissionGuard module="employee" action="create">
          <Link
            to={route(user, "/employees/new")}
            className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <FiUserPlus className="w-5 h-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Add Employee
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create profile
                </p>
              </div>
            </div>
          </Link>
        </PermissionGuard>

        <PermissionGuard module="organization" action="create">
          <Link
            to={route(user, "/organizations/new")}
            className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <FiBriefcase className="w-5 h-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Add Organization
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create company
                </p>
              </div>
            </div>
          </Link>
        </PermissionGuard>

        <PermissionGuard module="holiday" action="create">
          <Link
            to={route(user, "/holidays/new")}
            className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <FiCalendar className="w-5 h-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Create Holiday
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add holiday
                </p>
              </div>
            </div>
          </Link>
        </PermissionGuard>

        <PermissionGuard module="rule" action="create">
          <Link
            to={route(user, "/rules")}
            className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                <FiFileText className="w-5 h-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Add Regulation
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage rules
                </p>
              </div>
            </div>
          </Link>
        </PermissionGuard>
      </div>

      {/* System Metrics Panel */}
      {(access.employee.read || access.organization.read) && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {dashboardCopy.metadataBadge}
          </span>

          <h2 className="text-sm font-semibold text-slate-850 mt-0.5 mb-4">
            {dashboardCopy.metadataTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-slate-100 rounded-xl bg-slate-50/30">
              <div className="text-2xl font-extrabold text-brand-600">
                {loading ? "..." : stats.totalUsers}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                {dashboardCopy.firstMetricTitle}
              </div>
              <p className="text-[11px] text-slate-550 mt-1">
                {dashboardCopy.firstMetricSubTitle}
              </p>
            </div>

            <div className="text-center p-4 border border-slate-100 rounded-xl bg-slate-50/30">
              <div className="text-2xl font-extrabold text-emerald-600">
                {loading
                  ? "..."
                  : (Math.round(
                      (stats.activeEmployees / (stats.totalUsers || 1)) * 100
                    ) || 0) + "%"}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                {dashboardCopy.secondMetricTitle}
              </div>
              <p className="text-[11px] text-slate-550 mt-1">
                {dashboardCopy.secondMetricSubTitle}
              </p>
            </div>

            <div className="text-center p-4 border border-slate-100 rounded-xl bg-slate-50/30">
              <div className="text-2xl font-extrabold text-purple-600">
                {loading ? "..." : stats.organizations}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                {dashboardCopy.thirdMetricTitle}
              </div>
              <p className="text-[11px] text-slate-550 mt-1">
                {dashboardCopy.thirdMetricSubTitle}
              </p>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default AdminDashboard;

