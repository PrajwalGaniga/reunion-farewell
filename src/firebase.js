import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8tjAr54dQZr0xM9nupbxgtY54ge06QMQ",
  authDomain: "reunion-uploads.firebaseapp.com",
  projectId: "reunion-uploads",
  storageBucket: "reunion-uploads.firebasestorage.app",
  messagingSenderId: "364610835999",
  appId: "1:364610835999:web:a24ceef866715a68f1272a",
};
console.log("🔥 Using HARDCODED Firebase config — test build");


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

