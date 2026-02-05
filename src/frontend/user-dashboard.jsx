import React, { useState, useEffect, useRef } from "react";
import {
  IoMdHome,
  IoMdClose,
  IoMdNotifications,
  IoMdMegaphone,
  IoMdCheckmarkCircle,
  IoMdTime,
  IoMdSend,
  IoMdArrowBack
} from "react-icons/io";
import {
  MdDashboard,
  MdLocationOn,
  MdReportProblem,
  MdMenu,
  MdAdd,
  MdEvent,
  MdAnnouncement,
  MdPushPin,
  MdChat,
  MdCheckCircle,
  MdCall,
  MdVideocam,
  MdPerson,
  MdWork,
  MdChatBubble,
  MdCalendarToday,
  MdComment,
  MdPeople,
  MdNotifications,
  MdMyLocation,
  MdCamera,
  MdCheck,
  MdBarChart
} from "react-icons/md";
import {
  FaUser,
  FaSignOutAlt,
  FaRegCalendarAlt,
  FaRegNewspaper,
  FaRegBell,
  FaMapMarkerAlt
} from "react-icons/fa";
import {
  FiSettings,
  FiChevronRight,
  FiPlus,
  FiChevronLeft,
  FiCamera,
  FiPaperclip,
  FiBell,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiX,
  FiEdit2,
  FiBarChart2,
  FiBarChart,
  FiPercent,
  FiFileText,
  FiMapPin,
  FiMap,
  FiExternalLink,
  FiActivity,
  FiLoader,
  FiClock,
  FiCheckCircle,
  FiXCircle
} from "react-icons/fi";
import {
  HiOutlineChatAlt2,
  HiOutlineClipboardList
} from "react-icons/hi";
import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const UserDashboard = ({ user, logout }) => {
  const [activeTab, setActiveTab] = useState("Home");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("Fetching location...");
  const [reportMessage, setReportMessage] = useState("");
  const [userStatus, setUserStatus] = useState("Active");
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showAnnouncementFilterMenu, setShowAnnouncementFilterMenu] = useState(false);
  // Navigation stack for screen-based navigation (replaces modals)
  const [navigationStack, setNavigationStack] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [showDateFilterMenu, setShowDateFilterMenu] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const actionMenuRef = useRef(null);
  const filterButtonsRef = useRef(null);
  const projectsLoadedRef = useRef(false);
  const announcementsLoadedRef = useRef(false);
  const usersLoadedRef = useRef(false);

  // Prevent body scroll when date picker modal is open
  useEffect(() => {
    if (showDatePicker) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDatePicker]);

  const fileInputRef = useRef(null);
  const commentFileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [users, setUsers] = useState([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted');
  const [taskCompletionBadgeCount, setTaskCompletionBadgeCount] = useState(0);
  const [announcementBadgeCount, setAnnouncementBadgeCount] = useState(0);
  const notifiedAnnouncementsRef = useRef(new Set());
  const notifiedCompletedProjectsRef = useRef(new Set());
  const hasLoadedAnnouncementsOnceRef = useRef(false);
  const hasLoadedProjectsOnceRef = useRef(false);

  useEffect(() => {
    try {
      const rawAnnouncements = localStorage.getItem('notifiedAnnouncementIds');
      if (rawAnnouncements) {
        const ids = JSON.parse(rawAnnouncements);
        if (Array.isArray(ids)) {
          notifiedAnnouncementsRef.current = new Set(ids.map(String));
        }
      }
      const rawCompleted = localStorage.getItem('notifiedCompletedProjectIds');
      if (rawCompleted) {
        const ids = JSON.parse(rawCompleted);
        if (Array.isArray(ids)) {
          notifiedCompletedProjectsRef.current = new Set(ids.map(String));
        }
      }
      const rawBadge = localStorage.getItem('taskCompletionBadgeCount');
      const badgeCount = rawBadge ? parseInt(rawBadge, 10) : 0;
      if (!Number.isNaN(badgeCount)) {
        setTaskCompletionBadgeCount(badgeCount);
      }
      const rawAnnouncementBadge = localStorage.getItem('announcementBadgeCount');
      const announcementBadge = rawAnnouncementBadge ? parseInt(rawAnnouncementBadge, 10) : 0;
      if (!Number.isNaN(announcementBadge)) {
        setAnnouncementBadgeCount(announcementBadge);
      }
    } catch (e) {
      // Ignore localStorage parsing errors
    }
  }, []);
  
  const togglePush = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      if (pushEnabled) {
        // Unsubscribe
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.pushManager) {
            const subscription = await reg.pushManager.getSubscription();
            if (subscription) {
              const endpoint = subscription.endpoint;
              await subscription.unsubscribe();
              // Inform server to remove saved subscription
              try {
                await fetch('/backend/remove_subscription.php', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ endpoint })
                });
              } catch (err) {
                console.warn('Failed to call remove_subscription', err);
              }
            }
          }
        }
        setPushEnabled(false);
        setToast({ show: true, message: 'Push notifications disabled', type: 'success' });
      } else {
        if (window.enablePushNotifications) {
          setIsLoading(true);
          const res = await window.enablePushNotifications();
          setIsLoading(false);
          if (res && res.success) {
            setPushEnabled(true);
            setToast({ show: true, message: 'Push notifications enabled', type: 'success' });
          } else {
            console.warn('enablePushNotifications failed', res);
            const reason = res && (res.reason || res.detail || res.status) ? (res.reason || res.detail || res.status) : 'unknown';
            let message = 'Failed to enable push';
            if (reason === 'permission_denied') message = 'Push permission denied';
            else if (reason === 'no_vapid_key') message = 'Server not configured for push (no VAPID key)';
            else if (reason === 'subscribe_failed') message = `Subscription failed: ${res.detail || ''}`;
            else if (reason === 'save_failed') message = `Failed to save subscription on server (${res.status || res.detail || 'error'})`;
            else if (reason === 'sw_registration_missing') message = 'Service worker registration missing';
            else if (reason === 'unexpected_error') message = `Error: ${res.detail || 'unexpected'}`;

            setToast({ show: true, message, type: 'error' });
          }
        } else {
          setToast({ show: true, message: 'Service workers not supported', type: 'error' });
        }
      }
    } catch (err) {
      console.error('togglePush error', err);
      setIsLoading(false);
      setToast({ show: true, message: 'Error toggling push', type: 'error' });
    }
  };
  
  const saveIdSet = (key, set) => {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch (e) {
      // Ignore localStorage write errors
    }
  };

  const showSystemNotification = (title, body, tag, url) => {
    if (!pushEnabled) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
      const notification = new Notification(title, {
        body,
        icon: '/img/stelsenlogo.png',
        tag: tag || 'stelsen'
      });
      notification.onclick = () => {
        window.focus();
        if (url) window.location.href = url;
      };
    } catch (e) {
      console.warn('System notification failed', e);
    }
  };
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [readComments, setReadComments] = useState(() => {
    try {
      const saved = localStorage.getItem('userDashboardReadComments');
      return saved ? JSON.parse(saved) : {};
    } catch (err) {
      console.error('Error loading read comments:', err);
      return {};
    }
  });
  // Timestamp refresh ticker - increments every minute to force notification time recalculation
  const [timestampTicker, setTimestampTicker] = useState(0);
  const [otherUsersLocations, setOtherUsersLocations] = useState([]);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [selectedProgressUpdate, setSelectedProgressUpdate] = useState(null);
  const [showProgressDetailView, setShowProgressDetailView] = useState(false);
  const [showTaskProgressModal, setShowTaskProgressModal] = useState(false);
  const [taskProgressList, setTaskProgressList] = useState([]);
  const [progressMapStates, setProgressMapStates] = useState({});
  
  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Comments expansion state - tracks which projects have expanded comments
  const [expandedProjectComments, setExpandedProjectComments] = useState({});

  // Swipe gesture state for back navigation
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Offline mode detection - only online if BOTH logged in AND internet is active
  const isUserLoggedIn = !!user && !!user.id;
  const [isOnline, setIsOnline] = useState(navigator.onLine && isUserLoggedIn);

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullThreshold = 80;

  // dark mode removed — app uses light theme only

  // Pin state is provided by backend (persisted like admin)

  // Edit Profile Modal States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    department: '',
    phone: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Save read comments to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('userDashboardReadComments', JSON.stringify(readComments));
    } catch (err) {
      console.error('Error saving read comments:', err);
    }
  }, [readComments]);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Keep pushEnabled state in sync with actual Push subscription (prefer real subscription over permission)
  useEffect(() => {
    let mounted = true;
    const update = async () => {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistration) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.pushManager) {
            const sub = await reg.pushManager.getSubscription();
            if (!mounted) return;
            setPushEnabled(!!sub);
            return;
          }
        }
      } catch (e) {
        console.warn('Error checking push subscription', e);
      }

      // Fallback to permission when subscription can't be checked
      if (!mounted) return;
      setPushEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted');
    };

    update();
    document.addEventListener('visibilitychange', update);
    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  // Online/Offline detection
  useEffect(() => {
      const checkOnlineStatus = () => {
        const userLoggedIn = !!user && !!user.id;
        const internetActive = navigator.onLine;
        const shouldBeOnline = internetActive && userLoggedIn;
        setIsOnline(shouldBeOnline);
      };

      const handleOnline = () => {
        checkOnlineStatus();
        setToast({ show: true, message: 'Back online!', type: 'success' });
      };
    const handleOffline = () => {
      setIsOnline(false);
      setToast({ show: true, message: 'No internet connection', type: 'error' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    }, [user]);

  // dark mode persistence removed

  // Fetch other users' locations when in My Location tab
  useEffect(() => {
    if (activeTab === 'My Location') {
      fetchOtherUsersLocations();
      // Auto-center map on user's current location
      setViewState({
        longitude: userCoordinates.longitude,
        latitude: userCoordinates.latitude,
        zoom: 15
      });
      // Auto-refresh removed — fetch occurs once when tab activated
    }
  }, [activeTab]);

  const fetchOtherUsersLocations = async () => {
    try {
      const response = await fetch('/backend/location.php?user_id=all', {
        credentials: 'include'
      });
      const text = await response.text();
      console.log('Response from location.php:', text.substring(0, 100));
      
      const data = JSON.parse(text);
      if (data.status === 'success' && data.locations) {
        // Filter out current user's location
        const others = data.locations.filter(loc => loc.user_id !== user?.id);
        setOtherUsersLocations(others);
      }
    } catch (err) {
      console.error('Error fetching other users locations:', err);
    }
  };

  // Detect first user interaction so vibration is allowed by the browser
  useEffect(() => {
    const lastUserGestureRef = { current: false };
    // store ref on window so other functions can access (safe in this module scope)
    window.__stelsen_lastUserGesture = lastUserGestureRef;

    const setInteracted = (ev) => {
      setUserInteracted(true);
      try {
        // capture whether the gesture is a trusted user gesture
        lastUserGestureRef.current = !!(ev && ev.isTrusted);
      } catch (e) {
        lastUserGestureRef.current = true;
      }
    };

    window.addEventListener('pointerdown', setInteracted, { once: true });
    window.addEventListener('touchstart', setInteracted, { once: true });
    return () => {
      window.removeEventListener('pointerdown', setInteracted);
      window.removeEventListener('touchstart', setInteracted);
      try { delete window.__stelsen_lastUserGesture; } catch (e) {}
    };
  }, []);

  const [viewState, setViewState] = useState({
    longitude: 120.9842,
    latitude: 14.5995,
    zoom: 15
  });

  // Actual user GPS coordinates (separate from map view state)
  const [userCoordinates, setUserCoordinates] = useState({
    longitude: 120.9842,
    latitude: 14.5995
  });

  // Enhanced announcements data
  const [announcements, setAnnouncements] = useState([

  ]);
  // Track per-announcement read timestamps (client-side) so 'New' can persist for 1 day after read
  const [announcementReadAt, setAnnouncementReadAt] = useState(() => {
    try {
      const raw = localStorage.getItem('announcementReadAt');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  // Periodically recompute `isNew` for announcements so the badge expires automatically
  useEffect(() => {
    let mounted = true;
    const recompute = () => {
      if (!mounted) return;
      setAnnouncements(prev => {
        if (!prev) return prev;
        const now = new Date();
        return prev.map(ann => {
          const createdDate = new Date(ann.created_at);
          const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
          const readTs = announcementReadAt && announcementReadAt[ann.id] ? new Date(announcementReadAt[ann.id]) : null;
          const readDaysDiff = readTs ? (now - readTs) / (1000 * 60 * 60 * 24) : Infinity;
          const isNew = (daysDiff <= 1) || (readDaysDiff <= 1);
          if (ann.isNew === isNew) return ann;
          return { ...ann, isNew };
        });
      });
    };

    // Run immediately, then every hour
    recompute();
    const interval = setInterval(recompute, 1000 * 60 * 60);
    return () => { mounted = false; clearInterval(interval); };
  }, [announcementReadAt]);

  // Update timestamp ticker every minute to refresh notification time displays
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestampTicker(prev => prev + 1);
    }, 60000); // Update every 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Filtered announcements
  const filteredAnnouncements = announcements.filter(ann => {
    // Filter by status (unread, important, etc.)
    if (selectedFilter === "unread") return ann.unread;
    if (selectedFilter === "important") return ann.important;
    if (selectedFilter === "pinned") return ann.is_pinned;
    if (selectedFilter === "read") return !ann.unread;
    return true;
  }).filter(ann => {
    // Filter by date
    if (dateFilter === "all") return true;
    
    const announcementDate = new Date(ann.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilter === "today") {
      const annDate = new Date(ann.created_at);
      annDate.setHours(0, 0, 0, 0);
      return annDate.getTime() === today.getTime();
    }
    
    if (dateFilter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return announcementDate >= weekAgo;
    }
    
    if (dateFilter === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return announcementDate >= monthAgo;
    }
    
    if (dateFilter === "custom" && customDateRange.start && customDateRange.end) {
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return announcementDate >= startDate && announcementDate <= endDate;
    }
    
    return true;
  }).filter(ann => 
    ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ann.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return Number(b.is_pinned) - Number(a.is_pinned);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Mark all announcements as read (local state only)
  const markAllAsRead = async () => {
    const unreadAnnouncements = announcements.filter(ann => ann.unread);
    for (const ann of unreadAnnouncements) {
      await markAsRead(ann.id);
    }
  };

  const formatTimeAgo = (dateInput) => {
    if (!dateInput) return "Just now";
    const created = dateInput instanceof Date
      ? dateInput
      : new Date(typeof dateInput === 'number' ? dateInput : dateInput);
    if (isNaN(created.getTime())) return "Just now";
    const now = new Date();
    
    // Calculate difference in milliseconds, then convert to seconds
    const diff = Math.floor((now.getTime() - created.getTime()) / 1000);
    
    // Return "Just now" for negative differences (future dates) or very recent
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
    
    // For older dates, show formatted date
    return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCommentTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    return formatTimeAgo(timestamp);
  };

  // Get color based on status for consistent visual theme
  const getProgressColor = (status) => {
    if (status === 'Completed') return { 
      bg: 'bg-blue-50', 
      text: 'text-blue-700', 
      badge: 'bg-gradient-to-r from-blue-500 to-indigo-600', 
      border: 'border-blue-200',
      progressBar: 'bg-gradient-to-r from-blue-500 to-indigo-600'
    };
    if (status === 'In Progress') return { 
      bg: 'bg-blue-50', 
      text: 'text-blue-700', 
      badge: 'bg-gradient-to-r from-blue-500 to-indigo-600', 
      border: 'border-blue-200',
      progressBar: 'bg-gradient-to-r from-blue-500 to-indigo-600'
    };
    // Pending or other statuses
    return { 
      bg: 'bg-orange-50', 
      text: 'text-orange-700', 
      badge: 'bg-gradient-to-r from-orange-500 to-amber-600', 
      border: 'border-orange-200',
      progressBar: 'bg-gradient-to-r from-orange-500 to-amber-600'
    };
  };

  // Format author/user name - prioritize stored name over email-derived name
  const formatAuthorName = (email, userObj = null) => {
    if (!email) return "Unknown";

    // If a user object with a name is provided, use it
    if (userObj && userObj.name && userObj.name.trim()) {
      return userObj.name;
    }

    // Otherwise, fall back to email-derived name
    return email
      .split("@")[0]            // remove domain
      .replace(/\d+/g, "")      // remove numbers
      .replace(/\b\w/g, c => c.toUpperCase()); // capitalize
  };

  // Helper to get display name by looking up user in users array
  const getDisplayName = (email) => {
    if (!email) return "Unknown";
    
    // Look up the user in the users array
    const userObj = users && Array.isArray(users) 
      ? users.find(u => u.email === email)
      : null;
    
    // Use the stored name if available, otherwise fall back to email-derived name
    if (userObj && userObj.name && userObj.name.trim()) {
      return userObj.name;
    }
    
    return email
      .split("@")[0]            // remove domain
      .replace(/\d+/g, "")      // remove numbers
      .replace(/\b\w/g, c => c.toUpperCase()); // capitalize
  };

  // Format datetime like "January 01, 2026 12:00pm"
  const formatDateTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;

    const month = d.toLocaleString('en-US', { month: 'long' });
    const day = d.toLocaleString('en-US', { day: '2-digit' });
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;

    return `${month} ${day}, ${year} ${hours}:${minutes}${ampm}`;
  };

  // Format numbers as Philippine Peso with comma grouping
  const formatPeso = (value) => {
    if (value === null || value === undefined || value === "") return "₱0";
    const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
    if (isNaN(num)) return "₱0";
    return "₱" + num.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Helper function to group comments by date (for Messenger-style display)
  const groupCommentsByDate = (comments) => {
    const groups = {};
    
    comments.forEach(comment => {
      const date = new Date(comment.created_at);
      const today = new Date();
      
      // Reset times to compare dates only
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      const diffTime = today - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let dateLabel;
      if (diffDays === 0) {
        dateLabel = "Today";
      } else if (diffDays === 1) {
        dateLabel = "Yesterday";
      } else if (diffDays < 7) {
        dateLabel = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        dateLabel = `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        dateLabel = `${months} month${months !== 1 ? 's' : ''} ago`;
      } else {
        const years = Math.floor(diffDays / 365);
        dateLabel = `${years} year${years !== 1 ? 's' : ''} ago`;
      }
      
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(comment);
    });
    
    return groups;
  };

  // Treat tasks as new for 2 days from created time; if no created time, assume new when progress is 0
  const isProjectNew = (createdAt, progress) => {
    if (createdAt) {
      const created = new Date(createdAt);
      if (!isNaN(created)) {
        const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 2) return true;
      }
    }
    return progress === undefined || progress === null || Number(progress) === 0;
  };

  const getProjectCreatedAtValue = (project) =>
    project?.created_at ||
    project?.createdAt ||
    project?.start_date ||
    project?.startDate ||
    null;

  useEffect(() => {
  const fetchAnnouncements = async () => {
    if (!announcementsLoadedRef.current) setIsLoadingAnnouncements(true);
    try {
      const res = await fetch("/backend/announcements.php", {
        credentials: "include",
      });
      const data = await res.json();
      // Filter announcements: only show those created after user account creation
      const userCreatedAt = user?.created_at ? new Date(user.created_at) : null;
      const filtered = userCreatedAt ? data.filter(a => new Date(a.created_at) >= userCreatedAt) : data;
      
      const normalized = filtered.map(a => {
        const createdAtMs = a.created_at_ts ? Number(a.created_at_ts) * 1000 : Date.parse(a.created_at);
        const createdDate = new Date(isNaN(createdAtMs) ? a.created_at : createdAtMs);
        const now = new Date();
        const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
        const readTs = announcementReadAt && announcementReadAt[a.announcement_id] ? new Date(announcementReadAt[a.announcement_id]) : null;
        const readDaysDiff = readTs ? (now - readTs) / (1000 * 60 * 60 * 24) : Infinity;
        return {
          id: a.announcement_id,
          title: a.title,
          content: a.content,
          type: a.type,
          priority: a.priority,
          author: getDisplayName(a.author),
          time: formatTimeAgo(createdDate),
          category: a.type.charAt(0).toUpperCase() + a.type.slice(1),
          important: a.priority === "high",
          color: getColorForType(a.type),
          unread: a.unread === 1,
          icon: getIconForType(a.type),
          is_pinned: a.is_pinned === 1,
          // Consider 'new' for 1 day after creation OR for 1 day after the user read it
          isNew: (daysDiff <= 1) || (readDaysDiff <= 1),
          created_at: a.created_at,
          created_at_ts: a.created_at_ts ? Number(a.created_at_ts) : null,
        };
      });

      const newlyUnread = normalized.filter(a => a.unread && !notifiedAnnouncementsRef.current.has(String(a.id)));
      if (!hasLoadedAnnouncementsOnceRef.current) {
        normalized.forEach(a => {
          if (a.unread) notifiedAnnouncementsRef.current.add(String(a.id));
        });
        saveIdSet('notifiedAnnouncementIds', notifiedAnnouncementsRef.current);
        hasLoadedAnnouncementsOnceRef.current = true;
      } else if (newlyUnread.length > 0) {
        newlyUnread.forEach(a => notifiedAnnouncementsRef.current.add(String(a.id)));
        saveIdSet('notifiedAnnouncementIds', notifiedAnnouncementsRef.current);
        
        // Increment announcement badge count for new announcements
        setAnnouncementBadgeCount(prev => {
          const next = prev + newlyUnread.length;
          try {
            localStorage.setItem('announcementBadgeCount', String(next));
          } catch (e) {}
          return next;
        });
        
        const title = newlyUnread.length > 1 ? 'New Announcements' : 'New Announcement';
        const body = newlyUnread.length > 1
          ? `You have ${newlyUnread.length} new announcements`
          : (newlyUnread[0].title || 'A new announcement was posted');
        showSystemNotification(title, body, 'announcement', '/');
      }

      setAnnouncements(normalized);
      announcementsLoadedRef.current = true;7
      setIsLoadingAnnouncements(false);
    } catch (err) {
      console.error("Announcement fetch error:", err);
      setIsLoadingAnnouncements(false);
    }
  };

  // Initial fetch
  fetchAnnouncements();

  // Auto-refresh removed
}, []);

// Fetch users for names/avatars
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const res = await fetch("/backend/users.php", { credentials: "include" });
      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data.map(u => ({
            ...u,
            profile_image: u.profile_image || null,
          }))
        : [];
      setUsers(normalized);
      usersLoadedRef.current = true;
    } catch (err) {
      console.error("Users fetch error:", err);
      setUsers([]);
    }
  };

  // Initial fetch
  fetchUsers();

  // Auto-refresh removed
}, []);

// Initial loading management - hide loading screen after data is fetched
useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoading(false);
  }, 1500); // Minimum loading time for smooth UX
  return () => clearTimeout(timer);
}, []);

// Fetch projects assigned to current user
const fetchProjects = async () => {
  if (!projectsLoadedRef.current) setIsLoadingProjects(true);
  try {
    const response = await fetch("/backend/projects.php", {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();

    const userProjects = data.filter(project => {
      if (!project.assignedUsers || !Array.isArray(project.assignedUsers)) return false;
      return project.assignedUsers.some(assignedId => String(assignedId) === String(user?.id) || Number(assignedId) === Number(user?.id));
    });

    const projectsWithComments = await Promise.all(
      userProjects.map(async (project) => {
        if ((project.progress || 0) >= 100 && project.status !== 'completed') {
          project.status = 'completed';
          fetch("/backend/projects.php", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id: project.id, status: 'completed' })
          }).catch(err => console.error('Failed to auto-update project status:', err));
        }

        try {
          const commentsRes = await fetch(`/backend/comments.php?project_id=${project.id}`, { credentials: "include" });
          if (!commentsRes.ok) {
            console.error(`Failed to fetch comments for project ${project.id}: HTTP ${commentsRes.status}`);
            const isNew = isProjectNew(getProjectCreatedAtValue(project), project.progress);
            return { ...project, comments: [], isNew };
          }

          const responseText = await commentsRes.text();
          let commentsData;
          try {
            commentsData = JSON.parse(responseText);
          } catch (jsonErr) {
            console.error(`Failed to parse JSON for project ${project.id}. Response:`, responseText.substring(0, 200));
            const isNew = isProjectNew(getProjectCreatedAtValue(project), project.progress);
            return { ...project, comments: [], isNew };
          }

          const comments = commentsData.status === "success"
            ? (commentsData.comments || []).map(c => ({
                id: c.comment_id,
                text: c.comment,
                time: getCommentTimeAgo(c.created_at),
                created_at: c.created_at,
                email: c.email,
                profile_image: c.profile_image,
                user: c.user || getDisplayName(c.email),
                attachments: c.attachments || null,
                progress_percentage: c.progress_percentage || null,
                progress_status: c.progress_status || null,
                evidence_photo: c.evidence_photo || null,
                location_latitude: c.location_latitude || null,
                location_longitude: c.location_longitude || null,
                location_accuracy: c.location_accuracy || null,
                approval_status: c.approval_status || null,
                comment_type: c.comment_type || null,
                progress: c.progress || null,
                progress_id: c.progress_id || null,
              }))
            : [];

          const isNew = isProjectNew(getProjectCreatedAtValue(project), project.progress);
          return { ...project, comments, isNew };
        } catch (err) {
          console.error(`Failed to fetch comments for project ${project.id}:`, err);
          const isNew = isProjectNew(getProjectCreatedAtValue(project), project.progress);
          return { ...project, comments: [], isNew };
        }
      })
    );

    const completedProjects = projectsWithComments.filter(project => {
      const progressValue = Number(project.progress ?? project.progress_percentage ?? 0);
      const statusValue = String(project.status || '').toLowerCase();
      return progressValue >= 100 || statusValue === 'completed';
    });
    const newlyCompleted = completedProjects.filter(project => !notifiedCompletedProjectsRef.current.has(String(project.id)));

    if (!hasLoadedProjectsOnceRef.current) {
      completedProjects.forEach(project => notifiedCompletedProjectsRef.current.add(String(project.id)));
      saveIdSet('notifiedCompletedProjectIds', notifiedCompletedProjectsRef.current);
      hasLoadedProjectsOnceRef.current = true;
    } else if (newlyCompleted.length > 0) {
      newlyCompleted.forEach(project => notifiedCompletedProjectsRef.current.add(String(project.id)));
      saveIdSet('notifiedCompletedProjectIds', notifiedCompletedProjectsRef.current);
      setTaskCompletionBadgeCount(prev => {
        const next = prev + newlyCompleted.length;
        try {
          localStorage.setItem('taskCompletionBadgeCount', String(next));
        } catch (e) {
          // ignore
        }
        return next;
      });
      const title = newlyCompleted.length > 1 ? 'Tasks Completed' : 'Task Completed';
      const body = newlyCompleted.length > 1
        ? `${newlyCompleted.length} tasks were completed`
        : (newlyCompleted[0].title ? `${newlyCompleted[0].title} is completed` : 'A task was completed');
      showSystemNotification(title, body, 'task-complete', '/');
    }

    setProjects(projectsWithComments);
    projectsLoadedRef.current = true;
    setIsLoadingProjects(false);
  } catch (err) {
    console.error("Failed to fetch projects:", err);
    setIsLoadingProjects(false);
  }
};

useEffect(() => {
  if (user?.id) {
    fetchProjects();
    // Auto-refresh removed
  }
}, [user]);

   // Get icon for announcement type
    const getIconForType = (type) => {
      switch (type) {
        case "meeting": return <MdCalendarToday className="text-white" size={24} />;
        case "deadline": return <IoMdTime className="text-white" size={24} />;
        case "safety": return <HiOutlineClipboardList className="text-white" size={24} />;
            case "update": return <MdAnnouncement className="text-white" size={24} />;
            case "question": return <MdChat className="text-white" size={24} />;
            default: return <MdChatBubble className="text-white" size={24} />;
      }
    };

  // Get color for announcement type
  const getColorForType = (type) => {
    switch (type) {
      case "meeting": return "red";
      case "deadline": return "red";
      case "safety": return "green";
      case "update": return "purple";
      case "question": return "yellow";
      default: return "blue";
    }   
  };

const getPriorityBadge = (priority) => {
  if (priority === "high") {
    return <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">High Priority</span>;
  }
  if (priority === "medium") {
    return <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-600 text-xs rounded-full">Medium Priority</span>;
  }
  return null;
};


  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    };

    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showActionMenu]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reverse geocode to get location name from coordinates
  const getLocationName = async (longitude, latitude) => {
    try {
      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}&types=address,poi,place,locality,neighborhood`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const text = feature.text;
        
        // Get context for better name construction
        const context = feature.context || [];
        const addressNum = feature.address ? `${feature.address} ` : '';
        const streetName = text;
        const neighborhood = context.find(c => c.id.startsWith('neighborhood'))?.text;
        const locality = context.find(c => c.id.startsWith('locality'))?.text;
        const place = context.find(c => c.id.startsWith('place'))?.text;
        const region = context.find(c => c.id.startsWith('region'))?.text;
        
        // Build hierarchical address from most specific to general
        // Priority: Street Address > Neighborhood > Locality > Place > Region
        if (feature.place_type.includes('address')) {
          // Full street address
          if (addressNum && streetName && place && region) {
            return `${addressNum}${streetName}, ${place}, ${region}`;
          } else if (streetName && place && region) {
            return `${streetName}, ${place}, ${region}`;
          } else if (streetName && place) {
            return `${streetName}, ${place}`;
          }
        }
        
        if (feature.place_type.includes('poi')) {
          return text; // Return POI name (e.g., "SM Mall", "Coffee Shop")
        }
        
        // Build from neighborhood/locality
        if (neighborhood && place && region) {
          return `${neighborhood}, ${place}, ${region}`;
        } else if (locality && place && region) {
          return `${locality}, ${place}, ${region}`;
        } else if (neighborhood && place) {
          return `${neighborhood}, ${place}`;
        } else if (place && region) {
          return `${place}, ${region}`;
        } else if (place) {
          return place;
        }
        
        // Fallback to full place_name for detailed location
        return feature.place_name;
      }
      return 'Unknown Location';
    } catch (error) {
      console.error('Error fetching location name:', error);
      return 'Unknown Location';
    }
  };

  // Save location to backend
  const saveLocationToBackend = async (longitude, latitude, locationName = null) => {
    try {
      const response = await fetch('/backend/location.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          longitude,
          latitude,
          location_name: locationName
        })
      });
      const data = await response.json();
      console.log('Location saved:', data);

      // Add to location history with actual timestamp
      if (locationName) {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        setLocationHistory(prev => [{ 
          id: Date.now().toString(), 
          location: locationName, 
          time, 
          date,
          longitude,
          latitude,
          timestamp: now.toISOString()
        }, ...prev.slice(0, 19)]);
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  // Manual refresh location function
  const refreshLocation = async () => {
    setIsRefreshingLocation(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const longitude = pos.coords.longitude;
          const latitude = pos.coords.latitude;
          
          // Update actual user coordinates for marker
          setUserCoordinates({
            longitude,
            latitude
          });
          
          // Center map on new location
          setViewState({
            longitude,
            latitude,
            zoom: 15
          });
          
          // Get updated location name
          const locationName = await getLocationName(longitude, latitude);
          setCurrentLocation(locationName);
          
          // Save updated location to backend
          await saveLocationToBackend(longitude, latitude, locationName);
          
          setIsRefreshingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please check your location permissions.");
          setIsRefreshingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Don't use cached position
        }
      );
    } catch (error) {
      console.error('Error refreshing location:', error);
      setIsRefreshingLocation(false);
    }
  };

  useEffect(() => {
    if (!navigator || !navigator.geolocation) {
      console.warn('Geolocation API not available in this browser');
      setCurrentLocation('Geolocation not available');
      return;
    }

    let watchId = null;
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const longitude = pos.coords.longitude;
          const latitude = pos.coords.latitude;

          setUserCoordinates({ longitude, latitude });

          setViewState(prev => ({ ...prev, longitude, latitude, zoom: 15 }));

          const locationName = await getLocationName(longitude, latitude);
          setCurrentLocation(locationName);

          saveLocationToBackend(longitude, latitude, locationName);
        },
        (err) => {
          console.error('Error getting initial position:', err);
          setCurrentLocation('Location access denied');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const longitude = pos.coords.longitude;
          const latitude = pos.coords.latitude;

          setUserCoordinates({ longitude, latitude });

          const locationName = await getLocationName(longitude, latitude);
          setCurrentLocation(locationName);

          saveLocationToBackend(longitude, latitude, locationName);
        },
        (err) => {
          console.warn('Error tracking location:', err);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } catch (err) {
      console.error('Geolocation initialization error:', err);
      setCurrentLocation('Unable to access location');
    }

    return () => {
      try {
        if (watchId !== null && navigator && navigator.geolocation && typeof navigator.geolocation.clearWatch === 'function') {
          navigator.geolocation.clearWatch(watchId);
        }
      } catch (err) {
        console.warn('Error clearing geolocation watch:', err);
      }
    };
  }, []);

  // Mark a specific announcement as read
  // This function sends a request to the backend and updates the local state
  const markAsRead = async (id) => {
    // Send request to backend to mark as read
    await fetch("/backend/mark_read.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcement_id: id }),
    });

    // Update local state to reflect the change immediately
    const now = Date.now();
    // Persist read timestamp
    setAnnouncementReadAt(prev => {
      const next = { ...(prev || {}), [id]: now };
      try { localStorage.setItem('announcementReadAt', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    setAnnouncements(prev => 
      prev.map(ann => {
        if (ann.id !== id) return ann;
        // compute isNew: 1 day after creation OR 1 day after read
        const createdDate = new Date(ann.created_at);
        const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        const daysSinceRead = 0; // just read
        const isNew = (daysSinceCreated <= 1) || (daysSinceRead <= 1);
        return { ...ann, unread: false, isNew };
      })
    );
  };

  const togglePin = async (id, nextPinned) => {
    try {
      const res = await fetch("/backend/announcements.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", id, pinned: nextPinned })
      });
      const data = await res.json();
      if (data.status !== "success") {
        console.error("Pin update failed:", data.message);
      }
      setAnnouncements(prev => {
        const updated = prev.map(a => a.id === id ? { ...a, is_pinned: nextPinned } : a);
        return [...updated].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
      });
    } catch (err) {
      console.error("Toggle pin error:", err);
    }
  };


  const [projects, setProjects] = useState([]);

  const [locationHistory, setLocationHistory] = useState([]);
  const [userInteracted, setUserInteracted] = useState(false);

  // Progress Update States
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressStatus, setProgressStatus] = useState("In Progress");
  const [progressNotes, setProgressNotes] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [taskLocation, setTaskLocation] = useState(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationValidationMsg, setLocationValidationMsg] = useState("");

  // Refs for camera
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  // Map reference to access underlying map instance for pixel -> lat/lng conversions
  const mapRef = useRef(null);

  const updateLocation = (location) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString();

    setCurrentLocation(location);
    setLocationHistory(prev => [{ id: Date.now().toString(), location, time, date }, ...prev.slice(0, 9)]);
    setShowLocationModal(false);
    alert(`Location Updated: Your location has been set to ${location}`);
  };

  const submitReport = () => {
    if (!reportMessage.trim()) return alert("Please enter a report message");
    alert("Report Submitted: Your report has been sent to admin");
    setReportMessage("");
    setShowReportModal(false);
    setShowActionMenu(false);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "ongoing": return "bg-green-500";
      case "completed": return "bg-blue-500";
      case "scheduled": return "bg-yellow-500";
      case "pending": return "bg-violet-500";
      default: return "bg-gray-500";
    }
  };

  const getAnnouncementColor = (type) => {
    switch (type) {
      case "meeting": return "bg-blue-100 text-blue-600";
      case "deadline": return "bg-red-100 text-red-600";
      case "general": return "bg-greengeneral-100 text-green-600";
      case "maintenance": return "bg-yellow-100 text-yellow-600";
      case "update": return "bg-purple-100 text-purple-600";
      default: return <MdChatBubble className="text-white" size={18} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case "high": return "High Priority";
      case "medium": return "Medium Priority";
      case "low": return "Low Priority";
      default: return "Normal";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (color) => {
    switch (color) {
      case "blue": return "bg-gradient-to-br from-blue-500 to-blue-600";
      case "red": return "bg-gradient-to-br from-red-500 to-red-600";
      case "green": return "bg-gradient-to-br from-green-500 to-green-600";
      case "purple": return "bg-gradient-to-br from-purple-500 to-purple-600";
      case "yellow": return "bg-gradient-to-br from-yellow-500 to-yellow-600";
      default: return "bg-gradient-to-br from-gray-500 to-gray-600";
    }
  };

    const getIconColorClass = (color) => {
      switch (color) {
        case "blue": return "text-blue-600";
        case "red": return "text-red-600";
        case "green": return "text-green-600";
        case "purple": return "text-purple-600";
        case "yellow": return "text-yellow-500";
        default: return "text-gray-600";
      }
    };

  const handleProfileClick = () => {
    if (isMobile) {
      setProfileOpen(true);
    } else {
      setActiveTab("Profile");
    }
  };

  const handleNotificationsClick = () => {
    pushScreen('notifications');
    setSelectedFilter("unread");
    setShowAnnouncementFilterMenu(false);
    if (profileOpen) setProfileOpen(false);
    if (showActionMenu) setShowActionMenu(false);
    
    // Reset both badge counts when opening notifications
    setTaskCompletionBadgeCount(0);
    setAnnouncementBadgeCount(0);
    try {
      localStorage.setItem('taskCompletionBadgeCount', '0');
      localStorage.setItem('announcementBadgeCount', '0');
    } catch (e) {
      // ignore
    }
  };

  const handleTabChange = (tab) => {
    triggerHaptic('light');
    setActiveTab(tab);
    if (profileOpen) setProfileOpen(false);
    if (showActionMenu) setShowActionMenu(false);
  };

  // Edit Profile Functions
  const openEditProfileModal = () => {
    // Pre-fill with stored data or extract name from email for backward compatibility
    setEditFormData({
      name: formatAuthorName(user?.email, user) || '',
      department: user?.department || '',
      phone: user?.phone || ''
    });
    setShowEditProfileModal(true);
  };

  const closeEditProfileModal = () => {
    setShowEditProfileModal(false);
    setEditFormData({ name: '', department: '', phone: '' });
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveProfileChanges = async () => {
    setIsSavingProfile(true);
    try {
      const response = await fetch('/backend/update_profile.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          name: editFormData.name,
          department: editFormData.department,
          phone: editFormData.phone
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local user state (parent component should handle this via prop update)
        alert('Profile updated successfully!');
        closeEditProfileModal();
        // Trigger page reload to fetch updated data
        window.location.reload();
      } else {
        alert('Failed to update profile: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Navigation Stack Functions
  const pushScreen = (screenName, data = {}) => {
    setNavigationStack(prev => [...prev, { screen: screenName, data }]);
  };

  const popScreen = () => {
    setNavigationStack(prev => prev.slice(0, -1));
  };

  const getCurrentScreen = () => {
    return navigationStack[navigationStack.length - 1];
  };

  // Haptic feedback helper (debounced to avoid double-triggering)
  const triggerHaptic = (style = 'light') => {
    try {
      // Avoid vibration until a user interaction has occurred and it was a trusted gesture
      const lastUserGestureRef = window.__stelsen_lastUserGesture;
      const gestureAllowed = (lastUserGestureRef && lastUserGestureRef.current) || userInteracted;
      if (!gestureAllowed) return;

      if (!('vibrate' in navigator)) return;

      const now = Date.now();
      if (!triggerHaptic._last || (now - triggerHaptic._last) > 60) {
        triggerHaptic._last = now;
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30],
          success: [10, 50, 10],
          error: [50, 100, 50]
        };
        try { navigator.vibrate(patterns[style] || patterns.light); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      // ignore any vibration/intervention errors
    }
  };

  // Global haptic bindings: vibrate on clicks of interactive elements and select changes
  useEffect(() => {
    const clickHandler = (e) => {
      try {
        const el = e.target && e.target.closest && e.target.closest('button, [role="button"], a, [data-haptic], img');
        if (el) triggerHaptic('light');
      } catch (err) { }
    };

    const changeHandler = (e) => {
      try {
        if (e.target && e.target.tagName === 'SELECT') triggerHaptic('light');
      } catch (err) { }
    };

    document.addEventListener('click', clickHandler, true);
    document.addEventListener('change', changeHandler, true);
    // Immediate touchstart haptic for touch devices
    const touchImmediate = (e) => {
      try {
        if (!e.isTrusted) return;
        const el = e.target && (e.target.closest ? e.target.closest('button, [role="button"], a, select, [data-haptic], img.profile') : null);
        if (el) triggerHaptic('light');
      } catch (err) {}
    };
    document.addEventListener('touchstart', touchImmediate, true);

    return () => {
      document.removeEventListener('click', clickHandler, true);
      document.removeEventListener('change', changeHandler, true);
      document.removeEventListener('touchstart', touchImmediate, true);
    };
  }, []);

  // Tag interactive elements with `data-haptic` so global haptic bindings trigger reliably
  useEffect(() => {
    const tagInteractive = (root = document) => {
      try {
        const selectors = 'button, select, [role="button"], a, img.profile, .avatar img, [data-haptic]';
        const els = root.querySelectorAll ? root.querySelectorAll(selectors) : [];
        els.forEach(el => {
          try { el.setAttribute('data-haptic', 'true'); } catch (e) {}
        });
      } catch (e) {}
    };

    tagInteractive(document);
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes && m.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;
          tagInteractive(node);
        });
      }
    });
    if (document && document.body) mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  // Swipe gesture handlers for back navigation
  const minSwipeDistance = 50; // minimum distance for a swipe

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Right swipe = go back
    if (isRightSwipe && navigationStack.length > 0) {
      triggerHaptic('light');
      popScreen();
    }
  };

  // Pull-to-refresh handlers
  const handlePullStart = (e) => {
    if (window.scrollY === 0) {
      setPullDistance(0);
      setIsPulling(true);
    }
  };

  const handlePullMove = (e) => {
    if (isPulling && window.scrollY === 0) {
      const touch = e.touches[0];
      const distance = Math.max(0, touch.clientY - (touchStart || touch.clientY));
      setPullDistance(Math.min(distance, pullThreshold * 1.5));
    }
  };

  const handlePullEnd = async () => {
    if (isPulling) {
      if (pullDistance >= pullThreshold) {
        triggerHaptic('medium');
        // Refresh based on current tab
        if (activeTab === 'Home') {
          await fetchAnnouncements();
        } else if (activeTab === 'My Project') {
          await fetchProjects();
        }
        setToast({ show: true, message: 'Refreshed!', type: 'success' });
      }
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  const viewProjectDetails = async (project) => {
    // Prime selected project immediately
    setSelectedProject({ ...project, comments: project.comments || [] });
    pushScreen("projectDetails", { project });

    // Fetch fresh comments for this project
    try {
      const res = await fetch(`/backend/comments.php?project_id=${project.id}`, { credentials: "include" });
      const data = await res.json();
      if (data.status === "success") {
        const mapped = (data.comments || []).map((c) => ({
          id: c.comment_id,
          text: c.comment,
          time: getCommentTimeAgo(c.created_at),
          created_at: c.created_at,
          email: c.email,
          profile_image: c.profile_image,
          user: c.user || getDisplayName(c.email),
          attachments: c.attachments || null,
          // Progress-related fields (mirror fetchProjects / auto-refresh mapping)
          progress_percentage: c.progress_percentage || null,
          progress_status: c.progress_status || null,
          evidence_photo: c.evidence_photo || null,
          location_latitude: c.location_latitude || null,
          location_longitude: c.location_longitude || null,
          location_accuracy: c.location_accuracy || null,
          approval_status: c.approval_status || null,
          comment_type: c.comment_type || null,
          progress: c.progress || null,
          progress_id: c.progress_id || null,
        }));

        setSelectedProject(prev => prev ? { ...prev, comments: mapped } : prev);
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, comments: mapped } : p));
      }
    } catch (err) {
      console.error("Project comments fetch error:", err);
    }
  };

  const addComment = async (projectId) => {
    if (!commentText.trim() && commentAttachments.length === 0) return;
    if (isSending) return; // Prevent double submission

    // Store values before clearing
    const messageText = commentText.trim();
    const attachments = [...commentAttachments];

    // Optimistic update: Create temporary comment immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      user: user?.name || getDisplayName(user?.email),
      text: messageText,
      time: "Sending...",
      created_at: new Date().toISOString(),
      profile_image: getCurrentUserProfileImage(),
      email: user?.email,
      attachments: attachments.length > 0 ? attachments.map(a => ({
        name: a.name,
        type: a.type,
        size: a.size,
        path: a.preview || null
      })) : null,
      _sending: true, // Flag to show sending state
    };

    // Clear input immediately for instant feedback
    setCommentText("");
    setCommentAttachments([]);
    setIsSending(true);

    // Add optimistic comment to UI
    setSelectedProject(prev => prev && prev.id === projectId
      ? { ...prev, comments: [...(prev.comments || []), optimisticComment] }
      : prev
    );
    setProjects(prev => prev.map(p => p.id === projectId 
      ? { ...p, comments: [...(p.comments || []), optimisticComment] } 
      : p
    ));

    try {
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("text", messageText);
      
      // Append actual file objects for multipart upload
      attachments.forEach((attachment) => {
        formData.append("attachments[]", attachment.rawFile);
      });

      const response = await fetch("/backend/comments.php", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();
      if (data.status === "success") {
        // Replace optimistic comment with real one
        const realComment = {
          id: data.comment_id || Date.now(),
          user: data.user || getDisplayName(user?.email),
          text: messageText,
          time: "Just now",
          created_at: new Date().toISOString(),
          profile_image: data.profile_image || getCurrentUserProfileImage(),
          email: data.email || user?.email,
          attachments: data.attachments || null,
        };

        // Replace temp comment with real one
        setSelectedProject(prev => prev && prev.id === projectId
          ? { ...prev, comments: prev.comments.map(c => c.id === tempId ? realComment : c) }
          : prev
        );
        setProjects(prev => prev.map(p => p.id === projectId 
          ? { ...p, comments: p.comments.map(c => c.id === tempId ? realComment : c) } 
          : p
        ));
      } else {
        throw new Error(data.message || "Failed to send");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      
      // Remove optimistic comment on error
      setSelectedProject(prev => prev && prev.id === projectId
        ? { ...prev, comments: prev.comments.filter(c => c.id !== tempId) }
        : prev
      );
      setProjects(prev => prev.map(p => p.id === projectId 
        ? { ...p, comments: p.comments.filter(c => c.id !== tempId) } 
        : p
      ));

      // Restore the text and attachments so user can retry
      setCommentText(messageText);
      setCommentAttachments(attachments);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const getUserById = (uid) => Array.isArray(users) ? users.find(u => String(u.id) === String(uid)) : undefined;

  const handleCommentFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        newAttachments.push({
          name: file.name,
          size: file.size,
          type: file.type,
          rawFile: file, // Store actual File object for FormData
        });
      }
      setCommentAttachments(prev => [...prev, ...newAttachments]);
    }
    // Reset input
    if (commentFileInputRef.current) {
      commentFileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setCommentAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    // Navigate to a dedicated camera screen and start camera there
    pushScreen('camera');
    try {
      await startCameraForModal();
    } catch (error) {
      console.error('Error starting camera screen:', error);
      // If it fails, return to previous screen
      popScreen();
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().getTime();
          const file = new File([blob], `camera-${timestamp}.jpg`, { type: 'image/jpeg' });

          setCommentAttachments(prev => [...prev, {
            name: file.name,
            preview: URL.createObjectURL(blob),
            size: file.size,
            type: file.type,
            rawFile: file,
          }]);

          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Auto-refresh comments when modal is open
  useEffect(() => {
    if (!showCommentsModal || !selectedProject?.id) return;

    const refreshComments = async () => {
      try {
        const res = await fetch(`/backend/comments.php?project_id=${selectedProject.id}`, { credentials: "include" });
        const data = await res.json();
        if (data.status === "success") {
          const mapped = (data.comments || []).map((c) => ({
            id: c.comment_id,
            text: c.comment,
            time: getCommentTimeAgo(c.created_at),
            created_at: c.created_at,
            email: c.email,
            profile_image: c.profile_image,
            user: c.user || getDisplayName(c.email),
            attachments: c.attachments || null,
            // Progress fields - direct from backend
            progress_percentage: c.progress_percentage || null,
            progress_status: c.progress_status || null,
            evidence_photo: c.evidence_photo || null,
            location_latitude: c.location_latitude || null,
            location_longitude: c.location_longitude || null,
            location_accuracy: c.location_accuracy || null,
            approval_status: c.approval_status || null,
            comment_type: c.comment_type || null,
          }));

          setSelectedProject(prev => prev ? { ...prev, comments: mapped } : prev);
          setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, comments: mapped } : p));
        }
      } catch (err) {
        console.error("Auto-refresh comments error:", err);
      }
    };

    // Auto-refresh removed — perform a single refresh when modal/project changes
    refreshComments();
  }, [showCommentsModal, selectedProject?.id]);

  const getProfileImageByEmail = (email) => {
    if (!email || !Array.isArray(users)) return null;
    const match = users.find(u => u.email === email);
    return match?.profile_image || null;
  };

  const getCurrentUserProfileImage = () => {
    if (!Array.isArray(users)) return user?.profile_image || null;
    const match = users.find(u => String(u.id) === String(user?.id) || u.email === user?.email);
    return match?.profile_image || user?.profile_image || null;
  };

  // Avatar component for consistent profile display
  const Avatar = ({ userObj, size = 32, className = "" }) => {
    const initial =
      userObj?.name?.charAt(0) ||
      userObj?.email?.charAt(0) ||
      "?";

    const [imgError, setImgError] = useState(false);

    // PRIORITY: uploaded → google → fallback
    const imageSrc =
      userObj?.uploaded_profile_image ||
      userObj?.profile_image ||
      null;

    if (!imageSrc || imgError) {
      return (
        <div
          role="button"
          data-haptic="true"
          className={`bg-blue-500 text-white font-bold flex items-center justify-center rounded-full ${className}`.trim()}
          style={{ width: size, height: size }}
        >
          {initial.toUpperCase()}
        </div>
      );
    }

    return (
      <img
        src={imageSrc}
        alt="Profile"
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
        data-haptic="true"
        role="button"
        className={`rounded-full object-cover ${className}`.trim()}
        style={{ width: size, height: size }}
      />
    );
  };

//========================================================== Render Functions ==========================================================
const renderAnnouncementCard = (announcement) => (
  <div
    key={announcement.id}
    className={`relative bg-white rounded-2xl p-4 mb-3 shadow-lg ${
      announcement.unread ? "border-l-4 border-blue-500" : ""
    }`}
    onClick={() => markAsRead(announcement.id)}
  >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="mr-3 flex items-center justify-center">
            {React.isValidElement(announcement.icon)
              ? React.cloneElement(announcement.icon, { className: getIconColorClass(announcement.color), size: 24 })
              : announcement.icon
            }
          </div>
          <div>
          <h4 className="font-bold text-gray-800">{announcement.title}</h4>
          <div className="flex items-center text-xs text-gray-500">
           <span className="text-xs text-gray-500">{announcement.category}</span>
            {getPriorityBadge(announcement.priority)}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => { e.stopPropagation(); togglePin(announcement.id, !announcement.is_pinned); }}
          className={`p-3 rounded-full min-w-[44px] min-h-[44px] hover:bg-gray-100 transition ${announcement.is_pinned ? "text-red-500" : "text-gray-500"}`}
          aria-label={announcement.is_pinned ? "Unpin announcement" : "Pin announcement"}
          title={announcement.is_pinned ? "Unpin" : "Pin"}
        >
          <MdPushPin size={18} />
        </button>
        {announcement.unread && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
      </div>
    </div>

    {/* Content */}
    <p className="text-gray-600 text-sm mb-3">{announcement.content}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500 flex items-center">
            <IoMdTime className="mr-1" size={14} />
            {announcement.time}
          </span>
          <span className="text-xs text-gray-500">By: {announcement.author}</span>
        </div>
        <div className="flex items-center">
          {announcement.unread ? (
           <button
            onClick={async (e) => {
              e.stopPropagation(); // Prevent parent click event
              await markAsRead(announcement.id);
            }}
            className="text-xs text-blue-500 font-medium hover:text-blue-600"
          >
            Mark as read
          </button> 
          ) : (
            <div className="flex items-center text-gray-500 text-sm">
              <IoMdCheckmarkCircle size={16} className="mr-1" />
              <span>Read</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const getUnreadCommentCount = (projectId) => {
    const projectReadComments = readComments[projectId] || [];
    const projectComments = projects.find(p => p.id === projectId)?.comments || [];
    return projectComments.filter(c => !projectReadComments.includes(c.id)).length;
  };

  const renderProjectCard = (item) => {
    const unreadCount = getUnreadCommentCount(item.id);
    return (
    <div key={item.id} className="relative bg-white rounded-2xl p-4 mb-3 shadow-lg hover:shadow-xl transition-all">
      {item.isNew && (
      <span className="absolute -top-1 -left-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg z-10">
        New
      </span>
      )}
      <div className="flex justify-between items-center mb-4">
      <div className="flex items-center flex-1">
        <div className="ml-3">
        <h4 className="font-bold text-gray-800">{item.title}</h4>
        <p className="text-xs text-gray-500">Managed by {item.manager}</p>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full ${getStatusColor(item.status)} text-white text-xs`}>
        {item.status}
      </div>
      </div>
      
      <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span className="text-xs cursor-pointer hover:text-blue-600 transition-colors" onClick={() => {
          setSelectedTaskForProgress(item);
          setProgressPercentage(item.progress || 0);
          setShowProgressModal(true);
        }}>
          Update Progress
        </span>
        <span className="font-bold">{item.progress}%</span>
      </div>
      <div 
        className="h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => {
          setSelectedTaskForProgress(item);
          setProgressPercentage(item.progress || 0);
          setShowProgressModal(true);
        }}
      >
        <div
        className={`h-full rounded-full ${getStatusColor(item.status)}`}
        style={{ width: `${item.progress}%` }}
        ></div>
      </div>
      </div>
      
      <div className="flex items-center justify-between">
      <div className="text-xs text-gray-500">
        <div>Deadline: <span className="font-medium">{item.deadline}</span></div>
        <div>Budget: <span className="font-medium">{formatPeso(item.budget)}</span></div>
      </div>
      <div className="flex items-center space-x-2">
        <button
        onClick={() => {
          setSelectedProject({ ...item, comments: item.comments || [] });
          pushScreen('comments');
          // Mark all comments as read for this project
          if (item && item.comments) {
          const commentIds = item.comments.map(c => c.id);
          setReadComments(prev => ({
            ...prev,
            [item.id]: commentIds
          }));
          }
        }}
        className="flex items-center text-xs text-gray-500 relative hover:text-blue-500 transition-colors"
        >
        <MdComment size={14} className="mr-1" />
        {(item.comments && item.comments.length) || 0}
        {unreadCount > 0 && (
          <div className="absolute -top-0.5 -right-0.1 w-2 h-2 bg-red-500 rounded-full "></div>
        )}
        </button>
        <button 
        onClick={() => viewProjectDetails(item)}
        className="text-blue-500 text-sm font-medium flex items-center"
        >
        Details <FiChevronRight size={16} className="ml-1" />
        </button>
      </div>
      </div>
    </div>
    );
  };

  const renderProjectDetailsModal = () => (
    <div 
      className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-in-right"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header (clean) */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-4 border-b border-blue-600 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={popScreen}
              className="p-3 rounded-full min-w-[44px] min-h-[44px] hover:bg-white/10 mr-0"
              aria-label="Back"
            >
              <IoMdArrowBack size={20} className="text-white" />
            </button>
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-white leading-tight tracking-tight">Task Details</h3>
              <p className="text-xs text-blue-100 mt-0.5">View project information</p>
            </div>
          </div>

          {selectedProject && (
            <span className={`px-3 py-1 rounded-full ${getStatusColor(selectedProject.status)} text-white text-xs inline-block flex-shrink-0`}>
              {selectedProject.status}
            </span>
          )}
        </div>
      </div>

      {/* Sub-header / Breadcrumb bar (outside sticky header for clearer layout) */}
      <div className="pl-8 pr-2 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-600">
        <nav className="flex items-center gap-2">
          <button onClick={() => { popScreen(); setActiveTab('Home'); }} className="hover:text-blue-600 transition-colors">Home</button>
          <FiChevronRight size={12} className="text-gray-400" />
          <button onClick={popScreen} className="hover:text-blue-600 transition-colors">Projects</button>
          <FiChevronRight size={12} className="text-gray-400" />
          <span className="text-gray-800 font-medium truncate max-w-[260px]">Details</span>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {selectedProject && (
          <>
            <div className="flex flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-4 border-b-2 border-gray-200">
              <h4 className="text-2xl font-bold text-gray-900 flex-1 leading-tight">{selectedProject.title}</h4>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div className="space-y-3 sm:space-y-5">
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-bold text-gray-700 mb-1 sm:mb-2 uppercase tracking-wider">Team Users</p>
                  <div className="flex flex-wrap gap-1 sm:gap-2 items-start content-start">
                    {selectedProject.assignedUsers && selectedProject.assignedUsers.length > 0 ? (
                      selectedProject.assignedUsers.map((uid, idx) => {
                        const isCurrentUser = String(uid) === String(user?.id);
                        const foundUser = getUserById(uid);
                        const label = isCurrentUser
                          ? `${user?.name || getDisplayName(user?.email)}`
                          : formatAuthorName(foundUser?.email, foundUser) || `User #${uid}`;
                        const avatar = foundUser?.profile_image;

                        return (
                          <span
                            key={`${uid}-${idx}`}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
                              isCurrentUser
                                ? "bg-blue-600 text-white border-blue-700"
                                : "bg-blue-50 text-blue-800 border-blue-100"
                            }`}
                          >
                            {avatar ? (
                              <img src={avatar} alt={label} className="w-6 h-6 rounded-full" />
                            ) : (
                              <FaUser size={14} />
                            )}
                            <span className="whitespace-nowrap">{label}</span>
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 w-full">None</p>
                    )}
                  </div>
                </div>

                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Description</p>
                  <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">{selectedProject.description}</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-5">
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Manager</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{selectedProject.manager || 'N/A'}</p>
                </div>

                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Budget</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{selectedProject.budget ? formatPeso(selectedProject.budget) : 'N/A'}</p>
                </div>

                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Deadline</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm">{selectedProject.deadline || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="sm:hidden mb-6">
              <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Description</p>
              <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">{selectedProject.description}</p>
            </div>

            {/* Action Buttons Section */}
            <div className="mt-8 space-y-4">
              <button
                onClick={() => {
                  pushScreen('comments');
                  // Mark all comments as read for this project
                  if (selectedProject && selectedProject.comments) {
                    const commentIds = selectedProject.comments.map(c => c.id);
                    setReadComments(prev => ({
                      ...prev,
                      [selectedProject.id]: commentIds
                    }));
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl p-4 transition-all duration-200 border border-blue-200 hover:border-blue-300 flex items-center justify-between relative hover:shadow-md"
              >
                <div className="flex items-center">
                  <div className="bg-blue-500 p-3 rounded-full mr-3 relative">
                    <MdComment className="text-white" size={24} />
                    {getUnreadCommentCount(selectedProject?.id) > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center ">
                        {getUnreadCommentCount(selectedProject?.id)}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h4 className="text-md font-bold text-gray-800">Comments & Clarifications</h4>
                    <p className="text-sm text-gray-600">
                      {selectedProject.comments && selectedProject.comments.length > 0
                        ? `${selectedProject.comments.length} comment${selectedProject.comments.length !== 1 ? "s" : ""}`
                        : "No comments yet. Start a conversation"}
                    </p>
                  </div>
                </div>
                <FiChevronRight size={24} className="text-blue-500" />
              </button>

              {/* Task Progress Button */}
              <button
                onClick={() => {
                  // Fetch progress updates for this project
                  if (selectedProject?.id) {
                    fetch(`/backend/project_progress.php?project_id=${selectedProject.id}`, { 
                      credentials: "include" 
                    })
                      .then(res => res.json())
                      .then(data => {
                        if (data.status === "success" && data.progress) {
                          setTaskProgressList(data.progress);
                        } else {
                          setTaskProgressList([]);
                        }
                        pushScreen("taskProgress");
                      })
                      .catch(err => {
                        console.error('Error fetching progress:', err);
                        setTaskProgressList([]);
                        pushScreen("taskProgress");
                      });
                  }
                }}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-sky-50 to-cyan-50 hover:from-sky-100 hover:to-cyan-100 rounded-xl transition-all duration-200 border border-sky-200 hover:border-sky-300 hover:shadow-md"
              >
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                  <MdCheck className="text-white" size={24} />
                </div>
                <div className="text-left flex-1">
                  <h4 className="text-md font-bold text-gray-800">Task Progress</h4>
                  <p className="text-sm text-gray-600">
                    Track project milestones and updates
                  </p>
                </div>
                <FiChevronRight size={24} className="text-sky-500 flex-shrink-0" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  ); 

const renderCommentsModal = () => (
  <div 
    className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-in-right"
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
  >
    {/* Messenger-style Header */}
    <div className="sticky top-0 z-20 bg-white px-4 py-3 border-b border-gray-200 shadow-sm">
      <div className="flex items-center mb-2">
        <button 
          onClick={popScreen}
          className="p-3 rounded-full min-w-[44px] min-h-[44px] hover:bg-gray-100 mr-2 transition-colors flex-shrink-0"
        >
          <IoMdArrowBack size={24} className="text-gray-700" />
        </button>
        
        <Avatar 
          userObj={user}
          size={40}
          className="flex-shrink-0 mr-4"
        />

        {/* Title + Call/Video actions */}
        <div className="flex-1 flex items-center justify-between ml-3 mt-1">
          <span className="text-gray-800 font-medium">Comments</span>
          <div className="flex items-center gap-2">
            <button title="Voice call" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <MdCall size={18} className="text-gray-700" />
            </button>
            <button title="Video call" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <MdVideocam size={18} className="text-gray-700" />
            </button>
          </div>
        </div>

        <button className="p-3 rounded-full min-w-[44px] min-h-[44px] hover:bg-gray-100 transition-colors ml-2">
          <MdPeople size={20} className="text-gray-600" />
        </button>
      </div>
      
    </div>

    {/* Messenger Chat Area */}
    <div className="flex-1 overflow-y-auto bg-contain bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto space-y-1">
        {selectedProject && selectedProject.comments && selectedProject.comments.length > 0 ? (
          <>
            {/* Group comments by date and render with Messenger-style separators */}
            {(() => {
              const groupedComments = groupCommentsByDate(selectedProject.comments);
              const dateLabels = Object.keys(groupedComments);
              
              // Check if we should show the "View Previous" button
              // Only show if there are more than 5 dates, or if not all comments are visible
              const isExpanded = expandedProjectComments[selectedProject.id] || false;
              const shouldShowViewPrevious = dateLabels.length > 3;
              
              // Determine how many date groups to show
              let visibleDateLabels = dateLabels;
              if (shouldShowViewPrevious && !isExpanded) {
                // Show only the most recent dates
                visibleDateLabels = dateLabels.slice(-3);
              }
              
              return visibleDateLabels.map((dateLabel, dateIdx) => (
                <div key={dateLabel}>
                  {/* Date separator */}
                  {dateIdx > 0 && (
                    <div className="flex items-center my-6">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="mx-3 text-xs text-gray-600 font-medium">{dateLabel}</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                  )}
                  {dateIdx === 0 && dateLabels.length > 1 && (
                    <div className="flex items-center my-6">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="mx-3 text-xs text-gray-600 font-medium">{dateLabel}</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                  )}
                  
                  {/* Comments for this date */}
                  {groupedComments[dateLabel].map((comment, idx) => {
                    const isCurrentUser = comment.email === user?.email;
                    const commentUser = isCurrentUser ? user : users.find(u => u.email === comment.email);
                    
                    // Check if previous comment is from the same user
                    const previousComment = idx > 0 ? groupedComments[dateLabel][idx - 1] : null;
                    const previousUserEmail = previousComment?.email;
                    const showUserLabel = previousUserEmail !== comment.email;
                    
                    // Check if this comment has a progress update
                    const hasProgress = (comment.progress && typeof comment.progress === 'object') || 
                                       (comment.progress_percentage !== null && comment.progress_percentage !== undefined) ||
                                       comment.progress_id || 
                                       comment.approval_status;
                    
                    return (
                      <div key={comment.id}>
                        {/* Progress Approval Card - Show if it's a progress update */}
                        {hasProgress && (
                          <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}>
                            <div className={`flex max-w-[90%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                              {!isCurrentUser && (
                                <div className="flex-shrink-0 mr-2 self-start mt-2">
                                  <Avatar 
                                    userObj={{
                                      ...commentUser,
                                      profile_image: comment.profile_image || commentUser?.profile_image
                                    }} 
                                    size={28} 
                                  />
                                </div>
                              )}
                              <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''}`}>
                                {!isCurrentUser && showUserLabel && (
                                  <span className="text-xs text-gray-600 font-medium mb-1 ml-1">
                                    {comment.user || "User"}
                                  </span>
                                )}
                                <ProgressApprovalCard comment={comment} />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Regular Comment - Skip if it's a progress update (to avoid duplicates) */}
                        {!hasProgress && (
                        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}>
                          <div className={`flex max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            {!isCurrentUser && (
                              <div className="flex-shrink-0 mr-2 self-end">
                                <Avatar 
                                  userObj={{
                                    ...commentUser,
                                    profile_image: comment.profile_image || commentUser?.profile_image
                                  }} 
                                  size={28} 
                                />
                              </div>
                            )}
                            
                            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''}`}>
                              {!isCurrentUser && showUserLabel && (
                                <span className="text-xs text-gray-600 font-medium mb-1 ml-1">
                                  {comment.user || "User"}
                                </span>
                              )}
                              
                              {comment.text ? (
                                <div className={`relative rounded-2xl px-4 py-2 max-w-[280px] ${
                                  isCurrentUser 
                                    ? 'bg-blue-500 text-white rounded-br-sm' 
                                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                                }`}>
                                  {/* Messenger-style tail */}
                                  {!isCurrentUser ? (
                                    <div className="absolute -left-1.5 bottom-0 w-3 h-3 overflow-hidden">
                                      <div className="absolute w-3 h-3 bg-white transform rotate-45 translate-y-1/2"></div>
                                    </div>
                                  ) : (
                                    <div className="absolute -right-1.5 bottom-0 w-3 h-3 overflow-hidden">
                                      <div className="absolute w-3 h-3 bg-blue-500 transform rotate-45 translate-y-1/2"></div>
                                    </div>
                                  )}
                                  
                                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                    {comment.text}
                                  </p>
                                </div>
                              ) : null}
                              
                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className={`${comment.text ? 'mt-2' : ''} space-y-2`}>
                                  {comment.attachments.map((att, idx) => {
                                    const isImage = att.type && (att.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name));

                                    return isImage ? (
                                      <img
                                        key={idx}
                                        src={att.path}
                                        alt={att.name}
                                        className="w-full max-w-[420px] rounded-2xl h-auto object-cover cursor-pointer hover:opacity-95 transition-opacity shadow-md"
                                        onClick={() => window.open(att.path, '_blank')}
                                      />
                                    ) : (
                                      <a
                                        key={idx}
                                        href={att.path || att.data}
                                        download={att.name}
                                        className={`flex items-center text-sm px-3 py-2 rounded-lg transition-colors ${
                                          isCurrentUser 
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <FiPaperclip size={16} className="mr-2 flex-shrink-0" />
                                        <span className="truncate flex-1">{att.name}</span>
                                        <span className="text-xs opacity-75 ml-2">
                                          {(att.size / 1024).toFixed(1)}KB
                                        </span>
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                              <div className={`flex items-center mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[10px] text-gray-400 mr-2">
                                  {comment.time}
                                </span>
                                {isCurrentUser && (
                                  <div className="text-blue-500">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                                      <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
            
            {/* View Previous Comments Button - Only show if collapsed and there are hidden comments */}
            {(() => {
              const groupedComments = groupCommentsByDate(selectedProject.comments);
              const dateLabels = Object.keys(groupedComments);
              const shouldShowViewPrevious = dateLabels.length > 3;
              const isExpanded = expandedProjectComments[selectedProject.id] || false;
              
              return shouldShowViewPrevious && !isExpanded && (
                <div className="flex justify-center my-6">
                  <button
                    onClick={() => {
                      setExpandedProjectComments({
                        ...expandedProjectComments,
                        [selectedProject.id]: true
                      });
                    }}
                    className="flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4" />
                    </svg>
                    View {dateLabels.length - 3} previous day{dateLabels.length - 3 !== 1 ? 's' : ''} of comments
                  </button>
                </div>
              );
            })()}
          </>
        ) : (
          // Empty state with Messenger-style design
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-11 h-11 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12h-8v-2h8v2zm0-4h-8V8h8v2z"/>
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-600">No comments yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to comment</p>
            <div className="mt-6 text-xs text-gray-400 flex items-center">
              <div className="w-1 h-1 bg-gray-300 rounded-full mx-2"></div>
              Messages are end-to-end encrypted
              <div className="w-1 h-1 bg-gray-300 rounded-full mx-2"></div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Messenger Input Area */}
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      {/* Typing indicator */}
      {false && ( // You can conditionally show this
        <div className="flex items-center mb-2 ml-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-xs text-gray-500 ml-2">Someone is typing...</span>
        </div>
      )}
      
      {/* Attachments Preview */}
      {commentAttachments.length > 0 && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-blue-700">
              {commentAttachments.length} attachment{commentAttachments.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={() => setCommentAttachments([])}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
            {commentAttachments.map((att, idx) => (
              <div key={idx} className="relative group">
                <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="truncate max-w-[120px] text-gray-700">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-1"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Input Form - Mobile Optimized */}
      <div className="flex items-center gap-1">
        {/* Left side buttons */}
        <div className="flex items-center flex-shrink-0">
          <button 
            type="button"
            onClick={() => commentFileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-600 active:bg-gray-100 rounded-full transition-colors touch-manipulation"
            title="Attach files"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
          
          <button 
            type="button"
            onClick={startCamera}
            className="p-2 text-gray-500 hover:text-green-600 active:bg-gray-100 rounded-full transition-colors touch-manipulation ml-0.5"
            title="Take photo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
        </div>
        
        {/* Oval input */}
        <div className="flex items-center flex-1 bg-gray-100 rounded-full px-4 py-2.5 shadow-sm border-gray-200">
          {/* Textarea */}
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Message"
            rows={1}
            name="msg"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="send"
            className="flex-1 resize-none bg-transparent outline-none text-sm placeholder:text-gray-400 leading-5"
            style={{
              fontSize: "16px",
              WebkitAppearance: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (commentText.trim() || commentAttachments.length > 0) {
                  addComment(selectedProject.id);
                }
              }
            }}
          />
        </div>
        
        {/* Send button */}
        <button
          type="button"
          onClick={() => {
            if ((commentText.trim() || commentAttachments.length > 0) && !isSending) {
              addComment(selectedProject.id);
            }
          }}
          disabled={(!commentText.trim() && commentAttachments.length === 0) || isSending}
          className={`p-3 rounded-full transition-all ml-1 flex-shrink-0 touch-manipulation ${
            (commentText.trim() || commentAttachments.length > 0) && !isSending
              ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Send message"
          style={{ 
            minWidth: '44px',
            minHeight: '44px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {isSending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16151495 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4429026 C0.994623095,2.0766019 0.837654326,3.16592693 1.15159189,3.95141385 L3.03521743,10.3924068 C3.03521743,10.5495042 3.19218622,10.7066015 3.50612381,10.7066015 L16.6915026,11.4920884 C16.6915026,11.4920884 17.1624089,11.4920884 17.1624089,11.0051895 L17.1624089,12.4744748 C17.1624089,12.4744748 17.1624089,12.4744748 16.6915026,12.4744748 Z"/>
            </svg>
          )}
        </button>
      </div>

      <input
        ref={commentFileInputRef}
        type="file"
        multiple
        onChange={handleCommentFileChange}
        style={{ display: 'none' }}
      />
    </div>
  </div>
);

  const renderLocationHistory = (item, idx) => (
    <div key={`${item.id}-${idx}`} className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex items-center">
      <div className="w-11 h-11 rounded-full bg-blue-50 flex justify-center items-center mr-3">
        <MdLocationOn size={24} className="text-blue-500" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-800 mb-1">{item.location}</div>
        <div className="text-xs text-gray-500">
          <div>{item.date} at {item.time}</div>
        </div>
      </div>
    </div>
  );

  // Collect active users from locations array.
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result;
        setSelectedFile(imageData);
        try {
          // Send as FormData with the actual file (preferred method)
          const formData = new FormData();
          formData.append('profile_image', file);
          
          const response = await fetch('/backend/profile.php', {
            method: 'POST',
            credentials: 'include',
            body: formData
          });
          const data = await response.json();
          console.log('Profile update response:', data);
          if (data.status === 'success') {
            // Update user object with the new persistent profile image URL from Firebase Storage
            const updatedUser = { 
              ...user, 
              profile_image: data.profile_image // Use the permanent URL returned from backend
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Update the selected file to use the permanent URL instead of DataURL
            setSelectedFile(data.profile_image);
            alert('Profile image updated successfully');
          } else {
            console.error('Profile update error:', data.message);
            alert('Failed to update profile image: ' + (data.message || 'Unknown error'));
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          alert('Error updating profile image: ' + error.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderProfile = () => (
    <div className="h-full flex flex-col">
      {/* Profile Header */}
      <div className="bg-white-500 px-5 py-4 flex justify-between items-center text-balck">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full border-2 border-white mr-3 overflow-hidden">
            <Avatar
              userObj={{
                ...user,
                uploaded_profile_image: selectedFile || user?.uploaded_profile_image,
                profile_image: selectedFile || user?.uploaded_profile_image || user?.profile_image,
              }}
              size={48}
            />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">My Profile</div>
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <div
                className={`w-2 h-2 rounded-full mr-2`}
                style={{ backgroundColor: userStatus === "Active" ? "#4CAF50" : "#F44336" }}
              ></div>
              Status: {userStatus}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setProfileOpen(false)}
          className="p-3 rounded-full min-w-[44px] min-h-[44px] bg-gray-800/20 hover:bg-gray-900/30 transition-colors"
        >
          <IoMdClose size={24} />
        </button>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-auto p-5 bg-gray-50">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full border-4 border-blue-100 overflow-hidden">
                <Avatar
                  userObj={{
                    ...user,
                    uploaded_profile_image: selectedFile || user?.uploaded_profile_image,
                    profile_image: selectedFile || user?.uploaded_profile_image || user?.profile_image,
                  }}
                  size={112}
                />
              </div>
              <button 
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full min-w-[40px] min-h-[40px] border-4 border-white hover:bg-blue-600"
                onClick={() => fileInputRef.current.click()}
              >
                <FiCamera size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{display: 'none'}} 
              />
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatAuthorName(user?.email, user)}</h3> 
                <p className="text-gray-500 mb-2 font-medium">{user?.department || "User Dashboard"}</p>
                <p className="text-sm text-gray-600 mb-1">{user?.email || "Not provided"}</p>
                <p className="text-sm text-gray-600">{user?.phone || "Not provided"}</p>
              </div>
              <button
                onClick={openEditProfileModal}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Edit Profile"
              >
                <FiEdit2 size={18} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Department Info */}
          <div className="border-t pt-4">
            <h4 className="text-base font-bold text-gray-900 mb-3">Department Information</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Employee ID</p>
                <p className="font-semibold text-gray-900">{user?.employeeId || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Department</p>
                <p className="font-semibold text-gray-900">{user?.department || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Join Date</p>
                <p className="font-semibold text-gray-900">{user?.joinDate || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Work Hours</p>
                <p className="font-semibold text-gray-900">{user?.workHours || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3 mb-6">
          <h4 className="text-base font-bold text-gray-900 mb-3 px-2">Quick Actions</h4>

          <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <FiSettings size={22} className="text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-gray-900">Account Settings</div>
              <div className="text-xs text-gray-500 mt-0.5">Manage your account preferences</div>
            </div>
            <FiChevronRight size={20} className="text-gray-400" />
          </button>

          <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
              <MdDashboard size={22} className="text-purple-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-gray-900">My Projects</div>
              <div className="text-xs text-gray-500 mt-0.5">View and manage projects</div>
            </div>
            <FiChevronRight size={20} className="text-gray-400" />
          </button>

          <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <MdLocationOn size={22} className="text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-gray-900">Location History</div>
              <div className="text-xs text-gray-500 mt-0.5">Check your location logs</div>
            </div>
            <FiChevronRight size={20} className="text-gray-400" />
          </button>

          <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
              <MdReportProblem size={22} className="text-yellow-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-gray-900">Daily Reports</div>
              <div className="text-xs text-gray-500 mt-0.5">Submit and view reports</div>
            </div>
            <FiChevronRight size={20} className="text-gray-400" />
          </button>

          <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
              <FaUser size={22} className="text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-gray-900">Help & Support</div>
              <div className="text-xs text-gray-500 mt-0.5">Get assistance and FAQs</div>
            </div>
            <FiChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <h4 className="text-base font-bold text-gray-900 mb-4">Preferences</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Notifications</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePush}
                      aria-pressed={pushEnabled}
                      aria-label="Toggle notifications"
                      className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${pushEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${pushEnabled ? 'right-1' : 'left-1'}`}></span>
                    </button>
                    {/* no textual label next to toggle by design */}
                  </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Dark Mode</span>
              <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Location Sharing</span>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button - UPDATED ICON */}
        <button
          className="w-full py-4 bg-red-500 text-white rounded-xl font-bold flex items-center justify-center hover:bg-red-600 transition-colors active:bg-red-700 mb-4 text-base"
          onClick={() => {
            logout();
            setProfileOpen(false);
          }}
        >
          <FaSignOutAlt size={20} className="mr-2" />
          Logout Account
        </button>

        {/* App Version */}
        <div className="text-center text-gray-400 text-sm py-3 border-t">
          <p>Construction Manager Pro v2.1.4</p>
          <p className="text-xs mt-1">Last updated: Today, 10:30 AM</p>
        </div>
      </div>
    </div>
  );

  // Shimmer/Skeleton Loading Component
  // ProgressApprovalCard Component - Read-only version for user perspective
  const ProgressApprovalCard = ({ comment }) => {
    const [showMap, setShowMap] = useState(false);
    
    // Handle both nested progress object and flat fields
    const progress = comment.progress || {
      percentage: comment.progress_percentage,
      status: comment.progress_status,
      photo: comment.evidence_photo,
      location: comment.location_latitude && comment.location_longitude ? {
        latitude: parseFloat(comment.location_latitude),
        longitude: parseFloat(comment.location_longitude),
        accuracy: comment.location_accuracy
      } : null
    };
    
    const toggleMap = () => {
      setShowMap(!showMap);
    };

    const isApproved = comment.approval_status === 'APPROVED';
    const isRejected = comment.approval_status === 'REJECTED';
    const isPending = comment.approval_status === 'PENDING';

    return (
      <div className="max-w-[500px] w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 my-2 hover:shadow-xl transition-shadow duration-300">
        {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <img src="/img/stelsenlogo.png" alt="Stelsen" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1">
                    <FiBarChart className="opacity-90" size={14} />
                    Progress Update
                  </div>
                  <div className="text-xs opacity-90 flex items-center gap-1 mt-0.5">
                    <FiPercent size={12} className="opacity-80" />
                    {progress?.percentage || 0}% Complete
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Time */}
          {comment.created_at && (
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                <FiClock size={12} className="text-blue-500" />
                <span className="font-medium">Submitted:</span>
                <span className="text-gray-700">{formatDateTime(comment.created_at)}</span>
              </div>
            </div>
          )}

          {/* Evidence Photo */}
        {progress?.photo && (
          <div className="relative group">
            <img
              src={progress.photo}
              alt="Evidence"
              className="w-full h-48 object-cover cursor-pointer group-hover:scale-[1.02] transition-transform duration-300"
              onClick={() => window.open(progress.photo, '_blank')}
            />
            <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-lg">
              <FiCamera size={12} />
              Evidence
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}

        {/* Task Notes - Always show */}
        <div className="px-4 py-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-start gap-2 mb-2">
            <FiFileText className="text-gray-400 mt-0.5 flex-shrink-0" size={14} />
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Task Notes</div>
          </div>
          <div className={`text-sm leading-relaxed break-words rounded-lg p-3 border shadow-sm ${
            comment.text 
              ? 'text-gray-700 bg-white border-gray-100' 
              : 'text-gray-400 bg-gray-50 border-gray-100 italic'
          }`}>
            {comment.text || 'No notes provided'}
          </div>
        </div>

        {/* Location */}
        {progress?.location && (
          <div className="px-4 py-3 border-b border-gray-100">
            {!showMap ? (
              <button
                onClick={toggleMap}
                className="flex items-center justify-between w-full text-sm text-gray-700 hover:text-blue-600 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                    <FiMapPin className="text-blue-500" size={18} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-1">
                      <span>View Location</span>
                      <FiChevronRight className="transform transition-transform duration-300" size={14} />
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      {progress.location.latitude?.toFixed(6)}, {progress.location.longitude?.toFixed(6)}
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FiMapPin className="text-blue-500" size={16} />
                    <span>Location Map</span>
                  </div>
                  <button
                    onClick={toggleMap}
                    className="p-2 rounded-full min-w-[44px] min-h-[44px] hover:bg-gray-100 transition-colors"
                  >
                    <FiX className="text-gray-500" size={18} />
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${progress.location.longitude},${progress.location.latitude})/${progress.location.longitude},${progress.location.latitude},14,0/500x250@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`}
                    alt="Location Map"
                    className="w-full h-64 object-cover"
                  />
                  <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 flex items-center justify-between border-t border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <FiMap size={12} />
                      <span>Mapbox View</span>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${progress.location.latitude},${progress.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      Open in Maps
                      <FiExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Badge */}
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center gap-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <FiActivity size={16} className="text-blue-500" />
            <span className="text-sm font-medium">Status:</span>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm ${
            progress?.status === 'Completed' ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' :
            progress?.status === 'In Progress' ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' :
            'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200'
          }`}>
            {progress?.status === 'Completed' ? (
              <>
                <FiCheckCircle size={12} />
                Completed
              </>
            ) : progress?.status === 'In Progress' ? (
              <>
                <FiLoader size={12} />
                In Progress
              </>
            ) : (
              <>
                <FiClock size={12} />
                Pending
              </>
            )}
          </span>
        </div>

        {/* Approval Status - Read-only for users */}
        <div className={`px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2 ${
          isApproved ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-t border-green-200' : 
          isRejected ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-t border-red-200' :
          'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-t border-yellow-200'
        }`}>
          {isApproved ? (
            <>
              <FiCheckCircle size={16} />
              <span className="font-semibold">Approved by Admin</span>
            </>
          ) : isRejected ? (
            <>
              <FiXCircle size={16} />
              <span className="font-semibold">Rejected by Admin</span>
            </>
          ) : (
            <>
              <FiLoader className="animate-spin" size={16} />
              <span className="font-semibold">Pending Review</span>
            </>
          )}
        </div>
      </div>
    );
  };

  const ShimmerCard = () => (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow-lg animate-pulse">
      <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
  );

  const ShimmerStatsCard = () => (
    <div className="bg-gradient-to-br from-gray-300 to-gray-200 text-white rounded-2xl p-4 shadow-lg animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-400 rounded w-12 mb-2"></div>
          <div className="h-3 bg-gray-400 rounded w-24"></div>
        </div>
        <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
      </div>
    </div>
  );

  const ShimmerProjectCard = () => (
    <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg animate-pulse">
      <div className="h-5 bg-gray-200 rounded mb-3 w-2/3"></div>
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-300 rounded-full w-20"></div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full mb-3"></div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    const filteredProjects = projectFilter === "all" ? projects : projects.filter(p => p.status === projectFilter);
    
    switch (activeTab) {
      case "Home":
        // Show skeleton during initial load
        if (isLoading) {
          return (
            <div className="p-5">
              <div className="mb-6 space-y-3">
                <div className="h-12 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-10 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-10 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="mb-6">
                <ShimmerStatsCard />
              </div>
              <div className="space-y-3">
                <ShimmerCard />
                <ShimmerCard />
                <ShimmerCard />
              </div>
            </div>
          );
        }
        
        return (
          <div className="p-5">

            {/* Enhanced Search and Filter Bar */}
                  <div className="mb-8">
                    {/* Search Bar with Icon and Date Filter */}
                    <div className="flex gap-2 mb-5">
                      <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Search announcements..."
                          className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm hover:shadow-md"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <IoMdClose size={20} />
                          </button>
                        )}
                      </div>
                      
                      {/* Compact Date Filter Icon Button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowDateFilterMenu(!showDateFilterMenu)}
                          className="h-[52px] w-[52px] flex items-center justify-center bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm hover:shadow-md"
                        >
                          <MdCalendarToday size={22} className={`${dateFilter !== 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                        </button>
                        {/* Backdrop Overlay */}
                        {showDateFilterMenu && (
                          <div 
                            className="fixed inset-0 bg-black/30 z-40"
                            onClick={() => setShowDateFilterMenu(false)}
                          ></div>
                        )}
                        
                        {/* Date Filter Dropdown Menu */}
                        {showDateFilterMenu && (
                          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-slide-up ">
                            <button
                              onClick={() => {
                                setDateFilter("all");
                                setShowDateFilterMenu(false);
                                setShowDatePicker(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                dateFilter === "all" 
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <MdCalendarToday size={18} />
                              <span>All Time</span>
                              {dateFilter === "all" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                            </button>
                            <button
                              onClick={() => {
                                setDateFilter("today");
                                setShowDateFilterMenu(false);
                                setShowDatePicker(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                dateFilter === "today" 
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <MdCalendarToday size={18} />
                              <span>Today</span>
                              {dateFilter === "today" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                            </button>
                            <button
                              onClick={() => {
                                setDateFilter("week");
                                setShowDateFilterMenu(false);
                                setShowDatePicker(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                dateFilter === "week" 
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <MdCalendarToday size={18} />
                              <span>This Week</span>
                              {dateFilter === "week" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                            </button>
                            <button
                              onClick={() => {
                                setDateFilter("month");
                                setShowDateFilterMenu(false);
                                setShowDatePicker(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                dateFilter === "month" 
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <MdCalendarToday size={18} />
                              <span>This Month</span>
                              {dateFilter === "month" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                            </button>
                            
                            <div className="border-t border-gray-200"></div>
                            
                            {/* Select Date Button - Opens Modal */}
                            <button
                              onClick={() => {
                                setShowDatePicker(true);
                                setShowDateFilterMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                dateFilter === "custom" 
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <MdCalendarToday size={18} />
                              <span>Select Date</span>
                              {dateFilter === "custom" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Filter Buttons */}
                    <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide">
                    <button 
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      selectedFilter === "all" 
                        ? "bg-gray-200 text-gray-900 border-2 border-blue-500 shadow-sm" 
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95"
                      }`}
                      onClick={() => setSelectedFilter("all")}
                    >
                      <span className="inline-flex items-center">
                        <span>All</span>
                        <span className="ml-2 inline-flex items-center justify-center bg-white text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full">{announcements.length}</span>
                      </span>
                    </button>
                    <button 
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      selectedFilter === "unread" 
                        ? "bg-gray-200 text-gray-900 border-2 border-blue-500 shadow-sm" 
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95"
                      }`}
                      onClick={() => setSelectedFilter("unread")}
                    >
                      <span className="inline-flex items-center">
                        <span>Unread</span>
                        <span className="ml-2 inline-flex items-center justify-center bg-white text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full">{announcements.filter(a => a.unread).length}</span>
                      </span>
                    </button>
                    <button 
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      selectedFilter === "important" 
                        ? "bg-gray-200 text-gray-900 border-2 border-blue-500 shadow-sm" 
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95"
                      }`}
                      onClick={() => setSelectedFilter("important")}
                    >
                      <span className="inline-flex items-center">
                        <span>Important</span>
                        <span className="ml-2 inline-flex items-center justify-center bg-white text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full">{announcements.filter(a => a.important).length}</span>
                      </span>
                    </button>
                    <button 
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      selectedFilter === "pinned" 
                        ? "bg-gray-200 text-gray-900 border-2 border-blue-500 shadow-sm" 
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95"
                      }`}
                      onClick={() => setSelectedFilter("pinned")}
                    >
                      <span className="inline-flex items-center">
                        <span>Pinned</span>
                        <span className="ml-2 inline-flex items-center justify-center bg-white text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full">{announcements.filter(a => a.is_pinned).length}</span>
                      </span>
                    </button>
                    </div>
                  </div>
                  
                  {/* Section Header with Action Button */}
                  <div className="mb-6 sticky top-20 bg-gray-100 -mx-5 px-5 py-4 z-10">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
                        <div className="w-1.5 h-9 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                        Announcements
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                        <MdCalendarToday size={18} className="text-blue-500 mr-1" />
                        <span className="font-semibold text-gray-700">
                          {dateFilter === "all" && new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {dateFilter === "today" && "Today"}
                          {dateFilter === "week" && "This Week"}
                          {dateFilter === "month" && "This Month"}
                          {dateFilter === "custom" && "Custom Range"}
                        </span>
                      </div>
                    </div>
                      <div>
                      {!isLoading && announcements.filter(a => a.unread).length > 0 && (
                        <button 
                          className="px-4 py-2 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2 shadow-sm"
                          onClick={markAllAsRead}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date Picker Modal - Always shows at top */}
                  {showDatePicker && (
                    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20" onClick={() => setShowDatePicker(false)}>
                      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-800">Select Date Range</h3>
                          <button onClick={() => setShowDatePicker(false)} className="p-1 hover:bg-gray-100 rounded-full">
                            <IoMdClose size={24} className="text-gray-600" />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="from-date" className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                            <input
                              id="from-date"
                              type="date"
                              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                            />
                          </div>
                          <div>
                            <label htmlFor="to-date" className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                            <input
                              id="to-date"
                              type="date"
                              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                            />
                          </div>
                          
                          <button
                            onClick={() => {
                              if (customDateRange.start && customDateRange.end) {
                                setDateFilter("custom");
                                setShowDateFilterMenu(false);
                                setShowDatePicker(false);
                              }
                            }}
                            disabled={!customDateRange.start || !customDateRange.end}
                            className={`w-full py-3 font-semibold rounded-xl transition-all ${
                              customDateRange.start && customDateRange.end
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            Apply Filter
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Announcements List */}
            <div className="mb-8">
              {isLoadingAnnouncements ? (
                <>
                  <ShimmerCard />
                  <ShimmerCard />
                  <ShimmerCard />
                  <ShimmerCard />
                </>
              ) : filteredAnnouncements.length > 0 ? (
                filteredAnnouncements.map(renderAnnouncementCard)
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-10 text-center shadow-sm border border-gray-200">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiBell size={32} className="text-blue-400" />
                  </div>
                  <h3 className="text-gray-700 font-semibold text-lg mb-2">No announcements found</h3>
                  <p className="text-gray-500 text-sm mb-4 max-w-xs mx-auto">Try adjusting your search terms or date filters to see more results</p>
                  {(searchQuery || dateFilter !== 'all') && (
                    <button 
                      onClick={() => { setSearchQuery(''); setDateFilter('all'); }}
                      className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );

       case "My Location":
        return (
          <div className="fixed inset-0 w-full h-screen overflow-hidden" style={{ overscrollBehavior: 'contain', touchAction: 'none' }}>
            {/* MAP */}
            <div className="absolute inset-0 overflow-hidden">
              <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)} 
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
              >
                {/* Other Users' Location Markers with Profile Images */}
                {otherUsersLocations.map((location) => (
                  <Marker
                    key={`user-${location.user_id}`}
                    longitude={location.longitude}
                    latitude={location.latitude}
                    anchor="center"
                  >
                    <div className="relative">
                      {location.profile_image ? (
                        <img
                          src={location.profile_image}
                          alt={location.email}
                          className="w-11 h-11 rounded-full border-3 border-white shadow-md object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                          title={location.email}
                        />
                      ) : (
                        <div className="w-11 h-11 bg-gray-400 rounded-full border-3 border-white shadow-md flex items-center justify-center" title={location.email}>
                          <span className="text-white font-bold text-sm">
                            {location.email?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                  </Marker>
                ))}

                {/* User Location Marker with Profile Image */}
                {userCoordinates.latitude && userCoordinates.longitude && (
                  <Marker 
                    longitude={userCoordinates.longitude} 
                    latitude={userCoordinates.latitude}
                    anchor="center"
                  >
                    <div className="relative flex flex-col items-center justify-center">
                      {/* Radar pulse effect */}
                      <div className="absolute w-14 h-14 rounded-full" style={{
                        animation: 'radar-pulse 2s ease-out infinite'
                      }}></div>

                      {getCurrentUserProfileImage() ? (
                        <div className="relative z-10">
                          <img 
                            src={getCurrentUserProfileImage()}
                            alt="Your location"
                            className="w-14 h-14 rounded-full border-4 border-white shadow-lg object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative z-10">
                          <div className="w-14 h-14 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {user?.email?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Marker>
                )}
              </Map>

              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/20 to-transparent pt-4 px-4 z-20">
                <div className="flex items-center justify-between relative gap-3 mb-2">
                  <button
                    className="bg-white text-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow flex-shrink-0"
                    onClick={() => handleTabChange("Home")}
                  >
                    <IoMdArrowBack size={24} />
                  </button>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow flex-1">
                    <div className="text-sm text-gray-500">Current Location</div>
                    <div className="font-bold text-gray-800">{currentLocation}</div>
                  </div>
                  
                  <button
                    onClick={refreshLocation}
                    disabled={isRefreshingLocation}
                    className={`p-3 rounded-full shadow-lg flex-shrink-0 ${isRefreshingLocation ? 'bg-white text-gray-400' : 'bg-white text-blue-500 hover:bg-blue-50'} transition-all`}
                    title="Refresh location"
                  >
                    <FiRefreshCw size={24} className={isRefreshingLocation ? 'animate-spin' : ''} />
                  </button>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (userCoordinates.latitude && userCoordinates.longitude) {
                        const lng = userCoordinates.longitude;
                        const lat = userCoordinates.latitude;
                        const zoom = 15;

                        // If mapRef is available, compute a pixel offset so marker appears at 75% from top
                        if (mapRef && mapRef.current && typeof mapRef.current.getMap === 'function') {
                          try {
                            const mapObj = mapRef.current.getMap();
                            const canvas = mapObj.getCanvas();
                            const height = (canvas && canvas.clientHeight) ? canvas.clientHeight : window.innerHeight;

                            const point = mapObj.project([lng, lat]);

                            // If there is a bottom sheet overlay, compute its height and center the marker
                            // within the visible map area above the sheet so the profile image sits in the middle.
                            const bottomSheet = document.querySelector('.absolute.bottom-0');
                            let targetY;
                            if (bottomSheet && bottomSheet.clientHeight) {
                              const bsHeight = bottomSheet.clientHeight;
                              const bsTop = height - bsHeight; // y coordinate of top of bottom sheet in pixels
                              // center the marker vertically in the visible area (0 .. bsTop)
                              // but bias slightly upward so the marker sits higher than exact center
                              // (40% down from top of visible area instead of 50%)
                              targetY = Math.round(bsTop * 0.4);
                            } else {
                              // Default: move up by 25% of viewport height
                              targetY = point.y - height * 0.25;
                            }

                            const center = mapObj.unproject([point.x, targetY]);

                            setViewState(prev => ({
                              ...prev,
                              longitude: center.lng,
                              latitude: center.lat,
                              zoom,
                              transitionDuration: 800
                            }));
                            return;
                          } catch (e) {
                            // Fallback to simple center if projection fails
                            console.error('Map offset error:', e);
                          }
                        }

                        // Fallback: center the map normally
                        setViewState(prev => ({
                          ...prev,
                          longitude: lng,
                          latitude: lat,
                          zoom,
                          transitionDuration: 800
                        }));
                      }
                    }}
                    className="px-4 py-2 rounded-full bg-white text-blue-500 hover:bg-blue-50 shadow-lg transition-all flex items-center gap-1.5"
                    title="Go to my location"
                  >
                    <MdMyLocation size={20} />
                    <span className="text-xs font-medium text-gray-700">Go to me</span>
                  </button>
                </div>
              </div>

              {/* Location History - Bottom Sheet with Isolated Scroll */}
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl h-1/2 flex flex-col z-30" style={{ touchAction: 'none', overscrollBehavior: 'contain' }}>
                {/* Drag Handle - More Prominent and Interactive */}
                <div className="pt-3 pb-2 flex-shrink-0 pointer-events-auto cursor-grab active:cursor-grabbing">
                  <div className="w-12 h-1.5 bg-gray-400 rounded-full mx-auto transition-all hover:bg-gray-500 hover:w-16"></div>
                </div>
                  <div className="px-5 pb-0 flex-shrink-0 pointer-events-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Recent Locations</h3>
                    <button className="text-blue-500 text-sm font-medium">View All</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-5 pointer-events-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                  {locationHistory && locationHistory.length > 0 ? (
                    locationHistory.map(renderLocationHistory)
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MdLocationOn size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-600">No recent locations</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "My Project":
        const totalProjects = projects.length;
        const ongoingProjects = projects.filter(p => p.status === "ongoing").length;
        const completedProjects = projects.filter(p => p.status === "completed").length;
        const pendingProjects = projects.filter(p => p.status === "pending").length;
        
        return (
          <div className="p-4 pb-24">
            {/* Stats Cards - More Compact Mobile Layout */}
            {isLoadingProjects ? (
              <div className="bg-gradient-to-br from-gray-300 to-gray-200 rounded-2xl p-5 mb-6 shadow-lg animate-pulse h-40"></div>
            ) : (
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MdDashboard size={24} />
              My Tasks Overview
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold leading-none mb-1">{totalProjects}</div>
                <div className="text-xs opacity-90 font-medium">Total</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold leading-none mb-1">{ongoingProjects}</div>
                <div className="text-xs opacity-90 font-medium">Ongoing</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold leading-none mb-1">{completedProjects}</div>
                <div className="text-xs opacity-90 font-medium">Done</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold leading-none mb-1">{pendingProjects}</div>
                <div className="text-xs opacity-90 font-medium">Pending</div>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Filter Buttons (admin-style) */}
            {(() => {
              const statusLabels = { all: 'All', pending: 'Pending', ongoing: 'Ongoing', scheduled: 'Scheduled', completed: 'Completed' };
              const statusCounts = {
                all: projects.length,
                pending: projects.filter(p => p.status === 'pending').length,
                ongoing: projects.filter(p => p.status === 'ongoing').length,
                scheduled: projects.filter(p => p.status === 'scheduled').length,
                completed: projects.filter(p => p.status === 'completed').length,
              };

              return (
                <div className="mb-6 pb-2 overflow-x-auto snap-x snap-mandatory -mx-4 px-4">
                  <div className="flex items-center space-x-3" ref={filterButtonsRef} role="tablist" aria-label="Project filters">
                    {Object.keys(statusLabels).map(status => (
                      <div key={status} className="snap-start flex-shrink-0">
                        <button
                          onClick={() => setProjectFilter(status)}
                          role="tab"
                          aria-pressed={projectFilter === status}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProjectFilter(status); return; }
                            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                              e.preventDefault();
                              const keysArr = Object.keys(statusLabels);
                              const idx = keysArr.indexOf(status);
                              const nextIdx = e.key === 'ArrowRight' ? Math.min(keysArr.length-1, idx+1) : Math.max(0, idx-1);
                              const btn = filterButtonsRef.current?.querySelectorAll('button')[nextIdx];
                              btn?.focus();
                            }
                          }}
                          className={`px-2 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${projectFilter === status ? 'text-blue-600' : 'text-gray-600'}`}
                        >
                          <div className="flex items-baseline gap-2">
                            <span>{statusLabels[status]}</span>
                            <span className="text-xs text-gray-400">{statusCounts[status] ?? 0}</span>
                          </div>
                        </button>
                        <div className="h-0.5 mt-2">
                          <div className={`mx-auto transition-all duration-300 ${projectFilter === status ? 'bg-blue-600 w-16 rounded-full h-0.5' : 'w-0'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Projects List */}
            <div className="mb-6">
              {isLoadingProjects ? (
                <div className="space-y-4">
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProjects.map(renderProjectCard)}
                </div>
              ) : selectedFilter !== "all" ? (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 text-center shadow-sm border border-gray-200">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MdDashboard size={32} className="text-blue-400" />
                  </div>
                  <p className="text-gray-700 font-semibold text-lg mb-2">No {selectedFilter} tasks found</p>
                  <p className="text-sm text-gray-500 mb-4">Try selecting a different filter to see your tasks</p>
                  <button 
                    onClick={() => setSelectedFilter('all')}
                    className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
                  >
                    Show all tasks
                  </button>
                </div>
              ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 text-center shadow-sm border border-gray-200">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdDashboard size={40} className="text-blue-400" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">No Tasks Assigned Yet</p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">Tasks will appear here when your manager assigns them to you. Check back soon!</p>
          <div className="mt-6 flex justify-center">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              Awaiting assignments
            </div>
          </div>
              </div>
            )}
            </div>
          </div>
        );

      case "Profile":
        return renderProfile();
      default:
        return null;
    }
  };

  const ActionMenu = () => (
    <div className="fixed inset-0 z-30 flex justify-center items-end">
      {/* Backdrop - Click outside to close */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => setShowActionMenu(false)}
      />
      
      {/* Bottom Sheet */}
      <div 
        ref={actionMenuRef}
        className="relative bg-white rounded-t-3xl p-6 w-full max-h-[65%] overflow-auto animate-slide-up z-40"
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
        
        {/* Header with better typography */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-1">Quick Actions</h3>
          <p className="text-sm text-gray-500 text-center">Choose an action to continue</p>
        </div>
        
        {/* Grid Layout - 2 columns */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Submit Report Card */}
          <button
            disabled
            className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-sm opacity-60 cursor-not-allowed border border-blue-200 min-h-[140px]"
          >
            <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center mb-3 shadow-md">
              <MdReportProblem size={24} className="text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-800 mb-1 text-sm">Submit Report</div>
              <div className="text-xs text-gray-600">Coming soon</div>
            </div>
          </button>

          {/* Add Project Card */}
          <button
            disabled
            className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-sm opacity-60 cursor-not-allowed border border-purple-200 min-h-[140px]"
          >
            <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center mb-3 shadow-md">
              <MdDashboard size={24} className="text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-800 mb-1 text-sm">Add Project</div>
              <div className="text-xs text-gray-600">Coming soon</div>
            </div>
          </button>

          {/* View Analytics Card */}
          <button
            disabled
            className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-sm opacity-60 cursor-not-allowed border border-green-200 min-h-[140px]"
          >
            <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mb-3 shadow-md">
              <MdBarChart size={24} className="text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-800 mb-1 text-sm">Analytics</div>
              <div className="text-xs text-gray-600">Coming soon</div>
            </div>
          </button>

          {/* Team Chat Card */}
          <button
            disabled
            className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-sm opacity-60 cursor-not-allowed border border-orange-200 min-h-[140px]"
          >
            <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center mb-3 shadow-md">
              <MdChat size={24} className="text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-800 mb-1 text-sm">Team Chat</div>
              <div className="text-xs text-gray-600">Coming soon</div>
            </div>
          </button>
        </div>
        
        {/* Close Button */}
        <button
          onClick={() => setShowActionMenu(false)}
          className="w-full mt-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  // Progress Update Modal
  const renderProgressUpdateModal = () => (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Update Progress</h3>
          <button 
            onClick={() => {
              setShowProgressModal(false);
              setCapturedPhoto(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Task Title */}
          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">Task</p>
            <p className="text-base font-semibold text-gray-900">{selectedTaskForProgress?.title}</p>
          </div>

          {/* Progress Percentage */}
          <div>
            <label htmlFor="progress-range" className="block text-sm font-medium text-gray-700 mb-3">
              Progress: <span className="text-blue-600 font-bold">{progressPercentage}%</span>
            </label>
            <input 
              id="progress-range"
              type="range" 
              min="0" 
              max="100" 
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercentage}%, #e5e7eb ${progressPercentage}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label htmlFor="progress-status" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              id="progress-status"
              value={progressStatus}
              onChange={(e) => setProgressStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="progress-notes" className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea 
              id="progress-notes"
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              placeholder="Add any notes about this progress update..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows="3"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button 
            onClick={() => {
              setShowProgressModal(false);
              setShowPhotoModal(true);  
              setIsCapturingLocation(true);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <MdCamera size={18} className="mr-2" />
            Confirm & Take Photo
          </button>
        </div>
      </div>
    </div>
  );

  // Helper functions for photo modal (at top level)
  const startCameraForModal = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);

      // Wait briefly for video element to mount
      for (let i = 0; i < 10; i++) {
        if (cameraVideoRef.current) break;
        await new Promise(r => setTimeout(r, 50));
      }

      if (cameraVideoRef.current) {
        try {
          cameraVideoRef.current.srcObject = stream;
          await cameraVideoRef.current.play();
        } catch (e) {
          console.debug('Camera play failed:', e);
        }
      }
      return stream;
    } catch (error) {
      console.error('Camera error:', error);
      setLocationValidationMsg("❌ Unable to access camera");
      throw error;
    }
  };

  const takePhotoForModal = () => {
    if (cameraCanvasRef.current && cameraVideoRef.current) {
      const context = cameraCanvasRef.current.getContext('2d');
      cameraCanvasRef.current.width = cameraVideoRef.current.videoWidth;
      cameraCanvasRef.current.height = cameraVideoRef.current.videoHeight;
      context.drawImage(cameraVideoRef.current, 0, 0);
      const photoData = cameraCanvasRef.current.toDataURL('image/jpeg', 0.95);
      setCapturedPhoto(photoData);
    }
  };

  const submitProgressUpdate = async () => {
    if (!capturedPhoto || !taskLocation) {
      setToast({ show: true, message: 'Please capture photo and location before submitting', type: 'error' });
      return;
    }

    try {
      // Get location name from coordinates
      let locationName = null;
      try {
        const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        const geoResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${taskLocation.longitude},${taskLocation.latitude}.json?access_token=${accessToken}&types=address,poi,place,locality,neighborhood`
        );
        const geoData = await geoResponse.json();
        if (geoData.features && geoData.features.length > 0) {
          locationName = geoData.features[0].place_name;
        }
      } catch (geoError) {
        console.error('Error fetching location name:', geoError);
      }

      const response = await fetch('/backend/project_progress.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'update_progress',
          project_id: selectedTaskForProgress.id,
          progress_percentage: progressPercentage,
          status: progressStatus,
          notes: progressNotes,
          evidence_photo: capturedPhoto,
          location_latitude: taskLocation.latitude,
          location_longitude: taskLocation.longitude,
          location_accuracy: taskLocation.accuracy,
          location_name: locationName || ''
        }).toString()
      });

      const data = await response.json();
      if (data.status === 'success') {
        setToast({ show: true, message: 'Progress update submitted successfully!', type: 'success' });
        setShowPhotoModal(false);
        setCapturedPhoto(null);
        setTaskLocation(null);
        setProgressPercentage(0);
        setProgressStatus("In Progress");
        setProgressNotes("");
        setSelectedTaskForProgress(null);
        setLocationValidationMsg("");
        // Stop camera
        if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
          cameraVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
      } else {
        setToast({ show: true, message: data.message || 'Failed to submit progress', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting progress:', error);
      setToast({ show: true, message: 'Error submitting progress: ' + error.message, type: 'error' });
    }
  };

  // Start camera when modal opens
  useEffect(() => {
    if (showPhotoModal && !capturedPhoto) {
      startCameraForModal();
    }
    return () => {
      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
        cameraVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [showPhotoModal, capturedPhoto]);

  // Capture location when modal opens
  useEffect(() => {
    if (showPhotoModal && isCapturingLocation) {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        setLocationValidationMsg("❌ Geolocation not supported on this device");
        setIsCapturingLocation(false);
        return;
      }

      setLocationValidationMsg("📍 Requesting location...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTaskLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLocationValidationMsg("✅ Location captured successfully");
          setIsCapturingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMsg = "⚠️ Unable to get location. ";
          
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg += "Permission denied. Enable location in settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg += "Position unavailable.";
          } else if (error.code === error.TIMEOUT) {
            errorMsg += "Location request timed out.";
          } else {
            errorMsg += "Please check location settings and try again.";
          }
          
          setLocationValidationMsg(errorMsg);
          setIsCapturingLocation(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 30000,
          maximumAge: 0
        }
      );
    }
  }, [showPhotoModal, isCapturingLocation]);

  // Photo Evidence Modal - Pure render function
  const renderPhotoEvidenceModal = () => {
    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Photo Evidence</h3>
            <button 
              onClick={() => {
                setShowPhotoModal(false);
                setCapturedPhoto(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-4">
            {/* Location Status */}
            <div className={`p-3 rounded-lg text-sm flex items-center justify-between ${
              locationValidationMsg.includes("✅") ? 'bg-green-50 text-green-700' : 
              locationValidationMsg.includes("❌") || locationValidationMsg.includes("⚠️") ? 'bg-red-50 text-red-700' :
              'bg-yellow-50 text-yellow-700'
            }`}>
              <div className="flex items-center flex-1">
                {isCapturingLocation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2"></div>
                    <span>Capturing location...</span>
                  </>
                ) : (
                  <span>{locationValidationMsg || "Initializing GPS..."}</span>
                )}
              </div>
              {(locationValidationMsg.includes("❌") || locationValidationMsg.includes("⚠️")) && !isCapturingLocation && (
                <button
                  onClick={() => setIsCapturingLocation(true)}
                  className="ml-2 px-3 py-1 text-xs font-semibold bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors shadow-sm"
                >
                  Try Again
                </button>
              )}
            </div>

            {/* Camera Preview or Photo */}
            <div className="bg-black rounded-lg overflow-hidden aspect-square relative">
              {!capturedPhoto ? (
                <>
                  <video 
                    ref={cameraVideoRef}
                    autoPlay 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={cameraCanvasRef} style={{ display: 'none' }} />
                </>
              ) : (
                <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
              )}
            </div>

            {/* Progress Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Progress</p>
                  <p className="font-bold text-gray-900">{progressPercentage}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-bold text-gray-900">{progressStatus}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
            {!capturedPhoto ? (
              <>
                <button 
                  onClick={() => {
                    setShowPhotoModal(false);
                    setCapturedPhoto(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={takePhotoForModal}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <MdCamera size={18} className="mr-2" />
                  Capture
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setCapturedPhoto(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Retake
                </button>
                <button 
                  onClick={submitProgressUpdate}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <MdCheck size={18} className="mr-2" />
                  Submit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Notifications logic and layout copied from admin-dashboard ---
  const unreadAnnouncements = announcements.filter(a => a.unread);
  const unreadCount = unreadAnnouncements.length;
  const currentUserId =
    user?.id ||
    user?.user_id ||
    user?.login_id ||
    user?.userId ||
    user?.loginId;

  const isUserAssignedToProject = (project) => {
    const assigned = project?.assignedUsers || [];
    if (!assigned || assigned.length === 0) return true;
    if (!currentUserId) return false;
    return assigned.map(String).includes(String(currentUserId));
  };

  const newTaskNotifications = projects.filter(
    (project) => project.isNew && isUserAssignedToProject(project)
  );

  // Use useMemo with timestampTicker to recalculate notification items when time updates
  const notificationItems = React.useMemo(() => {
    return [
      ...announcements.map((announcement) => ({
        key: `announcement-${announcement.id}`,
        type: "announcement",
        title: announcement.title,
        description: announcement.content,
        date: announcement.created_at_ts ? announcement.created_at_ts * 1000 : (announcement.created_at || new Date().toISOString()),
        timestamp: announcement.created_at_ts
          ? announcement.created_at_ts * 1000
          : new Date(announcement.created_at || Date.now()).getTime(),
        icon: announcement.icon,
        color: announcement.color,
        priority: announcement.priority,
        author: announcement.author,
        category: announcement.category,
        content: announcement.content,
        unread: announcement.unread,
      })),
      ...newTaskNotifications.map((project) => ({
        key: `task-${project.id}`,
        type: "task",
        title: project.title,
        description: project.description,
        date: getProjectCreatedAtValue(project) || new Date().toISOString(),
        timestamp: new Date(getProjectCreatedAtValue(project) || Date.now()).getTime(),
      })),
    ].sort((a, b) => b.timestamp - a.timestamp);
  }, [announcements, newTaskNotifications, timestampTicker]); // Recalculate when timestampTicker updates

  // Notification badge should show count of unread announcements (via announcementBadgeCount) + task completion notifications
  // announcementBadgeCount tracks new announcements that arrived, taskCompletionBadgeCount tracks completed tasks
  const notificationBadgeCount = announcementBadgeCount + taskCompletionBadgeCount;

  const [selectedNotification, setSelectedNotification] = useState(null);

  const handleNotificationClick = async (item) => {
    try {
      triggerHaptic('light');
      if (!item || !item.key) return;
      if (item.key.startsWith('task-')) {
        const id = item.key.split('task-')[1];
        const project = projects.find(p => String(p.id) === String(id));
        if (project) {
          setSelectedProject(project);
          pushScreen('projectDetails', { project });
        }
      } else if (item.key.startsWith('announcement-')) {
        const id = item.key.split('announcement-')[1];
        try { await markAsRead(id); } catch (err) {}
        setSelectedNotification(item);
        pushScreen('announcementDetail');
      }
    } catch (err) {
      console.error('Notification click error', err);
    }
  };

  return (
    <div className={`min-h-screen ${activeTab === "My Location" ? "overflow-hidden" : "pb-20"} bg-gray-100 relative ${!isOnline ? 'pt-10' : ''}`}> 
      {/* Notifications - Stack Navigation */}
      {getCurrentScreen()?.screen === "notifications" && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-in-right">
          <div className="sticky top-0 z-20 bg-white text-gray-900 px-4 sm:px-5 py-4 border-b border-gray-200 flex items-center">
            <button
              onClick={popScreen}
              onTouchStart={() => triggerHaptic('light')}
              className="p-3 rounded-full min-w-[44px] min-h-[44px] hover:bg-gray-100 mr-3 transition-colors"
            >
              <IoMdArrowBack size={24} className="text-gray-700" />
            </button>
            <h3 className="flex-1 text-xl font-bold">Notifications</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold">Recent Notifications</h4>
              <button onClick={markAllAsRead} onTouchStart={() => triggerHaptic('light')} className="text-sm text-blue-600">Mark all</button>
            </div>

            <div className="space-y-3">
              {notificationItems && notificationItems.length > 0 ? (
                notificationItems.map(item => (
                  <div key={item.key} onClick={() => handleNotificationClick(item)} onTouchStart={() => triggerHaptic('light')} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex items-start gap-4 cursor-pointer hover:shadow-xl transition-all">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 shadow-md mr-2 bg-white ${
                      item.type === 'task'
                        ? 'border-blue-400 text-blue-500'
                        : item.color === 'red'
                        ? 'border-red-400 text-red-500'
                        : item.color === 'green'
                        ? 'border-green-400 text-green-500'
                        : item.color === 'purple'
                        ? 'border-purple-400 text-purple-500'
                        : item.color === 'yellow'
                        ? 'border-yellow-400 text-yellow-500'
                        : 'border-blue-400 text-blue-500'
                    }`}>
                      {item.type === 'task' ? (
                        <MdDashboard size={22} style={{ color: 'inherit' }} />
                      ) : item.icon && React.isValidElement(item.icon) ? (
                        React.cloneElement(item.icon, { size: 24, style: { color: 'inherit', display: 'block' } })
                      ) : (
                        <IoMdMegaphone size={22} style={{ color: 'inherit' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className={`text-gray-800 truncate text-base ${item.unread ? 'font-semibold' : 'font-normal'}`}>{item.title}</h4>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatTimeAgo(item.date)}</span>
                      </div>
                      <p className="text-sm text-gray-700 truncate font-normal">{item.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 text-center shadow border border-gray-200">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiBell size={28} className="text-blue-400" />
                  </div>
                  <h3 className="text-gray-700 font-semibold text-lg mb-1">No new notifications</h3>
                  <p className="text-gray-500 text-sm">New tasks and announcements will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Announcement Detail - Stack Navigation */}
      {getCurrentScreen()?.screen === "announcementDetail" && selectedNotification && (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col animate-slide-in-right">
          <div className="sticky top-0 z-20 bg-white text-gray-900 px-4 sm:px-5 py-4 border-b border-gray-200 flex items-center">
            <button
              onClick={popScreen}
              onTouchStart={() => triggerHaptic('light')}
              className="p-3 rounded-full min-w-[44px] min-h-[44px] hover:bg-gray-100 mr-3 transition-colors"
            >
              <IoMdArrowBack size={24} className="text-gray-700" />
            </button>
            <h3 className="flex-1 text-xl font-bold">Announcement</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-md bg-white ${
                  selectedNotification.color === 'red'
                    ? 'border-red-400 text-red-500'
                    : selectedNotification.color === 'green'
                    ? 'border-green-400 text-green-500'
                    : selectedNotification.color === 'purple'
                    ? 'border-purple-400 text-purple-500'
                    : selectedNotification.color === 'yellow'
                    ? 'border-yellow-400 text-yellow-500'
                    : 'border-blue-400 text-blue-500'
                }`}>
                  {selectedNotification.icon && React.isValidElement(selectedNotification.icon)
                    ? React.cloneElement(selectedNotification.icon, { size: 32, style: { color: 'inherit', display: 'block' } })
                    : <IoMdMegaphone size={32} style={{ color: 'inherit' }} />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedNotification.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{selectedNotification.category}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(selectedNotification.date)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-gray-800 text-base whitespace-pre-line mb-6">
                {selectedNotification.description}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Priority:</span>
                <span className={`font-semibold ${
                  selectedNotification.priority === 'high' ? 'text-red-500' :
                  selectedNotification.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {selectedNotification.priority ? selectedNotification.priority.charAt(0).toUpperCase() + selectedNotification.priority.slice(1) : 'Normal'}
                </span>
                <span>•</span>
                <span>By: {selectedNotification.author}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Offline Mode Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center text-sm font-medium z-[100] flex items-center justify-center gap-2 shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          No internet connection - Working in offline mode
        </div>
      )}
      
      {/* Pull to Refresh Indicator */}
      {isPulling && pullDistance > 0 && (
        <div 
          className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all"
          style={{ 
            transform: `translate(-50%, ${Math.min(pullDistance - 40, 40)}px)`,
            opacity: Math.min(pullDistance / pullThreshold, 1)
          }}
        >
          <div className={`bg-white rounded-full p-3 shadow-lg ${
            pullDistance >= pullThreshold ? 'bg-blue-500' : 'bg-white'
          }`}>
            <FiRefreshCw 
              size={24} 
              className={`${
                pullDistance >= pullThreshold 
                  ? 'text-white animate-spin' 
                  : 'text-blue-500'
              }`}
              style={{ transform: `rotate(${(pullDistance / pullThreshold) * 360}deg)` }}
            />
          </div>
        </div>
      )}

      {/* Main Header (match admin style) */}
      {activeTab !== "My Location" && (
        <div className="sticky top-0 z-20 px-4 py-3 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <img
              src="/img/stelsenlogo.png"
              alt="Logo"
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
            <h2 className="text-lg font-semibold text-white">STELSEN</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNotificationsClick}
              aria-label="Notifications"
              className="relative w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <IoMdNotifications size={22} className="text-white" />
              {(notificationBadgeCount > 0) && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-blue-700">
                  {notificationBadgeCount > 99 ? '99+' : notificationBadgeCount}
                </span>
              )}
            </button>
            <button onClick={handleProfileClick} className="w-10 h-10 rounded-full bg-white relative overflow-visible">
              <Avatar
                userObj={{
                  ...user,
                  uploaded_profile_image: selectedFile || user?.uploaded_profile_image,
                  profile_image: selectedFile || user?.uploaded_profile_image || user?.profile_image,
                }}
                size={40}
              />
              {isOnline && (
                <span style={{ transform: 'translate(20%, 20%)' }} className="absolute right-0 bottom-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div 
        className={`transition-all duration-300 ${(profileOpen || showActionMenu) && isMobile ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        onTouchStart={handlePullStart}
        onTouchMove={handlePullMove}
        onTouchEnd={handlePullEnd}
      >
        <div className={activeTab === "My Location" ? "overflow-hidden" : "overflow-auto"}>
          {renderTabContent()}
        </div>
      </div>

      {/* Bottom Navbar */}
      {activeTab !== "My Location" && (
        <div className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 flex items-center justify-around py-2 z-10 transition-all duration-300 ${(profileOpen || showActionMenu) ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
          {/* Home Button */}
          <button
            className={`flex flex-col items-center relative min-w-[44px] min-h-[44px] justify-center ${activeTab === "Home" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("Home")}
            onTouchStart={() => triggerHaptic('light')}
          >
            <IoMdHome size={24} />
            <span className="text-xs mt-1">Home</span>
          </button>

          {/* My Project Button */}
          <button
            className={`flex flex-col items-center relative min-w-[44px] min-h-[44px] justify-center ${activeTab === "My Project" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("My Project")}
            onTouchStart={() => triggerHaptic('light')}
          >
            <MdDashboard size={24} />
            <span className="text-xs mt-1">Projects</span>
          </button>

          {/* My Location Button */}
          <button
            className={`flex flex-col items-center relative min-w-[44px] min-h-[44px] justify-center ${activeTab === "My Location" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("My Location")}
            onTouchStart={() => triggerHaptic('light')}
          >
            <MdLocationOn size={24} />
            <span className="text-xs mt-1">Location</span>
          </button>

          {/* Profile Button */}
          <button
            className={`flex flex-col items-center relative min-w-[44px] min-h-[44px] justify-center ${activeTab === "Profile" ? "text-blue-500" : "text-gray-500"}`}
            onClick={handleProfileClick}
            onTouchStart={() => triggerHaptic('light')}
          >
            <FaUser size={24} />
            <span className="text-xs mt-1">Profile</span>
          </button> 
        </div>
      )}

      {/* Action Menu Modal */}
      {showActionMenu && <ActionMenu />}

      {/* Profile Sidebar/Drawer - Full Width */}
      {profileOpen && isMobile && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-30 flex flex-col">
          {renderProfile()}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Edit Profile</h3>
              <button
                onClick={closeEditProfileModal}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <IoMdClose size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Department Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department *
                </label>
                <input
                  type="text"
                  value={editFormData.department}
                  onChange={(e) => handleEditFormChange('department', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your department"
                />
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => handleEditFormChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Email (cannot be changed)
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              
              <button
                onClick={saveProfileChanges}
                disabled={isSavingProfile || !editFormData.name || !editFormData.department}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <FiLoader className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Update Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-end z-40">
          <div className="bg-white rounded-t-3xl p-5 w-full max-h-[80%] overflow-auto">
            <div className="flex justify-between items-center mb-5">
              <span className="text-xl font-bold">Update Location</span>
              <button onClick={() => setShowLocationModal(false)}>Close</button>
            </div>
            {["Office", "Site A", "Site B", "Client Meeting", "On The Way", "Break"].map(location => (
              <button
                key={location}
                className="flex justify-between items-center w-full py-4 border-b border-gray-100"
                onClick={() => updateLocation(location)}
              >
                <MdLocationOn size={20} className="text-blue-500" />
                <span>{location}</span>
                <FiChevronRight size={20} className="text-gray-500" />
              </button>
            ))}
            <button
              className="flex items-center py-4 mt-3"
              onClick={() => alert("Add custom location")}
            >
              <FiPlus size={20} className="text-blue-500" />
              <span className="ml-2 text-blue-500">Add Custom Location</span>
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-end z-40">
          <div className="bg-white rounded-t-3xl p-5 w-full max-h-[70%] overflow-auto">
            <div className="flex justify-between items-center mb-5">
              <span className="text-xl font-bold">Submit Daily Report</span>
              <button onClick={() => setShowReportModal(false)}>Close</button>
            </div>
            <textarea
              className="w-full p-4 border border-gray-300 rounded-lg mb-5"
              rows={6}
              placeholder="Describe your work, progress, or any issues..."
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
            />
            <button
              className={`w-full py-4 rounded-lg ${reportMessage.trim() ? "bg-blue-500 text-white" : "bg-gray-400 text-gray-700"}`}
              disabled={!reportMessage.trim()}
              onClick={submitReport}
            >
              Submit Report
            </button>
          </div>
        </div>
      )}

      {/* Task Details - Stack Navigation */}
      {getCurrentScreen()?.screen === "projectDetails" && renderProjectDetailsModal()}

      {/* Task Progress - Stack Navigation */}
      {getCurrentScreen()?.screen === "taskProgress" && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-4 border-b border-blue-600 flex items-center">
            <button 
              onClick={popScreen}
              className="p-3 rounded-full min-w-[44px] min-h-[44px] hover:bg-white/10 mr-3 transition-colors"
            >
              <IoMdArrowBack size={24} className="text-white" />
            </button>
            <h3 className="flex-1 text-lg font-bold text-white">Task Progress</h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {taskProgressList && taskProgressList.length > 0 ? (
              <div className="space-y-4">
                {taskProgressList.map((progress, index) => {
                  const displayName = getDisplayName(progress.email || progress.user);
                  const displayTime = formatDateTime(progress.time || progress.created_at);
                  const status = progress.progress_status || 'Pending';
                  const colors = getProgressColor(status);
                  const isLatest = index === 0;
                  
                  return (
                    <button
                      key={progress.id}
                      onClick={() => {
                        setSelectedProgressUpdate(progress);
                        pushScreen("progressDetail");
                      }}
                      className={`w-full ${colors.bg} border ${colors.border} rounded-xl p-4 hover:shadow-lg transition-all text-left relative overflow-hidden`}
                    >
                      {/* Left Ribbon */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colors.badge}`}></div>
                      
                      {/* Latest Badge */}
                      {isLatest && (
                        <div className="absolute top-2 right-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors.badge} text-white shadow-sm`}>
                            Latest
                          </span>
                        </div>
                      )}

                      <div className="pl-2">
                        {/* Header with Update Number */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2 h-2 rounded-full ${colors.badge}`}></div>
                          <span className={`text-xs font-semibold ${colors.text}`}>
                            Update #{taskProgressList.length - index}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar 
                              userObj={{
                                name: displayName,
                                profile_image: progress.profile_image
                              }} 
                              size={40} 
                            />
                            <div>
                              <p className="font-semibold text-gray-900">{displayName || 'User'}</p>
                              <p className="text-xs text-gray-500">{displayTime}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            status === 'Completed' ? 'bg-green-100 text-green-700' :
                            status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {status}
                          </span>
                        </div>

                        {/* Status-Based Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className={`text-sm font-bold ${colors.text}`}>{progress.progress_percentage || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`${colors.progressBar} h-2.5 rounded-full transition-all`}
                              style={{ width: `${progress.progress_percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Notes Preview */}
                        {progress.text && (
                          <p className="text-sm text-gray-600 line-clamp-2">{progress.text}</p>
                        )}

                        <div className="flex items-center justify-end mt-2">
                          <FiChevronRight size={20} className={colors.text} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <MdCheck className="text-gray-300" size={40} />
                </div>
                <p className="text-lg font-medium text-gray-600 mb-2">No progress updates yet</p>
                <p className="text-sm text-gray-400">Submit progress updates to track task completion</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Detail - Stack Navigation */}
      {getCurrentScreen()?.screen === "progressDetail" && selectedProgressUpdate && (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="sticky top-0 z-20 px-5 py-4 flex items-center justify-between bg-white text-gray-800 border-b border-gray-200 shadow-sm">
            <button 
              onClick={popScreen}
              className="p-3 rounded-full min-w-[44px] min-h-[44px] hover:bg-white hover:bg-opacity-20 mr-3 transition-colors"
            >
              <IoMdArrowBack size={24} />
            </button>
            <h3 className="flex-1 text-lg font-bold">Progress Details</h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                {(() => {
                  const displayName = getDisplayName(selectedProgressUpdate.email || selectedProgressUpdate.user);
                  const displayTime = formatDateTime(selectedProgressUpdate.time || selectedProgressUpdate.created_at);
                  return (
                    <>
                      <Avatar 
                        userObj={{
                          name: displayName,
                          profile_image: selectedProgressUpdate.profile_image
                        }} 
                        size={48} 
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{displayName || 'User'}</p>
                        <p className="text-sm text-gray-500">{displayTime}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Status & Progress */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className={`font-semibold ${
                    selectedProgressUpdate.progress_status === 'Completed' ? 'text-green-600' :
                    selectedProgressUpdate.progress_status === 'In Progress' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {selectedProgressUpdate.progress_status || 'Pending'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Progress</p>
                  <p className="font-semibold text-blue-600">{selectedProgressUpdate.progress_percentage || 0}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
                    style={{ width: `${selectedProgressUpdate.progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Notes */}
              {selectedProgressUpdate.text && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Notes</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedProgressUpdate.text}</p>
                </div>
              )}

              {/* Evidence Photo */}
              {selectedProgressUpdate.evidence_photo && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Evidence Photo</p>
                  <img 
                    src={selectedProgressUpdate.evidence_photo} 
                    alt="Evidence" 
                    className="w-full rounded-xl shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => window.open(selectedProgressUpdate.evidence_photo, '_blank')}
                  />
                </div>
              )}

              {/* Location */}
              {(selectedProgressUpdate.location_latitude && selectedProgressUpdate.location_longitude) && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Location</p>
                  <div className="flex items-center text-gray-600">
                    <MdLocationOn className="text-red-500 mr-2" size={20} />
                    <span className="text-sm">
                      {selectedProgressUpdate.location_name || `${selectedProgressUpdate.location_latitude}, ${selectedProgressUpdate.location_longitude}`}
                      {selectedProgressUpdate.location_accuracy && (
                        <span className="text-xs text-gray-400 ml-2">
                          (±{selectedProgressUpdate.location_accuracy}m)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Approval Status */}
              {selectedProgressUpdate.approval_status && (
                <div className={`rounded-xl p-4 border ${
                  selectedProgressUpdate.approval_status === 'approved' ? 'bg-green-50 border-green-200' :
                  selectedProgressUpdate.approval_status === 'rejected' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{
                    color: selectedProgressUpdate.approval_status === 'approved' ? '#16a34a' :
                           selectedProgressUpdate.approval_status === 'rejected' ? '#dc2626' : '#ca8a04'
                  }}>
                    Approval Status
                  </p>
                  <p className={`font-semibold capitalize ${
                    selectedProgressUpdate.approval_status === 'approved' ? 'text-green-700' :
                    selectedProgressUpdate.approval_status === 'rejected' ? 'text-red-700' :
                    'text-yellow-700'
                  }`}>
                    {selectedProgressUpdate.approval_status}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments & Clarifications - Stack Navigation */}
      {getCurrentScreen()?.screen === "comments" && renderCommentsModal()}

      {/* Camera full-screen screen (used by navigation stack) */}
      {getCurrentScreen()?.screen === "camera" && (
        <div className="fixed inset-0 bg-white z-[80] flex flex-col">
          <div className="bg-gradient-to-r from-white-600 to-white-700 px-4 py-3 flex items-center text-black shadow-md">
            <button onClick={() => {
                // stop stream
                if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
                  cameraVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
                }
                setCameraStream(null);
                popScreen();
              }}
              className="p-2 rounded-full bg-gray/20 mr-3"
            >
              <FiChevronLeft size={20} />
            </button>
            <div className="flex-1 text-center font-bold">Camera</div>
            <div style={{width:44}} />
          </div>

          <div className="flex-1 bg-black flex items-center justify-center">
            <video ref={cameraVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <canvas ref={cameraCanvasRef} style={{ display: 'none' }} />
          </div>

          <div className="p-4 flex items-center justify-center gap-4">
            <button
              onClick={() => {
                // stop and go back
                if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
                  cameraVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
                }
                setCameraStream(null);
                popScreen();
              }}
              className="px-6 py-3 bg-gray-200 rounded-xl"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                if (cameraCanvasRef.current && cameraVideoRef.current) {
                  const canvas = cameraCanvasRef.current;
                  const video = cameraVideoRef.current;
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  canvas.toBlob((blob) => {
                    if (blob) {
                      const timestamp = Date.now();
                      const file = new File([blob], `camera-${timestamp}.jpg`, { type: 'image/jpeg' });
                      setCommentAttachments(prev => [...prev, {
                        name: file.name,
                        preview: URL.createObjectURL(blob),
                        size: file.size,
                        type: file.type,
                        rawFile: file,
                      }] );

                      // stop stream and go back to comments
                      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
                        cameraVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
                      }
                      setCameraStream(null);
                      popScreen();
                    }
                  }, 'image/jpeg', 0.9);
                }
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl"
            >
              <FiCamera size={18} className="inline-block mr-2" /> Capture
            </button>
          </div>
        </div>
      )}

      {/* Progress Detail View Modal */}
      {showProgressDetailView && selectedProgressUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Header */}
            <div className="sticky top-0 px-6 py-4 flex items-center justify-between bg-white text-gray-800 border-b border-gray-200">
              <h2 className="text-xl font-bold">Progress Update Details</h2>
              <button 
                onClick={() => {
                  setShowProgressDetailView(false);
                  setSelectedProgressUpdate(null);
                }}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <IoMdClose size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar 
                  userObj={{
                    name: selectedProgressUpdate.user,
                    profile_image: selectedProgressUpdate.profile_image
                  }} 
                  size={48} 
                />
                <div>
                  <p className="font-semibold text-gray-900">{selectedProgressUpdate.user || 'User'}</p>
                  <p className="text-sm text-gray-500">{selectedProgressUpdate.time}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Status</p>
                <span className={`inline-block px-4 py-2 rounded-full font-semibold ${
                  selectedProgressUpdate.progress_status === 'Completed' ? 'bg-green-100 text-green-800' :
                  selectedProgressUpdate.progress_status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedProgressUpdate.progress_status || 'Pending'}
                </span>
              </div>

              {/* Progress Percentage */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-gray-700">Progress Percentage</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedProgressUpdate.progress_percentage || 0}%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all"
                    style={{ width: `${selectedProgressUpdate.progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Evidence Photo */}
              {selectedProgressUpdate.evidence_photo && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Evidence Photo</p>
                  <img 
                    src={selectedProgressUpdate.evidence_photo} 
                    alt="Evidence" 
                    className="w-full rounded-xl border-2 border-gray-200"
                  />
                </div>
              )}

              {/* Location Information */}
              {(selectedProgressUpdate.location_latitude && selectedProgressUpdate.location_longitude) && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <MdLocationOn size={20} className="text-red-500" />
                    <p className="text-sm font-semibold text-gray-700">Location Data</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    {selectedProgressUpdate.location_name && (
                      <div className="flex justify-between mb-3 pb-3 border-b border-gray-300">
                        <span>Location:</span>
                        <span className="font-semibold">{selectedProgressUpdate.location_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Latitude:</span>
                      <span className="font-mono font-semibold">{parseFloat(selectedProgressUpdate.location_latitude).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Longitude:</span>
                      <span className="font-mono font-semibold">{parseFloat(selectedProgressUpdate.location_longitude).toFixed(6)}</span>
                    </div>
                    {selectedProgressUpdate.location_accuracy && (
                      <div className="flex justify-between">
                        <span>Accuracy:</span>
                        <span className="font-mono font-semibold">±{selectedProgressUpdate.location_accuracy.toFixed(2)}m</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments/Notes */}
              {selectedProgressUpdate.text && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Notes</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedProgressUpdate.text}
                    </p>
                  </div>
                </div>
              )}

              {/* Approval Status if available */}
              {selectedProgressUpdate.approval_status && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Approval Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedProgressUpdate.approval_status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    selectedProgressUpdate.approval_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedProgressUpdate.approval_status || 'PENDING'}
                  </span>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowProgressDetailView(false);
                  setSelectedProgressUpdate(null);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Take Photo</h3>
              <button onClick={stopCamera} className="text-gray-500 hover:text-gray-700">
                <IoMdClose size={24} />
              </button>
            </div>
            
            <div className="relative bg-black">
              <video 
                ref={videoRef}
                autoPlay 
                muted
                playsInline
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div className="p-4 flex justify-center gap-4">
              <button
                onClick={stopCamera}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <FiCamera size={20} />
                Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {showProgressModal && renderProgressUpdateModal()}

      {/* Photo Evidence Modal */}
      {showPhotoModal && renderPhotoEvidenceModal()}

      {/* Toast Notification */}
      {toast.show && (
        <div 
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 rounded-2xl shadow-2xl animate-slide-down flex items-center gap-3 min-w-[300px] max-w-[90%] ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : toast.type === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white'
          }`}
        >
          <div className="flex-shrink-0">
            {toast.type === 'success' ? (
              <MdCheckCircle size={28} />
            ) : toast.type === 'error' ? (
              <MdReportProblem size={28} />
            ) : (
              <IoMdNotifications size={28} />
            )}
          </div>
          <p className="flex-1 font-medium text-base">{toast.message}</p>
          <button
            onClick={() => setToast({ show: false, message: '', type: '' })}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <IoMdClose size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
