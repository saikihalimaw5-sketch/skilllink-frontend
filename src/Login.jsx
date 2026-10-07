import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const OTP_DURATION = 180; // 3 minutes

function Login({ onSwitchToSignUp, onGoHome, onLoginSuccess }) {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP timer: 3 minutes
  const [timer, setTimer] = useState(OTP_DURATION);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if ((!isOtpSent && viewMode !== 'forgot-reset') || timer <= 0) {
      if (timer <= 0) {
        setCanResend(true);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOtpSent, viewMode, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
  const newErrors = {};

  if (!formData.email.trim()) {
    newErrors.email = 'Email address is required.';
  } else if (!isValidEmail(formData.email)) {
    newErrors.email = 'Please enter a valid email address.';
  }

  if (!formData.password) {
    newErrors.password = 'Password is required.';
  }

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};

  // Login: request OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setServerError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axios.post(
        'https://skilllink-backend-v277.onrender.com/api/auth/login',
        {
          email: formData.email.trim(),
          password: formData.password
        }
      );

      setMessage(
        response.data.message || 'Verification code sent to your email!'
      );

      setIsOtpSent(true);
      setOtp('');
      setTimer(OTP_DURATION);
      setCanResend(false);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify login OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setMessage('');
    setServerError('');

    if (!otp.trim()) {
      setServerError('Please enter the 6-digit OTP code.');
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setServerError('Please enter a valid 6-digit OTP code.');
      return;
    }

    if (timer === 0) {
      setServerError('Your OTP code has expired. Please request a new one.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'https://skilllink-backend-v277.onrender.com/api/auth/verify-otp',
        {
          email: formData.email.trim(),
          otp: otp.trim()
        }
      );

      setMessage('Login successful!');

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      if (onLoginSuccess) {
        onLoginSuccess(response.data);
      }

      navigate('/hobbies');
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Incorrect OTP code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend login OTP
  const handleResendOtp = async () => {
    if (loading) return;

    setMessage('');
    setServerError('');
    setOtp('');
    setLoading(true);

    try {
      const response = await axios.post(
        'https://skilllink-backend-v277.onrender.com/api/auth/resend-otp',
        {
          email: formData.email.trim()
        }
      );

      setMessage(
        response.data.message ||
          'A new verification code has been sent to your email.'
      );

      setTimer(OTP_DURATION);
      setCanResend(false);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to resend verification code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Request password-reset OTP
  const handleRequestResetCode = async (e) => {
    if (e) e.preventDefault();

    setMessage('');
    setServerError('');

    if (!resetEmail.trim()) {
      setServerError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(resetEmail)) {
      setServerError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'https://skilllink-backend-v277.onrender.com/api/auth/forgot-password',
        {
          email: resetEmail.trim()
        }
      );

      setMessage(
        response.data.message || 'Reset code sent to your email address!'
      );

      setResetOtp('');
      setViewMode('forgot-reset');
      setTimer(OTP_DURATION);
      setCanResend(false);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Email not found or error sending reset code.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    setMessage('');
    setServerError('');

    const newErrors = {};

    if (!resetOtp.trim()) {
      newErrors.resetOtp = 'Please enter the reset code.';
    } else if (!/^\d{6}$/.test(resetOtp.trim())) {
      newErrors.resetOtp = 'Please enter a valid 6-digit reset code.';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      newErrors.newPassword =
        'Password must be at least 8 characters long.';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword =
        'Password must contain at least one uppercase letter (A-Z).';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (timer === 0) {
      setServerError('Reset code has expired. Please request a new code.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'https://skilllink-backend-v277.onrender.com/api/auth/reset-password',
        {
          email: resetEmail.trim(),
          otp: resetOtp.trim(),
          newPassword
        }
      );

      setMessage(
        response.data.message ||
          'Password reset successful! You can now log in.'
      );

      setTimeout(() => {
        setViewMode('login');

        setFormData((prev) => ({
          ...prev,
          email: resetEmail.trim(),
          password: ''
        }));

        setMessage('');
        setServerError('');
        setNewPassword('');
        setConfirmPassword('');
        setResetOtp('');
        setTimer(OTP_DURATION);
        setCanResend(false);
      }, 2000);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to reset password. Invalid or expired code.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset all states
  const resetAllStates = () => {
    setViewMode('login');
    setIsOtpSent(false);
    setMessage('');
    setServerError('');
    setErrors({});
    setOtp('');
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setTimer(OTP_DURATION);
    setCanResend(false);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div
          className="auth-logo"
          onClick={onGoHome}
          style={{ cursor: 'pointer' }}
        >
          <span className="logo-icon">🔗</span>
          <span className="logo-text">SkillLink</span>
        </div>

        <h2 className="auth-title">
          {viewMode === 'forgot-request'
            ? 'Forgot Password?'
            : viewMode === 'forgot-reset'
            ? 'Reset Password'
            : isOtpSent
            ? 'Verify OTP'
            : 'Welcome back!'}
        </h2>

        <p className="auth-subtitle">
          {viewMode === 'forgot-request'
            ? 'Enter your registered email address to receive a password reset code.'
            : viewMode === 'forgot-reset'
            ? `Enter the reset code sent to ${resetEmail} and set your new password.`
            : isOtpSent
            ? `Please enter the 6-digit verification code sent to ${formData.email}`
            : 'Log in to continue to your account.'}
        </p>

        {message && (
          <p
            style={{
              color: '#4ade80',
              backgroundColor: 'rgba(74, 222, 128, 0.1)',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: '1rem'
            }}
          >
            {message}
          </p>
        )}

        {serverError && (
          <p
            style={{
              color: '#f87171',
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: '1rem'
            }}
          >
            {serverError}
          </p>
        )}

        {/* Login form */}
        {viewMode === 'login' && !isOtpSent && (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
              <label className="form-label">Password</label>

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-input ${
                    errors.password ? 'input-error' : ''
                  }`}
                  placeholder="Enter your password"
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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

            <div
              className="form-options"
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '1rem'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setViewMode('forgot-request');
                  setMessage('');
                  setServerError('');
                  setResetEmail(formData.email);
                  setTimer(OTP_DURATION);
                  setCanResend(false);
                }}
                className="forgot-password"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a855f7',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? 'Sending Code...' : 'Log In'}
            </button>

            <p className="auth-footer" style={{ marginTop: '1.5rem' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="link-switch"
              >
                Sign Up
              </button>
            </p>
          </form>
        )}

        {/* Login OTP verification form */}
        {viewMode === 'login' && isOtpSent && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="form-group">
              <label className="form-label">OTP Verification Code</label>

              <input
                type="text"
                inputMode="numeric"
                className="form-input"
                placeholder="Enter 6-digit OTP code"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
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
                color: '#94a3b8'
              }}
            >
              {timer > 0 ? (
                <p>
                  Code expires in:{' '}
                  <strong style={{ color: '#38bdf8' }}>
                    {formatTime(timer)}
                  </strong>
                </p>
              ) : (
                <p style={{ color: '#f87171' }}>OTP code has expired!</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading || timer === 0}
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP & Login'}
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
                  setMessage('');
                  setOtp('');
                  setTimer(OTP_DURATION);
                  setCanResend(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                ← Back to Login
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: loading ? '#64748b' : '#a855f7',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Forgot password request form */}
        {viewMode === 'forgot-request' && (
          <form onSubmit={handleRequestResetCode} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>

              <input
                type="email"
                className="form-input"
                placeholder="Enter your registered email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
              <button
                type="button"
                onClick={resetAllStates}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* Password reset form */}
        {viewMode === 'forgot-reset' && (
          <form
            onSubmit={handleResetPassword}
            className="auth-form"
            noValidate
          >
            <div className="form-group">
              <label className="form-label">Reset Code (OTP)</label>

              <input
                type="text"
                inputMode="numeric"
                className={`form-input ${
                  errors.resetOtp ? 'input-error' : ''
                }`}
                placeholder="Enter 6-digit code"
                value={resetOtp}
                maxLength={6}
                onChange={(e) =>
                  setResetOtp(e.target.value.replace(/\D/g, ''))
                }
                style={{
                  textAlign: 'center',
                  letterSpacing: '4px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              />

              {errors.resetOtp && (
                <span className="field-error-text">{errors.resetOtp}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  className={`form-input ${
                    errors.newPassword ? 'input-error' : ''
                  }`}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: '2.8rem' }}
                />

                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
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
                  aria-label={
                    showResetPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showResetPassword ? (
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

              {errors.newPassword && (
                <span className="field-error-text">
                  {errors.newPassword}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input ${
                    errors.confirmPassword ? 'input-error' : ''
                  }`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: '2.8rem' }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
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
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
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
                <span className="field-error-text">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            <div
              style={{
                textAlign: 'center',
                marginBottom: '1rem',
                fontSize: '14px',
                color: '#94a3b8'
              }}
            >
              {timer > 0 ? (
                <p>
                  Code expires in:{' '}
                  <strong style={{ color: '#38bdf8' }}>
                    {formatTime(timer)}
                  </strong>
                </p>
              ) : (
                <p style={{ color: '#f87171' }}>Reset code has expired!</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading || timer === 0}
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1.2rem',
                fontSize: '14px'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setViewMode('forgot-request');
                  setMessage('');
                  setServerError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleRequestResetCode}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a855f7',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;