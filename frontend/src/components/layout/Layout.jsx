import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-[#E0E5EC] font-sans">
      <Sidebar />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
};
