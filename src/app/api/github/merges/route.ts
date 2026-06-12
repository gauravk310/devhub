import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { Octokit } from '@octokit/rest'

// Helper to check if a date is within the last 7 days
function isWithinLast7Days(dateString: string | Date) {
  const d = new Date(dateString)
  const diffTime = Date.now() - d.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= 7
}

// Helper to check if a date is within the current month
function isWithinCurrentMonth(dateString: string | Date) {
  const d = new Date(dateString)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

// Format branch/commit names into human-readable Title Case labels
function formatFeatureName(branchName: string): string {
  return branchName
}

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

// GET /api/github/merges?repo=owner/repo&page=1&per_page=25&mergedBy=username&startDate=...&endDate=...&qaBranch=...
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const repoFullName = searchParams.get('repo')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = parseInt(searchParams.get('per_page') ?? '25', 10)

  // Filters
  const mergedBy = searchParams.get('mergedBy')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const qaBranch = searchParams.get('qaBranch')

  // Ignored branches list configuration
  const ignoredQuery = searchParams.get('ignoredBranches')
  const ignoredBranches = ignoredQuery
    ? ignoredQuery.split(',').map((b) => b.trim().toLowerCase())
    : ['qa', 'develop', 'development', 'staging', 'testing', 'uat', 'release', 'main', 'master']

  if (!repoFullName || !repoFullName.includes('/')) {
    return Response.json({ error: 'Missing or invalid repo parameter' }, { status: 400 })
  }

  await dbConnect()
  const dbUser = await User.findById(session.user.id).select('githubAccessToken')
  if (!dbUser?.githubAccessToken) {
    return Response.json({ error: 'No GitHub account linked' }, { status: 403 })
  }

  const [owner, repo] = repoFullName.split('/')
  const octokit = new Octokit({ auth: dbUser.githubAccessToken })

  try {
    // 1. Get repository details to find the default branch name
    const repoDetails = await octokit.repos.get({ owner, repo })
    const defaultBranch = repoDetails.data.default_branch || 'main'

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const isIgnored = (b: string) => {
      const lower = b.toLowerCase()
      return ignoredBranches.includes(lower) || (qaBranch && lower === qaBranch.toLowerCase())
    }

    // Helper to fetch commits for a branch
    const fetchCommitsForBranch = async (branchName: string) => {
      const branchCommits: any[] = []
      let commitsPage = 1
      let stopCommits = false

      while (commitsPage <= 5 && !stopCommits) {
        try {
          const response = await octokit.repos.listCommits({
            owner,
            repo,
            sha: branchName,
            since: sixMonthsAgo.toISOString(),
            per_page: 100,
            page: commitsPage,
          })

          if (response.data.length === 0) break

          for (const c of response.data) {
            const commitDateStr = c.commit.committer?.date ?? c.commit.author?.date
            if (commitDateStr && new Date(commitDateStr) < sixMonthsAgo) {
              stopCommits = true
              break
            }
            branchCommits.push(c)
          }
          commitsPage++
        } catch (err) {
          console.error(`Failed to fetch commits for branch ${branchName}:`, err)
          break
        }
      }
      return branchCommits
    }

    const combinedList: any[] = []
    let qaCommitShas = new Set<string>()

    // 2. If QA branch is selected, fetch and process its commits (FEATUREs)
    if (qaBranch) {
      const qaCommits = await fetchCommitsForBranch(qaBranch)
      for (const c of qaCommits) {
        qaCommitShas.add(c.sha)

        const commitDateStr = c.commit.committer?.date ?? c.commit.author?.date ?? new Date().toISOString()
        const isMerge = c.parents && c.parents.length > 1
        const mergedBranch = isMerge ? extractBranchFromMessage(c.commit.message) : null

        const firstLine = c.commit.message.split('\n')[0]
        const prMatch = c.commit.message.match(/Merge pull request #(\d+)/) || firstLine.match(/\(#(\d+)\)$/)
        const prNumber = prMatch ? parseInt(prMatch[1], 10) : undefined
        const sourceType = prNumber ? 'PR' : (isMerge ? 'DIRECT_MERGE' : 'DIRECT_COMMIT')

        if (prNumber) {
          // Squash merge PR or merge PR
          combinedList.push({
            sourceType,
            deployType: 'FEATURE',
            number: prNumber,
            sha: c.sha,
            title: firstLine,
            branchName: mergedBranch || '',
            mergedBy: c.author?.login ?? c.commit.author?.name ?? 'Unknown',
            avatarUrl: c.author?.avatar_url ?? '',
            mergeDate: commitDateStr,
            htmlUrl: c.html_url,
            commitCount: c.parents?.length ?? 1,
          })
        } else if (isMerge) {
          if (mergedBranch && !isIgnored(mergedBranch)) {
            combinedList.push({
              sourceType,
              deployType: 'FEATURE',
              sha: c.sha,
              title: mergedBranch,
              branchName: mergedBranch,
              mergedBy: c.author?.login ?? c.commit.author?.name ?? 'Unknown',
              avatarUrl: c.author?.avatar_url ?? '',
              mergeDate: commitDateStr,
              htmlUrl: c.html_url,
              commitCount: c.parents.length,
            })
          }
        }
      }
    }

    // 3. Fetch default branch commits
    const defaultBranchCommits = await fetchCommitsForBranch(defaultBranch)

    // 4. Process default branch commits to discover HOTFIXes (or FEATUREs if no QA is selected)
    for (const c of defaultBranchCommits) {
      // If QA is configured and this commit is in the QA branch history, skip it
      if (qaBranch && qaCommitShas.has(c.sha)) {
        continue
      }

      const commitDateStr = c.commit.committer?.date ?? c.commit.author?.date ?? new Date().toISOString()
      const isMerge = c.parents && c.parents.length > 1
      const mergedBranch = isMerge ? extractBranchFromMessage(c.commit.message) : null

      const firstLine = c.commit.message.split('\n')[0]
      const prMatch = c.commit.message.match(/Merge pull request #(\d+)/) || firstLine.match(/\(#(\d+)\)$/)
      const prNumber = prMatch ? parseInt(prMatch[1], 10) : undefined
      const sourceType = prNumber ? 'PR' : (isMerge ? 'DIRECT_MERGE' : 'DIRECT_COMMIT')

      const deployType = qaBranch ? 'HOTFIX' : 'FEATURE'

      if (prNumber) {
        combinedList.push({
          sourceType,
          deployType,
          number: prNumber,
          sha: c.sha,
          title: firstLine,
          branchName: mergedBranch || '',
          mergedBy: c.author?.login ?? c.commit.author?.name ?? 'Unknown',
          avatarUrl: c.author?.avatar_url ?? '',
          mergeDate: commitDateStr,
          htmlUrl: c.html_url,
          commitCount: c.parents?.length ?? 1,
        })
      } else if (isMerge) {
        if (mergedBranch && !isIgnored(mergedBranch)) {
          combinedList.push({
            sourceType,
            deployType,
            sha: c.sha,
            title: mergedBranch,
            branchName: mergedBranch,
            mergedBy: c.author?.login ?? c.commit.author?.name ?? 'Unknown',
            avatarUrl: c.author?.avatar_url ?? '',
            mergeDate: commitDateStr,
            htmlUrl: c.html_url,
            commitCount: c.parents.length,
          })
        }
      }
    }

    // Sort by mergeDate/releaseDate descending
    combinedList.sort((a, b) => new Date(b.mergeDate).getTime() - new Date(a.mergeDate).getTime())

    // 5. In-Memory Summary Calculations
    const totalMerged = combinedList.filter((item) => item.deployType === 'FEATURE').length
    const mergedThisWeek = combinedList.filter((item) => isWithinLast7Days(item.mergeDate)).length
    const mergedThisMonth = combinedList.filter((item) => isWithinCurrentMonth(item.mergeDate)).length
    const latestMergeItem = combinedList[0] || null

    const latestMerge = latestMergeItem ? {
      branchName: latestMergeItem.branchName,
      title: latestMergeItem.title,
      mergedAt: latestMergeItem.mergeDate,
      mergedBy: {
        login: latestMergeItem.mergedBy,
        avatarUrl: latestMergeItem.avatarUrl,
      }
    } : null

    // 6. Aggregate Unique mergers list for filters
    const uniqueMergersMap = new Map()
    combinedList.forEach((item) => {
      uniqueMergersMap.set(item.mergedBy, item.avatarUrl)
    })
    const mergersList = Array.from(uniqueMergersMap.entries()).map(([login, avatarUrl]) => ({
      login,
      avatarUrl,
    })).sort((a, b) => a.login.localeCompare(b.login))

    // 7. Apply Server-Side filters in-memory
    let filteredList = combinedList

    if (mergedBy) {
      filteredList = filteredList.filter((item) => item.mergedBy.toLowerCase() === mergedBy.toLowerCase())
    }

    if (startDate) {
      const start = new Date(startDate)
      filteredList = filteredList.filter((item) => new Date(item.mergeDate) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filteredList = filteredList.filter((item) => new Date(item.mergeDate) <= end)
    }

    // 8. Pagination Slicing
    const total = filteredList.length
    const hasMore = (page * perPage) < total
    const pageData = filteredList.slice((page - 1) * perPage, page * perPage)

    // 9. Fetch detailed PR info *only* for the 25 items on the active page
    const detailedPageData = await Promise.all(
      pageData.map(async (item) => {
        if (item.sourceType === 'PR') {
          try {
            const detailResponse = await octokit.pulls.get({
              owner,
              repo,
              pull_number: item.number,
            })
            const detail = detailResponse.data

            const finalTitle = detail.title
            const finalBranch = detail.head.ref

            return {
              ...item,
              title: finalTitle,
              branchName: finalBranch,
              mergedBy: detail.user?.login ?? detail.merged_by?.login ?? item.mergedBy,
              avatarUrl: detail.user?.avatar_url ?? detail.merged_by?.avatar_url ?? item.avatarUrl,
              commitCount: detail.commits ?? 0,
            }
          } catch (err) {
            console.error(`Failed to fetch details for PR #${item.number}`, err)
            return item
          }
        }
        return item
      })
    )

    return Response.json({
      data: detailedPageData,
      pagination: {
        page,
        perPage,
        hasMore,
        total,
      },
      summary: {
        totalMerged,
        mergedThisWeek,
        mergedThisMonth,
        latestMerge,
      },
      mergers: mergersList,
    })
  } catch (err: any) {
    console.error('[github-merges-route-error]', err)
    return Response.json({ error: err?.message ?? 'Failed to fetch merge history' }, { status: 500 })
  }
}
