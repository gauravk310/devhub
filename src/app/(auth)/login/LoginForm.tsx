'use client'

import React from 'react'
import Link from 'next/link'
import Script from 'next/script'
import dynamicImport from 'next/dynamic'
import { GitBranch } from 'lucide-react'

const PixelBlast = dynamicImport(() => import('@/components/ui/PixelBlast'), {
  ssr: false,
})

interface LoginFormProps {
  signInGithub: () => Promise<void>
  signInGoogle: () => Promise<void>
}

export default function LoginForm({ signInGithub, signInGoogle }: LoginFormProps) {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#0d1117',
      color: '#e6edf3',
      fontFamily: 'Inter, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Script for Lottie Player */}
      <Script
        src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs"
        type="module"
        strategy="lazyOnload"
      />

      {/* Full-screen background PixelBlast */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.2, pointerEvents: 'none' }}>
        <PixelBlast
          variant="circle"
          pixelSize={4}
          color="#58a6ff"
          patternScale={2.8}
          patternDensity={1.1}
          speed={0.25}
          transparent={true}
        />
      </div>

      {/* Main split-screen container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr',
        minHeight: '100vh',
      }}
        className="md:grid-cols-2"
      >
        {/* Left Side: Login Form */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem 2rem',
          position: 'relative'
        }}>

          <div style={{ width: '100%', maxWidth: '360px', margin: '0 auto' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1f6feb, #58a6ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(31, 111, 235, 0.4)'
              }}>
                <GitBranch size={20} color="#fff" />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>DevHub</span>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              margin: '0 0 0.5rem 0',
              lineHeight: 1.15
            }}>
              Get Started
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* GitHub OAuth Button */}
              <form action={signInGithub}>
                <button
                  type="submit"
                  className="oauth-btn"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #e6edf3',
                    background: '#ffffff',
                    color: '#0d1117',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  Continue with GitHub
                </button>
              </form>
            </div>

            {/* Terms and Privacy */}
            <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: '#6e7681', lineHeight: 1.5, margin: 0 }}>
                By continuing, you agree to our{' '}
                <a href="#" style={{ color: '#58a6ff', textDecoration: 'none' }}>Terms of Service</a> and{' '}
                <a href="#" style={{ color: '#58a6ff', textDecoration: 'none' }}>Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Lottie Animation & Headline */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2rem',
          borderLeft: '1px solid #30363d',
          background: 'rgba(22, 27, 34, 0.45)',
          backdropFilter: 'blur(8px)',
          position: 'relative'
        }}
          className="hidden md:flex"
        >
          {React.createElement('dotlottie-player', {
            src: "/login-animation.lottie",
            background: "transparent",
            speed: "1",
            style: { width: '100%', maxWidth: '380px', height: 'auto' },
            loop: true,
            autoplay: true
          })}

          <div style={{ marginTop: '2rem', textAlign: 'center', maxWidth: '420px' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              margin: '0 0 0.5rem 0',
              lineHeight: 1.15
            }}>
              Start Building <span style={{
                background: 'linear-gradient(135deg, #3fb950, #58a6ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>Real Apps</span>
            </h2>
            <p style={{ color: '#8b949e', fontSize: '1.05rem', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
              Connect codebases, track features, and orchestrate integrations in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Embedded CSS for hover states & responsive layout */}
      <style>{`
        .home-btn:hover {
          color: #e6edf3 !important;
          border-color: #58a6ff !important;
        }
        .oauth-btn:hover {
          background: #f6f8fa !important;
          transform: translateY(-1px);
        }
        @media (max-width: 767px) {
          .md\\:grid-cols-2 {
            grid-template-columns: 1fr !important;
          }
          .hidden {
            display: none !important;
          }
        }
        @media (min-width: 768px) {
          .md\\:grid-cols-2 {
            grid-template-columns: 1.2fr 0.8fr !important;
          }
          .md\\:flex {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
