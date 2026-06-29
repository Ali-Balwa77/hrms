import React, { useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { FiTrendingUp, FiUsers, FiCalendar, FiClock, FiDownload, FiShare2, FiRefreshCw } from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ReportsDashboard = () => {
  const [timePeriod, setTimePeriod] = useState('YTD');
  const [loading, setLoading] = useState(false);

  const handleExport = (type) => {
    toast.success(`Exporting ${type} report... PDF/CSV file will start downloading shortly.`);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Analytics logs re-synchronized successfully.');
    }, 800);
  };

  const stats = [
    { label: 'Avg Tenure', value: '3.4 Years', change: '+0.2 Years YOY', positive: true, icon: FiUsers, color: 'bg-indigo-500' },
    { label: 'Attrition Rate', value: '4.2%', change: '-1.8% vs Q1', positive: true, icon: FiTrendingUp, color: 'bg-emerald-500' },
    { label: 'Avg Leave Rate', value: '1.6 Days/Mo', change: 'Optimal Range', positive: true, icon: FiCalendar, color: 'bg-amber-500' },
    { label: 'Punch Compliance', value: '96.8%', change: '+0.5% vs Prev Month', positive: true, icon: FiClock, color: 'bg-teal-500' },
  ];

  // Chart data: Leave Utilizations Line Chart
  const leaveData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        fill: true,
        label: 'Applied Leaves (Days)',
        data: [120, 115, 140, 95, 180, 240, 220, 190, 130, 145, 160, 210],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(79, 70, 229)',
      },
      {
        fill: true,
        label: 'Cancellations (Days)',
        data: [15, 10, 25, 8, 30, 45, 35, 20, 12, 18, 15, 25],
        borderColor: 'rgb(244, 63, 94)',
        backgroundColor: 'rgba(244, 63, 94, 0.02)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: 'rgb(244, 63, 94)',
      }
    ],
  };

  const leaveOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Inter', size: 11, weight: '500' },
          color: '#64748b',
          boxWidth: 8,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Poppins', size: 12, weight: '600' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 12,
      }
    },
    scales: {
      y: {
        grid: { borderDash: [5, 5], color: '#f1f5f9' },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b' }
      }
    }
  };

  // Chart data: Headcount by Department Bar Chart
  const headcountData = {
    labels: ['Engineering', 'Marketing', 'Sales', 'Design', 'Product', 'HR', 'Finance'],
    datasets: [
      {
        label: 'Active Employees',
        data: [42, 18, 25, 12, 15, 8, 6],
        backgroundColor: 'rgba(79, 70, 229, 0.85)',
        borderRadius: 8,
        barThickness: 24,
      },
      {
        label: 'Open Roles',
        data: [8, 3, 5, 2, 4, 1, 1],
        backgroundColor: 'rgba(203, 213, 225, 0.6)',
        borderRadius: 8,
        barThickness: 24,
      }
    ]
  };

  const headcountOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Inter', size: 11, weight: '500' },
          color: '#64748b',
          boxWidth: 8,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Poppins', size: 12, weight: '600' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 12,
      }
    },
    scales: {
      y: {
        grid: { borderDash: [5, 5], color: '#f1f5f9' },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b' }
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reports & HR Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Monitor organizational health indicators, attendance averages, and employee retention graphs.</p>
        </div>

        {/* Time filters */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200/40">
          {['30D', 'Q1', 'YTD'].map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                timePeriod === period
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {period === '30D' ? 'Last 30 Days' : period === 'Q1' ? 'First Quarter' : 'Year-to-Date'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">{stat.label}</span>
                <span className="text-2xl font-bold text-slate-800 block tracking-tight">{stat.value}</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 inline-block">
                  {stat.change}
                </span>
              </div>
              <div className={`h-11 w-11 rounded-xl ${stat.color} text-white flex items-center justify-center shadow-md shadow-slate-100`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Graph 1: Leaves Line */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Leave Applications Rate</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Tracking seasonal distributions and cancellation frequencies</p>
            </div>
            <button 
              type="button"
              onClick={handleRefresh}
              className={`p-2 text-slate-400 hover:text-brand-500 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors bg-white ${loading ? 'animate-spin' : ''}`}
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-[300px] relative">
            <Line data={leaveData} options={leaveOptions} />
          </div>
        </div>

        {/* Graph 2: Department Bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Headcount by Business Unit</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Active positions compared against scheduled hires</p>
            </div>
            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-md uppercase tracking-wider">126 Total Positions</span>
          </div>

          <div className="h-[300px] relative">
            <Bar data={headcountData} options={headcountOptions} />
          </div>
        </div>
      </div>

      {/* Analytics Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2">Organizational Audits</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate detailed CSV files audit on designations distribution, profile completeness checklist, and emergency contacts validation logs.
          </p>
          <button
            type="button"
            onClick={() => handleExport('System Audit')}
            className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all"
          >
            <FiDownload className="w-4.5 h-4.5 text-slate-400" /> Export System Audit
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2">Punch Records Logs</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Export unified records containing clock-in / clock-out timestamps, compliance rates, lunch intervals, and late punch counts.
          </p>
          <button
            type="button"
            onClick={() => handleExport('Punch Compliance')}
            className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all"
          >
            <FiDownload className="w-4.5 h-4.5 text-slate-400" /> Export Attendance Logs
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2">Annual Leave Metrics</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Obtain unified leaves summary outlining total accrued types, total carry forwards, pending approval requests, and rejection ratios.
          </p>
          <button
            type="button"
            onClick={() => handleExport('Leaves Accruals')}
            className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all"
          >
            <FiDownload className="w-4.5 h-4.5 text-slate-400" /> Export Leave Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
