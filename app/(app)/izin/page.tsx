'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface LeaveRecord {
  id: string
  user_id: string
  date: string
  type: 'Izin' | 'Sakit'
  notes: string
  status: 'Pending' | 'Disetujui' | 'Ditolak'
  created_at: string
}

function getTodayDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T00:00:00`)
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function IzinPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])

  // Form states
  const [type, setType] = useState<'Izin' | 'Sakit'>('Izin')
  const [date, setDate] = useState<string>(getTodayDateString())
  const [notes, setNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)

  // ponytail: client-side fetch -> Server Components when auth SSR cookies wired
  const fetchLeaves = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('leaves')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeaves((data as LeaveRecord[]) || [])
    } catch (err: unknown) {
      console.error('Failed to fetch leaves:', err)
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

      setUser(currentUser)
      await fetchLeaves(currentUser.id)
      setLoading(false)
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router, fetchLeaves])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || submitting) return

    if (!date) {
      setFeedback({ text: 'Tanggal wajib diisi.', type: 'error' })
      return
    }

    if (!notes.trim()) {
      setFeedback({ text: 'Keterangan wajib diisi.', type: 'error' })
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      const { error } = await supabase.from('leaves').insert({
        user_id: user.id,
        date,
        type,
        notes: notes.trim(),
        status: 'Pending',
      })

      if (error) throw error

      setFeedback({
        text: `Permohonan ${type} berhasil dikirim dan menunggu persetujuan.`,
        type: 'success',
      })
      setNotes('')
      setDate(getTodayDateString())
      await fetchLeaves(user.id)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal mengirim permohonan izin.'
      setFeedback({ text: message, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse bg-white rounded-2xl p-4 border border-blue-100 shadow-sm space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-9 bg-slate-200 rounded"></div>
          <div className="h-9 bg-slate-200 rounded"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
        </div>
        <div className="animate-pulse bg-white rounded-2xl p-4 border border-blue-100 shadow-sm space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-16 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Form Card */}
      <section className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 stroke-current stroke-2 fill-none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-slate-800">
            Form Permohonan Izin / Sakit
          </h2>
        </div>

        {feedback && (
          <div
            className={`mb-4 text-xs p-3 rounded-xl flex items-start gap-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <svg
                className="w-4 h-4 stroke-current stroke-2 fill-none shrink-0 mt-0.5 text-emerald-600"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 stroke-current stroke-2 fill-none shrink-0 mt-0.5 text-rose-600"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Permohonan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('Izin')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border ${
                  type === 'Izin'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <svg
                  className="w-3.5 h-3.5 stroke-current stroke-2 fill-none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Izin
              </button>
              <button
                type="button"
                onClick={() => setType('Sakit')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border ${
                  type === 'Sakit'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <svg
                  className="w-3.5 h-3.5 stroke-current stroke-2 fill-none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Sakit
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label
              htmlFor="leave-date"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Tanggal
            </label>
            <input
              id="leave-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-50 text-slate-800"
            />
          </div>

          {/* Keterangan / Catatan */}
          <div>
            <label
              htmlFor="leave-notes"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Keterangan / Alasan
            </label>
            <textarea
              id="leave-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan keterangan izin atau sakit secara lengkap..."
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-50 text-slate-800 resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-medium text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin stroke-current stroke-2 fill-none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Mengirim...</span>
              </>
            ) : (
              <span>Kirim Permohonan</span>
            )}
          </button>
        </form>
      </section>

      {/* History List Card */}
      <section className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
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
          <h2 className="text-sm font-bold text-slate-800">
            Riwayat Pengajuan Izin
          </h2>
        </div>

        {leaves.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
            <svg
              className="w-8 h-8 stroke-slate-300 stroke-1 fill-none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Belum ada pengajuan izin</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaves.map((leave) => {
              const typeBadge =
                leave.type === 'Sakit'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'

              let statusBadge =
                'bg-yellow-50 text-yellow-700 border-yellow-200'
              if (leave.status === 'Disetujui') {
                statusBadge =
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
              } else if (leave.status === 'Ditolak') {
                statusBadge = 'bg-rose-50 text-rose-700 border-rose-200'
              }

              return (
                <div key={leave.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-slate-800">
                      {formatDateIndo(leave.date)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadge}`}
                      >
                        {leave.type}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusBadge}`}
                      >
                        {leave.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap break-words">
                    {leave.notes}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
