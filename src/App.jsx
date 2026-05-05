import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Upload Page */}
        <Route path="/" element={<UploadPage />} />

        {/* Hidden Admin Login — no link from public site */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard */}
        <Route
          path="/uploads"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all → redirect to home */}
        <Route path="*" element={<UploadPage />} />
      </Routes>
    </BrowserRouter>
  );
}
