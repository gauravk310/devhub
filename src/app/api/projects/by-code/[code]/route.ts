import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import Notification from '@/models/Notification'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ code: string }> }

export async function GET(req: NextRequest, { params }: Params) {
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
    .populate('ownerId', 'name email image githubUsername')
    .lean()

  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  const owner = project.ownerId as any
  const isOwner = owner._id.toString() === session.user.id
  const isMember = project.members.map((m: any) => m.toString()).includes(session.user.id)

  const existingRequest = await Notification.findOne({
    projectId: project._id,
    senderId: session.user.id,
    recipientId: owner._id,
    type: 'PROJECT_REQUEST',
    status: 'UNREAD',
  })

  return Response.json({
    data: {
      projectId: project._id.toString(),
      name: project.name,
      owner: {
        name: owner.name,
        email: owner.email,
        image: owner.image,
        githubUsername: owner.githubUsername,
      },
      isOwner,
      isMember,
      alreadyRequested: !!existingRequest,
    }
  })
}
