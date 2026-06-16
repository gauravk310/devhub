import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Notification from '@/models/Notification'

// GET /api/projects/join-requests
// List all project join requests sent by the current user (where senderId is the current user)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbConnect()
  const requests = await Notification.find({
    senderId: session.user.id,
    type: 'PROJECT_REQUEST',
  })
    .populate('recipientId', 'name email image githubUsername')
    .populate('projectId', 'name')
    .sort({ createdAt: -1 })
    .lean()

  return Response.json({ data: requests })
}
