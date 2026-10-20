
import { useEffect, useState } from "react";
import {
  Flag,
  Clock3,
  CheckCircle2,
  XCircle,
  Search,
  Eye, 
  RefreshCw,
  MessageSquare,
} from "lucide-react";

import "./AdminReports.css";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const STATUS_OPTIONS = ["All", "Pending", "Resolved", "Dismissed"];

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [activeMainTab, setActiveMainTab] = useState("reports");
  const [supportTickets, setSupportTickets] = useState([]);
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportError, setSupportError] = useState("");
    const [selectedSupportTicket, setSelectedSupportTicket] = useState(null);
const [supportReply, setSupportReply] = useState("");
const [supportSaving, setSupportSaving] = useState(false);
const [supportActionError, setSupportActionError] = useState("");
const [supportActionSuccess, setSupportActionSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/reports/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load user reports.");
      }

      const data = await response.json();
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (err) {
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };
  
const fetchSupportTickets = async () => {
  setSupportLoading(true);
  setSupportError("");

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in as admin.");
    }

    const response = await fetch(`${API_URL}/api/support/admin`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load support tickets."
      );
    }

    setSupportTickets(
      Array.isArray(data.tickets) ? data.tickets : []
    );
  } catch (err) {
    console.error("Fetch support tickets error:", err);

    setSupportError(
      err.message || "Failed to load support tickets."
    );
  } finally {
    setSupportLoading(false);
  }
};


  useEffect(() => {
  fetchReports();
}, []);

useEffect(() => {
  if (activeMainTab === "support") {
    fetchSupportTickets();
  }
}, [activeMainTab]);

  const counts = {
    All: reports.length,
    Pending: reports.filter((r) => r.status === "Pending").length,
    Resolved: reports.filter((r) => r.status === "Resolved").length,
    Dismissed: reports.filter((r) => r.status === "Dismissed").length,
  };

  const filteredReports = reports.filter((report) => {
    const matchesStatus =
      activeStatus === "All" || report.status === activeStatus;

    const query = search.toLowerCase().trim();

    const searchableText = [
      report.reporter?.username,
      report.reporter?.email,
      report.reportType,
      report.subject,
      report.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesStatus && searchableText.includes(query);
  });
  
const sendSupportReply = async () => {
  if (!selectedSupportTicket || supportSaving) return;

  const reply = supportReply.trim();

  if (!reply) {
    setSupportActionError("Please enter a reply.");
    return;
  }

  setSupportSaving(true);
  setSupportActionError("");
  setSupportActionSuccess("");

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in as admin.");
    }

    const response = await fetch(
      `${API_URL}/api/support/admin/${selectedSupportTicket._id}/respond`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminResponse: reply,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send reply.");
    }

    setSupportTickets((prev) =>
      prev.map((ticket) =>
        ticket._id === selectedSupportTicket._id
          ? {
              ...ticket,
              adminResponse: reply,
              status: "Replied",
              respondedAt: new Date().toISOString(),
            }
          : ticket
      )
    );

    setSelectedSupportTicket((prev) =>
      prev
        ? {
            ...prev,
            adminResponse: reply,
            status: "Replied",
          }
        : prev
    );

    setSupportActionSuccess("Reply sent successfully!");
  } catch (err) {
    console.error("Send support reply error:", err);
    setSupportActionError(err.message || "Unable to send reply.");
  } finally {
    setSupportSaving(false);
  }
};

