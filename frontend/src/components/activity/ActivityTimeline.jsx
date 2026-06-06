import React from 'react';
import { Clock, FileText, CheckCircle, XCircle, ShoppingCart, Mail } from 'lucide-react';

const getIconForAction = (actionType) => {
  switch (actionType) {
    case 'RFQ_CREATED':
    case 'RFQ_UPDATED':
    case 'RFQ_PUBLISHED':
      return <FileText className="w-5 h-5 text-[#6C63FF]" />;
    case 'VENDOR_INVITED':
      return <Mail className="w-5 h-5 text-[#38B2AC]" />;
    case 'QUOTATION_SUBMITTED':
    case 'QUOTATION_UPDATED':
      return <FileText className="w-5 h-5 text-[#38B2AC]" />;
    case 'APPROVAL_REQUESTED':
      return <Clock className="w-5 h-5 text-[#6C63FF]" />;
    case 'APPROVAL_APPROVED':
      return <CheckCircle className="w-5 h-5 text-[#38B2AC]" />;
    case 'APPROVAL_REJECTED':
      return <XCircle className="w-5 h-5 text-red-400" />;
    case 'PO_GENERATED':
    case 'INVOICE_GENERATED':
      return <ShoppingCart className="w-5 h-5 text-[#6C63FF]" />;
    default:
      return <Clock className="w-5 h-5 text-[#6B7280]" />;
  }
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const ActivityTimeline = ({ activities = [], isLoading }) => {
  if (isLoading) {
    return <div className="p-8 text-center text-[#6B7280]">Loading activities...</div>;
  }

  if (!activities || activities.length === 0) {
    return <div className="p-8 text-center text-[#6B7280]">No recent activities found.</div>;
  }

  return (
    <div className="space-y-0">
      {activities.map((activity) => (
        <div key={activity._id} className="flex gap-4 group min-h-[80px]">
          {/* Timeline icon well */}
          <div className="relative flex flex-col items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E0E5EC] shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] z-10">
              {getIconForAction(activity.actionType)}
            </div>
            {/* The continuous vertical line */}
            <div className="w-[2px] h-full bg-[#A3B1C6]/30 absolute top-10 -z-10 group-last:hidden"></div>
          </div>

          {/* Activity content */}
          <div className="flex-1 pb-8 pt-1">
            <p className="text-[#6B7280] text-sm mb-1">
              {formatDateTime(activity.createdAt)}
            </p>
            <p className="text-[#3D4852] font-bold text-base leading-tight">
              {activity.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
