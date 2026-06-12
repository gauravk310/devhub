import { Octokit } from '@octokit/rest'
import type { GitHubBranch, GitHubRepo } from '@/types'

/**
 * Create an authenticated Octokit instance
 */
function createOctokit(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken })
}

/**
 * Fetch all repos for the authenticated user (paginated, up to 200)
 */
export async function getUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const octokit = createOctokit(accessToken)
  const repos: GitHubRepo[] = []

  for await (const response of octokit.paginate.iterator(octokit.repos.listForAuthenticatedUser, {
    visibility: 'all',
    sort: 'updated',
    per_page: 100,
  })) {
    for (const repo of response.data) {
      repos.push({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        description: repo.description,
        html_url: repo.html_url,
        updated_at: repo.updated_at ?? null,
        language: repo.language ?? null,
      })
    }
    if (repos.length >= 200) break
  }

  return repos
}

/**
 * Fetch branches for a specific repo
 */
export async function getRepoBranches(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  const octokit = createOctokit(accessToken)

  const { data } = await octokit.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  })

  return data.map((branch) => ({
    name: branch.name,
    commit: { sha: branch.commit.sha },
    protected: branch.protected,
  }))
}

// --- Repo Analytics ---------------------------------------------------

export interface RepoOverview {
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  stars: number
  forks: number
  watchers: number
  openIssues: number
  size: number
  language: string | null
  defaultBranch: string
  createdAt: string
  pushedAt: string | null
  isPrivate: boolean
  topics: string[]
}

export interface Contributor {
  login: string
  avatar_url: string
  html_url: string
  total: number
}

export interface RecentCommit {
  sha: string
  message: string
  sourceBranch: string | null   // branch that was merged in (null if not a merge commit)
  author: { name: string; date: string; avatar?: string; login?: string }
  html_url: string
}

export interface Release {
  tag_name: string
  name: string | null
  published_at: string | null
  html_url: string
  prerelease: boolean
}

export interface RepoPullRequest {
  open: number
  closed: number
}

export interface RepoStats {
  overview: RepoOverview
  contributors: Contributor[]        // top contributors
  languages: Record<string, number>  // lang → bytes
  pullRequests: RepoPullRequest
  openIssues: number
  closedIssues: number
  recentCommits: RecentCommit[]
  releases: Release[]
  branchCount: number
}

/**
 * Fetch comprehensive analytics for a GitHub repo.
 * Runs all API calls in parallel; individual failures return null/empty gracefully.
 */
