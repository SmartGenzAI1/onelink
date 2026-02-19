import { useState, useEffect } from 'react'
import { profileService } from '../services/firebaseService'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const profileData = await profileService.getByUserId(userId)
        setProfile(profileData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  const refresh = async () => {
    if (!userId) return
    try {
      setLoading(true)
      const profileData = await profileService.getByUserId(userId)
      setProfile(profileData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { profile, loading, error, refresh }
}

export default useProfile