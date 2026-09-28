import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

function Settings() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');

  // 1. Profile Information
  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    bio: ''
  });

  const [profileImage, setProfileImage] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);

  // 2. Profile Visibility
  const [visibility, setVisibility] = useState('public');
  const [visibilitySaved, setVisibilitySaved] = useState(false);

  // 3. Privacy & Security
  const [privacyAlert, setPrivacyAlert] = useState('');

  // 4. Appearance
  const [theme, setTheme] = useState('dark');

  // 5. Help & Support
  const [helpSubView, setHelpSubView] = useState('menu');
  const [openFaq, setOpenFaq] = useState(null);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // Get the logged-in account
  const getLoggedInUser = () => {
    try {
      const savedUser = localStorage.getItem('user');

      if (!savedUser) {
        return null;
      }

      const parsedUser = JSON.parse(savedUser);

      // Supports either { email: ... } or { user: { email: ... } }
      return parsedUser.user || parsedUser;
    } catch (error) {
      console.error('Unable to read logged-in user:', error);
      return null;
    }
  };

  // Load profile information for the logged-in account
  useEffect(() => {
    try {
      const user = getLoggedInUser();

      if (!user) {
        setProfileData({
          fullName: '',
          username: '',
          email: '',
          phone: '',
          bio: ''
        });

        setProfileImage('');
        return;
      }

      const accountEmail = String(user.email || '')
        .trim()
        .toLowerCase();

      // Each account has its own saved profile
      const profileKey = accountEmail
        ? `skillLinkProfile:${accountEmail}`
        : '';

      const savedProfile = profileKey
        ? JSON.parse(localStorage.getItem(profileKey) || '{}')
        : {};

      setProfileData({
        fullName:
          savedProfile.fullName ??
          user.fullName ??
          user.full_name ??
          user.name ??
          '',

        username:
          savedProfile.username ??
          user.username ??
          user.userName ??
          '',

        email: accountEmail,

        phone: savedProfile.phone ?? '',

        bio: savedProfile.bio ?? ''
      });

      setProfileImage(savedProfile.profileImage || '');

      // Load saved visibility preference
      if (accountEmail) {
        const savedVisibility = localStorage.getItem(
          `skillLinkVisibility:${accountEmail}`
        );

        if (savedVisibility === 'public' || savedVisibility === 'private') {
          setVisibility(savedVisibility);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Sidebar Items
  const menuItems = [
    {
      id: 'profile',
      label: 'Profile Information',
      sub: 'Manage your personal details',
      icon: '👤'
    },
    {
      id: 'visibility',
      label: 'Profile Visibility',
      sub: 'Control who can view your profile',
      icon: '👁️'
    },
    {
      id: 'privacy',
      label: 'Privacy & Security',
      sub: 'Password and account security',
      icon: '🛡️'
    },
    {
      id: 'appearance',
      label: 'Appearance',
      sub: 'Customize your experience',
      icon: '🎨'
    },
    {
      id: 'help',
      label: 'Help & Support',
      sub: 'Get help with SkillLink',
      icon: '❓'
    },
    {
      id: 'logout',
      label: 'Log Out',
      sub: 'Sign out of your account',
      icon: '↳'
    }
  ];

  // FAQs
  const faqs = [
    {
      q: 'How do I edit my profile information?',
      a: 'Go to Settings > Profile Information tab. You can update your name, username, bio, and profile photo directly from there.'
    },
    {
      q: 'How does SkillLink matching work?',
      a: 'SkillLink matches you with other users based on shared hobbies, skills you want to learn, and skills you can offer.'
    },
    {
      q: 'Is my account private?',
      a: 'You can control your privacy under Settings > Profile Visibility. Switch to Private Profile if you only want approved connections to view your details.'
    },
    {
      q: 'How do I reset my password?',
      a: 'Under Settings > Privacy & Security, click on Change Password to update your security credentials.'
    }
  ];

  // Menu Switcher
  const handleMenuClick = (itemId) => {
    if (itemId === 'logout') {
      if (window.confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        navigate('/login', { replace: true });
      }
    } else {
      setActiveTab(itemId);

      if (itemId === 'help') {
        setHelpSubView('menu');
      }
    }
  };

  // Handle profile field changes
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

  // Handle profile photo
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

  // Save and validate profile
  const handleProfileSave = (e) => {
    e.preventDefault();

    const errors = {};

    const fullName = profileData.fullName.trim();
    const username = profileData.username.trim();
    const email = profileData.email.trim().toLowerCase();
    const phone = profileData.phone.trim();
    const bio = profileData.bio.trim();

    // Full Name
    if (!fullName) {
      errors.fullName = 'Full name is required.';
    } else if (fullName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    } else if (fullName.length > 100) {
      errors.fullName = 'Full name must not exceed 100 characters.';
    }

    // Username
    if (!username) {
      errors.username = 'Username is required.';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      errors.username =
        'Username must be 3–20 characters using letters, numbers, or underscores.';
    }

    // Email
    if (!email) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // Optional phone number
    if (phone && !/^\+?[0-9\s\-()]{7,20}$/.test(phone)) {
      errors.phone = 'Please enter a valid phone number.';
    }

    // Optional bio
    if (bio.length > 250) {
      errors.bio = 'Bio must not exceed 250 characters.';
    }

    setProfileErrors(errors);

    if (Object.keys(errors).length > 0) {
      setProfileSaved(false);
      return;
    }

    const user = getLoggedInUser();

    if (!user || !user.email) {
      alert('Your account session was not found. Please log in again.');
      navigate('/login');
      return;
    }

    const accountEmail = String(user.email).trim().toLowerCase();

    const updatedProfile = {
      fullName,
      username,
      email: accountEmail,
      phone,
      bio,
      profileImage
    };

    try {
      // Save profile under the currently logged-in account
      const profileKey = `skillLinkProfile:${accountEmail}`;

      localStorage.setItem(
        profileKey,
        JSON.stringify(updatedProfile)
      );

      // Update locally stored user information
      const originalStoredUser = JSON.parse(
        localStorage.getItem('user') || '{}'
      );

      if (originalStoredUser.user) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...originalStoredUser,
            user: {
              ...originalStoredUser.user,
              fullName,
              username
            }
          })
        );
      } else {
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...originalStoredUser,
            fullName,
            username
          })
        );
      }

      setProfileData({
        fullName,
        username,
        email: accountEmail,
        phone,
        bio
      });

      setProfileErrors({});
      setProfileSaved(true);

      setTimeout(() => {
        setProfileSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Unable to save your profile. Please try again.');
    }
  };

  // Save profile visibility
  const handleVisibilitySave = () => {
    const user = getLoggedInUser();
    const email = String(user?.email || '').trim().toLowerCase();

    if (!email) {
      alert('Please log in to save your preferences.');
      return;
    }

    try {
      localStorage.setItem(
        `skillLinkVisibility:${email}`,
        visibility
      );

      setVisibilitySaved(true);

      setTimeout(() => {
        setVisibilitySaved(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save visibility:', error);
      alert('Unable to save your visibility preference.');
    }
  };

  // Help & Support submit
  const handleSupportSubmit = (e) => {
    e.preventDefault();

    setTicketSubmitted(true);

    setTimeout(() => {
      setTicketSubmitted(false);
      setHelpSubView('menu');
    }, 2500);
  };

  return (
    <div className={`settings-page-wrapper theme-${theme}`}>
      {/* HEADER */}
      <div className="settings-header">
        <span className="settings-badge">MANAGE YOUR ACCOUNT</span>

        <h1 className="settings-title">Settings</h1>

        <p className="settings-subtitle">
          Manage your SkillLink profile, privacy, security, and preferences.
        </p>
      </div>

      <div className="settings-container">
        {/* SIDEBAR */}
        <div className="settings-sidebar-menu">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`settings-menu-item ${
                activeTab === item.id ? 'active' : ''
              }`}
              onClick={() => handleMenuClick(item.id)}
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

        {/* CONTENT PANEL */}
        <div className="settings-content-panel">

          {/* TAB 1: PROFILE INFORMATION */}
          {activeTab === 'profile' && (
            <div className="panel-section">
              <span className="panel-badge">YOUR PROFILE</span>

              <h2 className="panel-title">Profile Information</h2>

              <p className="panel-subtitle">
                Update your personal information and profile details.
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
                {/* PROFILE PHOTO */}
                <div className="profile-photo-section">
                  <div className="avatar-circle">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="avatar-img"
                      />
                    ) : (
                      profileData.fullName
                        ? profileData.fullName.charAt(0).toUpperCase()
                        : '?'
                    )}
                  </div>

                  <div className="photo-info">
                    <h3>Profile Photo</h3>

                    <p>
                      Add a photo to help other SkillLink users recognize you.
                    </p>

                    <label
                      htmlFor="photo-upload"
                      className="btn-secondary custom-upload-btn"
                    >
                      📷 Change Photo
                    </label>

                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                {/* PROFILE FIELDS */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>

                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) =>
                        handleProfileChange('fullName', e.target.value)
                      }
                      placeholder="Enter your full name"
                      maxLength={100}
                      required
                    />

                    {profileErrors.fullName && (
                      <span className="field-error-text">
                        {profileErrors.fullName}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Username</label>

                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) =>
                        handleProfileChange('username', e.target.value)
                      }
                      placeholder="Enter your username"
                      maxLength={20}
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
                      value={profileData.phone}
                      onChange={(e) =>
                        handleProfileChange('phone', e.target.value)
                      }
                      placeholder="Add phone number"
                      maxLength={20}
                    />

                    {profileErrors.phone && (
                      <span className="field-error-text">
                        {profileErrors.phone}
                      </span>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label>Bio</label>

                    <textarea
                      rows="3"
                      value={profileData.bio}
                      onChange={(e) =>
                        handleProfileChange('bio', e.target.value)
                      }
                      placeholder="Tell other users a little about yourself"
                      maxLength={250}
                    />

                    <small>
                      {profileData.bio.length}/250 characters
                    </small>

                    {profileErrors.bio && (
                      <span className="field-error-text">
                        {profileErrors.bio}
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
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: PROFILE VISIBILITY */}
          {activeTab === 'visibility' && (
            <div className="panel-section">
              <span className="panel-badge">PROFILE PRIVACY</span>

              <h2 className="panel-title">Profile Visibility</h2>

              <p className="panel-subtitle">
                Choose how other SkillLink users can discover and view your profile.
              </p>

              {visibilitySaved && (
                <div className="alert-banner success">
                  ✅ Profile visibility preference saved!
                </div>
              )}

              <div className="visibility-options">
                <div
                  className={`visibility-card ${
                    visibility === 'public' ? 'selected' : ''
                  }`}
                  onClick={() => setVisibility('public')}
                >
                  <div className="card-header-row">
                    <span className="vis-icon">👁️</span>

                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'public'}
                      readOnly
                    />
                  </div>

                  <h3>Public Profile</h3>

                  <p>
                    Other SkillLink users can discover your profile, hobbies,
                    skills, and portfolio.
                  </p>
                </div>

                <div
                  className={`visibility-card ${
                    visibility === 'private' ? 'selected' : ''
                  }`}
                  onClick={() => setVisibility('private')}
                >
                  <div className="card-header-row">
                    <span className="vis-icon">🔒</span>

                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'private'}
                      readOnly
                    />
                  </div>

                  <h3>Private Profile</h3>

                  <p>
                    Your profile information is limited to approved connections only.
                  </p>
                </div>
              </div>

              <div className="info-banner">
                <span>ℹ️</span> You can change your profile visibility anytime
                from your settings.
              </div>

              <div className="panel-actions">
                <button
                  className="btn-primary"
                  onClick={handleVisibilitySave}
                >
                  Save Visibility
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & SECURITY */}
          {activeTab === 'privacy' && (
            <div className="panel-section">
              <span className="panel-badge">ACCOUNT PROTECTION</span>

              <h2 className="panel-title">Privacy & Security</h2>

              <p className="panel-subtitle">
                Manage your password and account security.
              </p>

              {privacyAlert && (
                <div className="alert-banner success">
                  {privacyAlert}
                </div>
              )}

              <div className="setting-card-list">
                <div className="setting-card-item">
                  <div className="card-left">
                    <span className="card-icon">🔑</span>

                    <div>
                      <div className="card-title">Change Password</div>

                      <div className="card-desc">
                        Update your password regularly to keep your account secure.
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-setting-action"
                    onClick={() =>
                      navigate('/change-password', {
                        state: { email: profileData.email }
                      })
                    }
                  >
                    Change
                  </button>
                </div>

                <div className="setting-card-item">
                  <div className="card-left">
                    <span className="card-icon">✉️</span>

                    <div>
                      <div className="card-title">Email Verification</div>

                      <div className="card-desc">
                        Your email address is used to verify your SkillLink account.
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-setting-status verified"
                    disabled
                  >
                    Verified
                  </button>
                </div>

                <div className="setting-card-item">
                  <div className="card-left">
                    <span className="card-icon">📱</span>

                    <div>
                      <div className="card-title">Login Security</div>

                      <div className="card-desc">
                        SkillLink sends a verification code when signing in.
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-setting-status protect"
                    onClick={() =>
                      alert('Two-Factor Authentication settings enabled!')
                    }
                  >
                    Protect
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="panel-section">
              <span className="panel-badge">PERSONALIZATION</span>

              <h2 className="panel-title">Appearance</h2>

              <p className="panel-subtitle">
                Choose how you want SkillLink to look.
              </p>

              <div className="theme-grid">
                <div
                  className={`theme-card ${
                    theme === 'light' ? 'selected' : ''
                  }`}
                  onClick={() => setTheme('light')}
                >
                  <span className="theme-icon">☀️</span>
                  <h3>Light</h3>
                  <p>Light interface</p>
                </div>

                <div
                  className={`theme-card ${
                    theme === 'dark' ? 'selected' : ''
                  }`}
                  onClick={() => setTheme('dark')}
                >
                  <span className="theme-icon">🌙</span>
                  <h3>Dark</h3>
                  <p>Dark interface</p>
                </div>

                <div
                  className={`theme-card ${
                    theme === 'system' ? 'selected' : ''
                  }`}
                  onClick={() => setTheme('system')}
                >
                  <span className="theme-icon">💻</span>
                  <h3>System</h3>
                  <p>Use device setting</p>
                </div>
              </div>

              <div className="info-banner">
                <span>🎨</span> Selected theme:{' '}
                <strong>{theme.toUpperCase()}</strong> mode is now active.
              </div>
            </div>
          )}

          {/* TAB 5: HELP & SUPPORT */}
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
                    className="btn-back"
                    onClick={() => setHelpSubView('menu')}
                  >
                    ← Back to Options
                  </button>
                )}
              </div>

              {/* Help menu */}
              {helpSubView === 'menu' && (
                <div className="setting-card-list">
                  <div
                    className="setting-card-item clickable"
                    onClick={() => setHelpSubView('faq')}
                  >
                    <div className="card-left">
                      <span className="card-icon">📑</span>

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
                  >
                    <div className="card-left">
                      <span className="card-icon">💬</span>

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
                  >
                    <div className="card-left">
                      <span className="card-icon">⚠️</span>

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

              {/* FAQs */}
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

              {/* Contact Support */}
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
                            Matchings & Portfolio
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

              {/* Report a Problem */}
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
                          placeholder="e.g. Layout glitch on profile page"
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