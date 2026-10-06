import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { getValidGitHubToken } from '@/lib/github-token'
import { getRepoStats } from '@/lib/github'

// GET /api/github/repo-stats?repo=owner/repo&projectId=...
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const repoFullName = searchParams.get('repo')
  const projectId = searchParams.get('projectId')

  if (!repoFullName || !repoFullName.includes('/')) {
    return Response.json({ error: 'Missing or invalid repo parameter' }, { status: 400 })
  }

  await dbConnect()
  const [owner, repo] = repoFullName.split('/')

  const token = await getValidGitHubToken({
    userId: session.user.id,
    owner,
    repo,
    projectId,
  })

  if (!token) {
    return Response.json(
      { error: 'No GitHub account linked with access to this repository' },
      { status: 403 }
    )
  }

  try {
    const stats = await getRepoStats(token, owner, repo)
    return Response.json({ data: stats })
  } catch (err: any) {
    console.error('[repo-stats]', err)
    return Response.json({ error: err?.message ?? 'Failed to fetch repo stats' }, { status: 500 })
  }
}
