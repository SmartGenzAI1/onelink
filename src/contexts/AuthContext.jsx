import { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db, googleProvider, githubProvider, isFirebaseReady } from '../config/firebase'

const AuthContext = createContext()
export { AuthContext }

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [firebaseError, setFirebaseError] = useState(!isFirebaseReady)

  // Sign up with email/password
  async function signup(email, password, displayName) {
    if (!isFirebaseReady) {
      throw new Error('Firebase is not configured. Please set up your .env file with Firebase credentials.')
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Update profile with display name
    if (displayName) {
      await updateProfile(userCredential.user, { displayName })
    }
    
    // Send email verification
    await sendEmailVerification(userCredential.user)
    
    // Create user document in Firestore
    await createUserDocument(userCredential.user, { displayName })
    
    return userCredential
  }

  // Login with email/password
  function login(email, password) {
    if (!isFirebaseReady) {
      throw new Error('Firebase is not configured. Please set up your .env file with Firebase credentials.')
    }
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Login with Google
  async function loginWithGoogle() {
    if (!isFirebaseReady) {
      throw new Error('Firebase is not configured. Please set up your .env file with Firebase credentials.')
    }
    const result = await signInWithPopup(auth, googleProvider)
    // Check if user document exists, if not create it
    const userDoc = await getDoc(doc(db, 'users', result.user.uid))
    if (!userDoc.exists()) {
      await createUserDocument(result.user)
    }
    return result
  }

  // Login with GitHub
  async function loginWithGithub() {
    if (!isFirebaseReady) {
      throw new Error('Firebase is not configured. Please set up your .env file with Firebase credentials.')
    }
    const result = await signInWithPopup(auth, githubProvider)
    // Check if user document exists, if not create it
    const userDoc = await getDoc(doc(db, 'users', result.user.uid))
    if (!userDoc.exists()) {
      await createUserDocument(result.user)
    }
    return result
  }

  // Logout
  function logout() {
    return signOut(auth)
  }

  // Reset password
  function resetPassword(email) {
    if (!isFirebaseReady) {
      throw new Error('Firebase is not configured. Please set up your .env file with Firebase credentials.')
    }
    return sendPasswordResetEmail(auth, email)
  }

  // Send verification email
  async function sendVerificationEmail() {
    if (currentUser) {
      return sendEmailVerification(currentUser)
    }
    throw new Error('No user logged in')
  }

  // Update user profile
  async function updateUserProfile(data) {
    if (!currentUser) return
    
    await updateProfile(currentUser, data)
    
    // Update Firestore document
    await setDoc(doc(db, 'users', currentUser.uid), {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    // Refresh user profile
    await fetchUserProfile(currentUser.uid)
  }

  // Update email
  async function updateUserEmail(newEmail, password) {
    if (!currentUser) throw new Error('No user logged in')
    
    // Reauthenticate user before email change
    const credential = EmailAuthProvider.credential(currentUser.email, password)
    await reauthenticateWithCredential(currentUser, credential)
    
    await updateEmail(currentUser, newEmail)
    
    // Update Firestore document
    await setDoc(doc(db, 'users', currentUser.uid), {
      email: newEmail,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    // Refresh user profile
    await fetchUserProfile(currentUser.uid)
  }

  // Update password
  async function updateUserPassword(currentPassword, newPassword) {
    if (!currentUser) throw new Error('No user logged in')
    
    // Reauthenticate user before password change
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
    await reauthenticateWithCredential(currentUser, credential)
    
    await updatePassword(currentUser, newPassword)
  }

  // Create user document in Firestore
  async function createUserDocument(user, additionalData = {}) {
    if (!user) return
    
    const userRef = doc(db, 'users', user.uid)
    
    // Generate unique username
    let username = generateUsername(user.email, user.displayName)
    let usernameAvailable = await checkUsernameAvailability(username)
    
    // If username is taken, append random string
    while (!usernameAvailable) {
      username = generateUsername(user.email, user.displayName) + Math.random().toString(36).substring(2, 5)
      usernameAvailable = await checkUsernameAvailability(username)
    }
    
    const userData = {
      id: user.uid,
      email: user.email,
      displayName: additionalData.displayName || user.displayName || '',
      photoURL: user.photoURL || null,
      username: username,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      subscription: {
        plan: 'free',
        startDate: null,
        endDate: null,
        stripeCustomerId: null
      },
      settings: {
        emailNotifications: true,
        publicProfile: true,
        analyticsEnabled: true
      },
      socialConnections: {
        google: user.providerData.some(p => p.providerId === 'google.com'),
        twitter: false,
        github: user.providerData.some(p => p.providerId === 'github.com')
      }
    }
    
    await setDoc(userRef, userData)
    
    // Create initial profile document
    await createInitialProfile(user.uid, username, userData)
    
    return userData
  }

  // Generate username from email or display name
  function generateUsername(email, displayName) {
    if (displayName) {
      // Use display name, remove spaces and special characters
      return displayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20)
    }
    // Use email prefix
    return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)
  }

  // Check if username is available
  async function checkUsernameAvailability(username) {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('username', '==', username))
    const snapshot = await getDocs(q)
    return snapshot.empty
  }

  // Create initial profile document
  async function createInitialProfile(userId, username, userData) {
    const profileRef = doc(db, 'profiles', userId)
    
    const profileData = {
      id: userId,
      userId: userId,
      username: username,
      displayName: userData.displayName || '',
      bio: '',
      avatarURL: userData.photoURL || null,
      coverImageURL: null,
      templateId: 'minimal',
      themeSettings: {
        primaryColor: '#3b82f6',
        secondaryColor: '#6366f1',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'Inter',
        buttonStyle: 'rounded',
        buttonShadow: true,
        animationType: 'none',
        customCSS: null
      },
      socialLinks: {
        instagram: null,
        twitter: null,
        youtube: null,
        tiktok: null,
        linkedin: null,
        github: null,
        facebook: null,
        email: userData.email
      },
      seoSettings: {
        title: '',
        description: '',
        ogImageURL: null
      },
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
  }

  // Fetch user profile from Firestore
  async function fetchUserProfile(userId) {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      setUserProfile({ id: userDoc.id, ...userDoc.data() })
      return { id: userDoc.id, ...userDoc.data() }
    }
    
    return null
  }

  // Check if user has completed profile setup
  async function hasCompletedProfile(userId) {
    const profileRef = doc(db, 'profiles', userId)
    const profileDoc = await getDoc(profileRef)
    
    if (!profileDoc.exists()) return false
    
    const profileData = profileDoc.data()
    return profileData.isPublished || profileData.displayName || profileData.bio
  }

  // Listen for auth state changes
  useEffect(() => {
    if (!isFirebaseReady) {
      setLoading(false)
      return
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        await fetchUserProfile(user.uid)
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })
    
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    loading,
    firebaseError,
    isFirebaseReady,
    signup,
    login,
    loginWithGoogle,
    loginWithGithub,
    logout,
    resetPassword,
    sendVerificationEmail,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    fetchUserProfile,
    hasCompletedProfile,
    checkUsernameAvailability
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export default AuthContext
