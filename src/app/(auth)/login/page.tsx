import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { signIn } from '@/lib/auth'
import React from 'react'
import LoginForm from './LoginForm'

export const metadata = { title: 'Sign In — DevHub' }

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/projects')

  async function handleSignInGithub() {
    'use server'
    await signIn('github', { redirectTo: '/projects' })
  }

  async function handleSignInGoogle() {
    'use server'
    await signIn('google', { redirectTo: '/projects' })
  }

  return (
    <LoginForm
      signInGithub={handleSignInGithub}
      signInGoogle={handleSignInGoogle}
    />
  )
}
