import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore'
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage'
import { db, storage } from '../config/firebase'

// ==================== USER OPERATIONS ====================

export const userService = {
  // Get user by ID
  async getById(userId) {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() }
    }
    return null
  },

  // Get user by username
  async getByUsername(username) {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('username', '==', username), limit(1))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0]
      return { id: userDoc.id, ...userDoc.data() }
    }
    return null
  },

  // Update user
  async update(userId, data) {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  },

  // Check if username is available
  async isUsernameAvailable(username) {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('username', '==', username), limit(1))
    const snapshot = await getDocs(q)
    return snapshot.empty
  }
}

// ==================== PROFILE OPERATIONS ====================

export const profileService = {
  // Get profile by ID
  async getById(profileId) {
    const profileRef = doc(db, 'profiles', profileId)
    const profileDoc = await getDoc(profileRef)
    if (profileDoc.exists()) {
      return { id: profileDoc.id, ...profileDoc.data() }
    }
    return null
  },

  // Get profile by username
  async getByUsername(username) {
    const profilesRef = collection(db, 'profiles')
    const q = query(profilesRef, where('username', '==', username), limit(1))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const profileDoc = snapshot.docs[0]
      return { id: profileDoc.id, ...profileDoc.data() }
    }
    return null
  },

  // Get profile by user ID
  async getByUserId(userId) {
    const profilesRef = collection(db, 'profiles')
    const q = query(profilesRef, where('userId', '==', userId), limit(1))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const profileDoc = snapshot.docs[0]
      return { id: profileDoc.id, ...profileDoc.data() }
    }
    return null
  },

  // Create profile
  async create(userId, data) {
    const profileRef = doc(collection(db, 'profiles'))
    const profileData = {
      id: profileRef.id,
      userId,
      ...data,
      stats: {
        totalViews: 0,
        totalClicks: 0,
        linkCount: 0
      },
      isPublished: false,
      isVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: null
    }
    await setDoc(profileRef, profileData)
    return profileData
  },

  // Update profile
  async update(profileId, data) {
    const profileRef = doc(db, 'profiles', profileId)
    await updateDoc(profileRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  },

  // Publish profile
  async publish(profileId) {
    const profileRef = doc(db, 'profiles', profileId)
    await updateDoc(profileRef, {
      isPublished: true,
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  },

  // Unpublish profile
  async unpublish(profileId) {
    const profileRef = doc(db, 'profiles', profileId)
    await updateDoc(profileRef, {
      isPublished: false,
      updatedAt: serverTimestamp()
    })
  },

  // Increment view count
  async incrementViews(profileId) {
    const profileRef = doc(db, 'profiles', profileId)
    await updateDoc(profileRef, {
      'stats.totalViews': increment(1)
    })
  },

  // Increment click count
  async incrementClicks(profileId) {
    const profileRef = doc(db, 'profiles', profileId)
    await updateDoc(profileRef, {
      'stats.totalClicks': increment(1)
    })
  }
}

// ==================== LINK OPERATIONS ====================

export const linkService = {
  // Get all links for a profile
  async getByProfileId(profileId) {
    const linksRef = collection(db, 'links')
    const q = query(
      linksRef, 
      where('profileId', '==', profileId),
      orderBy('order', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  },

  // Get single link
  async getById(linkId) {
    const linkRef = doc(db, 'links', linkId)
    const linkDoc = await getDoc(linkRef)
    if (linkDoc.exists()) {
      return { id: linkDoc.id, ...linkDoc.data() }
    }
    return null
  },

  // Create link
  async create(profileId, userId, data) {
    // Get current link count for ordering
    const links = await this.getByProfileId(profileId)
    const nextOrder = links.length

    const linkRef = doc(collection(db, 'links'))
    const linkData = {
      id: linkRef.id,
      profileId,
      userId,
      ...data,
      order: nextOrder,
      isActive: true,
      clickCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    await setDoc(linkRef, linkData)

    // Update link count in profile
    const profileRef = doc(db, 'profiles', profileId)
    await updateDoc(profileRef, {
      'stats.linkCount': increment(1)
    })

    return linkData
  },

  // Update link
  async update(linkId, data) {
    const linkRef = doc(db, 'links', linkId)
    await updateDoc(linkRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  },

  // Delete link
  async delete(linkId, profileId) {
    const linkRef = doc(db, 'links', linkId)
    await deleteDoc(linkRef)

    // Update link count in profile
    const profileRef = doc(db, 'profiles', profileId)
    await updateDoc(profileRef, {
      'stats.linkCount': increment(-1)
    })
  },

  // Reorder links
  async reorder(links) {
    const batch = writeBatch(db)
    links.forEach((link, index) => {
      const linkRef = doc(db, 'links', link.id)
      batch.update(linkRef, { order: index, updatedAt: serverTimestamp() })
    })
    await batch.commit()
  },

  // Toggle link active state
  async toggleActive(linkId, isActive) {
    const linkRef = doc(db, 'links', linkId)
    await updateDoc(linkRef, {
      isActive,
      updatedAt: serverTimestamp()
    })
  },

  // Increment click count
  async incrementClicks(linkId) {
    const linkRef = doc(db, 'links', linkId)
    await updateDoc(linkRef, {
      clickCount: increment(1)
    })
  }
}

// ==================== ANALYTICS OPERATIONS ====================

export const analyticsService = {
  // Track view event
  async trackView(profileId, visitorData) {
    const eventRef = doc(collection(db, 'profiles', profileId, 'analytics'))
    const eventData = {
      id: eventRef.id,
      type: 'view',
      visitorData,
      timestamp: serverTimestamp(),
      date: new Date().toISOString().split('T')[0],
      hour: new Date().getHours()
    }
    await setDoc(eventRef, eventData)
    return eventData
  },

  // Track click event
  async trackClick(profileId, linkId, linkTitle, visitorData) {
    const eventRef = doc(collection(db, 'profiles', profileId, 'analytics'))
    const eventData = {
      id: eventRef.id,
      type: 'click',
      linkId,
      linkTitle,
      visitorData,
      timestamp: serverTimestamp(),
      date: new Date().toISOString().split('T')[0],
      hour: new Date().getHours()
    }
    await setDoc(eventRef, eventData)
    return eventData
  },

  // Get analytics for profile
  async getAnalytics(profileId, dateRange = null) {
    const analyticsRef = collection(db, 'profiles', profileId, 'analytics')
    let q = query(analyticsRef, orderBy('timestamp', 'desc'))
    
    if (dateRange) {
      q = query(
        analyticsRef,
        where('date', '>=', dateRange.start),
        where('date', '<=', dateRange.end),
        orderBy('timestamp', 'desc')
      )
    }
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  },

  // Get daily aggregated analytics
  async getDailyAnalytics(profileId, startDate, endDate) {
    const dailyRef = collection(db, 'analytics_daily')
    const q = query(
      dailyRef,
      where('profileId', '==', profileId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
}

// ==================== TEMPLATE OPERATIONS ====================

export const templateService = {
  // Get all active templates
  async getAll() {
    const templatesRef = collection(db, 'templates')
    const q = query(
      templatesRef,
      where('isActive', '==', true),
      orderBy('usageCount', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  },

  // Get templates by category
  async getByCategory(category) {
    const templatesRef = collection(db, 'templates')
    const q = query(
      templatesRef,
      where('isActive', '==', true),
      where('category', '==', category),
      orderBy('usageCount', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  },

  // Get free templates
  async getFree() {
    const templatesRef = collection(db, 'templates')
    const q = query(
      templatesRef,
      where('isActive', '==', true),
      where('isPremium', '==', false),
      orderBy('usageCount', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  },

  // Get premium templates
  async getPremium() {
    const templatesRef = collection(db, 'templates')
    const q = query(
      templatesRef,
      where('isActive', '==', true),
      where('isPremium', '==', true),
      orderBy('usageCount', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  },

  // Get template by ID
  async getById(templateId) {
    const templateRef = doc(db, 'templates', templateId)
    const templateDoc = await getDoc(templateRef)
    if (templateDoc.exists()) {
      return { id: templateDoc.id, ...templateDoc.data() }
    }
    return null
  },

  // Increment usage count
  async incrementUsage(templateId) {
    const templateRef = doc(db, 'templates', templateId)
    await updateDoc(templateRef, {
      usageCount: increment(1)
    })
  }
}

// ==================== STORAGE OPERATIONS ====================

export const storageService = {
  // Upload file
  async uploadFile(file, path) {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return { path, url: downloadURL }
  },

  // Upload profile image
  async uploadProfileImage(userId, file) {
    const path = `profiles/${userId}/avatar/${file.name}`
    return this.uploadFile(file, path)
  },

  // Upload cover image
  async uploadCoverImage(userId, file) {
    const path = `profiles/${userId}/cover/${file.name}`
    return this.uploadFile(file, path)
  },

  // Upload link icon
  async uploadLinkIcon(userId, linkId, file) {
    const path = `links/${userId}/${linkId}/icon/${file.name}`
    return this.uploadFile(file, path)
  },

  // Delete file
  async deleteFile(path) {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  }
}

// Export all services
export default {
  user: userService,
  profile: profileService,
  link: linkService,
  analytics: analyticsService,
  template: templateService,
  storage: storageService
}