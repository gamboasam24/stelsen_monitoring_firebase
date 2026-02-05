  // Helper to match user-dashboard's priority label
  const getPriorityText = (priority) => {
    if (!priority) return 'Normal';
    if (priority.toLowerCase() === 'high') return 'High';
    if (priority.toLowerCase() === 'medium') return 'Medium';
    if (priority.toLowerCase() === 'low') return 'Low';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };
import React, { useState, useEffect, useRef } from "react";
import { 
  IoMdHome, 
  IoMdClose, 
  IoMdNotifications, 
  IoMdMegaphone,
  IoMdCheckmarkCircle,
  IoMdTime,
  IoMdSend,
  IoMdCreate,
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
  MdCheckCircle,
  MdCall,
  MdVideocam,
  MdPerson,
  MdWork,
  MdCalendarToday,
  MdAddTask,
  MdBook,
  MdBookmarkAdd,
  MdChat,
  MdComment,
  MdPushPin,
  MdAssignment,
  MdEdit,
  MdDelete,
  MdPriorityHigh,
  MdPeople,
  MdChatBubble,
  MdDoneAll,
  MdTimeline,
  MdCheck,
  MdBarChart
} from "react-icons/md";
import { 
  FaUser, 
  FaSignOutAlt, 
  FaRegCalendarAlt, 
  FaRegNewspaper,
  FaRegBell,
  FaMapMarkerAlt,
  FaPlus,
  FaRegCommentDots
} from "react-icons/fa";
import { 
  FiSettings, 
  FiChevronRight, 
  FiPlus, 
  FiCamera,
  FiPaperclip,
  FiBell,
  FiSearch,
  FiMessageSquare,
  FiBarChart2,
  FiBarChart,
  FiPercent,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiMapPin,
  FiMap,
  FiExternalLink,
  FiActivity,
  FiLoader,
  FiX,
  FiEye,
  FiEyeOff,
  FiSun,
  FiMoon,
  FiEdit2,
  FiMoreVertical
} from "react-icons/fi";
import { 
  HiOutlineChatAlt2,
  HiOutlineClipboardList,
  HiOutlineDocumentAdd
} from "react-icons/hi";
import { FiRefreshCw } from "react-icons/fi";
import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Swal from "sweetalert2";

const AdminDashboard = ({ user, logout }) => {
  const [currentUser, setCurrentUser] = useState(user);

  // Sync currentUser with prop changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);
  // --- ENHANCEMENTS: Offline, Pull-to-Refresh, Haptic, Dark Mode ---
  // Offline mode - user is offline if NOT logged in OR internet is down
  const isUserLoggedIn = !!currentUser && !!currentUser.id;
  const [isOffline, setIsOffline] = useState(!navigator.onLine || !isUserLoggedIn);
  const [isPulling, setIsPulling] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('adminDashboardDarkMode') === 'true';
  });
  const pullRef = useRef(null);

  // Listen for online/offline
  useEffect(() => {
      const checkOfflineStatus = () => {
        const userLoggedIn = !!currentUser && !!currentUser.id;
        const internetActive = navigator.onLine;
        const shouldBeOffline = !internetActive || !userLoggedIn;
        setIsOffline(shouldBeOffline);
      };

      const handleOnline = () => checkOfflineStatus();
      const handleOffline = () => checkOfflineStatus();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    }, [currentUser]);

  // Force light mode (ignore device or stored dark preference)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    setDarkMode(false);
    try { localStorage.setItem('adminDashboardDarkMode', 'false'); } catch (e) {}
  }, []);

  // Pull-to-refresh gesture (mobile)
  useEffect(() => {
    const el = pullRef.current;
    if (!el) return;
    let startY = null;
    let pulling = false;
    function onTouchStart(e) {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    }
    function onTouchMove(e) {
      if (!pulling || startY === null) return;
      const diff = e.touches[0].clientY - startY;
      if (diff > 60 && !isPulling) {
        setIsPulling(true);
        triggerHaptic();
        handleRefresh();
      }
    }
    function onTouchEnd() {
      pulling = false;
      setIsPulling(false);
      startY = null;
    }
    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchmove', onTouchMove);
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [isPulling]);

  // Haptic feedback (mobile)
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    const setInteracted = () => setUserInteracted(true);
    window.addEventListener('pointerdown', setInteracted, { once: true });
    window.addEventListener('touchstart', setInteracted, { once: true });
    return () => {
      window.removeEventListener('pointerdown', setInteracted);
      window.removeEventListener('touchstart', setInteracted);
    };
  }, []);

  function triggerHaptic() {
    try {
      const lastUserGestureRef = window.__stelsen_lastUserGesture;
      const gestureAllowed = (lastUserGestureRef && lastUserGestureRef.current) || userInteracted;
      if (!gestureAllowed) return;
      if (window.navigator && window.navigator.vibrate) {
        try {
          navigator.vibrate(30);
        } catch (e) {
          // ignore vibration/intervention errors
        }
      }
    } catch (e) {
      // ignore vibration errors
    }
  }

  // Global haptic listeners: trigger haptics on interactive element clicks/changes
  useEffect(() => {
    const onInteraction = (e) => {
      try {
        if (!e.isTrusted) return;
        const el = e.target;
        const tag = el && el.tagName && el.tagName.toUpperCase();
        const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];

        if (el && (el.getAttribute && el.getAttribute('data-haptic') !== null)) {
          triggerHaptic('light');
          return;
        }

        if (tag && interactiveTags.includes(tag)) {
          triggerHaptic('light');
          return;
        }

        if (el && el.getAttribute && el.getAttribute('role') === 'button') {
          triggerHaptic('light');
        }
      } catch (err) {
        // swallow errors to avoid interfering with app
      }
    };

    const onChange = (e) => {
      try {
        if (!e.isTrusted) return;
        triggerHaptic('light');
      } catch {}
    };

    document.addEventListener('click', onInteraction, true);
    document.addEventListener('change', onChange, true);

    // Also trigger on touchstart for immediate haptic feedback on touch devices
    const onTouchStartImmediate = (e) => {
      try {
        if (!e.isTrusted) return;
        const el = e.target;
        const interactive = el && (el.closest && (el.closest('button, [role="button"], a, select, [data-haptic], img.profile')));
        if (interactive) triggerHaptic('light');
      } catch (err) {}
    };
    document.addEventListener('touchstart', onTouchStartImmediate, { capture: true });

    return () => {
      document.removeEventListener('click', onInteraction, true);
      document.removeEventListener('change', onChange, true);
      document.removeEventListener('touchstart', onTouchStartImmediate, { capture: true });
    };
  }, [triggerHaptic]);

  // Ensure interactive elements have `data-haptic` so global listeners pick them up
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

  // Manual refresh handler
  function handleRefresh() {
    // Example: reload projects/announcements/users
    setIsLoading(true);
    // You may want to call your fetch functions here
    setTimeout(() => setIsLoading(false), 1000);
  }
  // --- END ENHANCEMENTS ---
  const [activeTab, setActiveTab] = useState("Home");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  // Navigation stack for screen-based navigation (replaces modals)
  const [navigationStack, setNavigationStack] = useState([]);
  const [currentLocation, setCurrentLocation] = useState("Office");
  const [reportMessage, setReportMessage] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("general");
  const [announcementPriority, setAnnouncementPriority] = useState("medium");
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [userStatus, setUserStatus] = useState("Active");
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const filterButtonsRef = useRef(null);
  const [showAnnouncementFilterMenu, setShowAnnouncementFilterMenu] = useState(false);
  const announcementFilterBtnRef = useRef(null);
  const announcementFilterMenuRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("unread");
  const [dateFilter, setDateFilter] = useState("all");
  const [showDateFilterMenu, setShowDateFilterMenu] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const actionMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const commentFileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const headerRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [progressMapStates, setProgressMapStates] = useState({});
  const [hiddenEmployees, setHiddenEmployees] = useState(new Set());
  // State for announcements, projects, users - must be declared before useEffect hooks
  const [projects, setProjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [readComments, setReadComments] = useState(() => {
    try {
      const saved = localStorage.getItem('adminDashboardReadComments');
      return saved ? JSON.parse(saved) : {};
    } catch (err) {
      console.error('Error loading read comments:', err);
      return {};
    }
  });
  const [taskProgressList, setTaskProgressList] = useState([]);
  const [selectedProgressUpdate, setSelectedProgressUpdate] = useState(null);
  const [isLoadingTaskProgress, setIsLoadingTaskProgress] = useState(false);
  const [showSubscriptionsModal, setShowSubscriptionsModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [pendingPins, setPendingPins] = useState({});
  const isFetchingLocationsRef = useRef(false);
  // Timestamp refresh ticker - increments every minute to force notification time recalculation
  const [timestampTicker, setTimestampTicker] = useState(0);
  
  // Comments expansion state - tracks which projects have expanded comments
  const [expandedProjectComments, setExpandedProjectComments] = useState({});

  // Edit Profile Modal States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    department: '',
    phone: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Prevent body scroll when overlays are open
  useEffect(() => {
    if (showDatePicker || showAnnouncementFilterMenu) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [showDatePicker, showAnnouncementFilterMenu]);

  // Close announcement filter when clicking outside
  useEffect(() => {
    if (!showAnnouncementFilterMenu) return;
    const handleClickOutside = (event) => {
      const menuEl = announcementFilterMenuRef.current;
      const btnEl = announcementFilterBtnRef.current;
      if (!menuEl || !btnEl) return;
      if (!menuEl.contains(event.target) && !btnEl.contains(event.target)) {
        setShowAnnouncementFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showAnnouncementFilterMenu]);

  // Fetch subscriptions when modal opens
  useEffect(() => {
    if (!showSubscriptionsModal) return;
    const fetchSubscriptions = async () => {
      setIsLoadingSubscriptions(true);
      try {
        const res = await fetch('/backend/list_subscriptions.php', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setSubscriptions(json || []);
        } else {
          setSubscriptions([]);
        }
      } catch (err) {
        console.error('Failed to fetch subscriptions', err);
        setSubscriptions([]);
      }
      setIsLoadingSubscriptions(false);
    };
    fetchSubscriptions();
  }, [showSubscriptionsModal]);
  const [cameraStream, setCameraStream] = useState(null);

  // Project modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState("pending");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [projectStartDate, setProjectStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [center, setCenter] = useState({
    lat: 14.5995,
    lng: 120.9842,
  });

  // Map state for location tracking
  const [viewState, setViewState] = useState({
    longitude: 120.9842,
    latitude: 14.5995,
    zoom: 12
  });

  const [userCoordinates, setUserCoordinates] = useState({
    latitude: null,
    longitude: null
  });

  const [otherUsersLocations, setOtherUsersLocations] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [panelAutoRefresh, setPanelAutoRefresh] = useState(true);
  const [activeListHeight, setActiveListHeight] = useState('auto');

  // Fetch other users' locations when map is open
  useEffect(() => {
    const currentScreen = getCurrentScreen();
    if (currentScreen?.screen === 'mapView') {
      fetchOtherUsersLocations();
      // Auto-refresh with guard to avoid overlapping requests
      const interval = setInterval(() => {
        if (!isFetchingLocationsRef.current) fetchOtherUsersLocations();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [navigationStack]);

  // Auto-center map on user's current location
  useEffect(() => {
    if (userCoordinates.latitude && userCoordinates.longitude) {
      setViewState(prev => ({
        ...prev,
        longitude: userCoordinates.longitude,
        latitude: userCoordinates.latitude,
        zoom: 15
      }));
    }
  }, [userCoordinates.latitude, userCoordinates.longitude]);

  const fetchOtherUsersLocations = async () => {
    if (isFetchingLocationsRef.current) return [];
    isFetchingLocationsRef.current = true;
    try {
      const res = await fetch('/backend/location.php?user_id=all', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.locations)) {
        // Filter out current admin user from the list
        const filtered = data.locations.filter(loc => 
          loc.user_id !== currentUser?.login_id && 
          loc.latitude && 
          loc.longitude
        );
        setOtherUsersLocations(filtered);
        // Update active users list using 2-minute default threshold
        const actives = collectActiveUsers(filtered, 2);
        setActiveUsers(actives);
        return actives;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch other users locations:', err);
      return [];
    } finally {
      isFetchingLocationsRef.current = false;
    }
  };

  // Panel auto-refresh while Task Location tab is open
  useEffect(() => {
    let interval;
    if (activeTab === 'My Location' && panelAutoRefresh) {
      // refresh immediately then every 10s
      fetchOtherUsersLocations();
      interval = setInterval(() => {
        if (!isFetchingLocationsRef.current) fetchOtherUsersLocations();
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [activeTab, panelAutoRefresh]);

  // Helper to recompute active/offline users on demand
  const updateActiveUsers = (thresholdMinutes = 2) => {
    const actives = collectActiveUsers(otherUsersLocations, thresholdMinutes);
    setActiveUsers(actives);
    return actives;
  };

  // Calculate active list height so only the list scrolls and header stays sticky
  useEffect(() => {
    function recalc() {
      try {
        const header = headerRef.current;
        if (header) {
          const rect = header.getBoundingClientRect();
          const height = window.innerHeight - rect.bottom;
          setActiveListHeight(height > 0 ? `${height}px` : '300px');
        } else {
          setActiveListHeight('auto');
        }
      } catch (e) {
        setActiveListHeight('auto');
      }
    }

    recalc();
    window.addEventListener('resize', recalc);
    window.addEventListener('orientationchange', recalc);
    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('orientationchange', recalc);
    };
  }, [navigationStack, currentLocation, selectedProject, otherUsersLocations]);

  // Swipe-right to go back (stack navigation) on touch devices
  useEffect(() => {
    const el = pullRef.current || window;
    let startX = null;
    let startY = null;
    const threshold = 70;

    function onTouchStart(e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchMove(e) {
      if (startX === null) return;
      const dx = e.touches[0].clientX - startX;
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > threshold && dy < 80) {
        if (navigationStack.length > 0) {
          triggerHaptic && triggerHaptic('light');
          popScreen();
        }
        startX = null;
        startY = null;
      }
    }

    function onTouchEnd() {
      startX = null;
      startY = null;
    }

    el.addEventListener && el.addEventListener('touchstart', onTouchStart);
    el.addEventListener && el.addEventListener('touchmove', onTouchMove);
    el.addEventListener && el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener && el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener && el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener && el.removeEventListener('touchend', onTouchEnd);
    };
  }, [navigationStack]);

  const refreshLocation = async () => {
    setIsRefreshingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoordinates({ latitude, longitude });
          
          // Send to backend
          try {
            await fetch('/backend/location.php', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude, longitude })
            });
          } catch (err) {
            console.error('Failed to update location:', err);
          }
          
          setIsRefreshingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsRefreshingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsRefreshingLocation(false);
    }
  };

  const getCurrentUserProfileImage = () => {
    if (selectedFile) return selectedFile;
    if (currentUser?.uploaded_profile_image) return currentUser.uploaded_profile_image;
    if (currentUser?.profile_image) return currentUser.profile_image;
    return null;
  };

  // Navigation Stack Functions
  const pushScreen = (screenName, data = {}) => {
    setNavigationStack(prev => [...prev, { screen: screenName, data }]);
  };

  const popScreen = () => {
    setNavigationStack(prev => prev.slice(0, -1));
  };

  const getCurrentScreen = () => {
    return navigationStack.length > 0 ? navigationStack[navigationStack.length - 1] : null;
  };

  const isScreenOpen = (screenName) => {
    return navigationStack.some(item => item.screen === screenName);
  };

  // Open Comments & Clarifications using stack navigation
  const openCommentsScreen = (project) => {
    if (!project) return;

    const normalizedComments = project.comments || [];
    setSelectedProject({ ...project, comments: normalizedComments });

    if (normalizedComments.length > 0) {
      const commentIds = normalizedComments.map(c => c.id);
      setReadComments(prev => ({
        ...prev,
        [project.id]: commentIds
      }));
    }

    setNavigationStack(prev => {
      const filtered = prev.filter(screen => !["comments", "projectUsers", "addUserToProject"].includes(screen.screen));
      return [...filtered, { screen: "comments", data: { projectId: project.id } }];
    });
  };

  // Open Task Progress list (stack navigation)
  const openTaskProgressScreen = async (project) => {
    if (!project?.id) return;
    setSelectedProject(prev => prev?.id === project.id ? prev : { ...project, comments: project.comments || [] });
    setIsLoadingTaskProgress(true);

    try {
      const res = await fetch(`/backend/project_progress.php?project_id=${project.id}`, { credentials: "include" });
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.progress)) {
        setTaskProgressList(data.progress);
      } else {
        setTaskProgressList([]);
      }
    } catch (err) {
      console.error("Error fetching task progress:", err);
      setTaskProgressList([]);
    } finally {
      setIsLoadingTaskProgress(false);
      setNavigationStack(prev => {
        const filtered = prev.filter(screen => screen.screen !== "taskProgress" && screen.screen !== "progressDetail");
        return [...filtered, { screen: "taskProgress", data: { projectId: project.id } }];
      });
    }
  };

  // Open Map View with project-specific locations
  const openProjectMapView = () => {
    if (!selectedProject) return;
    
    // Fetch fresh location data for project users before opening map
    fetchOtherUsersLocations();
    
    // Push map view to navigation stack
    setNavigationStack(prev => {
      const filtered = prev.filter(screen => screen.screen !== "mapView");
      return [...filtered, { screen: "mapView", data: { projectId: selectedProject.id } }];
    });
  };
  
  // Format author name from email
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

// Format time ago
const formatTimeAgo = (dateInput) => {
  if (!dateInput) return "Just now";
  const created = dateInput instanceof Date
    ? dateInput
    : new Date(typeof dateInput === 'number' ? dateInput : dateInput);
  if (isNaN(created.getTime())) return "Just now";
  const now = new Date();
  const diff = Math.floor((now - created) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
  return created.toLocaleDateString();
};


  // Get user's current geolocation
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => console.log("Location access denied")
    );
  }, []);

  // 🔒 Helper function to check for session expiry and auto-logout
  const handleApiResponse = async (response) => {
    if (!response.ok) {
      return response.json().then(data => {
        if (data.message === "Unauthorized") {
          console.error("Session expired - logging out");
          logout();
        }
        throw new Error(data.message || "API request failed");
      });
    }
    return response.json();
  };

  // Enhanced announcements data
  useEffect(() => {
    setIsLoadingAnnouncements(true);
    const fetchAnnouncements = () => {
      fetch("/backend/announcements.php", { credentials: "include" })
        .then(res => handleApiResponse(res))
        .then(data => {
          if (!Array.isArray(data)) {
            console.error('Announcements data is not an array:', data);
            setAnnouncements([]);
            setIsLoadingAnnouncements(false);
            return;
          }
          
          // Filter announcements: only show those created after user account creation
          const userCreatedAt = currentUser?.created_at ? new Date(currentUser.created_at) : null;
          const filtered = userCreatedAt ? data.filter(a => new Date(a.created_at) >= userCreatedAt) : data;
          
          const normalized = filtered.map(a => {
            const createdAtMs = a.created_at_ts ? Number(a.created_at_ts) * 1000 : Date.parse(a.created_at);
            const createdDate = new Date(isNaN(createdAtMs) ? a.created_at : createdAtMs);
            return ({
            id: a.announcement_id,
            title: a.title,
            content: a.content,
            type: a.type,
            priority: a.priority,
            author: formatAuthorName(a.author),
            time: formatTimeAgo(createdDate),
            unread: a.unread === 1,
            is_pinned: a.is_pinned === 1,
            category: a.type.charAt(0).toUpperCase() + a.type.slice(1),
            important: a.priority === "high",
            color: getColorForType(a.type),
            icon: getIconForType(a.type),
            created_at: a.created_at,
            created_at_ts: a.created_at_ts ? Number(a.created_at_ts) : null,
          });
          });

          setAnnouncements(normalized);
          setIsLoadingAnnouncements(false);
        })
        .catch(err => {
          console.error('Failed to fetch announcements:', err);
          setAnnouncements([]);
          setIsLoadingAnnouncements(false);
        });
    };
    
    // Initial fetch
    fetchAnnouncements();
    
    // Auto-refresh every 45 seconds for live updates
    const interval = setInterval(fetchAnnouncements, 45000);
    
    return () => clearInterval(interval);
  }, [logout]);

  // Update timestamp ticker every minute to refresh notification time displays
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestampTicker(prev => prev + 1);
    }, 60000); // Update every 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Save read comments to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('adminDashboardReadComments', JSON.stringify(readComments));
    } catch (err) {
      console.error('Error saving read comments:', err);
    }
  }, [readComments]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = () => {
      fetch("/backend/users.php", {
        credentials: "include",
      })
        .then(res => handleApiResponse(res))
        .then(data => setUsers(data))
        .catch(err => console.error("Users error:", err));
    };
    
    // Initial fetch
    fetchUsers();
    
    // Auto-refresh every 60 seconds for live updates
    const interval = setInterval(fetchUsers, 60000);
    
    return () => clearInterval(interval);
  }, [logout]);

  // Initial loading management - hide loading screen after data is fetched
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Minimum loading time for smooth UX
    return () => clearTimeout(timer);
  }, []);

  //================================================== Filtered announcements ==================================================
  const filteredAnnouncements = announcements.filter(ann => {
    if (selectedFilter === "unread") return ann.unread;
    if (selectedFilter === "important") return ann.important;
    if (selectedFilter === "pinned") return ann.is_pinned;
    if (selectedFilter === "all") return true;
    return true;
  }).filter(ann => {
    // Date filter logic
    const announcementDate = new Date(ann.created_at);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    if (dateFilter === "today") {
      return announcementDate >= startOfToday && announcementDate < endOfToday;
    }
    if (dateFilter === "week") {
      return announcementDate >= startOfWeek && announcementDate <= endOfWeek;
    }
    if (dateFilter === "month") {
      return announcementDate >= startOfMonth && announcementDate <= endOfMonth;
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

//============================================= Create new announcement =================================================
const createAnnouncement = async () => {
  const newAnnouncement = {
    title: announcementTitle,
    content: announcementContent,
    type: announcementType,
    priority: announcementPriority,
  };

  try {
    if (isCreatingAnnouncement) return;
    setIsCreatingAnnouncement(true);
    const response = await fetch("/backend/announcements.php", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newAnnouncement),
    });

    const data = await response.json();
    if (data.status === "success") {
      // show success alert
      Swal.fire({
        icon: 'success',
        title: 'Announcement posted',
        text: data.message || 'Announcement created successfully',
        timer: 2000,
        showConfirmButton: false
      });

      // refresh announcements list
      fetch("/backend/announcements.php", { credentials: "include" })
        .then(res => handleApiResponse(res))
        .then(data => {
          const normalized = data.map(a => {
            const createdAtMs = a.created_at_ts ? Number(a.created_at_ts) * 1000 : Date.parse(a.created_at);
            const createdDate = new Date(isNaN(createdAtMs) ? a.created_at : createdAtMs);
            return ({
              id: a.announcement_id,
              title: a.title,
              content: a.content,
              type: a.type,
              priority: a.priority,
              author: a.author === "admin" ? "Admin" : a.author,
              time: formatTimeAgo(createdDate),
              unread: a.unread === 1,
              category: a.type.charAt(0).toUpperCase() + a.type.slice(1),
              important: a.priority === "high",
              color: getColorForType(a.type),
              icon: getIconForType(a.type),
              created_at: a.created_at,
              created_at_ts: a.created_at_ts ? Number(a.created_at_ts) : null,
            });
          });

          setAnnouncements(normalized);
        })
        .catch(err => console.error('Announcements refresh error:', err));

      setShowAnnouncementModal(false);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Failed to post',
        text: data.message || 'Could not create announcement',
      });
    }
  } catch (error) {
    console.error("Error creating announcement:", error);
    Swal.fire({
      icon: 'error',
      title: 'Network error',
      text: 'Unable to create announcement. Check your connection and try again.'
    });
  }
  finally {
    setIsCreatingAnnouncement(false);
  }
};

