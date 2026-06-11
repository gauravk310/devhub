import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import type { NextRequest } from 'next/server'

// GET /api/users/search?q=email
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim()

  if (!q || q.length < 2) return Response.json({ data: [] })

  await dbConnect()
  const users = await User.find({
    email: { $regex: q, $options: 'i' },
    _id: { $ne: session.user.id }, // exclude self
  })
    .select('name email image githubUsername')
    .limit(10)
    .lean()

  return Response.json({ data: users })
}
