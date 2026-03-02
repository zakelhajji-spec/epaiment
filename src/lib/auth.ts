/**
 * NextAuth.js Configuration for Epaiement.ma
 * Demo mode - no database required
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        // Demo mode - allow any login
        return {
          id: 'demo_user_' + Date.now(),
          email: credentials.email,
          name: credentials.email.split('@')[0]
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
      }
      return session
    }
  },

  debug: process.env.NODE_ENV === 'development'
}

export default authOptions