//============================================= Create new project/Tasks =================================================
const createProject = async () => {
  const newProject = {
    title: projectTitle,
    description: projectDescription,
    status: projectStatus,
    deadline: projectDeadline,
    manager: projectManager,
    team_users: selectedUsers.length,
    budget: projectBudget,
    startDate: projectStartDate,
    assignedUsers: selectedUsers,
  };

  try {
    if (isCreatingProject) return;
    setIsCreatingProject(true);
    const response = await fetch("/backend/projects.php", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newProject),
    });

    const data = await response.json();
    if (data.status === "success") {
      // show success alert
      Swal.fire({
        icon: 'success',
        title: 'Project created',
        text: data.message || 'Project created successfully',
        timer: 2000,
        showConfirmButton: false
      });

      // Fetch projects again
      fetch("/backend/projects.php", {
        credentials: "include",
      })
        .then(res => handleApiResponse(res))
        .then(data => setProjects(data))
        .catch(err => console.error("Projects error:", err));

      setShowProjectModal(false);
      // Reset form
      setProjectTitle("");
      setProjectDescription("");
      setProjectStatus("pending");
      setProjectDeadline("");
      setProjectManager("");
      setProjectBudget("");
      setProjectStartDate(new Date().toISOString().split('T')[0]);
      setSelectedUsers([]);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Failed to create',
        text: data.message || 'Could not create project',
      });
    }
  } catch (error) {
    console.error("Error creating project:", error);
    Swal.fire({
      icon: 'error',
      title: 'Network error',
      text: 'Unable to create project. Check your connection and try again.'
    });
  } finally {
    setIsCreatingProject(false);
  }
};

