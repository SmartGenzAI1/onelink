# OneLink Architecture Design Document

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Database Schema](#2-database-schema)
3. [Component Structure](#3-component-structure)
4. [User Flow Diagrams](#4-user-flow-diagrams)
5. [Firebase Configuration](#5-firebase-configuration)
6. [API Endpoints and Cloud Functions](#6-api-endpoints-and-cloud-functions)
7. [Security Rules](#7-security-rules)
8. [Unique Features Implementation](#8-unique-features-implementation)

---

## 1. System Overview

### 1.1 Project Description
OneLink is a modern link-in-bio platform that enables users to create a personalized, single-page hub for all their important links. Unlike competitors like Linktree, OneLink focuses on enhanced customization, animated backgrounds, comprehensive analytics, and a superior user experience.

### 1.2 Core Value Propositions
- **Unique Animated Backgrounds**: Particle effects, gradient animations, and dynamic themes
- **Multiple Premade Templates**: Professionally designed templates for different use cases
- **Advanced Analytics**: Detailed click tracking, geographic data, and time-based insights
- **QR Code Generation**: Built-in QR codes for easy sharing
- **Social Media Preview**: Dynamic Open Graph cards for better social sharing
- **Future Custom Domains**: Support for branded URLs

### 1.3 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    React.js Frontend                     │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │
│  │  │  Home   │ │Dashboard│ │ Editor  │ │Analytics│       │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │
│  │  │  Auth   │ │ Profile │ │Templates│ │  QR/OG  │       │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FIREBASE SERVICES                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Firebase Auth│ │  Firestore   │ │ Firebase CDN │            │
│  │  - Email/Pass│ │  - Users     │ │  - Hosting   │            │
│  │  - Google    │ │  - Profiles  │ │  - Storage   │            │
│  │  - OAuth     │ │  - Links     │ └──────────────┘            │
│  └──────────────┘ │  - Analytics │                             │
│                    │  - Templates │                             │
│  ┌──────────────┐ └──────────────┘                             │
│  │Cloud Functions│                                             │
│  │ - API Routes │                                              │
│  │ - Analytics  │                                              │
│  │ - QR Gen     │                                              │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React.js 18+ | UI framework |
| Styling | Tailwind CSS | Utility-first CSS |
| State Management | React Context + Hooks | Global state |
| Routing | React Router v6 | Client-side routing |
| Backend | Firebase | BaaS platform |
| Database | Cloud Firestore | NoSQL database |
| Authentication | Firebase Auth | User management |
| Hosting | Firebase Hosting | CDN deployment |
| Storage | Firebase Storage | File uploads |
| Functions | Cloud Functions | Server-side logic |
| Analytics | Custom + Firebase Analytics | Usage tracking |

---

## 2. Database Schema

### 2.1 Firestore Collections Overview

```
firestore/
├── users/           # User account data
├── profiles/        # User profile pages
├── links/           # Individual links
├── analytics/       # Click and view events
├── templates/       # Premade templates
├── themes/          # Custom themes
└── domains/         # Custom domain mappings - Future
```

### 2.2 Users Collection

**Collection:** `users`

```javascript
users/{userId}
{
  id: string,                    // Document ID = Firebase Auth UID
  email: string,                 // User email address
  displayName: string,           // Display name
  photoURL: string | null,       // Profile photo URL
  username: string,              // Unique username for URL
  createdAt: timestamp,          // Account creation date
  updatedAt: timestamp,          // Last update timestamp
  subscription: {
    plan: 'free' | 'pro' | 'enterprise',
    startDate: timestamp | null,
    endDate: timestamp | null,
    stripeCustomerId: string | null
  },
  settings: {
    emailNotifications: boolean,
    publicProfile: boolean,
    analyticsEnabled: boolean
  },
  socialConnections: {
    google: boolean,
    twitter: boolean,
    github: boolean
  }
}

// Indexes
- username (unique)
- email (unique)
- createdAt (descending)
```

### 2.3 Profiles Collection

**Collection:** `profiles`

```javascript
profiles/{profileId}
{
  id: string,                    // Document ID
  userId: string,                // Reference to users collection
  username: string,              // Unique username - denormalized
  displayName: string,           // Profile display name
  bio: string,                   // Short bio/description
  avatarURL: string | null,      // Profile image URL
  coverImageURL: string | null,  // Cover/background image
  
  // Template and Theme
  templateId: string,            // Reference to templates collection
  themeSettings: {
    primaryColor: string,        // Hex color
    secondaryColor: string,      // Hex color
    backgroundColor: string,     // Hex or gradient
    textColor: string,           // Hex color
    fontFamily: string,          // Font family name
    buttonStyle: 'rounded' | 'square' | 'pill',
    buttonShadow: boolean,
    animationType: 'none' | 'particles' | 'gradient' | 'waves',
    customCSS: string | null     // Pro feature
  },
  
  // Social Links - displayed on profile
  socialLinks: {
    instagram: string | null,
    twitter: string | null,
    youtube: string | null,
    tiktok: string | null,
    linkedin: string | null,
    github: string | null,
    facebook: string | null,
    email: string | null
  },
  
  // SEO and Preview
  seoSettings: {
    title: string,               // Custom page title
    description: string,         // Meta description
    ogImageURL: string | null    // Custom OG image
  },
  
  // Statistics - denormalized for performance
  stats: {
    totalViews: number,
    totalClicks: number,
    linkCount: number
  },
  
  // Status
  isPublished: boolean,
  isVerified: boolean,           // Verified user badge
  
  createdAt: timestamp,
  updatedAt: timestamp,
  publishedAt: timestamp | null
}

// Indexes
- userId (unique)
- username (unique)
- isPublished
- createdAt (descending)
```

### 2.4 Links Collection

**Collection:** `links`

```javascript
links/{linkId}
{
  id: string,                    // Document ID
  profileId: string,             // Reference to profiles collection
  userId: string,                // Reference to users collection
  
  // Link Content
  title: string,                 // Link display text
  url: string,                   // Destination URL
  description: string | null,    // Optional description
  iconURL: string | null,        // Custom icon image
  
  // Display Settings
  order: number,                 // Display order - 0, 1, 2...
  isActive: boolean,             // Link visibility toggle
  
  // Styling
  styling: {
    backgroundColor: string | null,
    textColor: string | null,
    borderColor: string | null,
    iconPosition: 'left' | 'right' | 'center'
  },
  
  // Scheduling - Pro Feature
  scheduling: {
    isEnabled: boolean,
    startDate: timestamp | null,
    endDate: timestamp | null
  },
  
  // Click Tracking
  clickCount: number,            // Total clicks - denormalized
  
  // Metadata
  type: 'link' | 'email' | 'phone' | 'social' | 'file',
  
  createdAt: timestamp,
  updatedAt: timestamp
}

// Indexes
- profileId + order (composite)
- userId
- isActive
- createdAt (descending)
```

### 2.5 Analytics Collection

**Collection:** `analytics`

```javascript
// Individual events - subcollection pattern
profiles/{profileId}/analytics/{eventId}
{
  id: string,
  type: 'view' | 'click',
  
  // For clicks
  linkId: string | null,
  linkTitle: string | null,
  
  // Visitor Information
  visitorData: {
    ipHash: string,              // Hashed IP for privacy
    userAgent: string,
    browser: string,
    os: string,
    device: 'mobile' | 'tablet' | 'desktop',
    country: string | null,
    city: string | null,
    referrer: string | null
  },
  
  timestamp: timestamp,
  date: string,                  // YYYY-MM-DD for querying
  hour: number                   // 0-23 for hourly analysis
}

// Aggregated analytics - daily rollups
analytics_daily/{date_profileId}
{
  date: string,                  // YYYY-MM-DD
  profileId: string,
  userId: string,
  
  views: {
    total: number,
    unique: number,
    byDevice: {
      mobile: number,
      tablet: number,
      desktop: number
    },
    byCountry: {
      [countryCode]: number
    }
  },
  
  clicks: {
    total: number,
    unique: number,
    byLink: {
      [linkId]: number
    }
  },
  
  topReferrers: [
    { source: string, count: number }
  ]
}

// Indexes
- profileId + timestamp (composite, descending)
- date
- type
```

### 2.6 Templates Collection

**Collection:** `templates`

```javascript
templates/{templateId}
{
  id: string,
  name: string,                  // Template name
  description: string,           // Template description
  category: 'minimal' | 'creative' | 'professional' | 'bold' | 'elegant',
  
  // Preview
  thumbnailURL: string,          // Template preview image
  previewURL: string,            // Live preview URL
  
  // Default Settings
  defaultSettings: {
    primaryColor: string,
    secondaryColor: string,
    backgroundColor: string,
    textColor: string,
    fontFamily: string,
    buttonStyle: string,
    animationType: string
  },
  
  // Layout Configuration
  layout: {
    avatarPosition: 'top' | 'left' | 'center',
    avatarShape: 'circle' | 'square' | 'rounded',
    bioPosition: 'below_avatar' | 'side',
    linkLayout: 'stacked' | 'grid' | 'carousel',
    columns: number              // For grid layout
  },
  
  // Availability
  isPremium: boolean,            // Pro only template
  isActive: boolean,             // Available for use
  
  // Stats
  usageCount: number,            // Times used
  
  createdAt: timestamp,
  updatedAt: timestamp
}

// Indexes
- category
- isPremium
- isActive
- usageCount (descending)
```

### 2.7 Themes Collection - User Custom Themes

**Collection:** `themes`

```javascript
themes/{themeId}
{
  id: string,
  userId: string,                // Theme owner
  name: string,                  // Theme name
  
  settings: {
    primaryColor: string,
    secondaryColor: string,
    backgroundColor: string,
    textColor: string,
    fontFamily: string,
    buttonStyle: string,
    animationType: string,
    customCSS: string
  },
  
  isPublic: boolean,             // Share with community
  usageCount: number,
  
  createdAt: timestamp
}
```

### 2.8 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │  profiles   │       │    links    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id        PK├──────►│ userId    FK│       │ profileId FK│
│ username    │       │ id        PK├──────►│ id        PK│
│ email       │       │ username    │       │ userId    FK│
│ ...         │       │ templateId  │       │ title       │
└─────────────┘       │ ...         │       │ url         │
                      └──────┬──────┘       │ ...         │
                             │              └─────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │  analytics  │
                      ├─────────────┤
                      │ profileId FK│
                      │ id        PK│
                      │ type        │
                      │ ...         │
                      └─────────────┘

┌─────────────┐       ┌─────────────┐
│  templates  │       │   themes    │
├─────────────┤       ├─────────────┤
│ id        PK│       │ id        PK│
│ name        │       │ userId    FK│
│ category    │       │ name        │
│ ...         │       │ ...         │
└─────────────┘       └─────────────┘
```

---

## 3. Component Structure

### 3.1 Directory Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   ├── Button.styles.js
│   │   │   └── index.js
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Card/
│   │   ├── Avatar/
│   │   ├── Skeleton/
│   │   ├── Tooltip/
│   │   └── Icon/
│   │
│   ├── layout/
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Footer/
│   │   ├── DashboardLayout/
│   │   └── PublicLayout/
│   │
│   ├── auth/
│   │   ├── LoginForm/
│   │   ├── RegisterForm/
│   │   ├── ForgotPassword/
│   │   ├── SocialLogin/
│   │   └── AuthProvider/
│   │
│   ├── dashboard/
│   │   ├── DashboardHome/
│   │   ├── StatsCard/
│   │   ├── RecentActivity/
│   │   └── QuickActions/
│   │
│   ├── editor/
│   │   ├── ProfileEditor/
│   │   ├── LinkEditor/
│   │   ├── ThemeEditor/
│   │   ├── TemplateSelector/
│   │   ├── PreviewPane/
│   │   └── DragDropList/
│   │
│   ├── links/
│   │   ├── LinkCard/
│   │   ├── LinkForm/
│   │   ├── LinkList/
│   │   └── LinkPreview/
│   │
│   ├── analytics/
│   │   ├── AnalyticsDashboard/
│   │   ├── ViewChart/
│   │   ├── ClickChart/
│   │   ├── GeographicMap/
│   │   ├── DeviceBreakdown/
│   │   └── TopLinks/
│   │
│   ├── profile/
│   │   ├── PublicProfile/
│   │   ├── ProfileHeader/
│   │   ├── ProfileBio/
│   │   ├── SocialIcons/
│   │   └── AnimatedBackground/
│   │
│   ├── templates/
│   │   ├── TemplateGrid/
│   │   ├── TemplateCard/
│   │   └── TemplatePreview/
│   │
│   └── shared/
│       ├── QRCode/
│       ├── ShareButton/
│       ├── ThemeToggle/
│       └── LoadingSpinner/
│
├── pages/
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Editor.jsx
│   ├── Analytics.jsx
│   ├── Templates.jsx
│   ├── Settings.jsx
│   ├── Profile.jsx            // Public profile page
│   └── NotFound.jsx
│
├── hooks/
│   ├── useAuth.js
│   ├── useProfile.js
│   ├── useLinks.js
│   ├── useAnalytics.js
│   ├── useTemplates.js
│   ├── useQRCode.js
│   └── useDebounce.js
│
├── context/
│   ├── AuthContext.js
│   ├── ThemeContext.js
│   ├── EditorContext.js
│   └── ToastContext.js
│
├── services/
│   ├── firebase/
│   │   ├── config.js
│   │   ├── auth.js
│   │   ├── firestore.js
│   │   ├── storage.js
│   │   └── functions.js
│   └── api/
│       ├── userApi.js
│       ├── profileApi.js
│       ├── linksApi.js
│       ├── analyticsApi.js
│       └── templatesApi.js
│
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   ├── validators.js
│   ├── formatters.js
│   └── animations.js
│
├── styles/
│   ├── globals.css
│   ├── animations.css
│   └── variables.css
│
├── router/
│   ├── AppRouter.jsx
│   ├── PrivateRoute.jsx
│   └── PublicRoute.jsx
│
└── App.jsx
```

### 3.2 Key Component Specifications

#### 3.2.1 PublicProfile Component

```javascript
// components/profile/PublicProfile/PublicProfile.jsx
const PublicProfile = {
  props: {
    username: string,
    profileData: object,
    links: array,
    themeSettings: object
  },
  
  sections: [
    'AnimatedBackground',    // Full-screen animated background
    'ProfileHeader',         // Avatar, name, bio
    'SocialIcons',           // Social media icons
    'LinkList',              // Draggable link list
    'ShareButton',           // Share profile
    'QRCode'                 // QR code modal
  ],
  
  features: [
    'Responsive design',
    'Animated backgrounds',
    'Click tracking',
    'SEO meta tags',
    'Open Graph support'
  ]
}
```

#### 3.2.2 Editor Component

```javascript
// components/editor/ProfileEditor/ProfileEditor.jsx
const ProfileEditor = {
  sections: [
    'BasicInfo',             // Name, bio, avatar
    'ThemeCustomization',    // Colors, fonts, animations
    'TemplateSelector',      // Choose template
    'LinkManager',           // Add/edit/reorder links
    'SocialLinks',           // Social media links
    'SEOOptimization',       // Meta tags, OG image
    'PreviewPane'            // Live preview
  ],
  
  state: {
    activeSection: string,
    isDirty: boolean,
    isSaving: boolean,
    previewMode: 'desktop' | 'mobile'
  }
}
```

#### 3.2.3 Analytics Dashboard Component

```javascript
// components/analytics/AnalyticsDashboard/AnalyticsDashboard.jsx
const AnalyticsDashboard = {
  props: {
    profileId: string,
    dateRange: object
  },
  
  widgets: [
    'OverviewStats',         // Total views, clicks, CTR
    'ViewsChart',            // Line chart over time
    'ClicksChart',           // Bar chart by link
    'GeographicMap',         // World map with visitors
    'DeviceBreakdown',       // Pie chart
    'TopReferrers',          // Traffic sources
    'TopLinks',              // Most clicked links
    'TimeAnalysis'           // Best performing times
  ],
  
  features: [
    'Date range selector',
    'Export to CSV',
    'Real-time updates',
    'Comparison mode'
  ]
}
```

---

## 4. User Flow Diagrams

### 4.1 User Registration Flow

```
START
  │
  ▼
┌─────────────────┐
│  Landing Page   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Click Sign Up  │────►│  Choose Method  │
└─────────────────┘     └────────┬────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Email/Password │   │  Google OAuth   │   │  Other OAuth    │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         ▼                     │                     │
┌─────────────────┐            │                     │
│  Verify Email   │            │                     │
└────────┬────────┘            │                     │
         │                     │                     │
         └─────────────────────┴─────────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │  Create Profile │
                    │  - Choose URL   │
                    │  - Add Bio      │
                    │  - Select Theme │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Dashboard      │
                    │  - Add Links    │
                    │  - Customize    │
                    └────────┬────────┘
                             │
                             ▼
                           END
```

### 4.2 Profile Creation and Editing Flow

```
START
  │
  ▼
┌─────────────────┐
│   Dashboard     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Click Edit     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│                  Editor Page                     │
│  ┌───────────────┐    ┌───────────────────┐    │
│  │  Edit Panel   │◄──►│   Live Preview    │    │
│  │  - Profile    │    │   - Desktop View  │    │
│  │  - Links      │    │   - Mobile View   │    │
│  │  - Theme      │    │                   │    │
│  │  - Template   │    │                   │    │
│  └───────────────┘    └───────────────────┘    │
└──────────────────────┬──────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Save Draft  │ │   Preview   │ │  Publish    │
└─────────────┘ └─────────────┘ └──────┬──────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Profile Live   │
                              │  onelink.app/   │
                              │    username     │
                              └─────────────────┘
                                       │
                                       ▼
                                     END
```

### 4.3 Link Management Flow

```
START
  │
  ▼
┌─────────────────┐
│  Link Manager   │
└────────┬────────┘
         │
         ┌──────────────┬──────────────┬──────────────┐
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Add Link   │ │  Edit Link  │ │ Delete Link │ │ Reorder     │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │               │
       ▼               ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Enter URL   │ │ Modify      │ │ Confirm     │ │ Drag and    │
│ Enter Title │ │ Fields      │ │ Delete      │ │ Drop        │
│ Add Icon    │ │ Save        │ │             │ │             │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │               │
       └───────────────┴───────────────┴───────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │  Update Order   │
                    │  in Firestore   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Live Profile   │
                    │    Updated      │
                    └─────────────────┘
                             │
                             ▼
                           END
```

### 4.4 Public Profile Visitor Flow

```
START - Visitor
  │
  ▼
┌─────────────────────────┐
│  Navigate to Profile    │
│  onelink.app/username   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Profile Page Loads     │
│  - Animated Background  │
│  - Avatar & Bio         │
│  - Social Icons         │
│  - Link List            │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  View Event Tracked     │
│  - Device Info          │
│  - Location             │
│  - Referrer             │
└────────────┬────────────┘
             │
             ┌─────────────────────┐
             │                     │
             ▼                     ▼
┌─────────────────────┐   ┌─────────────────────┐
│  Click on Link      │   │  Share Profile      │
└──────────┬──────────┘   └──────────┬──────────┘
           │                         │
           ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐
│  Click Event Tracked│   │  Copy Link          │
│  - Link ID          │   │  Generate QR        │
│  - Timestamp        │   │  Social Share       │
└──────────┬──────────┘   └─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Redirect to URL    │
└─────────────────────┘
           │
           ▼
         END
```

### 4.5 Analytics Flow

```
START - User
  │
  ▼
┌─────────────────┐
│   Dashboard     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click Analytics │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│            Analytics Dashboard                   │
│  ┌─────────────────────────────────────────┐   │
│  │  Date Range Selector                     │   │
│  │  - Today, 7 Days, 30 Days, Custom       │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Views   │ │ Clicks  │ │  CTR    │          │
│  └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────────────────────────────────────┐   │
│  │  Views Over Time Chart                   │   │
│  └─────────────────────────────────────────┘   │
│  ┌──────────────────┐ ┌──────────────────┐    │
│  │ Top Links        │ │ Device Breakdown │    │
│  └──────────────────┘ └──────────────────┘    │
│  ┌──────────────────┐ ┌──────────────────┐    │
│  │ Geographic Map   │ │ Top Referrers    │    │
│  └──────────────────┘ └──────────────────┘    │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Export Data    │
│  - CSV Download │
└─────────────────┘
         │
         ▼
       END
```

---

## 5. Firebase Configuration

### 5.1 Project Setup Requirements

```javascript
// Firebase Project Configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
```

### 5.2 Required Firebase Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Authentication | User login/signup | Email/Password, Google, GitHub OAuth |
| Firestore | Database | Native mode, multi-region |
| Storage | File uploads | Profile images, custom backgrounds |
| Hosting | Frontend deployment | Custom domain, SSL |
| Cloud Functions | Server-side logic | Node.js 18 runtime |
| Analytics | Usage tracking | Google Analytics 4 |

### 5.3 Authentication Providers Setup

```javascript
// Authentication Configuration
const authConfig = {
  providers: [
    'email/password',
    'google.com',
    'github.com',
    'twitter.com'        // Future
  ],
  settings: {
    emailVerification: true,
    passwordReset: true,
    sessionPersistence: 'LOCAL',
    signInOptions: {
      google: {
        scopes: ['email', 'profile']
      }
    }
  }
};
```

### 5.4 Firestore Indexes Configuration

```javascript
// firestore.indexes.json
{
  indexes: [
    {
      collectionGroup: "links",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "profileId", order: "ASCENDING" },
        { fieldPath: "order", order: "ASCENDING" }
      ]
    },
    {
      collectionGroup: "analytics",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "profileId", order: "ASCENDING" },
        { fieldPath: "timestamp", order: "DESCENDING" }
      ]
    },
    {
      collectionGroup: "profiles",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "username", order: "ASCENDING" }
      ]
    },
    {
      collectionGroup: "templates",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "isActive", order: "ASCENDING" },
        { fieldPath: "usageCount", order: "DESCENDING" }
      ]
    }
  ]
}
```

### 5.5 Environment Variables

```bash
# .env.example
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
REACT_APP_BASE_URL=https://onelink.app
REACT_APP_QR_API_URL=https://api.qrserver.com/v1
```

---

## 6. API Endpoints and Cloud Functions

### 6.1 Cloud Functions Overview

```
functions/
├── src/
│   ├── index.js              # Main exports
│   ├── auth/
│   │   ├── onUserCreate.js   # User creation trigger
│   │   └── onUserDelete.js   # User deletion trigger
│   ├── api/
│   │   ├── profiles.js       # Profile operations
│   │   ├── links.js          # Link operations
│   │   ├── analytics.js      # Analytics aggregation
│   │   └── qr.js             # QR code generation
│   ├── scheduled/
│   │   └── dailyAnalytics.js # Daily rollup job
│   └── utils/
│       ├── validators.js
│       └── helpers.js
└── package.json
```

### 6.2 HTTP Endpoints

#### Profile Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/profile/{username}` | Get public profile | Public |
| POST | `/api/profile` | Create profile | User |
| PUT | `/api/profile/{id}` | Update profile | Owner |
| DELETE | `/api/profile/{id}` | Delete profile | Owner |
| GET | `/api/profile/check-username` | Check username availability | Public |

#### Links Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/links/{profileId}` | Get profile links | Public |
| POST | `/api/links` | Create link | Owner |
| PUT | `/api/links/{id}` | Update link | Owner |
| DELETE | `/api/links/{id}` | Delete link | Owner |
| PUT | `/api/links/reorder` | Reorder links | Owner |

#### Analytics Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/analytics/{profileId}` | Get analytics | Owner |
| GET | `/api/analytics/{profileId}/export` | Export CSV | Owner |
| POST | `/api/analytics/track` | Track event | Public |

#### Utility Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/qr/{profileId}` | Generate QR code | Public |
| GET | `/api/og/{username}` | Generate OG image | Public |
| GET | `/api/templates` | List templates | Public |

### 6.3 Cloud Function Implementations

#### 6.3.1 Track Analytics Event

```javascript
// functions/src/api/analytics.js
exports.trackEvent = functions.https.onCall(async (data, context) => {
  const { type, profileId, linkId, visitorData } = data;
  
  // Validate input
  if (!type || !profileId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }
  
  // Create analytics event
  const event = {
    id: generateId(),
    type,
    profileId,
    linkId: linkId || null,
    visitorData: {
      ipHash: hashIP(context.rawRequest.ip),
      userAgent: visitorData.userAgent,
      browser: parseBrowser(visitorData.userAgent),
      os: parseOS(visitorData.userAgent),
      device: parseDevice(visitorData.userAgent),
      country: visitorData.country || null,
      city: visitorData.city || null,
      referrer: visitorData.referrer || null
    },
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    date: formatDate(new Date()),
    hour: new Date().getHours()
  };
  
  // Save event
  await admin.firestore()
    .collection('profiles')
    .doc(profileId)
    .collection('analytics')
    .add(event);
  
  // Update denormalized stats
  await updateProfileStats(profileId, type);
  
  return { success: true };
});
```

#### 6.3.2 Generate QR Code

```javascript
// functions/src/api/qr.js
exports.generateQRCode = functions.https.onCall(async (data, context) => {
  const { profileId, size = 300 } = data;
  
  // Get profile
  const profile = await admin.firestore()
    .collection('profiles')
    .doc(profileId)
    .get();
  
  if (!profile.exists) {
    throw new functions.https.HttpsError('not-found', 'Profile not found');
  }
  
  const profileUrl = `https://onelink.app/${profile.data().username}`;
  
  // Generate QR code using external API or library
  const qrCodeUrl = await generateQRCodeImage(profileUrl, {
    size,
    format: 'png',
    errorCorrection: 'H'
  });
  
  return { qrCodeUrl };
});
```

#### 6.3.3 Check Username Availability

```javascript
// functions/src/api/profiles.js
exports.checkUsername = functions.https.onCall(async (data, context) => {
  const { username } = data;
  
  // Validate username format
  if (!isValidUsername(username)) {
    return { available: false, reason: 'Invalid username format' };
  }
  
  // Check reserved usernames
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return { available: false, reason: 'Username is reserved' };
  }
  
  // Check database
  const snapshot = await admin.firestore()
    .collection('profiles')
    .where('username', '==', username.toLowerCase())
    .limit(1)
    .get();
  
  return { 
    available: snapshot.empty,
    reason: snapshot.empty ? null : 'Username already taken'
  };
});
```

#### 6.3.4 Daily Analytics Aggregation

```javascript
// functions/src/scheduled/dailyAnalytics.js
exports.aggregateDailyAnalytics = functions.pubsub
  .schedule('0 0 * * *')  // Run at midnight UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    
    // Get all active profiles
    const profiles = await admin.firestore()
      .collection('profiles')
      .where('isPublished', '==', true)
      .get();
    
    for (const profile of profiles.docs) {
      await aggregateProfileAnalytics(profile.id, yesterday);
    }
    
    return null;
  });

async function aggregateProfileAnalytics(profileId, date) {
  const events = await admin.firestore()
    .collection('profiles')
    .doc(profileId)
    .collection('analytics')
    .where('date', '==', date)
    .get();
  
  const aggregated = {
    date,
    profileId,
    views: { total: 0, unique: new Set(), byDevice: {}, byCountry: {} },
    clicks: { total: 0, unique: new Set(), byLink: {} }
  };
  
  events.docs.forEach(doc => {
    const event = doc.data();
    if (event.type === 'view') {
      aggregated.views.total++;
      aggregated.views.unique.add(event.visitorData.ipHash);
      // Aggregate by device and country
    } else if (event.type === 'click') {
      aggregated.clicks.total++;
      aggregated.clicks.unique.add(event.visitorData.ipHash);
      // Aggregate by link
    }
  });
  
  // Save aggregated data
  await admin.firestore()
    .collection('analytics_daily')
    .doc(`${date}_${profileId}`)
    .set(aggregated);
}
```

### 6.4 Firestore Triggers

```javascript
// functions/src/index.js

// User creation - initialize profile
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  // Create user document
  await admin.firestore().collection('users').doc(user.uid).set({
    id: user.uid,
    email: user.email,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    subscription: { plan: 'free' },
    settings: {
      emailNotifications: true,
      publicProfile: true,
      analyticsEnabled: true
    }
  });
});

