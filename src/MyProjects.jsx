
import React, { useState, useEffect } from 'react';
import './MyProjects.css';
import { io } from 'socket.io-client';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

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

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '',
  skillInput: '',
  skillsNeeded: [],
  scheduleDate: '',
  scheduleTime: '',
};

const getToken = () => localStorage.getItem('token');

const getLocalDate = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const getLocalTime = () => {
  const date = new Date();

  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join(':');
};

async function apiRequest(path, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error(
      'Please log in again. Your login session was not found.'
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed (${response.status}). Please try again.`
    );
  }

  return data;
}

// Format the selected date and time for project cards.
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

// Normalize projects returned by the backend.

function normalizeProject(project) {
  const category = project.category || '';
  const hobby = HOBBIES_LIST.find((item) => item.name === category);

  // Preserve actual member objects from MongoDB.
  const memberList = Array.isArray(project.members)
    ? project.members
    : [];

  const members = Array.isArray(project.members)
    ? project.members.length
    : Number(project.members || 1);

  const rawDate = project.scheduleDate || '';
  const rawTime = project.scheduleTime || '';
  let scheduleDate = '';
  let scheduleTime = '';

  if (rawDate) {
    if (typeof rawDate === 'string' && rawDate.includes('T')) {
      scheduleDate = rawDate.slice(0, 10);

      if (rawTime) {
        scheduleTime = String(rawTime).slice(0, 5);
      } else {
        const parsedDate = new Date(rawDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          scheduleTime = parsedDate.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
        }
      }
    } else {
      scheduleDate = String(rawDate).slice(0, 10);
      scheduleTime = rawTime ? String(rawTime).slice(0, 5) : '';
    }
  } else if (rawTime) {
    scheduleTime = String(rawTime).slice(0, 5);
  }

  const formattedDate = formatProjectSchedule(scheduleDate, scheduleTime);

  return {
    ...project,
    id: project._id || project.id,
    title: project.title || '',
    category,
    description: project.description || '',
    skillsNeeded: Array.isArray(project.skillsNeeded)
      ? project.skillsNeeded
      : [],
    scheduleDate,
    scheduleTime,
    memberList,
    members,
    date: formattedDate || 'Schedule not set',
    status: project.status || 'Active',
    icon: hobby?.icon || project.icon || '📁',
  };
}

// User avatar: saved profile picture or DiceBear fallback
const getUserAvatar = (user) => {
  if (user?.profileImage) return user.profileImage;

  const style =
    user?.avatarStyle && user.avatarStyle !== 'default'
      ? user.avatarStyle
      : 'avataaars';

  const seed =
    user?.username ||
    user?.email ||
    user?._id ||
    'SkillLink User';

  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
};

function UserAvatar({ user, name }) {
  const [imageError, setImageError] = useState(false);

  const avatar = getUserAvatar(user);

  useEffect(() => {
    setImageError(false);
  }, [avatar]);

  return (
    <img
      className="collab-user-avatar"
      src={
        imageError
          ? 'https://api.dicebear.com/9.x/avataaars/svg?seed=SkillLink'
          : avatar
      }
      alt={`${name || 'User'} avatar`}
      onError={() => setImageError(true)}
    />
  );
}


export default function MyProjects({
  openCreateProject = false,
  onCreateProjectOpened,
  createProjectSource = null,
  onReturnToPortfolio,
  openProjectChatProject = null,
  onBackToDiscoverProjects,
  onProjectChatOpened,
}) {
  const [activeTab, setActiveTab] = useState('Active');
  const [isCreating, setIsCreating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

const [selectedProject, setSelectedProject] = useState(null);
const [collabTab, setCollabTab] = useState('Members');
const [projectRequests, setProjectRequests] = useState([]);
const [detailsLoading, setDetailsLoading] = useState(false);
const [requestActionId, setRequestActionId] = useState(null);
const [collabError, setCollabError] = useState('');
const [chatMessages, setChatMessages] = useState([]);
const [chatInput, setChatInput] = useState('');
const [chatLoading, setChatLoading] = useState(false);
const [chatSending, setChatSending] = useState(false);
const [chatError, setChatError] = useState('');
const [currentUserId, setCurrentUserId] = useState('');
const [currentUser, setCurrentUser] = useState(null);
const [chatMenuOpen, setChatMenuOpen] = useState(false);
const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
const [chatDeleteTarget, setChatDeleteTarget] = useState(null);
const [chatDeleting, setChatDeleting] = useState(false);
useEffect(() => {
  const loadCurrentUser = async () => {
    try {
      const data = await apiRequest('/api/auth/my-profile');

      const user = data.user || data;

      setCurrentUserId(String(user._id || user.id || ''));
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  loadCurrentUser();
}, []);
const loadProjects = async () => {
  setLoading(true);
  setErrorMessage('');

  try {
    const data = await apiRequest('/api/projects/my');
    const projectList = Array.isArray(data)
      ? data
      : data.projects || [];

    setProjects(projectList.map(normalizeProject));
  } catch (error) {
    console.error('Load projects error:', error);
    setErrorMessage(error.message || 'Failed to load your projects.');
  } finally {
    setLoading(false);
  }
};
  // Load the current user's projects.

const openProjectDetails = async (project) => {
  setSelectedProject(project);
  setCollabTab('Members');
  setDetailsLoading(true);
  setCollabError('');
  setProjectRequests([]);

  try {
    const data = await apiRequest(`/api/projects/${project.id}`);
    const freshProject = normalizeProject(data.project || data);

    setSelectedProject(freshProject);

    try {
      const requestData = await apiRequest(
        `/api/projects/${project.id}/requests`
      );

      setProjectRequests(requestData.requests || []);
    } catch {
      // Only the project owner can view pending requests.
      setProjectRequests([]);
    }
  } catch (error) {
    setCollabError(error.message || 'Unable to load project details.');
  } finally {
    setDetailsLoading(false);
  }
};

const refreshCollaboration = async () => {
  if (!selectedProject?.id) return;

  try {
    const data = await apiRequest(
      `/api/projects/${selectedProject.id}`
    );

    setSelectedProject(normalizeProject(data.project || data));

    try {
      const requestData = await apiRequest(
        `/api/projects/${selectedProject.id}/requests`
      );

      setProjectRequests(requestData.requests || []);
    } catch {
      // Non-owners cannot view pending requests.
    }
  } catch (error) {
    console.error('Refresh collaboration error:', error);
  }
};

useEffect(() => {
  if (!openProjectChatProject) return;
if (openProjectChatProject.openProjectMessages) {
  setSelectedProject(null);
  setActiveTab('Active');
  return;
}
  if (openProjectChatProject.openGroupChat) {
  const project = normalizeProject(openProjectChatProject);

  setSelectedProject(project);
  setCollabTab('Chat');
  setChatMessages([]);
  setChatInput('');
  setChatError('');

  openProjectDetails(project).then(() => {
    setCollabTab('Chat');
  });

  return;
}

  const project = normalizeProject(openProjectChatProject);

  setSelectedProject(project);
  setCollabTab('Chat');
  setChatMessages([]);
  setChatInput('');
  setChatError('');

  openProjectDetails(project).then(() => {
    setCollabTab('Chat');
  });
}, [openProjectChatProject]);

// ==========================================
// GROUP CHAT - LOAD MESSAGES
// ==========================================

const loadChatMessages = async (projectId, silent = false) => {
  if (!projectId) return;

  if (!silent) {
    setChatLoading(true);
    setChatError('');
  }

  try {
    const data = await apiRequest(
      `/api/projects/${projectId}/messages`
    );

    const messages = Array.isArray(data)
      ? data
      : Array.isArray(data.messages)
        ? data.messages
        : [];

    setChatMessages(
  [...messages].sort(
    (a, b) =>
      new Date(a.createdAt || 0).getTime() -
      new Date(b.createdAt || 0).getTime()
  )
);
  } catch (error) {
    console.error('Load chat messages error:', error);
    setChatError(error.message || 'Failed to load chat messages.');
  } finally {
  if (!silent) {
    setChatLoading(false);
  }
}
};
// ==========================================
// GROUP CHAT - SEND MESSAGE
// ==========================================

const handleSendChatMessage = async (event) => {
  event.preventDefault();

  if (!selectedProject?.id || chatSending) return;

  const message = chatInput.trim();

  if (!message) return;

  if (message.length > 2000) {
    setChatError('Message cannot exceed 2000 characters.');
    return;
  }

  setChatSending(true);
  setChatError('');

  try {
    const data = await apiRequest(
      `/api/projects/${selectedProject.id}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      }
    );

    const savedMessage = data.message || data;

    setChatMessages((previous) => {
      const exists = previous.some(
        (item) => String(item._id) === String(savedMessage._id)
      );

      return exists ? previous : [...previous, savedMessage];
    });

    setChatInput('');
  } catch (error) {
    setChatError(error.message || 'Failed to send message.');
  } finally {
    setChatSending(false);
  }
};

