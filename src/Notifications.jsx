
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './Notifications.css';

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const normalizeStatus = (status) => {
  const value = String(status || '').toLowerCase();

  if (['accepted', 'accept'].includes(value)) return 'accepted';
  if (['declined', 'rejected', 'reject'].includes(value)) return 'declined';

  return value || 'pending';
};

const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    return String(value._id || value.id || value.userId || '');
  }
  return String(value);
};

function Notifications() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingIds, setProcessingIds] = useState([]);
  const [deletingId, setDeletingId] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [deleteAllMode, setDeleteAllMode] = useState(false);

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  const userId = getId(user._id || user.id || user.userId);
  const token = localStorage.getItem('token') || '';

  const getHeaders = useCallback(
    (json = false) => {
      const headers = {};

      if (token) headers.Authorization = `Bearer ${token}`;
      if (json) headers['Content-Type'] = 'application/json';

      return headers;
    },
    [token]
  );

  const fetchNotifications = useCallback(
    async (showLoading = false) => {
      if (!userId || !token) {
        setNotifications([]);
        setLoading(false);
        setError('Please log in to view your notifications.');
        return;
      }

      try {
        if (showLoading) setLoading(true);

        const response = await fetch(
          `${API_URL}/api/notifications/${encodeURIComponent(userId)}`,
          { headers: getHeaders() }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load notifications.');
        }

        if (!Array.isArray(data)) {
          throw new Error('Invalid notifications response.');
        }

        setNotifications(
          data
            .map((item) => ({
              ...item,
              status: normalizeStatus(item.status),
              isRead: Boolean(item.isRead),
            }))
            .sort(
              (a, b) =>
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime()
            )
        );

        setError('');
      } catch (err) {
        console.error('Fetch notifications error:', err);
        setError(err.message || 'Unable to load notifications.');
      } finally {
        setLoading(false);
      }
    },
    [userId, token, getHeaders]
  );

  // Initial load, Socket.IO and periodic refresh
  useEffect(() => {
    if (!userId || !token) {
      setLoading(false);
      setError('Please log in to view your notifications.');
      return undefined;
    }

    fetchNotifications(true);

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('new_notification', (incoming) => {
      if (!incoming?._id) return;

      setNotifications((previous) => {
        const exists = previous.some(
          (item) => getId(item._id) === getId(incoming._id)
        );

        if (exists) {
          return previous.map((item) =>
            getId(item._id) === getId(incoming._id)
              ? { ...item, ...incoming }
              : item
          );
        }

        return [
          { ...incoming, status: normalizeStatus(incoming.status) },
          ...previous,
        ];
      });
    });

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 10000);

    return () => {
      clearInterval(interval);
      socket.off('new_notification');
      socket.disconnect();
    };
  }, [userId, token, fetchNotifications]);

  // Mark one notification as read
  const handleMarkAsRead = async (notification) => {
    const id = getId(notification?._id);

    if (!id || notification.isRead || !token) return;

    // Immediately remove unread highlight and dot.
    setNotifications((previous) =>
      previous.map((item) =>
        getId(item._id) === id ? { ...item, isRead: true } : item
      )
    );

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${encodeURIComponent(id)}/read`,
        {
          method: 'PATCH',
          headers: getHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not save read status. Check your backend route.'
        );
      }
    } catch (err) {
      console.error('Mark as read error:', err);

      // Restore unread status if the backend did not save it.
      setNotifications((previous) =>
        previous.map((item) =>
          getId(item._id) === id ? { ...item, isRead: false } : item
        )
      );

      setError(err.message || 'Failed to mark as read.');
    }
  };

  // Open a message notification
  const handleNotificationClick = (notification) => {
    if (notification.type !== 'Message') return;

    const senderId = getId(notification.senderId);

    if (!senderId) {
      setError('Unable to open conversation: sender was not found.');
      return;
    }

    navigate('/dashboard', {
      state: {
        activeTab: 'Message',
        openChatUserId: senderId,
      },
    });
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
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
        throw new Error(data.message || 'Failed to mark all as read.');
      }

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, isRead: true }))
      );

      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to mark all as read.');
    }
  };


  // Open the confirmation popup for one notification.
  const handleDeleteNotification = (notification, event) => {
    event?.preventDefault();
    event?.stopPropagation();

    const id = getId(notification?._id);

    if (!id || deletingId || deletingAll) return;

    setNotificationToDelete(notification);
    setDeleteAllMode(false);
    setShowDeleteModal(true);
  };

  // Open the confirmation popup for all notifications.
  const handleDeleteAll = () => {
    if (deletingAll || deletingId || !notifications.length) return;

    setNotificationToDelete(null);
    setDeleteAllMode(true);
    setShowDeleteModal(true);
  };

  // Cancel the deletion.
  const cancelDeleteNotification = () => {
    if (deletingId || deletingAll) return;

    setShowDeleteModal(false);
    setNotificationToDelete(null);
    setDeleteAllMode(false);
  };

  // Confirm and perform the selected deletion.
  const confirmDeleteNotification = async () => {
    if (deletingId || deletingAll) return;

    setError('');

    if (deleteAllMode) {
      try {
        setDeletingAll(true);

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
            data.message || 'Failed to hide notifications.'
          );
        }

        setNotifications([]);
        setShowDeleteModal(false);
        setNotificationToDelete(null);
        setDeleteAllMode(false);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Unable to hide notifications.');
      } finally {
        setDeletingAll(false);
      }

      return;
    }

    const id = getId(notificationToDelete?._id);

    if (!id) return;

    try {
      setDeletingId(id);

      const response = await fetch(
        `${API_URL}/api/notifications/${encodeURIComponent(id)}/hide`,
        {
          method: 'PATCH',
          headers: getHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to hide notification.'
        );
      }

      setNotifications((previous) =>
        previous.filter((item) => getId(item._id) !== id)
      );

      setShowDeleteModal(false);
      setNotificationToDelete(null);
      setDeleteAllMode(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to hide notification.');
    } finally {
      setDeletingId('');
    }
  };


  // Accept or decline requests


const handleAction = async (notification, actionStatus) => {
  const notificationId = getId(notification?._id);

  if (!notificationId || processingIds.includes(notificationId)) return;

  if (normalizeStatus(notification.status) !== 'pending') {
    setError('This request has already been processed.');
    return;
  }

  setProcessingIds((previous) => [...previous, notificationId]);
  setError('');

  try {
    let response;

    if (notification.type === 'Project') {
      const projectId = getId(notification.projectId);
      const requestId = getId(notification.requestId);

      if (!projectId || !requestId) {
        throw new Error('Missing project ID or join request ID.');
      }

      response = await fetch(
        `${API_URL}/api/projects/${encodeURIComponent(projectId)}/requests/${encodeURIComponent(requestId)}`,
        {
          method: 'PATCH',
          headers: getHeaders(true),
          body: JSON.stringify({
            decision: actionStatus === 'accepted' ? 'Accept' : 'Reject',
          }),
        }
      );
    } else if (notification.type === 'Request') {
      const connectionId = getId(notification.requestId);

      if (!connectionId) {
        throw new Error(
          'Connection request ID is missing. Please refresh your notifications.'
        );
      }

      response = await fetch(
        `${API_URL}/api/connections/${encodeURIComponent(connectionId)}/respond`,
        {
          method: 'PATCH',
          headers: getHeaders(true),
          body: JSON.stringify({
            status: actionStatus,
          }),
        }
      );
    } else {
      throw new Error('This notification does not support this action.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to process request.');
    }

    setNotifications((previous) =>
      previous.map((item) =>
        getId(item._id) === notificationId
          ? {
              ...item,
              status: actionStatus,
              isRead: true,
            }
          : item
      )
    );

    await fetchNotifications(false);
  } catch (err) {
    console.error('Action error:', err);
    setError(err.message || 'Failed to process request.');
  } finally {
    setProcessingIds((previous) =>
      previous.filter((id) => id !== notificationId)
    );
  }
};



  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'All') return true;
    return String(item.type || '').toLowerCase() === activeTab.toLowerCase();
  });

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const getIconForType = (type) => {
    switch (type) {
      case 'Request':
        return '👤';
      case 'Project':
        return '📁';
      case 'Message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const renderStatus = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === 'accepted') {
      return (
        <span className="status-badge accepted">
          ✓ Accepted
        </span>
      );
    }

    if (normalized === 'declined') {
      return (
        <span className="status-badge declined">
          ✕ Declined
        </span>
      );
    }

    return null;
  };

  return (
    <div className="notifications-page-container">
      <div className="notifications-header-row">
        <div>
          <span className="sub-title">STAY UPDATED</span>
          <h1>Notifications</h1>
          <p className="subtitle-desc">
            Keep track of your connections, projects, messages, and collaborations.
          </p>
        </div>

        <div className="notification-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="mark-all-read-btn"
              onClick={handleMarkAllRead}
            >
              ✓ Mark all as read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              className="delete-all-notifications-btn"
              onClick={handleDeleteAll}
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
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
            style={{
              background: 'transparent',
              border: 0,
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '18px',
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
            className={`filter-tab-btn ${activeTab === tab ? 'active' : ''}`}
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
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
            <h3>No notifications yet</h3>
            <p>
              {activeTab === 'All'
                ? "You're all caught up! New requests, messages, and project updates will appear here."
                : `No ${activeTab.toLowerCase()} notifications found.`}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const id = getId(notif._id);
            const status = normalizeStatus(notif.status);
            const isProcessing = processingIds.includes(id);
            const canRespond =
              status === 'pending' &&
              ['Request', 'Project'].includes(notif.type);

            return (
              <div
                key={id}
                className={`notification-card ${!notif.isRead ? 'unread' : ''}`}
                onClick={() => {
                  if (!notif.isRead) handleMarkAsRead(notif);
                  handleNotificationClick(notif);
                }}
                onKeyDown={(event) => {
                  if (
                    notif.type === 'Message' &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                    if (!notif.isRead) handleMarkAsRead(notif);
                    handleNotificationClick(notif);
                  }
                }}
                role={notif.type === 'Message' ? 'button' : undefined}
                tabIndex={notif.type === 'Message' ? 0 : undefined}
                style={{
                  cursor: notif.type === 'Message' ? 'pointer' : 'default',
                }}
              >
                <div className="notif-icon-box">
              {notif.senderId &&
              typeof notif.senderId === 'object' &&
              ['Request', 'Project', 'Message'].includes(notif.type) ? (
                <img
                  src={
                    notif.senderId.profileImage ||
                    `https://api.dicebear.com/9.x/${encodeURIComponent(
                      notif.senderId.avatarStyle || 'avataaars'
                    )}/svg?seed=${encodeURIComponent(
                      notif.senderId.username || getId(notif.senderId)
                    )}`
                  }
                  alt="Sender profile"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                getIconForType(notif.type)
              )}
                </div>

                <div className="notif-content-box">
                  <div className="notif-top-row">
                    <div>
                  {notif.senderId &&
                    typeof notif.senderId === 'object' &&
                    ['Request', 'Project', 'Message'].includes(notif.type) && (
                      <span
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          fontSize: '15px',
                          marginBottom: '4px',
                        }}
                      >
                        @{notif.senderId.username || 'Unknown User'}
                      </span>
                    )}

                  <h3>
  {notif.senderId?.username && notif.type === 'Request'
    ? normalizeStatus(notif.status) === 'accepted'
      ? `@${notif.senderId.username} accepted your connection request`
      : normalizeStatus(notif.status) === 'declined'
      ? `@${notif.senderId.username} declined your connection request`
      : `@${notif.senderId.username} sent you a connection request`
    : notif.senderId?.username && notif.type === 'Message'
    ? `New message from @${notif.senderId.username}`
    : notif.title}
</h3>
                </div>

                    <div className="notif-meta">
                      <span className="time-text">
                        {notif.timeAgo ||
                          (notif.createdAt
                            ? new Date(notif.createdAt).toLocaleString()
                            : 'Just now')}
                      </span>

                      {!notif.isRead && <span className="unread-dot" />}
                    </div>
                  </div>

                  <p className="notif-description">
                    {notif.senderId &&
                    typeof notif.senderId === 'object' &&
                    notif.senderId.username
                      ? notif.type === 'Request'
                        ? `@${notif.senderId.username} sent you a connection request.`
                        : notif.type === 'Project' &&
                          normalizeStatus(notif.status) === 'pending'
                        ? `@${notif.senderId.username} requested to join your project.`
                        : notif.description
                      : notif.description}
                  </p>

                  {/* Accepted / Declined status */}
                  {renderStatus(status)}

                  {notif.type === 'Message' && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#a855f7',
                        fontWeight: 600,
                      }}
                    >
                      Open conversation →
                    </span>
                  )}

                  {/* Buttons only show while request is pending */}
                  {canRespond && (
                    <div
                      className="notif-action-buttons"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="action-btn accept-btn"
                        disabled={isProcessing}
                        onClick={() => handleAction(notif, 'accepted')}
                      >
                        {isProcessing ? 'Processing...' : '✓ Accept'}
                      </button>

                      <button
                        type="button"
                        className="action-btn decline-btn"
                        disabled={isProcessing}
                        onClick={() => handleAction(notif, 'declined')}
                      >
                        {isProcessing ? 'Processing...' : '✕ Decline'}
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className="notif-delete-row"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="delete-notification-btn"
                    title="Hide notification"
                    aria-label="Hide notification"
                    disabled={deletingId === id || deletingAll}
                    onClick={(event) =>
                      handleDeleteNotification(notif, event)
                    }
                  >
                    {deletingId === id ? '...' : '×'}
                  </button>
                </div>
              </div>
            );
          })
        )}
            </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="delete-modal-overlay"
          onClick={cancelDeleteNotification}
        >
          <div
            className="delete-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-modal-icon">🗑️</div>

            <h2>
              {deleteAllMode
                ? 'Delete All Notifications?'
                : 'Delete Notification?'}
            </h2>

            <p>
              {deleteAllMode
                ? 'Are you sure you want to delete all your notifications?'
                : 'Are you sure you want to delete this notification? '}
            </p>

            {error && (
              <p className="delete-modal-error" role="alert">
                {error}
              </p>
            )}

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-modal-cancel"
                onClick={cancelDeleteNotification}
                disabled={deletingAll || Boolean(deletingId)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-modal-confirm"
                onClick={confirmDeleteNotification}
                disabled={deletingAll || Boolean(deletingId)}
              >
                {deletingAll || deletingId
                  ? 'Deleting...'
                  : deleteAllMode
                  ? 'Delete All'
                  : 'Delete Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;