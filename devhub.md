# DevTrack — Agent Build Instructions
## Full-Stack Multi-User Project Collaboration Platform

---

## AGENT DIRECTIVE

You are an expert full-stack engineer. Your task is to build **DevTrack** — a multi-user software project collaboration and progress tracking platform — end to end.

**Before writing a single line of code**, you must complete the following phases **in order**:

1. **PLAN** — Architecture, tech decisions, folder structure
2. **DESIGN** — Database schema, API contract, UI wireframe descriptions
3. **BUILD** — Implement feature by feature, file by file
4. **VERIFY** — Self-review each file before moving to the next

Do not skip phases. Do not jump to code until planning is complete.

---

## PHASE 1 — ARCHITECTURE PLANNING

### Tech Stack (fixed, do not change)
| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS |
| Database | MongoDB (via Mongoose) |
| Auth | NextAuth.js v5 (GitHub + Google OAuth) |
| Language | TypeScript |
| State | Zustand or React Context |
| GitHub API | Octokit REST client |
| Icons | Lucide React |
| Notifications | Server-Sent Events or Polling |

### Folder Structure to generate
```
devtrack/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Sidebar + Topbar shell
│   │   ├── projects/
│   │   │   ├── page.tsx            ← Projects grid (home after login)
│   │   │   └── [projectId]/
│   │   │       ├── layout.tsx      ← Project sub-tabs layout
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── features/page.tsx
│   │   │       └── team/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── profile/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── projects/
│   │   │   ├── route.ts            ← GET list, POST create
│   │   │   └── [projectId]/
│   │   │       ├── route.ts        ← GET, PUT, DELETE
│   │   │       ├── features/
│   │   │       │   ├── route.ts
│   │   │       │   └── [featureId]/route.ts
│   │   │       └── team/
│   │   │           ├── route.ts
│   │   │           └── invite/route.ts
│   │   ├── github/
│   │   │   └── repos/route.ts      ← List user repos + branches
│   │   ├── notifications/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── users/
│   │       └── search/route.ts
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── UserDropdown.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── CreateProjectModal.tsx
│   │   ├── CodebaseSelector.tsx
│   │   └── QABranchConfig.tsx
│   ├── features/
│   │   ├── FeaturesTable.tsx
│   │   ├── CreateFeatureModal.tsx
│   │   ├── FeatureStatusBadge.tsx
│   │   └── BranchSelector.tsx
│   ├── team/
│   │   ├── TeamTable.tsx
│   │   └── InviteMemberModal.tsx
│   ├── notifications/
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationsTable.tsx
│   │   └── NotificationModal.tsx
│   └── ui/
│       ├── Modal.tsx
│       ├── Toggle.tsx
│       ├── Badge.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── mongodb.ts                  ← DB connection singleton
│   ├── auth.ts                     ← NextAuth config
│   ├── github.ts                   ← Octokit helpers
│   └── utils.ts
├── models/
│   ├── User.ts
│   ├── Project.ts
│   ├── Feature.ts
│   ├── TeamMember.ts
│   └── Notification.ts
├── hooks/
│   ├── useProjects.ts
│   ├── useFeatures.ts
│   ├── useGithubRepos.ts
│   └── useNotifications.ts
├── types/
│   └── index.ts                    ← All shared TypeScript interfaces
├── middleware.ts                   ← Auth route protection
├── .env.local.example
└── tailwind.config.ts
```

---

## PHASE 2 — DATABASE DESIGN

Design and implement the following Mongoose schemas in `/models/`.

### User
```ts
{
  _id: ObjectId,
  name: string,
  email: string,           // unique index
  image: string,           // GitHub/Google avatar URL
  githubUsername: string,
  githubAccessToken: string, // encrypted, used for GitHub API calls
  provider: 'github' | 'google',
  createdAt: Date
}
```

### Project
```ts
{
  _id: ObjectId,
  name: string,
  domain: string,          // e.g. "https://myapp.com"
  ownerId: ObjectId,       // ref: User
  codebases: [
    {
      _id: ObjectId,
      name: string,        // e.g. "Frontend", "Backend"
      repoFullName: string, // e.g. "username/repo-name"
      repoId: number,      // GitHub repo ID
    }
  ],
  hasQA: boolean,
  qaBranches: [
    {
      codebaseId: ObjectId,
      branchName: string
    }
  ],
  members: [ObjectId],     // ref: User (includes owner)
  createdAt: Date,
  updatedAt: Date
}
```

