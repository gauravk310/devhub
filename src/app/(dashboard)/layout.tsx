'use client'

import Topbar from '@/components/layout/Topbar'
import Footer from '@/components/layout/Footer'

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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  )
}

