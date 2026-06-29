import React, { useEffect, useState } from 'react';
import { Line } from "react-chartjs-2";
import { api } from "../../services/api.js";
import { Chart as ChartJS, PointElement, LineElement, Legend, CategoryScale, LinearScale, Tooltip, Filler } from "chart.js";
import { FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';
ChartJS.register(PointElement, LineElement, Legend, LinearScale, CategoryScale, Tooltip, Filler);

const LeaveTrends = () => {
  const [leaveData, setLeaveData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/leaves/trends");
        
        setLeaveData(res.data || []);
      } catch (err) {
        console.error('Request failed:', err);
      }
    };

    fetchData();
  }, []);

  const last = leaveData[leaveData.length - 1]?.count || 0;
  const prev = leaveData[leaveData.length - 2]?.count || 0;

  let trendText = "Stable";
  let trendIcon = <FiActivity className="text-slate-400" />;
  let trendColor = "text-slate-500 bg-slate-50 border-slate-100";

  if (last > prev) {
    trendText = "Increasing";
    trendIcon = <FiTrendingUp className="text-rose-500 w-3.5 h-3.5" />;
    trendColor = "text-rose-600 bg-rose-50 border-rose-100/50";
  } else if (last < prev) {
    trendText = "Decreasing";
    trendIcon = <FiTrendingDown className="text-emerald-500 w-3.5 h-3.5" />;
    trendColor = "text-emerald-600 bg-emerald-50 border-emerald-100/50";
  }

  const data = {
    labels: leaveData.map(d =>
      new Date(d.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
      })
    ),
    datasets: [
      {
        label: "Leaves Requested",
        data: leaveData.map(d => d.count),
        tension: 0.35,
        borderColor: "#4f46e5",
        borderWidth: 2.5,
        pointBackgroundColor: "#4f46e5",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(79, 70, 229, 0.12)");
          gradient.addColorStop(1, "rgba(79, 70, 229, 0)");
          return gradient;
        },
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        titleFont: { family: "Inter", size: 12, weight: "bold" },
        bodyFont: { family: "Inter", size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "Inter", size: 10 }, color: "#94a3b8" }
      },
      y: {
        border: { dash: [4, 4] },
        grid: { color: "#f1f5f9" },
        ticks: { font: { family: "Inter", size: 10 }, color: "#94a3b8", stepSize: 1 }
      }
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analytics</span>
          <h3 className="text-sm font-semibold text-slate-800 mt-0.5">Leave Trends</h3>
        </div>
        {leaveData.length > 1 && (
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${trendColor}`}>
            {trendIcon}
            <span>{trendText}</span>
          </span>
        )}
      </div>

      <div className="h-56 relative w-full">
        {leaveData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium">
            No trend data available
          </div>
        ) : (
          <Line data={data} options={options} />
        )}
      </div>
    </div>
  );
};

export default LeaveTrends;

