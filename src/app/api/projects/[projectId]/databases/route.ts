import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Database from '@/models/Database'
import { encrypt } from '@/lib/crypto'
import { validateConnection } from '@/lib/user-mongodb-helper'
import type { NextRequest } from 'next/server'

// GET /api/projects/[projectId]/databases — list all databases connected to this project
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await params

  await dbConnect()
  const databases = await Database.find({ projectId })
    .sort({ createdAt: -1 })
    .lean()

  return Response.json({ data: databases })
}

// POST /api/projects/[projectId]/databases — connect a new database to this project
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await params

  try {
    const body = await req.json()
    const { name, type, connectionUri, databaseName } = body

    // 1. Validation checks
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ error: 'Display Name is required' }, { status: 400 })
    }
    if (type && type !== 'mongodb') {
      return Response.json({ error: 'Database type must be "mongodb"' }, { status: 400 })
    }
    if (!connectionUri || typeof connectionUri !== 'string') {
      return Response.json({ error: 'Connection URI is required' }, { status: 400 })
    }

    // 2. Validate connection on remote server
    const validation = await validateConnection(connectionUri.trim(), databaseName)
    if (!validation.success) {
      return Response.json({ 
        error: `Connection validation failed: ${validation.error || 'Check your URI and network settings'}` 
      }, { status: 400 })
    }

    // 3. Encrypt URI and save database connection
    await dbConnect()
    const encryptedUri = encrypt(connectionUri.trim())

    const dbRecord = await Database.create({
      name: name.trim(),
      type: 'mongodb',
      connectionUri: encryptedUri,
      databaseName: validation.databaseName || 'admin',
      ownerId: session.user.id,
      projectId,
      status: 'Connected',
      lastChecked: new Date(),
    })

    return Response.json({ data: dbRecord }, { status: 201 })
  } catch (err) {
    return Response.json({ 
      error: err instanceof Error ? err.message : 'Internal Server Error' 
    }, { status: 500 })
  }
}