const handleBudgetChange = (e) => {
  const value = e.target.value;
  // Remove all non-numeric characters except the peso sign
  const numericValue = value.replace(/[^0-9]/g, '');
  
  if (numericValue === '') {
    setProjectBudget('');
    return;
  }
  
  // Format with commas
  const formatted = Number(numericValue).toLocaleString('en-PH');
  setProjectBudget(formatted);
};
  
 const Avatar = ({ user, size = 32, className = "" }) => {
  const initial =
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "?";

  const [imgError, setImgError] = useState(false);

  // PRIORITY: uploaded → google → fallback
  const imageSrc =
    user?.uploaded_profile_image ||
    user?.profile_image ||
    null;

  if (!imageSrc || imgError) {
    return (
      <div
        className={`bg-blue-500 text-white font-bold flex items-center justify-center rounded-full profile ${className}`.trim()}
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
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer" // 🔥 REQUIRED FOR GOOGLE
      className={`rounded-full object-cover profile ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
};

  // ProgressApprovalCard Component - for progress submissions in conversation
  const ProgressApprovalCard = ({ comment, onApprove, onReject }) => {
    const [isApproving, setIsApproving] = useState(false);
    const showMap = progressMapStates[comment.progress_id] || false;

    const toggleMap = () => {
      setProgressMapStates(prev => ({
        ...prev,
        [comment.progress_id]: !showMap
      }));
    };

    const handleApprove = async () => {
      setIsApproving(true);
      await onApprove(comment.progress_id);
      setIsApproving(false);
    };

    const handleReject = async () => {
      setIsApproving(true);
      await onReject(comment.progress_id);
      setIsApproving(false);
    };

    const isPending = comment.approval_status === 'PENDING';
    const isApproved = comment.approval_status === 'APPROVED';
    const isRejected = comment.approval_status === 'REJECTED';

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

    return (
      <div className="max-w-[500px] w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 my-2 hover:shadow-xl transition-shadow duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow">
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
              onTouchStart={() => triggerHaptic('light')}
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
          <div className={`text-sm leading-relaxed break-words rounded-lg p-3 border shadow ${
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
                onTouchStart={() => triggerHaptic('light')}
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
                    onTouchStart={() => triggerHaptic('light')}
                    className="p-3 rounded-full min-w-[56px] min-h-[56px] hover:bg-gray-100 transition-colors"
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
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow ${
            progress?.status === 'Completed' ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' :
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

        {/* Approve/Reject Buttons - Only for Admin and Pending */}
        {isPending && (
          <div className="px-4 py-4 bg-white flex gap-3">
            <button
              onClick={handleReject}
              onTouchStart={() => triggerHaptic('light')}
              disabled={isApproving}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              <FiXCircle size={16} />
              <span>Reject</span>
            </button>
            <button
              onClick={handleApprove}
              onTouchStart={() => triggerHaptic('light')}
              disabled={isApproving}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              <FiCheckCircle size={16} />
              <span>Approve</span>
            </button>
          </div>
        )}

        {/* Already processed message */}
        {!isPending && (
          <div className={`px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2 ${
            isApproved ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-t border-blue-200' : 
            'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-t border-red-200'
          }`}>
            {isApproved ? (
              <>
                <FiCheckCircle size={16} />
                <span className="font-semibold">Already Approved</span>
              </>
            ) : (
              <>
                <FiXCircle size={16} />
                <span className="font-semibold">Already Rejected</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  //================================================== Mark announcement as read =================================================
const markAsRead = async (id) => {
  try {
    const res = await fetch("/backend/mark_read.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcement_id: id }),
    });

    const data = await res.json();
    if (data.status !== "success") {
      console.error("Mark as read failed:", data.message);
    }

    setAnnouncements(prev =>
      prev.map(a => a.id === id ? { ...a, unread: false } : a)
    );
  } catch (err) {
    console.error("Mark as read error:", err);
  }
};

  //======================================================= Mark all as read =================================================
  const markAllAsRead = async () => {
    try {
      // Reuse the single-item endpoint for all announcements
      await Promise.all(announcements.map(a => markAsRead(a.id)));
    } catch (err) {
      console.error("Mark all as read error:", err);
    }
  };

  // Toggle pin state for an announcement
  const togglePin = async (id, nextPinned) => {
    // optimistic update
    setPendingPins(prev => ({ ...prev, [id]: true }));
    const snapshot = announcements;
    setAnnouncements(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, is_pinned: nextPinned } : a);
      return [...updated].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
    });
    try {
      const res = await fetch("/backend/announcements.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", id, pinned: nextPinned })
      });
      const data = await handleApiResponse(res);
      if (data.status !== "success") {
        throw new Error(data.message || 'Pin update failed');
      }
    } catch (err) {
      // rollback
      setAnnouncements(snapshot);
      console.error("Toggle pin error:", err);
    } finally {
      setPendingPins(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const getCommentTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    return formatTimeAgo(timestamp);
  };

  // Get color based on status for consistent visual theme
  const getProgressColor = (status) => {
    if (status === 'Completed') return { 
      bg: 'from-blue-500 to-indigo-600', 
      text: 'text-blue-700', 
      badge: 'bg-blue-100', 
      border: 'border-blue-200',
      cardBg: 'bg-blue-50'
    };
    if (status === 'In Progress') return { 
      bg: 'from-blue-500 to-indigo-600', 
      text: 'text-blue-700', 
      badge: 'bg-blue-100', 
      border: 'border-blue-200',
      cardBg: 'bg-blue-50'
    };
    // Pending or other statuses
    return { 
      bg: 'from-orange-500 to-amber-600', 
      text: 'text-orange-700', 
      badge: 'bg-orange-100', 
      border: 'border-orange-200',
      cardBg: 'bg-orange-50'
    };
  };

  // Location history
  const [locationHistory, setLocationHistory] = useState([
    { id: "1", location: "Main Office", time: "09:00 AM", date: "2024-12-10" },
    { id: "2", location: "Site A", time: "10:30 AM", date: "2024-12-10" },
    { id: "3", location: "Client Office", time: "02:00 PM", date: "2024-12-10" },
    { id: "4", location: "Site B", time: "04:45 PM", date: "2024-12-10" },
  ]);

  // Collect active users from locations array.
  // thresholdMinutes: consider user active if their location.updated_at is within this many minutes
  const collectActiveUsers = (locations = [], thresholdMinutes = 2) => {
    if (!Array.isArray(locations)) return [];
    const now = Date.now();
    const threshold = thresholdMinutes * 60 * 1000;
    return locations
      .map(loc => ({
        ...loc,
        updated_at: loc.updated_at || null,
        isActive: loc.updated_at ? (now - new Date(loc.updated_at).getTime()) <= threshold : false,
      }))
      .filter(l => l.isActive)
      .map(l => ({
        ...l,
        profile_image: l.profile_image || (users.find(u => String(u.id) === String(l.user_id)) || {}).profile_image || null,
        email: l.email || (users.find(u => String(u.id) === String(l.user_id)) || {}).email || `user_${l.user_id}`
      }));
  };

  //========================================================== useEffect ==========================================================
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

  // Reset selectedUsers and search when project modal opens
  useEffect(() => {
    if (showProjectModal) {
      setSelectedUsers([]);
      setUserSearchQuery("");
    }
  }, [showProjectModal]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {  
        setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => alert("Location access denied")
    );
  }, []);


// Reusable function to fetch projects with comments
  const fetchProjectsWithComments = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch("/backend/projects.php", { credentials: "include" });
      const data = await handleApiResponse(res);

      if (!Array.isArray(data)) {
        console.error('Projects data is not an array:', data);
        setProjects([]);
        setIsLoadingProjects(false);
        return;
      }

      const normalizedProjects = data.map(project => {
        // Auto-update status to 'completed' if progress is 100%
        let projectStatus = project.status || "pending";
        if ((project.progress || 0) >= 100 && projectStatus !== 'completed') {
          projectStatus = 'completed';
          // Update on backend asynchronously
          fetch("/backend/projects.php", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              id: project.id || project.project_id,
              status: 'completed'
            })
          }).catch(err => console.error('Failed to auto-update project status:', err));
        }
        
        return {
        id: project.id || project.project_id,
        title: project.title,
        description: project.description || "",
        status: projectStatus,
        progress: project.progress || 0,
        deadline: project.deadline || "",
        manager: project.manager || "",
        budget: project.budget || 0,
        team_users: project.team_users || 0,
        assignedUsers: project.assignedUsers || project.assigned_users || [],
        startDate: project.startDate || project.start_date || project.created_at || "",
        created_at: project.created_at || "",
        comments: [],
        isNew: isProjectNew(getProjectCreatedAtValue(project), project.progress),
      };
      });

      const projectsWithComments = await Promise.all(
        normalizedProjects.map(async (project) => {
          try {
            const commentsRes = await fetch(`/backend/comments.php?project_id=${project.id}`, { 
              credentials: "include" 
            });
            
            // Check if response is OK
            if (!commentsRes.ok) {
              console.error(`HTTP error for project ${project.id}: ${commentsRes.status}`);
              const isNew = isProjectNew(getProjectCreatedAtValue(project), project.progress);
              return { ...project, comments: [], isNew };
            }
            
            // Parse as text first to catch HTML errors
            const responseText = await commentsRes.text();
            let commentsData;
            try {
              commentsData = JSON.parse(responseText);
            } catch (jsonErr) {
              console.error(`JSON parse error for project ${project.id}:`, responseText.substring(0, 200));
              const isNew = isProjectNew(getProjectCreatedAtValue(project), project.progress);
              return { ...project, comments: [], isNew };
            }
            
            const comments = commentsData.status === "success" 
              ? (commentsData.comments || []).map(c => ({
                  id: c.comment_id,
                  text: c.comment,
                  attachments: c.attachments || null,
                  time: getCommentTimeAgo(c.created_at),
                  created_at: c.created_at,
                  email: c.email,
                  profile_image: c.profile_image,
                  user: c.user || getDisplayName(c.email),
                  comment_type: c.comment_type,
                  progress: c.progress,
                  progress_id: c.progress_id,
                  approval_status: c.approval_status
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

      setProjects(projectsWithComments);
      
      // Also update selectedProject if it exists
      if (selectedProject) {
        const updatedProject = projectsWithComments.find(p => p.id === selectedProject.id);
        if (updatedProject) {
          setSelectedProject(updatedProject);
        }
      }
      
      setIsLoadingProjects(false);
    } catch (err) {
      console.error("Projects error:", err);
      setIsLoadingProjects(false);
    }
  };

useEffect(() => {
  // Initial fetch
  fetchProjectsWithComments();
  
  // Auto-refresh every 30 seconds for live updates
  const interval = setInterval(fetchProjectsWithComments, 30000);
  
  return () => clearInterval(interval);
}, []);

  //========================================================== Update location ==========================================================
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

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
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

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-600";
      case "medium": return "bg-yellow-100 text-yellow-600";
      case "low": return "bg-green-100 text-green-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const handleProfileClick = () => {
    if (isMobile) {
      setProfileOpen(true);
    } else {
      setProfileOpen(prev => !prev);
    }
  };

  const handleNotificationsClick = () => {
    // Open notifications in its own stack screen instead of switching to Home
    pushScreen('notifications');
    setSelectedFilter("unread");
    setShowAnnouncementFilterMenu(false);
    if (profileOpen) setProfileOpen(false);
    if (showActionMenu) setShowActionMenu(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (profileOpen) setProfileOpen(false);
    if (showActionMenu) setShowActionMenu(false);
  };

  const handleEditProfile = () => {
    setEditProfileData({
      name: currentUser?.name || formatAuthorName(currentUser?.email) || '',
      department: currentUser?.department || '',
      phone: currentUser?.phone || ''
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const response = await fetch('/backend/update_profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editProfileData)
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setCurrentUser(prev => ({
          ...prev,
          name: editProfileData.name,
          department: editProfileData.department,
          phone: editProfileData.phone
        }));
        setShowEditProfileModal(false);
        triggerHaptic('medium');
        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: 'Your profile has been updated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const viewProjectDetails = async (project) => {
    // Prime selected project immediately
    setSelectedProject({ ...project, comments: project.comments || [] });
    pushScreen("projectDetails", { project });

    // Fetch fresh comments for this project
    try {
      const res = await fetch(`/backend/comments.php?project_id=${project.id}`, { credentials: "include" });
      const data = await handleApiResponse(res);
      if (data.status === "success") {
        const mapped = (data.comments || []).map((c) => ({
          id: c.comment_id,
          text: c.comment,
          attachments: c.attachments || null,
          time: getCommentTimeAgo(c.created_at),
          created_at: c.created_at,
          email: c.email,
          profile_image: c.profile_image,
          user: c.user || getDisplayName(c.email),
        }));

        setSelectedProject(prev => prev ? { ...prev, comments: mapped } : prev);
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, comments: mapped } : p));
      }
    } catch (err) {
      console.error("Project comments fetch error:", err);
    }
  };

  //========================================================== Add Comment ==========================================================
  const addComment = async (projectId) => {
    if (!commentText.trim() && commentAttachments.length === 0) return;

    setIsSending(true);

    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("text", commentText);

    // Append actual files
    commentAttachments.forEach((attachment, index) => {
      formData.append("attachments[]", attachment.rawFile);
    });

    try {
      const response = await fetch("/backend/comments.php", {
        method: "POST",
        credentials: "include",
        body: formData, // FormData handles multipart/form-data automatically
      });

      const data = await response.json();
      if (data.status === "success") {
        // Create new comment with attachment file paths
        const newCommentObj = {
          id: data.comment_id || Date.now(),
          user: data.user || currentUser?.name || getDisplayName(currentUser?.email),
          text: commentText,
          time: "Just now",
          created_at: new Date().toISOString(),
          profile_image: data.profile_image || currentUser?.profile_image,
          email: data.email || currentUser?.email,
          attachments: data.attachments || null, // Get file paths from backend
        };

        // Update the local project with the new comment
        const updatedProjects = projects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              comments: [...project.comments, newCommentObj]
            };
          }
          return project;
        });
        
        setProjects(updatedProjects);
        
        // Update selectedProject if it's the current one
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject({
            ...selectedProject,
            comments: [...selectedProject.comments, newCommentObj]
          });
        }
        
        setCommentText("");
        setCommentAttachments([]);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  //========================================================== Approve/Reject Progress ==========================================================
  const handleApproveProgress = async (progressId) => {
    try {
      const formData = new FormData();
      formData.append('action', 'review_progress');
      formData.append('progress_id', progressId);
      formData.append('approval_status', 'APPROVED');

      const response = await fetch('/backend/project_progress.php', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      if (data.status === 'success') {
        // Refresh the comments to show updated approval status
        if (selectedProject) {
          const res = await fetch(`/backend/comments.php?project_id=${selectedProject.id}`, { 
            credentials: "include" 
          });
          const commentsData = await res.json();
          
          if (commentsData.status === 'success') {
            // Update the selected project with new comments
            setSelectedProject({
              ...selectedProject,
              comments: commentsData.comments.map(c => ({
                id: c.comment_id,
                user: c.user,
                text: c.comment,
                time: new Date(c.created_at).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                }),
                created_at: c.created_at,
                profile_image: c.profile_image,
                email: c.email,
                attachments: c.attachments,
                comment_type: c.comment_type,
                progress: c.progress,
                progress_id: c.progress_id,
                approval_status: c.approval_status
              }))
            });

            // Refresh projects list to update progress percentage
            await fetchProjectsWithComments();

            Swal.fire({
              title: 'Approved!',
              text: 'Progress update has been approved.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        }
      }
    } catch (error) {
      console.error('Error approving progress:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to approve progress update.',
        icon: 'error'
      });
    }
  };

  const handleRejectProgress = async (progressId) => {
    try {
      const formData = new FormData();
      formData.append('action', 'review_progress');
      formData.append('progress_id', progressId);
      formData.append('approval_status', 'REJECTED');

      const response = await fetch('/backend/project_progress.php', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      if (data.status === 'success') {
        // Refresh the comments to show updated approval status
        if (selectedProject) {
          const res = await fetch(`/backend/comments.php?project_id=${selectedProject.id}`, { 
            credentials: "include" 
          });
          const commentsData = await res.json();
          
          if (commentsData.status === 'success') {
            // Update the selected project with new comments
            setSelectedProject({
              ...selectedProject,
              comments: commentsData.comments.map(c => ({
                id: c.comment_id,
                user: c.user,
                text: c.comment,
                time: new Date(c.created_at).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                }),
                created_at: c.created_at,
                profile_image: c.profile_image,
                email: c.email,
                attachments: c.attachments,
                comment_type: c.comment_type,
                progress: c.progress,
                progress_id: c.progress_id,
                approval_status: c.approval_status
              }))
            });

            // Refresh projects list
            await fetchProjectsWithComments();

            Swal.fire({
              title: 'Rejected',
              text: 'Progress update has been rejected.',
              icon: 'info',
              timer: 2000,
              showConfirmButton: false
            });
          }
        }
      }
    } catch (error) {
      console.error('Error rejecting progress:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to reject progress update.',
        icon: 'error'
      });
    }
  };

  const addUserToProject = async (userId, userName) => {
    // Check if user is already assigned
    if (selectedProject?.assignedUsers?.includes(String(userId))) {
      Swal.fire({
        title: "User Already Assigned",
        text: `${userName} is already assigned to this project.`,
        icon: "info",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Confirmation dialog
    const result = await Swal.fire({
      title: "Add User to Project",
      text: `Are you sure you want to add ${userName} to this project?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, add user",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const formData = new FormData();
      formData.append("project_id", selectedProject.id);
      formData.append("user_id", userId);
      formData.append("action", "add");

      const response = await fetch("/backend/projects.php", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Invalid JSON response:", responseText);
        throw new Error("Server returned invalid response. Please try again.");
      }

      if (data.status === "success") {
        // Update UI
        const updatedUsers = [...(selectedProject.assignedUsers || []), String(userId)];
        setSelectedProject({
          ...selectedProject,
          assignedUsers: updatedUsers,
          team_users: updatedUsers.length,
        });

        // Update projects list
        setProjects(prev =>
          prev.map(p =>
            p.id === selectedProject.id
              ? { ...p, assignedUsers: updatedUsers, team_users: updatedUsers.length }
              : p
          )
        );

        setShowAddUserToProjectModal(false);

        Swal.fire({
          title: "Success",
          text: `${userName} has been added to the project`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(data.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to add user to project",
        icon: "error",
      });
    }
  };

  const removeUserFromProject = async (userId, userName) => {
    // Confirmation dialog
    const result = await Swal.fire({
      title: "Remove User from Project",
      text: `Are you sure you want to remove ${userName} from this project?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove user",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const formData = new FormData();
      formData.append("project_id", selectedProject.id);
      formData.append("user_id", userId);
      formData.append("action", "remove");

      const response = await fetch("/backend/projects.php", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Invalid JSON response:", responseText);
        throw new Error("Server returned invalid response. Please try again.");
      }

      if (data.status === "success") {
        // Update UI
        const updatedUsers = selectedProject.assignedUsers.filter(
          (u) => String(u) !== String(userId)
        );
        setSelectedProject({
          ...selectedProject,
          assignedUsers: updatedUsers,
          team_users: updatedUsers.length,
        });

        // Update projects list
        setProjects(prev =>
          prev.map(p =>
            p.id === selectedProject.id
              ? { ...p, assignedUsers: updatedUsers, team_users: updatedUsers.length }
              : p
          )
        );

        Swal.fire({
          title: "Removed",
          text: `${userName} has been removed from the project`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(data.message || "Failed to remove user");
      }
    } catch (error) {
      console.error("Error removing user:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to remove user from project",
        icon: "error",
      });
    }
  };

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
          rawFile: file // Store the actual file object
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
      popScreen();
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const startCameraForModal = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);

      // wait briefly for video element to mount
      for (let i = 0; i < 10; i++) {
        if (videoRef.current) break;
        await new Promise(r => setTimeout(r, 50));
      }

      if (videoRef.current) {
        try {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        } catch (e) {
          console.debug('Camera play failed:', e);
        }
      }
      return stream;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
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
            rawFile: file
          }]);
          
          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Auto-refresh comments when modal is open
  useEffect(() => {
    const isCommentsOpen = navigationStack.some(screen => [
      "comments",
      "projectUsers",
      "addUserToProject"
    ].includes(screen.screen));

    if (!isCommentsOpen || !selectedProject?.id) return;

    const refreshComments = async () => {
      try {
        const res = await fetch(`/backend/comments.php?project_id=${selectedProject.id}`, { credentials: "include" });
        
        if (!res.ok) {
          console.error(`Auto-refresh HTTP error: ${res.status}`);
          return;
        }
        
        const responseText = await res.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonErr) {
          console.error("Auto-refresh JSON parse error:", responseText.substring(0, 200));
          return;
        }
        
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
            comment_type: c.comment_type,
            progress: c.progress,
            progress_id: c.progress_id,
            approval_status: c.approval_status
          }));

          setSelectedProject(prev => prev ? { ...prev, comments: mapped } : prev);
          setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, comments: mapped } : p));
        }
      } catch (err) {
        console.error("Auto-refresh comments error:", err);
      }
    };

    // Refresh every 3 seconds
    const interval = setInterval(refreshComments, 3000);
    return () => clearInterval(interval);
  }, [navigationStack, selectedProject?.id]);

  //========================================================== Render Functions ==========================================================
  const renderAnnouncementCard = (announcement) => (
    <div 
      key={announcement.id} 
      className={`relative bg-white rounded-2xl p-4 mb-3 shadow-lg hover:shadow-xl transition-all duration-300 ${
        announcement.unread ? 'border-l-4 border-blue-500' : ''
      }`}
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
            <div className="flex items-center mt-1 gap-2">
              <span className="text-xs text-gray-500 font-semibold">Type:</span>
              <span className="text-xs text-gray-700">{announcement.category || announcement.type || '—'}</span>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs text-gray-500 font-semibold">Priority:</span>
              <span className={`text-xs font-semibold ${
                announcement.priority === 'high' ? 'text-red-500' :
                announcement.priority === 'medium' ? 'text-yellow-600' :
                announcement.priority === 'low' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {getPriorityText ? getPriorityText(announcement.priority) : (announcement.priority ? announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1) : 'Normal')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {announcement.unread && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
          <button 
            onClick={() => togglePin(announcement.id, !announcement.is_pinned)}
            onTouchStart={() => triggerHaptic('light')}
            className={(announcement.is_pinned ? "text-red-500" : "text-gray-400") + " hover:text-yellow-600"}
            title={announcement.is_pinned ? "Unpin" : "Pin"}
          >
            {pendingPins[announcement.id] ? (
              <FiLoader size={18} className="text-gray-500 animate-spin" />
            ) : (
              <MdPushPin size={18} />
            )}
          </button>
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
          <span className="text-xs text-gray-500">By: {getDisplayName(announcement.author) || '—'}</span>
        </div>
        <div className="flex items-center">
          {announcement.unread ? (
            <button 
              onClick={() => markAsRead(announcement.id)}
              onTouchStart={() => triggerHaptic('light')}
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
    const compact = isMobile;
    if (compact) {
      return (
        <div key={item.id} onClick={() => viewProjectDetails(item)} onTouchStart={() => triggerHaptic('light')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); viewProjectDetails(item); } }} className="relative bg-white rounded-2xl p-3 mb-3 shadow-md hover:shadow-lg transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 truncate">{item.title}</h4>
              <div className="text-xs text-gray-500 truncate">{item.manager} · {item.deadline}</div>
            </div>
            <div className="ml-3 flex items-center gap-2">
              <div className={`px-2 py-0.5 rounded-full ${getStatusColor(item.status)} text-white text-[11px]`}>{item.status}</div>
              <FiChevronRight size={18} className="text-gray-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-gray-500">{item.progress}%</div>
            <div className="w-2/3 ml-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${getStatusColor(item.status)}`} style={{ width: `${item.progress}%` }} />
            </div>
          </div>
        </div>
      );
    }
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
            <span></span>
            <span className="font-bold">{item.progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getStatusColor(item.status)}`}
              style={{ width: `${item.progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-gray-500">
            <div>Deadline: <span className="font-medium">{item.deadline}</span></div>
             <div>Budget: <span className="font-medium">{formatPeso(item.budget)}</span></div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => openCommentsScreen(item)}
              onTouchStart={() => triggerHaptic('light')}
              className="flex items-center text-xs text-gray-500 relative hover:text-blue-500 transition-colors"
            >
              <MdComment size={14} className="mr-1" />
              {item.comments.length}
              {getUnreadCommentCount(item.id) > 0 && (
                <div className="absolute -top-0.5 -right-0.1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </button>
            <button 
              onClick={() => viewProjectDetails(item)}
              onTouchStart={() => triggerHaptic('light')}
              className="text-blue-500 text-sm font-medium flex items-center"
            >
              Task Details <FiChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectDetailsModal = () => (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-in-right transition-colors duration-300">
      {/* Messenger-style Header (back, avatar, inline breadcrumb, status + users button) */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 shadow-sm transition-colors duration-300">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={popScreen}
                className="p-3 rounded-full min-w-[56px] min-h-[56px] hover:bg-white-400 mr-0"
              >
                <IoMdArrowBack size={20} className="text-white-700" />
              </button>
              <h3 className="text-xl font-bold">Task Details</h3>
            </div>

            <div className="flex items-center gap-2">
              {selectedProject && (
                <span className={`px-3 py-1 rounded-full ${getStatusColor(selectedProject.status)} text-white text-xs inline-block flex-shrink-0`}>
                  {selectedProject.status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

   {/* Sub-header / Breadcrumb bar (outside sticky header for clearer layout) */}
      <div className="pl-8 pr-2 py-2 bg-transparent border-b-0 text-xs text-gray-600">
        <nav className="flex items-center gap-2">
          <button onClick={() => { popScreen(); setActiveTab('Home'); }} className="hover:text-blue-600 transition-colors">Home</button>
          <FiChevronRight size={12} className="text-gray-400" />
          <button onClick={popScreen} className="hover:text-blue-600 transition-colors">Projects</button>
          <FiChevronRight size={12} className="text-gray-400" />
          <span className="text-gray-800 font-medium truncate max-w-[260px]">Details</span>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        
        {selectedProject && (
          <>
            {/* Title and Status */}
            <div className="flex flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 flex-1">{selectedProject.title}</h4>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-3 sm:space-y-5">
                {/* Assigned Employees */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 sm:mb-3 uppercase tracking-wide">Assigned Employees</p>
                  <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 min-h-[150px] sm:min-h-[200px] overflow-y-auto flex flex-wrap gap-1 sm:gap-2 items-start content-start transition-colors duration-300">
                    {users.length > 0 && selectedProject.assignedUsers && selectedProject.assignedUsers.length > 0 ? selectedProject.assignedUsers.map(userId => {
                      const user = users.find(u => String(u.id) === String(userId));
                      return user ? (
                        <div key={userId} className="flex items-center bg-blue-100 text-blue-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs">
                          <Avatar user={user} size={32} />
                          <span className="ml-0.5 sm:ml-1 hidden sm:inline"> {formatAuthorName(user.email, user)}</span>
                        </div>
                      ) : null;
                    }) : <p className="text-sm text-gray-500 w-full">None</p>}
                  </div>
                </div>

                {/* Description - Hidden on Mobile, Shown on Desktop */}
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Description</p>
                  <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 transition-colors duration-300">{selectedProject.description}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3 sm:space-y-5">
                {/* Manager */}
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200 transition-colors duration-300">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Manager</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{selectedProject.manager}</p>
                </div>

                {/* Team Users */}
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200 transition-colors duration-300">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Team Users</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm">{selectedProject.team_users || 0} users</p>
                </div>

                {/* Budget */}
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200 transition-colors duration-300">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Budget</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{formatPeso(selectedProject.budget)}</p>
                </div>

                {/* Deadline */}
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200 transition-colors duration-300">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Deadline</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm">{selectedProject.deadline}</p>
                </div>
              </div>
            </div>

            {/* Description - Full Width on Mobile */}
            <div className="sm:hidden mb-6">
              <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Description</p>
              <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 transition-colors duration-300">{selectedProject.description}</p>
            </div>

            {/* Comments Section - Preview */}
            <div className="mb-4">
              <button
                onClick={() => openCommentsScreen(selectedProject)}
                onTouchStart={() => triggerHaptic('light')}
                className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl p-4 transition-all border border-blue-200"
              >
                <div className="flex items-center justify-between">
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
                        {selectedProject.comments.length > 0 
                          ? `${selectedProject.comments.length} comment${selectedProject.comments.length !== 1 ? 's' : ''}`
                          : 'No comments yet. Start a conversation'}
                      </p>
                    </div>
                  </div>
                  <FiChevronRight size={24} className="text-blue-500" />
                </div>
              </button>
            </div>

            {/* Task Progress Button */}
            <div className="mb-6">
              <button
                onClick={() => openTaskProgressScreen(selectedProject)}
                onTouchStart={() => triggerHaptic('light')}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-sky-50 to-cyan-50 hover:from-sky-100 hover:to-cyan-100 rounded-xl transition-all border border-sky-200 hover:border-sky-300 hover:shadow-md"
              >
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                  <MdTimeline className="text-white" size={24} />
                </div>
                <div className="text-left flex-1">
                  <h4 className="text-md font-bold text-gray-800">Task Progress</h4>
                  <p className="text-sm text-gray-600">Track project milestones and updates</p>
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
  <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-in-right transition-colors duration-300">
    {/* Messenger-style Header */}
      <div className="sticky top-0 z-20 bg-white px-4 py-3 flex items-center border-b border-gray-200 shadow-sm transition-colors duration-300">
        <button 
        onClick={() => popScreen()}
        onTouchStart={() => triggerHaptic('light')}
        className="p-3 rounded-full min-w-[56px] min-h-[56px] hover:bg-gray-100 mr-2 transition-colors flex-shrink-0"
        >
        <IoMdArrowBack size={24} className="text-gray-700" />
        </button>
        
        <Avatar 
        user={currentUser}
        size={40}
        className="flex-shrink-0 mr-2"
        />
        
        {/* Title + Call/Video actions */}
        <div className="flex-1 flex items-center justify-between ml-2">
          <span className="text-gray-800 font-medium">Comments</span>
          <div className="flex items-center gap-2">
            <button title="Voice call" onTouchStart={() => triggerHaptic('light')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <MdCall size={18} className="text-gray-700" />
            </button>
            <button title="Video call" onTouchStart={() => triggerHaptic('light')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <MdVideocam size={18} className="text-gray-700" />
            </button>
          </div>
        </div>
        
        <button 
        onClick={() => pushScreen("projectUsers")}
        onTouchStart={() => triggerHaptic('light')}
        className="p-3 rounded-full min-w-[56px] min-h-[56px] hover:bg-gray-100 transition-colors ml-2"
        title="View and manage project users"
        >
        <MdPeople size={20} className="text-gray-600" />
        </button>
      </div>
    
      {(() => {
        const currentScreen = getCurrentScreen();
        const isNestedCommentScreen = currentScreen?.screen === "projectUsers" || currentScreen?.screen === "addUserToProject";

        if (!isNestedCommentScreen) return null;

        return (
          <div className="fixed inset-0 bg-white z-40 flex flex-col animate-slide-in-right">
            {/* Dynamic Header */}
            <div className="sticky top-0 z-20 bg-white text-gray-900 px-4 sm:px-5 py-4 border-b border-gray-200 flex items-center">
              <button 
                onClick={popScreen}
                onTouchStart={() => triggerHaptic('light')}
                className="p-3 rounded-full min-w-[56px] min-h-[56px] hover:bg-gray-100 mr-3"
              >
                <IoMdArrowBack size={24} className="text-gray-700" />
              </button>
              <h3 className="text-xl font-bold text-gray-900">
                {currentScreen?.screen === "projectUsers" ? "Project Team" : "Add Users to Project"}
              </h3>
            </div>

            {/* Dynamic Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {/* Project Users Screen */}
              {currentScreen?.screen === "projectUsers" && (
                <div className="space-y-4">
                  {/* Add User Button */}
                  <button
                    onClick={() => pushScreen("addUserToProject")}
                    onTouchStart={() => triggerHaptic('light')}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all"
                  >
                    <MdAdd size={20} className="mr-2" />
                    Add User to Project
                  </button>

                  {/* Current Team Members */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">Team Members</h4>
                    <div className="space-y-3">
                      {selectedProject?.assignedUsers && selectedProject.assignedUsers.length > 0 ? (
                        selectedProject.assignedUsers.map(userId => {
                          const user = users.find(u => String(u.id) === String(userId));
                          return user ? (
                            <div key={userId} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                              <div className="flex items-center flex-1">
                                <Avatar user={user} size={40} />
                                <div className="ml-3 flex-1">
                                  <p className="font-medium text-gray-800">{formatAuthorName(user.email, user)}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeUserFromProject(user.id, formatAuthorName(user.email, user))}
                                onTouchStart={() => triggerHaptic('light')}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Remove user"
                              >
                                <IoMdClose size={20} />
                              </button>
                            </div>
                          ) : null;
                        })
                      ) : (
                        <div className="text-center py-8">
                          <MdPeople size={40} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-600 font-medium">No users assigned</p>
                          <p className="text-sm text-gray-400">Add users to this project</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Add User to Project Screen */}
              {currentScreen?.screen === "addUserToProject" && (
                <div className="space-y-3">
                  {users.filter(user => !selectedProject?.assignedUsers?.includes(String(user.id))).length > 0 ? (
                    users.filter(user => !selectedProject?.assignedUsers?.includes(String(user.id))).map(user => (
                      <button
                        key={user.id}
                        onClick={() => addUserToProject(user.id, formatAuthorName(user.email, user))}
                        onTouchStart={() => triggerHaptic('light')}
                        className="w-full flex items-center p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <Avatar user={user} size={40} />
                        <div className="ml-3 flex-1 text-left">
                          <p className="font-medium text-gray-800">{formatAuthorName(user.email, user)}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                          <MdAdd size={16} className="text-blue-500" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MdPeople size={40} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-600 font-medium">All users are already assigned</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
              // Only show if there are more than 3 dates
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
                      <span className="mx-3 text-xs text-gray-600 dark:text-gray-200 font-medium">{dateLabel}</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                  )}
                  
                  {/* Comments for this date */}
                  {groupedComments[dateLabel].map((comment, idx) => {
                    const isCurrentUser = comment.email === currentUser?.email;
                    const commentUser = isCurrentUser ? currentUser : users.find(u => u.email === comment.email);
                    
                    // Check if previous comment is from the same user
                    const previousComment = idx > 0 ? groupedComments[dateLabel][idx - 1] : null;
                    const previousUserEmail = previousComment?.email;
                    const showUserLabel = previousUserEmail !== comment.email;
                    
                    // Render Progress Approval Card for progress comments
                    if (comment.comment_type === 'progress' && comment.progress) {
                      return (
                        <div key={comment.id} className="flex justify-start mb-4">
                          <div className="flex max-w-[90%]">
                            <div className="flex-shrink-0 mr-2 self-start mt-2">
                              <Avatar 
                                user={{
                                  ...commentUser,
                                  profile_image: comment.profile_image || commentUser?.profile_image
                                }} 
                                size={32} 
                              />
                            </div>
                            <div className="flex flex-col">
                              {showUserLabel && (
                                <span className="text-xs text-gray-600 font-medium mb-1 ml-1">
                                  {comment.user || "User"}
                                </span>
                              )}
                              <ProgressApprovalCard
                                comment={comment}
                                onApprove={handleApproveProgress}
                                onReject={handleRejectProgress}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Regular text/attachment messages
                    return (
                      <div key={comment.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}>
                        <div className={`flex max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                          {!isCurrentUser && (
                            <div className="flex-shrink-0 mr-2 self-end">
                              <Avatar 
                                user={{
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
                            
                            {/* Text message with bubble */}
                            {comment.text && (
                              <div className={`relative rounded-2xl px-4 py-2 max-w-[280px] ${
                                isCurrentUser 
                                  ? 'bg-blue-500 text-white rounded-br-sm' 
                                  : 'bg-white text-gray-800 rounded-bl-sm shadow'
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
                            )}
                            
                            {/* Images and attachments: render image files as plain images (no chat bubble) */}
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
                                    <div key={idx} className={`relative rounded-2xl px-4 py-2 ${
                                      isCurrentUser 
                                        ? 'bg-blue-500 text-white rounded-br-sm' 
                                        : 'bg-white text-gray-800 rounded-bl-sm shadow'
                                    }`}>
                                      <a
                                        href={att.path || att.data}
                                        download={att.name}
                                        className="flex items-center text-sm"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <FiPaperclip size={16} className="mr-2 flex-shrink-0" />
                                        <span className="truncate flex-1">{att.name}</span>
                                        <span className="text-xs opacity-75 ml-2">
                                          {(att.size / 1024).toFixed(1)}KB
                                        </span>
                                      </a>
                                    </div>
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
  <div className="flex items-center flex-1 bg-gray-100 rounded-full px-4 py-2.5 shadow border-gray-200">

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

  const renderAnnouncementModal = () => (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-end z-50">
      <div className="bg-white rounded-t-3xl p-4 sm:p-5 w-full max-h-[90%] overflow-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800">Create New Announcement</h3>
          <button 
            onClick={() => setShowAnnouncementModal(false)}
            className="p-3 rounded-full min-w-[56px] min-h-[56px] bg-gray-100 hover:bg-gray-200"
          >
            <IoMdClose size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="Enter announcement title"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              placeholder="Enter announcement content"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={announcementType}
                onChange={(e) => setAnnouncementType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
                <option value="safety">Safety</option>
                <option value="update">Update</option>
                <option value="question">Question</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={announcementPriority}
                onChange={(e) => setAnnouncementPriority(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={createAnnouncement}
          className={`w-full py-4 rounded-full font-bold text-white ${
            announcementTitle.trim() && announcementContent.trim() && !isCreatingAnnouncement
              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!announcementTitle.trim() || !announcementContent.trim() || isCreatingAnnouncement}
        >
          <div className="flex items-center justify-center">
            {isCreatingAnnouncement ? (
              <>
                <svg className="w-5 h-5 animate-spin mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Publishing...
              </>
            ) : (
              'Publish Announcement'
            )}
          </div>
        </button>
      </div>
    </div>
  );

  const renderProjectModal = () => (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 md:px-5 py-3 md:py-4 flex items-center text-white shadow-lg">
          <button 
          onClick={() => setShowProjectModal(false)}
          className="p-3 rounded-full min-w-[44px] min-h-[44px] hover:bg-white/20 mr-3 transition-colors flex-shrink-0"
        >
          <IoMdArrowBack size={24} />
        </button>
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-bold">Create New Task</h3>
          <p className="text-xs opacity-90">Fill in the task details</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md]:p-5 bg-white">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task *
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Enter employee task"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description/Locations *
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={projectStatus}
              onChange={(e) => setProjectStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50"
            >
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employees
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {selectedUsers.length > 0 ? selectedUsers.map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;

                const displayName = formatAuthorName(user.email, user);

                return (
                  <div key={userId} className="flex items-center bg-blue-50 rounded-full px-3 py-1 border">
                    <img 
                      src={user.profile_image} 
                      className="w-6 h-6 rounded-full mr-2" 
                      alt={displayName}
                    />
                    <span className="text-sm text-gray-700">{displayName}</span>
                  </div>
                );
              }) : (
                <p className="text-sm text-gray-500">Select Assigned Users</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={projectStartDate}
                  onChange={(e) => setProjectStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline *
                </label>
                <input
                  type="date"
                  value={projectDeadline}
                  onChange={(e) => setProjectDeadline(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
          </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Managed by: *
                </label>
                <input
                  type="text"
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  placeholder="Project manager"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
            

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-medium">₱</span>
                  <input
                    type="text"
                    value={projectBudget}
                    onChange={handleBudgetChange}
                    placeholder="50,000"
                    className="w-full p-3 pl-8 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Users *
            </label>
            
            {/* Search Input */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search employees by name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-sm"
              />
            </div>

            {/* Selected Users Chips */}
            {selectedUsers.length > 0 && (
              <div className="mb-4 pb-3 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <div
                        key={userId}
                        className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium"
                      >
                        <span>{formatAuthorName(user.email, user)}</span>
                        <button
                          onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                          className="text-blue-500 hover:text-blue-800 font-bold ml-1"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Users List */}
            <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
              {users
                .filter(user =>
                  formatAuthorName(user.email, user)
                    .toLowerCase()
                    .includes(userSearchQuery.toLowerCase()) ||
                  user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                )
                .length > 0 ? (
                users
                  .filter(user =>
                    formatAuthorName(user.email, user)
                      .toLowerCase()
                      .includes(userSearchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                  )
                  .map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors last:border-b-0"
                      onClick={() => {
                        if (selectedUsers.includes(user.id)) {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        } else {
                          setSelectedUsers([...selectedUsers, user.id]);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => {}}
                        className="w-4 h-4 cursor-pointer accent-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {formatAuthorName(user.email, user)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No employees found
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Selected: {selectedUsers.length} employee{selectedUsers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={() => {
            // Strict validation
            const errors = [];
            
            if (!projectTitle.trim()) {
              errors.push("Task name is required");
            }
            if (!projectDeadline.trim()) {
              errors.push("Deadline is required");
            }
            if (!projectManager.trim()) {
              errors.push("Manager is required");
            }
            if (!projectBudget.trim()) {
              errors.push("Budget is required");
            }
            if (selectedUsers.length === 0) {
              errors.push("At least one employee must be assigned");
            }

            if (errors.length > 0) {
              Swal.fire({
                title: "Missing Required Fields",
                html: errors.map(e => `<div>• ${e}</div>`).join(""),
                icon: "warning",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "OK",
              });
              return;
            }

            // All fields are filled, proceed with creation
            if (!isCreatingProject) createProject();
          }}
          className={`w-full py-4 rounded-xl font-bold text-white ${
            projectTitle.trim() && 
            projectDeadline.trim() && 
            projectManager.trim() && 
            projectBudget.trim() && 
            selectedUsers.length > 0
              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer"
              : "bg-gray-400 cursor-not-allowed opacity-60"
          }`}
          disabled={
            !projectTitle.trim() || 
            !projectDeadline.trim() || 
            !projectManager.trim() || 
            !projectBudget.trim() || 
            selectedUsers.length === 0 ||
            isCreatingProject
          }
        >
          <div className="flex items-center justify-center">
            {isCreatingProject ? (
              <>
                <svg className="w-5 h-5 animate-spin mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <MdAddTask className="mr-2" />
                Create Project
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );

  const renderLocationHistory = (item) => (
    <div key={item.id} className="bg-white rounded-2xl p-4 mb-3 shadow flex items-center">
      <div className="w-11 h-11 rounded-full bg-blue-50 flex justify-center items-center mr-3">
        <MdLocationOn size={24} className="text-blue-500" />
      </div>
      <div className="flex-1">
        <div className="font-medium mb-1">{item.location}</div>
        <div className="flex items-center text-xs text-gray-500">
          <span>{item.time}</span>
          <span className="ml-3">{item.date}</span>
        </div>
      </div>
    </div>
  );

  // Utility to check if a location entry is considered active (recent update)
  const isUserActive = (loc, thresholdMinutes = 2) => {
    if (!loc || !loc.updated_at) return false;
    try {
      const updated = new Date(loc.updated_at).getTime();
      return (Date.now() - updated) <= (thresholdMinutes * 60 * 1000);
    } catch (e) {
      return false;
    }
  };

  // Render function for Active Locations panel (isolated from hidden/map state)
  const renderActiveEmployeeLocation = (employee) => {
    const isActive = isUserActive(employee, 2);

    const handleCardClick = () => {
      setViewState({
        longitude: employee.longitude,
        latitude: employee.latitude,
        zoom: 16,
        transitionDuration: 800,
        pitch: 0,
        bearing: 0
      });
    };

    return (
      <div
        key={`active-${employee.user_id}`}
        onClick={handleCardClick}
        className={`bg-white rounded-2xl p-4 mb-3 shadow hover:shadow-lg transition-all cursor-pointer flex items-center gap-3`}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-blue-100 relative">
          {employee.profile_image ? (
            <img
              src={employee.profile_image}
              alt={employee.email}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">{employee.email?.charAt(0).toUpperCase() || '?'}</span>
            </div>
          )}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isActive ? 'bg-green-500' : 'bg-red-500'}`} title={isActive ? 'Online' : 'Offline'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 mb-1 truncate">{formatAuthorName(employee.email, employee)}</div>
          <div className="flex items-center text-xs text-gray-500 gap-1">
            <MdLocationOn size={14} className="text-blue-500 flex-shrink-0" />
            <span className="truncate">{employee.location_name || `${employee.latitude?.toFixed(4)}, ${employee.longitude?.toFixed(4)}`}</span>
          </div>
          {employee.updated_at && (
            <div className="text-xs text-gray-400 mt-1">Updated: {formatTimeAgo(employee.updated_at)}</div>
          )}
        </div>
        <div className="flex-shrink-0 ml-3">
          {isActive ? (
            <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Online</span>
          ) : (
            <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Offline</span>
          )}
        </div>
      </div>
    );
  };

  const renderEmployeeLocation = (employee) => {
    const isHidden = hiddenEmployees.has(employee.user_id);
    const isActive = activeUsers.some(a => String(a.user_id) === String(employee.user_id));
    
    const handleCardClick = () => {
      // Calculate the visible map area accounting for the bottom sheet (65% of screen height)
      // The map occupies: top (header ~80px) to bottom - (65% sheet height)
      // Center point should be at the middle of the available map space, not the screen center
      const viewportHeight = window.innerHeight;
      const bottomSheetHeight = viewportHeight * 0.65;
      const availableMapHeight = viewportHeight - bottomSheetHeight - 80; // 80px for top header
      const mapCenterOffset = availableMapHeight / 2;
      
      // This will cause the marker to appear centered in the visible map area
      // Mapbox will automatically adjust the latitude offset to account for viewport
      setViewState({
        longitude: employee.longitude,
        latitude: employee.latitude,
        zoom: 16,
        transitionDuration: 800,
        pitch: 0,
        bearing: 0
      });
    };

    const handleEyeClick = () => {
      // Toggle hide/show
      setHiddenEmployees(prev => {
        const newSet = new Set(prev);
        if (newSet.has(employee.user_id)) {
          newSet.delete(employee.user_id);
        } else {
          newSet.add(employee.user_id);
        }
        return newSet;
      });
      // Also center map on this employee with proper offset
      setTimeout(() => {
        handleCardClick();
      }, 100);
    };

    return (
    <div 
      key={employee.user_id} 
      onClick={handleCardClick}
      className={`bg-white rounded-2xl p-4 mb-3 shadow hover:shadow-lg transition-all cursor-pointer active:scale-95 ${isHidden ? 'opacity-50 hover:bg-gray-50' : 'hover:bg-blue-50'} flex items-center gap-3`}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-blue-100 relative">
        {employee.profile_image ? (
          <img
            src={employee.profile_image}
            alt={employee.email}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="w-full h-full bg-blue-100 flex items-center justify-center" style={{ display: employee.profile_image ? 'none' : 'flex' }}>
          <span className="text-blue-600 font-bold text-sm">
            {employee.email?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>
        {/* Status dot: green if active, red if offline */}
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isActive ? 'bg-green-500' : 'bg-red-500'}`} title={isActive ? 'Online' : 'Offline'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800 mb-1 truncate">
          {formatAuthorName(employee.email, employee)}
        </div>
        <div className="flex items-center text-xs text-gray-500 gap-1">
          <MdLocationOn size={14} className="text-blue-500 flex-shrink-0" />
          <span className="truncate">{employee.location_name || `${employee.latitude?.toFixed(4)}, ${employee.longitude?.toFixed(4)}`}</span>
        </div>
        {employee.updated_at && (
          <div className="text-xs text-gray-400 mt-1">
            Updated: {formatTimeAgo(employee.updated_at)}
          </div>
        )}
      </div>
      <button
        onClick={handleEyeClick}
        className={`p-2 rounded-full flex-shrink-0 transition-all hover:scale-110 shadow border ${
          isHidden 
            ? 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-100' 
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100'
        }`}
        title={isHidden ? "Show on map" : "Hide from map"}
      >
        {isHidden ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  );
  };

  // Shimmer/Skeleton Loading Component
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
    const filteredProjects = selectedFilter === "all" ? projects : projects.filter(p => p.status === selectedFilter);
    
    switch (activeTab) {
      case "Home":
        return (
          <div className="p-4 sm:p-5">
            {/* Stats Cards - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
              {isLoadingProjects || isLoadingAnnouncements ? (
                <>
                  <ShimmerStatsCard />
                  <ShimmerStatsCard />
                </>
              ) : (
                <>
                  {/* Active Projects Card */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-2xl transition-transform transform-gpu hover:-translate-y-1 active:scale-95 touch-manipulation">
                    <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/3 opacity-10 pointer-events-none"></div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                      <div className="flex-1">
                        <div className="text-4xl sm:text-5xl font-extrabold leading-none mb-1 drop-shadow">{projects.length}</div>
                        <div className="text-xs sm:text-sm opacity-95 font-semibold">Active Tasks</div>
                      </div>
                      <div className="w-14 h-14 flex items-center justify-center bg-white/10 rounded-full ring-1 ring-white/20">
                        <MdDashboard size={26} className="text-white" />
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="mt-4 pt-3 border-t border-white/20 relative z-10">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="opacity-90">Progress</span>
                        <span className="font-semibold">{Math.round(projects.filter(p => p.status === 'completed').length / Math.max(projects.length, 1) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-white/70 via-white/40 to-white/20 rounded-full transition-all duration-700"
                          style={{ width: `${Math.round(projects.filter(p => p.status === 'completed').length / Math.max(projects.length, 1) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Announcements Card */}
                 <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-2xl transition-transform transform-gpu hover:-translate-y-1 active:scale-95 touch-manipulation">
                    <div className="absolute -top-6 -right-4 w-28 h-28 rounded-full bg-white/6 blur-2xl pointer-events-none"></div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                      <div className="flex-1">
                        <div className="text-4xl sm:text-5xl font-extrabold leading-none mb-1 drop-shadow">{announcements.length}</div>
                        <div className="text-xs sm:text-sm opacity-95 font-semibold">Announcements</div>
                      </div>
                      <div className="w-14 h-14 flex items-center justify-center bg-white/10 rounded-full ring-1 ring-white/20 relative">
                        <IoMdMegaphone size={26} className="text-white" />
                        {unreadCount > 0 && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center font-bold shadow-lg">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="flex items-center justify-between text-xs">
                        <span className="opacity-80">Unread:</span>
                        <span className="font-semibold">{unreadCount} new</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            

            {/* Recent Announcements */}
            <div className="mb-8">
              {/* Search and Filter Bar */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {/* Results counter (announcements) */}
                {(searchQuery || dateFilter !== 'all') && (
                  <div className="flex items-center text-sm text-gray-600 px-2">
                    {filteredAnnouncements.length} result{filteredAnnouncements.length !== 1 ? 's' : ''}
                  </div>
                )}
                
                {/* Compact Date Filter Icon Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowDateFilterMenu(!showDateFilterMenu)}
                    className="h-[52px] w-[52px] flex items-center justify-center bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow"
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
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-slide-up">
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
              
              {/* Current Date Display and Active Date Filter Label */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                {/* Current Date */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-300">
                  <span className="text-sm font-medium text-gray-700">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                
                {/* Active Date Filter Label */}
                {dateFilter !== "all" && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <MdCalendarToday size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      Filter: {
                        dateFilter === "today" ? "Today" :
                        dateFilter === "week" ? "This Week" :
                        dateFilter === "month" ? "This Month" :
                        dateFilter === "custom" && customDateRange.start && customDateRange.end 
                          ? `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}`
                          : "All Time"
                      }
                    </span>
                    <button
                      onClick={() => { 
                        setDateFilter("all");
                        setCustomDateRange({ start: null, end: null });
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800 font-semibold text-lg leading-none"
                      title="Clear date filter"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              
              {/* Announcement Header */}
              <div className="flex justify-between items-center mb-4">
               <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
                        <div className="w-1.5 h-9 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                        Announcements
                      </h2>
                {/* Announcement Status Filter Dropdown */}
                <div className="relative">
                    <button
                      ref={announcementFilterBtnRef}
                      onClick={() => setShowAnnouncementFilterMenu(!showAnnouncementFilterMenu)}
                      className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center 
                        ${showAnnouncementFilterMenu ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-blue-50 border-blue-300 text-blue-700'}`}
                      aria-label="Announcement filters"
                      title="Announcement filters"
                    >
                      <FiMoreVertical size={18} className="text-blue-700" />
                    </button>

                    {/* Bottom Sheet Filter Menu */}
                    {showAnnouncementFilterMenu && (
                      <div
                        ref={announcementFilterMenuRef}
                        className="fixed left-0 right-0 bottom-0 h-[68vh] bg-white rounded-t-3xl shadow-2xl border border-gray-200 z-50 overflow-y-auto animate-slide-up"
                      >
                          <div className="p-2">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2"></div>
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-lg font-semibold text-gray-800">Filter announcements</h3>
                              <button
                                onClick={() => setShowAnnouncementFilterMenu(false)}
                                className="p-2 rounded-full hover:bg-gray-100"
                                aria-label="Close filters"
                              >
                                <IoMdClose size={20} className="text-gray-600" />
                              </button>
                            </div>
                          </div>
                          <div className="px-2 pb-2">
                          <button
                          onClick={() => {
                            setSelectedFilter("unread");
                            setShowAnnouncementFilterMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            selectedFilter === "unread"
                              ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                              : "text-blue-700 hover:bg-blue-50"
                          }`}
                        >
                          <FaRegBell size={18} className="text-blue-600" />
                          <span>Unread</span>
                          {selectedFilter === "unread" && <IoMdCheckmarkCircle size={18} className="ml-auto text-blue-600" />}
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedFilter("important");
                            setShowAnnouncementFilterMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            selectedFilter === "important"
                              ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                              : "text-blue-700 hover:bg-blue-50"
                          }`}
                        >
                          <MdPriorityHigh size={18} className="text-blue-600" />
                          <span>Important</span>
                          {selectedFilter === "important" && <IoMdCheckmarkCircle size={18} className="ml-auto text-blue-600" />}
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedFilter("pinned");
                            setShowAnnouncementFilterMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            selectedFilter === "pinned"
                              ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                              : "text-blue-700 hover:bg-blue-50"
                          }`}
                        >
                          <MdPushPin size={18} className="text-blue-600" />
                          <span>Pinned</span>
                          {selectedFilter === "pinned" && <IoMdCheckmarkCircle size={18} className="ml-auto text-blue-600" />}
                        </button>
                        
                        <div className="border-t border-gray-200"></div>
                        
                        <button
                          onClick={() => {
                            setSelectedFilter("all");
                            setShowAnnouncementFilterMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            selectedFilter === "all"
                              ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                              : "text-blue-700 hover:bg-blue-50"
                          }`}
                        >
                          <MdCheckCircle size={18} className="text-blue-600" />
                          <span>All</span>
                          {selectedFilter === "all" && <IoMdCheckmarkCircle size={18} className="ml-auto text-blue-600" />}
                        </button>
                        </div>
                      </div>
                    )}
                </div>
              </div>
              
              {/* Date Picker Modal - Always shows at top */}
              {showDatePicker && (
                <div 
                  className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20 overflow-hidden" 
                  onClick={() => setShowDatePicker(false)}
                  style={{ touchAction: 'none' }}
                >
                  <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Select Date Range</h3>
                      <button onClick={() => setShowDatePicker(false)} className="p-1 hover:bg-gray-100 rounded-full">
                        <IoMdClose size={24} className="text-gray-600" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
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
              
              {isLoadingAnnouncements ? (
          <>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </>
              ) : (
          <>
            {filteredAnnouncements.length > 0 ? (
              <>
                {selectedFilter === "all" ? filteredAnnouncements.map(renderAnnouncementCard) : filteredAnnouncements.slice(0, 4).map(renderAnnouncementCard)}
                {filteredAnnouncements.length > 4 && selectedFilter !== "all" && (
                  <button 
                    className="w-full py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
                    onClick={() => setSelectedFilter("all")}
                  >
                    View all announcements
                  </button>
                )}
              </>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-10 text-center shadow border border-gray-200">
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
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="mt-4 px-4 py-3 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition-all"
                >
                  Create Announcement
                </button>
              </div>
            )}
          </>
              )}
            </div>
          </div>
        );

      case "Projects":
        const totalProjects = projects.length;
        const ongoingProjects = projects.filter(p => p.status === "ongoing").length;
        const completedProjects = projects.filter(p => p.status === "completed").length;
        const pendingProjects = projects.filter(p => p.status === "pending").length;
        
        return (
          <div className="p-4 sm:p-5">
            {/* My Tasks Overview - Enhanced Stats Card */}
            {isLoadingProjects ? (
              <div className="bg-gradient-to-br from-gray-300 to-gray-200 rounded-2xl p-5 mb-6 shadow-lg animate-pulse h-40"></div>
            ) : (
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                
                <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
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

            {/* Filter Buttons with counts, scroll-snap and active underline */}
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
                          onClick={() => setSelectedFilter(status)}
                          role="tab"
                          aria-pressed={selectedFilter === status}
                          onKeyDown={(e) => {
                            // Allow Enter/Space to activate and Arrow navigation
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedFilter(status);
                              return;
                            }
                            const keys = ['ArrowLeft','ArrowRight'];
                            if (keys.includes(e.key)) {
                              e.preventDefault();
                              const keysArr = Object.keys(statusLabels);
                              const idx = keysArr.indexOf(status);
                              const nextIdx = e.key === 'ArrowRight' ? Math.min(keysArr.length-1, idx+1) : Math.max(0, idx-1);
                              const nextStatus = keysArr[nextIdx];
                              const container = filterButtonsRef.current;
                              const btn = container?.querySelectorAll('button')[nextIdx];
                              btn?.focus();
                            }
                          }}
                          className={`px-2 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${selectedFilter === status ? 'text-blue-600' : 'text-gray-600'}`}
                        >
                          <div className="flex items-baseline gap-2">
                            <span>{statusLabels[status]}</span>
                            <span className="text-xs text-gray-400">{statusCounts[status] ?? 0}</span>
                          </div>
                        </button>
                        <div className="h-0.5 mt-2">
                          <div className={`mx-auto transition-all duration-300 ${selectedFilter === status ? 'bg-blue-600 w-16 rounded-full h-0.5' : 'w-0'}`} />
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
                <>
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                </>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map(renderProjectCard)
              ) : (
                (() => {
                  if (selectedFilter !== "all") {
                    return (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 text-center shadow border border-gray-200">
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
                    );
                  } else {
                    return (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 text-center shadow border border-gray-200">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MdDashboard size={40} className="text-blue-400" />
                        </div>
                        <p className="text-gray-700 font-semibold text-lg">No Tasks Assigned Yet</p>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">Tasks will appear here when you create them. Get started by adding a new task.</p>
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={() => setShowProjectModal(true)}
                            className="px-4 py-3 bg-purple-600 text-white rounded-full font-semibold shadow hover:bg-purple-700 transition-all"
                          >
                            Add New Task
                          </button>
                        </div>
                      </div>
                    );
                  }
                })()
              )}
            </div>
          </div>
        );

      case "My Location":
        return (
          <div className="relative h-full w-full">
            <div className="flex flex-col h-full overflow-hidden">
            {/* Location Header */}
            <div ref={headerRef} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-5 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <button
                    className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors mr-3"
                    onClick={() => handleTabChange("Home")}
                    aria-label="Back"
                    title="Back"
                  >
                    <IoMdArrowBack size={24} />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold">Task Location</h2>
                    <p className="text-blue-100 text-sm mt-1">Track and manage Task locations</p>
                  </div>
                </div>
                <button
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors"
                  onClick={() => {
                    setNavigationStack(prev => [...prev, { screen: 'mapView' }]);
                  }}
                >
                  <MdLocationOn size={24} />
                </button>
              </div>

              {/* Current Location Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-4 border border-white/20">
                <div className="text-sm text-blue-100 mb-1">Employee Location</div>
                <div className="text-2xl font-bold">{currentLocation}</div>
              </div>
            </div>

            {/* Active Locations (uses live active users) */}
            <div className="p-4 sm:p-5" style={{ height: activeListHeight, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Active Locations</h3>
                  {(() => {
                    const projectData = getCurrentScreen()?.data;
                    let locationsToCount = otherUsersLocations;
                    if (projectData?.projectId && selectedProject?.assignedUsers) {
                      locationsToCount = otherUsersLocations.filter(loc => selectedProject.assignedUsers.includes(String(loc.user_id)));
                    }
                    const onlineCount = locationsToCount.filter(l => isUserActive(l, 2)).length;
                    const offlineCount = Math.max(0, locationsToCount.length - onlineCount);
                    return (
                      <div className="text-xs text-gray-500 mt-1">{onlineCount} online · {offlineCount} offline</div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  
                  
                  
                </div>
              </div>

              <div>
                {(() => {
                  const projectData = getCurrentScreen()?.data;

                  if (showAllLocations) {
                    // Show full list filtered by project if applicable
                    let locationsToShow = otherUsersLocations;
                    if (projectData?.projectId && selectedProject?.assignedUsers) {
                      locationsToShow = otherUsersLocations.filter(loc => selectedProject.assignedUsers.includes(String(loc.user_id)));
                    }
                    return locationsToShow.length > 0 ? (
                      locationsToShow.map(renderEmployeeLocation)
                    ) : (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MdLocationOn size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">No employee locations available</p>
                        <p className="text-gray-400 text-sm mt-1">Employees need to enable location tracking</p>
                      </div>
                    );
                  }

                  // Default: show full team list but display online/offline status (online first)
                  let locationsToShow = otherUsersLocations;
                  if (projectData?.projectId && selectedProject?.assignedUsers) {
                    locationsToShow = otherUsersLocations.filter(loc => selectedProject.assignedUsers.includes(String(loc.user_id)));
                  }
                  // Sort with active users first
                  locationsToShow = [...locationsToShow].sort((a, b) => {
                    return (isUserActive(b, 2) === true ? 1 : 0) - (isUserActive(a, 2) === true ? 1 : 0);
                  });

                  return locationsToShow.length > 0 ? (
                    locationsToShow.map(renderActiveEmployeeLocation)
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MdLocationOn size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">No active locations</p>
                      <p className="text-gray-400 text-sm mt-1">No users currently online or updating location</p>
                      <button
                        onClick={fetchOtherUsersLocations}
                        className="mt-4 px-4 py-3 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition-all"
                      >
                        Refresh
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
            </div>
          </div>
        );

      case "Profile":
        return !isMobile ? (
          <div className="p-5">
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg">
              <h3 className="text-xl font-bold mb-5">Admin Profile</h3>
              <p className="text-gray-600 mb-4">
                Manage your admin account settings and preferences.
              </p>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={() => alert("Edit profile")}
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result;
        setSelectedFile(imageData);
        try {
          const response = await fetch('/backend/profile.php', {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({profile_image: imageData})
          });
          const data = await response.json();
          console.log('Profile update response:', data);
          if (data.status === 'success') {
            // Update user object in localStorage with new profile image
            const updatedUser = { ...currentUser, profile_image: imageData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            
            // Refresh the users list to get updated profile images
            fetch("/backend/users.php", {
              credentials: "include",
            })
              .then(res => handleApiResponse(res))
              .then(data => setUsers(data))
              .catch(err => console.error("Users refresh error:", err));
            
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
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-5 py-4 flex justify-between items-center text-white">
      <div className="flex items-center">
        <div className="w-11 h-11 rounded-full border-2 border-white mr-3 overflow-hidden">
          <Avatar
            user={{
              ...currentUser,
              uploaded_profile_image: selectedFile || currentUser?.uploaded_profile_image,
              profile_image: selectedFile || currentUser?.uploaded_profile_image || currentUser?.profile_image,
            }}
            size={40}
          />
        </div>
        <div>
          <div className="text-xl font-bold">Admin Profile</div>
          <div className="flex items-center mt-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
            Status: {userStatus}
          </div>
        </div>
      </div>
      <button 
        onClick={() => setProfileOpen(false)}
          className="p-3 rounded-full min-w-[25px] min-h-[25px] bg-white/20 hover:bg-white/30 transition-colors"
      >
        <IoMdClose size={24} />
      </button>
    </div>

    {/* Profile Content */}
    <div className="flex-1 overflow-auto p-4 sm:p-5 bg-gray-50">
      {/* User Info Card */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full border-4 border-blue-100 overflow-hidden">
                <Avatar
                  user={{
                    ...currentUser,
                    uploaded_profile_image: selectedFile || currentUser?.uploaded_profile_image,
                    profile_image: selectedFile || currentUser?.uploaded_profile_image || currentUser?.profile_image,
                  }}
                  size={112}
                />
              </div>
              <button 
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full border-4 border-white hover:bg-blue-600 min-w-[40px] min-h-[40px] flex items-center justify-center"
                onClick={() => fileInputRef.current.click()}
              >
                <FiCamera size={12} />
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
              <h3 className="text-xl font-bold mb-1">{formatAuthorName(currentUser?.email, currentUser)}</h3> 
              <p className="text-gray-500 mb-2">{currentUser?.department || "Admin Dashboard"}</p>
              <p className="text-sm text-gray-600 mb-1">{currentUser?.email || "Not provided"}</p>
              <p className="text-sm text-gray-600">{currentUser?.phone || "Not provided"}</p>
            </div>
            <button
              onClick={handleEditProfile}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Edit Profile"
            >
              <FiEdit2 size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Admin Info */}
        <div className="border-t pt-4">
          <h4 className="font-bold text-gray-700 mb-2">Administrator Information</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Admin ID</p>
              <p className="font-medium">ADM-001</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="font-medium">Management</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Join Date</p>
              <p className="font-medium">2023-01-15</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Access Level</p>
              <p className="font-medium text-green-600">Full Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-3 mb-6">
        <h4 className="font-bold text-gray-700 mb-2 px-2">Admin Controls</h4>
        
        <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
            <FiSettings size={22} className="text-blue-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">System Settings</div>
            <div className="text-xs text-gray-500">Configure system preferences</div>
          </div>
          <FiChevronRight size={20} className="text-gray-400" />
        </button>

        <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
            <MdPeople size={22} className="text-green-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">Manage Users</div>
            <div className="text-xs text-gray-500">Add/remove team members</div>
          </div>
          <FiChevronRight size={20} className="text-gray-400" />
        </button>

        <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
            <MdDashboard size={22} className="text-purple-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">Project Management</div>
            <div className="text-xs text-gray-500">Manage all projects</div>
          </div>
          <FiChevronRight size={20} className="text-gray-400" />
        </button>

        <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
            <MdReportProblem size={22} className="text-yellow-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">Reports & Analytics</div>
            <div className="text-xs text-gray-500">View system reports</div>
          </div>
          <FiChevronRight size={20} className="text-gray-400" />
        </button>

        <button onClick={() => setShowSubscriptionsModal(true)} className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
            <IoMdNotifications size={22} className="text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">Notification Settings</div>
            <div className="text-xs text-gray-500">Configure alerts</div>
          </div>
          <FiChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Additional Settings */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <h4 className="font-bold text-gray-700 mb-3">System Preferences</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Email Notifications</span>
            <div className="w-12 h-6 bg-blue-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Auto Backup</span>
            <div className="w-12 h-6 bg-green-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Audit Log</span>
            <div className="w-12 h-6 bg-blue-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        className="w-full py-4 bg-red-500 text-white rounded-xl font-medium flex items-center justify-center hover:bg-red-600 transition-colors active:bg-red-700 mb-4"
        onClick={() => {
          logout();
          setProfileOpen(false);
        }}
      >
        <FaSignOutAlt size={20} className="mr-2" />
        Logout Admin Account
      </button>

      {/* Subscriptions Modal */}
      {showSubscriptionsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Push Subscriptions</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSubscriptionsModal(false)} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
              </div>
            </div>

            {isLoadingSubscriptions ? (
              <div>Loading...</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {subscriptions.length === 0 ? (
                  <div className="text-sm text-gray-500">No subscriptions saved.</div>
                ) : subscriptions.map((s, idx) => (
                  <div key={s.endpoint || idx} className="flex items-start justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.endpoint || 'Unknown endpoint'}</div>
                      <div className="text-xs text-gray-500 mt-1">Keys: {s.keys ? Object.keys(s.keys).join(', ') : 'n/a'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (!confirm('Remove this subscription?')) return;
                          try {
                            const res = await fetch('/backend/remove_subscription.php', {
                              method: 'POST',
                              credentials: 'include',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ endpoint: s.endpoint })
                            });
                            const json = await res.json();
                            if (json.status === 'success') {
                              setSubscriptions(prev => prev.filter(x => x.endpoint !== s.endpoint));
                            } else {
                              alert('Failed to remove subscription');
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Error removing subscription');
                          }
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* App Version */}
      <div className="text-center text-gray-400 text-sm py-3 border-t">
        <p>Construction Manager Admin v3.0.1</p>
        <p className="text-xs mt-1">Last updated: Today, 14:30 PM</p>
      </div>
    </div>
  </div>
);

  // Edit Profile Modal
  const renderEditProfileModal = () => (
    showEditProfileModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold">Edit Profile</h3>
            <button
              onClick={() => setShowEditProfileModal(false)}
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
                value={editProfileData.name}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, name: e.target.value }))}
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
                value={editProfileData.department}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, department: e.target.value }))}
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
                value={editProfileData.phone}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, phone: e.target.value }))}
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
                value={currentUser?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
            
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile || !editProfileData.name || !editProfileData.department}
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
    )
  );

  const ActionMenu = () => (
    <div className="fixed inset-0 z-30 flex items-end">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => setShowActionMenu(false)}
      />
      <div 
        ref={actionMenuRef}
        className="relative bg-white rounded-t-3xl p-6 w-full max-h-[65%] overflow-auto animate-slide-up z-40"
      >
        {/* Bottom Sheet Drag Handle with hover effect */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 cursor-grab transition-all hover:bg-blue-400" style={{height:'6px'}} />
        
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-1">Admin Actions</h3>
          <p className="text-sm text-gray-500 text-center">Choose an action to continue</p>
        </div>
        
        {/* Grid Layout */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-sm border border-blue-200 min-h-[140px] hover:bg-blue-100"
            onClick={() => {
              setShowAnnouncementModal(true);
              setShowActionMenu(false);
            }}
          >
            <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center mb-3 shadow-md">
              <IoMdMegaphone size={24} className="text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-800 mb-1 text-sm">Announcement</div>
              <div className="text-xs text-gray-600">Post updates</div>
            </div>
          </button>

          <button
            className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-sm border border-purple-200 min-h-[140px] hover:bg-purple-100"
            onClick={() => {
              setShowProjectModal(true);
              setShowActionMenu(false); 
            }}
          >
            <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center mb-3 shadow-md">
              <MdDashboard size={24} className="text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-800 mb-1 text-sm">New Task</div>
              <div className="text-xs text-gray-600">Create task</div>
            </div>
          </button>

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

        <button
          onClick={() => setShowActionMenu(false)}
          className="w-full mt-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );


  // --- Notifications logic and layout copied from user-dashboard ---
  const unreadAnnouncements = announcements.filter(a => a.unread);
  const unreadCount = unreadAnnouncements.length;
  const currentUserId =
    currentUser?.id ||
    currentUser?.user_id ||
    currentUser?.login_id ||
    currentUser?.userId ||
    currentUser?.loginId;

  const isUserAssignedToProject = (project) => {
    const assigned = project?.assignedUsers || [];
    if (!assigned || assigned.length === 0) return true;
    if (!currentUserId) return false;
    return assigned.map(String).includes(String(currentUserId));
  };

  // For admin, show all new tasks regardless of assignment
  const newTaskNotifications = projects.filter(
    (project) => project.isNew
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

  // Notification badge should only show for truly unread announcements, not new tasks or visual 'New' badges
  const notificationBadgeCount = unreadCount;

  const [selectedNotification, setSelectedNotification] = useState(null);

  const handleNotificationClick = async (item) => {
    try {
      triggerHaptic('light');
      if (!item || !item.key) return;
      if (item.key.startsWith('task-')) {
        const id = item.key.split('task-')[1];
        // Mark the task as read (isNew: false)
        setProjects(prev => prev.map(p => String(p.id) === String(id) ? { ...p, isNew: false } : p));
        const project = projects.find(p => String(p.id) === String(id));
        if (project) {
          await viewProjectDetails(project);
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
    <div className={`min-h-screen pb-20 bg-gray-100 relative ${isOffline ? 'pt-10' : ''}`}>
      {/* Offline banner (auto-detect) */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm font-medium">
          You are offline — changes will sync when connection restores
        </div>
      )}
      {/* Skeleton Screens for Loading */}
      {/* Skeletons are now shown in renderTabContent per tab, not as overlay */}
      {/* Main Header (compact for mobile) */}
      {activeTab !== "My Location" && (
        <div className="sticky top-0 z-20 px-4 py-3 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <img
              src="/img/stelsenlogo.png"
              alt="Logo"
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
            <h2 className="text-lg font-semibold">STELSEN</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNotificationsClick}
              aria-label="Notifications"
              className="relative w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <IoMdNotifications size={22} className="text-white" />
              {notificationBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-blue-700">
                  {notificationBadgeCount > 99 ? '99+' : notificationBadgeCount}
                </span>
              )}
            </button>
            <button onClick={handleProfileClick} className="w-10 h-10 rounded-full bg-white relative overflow-visible">
              <Avatar
                user={{
                  ...currentUser,
                  uploaded_profile_image: selectedFile || currentUser?.uploaded_profile_image,
                  profile_image: selectedFile || currentUser?.uploaded_profile_image || currentUser?.profile_image,
                }}
                size={40}
              />
              {!isOffline && (
                <span style={{ transform: 'translate(20%, 20%)' }} className="absolute right-0 bottom-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${profileOpen && isMobile ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} bg-white text-gray-900`}>
        <div ref={pullRef} className="overflow-auto px-0">
          {renderTabContent()}
        </div>
      </div>

      {/* Bottom Navbar */}
      {activeTab !== "My Location" && (
        <div className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 flex items-center justify-around py-1 z-10 transition-all duration-300 ${profileOpen ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
          <button
            className={`flex flex-col items-center relative min-w-[44px] min-h-[44px] justify-center ${activeTab === "Home" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("Home")}
          >
            <IoMdHome size={22} />
            <span className="text-xs mt-0.5">Home</span>
          </button>

          <button
            className={`flex flex-col items-center relative min-w-[44px] min-h-[44px] justify-center ${activeTab === "Projects" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("Projects")}
          >
            <MdDashboard size={22} />
            <span className="text-xs mt-0.5">Projects</span>
          </button>

          {/* Centered Add Button (floating, mobile style) */}
          <div className="relative -top-4">
            <button
              onClick={() => {
                triggerHaptic && triggerHaptic('medium');
                setShowActionMenu(true);
              }}
              title="Quick Actions"
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-xl active:scale-95 transition-all group"
            >
              <MdAdd size={32} />
              <span className="absolute -top-10 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Quick Actions</span>
            </button>
          </div>

          <button
            className={`flex flex-col items-center relative min-w-[44px] min-h-[44px] justify-center ${activeTab === "My Location" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("My Location")}
          >
            <MdLocationOn size={20} />
            <span className="text-xs mt-0.5">Location</span>
          </button>

          <button
            className="flex flex-col items-center relative min-w-[44px] min-h-[44px] justify-center text-gray-500"
            onClick={handleProfileClick}
          >
            <div className="relative">
              <FaUser size={!isOffline ? 22 : 20} />
            </div>
            <span className="text-xs mt-0.5">Profile</span>
          </button>
        </div>
      )}

      {/* Action Menu Modal */}
      {showActionMenu && <ActionMenu />}

      {/* Profile Sidebar */}
      {profileOpen && isMobile && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-30 flex flex-col">
          {renderProfile()}
        </div>
      )}

      {/* Edit Profile Modal */}
      {renderEditProfileModal()}

      {/* Announcement Creation Modal */}
      {showAnnouncementModal && renderAnnouncementModal()}

      {/* Project Creation Modal */}
      {showProjectModal && renderProjectModal()}

      {/* Breadcrumb Navigation */}
      {(getCurrentScreen()?.screen === "projectDetails" || getCurrentScreen()?.screen === "comments") && (
        <div className="flex items-center text-xs text-gray-500 ml-4 mt-2 mb-1">
          <button onClick={() => { setNavigationStack([]); setActiveTab('Home'); }} className="hover:text-blue-600 transition-colors">Home</button>
          <FiChevronRight size={14} className="mx-1" />
          <button onClick={() => { setNavigationStack([]); setActiveTab('Projects'); }} className="hover:text-blue-600 transition-colors">Projects</button>
          {selectedProject && (
            <>
              <FiChevronRight size={14} className="mx-1" />
              <span className="text-gray-800 font-medium">{selectedProject.title || 'Project'}</span>
            </>
          )}
        </div>
      )}

      {/* Project Details - Stack Navigation */}
      {getCurrentScreen()?.screen === "projectDetails" && renderProjectDetailsModal()}

      {/* Task Progress - Stack Navigation */}
      {getCurrentScreen()?.screen === "taskProgress" && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-in-right">
          <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-5 py-4 border-b border-blue-400 flex items-center">
            <button
              onClick={popScreen}
              className="p-3 rounded-full min-w-[44px] min-h-[44px] hover:bg-white hover:bg-opacity-20 mr-3 transition-colors"
            >
              <IoMdArrowBack size={24} />
            </button>
            <h3 className="flex-1 text-xl font-bold">Task Progress</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {isLoadingTaskProgress ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading progress...
              </div>
            ) : taskProgressList && taskProgressList.length > 0 ? (
              <div className="space-y-4">
                {taskProgressList.map((progress, index) => {
                  const displayName = getDisplayName(progress.email || progress.user);
                  const displayTime = formatDateTime(progress.time || progress.created_at);
                  const status = progress.progress_status || 'Pending';
                  const progressColor = getProgressColor(status);
                  const isLatest = index === 0; // First item is the latest
                  
                  return (
                    <button
                      key={progress.id}
                      onClick={() => {
                        setSelectedProgressUpdate(progress);
                        setNavigationStack(prev => {
                          const filtered = prev.filter(screen => screen.screen !== "progressDetail");
                          return [...filtered, { screen: "progressDetail", data: { progressId: progress.id } }];
                        });
                      }}
                      className={`w-full ${progressColor.cardBg} border ${progressColor.border} rounded-xl p-4 hover:shadow-lg transition-all text-left relative overflow-hidden`}
                    >
                      {/* Progress indicator ribbon */}
                      <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${progressColor.bg}`}></div>
                      
                      {isLatest && (
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-sm">
                            Latest
                          </span>
                        </div>
                      )}
                      
                      <div className="pl-2">
                        {/* Header with Update Number */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${progressColor.bg}`}></div>
                          <span className={`text-xs font-semibold ${progressColor.text}`}>
                            Update #{taskProgressList.length - index}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              user={{
                                name: displayName,
                                email: progress.email,
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

                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Progress Update</span>
                            <span className={`text-lg font-semibold ${progressColor.text}`}>
                              {progress.progress_percentage || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                            <div
                              className={`bg-gradient-to-r ${progressColor.bg} h-3 rounded-full transition-all shadow-sm`}
                              style={{ width: `${progress.progress_percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {progress.text && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{progress.text}</p>
                        )}

                        <div className="flex items-center justify-end mt-2">
                          <FiChevronRight size={20} className={progressColor.text} />
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
                <p className="text-sm text-gray-400">Progress submissions will show here</p>
              </div>
            )}
          </div>
        </div>
      )}

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
              <button onClick={() => { markAllAsRead(); }} onTouchStart={() => triggerHaptic('light')} className="text-sm text-blue-600">Mark all</button>
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
                  {getPriorityText(selectedNotification.priority)}
                </span>
                <span>•</span>
                <span>By: {selectedNotification.author || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Detail - Stack Navigation */}
      {getCurrentScreen()?.screen === "progressDetail" && selectedProgressUpdate && (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col animate-slide-in-right">
          <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 sm:px-5 py-4 border-b border-blue-400 flex items-center">
            <button
              onClick={popScreen}
              className="p-3 rounded-full min-w-[44px] min-h-[44px] hover:bg-white hover:bg-opacity-20 mr-3 transition-colors"
            >
              <IoMdArrowBack size={24} />
            </button>
            <h3 className="flex-1 text-xl font-bold">Progress Details</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {(() => {
                  const displayName = getDisplayName(selectedProgressUpdate.email || selectedProgressUpdate.user);
                  const displayTime = formatDateTime(selectedProgressUpdate.time || selectedProgressUpdate.created_at);
                  return (
                    <>
                      <Avatar
                        user={{
                          name: displayName,
                          email: selectedProgressUpdate.email,
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

              <div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
                    style={{ width: `${selectedProgressUpdate.progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {selectedProgressUpdate.text && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Notes</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedProgressUpdate.text}</p>
                </div>
              )}

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
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold capitalize ${
                      selectedProgressUpdate.approval_status === 'approved' ? 'text-green-700' :
                      selectedProgressUpdate.approval_status === 'rejected' ? 'text-red-700' :
                      'text-yellow-700'
                    }`}>
                      {selectedProgressUpdate.approval_status}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveProgress(selectedProgressUpdate.id)}
                        disabled={selectedProgressUpdate.approval_status === 'approved' || selectedProgressUpdate.approval_status === 'rejected'}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedProgressUpdate.approval_status === 'approved' || selectedProgressUpdate.approval_status === 'rejected' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                        title="Approve"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => handleRejectProgress(selectedProgressUpdate.id)}
                        disabled={selectedProgressUpdate.approval_status === 'approved' || selectedProgressUpdate.approval_status === 'rejected'}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedProgressUpdate.approval_status === 'approved' || selectedProgressUpdate.approval_status === 'rejected' ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'}`}
                        title="Reject"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map View - Stack Navigation */}
      {getCurrentScreen()?.screen === "mapView" && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="relative h-screen w-full overflow-hidden" style={{ overscrollBehavior: 'none', touchAction: 'pan-x pan-y' }}>
            {/* MAP */}
            <div className="absolute inset-0 overflow-hidden">
              <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)} 
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
              >
                {/* Filter locations to show only project-assigned users and non-hidden employees */}
                {otherUsersLocations
                  .filter(location => {
                    // Skip hidden employees
                    if (hiddenEmployees.has(location.user_id)) {
                      return false;
                    }
                    // If we have a project context, only show users assigned to this project
                    const projectData = getCurrentScreen()?.data;
                    if (projectData?.projectId && selectedProject?.assignedUsers) {
                      return selectedProject.assignedUsers.includes(String(location.user_id));
                    }
                    // Otherwise show all locations
                    return true;
                  })
                  .map((location) => (
                  <Marker
                    key={`user-${location.user_id}`}
                    longitude={location.longitude}
                    latitude={location.latitude}
                    anchor="center"
                  >
                    <div className="relative flex flex-col items-center justify-center">
                      {/* Radar pulse effect */}
                      <div className="absolute w-12 h-12 rounded-full" style={{
                        animation: 'radar-pulse 2s ease-out infinite',
                        animationDelay: `${Math.random() * 2}s`
                      }}></div>

                      {location.profile_image ? (
                        <div className="relative z-10">
                          <img
                            src={location.profile_image}
                            alt={location.email}
                            className="w-12 h-12 rounded-full border-3 border-white shadow-lg object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                            title={location.email}
                          />
                        </div>
                      ) : (
                        <div className="relative z-10">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center" title={location.email}>
                            <span className="text-white font-bold text-sm">
                              {location.email?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Marker>
                ))}

                {/* User Location Marker with Profile Image - HIDDEN FOR ADMIN */}
                {/* Only employees see their own location marker, not admin */}
              </Map>

              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/20 to-transparent pt-4 px-4 z-20">
                <div className="flex items-center justify-between relative">
                  <button
                    className="bg-white text-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                    onClick={() => popScreen()}
                  >
                    <IoMdArrowBack size={24} />
                  </button>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow">
                    <div className="text-sm text-gray-500">Current Location</div>
                    <div className="font-bold text-gray-800">{currentLocation}</div>
                  </div>
                  <button
                    onClick={refreshLocation}
                    disabled={isRefreshingLocation}
                    className={`p-3 rounded-full shadow-lg ${isRefreshingLocation ? 'bg-white text-gray-400' : 'bg-white text-blue-500 hover:bg-blue-50'} transition-all`}
                    title="Refresh location"
                  >
                    <FiRefreshCw size={24} className={isRefreshingLocation ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Employee Locations Panel */}
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl h-[45%] flex flex-col z-30" style={{ overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'none' }}>
                <div className="px-4 sm:px-5 pt-5 pb-0 flex-shrink-0">
                  <div className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {getCurrentScreen()?.data?.projectId && selectedProject 
                          ? `${selectedProject.title} Team Locations`
                          : 'Employee Locations'
                        }
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const projectData = getCurrentScreen()?.data;
                          if (projectData?.projectId && selectedProject?.assignedUsers) {
                            const filteredCount = otherUsersLocations.filter(loc => 
                              selectedProject.assignedUsers.includes(String(loc.user_id))
                            ).length;
                            return `${filteredCount} team member${filteredCount !== 1 ? 's' : ''} tracked`;
                          }
                          return `${otherUsersLocations.length} employee${otherUsersLocations.length !== 1 ? 's' : ''} tracked`;
                        })()}
                      </p>
                    </div>
                    <button 
                      onClick={fetchOtherUsersLocations}
                      className="text-blue-500 text-sm font-medium flex items-center gap-1 hover:text-blue-600"
                    >
                      <FiRefreshCw size={14} />
                      Refresh
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-5" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none', touchAction: 'pan-y', overscrollBehaviorY: 'none' }}>
                  {(() => {
                    const projectData = getCurrentScreen()?.data;
                    let locationsToShow = otherUsersLocations;
                    
                    // Filter locations if we're viewing a specific project
                    if (projectData?.projectId && selectedProject?.assignedUsers) {
                      locationsToShow = otherUsersLocations.filter(loc => 
                        selectedProject.assignedUsers.includes(String(loc.user_id))
                      );
                    }
                    
                    return locationsToShow.length > 0 ? (
                      locationsToShow.map(renderEmployeeLocation)
                    ) : (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MdLocationOn size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">
                          {projectData?.projectId 
                            ? 'No team member locations available'
                            : 'No employee locations available'
                          }
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {projectData?.projectId
                            ? 'Team members need to enable location tracking'
                            : 'Employees need to enable location tracking'
                          }
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal - Stack Navigation */}
      {navigationStack.some(screen => screen.screen === "comments") && renderCommentsModal()}

      {/* Location Update Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-end z-40">
          <div className="bg-white rounded-t-3xl p-4 sm:p-5 w-full max-h-[80%] overflow-auto">
            <div className="flex justify-between items-center mb-5">
              <span className="text-xl font-bold">Update Location</span>
              <button onClick={() => setShowLocationModal(false)}>
                <IoMdClose size={24} />
              </button>
            </div>
            {["Office", "Site A", "Site B", "Client Meeting", "On The Way", "Break"].map(location => (
              <button
                key={location}
                className="flex justify-between items-center w-full py-4 border-b border-gray-100 hover:bg-gray-50"
                onClick={() => updateLocation(location)}
              >
                <MdLocationOn size={20} className="text-blue-500" />
                <span>{location}</span>
                <FiChevronRight size={20} className="text-gray-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {/* Navigation-style Camera Screen (takes precedence when active) */}
      {getCurrentScreen()?.screen === "camera" && (
        <div className="fixed inset-0 bg-white z-[80] flex flex-col">
          <div className="bg-gradient-to-r from-white-600 to-white-700 px-4 py-3 flex items-center text-black shadow-md">
            <button onClick={() => {
                if (videoRef.current && videoRef.current.srcObject) {
                  videoRef.current.srcObject.getTracks().forEach(t => t.stop());
                }
                setCameraStream(null);
                popScreen();
              }}
              className="p-2 rounded-full bg-gray/20 mr-3"
            >
              <IoMdArrowBack size={20} />
            </button>
            <div className="flex-1 text-center font-bold">Camera</div>
            <div style={{width:44}} />
          </div>

          <div className="flex-1 bg-black flex items-center justify-center">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <div className="p-4 flex items-center justify-center gap-4">
            <button
              onClick={() => {
                if (videoRef.current && videoRef.current.srcObject) {
                  videoRef.current.srcObject.getTracks().forEach(t => t.stop());
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
                if (canvasRef.current && videoRef.current) {
                  const canvas = canvasRef.current;
                  const video = videoRef.current;
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
                      }]);

                      if (videoRef.current && videoRef.current.srcObject) {
                        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
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
    </div>
  );
};

export default AdminDashboard;
