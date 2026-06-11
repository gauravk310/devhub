import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Notification from '@/models/Notification'
import type { NextRequest } from 'next/server'

// GET /api/notifications?unread=true
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const unreadOnly = url.searchParams.get('unread') === 'true'

  await dbConnect()
  const query: Record<string, unknown> = { recipientId: session.user.id }
  if (unreadOnly) query.status = 'UNREAD'

  const notifications = await Notification.find(query)
    .populate('senderId', 'name email image githubUsername')
    .populate('projectId', 'name')
    .sort({ createdAt: -1 })
    .lean()

  return Response.json({ data: notifications })
}
