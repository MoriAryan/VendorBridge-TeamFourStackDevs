import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Vendors', path: '/vendors' },
  { name: 'RFQ\'s', path: '/rfqs' },
  { name: 'Quotations', path: '/quotations' },
  { name: 'Approvals', path: '/approvals' },
  { name: 'Purchase orders', path: '/purchase-orders' },
  { name: 'Invoices', path: '/invoices' },
  { name: 'Reports', path: '/reports' },
  { name: 'Activity', path: '/activity' },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 min-h-screen bg-[#E0E5EC] border-r border-[#A3B1C6]/30 shadow-[9px_0_16px_rgb(163,177,198,0.3)] flex flex-col pt-8 pb-8">
      <div className="px-8 mb-12">
        <h2 className="text-2xl font-extrabold text-[#3D4852] tracking-tight">VendorBridge</h2>
      </div>
      <nav className="flex-1 flex flex-col gap-2 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${
                isActive 
                  ? 'bg-[#E0E5EC] text-[#3D4852] shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)]'
                  : 'text-[#6B7280] hover:bg-[#E0E5EC] hover:text-[#3D4852] hover:shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]'
              }`
            }
          >
            - {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
