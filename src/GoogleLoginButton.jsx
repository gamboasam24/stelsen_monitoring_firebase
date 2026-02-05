import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "./firebase";
import { ref, get, set } from "firebase/database";

const GoogleLoginButton = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerificationId, setOtpVerificationId] = useState("");
  const [googleUser, setGoogleUser] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);

  // Generate 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP to user's email via backend
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
      // Continue anyway - OTP is stored in database
      return true;
    }
  };

  // Verify OTP from user input
  const verifyOTP = async () => {
    if (otpCode.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    setIsVerifyingOTP(true);
    setOtpError("");

    try {
      const otpRef = ref(db, `otp_verifications/${otpVerificationId}`);
      const snap = await get(otpRef);

      if (!snap.exists()) {
        setOtpError("OTP expired or invalid");
        setIsVerifyingOTP(false);
        return;
      }

      const otpData = snap.val();
      const now = new Date().getTime();
      const expiryTime = new Date(otpData.created_at).getTime() + 10 * 60 * 1000; // 10 minutes

      if (now > expiryTime) {
        setOtpError("OTP has expired. Please request a new one.");
        setIsVerifyingOTP(false);
        return;
      }

      if (otpData.code !== otpCode) {
        setOtpError("Invalid OTP code");
        setIsVerifyingOTP(false);
        return;
      }

      // OTP is valid, proceed with login
      const profile = await ensureUserProfile(googleUser);
      
      if (profile) {
        // Delete the OTP after successful verification
        await set(otpRef, null);
        onLoginSuccess(profile);
        setShowOTPModal(false);
        setOtpCode("");
        setGoogleUser(null);
      } else {
        setOtpError("Failed to create user profile");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setOtpError("Error verifying OTP. Please try again.");
    }
    setIsVerifyingOTP(false);
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
        profile_image: firebaseUser.photoURL || extra.profile_image || null,
        name: extra.name || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "User"),
        created_at: new Date().toISOString()
      };
      await set(userRef, profile);
      return normalizeUserProfile(firebaseUser.uid, profile, firebaseUser.email);
    }
    return normalizeUserProfile(firebaseUser.uid, snap.val(), firebaseUser.email);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is an existing account
      const userRef = ref(db, `users/${result.user.uid}`);
      const snap = await get(userRef);
      const isExistingAccount = snap.exists();

      if (isExistingAccount) {
        // Send OTP for existing accounts
        const otp = generateOTP();
        const verificationId = `${result.user.uid}_${Date.now()}`;
        
        // Store OTP in database
        const otpRef = ref(db, `otp_verifications/${verificationId}`);
        await set(otpRef, {
          code: otp,
          email: result.user.email,
          uid: result.user.uid,
          created_at: new Date().toISOString()
        });

        // Send OTP email
        await sendOTPEmail(result.user.email, otp);

        // Show OTP modal
        setGoogleUser(result.user);
        setOtpVerificationId(verificationId);
        setShowOTPModal(true);
        setIsLoading(false);
      } else {
        // New account - proceed directly
        const profile = await ensureUserProfile(result.user);
        
        if (profile) {
          onLoginSuccess(profile);
        } else {
          console.error("Failed to create user profile");
          alert("Failed to create user profile");
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error during Google login:", error);
      setIsLoading(false);
      
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in popup was closed by user");
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log("Multiple popup requests cancelled");
      } else if (error.code === 'auth/unauthorized-domain') {
        console.error("Domain not authorized for Google Sign-In");
        alert("This domain is not authorized for Google Sign-In. Please contact support.");
      } else {
        console.error("Google Sign-In Error:", error.code, error.message);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        type="button"
        className={`w-full py-3.5 px-4 border-2 border-gray-200 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-3 ${
          isLoading 
            ? "bg-gray-100 cursor-not-allowed opacity-60" 
            : "bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]"
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-gray-600">Signing in...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-gray-700">Continue with Google</span>
          </>
        )}
      </button>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Your Account</h3>
            <p className="text-sm text-gray-600 mb-6">
              Enter the 6-digit code sent to your email
            </p>

            {otpError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <span className="text-sm text-red-700">{otpError}</span>
              </div>
            )}

            <input
              type="text"
              maxLength="6"
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtpCode(value);
                setOtpError("");
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-2xl tracking-widest font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-4"
            />

            <button
              onClick={verifyOTP}
              disabled={isVerifyingOTP || otpCode.length !== 6}
              className={`w-full py-3 px-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                isVerifyingOTP || otpCode.length !== 6
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
              } text-white`}
            >
              {isVerifyingOTP ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                "Verify OTP"
              )}
            </button>

            <button
              onClick={() => {
                setShowOTPModal(false);
                setOtpCode("");
                setOtpError("");
                setGoogleUser(null);
              }}
              className="w-full mt-3 py-3 px-4 font-medium rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleLoginButton;
