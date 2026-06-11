import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main
          style={{
            flex: 1,
            paddingTop: '56px', // topbar height
            background: 'var(--color-canvas-default)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
