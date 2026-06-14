'use client'

import { useState, useEffect, use } from 'react'
import DatabaseCard from '@/components/databases/DatabaseCard'
import CreateDatabaseModal from '@/components/databases/CreateDatabaseModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Plus, Database, Search } from 'lucide-react'

export default function ProjectDatabasesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const [databases, setDatabases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchDatabases = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/databases`)
      const json = await res.json()
      setDatabases(json.data ?? [])
    } catch (e) {
      console.error('Failed to load databases:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchDatabases()
    }
  }, [projectId])

  const filteredDatabases = databases.filter((db) =>
    db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    db.databaseName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ padding: '2.5rem 3rem', background: 'transparent', minHeight: 'calc(100vh - 56px)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.04em' }}>
            Databases
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6e7681', display: 'flex', alignItems: 'center' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 1rem 0.5rem 2.25rem',
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: '1px solid #27272a',
                background: '#161616',
                color: '#ffffff',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              className="databases-search-input"
            />
          </div>

          {/* Connect Database Button */}
          <button 
            onClick={() => setShowCreate(true)} 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              background: '#4ade80',
              color: '#09090b',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            className="new-db-btn"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Connect Database</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
          <LoadingSpinner size={28} />
        </div>
      ) : databases.length === 0 ? (
        <div 
          style={{ 
            background: '#161616', 
            border: '1px solid #27272a', 
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5rem 2rem',
            textAlign: 'center',
            gap: '0.75rem',
          }}
        >
          <Database size={48} color="#6e7681" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>No Connected Databases</p>
          <p style={{ fontSize: '0.9375rem', color: '#8b949e', margin: 0 }}>
            Connect your first MongoDB database to this project to start monitoring stats and query profiles.
          </p>
        </div>
      ) : filteredDatabases.length === 0 ? (
        <div 
          style={{ 
            background: '#161616', 
            border: '1px solid #27272a', 
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5rem 2rem',
            textAlign: 'center',
            gap: '0.5rem',
          }}
        >
          <Search size={48} color="#6e7681" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>No matches found</p>
          <p style={{ fontSize: '0.9375rem', color: '#8b949e', margin: 0 }}>
            No databases match &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredDatabases.map((db) => (
            <DatabaseCard key={db._id.toString()} database={db} projectId={projectId} />
          ))}
        </div>
      )}

      {/* Create Database Wizard */}
      <CreateDatabaseModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchDatabases}
        projectId={projectId}
      />

      <style>{`
        .databases-search-input:focus {
          border-color: #4ade80 !important;
        }
        .new-db-btn:hover {
          background-color: #22c55e !important;
        }
      `}</style>
    </div>
  )
}