### Feature
```ts
{
  _id: ObjectId,
  projectId: ObjectId,     // ref: Project
  name: string,
  description: string,
  authorId: ObjectId,      // ref: User
  codebaseBranches: [
    {
      codebaseId: ObjectId,
      codebaseName: string,
      branchName: string | null  // null = "No Branch"
    }
  ],
  dbChange: string,
  envChange: string,
  status: enum['PENDING', 'READY', 'TESTING', 'DEPLOYED', 'DISCARD'],
  deploymentDate: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification
```ts
{
  _id: ObjectId,
  recipientId: ObjectId,   // ref: User
  senderId: ObjectId,      // ref: User
  type: enum['PROJECT_INVITE', 'FEATURE_UPDATE', 'GENERAL'],
  projectId: ObjectId | null,
  title: string,
  message: string,
  status: enum['UNREAD', 'READ', 'ACCEPTED', 'DECLINED'],
  createdAt: Date
}
```

---

## PHASE 3 — API CONTRACT

Design all API routes before implementing them.

### Auth
| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler — GitHub + Google |

### Projects
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/projects` | required | Get all projects where user is member |
| POST | `/api/projects` | required | Create project (user becomes owner + member) |
| GET | `/api/projects/:id` | member | Get single project with codebases |
| PUT | `/api/projects/:id` | owner | Update project |
| DELETE | `/api/projects/:id` | owner | Delete project |

### Features
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/projects/:id/features` | member | List all features |
| POST | `/api/projects/:id/features` | member | Create feature |
| PUT | `/api/projects/:id/features/:fid` | member | Update feature (incl. status) |
| DELETE | `/api/projects/:id/features/:fid` | owner | Delete feature |

### Team
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/projects/:id/team` | member | List team members with roles |
| POST | `/api/projects/:id/team/invite` | owner | Send invite notification to user by email |
| DELETE | `/api/projects/:id/team/:uid` | owner | Remove member |

### GitHub
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/github/repos` | required | List authenticated user's repos |
| GET | `/api/github/repos/:owner/:repo/branches` | required | List branches for a repo |

### Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | required | Get all notifications for current user |
| PUT | `/api/notifications/:id` | required | Update notification status (READ, ACCEPTED, DECLINED) |

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/search?q=email` | required | Search registered users by email (for invite) |

---

## PHASE 4 — UI/UX SPECIFICATION

### Global Layout (authenticated)
- **Left Sidebar** (fixed, collapsible on mobile):
  - App logo + name "DevTrack" at top
  - Nav items: Projects (default), Notifications
  - Bottom: current user avatar + name
- **Top Bar** (fixed):
  - Left: current page title / breadcrumb
  - Right: Notification bell with unread count badge → links to `/notifications`
  - Right: User avatar (GitHub/Google photo) → dropdown with: Profile info (name, email, GitHub username, avatar), Sign Out

### Login Page (`/login`)
- Centered card on dark background
- App logo + tagline
- "Continue with GitHub" button (GitHub icon, dark)
- "Continue with Google" button (Google icon, white)
- No signup form — OAuth only

### Projects Page (`/projects`) — Default home after login
- Page title: "My Projects"
- Top right: "+ Create Project" button (primary)
- Card grid (responsive: 1 → 2 → 3 columns):
  - Each **ProjectCard** shows:
    - Project name (large)
    - Domain URL
    - Codebase count badge
    - Member count
    - Date created
    - Your role (Owner / Member)
    - Click → navigate to `/projects/:id/dashboard`

### Create Project Modal
Multi-step modal:

