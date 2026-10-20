
import { useEffect, useMemo, useState } from "react";
import { Search, FolderKanban, Eye, X } from "lucide-react";
import "./AdminProjects.css";

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

function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [page, setPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);

  const pageSize = 8;
  
  // Category colors based on Admin Hobbies & Skills
  const hobbyCategories = {
    fitness: "fitness",
    cycling: "fitness",
    sports: "fitness",

    travel: "lifestyle",
    reading: "lifestyle",
    cooking: "lifestyle",

    art: "creative",
    music: "creative",
    photography: "creative",

    gaming: "entertainment",
  };

  const getCategoryColor = (category) => {
    const name = String(category || "")
      .trim()
      .toLowerCase();

    return hobbyCategories[name] || "default";
  };


  useEffect(() => {
    const controller = new AbortController();

    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError("");

        const API_URL =
          import.meta.env.VITE_API_BASE_URL ||
          import.meta.env.VITE_API_URL ||
          "http://localhost:5000";

        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/api/admin/projects`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load projects."
          );
        }

        setProjects(
          Array.isArray(data.projects) ? data.projects : []
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
    };

    fetchProjects();

    return () => controller.abort();
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects
      .filter((project) => {
        const owner = project.owner?.username || "";

        const matchesSearch =
          String(project.title || "")
            .toLowerCase()
            .includes(query) ||
          String(project.category || "")
            .toLowerCase()
            .includes(query) ||
          owner.toLowerCase().includes(query);

        const matchesStatus =
          status === "All" || project.status === status;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return sort === "Newest"
          ? dateB - dateA
          : dateA - dateB;
      });
  }, [projects, search, status, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleProjects = filteredProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="admin-projects-page">
      <div className="admin-projects-heading">
        <div>
          <h2>Project Management</h2>
          <p>
            Monitor student projects and collaboration activities.
          </p>
        </div>
      </div>

      <div className="admin-projects-toolbar">
        <div className="admin-projects-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search projects, owners, or categories..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Archived">Archived</option>
        </select>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="Newest">Newest</option>
          <option value="Oldest">Oldest</option>
        </select>
      </div>

      <div className="admin-projects-table-wrapper">
        <table className="admin-projects-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Owner</th>
              <th>Category</th>
              <th>Members</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              !error &&
              visibleProjects.map((project) => (
                <tr key={project._id}>
                  <td>
                    <div className="admin-project-name">
                      <span className="admin-project-icon">
                        <FolderKanban size={18} />
                      </span>
                      <strong>{project.title}</strong>
                    </div>
                  </td>                                   
                    <td>
                    <div className="admin-project-owner">
                        <img
                       src={getAvatar(project.owner)}
                        alt="Project owner avatar"
                        className="admin-project-owner-avatar"
                        />

                        <strong>
                        {project.owner?.username ||
                            project.owner?.email?.split("@")[0] ||
                            "Unknown User"}
                        </strong>
                    </div>
                    </td>
            
                            <td>
                            <span
                                className={`admin-project-category ${getCategoryColor(
                                project.category
                                )}`}
                            >
                                {project.category || "Uncategorized"}
                            </span>
                            </td>

                                <td>
                                <div className="admin-project-members">
                                    {project.members?.length > 0 ? (
                                    project.members.map((member, index) => {
                                        if (!member) return null;

                                        const username =
                                        member.username ||
                                        member.email?.split("@")[0] ||
                                        "Unknown User";

                                        const avatar = getAvatar(member);

                                        return (
                                        <div
                                            className="admin-project-member"
                                            key={member._id || index}
                                        >
                                            <img
                                            src={avatar}
                                            alt={`${username}'s profile`}
                                            className="admin-project-member-avatar"
                                            />

                                            <span>{username}</span>
                                        </div>
                                        );
                                    })
                                    ) : (
                                    <span className="admin-project-no-members">
                                        No members
                                    </span>
                                    )}
                                </div>
                                </td>


                  <td>
                    <span
                      className={`admin-project-status ${String(
                        project.status || ""
                      ).toLowerCase()}`}
                    >
                      {project.status}
                    </span>
                  </td>

                  <td>{formatDate(project.createdAt)}</td>

                  <td>
                    <button
                      type="button"
                      className="admin-project-view"
                      onClick={() => setSelectedProject(project)}
                      title="View project details"
                      aria-label={`View ${project.title}`}
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {loading ? (
          <div className="admin-projects-empty">
            <FolderKanban size={38} />
            <h3>Loading projects...</h3>
            <p>Retrieving project records from MongoDB.</p>
          </div>
        ) : error ? (
          <div className="admin-projects-empty">
            <h3>Unable to load projects</h3>
            <p>{error}</p>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="admin-projects-empty">
            <FolderKanban size={38} />
            <h3>No projects found</h3>
            <p>
              {projects.length === 0
                ? "No projects have been created yet."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : null}
      </div>

      {!loading && !error && filteredProjects.length > 0 && (
        <div className="admin-projects-pagination">
          <p>
            Showing{" "}
            {(currentPage - 1) * pageSize + 1}–
            {Math.min(
              currentPage * pageSize,
              filteredProjects.length
            )}{" "}
            of {filteredProjects.length} projects
          </p>

          <div className="admin-projects-page-buttons">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </button>

            <span>
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedProject && (
        <div
          className="admin-project-modal-overlay"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="admin-project-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Project details"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-project-modal-header">
              <h2>{selectedProject.title}</h2>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Close project details"
              >
                <X size={20} />
              </button>
            </div>

            
                <div className="admin-project-modal-body">

                {/* PROJECT OWNER */}
                <div className="admin-modal-info-card">
                    <span className="admin-modal-label">Project Owner</span>

                    <div className="admin-project-owner">
                    <img
                        src={getAvatar(selectedProject.owner)}
                        alt="Owner"
                        className="admin-project-owner-avatar"
                    />

                    <strong>
                        {selectedProject.owner?.username || "Unknown User"}
                    </strong>
                    </div>
                </div>

                {/* CATEGORY AND STATUS */}
                <div className="admin-modal-info-grid">
                    <div className="admin-modal-info-card">
                    <span className="admin-modal-label">Category</span>

                    <span
                        className={`admin-project-category ${getCategoryColor(
                        selectedProject.category
                        )}`}
                    >
                        {selectedProject.category || "Uncategorized"}
                    </span>
                    </div>

                    <div className="admin-modal-info-card">
                    <span className="admin-modal-label">Status</span>

                    <span
                        className={`admin-project-status ${String(
                        selectedProject.status || ""
                        ).toLowerCase()}`}
                    >
                        {selectedProject.status}
                    </span>
                    </div>
                </div>

                {/* DATES */}
                <div className="admin-modal-info-grid">
                    <div className="admin-modal-info-card">
                    <span className="admin-modal-label">Created Date</span>
                    <strong>{formatDate(selectedProject.createdAt)}</strong>
                    </div>

                    <div className="admin-modal-info-card">
                    <span className="admin-modal-label">Schedule</span>

                    <strong>
                        {formatDate(selectedProject.scheduleDate)}
                        {selectedProject.scheduleTime
                        ? ` at ${selectedProject.scheduleTime}`
                        : ""}
                    </strong>
                    </div>
                </div>

                {/* DESCRIPTION */}
                <div className="admin-modal-section">
                    <h3>Description</h3>
                    <p>
                    {selectedProject.description || "No description provided."}
                    </p>
                </div>

                {/* SKILLS */}
                <div className="admin-modal-section">
                    <h3>Skills Needed</h3>

                    <div className="admin-modal-skills">
                    {selectedProject.skillsNeeded?.length ? (
                        selectedProject.skillsNeeded.map((skill, index) => (
                        <span className="admin-modal-skill" key={index}>
                            {skill}
                        </span>
                        ))
                    ) : (
                        <span>No skills specified.</span>
                    )}
                    </div>
                </div>

                {/* MEMBERS */}
                <div className="admin-modal-section">
                    <h3>
                    Members ({selectedProject.members?.length ?? 0})
                    </h3>

                    <div className="admin-modal-members">
                    {selectedProject.members?.length ? (
                        selectedProject.members.filter(Boolean).map((member) => {
                        const username =
                            member.username ||
                            member.email?.split("@")[0] ||
                            "Unknown User";

                        const avatar =
                            member.profileImage ||
                            `https://api.dicebear.com/9.x/${
                            member.avatarStyle || "avataaars"
                            }/svg?seed=${encodeURIComponent(username)}`;

                        return (
                            <div
                            className="admin-modal-member"
                            key={member._id}
                            >
                            <img
                                src={avatar}
                                alt={username}
                                className="admin-project-member-avatar"
                            />

                            <strong>{username}</strong>
                            </div>
                        );
                        })
                    ) : (
                        <p>No members available.</p>
                    )}
                    </div>
                </div>

                </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProjects;
