import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper untuk mem-parsing string tanggal dari Supabase/DB dengan aman.
 * Jika string berupa ISO UTC tanpa penanda timezone (contoh: "2026-08-26T14:13:57.194" atau "2026-08-26 14:13:57"),
 * fungsi ini memastikan dibaca sebagai UTC (ditambahkan 'Z') agar waktu konversi ke WIB (UTC+7) akurat.
 */
export function parseDateSafe(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput
  }

  let str = String(dateInput).trim()
  if (!str) return null

  // Jika berupa timestamp angka (ms)
  if (/^\d+$/.test(str)) {
    const d = new Date(Number(str))
    return isNaN(d.getTime()) ? null : d
  }

  // Format ISO / database timestamp tanpa zona waktu:
  // Supabase/PostgreSQL 'timestamp without time zone' mengembalikan UTC tanpa akhiran Z.
  // JavaScript default-nya menganggap format tersebut sebagai local time jika tanpa Z.
  if (!str.endsWith('Z') && !str.includes('+') && !str.includes('GMT')) {
    str = str.replace(' ', 'T') + 'Z'
  }

  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Format tanggal ke Waktu Indonesia Barat (WIB)
 */
export function formatWIBDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-'
  try {
    const d = parseDateSafe(dateInput)
    if (!d) return String(dateInput)

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
    const d = parseDateSafe(dateInput)
    if (!d) return '-'

    const now = Date.now()
    const target = d.getTime()

    const diffSec = Math.floor((now - target) / 1000)

    if (diffSec < 0 || diffSec < 10) return 'Baru saja'
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
