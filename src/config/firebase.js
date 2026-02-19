import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getAnalytics } from 'firebase/analytics'

// Check if Firebase environment variables are configured
const isFirebaseConfigured = () => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  )
}

// Export Firebase configuration status for error handling
export const isFirebaseReady = isFirebaseConfigured()

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase - throw error if not configured
if (!isFirebaseConfigured()) {
  console.error(
    'Firebase is not configured. Please set up your .env file with Firebase credentials. ' +
    'Copy .env.example to .env and fill in your Firebase project values.'
  )
}

// Initialize Firebase app
const app = initializeApp(firebaseConfig)

// Initialize services
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)
const functions = getFunctions(app)

// Initialize Analytics (only in production)
const analytics = import.meta.env.PROD ? getAnalytics(app) : null

// Auth providers
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

const githubProvider = new GithubAuthProvider()
githubProvider.setCustomParameters({
  allow_signup: 'true'
})

// Export services
export { app, auth, db, storage, functions, analytics, googleProvider, githubProvider }

// Export default app
export default app
