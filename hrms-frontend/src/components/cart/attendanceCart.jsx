import React, { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const AttendanceChart = ({
  employeeData = [],
  attendanceData = [],
  leavesData = [],
}) => {
  const chartDataValues = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStr = new Date().toLocaleDateString("en-GB");

    const present = attendanceData.filter((a) => {
      const attDate = a.date;
      return attDate === todayStr && a.checkIn;
    }).length;

    const leave = leavesData.filter((l) => {
      const from = new Date(l.from);
      const to = new Date(l.to);

      from.setHours(0, 0, 0, 0);
      to.setHours(0, 0, 0, 0);

      return (
        l.status === "approved" &&
        from <= today &&
        to >= today
      );
    }).length;

    const totalEmployees = Array.isArray(employeeData)
      ? employeeData.length
      : Number(employeeData || 0);

    const absent = Math.max(totalEmployees - present - leave, 0);

    return { present, leave, absent, totalEmployees };
  }, [attendanceData, leavesData, employeeData]);

  const data = {
    labels: ["Present", "Leave", "Absent"],
    datasets: [
      {
        data: [
          chartDataValues.present,
          chartDataValues.leave,
          chartDataValues.absent,
        ],
        backgroundColor: ["#22c55e", "#facc15", "#ef4444"],
        borderColor: "#ffffff",
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        padding: 10,
        cornerRadius: 10,
        displayColors: true,
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all duration-300 w-full">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logs</span>
            <h2 className="text-sm font-semibold text-slate-800 mt-0.5 mb-4">Today&apos;s employee attendance summary</h2>
        </div>

        <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
          Total: {chartDataValues.totalEmployees}
        </div>
      </div>

      <div className="h-56 flex items-center justify-center">
        <Pie data={data} options={options} />
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Present
          </p>
          <h4 className="text-xl font-bold text-slate-800 mt-1">
            {chartDataValues.present}
          </h4>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
            Leave
          </p>
          <h4 className="text-xl font-bold text-slate-800 mt-1">
            {chartDataValues.leave}
          </h4>
        </div>

        <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
            Absent
          </p>
          <h4 className="text-xl font-bold text-slate-800 mt-1">
            {chartDataValues.absent}
          </h4>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;