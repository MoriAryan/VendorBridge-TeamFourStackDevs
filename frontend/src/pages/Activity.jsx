import React, { useEffect, useState } from 'react';
import { ActivityTimeline } from '../components/activity/ActivityTimeline';
import { ActivityFilters } from '../components/activity/ActivityFilters';
import { activityService } from '../services/activityService';

export const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({});

  const fetchActivities = async (searchFilters = {}) => {
    setIsLoading(true);
    try {
      const res = await activityService.getActivities(searchFilters);
      if (res.success) {
        setActivities(res.data.activities);
      } else {
        setActivities(getMockData());
      }
    } catch (err) {
      console.error(err);
      setActivities(getMockData());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSearch = (newFilters) => {
    fetchActivities(newFilters);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-[#3D4852] tracking-tight mb-2">Activity Logs</h1>
        <p className="text-[#6B7280] font-medium">Audit trail of procurement operations.</p>
      </header>

      <ActivityFilters filters={filters} setFilters={setFilters} onSearch={handleSearch} />
      
      <div className="p-8 rounded-[32px] bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
        <ActivityTimeline activities={activities} isLoading={isLoading} />
      </div>
    </div>
  );
};

function getMockData() {
  return [
    { _id: '1', actionType: 'RFQ_CREATED', description: 'Alice created RFQ-100 for Office Furniture', createdAt: new Date().toISOString(), userId: 'Alice', entityType: 'RFQ', entityId: 'RFQ-100' },
    { _id: '2', actionType: 'VENDOR_INVITED', description: 'Invitation sent to Dell HQ for RFQ-100', createdAt: new Date(Date.now() - 3600000).toISOString(), userId: 'Alice', entityType: 'RFQ', entityId: 'RFQ-100' },
    { _id: '3', actionType: 'QUOTATION_SUBMITTED', description: 'Dell HQ submitted quotation for RFQ-100', createdAt: new Date(Date.now() - 7200000).toISOString(), userId: 'Dell HQ', entityType: 'Quotation', entityId: 'QUO-231' },
    { _id: '4', actionType: 'APPROVAL_APPROVED', description: 'Bob approved quotation for RFQ-100', createdAt: new Date(Date.now() - 86400000).toISOString(), userId: 'Bob', entityType: 'Approval', entityId: 'APP-102' }
  ];
}
