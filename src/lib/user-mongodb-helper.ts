import { MongoClient } from 'mongodb'

// Parse database name from the connection URI
export function parseDatabaseName(uri: string): string {
  try {
    const urlWithoutParams = uri.split('?')[0]
    const parts = urlWithoutParams.split('/')
    const dbName = parts[parts.length - 1]
    if (
      dbName &&
      !dbName.includes(':') &&
      !dbName.includes('@') &&
      dbName !== 'mongodb:' &&
      dbName !== 'mongodb+srv:'
    ) {
      return dbName
    }
  } catch (e) {
    // Ignore error and return default
  }
  return ''
}

/**
 * Dynamically resolves target database if it defaults to admin/local/config.
 * Finds the first user-created database in the cluster to retrieve metrics from.
 */
async function resolveTargetDbName(client: MongoClient, dbName: string): Promise<string> {
  let targetDbName = dbName.trim()
  if (targetDbName === 'admin' || targetDbName === 'local' || targetDbName === 'config' || !targetDbName) {
    try {
      const admin = client.db().admin()
      const dbsList = await admin.listDatabases()
      const userDb = dbsList.databases.find(
        (d: any) => d.name !== 'admin' && d.name !== 'local' && d.name !== 'config'
      )
      if (userDb) {
        targetDbName = userDb.name
      }
    } catch (e) {
      // Fallback to original if listing databases throws due to credentials restrictions
    }
  }
  return targetDbName
}

/**
 * Validates a connection URI.
 * Connects to the database and pings it. Returns database metadata.
 */
export async function validateConnection(
  uri: string,
  customDbName?: string
): Promise<{ success: boolean; databaseName: string; error?: string }> {
  let client: MongoClient | null = null
  try {
    let resolvedDbName = customDbName?.trim() || parseDatabaseName(uri) || 'admin'
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    })

    await client.connect()
    
    // Proactively list databases to find a user database if resolvedDbName is a system database
    resolvedDbName = await resolveTargetDbName(client, resolvedDbName)

    const db = client.db(resolvedDbName)
    
    // Ping database
    await db.command({ ping: 1 })

    return {
      success: true,
      databaseName: resolvedDbName,
    }
  } catch (err) {
    return {
      success: false,
      databaseName: customDbName || '',
      error: err instanceof Error ? err.message : String(err),
    }
  } finally {
    if (client) {
      await client.close().catch(() => {})
    }
  }
}

/**
 * Fetches database-wide stats and server status parameters.
 */
export async function getDatabaseMetrics(uri: string, dbName: string) {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  })

  try {
    await client.connect()
    
    // Dynamically resolve target database name (e.g. if it defaults to admin)
    const targetDbName = await resolveTargetDbName(client, dbName)
    const db = client.db(targetDbName)
    const admin = client.db().admin()

    // 1. Database level stats
    let dbStats: any = {}
    try {
      dbStats = await db.command({ dbStats: 1 })
    } catch (e) {
      // Fallback in case of restricted command
      dbStats = {
        collections: 0,
        objects: 0,
        dataSize: 0,
        storageSize: 0,
        indexSize: 0,
      }
    }

    // 2. Server status (connections, operations)
    let serverStatus: any = null
    try {
      serverStatus = await admin.command({ serverStatus: 1 })
    } catch (e) {
      // Free clusters / non-admin users might restrict serverStatus
    }

    // 3. Collection statistics
    const collectionsList = await db.listCollections().toArray()
    const collectionsStats: any[] = []

    for (const coll of collectionsList) {
      const name = coll.name
      if (name.startsWith('system.')) continue // Skip system collections

      let cStats: any = { ns: `${targetDbName}.${name}`, count: 0, size: 0, storageSize: 0, nindexes: 0, totalIndexSize: 0 }
      
      try {
        // Try collStats command
        cStats = await db.command({ collStats: name })
      } catch (e) {
        try {
          // Fallback to $collStats aggregation stage (works on Atlas Serverless / newer versions)
          const aggResult = await db.collection(name).aggregate([{ $collStats: { storageStats: {} } }]).next()
          if (aggResult && aggResult.storageStats) {
            cStats = {
              ns: `${targetDbName}.${name}`,
              count: aggResult.storageStats.count ?? 0,
              size: aggResult.storageStats.size ?? 0,
              storageSize: aggResult.storageStats.storageSize ?? 0,
              nindexes: aggResult.storageStats.nindexes ?? 0,
              totalIndexSize: aggResult.storageStats.totalIndexSize ?? 0,
            }
          }
        } catch (err) {
          // Fallback if aggregation also fails
        }
      }

      // Query index details for this collection
      let indexes: any[] = []
      try {
        indexes = await db.collection(name).listIndexes().toArray()
      } catch (e) {}

      // Get index usage metrics via $indexStats
      let indexStats: any[] = []
      try {
        indexStats = await db.collection(name).aggregate([{ $indexStats: {} }]).toArray()
      } catch (e) {}

      collectionsStats.push({
        name,
        count: cStats.count ?? 0,
        size: cStats.size ?? 0,
        storageSize: cStats.storageSize ?? 0,
        indexCount: cStats.nindexes ?? indexes.length ?? 0,
        indexSize: cStats.totalIndexSize ?? 0,
        avgObjSize: cStats.avgObjSize ?? (cStats.count > 0 ? Math.round(cStats.size / cStats.count) : 0),
        indexes: indexes.map((idx) => {
          const usageInfo = indexStats.find((is) => is.name === idx.name)
          return {
            name: idx.name,
            key: idx.key,
            unique: !!idx.unique,
            usageCount: usageInfo?.accesses?.ops ?? 0,
            lastUsed: usageInfo?.accesses?.since ?? null,
          }
        }),
      })
    }

    // 4. Replica Set Status
    let replicationStatus: any = null
    try {
      replicationStatus = await admin.command({ replSetGetStatus: 1 })
    } catch (e) {
      // Single node clusters / MongoDB standalone will fail this, ignore
    }

    // 5. Build output payload
    const totalDocs = collectionsStats.reduce((sum, c) => sum + c.count, 0)
    const totalIndexes = collectionsStats.reduce((sum, c) => sum + c.indexCount, 0)
    const totalIndexSize = collectionsStats.reduce((sum, c) => sum + c.indexSize, 0)
    const totalStorageSize = dbStats.storageSize || collectionsStats.reduce((sum, c) => sum + c.storageSize, 0)
    const totalDataSize = dbStats.dataSize || collectionsStats.reduce((sum, c) => sum + c.size, 0)

    const uptime = serverStatus?.uptime ?? 0
    const activeConnections = serverStatus?.connections?.current ?? 1
    const maxConnections = serverStatus?.connections?.available 
      ? serverStatus.connections.current + serverStatus.connections.available 
      : 100
    const connectionUtilization = Math.round((activeConnections / maxConnections) * 100)

    const opcounters = serverStatus?.opcounters ?? {
      insert: 0,
      query: 0,
      update: 0,
      delete: 0,
      getmore: 0,
      command: 0,
    }

    return {
      databaseName: targetDbName,
      dbStats: {
        collectionsCount: collectionsList.filter(c => !c.name.startsWith('system.')).length,
        totalDocuments: totalDocs,
        totalStorageSize,
        totalDataSize,
        totalIndexSize,
        totalIndexes,
      },
      health: {
        uptime,
        activeConnections,
        maxConnections,
        connectionUtilization,
        replicationStatus: replicationStatus ? {
          setName: replicationStatus.set,
          isReplicaSet: true,
          members: replicationStatus.members.map((m: any) => ({
            name: m.name,
            stateStr: m.stateStr,
            health: m.health,
            uptime: m.uptime,
            optimeDate: m.optimeDate,
          })),
        } : { isReplicaSet: false },
      },
      opcounters,
      collections: collectionsStats,
    }
  } finally {
    await client.close().catch(() => {})
  }
}

