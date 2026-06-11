import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import Feature from '@/models/Feature'
import { isValidObjectId } from '@/lib/utils'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ projectId: string }> }

// GET /api/projects/:id
export async function GET(_: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  if (!isValidObjectId(projectId)) return Response.json({ error: 'Invalid project ID' }, { status: 400 })

  await dbConnect()
  const project = await Project.findById(projectId)
    .populate('ownerId', 'name email image githubUsername')
    .populate('members', 'name email image githubUsername')
    .lean()

  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const isMember = project.members.some(
    (m: { _id: { toString(): string } } | string) =>
      (typeof m === 'object' ? m._id.toString() : m.toString()) === session.user!.id
  )
  if (!isMember) return Response.json({ error: 'Forbidden' }, { status: 403 })

  return Response.json({ data: project })
}

// PUT /api/projects/:id
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  if (!isValidObjectId(projectId)) return Response.json({ error: 'Invalid project ID' }, { status: 400 })

  await dbConnect()
  const project = await Project.findById(projectId)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (project.ownerId.toString() !== session.user.id)
    return Response.json({ error: 'Forbidden — owner only' }, { status: 403 })

  const body = await req.json()
  const { name, domain, hasQA, qaBranches, codebases } = body

  if (name) project.name = name.trim()
  if (domain !== undefined) project.domain = domain.trim()
  if (hasQA !== undefined) project.hasQA = hasQA
  if (qaBranches) project.qaBranches = qaBranches
  if (codebases) project.codebases = codebases

  await project.save()
  return Response.json({ data: project })
}

// DELETE /api/projects/:id
export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  if (!isValidObjectId(projectId)) return Response.json({ error: 'Invalid project ID' }, { status: 400 })

  await dbConnect()
  const project = await Project.findById(projectId)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (project.ownerId.toString() !== session.user.id)
    return Response.json({ error: 'Forbidden — owner only' }, { status: 403 })

  await Promise.all([project.deleteOne(), Feature.deleteMany({ projectId })])
  return Response.json({ data: { deleted: true } })
}
