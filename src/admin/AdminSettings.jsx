
import React, { useEffect, useRef, useState } from "react";
import {
  UserRound,
  Camera,
  Save,
  LockKeyhole,
  KeyRound,
  Info,
  Eye,
  EyeOff,
  Mail,
  X,
  ShieldCheck,
  Database,
  Layers3,
  UsersRound,
  Code2,
} from "lucide-react";
import "./AdminSettings.css";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const errorTextStyle = {
  color: "#ff647c",
  fontSize: "12px",
  marginTop: "6px",
  display: "block",
};

const invalidInputStyle = {
  border: "1px solid #ff3366",
  outlineColor: "#ff3366",
};

const OTP_DURATION = 180;
const RESEND_COOLDOWN = 60;

const AdminSettings = () => {
  const [admin, setAdmin] = useState(null);

  // ==========================================
  // ADMIN PROFILE
  // ==========================================
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ==========================================
  // ADMIN PASSWORD
  // ==========================================
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordMessage, setPasswordMessage] = useState("");

  // ==========================================
  // ADMIN PASSWORD OTP
  // ==========================================
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(
    ["", "", "", "", "", ""]
  );
  const [otpError, setOtpError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  const [otpSeconds, setOtpSeconds] = useState(OTP_DURATION);
  const [resendSeconds, setResendSeconds] =
    useState(RESEND_COOLDOWN);

  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);

  const otpInputRefs = useRef([]);
  const otpExpiryRef = useRef(null);
  const resendExpiryRef = useRef(null);

  // ==========================================
  // OTP COUNTDOWN
  // ==========================================
  useEffect(() => {
    if (!showOtpModal) return;

    const updateCountdown = () => {
      const now = Date.now();

      setOtpSeconds(
        Math.max(
          0,
          Math.ceil(
            ((otpExpiryRef.current || now) - now) / 1000
          )
        )
      );

      setResendSeconds(
        Math.max(
          0,
          Math.ceil(
            ((resendExpiryRef.current || now) - now) / 1000
          )
        )
      );
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [showOtpModal]);

  const formatOtpTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  };

  const resetOtpTimer = (
    expiresIn = OTP_DURATION,
    resendAfter = RESEND_COOLDOWN
  ) => {
    const now = Date.now();

    otpExpiryRef.current = now + expiresIn * 1000;
    resendExpiryRef.current = now + resendAfter * 1000;

    setOtpSeconds(expiresIn);
    setResendSeconds(resendAfter);
  };

  // ==========================================
  // FETCH ADMIN PROFILE
  // ==========================================
  useEffect(() => {
    const controller = new AbortController();

    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Please log in to view your admin profile."
          );
        }

        const response = await fetch(
          `${API_URL}/api/auth/my-profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load admin profile."
          );
        }

        if (data.user?.role !== "admin") {
          throw new Error(
            "Administrator account required."
          );
        }

        setAdmin(data.user);
        setUsername(data.user.username || "");
        setProfileImage(data.user.profileImage || "");
        setProfileError("");
      } catch (error) {
        if (error.name !== "AbortError") {
          setProfileError(error.message);
        }
      }
    };

    fetchAdminProfile();

    return () => controller.abort();
  }, []);

  // ==========================================
  // CHANGE ADMIN PROFILE IMAGE
  // ==========================================
  const handleAdminImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Image must be 2 MB or smaller.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfileImage(reader.result);
      setProfileError("");
      setProfileMessage("");
    };

    reader.onerror = () => {
      setProfileError(
        "Unable to read the selected image."
      );
    };

    reader.readAsDataURL(file);
  };

  // ==========================================
  // SAVE ADMIN PROFILE
  // ==========================================
  const handleSaveProfile = async () => {
    const cleanUsername = username.trim();

    if (
      !/^[a-zA-Z0-9_]{3,15}$/.test(cleanUsername)
    ) {
      setProfileError(
        "Username must be 3–15 characters using letters, numbers, or underscores."
      );
      setProfileMessage("");
      return;
    }

    if (!admin || savingProfile) return;

    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Session expired. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}/api/auth/update-profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: cleanUsername,
            profileImage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update admin profile."
        );
      }

      if (!data.user) {
        throw new Error(
          "Profile updated, but the user data was not returned."
        );
      }

      setAdmin(data.user);
      setUsername(
        data.user.username || cleanUsername
      );
      setProfileImage(
        data.user.profileImage || ""
      );

      window.dispatchEvent(
        new Event("admin-profile-updated")
      );

      setProfileMessage(
        "Admin profile updated successfully!"
      );
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // ==========================================
  // CLEAR PASSWORD ERRORS
  // ==========================================
  const clearPasswordError = (field) => {
    setPasswordErrors((previous) => ({
      ...previous,
      [field]: "",
      general: "",
    }));

    setPasswordMessage("");
  };

  // ==========================================
  // PASSWORD VALIDATION
  // ==========================================
  const validatePasswords = () => {
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword =
        "Current password is required.";
    }

    if (!newPassword) {
      errors.newPassword =
        "New password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword =
        "Password must be at least 8 characters long.";
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword =
        "Password must contain at least one uppercase letter.";
    } else if (/\s/.test(newPassword)) {
      errors.newPassword =
        "Password must not contain spaces.";
    } else if (
      currentPassword === newPassword
    ) {
      errors.newPassword =
        "New password must be different from your current password.";
    }

    if (!confirmPassword) {
      errors.confirmPassword =
        "Please confirm your password.";
    } else if (/\s/.test(confirmPassword)) {
      errors.confirmPassword =
        "Password must not contain spaces.";
    } else if (
      newPassword !== confirmPassword
    ) {
      errors.confirmPassword =
        "Passwords do not match.";
    }

    setPasswordErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // ==========================================
  // SEND ADMIN PASSWORD OTP
  // ==========================================
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (savingPassword || !admin) return;

    setPasswordMessage("");

    if (!validatePasswords()) return;

    setSavingPassword(true);
    setPasswordErrors({});

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Session expired. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}/api/auth/admin/change-password/request-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message =
          data.message || "Unable to send OTP.";

        if (/current password/i.test(message)) {
          setPasswordErrors({
            currentPassword: message,
          });
        } else if (
          /confirm|match/i.test(message)
        ) {
          setPasswordErrors({
            confirmPassword: message,
          });
        } else if (
          /new password|uppercase|characters|spaces/i.test(
            message
          )
        ) {
          setPasswordErrors({
            newPassword: message,
          });
        } else {
          setPasswordErrors({
            general: message,
          });
        }

        return;
      }

      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setOtpMessage(
        "A verification code has been sent to your registered email."
      );

      resetOtpTimer(
        data.expiresIn || OTP_DURATION,
        data.resendAfter || RESEND_COOLDOWN
      );

      setShowOtpModal(true);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (error) {
      setPasswordErrors({
        general:
          error.message ||
          "Unable to send verification code.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // ==========================================
  // OTP INPUT HANDLERS
  // ==========================================
  const handleOtpChange = (index, value) => {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      setOtp((previous) => {
        const updated = [...previous];
        updated[index] = "";
        return updated;
      });
      setOtpError("");
      return;
    }

    setOtp((previous) => {
      const updated = [...previous];

      digits
        .slice(0, 6 - index)
        .split("")
        .forEach((digit, offset) => {
          updated[index + offset] = digit;
        });

      return updated;
    });

    const nextIndex = Math.min(
      index + digits.length,
      5
    );

    otpInputRefs.current[nextIndex]?.focus();
    setOtpError("");
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const updated = Array(6).fill("");

    pasted.split("").forEach((digit, index) => {
      updated[index] = digit;
    });

    setOtp(updated);
    setOtpError("");

    otpInputRefs.current[
      Math.min(pasted.length, 5)
    ]?.focus();
  };

  // ==========================================
  // VERIFY OTP AND UPDATE PASSWORD
  // ==========================================
  const handleVerifyAdminOtp = async (e) => {
    e.preventDefault();

    if (verifyingOtp) return;

    const enteredOtp = otp.join("");

    if (!/^\d{6}$/.test(enteredOtp)) {
      setOtpError(
        "Please enter the complete 6-digit code."
      );
      return;
    }

    if (
      !otpExpiryRef.current ||
      Date.now() >= otpExpiryRef.current
    ) {
      setOtpSeconds(0);
      setOtpError(
        "OTP has expired. Please request a new code."
      );
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Session expired. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}/api/auth/admin/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
            otp: enteredOtp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setOtpError(
          data.message ||
            "OTP verification failed."
        );
        return;
      }

      setShowOtpModal(false);

      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setOtpMessage("");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordErrors({});

      setPasswordMessage(
        data.message ||
          "Password updated successfully!"
      );
    } catch (error) {
      setOtpError(
        error.message ||
          "Unable to verify OTP."
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ==========================================
  // RESEND ADMIN OTP
  // ==========================================
  const handleResendAdminOtp = async () => {
    if (
      resendingOtp ||
      verifyingOtp ||
      !resendExpiryRef.current ||
      Date.now() < resendExpiryRef.current
    ) {
      return;
    }

    setResendingOtp(true);
    setOtpError("");
    setOtpMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Session expired. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}/api/auth/admin/change-password/request-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to resend OTP."
        );
      }

      setOtp(["", "", "", "", "", ""]);

      resetOtpTimer(
        data.expiresIn || OTP_DURATION,
        data.resendAfter || RESEND_COOLDOWN
      );

      setOtpMessage(
        "A new verification code has been sent to your email."
      );

      otpInputRefs.current[0]?.focus();
    } catch (error) {
      setOtpError(error.message);
    } finally {
      setResendingOtp(false);
    }
  };

  // ==========================================
  // CLOSE OTP MODAL
  // ==========================================
  const handleCloseOtpModal = () => {
    if (verifyingOtp || resendingOtp) return;

    setShowOtpModal(false);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setOtpMessage("");
  };

  // ==========================================
  // JSX
  // ==========================================
  return (
    <div className="admin-settings-page">
      <div className="admin-settings-grid">

        {/* =====================================
            ADMIN PROFILE
        ===================================== */}
        <section className="admin-settings-card admin-settings-profile">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon profile-icon">
              <UserRound size={24} />
            </div>

            <div>
              <h2>Admin Profile</h2>
              <p>
                View and update your profile information.
              </p>
            </div>
          </div>

          <div className="admin-settings-profile-content">
            <div className="admin-settings-avatar-section">
              <div className="admin-settings-avatar">
                <img
                  src={
                    profileImage ||
                    `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
                      admin?._id || "Admin"
                    )}`
                  }
                  alt="Admin profile"
                />

                <button
                  type="button"
                  className="admin-settings-avatar-upload"
                  title="Change profile picture"
                  onClick={() =>
                    document
                      .getElementById("admin-photo-upload")
                      ?.click()
                  }
                  disabled={!admin || savingProfile}
                >
                  <Camera size={17} />
                </button>

                <input
                  id="admin-photo-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAdminImageChange}
                />
              </div>

              <small>Admin profile picture</small>

              {profileError && (
                <p style={errorTextStyle}>
                  {profileError}
                </p>
              )}
            </div>

            <div className="admin-settings-profile-fields">
              <label htmlFor="admin-settings-username">
                Username
              </label>

              <input
                id="admin-settings-username"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Enter admin username"
                minLength={3}
                maxLength={15}
                disabled={!admin || savingProfile}
              />

              <label htmlFor="admin-settings-email">
                Email
              </label>

              <input
                id="admin-settings-email"
                type="email"
                value={admin?.email || ""}
                placeholder="Loading email..."
                readOnly
              />

              <button
                type="button"
                className="admin-settings-save-btn"
                onClick={handleSaveProfile}
                disabled={!admin || savingProfile}
              >
                <Save size={17} />
                {savingProfile
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              {profileMessage && (
                <p
                  style={{
                    color: "#86efac",
                    fontSize: "12px",
                  }}
                >
                  {profileMessage}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* =====================================
            ACCOUNT SECURITY
        ===================================== */}
        <section className="admin-settings-card admin-settings-security">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon security-icon">
              <LockKeyhole size={24} />
            </div>

            <div>
              <h2>Account Security</h2>
              <p>
                Change your password to keep your
                account secure.
              </p>
            </div>
          </div>

          <form
            className="admin-settings-security-form"
            onSubmit={handleChangePassword}
            noValidate
          >

            {/* CURRENT PASSWORD */}
            <div className="admin-settings-form-group">
              <label htmlFor="admin-current-password">
                Current Password
              </label>

              <div className="admin-password-input-wrap">
                <input
                  id="admin-current-password"
                  type={
                    showCurrentPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    clearPasswordError(
                      "currentPassword"
                    );
                  }}
                  disabled={
                    savingPassword || showOtpModal
                  }
                  style={
                    passwordErrors.currentPassword
                      ? invalidInputStyle
                      : undefined
                  }
                  aria-invalid={
                    !!passwordErrors.currentPassword
                  }
                />

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() =>
                    setShowCurrentPassword(
                      (prev) => !prev
                    )
                  }
                  aria-label={
                    showCurrentPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {passwordErrors.currentPassword && (
                <span
                  style={errorTextStyle}
                  role="alert"
                >
                  {passwordErrors.currentPassword}
                </span>
              )}
            </div>

            {/* NEW PASSWORD */}
            <div className="admin-settings-form-group">
              <label htmlFor="admin-new-password">
                New Password
              </label>

              <div className="admin-password-input-wrap">
                <input
                  id="admin-new-password"
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="At least 8 characters & 1 uppercase letter"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(
                      e.target.value.replace(
                        /\s/g,
                        ""
                      )
                    );
                    clearPasswordError(
                      "newPassword"
                    );
                  }}
                  disabled={
                    savingPassword || showOtpModal
                  }
                  minLength={8}
                  style={
                    passwordErrors.newPassword
                      ? invalidInputStyle
                      : undefined
                  }
                  aria-invalid={
                    !!passwordErrors.newPassword
                  }
                />

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() =>
                    setShowNewPassword(
                      (prev) => !prev
                    )
                  }
                  aria-label={
                    showNewPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {passwordErrors.newPassword && (
                <span
                  style={errorTextStyle}
                  role="alert"
                >
                  {passwordErrors.newPassword}
                </span>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="admin-settings-form-group">
              <label htmlFor="admin-confirm-password">
                Confirm New Password
              </label>

              <div className="admin-password-input-wrap">
                <input
                  id="admin-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(
                      e.target.value.replace(
                        /\s/g,
                        ""
                      )
                    );
                    clearPasswordError(
                      "confirmPassword"
                    );
                  }}
                  disabled={
                    savingPassword || showOtpModal
                  }
                  style={
                    passwordErrors.confirmPassword
                      ? invalidInputStyle
                      : undefined
                  }
                  aria-invalid={
                    !!passwordErrors.confirmPassword
                  }
                />

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {passwordErrors.confirmPassword && (
                <span
                  style={errorTextStyle}
                  role="alert"
                >
                  {passwordErrors.confirmPassword}
                </span>
              )}
            </div>
{/* PASSWORD REQUIREMENTS */}
<div className="admin-settings-password-requirements">
  <h4>
    <ShieldCheck
      size={15}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        marginRight: "8px",
      }}
    />
    Password Requirements
  </h4>

  <ul>
    <li>At least 8 characters long</li>
    <li>Contains at least one uppercase letter (A-Z)</li>
    <li>No spaces allowed</li>
    <li>Must be different from your current password</li>
  </ul>
</div>
            {/* GENERAL ERROR */}
            {passwordErrors.general && (
              <p
                style={errorTextStyle}
                role="alert"
              >
                {passwordErrors.general}
              </p>
            )}

            {/* SUCCESS MESSAGE */}
            {passwordMessage && (
              <p
                style={{
                  color: "#86efac",
                  fontSize: "12px",
                }}
                role="status"
              >
                {passwordMessage}
              </p>
            )}

            <button
              type="submit"
              className="admin-settings-password-btn"
              disabled={
                savingPassword ||
                !admin ||
                showOtpModal
              }
            >
              <KeyRound size={17} />
              {savingPassword
                ? "Sending OTP..."
                : "Send OTP"}
            </button>
          </form>
        </section>

        {/* =====================================
            SYSTEM INFORMATION
        ===================================== */}
        
<section className="admin-settings-card admin-settings-system">
  <div className="admin-settings-card-header">
    <div className="admin-settings-icon system-icon">
      <Info size={24} />
    </div>

    <div>
      <h2>System Information</h2>
      <p>Basic information about the SkillLink platform.</p>
    </div>
  </div>

  <div className="admin-settings-system-grid">
    <div className="admin-settings-system-item">
      <div className="admin-settings-system-content">
        <div className="admin-settings-system-icon">
          <Database size={20} />
        </div>
        <div className="admin-settings-system-details">
          <span>Platform Name</span>
          <strong>SkillLink</strong>
        </div>
      </div>
      <span className="admin-settings-system-badge">Platform</span>
    </div>

    <div className="admin-settings-system-item">
      <div className="admin-settings-system-content">
        <div className="admin-settings-system-icon">
          <Layers3 size={20} />
        </div>
        <div className="admin-settings-system-details">
          <span>Platform Type</span>
          <strong>Student Skill Matching Platform</strong>
        </div>
      </div>
      <span className="admin-settings-system-badge">Web Application</span>
    </div>

    <div className="admin-settings-system-item">
      <div className="admin-settings-system-content">
        <div className="admin-settings-system-icon">
          <UsersRound size={20} />
        </div>
        <div className="admin-settings-system-details">
          <span>Account Role</span>
          <strong>Administrator</strong>
        </div>
      </div>
      <span className="admin-settings-system-badge">Admin Access</span>
    </div>

    <div className="admin-settings-system-item">
      <div className="admin-settings-system-content">
        <div className="admin-settings-system-icon">
          <Code2 size={20} />
        </div>
        <div className="admin-settings-system-details">
          <span>Technology Stack</span>
          <strong>MongoDB, Express, React, Node.js</strong>
        </div>
      </div>
      <span className="admin-settings-system-badge">MERN Stack</span>
    </div>
  </div>
</section>

      </div>

      {/* =====================================
          ADMIN PASSWORD OTP MODAL
      ===================================== */}
      {showOtpModal && (
        <div
          className="admin-otp-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(5, 5, 20, 0.78)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="admin-otp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-otp-title"
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "#17132d",
              border: "1px solid #51416f",
              borderRadius: "18px",
              padding: "30px",
              color: "#ffffff",
              textAlign: "center",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.45)",
              position: "relative",
            }}
          >
            {/* CLOSE */}
            <button
              type="button"
              onClick={handleCloseOtpModal}
              disabled={
                verifyingOtp || resendingOtp
              }
              aria-label="Close verification"
              style={{
                position: "absolute",
                right: "18px",
                top: "18px",
                background: "transparent",
                border: "none",
                color: "#bcb4d0",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>

            {/* ICON */}
            <div
              style={{
                width: "60px",
                height: "60px",
                margin: "0 auto 16px",
                borderRadius: "16px",
                background: "#302052",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c4a1ff",
              }}
            >
              <ShieldCheck size={30} />
            </div>

            <h2
              id="admin-otp-title"
              style={{
                fontSize: "23px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Verify Your Identity
            </h2>

            <p
              style={{
                color: "#bcb4d0",
                fontSize: "13px",
                lineHeight: 1.7,
              }}
            >
              Enter the 6-digit verification code
              sent to your registered email address.
            </p>

            {/* EMAIL */}
            <div
              style={{
                marginTop: "14px",
                color: "#c4a1ff",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                overflowWrap: "anywhere",
              }}
            >
              <Mail size={16} />
              <span>{admin?.email}</span>
            </div>

            <form
              onSubmit={handleVerifyAdminOtp}
            >
              {/* SIX OTP BOXES */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  marginTop: "26px",
                }}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpInputRefs.current[index] =
                        element;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={
                      index === 0
                        ? "one-time-code"
                        : "off"
                    }
                    maxLength={6}
                    value={digit}
                    aria-label={`OTP digit ${
                      index + 1
                    }`}
                    onChange={(e) =>
                      handleOtpChange(
                        index,
                        e.target.value
                      )
                    }
                    onKeyDown={(e) =>
                      handleOtpKeyDown(index, e)
                    }
                    onPaste={handleOtpPaste}
                    disabled={
                      verifyingOtp ||
                      otpSeconds === 0
                    }
                    style={{
                      width: "44px",
                      height: "54px",
                      minWidth: 0,
                      borderRadius: "10px",
                      border: otpError
                        ? "1px solid #ff3366"
                        : "1px solid #65518d",
                      background: "#100d22",
                      color: "#ffffff",
                      textAlign: "center",
                      fontSize: "22px",
                      fontWeight: 700,
                      outlineColor: "#a855f7",
                      boxSizing: "border-box",
                    }}
                  />
                ))}
              </div>

              {/* OTP ERROR */}
              {otpError && (
                <p
                  role="alert"
                  style={{
                    color: "#ff647c",
                    fontSize: "12px",
                    marginTop: "12px",
                  }}
                >
                  {otpError}
                </p>
              )}

              {/* OTP MESSAGE */}
              {otpMessage && !otpError && (
                <p
                  role="status"
                  style={{
                    color: "#86efac",
                    fontSize: "12px",
                    marginTop: "12px",
                  }}
                >
                  {otpMessage}
                </p>
              )}

              {/* COUNTDOWN */}
              <p
                style={{
                  marginTop: "18px",
                  color:
                    otpSeconds === 0
                      ? "#ff647c"
                      : "#c4a1ff",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {otpSeconds > 0
                  ? `Code expires in ${formatOtpTime(
                      otpSeconds
                    )}`
                  : "Verification code expired"}
              </p>

              {/* VERIFY BUTTON */}
              <button
                type="submit"
                disabled={
                  verifyingOtp ||
                  resendingOtp ||
                  otp.join("").length !== 6 ||
                  otpSeconds === 0
                }
                style={{
                  width: "100%",
                  marginTop: "18px",
                  padding: "14px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#8246e5",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  opacity:
                    verifyingOtp ||
                    resendingOtp ||
                    otp.join("").length !== 6 ||
                    otpSeconds === 0
                      ? 0.55
                      : 1,
                }}
              >
                {verifyingOtp
                  ? "Verifying..."
                  : "Verify & Update Password"}
              </button>
            </form>

            {/* RESEND OTP */}
            <p
              style={{
                marginTop: "20px",
                color: "#bcb4d0",
                fontSize: "13px",
              }}
            >
              Didn't receive the code?
            </p>

            <button
              type="button"
              onClick={handleResendAdminOtp}
              disabled={
                resendSeconds > 0 ||
                resendingOtp ||
                verifyingOtp
              }
              style={{
                background: "transparent",
                border: "none",
                color: "#c4a1ff",
                fontWeight: 700,
                fontSize: "13px",
                cursor:
                  resendSeconds > 0
                    ? "default"
                    : "pointer",
                opacity:
                  resendSeconds > 0 ? 0.55 : 1,
                marginTop: "6px",
              }}
            >
              {resendingOtp
                ? "Sending..."
                : resendSeconds > 0
                ? `Resend Code (${resendSeconds}s)`
                : "Resend Code"}
            </button>

            {/* CANCEL */}
            <button
              type="button"
              onClick={handleCloseOtpModal}
              disabled={
                verifyingOtp || resendingOtp
              }
              style={{
                display: "block",
                margin: "22px auto 0",
                background: "transparent",
                border: "none",
                color: "#aaa2bc",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
