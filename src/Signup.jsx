import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Signup.css';
import bannerImg from './assets/banner-hobbies.avif';

const API_URL = `${
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000'
}/api/auth`;

const TERMS = [
  {
    title: '1. Acceptance of Terms',
    text: 'By creating an account on SkillLink, you acknowledge that you have read, understood, and agreed to these Terms and Conditions. If you do not agree with any part of these terms, please do not proceed with registration.'
  },
  {
    title: '2. Account Registration and Accuracy',
    text: 'You agree to provide accurate and complete information when creating your account. You are responsible for keeping your profile information updated and for ensuring that the information you submit does not impersonate another person.'
  },
  {
    title: '3. Account Security and OTP Verification',
    text: 'You are responsible for protecting your password and keeping verification codes confidential. Do not share your OTP with other individuals. SkillLink may require email verification to confirm account ownership and help protect your account.'
  },
  {
    title: '4. Data Protection and Privacy',
    text: 'SkillLink collects and processes account information to provide its services, support communication, and maintain platform security. Personal information should be handled according to applicable privacy laws and the platform’s Privacy Policy. Information should not be disclosed to unauthorized parties.'
  },
  {
    title: '5. Acceptable Use',
    text: 'You agree to use SkillLink for lawful and appropriate purposes. You must not use the platform to harass others, distribute harmful content, attempt unauthorized access, interfere with platform operations, or engage in fraudulent or misleading activities.'
  },
  {
    title: '6. Communication and User Conduct',
    text: 'Users are expected to communicate respectfully and responsibly. Threats, discrimination, harassment, abusive messages, and deliberate attempts to mislead other users are not permitted. Please report inappropriate activity through the available support channels.'
  },
  {
    title: '7. User Content and Profile Information',
    text: 'You are responsible for the information, descriptions, images, and other content you submit to your profile. You must have the necessary rights or permission to share that content and must not upload material that violates another person’s rights.'
  },
  {
    title: '8. Platform Availability and Changes',
    text: 'SkillLink may update, maintain, or modify features to improve the platform. Temporary interruptions may occur because of maintenance, technical issues, or circumstances beyond our reasonable control.'
  },
  {
    title: '9. Account Restrictions and Termination',
    text: 'SkillLink may restrict, suspend, or terminate accounts that violate these terms, compromise platform security, or misuse the service. Where appropriate, users may be given an opportunity to address the issue before further action is taken.'
  },
  {
    title: '10. Limitation of Responsibility',
    text: 'SkillLink is intended to help users discover shared interests and connect with others. Users are responsible for exercising reasonable judgment when communicating or collaborating with other members. To the extent permitted by applicable law, SkillLink is not responsible for losses arising from user interactions or temporary service interruptions.'
  },
  {
    title: '11. Updates to These Terms',
    text: 'These Terms and Conditions may be revised as the platform develops or applicable requirements change. Updated terms will be made available through the platform. Continued use of SkillLink after changes take effect constitutes acceptance of the revised terms, where permitted by law.'
  },
  {
    title: '12. Contact and Support',
    text: 'If you have questions, concerns, or reports regarding these terms or your account, please contact the SkillLink support team through the available support channels.'
  }
];