const openSupportTicket = (ticket) => {
  setSelectedSupportTicket(ticket);
  setSupportReply(ticket.adminResponse || "");
  setSupportActionError("");
  setSupportActionSuccess("");
};
  const openReport = (report) => {
    setSelectedReport(report);
    setAdminResponse(report.adminResponse || "");
    setActionError("");
    setActionSuccess("");
  };

  const updateReport = async (status) => {
    if (!selectedReport || saving) return;

    setSaving(true);
    setActionError("");
    setActionSuccess("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/reports/admin/${selectedReport._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            adminResponse: adminResponse.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update report.");
      }

      setReports((prev) =>
        prev.map((report) =>
          report._id === data.report._id ? data.report : report
        )
      );

      setSelectedReport(data.report);
      setAdminResponse(data.report.adminResponse || "");
      setActionSuccess("Report updated successfully.");
    } catch (err) {
      setActionError(err.message || "Unable to update report.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const statCards = [
    { label: "Total Reports", status: "All", icon: Flag },
    { label: "Pending", status: "Pending", icon: Clock3 },
    { label: "Resolved", status: "Resolved", icon: CheckCircle2 },
    { label: "Dismissed", status: "Dismissed", icon: XCircle },
  ];

  return (
    <div className="admin-reports">
        
<div
  style={{
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    paddingBottom: "12px",
  }}
>
  <button
    type="button"
    className={`admin-reports-main-tab ${
      activeMainTab === "reports" ? "active" : ""
    }`}
    onClick={() => setActiveMainTab("reports")}
  >
    User Reports
  </button>

  <button
    type="button"
    className={`admin-reports-main-tab ${
      activeMainTab === "support" ? "active" : ""
    }`}
    onClick={() => setActiveMainTab("support")}
  >
    Support Messages
  </button>
</div>
{activeMainTab === "reports" && (
  <>
    <div className="admin-reports-heading">
        <div>
          <h2>Reports Management</h2>
          <p>Review and manage reports submitted by SkillLink users.</p>
        </div>

        <button
          type="button"
          className="admin-reports-refresh"
          onClick={fetchReports}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="admin-reports-stats">
        {statCards.map(({ label, status, icon: Icon }) => (
          <button
            type="button"
            key={status}
            className={`admin-reports-stat ${
              activeStatus === status ? "selected" : ""
            }`}
            onClick={() => setActiveStatus(status)}
          >
            <div className="admin-reports-stat-top">
              <span>{label}</span>
              <Icon size={23} />
            </div>
            <strong>{counts[status]}</strong>
            <small>View {status.toLowerCase()} reports</small>
          </button>
        ))}
      </div>

      <div className="admin-reports-panel">
        <div className="admin-reports-panel-heading">
          <div>
            <h3>User Reports</h3>
            <p>Submitted reports from the database</p>
          </div>

          <div className="admin-reports-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-reports-tabs">
          {STATUS_OPTIONS.map((status) => (
            <button
              type="button"
              key={status}
              className={activeStatus === status ? "active" : ""}
              onClick={() => setActiveStatus(status)}
            >
              {status} ({counts[status]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-reports-empty">Loading reports...</div>
        ) : error ? (
          <div className="admin-reports-empty">{error}</div>
        ) : filteredReports.length === 0 ? (
          <div className="admin-reports-empty">
            No reports found.
          </div>
        ) : (
          <div className="admin-reports-table-wrap">
            <table className="admin-reports-table">
              <thead>
                <tr>
                  <th>Reported By</th>
                  <th>Category</th>
                  <th>Problem</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report._id}>
                    <td>
                                            
                        <div className="admin-report-user">
                        <img
                            className="admin-report-avatar"
                            src={
                            report.reporter?.profileImage ||
                            `https://api.dicebear.com/9.x/${
                                report.reporter?.avatarStyle &&
                                report.reporter.avatarStyle !== "default"
                                ? report.reporter.avatarStyle
                                : "avataaars"
                            }/svg?seed=${encodeURIComponent(
                                report.reporter?._id ||
                                report.reporter?.username ||
                                "User"
                            )}`
                            }
                            alt="Reporter profile"
                        />

                        <div className="admin-report-user-info">
                            <strong>
                            {report.reporter?.username || "Unknown User"}
                            </strong>

                            <small>{report.reporter?.email || "—"}</small>
                        </div>
                        </div>

                    </td>
                    
<td>
  <span className="admin-support-category-badge">
    {report.reportType || "General"}
  </span>
</td>

                    <td>{report.subject}</td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>
                      <span
                        className={`admin-report-status ${report.status?.toLowerCase()}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-report-view"
                        onClick={() => openReport(report)}
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReport && (
        <div
          className="admin-report-overlay"
          onClick={() => !saving && setSelectedReport(null)}
        >
          <div
            className="admin-report-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Report details"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-report-modal-heading">
              <div>
                <h3>Report Details</h3>
                <p>Review the submitted report and take action.</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                disabled={saving}
                aria-label="Close report details"
              >
                <XCircle size={23} />
              </button>
            </div>

            <div className="admin-report-details">
              
                        {/* REPORTER PROFILE */}
                        <div className="admin-report-profile-section">
                        <img
                            className="admin-report-profile-avatar"
                            src={
                            selectedReport.reporter?.profileImage ||
                            `https://api.dicebear.com/9.x/${
                                selectedReport.reporter?.avatarStyle &&
                                selectedReport.reporter.avatarStyle !== "default"
                                ? selectedReport.reporter.avatarStyle
                                : "avataaars"
                            }/svg?seed=${encodeURIComponent(
                                selectedReport.reporter?._id ||
                                selectedReport.reporter?.username ||
                                "User"
                            )}`
                            }
                            alt="Reporter profile"
                        />

                        <div className="admin-report-profile-info">
                            <span>Reported By</span>
                            <strong>
                            {selectedReport.reporter?.username || "Unknown User"}
                            </strong>
                            <small>
                            {selectedReport.reporter?.email || "—"}
                            </small>
                        </div>
                        </div>

              
<div>
  <span>Category</span>
  <strong className="admin-support-category-badge">
    {selectedReport.reportType || "General"}
  </strong>
</div>

              <div>
                <span>Problem</span>
                <strong>{selectedReport.subject}</strong>
              </div>
              <div>
                <span>Date Submitted</span>
                <strong>{formatDate(selectedReport.createdAt)}</strong>
              </div>
              <div>
                <span>Current Status</span>
<strong
  className={`admin-report-status ${selectedReport.status?.toLowerCase()}`}
>
  {selectedReport.status}
</strong>
              </div>
            </div>

            <div className="admin-report-description">
              <span>Additional Details</span>
              <p>
                {selectedReport.description ||
                  "No additional details provided."}
              </p>
            </div>

            <div className="admin-report-response">
              <label htmlFor="admin-report-response">
                Admin Response (Optional)
              </label>
              <textarea
                id="admin-report-response"
                value={adminResponse}
                maxLength={1000}
                rows={4}
                placeholder="Write an optional response..."
                onChange={(e) => {
                  setAdminResponse(e.target.value);
                  setActionSuccess("");
                }}
              />
              <small>{adminResponse.length}/1000 characters</small>
            </div>

            {actionError && (
              <p className="admin-report-action-error">{actionError}</p>
            )}
            {actionSuccess && (
              <p className="admin-report-action-success">{actionSuccess}</p>
            )}

            <div className="admin-report-actions">
              <button
                type="button"
                disabled={saving}
                onClick={() => updateReport("Pending")}
              >
                Mark Pending
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => updateReport("Dismissed")}
              >
                Dismiss
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => updateReport("Resolved")}
              >
                {saving ? "Saving..." : "Resolve"}
              </button>
            </div>
          </div>
        </div>
            )}

      </>
    )}

    {activeMainTab === "support" && (
      <div className="admin-reports-panel">
        
<div className="admin-reports-panel-heading admin-support-heading">
  <div className="admin-support-heading-info">
    <div className="admin-support-heading-icon">
      <MessageSquare size={25} />
    </div>

    <div>
      <h3>Support Messages</h3>
      <p>
        Manage support inquiries submitted by SkillLink users.
      </p>
    </div>
  </div>


          <button
            type="button"
            className="admin-reports-refresh"
            onClick={fetchSupportTickets}
            disabled={supportLoading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {supportLoading ? (
          <div className="admin-reports-empty">
            Loading support messages...
          </div>
        ) : supportError ? (
          <div className="admin-reports-empty">
            {supportError}
          </div>
        ) : supportTickets.length === 0 ? (
          <div className="admin-reports-empty">
            No support messages found.
          </div>
        ) : (
          <div className="admin-reports-table-wrap">
            
<table className="admin-reports-table admin-support-table">

              <thead>
                <tr>
                  <th>Submitted By</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {supportTickets.map((ticket) => (
                  <tr key={ticket._id}>
                    
<td>
  <div className="admin-report-user">
    <img
      className="admin-report-avatar"
      src={
        ticket.user?.profileImage ||
        `https://api.dicebear.com/9.x/${
          ticket.user?.avatarStyle &&
          ticket.user.avatarStyle !== "default"
            ? ticket.user.avatarStyle
            : "avataaars"
        }/svg?seed=${encodeURIComponent(
          ticket.user?._id ||
          ticket.user?.username ||
          "User"
        )}`
      }
      alt="User profile"
    />

    <div className="admin-report-user-info">
      <strong>
        {ticket.user?.username || "Unknown User"}
      </strong>

      <small>
        {ticket.user?.email || "—"}
      </small>
    </div>
  </div>
</td>

                    <td>{ticket.subject}</td>
                    
<td>
  <span className="admin-support-category-badge">
    {ticket.category
      ? ticket.category.charAt(0).toUpperCase() +
        ticket.category.slice(1).toLowerCase()
      : "General"}
  </span>
</td>

                    <td>{formatDate(ticket.createdAt)}</td>
                    <td>
  <span
    className={`admin-report-status ${ticket.status?.toLowerCase()}`}
  >
    {ticket.status}
  </span>
</td>

<td>
  <button
    type="button"
    className="admin-report-view"
    onClick={() => openSupportTicket(ticket)}
  >
    <Eye size={16} />
    View
  </button>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
   
    )}

    {selectedSupportTicket && (
      <div
        className="admin-report-overlay"
        onClick={() => setSelectedSupportTicket(null)}
      >
        <div
          className="admin-report-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Support ticket details"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="admin-report-modal-heading">
            <div>
              <h3>Support Ticket Details</h3>
              <p>Review the user's support inquiry.</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSupportTicket(null)}
              aria-label="Close support ticket"
            >
              <XCircle size={23} />
            </button>
          </div>

          
<div className="admin-report-details admin-support-details">

  {/* SUPPORT USER PROFILE */}
  <div className="admin-report-profile-section admin-support-profile">
    <img
      className="admin-report-profile-avatar"
      src={
        selectedSupportTicket.user?.profileImage ||
        `https://api.dicebear.com/9.x/${
          selectedSupportTicket.user?.avatarStyle &&
          selectedSupportTicket.user.avatarStyle !== "default"
            ? selectedSupportTicket.user.avatarStyle
            : "avataaars"
        }/svg?seed=${encodeURIComponent(
          selectedSupportTicket.user?._id ||
          selectedSupportTicket.user?.username ||
          "User"
        )}`
      }
      alt="Support requester profile"
    />

    <div className="admin-report-profile-info">
      <span>Submitted By</span>

      <strong>
        {selectedSupportTicket.user?.username || "Unknown User"}
      </strong>

      <small>
        {selectedSupportTicket.user?.email || "—"}
      </small>
    </div>
  </div>


            <div>
              <span>Subject</span>
              <strong>{selectedSupportTicket.subject}</strong>
            </div>

            
<div>
  <span>Category</span>
  <strong className="admin-support-category-badge">
    {selectedSupportTicket.category
      ? selectedSupportTicket.category.charAt(0).toUpperCase() +
        selectedSupportTicket.category.slice(1).toLowerCase()
      : "General"}
  </strong>
</div>


            <div>
              <span>Date Submitted</span>
              <strong>{formatDate(selectedSupportTicket.createdAt)}</strong>
            </div>

            <div>
              <span>Status</span>
<strong
  className={`admin-report-status ${selectedSupportTicket.status?.toLowerCase()}`}
>
  {selectedSupportTicket.status}
</strong>
            </div>
          </div>

          <div className="admin-report-description">
            <span>User Message</span>
            <p>{selectedSupportTicket.description}</p>
          </div>

          <div className="admin-report-response">
            <label htmlFor="support-admin-reply">Admin Reply</label>
            <textarea
              id="support-admin-reply"
              rows={4}
              maxLength={2000}
              placeholder="Write your response to the user..."
              value={supportReply}
              onChange={(e) => {
                setSupportReply(e.target.value);
                setSupportActionError("");
                setSupportActionSuccess("");
              }}
            />
            <small>{supportReply.length}/2000 characters</small>
          </div>

          {supportActionError && (
            <p className="admin-report-action-error">
              {supportActionError}
            </p>
          )}

          {supportActionSuccess && (
            <p className="admin-report-action-success">
              {supportActionSuccess}
            </p>
          )}

          <div className="admin-report-actions">
            <button
              type="button"
              disabled={supportSaving || !supportReply.trim()}
              onClick={sendSupportReply}
            >
              {supportSaving ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}

export default AdminReports;
