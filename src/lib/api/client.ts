/**
 * API Client for Epaiement
 * Centralized API calls with error handling
 */

const API_BASE = '/api'

interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'An error occurred' }
      }

      return { data }
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      return { error: 'Network error. Please check your connection.' }
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }
    return this.request<T>(url, { method: 'GET' })
  }

  // POST request
  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // PUT request
  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  // PATCH request
  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient()

// Invoice API
export const invoiceApi = {
  list: (params?: { status?: string; clientId?: string }) => 
    api.get<{ invoices: any[]; total: number }>('/invoices', params),
  
  get: (id: string) => 
    api.get<any>(`/invoices/${id}`),
  
  create: (data: any) => 
    api.post<any>('/invoices', data),
  
  update: (id: string, data: any) => 
    api.put<any>(`/invoices/${id}`, data),
  
  updateStatus: (id: string, action: string, data?: any) => 
    api.patch<any>(`/invoices/${id}`, { action, ...data }),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/invoices/${id}`),
}

// Payment Link API
export const paymentLinkApi = {
  list: (params?: { status?: string }) => 
    api.get<{ links: any[]; total: number }>('/payment-links', params),
  
  get: (id: string) => 
    api.get<any>(`/payment-links/${id}`),
  
  create: (data: any) => 
    api.post<any>('/payment-links', data),
  
  update: (id: string, data: any) => 
    api.put<any>(`/payment-links/${id}`, data),
  
  updateStatus: (id: string, action: string, channel?: string) => 
    api.patch<any>(`/payment-links/${id}`, { action, channel }),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/payment-links/${id}`),
}

// Settings API
export const settingsApi = {
  get: () => 
    api.get<any>('/settings'),
  
  update: (data: any) => 
    api.put<any>('/settings', data),
}

// Subscription API
export const subscriptionApi = {
  get: () => 
    api.get<any>('/subscription'),
  
  activate: (planId: string, interval?: string) => 
    api.post<any>('/subscription', { planId, interval }),
  
  cancel: (reason?: string) => 
    api.put<any>('/subscription', { reason }),
}

// Client API
export const clientApi = {
  list: (params?: { search?: string; limit?: string }) => 
    api.get<{ clients: any[] }>('/clients', params),
  
  get: (id: string) => 
    api.get<any>(`/clients/${id}`),
  
  create: (data: any) => 
    api.post<any>('/clients', data),
  
  update: (id: string, data: any) => 
    api.put<any>(`/clients/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/clients/${id}`),
}

// Reports API
export const reportsApi = {
  overview: (params?: { startDate?: string; endDate?: string }) => 
    api.get<any>('/reports', { type: 'overview', ...params }),
  
  tva: (params?: { startDate?: string; endDate?: string }) => 
    api.get<any>('/reports', { type: 'tva', ...params }),
  
  revenue: (params?: { startDate?: string; endDate?: string }) => 
    api.get<any>('/reports', { type: 'revenue', ...params }),
  
  clients: (params?: { startDate?: string; endDate?: string }) => 
    api.get<any>('/reports', { type: 'clients', ...params }),
}

export default api
