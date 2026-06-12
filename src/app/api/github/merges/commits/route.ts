import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { Octokit } from '@octokit/rest'

// Parser to extract branch names from Git merge messages
function extractBranchFromMessage(message: string): string | null {
  const prMergeRegex = /Merge pull request #\d+ from ([^\s]+)/
  const intoMergeRegex = /Merge branch '([^']+)' into ([^\s]+)/
  const genericIntoMergeRegex = /Merge branch ([^\s]+) into ([^\s]+)/
  const branchMergeRegex = /Merge branch '([^']+)'/
  const genericMergeRegex = /Merge branch ([^\s]+)/

  let match = message.match(intoMergeRegex)
  if (match) {
    const src = match[1]
    const dest = match[2]
    const lowerSrc = src.toLowerCase()
    if (lowerSrc === 'qa' || lowerSrc === 'main' || lowerSrc === 'master' || lowerSrc === 'develop' || lowerSrc === 'development') {
      return dest
    }
    return src
  }

  match = message.match(genericIntoMergeRegex)
  if (match) {
    const src = match[1]
    const dest = match[2]
    const lowerSrc = src.toLowerCase()
    if (lowerSrc === 'qa' || lowerSrc === 'main' || lowerSrc === 'master' || lowerSrc === 'develop' || lowerSrc === 'development') {
      return dest
    }
    return src
  }

  match = message.match(prMergeRegex)
  if (match) {
    const branch = match[1]
    if (branch.includes('/') && !branch.startsWith('feature/') && !branch.startsWith('bugfix/') && !branch.startsWith('hotfix/')) {
      const parts = branch.split('/')
      return parts.slice(1).join('/')
    }
    return branch
  }

  match = message.match(branchMergeRegex)
  if (match) return match[1]

  match = message.match(genericMergeRegex)
  if (match) return match[1]

  return null
}

