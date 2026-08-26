import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format tanggal ke Waktu Indonesia Barat (WIB)
 */
export function formatWIBDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-'
  try {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return String(dateInput)

    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d) + ' WIB'
  } catch {
    return String(dateInput)
  }
}

/**
 * Format waktu relatif dinamis (realtime seconds/minutes ago)
 */
export function formatRelativeWIB(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-'
  try {
    const now = new Date().getTime()
    const target = new Date(dateInput).getTime()
    if (isNaN(target)) return '-'

    const diffSec = Math.floor((now - target) / 1000)

    if (diffSec < 5) return 'Baru saja'
    if (diffSec < 60) return `${diffSec} detik lalu`

    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} menit lalu`

    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} jam lalu`

    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay} hari lalu`

    return formatWIBDate(dateInput)
  } catch {
    return '-'
  }
}

/**
 * Download data array as CSV file
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return

  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          let cell = row[header] ?? ''
          if (typeof cell === 'object') {
            cell = JSON.stringify(cell)
          }
          cell = String(cell).replace(/"/g, '""')
          return `"${cell}"`
        })
        .join(',')
    ),
  ].join('\r\n')

  // Tambahkan UTF-8 BOM (\uFEFF) agar Microsoft Excel membaca format dengan benar
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
