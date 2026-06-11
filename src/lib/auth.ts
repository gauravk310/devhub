import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: 'read:user user:email repo' } },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    /**
     * Called when a user signs in via OAuth.
     * Upserts the user in MongoDB and stores the GitHub token server-side.
     */
    async signIn({ user, account, profile }) {
      try {
        await dbConnect()

        if (account?.provider === 'github') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ghProfile = profile as any
          await User.findOneAndUpdate(
            { email: user.email },
            {
              name: user.name,
              email: user.email,
              image: user.image,
              githubUsername: ghProfile?.login ?? '',
              githubAccessToken: account.access_token,
              provider: 'github',
            },
            { upsert: true, new: true }
          )
        } else if (account?.provider === 'google') {
          await User.findOneAndUpdate(
            { email: user.email },
            {
              name: user.name,
              email: user.email,
              image: user.image,
              provider: 'google',
            },
            { upsert: true, new: true }
          )
        }

        return true
      } catch (error) {
        console.error('[Auth] signIn error:', error)
        return false
      }
    },

    /**
     * Called whenever a JWT is created or updated.
     * Enriches the token with our MongoDB userId and githubUsername.
     */
    async jwt({ token, user, account, profile }) {
      if (user && account) {
        // First sign-in — fetch userId from MongoDB
        await dbConnect()
        const dbUser = await User.findOne({ email: token.email }).select('_id githubUsername')
        if (dbUser) {
          token.userId = dbUser._id.toString()
          token.githubUsername = dbUser.githubUsername ?? ''
        }
      }
      return token
    },

    /**
     * Called when session is accessed by client or server.
     * Exposes safe user fields from the JWT.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string
        // @ts-expect-error – extending session type
        session.user.githubUsername = (token.githubUsername as string) ?? ''
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
