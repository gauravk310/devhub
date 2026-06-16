import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import Notification from '@/models/Notification'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ code: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await params
  if (!code || typeof code !== 'string') {
    return Response.json({ error: 'Invalid project ID' }, { status: 400 })
  }

  await dbConnect()
  const projectCode = code.toUpperCase().trim()
  const project = await Project.findOne({ projectId: projectCode })

  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  const isOwner = project.ownerId.toString() === session.user.id
  if (isOwner) {
    return Response.json({ error: 'You are the owner of this project' }, { status: 400 })
  }

  const isMember = project.members.map((m: any) => m.toString()).includes(session.user.id)
  if (isMember) {
    return Response.json({ error: 'You are already a member of this project' }, { status: 400 })
  }

  const existingRequest = await Notification.findOne({
    projectId: project._id,
    senderId: session.user.id,
    recipientId: project.ownerId,
    type: 'PROJECT_REQUEST',
    status: 'UNREAD',
  })
  if (existingRequest) {
    return Response.json({ error: 'Join request already sent and pending' }, { status: 400 })
  }

  const notification = await Notification.create({
    recipientId: project.ownerId,
    senderId: session.user.id,
    type: 'PROJECT_REQUEST',
    projectId: project._id,
    title: `Join Request: ${session.user.name}`,
    message: `${session.user.name} has requested to join your project "${project.name}".`,
    status: 'UNREAD',
  })

  return Response.json({ data: notification }, { status: 201 })
}
