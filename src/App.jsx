import React, { useState, useEffect } from "react";
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle, LogIn, 
  UserPlus, ArrowLeft, Phone, Key, CheckCircle,
  ChevronRight, Shield, Smartphone, Sparkles
} from "lucide-react";

import UserDashboard from "./frontend/user-dashboard.jsx";
import AdminDashboard from "./frontend/admin-dashboard.jsx";
import GoogleLoginButton from "./GoogleLoginButton.jsx";
import { 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged
} from "firebase/auth";
import { auth, db } from "./firebase";
import { ref, get, set } from "firebase/database";

// Define different views for the auth flow
const AUTH_VIEWS = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot_password',
  VERIFICATION: 'verification',
  RESET_PASSWORD: 'reset_password'
};

// Helper function to normalize user profile
const normalizeUserProfile = (uid, profile = {}, fallbackEmail = "") => {
  const email = profile.email || fallbackEmail || "";
  return {
    id: uid,
    login_id: uid,
    user_id: uid,
    email,
    phone: profile.phone || "",
    account_type: profile.account_type || "user",
    profile_image: profile.profile_image || null,
    name: profile.name || (email ? email.split("@")[0] : "User")
  };
};

// Helper function to ensure user profile exists in database
const ensureUserProfile = async (firebaseUser, extra = {}) => {
  if (!firebaseUser) return null;
  const userRef = ref(db, `users/${firebaseUser.uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) {
    const profile = {
      email: firebaseUser.email || "",
      phone: extra.phone || "",
      account_type: extra.account_type || "user",
      profile_image: extra.profile_image || null,
      name: extra.name || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "User"),
      created_at: new Date().toISOString()
    };
    await set(userRef, profile);
    return normalizeUserProfile(firebaseUser.uid, profile, firebaseUser.email);
  }
  return normalizeUserProfile(firebaseUser.uid, snap.val(), firebaseUser.email);
};

// Helper function to get current user profile
const getCurrentUserProfile = async () => {
  const current = auth.currentUser;
  if (!current) return null;
  const userRef = ref(db, `users/${current.uid}`);
  const snap = await get(userRef);
  const profile = snap.exists() ? snap.val() : {};
  return normalizeUserProfile(current.uid, profile, current.email);
};

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send OTP email via backend
const sendOTPEmail = async (email, otp) => {
  try {
    const backendUrl = window.location.port === '5173' 
      ? 'http://localhost/stelsen_monitoring_firebase/backend/send_otp.php'
      : '/backend/send_otp.php';
    
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });
    
    if (!response.ok) {
      console.warn("Failed to send OTP via backend, storing in database only");
    }
    return true;
  } catch (err) {
    console.warn("Backend OTP sending unavailable:", err);
    return true;
  }
};

function App() {
  // Auth states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // UI states
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [showStartupSplash, setShowStartupSplash] = useState(false);
  const [splashType, setSplashType] = useState('login'); // 'login' or 'logout'

  // Location access gate (required before dashboard access)
  const [locationReady, setLocationReady] = useState(false);
  const [locationCheckComplete, setLocationCheckComplete] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationRequestError, setLocationRequestError] = useState("");
  
  // Auth flow state
  const [currentView, setCurrentView] = useState(AUTH_VIEWS.LOGIN);
  const [verificationStep, setVerificationStep] = useState(1);
  const [verificationSent, setVerificationSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verificationPurpose, setVerificationPurpose] = useState(null);
  const [forgotPasswordOTP, setForgotPasswordOTP] = useState("");
  const [forgotPasswordOTPVerificationId, setForgotPasswordOTPVerificationId] = useState("");
  const [isForgotPasswordOTPSent, setIsForgotPasswordOTPSent] = useState(false);
  const [isForgotPasswordOTPVerified, setIsForgotPasswordOTPVerified] = useState(false);

  // ✅ Check Firebase auth state and validate session on mount
  // This properly waits for Firebase to restore persisted auth session
  useEffect(() => {
    setIsValidatingSession(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Firebase user is authenticated
          const profile = await getCurrentUserProfile();
          if (profile) {
            localStorage.setItem("auth_token", firebaseUser.uid);
            localStorage.setItem("user", JSON.stringify(profile));
            setCurrentUser(profile);
            setLoggedIn(true);
          } else {
            // User exists in Firebase but not in database
            console.log("User profile not found in database");
            await signOut(auth);
            localStorage.removeItem("user");
            localStorage.removeItem("auth_token");
            setCurrentUser(null);
            setLoggedIn(false);
          }
        } else {
          // No Firebase user - session expired or never logged in
          localStorage.removeItem("user");
          localStorage.removeItem("auth_token");
          setCurrentUser(null);
          setLoggedIn(false);
        }
      } catch (error) {
        console.error("Failed to validate session:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("auth_token");
        setCurrentUser(null);
        setLoggedIn(false);
      } finally {
        setIsValidatingSession(false);
      }
    });
    
    return unsubscribe;
  }, []);

  const requestLocationAccess = async () => {
    setLocationCheckComplete(false);
    if (!window.isSecureContext) {
      setLocationRequestError("Location requires HTTPS or localhost. Please use a secure connection.");
      setLocationCheckComplete(true);
      return false;
    }

    if (!navigator.geolocation) {
      setLocationRequestError("Location services are not supported on this device.");
      setLocationCheckComplete(true);
      return false;
    }

    return new Promise((resolve) => {
      setIsRequestingLocation(true);
      setLocationRequestError("");
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationReady(true);
          setLocationCheckComplete(true);
          setIsRequestingLocation(false);
          resolve(true);
        },
        (err) => {
          setLocationReady(false);
          setIsRequestingLocation(false);
          setLocationRequestError(
            err && err.code === 1
              ? "Location permission denied. Please enable it in your device or browser settings."
              : "Unable to get location. Please try again."
          );
          setLocationCheckComplete(true);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const triggerHaptic = (duration = 10) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const passiveLocationCheck = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationReady(true);
        setLocationCheckComplete(true);
      },
      () => {
        setLocationReady(false);
        setLocationCheckComplete(true);
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
    );
  };

  const refreshLocationPermission = async () => {
    if (!loggedIn || !user) return;
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (status.state === "granted") {
          setLocationReady(true);
          setLocationCheckComplete(true);
        }
      } catch (err) {
        // Ignore permission query errors
      }
      return;
    }

    passiveLocationCheck();
  };

  useEffect(() => {
    let cancelled = false;

    const checkLocationAccess = async () => {
      if (!loggedIn || !user) {
        setLocationReady(false);
        setLocationCheckComplete(false);
        return;
      }

      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: "geolocation" });
          if (cancelled) return;
          if (status.state === "granted") {
            setLocationReady(true);
            setLocationCheckComplete(true);
            return;
          }
        } catch (err) {
          // Fallback to prompt below
        }
      }
      passiveLocationCheck();
    };

    checkLocationAccess();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshLocationPermission();
      }
    };

    window.addEventListener("focus", refreshLocationPermission);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshLocationPermission);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loggedIn, user]);

  // Register service worker and provide push subscription helpers
  useEffect(() => {
    const urlBase64ToUint8Array = (base64String) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    const registerAndSubscribe = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', reg);

        // Expose convenience function for manual enabling
        window.enablePushNotifications = async () => {
          try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return { success: false, reason: 'permission_denied' };

            if (!reg) {
              console.error('Service worker registration missing');
              return { success: false, reason: 'sw_registration_missing' };
            }

            // Fetch VAPID public key from backend (endpoint should return { publicKey: 'BASE64_URL_SAFE' })
            let publicKey = null;
            // When running Vite dev server (usually :5173) the PHP backend may be served from Apache on a different origin.
            const isVite = window.location.port === '5173' || window.location.hostname === 'localhost' && window.location.port && window.location.port !== '80' && window.location.port !== '';
            const siteOrigin = (isVite ? window.location.origin.replace(/:\d+$/, '') : window.location.origin);

            const tryEndpoints = [
              '/backend/push_vapid_public.php',
              '/stelsen_monitoring/backend/push_vapid_public.php',
              siteOrigin + '/backend/push_vapid_public.php',
              siteOrigin + '/stelsen_monitoring/backend/push_vapid_public.php'
            ];

            for (const ep of tryEndpoints) {
              try {
                console.debug('Attempting VAPID fetch from', ep);
                const res = await fetch(ep, { credentials: 'include' });
                if (!res.ok) {
                  console.debug('VAPID endpoint responded non-ok', ep, res.status);
                  continue;
                }
                const json = await res.json();
                publicKey = json.publicKey || json.public_key || null;
                if (publicKey) break;
              } catch (err) {
                console.warn('VAPID fetch failed for', ep, err);
              }
            }

            if (!publicKey) {
              console.warn('No VAPID public key available. Aborting subscription. Ensure backend/push_vapid_public.php is reachable and returns { publicKey }');
              return { success: false, reason: 'no_vapid_key' };
            }

            // Sanitize and convert the returned public key to a Uint8Array
            let applicationServerKey;
            try {
              // Remove surrounding quotes/newlines and whitespace
              let cleanKey = String(publicKey).trim().replace(/\s+/g, '');

              // If PEM format, extract the base64 block
              if (/-----BEGIN PUBLIC KEY-----/.test(cleanKey)) {
                cleanKey = cleanKey.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '');
                cleanKey = cleanKey.replace(/\r|\n/g, '');
              }

              // Remove any accidental surrounding quotes
              cleanKey = cleanKey.replace(/^"|"$/g, '');

              // Convert
              applicationServerKey = urlBase64ToUint8Array(cleanKey);
            } catch (err) {
              console.error('Invalid VAPID public key format', publicKey, err);
              return { success: false, reason: 'invalid_vapid_format', detail: err && err.message };
            }
            let subscription;
            try {
              subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
              });
            } catch (err) {
              console.error('Push subscribe failed', err);
              return { success: false, reason: 'subscribe_failed', detail: err.message };
            }

            // Send subscription to backend to save
            try {
              const saveRes = await fetch('/backend/save_subscription.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
              });
              if (!saveRes.ok) {
                console.warn('Saving subscription returned non-OK status', saveRes.status);
                return { success: false, reason: 'save_failed', status: saveRes.status };
              }
            } catch (err) {
              console.warn('Failed to save subscription to backend', err);
              return { success: false, reason: 'save_failed', detail: err.message };
            }

            return { success: true, subscription };
          } catch (err) {
            console.error('enablePushNotifications failed', err);
            return { success: false, reason: 'unexpected_error', detail: err && err.message };
          }
        };
      } catch (err) {
        console.error('Service worker registration failed', err);
      }
    };

    registerAndSubscribe();
  }, []);

  //============================================ Handle Logout ============================================//
  const handleLogout = () => {
    setSplashType('logout');
    setShowStartupSplash(true);
    setTimeout(async () => {
      try {
        // Sign out from Firebase
        await signOut(auth);
      } catch (error) {
        console.error("Firebase sign out error:", error);
      }
      
      // Clear localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("auth_token");
      
      // Reset state
      setCurrentUser(null);
      setLoggedIn(false);
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setNewPassword("");
      setVerificationCode("");
      setError("");
      setSuccess("");
      setCurrentView(AUTH_VIEWS.LOGIN);
      setShowStartupSplash(false);
    }, 800);
  };

  //============================================ Handle Login ============================================//
  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) return setError("Please enter email and password.");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email.");

    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setIsLoading(true);
    setSplashType('login');

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const profile = await ensureUserProfile(userCredential.user);
        
        setSuccess("Login successful! Redirecting...");
        localStorage.setItem("auth_token", userCredential.user.uid);
        localStorage.setItem("user", JSON.stringify(profile));
        setCurrentUser(profile);
        setShowStartupSplash(true);
        setTimeout(() => {
          setLoggedIn(true);
          setShowStartupSplash(false);
          setIsLoading(false);
        }, 900);
      })
      .catch((err) => {
        setIsLoading(false);
        console.error("Login error:", err);
        
        // Handle specific Firebase errors
        if (err.code === "auth/user-not-found") {
          setError("No account found with this email address.");
        } else if (err.code === "auth/wrong-password") {
          setError("Incorrect password.");
        } else if (err.code === "auth/invalid-credential") {
          setError("Invalid email or password.");
        } else if (err.code === "auth/too-many-requests") {
          setError("Too many login attempts. Please try again later.");
        } else {
          setError(err.message || "Login failed. Please try again.");
        }
      });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!email || !phone || !password || !confirmPassword ) {
      return setError("Please fill in all required fields.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email.");

    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return setError("Please enter a valid phone number.");
    }

    setIsLoading(true);
    
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Create user profile in database
        const profile = await ensureUserProfile(userCredential.user, { phone });
        
        setIsLoading(false);
        setSuccess("Registration successful! You can now sign in with your credentials.");
        setEmail("");
        setPhone("");
        setPassword("");
        setConfirmPassword("");
        setCurrentView(AUTH_VIEWS.LOGIN);
      })
      .catch((err) => {
        setIsLoading(false);
        console.error("Registration error:", err);
        
        // Handle specific Firebase errors
        if (err.code === "auth/email-already-in-use") {
          setError("This email address is already registered.");
        } else if (err.code === "auth/weak-password") {
          setError("Password is too weak. Please use a stronger password.");
        } else if (err.code === "auth/invalid-email") {
          setError("Please enter a valid email address.");
        } else {
          setError(err.message || "Registration failed. Please try again.");
        }
      });
  };

  //============================================ Handle Forgot Password ============================================//
  const handleForgotPassword = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      return setError("Please enter your email address.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email.");

    setIsLoading(true);

    // Generate and send OTP
    const otp = generateOTP();
    const verificationId = `forgot_${Date.now()}`;
    
    // Store OTP in database
    const otpRef = ref(db, `otp_verifications/${verificationId}`);
    set(otpRef, {
      code: otp,
      email: email,
      purpose: "forgot_password",
      created_at: new Date().toISOString()
    })
      .then(async () => {
        // Send OTP email
        await sendOTPEmail(email, otp);
        
        setIsLoading(false);
        setForgotPasswordOTPVerificationId(verificationId);
        setIsForgotPasswordOTPSent(true);
        setSuccess("OTP sent to your email! Please check your inbox.");
      })
      .catch((err) => {
        setIsLoading(false);
        console.error("Error sending OTP:", err);
        setError("Failed to send OTP. Please try again.");
      });
  };

  //============================================ Handle Verification ============================================//
  const handleVerification = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("Email verification is handled via the link sent to your email.");
    setCurrentView(AUTH_VIEWS.LOGIN);
  };

  //============================================ Handle OTP Verification (Forgot Password) ============================================//
  const handleVerifyForgotPasswordOTP = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!forgotPasswordOTP) {
      return setError("Please enter the OTP sent to your email.");
    }

    if (forgotPasswordOTP.length !== 6) {
      return setError("OTP must be 6 digits.");
    }

    setIsLoading(true);

    // Verify OTP
    const otpRef = ref(db, `otp_verifications/${forgotPasswordOTPVerificationId}`);
    get(otpRef)
      .then(async (snap) => {
        if (!snap.exists()) {
          setIsLoading(false);
          setError("OTP expired or invalid. Please request a new one.");
          return;
        }

        const otpData = snap.val();
        const now = new Date().getTime();
        const expiryTime = new Date(otpData.created_at).getTime() + 10 * 60 * 1000; // 10 minutes

        if (now > expiryTime) {
          setIsLoading(false);
          setError("OTP has expired. Please request a new one.");
          return;
        }

        if (otpData.code !== forgotPasswordOTP) {
          setIsLoading(false);
          setError("Invalid OTP code.");
          return;
        }

        // OTP is valid
        setIsLoading(false);
        setIsForgotPasswordOTPVerified(true);
        setSuccess("OTP verified successfully! Now set your new password.");
      })
      .catch((err) => {
        setIsLoading(false);
        console.error("OTP verification error:", err);
        setError("Error verifying OTP. Please try again.");
      });
  };

  //============================================ Handle Reset Password ============================================//
  const handleResetPassword = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    setIsLoading(true);

    // After OTP verified, send Firebase password reset email
    sendPasswordResetEmail(auth, email)
      .then(async () => {
        // Delete the OTP after sending reset email
        const otpRef = ref(db, `otp_verifications/${forgotPasswordOTPVerificationId}`);
        await set(otpRef, null);
        
        setIsLoading(false);
        setSuccess("Password reset link sent to your email. Click the link to set a new password.");
        setEmail("");
        setForgotPasswordOTP("");
        setNewPassword("");
        setConfirmPassword("");
        setIsForgotPasswordOTPSent(false);
        setIsForgotPasswordOTPVerified(false);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setCurrentView(AUTH_VIEWS.LOGIN);
          setSuccess("");
        }, 3000);
      })
      .catch((err) => {
        setIsLoading(false);
        console.error("Password reset email error:", err);
        setError(err.message || "Failed to send reset email. Please try again.");
      });
  };

  //=========================================== Handle Resend Code Email ============================================
  const handleResendCode = () => {
    setSuccess("New verification code sent to your email!");
    setVerificationStep(1);
    setTimeout(() => setVerificationStep(2), 1000);
  };

  // =========================================== GOOGLE LOGIN ========================================================
  const handleGoogleLoginSuccess = (googleUser) => {
    setError("");
    setSuccess("");
    setIsLoading(false);
    if (googleUser) {
      localStorage.setItem("auth_token", googleUser.id);
      localStorage.setItem("user", JSON.stringify(googleUser));
      setCurrentUser(googleUser);
      setSuccess("Logged in with Google 🚀");
      setShowStartupSplash(true);
      setTimeout(() => {
        setLoggedIn(true);
        setShowStartupSplash(false);
      }, 900);
    } else {
      setError("Google login failed");
    }
  };

  //========================================= Quick login for demo ===================================================
  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setCurrentView(AUTH_VIEWS.LOGIN);
  };

  // Show loading screen while validating session
  if (isValidatingSession) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="relative mb-8">
        <img 
          src="/img/stelsenlogo.png" 
          alt="Stelsen Logo" 
          className="h-24 w-24 object-contain bg-white rounded-3xl p-2 shadow-lg"
        />
      
        </div>
        <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-800 text-lg font-semibold">Loading Stelsen...</p>
        <p className="text-gray-500 text-sm mt-2">Securing your session</p>
        </div>
      </div>
      </div>
    );
  }

  // Show splash screen before redirecting to dashboard
  if (showStartupSplash) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-white flex items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <div className="relative mb-8">
            <img 
              src="/img/stelsenlogo.png" 
              alt="Stelsen Logo" 
              className="h-24 w-24 object-contain bg-white rounded-3xl p-2 shadow-lg"
            />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-800 text-lg font-semibold">
              {splashType === 'logout' ? 'Logging out...' : 'Loading Stelsen...'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {splashType === 'log ut' ? 'See you next time!' : 'Preparing your dashboard'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (loggedIn && user) {
    if (!locationReady) {
      return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-white flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Location Needed</h2>
            <p className="text-sm text-gray-600 mb-6">
              Please enable location to access the dashboard.
            </p>
            <button
              onClick={() => {
                triggerHaptic();
                requestLocationAccess();
              }}
              disabled={isRequestingLocation}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isRequestingLocation ? "Requesting..." : "Enable Location"}
            </button>
            <p className="text-xs text-gray-500 mt-3">
              {locationRequestError
                ? locationRequestError
                : locationCheckComplete && !locationReady
                  ? "Location not detected."
                  : ""}
            </p>
            {locationCheckComplete && (
              <p className="text-xs text-gray-400 mt-2">
                If denied, allow location in browser settings.
              </p>
            )}
          </div>
        </div>
      );
    }
    return user.account_type === "admin" ? (
      <AdminDashboard user={user} logout={handleLogout} />
    ) : (
      <UserDashboard user={user} logout={handleLogout} />
    );
  }

  //===================================== Render different auth views ==============================================
  const renderLoginView = () => (
    <>
      <div className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-fadeIn">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-emerald-600" size={20} />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-emerald-800">
                {success}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Mail className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type="email"
                className="pl-12 pr-4 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 ml-1">
                Password
              </label>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded-lg peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all duration-200"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
              </div>
              <span className="ml-3 text-sm text-gray-600">
                Remember me
              </span>
            </label>

            <button
              type="button"
              onClick={() => {
                setCurrentView(AUTH_VIEWS.FORGOT_PASSWORD);
                setError("");
                setSuccess("");
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-shake">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
                <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-4 font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                  isLoading 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
                } text-white`}
                >
                {isLoading ? (
                  <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                  </>
                ) : (
                  <>
                  <div className="flex items-center gap-3">
                    <span>Sign In</span>
                  </div>
                  </>
                )}
                </button>

                {/* Divider */}
          <div className="relative flex items-center justify-center py-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="mx-4 text-sm text-gray-500 font-medium">Or continue with</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Social Login */}
          <div className="flex gap-3">
            <GoogleLoginButton onLoginSuccess={handleGoogleLoginSuccess} />
          </div>
        </form>

        {/* Register Link */}
        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={() => {
                setCurrentView(AUTH_VIEWS.REGISTER);
                setError("");
                setSuccess("");
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </>
  );

  const renderRegisterView = () => (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Join Stelsen Monitoring and access your dashboard
        </p>

        <form onSubmit={handleRegister} className="space-y-5">

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Mail className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type="email"
                className="pl-12 pr-4 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Phone Number
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Phone className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type="tel"
                className="pl-12 pr-4 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="0910 123 4567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                required
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Confirm Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</p>
            <ul className="text-xs text-gray-600 space-y-2">
              <li className={`flex items-center gap-3 ${password.length >= 8 ? 'text-green-600' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${password.length >= 8 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className={`w-2 h-2 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                At least 8 characters
              </li>
              <li className={`flex items-center gap-3 ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${/[A-Z]/.test(password) ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                One uppercase letter
              </li>
              <li className={`flex items-center gap-3 ${/\d/.test(password) ? 'text-green-600' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${/\d/.test(password) ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className={`w-2 h-2 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                One number
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-600" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-emerald-800">{success}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => {
                setCurrentView(AUTH_VIEWS.LOGIN);
                setError("");
                setSuccess("");
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </>
  );

  const renderForgotPasswordView = () => (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
              setIsForgotPasswordOTPSent(false);
              setIsForgotPasswordOTPVerified(false);
              setForgotPasswordOTP("");
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Key className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {!isForgotPasswordOTPSent 
                  ? "Enter your email address and we'll send you a verification code."
                  : !isForgotPasswordOTPVerified
                    ? "Enter the OTP sent to your email to verify your identity."
                    : "Create a new password for your account."}
              </p>
            </div>
          </div>
        </div>

        {!isForgotPasswordOTPSent ? (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Mail className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                </div>
                <input
                  type="email"
                  className="pl-12 pr-4 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="text-red-500" size={20} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-emerald-600" size={20} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-emerald-800">{success}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                isLoading 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
              } text-white`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <Key size={20} />
                  <span>Send OTP</span>
                </>
              )}
            </button>
          </form>
        ) : !isForgotPasswordOTPVerified ? (
          <form onSubmit={handleVerifyForgotPasswordOTP} className="space-y-5">
            {/* OTP Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 ml-1">
                Verification Code
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Key className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                </div>
                <input
                  type="text"
                  maxLength="6"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className="pl-12 pr-4 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="000000"
                  value={forgotPasswordOTP}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setForgotPasswordOTP(value);
                    setError("");
                  }}
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="text-red-500" size={20} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-emerald-600" size={20} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-emerald-800">{success}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                isLoading 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
              } text-white`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Verify OTP</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 ml-1">
                New Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 ml-1">
                Confirm New Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="text-red-500" size={20} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-emerald-600" size={20} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-emerald-800">{success}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                isLoading 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
              } text-white`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Resetting password...</span>
                </>
              ) : (
                <>
                  <Key size={20} />
                  <span>Reset Password</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="text-center pt-4">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
              setIsForgotPasswordOTPSent(false);
              setIsForgotPasswordOTPVerified(false);
              setForgotPasswordOTP("");
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </>
  );

  const renderVerificationView = () => (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.REGISTER);
              setError("");
              setSuccess("");
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
        </div>

        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Mail className="text-blue-600" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Check your email
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            We've sent a 6-digit verification code to:
          </p>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 mb-6">
            <p className="font-medium text-gray-900 text-base">{email}</p>
          </div>
        </div>

        <form onSubmit={handleVerification} className="space-y-5">
          {/* Verification Code */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Verification Code
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Key className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type="text"
                maxLength="6"
                pattern="[0-9]*"
                inputMode="numeric"
                className="pl-12 pr-4 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                  setError("");
                }}
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-600" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-emerald-800">{success}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                <span>Verify Account</span>
              </>
            )}
          </button>
        </form>

        {/* Resend Code */}
        <div className="text-center pt-4">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendCode}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors text-base"
            >
              Resend code
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderResetPasswordView = () => (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Create New Password</h2>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Create a strong, new password for your account.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Confirm New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-600" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-emerald-800">{success}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Resetting password...</span>
              </>
            ) : (
              <>
                <Key size={20} />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );

  // Main render
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col overflow-x-hidden" style={{ overscrollBehavior: 'none', touchAction: 'pan-y' }}>
      {/* Full Screen Mobile App Container */}
      <div className="w-full min-h-screen flex flex-col overflow-x-hidden">
        
        {/* App Header with Logo - Mobile Optimized */}
        <div className="relative pt-10 pb-8 px-4 flex-shrink-0">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-2 left-80 w-32 h-32 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/20 rounded-full translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute bottom-0 right-80 w-24 h-24 bg-white/20 rounded-full translate-x-1/3 translate-y-1/3"></div>


          {/* App Logo/Image */}
          <div className="relative z-8 flex flex-col items-center">
            {/* App Icon - PNG Image */}
            <div className="mb-4">
              <img 
                src="/img/Stelsen Logo.png" 
                alt="Stelsen Logo" 
                className="h-32 w-auto object-contain bg-white rounded-2xl p-3 shadow-lg"
              />
            </div>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Smartphone className="text-white/90" size={16} />
                <p className="text-white/90 text-sm font-medium">
                  {currentView === AUTH_VIEWS.LOGIN && "Welcome back! Sign in to continue"}
                  {currentView === AUTH_VIEWS.REGISTER && "Join Stelsen Monitoring"}
                  {currentView === AUTH_VIEWS.FORGOT_PASSWORD && "Reset your password"}
                  {currentView === AUTH_VIEWS.VERIFICATION && "Verify your email"}
                  {currentView === AUTH_VIEWS.RESET_PASSWORD && "Create new password"}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 px-4 pt-6 md:px-8 pb-32 rounded-t-[2rem] bg-white shadow-lg">
          <div className="w-full max-w-md mx-auto">
            {/* Auth Card */}
            <div className="rounded-3xl shadow-xl border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-2xl">
              {/* Auth View Router */}
              {currentView === AUTH_VIEWS.LOGIN && renderLoginView()}
              {currentView === AUTH_VIEWS.REGISTER && renderRegisterView()}
              {currentView === AUTH_VIEWS.FORGOT_PASSWORD && renderForgotPasswordView()}
              {currentView === AUTH_VIEWS.VERIFICATION && renderVerificationView()}
              {currentView === AUTH_VIEWS.RESET_PASSWORD && renderResetPasswordView()}
            </div>
            
            {/* Footer - Inside scrollable area */}
            <div className="py-8 text-center mt-8">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{" "}
                <a href="#" className="text-blue-600 hover:underline font-medium">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline font-medium">
                  Privacy Policy
                </a>
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Stelsen Monitoring v2.0 • © 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
