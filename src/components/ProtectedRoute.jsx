import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = React.useState(undefined);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  if (user === undefined) {
    // Still loading auth state
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Checking access...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
