import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import PermissionGuard from '../../components/auth/PermissionGuard.jsx';
import { hasPermission } from '../../utils/permissions.js';
import { api } from '../../services/api.js';
import LeaveTrends from '../../components/cart/leaveCart.jsx';
import toast from 'react-hot-toast';
import { route } from '../../utils/routeHelper.js';
import Loader from '../../components/common/Loader.jsx';
import {
  PUNCH_STATUS,
  selectPunchStatus,
  setPunchStatus,
  setPunchStatusFromAttendance,
} from "../../redux/slices/attendancePunchSlice.js";
import { logError } from '../../utils/errorLogger.js';
import {
  FiUsers, FiCalendar, FiFileText, FiClock, FiPlus, FiCheck, FiUserPlus,
  FiCoffee, FiTrendingUp, FiActivity, FiArrowRight, FiAward, FiGift, FiCheckSquare,
  FiSend
} from 'react-icons/fi';


const getEmployeeIdValue = (employeeId) => employeeId?._id || employeeId?.id || employeeId;

const isSameEmployee = (left, right) => {
  const leftId = getEmployeeIdValue(left);
  const rightId = getEmployeeIdValue(right);
  return Boolean(leftId && rightId && String(leftId) === String(rightId));
};

const HRDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const punchStatus = useSelector((state) => selectPunchStatus(state, user?.employeeId));
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEmployee: 0,
      pendingLeaves: 0,
      leavebalance: [],
      attendanceToday: 0,
      newHires: 0,
      activeEmployees: 0,
      workHours: "00:00:00",
    },
    upcomingHolidays: [],
    pendingLeaveRequests: [],
    avgLeavePerMonth: 0,
    recentActivity: [],
    recentAttendances: [],
    departmentWiseCount: [],
  });
  const {
    stats,
    upcomingHolidays,
    pendingLeaveRequests,
    avgLeavePerMonth,
    recentActivity,
    recentAttendances,
    departmentWiseCount,
  } = dashboardData;
  const [loading, setLoading] = useState(false);
  const [punchLoading, setPunchLoading] = useState(false);

  const access = React.useMemo(() => ({
    employee: {
      read: hasPermission(user, "employee", "read"),
      create: hasPermission(user, "employee", "create"),
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
    holiday: {
      read: hasPermission(user, "holiday", "read"),
      create: hasPermission(user, "holiday", "create"),
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

  // Real-time ticking clock for punch widget
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!user?.employeeId) return undefined;

    fetchDashboardData();
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, [user?.employeeId]);

  const getAvgLeavePerMonth = (leaves, employeeCount = 0) => {
    let totalDays = 0;
    const uniqueMonths = new Set();

    leaves.forEach(leave => {
      const start = new Date(leave.from);
      const end = new Date(leave.to);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        return;
      }

      const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      totalDays += days;
      const monthKey = start.getFullYear() + "-" + (start.getMonth() + 1);
      uniqueMonths.add(monthKey);
    });

    const avg = uniqueMonths.size && employeeCount
      ? totalDays / uniqueMonths.size / employeeCount
      : 0;

    return avg.toFixed(1);
  };

  const parseAttendanceDate = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const rawValue = String(value).trim();
    const ddmmyyyy = rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsed = new Date(rawValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const fetchDashboardData = useCallback(async (syncPunchStatus = true) => {
    if (!user?.employeeId) return;

    setLoading(true);
    try {
      const [employeesResponse, leavesResponse, attendanceResponce, holidaysResponse] = await Promise.allSettled([
        access.employee.read
          ? api.get('employees', { forceRefetch: true })
          : Promise.resolve({ data: [] }),
        access.leave.read
          ? api.get('leaves', { forceRefetch: true })
          : Promise.resolve({ data: [] }),
        access.attendance.read
          ? api.get('attendance', { forceRefetch: true })
          : Promise.resolve({ data: [] }),
        access.holiday.read
          ? api.get('holidays', { forceRefetch: true })
          : Promise.resolve({ data: [] }),
      ]);

      const employees = getDashboardData(employeesResponse);
      const leaves = getDashboardData(leavesResponse);
      const attendance = getDashboardData(attendanceResponce);
      const holidays = getDashboardData(holidaysResponse);

      const today = new Date();
      const todayStr = formatDate(today);
      const activeEmployees = employees.filter(emp => emp.status === 'active').length;
      const pendingLeaves = leaves.filter(leave => leave.status === 'pending');
      const todayAttendance = attendance.find((attendanceItem) => {
        if (attendanceItem.date !== todayStr) return false;
        if (!attendanceItem.employeeId) return true;
        return isSameEmployee(attendanceItem.employeeId, user.employeeId);
      });

      const presentToday = attendance.filter(
        a => a.date === formatDate(today) && a.checkIn
      );

      const newHires = employees.filter(emp => {
        const date = new Date(emp.joinDate);
        return (
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
      }).length;

      const hrEmployee = employees.find(emp => emp.employeeType === 'HR') || { leaveBalance: [] };

      const nextStats = {
        totalEmployee: employees.length,
        pendingLeaves: pendingLeaves.length,
        leavebalance: hrEmployee.leaveBalance,
        attendanceToday: presentToday.length,
        newHires,
        activeEmployees,
        workHours: todayAttendance?.totalHours || "00:00:00"
      };

      if (syncPunchStatus && todayAttendance) {
        dispatch(setPunchStatusFromAttendance({
          employeeId: user.employeeId,
          attendance: todayAttendance,
        }));
      }

      const userRecentAttendances = attendance
        .filter((a) => {
          const attendanceDate = parseAttendanceDate(a.date);
          return (
            isSameEmployee(a.employeeId, user.employeeId) &&
            attendanceDate &&
            attendanceDate.getFullYear() === today.getFullYear() &&
            attendanceDate.getMonth() === today.getMonth()
          );
        })
        .sort((a, b) => parseAttendanceDate(b.date) - parseAttendanceDate(a.date))
        .slice(0, 5);

      const nextAvgLeavePerMonth = getAvgLeavePerMonth(leaves, activeEmployees);

      const upcoming = holidays
        .filter(holiday => new Date(holiday.date) > today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);



      const pending = leaves
        .filter(leave => leave.status === 'pending')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);



      const deptCount = {};
      employees.forEach(emp => {
        const dept = emp.department || "Other";
        deptCount[dept] = (deptCount[dept] || 0) + 1;
      });

      const deptArray = Object.keys(deptCount).map(dept => ({
        name: dept,
        count: deptCount[dept]
      }));



      const activities = [];
      const employeeMap = {};

      employees.forEach(emp => {
        employeeMap[emp._id.toString()] = `${emp.firstName} ${emp.lastName}`;
      });

      employees.slice(-3).forEach(emp => {
        activities.push({
          message: `${emp.firstName} ${emp.lastName} joined as ${emp.designation}`,
          time: emp.createdAt,
          type: 'new_hire'
        });
      });

      leaves.slice(0, 5).forEach(leave => {
        let empName = "";
        if (leave.employeeId && typeof leave.employeeId === "object") {
          empName = `${leave.employeeId.firstName} ${leave.employeeId.lastName}`;
        } else {
          empName = employeeMap[leave.employeeId?.toString()] || "Unknown";
        }
        activities.push({
          message: `${empName} applied for leave`,
          time: leave.createdAt,
          type: 'leave'
        });
      });

      employees.forEach(emp => {
        const dob = new Date(emp.dob);
        if (dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth()) {
          activities.push({
            message: `Today is ${emp.firstName} ${emp.lastName}'s birthday! 🎉`,
            time: new Date(),
            type: 'birthday'
          });
        }
      });

      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setDashboardData((prev) => ({
        ...prev,
        stats: nextStats,
        upcomingHolidays: upcoming,
        pendingLeaveRequests: pending,
        avgLeavePerMonth: nextAvgLeavePerMonth,
        recentActivity: activities,
        recentAttendances: userRecentAttendances,
        departmentWiseCount: deptArray,
      }));
    } catch (error) {
      logError('HR dashboard data load failed:', error);
    } finally {
      setLoading(false);
    }
  }, [access, dispatch, getAvgLeavePerMonth, user?.employeeId]);

  const handleCheckIn = async () => {
    try {
      setPunchLoading(true);

      const now = new Date();

      await api.post("/attendance/check-in", {
        employeeId: user.employeeId,
        date: now.toLocaleDateString("en-GB"),
        time: now.toTimeString().slice(0, 5) + ":00",
      });

      dispatch(
        setPunchStatus({
          employeeId: user.employeeId,
          status: PUNCH_STATUS.WORKING,
        })
      );

      await fetchDashboardData(false);
      toast.success("Checked in successfully!");
    } catch (err) {
      logError('HR punch action failed:', err);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setPunchLoading(true);

      const now = new Date();

      await api.post("/attendance/check-out", {
        employeeId: user.employeeId,
        date: now.toLocaleDateString("en-GB"),
        time: now.toTimeString().slice(0, 5) + ":00",
      });

      dispatch(
        setPunchStatus({
          employeeId: user.employeeId,
          status: PUNCH_STATUS.CHECKED_OUT,
        })
      );

      await fetchDashboardData(false);
      toast.success("Checked out successfully!");
    } catch (err) {
      logError('HR punch action failed:', err);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleLunchOut = async () => {
    try {
      setPunchLoading(true);

      const now = new Date();

      await api.post("/attendance/lunch-out", {
        employeeId: user.employeeId,
        date: now.toLocaleDateString("en-GB"),
        time: now.toTimeString().slice(0, 5) + ":00",
      });

      dispatch(
        setPunchStatus({
          employeeId: user.employeeId,
          status: PUNCH_STATUS.ON_LUNCH,
        })
      );

      await fetchDashboardData(false);
      toast.success("Lunch break started 🍱");
    } catch (err) {
      logError('HR punch action failed:', err);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleLunchIn = async () => {
    try {
      setPunchLoading(true);

      const now = new Date();

      await api.post("/attendance/lunch-in", {
        employeeId: user.employeeId,
        date: now.toLocaleDateString("en-GB"),
        time: now.toTimeString().slice(0, 5) + ":00",
      });

      dispatch(
        setPunchStatus({
          employeeId: user.employeeId,
          status: PUNCH_STATUS.WORKING,
        })
      );

      await fetchDashboardData(false);
      toast.success("Back to work 💼");
    } catch (err) {
      logError('HR punch action failed:', err);
    } finally {
      setPunchLoading(false);
    }
  };

  const formatDate = useCallback((date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const getStartDate = (item) => {
    if (item.validFrom) return formatDate(item.validFrom);
    if (item.year) return `01/01/${item.year}`;
    return "01/01/2026";
  };

  const getEndDate = (item) => {
    if (item.validTo) return formatDate(item.validTo);
    if (item.year) return `31/12/${item.year}`;
    return "31/12/2026";
  };

  const statsArray = [
    access.employee.read && {
      title: 'Total Employees',
      value: stats.totalEmployee,
      change: `${stats.activeEmployees} active employees`,
      changeType: 'positive',
      icon: FiUsers,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50/50 border-indigo-100/50',
      link: '/employees'
    },
    access.leave.read && {
      title: 'Pending Leaves',
      value: stats.pendingLeaves,
      change: stats.pendingLeaves > 0 ? 'Requires attention' : 'All leaves reviewed',
      changeType: stats.pendingLeaves > 0 ? 'negative' : 'neutral',
      icon: FiFileText,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50/50 border-amber-100/50',
      link: '/leaves/leave-requests'
    },
    access.attendance.read && {
      title: 'Attendance Today',
      value: stats.totalEmployee > 0 ? `${Math.round((stats.attendanceToday / stats.totalEmployee) * 100)}%` : '0%',
      change: `Present: ${stats.attendanceToday} | Absent: ${stats.totalEmployee - stats.attendanceToday}`,
      changeType: 'positive',
      icon: FiClock,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/50 border-emerald-100/50',
      link: '/attendance'
    },
    access.employee.read && {
      title: 'New Hires',
      value: stats.newHires,
      change: 'Joined this month',
      changeType: 'neutral',
      icon: FiPlus,
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50/50 border-purple-100/50',
      link: '/newHireEmployee'
    }
  ].filter(Boolean);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {loading && <Loader />}

      {/* Premium Header Greeting Widget */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
        <div>
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2.5 py-1 rounded-full">Overview</span>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-2.5">Welcome Back, {user?.name || 'Manager'}</h1>
          <p className="text-xs text-slate-400 mt-1">Here is a summary of what's happening at HRMS today.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200/50 rounded-xl text-xs font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            Role: HR Manager
          </span>
          <span className="px-3 py-1.5 bg-indigo-50 text-brand-600 border border-indigo-100/50 rounded-xl text-xs font-semibold">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
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

      {/* Main Core Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Visual Timecard Clock-In Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex flex-col justify-between lg:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shift Tracker</span>
                <h3 className="text-sm font-semibold text-slate-800 mt-0.5">Punch Card</h3>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  punchStatus === PUNCH_STATUS.ON_LUNCH
                    ? "bg-amber-50 text-amber-600 border-amber-100"
                    : punchStatus === PUNCH_STATUS.WORKING
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-slate-50 text-slate-400 border-slate-100"
                }`}
              >
                {punchStatus === PUNCH_STATUS.ON_LUNCH
                  ? "On Lunch"
                  : punchStatus === PUNCH_STATUS.WORKING
                    ? "Clocked In"
                    : "Clocked Out"}
              </span>
            </div>

            {/* Live digital ticking clock */}
            <div className="bg-slate-50 border border-slate-100/70 p-5 rounded-2xl text-center my-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-12 w-12 bg-indigo-500/5 rounded-full translate-x-3 -translate-y-3" />
              <p className="font-display text-3xl font-extrabold text-slate-800 tracking-wider">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center justify-center gap-1.5">
                {punchStatus === PUNCH_STATUS.WORKING && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />}
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="block bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-4 mb-3 hover:bg-emerald-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Work Hours Today</span>
                  <p className="text-xl font-extrabold text-slate-800 tracking-tight mt-1">{stats.workHours}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FiClock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Shift duration</p>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="space-y-2.5 mt-2">
            <PermissionGuard module="attendance" action="create">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCheckIn}
                  disabled={punchStatus !== PUNCH_STATUS.CHECKED_OUT || punchLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 focus:outline-none ${
                    punchStatus !== PUNCH_STATUS.CHECKED_OUT || punchLoading
                      ? "bg-slate-50 text-slate-400 border border-slate-150 cursor-not-allowed"
                      : "bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98] shadow-md shadow-brand-500/10"
                  }`}
                >
                  <FiCheck className="w-3.5 h-3.5" />
                  Check In
                </button>

                <button
                  onClick={handleCheckOut}
                  disabled={
                    ![PUNCH_STATUS.WORKING, PUNCH_STATUS.ON_LUNCH].includes(punchStatus) ||
                    punchLoading
                  }
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 focus:outline-none ${
                    ![PUNCH_STATUS.WORKING, PUNCH_STATUS.ON_LUNCH].includes(punchStatus) || punchLoading
                      ? "bg-slate-50 text-slate-400 border border-slate-150 cursor-not-allowed"
                      : "bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] shadow-md shadow-rose-500/10"
                  }`}
                >
                  <FiClock className="w-3.5 h-3.5" />
                  Check Out
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleLunchOut}
                  disabled={punchStatus !== PUNCH_STATUS.WORKING || punchLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 focus:outline-none border ${
                    punchStatus !== PUNCH_STATUS.WORKING || punchLoading
                      ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                      : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50 active:scale-[0.98]"
                  }`}
                >
                  <FiCoffee className="w-3.5 h-3.5" />
                  Lunch Out
                </button>
                
                <button
                  onClick={handleLunchIn}
                  disabled={punchStatus !== PUNCH_STATUS.ON_LUNCH || punchLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 focus:outline-none border ${
                    punchStatus !== PUNCH_STATUS.ON_LUNCH || punchLoading
                      ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                      : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 active:scale-[0.98]"
                  }`}
                >
                  <FiCoffee className="w-3.5 h-3.5" />
                  Lunch In
                </button>
              </div>
            </PermissionGuard>
          </div>
        </div>

        {/* Unified Analytics Overview Chart */}
        {access.leave.read && (
          <div className="lg:col-span-2">
            <LeaveTrends />
          </div>
        )}
      </div>

      {/* Leave details summary list */}
      {stats.leavebalance?.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balances</span>
              <h3 className="text-sm font-semibold text-slate-800 mt-0.5">Your Leave Matrix</h3>
            </div>
            <Link to={route(user, '/leaves/application')} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
              Apply Leave
              <FiArrowRight />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="px-4 py-3 rounded-l-xl">Leave Category</th>
                  <th className="px-4 py-3">Total Allocated</th>
                  <th className="px-4 py-3">Available Balance</th>
                  <th className="px-4 py-3">Start From</th>
                  <th className="px-4 py-3 rounded-r-xl">Expiry On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.leavebalance.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700">{item.leaveType}</td>
                    <td className="px-4 py-3 text-slate-600">{Number(item.originalTotalLeave || item.totalLeave || 0).toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md text-[11px]">
                        {Number(item.totalLeave || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{getStartDate(item)}</td>
                    <td className="px-4 py-3 text-slate-500">{getEndDate(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity + Recent Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logs</span>
              <h3 className="text-sm font-semibold text-slate-800 mt-0.5">Recent Activity</h3>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-2.5 text-slate-300">
                <FiActivity className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-xs font-medium">No recent logs recorded</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {recentActivity.slice(0, 5).map((item, index) => {
                let pillStyle = "bg-brand-50 text-brand-600";
                if (item.type === 'birthday') pillStyle = "bg-purple-50 text-purple-600";
                else if (item.type === 'leave') pillStyle = "bg-amber-50 text-amber-600";

                return (
                  <div key={index} className="flex gap-3 text-xs border-b border-slate-50 pb-3 last:border-0 last:pb-0 group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${pillStyle}`}>
                      {item.type === 'birthday' ? '🎂' : item.type === 'new_hire' ? '👤' : '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 font-medium group-hover:text-brand-600 transition-colors leading-relaxed">{item.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(item.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logs</span>
              <h3 className="text-sm font-semibold text-slate-800 mt-0.5">Recent Attendance</h3>
            </div>
            <Link to={route(user, "/attendance")} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
              View History
              <FiArrowRight />
            </Link>
          </div>

          <div className="space-y-3.5">
            {recentAttendances.slice(0, 5).map((record, index) => (
              <div key={index} className="flex items-center justify-between py-2.5 border-b border-slate-100/40 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-brand-500 flex items-center justify-center flex-shrink-0">
                    <FiClock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-850">{record.date}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {record.checkIn} - {record.checkOut ? record.checkOut : 'Active'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-700">{record.totalHours || '00:00'}</p>
                  <p className="text-[10px] text-slate-400">Total Hours</p>
                </div>
              </div>
            ))}
            {recentAttendances.length === 0 && (
              <div className="text-center py-6 text-slate-405 text-xs font-medium">
                No attendance records logged
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Shortcuts + Upcoming Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions Cards Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Actions
          </span>

          <h3 className="text-sm font-semibold text-slate-800 mt-0.5 mb-4">
            Quick Shortcuts
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <PermissionGuard module="employee" action="create">
              <Link
                to={route(user, "/employees/new")}
                className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-3">
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

                  <FiArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all duration-300" />
                </div>
              </Link>
            </PermissionGuard>

            <PermissionGuard module="leave" action="create">
              <Link
                to={route(user, "/leaves/new")}
                className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                      <FiSend className="w-5 h-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Request Leave
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Apply for leave
                      </p>
                    </div>
                  </div>

                  <FiArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all duration-300" />
                </div>
              </Link>
            </PermissionGuard>

            <PermissionGuard module="holiday" action="create">
              <Link
                to={route(user, "/holidays/new")}
                className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                      <FiCalendar className="w-5 h-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Add Holiday
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Corporate holiday
                      </p>
                    </div>
                  </div>

                  <FiArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 group-hover:text-amber-600 transition-all duration-300" />
                </div>
              </Link>
            </PermissionGuard>

            <PermissionGuard module="rule" action="create">
              <Link
                to={route(user, "/rules")}
                className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                      <FiFileText className="w-5 h-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Add Rules & Regulations
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage rules
                      </p>
                    </div>
                  </div>

                  <FiArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 group-hover:text-rose-600 transition-all duration-300" />
                </div>
              </Link>
            </PermissionGuard>
          </div>
        </div>

        {/* Upcoming Holidays Panel */}
        {access.holiday.read && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calendar</span>
              <h3 className="text-sm font-semibold text-slate-800 mt-0.5">Upcoming Holidays</h3>
            </div>
            <PermissionGuard module="holiday" action="read">
              <Link to={route(user, "/holidays")} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
                View List
                <FiArrowRight />
              </Link>
            </PermissionGuard>
          </div>

          {upcomingHolidays.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-2.5 text-slate-300">
                <FiGift className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-xs font-medium">No holidays scheduled soon</p>
            </div>
          ) : (
            <div className="space-y-3.5 pr-1">
              {upcomingHolidays.map((holiday, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100/40 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                      <FiGift className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{holiday.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{holiday.type || 'National'} Holiday</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700">{formatDate(holiday.date)}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{holiday.day}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* HR Analytics */}
      <div className="grid grid-cols-1 gap-6">
        {/* HR Analytics stats blocks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analytics</span>
          <h3 className="text-sm font-semibold text-slate-800 mt-0.5 mb-4">HR Operations Performance</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-slate-100 rounded-xl bg-slate-50/30">
              <div className="text-2xl font-extrabold text-brand-600">{loading ? '...' : stats.totalEmployee}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">Active Database</div>
              <p className="text-[11px] text-slate-500 mt-1">Total Employees</p>
            </div>

            <div className="text-center p-4 border border-slate-100 rounded-xl bg-slate-50/30">
              <div className="text-2xl font-extrabold text-emerald-600">
                {stats.totalEmployee > 0 ? `${Math.round((stats.attendanceToday / stats.totalEmployee) * 100)}%` : '0%'}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">Attendance Rate</div>
              <p className="text-[11px] text-slate-500 mt-1">Daily punctuality</p>
            </div>

            <div className="text-center p-4 border border-slate-100 rounded-xl bg-slate-50/30">
              <div className="text-2xl font-extrabold text-purple-600">{avgLeavePerMonth} Days</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">Average Leave</div>
              <p className="text-[11px] text-slate-500 mt-1">Monthly metrics / employee</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HRDashboard;
