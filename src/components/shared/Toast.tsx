'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContainerProps {
  language?: 'fr' | 'ar'
}

// Global toast state
let toastListeners: Array<(toast: Toast | null) => void> = []
let toastQueue: Toast[] = []

function notifyListeners() {
  toastListeners.forEach(listener => listener(toastQueue[0] || null))
}

export function showToast(message: string, type: Toast['type'] = 'success') {
  const toast: Toast = {
    id: Date.now().toString(),
    message,
    type
  }
  
  toastQueue.push(toast)
  notifyListeners()
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== toast.id)
    notifyListeners()
  }, 3000)
}

export function ToastContainer({ language = 'fr' }: ToastContainerProps) {
  const [toast, setToast] = useState<Toast | null>(null)
  
  useEffect(() => {
    toastListeners.push(setToast)
    return () => {
      toastListeners = toastListeners.filter(l => l !== setToast)
    }
  }, [])
  
  if (!toast) return null
  
  const dismiss = () => {
    toastQueue = toastQueue.filter(t => t.id !== toast.id)
    notifyListeners()
  }
  
  return (
    <div 
      className={`fixed top-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white transition-all animate-in slide-in-from-top ${
        toast.type === 'success' ? 'bg-emerald-500' : 
        toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
      }`}
      style={{ [language === 'ar' ? 'left' : 'right']: '1rem' }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
      {toast.type === 'error' && <XCircle className="w-5 h-5" />}
      <span className="font-medium">{toast.message}</span>
      <button onClick={dismiss} className="ml-2 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default ToastContainer
