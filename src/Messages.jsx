import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './Messages.css';

const API_URL = 'https://skilllink-backend-v277.onrender.com/api';
const SOCKET_URL = 'https://skilllink-backend-v277.onrender.com';

function Messages() {
  const location = useLocation();

  const openChatUserId = String(
    location.state?.openChatUserId || ''
  );

  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState('');
  const [openMenuChatId, setOpenMenuChatId] = useState('');
  const [error, setError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPosition, setEmojiPosition] = useState({
    top: 0,
    left: 0,
  });

  const socketRef = useRef(null);
  const activeChatRef = useRef(null);
  const messagesBodyRef = useRef(null);
  const currentUserIdRef = useRef('');
  const emojiButtonRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);
  const chatMenuRef = useRef(null);
  const usersRef = useRef([]);

  const token = localStorage.getItem('token');

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  const currentUserId = String(
    currentUser._id ||
      currentUser.id ||
      currentUser.userId ||
      ''
  );

  currentUserIdRef.current = currentUserId;

  const deletedStorageKey = `deletedConversations_${currentUserId}`;
  const chatOrderStorageKey = `chatOrder_${currentUserId}`;

  // ==========================================
  // SAVE AND RESTORE CHAT ORDER
  // ==========================================

  const getSavedChatOrder = () => {
    try {
      return JSON.parse(
        localStorage.getItem(chatOrderStorageKey) || '{}'
      );
    } catch {
      return {};
    }
  };

  const saveChatActivity = (chatId, message, createdAt) => {
    if (!chatId) return;

    const savedOrder = getSavedChatOrder();

    savedOrder[String(chatId)] = {
      timestamp: createdAt || new Date().toISOString(),
      lastMsg: message || '',
    };

    localStorage.setItem(
      chatOrderStorageKey,
      JSON.stringify(savedOrder)
    );
  };

  const sortChatsByLatest = (chatList) => {
    const savedOrder = getSavedChatOrder();

    return [...chatList].sort((a, b) => {
      const timeA = new Date(
        savedOrder[a.id]?.timestamp || 0
      ).getTime();

      const timeB = new Date(
        savedOrder[b.id]?.timestamp || 0
      ).getTime();

      return timeB - timeA;
    });
  };

  // ==========================================
  // HIDDEN CONVERSATIONS
  // ==========================================

  const getDeletedConversationIds = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(deletedStorageKey) || '[]'
      );

      return Array.isArray(saved) ? saved.map(String) : [];
    } catch {
      return [];
    }
  };

  const hideConversation = (userId) => {
    const id = String(userId);
    const deletedIds = getDeletedConversationIds();

    if (!deletedIds.includes(id)) {
      localStorage.setItem(
        deletedStorageKey,
        JSON.stringify([...deletedIds, id])
      );
    }
  };

  const restoreConversation = (userId) => {
    const id = String(userId);
    const remainingIds = getDeletedConversationIds().filter(
      (deletedId) => deletedId !== id
    );

    localStorage.setItem(
      deletedStorageKey,
      JSON.stringify(remainingIds)
    );
  };

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  // ==========================================
  // HELPERS
  // ==========================================

  const getUserId = (user) => {
    if (!user) return '';

    if (typeof user === 'string') {
      return user;
    }

    return String(
      user._id ||
        user.id ||
        user.userId ||
        ''
    );
  };

  const getUserName = (user) => {
    if (!user) return 'Unknown User';
    if (typeof user === 'string') return 'User';

    return (
      user.fullName ||
      user.name ||
      user.username ||
      user.email ||
      'Unknown User'
    );
  };

  const getUserRole = (user) => {
    if (!user || typeof user === 'string') {
      return 'SkillLink Member';
    }

    return (
      user.skill ||
      user.role ||
      user.category ||
      'SkillLink Member'
    );
  };

  const getAvatar = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const getMessageTime = (date) => {
    if (!date) return '';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    const today = new Date();

    const isToday =
      parsedDate.getDate() === today.getDate() &&
      parsedDate.getMonth() === today.getMonth() &&
      parsedDate.getFullYear() === today.getFullYear();

    if (isToday) {
      return parsedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return parsedDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  const normalizeMessage = (message) => {
    const senderId = getUserId(
      message.sender || message.senderId
    );

    return {
      id: String(
        message._id ||
          message.id ||
          `${senderId}-${message.createdAt || Date.now()}`
      ),
      senderId,
      sender:
        senderId === currentUserIdRef.current
          ? 'me'
          : 'them',
      text: message.text || '',
      time: getMessageTime(message.createdAt),
      createdAt:
        message.createdAt || new Date().toISOString(),
    };
  };

  const normalizeChat = (user) => {
    const id = getUserId(user);
    const name = getUserName(user);

    return {
      id,
      name,
      role: getUserRole(user),
      lastMsg: '',
      time: '',
      unread: 0,
      avatar: getAvatar(name),
      online: false,
      user,
    };
  };

  // ==========================================
  // FETCH REGISTERED USERS
  // ==========================================

  const fetchUsers = async () => {
    if (!token) return [];

    const response = await axios.get(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const responseUsers = Array.isArray(response.data)
      ? response.data
      : response.data.users || [];

    return responseUsers
      .map(normalizeChat)
      .filter(
        (user) =>
          user.id && user.id !== currentUserIdRef.current
      );
  };

  // ==========================================
  // SEARCH REGISTERED USERS
  // ==========================================

  const searchRegisteredUsers = async (searchTerm) => {
    if (!token || !searchTerm.trim()) return [];

    const response = await axios.get(
      `${API_URL}/users/search`,
      {
        params: {
          q: searchTerm.trim(),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const responseUsers = Array.isArray(response.data)
      ? response.data
      : response.data.users || [];

    return responseUsers
      .map(normalizeChat)
      .filter(
        (user) =>
          user.id &&
          user.id !== currentUserIdRef.current
      );
  };

  // ==========================================
  // LOAD USERS AND VISIBLE CHATS
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadChats = async () => {
      if (!token) {
        setError('Please log in to view your messages.');
        setLoadingChats(false);
        return;
      }

      try {
        setLoadingChats(true);
        setError('');

        const normalizedUsers = await fetchUsers();

        if (cancelled) return;

        const deletedIds = getDeletedConversationIds();

        const visibleChats = normalizedUsers.filter(
          (user) => !deletedIds.includes(user.id)
        );

        const savedOrder = getSavedChatOrder();

        setUsers(normalizedUsers);

        setChats((previousChats) =>
          sortChatsByLatest(
            visibleChats.map((chat) => {
              const previous = previousChats.find(
                (item) => item.id === chat.id
              );

              const saved = savedOrder[chat.id];

              return {
                ...chat,
                ...(previous || {}),
                ...(saved
                  ? {
                      lastMsg:
                        saved.lastMsg ||
                        previous?.lastMsg ||
                        '',
                      time: saved.timestamp
                        ? getMessageTime(saved.timestamp)
                        : previous?.time || '',
                    }
                  : {}),
                user: chat.user,
                online: onlineUsers.includes(chat.id),
              };
            })
          )
        );

        setActiveChat((current) => {
          if (openChatUserId) {
            const targetChat = normalizedUsers.find(
              (chat) => chat.id === openChatUserId
            );

            if (targetChat) return targetChat;
          }

          if (current) {
            const matchingChat = normalizedUsers.find(
              (chat) => chat.id === current.id
            );

            if (matchingChat) return matchingChat;
          }

          const sortedVisibleChats = sortChatsByLatest(
            visibleChats
          );

          return sortedVisibleChats[0] || null;
        });

        if (
          openChatUserId &&
          !normalizedUsers.some(
            (chat) => chat.id === openChatUserId
          )
        ) {
          setError('This user is not available.');
        }
      } catch (err) {
        console.error('Failed to load users:', err);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              'Failed to load users.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingChats(false);
        }
      }
    };

    loadChats();

    return () => {
      cancelled = true;
    };
  }, [token, currentUserId, openChatUserId]);

  // ==========================================
  // SEARCH USERS FROM BACKEND
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const searchUsers = async () => {
      const query = searchQuery.trim();

      if (!query || !token) {
        setSearchResults([]);
        setSearchingUsers(false);
        return;
      }

      try {
        setSearchingUsers(true);

        const results = await searchRegisteredUsers(query);

        if (!cancelled) {
          setSearchResults(results);
        }
      } catch (err) {
        console.error('Failed to search users:', err);

        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearchingUsers(false);
        }
      }
    };

    searchUsers();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, token, currentUserId]);

  // ==========================================
  // CONNECT TO SOCKET.IO
  // ==========================================

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to messaging server.');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socket.on('get_online_users', (userIds) => {
      setOnlineUsers(
        Array.isArray(userIds) ? userIds.map(String) : []
      );
    });

    socket.on(
      'conversation_restored',
      async ({ otherUserId }) => {
        try {
          const otherId = String(otherUserId);

          restoreConversation(otherId);

          const normalizedUsers = await fetchUsers();

          const restoredChat = normalizedUsers.find(
            (chat) => chat.id === otherId
          );

          if (!restoredChat) return;

          setUsers((previousUsers) => {
            const exists = previousUsers.some(
              (user) => user.id === restoredChat.id
            );

            return exists
              ? previousUsers
              : [restoredChat, ...previousUsers];
          });

          setChats((previousChats) => {
            const existingChat = previousChats.find(
              (chat) => chat.id === restoredChat.id
            );

            if (existingChat) {
              return sortChatsByLatest(previousChats);
            }

            return sortChatsByLatest([
              {
                ...restoredChat,
                online: onlineUsers.includes(restoredChat.id),
              },
              ...previousChats,
            ]);
          });
        } catch (err) {
          console.error(
            'Failed to restore conversation:',
            err
          );
        }
      }
    );

    socket.on('receive_message', (incomingMessage) => {
      const normalizedMessage =
        normalizeMessage(incomingMessage);

      const senderId = getUserId(incomingMessage.sender);
      const recipientId = getUserId(
        incomingMessage.recipient
      );

      const otherUserId =
        senderId === currentUserIdRef.current
          ? recipientId
          : senderId;

      if (!otherUserId) return;

      saveChatActivity(
        otherUserId,
        normalizedMessage.text,
        normalizedMessage.createdAt
      );

      const currentChat = activeChatRef.current;

      if (currentChat?.id === otherUserId) {
        setMessages((previousMessages) => {
          const alreadyExists = previousMessages.some(
            (message) =>
              message.id === normalizedMessage.id
          );

          if (alreadyExists) return previousMessages;

          return [...previousMessages, normalizedMessage];
        });
      }

      restoreConversation(otherUserId);

      setChats((previousChats) => {
        const existingChat = previousChats.find(
          (chat) => chat.id === otherUserId
        );

        if (!existingChat) {
          const user = usersRef.current.find(
            (item) => item.id === otherUserId
          );

          if (!user) return previousChats;

          return sortChatsByLatest([
            {
              ...user,
              lastMsg: normalizedMessage.text,
              time: normalizedMessage.time,
              unread:
                senderId === currentUserIdRef.current ||
                currentChat?.id === otherUserId
                  ? 0
                  : 1,
            },
            ...previousChats,
          ]);
        }

        const isCurrentChat =
          currentChat?.id === otherUserId;

        const updatedChat = {
          ...existingChat,
          lastMsg: normalizedMessage.text,
          time: normalizedMessage.time,
          unread:
            senderId === currentUserIdRef.current ||
            isCurrentChat
              ? 0
              : existingChat.unread + 1,
        };

        return sortChatsByLatest([
          updatedChat,
          ...previousChats.filter(
            (chat) => chat.id !== otherUserId
          ),
        ]);
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // ==========================================
  // UPDATE ONLINE INDICATORS
  // ==========================================

  useEffect(() => {
    setChats((previousChats) =>
      previousChats.map((chat) => ({
        ...chat,
        online: onlineUsers.includes(chat.id),
      }))
    );

    setUsers((previousUsers) =>
      previousUsers.map((user) => ({
        ...user,
        online: onlineUsers.includes(user.id),
      }))
    );

    setSearchResults((previousResults) =>
      previousResults.map((user) => ({
        ...user,
        online: onlineUsers.includes(user.id),
      }))
    );

    setActiveChat((current) => {
      if (!current) return current;

      return {
        ...current,
        online: onlineUsers.includes(current.id),
      };
    });
  }, [onlineUsers]);

  // ==========================================
  // LOAD CHAT HISTORY
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const fetchMessages = async () => {
      if (!activeChat?.id || !currentUserId || !token) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        setError('');
        setMessages([]);

        const response = await axios.get(
          `${API_URL}/messages/${currentUserId}/${activeChat.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const messageData = Array.isArray(response.data)
          ? response.data
          : response.data.messages || [];

        if (!cancelled) {
          setMessages(messageData.map(normalizeMessage));
        }
      } catch (err) {
        console.error('Failed to load messages:', err);

        if (!cancelled) {
          setMessages([]);

          if (err.response?.status !== 404) {
            setError(
              err.response?.data?.message ||
                'Failed to load messages.'
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    };

    fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [activeChat?.id, currentUserId, token]);

  // ==========================================
  // SCROLL TO LATEST MESSAGE
  // ==========================================

  useEffect(() => {
    const container = messagesBodyRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loadingMessages, activeChat?.id]);

  // ==========================================
  // EMOJI PICKER POSITION
  // ==========================================

  const updateEmojiPosition = () => {
    const button = emojiButtonRef.current;

    if (!button) return;

    const rect = button.getBoundingClientRect();

    const pickerWidth = 320;
    const pickerHeight = 400;
    const gap = 10;

    const left = Math.max(
      8,
      Math.min(
        rect.right - pickerWidth,
        window.innerWidth - pickerWidth - 8
      )
    );

    let top = rect.top - pickerHeight - gap;

    if (top < 8) {
      top = Math.min(
        rect.bottom + gap,
        window.innerHeight - pickerHeight - 8
      );
    }

    setEmojiPosition({ top, left });
  };

  const handleToggleEmojiPicker = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      return;
    }

    updateEmojiPosition();
    setShowEmojiPicker(true);
  };

  // ==========================================
  // INSERT SELECTED EMOJI
  // ==========================================

  const handleEmojiClick = (emojiData) => {
    setInputMessage(
      (previous) => previous + emojiData.emoji
    );

    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // ==========================================
  // CLOSE EMOJI PICKER ON OUTSIDE CLICK
  // ==========================================

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleOutsideClick = (event) => {
      const clickedButton =
        emojiButtonRef.current?.contains(event.target);

      const clickedPicker =
        emojiPickerRef.current?.contains(event.target);

      if (!clickedButton && !clickedPicker) {
        setShowEmojiPicker(false);
      }
    };

    const handleResize = () => updateEmojiPosition();
    const handleScroll = () => updateEmojiPosition();

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );

      window.removeEventListener('resize', handleResize);
      window.removeEventListener(
        'scroll',
        handleScroll,
        true
      );
    };
  }, [showEmojiPicker]);

  // ==========================================
  // CLOSE HEADER MENU ON OUTSIDE CLICK
  // ==========================================

  useEffect(() => {
    if (!openMenuChatId) return;

    const handleOutsideClick = (event) => {
      if (
        chatMenuRef.current &&
        !chatMenuRef.current.contains(event.target)
      ) {
        setOpenMenuChatId('');
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenMenuChatId('');
      }
    };

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );

      document.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, [openMenuChatId]);

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const handleSendMessage = (event) => {
    event.preventDefault();

    const text = inputMessage.trim();
    const socket = socketRef.current;
    const chatId = activeChat?.id;

    if (!text || !chatId || sending) return;

    if (!token) {
      setError('Please log in to send messages.');
      return;
    }

    if (!socket || !socket.connected) {
      setError(
        'Not connected to the messaging server. Please try again.'
      );
      return;
    }

    if (text.length > 2000) {
      setError('Message cannot exceed 2000 characters.');
      return;
    }

    setSending(true);
    setError('');

    socket.emit(
      'send_message',
      {
        recipientId: chatId,
        text,
      },
      (result) => {
        setSending(false);

        if (!result?.success) {
          setError(
            result?.message ||
              'Failed to send message. Please try again.'
          );
          return;
        }

        const normalizedMessage = normalizeMessage(
          result.message
        );

        setMessages((previousMessages) => {
          const alreadyExists = previousMessages.some(
            (message) =>
              message.id === normalizedMessage.id
          );

          if (alreadyExists) return previousMessages;

          return [...previousMessages, normalizedMessage];
        });

        restoreConversation(chatId);

        saveChatActivity(
          chatId,
          normalizedMessage.text,
          normalizedMessage.createdAt
        );

        const chatToRestore =
          usersRef.current.find((user) => user.id === chatId) ||
          activeChat;

        if (chatToRestore) {
          setChats((previousChats) => {
            const existingChat = previousChats.find(
              (chat) => chat.id === chatId
            );

            const updatedChat = {
              ...(existingChat || chatToRestore),
              lastMsg: normalizedMessage.text,
              time: normalizedMessage.time,
              unread: 0,
            };

            return sortChatsByLatest([
              updatedChat,
              ...previousChats.filter(
                (chat) => chat.id !== chatId
              ),
            ]);
          });
        }

        setInputMessage('');
        inputRef.current?.focus();
      }
    );
  };

  // ==========================================
  // DELETE CONVERSATION FOR ME
  // ==========================================

  const handleDeleteConversation = async (chat, event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!chat?.id || !token || deletingChatId) return;

    setOpenMenuChatId('');

    const confirmed = window.confirm(
      `Delete your conversation with ${chat.name}?\n\n` +
        'This hides the conversation from your Chats list. The account will remain searchable.'
    );

    if (!confirmed) return;

    try {
      setDeletingChatId(chat.id);
      setError('');

      await axios.delete(
        `${API_URL}/conversations/${chat.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      hideConversation(chat.id);

      const remainingChats = chats.filter(
        (item) => item.id !== chat.id
      );

      setChats(remainingChats);

      if (activeChatRef.current?.id === chat.id) {
        const nextChat = remainingChats[0] || null;

        setActiveChat(nextChat);
        setMessages([]);
        setInputMessage('');
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);

      setError(
        err.response?.data?.message ||
          'Failed to delete conversation. Please try again.'
      );
    } finally {
      setDeletingChatId('');
    }
  };

  // ==========================================
  // FILTER CHATS AND SEARCH RESULTS
  // ==========================================

  const query = searchQuery.trim();

  const filteredChats = query
    ? searchResults
    : chats;

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="messages-page-container">
      <div className="messages-header-title">
        <span className="sub-title">
          YOUR CONVERSATIONS
        </span>

        <h1>Messages</h1>
      </div>

      <div className="messages-glass-wrapper">
        {/* LEFT PANEL */}
        <aside className="chats-sidebar-panel">
          <div className="chats-panel-header">
            <div className="title-with-badge">
              <h2>Chats</h2>

              <span className="badge">
                {chats.length}
              </span>
            </div>

            <p className="subtitle">
              Your recent conversations
            </p>
          </div>

          <div className="chat-search-bar">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              type="text"
              placeholder="Search people or conversations..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
            />
          </div>

          <div className="chats-list-scroll">
            {loadingChats || (query && searchingUsers) ? (
              <p className="chat-list-message">
                {query ? 'Searching users...' : 'Loading users...'}
              </p>
            ) : filteredChats.length === 0 ? (
              <p className="chat-list-message">
                {query ? 'No users found.' : 'No conversations yet.'}
              </p>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-item-card ${
                    activeChat?.id === chat.id ? 'active' : ''
                  }`}
                  onClick={() => {
                    setActiveChat(chat);
                    setError('');
                    setShowEmojiPicker(false);
                    setOpenMenuChatId('');

                    if (!query) {
                      setChats((previousChats) =>
                        previousChats.map((item) =>
                          item.id === chat.id
                            ? { ...item, unread: 0 }
                            : item
                        )
                      );
                    }
                  }}
                >
                  <div className="avatar-wrapper">
                    <div className="avatar">
                      {chat.avatar}
                    </div>

                    {chat.online && (
                      <span className="online-dot"></span>
                    )}
                  </div>

                  <div className="chat-info">
                    <div className="chat-info-top">
                      <span className="user-name">
                        {chat.name}
                      </span>

                      <span className="chat-time">
                        {chat.time}
                      </span>
                    </div>

                    <span className="user-role">
                      {chat.role}
                    </span>

                    <p className="preview-message">
                      {chat.lastMsg || 'Start a conversation'}
                    </p>
                  </div>

                  {chat.unread > 0 && (
                    <div className="chat-item-actions">
                      <span className="unread-count">
                        {chat.unread}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="chat-main-panel">
          {activeChat ? (
            <>
              <div className="active-chat-header">
                <div className="active-user-details">
                  <div className="avatar-wrapper">
                    <div className="avatar">
                      {activeChat.avatar}
                    </div>

                    {activeChat.online && (
                      <span className="online-dot"></span>
                    )}
                  </div>

                  <div className="active-user-text">
                    <h3>{activeChat.name}</h3>

                    <span className="status-text">
                      {activeChat.online ? 'Online' : 'Offline'}
                      {' · '}
                      {activeChat.role}
                    </span>
                  </div>
                </div>

                <div className="chat-header-actions">
                  <button
                    className="icon-action-btn"
                    title="Call"
                    type="button"
                    aria-label="Call"
                    onClick={() =>
                      setError('Voice calls are not available yet.')
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 11.19 18a19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.09 3.18 2 2 0 0 1 4.08 1h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.06 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.58 2.8.7A2 2 0 0 1 22 16.92Z" />
                    </svg>
                  </button>

                  <button
                    className="icon-action-btn"
                    title="Video Call"
                    type="button"
                    aria-label="Video call"
                    onClick={() =>
                      setError('Video calls are not available yet.')
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="6"
                        width="13"
                        height="12"
                        rx="2"
                      />
                      <path d="m16 10 5-3v10l-5-3" />
                    </svg>
                  </button>

                  {/* HEADER MENU */}
                  <div
                    className="chat-header-menu"
                    ref={chatMenuRef}
                  >
                    <button
                      className="icon-action-btn"
                      title="More options"
                      type="button"
                      aria-label="More options"
                      aria-haspopup="menu"
                      aria-expanded={
                        openMenuChatId === activeChat.id
                      }
                      disabled={
                        deletingChatId === activeChat.id
                      }
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        setOpenMenuChatId((current) =>
                          current === activeChat.id
                            ? ''
                            : activeChat.id
                        );
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <circle cx="5" cy="12" r="1.7" />
                        <circle cx="12" cy="12" r="1.7" />
                        <circle cx="19" cy="12" r="1.7" />
                      </svg>
                    </button>

                    {openMenuChatId === activeChat.id && (
                      <div
                        className="chat-dropdown-menu"
                        role="menu"
                      >
                        <button
                          type="button"
                          className="chat-dropdown-item delete-option"
                          role="menuitem"
                          disabled={
                            deletingChatId === activeChat.id
                          }
                          onClick={(event) =>
                            handleDeleteConversation(
                              activeChat,
                              event
                            )
                          }
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="m19 6-1 14H6L5 6" />
                            <path d="M10 11v5" />
                            <path d="M14 11v5" />
                          </svg>

                          <span>
                            {deletingChatId === activeChat.id
                              ? 'Deleting...'
                              : 'Delete Conversation'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* MESSAGES */}
              <div
                className="chat-messages-body"
                ref={messagesBodyRef}
              >
                <div className="date-divider">
                  <span>Conversation</span>
                </div>

                {loadingMessages ? (
                  <p className="message-state">
                    Loading messages...
                  </p>
                ) : messages.length === 0 ? (
                  <p className="message-state">
                    No messages yet. Say hello!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message-bubble-row ${
                        msg.sender === 'me'
                          ? 'outgoing'
                          : 'incoming'
                      }`}
                    >
                      {msg.sender !== 'me' && (
                        <div className="msg-avatar">
                          {activeChat.avatar}
                        </div>
                      )}

                      <div className="message-content">
                        <p>{msg.text}</p>

                        <span className="msg-timestamp">
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* MESSAGE INPUT */}
              <form
                className="chat-input-bar"
                onSubmit={handleSendMessage}
              >
                <button
                  type="button"
                  className="input-action-icon"
                  title="Attachment"
                  aria-label="Attachment"
                  onClick={() =>
                    setError('Attachments are not available yet.')
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.49-8.48" />
                  </svg>
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="iMessage"
                  value={inputMessage}
                  onChange={(event) =>
                    setInputMessage(event.target.value)
                  }
                  disabled={sending}
                  maxLength={2000}
                />

                <button
                  ref={emojiButtonRef}
                  type="button"
                  className="input-action-icon emoji-button"
                  title="Emoji"
                  aria-label="Open emoji picker"
                  aria-expanded={showEmojiPicker}
                  onClick={handleToggleEmojiPicker}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <path d="M9 9h.01" />
                    <path d="M15 9h.01" />
                  </svg>
                </button>

                <button
                  type="submit"
                  className="send-btn"
                  disabled={sending || !inputMessage.trim()}
                  title="Send message"
                  aria-label="Send message"
                >
                  {sending ? (
                    <span className="send-loading">...</span>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width="19"
                      height="19"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 19V5" />
                      <path d="m5 12 7-7 7 7" />
                    </svg>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="empty-chat-panel">
              <div className="empty-chat-icon">✉</div>

              <h3>
                {loadingChats
                  ? 'Loading conversations...'
                  : 'Your messages'}
              </h3>

              <p>
                {loadingChats
                  ? 'Please wait a moment.'
                  : 'Select a conversation to start messaging.'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="messages-error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* EMOJI PICKER PORTAL */}
      {showEmojiPicker &&
        createPortal(
          <div
            ref={emojiPickerRef}
            className="emoji-picker-portal"
            style={{
              position: 'fixed',
              top: `${emojiPosition.top}px`,
              left: `${emojiPosition.left}px`,
              zIndex: 99999,
            }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={320}
              height={400}
              searchPlaceHolder="Search emoji..."
              previewConfig={{
                showPreview: false,
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}

export default Messages;