// User deletion - cleanup data
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
  const batch = admin.firestore().batch();
  
  // Delete user document
  batch.delete(admin.firestore().collection('users').doc(user.uid));
  
  // Delete profile
  const profile = await admin.firestore()
    .collection('profiles')
    .where('userId', '==', user.uid)
    .get();
  
  profile.docs.forEach(doc => batch.delete(doc.ref));
  
  // Delete links
  const links = await admin.firestore()
    .collection('links')
    .where('userId', '==', user.uid)
    .get();
  
  links.docs.forEach(doc => batch.delete(doc.ref));
  
  await batch.commit();
});
```

---

## 7. Security Rules

### 7.1 Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidUsername(username) {
      return username.matches('^[a-z0-9_]{3,30}$');
    }
    
    function hasActiveSubscription(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.subscription.plan != 'free';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) 
        && (!request.resource.data.diff(resource.data).affectedKeys()
          .hasAny(['subscription', 'id']));
      allow delete: if isOwner(userId);
    }
    
    // Profiles collection
    match /profiles/{profileId} {
      // Public read for published profiles
      allow read: if resource.data.isPublished == true 
        || isOwner(resource.data.userId);
      
      // Create - authenticated users with valid username
      allow create: if isAuthenticated() 
        && request.resource.data.userId == request.auth.uid
        && isValidUsername(request.resource.data.username);
      
      // Update - owner only, protect critical fields
      allow update: if isOwner(resource.data.userId)
        && !request.resource.data.diff(resource.data)
          .affectedKeys().hasAny(['id', 'userId', 'username']);
      
      // Delete - owner only
      allow delete: if isOwner(resource.data.userId);
      
      // Analytics subcollection
      match /analytics/{eventId} {
        allow create: if true;  // Allow public tracking
        allow read: if isOwner(get(/databases/$(database)/documents/profiles/$(profileId)).data.userId);
        allow update, delete: if false;  // Immutable events
      }
    }
    
    // Links collection
    match /links/{linkId} {
      allow read: if true;  // Public read for rendering
      allow create: if isAuthenticated() 
        && request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Templates collection
    match /templates/{templateId} {
      allow read: if true;  // Public read
      allow write: if false;  // Admin only - managed via console
    }
    
    // Themes collection
    match /themes/{themeId} {
      allow read: if resource.data.isPublic == true 
        || isOwner(resource.data.userId);
      allow create: if isAuthenticated() 
        && request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Daily analytics aggregation
    match /analytics_daily/{docId} {
      allow read: if isAuthenticated();
      allow write: if false;  // Written by Cloud Functions only
    }
    
    // Custom domains - Future feature
    match /domains/{domainId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() 
        && hasActiveSubscription(request.auth.uid);
    }
  }
}
```

