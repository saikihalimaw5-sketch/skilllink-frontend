
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
  } else if (!/^[a-zA-Z0-9_]{3,8}$/.test(username)) {
  errors.username =
    'Username must be 3–8 characters using letters, numbers, or underscores.';
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
  const handleSupportSubmit = (e) => {
    e.preventDefault();

    setTicketSubmitted(true);

    setTimeout(() => {
      setTicketSubmitted(false);
      setHelpSubView('menu');
    }, 2500);
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
                          `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(
                            profileData.username || profileData.email || 'User'
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
                      maxLength={8}
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
                      ✅ Message sent! Our team will get back to you shortly.
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSupportSubmit}
                      className="form-grid"
                    >
                      <div className="form-group">
                        <label>Subject</label>

                        <input
                          type="text"
                          placeholder="e.g. Account issue"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Category</label>

                        <select className="form-select" required>
                          <option value="general">General Inquiry</option>
                          <option value="account">Account & Login</option>
                          <option value="matching">
                            Matching & Portfolio
                          </option>
                        </select>
                      </div>

                      <div className="form-group full-width">
                        <label>Message</label>

                        <textarea
                          rows="4"
                          placeholder="How can we help you?"
                          required
                        />
                      </div>

                      <div className="panel-actions full-width">
                        <button type="submit" className="btn-primary">
                          Send Message
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {helpSubView === 'report' && (
                <div className="support-form-container">
                  {ticketSubmitted ? (
                    <div className="alert-banner success">
                      🐞 Bug report received! Thank you for your feedback.
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSupportSubmit}
                      className="form-grid"
                    >
                      <div className="form-group full-width">
                        <label>Problem Summary</label>

                        <input
                          type="text"
                          placeholder="e.g. Layout issue on profile page"
                          required
                        />
                      </div>

                      <div className="form-group full-width">
                        <label>Details / Steps to reproduce</label>

                        <textarea
                          rows="4"
                          placeholder="Describe what happened..."
                          required
                        />
                      </div>

                      <div className="panel-actions full-width">
                        <button type="submit" className="btn-primary">
                          Submit Report
                        </button>
                      </div>
                    </form>
                  )}
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
