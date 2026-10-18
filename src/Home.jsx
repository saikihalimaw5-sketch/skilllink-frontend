import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import Discover from './Discover';
import Settings from './Settings';
import Messages from './Messages';
import Notifications from './Notifications';
import MyProjects from './MyProjects';
import MySkillPortfolio from './MySkillPortfolio';
import './Home.css';

// Hobby icons
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
const DashboardIcon = ({ type }) => {
  const icons = {
    projects: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M8 4V2.5h8V4M8 10h8M8 14h5" />
      </>
    ),
    collaborations: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M15 15a5 5 0 0 1 6 5" />
      </>
    ),
    messages: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
        <path d="M8 12h8M8 9h5" />
      </>
    ),
    projectMessages: (
  <>
    <rect x="3" y="4" width="18" height="14" rx="3" />
    <path d="M7 9h10M7 13h6M8 18v3l4-3" />
  </>
),
    requests: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2M16 3l3 3" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[type]}
    </svg>
  );
};

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

function Home({ onGoToHobbies }) {
  const navigate = useNavigate();
  const location = useLocation();


const [shouldOpenCreateProject, setShouldOpenCreateProject] =
  useState(false);
  const [createProjectSource, setCreateProjectSource] = useState(null);

const handleCreateProjectOpened = useCallback(() => {
  setShouldOpenCreateProject(false);
}, []);


  const [userName, setUserName] = useState('User');
  const [userAvatar, setUserAvatar] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');

  const [hobbies, setHobbies] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [connections, setConnections] = useState([]);


  const [activeTab, setActiveTab] = useState('Home');
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [openProjectChatProject, setOpenProjectChatProject] = useState(null);
  const [unreadProjects, setUnreadProjects] = useState([]);

  const [showLogout, setShowLogout] = useState(false);
  const profileRef = useRef(null);

  // Connection request modal
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [connectionNote, setConnectionNote] = useState('');
  const [sendingConnection, setSendingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Cancel request confirmation modal
  const [cancelPerson, setCancelPerson] = useState(null);
  const [cancellingConnection, setCancellingConnection] =
    useState(false);
  const [cancelError, setCancelError] = useState('');

  const [stats, setStats] = useState({
  projects: 0,
  collaborations: 0,
  messages: 0,
  projectMessages: 0,
  requests: 0,
});

  // Get the currently logged-in user's ID consistently
  const getCurrentUserId = useCallback(() => {
    if (userId) {
      return String(userId);
    }

    try {
      const savedUser =
        JSON.parse(localStorage.getItem('user')) ||
        JSON.parse(localStorage.getItem('userData')) ||
        JSON.parse(localStorage.getItem('skilllink_user'));

      return String(
        savedUser?.id ||
          savedUser?._id ||
          savedUser?.userId ||
          savedUser?.sub ||
          ''
      );
    } catch {
      return '';
    }
  }, [userId]);

  // Load connection requests and accepted connections
  const fetchConnections = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setConnections([]);
      return [];
    }

    try {
      const response = await fetch(`${API_URL}/api/connections`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to load connections:', data);
        return [];
      }

      if (Array.isArray(data.connections)) {
        setConnections(data.connections);
        return data.connections;
      }

      console.error('Unexpected connections response:', data);
      return [];
    } catch (error) {
      console.error('Error loading connections:', error);
      return [];
    }
  }, []);
  // Fetch dashboard statistics from MongoDB
  const fetchDashboardStats = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setStats({
        projects: 0,
        collaborations: 0,
        messages: 0,
        requests: 0,
      });
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/dashboard/stats`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
const unreadResponse = await fetch(
  `${API_URL}/api/projects/messages/unread`,
  {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }
);

const unreadData = unreadResponse.ok
  ? await unreadResponse.json()
  : { projectMessages: 0 };
  setUnreadProjects(
  Array.isArray(unreadData.unreadProjects)
    ? unreadData.unreadProjects
    : []
);
      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to fetch dashboard statistics.'
        );
      }

      setStats({
  projects: Number(data.projects) || 0,
  collaborations: Number(data.collaborations) || 0,
  messages: Number(data.messages) || 0,
  projectMessages: Number(unreadData.projectMessages) || 0,
  requests: Number(data.requests) || 0,
});
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, []);
  // Refresh registered users
  const fetchRegisteredUsers = useCallback(async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/auth/users`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setRegisteredUsers(data);
        return data;
      }

      console.error('Failed to load registered users:', data);
      setRegisteredUsers([]);
      return [];
    } catch (error) {
      console.error('Error fetching registered users:', error);
      setRegisteredUsers([]);
      return [];
    }
  }, []);

  // Load user data
  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      const token = localStorage.getItem('token');

      // Get currently logged-in user
      let savedUser = null;

      try {
        savedUser =
          JSON.parse(localStorage.getItem('user')) ||
          JSON.parse(localStorage.getItem('userData')) ||
          JSON.parse(localStorage.getItem('skilllink_user'));
      } catch (error) {
        console.error('Unable to read saved user:', error);
      }


        if (savedUser && isMounted) {
          const currentUser = savedUser.user || savedUser;

          const fullUserString =
            currentUser.fullName ||
            currentUser.name ||
            currentUser.username;

          const email = String(currentUser.email || '')
            .trim()
            .toLowerCase();

          let savedProfile = null;

          if (email) {
            try {
              savedProfile = JSON.parse(
                localStorage.getItem(`skillLinkProfile:${email}`) || 'null'
              );
            } catch {
              savedProfile = null;
            }

            setUserEmail(email);
          }

          const displayName =
            savedProfile?.username ||
            currentUser.username ||
            currentUser.fullName ||
            currentUser.name ||
            'User';

          setUserName(
            savedProfile?.username
              ? displayName
              : fullUserString
                ? fullUserString.split(' ')[0]
                : displayName
          );

          const savedUserId =
            currentUser.id ||
            currentUser._id ||
            currentUser.userId ||
            currentUser.sub;

          if (savedUserId) {
            setUserId(String(savedUserId));
          }

          if (currentUser.profileImage || currentUser.avatar) {
  setUserAvatar(currentUser.profileImage || currentUser.avatar);
}
        }
      // Fetch current user's hobbies
      if (token) {
        try {
          const response = await fetch(
            `${API_URL}/api/auth/my-hobbies`,
            {
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();

          if (response.ok && Array.isArray(data.hobbies)) {
            if (isMounted) {
              setHobbies(data.hobbies);
            }

            localStorage.setItem(
              'userHobbies',
              JSON.stringify(data.hobbies)
            );
          } else {
            throw new Error(
              data.message || 'Failed to load hobbies.'
            );
          }
        } catch (error) {
          console.error('Error fetching hobbies:', error);

          let savedHobbies = [];

          try {
            savedHobbies =
              JSON.parse(localStorage.getItem('userHobbies')) || [];
          } catch {
            savedHobbies = [];
          }

          if (isMounted) {
            setHobbies(savedHobbies);
          }
        }
      } else {
        let savedHobbies = [];

        try {
          savedHobbies =
            JSON.parse(localStorage.getItem('userHobbies')) || [];
        } catch {
          savedHobbies = [];
        }

        if (isMounted) {
          setHobbies(savedHobbies);
        }
      }

      if (isMounted) {
        await fetchRegisteredUsers();
      }
    };

    fetchUserData();
    fetchConnections();
    fetchDashboardStats();

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
      isMounted = false;
      document.removeEventListener('mousedown', handleClickOutside);
    };
      }, [
        fetchConnections,
        fetchRegisteredUsers,
        fetchDashboardStats,
      ]);

  useEffect(() => {
    const syncProfileAvatar = () => {
      try {
        const parseStored = (key) => {
          try {
            return JSON.parse(localStorage.getItem(key) || 'null');
          } catch {
            return null;
          }
        };

        const rawUser = parseStored('user');
        const user =
          rawUser?.user ||
          (rawUser && Object.keys(rawUser).length > 0 ? rawUser : null) ||
          parseStored('userData') ||
          parseStored('skilllink_user') ||
          {};

        const email = String(user?.email || userEmail)
          .trim()
          .toLowerCase();

        const profileKey = email
          ? `skillLinkProfile:${email}`
          : '';

        const savedProfile = profileKey
          ? parseStored(profileKey)
          : null;

        const username =
          savedProfile?.username ||
          user?.username ||
          user?.userName ||
          userName ||
          'User';
          if (savedProfile?.username) {
            setUserName(savedProfile.username);
          }

        const avatarStyle =
  savedProfile?.avatarStyle ||
  user?.avatarStyle ||
  'avataaars';

const defaultAvatar =
  `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(
    user?.id || user?._id || username
  )}`;

const avatar =
  savedProfile?.profileImage ||
  user?.profileImage ||
  user?.avatar ||
  defaultAvatar;

setUserAvatar(avatar);
      } catch (error) {
        console.error('Failed to sync profile avatar:', error);
      }
    };

    syncProfileAvatar();

    window.addEventListener('skilllink-profile-updated', syncProfileAvatar);
    window.addEventListener('storage', syncProfileAvatar);

    return () => {
      window.removeEventListener('skilllink-profile-updated', syncProfileAvatar);
      window.removeEventListener('storage', syncProfileAvatar);
    };
  }, [userEmail, userName]);

  // Refresh connection status when returning to Home
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }

    fetchConnections();
    fetchDashboardStats();
  }, [
    location.state?.activeTab,
    fetchConnections,
    fetchDashboardStats,
  ]);

