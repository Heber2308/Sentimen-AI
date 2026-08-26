'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Radio } from 'lucide-react'

export default function RealtimeClock() {
  const [timeStr, setTimeStr] = useState<string>('')
  const [dateStr, setDateStr] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeFormatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now)

      const dateFormatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(now)

      setTimeStr(`${timeFormatted} WIB`)
      setDateStr(dateFormatted)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!timeStr) return null

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 font-mono shadow-sm">
      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="hidden sm:inline">LIVE</span>
      </div>
      <span className="text-slate-600">|</span>
      <div className="flex items-center gap-1.5 text-slate-300">
        <Clock className="w-3.5 h-3.5 text-blue-400" />
        <span>{timeStr}</span>
        <span className="hidden md:inline text-slate-400 text-[11px]">({dateStr})</span>
      </div>
    </div>
  )
}