### 7.2 Storage Security Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isValidSize(maxSizeMB) {
      return request.resource.size < maxSizeMB * 1024 * 1024;
    }
    
    // Profile avatars
    match /avatars/{userId}/{fileName} {
      allow read: if true;  // Public read
      allow write: if isOwner(userId) 
        && isValidImage() 
        && isValidSize(5);  // 5MB max
    }
    
    // Cover images
    match /covers/{userId}/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId) 
        && isValidImage() 
        && isValidSize(10);  // 10MB max
    }
    
    // Custom backgrounds
    match /backgrounds/{userId}/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId) 
        && isValidImage() 
        && isValidSize(10);
    }
    
    // Link icons
    match /icons/{userId}/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId) 
        && isValidImage() 
        && isValidSize(2);  // 2MB max
    }
    
    // OG images
    match /og-images/{userId}/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId) 
        && isValidImage() 
        && isValidSize(5);
    }
    
    // Template assets - admin only
    match /templates/{templateId}/{fileName} {
      allow read: if true;
      allow write: if false;  // Admin managed
    }
  }
}
```

---

## 8. Unique Features Implementation

### 8.1 Animated Backgrounds

OneLink offers multiple animated background options to make profiles stand out:

#### Animation Types

| Type | Description | Implementation |
|------|-------------|----------------|
| Particles | Floating particles with mouse interaction | Canvas API + custom JS |
| Gradient | Animated gradient color transitions | CSS animations |
| Waves | Smooth wave patterns | SVG + CSS animations |
| Stars | Twinkling star field | Canvas API |
| Bubbles | Rising bubble effect | CSS animations |
| Mesh | 3D mesh gradient | WebGL/Three.js |

#### Implementation Architecture

```
components/profile/AnimatedBackground/
  AnimatedBackground.jsx       # Main component
  animations/
    ParticlesAnimation.jsx     # Particle system
    GradientAnimation.jsx      # CSS gradient animation
    WavesAnimation.jsx         # SVG wave animation
    StarsAnimation.jsx         # Star field
    BubblesAnimation.jsx       # Bubble effect
    MeshAnimation.jsx          # 3D mesh - Pro feature
  hooks/
    useAnimation.js            # Animation controls
    useMouseTracking.js        # Mouse interaction
  utils/
    particlePhysics.js         # Particle calculations
    colorUtils.js              # Color manipulation
