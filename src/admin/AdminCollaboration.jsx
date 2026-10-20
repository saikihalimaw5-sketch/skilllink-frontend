
import { useEffect, useMemo, useState } from "react";
import { Search, Eye, X, Users, FolderKanban } from "lucide-react";
import "./AdminCollaboration.css";

const API_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const PAGE_SIZE = 8;

const getUsername = (user) =>
  user?.username ||
  user?.email?.split("@")[0] ||
  "Unknown User";


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


const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function AdminCollaboration() {
  const [stats, setStats] = useState({
    totalCollaborations: 0,
    activeCollaborations: 0,
    completedCollaborations: 0,
    archivedCollaborations: 0,
  });

  const [collaborations, setCollaborations] = useState([]);
  const [connections, setConnections] = useState([]);

const [connectionStats, setConnectionStats] = useState({
  totalConnections: 0,
  pendingConnections: 0,
  acceptedConnections: 0,
  declinedConnections: 0,
});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Main collaboration sections
const [mainTab, setMainTab] = useState("projects");

// Existing project status filter
const [activeTab, setActiveTab] = useState("All");

// Search and pagination
const [search, setSearch] = useState("");
const [page, setPage] = useState(1);
  const [selectedCollaboration, setSelectedCollaboration] =
    useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Admin authentication required.");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [statsResponse, collaborationsResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/admin/dashboard`, {
              headers,
              signal: controller.signal,
            }),
            fetch(`${API_URL}/api/admin/collaborations`, {
              headers,
              signal: controller.signal,
            }),
          ]);

        if (!statsResponse.ok) {
          throw new Error(
            "Failed to load collaboration statistics."
          );
        }

        if (!collaborationsResponse.ok) {
          throw new Error(
            "Failed to load collaboration records."
          );
        }

        const [statsData, collaborationData] =
          await Promise.all([
            statsResponse.json(),
            collaborationsResponse.json(),
          ]);

        if (controller.signal.aborted) return;

        setStats({
          totalCollaborations:
            statsData.totalCollaborations ?? 0,
          activeCollaborations:
            statsData.activeCollaborations ?? 0,
          completedCollaborations:
            statsData.completedCollaborations ?? 0,
          archivedCollaborations:
            statsData.archivedCollaborations ?? 0,
        });

        setCollaborations(
          Array.isArray(collaborationData.collaborations)
            ? collaborationData.collaborations
            : []
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => controller.abort();
  }, []);

  
  // Fetch actual People Connections from MongoDB
  useEffect(() => {
    if (mainTab !== "people") return;

    const controller = new AbortController();

    async function fetchConnections() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Admin authentication required.");
        }

        const response = await fetch(
          `${API_URL}/api/admin/connections`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load people connections."
          );
        }

        const data = await response.json();

        if (controller.signal.aborted) return;

        setConnections(
          Array.isArray(data.connections)
            ? data.connections
            : []
        );

        setConnectionStats({
          totalConnections:
            data.stats?.totalConnections ?? 0,
          pendingConnections:
            data.stats?.pendingConnections ?? 0,
          acceptedConnections:
            data.stats?.acceptedConnections ?? 0,
          declinedConnections:
            data.stats?.declinedConnections ?? 0,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchConnections();

    return () => controller.abort();
  }, [mainTab]);


  const filteredCollaborations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return collaborations
      .filter((item) => {
        const matchesTab =
          activeTab === "All" ||
          item.status === activeTab;

        const searchableText = [
          item.projectTitle,
          getUsername(item.owner),
          getUsername(item.user),
          item.status,
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesTab &&
          searchableText.includes(query)
        );
      })
      .sort((a, b) => {
        return (
          new Date(b.date || 0).getTime() -
          new Date(a.date || 0).getTime()
        );
      });
  }, [collaborations, activeTab, search]);

  // Filter actual People Connections
  const filteredConnections = useMemo(() => {
    const query = search.trim().toLowerCase();

    
return connections
  .filter((item) => {
    // Hide connections with missing/deleted user references
    if (!item.requester || !item.recipient) {
      return false;
    }

    const matchesTab =
      activeTab === "All" ||
      item.status?.toLowerCase() === activeTab.toLowerCase();

    const searchableText = [
      getUsername(item.requester),
      getUsername(item.recipient),
      item.status,
    ]
      .join(" ")
      .toLowerCase();

    return matchesTab && searchableText.includes(query);
  })
  .sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );

  }, [connections, activeTab, search]);

  // Use the correct records for the selected main tab
  const filteredRecords =
    mainTab === "people"
      ? filteredConnections
      : filteredCollaborations;

  
