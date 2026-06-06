import React from 'react';

export const ActivityFilters = ({ filters, setFilters, onSearch }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchClick = () => {
    onSearch(filters);
  };

  return (
    <div className="p-6 rounded-[32px] bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] mb-8 flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
        <label className="text-sm font-bold text-[#3D4852] tracking-tight ml-2">Search</label>
        <input 
          type="text" 
          name="search"
          placeholder="Search activities..."
          value={filters.search || ''}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-2xl bg-[#E0E5EC] shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] outline-none text-[#3D4852] placeholder-[#A0AEC0] focus:shadow-[inset_10px_10px_20px_rgb(163,177,198,0.7),inset_-10px_-10px_20px_rgba(255,255,255,0.6)] focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 focus:ring-offset-[#E0E5EC] transition-all"
        />
      </div>

      <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
        <label className="text-sm font-bold text-[#3D4852] tracking-tight ml-2">Action Type</label>
        <select 
          name="actionType"
          value={filters.actionType || ''}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-2xl bg-[#E0E5EC] shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] outline-none text-[#3D4852] focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 focus:ring-offset-[#E0E5EC] appearance-none"
        >
          <option value="">All Actions</option>
          <option value="RFQ_CREATED">RFQ Created</option>
          <option value="QUOTATION_SUBMITTED">Quotation Submitted</option>
          <option value="APPROVAL_APPROVED">Approval Approved</option>
          <option value="PO_GENERATED">PO Generated</option>
        </select>
      </div>
      
      <button 
        onClick={handleSearchClick}
        className="px-8 py-3 rounded-2xl bg-[#6C63FF] text-white font-medium shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:translate-y-[-1px] hover:shadow-[8px_8px_15px_rgb(163,177,198,0.7),-8px_-8px_15px_rgba(255,255,255,0.6)] active:translate-y-[1px] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2)] transition-all duration-300"
      >
        Filter
      </button>
    </div>
  );
};
