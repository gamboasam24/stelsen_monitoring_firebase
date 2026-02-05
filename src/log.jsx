import React, { useState, useEffect } from "react";
import { 
  Mail, Lock, Moon, SunMedium, Eye, EyeOff,
  AlertCircle, LogIn, Shield, UserPlus, ArrowLeft,
  User, Phone, Building, Key, CheckCircle, X
} from "lucide-react";

import UserDashboard from "./frontend/user-dashboard.jsx";
import AdminDashboard from "./frontend/admin-dashboard.jsx";

// Define different views for the auth flow
const AUTH_VIEWS = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot_password',
  VERIFICATION: 'verification',
  RESET_PASSWORD: 'reset_password'
};

function App() {
  // Auth states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // UI states
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth flow state
  const [currentView, setCurrentView] = useState(AUTH_VIEWS.LOGIN);
  const [verificationStep, setVerificationStep] = useState(1);
  const [verificationSent, setVerificationSent] = useState(false);

  // ✅ Check localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("auth_token");
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));   
      setLoggedIn(true);
    }
  }, []);

  // ✅ Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    setCurrentUser(null);
    setLoggedIn(false);
    setCurrentView(AUTH_VIEWS.LOGIN);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) return setError("Please enter email and password.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email.");

    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setIsLoading(true);

    fetch("/backend/login.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        setIsLoading(false);
        if (data.status === "success") {
          setSuccess("Login successful! Redirecting...");
          localStorage.setItem("auth_token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          setCurrentUser(data.user);
          setTimeout(() => {
            setLoggedIn(true);
          }, 1000);
        } else {
          setError(data.message || "Invalid credentials");
        }
      })
      .catch(() => {
        setIsLoading(false);
        setError("Network error. Try again.");
      });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!fullName || !email || !phone || !password || !confirmPassword ) {
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

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return setError("Please enter a valid phone number.");
    }

    setIsLoading(true);

    // Simulate registration - in production, replace with actual API call
    setTimeout(() => {
      setIsLoading(false);
      setVerificationSent(true);
      setCurrentView(AUTH_VIEWS.VERIFICATION);
      setSuccess("Verification code sent to your email!");
    }, 1500);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) return setError("Please enter your email address.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email.");

    setIsLoading(true);

    // Simulate forgot password - in production, replace with actual API call
    setTimeout(() => {
      setIsLoading(false);
      setSuccess("Password reset instructions sent to your email!");
      setVerificationSent(true);
      setCurrentView(AUTH_VIEWS.RESET_PASSWORD);
    }, 1500);
  };

  const handleVerification = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!verificationCode || verificationCode.length !== 6) {
      return setError("Please enter a valid 6-digit verification code.");
    }

    setIsLoading(true);

    // Simulate verification - in production, replace with actual API call
    setTimeout(() => {
      setIsLoading(false);
      setSuccess("Account verified successfully! You can now log in.");
      setCurrentView(AUTH_VIEWS.LOGIN);
    }, 1500);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword || newPassword.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setIsLoading(true);

    // Simulate password reset - in production, replace with actual API call
    setTimeout(() => {
      setIsLoading(false);
      setSuccess("Password reset successfully! You can now log in with your new password.");
      setCurrentView(AUTH_VIEWS.LOGIN);
      setNewPassword("");
      setConfirmPassword("");
    }, 1500);
  };

  const handleResendCode = () => {
    setSuccess("New verification code sent to your email!");
    setVerificationStep(1);
    setTimeout(() => setVerificationStep(2), 1000);
  };

  // Quick login for demo
  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setCurrentView(AUTH_VIEWS.LOGIN);
  };

  if (loggedIn && user) {
    return user.account_type === "admin" ? (
      <AdminDashboard user={user} logout={handleLogout} />
    ) : (
      <UserDashboard user={user} logout={handleLogout} />
    );
  }

  // Render different auth views
  const renderLoginView = () => (
    <>
      <div className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
            <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
            <span className="text-sm text-green-700 dark:text-green-300">
              {success}
            </span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Mail className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
              <input
                type="email"
                className="pl-12 pr-4 py-3.5 w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="pl-12 pr-12 py-3.5 w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                <div className="w-5 h-5 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all duration-200"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                  <div className="w-2.5 h-2.5 bg-white rounded"></div>
                </div>
              </div>
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
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
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="text-red-500 dark:text-red-400 flex-shrink-0" size={18} />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-[0.98] shadow-md"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">Or continue with</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          {/* Social Login */}
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#8B5CF6" d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.05 1.05 4.42L2 22l5.58-1.05C8.95 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.34 0-2.61-.36-3.73-1.01L7 19l-.93-.93C5.36 16.95 5 15.68 5 14c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
              <span>Viber</span>
            </button>

            <button
              type="button"
              className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>
        </form>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Don't have an account?{" "}
            <button
              onClick={() => {
                setCurrentView(AUTH_VIEWS.REGISTER);
                setError("");
                setSuccess("");
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline transition-colors"
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
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Create Account</h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Join Stelsen Monitoring and access your dashboard
        </p>

        <form onSubmit={handleRegister} className="space-y-5">

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address *
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Mail className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
              <input
                type="email"
                className="pl-12 pr-4 py-3.5 w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number *
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Phone className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
              <input
                type="tel"
                className="pl-12 pr-4 py-3.5 w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password *
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="pl-12 pr-12 py-3.5 w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password *
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="pl-12 pr-12 py-3.5 w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Confirm your password"
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
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Password must contain:</p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                At least 8 characters
              </li>
              <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                One uppercase letter
              </li>
              <li className={`flex items-center gap-1 ${/\d/.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                One number
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="text-red-500 dark:text-red-400 flex-shrink-0" size={18} />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
              <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
              <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-[0.98] shadow-md"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <button
              onClick={() => {
                setCurrentView(AUTH_VIEWS.LOGIN);
                setError("");
                setSuccess("");
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline transition-colors"
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
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Reset Password</h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Enter your email address and we'll send you instructions to reset your password.
        </p>

        <form onSubmit={handleForgotPassword} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Mail className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
              <input
                type="email"
                className="pl-12 pr-4 py-3.5 w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
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
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="text-red-500 dark:text-red-400 flex-shrink-0" size={18} />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
              <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
              <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-[0.98] shadow-md"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending instructions...</span>
              </>
            ) : (
              <>
                <Key size={18} />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="text-center pt-4">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline transition-colors"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    </>
  );

  const renderVerificationView = () => (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.REGISTER);
              setError("");
              setSuccess("");
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Verify Your Email</h2>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-blue-600 dark:text-blue-400" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Check your email
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            We've sent a 6-digit verification code to:
            <br />
            <span className="font-medium text-gray-800 dark:text-white">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerification} className="space-y-5">
          {/* Verification Code */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Verification Code
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Key className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
              <input
                type="text"
                maxLength="6"
                pattern="[0-9]*"
                inputMode="numeric"
                className="pl-12 pr-4 py-3.5 w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="text-red-500 dark:text-red-400 flex-shrink-0" size={18} />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
              <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
              <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-[0.98] shadow-md"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Verify Account</span>
              </>
            )}
          </button>
        </form>

        {/* Resend Code */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Didn't receive the code?{" "}
            <button
              onClick={handleResendCode}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline transition-colors"
            >
              Resend code
            </button>
          </p>
          {verificationSent && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              New code sent! Check your email.
            </p>
          )}
        </div>
      </div>
    </>
  );

  const renderResetPasswordView = () => (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Create New Password</h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Enter your new password below.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                className="pl-12 pr-12 py-3.5 w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="pl-12 pr-12 py-3.5 w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="text-red-500 dark:text-red-400 flex-shrink-0" size={18} />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
              <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
              <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-[0.98] shadow-md"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Resetting password...</span>
              </>
            ) : (
              <>
                <Key size={18} />
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
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6 transition-all duration-500">
        
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed top-6 right-6 p-3 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-lg hover:scale-110 transition-all duration-300 z-50 border border-gray-200 dark:border-gray-700 hover:shadow-xl"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <SunMedium size={22} className="text-yellow-400" />
          ) : (
            <Moon size={22} className="text-gray-900" />
          )}
        </button>

        {/* Mobile App Card */}
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-3xl">
          
          {/* App Header with Logo */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-8 pt-12">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              {/* Logo */}
              <div className="mb-4 bg-white rounded-2xl shadow-lg inline-block">
                <img 
                  src="/img/Stelsen%20Logo.png"
                  alt="Stelsen Logo"
                  className="w-80 h-24 object-contain p-2"
                />
              </div>
              
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">
                  Stelsen Monitoring
                </h1>
                <p className="text-white/80 text-sm">
                  {currentView === AUTH_VIEWS.LOGIN && "Secure access to your monitoring dashboard"}
                  {currentView === AUTH_VIEWS.REGISTER && "Create your monitoring account"}
                  {currentView === AUTH_VIEWS.FORGOT_PASSWORD && "Reset your password"}
                  {currentView === AUTH_VIEWS.VERIFICATION && "Verify your email"}
                  {currentView === AUTH_VIEWS.RESET_PASSWORD && "Set new password"}
                </p>
              </div>
            </div>
          </div>

          {/* Auth Content */}
          <div className="p-8">
            {/* Auth View Router */}
            {currentView === AUTH_VIEWS.LOGIN && renderLoginView()}
            {currentView === AUTH_VIEWS.REGISTER && renderRegisterView()}
            {currentView === AUTH_VIEWS.FORGOT_PASSWORD && renderForgotPasswordView()}
            {currentView === AUTH_VIEWS.VERIFICATION && renderVerificationView()}
            {currentView === AUTH_VIEWS.RESET_PASSWORD && renderResetPasswordView()}

            {/* App Download Links */}
            {currentView === AUTH_VIEWS.LOGIN && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
                  Get the mobile app
                </p>
                <div className="flex gap-2">
                  <a
                    href="#"
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    App Store
                  </a>
                  <a
                    href="#"
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L15.65 12 3.84 21.85c-.5-.25-.84-.77-.84-1.35zm17.07-8.62c.39-.26.62-.68.62-1.12 0-.44-.23-.86-.62-1.12l-14-8.96c-.35-.22-.78-.22-1.13 0-.35.23-.57.63-.57 1.07v17.93c0 .44.22.84.57 1.07.18.12.38.18.57.18.19 0 .39-.06.56-.18l14-8.96z"/>
                    </svg>
                    Play Store
                  </a>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By continuing, you agree to our{" "}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </a>
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Stelsen Monitoring v1.0 • © 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;