const totalPages = Math.max(
  1,
  Math.ceil(filteredRecords.length / PAGE_SIZE)
);

const currentPage = Math.min(page, totalPages);

const visibleCollaborations = filteredRecords.slice(
  (currentPage - 1) * PAGE_SIZE,
  currentPage * PAGE_SIZE
);



const validConnections = connections.filter(
  (item) => item.requester && item.recipient
);

const validConnectionStats = {
  totalConnections: validConnections.length,
  pendingConnections: validConnections.filter(
    (item) => item.status === "pending"
  ).length,
  acceptedConnections: validConnections.filter(
    (item) => item.status === "accepted"
  ).length,
  declinedConnections: validConnections.filter(
    (item) => item.status === "declined"
  ).length,
};
 

const cards =
  mainTab === "people"
    ? [
        {
          label: "Total Connections",
          value: validConnectionStats.totalConnections,
        },
        {
          label: "Pending Connections",
          value: validConnectionStats.pendingConnections,
        },
        {
          label: "Accepted Connections",
          value: validConnectionStats.acceptedConnections,
        },
        {
          label: "Declined Connections",
          value: validConnectionStats.declinedConnections,
        },
      ]
    : [
        {
          label: "Total Collaborations",
          value: stats.totalCollaborations,
        },
        {
          label: "Active Collaborations",
          value: stats.activeCollaborations,
        },
        {
          label: "Completed Collaborations",
          value: stats.completedCollaborations,
        },
        {
          label: "Archived Collaborations",
          value: stats.archivedCollaborations,
        },
      ];


  
const tabs =
  mainTab === "people"
    ? [
        "All",
        "Pending",
        "Accepted",
        "Declined",
      ]
    : [
        "All",
        "Pending",
        "Ongoing",
        "Completed",
        "Archived",
        "Rejected",
      ];


  return (
    <div className="admin-collaboration">
      <div className="admin-collaboration-header">
        <h1>Collaboration Management</h1>
        <p>
          Monitor student project collaborations and their
          progress.
        </p>
      </div>

      {error && (
        <p role="alert" className="admin-collaboration-error">
          {error}
        </p>
      )}

{/* MAIN COLLABORATION TABS */}
<div
  className="admin-collaboration-main-tabs"
  style={{
    display: "flex",
    gap: "8px",
    padding: "6px",
    marginBottom: "24px",
    background: "#20162d",
    borderRadius: "12px",
  }}
>
  <button
    type="button"
    onClick={() => {
      setMainTab("people");
      setActiveTab("All");
      setSearch("");
      setPage(1);
      setSelectedCollaboration(null);
    }}
    style={{
      flex: 1,
      padding: "14px",
      border: "none",
      borderRadius: "9px",
      cursor: "pointer",
      fontWeight: 600,
      background:
        mainTab === "people" ? "#684c65" : "transparent",
      color:
        mainTab === "people" ? "#ffffff" : "#b6a7c7",
    }}
  >
    People Connections
  </button>

  <button
    type="button"
    onClick={() => {
      setMainTab("projects");
      setActiveTab("All");
      setSearch("");
      setPage(1);
      setSelectedCollaboration(null);
    }}
    style={{
      flex: 1,
      padding: "14px",
      border: "none",
      borderRadius: "9px",
      cursor: "pointer",
      fontWeight: 600,
      background:
        mainTab === "projects" ? "#684c65" : "transparent",
      color:
        mainTab === "projects" ? "#ffffff" : "#b6a7c7",
    }}
  >
    Project Collaborations
  </button>
</div>

      <div className="admin-collaboration-stats">
        {cards.map((card) => (
          <div
            className="admin-collaboration-stat-card"
            key={card.label}
          >
            <p>{card.label}</p>
            <h2>
              {loading || error ? "—" : card.value}
            </h2>
          </div>
        ))}
      </div>

      <section className="admin-collaboration-list">
        
<div className="admin-collaboration-list-header">
  <h2>
    {mainTab === "people"
      ? "People Connections"
      : "Project Collaborations"}
  </h2>

  <p>
    {mainTab === "people"
      ? "Monitor user connections, requests, and their current status."
      : "View project participants and collaboration requests."}
  </p>
</div>


        <div className="admin-collaboration-toolbar">
          <div className="admin-collaboration-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={
                  activeTab === tab ? "active" : ""
                }
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="admin-collaboration-search">
            <Search size={18} />
            <input
              type="text"
              placeholder={
  mainTab === "people"
    ? "Search users or connections..."
    : "Search projects or users..."
}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="admin-collaboration-table-wrap">
          <table className="admin-collaboration-table">
            
