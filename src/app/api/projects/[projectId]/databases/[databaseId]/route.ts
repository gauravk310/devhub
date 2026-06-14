import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Database from '@/models/Database'
import { encrypt, decrypt } from '@/lib/crypto'
import { validateConnection } from '@/lib/user-mongodb-helper'
import type { NextRequest } from 'next/server'

// Helper to check ownership of a database in a project
async function getProjectDatabase(databaseId: string, projectId: string) {
  await dbConnect()
  const db = await Database.findOne({ _id: databaseId, projectId })
  return db
}

// GET /api/projects/[projectId]/databases/[databaseId] — fetch database details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; databaseId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, databaseId } = await params
  const dbRecord = await getProjectDatabase(databaseId, projectId)
  if (!dbRecord) return Response.json({ error: 'Database not found in this project' }, { status: 404 })

  return Response.json({ data: dbRecord })
}

// PATCH /api/projects/[projectId]/databases/[databaseId] — update configuration
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; databaseId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, databaseId } = await params
  const dbRecord = await getProjectDatabase(databaseId, projectId)
  if (!dbRecord) return Response.json({ error: 'Database not found in this project' }, { status: 404 })

  try {
    const body = await req.json()
    const { name, connectionUri, databaseName } = body

    if (name) {
      dbRecord.name = name.trim()
    }

    if (connectionUri) {
      // Validate the updated URI before saving
      const validation = await validateConnection(connectionUri.trim(), databaseName || dbRecord.databaseName)
      if (!validation.success) {
        return Response.json({ 
          error: `Connection validation failed: ${validation.error || 'Check your credentials'}` 
        }, { status: 400 })
      }

      dbRecord.connectionUri = encrypt(connectionUri.trim())
      dbRecord.databaseName = validation.databaseName || dbRecord.databaseName
      dbRecord.status = 'Connected'
      dbRecord.errorMessage = ''
    } else if (databaseName && databaseName !== dbRecord.databaseName) {
      // Re-validate database name with existing URI
      const decryptedUri = decrypt(dbRecord.connectionUri)
      const validation = await validateConnection(decryptedUri, databaseName)
      if (!validation.success) {
        return Response.json({ error: `Validation failed: ${validation.error}` }, { status: 400 })
      }
      dbRecord.databaseName = databaseName
    }

    dbRecord.lastChecked = new Date()
    await dbRecord.save()

    return Response.json({ data: dbRecord })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server Error' }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId]/databases/[databaseId] — delete database connection
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; databaseId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, databaseId } = await params
  const dbRecord = await getProjectDatabase(databaseId, projectId)
  if (!dbRecord) return Response.json({ error: 'Database not found in this project' }, { status: 404 })

  try {
    // 1. Delete database configuration
    await Database.deleteOne({ _id: dbRecord._id })

    return Response.json({ success: true, message: 'Database connection successfully deleted' })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server Error' }, { status: 500 })
  }
}
