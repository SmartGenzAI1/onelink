import { useState, useEffect } from 'react'
import { analyticsService } from '../services/firebaseService'

export function useAnalytics(profileId, dateRange = null) {
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profileId) {
      setLoading(false)
      return
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const analyticsData = await analyticsService.getAnalytics(profileId, dateRange)
        setAnalytics(analyticsData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [profileId, dateRange])

  const trackView = async (visitorData) => {
    try {
      await analyticsService.trackView(profileId, visitorData)
    } catch (err) {
      console.error('Error tracking view:', err)
    }
  }

  const trackClick = async (linkId, linkTitle, visitorData) => {
    try {
      await analyticsService.trackClick(profileId, linkId, linkTitle, visitorData)
    } catch (err) {
      console.error('Error tracking click:', err)
    }
  }

  return { 
    analytics, 
    loading, 
    error, 
    trackView, 
    trackClick 
  }
}

export default useAnalytics