import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ForgotPassword as ForgotPasswordComponent } from '../components/auth'
import toast from 'react-hot-toast'

function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  const handleSubmit = async (email) => {
    try {
      setError('')
      setLoading(true)
      await resetPassword(email)
      setSuccess(true)
      toast.success('Password reset email sent!')
    } catch (err) {
      console.error('Password reset error:', err)
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email address'
      case 'auth/invalid-email':
        return 'Invalid email address'
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later.'
      default:
        return 'An error occurred. Please try again.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
      <ForgotPasswordComponent
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        success={success}
      />
    </div>
  )
}

export default ForgotPassword