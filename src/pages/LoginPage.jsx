import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { ALLOWED_EMAILS } from "../auth/allowedUsers";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Google state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setEmailError("");
    if (!email.trim() || !password.trim()) {
      setEmailError("Please enter both email and password.");
      return;
    }
    setEmailLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      navigate("/uploads", { replace: true });
    } catch (err) {
      console.error("❌ Email login error:", err.code, err.message);
      const messages = {
        "auth/user-not-found": "No account found with that email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-email": "Invalid email format.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "API key rejected by Firebase. Check Google Cloud Console → API Keys → remove restrictions.",
      };
      setEmailError(`${messages[err.code] || err.message} [code: ${err.code}]`);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleError("");
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedInEmail = result.user.email;

      if (!ALLOWED_EMAILS.includes(loggedInEmail)) {
        await signOut(auth);
        setGoogleError("You don't have access. Contact the organizer to be added.");
        return;
      }

      navigate("/uploads", { replace: true });
    } catch (err) {
      console.error("❌ Google login error:", err.code, err.message);
      if (err.code === "auth/popup-closed-by-user") {
        setGoogleError("Sign-in popup was closed. Please try again.");
      } else {
        setGoogleError(`${err.message} [code: ${err.code}]`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />

      <div className="login-container">
        <div className="login-header">
          <div className="login-lock">🔐</div>
          <h1>Admin Access</h1>
          <p>Only authorized organizers can sign in here.</p>
        </div>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={`tab-btn ${activeTab === "email" ? "tab-btn--active" : ""}`}
            onClick={() => { setActiveTab("email"); setGoogleError(""); setEmailError(""); }}
          >
            ✉️ Email Login
          </button>
          <button
            className={`tab-btn ${activeTab === "google" ? "tab-btn--active" : ""}`}
            onClick={() => { setActiveTab("google"); setGoogleError(""); setEmailError(""); }}
          >
            🔵 Google Login
          </button>
        </div>

        <div className="login-card">
          {/* Email Tab */}
          {activeTab === "email" && (
            <form className="login-form" onSubmit={handleEmailLogin} noValidate>
              <div className="login-form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={emailLoading}
                  autoComplete="email"
                />
              </div>
              <div className="login-form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={emailLoading}
                  autoComplete="current-password"
                />
              </div>
              {emailError && (
                <div className="login-error" role="alert">⚠️ {emailError}</div>
              )}
              <button type="submit" className="login-btn" disabled={emailLoading}>
                {emailLoading ? (
                  <span className="btn-loading-row">
                    <span className="spinner-sm" /> Signing In...
                  </span>
                ) : "Sign In"}
              </button>
            </form>
          )}

          {/* Google Tab */}
          {activeTab === "google" && (
            <div className="google-tab">
              <p className="google-tab__desc">
                Sign in with a whitelisted Google account to access the dashboard.
              </p>
              {googleError && (
                <div className="login-error" role="alert">⚠️ {googleError}</div>
              )}
              <button
                className="google-btn"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <span className="btn-loading-row">
                    <span className="spinner-sm" /> Connecting...
                  </span>
                ) : (
                  <span className="btn-loading-row">
                    <GoogleIcon />
                    Continue with Google
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
