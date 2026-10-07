import React, { useState, useEffect } from 'react';
import './MyProjects.css';

// Master list ng mga hobbies na ibinigay mo
const HOBBIES_LIST = [
  { id: '1', name: 'Photography', category: 'Creative', icon: '📷' },
  { id: '2', name: 'Music', category: 'Creative', icon: '🎵' },
  { id: '3', name: 'Gaming', category: 'Entertainment', icon: '🎮' },
  { id: '4', name: 'Art', category: 'Creative', icon: '🎨' },
  { id: '5', name: 'Sports', category: 'Fitness', icon: '⚽' },
  { id: '6', name: 'Cooking', category: 'Lifestyle', icon: '🍳' },
  { id: '7', name: 'Reading', category: 'Lifestyle', icon: '📖' },
  { id: '8', name: 'Travel', category: 'Lifestyle', icon: '✈️' },
  { id: '9', name: 'Cycling', category: 'Fitness', icon: '🚴' },
  { id: '10', name: 'Fitness', category: 'Fitness', icon: '💪' },
];

export default function MyProjects() {
  const [activeTab, setActiveTab] = useState('Active');
  const [isCreating, setIsCreating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // DELETE POPUP STATE
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Load projects mula sa localStorage
  const [projects, setProjects] = useState(() => {
    try {
      const savedProjects = localStorage.getItem('userProjects');

      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);

        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error parsing saved projects:', e);
    }

    // Default sample project gamit ang isa sa mga hobbies mo (Sports)
    return [
      {
        id: 1,
        title: 'BASKETBALL PRACTICE',
        category: 'Sports',
        description:
          'Casual practice and friendly match with fellow enthusiasts.',
        skillsNeeded: ['Shooting', 'Teamwork'],
        scheduleDate: '2026-10-10',
        scheduleTime: '18:00',
        members: 1,
        date: '2026-10-10 18:00',
        status: 'Active',
        icon: '⚽',
      },
    ];
  });

  // Form State para sa bagong proyekto
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: '',
    skillInput: '',
    skillsNeeded: [],
    scheduleDate: '',
    scheduleTime: '',
  });

  // I-save sa localStorage tuwing may pagbabago sa projects
  useEffect(() => {
    try {
      localStorage.setItem('userProjects', JSON.stringify(projects));
    } catch (e) {
      console.error('Error saving projects:', e);
    }
  }, [projects]);

  // Handler sa pagdagdag ng Skill Tag
  const handleAddSkill = () => {
    if (newProject.skillInput.trim() !== '') {
      setNewProject({
        ...newProject,
        skillsNeeded: [
          ...newProject.skillsNeeded,
          newProject.skillInput.trim(),
        ],
        skillInput: '',
      });
    }
  };

  // Handler sa pag-remove ng Skill Tag
  const handleRemoveSkill = (indexToRemove) => {
    setNewProject({
      ...newProject,
      skillsNeeded: newProject.skillsNeeded.filter(
        (_, idx) => idx !== indexToRemove
      ),
    });
  };

  // Submit Handler ng Form
  const handleCreateProject = (e) => {
    e.preventDefault();

    if (!newProject.title.trim()) return;

    // Hanapin ang kaukulang hobby icon mula sa HOBBIES_LIST
    const selectedHobby = HOBBIES_LIST.find(
      (h) => h.name === newProject.category
    );

    const hobbyIcon = selectedHobby ? selectedHobby.icon : '📁';

    const dateStr = newProject.scheduleDate || '2026-10-06';
    const timeStr = newProject.scheduleTime || '12:00';
    const formattedDate = `${dateStr} ${timeStr}`;

    const createdProject = {
      id: Date.now(),
      title: newProject.title.toUpperCase(),
      category: newProject.category || 'Other',
      description: newProject.description,
      skillsNeeded: newProject.skillsNeeded,
      scheduleDate: newProject.scheduleDate,
      scheduleTime: newProject.scheduleTime,
      members: 1,
      date: formattedDate,
      status: 'Active',
      icon: hobbyIcon,
    };

    setProjects([createdProject, ...projects]);

    // Reset Form & Bumalik sa list view
    setNewProject({
      title: '',
      description: '',
      category: '',
      skillInput: '',
      skillsNeeded: [],
      scheduleDate: '',
      scheduleTime: '',
    });

    setIsCreating(false);
  };

  // Handler para sa pagbabago ng status (Active, Completed, Archived)
  const handleStatusChange = (id, newStatus) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: newStatus } : p
      )
    );

    setOpenMenuId(null);
  };

  // OPEN DELETE POPUP
  const handleDeleteProject = (id) => {
    setProjectToDelete(id);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  // CONFIRM DELETE
  const confirmDeleteProject = () => {
    if (projectToDelete !== null) {
      setProjects((prev) =>
        prev.filter((p) => p.id !== projectToDelete)
      );
    }

    setProjectToDelete(null);
    setShowDeleteModal(false);
  };

  // CANCEL DELETE
  const cancelDeleteProject = () => {
    setProjectToDelete(null);
    setShowDeleteModal(false);
  };

  const filteredProjects = projects.filter(
    (p) => p.status === activeTab
  );

  // VIEW 1: CREATE HOBBY PROJECT PAGE
  if (isCreating) {
    return (
      <div className="my-projects-container">
        <div className="create-project-page">
          <div className="page-header">
            <span className="subtitle">CREATE HOBBY PROJECT</span>

            <h1>Create a Hobby Project</h1>

            <p>
              Share your idea and find people who can help bring your hobby
              project to life.
            </p>
          </div>

          <div className="form-card-container">
            <form onSubmit={handleCreateProject}>
              {/* Project Title */}
              <div className="form-group">
                <div className="label-row">
                  <label>Project Title</label>

                  <span className="char-count">
                    {newProject.title.length}/100
                  </span>
                </div>

                <input
                  type="text"
                  maxLength={100}
                  placeholder="Enter your project title"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <div className="label-row">
                  <label>Description</label>

                  <span className="char-count">
                    {newProject.description.length}/500
                  </span>
                </div>

                <textarea
                  rows={4}
                  maxLength={500}
                  placeholder="Describe your hobby project..."
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              {/* Hobby Category - Dynamic mula sa 10 hobbies mo */}
              <div className="form-group">
                <label>Hobby Category</label>

                <select
                  value={newProject.category}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      category: e.target.value,
                    })
                  }
                  required
                >
                  <option value="" disabled>
                    Choose your category
                  </option>

                  {HOBBIES_LIST.map((hobby) => (
                    <option key={hobby.id} value={hobby.name}>
                      {hobby.icon} {hobby.name} ({hobby.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Skills Needed */}
              <div className="form-group">
                <label>Skills Needed</label>

                <div className="skill-input-row">
                  <input
                    type="text"
                    placeholder="Example: Photo Editing"
                    value={newProject.skillInput}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        skillInput: e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />

                  <button
                    type="button"
                    className="add-skill-btn"
                    onClick={handleAddSkill}
                  >
                    + Add
                  </button>
                </div>

                {/* Skill Badges List */}
                {newProject.skillsNeeded.length > 0 && (
                  <div className="skills-tag-container">
                    {newProject.skillsNeeded.map((skill, index) => (
                      <span key={index} className="skill-chip">
                        {skill}

                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule / Availability */}
              <div className="form-group">
                <label>Schedule / Availability</label>

                <div className="schedule-row">
                  <div className="input-with-icon">
                    <input
                      type="date"
                      value={newProject.scheduleDate}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          scheduleDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="input-with-icon">
                    <input
                      type="time"
                      value={newProject.scheduleTime}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          scheduleTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="btn-submit">
                  Publish Project
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: MY PROJECTS LIST PAGE
  return (
    <div className="my-projects-container">
      {/* Header Section */}
      <div className="projects-header">
        <div className="header-text">
          <span className="subtitle">YOUR COLLABORATIONS</span>

          <h1>My Projects</h1>

          <p>
            Manage your hobby projects and collaborate with people who share
            your interests.
          </p>
        </div>

        <button
          className="create-project-btn"
          type="button"
          onClick={() => setIsCreating(true)}
        >
          + Create Project
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['Active', 'Completed', 'Archived'].map((tab) => {
          const count = projects.filter(
            (p) => p.status === tab
          ).length;

          return (
            <button
              key={tab}
              type="button"
              className={`tab-btn ${
                activeTab === tab ? 'active' : ''
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} <span className="badge">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Projects List */}
      <div className="projects-list">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="card-left">
                <div className="project-icon">
                  {project.icon}
                </div>

                <div className="project-info">
                  <h3>{project.title}</h3>

                  <p>
                    {project.category} • 👤 {project.members}{' '}
                    {project.members === 1
                      ? 'member'
                      : 'members'}{' '}
                    • {project.date}
                  </p>

                  {project.skillsNeeded &&
                    project.skillsNeeded.length > 0 && (
                      <div className="card-skills-row">
                        {project.skillsNeeded.map((skill, i) => (
                          <span
                            key={i}
                            className="card-skill-tag"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              <div
                className="card-right"
                style={{ position: 'relative' }}
              >
                <span
                  className={`status-tag status-${project.status.toLowerCase()}`}
                >
                  {project.status}
                </span>

                <button
                  type="button"
                  className="more-btn"
                  onClick={() =>
                    setOpenMenuId(
                      openMenuId === project.id
                        ? null
                        : project.id
                    )
                  }
                >
                  •••
                </button>

                {openMenuId === project.id && (
                  <div className="project-menu-dropdown">
                    {project.status !== 'Active' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            project.id,
                            'Active'
                          )
                        }
                      >
                        Set as Active
                      </button>
                    )}

                    {project.status !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            project.id,
                            'Completed'
                          )
                        }
                      >
                        Mark as Completed
                      </button>
                    )}

                    {project.status !== 'Archived' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            project.id,
                            'Archived'
                          )
                        }
                      >
                        Archive Project
                      </button>
                    )}

                    <button
                      type="button"
                      className="delete-option"
                      onClick={() =>
                        handleDeleteProject(project.id)
                      }
                    >
                      Delete Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>
              No {activeTab.toLowerCase()} projects found.
            </p>
          </div>
        )}
      </div>

   

{showDeleteModal && (
  <div
    className="delete-modal-overlay"
    onClick={cancelDeleteProject}
  >
    <div
      className="delete-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="delete-modal-icon">
        🗑️
      </div>

      <h2>Delete Project?</h2>

      <p>
        Are you sure you want to delete this project?
        This action cannot be undone.
      </p>

      <div className="delete-modal-actions">
        <button
          type="button"
          className="delete-modal-cancel"
          onClick={cancelDeleteProject}
        >
          Cancel
        </button>

        <button
          type="button"
          className="delete-modal-confirm"
          onClick={confirmDeleteProject}
        >
          Delete Project
        </button>
    </div>
    </div>
        </div>
        )}

      {/* Popup Animation */}
      <style>
        {`
          @keyframes deletePopupIn {
            from {
              opacity: 0;
              transform: scale(0.92);
            }

            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}