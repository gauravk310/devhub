import { auth } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Database from '@/models/Database'
import { decrypt } from '@/lib/crypto'
import { getDatabaseMetrics } from '@/lib/user-mongodb-helper'
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
    const metrics = await getDatabaseMetrics(decryptedUri, dbRecord.databaseName)

    let recordUpdated = false
    if (metrics.databaseName && metrics.databaseName !== dbRecord.databaseName) {
      dbRecord.databaseName = metrics.databaseName
      recordUpdated = true
    }

    if (dbRecord.status !== 'Connected' || recordUpdated) {
      dbRecord.status = 'Connected'
      dbRecord.errorMessage = ''
      dbRecord.lastChecked = new Date()
      await dbRecord.save()
    }

    return Response.json({ data: metrics })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    dbRecord.status = 'Error'
    dbRecord.errorMessage = errMsg
    dbRecord.lastChecked = new Date()
    await dbRecord.save()

    return Response.json({ 
      error: 'Failed to fetch database metrics', 
      details: errMsg 
    }, { status: 500 })
  }
}
