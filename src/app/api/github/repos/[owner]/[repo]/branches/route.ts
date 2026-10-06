import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { getCandidateGitHubTokens } from '@/lib/github-token'
import { getRepoBranches } from '@/lib/github'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ owner: string; repo: string }> }

// GET /api/github/repos/[owner]/[repo]/branches
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { owner, repo } = await params
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  await dbConnect()

  const candidateTokens = await getCandidateGitHubTokens({
    userId: session.user.id,
    owner,
    repo,
    projectId,
  })

  if (candidateTokens.length === 0) {
    return Response.json(
      { error: 'No GitHub account linked with access to this repository' },
      { status: 403 }
    )
  }

  let branches: any[] = []
  let lastError: any = null

  for (const token of candidateTokens) {
    try {
      branches = await getRepoBranches(token, owner, repo)
      lastError = null
      break
    } catch (err) {
      lastError = err
      console.warn(
        `[branches] Candidate token failed for ${owner}/${repo}:`,
        (err as any)?.status || (err as any)?.message
      )
    }
  }

  if (branches.length === 0 && lastError) {
    return Response.json(
      { error: lastError?.message || 'Failed to fetch branches from GitHub' },
      { status: 502 }
    )
  }

  return Response.json({ data: branches })
}