export async function getRepoStats(
  accessToken: string,
  owner: string,
  repo: string
): Promise<RepoStats> {
  const octokit = createOctokit(accessToken)

  const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn() } catch { return fallback }
  }

  // Always normalise to array (no retry — endpoint is always ready)
  const safeArray = async (fn: () => Promise<any>): Promise<any[]> => {
    try {
      const result = await fn()
      return Array.isArray(result) ? result : []
    } catch {
      return []
    }
  }

  /**
   * safeStatsArray removed — commit activity and code frequency endpoints
   * were replaced by always-ready alternatives.
   */

  const [
    repoData,
    contributorsRaw,
    languagesRaw,
    openPRs,
    closedPRs,
    openIssuesList,
    closedIssuesList,
    recentCommitsRaw,
    releasesRaw,
    branchesRaw,
  ] = await Promise.all([
    safe(() => octokit.repos.get({ owner, repo }).then(r => r.data), null),
    // listContributors is always ready (unlike getContributorsStats which returns 202 while computing)
    safeArray(() => octokit.repos.listContributors({ owner, repo, per_page: 30 }).then(r => r.data)),
    safe(() => octokit.repos.listLanguages({ owner, repo }).then(r => r.data), {} as Record<string, number>),
    safe(() => octokit.pulls.list({ owner, repo, state: 'open', per_page: 1 }).then(r => r.headers['x-total-count'] ? parseInt(r.headers['x-total-count'] as string) : r.data.length), 0),
    safe(() => octokit.pulls.list({ owner, repo, state: 'closed', per_page: 1 }).then(r => r.headers['link'] ? -1 : r.data.length), 0),
    safe(() => octokit.issues.listForRepo({ owner, repo, state: 'open', per_page: 1 }).then(r => r.data.length), 0),
    safe(() => octokit.issues.listForRepo({ owner, repo, state: 'closed', per_page: 1 }).then(r => r.data.length), 0),
    safeArray(() => octokit.repos.listCommits({ owner, repo, sha: repoData?.default_branch ?? 'main', per_page: 50 }).then(r => r.data)),
    safeArray(() => octokit.repos.listReleases({ owner, repo, per_page: 10 }).then(r => r.data)),
    safeArray(() => octokit.repos.listBranches({ owner, repo, per_page: 100 }).then(r => r.data)),
  ])

  const overview: RepoOverview = repoData ? {
    full_name: repoData.full_name,
    description: repoData.description,
    html_url: repoData.html_url,
    homepage: repoData.homepage ?? null,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    watchers: repoData.watchers_count,
    openIssues: repoData.open_issues_count,
    size: repoData.size,
    language: repoData.language ?? null,
    defaultBranch: repoData.default_branch,
    createdAt: repoData.created_at,
    pushedAt: repoData.pushed_at ?? null,
    isPrivate: repoData.private,
    topics: repoData.topics ?? [],
  } : {
    full_name: `${owner}/${repo}`, description: null, html_url: '', homepage: null,
    stars: 0, forks: 0, watchers: 0, openIssues: 0, size: 0, language: null,
    defaultBranch: 'main', createdAt: '', pushedAt: null, isPrivate: false, topics: [],
  }

  const contributors: Contributor[] = contributorsRaw
    .filter((c: any) => c && c.login)
    .slice(0, 10)
    .map((c: any) => ({
      login: c.login,
      avatar_url: c.avatar_url ?? '',
      html_url: c.html_url ?? `https://github.com/${c.login}`,
      total: c.contributions ?? 0,
    }))

  // Parse source branch from a merge commit message.
  // Standard GitHub merge messages:
  //   "Merge pull request #N from owner/branch-name"
  //   "Merge branch 'branch-name' into main"
  //   "Merge branch 'branch-name'"
  function parseMergeBranch(msg: string): string | null {
    // PR merge: "Merge pull request #N from owner/branch-name"
    const prMatch = msg.match(/^Merge pull request #\d+ from [^/]+\/(.+)$/im)
    if (prMatch) return prMatch[1].trim()
    // Branch merge: "Merge branch 'foo' into bar" or "Merge branch 'foo'"
    const branchMatch = msg.match(/^Merge branch '([^']+)'/im)
    if (branchMatch) return branchMatch[1].trim()
    return null
  }

  // Filter to merge commits only (2+ parents) and take up to 10
  const recentCommits: RecentCommit[] = (recentCommitsRaw || [])
    .filter((c: any) => Array.isArray(c.parents) && c.parents.length >= 2)
    .slice(0, 10)
    .map((c: any) => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0],
      sourceBranch: parseMergeBranch(c.commit.message.split('\n')[0]),
      author: {
        name: c.commit.author?.name ?? 'Unknown',
        date: c.commit.author?.date ?? '',
        avatar: c.author?.avatar_url,
        login: c.author?.login,
      },
      html_url: c.html_url,
    }))

  const releases: Release[] = (releasesRaw || []).map((r: any) => ({
    tag_name: r.tag_name,
    name: r.name,
    published_at: r.published_at,
    html_url: r.html_url,
    prerelease: r.prerelease,
  }))

  return {
    overview,
    contributors,
    languages: languagesRaw as Record<string, number>,
    pullRequests: { open: openPRs, closed: closedPRs < 0 ? 0 : closedPRs },
    openIssues: openIssuesList,
    closedIssues: closedIssuesList,
    recentCommits,
    releases,
    branchCount: (branchesRaw || []).length,
  }
}
