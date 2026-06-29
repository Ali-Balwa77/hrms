import React, { useEffect, useState } from 'react';
import { api } from "../services/api.js";
import { FiUser, FiMail, FiPhone, FiCalendar, FiBriefcase, FiFileText, FiAward, FiDownload, FiCheckCircle } from "react-icons/fi";
import Loader from "../components/common/Loader";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/profile", {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });
      setUser(res.data?.data || res.data || null);
    } catch (err) {
      console.error('Request failed:', err);
      } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  if (loading && !user) return <Loader />;
  if (!user) return <div className="p-8 text-center text-slate-500 font-medium">Failed to load profile record</div>;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {loading && <Loader />}
      
      {/* Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand-600 to-indigo-500 relative" />
        <div className="px-6 pb-6 relative flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
          <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center font-display font-extrabold text-3xl text-brand-600 bg-brand-50 relative z-10">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0 pb-1.5">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{user.name}</h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {user.role?.name || "Staff Member"} • {user.department || "Corporate"}
            </p>
          </div>
          
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-brand-50 text-brand-600 border border-brand-100/50 rounded-xl text-xs font-semibold">
              Joined {formatDate(user.joinDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-1 flex gap-1 max-w-md">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all duration-200 ${activeTab === "info" ? "bg-brand-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
        >
          Personal Info
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all duration-200 ${activeTab === "documents" ? "bg-brand-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
        >
          Identity Docs
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all duration-200 ${activeTab === "history" ? "bg-brand-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
        >
          Company Milestones
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft min-h-[300px]">
        {activeTab === "info" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Primary Contact Details</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Your official registry credentials and communications channel.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm divide-y md:divide-y-0 divide-slate-100">
              <div className="flex justify-between py-2.5 border-b border-slate-100/40">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-slate-300" />
                  Full Name
                </span>
                <span className="text-slate-700 font-semibold">{user.name}</span>
              </div>
              
              <div className="flex justify-between py-2.5 border-b border-slate-100/40">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <FiMail className="w-4 h-4 text-slate-300" />
                  Official Email
                </span>
                <span className="text-brand-600 font-semibold">{user.email}</span>
              </div>

              <div className="flex justify-between py-2.5 border-b border-slate-100/40">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <FiPhone className="w-4 h-4 text-slate-300" />
                  Phone Number
                </span>
                <span className="text-slate-700 font-semibold">{user.phone || 'N/A'}</span>
              </div>

              <div className="flex justify-between py-2.5 border-b border-slate-100/40">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <FiBriefcase className="w-4 h-4 text-slate-300" />
                  Department
                </span>
                <span className="text-slate-700 font-semibold">{user.department || 'Other'}</span>
              </div>

              <div className="flex justify-between py-2.5 border-b border-slate-100/40">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <FiAward className="w-4 h-4 text-slate-300" />
                  Access Level
                </span>
                <span className="text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-md text-xs">{user.role?.name || 'Staff'}</span>
              </div>

              <div className="flex justify-between py-2.5 border-b border-slate-100/40">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <FiCalendar className="w-4 h-4 text-slate-300" />
                  Join Date
                </span>
                <span className="text-slate-700 font-semibold">{formatDate(user.joinDate)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Corporate Documents Folder</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Access and download verified identity and employment credentials.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "National Identity Proof", size: "1.4 MB", type: "PDF Document" },
                { title: "Corporate Offer Letter", size: "820 KB", type: "PDF Document" },
                { title: "Highest Academic Degree", size: "2.1 MB", type: "Image / JPEG" },
                { title: "Verified Address Credentials", size: "450 KB", type: "PDF Document" }
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-brand-100 hover:bg-brand-50/10 transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 flex items-center justify-center transition-colors">
                      <FiFileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{doc.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{doc.type} • {doc.size}</p>
                    </div>
                  </div>
                  <button type="button" className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                    <FiDownload className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Your Milestones Timeline</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Corporate growth benchmarks and history milestones.</p>
            </div>

            <div className="relative pl-6 border-l border-slate-100 space-y-6 ml-2.5 pt-2">
              {[
                { title: "Corporate Onboarding Completed", date: formatDate(user.joinDate), desc: "Registered and assigned key resource profiles." },
                { title: "Security Protocols Clearance", date: formatDate(user.joinDate), desc: "Account security access keys initialized." },
                { title: "Probation Period Evaluation Completed", date: "Passed successfully", desc: "Recognized as a permanent core team asset." }
              ].map((milestone, idx) => (
                <div key={idx} className="relative group">
                  {/* Indicator bullet */}
                  <span className="absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full border-2 border-white bg-brand-600 shadow-sm flex items-center justify-center text-[10px] text-white">
                    <FiCheckCircle className="w-2.5 h-2.5" />
                  </span>
                  
                  <div>
                    <span className="text-[9px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{milestone.date}</span>
                    <h4 className="text-xs font-bold text-slate-800 mt-1.5">{milestone.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{milestone.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
