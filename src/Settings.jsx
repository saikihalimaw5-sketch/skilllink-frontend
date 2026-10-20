
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Settings.css';

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';
// Display-only SVG icons for Settings
const SettingsIcon = ({ type, size = 24 }) => {
  const icons = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),

    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    help: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2.5-2.5 5" />
        <path d="M12 17h.01" />
      </>
    ),

    camera: (
      <>
        <path d="M4 7h4l2-3h4l2 3h4v13H4z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),

    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),

    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L7.1 10a16 16 0 0 0 6.9 6.9l1.6-1.9a2 2 0 0 1 1.7-.6l3 .5a2 2 0 0 1 1.7 2z" />
    ),

    save: (
      <>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <path d="M17 21v-8H7v8M7 3v5h8" />
      </>
    ),

    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15" />
        <path d="M10 10v7M14 10v7" />
      </>
    ),
    key: (
  <>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 9-9 2 2-3 3 2 2-3 3-2-2-3 3" />
  </>
),

faq: (
  <>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h5M8 16h4" />
  </>
),

message: (
  <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.9-5A8.4 8.4 0 1 1 21 11.5z" />
),

warning: (
  <>
    <path d="m12 3 10 18H2L12 3z" />
    <path d="M12 9v5M12 17h.01" />
  </>
),
  };


  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icons[type] || null}
    </svg>
  );
};



function Settings() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
  const savedTab = sessionStorage.getItem('skilllinkSettingsTab');

  if (location.state?.settingsTab === 'privacy') {
    return 'privacy';
  }

  return savedTab === 'privacy' ? 'privacy' : 'profile';
});

  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',

  });

  const [profileImage, setProfileImage] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('avataaars');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [helpSubView, setHelpSubView] = useState('menu');
  const [openFaq, setOpenFaq] = useState(null);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportError, setSupportError] = useState("");
  
const [mySupportTickets, setMySupportTickets] = useState([]);
const [mySupportLoading, setMySupportLoading] = useState(false);
const [mySupportError, setMySupportError] = useState("");
const [supportStatusUpdating, setSupportStatusUpdating] = useState(null);


  
const reportProblems = {
  "Technical Issue": [
    "Cannot log in",
    "Messages not sending",
    "Button not working",
    "Page not loading",
    "Other technical issue"
  ],
  "User Complaint": [
    "Inappropriate behavior",
    "Harassment or bullying",
    "Spam or fake account",
  ],
  "Project Issue": [
    "Cannot join a project",
    "Project member issue",
    "Collaboration problem",
  ]
};

const [reportCategory, setReportCategory] = useState("Technical Issue");
const [reportProblem, setReportProblem] = useState("Cannot log in");
const [reportDescription, setReportDescription] = useState("");
const [reportSubmitting, setReportSubmitting] = useState(false);
const [reportError, setReportError] = useState("");
const [reportSuccess, setReportSuccess] = useState(false);

const [myReports, setMyReports] = useState([]);
const [myReportsLoading, setMyReportsLoading] = useState(false);
const [myReportsError, setMyReportsError] = useState("");



  const getLoggedInUser = () => {
    try {
      const savedUser = localStorage.getItem('user');

      if (!savedUser) return null;

      const parsedUser = JSON.parse(savedUser);
      return parsedUser.user || parsedUser;
    } catch (error) {
      console.error('Unable to read logged-in user:', error);
      return null;
    }
  };


