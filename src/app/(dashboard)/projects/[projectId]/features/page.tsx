'use client'

import { use, useEffect, useState } from 'react'
import type { IProjectWithMembers, IFeaturePopulated, FeatureStatus } from '@/types'
import FeaturesTable from '@/components/features/FeaturesTable'
import CreateFeatureModal from '@/components/features/CreateFeatureModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Plus } from 'lucide-react'

export default function FeaturesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const [project, setProject] = useState<IProjectWithMembers | null>(null)
  const [features, setFeatures] = useState<IFeaturePopulated[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = async () => {
    setLoading(true)
    const [p, f] = await Promise.all([
      fetch(`/api/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/features`).then((r) => r.json()),
    ])
    setProject(p.data)
    setFeatures(f.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [projectId])

  const handleStatusUpdated = (featureId: string, newStatus: FeatureStatus, deploymentDate?: Date | null) => {
    setFeatures((prev) =>
      prev.map((f) => {
        if (f._id.toString() === featureId) {
          const updated = { ...f, status: newStatus }
          if (newStatus === 'DEPLOYED') {
            updated.deploymentDate = deploymentDate || new Date()
          } else {
            updated.deploymentDate = null
          }
          return updated
        }
        return f
      })
    )
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={28} /></div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-fg-default)', margin: 0 }}>
          Features <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--color-fg-muted)', marginLeft: '0.5rem' }}>({features.length})</span>
        </h2>
        <button onClick={() => setShowCreate(true)} className="gh-btn-primary">
          <Plus size={14} /> Add Feature
        </button>
      </div>

      <FeaturesTable
        features={features}
        codebases={project?.codebases ?? []}
        projectId={projectId}
        ownerId={typeof project?.ownerId === 'object' ? project.ownerId._id?.toString() ?? '' : project?.ownerId ?? ''}
        onAddFeature={() => setShowCreate(true)}
        onStatusUpdated={handleStatusUpdated}
      />

      <CreateFeatureModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
        projectId={projectId}
        codebases={project?.codebases ?? []}
      />
    </div>
  )
}
