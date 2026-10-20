
import { useEffect, useState } from "react";
import "./AdminNotifications.css";
import "./AdminUsers.css";
import {
  Bell,
  Inbox,
  Search,
  UserPlus,
  FolderPlus,
  ShieldAlert,
  ShieldCheck,
  Flag,
  Headphones,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const getActivityIcon = (type) => {
  switch (type) {
    case "registration":
      return UserPlus;
    case "project":
      return FolderPlus;
    case "report":
      return Flag;
    case "support":
      return Headphones;
    case "suspended":
    case "blocked":
      return ShieldAlert;
    case "reactivated":
      return ShieldCheck;
    default:
      return Bell;
  }
};

const formatDate = (date) => {
  if (!date) return "Unknown date";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function AdminNotifications() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
const [selectedUser, setSelectedUser] = useState(null);

const [search, setSearch] = useState("");
const [activeFilter, setActiveFilter] = useState("all");

const notificationFilters = [
  { label: "All", value: "all" },
  { label: "Registrations", value: "registration" },
  { label: "Projects", value: "project" },
  { label: "Reports", value: "report" },
  { label: "Account Actions", value: "account" },
  { label: "Support", value: "support" },
];

const filteredActivities = activities.filter((activity) => {
  const query = search.trim().toLowerCase();

  const matchesSearch =
    String(activity.username || "").toLowerCase().includes(query) ||
    String(activity.title || "").toLowerCase().includes(query) ||
    String(activity.description || "").toLowerCase().includes(query);

  const matchesFilter =
    activeFilter === "all" ||
    (activeFilter === "account"
      ? ["suspended", "blocked", "reactivated"].includes(activity.type)
      : activity.type === activeFilter);

  return matchesSearch && matchesFilter;
});

const getNotificationGroup = (date) => {
  const activityDate = new Date(date);

  if (Number.isNaN(activityDate.getTime())) {
    return "Earlier";
  }

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (first, second) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  if (isSameDay(activityDate, today)) {
    return "Today";
  }

  if (isSameDay(activityDate, yesterday)) {
    return "Yesterday";
  }

  return "Earlier";
};

const groupedActivities = [
  "Today",
  "Yesterday",
  "Earlier",
].map((label) => ({
  label,
  items: filteredActivities.filter(
    (activity) =>
      getNotificationGroup(activity.createdAt) === label
  ),
}));



const openStudentProfile = async (activity) => {
  if (!activity.username) return;

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load student profile.");
    }

    const data = await response.json();

    const student = (data.users || []).find(
      (user) =>
        user.username?.toLowerCase() ===
        activity.username.toLowerCase()
    );

    if (!student) {
      alert("Student profile not found.");
      return;
    }

    setSelectedUser(student);
  } catch (error) {
    alert(error.message || "Failed to load student profile.");
  }
};



  const fetchNotifications = async (signal) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Admin session not found. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/notifications`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load notifications (${response.status}).`
        );
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.activities)) {
        throw new Error("Invalid notifications response.");
      }

      if (!signal?.aborted) {
        setActivities(data.activities);
      }
    } catch (err) {
      if (err.name === "AbortError") return;

      if (!signal?.aborted) {
        setError(err.message || "Failed to load notifications.");
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    fetchNotifications(controller.signal);

    return () => controller.abort();
  }, []);

  return (
    <div className="admin-notifications-page">
      <div className="admin-notifications-heading">
        <div>
          <h2>Admin Notifications</h2>
          <p>
            Monitor important platform activities, reports,
            and administrative updates.
          </p>
        </div>
      </div>

      <div
        className="admin-panel"
        style={{
          marginTop: "24px",
          padding: "28px",
          minHeight: "320px",
        }}
      >
        <div
          className="admin-panel-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <h3>
            <Bell
              size={19}
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                marginRight: "10px",
                color: "#d7b4d2",
              }}
            />
            Notifications
          </h3>

          <button
            type="button"
            onClick={() => fetchNotifications()}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 14px",
              borderRadius: "8px",
              border: "1px solid #886983",
              background: "#684c65",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "13px",
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

{/* SEARCH AND FILTER NOTIFICATIONS */}
<div
  style={{
    marginTop: "22px",
    marginBottom: "18px",
  }}
