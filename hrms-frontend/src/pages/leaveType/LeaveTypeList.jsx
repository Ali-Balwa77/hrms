import React, { useEffect, useState } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import toast from 'react-hot-toast';
  import { api } from '../../services/api.js';
  import Loader from '../../components/common/Loader.jsx';
  import { useSelector } from 'react-redux';

  import DataTable from 'datatables.net-react';
  import DT from 'datatables.net-dt';
  import { route } from '../../utils/routeHelper.js';
  import { hasPermission } from '../../utils/permissions.js';

  DataTable.use(DT);

  const LeaveTypeList = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useSelector((state) => state.auth);
    const canCreateLeaveType = hasPermission(user, "leave-type", "create");
    const canUpdateLeaveType = hasPermission(user, "leave-type", "update");
    const canDeleteLeaveType = hasPermission(user, "leave-type", "delete");
    const canManageLeaveType = canUpdateLeaveType || canDeleteLeaveType;

    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const loadData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/leave-type/all');
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadData();
    }, []);

    const handleDelete = async (id) => {
      try {
        setLoading(true);
        await api.delete(`/leave-type/${id}`);
        toast.success('Leave type deleted');
        await loadData();
      } catch (err) {
      console.error('Request failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleStatusToggle = async (id, currentStatus) => {
      try {

        setLoading(true);

        await api.patch(`/leave-type/${id}`, {
          status: !currentStatus
        });

        toast.success("Status updated successfully");

        await loadData();

      } catch (err) {
      console.error('Request failed:', err);
      } finally {

        setLoading(false);
      }
    };

    const columns = [
      {
        title: "Leave Name",
        data: "name",
        render: (data) => `<span class="font-semibold text-slate-700">${data}</span>`
      },
      {
        title: "Leave Code",
        data: "code",
        render: (data) => `<span class="font-mono text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">${data}</span>`
      },
      {
        title: "Status",
        data: "status",
        render: (data, type, row) => {
          if (!canUpdateLeaveType) {
            return `
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${row.status ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-slate-50 text-rose-400 border-rose-200"}">
                ${row.status ? "Active" : "Inactive"}
              </span>
            `;
          }

          return `
            <div class="flex items-center">
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  class="sr-only peer status-toggle"
                  data-id="${row._id}"
                  ${row.status ? "checked" : ""}
                />
                <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
              <span class="ml-2.5 text-xs font-semibold uppercase tracking-wider ${row.status ? 'text-brand-600' : 'text-slate-400'}">${row.status ? 'Active' : 'Inactive'}</span>
            </div>
          `;
        }
      },
      {
        title: "Total Days",
        data: "totalDays",
        render: (data) => `<span class="font-bold text-slate-800 text-sm">${data}</span>`
      },
      {
        title: "Allocation Mode",
        data: "allocationMode",
        render: (data) => {
          const isQuarterly = data === "quarterly";
          return `
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${
              isQuarterly
                ? "bg-indigo-50 text-brand-700 border-indigo-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-100"
            }">
              ${isQuarterly ? "Quarterly" : "Normal"}
            </span>
          `;
        }
      },
      ...(canManageLeaveType ? [{
        title: "Action",
        data: null,
        render: (data) => {
          return `
            <div class="flex items-center gap-1.5">
              ${canUpdateLeaveType ? `
              <button class="edit-btn p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Edit">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
              ` : ""}

              ${canDeleteLeaveType ? `
              <button class="delete-btn p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Delete">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
              ` : ""}
            </div>
          `;
        }
      }] : [])
    ];

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading && <Loader />}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Leave Type Configurations</h1>
            <p className="text-xs text-slate-500 mt-1">Manage standard and quarterly leaves, accruals, and toggles.</p>
          </div>

          {canCreateLeaveType && (
              <Link
                to={route(user, "/leaves/leave-type/new")}
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                Create Leave Type
              </Link>
          )}
        </div>

        {/* Table Wrapper */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
          <DataTable
            key={JSON.stringify(items.map((item) => [item?._id || item?.id, item?.updatedAt, item?.status, item?.isActive, item?.name, item?.code])) || 'empty'}
            data={items}
            columns={columns}
            options={{
              paging: true,
              searching: true,
              ordering: true,
              pageLength: 10,
              lengthMenu: [10, 25, 50, 100],
              language: {
                search: "",
                searchPlaceholder: "Search here...",
                lengthMenu: "Show _MENU_ records",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "No records found",
                zeroRecords: "No matching records found",
                paginate: {
                  first: "«",
                  previous: "Previous",
                  next: "Next",
                  last: "»",
                },
              },

              drawCallback: function () {
                document.querySelectorAll('.edit-btn').forEach(el => {
                  el.onclick = () => {
                    const id = el.getAttribute('data-id');
                    navigate(route(user,`/leaves/leave-type/${id}`));
                  };
                });

                document.querySelectorAll('.delete-btn').forEach(btn => {
                  btn.onclick = (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm("Are you sure you want to delete this leave type?")) {
                      handleDelete(id);
                    }
                  };
                });

                document.querySelectorAll('.status-toggle')
                  .forEach(toggle => {
                    toggle.onchange = (e) => {
                      const id = e.currentTarget.getAttribute('data-id');
                      const currentStatus = e.currentTarget.checked;
                      handleStatusToggle(id, !currentStatus);
                    };
                });

                document.querySelectorAll('.dataTable tbody td').forEach(td => {
                  td.style.setProperty('font-size', '13px', 'important');
                  td.style.setProperty('padding', '12px 16px', 'important');
                  td.style.setProperty('border-bottom', '1px solid #f1f5f9', 'important');
                  td.style.setProperty('color', '#334155', 'important');
                });

                document.querySelectorAll('.dataTable thead th').forEach(th => {
                  th.style.setProperty('font-size', '11px', 'important');
                  th.style.setProperty('text-transform', 'uppercase', 'important');
                  th.style.setProperty('letter-spacing', '0.05em', 'important');
                  th.style.setProperty('color', '#64748b', 'important');
                  th.style.setProperty('padding', '12px 16px', 'important');
                  th.style.setProperty('border-bottom', '2px solid #f1f5f9', 'important');
                });
              }
            }}
          />
        </div>
      </div>
    );
  };

  export default LeaveTypeList;
