'use client'

import { use, useEffect, useState } from 'react'
import type { IProjectWithMembers, IFeaturePopulated, FeatureStatus } from '@/types'
import FeaturesTable from '@/components/features/FeaturesTable'
import CreateFeatureModal from '@/components/features/CreateFeatureModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import SwalConfirm from '@/components/ui/SwalConfirm'
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

  const handleStatusUpdated = (featureId: string, newStatus: FeatureStatus) => {
    setFeatures((prev) =>
      prev.map((f) => (f._id.toString() === featureId ? { ...f, status: newStatus } : f))
    )
  }

  const [featureToDelete, setFeatureToDelete] = useState<string | null>(null)

  const handleDelete = (featureId: string) => {
    setFeatureToDelete(featureId)
  }

  const confirmDelete = async () => {
    if (!featureToDelete) return
    await fetch(`/api/projects/${projectId}/features/${featureToDelete}`, { method: 'DELETE' })
    setFeatures((prev) => prev.filter((f) => f._id.toString() !== featureToDelete))
    setFeatureToDelete(null)
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
        onDelete={handleDelete}
      />

      <CreateFeatureModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
        projectId={projectId}
        codebases={project?.codebases ?? []}
      />

      <SwalConfirm
        isOpen={!!featureToDelete}
        onClose={() => setFeatureToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this feature?"
        message="This action cannot be undone. This feature will be permanently removed from the project."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
