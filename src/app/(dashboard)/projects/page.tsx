'use client'

import { useState, useEffect } from 'react'
import type { IProjectWithMembers } from '@/types'
import ProjectCard from '@/components/projects/ProjectCard'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Plus, Folder, Search } from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<IProjectWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects')
      const json = await res.json()
      setProjects(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProjects() }, [])

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ padding: '2.5rem 3rem', background: 'transparent', minHeight: 'calc(100vh - 56px)' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.04em' }}>
            Projects
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
              placeholder="Search project"
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
              className="projects-search-input"
            />
          </div>

          {/* New Project Button */}
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
            className="new-project-btn"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
          <LoadingSpinner size={28} />
        </div>
      ) : projects.length === 0 ? (
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
          <Folder size={48} color="#6e7681" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>No Projects Yet</p>
          <p style={{ fontSize: '0.9375rem', color: '#8b949e', margin: 0 }}>
            Add your first project to get started
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
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
            No projects match &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredProjects.map((p) => (
            <ProjectCard key={p._id.toString()} project={p} />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchProjects}
      />

      <style>{`
        .projects-search-input:focus {
          border-color: #4ade80 !important;
        }
        .new-project-btn:hover {
          background-color: #22c55e !important;
        }
      `}</style>
    </div>
  )
}