useEffect(() => {
  let cancelled = false;

  const loadProfile = async () => {
    setProfileLoading(true);

    try {
      const user = getLoggedInUser();
      const token = localStorage.getItem('token');

      if (!user || !token) {
        setProfileData({
          username: '',
          email: '',
          phone: '',

        });
        setProfileImage('');
        setAvatarStyle('avataaars');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/auth/my-profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Unable to load profile from MongoDB.');
      }

      const result = await response.json();
      const savedUser = result.user;

      if (!savedUser || cancelled) return;

      const email = String(savedUser.email || user.email || '')
        .trim()
        .toLowerCase();

      const currentProfile = {
        username: savedUser.username || '',
        email,
        phone: savedUser.phoneNumber || '',
        profileImage: savedUser.profileImage || '',
        avatarStyle:
          savedUser.avatarStyle && savedUser.avatarStyle !== 'default'
            ? savedUser.avatarStyle
            : 'avataaars'
      };

      setProfileData({
        username: currentProfile.username,
        email: currentProfile.email,
        phone: currentProfile.phone,

      });

      setProfileImage(currentProfile.profileImage);
      setAvatarStyle(currentProfile.avatarStyle);

      localStorage.setItem(
        `skillLinkProfile:${email}`,
        JSON.stringify(currentProfile)
      );
    } catch (error) {
      console.error('Failed to load profile:', error);

      if (!cancelled) {
        alert('Unable to load your saved profile. Please try again.');
      }
    } finally {
      if (!cancelled) {
        setProfileLoading(false);
      }
    }
  };

  loadProfile();

  return () => {
    cancelled = true;
  };
}, []);


  const menuItems = [
  {
    id: 'profile',
    label: 'Profile Information',
    sub: 'Manage your personal details',
    icon: <SettingsIcon type="user" />
  },
  {
    id: 'privacy',
    label: 'Privacy & Security',
    sub: 'Password and account security',
    icon: <SettingsIcon type="shield" />
  },
  {
    id: 'help',
    label: 'Help & Support',
    sub: 'Get help with SkillLink',
    icon: <SettingsIcon type="help" />
  }
];

  const faqs = [
    {
      q: 'How do I edit my profile information?',
      a: 'Go to Settings > Profile Information. You can update your username, phone number, and profile photo.'
    },
    {
      q: 'How does SkillLink matching work?',
      a: 'SkillLink matches you with other users based on shared hobbies, skills you want to learn, and skills you can offer.'
    },
    {
      q: 'How do I reset my password?',
      a: 'Under Settings > Privacy & Security, click on Change Password to update your password using the existing verification flow.'
    },

  ];

 const handleMenuClick = (itemId) => {
  setActiveTab(itemId);
  sessionStorage.setItem('skilllinkSettingsTab', itemId);

    if (itemId === 'help') {
      setHelpSubView('menu');
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value
    }));

    setProfileErrors((prev) => ({
      ...prev,
      [field]: ''
    }));

    setProfileSaved(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image.');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be 2 MB or smaller.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setProfileImage(reader.result);
      setProfileSaved(false);
    };

    reader.onerror = () => {
      alert('Unable to read this image. Please try another one.');
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileImage('');
    setProfileSaved(false);

    const input = document.getElementById('photo-upload');

    if (input) {
      input.value = '';
    }
  };

  const handleProfileSave = async (e) => {
  e.preventDefault();

  const errors = {};

  const username = profileData.username.trim();
  const email = profileData.email.trim().toLowerCase();
  const phone = profileData.phone.trim();


  if (!username) {
    errors.username = 'Username is required.';
  } else if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
  errors.username =
   'Username must be 3–15 characters using letters, numbers, or underscores.';
}

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (phone && !/^9\d{9}$/.test(phone)) {
  errors.phone = 'Enter 10 digits starting with 9.';
}

  setProfileErrors(errors);

  if (Object.keys(errors).length > 0) {
    setProfileSaved(false);
    return;
  }

  const user = getLoggedInUser();
  const token = localStorage.getItem('token');

  if (!user || !user.email || !token) {
    alert('Your account session was not found. Please log in again.');
    navigate('/login');
    return;
  }

  try {
    setProfileLoading(true);
    setProfileSaved(false);

    const response = await fetch(
      `${API_URL}/api/auth/update-profile`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          phoneNumber: phone,

          profileImage,
          avatarStyle
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Unable to update your profile.'
      );
    }

    const updatedProfile = {
      username,
      email,
      phone,

      profileImage,
      avatarStyle
    };

    localStorage.setItem(
      `skillLinkProfile:${email}`,
      JSON.stringify(updatedProfile)
    );

    const originalStoredUser = JSON.parse(
      localStorage.getItem('user') || '{}'
    );

    const currentUser = originalStoredUser.user
      ? originalStoredUser.user
      : originalStoredUser;

    const updatedUser = {
      ...currentUser,
      ...(result.user || {}),
      username,
      phoneNumber: phone,

      profileImage,
      avatarStyle
    };

    if (originalStoredUser.user) {
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...originalStoredUser,
          user: updatedUser
        })
      );
    } else {
      localStorage.setItem(
        'user',
        JSON.stringify(updatedUser)
      );
    }

    setProfileData((prev) => ({
      ...prev,
      username,
      email,
      phone,

    }));

    setProfileErrors({});
    setProfileSaved(true);

    window.dispatchEvent(
      new Event('skilllink-profile-updated')
    );

    setTimeout(() => {
      setProfileSaved(false);
    }, 3000);
  } catch (error) {
    console.error('Failed to save profile:', error);
    alert(error.message || 'Unable to save your profile. Please try again.');
  } finally {
    setProfileLoading(false);
  }
};
  
