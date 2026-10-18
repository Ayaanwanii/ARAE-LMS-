/**
 * TypeScript type definitions for Fir estore data models
 * Converted from Flutter Dart schema
 */

import { Timestamp, DocumentReference } from 'firebase/firestore';

/**
 * User Profile (users collection)
 * Matches UsersRecord from Flutter
 */
export interface UserProfile {
    id?: string; // Document ID
    uid: string;
    email: string;
    displayName: string;
    photoUrl: string;
    phoneNumber: string;
    phoneNumberDialCode: string;

    // Timestamps
    createdTime: Timestamp | Date;
    editedTime?: Timestamp | Date;
    lastActiveTime?: Timestamp | Date;
    birthday?: Timestamp | Date;

    // Profile details
    role: string;
    gender: string;
    age: number;
    interest: string[];

    // Location
    schoolName: string;
    schoolRef: string;
    countryRef: string;
    stateRef: string;
    postcode: number;

    // Permissions & Status
    isOrganisation: boolean;
    isSuperAdmin: boolean;
    isSubAdmin?: boolean;

    // Event participation
    joinedEventNumber: number;
    joinedEventRef: DocumentReference[];

    // Rewards
    points: number;

    // Folders
    joinedFoldersRef?: DocumentReference[];
    joinedFoldersNumber?: number;
}

/**
 * Event/Program (event collection)
 * Matches EventRecord from Flutter
 */
export interface EventProgram {
    id: string;
    title: string;
    description: string;
    image: string;
    type: string;
    access: string; // 'public' | 'private'
    isLocked?: boolean; // If true, public programs require admin to add participants
    mode?: 'online' | 'offline';
    approach: string;
    archived?: boolean;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    createdTime?: Timestamp;
    editedTime?: Timestamp;

    // Participation
    joined: DocumentReference[];
    userJoined: string[];
    userJoinedNumber: number;
    createdBy: DocumentReference;
    whoCreated: boolean;
    privateAccess: DocumentReference[];

    // Content
    video: VideoStruct;
    episode: EpisodeMainStruct[];
    resources?: Resource[];

    // Metadata
    date: DateStruct;
    duration: number;
    location: LocationStruct;
    attachement: AttachementStruct;

    // Categorization
    category: string[];
    audience: string[];

    // Certificate
    certificate?: {
        templateUrl: string;
        elements: {
            id: 'studentName' | 'schoolName' | 'date';
            label: string;
            x: number;
            y: number; // Percentage 0-100
            isVisible: boolean;
            maxWidth?: number; // Percentage 0-100
        }[];
        style: {
            fontSize: number;
            fontColor: string;
            fontFamily: string;
        };
        massDownloadEnabled?: boolean; // Enable bulk certificate download via CSV
    };

    // Rewards
    rewardPoints?: number;

    // Background override
    background?: string;
}

/**
 * Resource structure
 */
export interface Resource {
    id: string;
    title: string;
    type: 'url' | 'pdf' | 'photo' | 'video';
    url: string;
    description?: string;
}

/**
 * Video structure
 */
export interface VideoStruct {
    url?: string;
    thumbnail?: string;
    duration?: number;
}

/**
 * Episode structure
 */
export interface EpisodeMainStruct {
    title: string;
    description: string;
    content?: string;
    videoUrl?: string;
    audioUrl?: string;
    pdfUrl?: string;
    order: number;
    duration?: number;
    type?: 'video' | 'quiz';
    questions?: QuizQuestion[];
}

/**
 * Quiz Question structure
 */
export interface QuizQuestion {
    id: string;
    type?: 'multiple_choice' | 'short_answer' | 'paragraph'; // defaults to 'multiple_choice'
    text: string;
    image?: string;
    options: string[];           // used for multiple_choice
    correctOption: number;       // used for multiple_choice
}

/**
 * Date structure
 */
export interface DateStruct {
    startDate?: Timestamp | Date;
    endDate?: Timestamp | Date;
    timeZone?: string;
}

/**
 * Location structure
 */
export interface LocationStruct {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
}

/**
 * Attachment structure
 */
export interface AttachementStruct {
    url?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
}

/**
 * Chat Message (messages collection)
 */
export interface ChatMessage {
    id?: string;
    userRef: string;
    userName: string;
    userImage: string | null;
    message: string;
    programRef: string;
    roomId: string | null;
    timestamp: Timestamp;
    isRead: boolean;
    createdAt?: Timestamp;
}

/**
 * Chat Room (chats collection)
 */
export interface ChatRoom {
    id?: string;
    name?: string;
    description?: string;
    programRef?: string;
    participants: DocumentReference[];
    participantIds?: string[];
    createdBy: string;
    createdAt: Timestamp | Date;
    lastMessage?: string;
    lastMessageTime?: Timestamp | Date;
    lastMessageSenderId?: string;
    unreadCount?: Record<string, number>;
    isActive?: boolean;
}

