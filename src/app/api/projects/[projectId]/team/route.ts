import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import User from '@/models/User'
import { isValidObjectId } from '@/lib/utils'
import type { NextRequest } from 'next/server'

import Notification from '@/models/Notification'

type Params = { params: Promise<{ projectId: string }> }

// GET /api/projects/:id/team
export async function GET(_: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  if (!isValidObjectId(projectId)) return Response.json({ error: 'Invalid ID' }, { status: 400 })

  await dbConnect()
  const project = await Project.findById(projectId)
    .populate('members', 'name email image githubUsername createdAt')
    .lean()

  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const isMember = project.members.some(
    (m: { _id: { toString(): string } }) => m._id.toString() === session.user!.id
  )
  if (!isMember) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const members = project.members.map((m: { _id: { toString(): string } } & Record<string, unknown>) => ({
    ...m,
    role: m._id.toString() === project.ownerId.toString() ? 'Owner' : 'Member',
  }))

  const invites = await Notification.find({
    projectId,
    type: 'PROJECT_INVITE',
    status: 'UNREAD',
  })
    .populate('recipientId', 'name email image githubUsername')
    .lean()

  const formattedInvites = invites.map((inv: any) => ({
    _id: inv._id.toString(),
    recipient: inv.recipientId,
    createdAt: inv.createdAt,
  }))

  return Response.json({ data: members, ownerId: project.ownerId.toString(), invites: formattedInvites })
}

// DELETE /api/projects/:id/team/:uid handled in separate route — 
// This DELETE removes a member by uid query param (owner only)
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  const url = new URL(req.url)
  const uid = url.searchParams.get('uid')

  if (!isValidObjectId(projectId) || !uid || !isValidObjectId(uid))
    return Response.json({ error: 'Invalid ID' }, { status: 400 })

  await dbConnect()
  const project = await Project.findById(projectId)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (project.ownerId.toString() !== session.user.id)
    return Response.json({ error: 'Forbidden — owner only' }, { status: 403 })
  if (uid === session.user.id)
    return Response.json({ error: 'Cannot remove yourself as owner' }, { status: 400 })

  project.members = project.members.filter(
    (m: { toString(): string }) => m.toString() !== uid
  )
  await project.save()
  return Response.json({ data: { removed: uid } })
}