/**
 * Queries the database profiler logs (system.profile) for slow query execution histories.
 */
export async function getSlowQueries(uri: string, dbName: string) {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  })

  try {
    await client.connect()
    
    // Dynamically resolve target database name
    const targetDbName = await resolveTargetDbName(client, dbName)
    const db = client.db(targetDbName)

    // Check if profiling level is enabled
    let profilingLevel = 0
    let isProfilingEnabled = false
    try {
      const profilingResult = await db.command({ profile: -1 })
      profilingLevel = profilingResult.was ?? 0
      isProfilingEnabled = profilingLevel > 0
    } catch (e) {}

    // Check if system.profile collection exists and list slow queries
    let slowQueries: any[] = []
    try {
      const collections = await db.listCollections({ name: 'system.profile' }).toArray()
      if (collections.length > 0) {
        slowQueries = await db
          .collection('system.profile')
          .find({})
          .sort({ ts: -1 })
          .limit(100)
          .toArray()
      }
    } catch (e) {}

    const formattedQueries = slowQueries.map((q) => {
      // Determine what index was used
      let indexUsed = 'COLLSCAN'
      if (q.planSummary) {
        if (q.planSummary.includes('IXSCAN')) {
          const match = q.planSummary.match(/IXSCAN\s*\{(.*?)\}/)
          indexUsed = match ? `Index: {${match[1]}}` : 'Index Scan'
        } else if (q.planSummary.includes('IDHACK')) {
          indexUsed = 'Index Scan: {_id: 1}'
        }
      }

      // Standardize execution query pattern (e.g. query shape)
      let queryPattern = '{}'
      if (q.query || q.command) {
        const target = q.query || q.command
        const safeTarget = { ...target }
        // Remove values to show shape
        for (const k of Object.keys(safeTarget)) {
          if (k === 'query' && typeof safeTarget[k] === 'object') {
            safeTarget[k] = Object.keys(safeTarget[k]).reduce((acc: any, key) => {
              acc[key] = '?'
              return acc
            }, {})
          } else if (!['find', 'filter', 'aggregate', 'pipeline', 'count', 'update', 'delete'].includes(k)) {
            delete safeTarget[k]
          }
        }
        queryPattern = JSON.stringify(safeTarget)
      }

      return {
        op: q.op ?? 'query',
        collection: q.ns ? q.ns.replace(`${targetDbName}.`, '') : 'unknown',
        execTimeMs: q.millis ?? 0,
        docsExamined: q.nexamined ?? 0,
        docsReturned: q.nreturned ?? 0,
        indexUsed,
        queryPattern,
        timestamp: q.ts ?? new Date(),
      }
    })

    return {
      isProfilingEnabled,
      profilingLevel,
      slowQueries: formattedQueries,
    }
  } finally {
    await client.close().catch(() => {})
  }
}
