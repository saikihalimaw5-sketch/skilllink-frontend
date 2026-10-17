import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './Discover.css';

// HOBBIES DATA
const discoverSkillsData = [
  {
    id: 1,
    title: 'Photography',
    category: 'Creative',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500',
    tags: ['Camera', 'Portrait', 'Editing']
  },
  {
    id: 2,
    title: 'Music',
    category: 'Creative',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
    tags: ['Instruments', 'Production', 'Audio']
  },
  {
    id: 3,
    title: 'Gaming',
    category: 'Entertainment',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500',
    tags: ['Esports', 'PC', 'Console']
  },
  {
    id: 4,
    title: 'Art',
    category: 'Creative',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500',
    tags: ['Painting', 'DigitalArt', 'Sketching']
  },
  {
    id: 5,
    title: 'Sports',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500',
    tags: ['TeamSports', 'Athletics', 'Training']
  },
  {
    id: 6,
    title: 'Cooking',
    category: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500',
    tags: ['Culinary', 'Baking', 'Recipes']
  },
  {
    id: 7,
    title: 'Reading',
    category: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500',
    tags: ['Books', 'Literature', 'Learning']
  },
  {
    id: 8,
    title: 'Travel',
    category: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500',
    tags: ['Adventure', 'Exploring', 'Culture']
  },
  {
    id: 9,
    title: 'Cycling',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500',
    tags: ['Biking', 'Outdoor', 'Cardio']
  },
  {
    id: 10,
    title: 'Fitness',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500',
    tags: ['Gym', 'Workout', 'Health']
  }
];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const readLocalStorageJSON = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};


const getId = (value) => {
  if (!value) return '';

  if (typeof value === 'object') {
    return getId(
      value._id ||
      value.id ||
      value.userId ||
      value.user ||
      value.sub
    );
  }

  return String(value);
};

const getTokenUserId = (token) => {
  if (!token || token.split('.').length !== 3) return '';

  try {
    const encoded = token
      .split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const payload = JSON.parse(atob(encoded));

    return getId(
      payload.id ||
      payload._id ||
      payload.userId ||
      payload.sub ||
      payload.user
    );
  } catch {
    return '';
  }
};