```

#### Performance Considerations

- Use `requestAnimationFrame` for smooth animations
- Implement `IntersectionObserver` to pause when not visible
- Provide reduced-motion option for accessibility
- Lazy load animation libraries
- Use CSS animations where possible for better performance

### 8.2 Template System

#### Template Categories

```
templates/
  minimal/
    - Clean White
    - Minimal Dark
    - Paper
  creative/
    - Neon Glow
    - Glassmorphism
    - Retro Wave
  professional/
    - Corporate
    - Portfolio
    - Resume
  bold/
    - Gradient Pop
    - High Contrast
    - Brutalist
  elegant/
    - Luxury
    - Editorial
    - Boutique
```

#### Template Selection Flow

```
User selects template
       |
       v
Template default settings applied
       |
       v
User can customize colors/fonts
       |
       v
Customizations stored in profile.themeSettings
       |
       v
Template provides base structure
Customizations override defaults
```

### 8.3 QR Code Generation

#### Features

- Multiple sizes: 150px, 300px, 500px
- Custom colors matching profile theme
- Logo embedding - Pro feature
- Downloadable as PNG, SVG
- Dynamic QR codes - updates with profile

#### Implementation

```javascript
// QR Code Generation Service
class QRCodeService {
  // Generate QR code for profile
  async generateProfileQR(username, options = {}) {
    const url = `https://onelink.app/${username}`;
    const qrOptions = {
      size: options.size || 300,
      color: options.color || '#000000',
      backgroundColor: options.backgroundColor || '#FFFFFF',
      logo: options.logo || null,
      errorCorrection: 'H'
    };
    
    return await this.createQR(url, qrOptions);
  }
  
