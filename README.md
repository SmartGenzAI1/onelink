# OneLink - Link in Bio Platform

A modern, customizable link-in-bio application built with React, Firebase, and Tailwind CSS. Create beautiful profiles to share all your important links in one place.

![OneLink](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-9.x-FFCA28)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC)

## Features

- 🔗 **Link Management** - Add, edit, reorder, and schedule your links
- 📊 **Analytics Dashboard** - Track views, clicks, and engagement
- 🎨 **Customizable Profiles** - Multiple templates and themes
- 🔐 **Authentication** - Google, GitHub, and email/password login
- 📱 **Responsive Design** - Works perfectly on all devices
- 🌙 **Dark Mode** - Built-in dark mode support
- 🔍 **SEO Optimized** - Meta tags for better visibility

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Firebase account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd onelink
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure Firebase**

   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication (Google, GitHub, Email/Password)
   - Enable Firestore Database
   - Enable Storage (for image uploads)
   - Get your configuration values from Project Settings > Your apps > Web app

5. **Update your .env file**
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

6. **Set up Firestore Security Rules**
   
   Deploy the security rules from `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```

   Or manually copy the rules in Firebase Console:
   - Go to Firestore Database > Rules
   - Copy contents from `firestore.rules`

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Open browser**
   Navigate to http://localhost:5173

## Firebase Setup Guide

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name
4. Disable Google Analytics (optional)
5. Wait for project creation

### Step 2: Enable Authentication

1. Go to Authentication > Sign-in method
2. Enable Google:
   - Add your domain to authorized domains
3. Enable GitHub:
   - Create OAuth app in GitHub Developer settings
   - Add client ID and secret
4. Enable Email/Password

### Step 3: Create Firestore Database

1. Go to Firestore Database
2. Create database (start in test mode initially)
3. Deploy security rules

### Step 4: Enable Storage

1. Go to Storage
2. Start in test mode
3. Set up rules for production

### Step 5: Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Select Web app (</>)
4. Copy configuration values

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your repository
   - Add environment variables
   - Deploy

3. **Configure Firebase Authorized Domains**
   - Add your Vercel domain to Firebase Console > Authentication > Settings > Authorized domains

### Netlify

1. **Deploy to Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

2. **Or connect via GitHub**
   - Go to Netlify Dashboard
   - Import from GitHub
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase**
   ```bash
   firebase init hosting
   ```

3. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

## Project Structure

```
onelink/
├── src/
│   ├── components/       # React components
│   │   ├── analytics/    # Analytics components
│   │   ├── auth/         # Authentication components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── layout/       # Layout components
│   │   ├── profile/      # Profile components
│   │   ├── public/       # Public profile components
│   │   ├── settings/     # Settings components
│   │   ├── templates/    # Template components
│   │   └── ui/           # UI components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── services/         # Firebase services
│   ├── styles/           # CSS styles
│   ├── utils/            # Utility functions
│   └── config/           # Configuration files
├── functions/            # Firebase Cloud Functions
├── firestore.rules       # Firestore security rules
└── package.json
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID |

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Icons**: Lucide React
- **Charts**: Recharts

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
