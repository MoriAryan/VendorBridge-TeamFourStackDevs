import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000");
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` });

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${BASE}/api/v1/activity-logs/recent`, { headers: authH() });
        const json = await res.json();
        if (json.success) {
          const acts = json.data || [];
          setNotifications(acts);
          // For demo purposes, let's treat any activity in the last 24h as unread
          const unreadCount = acts.filter(a => new Date() - new Date(a.createdAt) < 86400000).length;
          setUnread(unreadCount);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    fetchNotifications();
    
    // Poll every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    setOpen(false);
    // Determine route
    if (notif.entityType === 'Approval') navigate(`/approvals`);
    else if (notif.entityType === 'PurchaseOrder') navigate(`/purchase-orders`);
    else if (notif.entityType === 'Invoice') navigate(`/invoices`);
    else if (notif.entityType === 'RFQ') navigate(`/rfqs`);
    else navigate(`/activity`);
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", zIndex: 1000 }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent", border: "none", cursor: "pointer", 
          fontSize: "1.2rem", position: "relative", padding: "8px"
        }}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute", top: "2px", right: "2px",
            background: "var(--danger)", color: "#fff",
            fontSize: "0.6rem", fontWeight: "bold",
            padding: "2px 6px", borderRadius: "999px",
            boxShadow: "0 0 0 2px var(--bg)"
          }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", bottom: "40px", left: "0", width: "320px",
          background: "var(--bg)", borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-extruded)", border: "1px solid rgba(163,177,198,0.2)",
          overflow: "hidden", display: "flex", flexDirection: "column"
        }}>
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid rgba(163,177,198,0.2)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <strong style={{ fontSize: "0.9rem", color: "var(--fg)" }}>Notifications</strong>
            <button onClick={() => setUnread(0)} style={{
              background: "none", border: "none", fontSize: "0.75rem", color: "var(--accent)", cursor: "pointer"
            }}>Mark all read</button>
          </div>
          
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
                No recent notifications
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div 
                  key={notif._id || idx}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: "12px 16px", borderBottom: "1px solid rgba(163,177,198,0.1)",
                    cursor: "pointer", transition: "background 0.2s",
                    display: "flex", gap: "12px", alignItems: "flex-start"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(108,99,255,0.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%", marginTop: "6px",
                    background: new Date() - new Date(notif.createdAt) < 86400000 ? "var(--accent)" : "transparent"
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "var(--fg)", lineHeight: "1.3" }}>
                      {notif.action}
                    </p>
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                      {new Date(notif.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div style={{ padding: "8px", borderTop: "1px solid rgba(163,177,198,0.2)", textAlign: "center" }}>
            <button 
              onClick={() => { setOpen(false); navigate('/activity'); }}
              style={{ background: "none", border: "none", fontSize: "0.8rem", color: "var(--muted)", cursor: "pointer", fontWeight: "600" }}
            >
              View All Activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
