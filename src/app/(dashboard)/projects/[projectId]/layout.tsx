'use client'

import React from 'react'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ padding: '2.5rem 3rem', minHeight: 'calc(100vh - 56px)' }}>
      {children}
    </div>
  )
}
