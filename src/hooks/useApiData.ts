/**
 * useApiData Hook
 * A React hook for fetching and managing data from the API
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface UseApiDataOptions<T> {
  endpoint: string
  params?: Record<string, string>
  enabled?: boolean
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

interface UseApiDataReturn<T> {
  data: T | undefined
  error: string | null
  isLoading: boolean
  refetch: () => Promise<void>
  mutate: (newData: T) => void
}

export function useApiData<T = unknown>({
  endpoint,
  params,
  enabled = true,
  initialData,
  onSuccess,
  onError
}: UseApiDataOptions<T>): UseApiDataReturn<T> {
  const { status } = useSession()
  const [data, setData] = useState<T | undefined>(initialData)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return

    setIsLoading(true)
    setError(null)

    try {
      let url = `/api${endpoint}`
      if (params) {
        const searchParams = new URLSearchParams(params)
        url += `?${searchParams.toString()}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, params, status, onSuccess, onError])

  useEffect(() => {
    if (enabled && status === 'authenticated') {
      fetchData()
    }
  }, [enabled, status, fetchData])

  const mutate = useCallback((newData: T) => {
    setData(newData)
  }, [])

  return {
    data,
    error,
    isLoading,
    refetch: fetchData,
    mutate
  }
}

/**
 * useApiMutation Hook
 * A React hook for API mutations (POST, PUT, DELETE)
 */

interface UseApiMutationOptions<T, P = unknown> {
  endpoint: string
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

interface UseApiMutationReturn<T, P = unknown> {
  mutate: (payload?: P) => Promise<T | null>
  data: T | null
  error: string | null
  isLoading: boolean
  reset: () => void
}

export function useApiMutation<T = unknown, P = unknown>({
  endpoint,
  method = 'POST',
  onSuccess,
  onError
}: UseApiMutationOptions<T, P>): UseApiMutationReturn<T, P> {
  const { status } = useSession()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(async (payload?: P): Promise<T | null> => {
    if (status !== 'authenticated') {
      setError('Not authenticated')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Request failed')
      }

      setData(result)
      onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, method, status, onSuccess, onError])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return { mutate, data, error, isLoading, reset }
}

/**
 * useClients Hook
 * Fetches and manages client data
 */
export function useClients(search?: string) {
  return useApiData<{ clients: any[] }>({
    endpoint: '/clients',
    params: search ? { search } : undefined
  })
}

/**
 * useInvoices Hook
 * Fetches and manages invoice data
 */
export function useInvoices(status?: string, clientId?: string) {
  const params: Record<string, string> = {}
  if (status) params.status = status
  if (clientId) params.clientId = clientId

  return useApiData<{ invoices: any[]; total: number }>({
    endpoint: '/invoices',
    params: Object.keys(params).length > 0 ? params : undefined
  })
}

/**
 * usePaymentLinks Hook
 * Fetches and manages payment link data
 */
export function usePaymentLinks(status?: string) {
  return useApiData<{ links: any[]; total: number }>({
    endpoint: '/payment-links',
    params: status ? { status } : undefined
  })
}

/**
 * useSettings Hook
 * Fetches and manages settings
 */
export function useSettings() {
  return useApiData<any>({
    endpoint: '/settings'
  })
}

/**
 * useReports Hook
 * Fetches report data
 */
export function useReports(type: 'overview' | 'tva' | 'revenue' | 'clients', startDate?: string, endDate?: string) {
  const params: Record<string, string> = { type }
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate

  return useApiData<any>({
    endpoint: '/reports',
    params
  })
}

export default useApiData
