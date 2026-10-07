import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './Notifications.css';

const API_URL = 'https://skilllink-backend-v277.onrender.com';
const SOCKET_URL = 'https://skilllink-backend-v277.onrender.com';

function Notifications() {
  const navigate = useNavigate();

  // LOGGED IN USER DATA
  const loggedInUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  const userId = String(
    loggedInUser._id ||
      loggedInUser.id ||
      loggedInUser.userId ||
      ''
  );

  const token = localStorage.getItem('token') || '';

  // STATES
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);

  // API HEADERS
  const getHeaders = useCallback(
    (includeContentType = false) => {
      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (includeContentType) {
        headers['Content-Type'] = 'application/json';
      }

      return headers;
    },
    [token]
  );

  // FETCH NOTIFICATIONS
  const fetchNotifications = useCallback(
    async (showLoading = false) => {
      if (!userId || !token) {
        setNotifications([]);
        setLoading(false);
        setError('Please log in to view your notifications.');
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }

        const response = await fetch(
          `${API_URL}/api/notifications/${encodeURIComponent(userId)}`,
          {
            method: 'GET',
            headers: getHeaders(),
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Failed to load notifications (${response.status}).`
          );
        }

        if (!Array.isArray(data)) {
          throw new Error(
            'Invalid notifications response from server.'
          );
        }

        setNotifications(
          [...data].sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          )
        );

        setError('');
      } catch (err) {
        console.error('Error loading notifications:', err);
        setError(
          err.message || 'Unable to load notifications.'
        );
      } finally {
        setLoading(false);
      }
    },
    [userId, token, getHeaders]
  );

  // SOCKET.IO REALTIME UPDATES + POLLING
  useEffect(() => {
    if (!userId || !token) {
      setNotifications([]);
      setLoading(false);
      setError('Please log in to view your notifications.');
      return;
    }

    let isMounted = true;

    fetchNotifications(true);

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log(
        'Connected to notification server:',
        socket.id
      );
    });

    socket.on('connect_error', (err) => {
      console.error(
        'Notification socket connection error:',
        err.message
      );
    });

    socket.on('new_notification', (newNotification) => {
      if (!isMounted || !newNotification?._id) {
        return;
      }

      setNotifications((previous) => {
        const notificationId = String(newNotification._id);

        const alreadyExists = previous.some(
          (notification) =>
            String(notification._id) === notificationId
        );

        if (alreadyExists) {
          return previous.map((notification) =>
            String(notification._id) === notificationId
              ? { ...notification, ...newNotification }
              : notification
          );
        }

        return [newNotification, ...previous];
      });
    });

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);

      socket.off('new_notification');
      socket.off('connect');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [userId, token, fetchNotifications]);

  // OPEN MESSAGE CONVERSATION
  const handleNotificationClick = (notification) => {
    if (notification.type !== 'Message') {
      return;
    }

    const senderId =
      typeof notification.senderId === 'object'
        ? notification.senderId?._id ||
          notification.senderId?.id ||
          notification.senderId?.userId ||
          ''
        : notification.senderId;

    if (!senderId) {
      setError(
        'Unable to open this conversation. Sender information is missing.'
      );
      return;
    }

    navigate('/dashboard', {
      state: {
        activeTab: 'Message',
        openChatUserId: String(senderId),
      },
    });
  };

  // MARK ALL AS READ
  const handleMarkAllRead = async () => {
    if (!userId || !token) {
      setError('Please log in again.');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/mark-all-read/${encodeURIComponent(userId)}`,
        {
          method: 'PUT',
          headers: getHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to mark notifications as read (${response.status}).`
        );
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setError('');
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError(
        err.message || 'Failed to mark notifications as read.'
      );
    }
  };

  // HIDE ONE NOTIFICATION FOR ME
  const handleDeleteNotification = async (notification, event) => {
    event?.preventDefault();
    event?.stopPropagation();

    const notificationId = notification?._id;

    if (
      !notificationId ||
      !userId ||
      !token ||
      deletingId ||
      deletingAll
    ) {
      return;
    }

    const confirmed = window.confirm(
      'Hide this notification from your account?\n\nThis will not affect other users.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(String(notificationId));
      setError('');

      const response = await fetch(
        `${API_URL}/api/notifications/${encodeURIComponent(notificationId)}/hide`,
        {
          method: 'PATCH',
          headers: getHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to hide notification (${response.status}).`
        );
      }

      setNotifications((previous) =>
        previous.filter(
          (item) => String(item._id) !== String(notificationId)
        )
      );
    } catch (err) {
      console.error('Error hiding notification:', err);
      setError(
        err.message || 'Failed to hide notification.'
      );
    } finally {
      setDeletingId('');
    }
  };

  // HIDE ALL NOTIFICATIONS FOR ME
  const handleDeleteAll = async () => {
    if (!userId || !token) {
      setError('Please log in again.');
      return;
    }

    if (deletingAll || deletingId) {
      return;
    }

    if (notifications.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      'Hide all your notifications?\n\nThey will disappear from your account, but other users will not be affected.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAll(true);
      setError('');

      const response = await fetch(
        `${API_URL}/api/notifications/hide-all`,
        {
          method: 'PATCH',
          headers: getHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to hide notifications (${response.status}).`
        );
      }

      setNotifications([]);
    } catch (err) {
      console.error('Error hiding notifications:', err);
      setError(
        err.message || 'Failed to hide all notifications.'
      );
    } finally {
      setDeletingAll(false);
    }
  };

  // ACCEPT / DECLINE ACTIONS
  const handleAction = async (id, actionStatus) => {
    if (!id || !userId || !token) {
      setError('Please log in again.');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/action/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          headers: getHeaders(true),
          body: JSON.stringify({
            status: actionStatus,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to update notification (${response.status}).`
        );
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          String(notification._id) === String(id)
            ? {
                ...notification,
                status: actionStatus,
                isRead: true,
              }
            : notification
        )
      );

      setError('');
    } catch (err) {
      console.error('Error updating notification:', err);
      setError(
        err.message || 'Failed to update notification.'
      );
    }
  };

  // FILTERING
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'All') {
      return true;
    }

    return (
      item.type &&
      item.type.toLowerCase() === activeTab.toLowerCase()
    );
  });

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const getIconForType = (type) => {
    switch (type) {
      case 'Request':
        return '👤';
      case 'Project':
        return '🎵';
      case 'Message':
        return '💬';
      default:
        return '🔔';
    }
  };

  // RENDER UI
  return (
    <div className="notifications-page-container">
      <div className="notifications-header-row">
        <div>
          <span className="sub-title">STAY UPDATED</span>

          <h1>Notifications</h1>

          <p className="subtitle-desc">
            Keep track of your connections, projects, messages,
            and collaborations.
          </p>
        </div>

        <div className="notification-header-actions">
          {unreadCount > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={handleMarkAllRead}
              type="button"
            >
              ✓ Mark all as read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              className="delete-all-notifications-btn"
              onClick={handleDeleteAll}
              type="button"
              disabled={deletingAll || Boolean(deletingId)}
            >
              {deletingAll ? 'Deleting...' : '🗑 Delete all'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            color: '#f87171',
            padding: '10px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f87171',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="filter-tabs-wrapper">
        {['All', 'Request', 'Project', 'Message'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`filter-tab-btn ${
              activeTab === tab ? 'active' : ''
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="notifications-list">
        {loading ? (
          <div className="empty-notifications">
            <h3>Loading notifications...</h3>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-notifications">
            <div
              style={{
                fontSize: '40px',
                marginBottom: '12px',
              }}
            >
              🔔
            </div>

            <h3>No notifications yet</h3>

            <p>
              {activeTab === 'All'
                ? "You're all caught up! When you receive requests, messages, or project invites, they will appear here."
                : `No ${activeTab.toLowerCase()} notifications found.`}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isMessage = notif.type === 'Message';

            return (
              <div
                key={notif._id}
                className={`notification-card ${
                  !notif.isRead ? 'unread' : ''
                }`}
                onClick={() => handleNotificationClick(notif)}
                onKeyDown={(event) => {
                  if (
                    isMessage &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                    handleNotificationClick(notif);
                  }
                }}
                role={isMessage ? 'button' : undefined}
                tabIndex={isMessage ? 0 : undefined}
                style={{
                  cursor: isMessage ? 'pointer' : 'default',
                }}
                title={
                  isMessage
                    ? 'Click to open conversation'
                    : undefined
                }
              >
                <div className="notif-icon-box">
                  {getIconForType(notif.type)}
                </div>

                <div className="notif-content-box">
                  <div className="notif-top-row">
                    <h3>{notif.title}</h3>

                    <div className="notif-meta">
                      <span className="time-text">
                        {notif.timeAgo || 'Just now'}
                      </span>

                      {!notif.isRead && (
                        <span className="unread-dot"></span>
                      )}
                    </div>
                  </div>

                  <p className="notif-description">
                    {notif.description}
                  </p>

                  {isMessage && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#a855f7',
                        fontWeight: '600',
                      }}
                    >
                      Open conversation →
                    </span>
                  )}

                  {notif.status === 'pending' &&
                    (notif.type === 'Request' ||
                      notif.type === 'Project') && (
                      <div className="notif-action-buttons">
                        <button
                          className="action-btn accept-btn"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleAction(notif._id, 'accepted');
                          }}
                        >
                          ✓ Accept
                        </button>

                        <button
                          className="action-btn decline-btn"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleAction(notif._id, 'declined');
                          }}
                        >
                          ✕ Decline
                        </button>
                      </div>
                    )}

                  {notif.status === 'accepted' && (
                    <span className="status-badge accepted">
                      ✓ Accepted
                    </span>
                  )}

                  {notif.status === 'declined' && (
                    <span className="status-badge declined">
                      ✕ Declined
                    </span>
                  )}

                  <div className="notif-delete-row">
                    <button
                      className="delete-notification-btn"
                      type="button"
                      disabled={
                        deletingAll ||
                        deletingId === String(notif._id)
                      }
                      onClick={(event) =>
                        handleDeleteNotification(notif, event)
                      }
                    >
                      {deletingId === String(notif._id)
                        ? 'Deleting...'
                        : '🗑 Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Notifications;