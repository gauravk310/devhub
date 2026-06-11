import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getUserRepos } from '@/lib/github'

// GET /api/github/repos — list authenticated user's GitHub repos
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await dbConnect()
  const dbUser = await User.findById(session.user.id).select('githubAccessToken provider')
  if (!dbUser?.githubAccessToken) {
    return Response.json({ error: 'No GitHub account linked' }, { status: 403 })
  }

  const repos = await getUserRepos(dbUser.githubAccessToken)
  return Response.json({ data: repos })
}
