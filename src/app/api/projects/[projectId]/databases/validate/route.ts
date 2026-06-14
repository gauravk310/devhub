import { auth } from '@/lib/auth'
import { validateConnection } from '@/lib/user-mongodb-helper'
import type { NextRequest } from 'next/server'

// POST /api/projects/[projectId]/databases/validate — test connectivity to a database
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { connectionUri, databaseName } = body

    if (!connectionUri || typeof connectionUri !== 'string') {
      return Response.json({ error: 'Connection URI is required' }, { status: 400 })
    }

    const result = await validateConnection(connectionUri.trim(), databaseName)

    if (!result.success) {
      return Response.json({ 
        success: false, 
        error: result.error || 'Failed to establish connection' 
      }, { status: 400 })
    }

    return Response.json({
      success: true,
      databaseName: result.databaseName,
    })
  } catch (err) {
    return Response.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal Server Error' 
    }, { status: 500 })
  }
}
