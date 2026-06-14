import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Database from '@/models/Database'
import { decrypt } from '@/lib/crypto'
import { getSlowQueries } from '@/lib/user-mongodb-helper'
import type { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; databaseId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, databaseId } = await params
  
  await dbConnect()
  const dbRecord = await Database.findOne({ _id: databaseId, projectId })
  if (!dbRecord) return Response.json({ error: 'Database not found' }, { status: 404 })

  try {
    const decryptedUri = decrypt(dbRecord.connectionUri)
    const queryMetrics = await getSlowQueries(decryptedUri, dbRecord.databaseName)

    return Response.json({ data: queryMetrics })
  } catch (err) {
    return Response.json({ 
      error: 'Failed to fetch slow query logs', 
      details: err instanceof Error ? err.message : String(err) 
    }, { status: 500 })
  }
}