**Step 1 — Basic Info**
- Project Name (text, required)
- Project Domain (text, e.g. https://...)

**Step 2 — Codebases**
- "Add Codebase" repeater:
  - Codebase Name (text input, e.g. "Frontend")
  - Repository (searchable dropdown — fetch from `/api/github/repos`)
  - [+ Add Another Codebase] button
  - [× Remove] per row
- Minimum 1 codebase required

**Step 3 — QA Config**
- Toggle: "Does this project have a QA environment?"
- If ON: for each codebase, show branch dropdown (fetch from GitHub branches API)
- Label: "{CodebaseName} QA Branch"

**Step 4 — Review + Create**
- Summary of all inputs
- [Create Project] button

### Project Inner Layout (`/projects/:id/...`)
- Sub-tab navigation below topbar: **Dashboard** | **Features** | **Team**
- Project name shown as page heading

### Project Dashboard Tab
KPI cards in a row:
- Total Features
- Pending (yellow)
- Ready (blue)
- Testing (purple)
- Deployed (green)
- Discarded (gray)

Below KPIs: recent activity list (last 10 feature changes, newest first).

### Features Tab
- Full-width table with horizontal scroll
- Top right: "+ Add Feature" button (members only)
- **Columns:**
  1. Feature Name
  2. Description (truncated with tooltip)
  3. Author (avatar + name)
  4. [Dynamic: one column per codebase] — shows branch name or "No Branch"
  5. DB Change
  6. ENV Change
  7. Deployment Date
  8. Status (colored badge, clickable dropdown to change status for members)
- Rows sorted by createdAt desc by default
- Status badge colors: PENDING=yellow, READY=blue, TESTING=purple, DEPLOYED=green, DISCARD=gray

### Create Feature Modal
- Feature Name (text, required)
- Description (textarea)
- Codebase Branches section:
  - For each codebase in project, show:
    - Label: "{CodebaseName} Branch"
    - Dropdown: "No Branch" + list of branches from that repo (fetched live)
- DB Change (text input, optional)
- ENV Change (text input, optional)
- Created At (date picker, default = today)
- [Create Feature] button

### Team Tab
- Table: Avatar | Name | Email | Role (Owner/Member) | Joined Date | [Remove] (owner only)
- Top right: "+ Add Member" button (owner only)

### Invite Member Modal (owner only)
- Email input with live search (calls `/api/users/search?q=...`)
- Shows matching user suggestions (avatar + name + email) as dropdown
- On select: user appears in a "pending invite" chip
- [Send Invite] button → creates Notification for that user

### Notifications Page (`/notifications`)
- Table: Type icon | Title | From | Project | Date | Status badge
- Click row → opens **Notification Modal**:
  - Shows full message
  - If type = `PROJECT_INVITE` and status = `UNREAD`: show [Accept] and [Decline] buttons
  - Accept → adds user to project members, updates notification status to ACCEPTED, project appears on their Projects page
  - Decline → status = DECLINED

### Notification Bell (Topbar)
- Bell icon
- Red badge showing count of UNREAD notifications
- Clicking navigates to `/notifications`

---

## PHASE 5 — IMPLEMENTATION ORDER

Implement in this exact order. Complete each step fully before the next.

### Step 1 — Project Bootstrap
```bash
npx create-next-app@latest devtrack --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd devtrack
npm install mongoose next-auth@beta @auth/mongodb-adapter
npm install @octokit/rest
npm install lucide-react
npm install zustand
npm install date-fns
```

### Step 2 — Environment Setup
Create `.env.local.example` with all required vars:
```
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
Document how to create GitHub OAuth App and Google OAuth credentials.

### Step 3 — Database + Auth Foundation
1. `lib/mongodb.ts` — connection singleton with retry logic
2. `models/User.ts` — Mongoose schema + model
3. `models/Project.ts`
4. `models/Feature.ts`
5. `models/Notification.ts`
6. `lib/auth.ts` — NextAuth config with GitHub + Google providers, MongoDB adapter, session callbacks to include user._id and githubAccessToken
7. `app/api/auth/[...nextauth]/route.ts`
8. `middleware.ts` — protect all `/projects/*`, `/notifications/*` routes

### Step 4 — Types
`types/index.ts` — define all shared TypeScript interfaces matching the schemas above.

### Step 5 — GitHub API Layer
`lib/github.ts`:
- `getUserRepos(accessToken)` → list all repos (paginated)
- `getRepoBranches(accessToken, owner, repo)` → list branches
`app/api/github/repos/route.ts` — GET handler
`app/api/github/repos/[owner]/[repo]/branches/route.ts` — GET handler

### Step 6 — Layout Shell
1. `app/layout.tsx` — root layout, SessionProvider
2. `app/(auth)/login/page.tsx` — login UI
3. `app/(dashboard)/layout.tsx` — Sidebar + Topbar shell
4. `components/layout/Sidebar.tsx`
5. `components/layout/Topbar.tsx`
6. `components/layout/UserDropdown.tsx` — shows GitHub profile data (name, username, avatar, email)

### Step 7 — Projects Feature
1. `app/api/projects/route.ts` — GET + POST
2. `app/api/projects/[projectId]/route.ts` — GET + PUT + DELETE
3. `hooks/useProjects.ts`
4. `components/projects/ProjectCard.tsx`
5. `components/projects/CodebaseSelector.tsx` — repo search dropdown + branch fetch
6. `components/projects/QABranchConfig.tsx`
7. `components/projects/CreateProjectModal.tsx` — multi-step
8. `app/(dashboard)/projects/page.tsx` — grid + create button

### Step 8 — Project Inner Pages + Dashboard
1. `app/(dashboard)/projects/[projectId]/layout.tsx` — sub-tab nav
2. `app/(dashboard)/projects/[projectId]/dashboard/page.tsx` — KPI cards + recent activity

### Step 9 — Features Feature
1. `app/api/projects/[projectId]/features/route.ts` — GET + POST
2. `app/api/projects/[projectId]/features/[featureId]/route.ts` — PUT + DELETE
3. `hooks/useFeatures.ts`
4. `components/features/FeatureStatusBadge.tsx` — colored badge + status change dropdown
5. `components/features/BranchSelector.tsx` — per-codebase branch picker
6. `components/features/CreateFeatureModal.tsx`
7. `components/features/FeaturesTable.tsx` — dynamic columns based on project codebases
8. `app/(dashboard)/projects/[projectId]/features/page.tsx`

### Step 10 — Team + Invitations
1. `app/api/users/search/route.ts` — search by email prefix
2. `app/api/projects/[projectId]/team/route.ts` — GET + DELETE
3. `app/api/projects/[projectId]/team/invite/route.ts` — POST (creates Notification)
4. `app/api/notifications/route.ts` — GET all for user
5. `app/api/notifications/[id]/route.ts` — PUT (accept/decline/read)
6. `components/team/TeamTable.tsx`
7. `components/team/InviteMemberModal.tsx` — live user search + invite
8. `app/(dashboard)/projects/[projectId]/team/page.tsx`
9. `components/notifications/NotificationBell.tsx` — polls every 30s for unread count
10. `components/notifications/NotificationsTable.tsx`
11. `components/notifications/NotificationModal.tsx` — accept/decline invite logic
12. `app/(dashboard)/notifications/page.tsx`

### Step 11 — Polish + Edge Cases
- Loading skeletons for all data-fetching components
- Error boundaries
- Empty states (no projects, no features, no team members)
- Mobile responsive sidebar (drawer on mobile)
- Proper 401/403 handling in all API routes (verify user is member/owner)
- Optimistic UI updates for status changes

---

## PHASE 6 — SECURITY CHECKLIST

Before finishing, verify each of these:

- [ ] All API routes check `getServerSession()` — unauthenticated = 401
- [ ] Project routes verify user is a `member` of that project — else 403
- [ ] Owner-only routes (invite, delete member, delete project) verify `ownerId === userId`
- [ ] GitHub access token never exposed to client — only used server-side
- [ ] MongoDB queries use proper ObjectId validation to prevent injection
- [ ] Rate limit sensitive endpoints (invite, search)
- [ ] Input validation on all POST/PUT bodies

---

## PHASE 7 — CODE QUALITY RULES

Follow these rules in every file:

1. **TypeScript strict mode** — no `any` types. Use the interfaces from `types/index.ts`
2. **Server Components by default** — only add `'use client'` when using hooks/events
3. **API route pattern:**
```ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  await dbConnect()
  // ... logic
}
```
4. **Tailwind only** — no inline styles, no CSS modules
5. **Consistent color palette:** Use a dark sidebar (`bg-gray-900`), white main area, Tailwind's indigo as primary accent
6. **Component size** — if a component exceeds 200 lines, split it

---

## PHASE 8 — FINAL DELIVERABLES

At the end, provide:

1. **Complete source code** for every file listed in the folder structure
2. **README.md** with:
   - Local setup steps
   - MongoDB Atlas setup
   - GitHub OAuth App creation steps
   - Google OAuth credentials steps
   - Environment variable reference
   - Feature overview
3. **All files organized** in the exact folder structure defined in Phase 1

---

## KEY IMPLEMENTATION NOTES FOR AGENT

### GitHub OAuth token persistence
In NextAuth callbacks, persist the GitHub access token to the User document in MongoDB so it can be used for GitHub API calls server-side:
```ts
async signIn({ user, account }) {
  if (account?.provider === 'github') {
    await User.findOneAndUpdate(
      { email: user.email },
      { githubAccessToken: account.access_token, githubUsername: profile.login },
      { upsert: true }
    )
  }
  return true
}
```

### Dynamic feature table columns
The Features table must generate columns dynamically based on `project.codebases`. Build the column config from the project data at render time — do not hardcode Frontend/Backend columns.

### Notification polling
Use a simple `setInterval` in `NotificationBell.tsx` to poll `/api/notifications?unread=true` every 30 seconds and update the badge count. This avoids WebSocket complexity.

### Project invite flow
1. Owner searches user by email in InviteMemberModal
2. On "Send Invite", POST to `/api/projects/:id/team/invite` with `{ recipientEmail }`
3. API creates a `Notification` document for that user with `type: 'PROJECT_INVITE'`
4. Recipient sees badge on bell → goes to Notifications page → clicks notification → modal shows Accept/Decline
5. On Accept: API adds user to `project.members`, sets notification status to ACCEPTED
6. On recipient's next project page load, the project now appears in their list

### Repo selection UX
When user opens CreateProjectModal and reaches the codebase step:
- Fetch all their GitHub repos via `/api/github/repos`
- Show a searchable select dropdown (filter by typing repo name)
- After repo selected, automatically offer to fetch branches when QA config is needed
- Cache repos in component state for the duration of the modal session

---

*End of Agent Instructions — Begin with Phase 1 architecture review, then proceed sequentially.*