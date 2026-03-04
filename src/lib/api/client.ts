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
  
  subscribeGroup: (groupId: string, billingCycle: 'monthly' | 'annual' = 'monthly') => 
    api.post<any>('/subscription', { action: 'subscribe_group', groupId, billingCycle }),
  
  subscribeBundle: (bundleId: string, billingCycle: 'monthly' | 'annual' = 'monthly') => 
    api.post<any>('/subscription', { action: 'subscribe_bundle', bundleId, billingCycle }),
  
  unsubscribeGroup: (groupId: string) => 
    api.post<any>('/subscription', { action: 'unsubscribe_group', groupId }),
  
  cancel: (reason?: string) => 
    api.put<any>('/subscription', { reason }),
  
  // Legacy support - maps to bundle subscription
  activate: (planId: string, billingCycle: 'monthly' | 'annual' = 'monthly') => 
    api.post<any>('/subscription', { action: 'subscribe_bundle', bundleId: planId, billingCycle }),
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

// Lead API (CRM)
export const leadApi = {
  list: (params?: { status?: string; source?: string; search?: string }) => 
    api.get<{ leads: any[]; total: number }>('/leads', params),
  
  get: (id: string) => 
    api.get<any>(`/leads/${id}`),
  
  create: (data: any) => 
    api.post<any>('/leads', data),
  
  update: (id: string, data: any) => 
    api.put<any>(`/leads/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/leads/${id}`),
  
  convertToClient: (id: string) => 
    api.patch<any>(`/leads/${id}`, { action: 'convert_to_client' }),
}

// Task API (CRM)
export const taskApi = {
  list: (params?: { status?: string; priority?: string; leadId?: string }) => 
    api.get<{ tasks: any[]; total: number }>('/tasks', params),
  
  get: (id: string) => 
    api.get<any>(`/tasks/${id}`),
  
  create: (data: any) => 
    api.post<any>('/tasks', data),
  
  update: (id: string, data: any) => 
    api.put<any>(`/tasks/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/tasks/${id}`),
  
  complete: (id: string) => 
    api.patch<any>(`/tasks/${id}`, { action: 'complete' }),
}

// Supplier API (Sales)
export const supplierApi = {
  list: (params?: { search?: string }) => 
    api.get<{ suppliers: any[]; total: number }>('/suppliers', params),
  
  get: (id: string) => 
    api.get<any>(`/suppliers/${id}`),
  
  create: (data: any) => 
    api.post<any>('/suppliers', data),
  
  update: (id: string, data: any) => 
    api.put<any>(`/suppliers/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/suppliers/${id}`),
}

// Quote API (Sales)
export const quoteApi = {
  list: (params?: { status?: string; clientId?: string }) => 
    api.get<{ quotes: any[]; total: number }>('/quotes', params),
  
  get: (id: string) => 
    api.get<any>(`/quotes/${id}`),
  
  create: (data: any) => 
    api.post<any>('/quotes', data),
  
  update: (id: string, data: any) => 
    api.put<any>(`/quotes/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/quotes/${id}`),
  
  send: (id: string) => 
    api.patch<any>(`/quotes/${id}`, { action: 'send' }),
  
  accept: (id: string) => 
    api.patch<any>(`/quotes/${id}`, { action: 'accept' }),
  
  reject: (id: string) => 
    api.patch<any>(`/quotes/${id}`, { action: 'reject' }),
  
  convertToInvoice: (id: string) => 
    api.patch<any>(`/quotes/${id}`, { action: 'convert_to_invoice' }),
}

// Expense API (Accounting)
export const expenseApi = {
  list: (params?: { category?: string; startDate?: string; endDate?: string }) => 
    api.get<{ expenses: any[]; totals: any; total: number }>('/expenses', params),
  
  get: (id: string) => 
    api.get<any>(`/expenses/${id}`),
  
  create: (data: any) => 
    api.post<any>('/expenses', data),
  
  update: (id: string, data: any) => 
    api.put<any>(`/expenses/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/expenses/${id}`),
}

// Credit Note API (Accounting)
export const creditNoteApi = {
  list: (params?: { status?: string; clientId?: string }) => 
    api.get<{ creditNotes: any[]; total: number }>('/credit-notes', params),
  
  get: (id: string) => 
    api.get<any>(`/credit-notes/${id}`),
  
  create: (data: any) => 
    api.post<any>('/credit-notes', data),
  
  update: (id: string, data: any) => 
    api.put<any>(`/credit-notes/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/credit-notes/${id}`),
  
  issue: (id: string) => 
    api.patch<any>(`/credit-notes/${id}`, { action: 'issue' }),
  
  apply: (id: string) => 
    api.patch<any>(`/credit-notes/${id}`, { action: 'apply' }),
}

// Product API (Stock)
export const productApi = {
  list: (params?: { category?: string; search?: string; lowStock?: string }) => 
    api.get<{ products: any[]; total: number; categories: string[] }>('/products', params),
  
  get: (id: string) => 
    api.get<any>(`/products/${id}`),
  
  create: (data: any) => 
    api.post<any>('/products', data),
  
  update: (id: string, data: any) => 
    api.put<any>(`/products/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/products/${id}`),
}

// Team API
export const teamApi = {
  list: (params?: { status?: string; role?: string }) => 
    api.get<{ members: any[]; total: number }>('/team', params),
  
  get: (id: string) => 
    api.get<any>(`/team/${id}`),
  
  invite: (data: any) => 
    api.post<any>('/team', data),
  
  update: (id: string, data: any) => 
    api.put<any>(`/team/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/team/${id}`),
}

export default api
