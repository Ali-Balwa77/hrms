import React from 'react';
const Loader = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent pointer-events-none">
    <div className="relative h-16 w-16">
      <div className="absolute inset-0 rounded-full border-[5px] border-slate-200" />
      <div className="absolute inset-0 rounded-full border-[5px] border-transparent border-t-brand-600 border-l-brand-600 animate-spin" />
      <div className="absolute inset-1 rounded-full border-[3px] border-transparent border-b-brand-400 border-r-brand-400 animate-[spin_1.4s_linear_infinite_reverse]" />
    </div>
  </div>
);

export default Loader;