<thead>
  <tr>
    {mainTab === "people" ? (
      <>
        <th>Requester</th>
        <th>Recipient</th>
      </>
    ) : (
      <>
        <th>Project</th>
        <th>Owner</th>
        <th>Collaborator</th>
      </>
    )}

    <th>Status</th>
    <th>Date</th>
    <th>Actions</th>
  </tr>
</thead>


            
<tbody>
  {!loading &&
    !error &&
    visibleCollaborations.map((item) => (
      <tr key={item._id}>
        {mainTab === "people" ? (
          <>
            <td>
              <div className="admin-collaboration-person">
                <img
                  src={getAvatar(item.requester)}
                  alt=""
                />
                <span>{getUsername(item.requester)}</span>
              </div>
            </td>

            <td>
              <div className="admin-collaboration-person">
                <img
                  src={getAvatar(item.recipient)}
                  alt=""
                />
                <span>{getUsername(item.recipient)}</span>
              </div>
            </td>
          </>
        ) : (
          <>
            <td>
              <div className="admin-collaboration-project">
  <span className="admin-collaboration-project-icon">
    <FolderKanban size={18} />
  </span>

  <span className="admin-collaboration-project-name">
    {item.projectTitle || "Untitled Project"}
  </span>
</div>
            </td>

            <td>
              <div className="admin-collaboration-person">
                <img src={getAvatar(item.owner)} alt="" />
                <span>{getUsername(item.owner)}</span>
              </div>
            </td>

            <td>
              <div className="admin-collaboration-person">
                <img src={getAvatar(item.user)} alt="" />
                <span>{getUsername(item.user)}</span>
              </div>
            </td>
          </>
        )}

        <td>
          <span
            className={`admin-collaboration-status ${String(
              item.status || ""
            ).toLowerCase()}`}
          >
            {item.status}
          </span>
        </td>

        <td>
          {formatDate(
            mainTab === "people"
              ? item.createdAt
              : item.date
          )}
        </td>

        <td>
          <button
            type="button"
            className="admin-collaboration-view"
            title="View details"
            aria-label="View details"
            onClick={() => setSelectedCollaboration(item)}
          >
            <Eye size={18} />
          </button>
        </td>
      </tr>
    ))}
