import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import { hasPermission } from '../../utils/permissions.js';
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
  FiClock, FiCalendar, FiFileText, FiAward, FiCheck, FiCoffee, 
  FiArrowRight, FiBriefcase, FiUser, FiMail, FiGift, FiSend, FiPlus, FiAlertCircle 
} from 'react-icons/fi';


const getEmployeeIdValue = (employeeId) => employeeId?._id || employeeId?.id || employeeId;

const isSameEmployee = (left, right) => {
  const leftId = getEmployeeIdValue(left);
  const rightId = getEmployeeIdValue(right);
  return Boolean(leftId && rightId && String(leftId) === String(rightId));
};

const cleanPunches = (punches = []) => {
  const map = new Map();

  punches.forEach(p => {
    const minuteIn = p.in ? p.in.slice(0, 5) : null;
    const minuteOut = p.out ? p.out.slice(0, 5) : null;

    if (minuteIn) {
      map.set(minuteIn, { in: p.in });
    }

    if (minuteOut && !map.has(minuteOut)) {
      map.set(minuteOut, { out: p.out });
    }
  });

  return Array.from(map.values());
};

const normalizeRoleName = (value = "") =>
  String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "");

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

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const punchStatus = useSelector((state) => selectPunchStatus(state, user?.employeeId));
  const [dashboardData, setDashboardData] = useState({
    stats: {
      attendanceThisMonth: { presentDays: 0, workingDays: 0, percentage: 0 },
      pendingRequest: 0,
      workHours: "00:00:00",
    },
    leaveHistory: [],
    employeeDetails: {},
    upcomingHolidays: [],
    recentAttendances: [],
  });
  const { stats, leaveHistory, employeeDetails, upcomingHolidays, recentAttendances } = dashboardData;

  const [loading, setLoading] = useState(false);
  const [punchLoading, setPunchLoading] = useState(false);
  const roleName = normalizeRoleName(user?.role?.name || user?.employeeType);
  const isTeamLeadDashboard = roleName === "teamlead";
  const isSelfDashboardRole = ["employee", "teamlead", "intern"].includes(roleName);

  const access = React.useMemo(() => ({
    employee: {
      read: hasPermission(user, "employee", "read"),
    },
    leave: {
      read: isSelfDashboardRole || hasPermission(user, "leave", "read"),
      create: isSelfDashboardRole || hasPermission(user, "leave", "create"),
      approve: hasPermission(user, "leave", "approve"),
      reject: hasPermission(user, "leave", "reject"),
    },
    attendance: {
      read: isSelfDashboardRole || hasPermission(user, "attendance", "read"),
      create: isSelfDashboardRole || hasPermission(user, "attendance", "create"),
    },
    holiday: {
      read: isSelfDashboardRole || hasPermission(user, "holiday", "read"),
    },
    rule: {
      read: isSelfDashboardRole || hasPermission(user, "rule", "read"),
    },
  }), [isSelfDashboardRole, user]);

  const getDashboardData = (result) => {
    if (result.status !== "fulfilled") return [];
    const responseData = result.value?.data;
    return Array.isArray(responseData) ? responseData : responseData?.data || [];
  };

  const getDashboardObject = (result, fallback = {}) => {
    if (result.status !== "fulfilled") return fallback;
    const responseData = result.value?.data;
    return responseData?.data || responseData || fallback;
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

  const calculateMonthlyAttendance = (attendanceData, holidays, employee) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const monthStart = new Date(year, month, 1);
    const joinDate = new Date(employee?.joinDate);
    const startDate =
      !Number.isNaN(joinDate.getTime()) && joinDate > monthStart
        ? joinDate
        : monthStart;
    startDate.setHours(0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    let totalDays = 0;
    let weekends = 0;
    let current = new Date(startDate);

    while (current <= monthEnd) {
      totalDays++;
      const day = current.getDay();
      if (day === 0 || day === 6) {
        weekends++;
      }
      current.setDate(current.getDate() + 1);
    }

    const holidayCount = holidays.filter((h) => {
      const holidayDate = new Date(h.date);
      return (
        holidayDate >= startDate &&
        holidayDate <= monthEnd &&
        holidayDate.getMonth() === month
      );
    }).length;

    const workingDays = Math.max(totalDays - weekends - holidayCount, 0);

    const presentDays = new Set(
      attendanceData
        .filter((a) => {
          const attendanceDate = parseAttendanceDate(a.date);
          if (!attendanceDate) return false;

          return (
            attendanceDate >= startDate &&
            attendanceDate <= monthEnd &&
            attendanceDate.getFullYear() === year &&
            attendanceDate.getMonth() === month &&
            a.punches?.some((p) => p.in || p.out)
          );
        })
        .map((a) => a.date)
    ).size;

    const percentage =
      workingDays > 0
        ? ((presentDays / workingDays) * 100).toFixed(0)
        : 0;

    return {
      presentDays,
      workingDays,
      percentage,
    };
  };

  const fetchDashboardData = async (syncPunchStatus = true) => {
    if (!user?.employeeId) return;

    setLoading(true);
    try {
      const [employeeResponce, leaveResponce, pendingResponse, holidaysResponse, attendanceResponce] = await Promise.allSettled([
        api.get(`employees/${user.employeeId}`, { forceRefetch: true }),
        access.leave.read
          ? api.get('leaves', { forceRefetch: true })
          : Promise.resolve({ data: [] }),
        access.leave.read
          ? api.get('leaves/pending_count', { forceRefetch: true })
          : Promise.resolve({ data: { count: 0 } }),
        access.holiday.read
          ? api.get('holidays', { forceRefetch: true })
          : Promise.resolve({ data: [] }),
        access.attendance.read
          ? api.get(`attendance/${user.employeeId}`, { forceRefetch: true })
          : Promise.resolve({ data: [] }),
      ]);

      const employee = getDashboardObject(employeeResponce, {});
      const leaves = getDashboardData(leaveResponce);
      const pendingLeaveRequest = getDashboardObject(pendingResponse, { count: 0 });
      const holidays = getDashboardData(holidaysResponse);
      const attendances = getDashboardData(attendanceResponce);

      const today = new Date();
      const todayStr = formatDate(today);
      const todayAttendance = attendances.find((attendanceItem) => {
        if (attendanceItem.date !== todayStr) return false;
        if (!attendanceItem.employeeId) return true;
        return isSameEmployee(attendanceItem.employeeId, user.employeeId);
      });
      const attendanceMonthly = calculateMonthlyAttendance(attendances, holidays, employee);

      const nextStats = {
        pendingRequest: pendingLeaveRequest.count,
        workHours: todayAttendance?.totalHours || "00:00:00",
        attendanceThisMonth: attendanceMonthly
      };

      if (syncPunchStatus && todayAttendance) {
        dispatch(setPunchStatusFromAttendance({
          employeeId: user.employeeId,
          attendance: todayAttendance,
        }));
      }

      const upcoming = holidays
        .filter(holiday => new Date(holiday.date) > today)
        .map(holiday => {
          const holidayDate = new Date(holiday.date);
          const daysLeft = Math.ceil((holidayDate - today) / (1000 * 60 * 60 * 24));
          const currentMonth = today.getMonth();
          const holidayMonth = holidayDate.getMonth();
          const currentYear = today.getFullYear();
          const holidayYear = holidayDate.getFullYear();

          const isCurrentMonth = currentMonth === holidayMonth && currentYear === holidayYear;
          const monthsLeft = (holidayYear - currentYear) * 12 + (holidayMonth - currentMonth);

          return {
            ...holiday,
            daysLeft: isCurrentMonth ? `${daysLeft} days left` : monthsLeft === 1 ? 'Next month' : `${monthsLeft} months left`
          };
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const leave = leaves.filter(l => isSameEmployee(l.employeeId, user.employeeId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const recentAttendance = attendances
        .filter((attendanceItem) => {
          const attendanceDate = parseAttendanceDate(attendanceItem.date);
          return (
            attendanceDate &&
            attendanceDate.getFullYear() === currentYear &&
            attendanceDate.getMonth() === currentMonth
          );
        })
        .sort((a, b) => parseAttendanceDate(b.date) - parseAttendanceDate(a.date))
        .slice(0, 5);

      setDashboardData((prev) => ({
        ...prev,
        stats: nextStats,
        leaveHistory: leave,
        employeeDetails: employee,
        upcomingHolidays: upcoming,
        recentAttendances: recentAttendance,
      }));

    } catch (error) {
      logError('Employee dashboard data load failed:', error);
    } finally {
      setLoading(false);
    }
  };

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
      logError('Employee punch action failed:', err);
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
      logError('Employee punch action failed:', err);
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
      logError('Employee punch action failed:', err);
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
      logError('Employee punch action failed:', err);
    } finally {
      setPunchLoading(false);
    }
  };

  const statsArray = [
    access.attendance.read && {
      title: 'Attendance This Month',
      value: `${stats.attendanceThisMonth.presentDays || 0}/${stats.attendanceThisMonth.workingDays || 0}`,
      change: `${stats.attendanceThisMonth.percentage || 0}% present`,
      changeType: 'positive',
      icon: FiCalendar,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50/50 border-indigo-100/50',
      link: '/attendance'
    },
    ...((access.leave.approve || access.leave.reject) && access.leave.read ? [{
      title: 'Pending Requests',
      value: stats.pendingRequest,
      change: 'Leave requests to review',
      changeType: 'neutral',
      icon: FiFileText,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50/50 border-amber-100/50',
      link: '/leaves/leave-requests'
    }] : []),
    access.attendance.read && {
      title: 'Work Hours Today',
      value: stats.workHours,
      change: 'Shift duration',
      changeType: 'neutral',
      icon: FiClock,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/50 border-emerald-100/50',
      link: '/attendance'
    }
  ].filter(Boolean);

  const formatDate = useCallback((date) => {
    if (!date) return '';
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

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {loading && <Loader />}
      
      {/* Header Greeting panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
        <div>
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2.5 py-1 rounded-full">
            {roleName === "teamlead" ? "Team Lead Hub" : "Employee Hub"}
          </span>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-2.5">Hello, {user?.name || 'Team Member'}</h1>
          <p className="text-xs text-slate-400 mt-1">Have a productive day! Check your attendance logs and balances below.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-650 border border-slate-200/50 rounded-xl text-xs font-semibold">
            ID: {employeeDetails?.employeeNo || '...'}
          </span>
          <span className="px-3 py-1.5 bg-indigo-50 text-brand-600 border border-indigo-100/50 rounded-xl text-xs font-semibold">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Grid: Stats Cards and Timecard Punch Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI Cards wrapper */}
        <div className="lg:col-span-2 space-y-5">
          <div className={`grid grid-cols-1 ${isTeamLeadDashboard ? "md:grid-cols-3" : "sm:grid-cols-2"} gap-5`}>
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
                      <p className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">{stat.value}</p>
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

          {/* Quick Actions Shortcuts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">
              Quick Shortcuts
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {access.leave.create && (
                <Link
                  to={route(user, "/leaves/new")}
                  className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
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
                </Link>
              )}

              {access.holiday.read && (
              <Link
                to={route(user, "/holidays")}
                className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                    <FiCalendar className="w-5 h-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      View Holidays
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Holiday list
                    </p>
                  </div>
                </div>
              </Link>
              )}

              {access.rule.read && (
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
                      Company Rules
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      View regulations
                    </p>
                  </div>
                </div>
              </Link>
              )}
            </div>
          </div>
        </div>

        {/* Live digital clock Punch widget */}
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
          </div>

          <div className="space-y-2.5 mt-2">
            {access.attendance.create && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Leave details block */}
      {employeeDetails?.leaveBalance?.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balances</span>
              <h3 className="text-sm font-semibold text-slate-800 mt-0.5">Personal Leave Ledger</h3>
            </div>
            <Link to={route(user, '/leaves/new')} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
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
                {employeeDetails.leaveBalance.map((item) => (
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

      {/* Grid: Recent Attendance & Leave History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance Records */}
        {access.attendance.read && (
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
        )}

        {/* Leave Requests History */}
        {access.leave.read && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tracking</span>
              <h3 className="text-sm font-semibold text-slate-800 mt-0.5">Leave Application History</h3>
            </div>
            <Link to={route(user, "/leaves/application")} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
              View All
              <FiArrowRight />
            </Link>
          </div>

          <div className="space-y-3.5">
            {leaveHistory.slice(0, 5).map((leave, index) => (
              <div key={index} className="flex items-center justify-between py-2.5 border-b border-slate-100/40 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    leave.status === 'approved' 
                      ? 'bg-emerald-50 text-emerald-500' 
                      : leave.status === 'pending' 
                        ? 'bg-amber-50 text-amber-500' 
                        : 'bg-rose-50 text-rose-500'
                  }`}>
                    <FiFileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 capitalize">{leave.type || 'Personal'} Leave</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(leave.from)} - {formatDate(leave.to)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    leave.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : leave.status === 'pending'
                        ? 'bg-slate-50 text-slate-650 border-slate-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {leave.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{leave.noOfDays} days requested</p>
                </div>
              </div>
            ))}
            {leaveHistory.length === 0 && (
              <div className="text-center py-6 text-slate-405 text-xs font-medium">
                No leave requests filed yet
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Grid: Holidays & Personal profile info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Holidays List */}
        {access.holiday.read && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calendar</span>
              <h3 className="text-sm font-semibold text-slate-800 mt-0.5">Upcoming Holidays</h3>
            </div>
          </div>

          <div className="space-y-3.5">
            {upcomingHolidays.slice(0, 5).map((holiday, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100/40 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                    <FiGift className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-850">{holiday.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{holiday.daysLeft}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-700">{formatDate(holiday.date)}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{holiday.day}</p>
                </div>
              </div>
            ))}
            {upcomingHolidays.length === 0 && (
              <div className="text-center py-6 text-slate-405 text-xs font-medium">
                No upcoming corporate holidays scheduled
              </div>
            )}
          </div>
        </div>
        )}

        {/* Profile / Employee info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity</span>
          <h3 className="text-sm font-semibold text-slate-800 mt-0.5 mb-4">My Professional Details</h3>
          
          <div className="space-y-3.5 divide-y divide-slate-100">
            <div className="flex justify-between text-xs py-2 first:pt-0">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <FiUser className="w-3.5 h-3.5 text-slate-350" />
                Employee No
              </span>
              <span className="text-slate-700 font-bold">{employeeDetails.employeeNo || '...'}</span>
            </div>
            
            <div className="flex justify-between text-xs pt-3">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <FiBriefcase className="w-3.5 h-3.5 text-slate-350" />
                Department / Team
              </span>
              <span className="text-slate-700 font-semibold">{employeeDetails.department || '...'}</span>
            </div>
            
            <div className="flex justify-between text-xs pt-3">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <FiAward className="w-3.5 h-3.5 text-slate-350" />
                Official Designation
              </span>
              <span className="text-slate-700 font-semibold">{employeeDetails.designation || '...'}</span>
            </div>
            
            <div className="flex justify-between text-xs pt-3">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5 text-slate-350" />
                Join Date
              </span>
              <span className="text-slate-750 font-medium">{formatDate(employeeDetails.joinDate) || '...'}</span>
            </div>
            
            <div className="flex justify-between text-xs pt-3 last:pb-0">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <FiMail className="w-3.5 h-3.5 text-slate-350" />
                Work Email
              </span>
              <span className="text-brand-600 font-semibold hover:underline truncate max-w-[200px]">{employeeDetails.officeEmail || '...'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;
