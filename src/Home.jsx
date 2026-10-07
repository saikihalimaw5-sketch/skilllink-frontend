import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Discover from './Discover';
import Settings from './Settings';
import Messages from './Messages';
import Notifications from './Notifications';
import MyProjects from './MyProjects';
import './Home.css';

// Dictionary ng hobby icons
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

function Home({ onGoToHobbies }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [userName, setUserName] = useState('User');
  const [userAvatar, setUserAvatar] = useState('');
  const [hobbies, setHobbies] = useState([]);
  const [activeTab, setActiveTab] = useState('Home');

  const [showLogout, setShowLogout] = useState(false);
  const profileRef = useRef(null);

  const [stats, setStats] = useState({
    projects: 0,
    collaborations: 0,
    messages: 0,
    requests: 0,
  });

  // Load user data, hobbies, and dashboard stats
  useEffect(() => {
    try {
      const savedHobbies =
        JSON.parse(localStorage.getItem('userHobbies')) || [];

      setHobbies(savedHobbies);

      const savedStats =
        JSON.parse(localStorage.getItem('userStats')) || {
          projects: 0,
          collaborations: 0,
          messages: 0,
          requests: 0,
        };

      setStats(savedStats);

      const savedUser =
        JSON.parse(localStorage.getItem('user')) ||
        JSON.parse(localStorage.getItem('userData')) ||
        JSON.parse(localStorage.getItem('skilllink_user'));

      if (savedUser) {
        const fullUserString =
          savedUser.fullName || savedUser.name;

        if (fullUserString) {
          setUserName(fullUserString.split(' ')[0]);
        }

        if (savedUser.avatar) {
          setUserAvatar(savedUser.avatar);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }

    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowLogout(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  // Open the requested dashboard tab from navigation state
  useEffect(() => {
    const requestedTab = location.state?.activeTab;

    if (requestedTab) {
      setActiveTab(requestedTab);
    }
  }, [location.state]);

  const handleRemoveHobby = (hobbyToRemove, e) => {
    e.stopPropagation();

    const updatedHobbies = hobbies.filter(
      (hobby) => hobby !== hobbyToRemove
    );

    setHobbies(updatedHobbies);

    localStorage.setItem(
      'userHobbies',
      JSON.stringify(updatedHobbies)
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleEditHobbiesClick = () => {
    if (onGoToHobbies) {
      onGoToHobbies();
    } else {
      navigate('/hobbies');
    }
  };

  const menuItems = [
    { name: 'Home', icon: '' },
    { name: 'Discover', icon: '' },
    { name: 'My Projects', icon: '' },
    { name: 'Message', icon: '' },
    { name: 'Notifications', icon: '' },
    { name: 'My Skill & Portfolio', icon: '' },
    { name: 'Settings', icon: '' },
  ];

  return (
    <div className="landing-container dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🔗</span>
          <span className="logo-text">SkillLink</span>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li
              key={item.name}
              className={`sidebar-item ${
                activeTab === item.name ? 'active' : ''
              }`}
              onClick={() => setActiveTab(item.name)}
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span className="sidebar-label">
                {item.name}
              </span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Header */}
        <header className="top-header">
          <div className="search-bar-wrapper">
            <svg
              className="chrome-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
              ></line>
            </svg>

            <input
              type="text"
              placeholder="Search hobbies, skills, or collaborators..."
              className="home-search"
            />
          </div>

          <div
            className="header-profile-wrapper"
            ref={profileRef}
          >
            <div
              className="header-profile-btn"
              onClick={() => setShowLogout(!showLogout)}
            >
              <img
                src={
                  userAvatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`
                }
                alt="Profile Avatar"
                className="header-avatar-img"
              />

              <span className="header-username">
                {userName}
              </span>
            </div>

            {showLogout && (
              <div className="logout-popup">
                <button
                  className="btn-logout"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="dashboard-body">
          {activeTab === 'Home' && (
            <>
              {/* Welcome Card */}
              <div className="home-card welcome-card">
                <div className="welcome-header">
                  <h1 className="welcome-title">
                    Hello,{' '}
                    <span className="highlight-name">
                      {userName}!
                    </span>
                  </h1>

                  <p className="welcome-subtitle">
                    Welcome back to your dashboard. Here's a quick
                    overview of your activity.
                  </p>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon-bg"></div>

                    <div className="stat-info">
                      <span className="stat-number">
                        {stats.projects}
                      </span>
                      <span className="stat-label">
                        Projects
                      </span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon-bg"></div>

                    <div className="stat-info">
                      <span className="stat-number">
                        {stats.collaborations}
                      </span>
                      <span className="stat-label">
                        Collaborations
                      </span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon-bg"></div>

                    <div className="stat-info">
                      <span className="stat-number">
                        {stats.messages}
                      </span>
                      <span className="stat-label">
                        Messages
                      </span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon-bg"></div>

                    <div className="stat-info">
                      <span className="stat-number">
                        {stats.requests}
                      </span>
                      <span className="stat-label">
                        New Request
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Hobbies Section */}
              <section className="home-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">
                      Your Selected Hobbies & Interests
                    </h2>

                    <p className="section-desc">
                      Hobbies and skills you are actively interested in
                    </p>
                  </div>

                  <button
                    className="btn-edit-hobbies"
                    onClick={handleEditHobbiesClick}
                  >
                    Add More
                  </button>
                </div>

                {hobbies.length > 0 ? (
                  <div className="hobbies-horizontal-row">
                    {hobbies.map((hobby, index) => (
                      <div
                        key={index}
                        className="hobby-pill-card"
                      >
                        <button
                          type="button"
                          className="btn-card-close"
                          title="Remove Hobby"
                          onClick={(e) =>
                            handleRemoveHobby(hobby, e)
                          }
                        >
                          ✕
                        </button>

                        <div className="hobby-card-content">
                          {HOBBY_ICONS[hobby] && (
                            <span
                              className="hobby-emoji"
                              style={{ marginRight: '6px' }}
                            >
                              {HOBBY_ICONS[hobby]}
                            </span>
                          )}

                          <span className="hobby-title-text">
                            {hobby}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-card">
                    <div className="empty-icon"></div>

                    <p className="empty-text">
                      No hobbies selected yet.
                    </p>

                    <button
                      className="btn-primary-sm"
                      onClick={handleEditHobbiesClick}
                    >
                      + Add Hobbies Now
                    </button>
                  </div>
                )}
              </section>

              {/* Recommended People Section */}
              <section className="home-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">
                      Recommended People
                    </h2>

                    <p className="section-desc">
                      Peers who match your passion
                    </p>
                  </div>
                </div>

                {hobbies.length > 0 ? (
                  <div className="recommended-card">
                    <div className="loading-pulse-icon"></div>

                    <div className="recommended-info">
                      <h3>Matching in progress...</h3>

                      <p>
                        Looking for creators and peers interested in{' '}
                        <strong>{hobbies.join(', ')}</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="recommended-card">
                    <div className="recommended-info">
                      <p>
                        Select hobbies above to find recommended
                        collaborators!
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {/* Discover Tab */}
          {activeTab === 'Discover' && <Discover />}

          {/* My Projects Tab */}
          {activeTab === 'My Projects' && <MyProjects />}

          {/* Message Tab */}
          {activeTab === 'Message' && <Messages />}

          {/* Notifications Tab */}
          {activeTab === 'Notifications' && <Notifications />}

          {/* Settings Tab */}
          {activeTab === 'Settings' && <Settings />}

          {/* Other Tabs Placeholder */}
          {activeTab !== 'Home' &&
            activeTab !== 'Discover' &&
            activeTab !== 'My Projects' &&
            activeTab !== 'Message' &&
            activeTab !== 'Notifications' &&
            activeTab !== 'Settings' && (
              <div className="tab-empty-container">
                <div className="tab-empty-card">
                  <div className="tab-empty-icon"></div>

                  <h2>{activeTab}</h2>

                  <p>
                    This section is under active development. Check
                    back soon!
                  </p>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}

export default Home;