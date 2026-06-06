import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: '⊞', path: '/'            },
  { id: 'vendors',    label: 'Vendors',    icon: '◈', path: '/vendors'      },
  { id: 'rfqs',       label: "RFQ's",      icon: '≋', path: '/rfqs'         },
  { id: 'quotations', label: 'Quotations', icon: '◉', path: '/quotations'   },
  { id: 'approvals',  label: 'Approvals',  icon: '✦', path: '/approvals'    },
  { id: 'invoices',   label: 'Invoices',   icon: '⊟', path: '/invoices'     },
  { id: 'reports',    label: 'Reports',    icon: '⊠', path: '/reports'      },
  { id: 'activity',   label: 'Activity',   icon: '⊕', path: '/activity'     },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item) => {
    if (item.path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__badge">VB</div>
        <div>
          <span className="sidebar__name">VendorBridge</span>
          <span className="sidebar__tagline">Procurement ERP</span>
        </div>
      </div>
      <p className="sidebar__section-label">Main Menu</p>
      <nav>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.id}
              className={`sidebar__item${active ? ' sidebar__item--active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
            >
              <span className="sidebar__icon">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="sidebar__divider" />
    </aside>
  );
}
