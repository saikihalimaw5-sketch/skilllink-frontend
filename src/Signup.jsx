import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Signup.css';
import bannerImg from "./assets/banner-hobbies.avif";

function Signup({ onSwitchToLogin, onGoHome, onSignupSuccess }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  // terms and conndition
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // OTP state
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [signupToken, setSignupToken] = useState('');

  // Toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form & server errors
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // 3 minutes countdown
  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isOtpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isOtpSent, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      const onlyNums = value.replace(/\D/g, '');

      if (onlyNums.length <= 11) {
        setFormData(prev => ({ ...prev, phoneNumber: onlyNums }));
      }
    } else if (name === 'password' || name === 'confirmPassword') {
      // HINDI PAPAPAYAGAN ANG SPACE HABANG NAGTA-TYPE
      const noSpaces = value.replace(/\s/g, '');
      setFormData(prev => ({ ...prev, [name]: noSpaces }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
  };

  // Click handler para sa Checkbox / Label -> Papalabasin ang Modal
  const handleTermsClick = (e) => {
    e.preventDefault();
    setShowTermsModal(true);
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required.";
    } else if (formData.username.length > 5) {
      newErrors.username = "Username must not exceed 5 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (formData.phoneNumber.length < 11) {
      newErrors.phoneNumber = "Phone number must be exactly 11 digits.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long.";
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = "Password must contain at least one uppercase letter (A-Z).";
      } else if (/\s/.test(formData.password)) {
        newErrors.password = "Password must not contain spaces.";
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    // Terms validation check
    if (!agreedToTerms) {
      newErrors.agreedToTerms = "You must accept the Terms & Conditions to register.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerMessage('');
    setServerError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/signup',
        {
          username: formData.username,
          fullName: formData.username,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          agreedToTerms: agreedToTerms,
          role: 'student'
        }
      );

      if (response.data.signupToken) {
        setSignupToken(response.data.signupToken);
      }

      setIsOtpSent(true);
      setTimer(180);
      setCanResend(false);

    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setServerMessage('');
    setServerError('');

    if (!otp.trim()) {
      setServerError('Please enter the OTP code.');
      return;
    }

    if (!signupToken) {
      setServerError('Verification session missing. Please start signup again.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/verify-otp',
        {
          email: formData.email,
          otp: otp.trim(),
          signupToken: signupToken
        }
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      if (onSignupSuccess) {
        onSignupSuccess(response.data);
      }

      navigate('/hobbies');

    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Invalid or expired OTP code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (loading) return;

    setServerMessage('');
    setServerError('');
    setOtp('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/resend-otp',
        {
          email: formData.email,
          signupToken: signupToken
        }
      );

      if (response.data.signupToken) {
        setSignupToken(response.data.signupToken);
      }

      setServerMessage('A new OTP code has been sent to your email.');
      setTimer(180);
      setCanResend(false);

    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to resend OTP code.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="signup-wrapper">
        <div className="signup-form-section">
          <div
            className="auth-logo"
            onClick={onGoHome}
            style={{ cursor: 'pointer' }}
          >
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

          {serverMessage && (
            <p
              style={{
                color: '#047857',
                backgroundColor: '#d1fae5',
                padding: '10px',
                borderRadius: '5px',
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '1rem'
              }}
            >
              {serverMessage}
            </p>
          )}

          {serverError && (
            <p
              style={{
                color: '#b91c1c',
                backgroundColor: '#fee2e2',
                padding: '10px',
                borderRadius: '5px',
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '1rem'
              }}
            >
              {serverError}
            </p>
          )}

          {!isOtpSent ? (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className={`form-input ${errors.username ? 'input-error' : ''}`}
                  placeholder="Max 5 characters"
                  maxLength={5}
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <span className="field-error-text">{errors.username}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <span className="field-error-text">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  className={`form-input ${errors.phoneNumber ? 'input-error' : ''}`}
                  placeholder="e.g. 09123456789"
                  maxLength={11}
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
                {errors.phoneNumber && (
                  <span className="field-error-text">{errors.phoneNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                    placeholder="At least 8 chars & 1 uppercase letter"
                    value={formData.password}
                    onChange={handleChange}
                    style={{ paddingRight: '2.8rem' }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.8rem',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {errors.password && (
                  <span className="field-error-text">{errors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{ paddingRight: '2.8rem' }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.8rem',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <span className="field-error-text">{errors.confirmPassword}</span>
                )}
              </div>

              {/* CHECKBOX WITH TRIGGER TO POP-UP MODAL */}
              <div
                className="terms-checkbox-container"
                onClick={handleTermsClick}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  id="agreedToTerms"
                  checked={agreedToTerms}
                  readOnly
                />

                <label htmlFor="agreedToTerms" style={{ cursor: 'pointer' }}>
                  I agree to the <span className="terms-highlight-text">Terms & Conditions</span>
                </label>
              </div>

              {errors.agreedToTerms && (
                <span className="field-error-text">{errors.agreedToTerms}</span>
              )}

              <button
                type="submit"
                className="btn-auth-submit"
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Sign Up'}
              </button>

              <p className="auth-footer" style={{ marginTop: '1.5rem' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="link-switch"
                >
                  Log In
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="form-group">
                <label className="form-label">OTP Verification Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{
                    textAlign: 'center',
                    letterSpacing: '4px',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                />
              </div>

              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '1rem',
                  fontSize: '14px',
                  color: '#64748b'
                }}
              >
                {timer > 0 ? (
                  <p>
                    Code expires in:{' '}
                    <strong style={{ color: '#0284c7' }}>
                      {formatTime(timer)}
                    </strong>
                  </p>
                ) : (
                  <p style={{ color: 'red' }}>OTP code has expired!</p>
                )}
              </div>

              <button
                type="submit"
                className="btn-auth-submit"
                disabled={loading}
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Complete Signup'}
              </button>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '1rem',
                  fontSize: '14px'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpSent(false);
                    setServerError('');
                    setServerMessage('');
                    setOtp('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Signup
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: loading ? '#94a3b8' : '#0284c7',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* side banner */}
        <div className="signup-banner-section">
          <div className="banner-content">
            <h2 className="banner-title">
              Same Hobbies.<br />
              Bigger Connections
            </h2>

            <div className="banner-image-container">
              <img
                src={bannerImg}
                alt="Hobbies collaboration"
                className="banner-image"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TERMS & CONDITIONS MODAL */}
      {showTermsModal && (
        <div className="terms-modal-overlay">
          <div className="terms-modal-content">
            <div className="terms-modal-header">
              <h3>SkillLink Terms & Conditions</h3>

              <button
                type="button"
                className="terms-close-btn"
                onClick={() => setShowTermsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="terms-modal-body">
              <h4>1. Acceptance of Terms</h4>
              <p>
                By creating an account on SkillLink, you agree to comply with our platform policies, code of conduct, and service guidelines.
              </p>

              <h4>2. Data Protection & Privacy</h4>
              <p>
                Your personal details, including emails and password hashes, are stored securely. We adhere to privacy standards and do not share your data with unauthorized third parties.
              </p>

              <h4>3. User Responsibilities</h4>
              <p>
                You are responsible for keeping your login credentials and Multi-Factor Authentication (OTP) codes confidential to ensure account security.
              </p>
            </div>

            <div className="terms-modal-footer">
              <button
                type="button"
                className="terms-agree-btn"
                onClick={() => {
                  setAgreedToTerms(true);

                  if (errors.agreedToTerms) {
                    setErrors(prev => ({ ...prev, agreedToTerms: '' }));
                  }

                  setShowTermsModal(false);
                }}
              >
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