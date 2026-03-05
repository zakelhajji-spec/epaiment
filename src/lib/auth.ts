/**
 * NextAuth.js Configuration for Epaiement.ma
 * Production authentication with password verification
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        // Check account status - reject suspended or deleted accounts
        if (user.accountStatus !== 'active') {
          return null
        }

        // Verify password
        const isPasswordValid = await compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/auth/register'
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role
      }
      
      // Handle user updates
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }
      
      return token
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.role = token.role as string
      }
      return session
    }
  },

  events: {
    async signIn({ user }) {
      console.log(`[AUTH] User signed in: ${user.email}`)
    },
    async signOut({ token }) {
      console.log(`[AUTH] User signed out: ${token.email}`)
    }
  },

  debug: process.env.NODE_ENV === 'development'
}

export default authOptions