  // Cache QR codes in Firebase Storage
  async getCachedQR(profileId) {
    const cachedQR = await storage.ref(`qr-codes/${profileId}.png`).getDownloadURL();
    return cachedQR;
  }
  
  // Regenerate on profile update
  async onProfileUpdate(profileId) {
    await this.generateAndCacheQR(profileId);
  }
}
```

### 8.4 Social Media Preview Cards

#### Open Graph Implementation

```javascript
// Cloud Function for dynamic OG image generation
exports.generateOGImage = functions.https.onRequest(async (req, res) => {
  const { username } = req.query;
  
  // Get profile data
  const profile = await getProfileByUsername(username);
  
  // Generate OG image using canvas/puppeteer
  const ogImage = await generateImage({
    name: profile.displayName,
    bio: profile.bio,
    avatar: profile.avatarURL,
    theme: profile.themeSettings,
    links: profile.links.slice(0, 3)  // Show top 3 links
  });
  
  // Set cache headers
  res.set('Cache-Control', 'public, max-age=3600');
  res.set('Content-Type', 'image/png');
  res.send(ogImage);
});
```

#### Meta Tags Structure

```html
<!-- Dynamic meta tags for each profile -->
<meta property="og:title" content="{displayName} - OneLink" />
<meta property="og:description" content="{bio}" />
<meta property="og:image" content="https://og.onelink.app/{username}" />
<meta property="og:url" content="https://onelink.app/{username}" />
<meta property="og:type" content="profile" />
<meta property="og:site_name" content="OneLink" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{displayName} - OneLink" />
<meta name="twitter:description" content="{bio}" />
<meta name="twitter:image" content="https://og.onelink.app/{username}" />
```

### 8.5 Analytics Dashboard

#### Key Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| Total Views | Profile page loads | Count of view events |
| Unique Visitors | Distinct visitors | Count distinct IP hashes |
| Total Clicks | All link clicks | Count of click events |
| CTR | Click-through rate | Clicks / Views * 100 |
| Avg. Time | Time on page | Client-side tracking |
| Bounce Rate | Single page visits | Client-side tracking |

#### Analytics Visualization Components

```
components/analytics/
  AnalyticsDashboard.jsx
  charts/
    LineChart.jsx           # Views over time
    BarChart.jsx            # Clicks by link
    PieChart.jsx            # Device breakdown
    AreaChart.jsx           # Traffic trends
  widgets/
    OverviewStats.jsx       # Summary cards
    TopLinks.jsx            # Most clicked links
    GeographicMap.jsx       # Visitor locations
    DeviceBreakdown.jsx     # Mobile/Desktop/Tablet
    TopReferrers.jsx        # Traffic sources
    TimeHeatmap.jsx         # Best performing times
