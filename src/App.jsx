import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Analytics from './pages/Analytics'
import Templates from './pages/Templates'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import Privacy from './pages/Privacy'
import About from './pages/About'
import Terms from './pages/Terms'
import Contact from './pages/Contact'

// Auth Components
import { EmailVerification } from './components/auth'

// Components
import PrivateRoute, { PrivateRouteNoVerification } from './components/router/PrivateRoute'
import PublicRoute from './components/router/PublicRoute'
import ErrorBoundary from './components/ErrorBoundary'

// Reserved usernames that should not be treated as profile URLs
const RESERVED_USERNAMES = [
  'login',
  'register',
  'forgot-password',
  'verify-email',
  'dashboard',
  'editor',
  'analytics',
  'templates',
  'settings',
  'u',
  'api',
  'admin',
  'auth',
  'about',
  'pricing',
  'features',
  'blog',
  'help',
  'support',
  'terms',
  'privacy',
  'contact',
]

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Email Verification Route - requires auth but not verification */}
          <Route 
            path="/verify-email" 
            element={<PrivateRouteNoVerification><EmailVerification /></PrivateRouteNoVerification>} 
          />
          
          {/* Protected Routes - require email verification */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/editor" element={<PrivateRoute><Editor /></PrivateRoute>} />
          <Route path="/editor/:section" element={<PrivateRoute><Editor /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
          <Route path="/templates" element={<PrivateRoute><Templates /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          
          {/* Profile Routes - Multiple URL formats */}
          {/* /u/username format */}
          <Route path="/u/:username" element={<Profile />} />
          {/* /@username format */}
          <Route path="/@:username" element={<Profile />} />
          {/* /username format (catch-all for usernames, must be last) */}
          <Route path="/:username" element={<Profile />} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ErrorBoundary>
  )
}

export default App