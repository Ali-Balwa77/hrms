import React, { useEffect, useState } from 'react';
import toast from "react-hot-toast";
import { api } from "../../services/api.js";

const ReportingManagerMaster = () => {
  const [allEmployees, setAllEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const teamLeads = allEmployees.filter(
    (emp) =>
      ['Team Lead', 'Admin'].includes(emp.employeeType) &&
      emp.status === 'active'
  );
  const [oldTlId, setOldTlId] = useState("");
  const [newTlId, setNewTlId] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const fetchTLs = async () => {
    try {
      const res = await api.get("/employees");

      setAllEmployees((Array.isArray(res?.data) ? res.data : (res?.data?.data || [])));
    } catch (err) {
      console.error('Failed to fetch team leads:', err);
    }
  };

  useEffect(() => {
    fetchTLs();
  }, []);

  const handleOldTLChange = async (e) => {
    const value = e.target.value;

    setOldTlId(value);
    setNewTlId("");
    setEmployees([]);
    setSelectedEmployees([]);
    setSelectAll(false);

    if (!value) return;

    try {
      const res = await api.get(
        `/reporting-manager/employees/${value}`
      );

      setEmployees((Array.isArray(res?.data) ? res.data : (res?.data?.data || [])));
    } catch (error) {
      console.error('Failed to fetch reporting employees:', error);
    }
  };

  const handleCheckbox = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      const allIds = employees.map((emp) => emp._id);
      setSelectedEmployees(allIds);
    }

    setSelectAll(!selectAll);
  };

  const handleTransfer = async () => {
    if (!oldTlId) {
      toast.error("Please select old reporting manager");
      return;
    }

    if (!newTlId) {
      toast.error("Please select new reporting manager");
      return;
    }

    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    try {
      await api.post("/reporting-manager/transfer", {
        oldTlId,
        newTlId,
        employeeIds: selectedEmployees,
      });

      toast.success("Employees transferred successfully");

      setEmployees([]);
      setSelectedEmployees([]);
      setOldTlId("");
      setNewTlId("");
      setSelectAll(false);
    } catch (err) {
      console.error('Request failed:', err);
      }
  };

  useEffect(() => {
    if (
      employees.length > 0 &&
      selectedEmployees.length === employees.length
    ) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedEmployees, employees]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Reporting Manager Master
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Transfer employees from one reporting manager to another.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Old Reporting Manager
            </label>

            <select
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat"
              value={oldTlId}
              onChange={handleOldTLChange}
            >
              <option value="">Select Old Reporting Manager</option>

              {teamLeads.map((tl) => (
                <option key={tl._id} value={tl._id}>
                  {tl.firstName} {tl.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              New Reporting Manager
            </label>

            <select
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat"
              value={newTlId}
              onChange={(e) => setNewTlId(e.target.value)}
            >
              <option value="">Select New Reporting Manager</option>

              {teamLeads
                .filter((tl) => tl._id !== oldTlId)
                .map((tl) => (
                  <option key={tl._id} value={tl._id}>
                    {tl.firstName} {tl.lastName}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {employees.length > 0 && (
        <div className="bg-white rounded-2xl shadow-premium border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Employee List
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Select employees you want to transfer.
              </p>
            </div>

            <span className="text-sm text-slate-500">
              Selected: {selectedEmployees.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    Employee Name
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    Department
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr
                    key={emp._id}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp._id)}
                        onChange={() => handleCheckbox(emp._id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    <td className="px-5 py-3 text-slate-700 font-medium">
                      {emp.firstName} {emp.lastName}
                    </td>

                    <td className="px-5 py-3 text-slate-500">
                      {emp.department || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleTransfer}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Transfer Employees
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportingManagerMaster;
