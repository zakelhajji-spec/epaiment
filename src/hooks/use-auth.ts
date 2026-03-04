/**
 * Authentication Hooks and Utilities
 * For use in client components
 */

'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  name: string
  companyName?: string
  companyIce?: string
}

interface AuthResult {
  success: boolean
  error?: string
  redirectUrl?: string
}

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    setLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false
      })

      if (result?.error) {
        return {
          success: false,
          error: result.error === 'CredentialsSignin' 
            ? 'Email ou mot de passe incorrect' 
            : result.error
        }
      }

      router.refresh()
      
      return { success: true, redirectUrl: '/dashboard' }
    } catch (error) {
      return {
        success: false,
        error: 'Une erreur est survenue. Veuillez réessayer.'
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await signOut({ redirect: false })
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const register = useCallback(async (data: RegisterData): Promise<AuthResult> => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Erreur lors de l\'inscription'
        }
      }

      return login({
        email: data.email,
        password: data.password
      })
    } catch (error) {
      return {
        success: false,
        error: 'Une erreur est survenue. Veuillez réessayer.'
      }
    } finally {
      setLoading(false)
    }
  }, [login])

  const updateSession = useCallback(async (data: { name?: string }) => {
    await update(data)
  }, [update])

  const requireAuth = useCallback(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return false
    }
    return true
  }, [status, router])

  return {
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    loading,
    login,
    logout,
    register,
    updateSession,
    requireAuth
  }
}

export { SessionProvider } from 'next-auth/react'
export { getServerSession } from 'next-auth'
export { authOptions } from '@/lib/auth'