const getPersonAvatar = (person) => {
  if (person?.profileImage) {
    return person.profileImage;
  }

  const style =
    person?.avatarStyle && person.avatarStyle !== 'default'
      ? person.avatarStyle
      : 'avataaars';

  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(
    person?.name || person?.username || 'SkillLink User'
  )}`;
};

function Discover({ onOpenProjectChat, initialTab = 'Hobbies' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [peopleSearch, setPeopleSearch] = useState('');

  // PEOPLE
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [currentUserHobbies, setCurrentUserHobbies] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [loadingPeople, setLoadingPeople] = useState(false);

  // CONNECTIONS
  const [connections, setConnections] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [profilePerson, setProfilePerson] = useState(null);
  const [connectionNote, setConnectionNote] = useState('');
  const [sendingConnection, setSendingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  const [cancelPerson, setCancelPerson] = useState(null);
  const [cancellingConnection, setCancellingConnection] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // PROJECTS
  const [projects, setProjects] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [joiningProjectIds, setJoiningProjectIds] = useState([]);
  const [projectMessage, setProjectMessage] = useState('');

  // PROJECT CANCELLATION
  const [cancelProject, setCancelProject] = useState(null);
  const [cancellingProject, setCancellingProject] = useState(false);
  const [cancelProjectError, setCancelProjectError] = useState('');

  const token = localStorage.getItem('token');

  // ==========================================
  // LOAD CONNECTIONS
  // ==========================================

  const fetchConnections = async () => {
    if (!token) {
      setConnections([]);
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/connections`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load connections.');
      }

      const items = Array.isArray(data.connections)
        ? data.connections
        : [];

      setConnections(items);
      return items;
    } catch (error) {
      console.error('Error loading connections:', error);
      return [];
    }
  };

 useEffect(() => {
  if (activeTab === 'People') {
    fetchConnections();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, token]);

  // ==========================================
  // CONNECTION STATUS
  // ==========================================


const getConnectionStatus = (person) => {
  const myId = getId(currentUserId);
  const personId = getId(person);

  if (!myId || !personId) return 'none';

  const connection = connections.find((item) => {
    const requesterId = getId(item.requester);
    const recipientId = getId(item.recipient);

    return (
      (requesterId === myId && recipientId === personId) ||
      (requesterId === personId && recipientId === myId)
    );
  });

  if (!connection) return 'none';

  const status = String(connection.status || '').toLowerCase();

  if (status === 'accepted') return 'accepted';

  if (status === 'pending') {
    return getId(connection.requester) === myId
      ? 'sent'
      : 'received';
  }

  return 'none';
};


  // ==========================================
  // OPEN CONNECT POPUP
  // ==========================================


const openConnectPopup = (person) => {
  console.log('Connect button clicked:', person);

  if (!getId(person)) {
    console.error('Missing person ID:', person);
    return;
  }

  setConnectionError('');
  setConnectionNote('');
  setSelectedPerson(person);
};


  // ==========================================
  // SEND CONNECTION REQUEST
  // ==========================================

const handleSendConnection = async (noteOverride) => {
    if (!selectedPerson?._id || sendingConnection) return;

    if (!token) {
      setConnectionError('Please log in again.');
      return;
    }

    setSendingConnection(true);
    setConnectionError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
       body: JSON.stringify({
  recipientId: String(selectedPerson._id),
  ...((
    typeof noteOverride === "string"
      ? noteOverride
      : connectionNote
  ).trim()
    ? {
        note: (
          typeof noteOverride === "string"
            ? noteOverride
            : connectionNote
        ).trim(),
      }
    : {}),
}),
});
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send request.');
      }

      await fetchConnections();
      setSelectedPerson(null);
      setConnectionNote('');
      setConnectionError('');
    } catch (error) {
      setConnectionError(error.message || 'Unable to send request.');
    } finally {
      setSendingConnection(false);
    }
  };

  // ==========================================
  // OPEN CONNECTION CANCEL CONFIRMATION
  // ==========================================

  const handleCancelConnection = (person) => {
    setCancelError('');
    setCancelPerson(person);
  };

  // ==========================================
  // CONFIRM CANCEL CONNECTION REQUEST
  // ==========================================

  const confirmCancelConnection = async () => {
    if (!cancelPerson?._id || cancellingConnection) return;

    if (!token) {
      setCancelError('Please log in again.');
      return;
    }

    const connection = connections.find((item) => {
      return (
        getId(item.requester) === String(currentUserId) &&
        getId(item.recipient) === String(cancelPerson._id) &&
        item.status === 'pending'
      );
    });

    if (!connection?._id) {
      setCancelError('Request not found. Please refresh and try again.');
      await fetchConnections();
      return;
    }

    setCancellingConnection(true);
    setCancelError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/connections/${encodeURIComponent(
          String(connection._id)
        )}/cancel`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel request.');
      }

      await fetchConnections();
      setCancelPerson(null);
      setCancelError('');
    } catch (error) {
      setCancelError(error.message || 'Unable to cancel request.');
    } finally {
      setCancellingConnection(false);
    }
  };

  // ==========================================
  // LOAD CURRENT USER, HOBBIES AND USERS
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const loadDiscoverPeople = async () => {
      setLoadingPeople(true);

      try {
        const savedUser =
          readLocalStorageJSON('user') ||
          readLocalStorageJSON('userData') ||
          readLocalStorageJSON('skilllink_user') ||
          {};


          const loggedInUserId =
            getId(savedUser?._id) ||
            getId(savedUser?.id) ||
            getId(savedUser?.userId) ||
            getId(savedUser?.sub) ||
            getId(savedUser?.user) ||
            getTokenUserId(token) ||
            '';


        const loggedInUserEmail =
          savedUser?.email?.toLowerCase().trim() || '';

        if (isMounted) {
          setCurrentUserId(String(loggedInUserId));
          setCurrentUserEmail(loggedInUserEmail);
        }

        let myHobbies = [];

        if (token) {
          try {
            const hobbiesResponse = await fetch(
              `${API_BASE_URL}/api/auth/my-hobbies`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            const hobbiesData = await hobbiesResponse
              .json()
              .catch(() => ({}));

            if (
              hobbiesResponse.ok &&
              Array.isArray(hobbiesData.hobbies)
            ) {
              myHobbies = hobbiesData.hobbies;
            }
          } catch (error) {
            console.error('Error loading current user hobbies:', error);
          }
        }

        if (myHobbies.length === 0) {
          const savedHobbies = readLocalStorageJSON('userHobbies', []);

          if (Array.isArray(savedHobbies)) {
            myHobbies = savedHobbies;
          }
        }

        if (isMounted) {
          setCurrentUserHobbies(myHobbies);
        }

        const usersResponse = await fetch(
          `${API_BASE_URL}/api/auth/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const usersData = await usersResponse
          .json()
          .catch(() => []);

        if (!usersResponse.ok || !Array.isArray(usersData)) {
          throw new Error('Failed to load registered users.');
        }

        if (isMounted) {
          setRegisteredUsers(usersData);
        }
      } catch (error) {
        console.error('Error loading Discover people:', error);

        if (isMounted) {
          setRegisteredUsers([]);
        }
      } finally {
        if (isMounted) {
          setLoadingPeople(false);
        }
      }
    };

    loadDiscoverPeople();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // ==========================================
  // LOAD PROJECTS
  // ==========================================

  const loadProjects = async () => {
    if (!token) {
      setProjects([]);
      setProjectsError('Please log in to discover and join projects.');
      return;
    }

    setLoadingProjects(true);
    setProjectsError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/discover`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load projects.');
      }

      if (!Array.isArray(data)) {
        throw new Error('The server returned an invalid projects response.');
      }

      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);

      setProjectsError(
        error.message || 'Unable to load projects. Please try again.'
      );

      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Projects') {
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  // ==========================================
  // JOIN PROJECT
  // ==========================================

  const handleJoinProject = async (projectId) => {
    if (!token) {
      setProjectMessage('Please log in before joining a project.');
      return;
    }

    if (joiningProjectIds.includes(projectId)) return;

    setJoiningProjectIds((previous) => [...previous, projectId]);
    setProjectMessage('');
    setProjectsError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/join`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok || response.status === 409) {
        await loadProjects();
      }

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send join request.');
      }

      setProjectMessage(
        data.message ||
          'Join request sent. Wait for the project owner to respond.'
      );
    } catch (error) {
      console.error('Error requesting to join project:', error);

      setProjectMessage(
        error.message || 'Unable to send join request. Please try again.'
      );
    } finally {
      setJoiningProjectIds((previous) =>
        previous.filter((id) => id !== projectId)
      );
    }
  };

  // ==========================================
  // OPEN PROJECT CANCEL CONFIRMATION
  // ==========================================

  const handleCancelProjectRequest = (project) => {
    setCancelProjectError('');
    setCancelProject(project);
  };

  // ==========================================
  // CONFIRM CANCEL PROJECT JOIN REQUEST
  // ==========================================

  const confirmCancelProjectRequest = async () => {
    if (!cancelProject?._id || cancellingProject) return;

    if (!token) {
      setCancelProjectError('Please log in again.');
      return;
    }

    const requests = Array.isArray(cancelProject.joinRequests)
      ? cancelProject.joinRequests
      : [];


const request = requests.find((item) => {
  const requesterId = getId(
    item.user || item.requester
  );

  return (
    requesterId === getId(currentUserId) &&
    String(item.status || '').toLowerCase() === 'pending'
  );
});


    if (!request?._id) {
      setCancelProjectError(
        'Pending request not found. Please refresh and try again.'
      );

      await loadProjects();
      return;
    }

    setCancellingProject(true);
    setCancelProjectError('');
    setProjectMessage('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(
          String(cancelProject._id)
        )}/join-requests/${encodeURIComponent(
          String(request._id)
        )}/cancel`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to cancel project join request.'
        );
      }

      setCancelProject(null);
      setCancelProjectError('');

      setProjectMessage(
        data.message || 'Project join request cancelled successfully.'
      );

      await loadProjects();
    } catch (error) {
      console.error('Cancel project join request error:', error);

      setCancelProjectError(
        error.message || 'Unable to cancel project join request.'
      );
    } finally {
      setCancellingProject(false);
    }
  };

  // ==========================================
  // HOBBY CATEGORIES
  // ==========================================

  const categories = [
    'All',
    'Creative',
    'Entertainment',
    'Fitness',
    'Lifestyle'
  ];

  const filteredSkills = discoverSkillsData.filter((item) => {
    return (
      selectedCategory === 'All' ||
      item.category === selectedCategory
    );
  });

  // ==========================================
  // COUNT USERS PER HOBBY
  // ==========================================

  const getHobbyUserCount = (hobbyName) => {
    return registeredUsers.filter((user) => {
      if (!Array.isArray(user.hobbies)) return false;

      return user.hobbies.some(
        (hobby) =>
          String(hobby).toLowerCase().trim() ===
          String(hobbyName).toLowerCase().trim()
      );
    }).length;
  };

  // ==========================================
  // MATCH PEOPLE BY SHARED HOBBIES
  // ==========================================

  const matchedPeople = registeredUsers
    .filter((person) => {
      if (
        currentUserId &&
        person._id &&
        String(person._id) === String(currentUserId)
      ) {
        return false;
      }

      if (
        currentUserEmail &&
        person.email &&
        person.email.toLowerCase().trim() === currentUserEmail
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
        currentUserHobbies.some(
          (userHobby) =>
            String(userHobby).toLowerCase().trim() ===
            String(personHobby).toLowerCase().trim()
        )
      );

      return {
        ...person,
        id: person._id,
        name: person.username || 'SkillLink User',
        username: person.username
          ? `@${person.username.replace(/^@/, '')}`
          : '@user',
        hobbies: personHobbies,
        sharedHobbyList: sharedHobbies,
        sharedHobbies: sharedHobbies.length
      };
    })
    .filter((person) => person.sharedHobbies > 0)
    .sort((a, b) => b.sharedHobbies - a.sharedHobbies);

  // ==========================================
  // SEARCH PEOPLE
  // ==========================================

  const filteredPeople = matchedPeople.filter((person) => {
    const search = peopleSearch.toLowerCase().trim();

    if (!search) return true;

    return (
      person.name.toLowerCase().includes(search) ||
      person.username.toLowerCase().includes(search) ||
      person.email?.toLowerCase().includes(search) ||
      person.hobbies.some((hobby) =>
        String(hobby).toLowerCase().includes(search)
      )
    );
  });

  // ==========================================
  // PROJECT HELPERS
  // ==========================================

  const getProjectOwnerName = (project) => {
  if (project.owner && typeof project.owner === 'object') {
    return project.owner.username || 'Project Creator';
  }

  return 'Project Creator';
};

  const getProjectMembers = (project) => {
    return Array.isArray(project.members) ? project.members : [];
  };

 const hasJoinedProject = (project) => {
  if (!currentUserId) return false;

  return getProjectMembers(project).some((member) => {
    const memberId = getId(member.user || member);

    return memberId === String(currentUserId);
  });
};


const hasPendingRequest = (project) => {
  const myId = getId(currentUserId);

  if (!myId) return false;

  const requests = Array.isArray(project.joinRequests)
    ? project.joinRequests
    : [];

  return requests.some((request) => {
    const requesterId = getId(
      request.user || request.requester
    );

    return (
      requesterId === myId &&
      String(request.status || '').toLowerCase() === 'pending'
    );
  });
};


  const filteredProjects = projects.filter((project) => {
    const search = projectSearch.toLowerCase().trim();

    if (!search) return true;

    const skills = Array.isArray(project.skillsNeeded)
      ? project.skillsNeeded.join(' ')
      : '';

    const searchableText = [
      project.title,
      project.description,
      project.category,
      skills,
      getProjectOwnerName(project)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(search);
  });

  const formatScheduleDate = (date) => {
    if (!date) return '';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="discover-container">
      {/* HEADER & CONTROLS */}

        <div className="discover-main-tabs">
              {[
                {
                  name: 'Hobbies',
                  icon: (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3l2.4 5.2 5.6.7-4.1 4 .9 5.6-4.8-2.7-4.8 2.7.9-5.6-4.1-4 5.6-.7L12 3z" />
                    </svg>
                  )
                },
                {
                  name: 'People',
                  icon: (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="9" cy="8" r="3.5" />
                      <path d="M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20z" />
                      <path d="M16 5a3.5 3.5 0 0 1 0 6.8M18 14a5.5 5.5 0 0 1 3.5 5.1V20h-4" />
                    </svg>
                  )
                },
                {
                  name: 'Projects',
                  icon: (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="7" width="18" height="14" rx="2" />
                      <path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" />
                    </svg>
                  )
                }
              ].map((tab) => (
                <button
                  key={tab.name}
                  type="button"
                  className={`discover-tab-btn ${
                    activeTab === tab.name ? 'active' : ''
                  }`}
                  onClick={() => setActiveTab(tab.name)}
                >
                  <span className="discover-tab-icon">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>


        {activeTab === 'Hobbies' && (
          <div className="discover-category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`discover-pill ${
                  selectedCategory === cat ? 'active' : ''
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

      {activeTab === 'Hobbies' && (
        <div className="discover-grid-wrapper">
          {filteredSkills.length > 0 ? (
            <div className="discover-cards-grid">
              {filteredSkills.map((skill) => {
                const hobbyUserCount = getHobbyUserCount(skill.title);

                return (
                  <div key={skill.id} className="discover-card">
                    <div className="discover-card-img-container">
                      <img
                        src={skill.image}
                        alt={skill.title}
                        className="discover-card-img"
                      />

                      <span className="discover-badge">
                        {skill.category}
                      </span>
                    </div>

                    <div className="discover-card-body">
                      <h3 className="discover-card-title">
                        {skill.title}
                      </h3>

                      <div className="discover-tags-list">
                        {skill.tags.map((tag) => (
                          <span key={tag} className="discover-tag-pill">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="discover-hobby-people-count">
                        👥 {hobbyUserCount}{' '}
                        {hobbyUserCount === 1 ? 'person' : 'people'} interested
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-icon"></div>

              <p className="empty-text">
                No skills or hobbies found in this category.
              </p>
            </div>
          )}
        </div>
      )}

      {/* PEOPLE */}
      {activeTab === 'People' && (
        <div className="discover-people-section">
          <div className="people-section-header">
            <div>
              <p className="people-subheading">FIND YOUR COMMUNITY</p>
              <h2 className="people-section-title">
                <span className="discover-heading-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="9" cy="8" r="3.5" />
                    <path d="M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20z" />
                    <path d="M16 5a3.5 3.5 0 0 1 0 6.8M18 14a5.5 5.5 0 0 1 3.5 5.1V20h-4" />
                  </svg>
                </span>
                Discover People
              </h2>

              <p className="people-section-description">
                Explore people who share your interests.
              </p>
            </div>
          </div>

          <div className="discover-people-search-wrapper">
            <span className="discover-people-search-icon"></span>

            <input
              type="text"
              value={peopleSearch}
              onChange={(e) => setPeopleSearch(e.target.value)}
              placeholder="Search by username or hobby..."
              className="discover-people-search-input"
            />
          </div>

          {loadingPeople ? (
            <div className="discover-people-empty">
              <div className="discover-people-empty-icon">🔄</div>
              <p>Loading people...</p>
              <span>Finding people who share your interests.</span>
            </div>
          ) : filteredPeople.length > 0 ? (
            <div className="discover-people-grid">
              {filteredPeople.map((person) => {
                const status = getConnectionStatus(person);

                return (
                  <div key={person.id} className="discover-people-card">
                    <div className="discover-people-profile-header">
                      <div className="discover-people-avatar">
                        <img
                          src={getPersonAvatar(person)}
                          alt={`${person.name || 'User'}'s avatar`}
                          className="discover-people-avatar-img"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                person.fullName ||
                                  person.name ||
                                  'SkillLink User'
                              )}`;
                          }}
                        />
                      </div>

                      <div className="discover-people-profile-info">
                        <h3 className="discover-people-name">
                          {person.name}
                        </h3>

                        <p className="discover-people-username">
                          {person.username}
                        </p>
                      </div>
                    </div>

                    <div className="discover-shared-hobbies">
                      <span className="discover-shared-label">
                        {person.sharedHobbies} shared{' '}
                        {person.sharedHobbies === 1 ? 'hobby' : 'hobbies'}
                      </span>
                    </div>

                    <div className="discover-people-hobbies">
                      {person.hobbies?.map((hobby, index) => {
                        const isMatch = person.sharedHobbyList?.some(
                          (sharedHobby) =>
                            String(sharedHobby).toLowerCase() ===
                            String(hobby).toLowerCase()
                        );

                        return (
                          <span
                            key={`${hobby}-${index}`}
                            className={`discover-hobby-tag ${
                              isMatch ? 'matched' : ''
                            }`}
                          >
                            {isMatch && (
                              <span className="match-icon">✓ </span>
                            )}
                            {hobby}
                          </span>
                        );
                      })}
                    </div>

                    <div className="discover-people-actions">
                      <button
                        type="button"
                        className="discover-view-profile-btn"
                        onClick={() => setProfilePerson(person)}
                      >
                        View Profile
                      </button>

                      {status === 'accepted' ? (
                        <button
                          type="button"
                          className="discover-connect-btn"
                          disabled
                        >
                          ✓ Connected
                        </button>
                      ) : status === 'sent' ? (
                        <button
                          type="button"
                          className="discover-connect-btn"
                          onClick={() => handleCancelConnection(person)}
                        >
                          Cancel Request
                        </button>
                      ) : status === 'received' ? (
                        <button
                          type="button"
                          className="discover-connect-btn"
                          disabled
                        >
                          Request Received
                        </button>
                      ) : (


                    <button
                      type="button"
                      className="discover-connect-btn"
                      onClick={() => openConnectPopup(person)}
                    >
                      Connect
                    </button>


                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="discover-people-empty">
              <div className="discover-people-empty-icon"></div>
              <p>No people found.</p>
              <span>Try searching for another name or hobby.</span>
            </div>
          )}
        </div>
      )}

      {/* PROJECTS */}
      {activeTab === 'Projects' && (
        <div className="discover-projects-section">
          <div className="discover-projects-header">
            <div>
              <p className="people-subheading">BUILD SOMETHING TOGETHER</p>
              <h2 className="people-section-title">
              <span className="discover-heading-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="7" width="18" height="14" rx="2" />
                  <path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" />
                </svg>
              </span>
              Discover Projects
            </h2>
              <p className="people-section-description">
                Find active projects created by other SkillLink members.
              </p>
            </div>

            <button
              type="button"
              className="discover-project-refresh-btn"
              onClick={loadProjects}
              disabled={loadingProjects}
            >
              {loadingProjects ? 'Loading...' : '↻ Refresh'}
            </button>
          </div>

          <div className="discover-project-search-wrapper">
            <span className="discover-project-search-icon"></span>

            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Search projects, skills, categories..."
              className="discover-project-search-input"
            />
          </div>

          {projectMessage && (
            <div className="discover-project-message">
              {projectMessage}
            </div>
          )}

          {loadingProjects ? (
            <div className="discover-project-empty">
              <div className="discover-project-empty-icon">🔄</div>
              <h3>Loading projects...</h3>
              <p>Looking for active projects created by other users.</p>
            </div>
          ) : projectsError ? (
            <div className="discover-project-empty">
              <div className="discover-project-empty-icon">⚠️</div>
              <h3>Unable to load projects</h3>
              <p>{projectsError}</p>

              <button
                type="button"
                className="discover-project-refresh-btn"
                onClick={loadProjects}
              >
                Try Again
              </button>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="discover-projects-grid">
              {filteredProjects.map((project) => {
                const members = getProjectMembers(project);
                const alreadyJoined = hasJoinedProject(project);
                const pendingRequest = hasPendingRequest(project);
                const isJoining = joiningProjectIds.includes(project._id);

                const skills = Array.isArray(project.skillsNeeded)
                  ? project.skillsNeeded
                  : [];

                return (
                  <article
                    key={project._id}
                    className="discover-project-card"
                  >
                    <div className="discover-project-card-top">
                      <span className="discover-project-category">
                        {project.category || 'General'}
                      </span>

                      <span className="discover-project-status">
                        {project.status || 'Active'}
                      </span>
                    </div>

                    <div className="discover-project-card-body">
                      <h3 className="discover-project-title">
                        {project.title || 'Untitled Project'}
                      </h3>

                      <p className="discover-project-description">
                        {project.description || 'No description provided.'}
                      </p>

                      <div className="discover-project-owner">
                        <div className="discover-project-owner-avatar">
                          <img
                            src={getPersonAvatar(project.owner)}
                            alt={`${getProjectOwnerName(project)}'s avatar`}
                            className="discover-project-owner-avatar-img"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                  getProjectOwnerName(project)
                                )}`;
                            }}
                          />
                        </div>

                        <div>
                          <span className="discover-project-owner-label">
                            Created by
                          </span>

                          <p className="discover-project-owner-name">
                            {getProjectOwnerName(project)}
                          </p>
                        </div>
                      </div>

                      {skills.length > 0 && (
                        <div className="discover-project-skills">
                          <span className="discover-project-skills-label">
                            Skills needed
                          </span>

                          <div className="discover-project-tags">
                            {skills.map((skill, index) => (
                              <span
                                key={`${skill}-${index}`}
                                className="discover-project-tag"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(project.scheduleDate || project.scheduleTime) && (

                      <div className="discover-project-meta">
                        {(project.scheduleDate || project.scheduleTime) && (
                          <div className="discover-project-schedule">
                            <span>📅</span>

                            <span>
                              {project.scheduleDate
                                ? formatScheduleDate(project.scheduleDate)
                                : 'Date not specified'}

                              {project.scheduleTime
                                ? ` · ${project.scheduleTime}`
                                : ''}
                            </span>
                          </div>
                        )}

                      </div>

                      )}

                      <div className="discover-project-members">
                        <span>👥</span>

                        <span>
                          {members.length}{' '}
                          {members.length === 1 ? 'member' : 'members'}
                        </span>
                      </div>

                        <button
                          type="button"
                          className={`discover-project-join-btn ${
                            alreadyJoined
                              ? 'joined'
                              : pendingRequest
                                ? 'pending'
                                : ''
                          }`}
                          onClick={() => {
                            if (pendingRequest) {
                              handleCancelProjectRequest(project);
                            } else {
                              handleJoinProject(project._id);
                            }
                          }}
                          disabled={alreadyJoined || isJoining}
                        >
                          {isJoining
                            ? 'Sending Request...'
                            : alreadyJoined
                              ? '✓ Joined Project'
                              : pendingRequest
                                ? 'Cancel Request'
                                : 'Join Project'}
                        </button>

                        {alreadyJoined && (
                        <button
                          type="button"
                          className="discover-project-chat-btn"
                          onClick={() => onOpenProjectChat?.(project)}
                        >
                          💬 Group Chat
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="discover-project-empty">
              <div className="discover-project-empty-icon">📁</div>

              <h3>
                {projectSearch
                  ? 'No matching projects'
                  : 'No active projects yet'}
              </h3>

              <p>
                {projectSearch
                  ? 'Try another keyword or search for a different skill.'
                  : 'When other users create active projects, they will appear here.'}
              </p>

              {projectSearch && (
                <button
                  type="button"
                  className="discover-project-refresh-btn"
                  onClick={() => setProjectSearch('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW PROFILE POPUP */}
{profilePerson &&
  createPortal(
    <div
      className="discover-modal-overlay"
      onClick={() => setProfilePerson(null)}
    >
      <div
        className="discover-modal discover-profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="discover-modal-close"
          onClick={() => setProfilePerson(null)}
          aria-label="Close profile"
        >
          ×
        </button>

        <div className="discover-profile-header">
          <div className="discover-profile-avatar">
            <img
              src={getPersonAvatar(profilePerson)}
              alt={`${profilePerson.name || "User"}'s avatar`}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    profilePerson.name || "SkillLink User"
                  )}`;
              }}
            />
          </div>

          <div className="discover-profile-info">
            <h2>{profilePerson.name || "Unknown User"}</h2>
            <p>{profilePerson.username || "@user"}</p>
          </div>
        </div>

        {profilePerson.bio && (
          <p className="discover-profile-bio">{profilePerson.bio}</p>
        )}

        <div className="discover-profile-section">
          <h3>🎮 Hobbies & Interests</h3>

          <div className="discover-profile-hobbies">
            {(profilePerson.hobbies || []).length > 0 ? (
              profilePerson.hobbies.map((hobby, index) => {
                const hobbyIcons = {
                  Gaming: "🎮",
                  Music: "🎵",
                  Art: "🎨",
                  Reading: "📖",
                  Travel: "✈️",
                  Cycling: "🚴",
                  Fitness: "🏋️",
                  Photography: "📷",
                  Sports: "🏀",
                  Cooking: "🍳",
                };

                const icon =
                  hobbyIcons[String(hobby).trim()] || "✨";

                return (
                  <span
                    key={`${hobby}-${index}`}
                    className="discover-profile-hobby"
                  >
                    <span>{icon}</span>
                    {hobby}
                  </span>
                );
              })
            ) : (
              <p className="discover-profile-empty">
                No hobbies listed yet.
              </p>
            )}
          </div>
        </div>

        <div className="discover-profile-shared">
          <span>👥</span>
          <span>
            You share {profilePerson.sharedHobbies || 0}{" "}
            {(profilePerson.sharedHobbies || 0) === 1
              ? "hobby"
              : "hobbies"}.
          </span>
        </div>

        {getConnectionStatus(profilePerson) === "none" ? (
          <button
            type="button"
            className="discover-profile-connect-btn"
            onClick={() => {
              const person = profilePerson;
              setProfilePerson(null);
              openConnectPopup(person);
            }}
          >
            <svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
  aria-hidden="true"
>
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <path d="M19 8v6" />
  <path d="M16 11h6" />
</svg>
Connect
          </button>
        ) : (
          <div className="discover-profile-status">
            {getConnectionStatus(profilePerson) === "accepted"
              ? "✓ You are connected"
              : getConnectionStatus(profilePerson) === "sent"
                ? "Connection request sent"
                : "This person has already sent you a request"}
          </div>
        )}
      </div>
    </div>,
    document.body
  )}


          {/* CONNECT POPUP */}
          {selectedPerson &&
            createPortal(
              <div
                className="discover-modal-overlay"
                onClick={() => {
                  if (!sendingConnection) setSelectedPerson(null);
                }}
              >
                <div
                  className="discover-modal discover-connect-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="discover-modal-close"
                    onClick={() => setSelectedPerson(null)}
                    disabled={sendingConnection}
                  >
                    ×
                  </button>

                  <h2>Connect with {selectedPerson.name}</h2>
                  <p className="discover-modal-description">
                    Send a connection request to get to know each other!
                  </p>

                  <div className="discover-connect-profile">
                  <div className="discover-connect-avatar">
                    <img
                      src={getPersonAvatar(selectedPerson)}
                      alt={`${selectedPerson.name}'s profile`}
                      className="discover-connect-avatar-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                            selectedPerson.name || "SkillLink User"
                          )}`;
                      }}
                    />
                  </div>

                  <div className="discover-connect-profile-info">
                    <strong>{selectedPerson.name}</strong>
                    <span>{selectedPerson.username}</span>
                  </div>
</div>

                  <div className="discover-connect-interests">
                    <h4>
                      Shared Interests ({selectedPerson.sharedHobbyList?.length || 0})
                    </h4>
                    <div className="discover-connect-tags">
                      {(selectedPerson.sharedHobbyList || []).map((hobby) => (
                        <span key={hobby}>🎮 {hobby}</span>
                      ))}
                    </div>
                  </div>

                  <div className="discover-note-heading">
                    <label htmlFor="discover-connection-note">Add a note</label>
                    <span>Optional</span>
                  </div>

                  <textarea
                    id="discover-connection-note"
                    className="discover-modal-textarea"
                    placeholder="Hi! We have similar interests. Let's connect!"
                    value={connectionNote}
                    onChange={(e) => setConnectionNote(e.target.value)}
                    maxLength={20}
                    rows={2}
                    disabled={sendingConnection}
                  />

                  <p className="discover-modal-character-count">
                    {connectionNote.length}/20
                  </p>

                  {connectionError && (
                    <p className="discover-modal-error">{connectionError}</p>
                  )}

                  <div className="discover-modal-actions">
                    <button
                      type="button"
                      className="discover-modal-secondary"
                      onClick={() => setSelectedPerson(null)}
                      disabled={sendingConnection}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="discover-modal-primary"
                      onClick={() => handleSendConnection()}
                      disabled={sendingConnection}
                    >
                      {sendingConnection ? "Sending..." : "Send Request"}
                    </button>

                    <button
                      type="button"
                      className="discover-modal-primary"
                      onClick={() => {
                        setConnectionNote("");
                        // Send an empty note explicitly to avoid stale state.
                        handleSendConnection("");
                      }}
                      disabled={sendingConnection}
                    >
                      Send Without Note
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}


      {/* CANCEL CONNECTION REQUEST CONFIRMATION */}
      {cancelPerson &&
        createPortal(
          <div
            className="discover-modal-overlay"
            onClick={() => {
              if (!cancellingConnection) {
                setCancelPerson(null);
                setCancelError('');
              }
            }}
          >
            <div
             className="discover-modal discover-cancel-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="discover-modal-close"
                onClick={() => {
                  if (!cancellingConnection) {
                    setCancelPerson(null);
                    setCancelError('');
                  }
                }}
                disabled={cancellingConnection}
                aria-label="Close cancel confirmation"
              >
                ×
              </button>
              <div className="discover-cancel-warning">!</div>
              <h2>Cancel Connection Request?</h2>

              <p className="discover-modal-description">
                Are you sure you want to cancel your request to{' '}
                <strong>{cancelPerson.name}</strong>?
              </p>

              {cancelError && (
                <p className="discover-modal-error">{cancelError}</p>
              )}
                <p className="discover-cancel-info">
                  You can send another connection request in the future.
                </p>
              <div className="discover-modal-actions">
                <button
                  type="button"
                  className="discover-modal-secondary"
                  onClick={() => {
                    setCancelPerson(null);
                    setCancelError('');
                  }}
                  disabled={cancellingConnection}
                >
                  Keep Request
                </button>

                <button
                  type="button"
                  className="discover-modal-danger"
                  onClick={confirmCancelConnection}
                  disabled={cancellingConnection}
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

      {/* CANCEL PROJECT JOIN REQUEST CONFIRMATION */}
      {cancelProject &&
        createPortal(
          <div
            className="discover-modal-overlay"
            onClick={() => {
              if (!cancellingProject) {
                setCancelProject(null);
                setCancelProjectError('');
              }
            }}
          >
            <div
              className="discover-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="discover-modal-close"
                onClick={() => {
                  if (!cancellingProject) {
                    setCancelProject(null);
                    setCancelProjectError('');
                  }
                }}
                disabled={cancellingProject}
                aria-label="Close cancel project request confirmation"
              >
                ×
              </button>

              <h2>Cancel Project Join Request?</h2>

              <p className="discover-modal-description">
                Are you sure you want to cancel your request to join{' '}
                <strong>
                  {cancelProject.title || 'this project'}
                </strong>
                ?
              </p>

              {cancelProjectError && (
                <p className="discover-modal-error">
                  {cancelProjectError}
                </p>
              )}

              <div className="discover-modal-actions">
                <button
                  type="button"
                  className="discover-modal-secondary"
                  onClick={() => {
                    setCancelProject(null);
                    setCancelProjectError('');
                  }}
                  disabled={cancellingProject}
                >
                  Keep Request
                </button>

                <button
                  type="button"
                  className="discover-modal-danger"
                  onClick={confirmCancelProjectRequest}
                  disabled={cancellingProject}
                >
                  {cancellingProject
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

export default Discover;