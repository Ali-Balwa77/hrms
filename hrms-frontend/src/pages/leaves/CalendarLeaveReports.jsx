import React, { useEffect, useState } from 'react';
import dayjs from "dayjs";
import { api } from "../../services/api.js";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

const LeaveCalendar = () => {
    const [leaves, setLeaves] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(dayjs().month() + 1);
    const [currentYear, setCurrentYear] = useState(dayjs().year());

    const fetchLeaves = async (m, y) => {
        try {
            const { data } = await api.get(
                `/leaves/calendar?month=${m}&year=${y}`
            );

            const filterData = data.filter((item) => item.status === 'approved');

            setLeaves(filterData);
        } catch (err) {
        console.error('Request failed:', err);
        }
    };

    useEffect(() => {
        fetchLeaves(currentMonth, currentYear);
    }, [currentMonth, currentYear]);


    const generateCalendar = () => {
        const startOfMonth = dayjs(`${currentYear}-${String(currentMonth).padStart(2, "0")}-01`);
        const startDay = startOfMonth.startOf("week");

        let days = [];
        for (let i = 0; i < 42; i++) {
            days.push(startDay.add(i, "day"));
        }
        return days;
    };

    const calendarDays = generateCalendar();


    const isWeekend = (date) => {
        const day = dayjs(date).day();

        return day === 0 || day === 6;
    };

    const getHalfDayLabel = (leave, date) => {
        if (!leave?.isHalfDay) return "";

        const currentDate = dayjs(date);
        const fromDate = dayjs(leave.from);
        const toDate = dayjs(leave.to);

        const isSingleDay = fromDate.isSame(toDate, "day");
        const isFirstDay = currentDate.isSame(fromDate, "day");
        const isLastDay = currentDate.isSame(toDate, "day");

        const getLabel = (type) => {
            const value = String(type || "").toLowerCase();

            if (value === "pre") return "FH";
            if (value === "post") return "SH";

            return "";
        };

        // Single day half leave
        if (isSingleDay) {
            return getLabel(leave.halfDayType);
        }

        // Multi-day first day half leave
        if (isFirstDay && leave.halfLeaveForFirstDay) {
            return getLabel(leave.firstDayHalfType);
        }

        // Multi-day last day half leave
        if (isLastDay && leave.halfLeaveForLastDay) {
            return getLabel(leave.lastDayHalfType);
        }

        return "";
    };

    const getLeavesForDate = (date) => {
        if (isWeekend(date)) {
            return [];
        }

        return leaves.filter((l) =>
            dayjs(date).isBetween(l.from, l.to, "day", "[]")
        );
    };

    const currentDate = dayjs(
        `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`
    );

    const handlePrevMonth = () => {
        const prev = currentDate.subtract(1, "month");

        setCurrentMonth(prev.month() + 1);
        setCurrentYear(prev.year());
    };

    const handleNextMonth = () => {
        const next = currentDate.add(1, "month");

        setCurrentMonth(next.month() + 1);
        setCurrentYear(next.year());
    };

    const prevMonthName = currentDate.subtract(1, "month").format("MMMM");
    const currentMonthName = currentDate.format("MMMM");
    const nextMonthName = currentDate.add(1, "month").format("MMMM");

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2.5 py-1 rounded-full">
                                Leave Calendar
                            </span>

                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mt-3">
                                Month Wise Leave Report
                            </h2>

                            <p className="text-xs text-slate-400 mt-1">
                                Approved employee leaves displayed by working days only.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevMonth}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-brand-200 hover:text-brand-600 hover:bg-brand-50 transition-all"
                            >
                                ← {prevMonthName}
                            </button>

                            <div className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-extrabold shadow-md shadow-brand-500/20">
                                {currentMonthName} {currentYear}
                            </div>

                            <button
                                onClick={handleNextMonth}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-brand-200 hover:text-brand-600 hover:bg-brand-50 transition-all"
                            >
                                {nextMonthName} →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-none bg-gradient-to-br from-white via-indigo-50/20 to-sky-50/30 rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                {/* Week Header */}
                <div className="grid grid-cols-7 w-full bg-slate-800">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                        <div
                            key={day}   
                            className="px-2 py-3 text-center text-[11px] font-extrabold text-white uppercase tracking-wider border-r border-slate-700 last:border-r-0"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                    {calendarDays.map((date, index) => {
                        const dayLeaves = getLeavesForDate(date);

                        const isCurrentMonth =
                            dayjs(date).month() + 1 === currentMonth &&
                            dayjs(date).year() === currentYear;

                        const isToday = dayjs(date).isSame(dayjs(), "day");
                        return (
                            <div
                                key={index}
                                className={`
                                    min-h-[150px] p-2.5 py-3 border-r border-b border-[#6fbce8] transition-all relative overflow-hidden
                                    ${index % 7 === 6 ? "border-r-0" : ""}

                                    ${
                                        isCurrentMonth
                                        ? "bg-[#b6e1ff] hover:bg-[#a7d9fb]"
                                        : "bg-[#b6e1ff] text-slate-400"
                                    }

                                    ${
                                        isToday
                                        ? "ring-2 ring-brand-500 ring-inset"
                                        : ""
                                    }
                                `}
                            >
                                <div className="flex items-center justify-center mb-2">
                                    <span
                                        className={`
                                            text-xs font-extrabold
                                            ${isToday
                                                ? "bg-brand-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-sm"
                                                : isCurrentMonth
                                                    ? "text-slate-700"
                                                    : "text-slate-400"
                                            }
                                        `}
                                    >
                                        {dayjs(date).date()}
                                    </span>
                                </div>

                                <div className={`space-y-1 ${isCurrentMonth ? "" : "text-slate-400"}`}>
                                    {dayLeaves.map((leave) => {
                                        const employeeName =
                                            leave.employeeId && typeof leave.employeeId === "object"
                                                ? `${leave.employeeId.firstName || ""} ${leave.employeeId.lastName || ""}`.trim()
                                                : "Employee";

                                        const halfDayLabel = getHalfDayLabel(leave, date);

                                        return (
                                            <div
                                                key={leave._id}
                                                title={employeeName}
                                                className="text-[11px] font-semibold italic text-slate-700 leading-snug whitespace-normal break-words text-center"
                                            >
                                                {employeeName}
                                                {halfDayLabel && (
                                                    <span className="text-[11px] font-semibold italic text-slate-700 ml-1">
                                                        ({halfDayLabel})
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default LeaveCalendar;
