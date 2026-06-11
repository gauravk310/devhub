import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import Feature from '@/models/Feature'
import { isValidObjectId } from '@/lib/utils'
import type { NextRequest } from 'next/server'
import type { FeatureStatus } from '@/types'

type Params = { params: Promise<{ projectId: string; featureId: string }> }

const VALID_STATUSES: FeatureStatus[] = ['PENDING', 'READY', 'TESTING', 'DEPLOYED', 'DISCARD']

// PUT /api/projects/:id/features/:fid
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, featureId } = await params
  if (!isValidObjectId(projectId) || !isValidObjectId(featureId))
    return Response.json({ error: 'Invalid ID' }, { status: 400 })

  await dbConnect()
  const project = await Project.findById(projectId)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const isMember = project.members.map((m: { toString(): string }) => m.toString()).includes(session.user.id)
  if (!isMember) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const feature = await Feature.findOne({ _id: featureId, projectId })
  if (!feature) return Response.json({ error: 'Feature not found' }, { status: 404 })

  const body = await req.json()
  const { name, description, codebaseBranches, dbChange, envChange, status, deploymentDate } = body

  if (name !== undefined) feature.name = name.trim()
  if (description !== undefined) feature.description = description.trim()
  if (codebaseBranches !== undefined) feature.codebaseBranches = codebaseBranches
  if (dbChange !== undefined) feature.dbChange = dbChange.trim()
  if (envChange !== undefined) feature.envChange = envChange.trim()
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status))
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    feature.status = status
  }
  if (deploymentDate !== undefined)
    feature.deploymentDate = deploymentDate ? new Date(deploymentDate) : null

  await feature.save()
  const populated = await feature.populate('authorId', 'name email image githubUsername')
  return Response.json({ data: populated })
}

// DELETE /api/projects/:id/features/:fid — owner only
export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, featureId } = await params
  if (!isValidObjectId(projectId) || !isValidObjectId(featureId))
    return Response.json({ error: 'Invalid ID' }, { status: 400 })

  await dbConnect()
  const project = await Project.findById(projectId)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (project.ownerId.toString() !== session.user.id)
    return Response.json({ error: 'Forbidden — owner only' }, { status: 403 })

  await Feature.findOneAndDelete({ _id: featureId, projectId })
  return Response.json({ data: { deleted: true } })
}