>
  {/* SEARCH BAR */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "12px 15px",
      background: "#24182e",
      border: "1px solid #684c65",
      borderRadius: "10px",
      marginBottom: "16px",
    }}
  >
    <Search size={18} color="#b58aaa" />

    <input
      type="text"
      placeholder="Search notifications by username, title, or description..."
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      style={{
        flex: 1,
        minWidth: 0,
        background: "transparent",
        border: "none",
        outline: "none",
        color: "#ffffff",
        fontSize: "13px",
      }}
    />
  </div>

  {/* FILTER TABS */}
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "9px",
    }}
  >
    {notificationFilters.map((filter) => (
      <button
        key={filter.value}
        type="button"
        onClick={() => setActiveFilter(filter.value)}
        style={{
          padding: "9px 15px",
          borderRadius: "20px",
          border:
            activeFilter === filter.value
              ? "1px solid #b58aaa"
              : "1px solid #684c65",
          background:
            activeFilter === filter.value
              ? "#785575"
              : "#24182e",
          color:
            activeFilter === filter.value
              ? "#ffffff"
              : "#cbb2c9",
          fontSize: "12px",
          fontWeight: activeFilter === filter.value ? 600 : 400,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        {filter.label}
      </button>
    ))}
  </div>
</div>

        {loading ? (
          <div
            className="admin-empty-state"
            style={{
              padding: "70px 20px",
              textAlign: "center",
            }}
          >
            <RefreshCw size={32} color="#d7b4d2" />
            <p style={{ marginTop: "15px" }}>
              Loading notifications...
            </p>
          </div>
        ) : error ? (
          <div
            className="admin-empty-state"
            style={{
              padding: "70px 20px",
              textAlign: "center",
            }}
          >
            <AlertCircle size={36} color="#d7b4d2" />
            <h3 style={{ marginTop: "15px" }}>
              Unable to load notifications
            </h3>
            <p>{error}</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div
            className="admin-empty-state"
            style={{
              minHeight: "220px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Inbox size={42} color="#a783a0" />
            
<h3 style={{ marginTop: "15px" }}>
  {activities.length === 0
    ? "No notifications yet"
    : "No matching notifications"}
</h3>
<p>
  {activities.length === 0
    ? "Platform activities will appear here when available."
    : "Try another search or select a different filter."}
</p>

          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            {groupedActivities
  .filter((group) => group.items.length > 0)
  .map((group) => (
    <div key={group.label} style={{ marginBottom: "22px" }}>
      <h4
        style={{
          color: "#d7b4d2",
          fontSize: "13px",
          fontWeight: 700,
          margin: "0 0 14px",
          paddingBottom: "10px",
          borderBottom: "1px solid rgba(181, 138, 170, 0.25)",
        }}
      >
        {group.label}
      </h4>

      {group.items.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);

              
return (
  <div
    key={activity.id}
    className="admin-notification-card"
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "15px",
      padding: "18px",
      marginBottom: "12px",
      background: "rgba(104, 76, 101, 0.13)",
      border: "1px solid rgba(181, 138, 170, 0.22)",
      borderRadius: "12px",
      transition: "all 0.2s ease",
    }}
  >

                  
<button
  type="button"
  onClick={() => openStudentProfile(activity)}
  disabled={!activity.username}
  title={
    activity.username
      ? `View ${activity.username}'s profile`
      : "Profile unavailable"
  }
  style={{
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#684c6540",
    color: "#d7b4d2",
    border: "none",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    cursor: activity.username ? "pointer" : "default",
    overflow: "hidden",
  }}
>

                    
{activity.username ? (
  <img
   
src={
  activity.profileImage ||
  `https://api.dicebear.com/9.x/${
    activity.avatarStyle &&
    activity.avatarStyle !== "default"
      ? activity.avatarStyle
      : "avataaars"
  }/svg?seed=${encodeURIComponent(
    activity.userId ||
    activity.targetUserId ||
    activity.username ||
    "User"
  )}`
}

    alt={`${activity.username}'s profile`}
    onError={(e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src =
        `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
          activity.username
        )}`;
    }}
    style={{
      width: "42px",
      height: "42px",
      borderRadius: "12px",
      objectFit: "cover",
    }}
  />

) : (
  <ActivityIcon size={20} />
)}

</button>


                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        margin: "0 0 6px",
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    >
                      {activity.title}
                    </h4>

                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: "13px",
                        lineHeight: 1.6,
                        opacity: 0.85,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {activity.description}
                    </p>

                    {activity.reason && (
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: "12px",
                          opacity: 0.8,
                          overflowWrap: "anywhere",
                        }}
                      >
                        <strong>Reason:</strong> {activity.reason}
                      </p>
                    )}

                    <span
                      style={{
                        fontSize: "12px",
                        opacity: 0.65,
                      }}
                    >
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                
                </div>
              );
            })}
    </div>
  ))}
          </div>

        )}
     
      </div>

      {selectedUser && (
        <div
          className="admin-user-modal-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="admin-user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-notification-user-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-user-modal-header">
              <h2 id="admin-notification-user-title">
                User Details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close user details"
              >
                ✕
              </button>
            </div>

            <div className="admin-user-modal-profile">
              <img
                src={
  selectedUser.profileImage ||
  `https://api.dicebear.com/9.x/${
    selectedUser.avatarStyle &&
    selectedUser.avatarStyle !== "default"
      ? selectedUser.avatarStyle
      : "avataaars"
  }/svg?seed=${encodeURIComponent(
    selectedUser._id ||
    selectedUser.id ||
    selectedUser.username ||
    "User"
  )}`
}
                alt="Student avatar"
              />
              <h3>{selectedUser.username || "Student"}</h3>
              <span>Student Account</span>
            </div>

            <div className="admin-user-modal-info">
              <div>
                <strong>Username</strong>
                <p>{selectedUser.username || "Not provided"}</p>
              </div>

              <div>
                <strong>Email Address</strong>
                <p>{selectedUser.email || "Not provided"}</p>
              </div>

              <div>
                <strong>Role</strong>
                <p>{selectedUser.role || "student"}</p>
              </div>

              <div>
                <strong>Account Status</strong>
                <p style={{ textTransform: "capitalize" }}>
                  {selectedUser.accountStatus || "active"}
                </p>
              </div>

              {(selectedUser.accountStatus === "suspended" ||
                selectedUser.accountStatus === "blocked") && (
                <div>
                  <strong>Restriction Reason</strong>
                  <p>
                    {selectedUser.accountRestrictionReason ||
                      "No reason recorded"}
                  </p>
                </div>
              )}

              <div>
                <strong>Date Joined</strong>
                <p>{formatDate(selectedUser.createdAt)}</p>
              </div>

              <div>
                <strong>Hobbies</strong>
                <p>
                  {Array.isArray(selectedUser.hobbies) &&
                  selectedUser.hobbies.length > 0
                    ? selectedUser.hobbies.join(", ")
                    : "No hobbies selected"}
                </p>
              </div>
            </div>

            <div className="admin-user-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;
