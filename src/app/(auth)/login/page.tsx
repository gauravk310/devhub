import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
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
          <img
            src="/logo.png"
            alt="DevHub Logo"
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              objectFit: 'cover',
              boxShadow: '0 0 32px rgba(255, 255, 255, 0.1)',
            }}
          />
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


          <hr className="gh-divider" />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', textAlign: 'center', margin: 0 }}>
            By signing in, you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  )
}
