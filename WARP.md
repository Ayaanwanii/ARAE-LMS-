# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This web project (now ARAE LMS) is built with Next.js 16 (App Router), TypeScript, and Firebase. It's a web conversion of a Flutter app for managing educational programs, quizzes, certificates, rewards, and user engagement.

## Commands

### Development
```bash
npm run dev          # Start development server at http://localhost:3000
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Firebase Deployment
```bash
firebase deploy      # Deploy to Firebase Hosting (requires prior `npm run build`)
```

## Architecture

### State Management
- **Server State**: React Query (`@tanstack/react-query`) for all Firebase/Firestore data fetching. Custom hooks in `lib/hooks/` wrap React Query with Firestore operations.
- **Client State**: Zustand stores in `lib/store/` and `lib/stores/` for notifications and toasts.

### Firebase Integration
- **Client SDK** (`lib/firebase/config.ts`): Exports `auth`, `db`, `storage` singletons for client-side use.
- **Admin SDK** (`lib/firebase/admin.ts`): Lazy-loaded via `getAdminDb()` for server-side API routes. Uses `createRequire` to bypass bundler issues.
-- **Firestore collections**: `users`, `event` (programs), `news`, `rewards`, `redemptions`, `chat_messages`, `notifications`, `advertisements`, `program_folders`.

### Data Flow Pattern
All Firestore operations follow this pattern:
1. Custom hook in `lib/hooks/` (e.g., `usePrograms.ts`)
2. Uses React Query's `useQuery`/`useMutation`/`useInfiniteQuery`
3. Firestore operations via client SDK
4. Type definitions from `lib/types/firestore.ts`

### API Routes (`app/api/`)
 - `webhooks/ses/` - SES event webhooks for email analytics (campaign handling disabled)
- `youtube/playlist/` - YouTube playlist fetching
- `programs/shared/` - Public program folder sharing

### Route Groups
- `(auth)/` - Public auth pages: login, signup, forgot-password
- `(dashboard)/` - Protected routes with sidebar navigation. Route protection via `useAuth()` hook in layout.

### User Roles
Three permission levels checked via `UserProfile` fields:
- **Student** (`isOrganisation: false, isSuperAdmin: false`)
- **Organization** (`isOrganisation: true`)
- **Super Admin** (`isSuperAdmin: true`)

Permission checks use profile fields directly (no middleware). Firestore security rules enforce the same logic server-side.

### Key Components
- `components/providers.tsx` - React Query provider setup
- `components/ui/` - Reusable UI components (Button, Input, Modal, Toast, etc.)
- `components/programs/` - Program-specific components (QuizBuilder, QuizPlayer, CertificateDesigner)

### Path Aliases
Use `@/*` to import from project root (configured in `tsconfig.json`).

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# For API routes
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
SES_FROM_EMAIL
FIREBASE_SERVICE_ACCOUNT_KEY  # JSON string for Admin SDK
```

## Firestore Data Model

Key types are defined in `lib/types/firestore.ts`:
- `UserProfile` - User document in `users` collection
- `EventProgram` - Program/course in `event` collection (includes episodes, quizzes, certificates)
- `QuizQuestion` - Embedded in episode structure
 - `EmailCampaign` - (removed)

Programs store related content (episodes, quizzes) as nested structures within the document, not subcollections.

## Important Patterns

### Toast Notifications
```typescript
import { toast } from '@/lib/stores/toastStore';
toast.success('Message');
toast.error('Error message');
```

### Auth Hook Usage
```typescript
const { user, profile, loading } = useAuth();
const isOrg = useIsOrganisation();
const isAdmin = useIsSuperAdmin();
```

### Firestore Queries
Programs collection uses `event` (not `programs`) due to Flutter legacy. The `usePrograms` hook handles filtering with client-side sorting to avoid composite index requirements.
