import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import { isValidObjectId } from '@/lib/utils'
import type { NextRequest } from 'next/server'

// GET /api/projects — list all projects where current user is a member
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await dbConnect()
  const projects = await Project.find({ members: session.user.id })
    .populate('ownerId', 'name email image githubUsername')
    .populate('members', 'name email image githubUsername')
    .sort({ updatedAt: -1 })
    .lean()



  return Response.json({ data: projects })
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, domain, codebases, hasQA, qaBranches } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return Response.json({ error: 'Project name is required' }, { status: 400 })
  }
  if (!codebases || !Array.isArray(codebases) || codebases.length === 0) {
    return Response.json({ error: 'At least one codebase is required' }, { status: 400 })
  }

  await dbConnect()

  let uniqueCode = ''
  let isUnique = false
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  while (!isUnique) {
    uniqueCode = ''
    for (let i = 0; i < 8; i++) {
      uniqueCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const existing = await Project.findOne({ projectId: uniqueCode })
    if (!existing) {
      isUnique = true
    }
  }

  const project = await Project.create({
    name: name.trim(),
    domain: domain?.trim() ?? '',
    projectId: uniqueCode,
    ownerId: session.user.id,
    codebases,
    hasQA: hasQA ?? false,
    qaBranches: qaBranches ?? [],
    members: [session.user.id],
  })

  const populated = await project.populate([
    { path: 'ownerId', select: 'name email image githubUsername' },
    { path: 'members', select: 'name email image githubUsername' },
  ])

  return Response.json({ data: populated }, { status: 201 })
}