/**
 * Group Chat (group_chat collection)
 */
export interface GroupChat {
    id: string;
    name: string;
    description: string;
    image: string;
    createdBy: DocumentReference;
    participants: DocumentReference[];
    participantIds: string[];
    admins: string[];
    lastMessage: string;
    lastMessageTime: Timestamp | Date;
    createdTime: Timestamp | Date;
}

/**
 * Notification (notifications subcollection)
 */
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'event_join' | 'chat_message' | 'event_update' | 'system';
    read: boolean;
    timestamp: Timestamp | Date;
    actionUrl?: string;
    metadata?: Record<string, any>;
}

/**
 * Email Campaign (email collection)
 */
// Email campaign types removed: Campaign feature disabled

/**
 * School/Organization (school collection)
 */
export interface School {
    id?: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phoneNumber: string;
    email: string;
    website?: string;
    logo?: string;
    type: 'school' | 'organization';
    verified: boolean;
    createdAt?: Timestamp | Date;
    studentCount?: number;
    programCount?: number;
}

/**
 * Helper type for Firestore document with ID
 */
export type WithId<T> = T & { id: string };

/**
 * Helper type for optional fields
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * News Article (news collection)
 */
export interface NewsArticle {
    id: string;
    title: string;
    content: string; // HTML content
    coverImage?: string;
    images: string[];
    authorId: string;
    authorName: string;
    authorRole: string;
    createdAt: Timestamp | Date;
    updatedAt?: Timestamp | Date;
    tags?: string[];
    isPublished: boolean;
    isPinned?: boolean;
    summary?: string;
}

/**
 * Reward/Voucher (rewards collection)
 */
export interface Reward {
    id: string;
    title: string;
    description: string;
    pointsCost: number;
    discountValue?: string; // e.g. "10% OFF"
    image: string;
    code?: string; // Promo code if applicable
    expiryDate?: Timestamp | Date;
    createdBy: string;
    createdAt: Timestamp | Date;
    isActive: boolean;
    viewCount?: number;
    isNew?: boolean; // For "NEW" badge
    merchantName?: string; // e.g. "ZUS Coffee"
}

/**
 * Redemption Record (redemptions collection)
 */
export interface Redemption {
    id: string;
    userId: string;
    rewardId: string;
    rewardTitle: string;
    rewardImage: string;
    pointsCost: number;
    code?: string;
    redeemedAt: Timestamp | Date;
    status: 'active' | 'used' | 'expired';
    expiryDate?: Timestamp | Date;
    merchantName?: string;
    discountValue?: string;
}

/**
 * Advertisement (advertisements collection)
 */
export interface Advertisement {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    redirectUrl?: string;
    endDate: Timestamp | Date;
    isActive: boolean;
    createdBy: string;
    createdAt: Timestamp | Date;
    updatedAt?: Timestamp | Date;
}

/**
 * Program Folder (program_folders collection)
 * For organizing and sharing collections of programs
 */
export interface ProgramFolder {
    id: string;
    name: string;
    description?: string;
    coverImage?: string;
    background?: string;
    videoUrl?: string;
    createdBy: string;
    createdAt: Timestamp | Date;
    updatedAt?: Timestamp | Date;
    programIds: string[];      // References to programs (event collection)
    itemOrder?: string[];      // Ordered program IDs
    shareToken: string;        // Unique UUID for sharing
    isShareable: boolean;      // Toggle sharing on/off
    viewCount: number;         // Analytics: total views
    joined?: DocumentReference[]; // Reference to users who joined
    userJoined?: string[];      // UIDs of users who joined
    userJoinedNumber?: number; // Total number of users who joined
}

/**
 * Folder View (folder_views collection)
 * Analytics tracking for shared folder views
 */
export interface FolderView {
    id: string;
    folderId: string;
    shareToken: string;
    userId: string;
    userEmail?: string;
    viewedAt: Timestamp | Date;
    programsClicked?: string[]; // Track which programs user clicked
}

/**
 * Rank System (ranks collection)
 */
export interface Rank {
    id: string;
    name: string;
    min: number;
    max: number | null; // null for Infinity
    iconUrl: string; // Firebase Storage URL for the rank image
    order: number; // For sorting
}

/**
 * Cached Recommendation (user_recommendations collection)
 * Stores pre-computed recommendations for faster retrieval
 */
export interface UserRecommendation {
    id: string;
    userId: string;
    programId: string;
    score: number;
    reasons: {
        type: string;
        text: string;
        confidence: number;
    }[];
    breakdown: {
        contentScore: number;
        collaborativeScore: number;
        performanceScore: number;
        popularityScore: number;
        recencyScore: number;
    };
    computedAt: Timestamp | Date;
    expiresAt: Timestamp | Date;
}
