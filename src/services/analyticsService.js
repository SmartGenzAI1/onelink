import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { analyticsService as baseAnalyticsService, linkService, profileService } from './firebaseService'

// Date range helper functions
const getDateRange = (range) => {
  const now = new Date()
  const ranges = {
    today: {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    },
    yesterday: {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0],
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0]
    },
    last7days: {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    },
    last30days: {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    },
    last90days: {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90).toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    },
    alltime: {
      start: null,
      end: now.toISOString().split('T')[0]
    }
  }
  return ranges[range] || ranges.last7days
}

// Analytics Service with enhanced methods
export const analyticsService = {
  /**
   * Get profile view counts for a date range
   * @param {string} profileId - Profile ID
   * @param {string} dateRange - Date range key
   * @returns {Promise<Object>} View statistics
   */
  async getProfileViews(profileId, dateRange = 'last7days') {
    try {
      const range = getDateRange(dateRange)
      const analyticsRef = collection(db, 'profiles', profileId, 'analytics')
      
      let q
      if (range.start) {
        q = query(
          analyticsRef,
          where('type', '==', 'view'),
          where('date', '>=', range.start),
          where('date', '<=', range.end),
          orderBy('date', 'asc')
        )
      } else {
        q = query(
          analyticsRef,
          where('type', '==', 'view'),
          orderBy('date', 'asc')
        )
      }
      
      const snapshot = await getDocs(q)
      const views = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Aggregate by date
      const viewsByDate = views.reduce((acc, view) => {
        const date = view.date
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})
      
      // Calculate unique visitors (by ipHash)
      const uniqueVisitors = new Set(views.map(v => v.visitorData?.ipHash)).size
      
      return {
        total: views.length,
        unique: uniqueVisitors,
        byDate: viewsByDate,
        data: views
      }
    } catch (error) {
      console.error('Error getting profile views:', error)
      throw error
    }
  },

  /**
   * Get link click counts for a date range
   * @param {string} profileId - Profile ID
   * @param {string} dateRange - Date range key
   * @returns {Promise<Object>} Click statistics
   */
  async getLinkClicks(profileId, dateRange = 'last7days') {
    try {
      const range = getDateRange(dateRange)
      const analyticsRef = collection(db, 'profiles', profileId, 'analytics')
      
      let q
      if (range.start) {
        q = query(
          analyticsRef,
          where('type', '==', 'click'),
          where('date', '>=', range.start),
          where('date', '<=', range.end),
          orderBy('date', 'asc')
        )
      } else {
        q = query(
          analyticsRef,
          where('type', '==', 'click'),
          orderBy('date', 'asc')
        )
      }
      
      const snapshot = await getDocs(q)
      const clicks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Aggregate by date
      const clicksByDate = clicks.reduce((acc, click) => {
        const date = click.date
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})
      
      // Aggregate by link
      const clicksByLink = clicks.reduce((acc, click) => {
        const linkId = click.linkId
        acc[linkId] = (acc[linkId] || 0) + 1
        return acc
      }, {})
      
      return {
        total: clicks.length,
        byDate: clicksByDate,
        byLink: clicksByLink,
        data: clicks
      }
    } catch (error) {
      console.error('Error getting link clicks:', error)
      throw error
    }
  },

  /**
   * Get top performing links
   * @param {string} profileId - Profile ID
   * @param {number} limitCount - Number of links to return
   * @returns {Promise<Array>} Top links with click data
   */
  async getTopLinks(profileId, limitCount = 5) {
    try {
      // Get all links for the profile
      const links = await linkService.getByProfileId(profileId)
      
      // Get click data for each link
      const linksWithClicks = await Promise.all(
        links.map(async (link) => {
          const analyticsRef = collection(db, 'profiles', profileId, 'analytics')
          const q = query(
            analyticsRef,
            where('type', '==', 'click'),
            where('linkId', '==', link.id)
          )
          const snapshot = await getDocs(q)
          const clicks = snapshot.size
          
          return {
            ...link,
            clickCount: clicks,
            ctr: 0 // Will be calculated after getting total views
          }
        })
      )
      
      // Sort by click count and limit
      const sortedLinks = linksWithClicks
        .sort((a, b) => b.clickCount - a.clickCount)
        .slice(0, limitCount)
      
      return sortedLinks
    } catch (error) {
      console.error('Error getting top links:', error)
      throw error
    }
  },

  /**
   * Get device breakdown statistics
   * @param {string} profileId - Profile ID
   * @returns {Promise<Object>} Device statistics
   */
  async getDeviceBreakdown(profileId) {
    try {
      const analyticsRef = collection(db, 'profiles', profileId, 'analytics')
      const snapshot = await getDocs(analyticsRef)
      const events = snapshot.docs.map(doc => doc.data())
      
      const deviceCounts = events.reduce((acc, event) => {
        const device = event.visitorData?.device || 'unknown'
        acc[device] = (acc[device] || 0) + 1
        return acc
      }, {})
      
      const total = Object.values(deviceCounts).reduce((sum, count) => sum + count, 0)
      
      return {
        mobile: deviceCounts.mobile || 0,
        desktop: deviceCounts.desktop || 0,
        tablet: deviceCounts.tablet || 0,
        unknown: deviceCounts.unknown || 0,
        percentages: {
          mobile: total ? Math.round((deviceCounts.mobile || 0) / total * 100) : 0,
          desktop: total ? Math.round((deviceCounts.desktop || 0) / total * 100) : 0,
          tablet: total ? Math.round((deviceCounts.tablet || 0) / total * 100) : 0,
          unknown: total ? Math.round((deviceCounts.unknown || 0) / total * 100) : 0
        },
        total
      }
    } catch (error) {
      console.error('Error getting device breakdown:', error)
      throw error
    }
  },

  /**
   * Get geographic distribution data
   * @param {string} profileId - Profile ID
   * @returns {Promise<Object>} Geographic statistics
   */
  async getGeographicData(profileId) {
    try {
      const analyticsRef = collection(db, 'profiles', profileId, 'analytics')
      const snapshot = await getDocs(analyticsRef)
      const events = snapshot.docs.map(doc => doc.data())
      
      const countryCounts = events.reduce((acc, event) => {
        const country = event.visitorData?.country || 'Unknown'
        acc[country] = (acc[country] || 0) + 1
        return acc
      }, {})
      
      const total = Object.values(countryCounts).reduce((sum, count) => sum + count, 0)
      
      // Convert to array and sort by count
      const countries = Object.entries(countryCounts)
        .map(([country, count]) => ({
          country,
          count,
          percentage: total ? Math.round(count / total * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
      
      return {
        countries,
        total,
        topCountries: countries.slice(0, 10)
      }
    } catch (error) {
      console.error('Error getting geographic data:', error)
      throw error
    }
  },

  /**
   * Get referral sources
   * @param {string} profileId - Profile ID
   * @returns {Promise<Object>} Referral statistics
   */
  async getReferralSources(profileId) {
    try {
      const analyticsRef = collection(db, 'profiles', profileId, 'analytics')
      const snapshot = await getDocs(analyticsRef)
      const events = snapshot.docs.map(doc => doc.data())
      
      const referrerCounts = events.reduce((acc, event) => {
        let referrer = event.visitorData?.referrer || 'Direct'
        
        // Parse and categorize referrer
        if (referrer !== 'Direct') {
          try {
            const url = new URL(referrer)
            referrer = url.hostname.replace('www.', '')
          } catch {
            referrer = 'Unknown'
          }
        }
        
        acc[referrer] = (acc[referrer] || 0) + 1
        return acc
      }, {})
      
      const total = Object.values(referrerCounts).reduce((sum, count) => sum + count, 0)
      
      // Convert to array and sort by count
      const referrers = Object.entries(referrerCounts)
        .map(([source, count]) => ({
          source,
          count,
          percentage: total ? Math.round(count / total * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
      
      return {
        referrers,
        total,
        topReferrers: referrers.slice(0, 10)
      }
    } catch (error) {
      console.error('Error getting referral sources:', error)
      throw error
    }
  },

  /**
   * Get browser breakdown
   * @param {string} profileId - Profile ID
   * @returns {Promise<Object>} Browser statistics
   */
  async getBrowserBreakdown(profileId) {
    try {
      const analyticsRef = collection(db, 'profiles', profileId, 'analytics')
      const snapshot = await getDocs(analyticsRef)
      const events = snapshot.docs.map(doc => doc.data())
      
      const browserCounts = events.reduce((acc, event) => {
        const browser = event.visitorData?.browser || 'Unknown'
        acc[browser] = (acc[browser] || 0) + 1
        return acc
      }, {})
      
      const total = Object.values(browserCounts).reduce((sum, count) => sum + count, 0)
      
      const browsers = Object.entries(browserCounts)
        .map(([browser, count]) => ({
          browser,
          count,
          percentage: total ? Math.round(count / total * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
      
      return {
        browsers,
        total
      }
    } catch (error) {
      console.error('Error getting browser breakdown:', error)
      throw error
    }
  },

  /**
   * Get overview statistics
   * @param {string} profileId - Profile ID
   * @param {string} dateRange - Date range key
   * @returns {Promise<Object>} Overview statistics
   */
  async getOverviewStats(profileId, dateRange = 'last7days') {
    try {
      const [views, clicks, profile] = await Promise.all([
        this.getProfileViews(profileId, dateRange),
        this.getLinkClicks(profileId, dateRange),
        profileService.getById(profileId)
      ])
      
      const totalViews = views.total
      const totalClicks = clicks.total
      const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0
      
      return {
        totalViews,
        totalClicks,
        uniqueVisitors: views.unique,
        ctr: parseFloat(ctr),
        linkCount: profile?.stats?.linkCount || 0,
        lifetimeViews: profile?.stats?.totalViews || 0,
        lifetimeClicks: profile?.stats?.totalClicks || 0
      }
    } catch (error) {
      console.error('Error getting overview stats:', error)
      throw error
    }
  },

  /**
   * Get time-based analytics (hourly breakdown)
   * @param {string} profileId - Profile ID
   * @returns {Promise<Object>} Hourly statistics
   */
  async getTimeAnalytics(profileId) {
    try {
      const analyticsRef = collection(db, 'profiles', profileId, 'analytics')
      const snapshot = await getDocs(analyticsRef)
      const events = snapshot.docs.map(doc => doc.data())
      
      const hourlyData = events.reduce((acc, event) => {
        const hour = event.hour ?? new Date(event.timestamp?.toDate?.() || new Date()).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {})
      
      // Fill in missing hours with 0
      const fullHourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: hourlyData[i] || 0
      }))
      
      return {
        hourly: fullHourlyData,
        peakHour: fullHourlyData.reduce((max, curr) => 
          curr.count > max.count ? curr : max, { hour: 0, count: 0 })
      }
    } catch (error) {
      console.error('Error getting time analytics:', error)
      throw error
    }
  },

  /**
   * Export analytics data to CSV
   * @param {string} profileId - Profile ID
   * @param {string} format - Export format (csv, json)
   * @returns {Promise<string>} Exported data
   */
  async exportAnalytics(profileId, format = 'csv') {
    try {
      const [views, clicks, deviceData, geoData, referrerData] = await Promise.all([
        this.getProfileViews(profileId, 'alltime'),
        this.getLinkClicks(profileId, 'alltime'),
        this.getDeviceBreakdown(profileId),
        this.getGeographicData(profileId),
        this.getReferralSources(profileId)
      ])
      
      const exportData = {
        profileId,
        exportedAt: new Date().toISOString(),
        summary: {
          totalViews: views.total,
          totalClicks: clicks.total,
          uniqueVisitors: views.unique
        },
        viewsByDate: views.byDate,
        clicksByDate: clicks.byDate,
        deviceBreakdown: deviceData,
        geographicData: geoData.topCountries,
        referralSources: referrerData.topReferrers
      }
      
      if (format === 'json') {
        return JSON.stringify(exportData, null, 2)
      }
      
      // CSV format
      let csv = 'OneLink Analytics Export\n'
      csv += `Exported At,${exportData.exportedAt}\n\n`
      
      csv += 'Summary\n'
      csv += 'Metric,Value\n'
      csv += `Total Views,${exportData.summary.totalViews}\n`
      csv += `Total Clicks,${exportData.summary.totalClicks}\n`
      csv += `Unique Visitors,${exportData.summary.uniqueVisitors}\n\n`
      
      csv += 'Views by Date\n'
      csv += 'Date,Views\n'
      Object.entries(views.byDate).forEach(([date, count]) => {
        csv += `${date},${count}\n`
      })
      csv += '\n'
      
      csv += 'Clicks by Date\n'
      csv += 'Date,Clicks\n'
      Object.entries(clicks.byDate).forEach(([date, count]) => {
        csv += `${date},${count}\n`
      })
      csv += '\n'
      
      csv += 'Device Breakdown\n'
      csv += 'Device,Count,Percentage\n'
      csv += `Mobile,${deviceData.mobile},${deviceData.percentages.mobile}%\n`
      csv += `Desktop,${deviceData.desktop},${deviceData.percentages.desktop}%\n`
      csv += `Tablet,${deviceData.tablet},${deviceData.percentages.tablet}%\n\n`
      
      csv += 'Top Countries\n'
      csv += 'Country,Visits,Percentage\n'
      geoData.topCountries.forEach(c => {
        csv += `${c.country},${c.count},${c.percentage}%\n`
      })
      csv += '\n'
      
      csv += 'Top Referrers\n'
      csv += 'Source,Visits,Percentage\n'
      referrerData.topReferrers.forEach(r => {
        csv += `${r.source},${r.count},${r.percentage}%\n`
      })
      
      return csv
    } catch (error) {
      console.error('Error exporting analytics:', error)
      throw error
    }
  },

  /**
   * Download analytics as file
   * @param {string} profileId - Profile ID
   * @param {string} format - Export format (csv, json)
   */
  async downloadAnalytics(profileId, format = 'csv') {
    try {
      const data = await this.exportAnalytics(profileId, format)
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `onelink-analytics-${profileId}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading analytics:', error)
      throw error
    }
  },

  /**
   * Get comparison data (current vs previous period)
   * @param {string} profileId - Profile ID
   * @param {string} dateRange - Date range key
   * @returns {Promise<Object>} Comparison statistics
   */
  async getComparisonData(profileId, dateRange = 'last7days') {
    try {
      const now = new Date()
      const range = getDateRange(dateRange)
      
      // Calculate previous period
      let previousStart, previousEnd
      if (range.start) {
        const startDate = new Date(range.start)
        const endDate = new Date(range.end)
        const diff = endDate - startDate
        previousEnd = new Date(startDate.getTime() - 1)
        previousStart = new Date(previousEnd.getTime() - diff)
      }
      
      // Get current period data
      const currentViews = await this.getProfileViews(profileId, dateRange)
      const currentClicks = await this.getLinkClicks(profileId, dateRange)
      
      // Get previous period data (simplified - using all time for now)
      const allViews = await this.getProfileViews(profileId, 'alltime')
      const allClicks = await this.getLinkClicks(profileId, 'alltime')
      
      // Calculate growth (mock comparison for now)
      const viewsGrowth = allViews.total > 0 
        ? ((currentViews.total / Math.max(allViews.total - currentViews.total, 1)) * 100 - 100).toFixed(1)
        : 0
      const clicksGrowth = allClicks.total > 0
        ? ((currentClicks.total / Math.max(allClicks.total - currentClicks.total, 1)) * 100 - 100).toFixed(1)
        : 0
      
      return {
        views: {
          current: currentViews.total,
          growth: parseFloat(viewsGrowth)
        },
        clicks: {
          current: currentClicks.total,
          growth: parseFloat(clicksGrowth)
        },
        uniqueVisitors: {
          current: currentViews.unique,
          growth: 0
        }
      }
    } catch (error) {
      console.error('Error getting comparison data:', error)
      throw error
    }
  }
}

export default analyticsService
