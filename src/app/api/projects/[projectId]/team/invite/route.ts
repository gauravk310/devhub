import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { isValidObjectId } from '@/lib/utils'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ projectId: string }> }

// POST /api/projects/:id/team/invite
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  if (!isValidObjectId(projectId)) return Response.json({ error: 'Invalid ID' }, { status: 400 })

  const body = await req.json()
  const { recipientEmail } = body
  if (!recipientEmail) return Response.json({ error: 'recipientEmail is required' }, { status: 400 })

  await dbConnect()
  const project = await Project.findById(projectId)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (project.ownerId.toString() !== session.user.id)
    return Response.json({ error: 'Forbidden — owner only' }, { status: 403 })

  const recipient = await User.findOne({ email: recipientEmail.toLowerCase().trim() })
  if (!recipient) return Response.json({ error: 'User not found' }, { status: 404 })

  // Already a member?
  if (project.members.map((m: { toString(): string }) => m.toString()).includes(recipient._id.toString()))
    return Response.json({ error: 'User is already a member' }, { status: 409 })

  // Already invited (pending)?
  const existing = await Notification.findOne({
    recipientId: recipient._id,
    projectId,
    type: 'PROJECT_INVITE',
    status: 'UNREAD',
  })
  if (existing) return Response.json({ error: 'Invite already sent' }, { status: 409 })

  const notification = await Notification.create({
    recipientId: recipient._id,
    senderId: session.user.id,
    type: 'PROJECT_INVITE',
    projectId,
    title: `You're invited to join "${project.name}"`,
    message: `${session.user.name} has invited you to collaborate on the project "${project.name}". Accept to join the team.`,
    status: 'UNREAD',
  })

  return Response.json({ data: notification }, { status: 201 })
}

// DELETE /api/projects/:id/team/invite
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  const url = new URL(req.url)
  const inviteId = url.searchParams.get('id')

  if (!isValidObjectId(projectId) || !inviteId || !isValidObjectId(inviteId))
    return Response.json({ error: 'Invalid ID' }, { status: 400 })

  await dbConnect()
  const project = await Project.findById(projectId)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (project.ownerId.toString() !== session.user.id)
    return Response.json({ error: 'Forbidden — owner only' }, { status: 403 })

  await Notification.findOneAndDelete({ _id: inviteId, projectId, type: 'PROJECT_INVITE' })
  return Response.json({ data: { deleted: true } })
}
