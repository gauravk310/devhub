import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import Feature from '@/models/Feature'
import { isValidObjectId } from '@/lib/utils'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ projectId: string }> }

async function assertMember(projectId: string, userId: string) {
  const project = await Project.findById(projectId)
  if (!project) return { error: 'Not found', status: 404, project: null }
  const isMember = project.members.map((m: { toString(): string }) => m.toString()).includes(userId)
  if (!isMember) return { error: 'Forbidden', status: 403, project: null }
  return { error: null, status: 200, project }
}

// GET /api/projects/:id/features
export async function GET(_: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  if (!isValidObjectId(projectId)) return Response.json({ error: 'Invalid ID' }, { status: 400 })

  await dbConnect()
  const { error, status } = await assertMember(projectId, session.user.id)
  if (error) return Response.json({ error }, { status })

  const features = await Feature.find({ projectId })
    .populate('authorId', 'name email image githubUsername')
    .sort({ createdAt: -1 })
    .lean()

  return Response.json({ data: features })
}

// POST /api/projects/:id/features
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  if (!isValidObjectId(projectId)) return Response.json({ error: 'Invalid ID' }, { status: 400 })

  await dbConnect()
  const { error, status } = await assertMember(projectId, session.user.id)
  if (error) return Response.json({ error }, { status })

  const body = await req.json()
  const { name, description, codebaseBranches, dbChange, envChange, type, deploymentDate } = body

  if (!name?.trim()) return Response.json({ error: 'Feature name is required' }, { status: 400 })

  const feature = await Feature.create({
    projectId,
    name: name.trim(),
    description: description?.trim() ?? '',
    authorId: session.user.id,
    codebaseBranches: codebaseBranches ?? [],
    dbChange: dbChange?.trim() ?? '',
    envChange: envChange?.trim() ?? '',
    status: 'PENDING',
    type: type || 'FEATURE',
    deploymentDate: deploymentDate ? new Date(deploymentDate) : null,
  })

  const populated = await feature.populate('authorId', 'name email image githubUsername')
  return Response.json({ data: populated }, { status: 201 })
}