// GET /api/github/merges/commits?repo=owner/repo&source_type=PR&pull_number=123
// GET /api/github/merges/commits?repo=owner/repo&source_type=DIRECT_MERGE&sha=abc
// GET /api/github/merges/commits?repo=owner/repo&source_type=DIRECT_COMMIT&sha=abc
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const repoFullName = searchParams.get('repo')
  const sourceType = searchParams.get('source_type')
  const pullNumberStr = searchParams.get('pull_number')
  const sha = searchParams.get('sha')
  const branchName = searchParams.get('branchName')
  const qaBranch = searchParams.get('qaBranch')

  if (!repoFullName || !repoFullName.includes('/') || !sourceType) {
    return Response.json({ error: 'Missing or invalid parameters' }, { status: 400 })
  }

  await dbConnect()
  const dbUser = await User.findById(session.user.id).select('githubAccessToken')
  if (!dbUser?.githubAccessToken) {
    return Response.json({ error: 'No GitHub account linked' }, { status: 403 })
  }

  const [owner, repo] = repoFullName.split('/')
  const octokit = new Octokit({ auth: dbUser.githubAccessToken })

  try {
    if (sourceType === 'PR') {
      if (!pullNumberStr) {
        return Response.json({ error: 'Missing pull_number for PR sourceType' }, { status: 400 })
      }
      const pullNumber = parseInt(pullNumberStr, 10)
      if (isNaN(pullNumber)) {
        return Response.json({ error: 'Invalid pull_number' }, { status: 400 })
      }

      // Fetch commits for PR
      const response = await octokit.pulls.listCommits({
        owner,
        repo,
        pull_number: pullNumber,
        per_page: 100,
      })

      const allCommits = response.data
      let finalCommits = allCommits

      if (branchName && qaBranch) {
        // Fetch the PR details to see if its head branch is the QA branch
        const prDetails = await octokit.pulls.get({
          owner,
          repo,
          pull_number: pullNumber,
        })
        const headBranch = prDetails.data.head.ref
        if (headBranch.toLowerCase() === qaBranch.toLowerCase()) {
          // Yes, this is the integration/QA PR!
          // Find the merge commit(s) of the feature branch into QA
          const featureMergeCommits = allCommits.filter(
            (c) =>
              c.parents &&
              c.parents.length > 1 &&
              extractBranchFromMessage(c.commit.message)?.toLowerCase() === branchName.toLowerCase()
          )

          if (featureMergeCommits.length > 0) {
            const commitsFromFeature: any[] = []
            for (const fmc of featureMergeCommits) {
              if (fmc.parents && fmc.parents.length > 0) {
                const compareResponse = await octokit.repos.compareCommits({
                  owner,
                  repo,
                  base: fmc.parents[0].sha,
                  head: fmc.sha,
                })
                if (compareResponse.data.commits) {
                  commitsFromFeature.push(...compareResponse.data.commits)
                }
              }
            }
            // Deduplicate by SHA
            const uniqueMap = new Map()
            for (const c of commitsFromFeature) {
              uniqueMap.set(c.sha, c)
            }
            finalCommits = Array.from(uniqueMap.values())
          } else {
            finalCommits = []
          }
        }
      }

      const mappedCommits = finalCommits.map((c) => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.author?.login ?? c.commit.author?.name ?? 'Unknown',
        avatarUrl: c.author?.avatar_url ?? '',
        date: c.commit.author?.date ?? new Date().toISOString(),
      }))

      return Response.json({ data: mappedCommits })
    } else if (sourceType === 'DIRECT_MERGE') {
      if (!sha) {
        return Response.json({ error: 'Missing sha for DIRECT_MERGE sourceType' }, { status: 400 })
      }

      // Get detailed merge commit to retrieve parents
      const commitDetails = await octokit.repos.getCommit({
        owner,
        repo,
        ref: sha,
      })

      const parents = commitDetails.data.parents
      if (!parents || parents.length === 0) {
        return Response.json({ data: [] })
      }

      // Determine correct base and head to get only commits made on the branch
      let baseSha = parents[0].sha
      let headSha = sha

      const msg = commitDetails.data.commit.message || ''
      const intoMergeRegex = /Merge branch '([^']+)' into ([^\s]+)/
      const genericIntoMergeRegex = /Merge branch ([^\s]+) into ([^\s]+)/
      
      const trackingBranches = ['qa', 'main', 'master', 'develop', 'development', qaBranch?.toLowerCase()].filter(Boolean)

      let match = msg.match(intoMergeRegex) || msg.match(genericIntoMergeRegex)
      if (match) {
        const src = match[1]
        const lowerSrc = src.toLowerCase()
        if (trackingBranches.includes(lowerSrc)) {
          // qa/main was merged into feature branch.
          // parents[1] is tracking branch, parents[0] is feature branch.
          baseSha = parents[1].sha
          headSha = parents[0].sha
        } else {
          // feature branch was merged.
          // parents[0] is target branch, parents[1] is merged branch.
          baseSha = parents[0].sha
          headSha = parents[1].sha
        }
      } else {
        // Fallback for regular merge commit
        if (parents.length > 1) {
          baseSha = parents[0].sha
          headSha = parents[1].sha
        }
      }

      const compareResponse = await octokit.repos.compareCommits({
        owner,
        repo,
        base: baseSha,
        head: headSha,
      })

      const allCommits = compareResponse.data.commits ?? []
      let finalCommits = allCommits

      if (branchName && qaBranch) {
        const mergedBranchName = extractBranchFromMessage(commitDetails.data.commit.message)
        if (mergedBranchName && mergedBranchName.toLowerCase() === qaBranch.toLowerCase()) {
          // Yes, this is the QA merge commit!
          // Find the merge commit(s) of the feature branch into QA
          const featureMergeCommits = allCommits.filter(
            (c) =>
              c.parents &&
              c.parents.length > 1 &&
              extractBranchFromMessage(c.commit.message)?.toLowerCase() === branchName.toLowerCase()
          )

          if (featureMergeCommits.length > 0) {
            const commitsFromFeature: any[] = []
            for (const fmc of featureMergeCommits) {
              if (fmc.parents && fmc.parents.length > 0) {
                const compareRes = await octokit.repos.compareCommits({
                  owner,
                  repo,
                  base: fmc.parents[0].sha,
                  head: fmc.sha,
                })
                if (compareRes.data.commits) {
                  commitsFromFeature.push(...compareRes.data.commits)
                }
              }
            }
            // Deduplicate by SHA
            const uniqueMap = new Map()
            for (const c of commitsFromFeature) {
              uniqueMap.set(c.sha, c)
            }
            finalCommits = Array.from(uniqueMap.values())
          } else {
            finalCommits = []
          }
        }
      }

      const mappedCommits = finalCommits.map((c) => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.author?.login ?? c.commit.author?.name ?? 'Unknown',
        avatarUrl: c.author?.avatar_url ?? '',
        date: c.commit.author?.date ?? new Date().toISOString(),
      }))

      return Response.json({ data: mappedCommits })
    } else if (sourceType === 'DIRECT_COMMIT') {
      if (!sha) {
        return Response.json({ error: 'Missing sha for DIRECT_COMMIT sourceType' }, { status: 400 })
      }

      // Fetch single commit details
      const response = await octokit.repos.getCommit({
        owner,
        repo,
        ref: sha,
      })

      const c = response.data
      const mappedCommit = {
        sha: c.sha,
        message: c.commit.message,
        author: c.author?.login ?? c.commit.author?.name ?? 'Unknown',
        avatarUrl: c.author?.avatar_url ?? '',
        date: c.commit.author?.date ?? new Date().toISOString(),
      }

      return Response.json({ data: [mappedCommit] })
    } else {
      return Response.json({ error: 'Invalid source_type' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[github-merges-commits-error]', err)
    return Response.json({ error: err?.message ?? 'Failed to fetch commits from GitHub' }, { status: 500 })
  }
}
