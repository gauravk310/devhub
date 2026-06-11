# DevHub

> **Collaborate. Track. Ship.** — A multi-user software project collaboration and progress tracking platform.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwind-css)

## Features

- 🔐 **Authentication** — GitHub & Google OAuth via NextAuth.js v5 (JWT sessions)
- 📁 **Projects** — Create multi-codebase projects with GitHub repo linking
- ⚙️ **QA Environments** — Configure QA branches per codebase
- 🚀 **Feature Tracking** — Track features across status stages with dynamic branch columns
- 👥 **Team Management** — Invite members via email, manage roles
- 🔔 **Notifications** — Real-time invite notifications with Accept/Decline
- 🌑 **GitHub Dark Theme** — Full GitHub Primer Dark design system

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Database | MongoDB Atlas + Mongoose |
| Auth | NextAuth.js v5 + JWT |
| GitHub API | Octokit REST |
| Icons | Lucide React |

## Local Setup

### 1. Clone and install
```bash
git clone <repo>
cd devhub
npm install
```

### 2. Configure environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### 3. Set up MongoDB Atlas
1. Create a free account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Whitelist your IP (or allow all: `0.0.0.0/0` for dev)
4. Create a database user
5. Get your connection string and set `MONGODB_URI` in `.env.local`

### 4. Set up GitHub OAuth App
1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set **Homepage URL**: `http://localhost:3000`
4. Set **Callback URL**: `http://localhost:3000/api/auth/callback/github`
5. Copy **Client ID** → `GITHUB_CLIENT_ID`
6. Generate **Client Secret** → `GITHUB_CLIENT_SECRET`

### 5. Set up Google OAuth
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. **Create OAuth 2.0 Client ID** (Web application type)
4. Add **Authorized redirect URI**: `http://localhost:3000/api/auth/callback/google`
5. Copy **Client ID** → `GOOGLE_CLIENT_ID`
6. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`

### 6. Generate NextAuth secret
```bash
openssl rand -base64 32
# Paste output into NEXTAUTH_SECRET in .env.local
```

### 7. Run the dev server
```bash
npm run dev
# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/         # Login page (OAuth only)
│   ├── (dashboard)/          # Protected app shell
│   │   ├── projects/         # Projects grid + project pages
│   │   ├── notifications/    # Notifications page
│   │   └── profile/          # User profile
│   └── api/                  # All API routes
├── components/               # UI components
├── lib/                      # MongoDB, Auth, GitHub helpers
├── models/                   # Mongoose schemas
├── types/                    # TypeScript interfaces
└── middleware.ts             # Route protection
```

## Environment Variables Reference

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | 32+ byte random secret for JWT signing |
| `NEXTAUTH_URL` | Base URL (e.g. `http://localhost:3000`) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
