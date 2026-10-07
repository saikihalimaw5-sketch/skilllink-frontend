import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ChangePassword.css';

function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState(1);

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [serverError, setServerError] = useState('');

  // OTP expiration: 3 minutes
  const [timer, setTimer] = useState(180);

  // OTP countdown
  useEffect(() => {
    if (step !== 2 || timer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timer]);

  // Format countdown
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Clear messages
  const clearMessages = () => {
    setMessage('');
    setServerError('');
  };

  // Password validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  const passwordsMatch =
    newPassword.length > 0 &&
    newPassword === confirmPassword;

  const isPasswordValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    passwordsMatch;

  const isOtpValid = /^\d{6}$/.test(otp.trim());

  // STEP 1: Request password reset OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearMessages();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setServerError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setServerError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'https://skilllink-backend-v277.onrender.com/api/auth/forgot-password',
        {
          email: cleanEmail
        }
      );

      setEmail(cleanEmail);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setTimer(180);
      setStep(2);

      setMessage(
        response.data.message ||
          'Reset code sent to your email address!'
      );
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to send reset code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (loading) return;

    clearMessages();
    setLoading(true);

    try {
      const response = await axios.post(
        'https://skilllink-backend-v277.onrender.com/api/auth/forgot-password',
        {
          email: email.trim().toLowerCase()
        }
      );

      setOtp('');
      setTimer(180);

      setMessage(
        response.data.message ||
          'A new reset code has been sent to your email.'
      );
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to resend the reset code.'
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Update password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (timer === 0) {
      setServerError(
        'Your reset code has expired. Please request a new code.'
      );
      return;
    }

    if (!isOtpValid) {
      setServerError('Please enter a valid 6-digit OTP.');
      return;
    }

    if (!isPasswordValid) {
      setServerError(
        'Please meet all password requirements and confirm your password.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'https://skilllink-backend-v277.onrender.com/api/auth/reset-password',
        {
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword
        }
      );

      setMessage(
        response.data.message ||
          'Password reset successful! You can now log in.'
      );

      setOtp('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/login', {
          state: {
            email: email.trim().toLowerCase()
          }
        });
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

  // Change email
  const handleChangeEmail = () => {
    setStep(1);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setTimer(180);

    setShowPassword(false);
    setShowConfirmPassword(false);

    clearMessages();
  };

  // Eye icon
  const EyeIcon = ({ hidden = false }) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {hidden ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  return (
    <div className="auth-page-container">
      <div className="auth-card">

        {/* LOGO */}
        <div
          className="auth-logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <span className="logo-icon">🔗</span>
          <span className="logo-text">SkillLink</span>
        </div>

        {/* TITLE */}
        <h2 className="auth-title">
          {step === 1 ? 'Change Password' : 'Reset Password'}
        </h2>

        <p className="auth-subtitle">
          {step === 1 ? (
            'Enter your registered email to receive a password reset code.'
          ) : (
            <>
              Enter the 6-digit code sent to{' '}
              <strong>{email}</strong>.
            </>
          )}
        </p>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="alert-banner success">
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {serverError && (
          <div className="alert-banner error">
            {serverError}
          </div>
        )}

        {/* STEP 1: EMAIL */}
        {step === 1 && (
          <form
            onSubmit={handleSendOtp}
            className="auth-form"
          >
            <div className="form-group">
              <label className="form-label">
                Email Address
              </label>

              <input
                type="email"
                className="form-input"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearMessages();
                }}
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP AND NEW PASSWORD */}
        {step === 2 && (
          <form
            onSubmit={handleResetPassword}
            className="auth-form"
            noValidate
          >
            {/* OTP */}
            <div className="form-group">
              <label className="form-label">
                Verification Code (OTP)
              </label>

              <input
                type="text"
                className="form-input"
                placeholder="Enter 6-digit OTP"
                value={otp}
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                onChange={(e) => {
                  setOtp(
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6)
                  );

                  clearMessages();
                }}
                style={{
                  textAlign: 'center',
                  letterSpacing: '5px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
                required
              />
            </div>

            {/* COUNTDOWN */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: '0.5rem',
                fontSize: '14px',
                color: '#94a3b8'
              }}
            >
              {timer > 0 ? (
                <p>
                  Code expires in:{' '}
                  <strong style={{ color: '#c084fc' }}>
                    {formatTime(timer)}
                  </strong>
                </p>
              ) : (
                <p style={{ color: '#f87171' }}>
                  Reset code has expired!
                </p>
              )}
            </div>

            {/* NEW PASSWORD */}
            <div className="form-group">
              <label className="form-label">
                New Password
              </label>

              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearMessages();
                  }}
                  required
                />

                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="form-group">
              <label className="form-label">
                Confirm New Password
              </label>

              <div className="password-wrapper">
                <input
                  type={
                    showConfirmPassword ? 'text' : 'password'
                  }
                  className="form-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearMessages();
                  }}
                  required
                />

                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  <EyeIcon hidden={showConfirmPassword} />
                </button>
              </div>
            </div>

            {/* PASSWORD CHECKLIST */}
            {newPassword.length > 0 && (
              <div className="password-checklist">
                <div
                  className={`check-item ${
                    hasMinLength ? 'valid' : ''
                  }`}
                >
                  {hasMinLength ? '✓' : '○'} At least 8 characters
                </div>

                <div
                  className={`check-item ${
                    hasUppercase ? 'valid' : ''
                  }`}
                >
                  {hasUppercase ? '✓' : '○'} At least 1 uppercase letter
                </div>

                <div
                  className={`check-item ${
                    hasLowercase ? 'valid' : ''
                  }`}
                >
                  {hasLowercase ? '✓' : '○'} At least 1 lowercase letter
                </div>

                <div
                  className={`check-item ${
                    hasNumber ? 'valid' : ''
                  }`}
                >
                  {hasNumber ? '✓' : '○'} At least 1 number
                </div>

                <div
                  className={`check-item ${
                    passwordsMatch ? 'valid' : ''
                  }`}
                >
                  {passwordsMatch ? '✓' : '○'} Passwords match
                </div>
              </div>
            )}

            {/* UPDATE PASSWORD */}
            <button
              type="submit"
              className="btn-auth-submit"
              disabled={
                loading ||
                !isOtpValid ||
                !isPasswordValid ||
                timer === 0
              }
            >
              {loading
                ? 'Updating Password...'
                : 'Update Password'}
            </button>

            {/* OTP ACTIONS */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginTop: '0.5rem'
              }}
            >
              <button
                type="button"
                className="btn-link"
                onClick={handleChangeEmail}
              >
                Change Email
              </button>

              <button
                type="button"
                className="btn-link"
                onClick={handleResendOtp}
                disabled={loading}
                style={{
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* BACK BUTTON */}
        <div className="back-link-container">
          <button
            type="button"
            className="link-switch"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>

      </div>
    </div>
  );
}

export default ChangePassword;