
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  balance: number;
  avatar?: string;
  avatarLocked?: boolean;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'PREMIUM' | 'BANNED';
  joinedAt: string;
  lastActive?: string;
  birthday?: string;
  provider: 'email' | 'google' | 'facebook' | 'x';
  emailPreferences?: {
    marketing: boolean;
    updates: boolean;
  };
  gameScores?: {
    match: number;
    cloud: number;
  };
  streak: number;
  lastLoginDate: string;
  themePreference?: 'light' | 'dark';
  languagePreference?: string;
}

export interface Companion {
  id: string;
  name: string;
  specialty: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  imageUrl: string;
  rating: number;
  bio: string;
  replicaId: string;
  gender: 'Male' | 'Female';
  // Trust Signals
  licenseNumber: string;
  degree: string;
  stateOfPractice: string;
  yearsExperience: number;
}

export interface Transaction {
  id: string;
  userId?: string;
  userName?: string;
  date: string;
  amount: number; // In Minutes
  cost?: number; // In Dollars
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED';
}

export interface GlobalSettings {
  pricePerMinute: number;
  saleMode: boolean; // New field for $1.49 vs $1.99
  maintenanceMode: boolean;
  allowSignups: boolean;
  siteName: string;
  broadcastMessage?: string;
  dashboardBroadcastMessage?: string;
  maxConcurrentSessions: number;
  multilingualMode: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'SECURITY';
  event: string;
  details: string;
  ip?: string;
}

export interface ServerMetric {
  time: string;
  cpu: number;
  memory: number;
  latency: number;
  activeSessions: number;
}

export interface MoodEntry {
  id: string;
  userId: string;
  date: string;
  mood: 'confetti' | 'rain' | null;
  note?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  content: string;
}

export interface ArtEntry {
  id: string;
  userId: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
  title?: string; // Optional title
}

export interface BreathLog {
  id: string;
  userId: string;
  date: string;
  durationSeconds: number;
}

export interface SessionFeedback {
  id: string;
  userId: string;
  userName: string;
  companionName: string;
  rating: number;
  tags: string[];
  date: string;
  duration: number;
}

export interface SessionMemory {
  id: string;
  userId: string;
  companionName: string;
  date: string;
  summary: string;
  keyTopics: string[];
}

export interface GiftCard {
  id: string;
  code: string;
  amount: number;
  createdBy: string;
  isRedeemed: boolean;
}

export interface GardenState {
  userId: string;
  level: number; // 1-5
  currentPlantType: 'Lotus' | 'Rose' | 'Sunflower' | 'Fern';
  lastWateredAt: string;
  streakCurrent: number;
  streakBest: number;
}

export interface WisdomEntry {
  id: string;
  userId?: string;
  content: string;
  category: string;
  isApproved: boolean;
  likes: number;
  createdAt: string;
}

export interface TimeCapsule {
  id: string;
  userId: string;
  content: string;
  unlockDate: string;
  createdAt: string;
  isRevealed: boolean;
}

export interface VoiceJournalEntry {
  id: string;
  userId: string;
  audioUrl: string;
  durationSeconds: number;
  createdAt: string;
  title: string;
}
