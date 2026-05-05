import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// ── DIAGNOSTIC (safe to push — no full secrets exposed) ──────────────────────
const k = firebaseConfig.apiKey;
console.group("🔥 Firebase Diagnostic");
console.log("apiKey defined?   :", !!k);
console.log("apiKey prefix     :", k ? k.slice(0, 14) + "…" : "UNDEFINED ❌");
console.log("expected prefix   :", "AIzaSyC8tjAr54…");
console.log("prefix match?     :", k?.startsWith("AIzaSyC8tjAr54") ? "✅ YES" : "❌ NO — wrong key in env vars!");
console.log("authDomain        :", firebaseConfig.authDomain ?? "UNDEFINED ❌");
console.log("projectId         :", firebaseConfig.projectId ?? "UNDEFINED ❌");
console.log("appId defined?    :", !!firebaseConfig.appId);
if (!k) {
  console.error("💥 REACT_APP_FIREBASE_API_KEY is missing from the build. Env vars were not set before deploy — redeploy now.");
} else if (!k.startsWith("AIzaSyC8tjAr54")) {
  console.error("💥 API key value in Vercel/Netlify doesn't match the expected key. Check env var for typos.");
} else {
  console.log("ℹ️  Key looks correct. If login still fails → Google Cloud Console has HTTP referrer restrictions. Set Application Restrictions to None.");
}
console.groupEnd();
// ─────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

