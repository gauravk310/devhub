// ============================================================
// DevHub — Shared TypeScript Interfaces
// ============================================================
//
// ⚠️  NO Node.js-only imports here.
// This file is imported by client components — must be browser-safe.

// Browser-safe ObjectId type (no mongoose import required)
type ObjectId = string | { toString(): string }

// ─── Auth / Session ──────────────────────────────────────────

export interface DevHubSession {
  user: {
    id: string
    name: string
    email: string
    image: string
    githubUsername?: string
  }
  expires: string
}

export interface DevHubJWT {
  sub: string
  userId: string
  name: string
  email: string
  image: string
  githubUsername?: string
  iat: number
  exp: number
}

// ─── User ────────────────────────────────────────────────────

export interface IUser {
  _id: ObjectId
  name: string
  email: string
  image: string
  githubUsername?: string
  githubAccessToken?: string // server-side only, never sent to client
  provider: 'github'
  createdAt: Date
}

export type PublicUser = Omit<IUser, 'githubAccessToken'>

// ─── Project ─────────────────────────────────────────────────

export interface ICodebase {
  _id: ObjectId
  name: string
  repoFullName: string
  repoId: number
}

export interface IQABranch {
  codebaseId: ObjectId
  branchName: string
}

export interface IProject {
  _id: ObjectId
  name: string
  domain: string
  projectId?: string
  ownerId: ObjectId
  codebases: ICodebase[]
  hasQA: boolean
  qaBranches: IQABranch[]
  members: ObjectId[]
  createdAt: Date
  updatedAt: Date
}

// Populated project returned from API
export interface IProjectWithMembers extends Omit<IProject, 'members' | 'ownerId'> {
  ownerId: PublicUser | string
  members: PublicUser[]
}

// ─── Feature ─────────────────────────────────────────────────

export type FeatureStatus = 'PENDING' | 'READY' | 'TESTING' | 'DEPLOYED' | 'DISCARD'
export type FeatureType = 'FEATURE' | 'BUG FIX' | 'UPDATE' | 'DISCARD' | 'OTHER'

export interface ICodebaseBranch {
  codebaseId: ObjectId
  codebaseName: string
  branchName: string | null
}

export interface IFeature {
  _id: ObjectId
  projectId: ObjectId
  name: string
  description: string
  authorId: ObjectId
  collaborators: ObjectId[]
  codebaseBranches: ICodebaseBranch[]
  dbChange: string
  envChange: string
  note: string
  status: FeatureStatus
  type?: FeatureType
  deploymentDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface IFeaturePopulated extends Omit<IFeature, 'authorId' | 'collaborators'> {
  authorId: PublicUser
  collaborators: PublicUser[]
}

// ─── Notification ─────────────────────────────────────────────

export type NotificationType = 'PROJECT_INVITE' | 'FEATURE_UPDATE' | 'GENERAL' | 'PROJECT_REQUEST'
export type NotificationStatus = 'UNREAD' | 'READ' | 'ACCEPTED' | 'DECLINED'

export interface INotification {
  _id: ObjectId
  recipientId: ObjectId
  senderId: ObjectId
  type: NotificationType
  projectId: ObjectId | null
  title: string
  message: string
  status: NotificationStatus
  createdAt: Date
}

export interface INotificationPopulated extends Omit<INotification, 'senderId' | 'recipientId'> {
  senderId: PublicUser
  recipientId: PublicUser
}

// ─── GitHub API ───────────────────────────────────────────────

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
  html_url: string
  updated_at: string | null
  language: string | null
}

export interface GitHubBranch {
  name: string
  commit: {
    sha: string
  }
  protected: boolean
}

// ─── API Response Helpers ─────────────────────────────────────

export interface ApiError {
  error: string
}

export interface ApiSuccess<T> {
  data: T
}
