import React, { Suspense } from 'react';
import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Loader from "../components/common/Loader";

export default function DashboardLayout() {
  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      <Navbar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Suspense fallback={<Loader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
