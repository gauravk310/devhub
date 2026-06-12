'use client'

import { useState, useEffect } from 'react'
import type { IProjectWithMembers } from '@/types'
import ProjectCard from '@/components/projects/ProjectCard'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Plus, FolderKanban } from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<IProjectWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

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

  return (
    <div style={{ padding: '2rem' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-fg-default)', margin: 0, letterSpacing: '-0.02em' }}>
            Projects
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.25rem 0 0' }}>
            {loading ? '…' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="gh-btn-primary">
          <Plus size={15} />
          Create Project
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <LoadingSpinner size={28} />
        </div>
      ) : projects.length === 0 ? (
        <div className="gh-empty-state" style={{ border: '2px dashed var(--color-border-default)', borderRadius: '12px' }}>
          <FolderKanban size={48} style={{ opacity: 0.3 }} />
          <p style={{ fontWeight: 600, fontSize: '1rem' }}>No projects yet</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-subtle)' }}>
            Create your first project to start collaborating.
          </p>
          <button onClick={() => setShowCreate(true)} className="gh-btn-primary">
            <Plus size={14} /> Create Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {projects.map((p) => (
            <ProjectCard key={p._id.toString()} project={p} />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchProjects}
      />
    </div>
  )
}
