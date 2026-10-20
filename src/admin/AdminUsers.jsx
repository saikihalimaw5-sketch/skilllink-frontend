
import { useEffect, useMemo, useState } from "react";


import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Users,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import "./AdminUsers.css";

const getAvatar = (user) =>
  user?.profileImage ||
  `https://api.dicebear.com/9.x/${
    user?.avatarStyle && user.avatarStyle !== "default"
      ? user.avatarStyle
      : "avataaars"
  }/svg?seed=${encodeURIComponent(
    user?._id ||
    user?.id ||
    user?.username ||
    "User"
  )}`;

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [restrictionReason, setRestrictionReason] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const API_URL =
          import.meta.env.VITE_API_BASE_URL ||
          import.meta.env.VITE_API_URL ||
          "http://localhost:5000";

        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/api/admin/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to retrieve registered students."
          );
        }

        const data = await response.json();

        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => controller.abort();
  }, []);

  
const filteredUsers = useMemo(() => {
  const query = search.trim().toLowerCase();

  return users
    .filter((user) => {
      const username = String(user.username || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();

      // Search by username or email
      const matchesSearch =
        username.includes(query) || email.includes(query);

      // Filter by account status
      const status = user.accountStatus || "active";

      const matchesTab =
        activeTab === "all" || status === activeTab;

      // Filter by date joined
      let matchesDate = true;

      if (dateFilter !== "all") {
        const joinedDate = new Date(user.createdAt);
        const today = new Date();

        const days = Number(dateFilter);

        const cutoffDate = new Date(today);
        cutoffDate.setDate(today.getDate() - days);

        matchesDate =
          !Number.isNaN(joinedDate.getTime()) &&
          joinedDate >= cutoffDate &&
          joinedDate <= today;
      }

      return matchesSearch && matchesTab && matchesDate;
    })
    .sort((a, b) => {
      const first = new Date(a.createdAt || 0).getTime();
      const second = new Date(b.createdAt || 0).getTime();

      return sortOrder === "newest"
        ? second - first
        : first - second;
    });
}, [users, search, sortOrder, activeTab, dateFilter]);

const updateUserStatus = async (userId, status, reason = "") => {


  try {
    setUpdatingUserId(userId);
    setActionError("");

    const API_URL =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000";

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/admin/users/${userId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
       body: JSON.stringify({ status, reason }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to update account status."
      );
    }

    setUsers((previousUsers) =>
  previousUsers.map((user) =>
    user._id === userId
      ? {
          ...user,
          accountStatus: data.user.accountStatus,
          accountRestrictionReason:
            data.user.accountRestrictionReason || "",
        }
      : user
  )
);

              setSelectedUser((previousUser) =>
            previousUser?._id === userId
              ? {
                  ...previousUser,
                  accountStatus: data.user.accountStatus,
                  accountRestrictionReason:
                    data.user.accountRestrictionReason || "",
                }
              : previousUser
          );

      return true;
  } catch (err) {
    setActionError(err.message);

    return false;
  } finally {
    setUpdatingUserId(null);
  }
};
  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? "—"
      : parsed.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-heading">
        <div>
          <h2>User Management</h2>
          <p>
            View and manage registered SkillLink students.
          </p>
        </div>

        <div className="admin-users-count">
          <Users size={18} />
          <span>{users.length} Registered Students</span>
        </div>
      </div>

      
        <div className="admin-users-tabs">
        {[
            { label: "All Users", value: "all" },
            { label: "Active", value: "active" },
            { label: "Suspended", value: "suspended" },
            { label: "Blocked", value: "blocked" },
        ].map((tab) => (
            <button
            key={tab.value}
            type="button"
            className={activeTab === tab.value ? "active" : ""}
            onClick={() => setActiveTab(tab.value)}
            >
            {tab.label}
            </button>
        ))}
        </div>


      <div className="admin-users-toolbar">
        <div className="admin-users-search">
          <Search size={19} />

          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="admin-users-filter-wrapper">
        <button
          type="button"
          className={`admin-users-filter ${
            dateFilter !== "all" ? "filter-active" : ""
          }`}
          onClick={() => setShowDateFilter((prev) => !prev)}
          aria-expanded={showDateFilter}
        >
          <SlidersHorizontal size={17} />
          Filter
        </button>

        {showDateFilter && (
          <div className="admin-users-filter-dropdown">
            <h4>Filter by Date Joined</h4>

            {[
              { label: "All Dates", value: "all" },
              { label: "Last 7 Days", value: "7" },
              { label: "Last 30 Days", value: "30" },
              { label: "Last 90 Days", value: "90" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  dateFilter === option.value
                    ? "date-filter-selected"
                    : ""
                }
                onClick={() => {
                  setDateFilter(option.value);
                  setShowDateFilter(false);
                }}
              >
                <span>{option.label}</span>
                {dateFilter === option.value && <span>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

        <div className="admin-users-sort">
          <ArrowUpDown size={17} />

          <select
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value)
            }
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="admin-users-table-wrapper">
        {loading ? (
          <div className="admin-users-message">
            <RefreshCw size={25} />
            <p>Loading registered students...</p>
          </div>
        ) : error ? (
          <div className="admin-users-message">
            <p>{error}</p>
          </div>
        ) : (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-users-message">
                      No students found.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const username =
                    user.username ||
                    user.email?.split("@")[0] ||
                    "Student";

                  const avatar = getAvatar(user);

                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="admin-users-person">
                          <img
                            src={avatar}
                            alt=""
                            className="admin-users-avatar"
                          />

                          <strong>{username}</strong>
                        </div>
                      </td>

                      <td>{user.email || "—"}</td>

                      <td>
                        <span className="admin-users-role">
                          {user.role || "student"}
                        </span>
                      </td>

                      <td>
                        
                        <span
                        className={`admin-users-status-pending admin-users-status-${
                            user.accountStatus || "active"
                        }`}
                        style={{ textTransform: "capitalize" }}
                        >
                        {user.accountStatus || "active"}
                        </span>

                      </td>

                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <button
                            type="button"
                            className="admin-users-view-btn"
                            onClick={() => setSelectedUser(user)}
                        >
                            View Details
                        </button>
                        </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      
      <div className="admin-users-footer">
        <span>
          Showing {filteredUsers.length} of {users.length} students
        </span>
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
            aria-labelledby="admin-user-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-user-modal-header">
              <h2 id="admin-user-details-title">
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
                src={getAvatar(selectedUser)}
                alt="Student avatar"
              />

              <h3>
                {selectedUser.username || "Student"}
              </h3>

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
                <p>{selectedUser.role || "Not provided"}</p>
              </div>

              <div>                
                    <strong>Account Status</strong>
                    <p style={{ textTransform: "capitalize" }}>
                    {selectedUser.accountStatus || "active"}
                    </p>

                      </div>
                  {/* Display reason for suspended or blocked accounts */}
                  {(selectedUser.accountStatus === "suspended" ||
                    selectedUser.accountStatus === "blocked") && (
                    <div>
                      <strong>
                        {selectedUser.accountStatus === "suspended"
                          ? "Suspension Reason"
                          : "Blocking Reason"}
                      </strong>

                      <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
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
            {(selectedUser.accountStatus || "active") !== "active" && (
                <button
                type="button"
                disabled={updatingUserId === selectedUser._id}
                onClick={() =>
                setConfirmAction({
                  userId: selectedUser._id,
                  username: selectedUser.username,
                  status: "active",
                })
              }
                              >
                Activate
                </button>
            )}

            {(selectedUser.accountStatus || "active") !== "suspended" && (
                <button
                type="button"
                disabled={updatingUserId === selectedUser._id}
                onClick={() =>
                setConfirmAction({
                  userId: selectedUser._id,
                  username: selectedUser.username,
                  status: "suspended",
                })
              }
                >
                Suspend
                </button>
            )}

            {(selectedUser.accountStatus || "active") !== "blocked" && (
                <button
                type="button"
                disabled={updatingUserId === selectedUser._id}
                onClick={() =>
                setConfirmAction({
                  userId: selectedUser._id,
                  username: selectedUser.username,
                  status: "blocked",
                })
              }
                >
                Block
                </button>
            )}

            <button
                type="button"
                disabled={updatingUserId === selectedUser._id}
                onClick={() => setSelectedUser(null)}
            >
                Close
            </button>
            </div>
          </div>
        </div>
      )}
            {confirmAction && (
        <div className="admin-confirm-overlay">
          <div
            className="admin-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
          >
            <button
            type="button"
            className="admin-confirm-close"
            disabled={updatingUserId !== null}
            onClick={() => {
            setConfirmAction(null);
            setRestrictionReason("");
            setActionError("");
          }}
            aria-label="Close confirmation"
          >
            ×
          </button>

            <div className="admin-confirm-icon">
              <AlertTriangle size={28} />
            </div>

            <h2 id="admin-confirm-title">
              Confirm Account Action
            </h2>

            <p className="admin-confirm-message">
              Are you sure you want to{" "}
              <strong>
                {confirmAction.status === "active"
                  ? "activate"
                  : confirmAction.status === "suspended"
                  ? "suspend"
                  : "block"}
              </strong>{" "}
              <b>{confirmAction.username || "this student"}</b>'s account?
            </p>

            <p className="admin-confirm-description">
              {confirmAction.status === "active"
                ? "This student will regain access to their SkillLink account."
                : "This student will not be able to log in or access their SkillLink account until reactivated."}
            </p>
                        {/* Select a reason for Suspend or Block */}
              {confirmAction.status !== "active" && (
                <div className="admin-confirm-reason">
                  <label>
                    Reason for{" "}
                    {confirmAction.status === "suspended"
                      ? "Suspension"
                      : "Blocking"}
                    <span style={{ color: "#fca5a5" }}> *</span>
                  </label>

                  <div className="admin-reason-options">
                    {[
                      "Breaking platform rules",
                      "Rude or disrespectful behavior",
                      "Sending spam or fake messages",
                      "Using SkillLink improperly",
                      "Reported by other users",                     
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        className={`admin-reason-option ${
                          restrictionReason === reason ? "selected" : ""
                        }`}
                        onClick={() => setRestrictionReason(reason)}
                        disabled={updatingUserId !== null}
                        aria-pressed={restrictionReason === reason}
                      >
                        <span className="admin-reason-radio">
                          {restrictionReason === reason && (
                            <span className="admin-reason-radio-dot" />
                          )}
                        </span>

                        <span>{reason}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            {/* Show account action errors inside the confirmation popup */}
            {actionError && (
              <p
                role="alert"
                style={{
                  color: "#fca5a5",
                  fontSize: "13px",
                  marginTop: "10px",
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                {actionError}
              </p>
            )}
            <div className="admin-confirm-actions">
              <button
                    type="button"
                    className="admin-confirm-cancel"
                    disabled={updatingUserId !== null}
                    onClick={() => {
                      setConfirmAction(null);
                      setRestrictionReason("");
                      setActionError("");
                    }}
                  >
                    Cancel
                  </button>

             <button
              type="button"
              className="admin-confirm-submit"
              disabled={
                updatingUserId !== null ||
                (confirmAction.status !== "active" &&
                  !restrictionReason.trim())
              }
              onClick={async () => {
              const success = await updateUserStatus(
                confirmAction.userId,
                confirmAction.status,
                confirmAction.status === "active"
                  ? ""
                  : restrictionReason.trim()
              );

              if (success) {
                setConfirmAction(null);
                setRestrictionReason("");
              }
            }}

              >
                {updatingUserId !== null
                  ? "Processing..."
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}


export default AdminUsers;
