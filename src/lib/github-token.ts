import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Project from '@/models/Project'
import { Octokit } from '@octokit/rest'
import mongoose from 'mongoose'

export interface TokenOptions {
  userId: string
  owner: string
  repo: string
  projectId?: string | null
}

/**
 * Retrieves valid candidate GitHub access tokens for a given repository and user context.
 * If the user is a member or owner of a project that includes the repo, candidate tokens
 * include the repo owner user (if registered on DevHub), the project owner, the current user,
 * and other project members.
 */
export async function getCandidateGitHubTokens({
  userId,
  owner,
  repo,
  projectId,
}: TokenOptions): Promise<string[]> {
  await dbConnect()

  const repoFullName = `${owner}/${repo}`
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId

  // 1. Fetch current user
  const currentUser = await User.findById(userId).select('githubAccessToken githubUsername')

  // 2. Check if repo belongs to a project where current user is member or owner
  let project = null
  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
    project = await Project.findOne({
      _id: projectId,
      $or: [{ ownerId: userObjectId }, { members: userObjectId }],
    })
  }

  if (!project) {
    project = await Project.findOne({
      'codebases.repoFullName': { $regex: new RegExp(`^${repoFullName}$`, 'i') },
      $or: [{ ownerId: userObjectId }, { members: userObjectId }],
    })
  }

  const tokenList: string[] = []
  const seenTokens = new Set<string>()

  const addToken = (token?: string | null) => {
    if (token && typeof token === 'string' && token.trim()) {
      const trimmed = token.trim()
      if (!seenTokens.has(trimmed)) {
        seenTokens.add(trimmed)
        tokenList.push(trimmed)
      }
    }
  }

  // If the current user is the repo owner by username, prioritize their token
  const isRepoOwner = currentUser?.githubUsername?.toLowerCase() === owner.toLowerCase()
  if (isRepoOwner) {
    addToken(currentUser?.githubAccessToken)
  }

  // If associated project exists
  if (project) {
    // Priority: User on DevHub matching GitHub owner username
    const repoOwnerUser = await User.findOne({
      githubUsername: { $regex: new RegExp(`^${owner}$`, 'i') },
      githubAccessToken: { $exists: true, $ne: '' },
    }).select('githubAccessToken')

    if (repoOwnerUser?.githubAccessToken) {
      addToken(repoOwnerUser.githubAccessToken)
    }

    // Priority: Project owner token
    if (project.ownerId) {
      const projectOwner = await User.findById(project.ownerId).select('githubAccessToken')
      if (projectOwner?.githubAccessToken) {
        addToken(projectOwner.githubAccessToken)
      }
    }

    // Current user's token (if not already added)
    addToken(currentUser?.githubAccessToken)

    // Other project members
    if (Array.isArray(project.members) && project.members.length > 0) {
      const memberUsers = await User.find({
        _id: { $in: project.members },
        githubAccessToken: { $exists: true, $ne: '' },
      }).select('githubAccessToken')

      for (const m of memberUsers) {
        addToken(m.githubAccessToken)
      }
    }
  } else {
    // If no project found, add current user's token
    addToken(currentUser?.githubAccessToken)

    // Check if any user on DevHub is the repo owner
    const repoOwnerUser = await User.findOne({
      githubUsername: { $regex: new RegExp(`^${owner}$`, 'i') },
      githubAccessToken: { $exists: true, $ne: '' },
    }).select('githubAccessToken')

    if (repoOwnerUser?.githubAccessToken) {
      addToken(repoOwnerUser.githubAccessToken)
    }
  }

  return tokenList
}

/**
 * Returns the first valid GitHub access token that can successfully access the repo.
 */
export async function getValidGitHubToken(options: TokenOptions): Promise<string | null> {
  const candidateTokens = await getCandidateGitHubTokens(options)
  if (candidateTokens.length === 0) return null

  const { owner, repo } = options

  for (const token of candidateTokens) {
    try {
      const octokit = new Octokit({ auth: token })
      await octokit.repos.get({ owner, repo })
      return token
    } catch {
      // Token doesn't have access or is invalid, try next
      continue
    }
  }

  return candidateTokens[0] || null
}
