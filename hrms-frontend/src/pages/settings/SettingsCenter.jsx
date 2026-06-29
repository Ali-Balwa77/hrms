import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { route } from '../../utils/routeHelper';
import toast from 'react-hot-toast';
import { 
  FiUsers, FiLock, FiCalendar, FiBookOpen, FiSliders, 
  FiChevronRight, FiGlobe, FiBell, FiShield, FiCpu, FiCheck 
} from 'react-icons/fi';

const SettingsCenter = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('general');
  const [themeMode, setThemeMode] = useState('light');
  const [language, setLanguage] = useState('en-US');
  const [weekStart, setWeekStart] = useState('monday');
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    sms: false,
    leaveApprovals: true,
    punchReminders: true
  });

  const handleSavePreferences = () => {
    toast.success('System localization preferences updated successfully.');
  };

  const handleToggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success('Notification settings auto-saved.');
  };

  // Sections of shortcuts
  const settingsCategories = [
    {
      title: 'Identity & Access',
      description: 'Manage staff hierarchies, designations, and security privileges.',
      items: [
        { label: 'Designation Master', desc: 'Create and configure official organizational roles', route: '/designations', icon: FiUsers },
        { label: 'Role Management', desc: 'Define access permission levels and guard rails', route: '/roles', icon: FiLock }
      ]
    },
    {
      title: 'Time & Leave Configurations',
      description: 'Align quarterly accruals, leave types, and calendar holidays.',
      items: [
        { label: 'Quarterly Leave Policy', desc: 'Manage quarterly accrual schedules & carry overs', route: '/leaves/quarterly-leave-policy', icon: FiSliders },
        { label: 'Leave Types', desc: 'Configure annual leave balances, active codes & rules', route: '/leaves/leave-type', icon: FiCalendar },
        { label: 'Holiday List', desc: 'Publish annual holiday schedule for business units', route: '/holidays', icon: FiGlobe }
      ]
    },
    {
      title: 'Compliance & Regulations',
      description: 'Set company handbooks and compliance requirements.',
      items: [
        { label: 'Rules & Regulations', desc: 'Publish guidelines, dress codes, and employee handbook', route: '/rules', icon: FiBookOpen }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Settings Center</h1>
        <p className="text-xs text-slate-500 mt-1">Configure company preferences, manage database shortcuts, and set localization rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side Tab Navigation */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-3.5 mb-2">Settings Groups</span>
          
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'general'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FiSliders className="w-4.5 h-4.5" />
              <span>General & Shortcuts</span>
            </span>
            <FiChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => setActiveTab('localization')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'localization'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FiGlobe className="w-4.5 h-4.5" />
              <span>Localization & Time</span>
            </span>
            <FiChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'notifications'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FiBell className="w-4.5 h-4.5" />
              <span>Alert Notifications</span>
            </span>
            <FiChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'security'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FiShield className="w-4.5 h-4.5" />
              <span>Security & Policies</span>
            </span>
            <FiChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Right Active Tab Content */}
        <div className="lg:col-span-3">
          
          {/* Tab 1: General & Shortcuts */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {settingsCategories.map((cat, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{cat.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{cat.description}</p>
                  </div>
                  
                  <div className="divide-y divide-slate-50">
                    {cat.items.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div 
                          key={idx} 
                          onClick={() => navigate(route(user, item.route))}
                          className="flex items-center justify-between py-4 cursor-pointer hover:bg-slate-50/40 rounded-xl px-2.5 -mx-2.5 transition-all duration-150 group"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-brand-600 transition-colors">
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 group-hover:text-brand-600 transition-colors">{item.label}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                          <FiChevronRight className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all duration-150 w-4 h-4" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Localization */}
          {activeTab === 'localization' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-50 pb-4">Localization Preferences</h3>
                <p className="text-xs text-slate-400 mt-1">Configure language, theme, and time formats for your display profile.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Default Theme</label>
                    <select
                      value={themeMode}
                      onChange={(e) => {
                        setThemeMode(e.target.value);
                        toast.success(`Theme mode modified: ${e.target.value}`);
                      }}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
                    >
                      <option value="light">Light Theme (Default)</option>
                      <option value="dark">Dark Theme Ready</option>
                      <option value="system">Follow System Preferences</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Language / Locale</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
                    >
                      <option value="en-US">English (United States)</option>
                      <option value="en-GB">English (United Kingdom)</option>
                      <option value="es-ES">Spanish (Spain)</option>
                      <option value="de-DE">German (Germany)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">First Day of Week</label>
                  <div className="flex gap-4">
                    {['monday', 'sunday'].map(day => (
                      <label key={day} className={`flex items-center cursor-pointer px-4 py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        weekStart === day 
                          ? 'bg-brand-50 border-brand-200 text-brand-700' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="weekStart"
                          checked={weekStart === day}
                          onChange={() => setWeekStart(day)}
                          className="sr-only"
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/10 transition-all duration-150"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-50 pb-4">Alert Notification Settings</h3>
                <p className="text-xs text-slate-400 mt-1">Control which activities send alerts to your terminal, email inbox or phone SMS.</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notification Channels</h4>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">Email Notifications</span>
                      <span className="text-[10px] text-slate-400">Receive copy summaries for important events</span>
                    </div>
                    <button 
                      onClick={() => handleToggleNotification('email')}
                      className={`h-5 w-9 rounded-full transition-colors relative ${notifications.email ? 'bg-brand-600' : 'bg-slate-200'}`}
                    >
                      <span className={`h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all ${notifications.email ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">Browser Push Notifications</span>
                      <span className="text-[10px] text-slate-400">Real-time alerts directly on your screen dashboard</span>
                    </div>
                    <button 
                      onClick={() => handleToggleNotification('browser')}
                      className={`h-5 w-9 rounded-full transition-colors relative ${notifications.browser ? 'bg-brand-600' : 'bg-slate-200'}`}
                    >
                      <span className={`h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all ${notifications.browser ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">SMS Alerts (Emergency Only)</span>
                      <span className="text-[10px] text-slate-400">Get severe policy changes sent to your verified phone</span>
                    </div>
                    <button 
                      onClick={() => handleToggleNotification('sms')}
                      className={`h-5 w-9 rounded-full transition-colors relative ${notifications.sms ? 'bg-brand-600' : 'bg-slate-200'}`}
                    >
                      <span className={`h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all ${notifications.sms ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>

                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">Module-specific triggers</h4>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">Leave Applications Reviews</span>
                      <span className="text-[10px] text-slate-400">Notify instantly when leaves get submitted or cancelled</span>
                    </div>
                    <button 
                      onClick={() => handleToggleNotification('leaveApprovals')}
                      className={`h-5 w-9 rounded-full transition-colors relative ${notifications.leaveApprovals ? 'bg-brand-600' : 'bg-slate-200'}`}
                    >
                      <span className={`h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all ${notifications.leaveApprovals ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">Attendance Punch Reminders</span>
                      <span className="text-[10px] text-slate-400">Notify when punch intervals or checkout logs are skipped</span>
                    </div>
                    <button 
                      onClick={() => handleToggleNotification('punchReminders')}
                      className={`h-5 w-9 rounded-full transition-colors relative ${notifications.punchReminders ? 'bg-brand-600' : 'bg-slate-200'}`}
                    >
                      <span className={`h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all ${notifications.punchReminders ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Security & Policies */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-50 pb-4">Security Rules & Systems</h3>
                <p className="text-xs text-slate-400 mt-1">Review verified access credentials and compliance audit summaries.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
                  <FiCpu className="text-brand-600 w-5 h-5 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Automatic Access Tokens</span>
                    <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">
                      This HRMS frontend coordinates tokens using Redux Store cookies. If you are sharing computers, please sign out completely to clear session credentials.
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 pt-2">
                  <div className="flex justify-between items-center py-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">Two-Factor Authentication (2FA)</span>
                      <span className="text-[10px] text-slate-400">Enforce extra checks during portal login</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Contact Admin</span>
                  </div>

                  <div className="flex justify-between items-center py-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">Authorized IP Whitelisting</span>
                      <span className="text-[10px] text-slate-400">Limit login routes to approved corporate channels</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                      <FiCheck /> Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsCenter;