// Automatically refresh registered profiles
useEffect(() => {
  const refreshHomeData = () => {
    fetchRegisteredUsers();
    fetchConnections();
    fetchDashboardStats();
  };

  const refreshProfiles = () => {
    fetchRegisteredUsers();
  };

  window.addEventListener('focus', refreshHomeData);

  window.addEventListener(
    'skilllink-profile-updated',
    refreshProfiles
  );

  const interval = setInterval(() => {
  if (document.visibilityState === 'visible') {
    refreshProfiles();
    fetchDashboardStats();
  }
}, 10000);

  return () => {
    window.removeEventListener('focus', refreshHomeData);

    window.removeEventListener(
      'skilllink-profile-updated',
      refreshProfiles
    );

    clearInterval(interval);
  };
}, [
  fetchRegisteredUsers,
  fetchConnections,
  fetchDashboardStats,
]);


  // Remove hobby
  const handleRemoveHobby = async (hobbyToRemove, event) => {
    event.stopPropagation();

    const updatedHobbies = hobbies.filter(
      (hobby) => hobby !== hobbyToRemove
    );

    setHobbies(updatedHobbies);

    localStorage.setItem(
      'userHobbies',
      JSON.stringify(updatedHobbies)
    );

    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/auth/save-hobbies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            hobbies: updatedHobbies,
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to sync hobbies with server.');
      }
    } catch (error) {
      console.error('Failed to sync hobbies:', error);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('skilllink_user');

    navigate('/login');
  };

  // Edit hobbies
  const handleEditHobbiesClick = () => {
    if (onGoToHobbies) {
      onGoToHobbies();
    } else {
      navigate('/hobbies');
    }
  };


  const handleStatCardClick = (type) => {
  const destinations = {
  projects: 'My Projects',
  collaborations: 'My Projects',
  messages: 'Message',
  projectMessages: 'My Projects',
  requests: 'Notifications',
};

  const destination = destinations[type];
  if (!destination) return;

  setActiveTab(destination);

  if (type === 'projects') {
    setOpenProjectChatProject(null);
  }

  if (type === 'collaborations') {
    setOpenProjectChatProject({ openCollaboration: true });
  }
  if (type === 'projectMessages') {
  const latestUnreadProject = unreadProjects[0];

  if (latestUnreadProject?.projectId) {
    setOpenProjectChatProject({
      id: latestUnreadProject.projectId,
      _id: latestUnreadProject.projectId,
      title: latestUnreadProject.title,
      openGroupChat: true,
    });
  } else {
    setOpenProjectChatProject({ openProjectMessages: true });
  }
}
  if (type === 'messages') {
    setSelectedChatUser(null);
  }

  if (type === 'projects' || type === 'collaborations' || type === 'requests') {
    fetchConnections();
  }
};


  // Open the selected person's conversation
  const handleMessagePerson = (person) => {
    if (!person?._id) {
      console.error(
        'Cannot open conversation: missing user ID.',
        person
      );
      return;
    }

    setSelectedChatUser({
  _id: String(person._id),
  fullName: person.username || person.fullName || 'SkillLink Member',
  name: person.username || person.fullName || 'SkillLink Member',
  username: person.username || '',
  avatar: person.profileImage || person.avatar || '',
  email: person.email || '',
});

    setActiveTab('Message');
  };

  // Determine the current connection status
  const getConnectionStatus = (person) => {
    if (!person?._id) {
      return 'none';
    }

    const currentUserId = getCurrentUserId();
    const personId = String(person._id);

    const connection = connections.find((item) => {
      const requesterId = String(
        item.requester?._id || item.requester || ''
      );

      const recipientId = String(
        item.recipient?._id || item.recipient || ''
      );

      return (
        (requesterId === currentUserId &&
          recipientId === personId) ||
        (requesterId === personId &&
          recipientId === currentUserId)
      );
    });

    if (!connection) {
      return 'none';
    }

    if (connection.status === 'accepted') {
      return 'accepted';
    }

    if (connection.status === 'pending') {
      const requesterId = String(
        connection.requester?._id || connection.requester || ''
      );

      return requesterId === currentUserId ? 'sent' : 'received';
    }

    // A declined request should not permanently block reconnecting.
    return 'none';
  };

  // Send connection request to backend
  const handleSendConnection = async (includeNote = true) => {
    if (!selectedPerson?._id) {
      setConnectionError('Please select a person to connect with.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setConnectionError(
        'Your session has expired. Please log in again.'
      );
      return;
    }

    setSendingConnection(true);
    setConnectionError('');

    try {
      const response = await fetch(`${API_URL}/api/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: String(selectedPerson._id),
          ...(includeNote && connectionNote.trim()
            ? { note: connectionNote.trim() }
            : {}),
        }),
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error('The server returned an invalid response.');
      }

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to send connection request.'
        );
      }

      await fetchConnections();

      setSelectedPerson(null);
      setConnectionNote('');
      setConnectionError('');
    } catch (error) {
      console.error('Send connection error:', error);

      setConnectionError(
        error.message || 'Unable to connect to the server.'
      );
    } finally {
      setSendingConnection(false);
    }
  };

  // Open the cancel request confirmation modal
  const handleCancelConnection = (person) => {
    if (!person?._id) {
      return;
    }

    setCancelError('');
    setCancelPerson(person);
  };

  // Close the cancel request confirmation modal
  const closeCancelModal = () => {
    if (cancellingConnection) {
      return;
    }

    setCancelPerson(null);
    setCancelError('');
  };

  // Confirm and cancel the sent connection request
  const confirmCancelConnection = async () => {
    if (!cancelPerson?._id || cancellingConnection) {
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setCancelError(
        'Your session has expired. Please log in again.'
      );
      return;
    }

    const currentUserId = getCurrentUserId();
    const personId = String(cancelPerson._id);

    const connection = connections.find((item) => {
      const requesterId = String(
        item.requester?._id || item.requester || ''
      );

      const recipientId = String(
        item.recipient?._id || item.recipient || ''
      );

      return (
        requesterId === currentUserId &&
        recipientId === personId &&
        item.status === 'pending'
      );
    });

    if (!connection?._id) {
      setCancelError(
        'Request not found. Your connection status has been refreshed. Please try again.'
      );

      await fetchConnections();
      return;
    }

    setCancellingConnection(true);
    setCancelError('');

    try {
      const response = await fetch(
        `${API_URL}/api/connections/${encodeURIComponent(
          String(connection._id)
        )}/cancel`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          'The server returned an invalid response. Check your backend.'
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to cancel connection request.'
        );
      }

      await fetchConnections();

      setCancelPerson(null);
      setCancelError('');
    } catch (error) {
      console.error('Cancel connection error:', error);

      setCancelError(
        error.message || 'Unable to cancel the connection request.'
      );

      await fetchConnections();
    } finally {
      setCancellingConnection(false);
    }
  };

  // Match registered MongoDB users by hobbies
  const matchedPeople = registeredUsers
    .filter((person) => {
      const currentUserId = getCurrentUserId();

      if (
        currentUserId &&
        person._id &&
        String(person._id) === currentUserId
      ) {
        return false;
      }

      if (
        userEmail &&
        person.email &&
        person.email.toLowerCase().trim() === userEmail
      ) {
        return false;
      }

      return true;
    })
    .map((person) => {
      const personHobbies = Array.isArray(person.hobbies)
        ? person.hobbies
        : [];

      const sharedHobbies = personHobbies.filter((personHobby) =>
        hobbies.some(
          (userHobby) =>
            String(userHobby).toLowerCase().trim() ===
            String(personHobby).toLowerCase().trim()
        )
      );

      return {
        ...person,
        hobbies: personHobbies,
        sharedHobbies,
      };
    })
    .filter((person) => person.sharedHobbies.length > 0)
    .sort((a, b) => b.sharedHobbies.length - a.sharedHobbies.length);

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
      {/* Sidebar */}
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
              onClick={() => {
              if (item.name === 'My Projects') {
                setCreateProjectSource(null);
                setShouldOpenCreateProject(false);
              }

              setActiveTab(item.name);
                if (item.name === 'Home') {
                fetchRegisteredUsers();
                fetchConnections();
                fetchDashboardStats();
              }

                if (item.name === 'Notifications') {
                  fetchConnections();
                }
              }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.name}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main */}
      <div className="dashboard-main">
        {/* Header */}
        <header className="top-header">
            <div className="header-profile-wrapper" ref={profileRef}>
              <div className="header-profile-btn">
                <img
                  src={
                    userAvatar ||
                   `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
  userName
)}`
                  }
                  alt="Profile Avatar"
                  className="header-avatar-img"
                />

                <span className="header-username">{userName}</span>
              </div>

              <button
                type="button"
                className="profile-dropdown-toggle"
                onClick={() => setShowLogout((prev) => !prev)}
                aria-label="Toggle logout menu"
                aria-expanded={showLogout}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showLogout && (
                <div className="logout-popup">
                  <button
                    type="button"
                    className="btn-logout"
                    onClick={handleLogout}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>

        </header>

        {/* Dashboard */}
        <main className="dashboard-body">
          {activeTab === 'Home' && (
            <>
              {/* Welcome */}
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
                  <div
                      className="stat-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleStatCardClick('projects')}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleStatCardClick('projects');
                        }
                      }}
                    >
                      <div className="stat-icon-bg">
                        <DashboardIcon type="projects" />
                      </div>
                    <div className="stat-info">
                      <span className="stat-number">
                        {stats.projects}
                      </span>
                      <span className="stat-label">Projects</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon-bg">
                        <DashboardIcon type="collaborations" />
                      </div>
                    <div className="stat-info">
                      <span className="stat-number">
                        {stats.collaborations}
                      </span>
                      <span className="stat-label">
                        Collaborations
                      </span>
                    </div>
                  </div>


                  <div
                    className="stat-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStatCardClick('messages')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleStatCardClick('messages');
                      }
                    }}
                  >

                    <div className="stat-icon-bg">
                        <DashboardIcon type="messages" />
                      </div>
                    <div className="stat-info">
                      <span className="stat-number">
                        {stats.messages}
                      </span>
                      <span className="stat-label">Messages</span>
                    </div>
                  </div>
                  {/* PROJECT MESSAGES */}
<div
  className="stat-card"
  role="button"
  tabIndex={0}
  onClick={() => handleStatCardClick('projectMessages')}
  onKeyDown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStatCardClick('projectMessages');
    }
  }}
>
  <div className="stat-icon-bg">
<DashboardIcon type="projectMessages" />
  </div>

  <div className="stat-info">
    <span className="stat-number">
      {stats.projectMessages}
    </span>
    <span className="stat-label">
      Project Messages
    </span>
  </div>
</div>


                  <div
                    className="stat-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStatCardClick('requests')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleStatCardClick('requests');
                      }
                    }}
                  >
                    <div className="stat-icon-bg">
                      <DashboardIcon type="requests" />
                    </div>

                    <div className="stat-info">
                      <span className="stat-number">
                        {stats.requests}
                      </span>
                      <span className="stat-label">New Request</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Hobbies */}
              <section className="home-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">
                      Your Selected Hobbies &amp; Interests
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
                          onClick={(event) =>
                            handleRemoveHobby(hobby, event)
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

              {/* Recommended People */}
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
                  matchedPeople.length > 0 ? (
                    <div className="people-grid">
                      {matchedPeople.map((person) => {
                        const connectionStatus =
                          getConnectionStatus(person);

                        return (
                          <div
                            key={person._id}
                            className="person-card"
                          >
                            <div className="person-card-header">
                              <img
                           src={
  person.profileImage ||
  `https://api.dicebear.com/9.x/${
    person.avatarStyle || 'avataaars'
  }/svg?seed=${encodeURIComponent(
    String(person._id || person.username || 'SkillLink User')
  )}`
}
                            alt={person.username || person.fullName || 'SkillLink User'}
                            className="person-avatar"
                            onError={(e) => {
  const fallback = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
    String(person._id || person.username || 'SkillLink User')
  )}`;

  if (e.currentTarget.src !== fallback) {
    e.currentTarget.src = fallback;
  }
}}
                          />

                              <div className="person-basic-info">
                                <h3 className="person-name">
                                {person.username || person.fullName || 'SkillLink User'}
                              </h3>

                                <span className="person-role">
                                  {person.role || 'SkillLink Member'}
                                </span>
                              </div>
                            </div>

                            <div className="person-hobbies">
                              <span className="hobbies-label">
                                Shared Interests
                              </span>

                              <div className="person-hobby-tags">
                                {person.hobbies.map(
                                  (hobby, index) => {
                                    const isMatched =
                                      person.sharedHobbies.some(
                                        (shared) =>
                                          String(shared)
                                            .toLowerCase()
                                            .trim() ===
                                          String(hobby)
                                            .toLowerCase()
                                            .trim()
                                      );

                                    return (
                                      <span
                                        key={`${hobby}-${index}`}
                                        className={`person-hobby-tag ${
                                          isMatched ? 'matched' : ''
                                        }`}
                                      >
                                        {HOBBY_ICONS[hobby] || ''}{' '}
                                        {hobby}
                                      </span>
                                    );
                                  }
                                )}
                              </div>
                            </div>

                            <div className="match-count">
                              <span>
                                {person.sharedHobbies.length}
                              </span>{' '}
                              {person.sharedHobbies.length === 1
                                ? 'shared hobby'
                                : 'shared hobbies'}
                            </div>

                            {connectionStatus === 'accepted' ? (
                              <button
                                type="button"
                                className="btn-connect"
                                onClick={() =>
                                  handleMessagePerson(person)
                                }
                              >
                                Message
                              </button>
                            ) : connectionStatus === 'sent' ? (
                              <button
                                type="button"
                                className="btn-connect"
                                onClick={() =>
                                  handleCancelConnection(person)
                                }
                              >
                                Cancel Request
                              </button>
                            ) : connectionStatus === 'received' ? (
                              <button
                                type="button"
                                className="btn-connect"
                                onClick={() =>
                                  setActiveTab('Notifications')
                                }
                              >
                                View Request
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-connect"
                                onClick={() => {
                                  setSelectedPerson(person);
                                  setConnectionNote('');
                                  setConnectionError('');
                                }}
                              >
                                Connect
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state-card">
                      <div className="empty-icon">🔍</div>
                      <p className="empty-text">
                        No matching profiles found for your current
                        hobbies yet.
                      </p>
                      <p className="section-desc">
                        Try adding more hobbies to discover more people.
                      </p>

                      <button
                        className="btn-primary-sm"
                        onClick={handleEditHobbiesClick}
                      >
                        Add More Hobbies                      </button>
                    </div>
                  )
                ) : (
                  <div className="empty-state-card">
                    <div className="empty-icon">👥</div>
                    <p className="empty-text">
                      Select hobbies above to find recommended collaborators!
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
            </>
          )}

         {/* Discover */}
          {activeTab === 'Discover' && (
            <Discover
              initialTab="Projects"
              onOpenProjectChat={(project) => {
                setOpenProjectChatProject(project);
                setActiveTab('My Projects');
              }}
            />
          )}


             {/* My Projects */}
{activeTab === 'My Projects' && (
  <MyProjects
    openCreateProject={shouldOpenCreateProject}
    onCreateProjectOpened={handleCreateProjectOpened}
    onReturnToPortfolio={() => {
  setCreateProjectSource(null);
  setActiveTab('My Skill & Portfolio');
}}
    createProjectSource={createProjectSource}
    openProjectChatProject={openProjectChatProject}
    onBackToDiscoverProjects={() => {
      setOpenProjectChatProject(null);
      setActiveTab('Discover');
    }}
  />
)}



          {/* Message */}
          {activeTab === 'Message' && (
            <Messages selectedUser={selectedChatUser} />
          )}

          {/* Notifications */}
          {activeTab === 'Notifications' && <Notifications />}


            {activeTab === 'My Skill & Portfolio' && (
            <MySkillPortfolio
              onAddProject={() => {
                setCreateProjectSource('portfolio');
                setActiveTab('My Projects');
                setShouldOpenCreateProject(true);
              }}
                onEditHobbies={handleEditHobbiesClick}
              />
            )}


          {/* Settings */}
          {activeTab === 'Settings' && <Settings />}

          {/* Other tabs */}
          {activeTab !== 'Home' &&
            activeTab !== 'Discover' &&
            activeTab !== 'My Projects' &&
            activeTab !== 'Message' &&
            activeTab !== 'Notifications' &&
            activeTab !== 'My Skill & Portfolio' &&
            activeTab !== 'Settings' && (
              <div className="tab-empty-container">
                <div className="tab-empty-card">
                  <div className="tab-empty-icon"></div>
                  <h2>{activeTab}</h2>
                  <p>
                    This section is under active development. Check back soon!
                  </p>
                </div>
              </div>
            )}
        </main>

        {/* Connection Request Modal */}
        {selectedPerson && (
          <div
            className="connection-modal-overlay"
            onClick={() => {
              if (!sendingConnection) {
                setSelectedPerson(null);
                setConnectionNote('');
                setConnectionError('');
              }
            }}
          >
            <div
              className="connection-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="connection-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="connection-modal-close"
                aria-label="Close"
                disabled={sendingConnection}
                onClick={() => {
                  setSelectedPerson(null);
                  setConnectionNote('');
                  setConnectionError('');
                }}
              >
                ×
              </button>

              <h2
                  id="connection-modal-title"
                  className="connection-modal-heading"
                >
                  Connect with {selectedPerson.username || selectedPerson.fullName || 'SkillLink Member'}
                </h2>

              <p className="connection-modal-subtitle">
                Send a connection request to get to know each other!
              </p>

              <div className="connection-person-preview">
                <img
                  src={
                    selectedPerson.profileImage ||
                    `https://api.dicebear.com/9.x/${
                      selectedPerson.avatarStyle || 'avataaars'
                    }/svg?seed=${encodeURIComponent(
                      selectedPerson.username || 'SkillLink User'
                    )}`
                  }
                  alt={selectedPerson.username || 'SkillLink User'}
                  className="connection-person-avatar"
                />

                <div className="connection-person-info">
                  <h3 className="connection-person-name">
                    {selectedPerson.username || selectedPerson.fullName || 'SkillLink Member'}
                  </h3>

                  <p className="connection-person-role">
                    {selectedPerson.role || 'SkillLink Member'}
                  </p>
                </div>
              </div>

              <p className="connection-shared-title">
                Shared Interests (
                {selectedPerson.sharedHobbies?.length || 0})
              </p>

              <div className="connection-shared-tags">
                {(selectedPerson.sharedHobbies || []).map(
                  (hobby, index) => (
                    <span
                      key={`${hobby}-${index}`}
                      className="connection-shared-tag"
                    >
                      {HOBBY_ICONS[hobby] || '✨'} {hobby}
                    </span>
                  )
                )}
              </div>

              <label
                className="connection-note-label"
                htmlFor="connection-note"
              >
                <span>Add a note</span>
                <span className="connection-note-optional">
                  Optional
                </span>
              </label>

              <textarea
                id="connection-note"
                className="connection-note-input"
                placeholder="Hi! We have similar interests. Let's connect!"
                value={connectionNote}
                maxLength={20}
                onChange={(event) =>
                  setConnectionNote(event.target.value)
                }
                disabled={sendingConnection}
              />

              <div className="connection-note-counter">
                {connectionNote.length}/20
              </div>

              {connectionError && (
                <div className="connection-feedback error" role="alert">
                  {connectionError}
                </div>
              )}

              <div className="connection-modal-actions">
                <button
                  type="button"
                  className="connection-btn-cancel"
                  disabled={sendingConnection}
                  onClick={() => {
                    setSelectedPerson(null);
                    setConnectionNote('');
                    setConnectionError('');
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="connection-btn-send"
                  disabled={sendingConnection}
                  onClick={() => handleSendConnection(true)}
                >
                  {sendingConnection ? 'Sending...' : 'Send Request'}
                </button>

                <button
                  type="button"
                  className="connection-btn-skip"
                  disabled={sendingConnection}
                  onClick={() => handleSendConnection(false)}
                >
                  Send Without Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* End of dashboard-main */}

      {/* Cancel Request Confirmation Modal */}
      {cancelPerson &&
        createPortal(
          <div
            className="cancel-request-overlay"
            onClick={closeCancelModal}
          >
            <div
              className="cancel-request-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-request-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="cancel-request-icon">
                <span>!</span>
              </div>

              <h2
                id="cancel-request-title"
                className="cancel-request-title"
              >
                Cancel Connection Request?
              </h2>

              <p className="cancel-request-message">
                Are you sure you want to cancel your connection request to{' '}
                <strong>
                  {cancelPerson.fullName ||
                    cancelPerson.name ||
                    cancelPerson.username ||
                    'this person'}
                </strong>
                ?
              </p>

              <p className="cancel-request-description">
                You can send another connection request in the future.
              </p>

              {cancelError && (
                <div className="cancel-request-error" role="alert">
                  {cancelError}
                </div>
              )}

              <div className="cancel-request-actions">
                <button
                  type="button"
                  className="cancel-request-keep"
                  disabled={cancellingConnection}
                  onClick={closeCancelModal}
                >
                  Keep Request
                </button>

                <button
                  type="button"
                  className="cancel-request-confirm"
                  disabled={cancellingConnection}
                  onClick={confirmCancelConnection}
                >
                  {cancellingConnection
                    ? 'Cancelling...'
                    : 'Yes, Cancel Request'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default Home;