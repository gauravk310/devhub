import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getRepoStats } from '@/lib/github'

// GET /api/github/repo-stats?repo=owner/repo
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const repoFullName = searchParams.get('repo')

  if (!repoFullName || !repoFullName.includes('/')) {
    return Response.json({ error: 'Missing or invalid repo parameter' }, { status: 400 })
  }

  await dbConnect()
  const dbUser = await User.findById(session.user.id).select('githubAccessToken')
  if (!dbUser?.githubAccessToken) {
    return Response.json({ error: 'No GitHub account linked' }, { status: 403 })
  }

  const [owner, repo] = repoFullName.split('/')

  try {
    const stats = await getRepoStats(dbUser.githubAccessToken, owner, repo)
    return Response.json({ data: stats })
  } catch (err: any) {
    console.error('[repo-stats]', err)
    return Response.json({ error: err?.message ?? 'Failed to fetch repo stats' }, { status: 500 })
  }
}