const PasswordField = ({
  label,
  name,
  value,
  onChange,
  error,
  visible,
  onToggle,
  placeholder
}) => (
  <div className="form-group">
    <label className="form-label" htmlFor={name}>{label}</label>
    <div className="signup-password-wrapper">
      <input
        id={name}
        type={visible ? 'text' : 'password'}
        name={name}
        className={`form-input ${error ? 'input-error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={name === 'password' ? 'new-password' : 'new-password'}
        style={{ paddingRight: '2.8rem' }}
      />
      <button
        type="button"
        className="signup-password-toggle"
        onClick={onToggle}
        aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
    {error && <span className="field-error-text">{error}</span>}
  </div>
);

function Signup({ onSwitchToLogin, onGoHome, onSignupSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [signupToken, setSignupToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!isOtpSent || timer <= 0) {
      if (isOtpSent && timer <= 0) setCanResend(true);
      return undefined;
    }

    const interval = setInterval(() => {
      setTimer(previous => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOtpSent, timer]);

  const formatTime = seconds =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  const clearMessages = () => {
    setServerMessage('');
    setServerError('');
  };

  const handleChange = ({ target: { name, value } }) => {
    let nextValue = value;

    if (name === 'phoneNumber') {
      nextValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'password' || name === 'confirmPassword') {
      nextValue = value.replace(/\s/g, '');
    }

    setFormData(previous => ({ ...previous, [name]: nextValue }));
    setErrors(previous => ({ ...previous, [name]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const { username, email, phoneNumber, password, confirmPassword } = formData;

    if (!username.trim()) {
  nextErrors.username = 'Username is required.';
} else if (username.trim().length < 3 || username.trim().length > 15) {
  nextErrors.username = 'Username must be between 3 and 15 characters long.';
} else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
  nextErrors.username = 'Only letters, numbers, and underscores are allowed.';
}

    if (!email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!phoneNumber) {
      nextErrors.phoneNumber = 'Phone number is required.';
    } else if (!/^9\d{9}$/.test(phoneNumber)) {
      nextErrors.phoneNumber = 'Enter 10 digits starting with 9.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long.';
    } else if (!/[A-Z]/.test(password)) {
      nextErrors.password = 'Password must contain at least one uppercase letter.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreedToTerms) {
      nextErrors.agreedToTerms = 'You must accept the Terms & Conditions to register.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async event => {
    event.preventDefault();
    clearMessages();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/signup`, {
        username: formData.username.trim(),
        fullName: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        agreedToTerms,
        role: 'student'
      });

      setSignupToken(response.data.signupToken || '');
      setIsOtpSent(true);
      setTimer(180);
      setCanResend(false);
    } catch (error) {
      setServerError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async event => {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setServerError('Please enter the 6-digit OTP code.');
      return;
    }

    if (!signupToken) {
      setServerError('Verification session missing. Please start signup again.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, {
        email: formData.email.trim(),
        otp,
        signupToken
      });
              if (response.data.token) {
                localStorage.setItem('token', response.data.token);
              }

              const verifiedUser = {
                ...(response.data.user || {}),
                username:
                  response.data.user?.username || formData.username.trim(),
                fullName:
                  response.data.user?.fullName ||
                  response.data.user?.full_name ||
                  formData.username.trim(),
                email:
                  response.data.user?.email || formData.email.trim(),
                phoneNumber:
                  response.data.user?.phoneNumber ||
                  response.data.user?.phone_number ||
                  response.data.user?.phone ||
                  formData.phoneNumber
              };

              localStorage.setItem('user', JSON.stringify(verifiedUser));

              if (onSignupSuccess) {
                onSignupSuccess({
                  ...response.data,
                  user: verifiedUser
                });
              }


    // Return to Login after successful OTP verification
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      navigate('/login');
    }
    } catch (error) {
      setServerError(error.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (loading || !canResend) return;

    clearMessages();
    setOtp('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/resend-otp`, {
        email: formData.email.trim(),
        signupToken
      });

      if (response.data.signupToken) setSignupToken(response.data.signupToken);
      setServerMessage('A new OTP code has been sent to your email.');
      setTimer(180);
      setCanResend(false);
    } catch (error) {
      setServerError(error.response?.data?.message || 'Failed to resend OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const openTerms = event => {
    event.preventDefault();
    setShowTermsModal(true);
  };

  const acceptTerms = () => {
    setAgreedToTerms(true);
    setErrors(previous => ({ ...previous, agreedToTerms: '' }));
    setShowTermsModal(false);
  };

  const returnToSignup = () => {
    setIsOtpSent(false);
    clearMessages();
    setOtp('');
  };

  const renderMessage = (message, type) => message && (
    <p className={`signup-message signup-message-${type}`} role="alert">
      {message}
    </p>
  );

  return (
    <div className="auth-page-container">
      <div className="signup-wrapper">
        <div className="signup-form-section">
          <div className="auth-logo" onClick={onGoHome} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">🔗</span>
            <span className="logo-text">SkillLink</span>
          </div>

          <h2 className="auth-title">
            {isOtpSent ? 'Verify OTP' : 'Create Your Account'}
          </h2>
          <p className="auth-subtitle">
            {isOtpSent
              ? `Please enter the 6-digit verification code sent to ${formData.email}`
              : 'Join SkillLink and start building your future with the right skills and opportunities.'}
          </p>

          {renderMessage(serverMessage, 'success')}
          {renderMessage(serverError, 'error')}

          {!isOtpSent ? (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  className={`form-input ${errors.username ? 'input-error' : ''}`}
                  placeholder="Enter a username (3–15 characters)"
                  minLength={3}
                  maxLength={15}
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && <span className="field-error-text">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {errors.email && <span className="field-error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phoneNumber">Phone Number</label>
                <div className={`signup-phone-wrapper ${errors.phoneNumber ? 'input-error' : ''}`}>
                  <span className="signup-phone-code">+63</span>
                  <input
                    id="phoneNumber"
                    type="tel"
                    name="phoneNumber"
                    className="signup-phone-input"
                    placeholder="9XXXXXXXXX"
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
                {errors.phoneNumber && <span className="field-error-text">{errors.phoneNumber}</span>}
              </div>

              <PasswordField
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                visible={showPassword}
                onToggle={() => setShowPassword(previous => !previous)}
                placeholder="At least 8 characters & 1 uppercase letter"
              />

              <PasswordField
                label="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(previous => !previous)}
                placeholder="Confirm your password"
              />

              <div className="terms-checkbox-container" onClick={openTerms} style={{ cursor: 'pointer' }}>
                <input id="agreedToTerms" type="checkbox" checked={agreedToTerms} readOnly />
                <label htmlFor="agreedToTerms" style={{ cursor: 'pointer' }}>
                  I agree to the <span className="terms-highlight-text">Terms & Conditions</span>
                </label>
              </div>
              {errors.agreedToTerms && <span className="field-error-text">{errors.agreedToTerms}</span>}

              <button type="submit" className="btn-auth-submit" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Sign Up'}
              </button>

              <p className="auth-footer" style={{ marginTop: '1.5rem' }}>
                Already have an account?{' '}
                <button type="button" onClick={onSwitchToLogin} className="link-switch">Log In</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="otp">OTP Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  className="form-input"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold' }}
                />
              </div>

              <div className="signup-otp-timer">
                {timer > 0 ? (
                  <p>Code expires in: <strong>{formatTime(timer)}</strong></p>
                ) : (
                  <p className="signup-otp-expired">OTP code has expired!</p>
                )}
              </div>

              <button type="submit" className="btn-auth-submit" disabled={loading}>
                {loading ? 'Verifying OTP...' : 'Verify OTP & Complete Signup'}
              </button>

              <div className="signup-otp-actions">
                <button type="button" onClick={returnToSignup} disabled={loading}>
                  ← Back to Signup
                </button>
                <button type="button" onClick={handleResendOtp} disabled={loading || !canResend}>
                  {loading ? 'Sending...' : canResend ? 'Resend OTP' : `Resend OTP (${formatTime(timer)})`}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="signup-banner-section">
          <div className="banner-content">
            <h2 className="banner-title">Same Hobbies.<br />Bigger Connections</h2>
            <div className="banner-image-container">
              <img src={bannerImg} alt="Hobbies collaboration" className="banner-image" />
            </div>
          </div>
        </div>
      </div>

      {showTermsModal && (
        <div className="terms-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="terms-modal-content" role="dialog" aria-modal="true" aria-labelledby="terms-title" onClick={event => event.stopPropagation()}>
            <div className="terms-modal-header">
              <h3 id="terms-title">SkillLink Terms & Conditions</h3>
              <button type="button" className="terms-close-btn" onClick={() => setShowTermsModal(false)} aria-label="Close terms">✕</button>
            </div>

            <div className="terms-modal-body">
              <p><strong>Effective date:</strong> October 2026</p>
              <p>Please read these terms carefully before registering for and using SkillLink.</p>
              {TERMS.map(section => (
                <section key={section.title}>
                  <h4>{section.title}</h4>
                  <p>{section.text}</p>
                </section>
              ))}
              <p className="terms-final-note">
                By selecting “I Agree & Accept,” you confirm that you have read and accepted these Terms and Conditions.
              </p>
            </div>

            <div className="terms-modal-footer">
              <button type="button" className="terms-agree-btn" onClick={acceptTerms}>
                I Agree & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Signup;