import { jsPDF } from 'jspdf'

declare module 'jspdf-autotable' {
  interface AutoTableOptions {
    startY?: number
    head?: any[][]
    body?: any[][]
    theme?: 'striped' | 'grid' | 'plain'
    headStyles?: any
    bodyStyles?: any
    columnStyles?: any
    margin?: { left?: number; right?: number; top?: number; bottom?: number }
    [key: string]: any
  }

  interface AutoTableResult {
    finalY: number
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): AutoTableResult

  export default autoTable
}

declare global {
  interface jsPDF {
    lastAutoTable?: { finalY: number }
  }
}
