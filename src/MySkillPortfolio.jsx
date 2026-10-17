
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './MySkillPortfolio.css';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const HOBBY_ICONS = {
  Photography: '📷',
  Music: '🎵',
  Gaming: '🎮',
  Art: '🎨',
  Sports: '⚽',
  Cooking: '🍳',
  Reading: '📖',
  Travel: '✈️',
  Cycling: '🚴',
  Fitness: '💪',
};

  const getToken = () => localStorage.getItem('token');
  const formatProjectSchedule = (date, time) => {
    let formattedDate = '';
    let formattedTime = '';

    if (date) {
      const dateOnly = String(date).slice(0, 10);
      const parsedDate = new Date(`${dateOnly}T00:00:00`);

      formattedDate = Number.isNaN(parsedDate.getTime())
        ? dateOnly
        : parsedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
    }

    if (time) {
      const match = String(time)
        .slice(0, 5)
        .match(/^(\d{2}):(\d{2})$/);

      formattedTime = match
        ? new Date(
            2000,
            0,
            1,
            Number(match[1]),
            Number(match[2])
          ).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })
        : String(time).slice(0, 5);
    }

    return [formattedDate, formattedTime]
      .filter(Boolean)
      .join(' • ');
  };

function MySkillPortfolio({ onAddProject, onEditHobbies }) {
  const navigate = useNavigate();

  const [hobbies, setHobbies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState('');

  // Load hobbies saved by the Hobbies page.
  const loadHobbies = useCallback(() => {
    try {
      const savedHobbies = JSON.parse(
        localStorage.getItem('userHobbies') || '[]'
      );

      setHobbies(
        Array.isArray(savedHobbies) ? savedHobbies : []
      );
    } catch (error) {
      console.error('Error loading hobbies:', error);
      setHobbies([]);
    }
  }, []);

  // Load the same projects used by MyProjects.jsx.
  const loadProjects = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setProjects([]);
      setProjectError('Please log in again to view your projects.');
      setLoadingProjects(false);
      return;
    }

    setLoadingProjects(true);
    setProjectError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/my`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'Unable to load your projects.'
        );
      }

      const projectList = Array.isArray(data)
        ? data
        : Array.isArray(data.projects)
          ? data.projects
          : [];

      setProjects(
        projectList.map((project) => ({
          ...project,
          id: project._id || project.id,
          title:
            project.title ||
            project.name ||
            project.projectName ||
            'Untitled Project',
          description:
            project.description ||
            project.details ||
            '',
          category: project.category || '',
          skillsNeeded: Array.isArray(project.skillsNeeded)
            ? project.skillsNeeded
            : [],
          scheduleDate: project.scheduleDate || '',
          scheduleTime: project.scheduleTime || '',
          status: project.status || 'Active',
        }))
      );
    } catch (error) {
      console.error('Load portfolio projects error:', error);
      setProjectError(
        error.message || 'Unable to load your projects.'
      );
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    loadHobbies();
    loadProjects();

    // Refresh when returning to this page.
    const handleFocus = () => {
      loadHobbies();
      loadProjects();
    };

    // Refresh when another tab updates localStorage.
    const handleStorage = (event) => {
      if (
        !event.key ||
        event.key === 'userHobbies' ||
        event.key === 'token'
      ) {
        loadHobbies();
        loadProjects();
      }
    };

    // Refresh after project changes in the same tab.
    const handleProjectUpdate = () => {
      loadProjects();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('projectsUpdated', handleProjectUpdate);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(
        'projectsUpdated',
        handleProjectUpdate
      );
    };
  }, [loadHobbies, loadProjects]);

  return (
    <div className="my-skill-portfolio">
      <main className="portfolio-content">
        <div className="portfolio-heading">
          <div>
            <span className="portfolio-eyebrow">
              YOUR PROFILE
            </span>

            <h1>My Skill &amp; Portfolio</h1>

            <p>
              Your projects and selected hobbies in one place.
            </p>
          </div>
        </div>

        <div className="portfolio-two-column">
          {/* LEFT COLUMN: MY PROJECTS */}
          <section className="portfolio-section portfolio-projects-column">
            <div className="portfolio-column-heading">
              <div className="portfolio-heading-icon">
                📁
              </div>

              <div className="portfolio-column-title">
                <h2>My Projects</h2>
                <p>Projects you have created.</p>
              </div>

              <span className="portfolio-count">
                {projects.length}
              </span>

              <button
                type="button"
                className="portfolio-action-btn"
                onClick={() => {
                        if (onAddProject) {
                          onAddProject();
                        } else {
                          navigate('/dashboard', {
                            state: {
                              activeTab: 'My Projects',
                              openCreateProject: true,
                            },
                          });
                        }
                      }}
              >
                <span aria-hidden="true">＋</span> Add Project
              </button>
            </div>

            <div className="portfolio-project-list">
              {loadingProjects ? (
                <div className="portfolio-empty-state">
                  <span>⏳</span>
                  <h3>Loading projects...</h3>
                  <p>Your saved projects will appear here.</p>
                </div>
              ) : projectError ? (
                <div className="portfolio-empty-state">
                  <span>⚠️</span>
                  <h3>Couldn't load projects</h3>
                  <p>{projectError}</p>

                  <button
                    type="button"
                    onClick={loadProjects}
                    className="portfolio-retry-btn"
                  >
                    Try Again
                  </button>
                </div>
              ) : projects.length > 0 ? (
                projects.map((project, index) => (
                  <article
                      key={project.id || index}
                      className="portfolio-project-card"
                      onClick={() =>
                        navigate('/dashboard', {
                          state: {
                            activeTab: 'My Projects',
                          },
                        })
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate('/dashboard', {
                            state: {
                              activeTab: 'My Projects',
                            },
                          });
                        }
                      }}
>

                    <div className="portfolio-project-icon">
                      {HOBBY_ICONS[project.category] || '💻'}
                    </div>

                    <div className="portfolio-project-info">
                      <h3>{project.title}</h3>

                      <p>
                        {project.description ||
                          'No project description available.'}
                      </p>

                      {project.category && (
                        <span className="portfolio-project-category">
                          {HOBBY_ICONS[project.category] || '📁'}{' '}
                          {project.category}
                        </span>
                      )}

                      {project.skillsNeeded.length > 0 && (
                        <div className="portfolio-project-skills">
                          {project.skillsNeeded.map((skill, skillIndex) => (
                            <span
                              key={`${skill}-${skillIndex}`}
                              className="portfolio-project-category"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                     {(project.scheduleDate || project.scheduleTime) && (
                        <p className="portfolio-project-schedule">
                          🗓️{' '}
                          {formatProjectSchedule(
                            project.scheduleDate,
                            project.scheduleTime
                          )}
                        </p>
)}

                      <small className="portfolio-project-status">
                        Status: {project.status}
                      </small>
                    </div>
                  </article>
                ))
              ) : (
                <div className="portfolio-empty-state">
                  <span>📂</span>
                  <h3>No projects yet</h3>
                  <p>
                    Projects you publish in My Projects will appear here.
                  </p>

                  <button
                      type="button"
                      className="portfolio-empty-action"
                      onClick={() => {
                        if (onAddProject) {
                          onAddProject();
                        } else {
                          navigate('/dashboard', {
                            state: {
                              activeTab: 'My Projects',
                              openCreateProject: true,
                            },
                          });
                        }
                      }}
                    >
                      ＋ Create Your First Project
                    </button>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: MY HOBBIES */}
          <section className="portfolio-section portfolio-hobbies-column">
            <div className="portfolio-column-heading">
              <div className="portfolio-heading-icon">
                💜
              </div>

              <div className="portfolio-column-title">
                <h2>My Hobbies</h2>
                <p>Your selected interests.</p>
              </div>

              <span className="portfolio-count">
                {hobbies.length}
              </span>

              <button
                type="button"
                className="portfolio-action-btn"
              onClick={() => {
  navigate('/hobbies', {
    state: {
      returnToPortfolio: true
    }
  });
}}
              >
                ✏️ Edit Hobbies
              </button>
            </div>

            <div className="portfolio-selected-list">
              {hobbies.length > 0 ? (
                hobbies.map((hobby, index) => {
                  const hobbyName =
                    typeof hobby === 'string'
                      ? hobby
                      : hobby.name || hobby.title || '';

                  return (
                    <div
                      className="portfolio-selected-item"
                      key={
                        typeof hobby === 'object'
                          ? hobby.id ||
                            hobby._id ||
                            `${hobbyName}-${index}`
                          : `${hobbyName}-${index}`
                      }
                    >
                      <span className="portfolio-hobby-icon">
                        {HOBBY_ICONS[hobbyName] || '✨'}
                      </span>

                      <div>
                        <strong>{hobbyName}</strong>
                        <small>Selected Hobby</small>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="portfolio-empty-state">
                  <span>🎯</span>
                  <h3>No hobbies selected</h3>
                  <p>
                    Choose your hobbies on the Hobbies page to display them here.
                  </p>

                  <button
                    type="button"
                    className="portfolio-empty-action"
                    onClick={() =>
  navigate('/hobbies', {
    state: {
      returnToPortfolio: true
    }
  })
}
                  >
                    ＋ Choose Hobbies
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default MySkillPortfolio;
