import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { useSelector } from 'react-redux';

import { FiLayers, FiCheckCircle, FiActivity, FiPlus } from 'react-icons/fi';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import { route } from '../../utils/routeHelper.js';
import { hasPermission } from '../../utils/permissions.js';

DataTable.use(DT);

const OrganizationListPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const canUpdateOrganization = hasPermission(user, "organization", "update");
  const canDeleteOrganization = hasPermission(user, "organization", "delete");
  const canCreateOrganization = hasPermission(user, "organization", "create");

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/organizations');
      setOrgs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/organizations/${id}`);
      toast.success('Organization deleted successfully');
      await loadOrgs();
    } catch (err) {
      console.error("Failed to delete organization");
    } finally {
      setLoading(false);
    }
  };

  // Calculations for dashboard
  const totalOrgs = orgs.length;

  const columns = [
    {
      title: "Name",
      data: "name",
      render: (data) => `
        <div class="flex items-center gap-2.5">
          <div class="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
          <span class="text-slate-800 font-semibold truncate max-w-[180px]">${data || "-"}</span>
        </div>
      `
    },
    {
      title: "Code",
      data: "code",
      render: (data) => `<span class="font-mono text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg shadow-sm">${data || "-"}</span>`
    },
    {
      title: "Email Address",
      data: "email",
      render: (data) => `
        <a href="mailto:${data}" class="text-indigo-600 hover:text-indigo-800 font-semibold text-xs transition-colors duration-150 inline-flex items-center gap-1">
          <svg class="w-3.5 h-3.5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          ${data || "-"}
        </a>
      `
    },
    {
      title: "Leave Allocation",
      data: "quarterlyLeaveAllocationEnabled",
      render: (data) => data
        ? '<span class="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Quarterly</span>'
        : '<span class="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">Annual</span>'
    },
    ...((canUpdateOrganization || canDeleteOrganization)
      ? [
          {
            title: "Action",
            data: null,
            render: (data) => `
              <div class="flex items-center gap-1.5">
                ${canUpdateOrganization ? `
                  <button class="edit-btn p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Edit">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                ` : ''}
                ${canDeleteOrganization ? `
                  <button class="delete-btn p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all duration-200 cursor-pointer" data-id="${data._id}" title="Delete">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                ` : ''}
              </div>
            `
          }
        ]
      : [])
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {loading && <Loader />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-display">Organizations</h1>
          <p className="text-xs text-slate-500 mt-1">Manage global structural business entities and subsidiaries.</p>
        </div>

        {canCreateOrganization && (
          <Link
            to={route(user, "/organizations/new")}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg> 
            Create Organization
          </Link>
        )}
      </div>

      {/* Table Container with scroll containment */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto w-full">
        <DataTable
          key={JSON.stringify(orgs.map((item) => [item?._id || item?.id, item?.updatedAt, item?.status, item?.isActive, item?.name, item?.code])) || 'empty'}
          data={orgs}
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
              document.querySelectorAll('.dataTable tbody td').forEach(td => {
                td.style.setProperty('font-size', '13px', 'important');
                td.style.setProperty('padding', '14px 16px', 'important');
                td.style.setProperty('border-bottom', '1px solid #f1f5f9', 'important');
                td.style.setProperty('color', '#334155', 'important');
              });

              document.querySelectorAll('.dataTable thead th').forEach(th => {
                th.style.setProperty('font-size', '11px', 'important');
                th.style.setProperty('text-transform', 'uppercase', 'important');
                th.style.setProperty('letter-spacing', '0.05em', 'important');
                th.style.setProperty('color', '#64748b', 'important');
                th.style.setProperty('padding', '12px 16px', 'important');
                th.style.setProperty('border-bottom', '2px solid #e2e8f0', 'important');
                th.style.setProperty('font-weight', '700', 'important');
              });

              document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute('data-id');
                  navigate(route(user,`/organizations/${id}`));
                };
              });

              document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = (e) => {
                  const id = e.currentTarget.getAttribute('data-id');

                  if (confirm("Are you sure you want to delete this organization?")) {
                    handleDelete(id);
                  }
                };
              });
            }
          }}
        />
      </div>
    </div>
  );
};

export default OrganizationListPage;