```

### 8.6 Custom Domains - Future Feature

#### Architecture for Custom Domains

```
Custom Domain Request Flow:
1. User adds domain in settings
2. System verifies domain ownership via DNS
3. SSL certificate provisioned
4. Domain mapped to profile
5. Profile accessible via custom domain

Database Schema:
domains/{domainId}
{
  domain: string,           // e.g., mybrand.com
  userId: string,
  profileId: string,
  verificationToken: string,
  isVerified: boolean,
  sslStatus: 'pending' | 'active' | 'error',
  createdAt: timestamp
}
```

#### Implementation Requirements

- Firebase Hosting custom domain setup
- Cloud Functions for domain verification
- SSL certificate automation
- DNS configuration guide for users

---

## 9. Scalability Considerations

### 9.1 Database Scaling

- **Denormalization**: Store frequently accessed data (stats, username) in multiple collections
- **Subcollections**: Use subcollections for analytics to avoid document limits
- **Pagination**: Implement cursor-based pagination for links and analytics
- **Archival**: Move old analytics to cold storage after 90 days

### 9.2 Performance Optimization

- **CDN Caching**: Cache public profiles at edge locations
- **Image Optimization**: Use Firebase Extensions for image resizing
- **Lazy Loading**: Load non-critical components on demand
- **Code Splitting**: Split bundles by route

### 9.3 Rate Limiting

```javascript
// Rate limiting for public endpoints
const rateLimits = {
  profileView: { windowMs: 60000, max: 100 },    // 100 per minute
  linkClick: { windowMs: 60000, max: 50 },       // 50 per minute
  apiRequest: { windowMs: 60000, max: 60 }       // 60 per minute
};
```

---

## 10. Development Roadmap

### Phase 1: MVP
- [ ] User authentication
- [ ] Profile creation with unique URL
- [ ] Basic link management
- [ ] 5 starter templates
- [ ] Basic analytics

### Phase 2: Enhanced Features
- [ ] Animated backgrounds
- [ ] 15+ templates
- [ ] QR code generation
- [ ] Social media preview cards
- [ ] Advanced analytics dashboard

### Phase 3: Pro Features
- [ ] Custom domains
- [ ] Priority support
- [ ] Advanced customization
- [ ] API access
- [ ] White-label options

### Phase 4: Enterprise
- [ ] Team accounts
- [ ] SSO integration
- [ ] Advanced analytics
- [ ] Custom branding
- [ ] SLA guarantees

---

## 11. Competitive Differentiation

| Feature | OneLink | Linktree | Beacons | Carrd |
|---------|---------|----------|---------|-------|
| Animated Backgrounds | Yes | Limited | No | No |
| Free Templates | 15+ | 8 | 12 | 5 |
| QR Codes | Yes | Pro only | Yes | No |
| Analytics | Full | Limited | Full | No |
| Custom Domains | Planned | Pro | Pro | Pro |
| Open Source | Planned | No | No | No |
| Pricing | Freemium | Freemium | Freemium | Paid |

---

## 12. Appendix

### A. Reserved Usernames

```
admin, api, app, auth, blog, dashboard, docs, help, 
home, login, logout, onelink, privacy, register, 
settings, support, terms, www, mail, ftp, smtp, pop, 
imap, admin1, administrator, root, system, test, demo
```

### B. Supported Social Platforms

- Instagram
- Twitter/X
- YouTube
- TikTok
- LinkedIn
- GitHub
- Facebook
- Snapchat
- Pinterest
- Twitch
- Discord
- WhatsApp
- Telegram
- Email
- Phone

### C. Color Palette Defaults

```javascript
const defaultColors = {
  primary: '#6366f1',      // Indigo
  secondary: '#8b5cf6',    // Purple
  background: '#ffffff',   // White
  text: '#1f2937',         // Gray-800
  accent: '#ec4899'        // Pink
};
```

### D. Font Options

```javascript
const availableFonts = [
  'Inter',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Playfair Display',
  'Raleway',
  'Nunito',
  'Source Sans Pro'
];
```

---

*Document Version: 1.0*
*Last Updated: February 2026*
*Author: Architecture Team*