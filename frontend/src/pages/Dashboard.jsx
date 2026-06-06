import React from 'react';

export const Dashboard = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <header>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#3D4852] tracking-tight mb-2">
          Dashboard
        </h1>
        <p className="text-[#6B7280] font-medium">Welcome back, Procurement Officer - Today's Overview</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <KpiCard value="12" label="Active RFQ's" />
         <KpiCard value="5" label="Pending Approvals" />
         <KpiCard value="$ 2.3L" label="PO's this month" />
         <KpiCard value="3" label="Overdue Invoices" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-8">
           <div className="p-8 rounded-[32px] bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
              <h2 className="text-2xl font-bold text-[#3D4852] mb-6">Recent Purchase Orders</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#A3B1C6]/30 text-[#6B7280]">
                      <th className="pb-4 font-bold">PO#</th>
                      <th className="pb-4 font-bold">Vendor</th>
                      <th className="pb-4 font-bold">Amount</th>
                      <th className="pb-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#A3B1C6]/20">
                      <td className="py-4 text-[#3D4852] font-medium">Po1</td>
                      <td className="py-4 text-[#6B7280]">Infra</td>
                      <td className="py-4 text-[#6B7280]">87000</td>
                      <td className="py-4 text-[#38B2AC] font-medium">Approved</td>
                    </tr>
                    <tr className="border-b border-[#A3B1C6]/20">
                      <td className="py-4 text-[#3D4852] font-medium">Po2</td>
                      <td className="py-4 text-[#6B7280]">Tech core</td>
                      <td className="py-4 text-[#6B7280]">140000</td>
                      <td className="py-4 text-[#6C63FF] font-medium">Pending</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-[#3D4852] font-medium">Po3</td>
                      <td className="py-4 text-[#6B7280]">OfficeNeed Co</td>
                      <td className="py-4 text-[#6B7280]">34900</td>
                      <td className="py-4 text-[#6B7280] font-medium">draft</td>
                    </tr>
                  </tbody>
                </table>
              </div>
           </div>

           {/* Quick Actions */}
           <div className="flex flex-wrap gap-6 pt-6 border-t border-[#A3B1C6]/30">
              <ActionButton label="+ new RFQ" />
              <ActionButton label="Add Vendor" />
              <ActionButton label="view Invoices" />
           </div>
        </div>

        {/* Right Sidebar - Trends */}
        <div className="lg:col-span-1">
           <h2 className="text-lg font-bold text-[#3D4852] mb-4 text-center">Spending Trends last 6 months</h2>
          <div className="p-8 rounded-[32px] bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] h-64 flex items-center justify-center">
             <div className="text-center text-[#6B7280]">
                [ Chart Placeholder ]
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function KpiCard({ value, label }) {
  return (
    <div className="p-6 rounded-[32px] bg-[#E0E5EC] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] flex flex-col items-center justify-center text-center">
      <div className="text-4xl font-extrabold text-[#3D4852] mb-2">{value}</div>
      <div className="text-[#6B7280] text-sm font-medium">{label}</div>
    </div>
  )
}

function ActionButton({ label }) {
  return (
    <button className="px-8 py-3 rounded-2xl bg-[#E0E5EC] text-[#3D4852] font-bold shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:translate-y-[-1px] hover:shadow-[8px_8px_15px_rgb(163,177,198,0.7),-8px_-8px_15px_rgba(255,255,255,0.6)] active:translate-y-[1px] active:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] transition-all duration-300">
      {label}
    </button>
  )
}