</tbody>

          </table>

          
{loading ? (
  <div className="admin-collaboration-empty">
    <Users size={32} />
    <h3>
      {mainTab === "people"
        ? "Loading people connections..."
        : "Loading collaborations..."}
    </h3>
    <p>Please wait while we retrieve the records.</p>
  </div>
) : error ? (
  <div className="admin-collaboration-empty">
    <Users size={32} />
    <h3>
      {mainTab === "people"
        ? "Unable to load people connections"
        : "Unable to load collaborations"}
    </h3>
    <p>{error}</p>
  </div>
) : visibleCollaborations.length === 0 ? (
  <div className="admin-collaboration-empty">
    <Users size={32} />

    <h3>
      {mainTab === "people"
        ? "No connections found"
        : "No collaborations found"}
    </h3>

    <p>
      {filteredRecords.length === 0 &&
      search.trim() === "" &&
      activeTab === "All"
        ? mainTab === "people"
          ? "No active user connection records are available."
          : "No collaboration records are available yet."
        : "No matching records. Try another status or search term."}
    </p>
  </div>
) : null}

        </div>

        {!loading &&
  !error &&
  filteredRecords.length > 0 && (
            <div className="admin-collaboration-pagination">
              <p>
                
Showing{" "}
{(currentPage - 1) * PAGE_SIZE + 1}–
{Math.min(
  currentPage * PAGE_SIZE,
  filteredRecords.length
)}{" "}
of {filteredRecords.length} records

              </p>

              <div className="admin-collaboration-page-buttons">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setPage(currentPage - 1)
                  }
                >
                  Previous
                </button>

                <span>
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setPage(currentPage + 1)
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </section>

      
{selectedCollaboration && (
  <div
    className="admin-collaboration-modal-overlay"
    onClick={() => setSelectedCollaboration(null)}
  >
    <div
      className="admin-collaboration-modal"
      role="dialog"
      aria-modal="true"
      aria-label={
        mainTab === "people"
          ? "Connection details"
          : "Collaboration details"
      }
      onClick={(e) => e.stopPropagation()}
    >
      <div className="admin-collaboration-modal-header">
        <div>
          <h2>
            {mainTab === "people"
              ? "Connection Details"
              : "Collaboration Details"}
          </h2>
          <p style={{ margin: "6px 0 0", color: "#b9accd", fontSize: "13px" }}>
            {mainTab === "people"
              ? "View information about this user connection."
              : "View information about this project collaboration."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedCollaboration(null)}
          aria-label="Close details"
        >
          <X size={20} />
        </button>
      </div>

      <div className="admin-collaboration-modal-body">
        {mainTab === "people" ? (
          <>
            <div>
              <span>Requester</span>
              <div className="admin-collaboration-person">
                <img
                  src={getAvatar(selectedCollaboration.requester)}
                  alt=""
                />
                <strong>
                  {getUsername(selectedCollaboration.requester)}
                </strong>
              </div>
            </div>

            <div>
              <span>Recipient</span>
              <div className="admin-collaboration-person">
                <img
                  src={getAvatar(selectedCollaboration.recipient)}
                  alt=""
                />
                <strong>
                  {getUsername(selectedCollaboration.recipient)}
                </strong>
              </div>
            </div>

            <div>
              <span>Connection Status</span>
              <span
                className={`admin-collaboration-status ${selectedCollaboration.status}`}
                style={{ alignSelf: "flex-start" }}
              >
                {selectedCollaboration.status}
              </span>
            </div>

            <div>
              <span>Request Date</span>
              <strong>
                {formatDate(selectedCollaboration.createdAt)}
              </strong>
            </div>

            <div>
              <span>Response Date</span>
              <strong>
                {formatDate(selectedCollaboration.respondedAt)}
              </strong>
            </div>
          </>
        ) : (
          <>
            <div>
              <span>Project</span>
              <strong>{selectedCollaboration.projectTitle}</strong>
            </div>

            <div>
              <span>Owner</span>
              <div className="admin-collaboration-person">
                <img
                  src={getAvatar(selectedCollaboration.owner)}
                  alt=""
                />
                <strong>
                  {getUsername(selectedCollaboration.owner)}
                </strong>
              </div>
            </div>

            <div>
              <span>Collaborator</span>
              <div className="admin-collaboration-person">
                <img
                  src={getAvatar(selectedCollaboration.user)}
                  alt=""
                />
                <strong>
                  {getUsername(selectedCollaboration.user)}
                </strong>
              </div>
            </div>

            <div>
              <span>Status</span>
              <strong>{selectedCollaboration.status}</strong>
            </div>

            <div>
              <span>Date</span>
              <strong>
                {formatDate(selectedCollaboration.date)}
              </strong>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)}

    </div>
  );
}
