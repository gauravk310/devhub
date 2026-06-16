'use client'

import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { ShieldAlert } from 'lucide-react'

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [deactivated, setDeactivated] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error === 'Project is deactivated' || j.status === 'DEACTIVATED') {
          setDeactivated(true)
        } else if (j.data) {
          const project = j.data
          const isOwner = typeof project.ownerId === 'object'
            ? project.ownerId._id?.toString() === session?.user?.id
            : project.ownerId.toString() === session?.user?.id
          
          if (project.status === 'DEACTIVATED' && !isOwner) {
            setDeactivated(true)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId, session?.user?.id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <LoadingSpinner size={28} />
      </div>
    )
  }

  if (deactivated) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 120px)',
        gap: '1rem',
        padding: '2rem',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        <ShieldAlert size={48} color="var(--color-danger-fg)" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Project Deactivated</h2>
        <p style={{ color: 'var(--color-fg-muted)', fontSize: '0.875rem', textAlign: 'center', maxWidth: '400px', margin: 0 }}>
          This project has been deactivated by the owner. Members cannot access project resources while it is deactivated.
        </p>
        <button onClick={() => router.push('/projects')} className="gh-btn-secondary" style={{ marginTop: '0.5rem' }}>
          Go Back to Projects
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2.5rem 3rem', minHeight: 'calc(100vh - 56px)' }}>
      {children}
    </div>
  )
}
