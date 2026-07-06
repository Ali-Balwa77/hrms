import React, { useEffect, useState } from "react";
import { showErrorToast } from "../../utils/toastHelper";
import { api } from "../../services/api.js";
import Loader from "../../components/common/Loader.jsx";
import { useSelector } from "react-redux";
import {
  FiSearch,
  FiCalendar,
  FiClock,
  FiDownload,
  FiUser,
  FiActivity,
} from "react-icons/fi";
import { hasPermission } from "../../utils/permissions.js";

const AttendanceReportPage = () => {
  const { user } = useSelector((state) => state.auth);

  const [report, setReport] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeesFetched, setEmployeesFetched] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const normalizeRoleName = (value = "") =>
    String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "");

  const roleName = normalizeRoleName(user?.role?.name);
  const isTeamLeadRole = roleName === "teamlead" || roleName === "tl";

  const hasTeamAttendanceScope =
    isTeamLeadRole ||
    hasPermission(user, "employee", "team_employee_list") ||
    hasPermission(user, "leave", "team_leave_scope") ||
    hasPermission(user, "attendance", "team_scope");

  const canViewAllAttendance =
    hasPermission(user, "attendance", "view_all_attendance") &&
    !hasTeamAttendanceScope;

  const canViewTeamAttendance = hasTeamAttendanceScope;
  const canSelectAttendanceEmployee =
    canViewAllAttendance || canViewTeamAttendance;

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 2);

  const getId = (value) => value?._id || value?.id || value;

  const isSameId = (left, right) => {
    const leftId = getId(left);
    const rightId = getId(right);
    return Boolean(leftId && rightId && String(leftId) === String(rightId));
  };

  const getLoggedInEmployeeOption = () => {
    const employee = user?.employeeId;
    const employeeId = getId(employee);

    if (!employeeId) return null;

    const nameParts =
      typeof employee === "object"
        ? {
            firstName: employee.firstName || user?.name?.split(" ")?.[0] || "",
            lastName:
              employee.lastName ||
              user?.name?.split(" ")?.slice(1).join(" ") ||
              "",
          }
        : {
            firstName: user?.name?.split(" ")?.[0] || "Self",
            lastName: user?.name?.split(" ")?.slice(1).join(" ") || "",
          };

    return {
      _id: employeeId,
      employeeNo:
        employee?.employeeNo || user?.empID || user?.employeeNo || "Self",
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      officeEmail: employee?.officeEmail || user?.email || "",
      status: "active",
      isSelf: true,
    };
  };

  const includeLoggedInEmployee = (employeeList = []) => {
    const selfEmployee = getLoggedInEmployeeOption();
    if (!selfEmployee) return employeeList;

    const withoutDuplicate = employeeList.filter(
      (employee) => !isSameId(employee, selfEmployee._id)
    );

    return [selfEmployee, ...withoutDuplicate];
  };

  const isMappedToCurrentTL = (employee) => {
    const tlId = getId(user?.employeeId);
    if (!employee || !tlId) return false;

    const mappedFields = [
      employee.reportingManager,
      employee.reportingManagerId,
      employee.reportingTo,
      employee.teamLead,
      employee.teamLeader,
      employee.tl,
      employee.manager,
    ];

    if (mappedFields.some((field) => isSameId(field, tlId))) {
      return true;
    }

    const forwardToList = Array.isArray(employee.leaveForwardTo)
      ? employee.leaveForwardTo
      : employee.leaveForwardTo
      ? [employee.leaveForwardTo]
      : [];

    return forwardToList.some((item) => isSameId(item, tlId));
  };

  const fetchEmployees = async () => {
    try {
      const endpoint = canViewAllAttendance
        ? "/employees"
        : `/employees/teamEmployee/${user?.employeeId}`;

      const res = await api.get(endpoint);

      const activeEmployees = (
        Array.isArray(res?.data) ? res.data : res?.data?.data || []
      ).filter((emp) => emp.status === "active");

      if (canViewTeamAttendance) {
        const teamEmployees = activeEmployees.filter(isMappedToCurrentTL);
        setEmployees(
          includeLoggedInEmployee(
            teamEmployees.length > 0 ? teamEmployees : activeEmployees
          )
        );
      } else {
        setEmployees(activeEmployees);
      }

      setEmployeesFetched(true);
    } catch (error) {
      showErrorToast("Failed to load employees");
    }
  };

  const selectedEmployeeData = employees.find(
    (emp) => emp._id === selectedEmployee
  );

  const reportEmployee = !canSelectAttendanceEmployee
    ? {
        employeeNo: user?.empID || user?.employeeNo || "-",
        name: user?.name || "-",
      }
    : selectedEmployeeData
    ? {
        employeeNo: selectedEmployeeData.employeeNo || "-",
        name: `${selectedEmployeeData.firstName || ""} ${
          selectedEmployeeData.lastName || ""
        }`.trim(),
      }
    : null;

  const filteredEmployees = employees.filter((emp) => {
    const searchText = `
      ${emp.employeeNo || ""}
      ${emp.firstName || ""}
      ${emp.lastName || ""}
      ${emp.officeEmail || ""}
    `.toLowerCase();

    return searchText.includes(employeeSearch.toLowerCase().trim());
  });

  const fetchAttendanceReport = async (employeeId) => {
    try {
      setLoading(true);

      const response = await api.get(
        `/attendance/report/${employeeId}?from=${fromDate}&to=${toDate}`
      );

      const reportData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      setReport(reportData);
    } catch (error) {
      showErrorToast(
        error.response?.data?.message || "Failed to load attendance data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShowReport = () => {
    const today = new Date().toISOString().split("T")[0];

    if (fromDate && fromDate > today) {
      showErrorToast("From Date cannot be in the future");
      return;
    }

    if (toDate && toDate > today) {
      showErrorToast("To Date cannot be in the future");
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      showErrorToast("From Date cannot be greater than To Date");
      return;
    }

    const employeeId = !canSelectAttendanceEmployee
      ? user.employeeId
      : selectedEmployee;

    if (!employeeId) {
      showErrorToast("Please select an employee");
      return;
    }

    fetchAttendanceReport(employeeId);
  };

  useEffect(() => {
    setFromDate(firstDay.toISOString().split("T")[0]);
    setToDate(now.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (canSelectAttendanceEmployee && !employeesFetched) {
      fetchEmployees();
    }
  }, [canSelectAttendanceEmployee, employeesFetched, user?.employeeId]);

  const handleEmployeeDropdownToggle = () => {
    setEmployeeDropdownOpen((prev) => !prev);
  };

  const handleExport = async () => {
    const employeeId = !canSelectAttendanceEmployee
      ? user.employeeId
      : selectedEmployee;

    if (!employeeId) {
      showErrorToast("Please select an employee");
      return;
    }

    try {
      setLoading(true);

      const res = await api.get(
        `/attendance/report/export/${employeeId}?from=${fromDate}&to=${toDate}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute(
        "download",
        `attendance_report_${fromDate}_to_${toDate}.xlsx`
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      showErrorToast("Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  const convertToEvents = (punches = []) => {
    if (!Array.isArray(punches) || punches.length === 0) return [];

    const normalizePunchTime = (value) => {
      if (!value) return "";

      const [hh = "00", mm = "00", ss = "00"] = String(value).split(":");

      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(
        2,
        "0"
      )}:${String(ss || "00").padStart(2, "0")}`;
    };

    const timeToSeconds = (time) => {
      if (!time) return null;

      const [h = 0, m = 0, s = 0] = String(time).split(":").map(Number);

      if ([h, m, s].some((value) => Number.isNaN(value))) return null;

      return h * 3600 + m * 60 + s;
    };

    const isMispunchPunch = (punch) =>
      String(punch?.action || "").toLowerCase() === "mispunch";

    const isValidTimeRange = (start, end) => {
      const startSeconds = timeToSeconds(normalizePunchTime(start));
      const endSeconds = timeToSeconds(normalizePunchTime(end));

      return (
        startSeconds !== null &&
        endSeconds !== null &&
        endSeconds > startSeconds
      );
    };

    const sanitizePunchesForTimeline = (rawPunches = []) => {
      let cleaned = rawPunches
        .filter(Boolean)
        .map((punch, index) => ({
          ...punch,
          _sortIndex: index,
          in: punch?.in ? normalizePunchTime(punch.in) : punch?.in,
          out: punch?.out ? normalizePunchTime(punch.out) : punch?.out,
        }))
        .filter((punch) => {
          const punchIn = normalizePunchTime(punch?.in);
          const punchOut = normalizePunchTime(punch?.out);

          // 15:03 - 15:03 jeva zero duration punch hide
          if (punchIn && punchOut && punchIn === punchOut) return false;

          return true;
        });

      cleaned = cleaned.filter((punch, index, list) => {
        if (punch?.type !== "work") return true;

        const punchIn = normalizePunchTime(punch?.in);
        const punchOut = normalizePunchTime(punch?.out);

        // completed punch keep
        if (!punchIn || punchOut) return true;

        // open work punch hoy ane same/after time par completed work punch hoy to hide
        const hasCompletedAfterOrSame = list.some((item, itemIndex) => {
          if (itemIndex === index) return false;
          if (item?.type !== "work") return false;
          if (!isValidTimeRange(item?.in, item?.out)) return false;

          return normalizePunchTime(item.in) >= punchIn;
        });

        return !hasCompletedAfterOrSame;
      });

      return cleaned.sort((a, b) => {
        const aTime = normalizePunchTime(a?.in || a?.out);
        const bTime = normalizePunchTime(b?.in || b?.out);

        const timeCompare = aTime.localeCompare(bTime);
        if (timeCompare !== 0) return timeCompare;

        return (a._sortIndex || 0) - (b._sortIndex || 0);
      });
    };

    const safePunches = sanitizePunchesForTimeline(punches);

    const lunchInTimes = new Set(
      safePunches
        .filter((punch) => punch?.type === "lunch" && punch?.out)
        .map((punch) => normalizePunchTime(punch.out))
    );

    const lunchOutTimes = new Set(
      safePunches
        .filter((punch) => punch?.type === "lunch" && punch?.in)
        .map((punch) => normalizePunchTime(punch.in))
    );

    const events = [];

    safePunches.forEach((punch) => {
      const corrected = isMispunchPunch(punch);
      const punchIn = normalizePunchTime(punch?.in);
      const punchOut = normalizePunchTime(punch?.out);

      if (punch?.type === "work") {
        if (corrected) {
          if (punchIn && !lunchInTimes.has(punchIn)) {
            events.push({
              time: punchIn,
              label: "In",
              corrected: true,
            });
          }

          if (punchOut && isValidTimeRange(punchIn, punchOut)) {
            events.push({
              time: punchOut,
              label: "Out",
              corrected: true,
            });
          }

          return;
        }

        if (punchIn && !lunchInTimes.has(punchIn)) {
          events.push({
            time: punchIn,
            label: "In",
            corrected: false,
          });
        }

        if (
          punchOut &&
          isValidTimeRange(punchIn, punchOut) &&
          !lunchOutTimes.has(punchOut)
        ) {
          events.push({
            time: punchOut,
            label: "Out",
            corrected: false,
          });
        }
      }

      if (punch?.type === "lunch") {
        if (punchIn) {
          events.push({
            time: punchIn,
            label: "Lunch-Out",
            corrected: false,
          });
        }

        if (punchOut) {
          events.push({
            time: punchOut,
            label: "Lunch-In",
            corrected: false,
          });
        }
      }
    });

    const order = {
      Out: 1,
      "Lunch-Out": 2,
      "Lunch-In": 3,
      In: 4,
    };

    return events
      .sort((a, b) => {
        const timeCompare = String(a.time).localeCompare(String(b.time));
        if (timeCompare !== 0) return timeCompare;

        return (order[a.label] || 9) - (order[b.label] || 9);
      })
      .filter((event, index, list) => {
        return (
          list.findIndex(
            (item) =>
              item.time === event.time &&
              item.label === event.label &&
              item.corrected === event.corrected
          ) === index
        );
      });
  };

  const renderVisualPunches = (punches) => {
    const events = convertToEvents(punches);

    if (!events || events.length === 0) {
      return <span className="text-slate-400 text-xs">No records</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {events.map((event, index) => {
          let badgeClass = "bg-slate-50 text-slate-500 border-slate-100";

          if (event.label === "In") {
            badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100/50";
          } else if (event.label === "Out") {
            badgeClass = "bg-rose-50 text-rose-700 border-rose-100/50";
          } else if (event.label === "Lunch-Out") {
            badgeClass = "bg-amber-50 text-amber-600 border-amber-100/50";
          } else if (event.label === "Lunch-In") {
            badgeClass = "bg-teal-50 text-teal-600 border-teal-100/50";
          }

          return (
            <span
              key={`${event.time}-${event.label}-${event.corrected}-${index}`}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${badgeClass}`}
            >
              {event.time} ({event.label})
            </span>
          );
        })}
      </div>
    );
  };

  const getWorkingHours = (item) => {
    return item.totalHours || "00:00:00";
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {loading && <Loader />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
        <div>
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2.5 py-1 rounded-full">
            Reporting
          </span>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-2.5">
            Attendance Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review clock-in durations, punch histories, and export detailed
            sheets.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Filter Records</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
              <FiCalendar className="w-3.5 h-3.5" />
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-850 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
              <FiCalendar className="w-3.5 h-3.5" />
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-850 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
            />
          </div>

          {!!canSelectAttendanceEmployee ? (
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <FiUser className="w-3.5 h-3.5" />
                Employee Account
              </label>

              <button
                type="button"
                onClick={handleEmployeeDropdownToggle}
                className="w-full min-w-0 text-left bg-white border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200 appearance-none flex items-center bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat"
              >
                <span className="block min-w-0 flex-1 truncate pr-6">
                  {selectedEmployeeData
                    ? `${selectedEmployeeData.employeeNo} - ${selectedEmployeeData.firstName} ${selectedEmployeeData.lastName}`
                    : "Select Employee"}
                </span>
              </button>

              {employeeDropdownOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-dropdown overflow-hidden transform origin-top-right transition-all animate-slideIn">
                  <div className="relative p-2 border-b border-slate-50 bg-slate-50/50">
                    <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      type="text"
                      value={employeeSearch}
                      onChange={(event) =>
                        setEmployeeSearch(event.target.value)
                      }
                      placeholder="Search employee..."
                      className="w-full border border-slate-200 bg-white rounded-xl pl-9 pr-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto">
                    <div
                      onClick={() => {
                        setSelectedEmployee("");
                        setEmployeeDropdownOpen(false);
                        setEmployeeSearch("");
                        setReport([]);
                      }}
                      className="px-4 py-2.5 cursor-pointer hover:bg-slate-50 text-xs font-semibold text-slate-500"
                    >
                      Clear Selection
                    </div>

                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <div
                          key={emp._id}
                          onClick={() => {
                            setSelectedEmployee(emp._id);
                            setEmployeeDropdownOpen(false);
                            setEmployeeSearch("");
                            setReport([]);
                          }}
                          className="truncate px-4 py-2.5 cursor-pointer hover:bg-slate-50 text-xs text-slate-700 font-medium"
                          title={`${emp.employeeNo} - ${emp.firstName} ${emp.lastName}`}
                        >
                          {emp.employeeNo} - {emp.firstName} {emp.lastName}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-slate-400 italic">
                        No employees found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-500">
              Personal Shift Ledger Selected
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleShowReport}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-500/10 cursor-pointer"
          >
            <FiActivity className="w-3.5 h-3.5" />
            Show Logs Report
          </button>

          {report.length !== 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-205 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <FiDownload className="w-3.5 h-3.5" />
              Export Excel Sheets
            </button>
          )}
        </div>
      </div>

      {report && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Shift Logs Table
                </h3>

                {reportEmployee && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Displaying roster for:{" "}
                    <span className="font-semibold text-brand-600">
                      {reportEmployee.employeeNo} - {reportEmployee.name}
                    </span>
                  </p>
                )}
              </div>

              <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
                {report.length} Records
              </span>
            </div>
          </div>

          <div className="p-5 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <colgroup>
                <col className="w-[110px]" />
                <col className="w-[95px]" />
                <col className="w-[95px]" />
                <col />
                <col className="w-[155px]" />
              </colgroup>

              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="px-4 py-3.5 whitespace-nowrap uppercase tracking-wider text-[11px]">
                    Log Date
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap uppercase tracking-wider text-[11px]">
                    Punch In
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap uppercase tracking-wider text-[11px]">
                    Punch Out
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap uppercase tracking-wider text-[11px]">
                    Activity Timeline Records
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap uppercase tracking-wider text-[11px]">
                    Total Duration
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {report.length > 0 ? (
                  report.map((item) => (
                    <tr
                      key={item._id}
                      className="bg-white hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                        {item.date}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            item.checkIn
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100/50"
                              : "text-slate-400 bg-slate-50 border-slate-100"
                          }`}
                        >
                          {item.checkIn || "--:--"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            item.checkOut
                              ? "bg-rose-50 text-rose-700 border-rose-100/50"
                              : "text-slate-400 bg-slate-50 border-slate-100"
                          }`}
                        >
                          {item.checkOut === null
                            ? item.checkIn || "--:--"
                            : item.checkOut || "--:--"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        {renderVisualPunches(item.punches)}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-0.5 border border-slate-100">
                          <FiClock className="w-3.5 h-3.5 text-slate-400" />
                          {getWorkingHours(item)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-white">
                    <td
                      className="px-6 py-12 text-center text-slate-400 font-medium italic"
                      colSpan={5}
                    >
                      No attendance records found for the selected date range. Please
                      adjust filters above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReportPage;
