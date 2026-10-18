

A modern educational platform built with Next.js, React, and Firebase - converting the original app to a powerful web experience for ARAE LMS.

## 🚀 Features

- **Authentication** - Email/Password, Google Sign-In, Password Reset
- **Programs & Courses** - Create, browse, join, and manage educational programs
- **Interactive Quizzes** - Built-in quiz builder and player with scoring
- **Real-Time Chat** - Live discussions for each program
- **Certificate Designer** - Custom certificate generation for program completion
- **Rewards System** - Points, vouchers, and rewards redemption
- **Ranking System** - Leaderboards and student rankings
- **News & Updates** - Announcements and news management
 - **Email Campaigns** - (removed)
- **Advanced Analytics** - Heatmaps, knowledge radars, and detailed engagement stats
- **Dark Mode** - Full theme support (Light/Dark/System)
- **Media Support** - Image viewer, video player, PDF viewer
- **Role-Based Access** - Students, Organizations, Admin, and Super Admin roles

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **State Management:** React Query + Zustand
- **Backend:** Firebase (Auth, Firestore, Storage) + AWS SES
- **Forms:** React Hook Form + Zod
- **Rich Text:** React Quill
- **Drag & Drop:** dnd-kit
- **PDF Generation:** jspdf + html2canvas

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- Firebase project with Firestore, Auth, and Storage enabled

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd arae-web
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
arae-web/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard pages
│   ├── api/                 # API Routes
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── programs/            # Program & Quiz components
│   ├── analytics/           # Charts and stats components
│   ├── rewards/             # Rewards & Voucher components
│   └── admin/               # Admin dashboard components
├── lib/                     # Core utilities
│   ├── firebase/            # Firebase configuration
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores
│   ├── services/            # External services (SES, etc.)
│   └── utils/               # Utility functions
└── .env.local              # Environment variables
```

## 🎯 Key Pages

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing page | Public |
| `/login` | Login page | Public |
| `/programs` | Programs list | Protected |
| `/programs/[id]` | Program details & content | Protected |
| `/programs/[id]/stats` | Program analytics | Organization |
| `/statistics` | Global analytics dashboard | Protected |
| `/ranks` | Student leaderboards | Protected |
| `/rewards` | Rewards & Vouchers | Protected |
| `/news` | News & Announcements | Protected |
| `/admin` | Admin dashboard | Super Admin |
| `/admin` | Admin dashboard | Super Admin |

## 🔐 User Roles

- **Student** - Join programs, take quizzes, earn points, chat, redeem rewards
 - **Organization** - Create content, manage programs, view analytics
- **Super Admin** - System-wide management

## 📦 Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## 🚢 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using Next.js and Firebase**
