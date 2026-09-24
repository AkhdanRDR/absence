'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AttendanceRecord {
  id: string
  user_id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: 'Hadir' | 'Telat' | 'Izin' | 'Sakit' | 'Alpha'
  notes?: string | null
}

type FilterCategory = 'Semua' | 'Hadir' | 'Telat' | 'Izin/Sakit'

const FILTERS: FilterCategory[] = ['Semua', 'Hadir', 'Telat', 'Izin/Sakit']

function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T00:00:00`)
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTimeHM(isoString?: string | null): string {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '-'
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m} WIB`
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Hadir':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Telat':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Izin':
      return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'Sakit':
      return 'bg-violet-50 text-violet-700 border-violet-200'
    case 'Alpha':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

export default function RiwayatPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [filter, setFilter] = useState<FilterCategory>('Semua')

  // ponytail: client fetch -> Server Components when SSR auth cookies wired
  const fetchAttendances = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('check_in', { ascending: false })

      if (error) throw error
      setAttendances((data as AttendanceRecord[]) || [])
    } catch (err: unknown) {
      console.error('Failed to fetch attendances:', err)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser()

      if (!isMounted) return

      if (error || !currentUser) {
        router.replace('/login')
        return
      }

      await fetchAttendances(currentUser.id)
      setLoading(false)
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router, fetchAttendances])

  const filteredAttendances = attendances.filter((item) => {
    if (filter === 'Semua') return true
    if (filter === 'Hadir') return item.status === 'Hadir'
    if (filter === 'Telat') return item.status === 'Telat'
    if (filter === 'Izin/Sakit') {
      return item.status === 'Izin' || item.status === 'Sakit'
    }
    return true
  })

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
            <div className="space-y-1.5">
              <div className="h-4 bg-slate-200 rounded w-28"></div>
              <div className="h-3 bg-slate-200 rounded w-44"></div>
            </div>
          </div>
          <div className="h-6 bg-slate-200 rounded-full w-20"></div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-slate-200 h-7 rounded-full w-16 shrink-0"
            ></div>
          ))}
        </div>

        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white rounded-xl p-3 border border-slate-200/80 shadow-sm flex items-center justify-between"
            >
              <div className="space-y-2 w-2/3">
                <div className="h-3.5 bg-slate-200 rounded w-1/2"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              </div>
              <div className="h-6 bg-slate-200 rounded-lg w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 stroke-current stroke-2 fill-none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">
              Riwayat Presensi
            </h1>
            <p className="text-xs text-slate-500">
              Catatan kehadiran dan presensi siswa
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          {filteredAttendances.length} Catatan
        </span>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTERS.map((cat) => {
          const active = filter === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                active
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Riwayat Items List */}
      <div className="space-y-2.5">
        {filteredAttendances.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center flex flex-col items-center justify-center space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <svg
                className="w-6 h-6 stroke-current stroke-2 fill-none"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-800">
              Tidak Ada Riwayat Presensi
            </p>
            <p className="text-xs text-slate-500">
              {filter === 'Semua'
                ? 'Belum ada catatan presensi yang tersimpan.'
                : `Tidak ditemukan presensi dengan status "${filter}".`}
            </p>
          </div>
        ) : (
          filteredAttendances.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">
                  {formatDateIndo(item.date)}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Masuk: {formatTimeHM(item.check_in)} • Pulang:{' '}
                  {formatTimeHM(item.check_out)}
                </p>
                {item.notes && (
                  <p className="text-[11px] text-slate-600 mt-1 truncate">
                    {item.notes}
                  </p>
                )}
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${getStatusBadgeClass(
                  item.status
                )}`}
              >
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
