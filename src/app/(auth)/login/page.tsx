import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { GitBranch } from 'lucide-react'
import { signIn } from '@/lib/auth'

export const metadata = { title: 'Sign In — DevHub' }

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/projects')

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-canvas-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, #30363d 1px, transparent 0)', backgroundSize: '32px 32px', opacity: 0.3, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '0.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #1f6feb, #58a6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px #1f6feb44' }}>
            <GitBranch size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-fg-default)', margin: 0, letterSpacing: '-0.03em' }}>
            DevHub
          </h1>
          <p style={{ color: 'var(--color-fg-muted)', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>
            Collaborate. Track. Ship.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--color-canvas-subtle)',
            border: '1px solid var(--color-border-default)',
            borderRadius: '12px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
          }}
        >
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-fg-default)', margin: '0 0 0.25rem', textAlign: 'center' }}>
            Sign in to your account
          </p>

          {/* GitHub */}
          <form action={async () => {
            'use server'
            await signIn('github', { redirectTo: '/projects' })
          }}>
            <button
              type="submit"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.625rem',
                padding: '0.625rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border-default)',
                background: '#24292f',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Continue with GitHub
            </button>
          </form>

          {/* Google */}
          <form action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/projects' })
          }}>
            <button
              type="submit"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.625rem',
                padding: '0.625rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-canvas-default)',
                color: 'var(--color-fg-default)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <hr className="gh-divider" />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', textAlign: 'center', margin: 0 }}>
            By signing in, you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  )
}