const handleSupportSubmit = async (e) => {
  e.preventDefault();

  if (supportSubmitting) return;

  setSupportError("");
  setTicketSubmitted(false);

  const token = localStorage.getItem("token");

  if (!token) {
    setSupportError("Please log in to contact support.");
    return;
  }

  const form = e.currentTarget;

  const subject = form.elements.namedItem("subject")?.value.trim();
  const category = form.elements.namedItem("category")?.value;
  const description = form.elements.namedItem("description")?.value.trim();

  if (!subject || !category || !description) {
    setSupportError("Please complete all required fields.");
    return;
  }

  try {
    setSupportSubmitting(true);

    const response = await fetch(`${API_URL}/api/support`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subject,
        category,
        description,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to submit support inquiry."
      );
    }

    form.reset();
    setTicketSubmitted(true);
  } catch (error) {
    console.error("Support submission error:", error);

    setSupportError(
      error.message || "Unable to send message. Please try again."
    );
  } finally {
    setSupportSubmitting(false);
  }
};


/* ==========================================
   MY REPORTS - FETCH USER REPORTS
========================================== */

/* ==========================================
   MY SUPPORT REQUESTS - FETCH TICKETS
========================================== */

const fetchMySupportTickets = async () => {
  setMySupportLoading(true);
  setMySupportError("");

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in to view your support requests.");
    }

    const response = await fetch(`${API_URL}/api/support/my`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load your support requests."
      );
    }

    setMySupportTickets(
      Array.isArray(data.tickets) ? data.tickets : []
    );
  } catch (error) {
    console.error("Fetch support requests error:", error);

    setMySupportError(
      error.message || "Unable to load your support requests."
    );
  } finally {
    setMySupportLoading(false);
  }
};

/* ==========================================
   MY SUPPORT REQUESTS - UPDATE STATUS
========================================== */

