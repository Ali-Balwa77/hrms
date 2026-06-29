import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasPermission } from '../../utils/permissions';
import { buildNestedPath, normalizePath } from '../../utils/spaNavigation.js';
import {
  FiGrid, FiUsers, FiLayers, FiCalendar, FiGift, FiFileText,
  FiFileMinus, FiTag, FiLock, FiChevronDown, FiChevronRight,
  FiDollarSign, FiTrendingUp, FiSettings, FiMenu, FiUserCheck, FiClock
} from 'react-icons/fi';



const iconMap = {
  dashboard: FiGrid,
  employee: FiUsers,
  organization: FiLayers,
  attendance: FiCalendar,
  mispunch: FiClock,
  holiday: FiGift,
  rule: FiFileText,
  leave: FiFileMinus,
  designation: FiTag,
  role: FiLock,
  user: FiUserCheck,
  payroll: FiDollarSign,
  reports: FiTrendingUp,
  settings: FiSettings,
};

const getMenuItems = (user) => [
  {
    to: 'dashboard',
    label: 'Dashboard',
    module: 'dashboard',
    action: 'read',
    iconKey: 'dashboard',
  },
  ...(hasPermission(user, 'employee', 'employee_menu')
    ? [
      {
        to: 'employees',
        label: 'Employees',
        module: 'employee',
        action: 'read',
        iconKey: 'employee',
        children: [
          {
            to: hasPermission(user, 'employee', 'team_employee_list') ? '/teamEmployee' : '',
            label: 'Employee List',
          },
          ...(hasPermission(user, 'employee', 'reporting_manager_master')
            ? [{ to: '/reporting-manager-master', label: 'Reporting Manager Master' }]
            : []),
        ],
      },
    ]
    : []),
  {
    to: 'organizations',
    label: 'Organizations',
    module: 'organization',
    action: 'read',
    iconKey: 'organization',
  },
  {
    to: 'mispunch',
    label: 'Mispunch',
    module: 'mispunch',
    action: 'read',
    iconKey: 'mispunch',
    children: [
      ...(hasPermission(user, 'mispunch', 'mispunch_self_menu')
      ? [{ to: 'application', label: 'Mispunch Application' }]
      : []),
      ...(hasPermission(user, 'mispunch', 'mispunch_approval_menu')
      ? [{ to: 'requests', label: 'Mispunch Requests' }]
      : []),
    ],
  },
  {
    to: 'attendance',
    label: 'Attendance',
    module: 'attendance',
    action: 'read',
    iconKey: 'attendance',
  },
  {
    to: 'leaves',
    label: 'Leaves',
    module: 'leave',
    action: 'read',
    iconKey: 'leave',
    children: [
      ...((hasPermission(user, 'leave', 'leave_self_menu'))
        ? [
          { to: 'application', label: 'Leave Application' },
          { to: 'cancellation', label: 'Leave Cancellation' },
        ]
        : []),
        ...((hasPermission(user, 'leave', 'leave_approval_menu'))
        ? [{ to: 'leave-requests', label: 'Leave Requests' }]
        : []),
        ...((hasPermission(user, 'leave', 'leave_cancel_approval_menu'))
        ? [{ to: 'leave-requests-cancel', label: 'Leave Requests Cancel' }]
        : []),
        ...(hasPermission(user, 'leave-type', 'leave_type_menu')
        ? [{ to: 'leave-type', label: 'Leave Types' }]
        : []),
        ...(hasPermission(user, 'leave-type', 'quarterly_leave_policy_menu')
        ? [{ to: 'quarterly-leave-policy', label: 'Quarterly Leave Policy' }]
        : []),
        ...(hasPermission(user, 'leave', 'leave_report_menu')
        ? [{ to: 'leave-reports', label: 'Month Wise Leave Reports' }]
        : []),
      ],
    },
    {
      to: 'holidays',
      label: 'Holidays',
      module: 'holiday',
      action: 'read',
      iconKey: 'holiday',
    },
    {
      to: 'rules',
      label: 'Rules & Regulation',
      module: 'rule',
      action: 'read',
      iconKey: 'rule',
    },
    ...(hasPermission(user, 'designation', 'designation_menu')
    ? [
      {
        to: 'designations',
        label: 'Designation Master',
        module: 'designation',
        action: 'read',
        iconKey: 'designation',
      },
    ]
    : []),
  {
    to: 'roles',
    label: 'Role Management',
    module: 'role',
    action: 'read',
    iconKey: 'role',
  },
  {
    to: 'users',
    label: 'User Access Master',
    module: 'user',
    action: 'read',
    iconKey: 'user',
  }
];

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuItems = useMemo(() => getMenuItems(user), [user]);

  const activeLinkStyle = 'bg-brand-600 text-white shadow-md shadow-brand-600/10 font-medium';
  const inactiveLinkStyle = 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100';

  const linkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-200 group relative ${isActive ? activeLinkStyle : inactiveLinkStyle
    }`;

  const childLinkClass = ({ isActive }) =>
    `block ml-9 px-4 py-2.5 text-[13px] rounded-lg transition-all duration-150 ${isActive ? 'bg-brand-500/20 text-brand-400 font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
    }`;


    useEffect(() => {
    const activeParentIndex = menuItems.findIndex((item) => {
      if (!item.children?.length) return false;

      return item.children.some((child) => {
        const childPath = child.to?.startsWith("/")
          ? child.to
          : buildNestedPath(item.to, child.to);

        return location.pathname === normalizePath(childPath);
      });
    });

    if (activeParentIndex !== -1) {
      setOpenMenu(activeParentIndex);
    } else {
      setOpenMenu(null);
    }
  }, [location.pathname, menuItems]);

  return (
    <aside
      className={`sticky top-0 h-full min-h-0 bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-20 flex-shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Nav Items */}
      <nav className="p-3 space-y-1.5 flex-1 min-h-0 overflow-y-auto">
        {menuItems.map((item, index) => {
          if (item.module && !hasPermission(user, item.module, item.action)) return null;

          const IconComponent = iconMap[item.iconKey] || FiGrid;

          // Nested Children Menu Item
          if (item.children?.length && !isCollapsed) {
            const isOpen = openMenu === index;

            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setOpenMenu(isOpen ? null : index)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isOpen ? 'text-slate-100 bg-slate-800/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}
                >
                  <span className="flex items-center">
                    <IconComponent className={`mr-3.5 w-4.5 h-4.5 transition-colors ${isOpen ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span>{item.label}</span>
                  </span>
                  {isOpen ? <FiChevronDown className="h-3.5 w-3.5" /> : <FiChevronRight className="h-3.5 w-3.5" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-80 opacity-100 py-1' : 'max-h-0 opacity-0'}`}>
                  {item.children.map((child) => (
                    <NavLink
                      key={child.label}
                      to={child.to?.startsWith('/') ? child.to : buildNestedPath(item.to, child.to)}
                      end={!child.to}
                      className={childLinkClass}
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          }

          // Single Link Menu Item
          return (
            <NavLink
              key={item.label}
              to={normalizePath(item.to)}
              end={item.to === 'dashboard'}
              className={linkClass}
              title={isCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <IconComponent className={`w-4.5 h-4.5 transition-colors ${isCollapsed ? 'mx-auto' : 'mr-3.5'} ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {!isCollapsed && <span>{item.label}</span>}

                  {/* Left Indigo Accent Indicator Line for Expanded Sidebar Active Link */}
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md" />
                  )}

                  {/* Collapsed Tooltip */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

