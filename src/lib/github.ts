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