const updateSupportTicketStatus = async (ticketId, status) => {
  if (supportStatusUpdating) return;

  setMySupportError("");
  setSupportStatusUpdating(ticketId);

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in to update your support request.");
    }

    const response = await fetch(
      `${API_URL}/api/support/${ticketId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to update support request."
      );
    }

    setMySupportTickets((prev) =>
      prev.map((ticket) =>
        ticket._id === ticketId
          ? {
              ...ticket,
              status,
            }
          : ticket
      )
    );
  } catch (error) {
    console.error("Update support status error:", error);

    setMySupportError(
      error.message || "Unable to update support request."
    );
  } finally {
    setSupportStatusUpdating(null);
  }
};

const fetchMyReports = async () => {
  setMyReportsLoading(true);
  setMyReportsError("");

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in to view your reports.");
    }

    const response = await fetch(`${API_URL}/api/reports/my`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load your reports.");
    }

    const data = await response.json();

    setMyReports(
      Array.isArray(data.reports) ? data.reports : []
    );
  } catch (error) {
    console.error("Fetch my reports error:", error);

    setMyReportsError(
      error.message || "Unable to load your reports."
    );
  } finally {
    setMyReportsLoading(false);
  }
};

const handleReportSubmit = async (e) => {
  e.preventDefault();

  if (reportSubmitting) return;

  setReportError("");
  setReportSuccess(false);

  const token = localStorage.getItem("token");

  if (!token) {
    setReportError("Please log in to submit a report.");
    return;
  }

  try {
    setReportSubmitting(true);

    const response = await fetch(`${API_URL}/api/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reportType: reportCategory,
        subject: reportProblem,
        description: reportDescription.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to submit report."
      );
    }

    setReportSuccess(true);
    setReportDescription("");

  } catch (error) {
    console.error("Report submission error:", error);
    setReportError(
      error.message || "Unable to submit report. Please try again."
    );
  } finally {
    setReportSubmitting(false);
  }
};

  return (
    <div className="settings-page-wrapper theme-dark">
      <div className="settings-header">
        <span className="settings-badge">MANAGE YOUR ACCOUNT</span>

        <h1 className="settings-title">Settings</h1>

        <p className="settings-subtitle">
          Manage your SkillLink profile, privacy, and security.
        </p>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar-menu">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`settings-menu-item ${
                activeTab === item.id ? 'active' : ''
              }`}
              onClick={() => handleMenuClick(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleMenuClick(item.id);
                }
              }}
            >
              <div className="menu-icon-box">{item.icon}</div>

              <div className="menu-text-box">
                <div className="menu-label">{item.label}</div>
                <div className="menu-sub">{item.sub}</div>
              </div>

              <span className="menu-arrow">›</span>
            </div>
          ))}
        </div>

        <div className="settings-content-panel">
          {activeTab === 'profile' && (
            <div className="panel-section">
              <span className="panel-badge">YOUR PROFILE</span>

              <h2 className="panel-title">Profile Information</h2>

              <p className="panel-subtitle">
                Manage how other SkillLink members see you.
              </p>

              {profileLoading && (
                <div className="info-banner">
                  Loading your account information...
                </div>
              )}

              {!profileLoading && !profileData.email && (
                <div className="info-banner">
                  You are not logged in. Please log in to view your profile.
                </div>
              )}

              {profileSaved && (
                <div className="alert-banner success">
                  ✅ Profile details saved successfully!
                </div>
              )}

              <form onSubmit={handleProfileSave}>
                <div className="profile-photo-section">
                    <div className="avatar-circle">
                      <img
                        src={
  profileImage ||
  `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(
    getLoggedInUser()?.id ||
    getLoggedInUser()?._id ||
    profileData.username ||
    'User'
  )}`
}
                        alt="Profile Avatar"
                        className="avatar-img"
                      />
                    </div>


                  <div className="photo-info">
                    <h3>Profile Photo</h3>

                    <p>
                      Make your profile recognizable to other SkillLink users.
                    </p>

                    <div className="photo-actions">
                      <label
                        htmlFor="photo-upload"
                        className="btn-secondary custom-upload-btn"
                      >
<SettingsIcon type="camera" size={18} />
<span>Change Photo</span>
                      </label>

                      {profileImage && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={handleRemoveImage}
                        >
                         <SettingsIcon type="trash" size={18} />
                        <span>Remove Photo</span>
                        </button>
                      )}
                    </div>

                    <small>
                      JPG, PNG, or other image formats, up to 2 MB.
                    </small>

                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Username</label>

                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) =>
                        handleProfileChange('username', e.target.value)
                      }
                      placeholder="Enter your username"
                      maxLength={15}
                      required
                    />

                    {profileErrors.username && (
                      <span className="field-error-text">
                        {profileErrors.username}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>

                    <input
                      type="email"
                      value={profileData.email}
                      readOnly
                    />

                    <small>
                      Your email is linked to your login account.
                    </small>

                    {profileErrors.email && (
                      <span className="field-error-text">
                        {profileErrors.email}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>

                    <input
  type="tel"
  value={
    profileData.phone
      ? `+63 ${profileData.phone.replace(/^\+?63|^0/, '')}`
      : '+63 '
  }
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, '');

    const localNumber = digits.startsWith('63')
      ? digits.slice(2)
      : digits.startsWith('0')
        ? digits.slice(1)
        : digits;

    handleProfileChange('phone', localNumber.slice(0, 10));
  }}
  placeholder="+63 9XXXXXXXXX"
  maxLength={14}
/>

                    {profileErrors.phone && (
                      <span className="field-error-text">
                        {profileErrors.phone}
                      </span>
                    )}
                  </div>


                </div>

                <div className="panel-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={profileLoading || !profileData.email}
                  >
                    <SettingsIcon type="save" size={18} />
<span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="panel-section">
              <span className="panel-badge">ACCOUNT PROTECTION</span>

              <h2 className="panel-title">Privacy & Security</h2>

              <p className="panel-subtitle">
                Keep your account safe and manage your privacy.
              </p>

              <div className="setting-card-list">
                <div className="setting-card-item">
                  <div className="card-left">
                    <span className="card-icon">
                    <SettingsIcon type="key" />
                  </span>

                    <div>
                      <div className="card-title">Change Password</div>

                      <div className="card-desc">
                        Update your password regularly to keep your account secure.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-setting-action"
                    onClick={() =>
                      navigate('/change-password', {
  state: {
    email: profileData.email,
    returnTo: '/dashboard',
    settingsTab: 'privacy'
  }
})
                    }
                  >
                    Change
                  </button>
                </div>

                <div className="setting-card-item">
                  <div className="card-left">
                    <span className="card-icon">
  <SettingsIcon type="mail" />
</span>

                    <div>
                      <div className="card-title">Email Verification</div>

                      <div className="card-desc">
                        Your email is used to verify your SkillLink account.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-setting-status verified"
                    disabled
                  >
                    ✓ Verified
                  </button>
                </div>


                <div className="setting-card-item">
                  <div className="card-left">
                    <span className="card-icon">
  <SettingsIcon type="shield" />
</span>

                    <div>
                      <div className="card-title">Login Security</div>

                      <div className="card-desc">
                        SkillLink uses email OTP verification when you sign in.
                        Never share your verification code with anyone.
                      </div>
                    </div>
                  </div>

                  <span className="btn-setting-status protect">
                    OTP Enabled
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="panel-section">
              <div className="section-top-bar">
                <div>
                  <span className="panel-badge">NEED SOME HELP?</span>

                  <h2 className="panel-title">Help & Support</h2>

                  <p className="panel-subtitle">
                    Find answers or contact the SkillLink support team.
                  </p>
                </div>

                {helpSubView !== 'menu' && (
                  <button
                    type="button"
                    className="btn-back"
                    onClick={() => setHelpSubView('menu')}
                  >
                    ← Back to Options
                  </button>
                )}
              </div>

              {helpSubView === 'menu' && (
                <div className="setting-card-list">
                  <div
                    className="setting-card-item clickable"
                    onClick={() => setHelpSubView('faq')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setHelpSubView('faq');
                      }
                    }}
                  >
                    <div className="card-left">
                      <span className="card-icon">
  <SettingsIcon type="faq" />
</span>

                      <div>
                        <div className="card-title">
                          Frequently Asked Questions
                        </div>

                        <div className="card-desc">
                          Find quick answers to common questions about SkillLink.
                        </div>
                      </div>
                    </div>

                    <span className="menu-arrow">›</span>
                  </div>

                  <div
                    className="setting-card-item clickable"
                    onClick={() => setHelpSubView('contact')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setHelpSubView('contact');
                      }
                    }}
                  >
                    <div className="card-left">
                      <span className="card-icon">
  <SettingsIcon type="message" />
</span>

                      <div>
                        <div className="card-title">Contact Support</div>

                        <div className="card-desc">
                          Get direct help with your account or SkillLink features.
                        </div>
                      </div>
                    </div>

                    <span className="menu-arrow">›</span>
                  </div>

                  <div
                    className="setting-card-item clickable"
                    onClick={() => setHelpSubView('report')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setHelpSubView('report');
                      }
                    }}
                  >
                    <div className="card-left">
                     <span className="card-icon">
  <SettingsIcon type="warning" />
</span>

                      <div>
                        <div className="card-title">Report a Problem</div>

                        <div className="card-desc">
                          Tell us if something isn't working properly or is broken.
                        </div>
                      </div>
                    </div>

                    <span className="menu-arrow">›</span>
                  </div>

{/* MY SUPPORT REQUESTS */}
<div
  className="setting-card-item clickable"
  onClick={() => {
    setHelpSubView("mySupport");
    fetchMySupportTickets();
  }}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setHelpSubView("mySupport");
      fetchMySupportTickets();
    }
  }}
>
  <div className="card-left">
    <span className="card-icon">
      <SettingsIcon type="message" />
    </span>

    <div>
      <div className="card-title">
        My Support Requests
      </div>

      <div className="card-desc">
        View your support inquiries, admin replies, and request status.
      </div>
    </div>
  </div>

  <span className="menu-arrow">›</span>
</div>
                  
{/* MY REPORTS */}
<div
  className="setting-card-item clickable"
  onClick={() => {
    setHelpSubView("myReports");
    fetchMyReports();
  }}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setHelpSubView("myReports");
      fetchMyReports();
    }
  }}
>
  <div className="card-left">
    <span className="card-icon">
      <SettingsIcon type="faq" />
    </span>

    <div>
      <div className="card-title">My Reports</div>
      <div className="card-desc">
        View your submitted reports and their status.
      </div>
    </div>
  </div>

  <span className="menu-arrow">›</span>
</div>

                </div>
              )}

              {helpSubView === 'faq' && (
                <div className="faq-list">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className={`faq-item ${
                        openFaq === index ? 'active' : ''
                      }`}
                      onClick={() =>
                        setOpenFaq(openFaq === index ? null : index)
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setOpenFaq(openFaq === index ? null : index);
                        }
                      }}
                    >
                      <div className="faq-question">
                        <span>{faq.q}</span>

                        <span className="faq-icon">
                          {openFaq === index ? '−' : '+'}
                        </span>
                      </div>

                      {openFaq === index && (
                        <div className="faq-answer">{faq.a}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              
{helpSubView === 'contact' && (
  <div className="support-form-container">
    {ticketSubmitted ? (
      <div className="alert-banner success">
        ✅ Your support inquiry has been submitted successfully!
        Our team will review your concern.
      </div>
    ) : (
      <form
        onSubmit={handleSupportSubmit}
        className="form-grid"
      >
        
<div className="form-group">
  <label>Subject</label>
  <select
    name="subject"
    className="form-select"
    defaultValue=""
    required
  >
    <option value="" disabled>
      Select a Subject
    </option>
    <option value="Account & Login Assistance">
      Account & Login Assistance
    </option>
    <option value="Profile & Settings">
      Profile & Settings
    </option>
    <option value="Finding People & Skills">
      Finding People & Skills
    </option>
    <option value="Project & Collaboration Assistance">
      Project & Collaboration Assistance
    </option>
    <option value="Messages & Notifications">
      Messages & Notifications
    </option>
  </select>
</div>


        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            className="form-select"
            required
          >
            <option value="general">General Inquiry</option>
            <option value="account">Account & Login</option>
            <option value="matching">Matching & Portfolio</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label>Message</label>
          <textarea
            name="description"
            rows={4}
            placeholder="How can we help you?"
            maxLength={2000}
            required
          />
        </div>

        {supportError && (
          <div className="alert-banner error full-width">
            {supportError}
          </div>
        )}

        <div className="panel-actions full-width">
          <button
            type="submit"
            className="btn-primary"
            disabled={supportSubmitting}
          >
            {supportSubmitting ? "Sending..." : "Send Message"}
          </button>
        </div>
      </form>
    )}
  </div>
)}


{/* MY SUPPORT REQUESTS DISPLAY */}
{helpSubView === "mySupport" && (
  <div className="support-form-container">
    <h3>My Support Requests</h3>

    <p className="panel-subtitle">
      Track your support inquiries and view responses from the SkillLink support team.
    </p>

    <button
      type="button"
      className="btn-secondary"
      onClick={fetchMySupportTickets}
      disabled={mySupportLoading}
    >
      {mySupportLoading ? "Refreshing..." : "Refresh Requests"}
    </button>

    {mySupportLoading && (
      <p>Loading your support requests...</p>
    )}

    {mySupportError && (
      <div className="alert-banner error">
        {mySupportError}
      </div>
    )}

    {!mySupportLoading &&
      !mySupportError &&
      mySupportTickets.length === 0 && (
        <p>You have not submitted any support requests yet.</p>
      )}

    {!mySupportLoading &&
      !mySupportError &&
      mySupportTickets.map((ticket) => (
        <div
          key={ticket._id}
          className="setting-card-item"
          style={{
            display: "block",
            marginTop: "15px",
            padding: "20px",
          }}
        >
          <h4>{ticket.subject}</h4>

          <p>
            <strong>Category:</strong> {ticket.category}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {new Date(ticket.createdAt).toLocaleString()}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color:
                  ticket.status === "Resolved"
                    ? "#4ade80"
                    : ticket.status === "Replied"
                    ? "#c084fc"
                    : "#fbbf24",
                fontWeight: "bold",
              }}
            >
              {ticket.status}
            </span>
          </p>

          <p>
            <strong>Your Message:</strong> {ticket.description}
          </p>

         
{ticket.adminResponse && (
  <>
    <div
      style={{
        padding: "14px",
        borderRadius: "10px",
        background: "rgba(139,92,246,0.15)",
        marginTop: "12px",
      }}
    >
      <strong>Admin Response:</strong>

      <p style={{ marginTop: "8px" }}>
        {ticket.adminResponse}
      </p>
    </div>

    {ticket.status === "Replied" && (
      <div style={{ marginTop: "18px" }}>
        <p style={{ marginBottom: "12px" }}>
          <strong>Was your concern resolved?</strong>
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn-primary"
            disabled={supportStatusUpdating !== null}
            onClick={() =>
              updateSupportTicketStatus(ticket._id, "Resolved")
            }
          >
            {supportStatusUpdating === ticket._id
              ? "Updating..."
              : "✓ Resolved"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            disabled={supportStatusUpdating !== null}
            onClick={() =>
              updateSupportTicketStatus(ticket._id, "Open")
            }
          >
            Not Resolved
          </button>
        </div>
      </div>
    )}

    {ticket.status === "Resolved" && (
      <div
        className="alert-banner success"
        style={{ marginTop: "15px" }}
      >
        ✓ You marked this support request as resolved.
      </div>
    )}

    {ticket.status === "Open" && (
      <p style={{ marginTop: "12px", color: "#fbbf24" }}>
        Your concern has been reopened. Please wait for another
        response from the support team.
      </p>
    )}
  </>
)}

        </div>
      ))}
  </div>
)}

              
{/* MY REPORTS DISPLAY */}
{helpSubView === "myReports" && (
  <div className="support-form-container">
    <h3>My Reports</h3>
    <p className="panel-subtitle">
      View your submitted reports and admin responses.
    </p>

    <button
      type="button"
      className="btn-secondary"
      onClick={fetchMyReports}
      disabled={myReportsLoading}
    >
      Refresh Reports
    </button>

    {myReportsLoading && (
      <p>Loading your reports...</p>
    )}

    {myReportsError && (
      <div className="alert-banner error">
        {myReportsError}
      </div>
    )}

    {!myReportsLoading &&
      !myReportsError &&
      myReports.length === 0 && (
        <p>You have not submitted any reports yet.</p>
      )}

    {!myReportsLoading &&
      !myReportsError &&
      myReports.map((report) => (
        <div
          key={report._id}
          className="setting-card-item"
          style={{
            display: "block",
            marginTop: "15px",
            padding: "20px",
          }}
        >
          <h4>{report.subject}</h4>

          <p>
            <strong>Category:</strong> {report.reportType}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {new Date(report.createdAt).toLocaleString()}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color:
                  report.status === "Resolved"
                    ? "#4ade80"
                    : report.status === "Dismissed"
                    ? "#f87171"
                    : "#fbbf24",
                fontWeight: "bold",
              }}
            >
              {report.status || "Pending"}
            </span>
          </p>

          {report.description && (
            <p>
              <strong>Details:</strong> {report.description}
            </p>
          )}

          {report.adminResponse && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(139,92,246,0.15)",
                marginTop: "10px",
              }}
            >
              <strong>Admin Response:</strong>
              <p>{report.adminResponse}</p>
            </div>
          )}
        </div>
      ))}
  </div>
)}

                  {helpSubView === 'report' && (
                    <div className="support-form-container">
                      <h3>Report a Problem</h3>

                      <p className="panel-subtitle">
                        Select the issue you are experiencing in SkillLink.
                      </p>

                      {reportSuccess && (
                        <div className="alert-banner success">
                          ✓ Your report has been submitted successfully!
                        </div>
                      )}

                      {reportError && (
                        <div className="alert-banner error">
                          {reportError}
                        </div>
                      )}

                      <form
                        className="form-grid"
                        onSubmit={handleReportSubmit}
                      >
                        <div className="form-group full-width">
                          <label>Report Category *</label>

                          <select
                            className="form-select"
                            value={reportCategory}
                            onChange={(e) => {
                              const category = e.target.value;
                              setReportCategory(category);
                              setReportProblem(reportProblems[category][0]);
                              setReportError("");
                              setReportSuccess(false);
                            }}
                            required
                          >
                            {Object.keys(reportProblems).map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group full-width">
                          <label>Select Problem *</label>

                          <select
                            className="form-select"
                            value={reportProblem}
                            onChange={(e) => {
                              setReportProblem(e.target.value);
                              setReportError("");
                              setReportSuccess(false);
                            }}
                            required
                          >
                            {reportProblems[reportCategory].map((problem) => (
                              <option key={problem} value={problem}>
                                {problem}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group full-width">
                          <label>Additional Details (Optional)</label>

                          <textarea
                            rows={4}
                            value={reportDescription}
                            maxLength={300}
                            placeholder="Tell us more about the problem, if needed..."
                            onChange={(e) => {
                              setReportDescription(e.target.value);
                              setReportError("");
                              setReportSuccess(false);
                            }}
                          />

                          <small style={{ display: "block", textAlign: "right" }}>
                            {reportDescription.length}/300 characters
                          </small>
                        </div>

                        <div className="panel-actions full-width">
                          <button
                            type="submit"
                            className="btn-primary"
                            disabled={reportSubmitting}
                          >
                            {reportSubmitting ? "Submitting..." : "Submit Report"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
