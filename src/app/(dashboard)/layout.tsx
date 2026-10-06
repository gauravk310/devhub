'use client'

import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <Topbar />
      <main
        style={{
          flex: 1,
          paddingTop: '56px', // topbar height
          background: 'transparent',
          width: '100%',
        }}
      >
        {children}
      </main>
    </div>
  )
}

