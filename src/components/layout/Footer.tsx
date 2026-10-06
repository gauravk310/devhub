'use client'

import React from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      style={{
        backgroundColor: '#141415',
        borderTop: '1px solid #27272a',
        padding: '1.25rem 2.5rem',
        marginTop: 'auto',
        width: '100%',
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Left: Branding & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href="/projects"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              color: '#ffffff',
            }}
            className="footer-brand"
          >
            <img
              src="/logo.png"
              alt="DevHub Logo"
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '5px',
                objectFit: 'contain',
              }}
            />
            <span style={{ fontWeight: 700, fontSize: '0.925rem', letterSpacing: '-0.02em' }}>
              DevHub
            </span>
          </Link>

          <span style={{ color: '#3f3f46', fontSize: '0.85rem' }}>•</span>

          <p
            style={{
              color: '#8b949e',
              fontSize: '0.8125rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>Collaborate. Track. Ship.</span>
            <span style={{ color: '#3f3f46' }}>—</span>
            <span>© {currentYear}</span>
          </p>
        </div>

        {/* Right: Instagram, GitHub, Contact Me */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Instagram Link */}
          <a
            href="https://instagram.com/seven.learn"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#8b949e',
              fontSize: '0.8125rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            className="footer-link"
            title="Instagram"
          >
            <InstagramIcon />
            <span>Instagram</span>
          </a>

          {/* GitHub Link */}
          <a
            href="https://github.com/gauravk310"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#8b949e',
              fontSize: '0.8125rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            className="footer-link"
            title="GitHub Repository"
          >
            <GithubIcon />
            <span>GitHub</span>
          </a>

          {/* Contact Me / Email */}
          <a
            href="mailto:gskadam3b@gmail.com"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#8b949e',
              fontSize: '0.8125rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            className="footer-link"
            title="Send Email"
          >
            <Mail size={16} />
            <span>Contact Me</span>
          </a>
        </div>
      </div>

      <style>{`
        .footer-brand:hover {
          opacity: 0.85;
        }
        .footer-link:hover {
          color: #ffffff !important;
        }
      `}</style>
    </footer>
  )
}
