import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { showErrorToast } from '../../utils/toastHelper';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader';
import { route } from '../../utils/routeHelper';
import { hasPermission } from '../../utils/permissions.js';

DataTable.use(DT);

const QuarterlyLeavePolicyList = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const canCreateQuarterlyPolicy = hasPermission(user, "leave-type", "create") || hasPermission(user, "quarterly-leave-policy", "create");
  const canUpdateQuarterlyPolicy = hasPermission(user, "leave-type", "update") || hasPermission(user, "quarterly-leave-policy", "update");
  const canDeleteQuarterlyPolicy = hasPermission(user, "leave-type", "delete") || hasPermission(user, "quarterly-leave-policy", "delete");
  const canApplyQuarterlyPolicy = canUpdateQuarterlyPolicy || hasPermission(user, "quarterly-leave-policy", "apply");
  const canManageQuarterlyPolicy = canUpdateQuarterlyPolicy || canDeleteQuarterlyPolicy || canApplyQuarterlyPolicy;

   const fetchPolicies = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        "/quarterly-leave-policy"
      );

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      showErrorToast(
        error?.response?.data?.message ||
          "Failed to load quarterly leave policies"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/quarterly-leave-policy');
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
    console.error('Request failed:', error);
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
      await api.delete(`/quarterly-leave-policy/${id}`);
      toast.success('Quarterly leave policy deleted successfully');
      await loadData();
    } catch (error) {
    console.error('Request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAllocation = async (id) => {
    const confirmApply = window.confirm(
      "Are you sure you want to apply this quarterly leave allocation to all active employees?"
    );

    if (!confirmApply) return;

    try {
      setLoading(true);

      const { data } = await api.post(
        `/quarterly-leave-policy/${id}/apply-allocation`
      );

      toast.success(
        `Allocation applied: ${data?.applied || 0}, skipped: ${
          data?.skipped || 0
        }`
      );

      fetchPolicies();
    } catch (error) {
      showErrorToast(
        error?.response?.data?.message ||
          "Failed to apply allocation"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatAllocationType = (value) => {
    if (value === 'fixed') return 'Fixed';
    if (value === 'prorated') return 'Prorated';
    if (value === 'manual') return 'Manual';
    return '-';
  };

  const columns = [
    {
      title: 'Policy Name',
      data: 'policyName',
      render: (data) => `<span class="font-semibold text-slate-700">${data}</span>`
    },
    {
      title: 'Leave Type',
      data: null,
      render: (data) => `<span class="font-mono text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">${data?.leaveType?.code || "N/A"}</span>`,
    },
    {
      title: 'Year',
      data: 'year',
      render: (data) => `<span class="text-slate-600 font-medium">${data}</span>`
    },
    {
      title: 'Quarter',
      data: 'quarter',
      render: (data) => `<span class="bg-indigo-50/60 text-brand-700 text-xs font-extrabold px-2 py-0.5 rounded border border-indigo-100/50">${data}</span>`
    },
    {
      title: 'Days',
      data: 'leaveDays',
      render: (data) => `<span class="font-bold text-slate-800 text-sm">${data}</span>`
    },
    {
      title: 'Allocation Type',
      data: 'allocationType',
      render: (data) => {
        const display = formatAllocationType(data);
        let badge = "bg-slate-50 text-slate-600 border-slate-100";
        if (data === 'fixed') badge = "bg-emerald-50 text-emerald-700 border-emerald-100";
        if (data === 'prorated') badge = "bg-indigo-50 text-brand-700 border-indigo-100";
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge}">${display}</span>`;
      }
    },
    {
      title: 'Carry Forward',
      data: 'carryForward',
      render: (data) => data 
        ? `<span class="text-emerald-600 font-semibold text-xs flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Yes</span>` 
        : `<span class="text-slate-400 text-xs">No</span>`,
    },
    {
      title: 'Status',
      data: 'status',
      render: (data) => {
        return `
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            data ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-slate-50 text-slate-400 border-slate-200"
          }">
            ${data ? "Active" : "Inactive"}
          </span>
        `;
      }
    },
    ...(canManageQuarterlyPolicy ? [{
      title: 'Action',
      data: null,
      render: (data) => {
        return `
          <div class="flex items-center gap-1.5">
            ${canUpdateQuarterlyPolicy ? `
            <button class="edit-btn p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Edit">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            ` : ""}

            ${canApplyQuarterlyPolicy ? `
            <button class="apply-btn p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white border border-amber-100 hover:border-amber-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Apply Allocation to all employees">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
            ` : ""}

            ${canDeleteQuarterlyPolicy ? `
            <button class="delete-btn p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Delete">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
            ` : ""}
          </div>
        `;
      },
    }] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {loading && <Loader />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quarterly Leave Policies</h1>
          <p className="text-xs text-slate-500 mt-1">Configure automated quarterly leave accrual, Carry Forwards, and distribution types.</p>
        </div>

        {canCreateQuarterlyPolicy && (
          <Link
            to={route(user, '/leaves/quarterly-leave-policy/new')}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
            Create Quarterly Policy
          </Link>
        )}
      </div>

      {/* Table Card */}
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
              document.querySelectorAll('.edit-btn').forEach((el) => {
                el.onclick = () => {
                  const id = el.getAttribute('data-id');
                  navigate(
                    route(user,`/leaves/quarterly-leave-policy/${id}`)
                  );
                };
              });

              document.querySelectorAll('.apply-btn').forEach((el) => {
                el.onclick = () => {
                  const id = el.getAttribute('data-id');
                  handleApplyAllocation(id);
                };
              });

              document.querySelectorAll('.delete-btn').forEach((btn) => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute('data-id');
                  if (confirm('Are you sure you want to delete this quarterly leave policy?')) {
                    handleDelete(id);
                  }
                };
              });

              document.querySelectorAll('.dataTable tbody td').forEach((td) => {
                td.style.setProperty('font-size', '13px', 'important');
                td.style.setProperty('padding', '12px 16px', 'important');
                td.style.setProperty('border-bottom', '1px solid #f1f5f9', 'important');
                td.style.setProperty('color', '#334155', 'important');
              });

              document.querySelectorAll('.dataTable thead th').forEach((th) => {
                th.style.setProperty('font-size', '11px', 'important');
                th.style.setProperty('text-transform', 'uppercase', 'important');
                th.style.setProperty('letter-spacing', '0.05em', 'important');
                th.style.setProperty('color', '#64748b', 'important');
                th.style.setProperty('padding', '12px 16px', 'important');
                th.style.setProperty('border-bottom', '2px solid #f1f5f9', 'important');
              });
            },
          }}
        />
      </div>
    </div>
  );
};

export default QuarterlyLeavePolicyList;