useEffect(() => {
  if (!selectedProject?.id) return;

  const intervalId = setInterval(() => {
    refreshCollaboration();

    if (collabTab === 'Chat') {
      loadChatMessages(selectedProject.id, true);
    }
  }, 4000);

  return () => clearInterval(intervalId);
}, [selectedProject?.id, collabTab]);

const handleJoinRequest = async (requestId, decision) => {
  if (!selectedProject?.id) return;

  const projectId = selectedProject.id;

  setRequestActionId(requestId);
  setCollabError('');

  try {
    const result = await apiRequest(
      `/api/projects/${projectId}/requests/${requestId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ decision }),
      }
    );

    if (result.project) {
      setSelectedProject(normalizeProject(result.project));
    }

    await loadProjects();

    const requestData = await apiRequest(
      `/api/projects/${projectId}/requests`
    );

    setProjectRequests(requestData.requests || []);

    setCollabError('');
  } catch (error) {
    setCollabError(
      error.message || 'Unable to update join request.'
    );
  } finally {
    setRequestActionId(null);
  }
};

const confirmChatDeletion = async () => {
  if (!selectedProject?.id || !chatDeleteTarget || chatDeleting) {
    return;
  }

  const projectId = selectedProject.id;
  const target = chatDeleteTarget;

  setChatDeleting(true);
  setChatError('');

  try {
    if (target.type === 'for-me' || target.type === 'for-everyone') {
      await apiRequest(
  `/api/projects/${projectId}/messages/${target.id}${
    target.type === 'for-me' ? '/for-me' : ''
  }`,
  { method: 'DELETE' }
);

      // Automatically remove the deleted message
      setChatMessages((prev) =>
        prev.filter(
          (msg) => String(msg._id) !== String(target.id)
        )
      );
    } else {
      await apiRequest(
        `/api/projects/${projectId}/messages`,
        { method: 'DELETE' }
      );

      // Automatically clear the current user's chat
      setChatMessages([]);
    }

    setChatDeleteTarget(null);
    setChatMenuOpen(false);
    setOpenMessageMenuId(null);

  } catch (error) {
    console.error('Chat deletion error:', error);
    setChatError(error.message || 'Failed to delete message.');
  } finally {
    setChatDeleting(false);
  }
};


  useEffect(() => {
    loadProjects();
  }, []);

useEffect(() => {
  const token = getToken();
  const projectId = selectedProject?.id;

  if (!token || !projectId) return undefined;

  let cancelled = false;

  const socket = io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  const handleProjectUpdate = (data) => {
    if (String(data?.projectId) !== String(projectId)) return;

    refreshCollaboration();
    loadProjects();
  };

  const handleNewProjectMessage = (message) => {
    const messageProjectId =
      message?.project?._id ||
      message?.project?.id ||
      message?.project;

    if (String(messageProjectId) !== String(projectId)) return;

    setChatMessages((previous) => {
      if (
        previous.some(
          (item) => String(item._id) === String(message?._id)
        )
      ) {
        return previous;
      }

      return [...previous, message].sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
    });
  };

  socket.on('project_join_request_created', handleProjectUpdate);
  socket.on('project_join_request_updated', handleProjectUpdate);
  const handleDeletedProjectMessage = (data) => {
  if (String(data?.projectId) !== String(projectId)) return;

  setChatMessages((previous) =>
    previous.filter(
      (message) =>
        String(message._id) !== String(data.messageId)
    )
  );
};
  socket.on('project_message_created', handleNewProjectMessage);
  socket.on('project_message_deleted', handleDeletedProjectMessage);

  if (collabTab === 'Chat') {
    setChatMessages([]);
    setChatError('');
    loadChatMessages(projectId);

    socket.emit('join_project_chat', { projectId }, (result) => {
      if (cancelled) return;

      if (!result?.success) {
        setChatError(
          result?.message || 'Unable to join project group chat.'
        );
      }
    });
  }

  return () => {
    cancelled = true;

    socket.off('project_join_request_created', handleProjectUpdate);
    socket.off('project_join_request_updated', handleProjectUpdate);
    socket.off('project_message_created', handleNewProjectMessage);
    socket.off('project_message_deleted', handleDeletedProjectMessage);

    socket.emit('leave_project_chat', { projectId });
    socket.disconnect();
  };
}, [selectedProject?.id, collabTab]);


  useEffect(() => {
    if (openCreateProject) {
      setErrorMessage('');
      setSuccessMessage('');
      setIsCreating(true);
      onCreateProjectOpened?.();
    }
  }, [openCreateProject, onCreateProjectOpened]);

const validateField = (name, value, form = newProject) => {
  const today = getLocalDate();
  const currentTime = getLocalTime();

  switch (name) {
    case 'title': {
      const title = String(value || '').trim();

      if (!title) return 'Please enter a project title.';
      if (title.length < 3) {
        return 'Project title must be at least 3 characters.';
      }
      if (title.length > 50) {
        return 'Project title must not exceed 50 characters.';
      }
      return '';
    }

    case 'description': {
      const description = String(value || '').trim();

      if (!description) {
        return 'Please provide a project description.';
      }
      if (description.length < 10) {
        return 'Description must be at least 10 characters.';
      }
      if (description.length > 300) {
        return 'Description must not exceed 300 characters.';
      }
      return '';
    }

    case 'category':
      return value ? '' : 'Please choose a hobby category.';

    case 'skillsNeeded':
      return value?.length
        ? ''
        : 'Please add at least one skill under Skills Needed.';

    case 'scheduleDate':
      if (!value) return 'Please choose a schedule date.';
      if (value < today) {
        return 'Please choose today or a future date.';
      }
      if (
        value === today &&
        form.scheduleTime &&
        form.scheduleTime <= currentTime
      ) {
        return 'The selected time has passed. Please choose a future time.';
      }
      return '';

    case 'scheduleTime':
      if (!value) return 'Please choose a schedule time.';
      if (!form.scheduleDate) {
        return 'Please choose a schedule date first.';
      }
      if (form.scheduleDate < today) {
        return 'Please choose today or a future date.';
      }
      if (
        form.scheduleDate === today &&
        value <= currentTime
      ) {
        return 'Please choose a future time.';
      }
      return '';

    default:
      return '';
  }
};

const handleFieldChange = (name, value) => {
  const updatedForm = {
    ...newProject,
    [name]: value,
  };

  setNewProject(updatedForm);

  if (touched[name] || submitted) {
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, updatedForm),
    }));
  }

  // Changing the date or time can affect the other field's validity.
  if (
    name === 'scheduleDate' &&
    (touched.scheduleTime || submitted)
  ) {
    setFieldErrors((prev) => ({
      ...prev,
      scheduleTime: validateField(
        'scheduleTime',
        updatedForm.scheduleTime,
        updatedForm
      ),
    }));
  }

  if (
    name === 'scheduleTime' &&
    (touched.scheduleDate || submitted)
  ) {
    setFieldErrors((prev) => ({
      ...prev,
      scheduleDate: validateField(
        'scheduleDate',
        updatedForm.scheduleDate,
        updatedForm
      ),
    }));
  }

  setErrorMessage('');
};

const handleFieldBlur = (name) => {
  setTouched((prev) => ({
    ...prev,
    [name]: true,
  }));

  setFieldErrors((prev) => ({
    ...prev,
    [name]: validateField(name, newProject[name]),
  }));
};

const showFieldError = (name) =>
  (touched[name] || submitted) && fieldErrors[name];


  // Add a selected skill.

  const handleAddSkill = () => {
  const skill = newProject.skillInput.trim();

  if (!skill) {
    setErrorMessage('Please choose a skill first.');
    return;
  }

  if (
    newProject.skillsNeeded.some((item) => {
      const skillName =
        typeof item === 'string' ? item : item?.name;

      return skillName?.toLowerCase() === skill.toLowerCase();
    })
  ) {
    setErrorMessage('This skill has already been added.');
    return;
  }

  const updatedSkills = [...newProject.skillsNeeded, skill];

  const updatedForm = {
    ...newProject,
    skillsNeeded: updatedSkills,
    skillInput: '',
  };

  setNewProject(updatedForm);
  setErrorMessage('');

  if (touched.skillsNeeded || submitted) {
    setFieldErrors((prev) => ({
      ...prev,
      skillsNeeded: validateField(
        'skillsNeeded',
        updatedSkills,
        updatedForm
      ),
    }));
  }
};
const handleRemoveSkill = (index) => {
  const updatedSkills = newProject.skillsNeeded.filter(
    (_, skillIndex) => skillIndex !== index
  );

  const updatedForm = {
    ...newProject,
    skillsNeeded: updatedSkills,
  };

  setNewProject(updatedForm);

  if (touched.skillsNeeded || submitted) {
    setFieldErrors((prev) => ({
      ...prev,
      skillsNeeded: validateField(
        'skillsNeeded',
        updatedSkills,
        updatedForm
      ),
    }));
  }

  setErrorMessage('');
};

  // Publish a new project.
  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (publishing) return;


    setPublishing(true);
    setErrorMessage('');
    setSuccessMessage('');

const title = newProject.title.trim();
const description = newProject.description.trim();

const updatedForm = {
  ...newProject,
  title,
  description,
};

const errors = {
  title: validateField('title', title, updatedForm),
  description: validateField(
    'description',
    description,
    updatedForm
  ),
  category: validateField(
    'category',
    updatedForm.category,
    updatedForm
  ),
  skillsNeeded: validateField(
    'skillsNeeded',
    updatedForm.skillsNeeded,
    updatedForm
  ),
  scheduleDate: validateField(
    'scheduleDate',
    updatedForm.scheduleDate,
    updatedForm
  ),
  scheduleTime: validateField(
    'scheduleTime',
    updatedForm.scheduleTime,
    updatedForm
  ),
};

setSubmitted(true);
setTouched({
  title: true,
  description: true,
  category: true,
  skillsNeeded: true,
  scheduleDate: true,
  scheduleTime: true,
});
setFieldErrors(errors);

if (Object.values(errors).some(Boolean)) {
  setErrorMessage('');
  setPublishing(false);
  return;
}

setErrorMessage('');
setSuccessMessage('');


    try {
      const payload = {
        title,
        description: newProject.description.trim(),
        category: newProject.category,
        skillsNeeded: newProject.skillsNeeded,
        scheduleDate: newProject.scheduleDate,
        scheduleTime: newProject.scheduleTime,
      };

      const result = await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const savedProject = result.project || result;

      if (!savedProject._id && !savedProject.id) {
        // If the API doesn't return the saved project, reload from DB.
        await loadProjects();
      } else {
        const normalizedProject = normalizeProject(savedProject);

        setProjects((prev) => [
          normalizedProject,
          ...prev.filter(
            (project) =>
              String(project.id) !== String(normalizedProject.id)
          ),
        ]);
      }

      setNewProject({ ...EMPTY_FORM });
      setIsCreating(false);
      setActiveTab('Active');
      setSuccessMessage('Project published successfully!');
      if (createProjectSource === 'portfolio') {
  onReturnToPortfolio?.();
}
    } catch (error) {
      console.error('Publish project error:', error);
      setErrorMessage(
        error.message ||
          'Failed to publish your project. Please try again.'
      );
    } finally {
      setPublishing(false);
    }
  };

  // Update project status.
  const handleStatusChange = async (id, newStatus) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await apiRequest(
        `/api/projects/${id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const updatedProject = result.project;

      if (updatedProject) {
        setProjects((prev) =>
          prev.map((project) =>
            String(project.id) === String(id)
              ? normalizeProject(updatedProject)
              : project
          )
        );
      } else {
        setProjects((prev) =>
          prev.map((project) =>
            String(project.id) === String(id)
              ? { ...project, status: newStatus }
              : project
          )
        );
      }

      setSuccessMessage(`Project marked as ${newStatus}.`);
    } catch (error) {
      console.error('Update project status error:', error);
      setErrorMessage(
        error.message || 'Unable to update project status.'
      );
    }

    setOpenMenuId(null);
  };

  const handleDeleteProject = (id) => {
    setProjectToDelete(id);
    setShowDeleteModal(true);
    setOpenMenuId(null);
    setErrorMessage('');
  };

  // Delete a project.
  const confirmDeleteProject = async () => {
    if (projectToDelete === null) return;

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiRequest(`/api/projects/${projectToDelete}`, {
        method: 'DELETE',
      });

      setProjects((prev) =>
        prev.filter(
          (project) =>
            String(project.id) !== String(projectToDelete)
        )
      );

      setSuccessMessage('Project deleted successfully.');
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Delete project error:', error);
      setErrorMessage(
        error.message || 'Unable to delete this project.'
      );
    }
  };

  const cancelDeleteProject = () => {
    setProjectToDelete(null);
    setShowDeleteModal(false);
  };

  const filteredProjects = projects.filter(
    (project) => project.status === activeTab
  );

  // CREATE PROJECT PAGE
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

          {errorMessage && (
            <div
              className="project-feedback project-error"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <div className="form-card-container">
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="project-title">Project Title</label>
                  <span className="char-count">
                    {newProject.title.length}/50
                  </span>
                </div>

                <input
                    id="project-title"
                    type="text"
                    maxLength={50}
                    placeholder="Enter your project title"
                    value={newProject.title}
                    onChange={(e) =>
                      handleFieldChange('title', e.target.value)
                    }
                    onBlur={() => handleFieldBlur('title')}
                    aria-invalid={Boolean(showFieldError('title'))}
                  />

                  {showFieldError('title') && (
                    <small className="field-error">
                      {fieldErrors.title}
                    </small>
                  )}
              </div>
                     <div className="form-group">
                    <div className="label-row">
                      <label htmlFor="project-description">
                        Description
                      </label>
                      <span className="char-count">
                        {newProject.description.length}/300
                      </span>
                    </div>

                    <textarea
                      id="project-description"
                      rows={4}
                      maxLength={300}
                      placeholder="Describe your hobby project..."
                      value={newProject.description}
                      onChange={(e) =>
                        handleFieldChange('description', e.target.value)
                      }
                      onBlur={() => handleFieldBlur('description')}
                      aria-invalid={Boolean(showFieldError('description'))}
                    />

                    {showFieldError('description') && (
                      <small className="field-error">
                        {fieldErrors.description}
                      </small>
                    )}
                  </div>



                    <div className="form-group">
                      <label htmlFor="project-category">
                        Hobby Category
                      </label>

                      <select
                        id="project-category"
                        value={newProject.category}
                        onChange={(e) =>
                          handleFieldChange('category', e.target.value)
                        }
                        onBlur={() => handleFieldBlur('category')}
                        aria-invalid={Boolean(showFieldError('category'))}
                      >
                        <option value="">Choose your category</option>

                        {HOBBIES_LIST.map((hobby) => (
                          <option key={hobby.id} value={hobby.name}>
                            {hobby.icon} {hobby.name} ({hobby.category})
                          </option>
                        ))}
                      </select>

                      {showFieldError('category') && (
                        <small className="field-error">
                          {fieldErrors.category}
                        </small>
                      )}
                    </div>


              <div className="form-group">
                <label htmlFor="skill-select">Skills Needed</label>

                <div className="skill-input-row">
                  <select
                    id="skill-select"
                    value={newProject.skillInput}
                    onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      skillInput: e.target.value,
                    }))
                  }
                  >
                    <option value="">Choose a hobby or skill</option>

                    {HOBBIES_LIST.map((hobby) => (
                      <option key={hobby.id} value={hobby.name}>
                        {hobby.icon} {hobby.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="add-skill-btn"
                    onClick={handleAddSkill}
                  >
                    + Add
                  </button>
                </div>

                {newProject.skillsNeeded.length > 0 && (
                  <div className="skills-tag-container">
                    {newProject.skillsNeeded.map((skill, index) => {
                      const skillName =
                        typeof skill === 'string'
                          ? skill
                          : skill?.name || '';

                      const skillIcon =
                        HOBBIES_LIST.find(
                          (hobby) => hobby.name === skillName
                        )?.icon || '✨';

                      return (
                        <span
                          key={`${skillName}-${index}`}
                          className="skill-chip"
                        >
                          <span className="skill-chip-icon">
                            {skillIcon}
                          </span>

                          {skillName}

                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(index)}
                            aria-label={`Remove ${skillName}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                                    </div>
                )}

                {showFieldError('skillsNeeded') && (
                  <small className="field-error" role="alert">
                    {fieldErrors.skillsNeeded}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="schedule-date">
                  Schedule / Availability
                </label>


          <div className="schedule-row">
            <div className="input-with-icon">
              <input
                id="schedule-date"
                type="date"
                min={getLocalDate()}
                value={newProject.scheduleDate}
                onChange={(e) =>
                  handleFieldChange('scheduleDate', e.target.value)
                }
                onBlur={() => handleFieldBlur('scheduleDate')}
                aria-invalid={Boolean(showFieldError('scheduleDate'))}
              />

              {showFieldError('scheduleDate') && (
                <small className="field-error">
                  {fieldErrors.scheduleDate}
                </small>
              )}
            </div>

            <div className="input-with-icon">
              <input
                id="schedule-time"
                type="time"
                min={
                  newProject.scheduleDate === getLocalDate()
                    ? getLocalTime()
                    : undefined
                }
                value={newProject.scheduleTime}
                onChange={(e) =>
                  handleFieldChange('scheduleTime', e.target.value)
                }
                onBlur={() => handleFieldBlur('scheduleTime')}
                aria-invalid={Boolean(showFieldError('scheduleTime'))}
              />

              {showFieldError('scheduleTime') && (
                <small className="field-error">
                  {fieldErrors.scheduleTime}
                </small>
              )}
            </div>
          </div>

              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                setIsCreating(false);
                setErrorMessage('');

                if (createProjectSource === 'portfolio') {
                  onReturnToPortfolio?.();
                }
              }}
                  disabled={publishing}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={publishing}
                >
                  {publishing ? 'Publishing...' : 'Publish Project'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <style>{`
          .project-feedback {
            padding: 12px 16px;
            margin: 16px 0;
            border-radius: 8px;
            overflow-wrap: anywhere;
          }

          .project-error {
            color: #b91c1c;
            background: #fee2e2;
          }

          .btn-submit:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  // PROJECT COLLABORATION DETAILS PAGE

{/* PROJECT COLLABORATION DETAILS PAGE */}
if (selectedProject) {
  const ownerId =
    selectedProject.owner?._id ||
    selectedProject.owner?.id ||
    selectedProject.owner;

  const isProjectOwner =
    Boolean(currentUserId && ownerId) &&
    String(currentUserId) === String(ownerId);  return (
    <div className="my-projects-container collaboration-page">
      <button
  type="button"
  className="back-projects-btn"
  onClick={() => {
    if (openProjectChatProject && onBackToDiscoverProjects) {
      onBackToDiscoverProjects();
      return;
    }

    setSelectedProject(null);
    setProjectRequests([]);
    setCollabError('');
    setChatMessages([]);
    setChatInput('');
    setChatError('');
    setChatLoading(false);
    setCollabTab('Members');
  }}
>
  <span aria-hidden="true">←</span>
  {openProjectChatProject
    ? ' Back to Projects'
    : ' Back to My Projects'}
</button>


                  {detailsLoading ? (
                    <p>Loading project details...</p>
                  ) : (
                    <>

            <div className="collab-project-header">
              <div className="collab-project-heading">
                <div className="collab-project-icon">
                  {selectedProject.icon}
                </div>

                <div className="collab-project-heading-text">
                  <span className="collab-project-category">
                    {selectedProject.category}
                  </span>

                  <h1>{selectedProject.title}</h1>
                  <p>{selectedProject.description}</p>
                </div>

                <span
                  className={`collab-project-status status-${selectedProject.status.toLowerCase()}`}
                >
                  {selectedProject.status}
                </span>
              </div>

                  <div
          className={`collab-project-stats ${
            isProjectOwner ? "owner-view" : "member-view"
          }`}
            >
            <div className="collab-stat">
              <span>👥</span>
              <strong>{selectedProject.memberList?.length || 0}</strong>
              <small>Members</small>
            </div>

                        {isProjectOwner && (
              <div className="collab-stat">
                <span>📩</span>
                <strong>{projectRequests.length}</strong>
                <small>Join Requests</small>
              </div>
            )}

            <div className="collab-stat">
              <span>📅</span>
              <strong>{selectedProject.date}</strong>
              <small>Schedule</small>
            </div>
          </div>
        </div>


          {collabError && (
            <div className="project-feedback project-error" role="alert">
              {collabError}
            </div>
          )}

          <div
              className={`filter-tabs collab-tabs ${
                isProjectOwner ? "owner-tabs" : "member-tabs"
              }`}
            >
            <button
              type="button"
              className={`tab-btn ${collabTab === 'Members' ? 'active' : ''}`}
              onClick={() => setCollabTab('Members')}
            >
              Members ({selectedProject.memberList?.length || 0})
            </button>

            {isProjectOwner && (
              <button
                type="button"
                className={`tab-btn ${collabTab === 'Requests' ? 'active' : ''}`}
                onClick={() => setCollabTab('Requests')}
              >
                Join Requests ({projectRequests.length})
              </button>
            )}
            <button
              type="button"
              className={`tab-btn ${collabTab === 'Chat' ? 'active' : ''}`}
              onClick={() => setCollabTab('Chat')}
            >
              Group Chat
            </button>
          </div>
          {collabTab === 'Chat' && (
              <div className="project-group-chat">
                <div className="group-chat-header">
                <div>
                  <h2>Project Group Chat</h2>
                  <p>Chat with your project members.</p>
                </div>


                            <div className="chat-clear-menu">
                              <button
                                type="button"
                                className="chat-clear-trigger"
                                aria-label="Chat options"
                                aria-expanded={chatMenuOpen}
                                onClick={() => setChatMenuOpen(!chatMenuOpen)}
                              >
                                •••
                              </button>

                              {chatMenuOpen && (
                                <div className="chat-clear-dropdown">
                                  <button
                                    type="button"
                                    className="chat-clear-option"
                                    onClick={() => {
                                      setChatDeleteTarget({ type: 'clear' });
                                      setChatMenuOpen(false);
                                    }}
                                  >
                                    <span>🗑️</span>
                                    <span>Clear Conversation</span>
                                  </button>
                                </div>
                              )}
                            </div>

              </div>

                {chatError && (
                  <div className="project-feedback project-error" role="alert">
                    {chatError}
                  </div>
                )}

                <div className="group-chat-messages" aria-live="polite">
                  {chatLoading ? (
                    <p className="group-chat-empty">Loading messages...</p>
                  ) : chatMessages.length === 0 ? (
                    <p className="group-chat-empty">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (

                    chatMessages
                    .filter((message) => message?.message?.trim())
                    .map((message) => {
                     const sender = message.sender || {};

                    const senderId =
                      sender._id ||
                      sender.id ||
                      (typeof message.sender === 'string'
                        ? message.sender
                        : '');

                    const isOwnMessage =
                      Boolean(currentUserId && senderId) &&
                      String(senderId) === String(currentUserId);

                    const projectMember = selectedProject?.memberList?.find(
                      (member) =>
                        String(member._id || member.id) === String(senderId)
                    );

                   const senderName =
                    sender.username ||
                    projectMember?.username ||
                    (isOwnMessage ? 'You' : 'Project Member');

                    const senderProfile = {
                      ...(projectMember || {}),
                      ...(typeof sender === 'object' ? sender : {}),
                    };

                      return (
                        <div
                          className={`group-chat-message ${
                            isOwnMessage ? 'own-message' : ''
                          }`}
                          key={message._id}
                        >
                          {!isOwnMessage && (
                            <UserAvatar
                            user={senderProfile}
                            name={senderName}
                          />
                          )}

                          <div className="group-chat-message-content">
                            {!isOwnMessage && <strong>{senderName}</strong>}

                            <p>{message.message}</p>

                            <small>
                    {message.createdAt
                      ? new Date(message.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : ''}
                      </small>
                          </div>
                          {isOwnMessage && (
                    <div className="chat-message-options">
                      <button
                        type="button"
                        className="chat-message-menu-btn"
                        onClick={() =>
                          setOpenMessageMenuId(
                            openMessageMenuId === message._id ? null : message._id
                          )
                        }
                      >
                        •••
                      </button>

                      {openMessageMenuId === message._id && (
                        <div className="chat-message-dropdown">
                          <button
  type="button"
  onClick={() => {
    setChatDeleteTarget({
      type: 'for-me',
      id: message._id,
    });
    setOpenMessageMenuId(null);
  }}
>
  🗑️ Delete for Me
</button>

<button
  type="button"
  onClick={() => {
    setChatDeleteTarget({
      type: 'for-everyone',
      id: message._id,
    });
    setOpenMessageMenuId(null);
  }}
>
  🗑️ Delete for Everyone
</button>
                          </div>
                            )}

                            </div>
                            )}

                           {isOwnMessage && (
                          <UserAvatar
                            user={currentUser || senderProfile}
                            name={currentUser?.username || senderName}
                          />
                        )}

                            </div>
                      );
                    })

                  )}
                </div>

                <form
                  className="group-chat-form"
                  onSubmit={handleSendChatMessage}
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Type a message..."
                    maxLength={2000}
                    aria-label="Group chat message"
                    disabled={chatSending}
                  />

                  <button
                    type="submit"
                    disabled={chatSending || !chatInput.trim()}
                  >
                    {chatSending ? 'Sending...' : 'Send'}
                  </button>
                                </form>

                {chatDeleteTarget && (
                  <div
                    className="delete-modal-overlay"
                    onClick={() => {
                      if (!chatDeleting) setChatDeleteTarget(null);
                    }}
                  >
                    <div
                      className="delete-modal"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="delete-modal-icon">🗑️</div>

                      <h2>
  {chatDeleteTarget.type === 'for-me'
    ? 'Delete for Me?'
    : chatDeleteTarget.type === 'for-everyone'
      ? 'Delete for Everyone?'
      : 'Clear Conversation?'}
</h2>

                      <p>
  {chatDeleteTarget.type === 'for-me'
    ? 'This message will disappear only from your account. Other members can still see it.'
    : chatDeleteTarget.type === 'for-everyone'
      ? 'This message will be permanently deleted for all project members.'
      : 'Existing messages will disappear only from your account. Other members can still see them.'}
</p>

                      <div className="delete-modal-actions">
                        <button
                          type="button"
                          className="delete-modal-cancel"
                          disabled={chatDeleting}
                          onClick={() => setChatDeleteTarget(null)}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="delete-modal-confirm"
                          disabled={chatDeleting}
                          onClick={confirmChatDeletion}
                        >
                          {chatDeleting
  ? 'Please wait...'
  : chatDeleteTarget.type === 'for-me'
    ? 'Delete for Me'
    : chatDeleteTarget.type === 'for-everyone'
      ? 'Delete for Everyone'
      : 'Clear Conversation'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

                    {collabTab === 'Members' && (
            <div className="projects-list">
              {(selectedProject.memberList || []).map((member, index) => (
                <div
                  className="project-card"
                  key={member._id || member.id || index}
                >

                    <div className="project-info">
                      <div className="collab-user-info">
                        <UserAvatar
                          user={member}
                          name={member.username || 'Project Member'
                          }
                        />

                        <div>
                          <h3>{member.username || 'Project Member'}</h3>

                          {member.email && <p>{member.email}</p>}

                          {String(
                            member._id || member.id || ''
                          ) === String(
                            selectedProject.owner?._id ||
                            selectedProject.owner ||
                            ''
                          ) && <span>Project Owner</span>}
                        </div>
                      </div>
                    </div>

                </div>
              ))}

              {(!selectedProject.memberList ||
                selectedProject.memberList.length === 0) && (
                <p>No members found.</p>
              )}
            </div>
          )}

            {isProjectOwner && collabTab === 'Requests' && (
            <div className="projects-list">
              {projectRequests.length > 0 ? (
                projectRequests.map((request) => (
                  <div className="project-card" key={request._id}>
                    <div className="project-info">
                      <div className="collab-user-info">
                        <UserAvatar
                          user={request.user}
                          name={request.user?.username || 'User'
                          }
                        />

                        <div>
                          <h3>{request.user?.username || 'User'}</h3>

                          {request.user?.email && (
                            <p>{request.user.email}</p>
                          )}

                          <p>Status: {request.status}</p>
                        </div>
                      </div>
                    </div>


                    {request.status === 'Pending' && (
                      <div className="card-right">
                        <button
                          type="button"
                          disabled={requestActionId === request._id}
                          onClick={() =>
                            handleJoinRequest(request._id, 'Accept')
                          }
                        >
                          {requestActionId === request._id
                            ? 'Updating...'
                            : 'Accept'}
                        </button>

                        <button
                          type="button"
                          disabled={requestActionId === request._id}
                          onClick={() =>
                            handleJoinRequest(request._id, 'Reject')
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No pending join requests.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

  // MY PROJECTS LIST PAGE
  return (
    <div className="my-projects-container">
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
          onClick={() => {
            setErrorMessage('');
            setSuccessMessage('');
            setNewProject({ ...EMPTY_FORM });
            setIsCreating(true);
          }}
        >
          + Create Project
        </button>
      </div>

      {errorMessage && (
        <div className="project-feedback project-error" role="alert">
          {errorMessage}

          <button
            type="button"
            onClick={loadProjects}
            style={{ marginLeft: 12 }}
          >
            Retry
          </button>
        </div>
      )}

      {successMessage && (
        <div className="project-feedback project-success" role="status">
          {successMessage}
        </div>
      )}

      <div className="filter-tabs">
        {['Active', 'Completed', 'Archived'].map((tab) => {
          const count = projects.filter(
            (project) => project.status === tab
          ).length;

          return (
            <button
              key={tab}
              type="button"
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} <span className="badge">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="projects-list">
        {loading ? (
          <div className="empty-state">
            <p>Loading your projects...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (

                  <div
                    key={project.id}
                    className="project-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => openProjectDetails(project)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openProjectDetails(project);
                      }
                    }}
                  >
                    <button
                  type="button"
                  className="project-group-chat-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    openProjectDetails(project).then(() => {
                      setCollabTab('Chat');
                    });
                  }}
                >
                  💬 Group Chat
                </button>
              <div className="card-left">
                <div className="project-icon">
                  {project.icon}
                </div>

                <div className="project-info">
                  <h3>{project.title}</h3>

                  <p>
                    {project.category} • 👤 {project.members}{' '}
                    {project.members === 1 ? 'member' : 'members'} •{' '}
                    {project.date}
                  </p>

                  {project.skillsNeeded.length > 0 && (
                    <div className="card-skills-row">
                      {project.skillsNeeded.map((skill, index) => {
                        const skillName =
                          typeof skill === 'string'
                            ? skill
                            : skill?.name || '';

                        const skillIcon =
                          HOBBIES_LIST.find(
                            (hobby) => hobby.name === skillName
                          )?.icon || '✨';

                        return (
                          <span
                            key={`${skillName}-${index}`}
                            className="card-skill-tag"
                          >
                            {skillIcon} {skillName}
                          </span>
                        );
                      })}
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
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenuId(
                      openMenuId === project.id ? null : project.id
                    );
                  }}
                  aria-label="Project options"
                >
                  •••
                </button>

               {openMenuId === project.id && (
                  <div
                    className="project-menu-dropdown"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {project.status !== 'Active' && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStatusChange(project.id, 'Active');
                        }}
                      >
                        Set as Active
                      </button>
                    )}

                    {project.status !== 'Completed' && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStatusChange(project.id, 'Completed');
                        }}
                      >
                        Mark as Completed
                      </button>
                    )}

                    {project.status !== 'Archived' && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStatusChange(project.id, 'Archived');
                        }}
                      >
                        Archive Project
                      </button>
                    )}

                    <button
                      type="button"
                      className="delete-option"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
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
            <p>No {activeTab.toLowerCase()} projects found.</p>
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
            <div className="delete-modal-icon">🗑️</div>

            <h2>Delete Project?</h2>

            <p>
              Are you sure you want to delete this project?

            </p>

            {errorMessage && (
              <p className="project-error" role="alert">
                {errorMessage}
              </p>
            )}

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

      <style>{`
        .project-feedback {
          padding: 12px 16px;
          margin: 16px 0;
          border-radius: 8px;
          overflow-wrap: anywhere;
        }

        .project-error {
          color: #b91c1c;
          background: #fee2e2;
        }

        .project-success {
          color: #166534;
          background: #dcfce7;
        }

        .btn-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
