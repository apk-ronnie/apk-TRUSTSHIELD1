import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import History from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scanner"
                element={
                  <ProtectedRoute>
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />

              {/* Fallback redirection */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Global Footer */}
          <footer className="border-t border-slate-800/80 bg-[#0B0F19] py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-400">TrustShield AI</span>
                <span>•</span>
                <span>Contextual PII Redaction & Phishing Detection</span>
              </div>
              <p>Privacy First Architecture • Zero Raw-Payload Retention Protocol</p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

