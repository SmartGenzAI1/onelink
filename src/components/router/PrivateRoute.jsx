import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Loading } from '../ui'

function PrivateRoute({ children, requireVerification = true }) {
  const { currentUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading fullScreen text="Loading..." />
  }

  // Not logged in - redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check email verification if required
  if (requireVerification && !currentUser.emailVerified) {
    // Check if the user signed up with OAuth (they don't need email verification)
    const isOAuthUser = currentUser.providerData.some(
      provider => provider.providerId === 'google.com' || provider.providerId === 'github.com'
    )
    
    if (!isOAuthUser) {
      return <Navigate to="/verify-email" state={{ from: location }} replace />
    }
  }

  return children
}

// Higher-order component for routes that don't require email verification
export function PrivateRouteNoVerification({ children }) {
  return <PrivateRoute requireVerification={false}>{children}</PrivateRoute>
}

export default PrivateRoute