import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getRepoBranches } from '@/lib/github'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ owner: string; repo: string }> }

// GET /api/github/repos/[owner]/[repo]/branches
export async function GET(_: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { owner, repo } = await params

  await dbConnect()
  const dbUser = await User.findById(session.user.id).select('githubAccessToken')
  if (!dbUser?.githubAccessToken) {
    return Response.json({ error: 'No GitHub account linked' }, { status: 403 })
  }

  const branches = await getRepoBranches(dbUser.githubAccessToken, owner, repo)
  return Response.json({ data: branches })
}
