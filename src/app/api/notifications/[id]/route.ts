import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Notification from '@/models/Notification'
import Project from '@/models/Project'
import { isValidObjectId } from '@/lib/utils'
import type { NextRequest } from 'next/server'
import type { NotificationStatus } from '@/types'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES: NotificationStatus[] = ['READ', 'ACCEPTED', 'DECLINED']

// PUT /api/notifications/:id
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!isValidObjectId(id)) return Response.json({ error: 'Invalid ID' }, { status: 400 })

  const body = await req.json()
  const { status }: { status: NotificationStatus } = body

  if (!VALID_STATUSES.includes(status))
    return Response.json({ error: 'Invalid status' }, { status: 400 })

  await dbConnect()
  const notification = await Notification.findById(id)
  if (!notification) return Response.json({ error: 'Not found' }, { status: 404 })
  if (notification.recipientId.toString() !== session.user.id)
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  notification.status = status

  // Handle project invite acceptance
  if (status === 'ACCEPTED' && notification.type === 'PROJECT_INVITE' && notification.projectId) {
    const project = await Project.findById(notification.projectId)
    if (project) {
      const alreadyMember = project.members
        .map((m: { toString(): string }) => m.toString())
        .includes(session.user.id)
      if (!alreadyMember) {
        project.members.push(session.user.id as unknown as never)
        await project.save()
      }
    }
  }

  // Handle project join request acceptance
  if (status === 'ACCEPTED' && notification.type === 'PROJECT_REQUEST' && notification.projectId) {
    const project = await Project.findById(notification.projectId)
    if (project) {
      const alreadyMember = project.members
        .map((m: { toString(): string }) => m.toString())
        .includes(notification.senderId.toString())
      if (!alreadyMember) {
        project.members.push(notification.senderId as unknown as never)
        await project.save()
      }
    }
  }

  await notification.save()
  return Response.json({ data: notification })
}
