'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface Profile {
  full_name: string
  nisn: string
  role: string
}

interface AttendanceRecord {
  id: string
  user_id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: 'Hadir' | 'Telat' | 'Izin' | 'Sakit' | 'Alpha'
  notes?: string | null
}

interface MonthStats {
  hadir: number
  telat: number
  izin: number
  alpha: number
}

const SCHOOL_LAT = -8.14235069224585
const SCHOOL_LON = 112.58568410642512
const RADIUS_TOLERANCE_METERS = 100 // 100 meter tolerance

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTimeHM(isoString?: string | null): string {
  if (!isoString) return '--:--'
  const d = new Date(isoString)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m} WIB`
}

export default function DashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [stats, setStats] = useState<MonthStats>({
    hadir: 0,
    telat: 0,
    izin: 0,
    alpha: 0,
  })
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)

  // Geolocation & Device criteria state
  const [distance, setDistance] = useState<number | null>(null)
  const [geoStatus, setGeoStatus] = useState<
    'idle' | 'requesting' | 'valid' | 'out_of_range' | 'denied' | 'unsupported' | 'mock_detected'
  >('requesting')
  const [geoError, setGeoError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoStatus('unsupported')
      setGeoError('Perangkat tidak mendukung geolokasi GPS.')
      return
    }

    // Check devtools inspector open
    const isDevToolsOpen =
      window.outerWidth - window.innerWidth > 160 ||
      window.outerHeight - window.innerHeight > 160

    if (isDevToolsOpen) {
      setGeoStatus('mock_detected')
      setGeoError('Terdeteksi Developer Mode / Inspector aktif. Harap nonaktifkan untuk melanjutkan.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Detect mock location flag (exposed on some Android WebView / Chromium builds)
        const isMock = Boolean((pos.coords as unknown as { isMock?: boolean }).isMock)
        if (isMock) {
          setGeoStatus('mock_detected')
          setGeoError('Terdeteksi Mock Location. Harap matikan Opsi Pengembang / Mock Location pada HP Anda.')
          return
        }

        const dist = calculateDistanceMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          SCHOOL_LAT,
          SCHOOL_LON
        )

        setDistance(dist)

        if (dist <= RADIUS_TOLERANCE_METERS) {
          setGeoStatus('valid')
          setGeoError(null)
        } else {
          setGeoStatus('out_of_range')
          setGeoError(`Anda berada ${Math.round(dist)} meter dari sekolah (toleransi ${RADIUS_TOLERANCE_METERS} meter).`)
        }
      },
      (err) => {
        if (err.code === 1) {
          setGeoStatus('denied')
          setGeoError('Izin akses lokasi ditolak. Harap izinkan akses GPS di pengaturan browser.')
        } else {
          setGeoStatus('denied')
          setGeoError(err.message || 'Gagal memperoleh koordinat GPS.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      requestLocation()
    }, 0)
    return () => clearTimeout(timer)
  }, [requestLocation])

  // Real-time live clock
  useEffect(() => {
    const timer = setTimeout(() => setCurrentTime(new Date()), 0)
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  // ponytail: client-side fetch -> React Server Component with streaming when auth SSR cookies wired
  const fetchDashboardData = useCallback(async (activeUser: User) => {
    try {
      const todayStr = getLocalDateString(new Date())
      const now = new Date()
      const startOfMonth = getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1))
      const endOfMonth = getLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0))

      const [profileRes, todayAttRes, monthAttsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, nisn, role')
          .eq('id', activeUser.id)
          .maybeSingle(),
        supabase
          .from('attendances')
          .select('*')
          .eq('user_id', activeUser.id)
          .eq('date', todayStr)
          .maybeSingle(),
        supabase
          .from('attendances')
          .select('status')
          .eq('user_id', activeUser.id)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth),
      ])

      if (profileRes.data) {
        setProfile(profileRes.data)
      } else {
        setProfile({
          full_name: (activeUser.user_metadata?.full_name as string) || 'Siswa',
          nisn: (activeUser.user_metadata?.nisn as string) || '-',
          role: 'Siswa Reguler',
        })
      }

      setTodayAttendance(todayAttRes.data as AttendanceRecord | null)

      const counts: MonthStats = { hadir: 0, telat: 0, izin: 0, alpha: 0 }
      if (monthAttsRes.data) {
        for (const row of monthAttsRes.data) {
          if (row.status === 'Hadir') counts.hadir++
          else if (row.status === 'Telat') counts.telat++
          else if (row.status === 'Izin' || row.status === 'Sakit') counts.izin++
          else if (row.status === 'Alpha') counts.alpha++
        }
      }
      setStats(counts)
    } catch (err: unknown) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser()
      if (!isMounted) return

      if (error || !currentUser) {
        router.replace('/login')
        return
      }

      setUser(currentUser)
      await fetchDashboardData(currentUser)
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router, fetchDashboardData])

  const handleAttendanceTap = async () => {
    if (!user || actionLoading) return
    setActionLoading(true)
    setFeedback(null)

    const now = new Date()
    const todayStr = getLocalDateString(now)

    try {
      // Case A: No check-in today
      if (!todayAttendance) {
        const hour = now.getHours()
        const minute = now.getMinutes()
        const status: 'Hadir' | 'Telat' =
          hour < 7 || (hour === 7 && minute === 0) ? 'Hadir' : 'Telat'

        const { data, error } = await supabase
          .from('attendances')
          .insert({
            user_id: user.id,
            date: todayStr,
            check_in: now.toISOString(),
            status,
          })
          .select()
          .single()

        if (error) throw error

        setTodayAttendance(data as AttendanceRecord)
        setStats((prev) => ({
          ...prev,
          [status === 'Hadir' ? 'hadir' : 'telat']:
            prev[status === 'Hadir' ? 'hadir' : 'telat'] + 1,
        }))
        setFeedback({
          text: `Presensi Masuk berhasil dicatat (${status})`,
          type: 'success',
        })
      }
      // Case B: Checked in, but no check-out
      else if (!todayAttendance.check_out) {
        const { data, error } = await supabase
          .from('attendances')
          .update({
            check_out: now.toISOString(),
          })
          .eq('id', todayAttendance.id)
          .select()
          .single()

        if (error) throw error

        setTodayAttendance(data as AttendanceRecord)
        setFeedback({
          text: 'Presensi Pulang berhasil dicatat',
          type: 'success',
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses presensi'
      setFeedback({ text: msg, type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // Formatting helpers
  const formatDigitalClock = (d: Date | null) => {
    if (!d) return '--:--:--'
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    const s = String(d.getSeconds()).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const formatIndonesianDate = (d: Date | null) => {
    if (!d) return 'Memuat tanggal...'
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getGreeting = (d: Date | null) => {
    if (!d) return 'Selamat datang'
    const hour = d.getHours()
    if (hour >= 3 && hour < 11) return 'Selamat pagi'
    if (hour >= 11 && hour < 15) return 'Selamat siang'
    if (hour >= 15 && hour < 18) return 'Selamat sore'
    return 'Selamat malam'
  }

  const getMonthNameUpper = (d: Date | null) => {
    if (!d) return 'SEPTEMBER 2026'
    return d
      .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      .toUpperCase()
  }

  // Derive status badge and button state
  const isCompleted = Boolean(todayAttendance?.check_in && todayAttendance?.check_out)
  const isNonCheckIn = Boolean(
    todayAttendance &&
      !todayAttendance.check_in &&
      ['Izin', 'Sakit', 'Alpha'].includes(todayAttendance.status)
  )
  const isLocationValid = geoStatus === 'valid'
  const isButtonDisabled =
    isCompleted || isNonCheckIn || actionLoading || !isLocationValid

  let statusBadgeText = 'Belum Absen Masuk'
  let buttonLabel = 'Tap untuk Presensi Masuk'
  let buttonSubtext = 'Tap untuk Presensi'

  if (todayAttendance) {
    if (todayAttendance.check_in && !todayAttendance.check_out) {
      statusBadgeText = `Sudah Absen Masuk (${formatTimeHM(todayAttendance.check_in)}) - ${todayAttendance.status}`
      buttonLabel = 'Tap untuk Presensi Pulang'
    } else if (todayAttendance.check_in && todayAttendance.check_out) {
      statusBadgeText = `Presensi Selesai (Masuk: ${formatTimeHM(todayAttendance.check_in)}, Pulang: ${formatTimeHM(todayAttendance.check_out)})`
      buttonLabel = 'Presensi Selesai'
    } else {
      statusBadgeText = `Status Hari Ini: ${todayAttendance.status}`
      buttonLabel = `Presensi Tercatat (${todayAttendance.status})`
    }
  }

  if (!isLocationValid && !isCompleted && !isNonCheckIn) {
    if (geoStatus === 'requesting') {
      buttonSubtext = 'Memeriksa Lokasi GPS...'
    } else if (geoStatus === 'out_of_range') {
      buttonSubtext = `Di Luar Radius (${Math.round(distance || 0)}m > ${RADIUS_TOLERANCE_METERS}m)`
    } else if (geoStatus === 'mock_detected') {
      buttonSubtext = 'Nonaktifkan Mode Pengembang / Mock Location'
    } else if (geoStatus === 'denied') {
      buttonSubtext = 'Aktifkan Izin Lokasi untuk Absen'
    } else {
      buttonSubtext = 'Lokasi Belum Terverifikasi'
    }
  } else if (isButtonDisabled) {
    buttonSubtext = buttonLabel
  } else {
    buttonSubtext = buttonLabel
  }

  const initialLetter = (profile?.full_name?.trim()?.charAt(0) || 'S').toUpperCase()

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse bg-white rounded-2xl p-4 border border-blue-100 shadow-sm flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-slate-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-3 border border-slate-200 h-20"></div>
          ))}
        </div>

        <div className="animate-pulse bg-white rounded-2xl p-4 border border-blue-100 h-48"></div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Kartu Profil Pengguna */}
      <section className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-sky-500 border-2 border-white shadow flex items-center justify-center text-white font-bold text-xl">
              {initialLetter}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-sky-600 border border-white flex items-center justify-center text-white">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M4 4h3l2-2h6l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 15a5 5 0 100-10 5 5 0 000 10z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              {getGreeting(currentTime)}
            </p>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {profile?.full_name || 'Siswa SMK'}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {profile?.role || 'Siswa Reguler'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                NISN: {profile?.nisn || '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Barcode ID"
            className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 hover:bg-sky-100 transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm10 0h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm-2-4h2v2h-2v-2zm4 0h2v2h-2v-2z" />
            </svg>
          </button>
          <button
            type="button"
            title="Info Perangkat"
            className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg
              className="w-4 h-4 stroke-current stroke-2 fill-none"
              viewBox="0 0 24 24"
            >
              <rect x="7" y="2" width="10" height="20" rx="2" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
          </button>
        </div>
      </section>

      {/* Periode Bulan */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-700 tracking-wider">
          {getMonthNameUpper(currentTime)}
        </span>
        <span className="text-xs font-semibold text-sky-700 flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5 stroke-current stroke-2 fill-none"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Rekap Kehadiran
        </span>
      </div>

      {/* Statistik Kehadiran (4 Kotak) */}
      <div className="grid grid-cols-4 gap-2">
        {/* Hadir */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-sm">
            <svg
              className="w-4 h-4 stroke-current stroke-[3] fill-none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span className="text-xl font-black text-emerald-700 leading-none mb-1">
            {stats.hadir}
          </span>
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight">
            Hadir
          </span>
        </div>

        {/* Telat */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
          <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-sm">
            <svg
              className="w-4 h-4 stroke-current stroke-2 fill-none"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 7v5l3 2" />
            </svg>
          </div>
          <span className="text-xl font-black text-amber-700 leading-none mb-1">
            {stats.telat}
          </span>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">
            Telat
          </span>
        </div>

        {/* Izin */}
        <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
          <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center mb-1.5 shadow-sm">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
          </div>
          <span className="text-xl font-black text-sky-700 leading-none mb-1">
            {stats.izin}
          </span>
          <span className="text-[10px] font-bold text-sky-800 uppercase tracking-tight">
            Izin
          </span>
        </div>

        {/* Alpha */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
          <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center mb-1.5 shadow-sm">
            <svg
              className="w-4 h-4 stroke-current stroke-[3]"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <span className="text-xl font-black text-rose-700 leading-none mb-1">
            {stats.alpha}
          </span>
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-tight">
            Alpha
          </span>
        </div>
      </div>

      {/* Kartu Jam & Status Hari Ini */}
      <section className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm space-y-4">
        {/* Waktu Digital */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>HARI INI</span>
              <span>•</span>
              <span>AKTIF</span>
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight font-mono">
              {formatDigitalClock(currentTime)}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {formatIndonesianDate(currentTime)}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-right">
            <span className="block text-[9px] font-bold uppercase text-slate-400">
              Batas Masuk
            </span>
            <span className="block text-xs font-bold text-slate-700">
              07:00 WIB
            </span>
            <span className="block text-[9px] font-bold uppercase text-slate-400 mt-1">
              Jam Pulang
            </span>
            <span className="block text-xs font-bold text-slate-700">
              11:59 WIB
            </span>
          </div>
        </div>

        {/* Lokasi Presensi */}
        <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  SMKN 1 KEPANJEN
                </h3>
                <p className="text-[11px] text-slate-500">
                  Jarak:{' '}
                  <strong className="text-slate-800">
                    {distance !== null ? Math.round(distance) : '--'}
                  </strong>{' '}
                  meter (maks {RADIUS_TOLERANCE_METERS}m)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {geoStatus === 'valid' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  TERKUNCI
                </span>
              )}
              {geoStatus === 'out_of_range' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                  DILUAR RADIUS
                </span>
              )}
              {geoStatus === 'denied' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                  GPS DITOLAK
                </span>
              )}
              {geoStatus === 'mock_detected' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                  DEV MODE AKTIF
                </span>
              )}
              {geoStatus === 'requesting' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  MEMERIKSA
                </span>
              )}
              {geoStatus === 'unsupported' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  NO GPS
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setGeoStatus('requesting')
                  setGeoError(null)
                  requestLocation()
                }}
                title="Refresh Lokasi"
                className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 active:scale-95 transition-all shadow-xs"
              >
                <svg
                  className={`w-3.5 h-3.5 stroke-current stroke-2 fill-none ${
                    geoStatus === 'requesting' ? 'animate-spin text-sky-600' : ''
                  }`}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div
            className={`border rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
              geoStatus === 'valid'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : geoStatus === 'requesting'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {geoStatus === 'valid' &&
              'Lokasi terverifikasi di area SMKN 1 Kepanjen.'}
            {geoStatus === 'requesting' &&
              'Mengambil data koordinat GPS perangkat...'}
            {geoStatus === 'out_of_range' &&
              (geoError ||
                `Di luar radius sekolah. Jarak saat ini: ${Math.round(
                  distance || 0
                )}m (toleransi ${RADIUS_TOLERANCE_METERS}m).`)}
            {geoStatus === 'denied' &&
              (geoError ||
                'Izin akses lokasi diperlukan. Aktifkan GPS pada peramban/HP.')}
            {geoStatus === 'mock_detected' &&
              (geoError ||
                'Terdeteksi Mode Pengembang / Mock Location. Harap nonaktifkan Opsi Pengembang pada HP Anda.')}
            {geoStatus === 'unsupported' &&
              'Peramban tidak mendukung API Geolokasi.'}
            {geoStatus === 'idle' &&
              'Tekan tombol refresh untuk memverifikasi lokasi presensi.'}
          </div>
        </div>

        {/* Status Absen */}
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl py-2 px-3 text-center text-xs text-slate-600 font-medium">
          Status Hari Ini:{' '}
          <strong className="text-sky-700 font-bold uppercase">
            {statusBadgeText}
          </strong>
        </div>
      </section>

      {/* Feedback Message */}
      {feedback && (
        <div
          role="alert"
          className={`px-3 py-2 rounded-xl text-xs font-medium border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Tombol Sidik Jari / Tap Presensi */}
      <section className="flex flex-col items-center justify-center py-4">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-36 h-36 rounded-full flex items-center justify-center transition-all ${
              isButtonDisabled
                ? 'bg-slate-200/60'
                : 'bg-sky-200/50 animate-pulse'
            }`}
          >
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${
                isButtonDisabled ? 'bg-slate-300/60' : 'bg-sky-300/60'
              }`}
            >
              <button
                type="button"
                disabled={isButtonDisabled}
                onClick={handleAttendanceTap}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-all ${
                  isButtonDisabled
                    ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                    : 'bg-sky-600 hover:bg-sky-700 active:scale-95 text-white cursor-pointer'
                }`}
                title={buttonLabel}
              >
                {actionLoading ? (
                  <svg
                    className="w-8 h-8 animate-spin text-white"
                    fill="none"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-10 h-10 stroke-current stroke-[1.8] fill-none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      d="M12 11c0-1.1.9-2 2-2s2 .9 2 2c0 2.2-1.8 4-4 4"
                    />
                    <path
                      strokeLinecap="round"
                      d="M10.5 7.5c1-.9 2.3-1.5 3.8-1.5 3 0 5.5 2.5 5.5 5.5 0 2.2-.9 4.2-2.3 5.7"
                    />
                    <path
                      strokeLinecap="round"
                      d="M7.5 10.5C7.2 11 7 11.5 7 12c0 3.9 3.1 7 7 7 1.8 0 3.4-.7 4.7-1.8"
                    />
                    <path
                      strokeLinecap="round"
                      d="M4 12c0-4.4 3.6-8 8-8 3.2 0 6 1.9 7.2 4.6"
                    />
                    <path strokeLinecap="round" d="M12 15v3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-xs font-bold text-slate-800">
            {actionLoading ? 'Memproses presensi...' : buttonLabel}
          </p>
          {!isLocationValid && !isCompleted && !isNonCheckIn && (
            <p className="mt-1 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full inline-block">
              {buttonSubtext}
            </p>
          )}
        </div>
      </section>

      {/* Riwayat Terkini Bar */}
      <div className="space-y-2 pt-2 border-t border-slate-200/70">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase tracking-wider">
            <svg
              className="w-4 h-4 stroke-current stroke-2 fill-none"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 7v5l3 2" />
            </svg>
            Riwayat Terkini
          </div>
          <Link
            href="/riwayat"
            className="font-bold text-sky-700 hover:text-sky-800 flex items-center gap-0.5"
          >
            Lihat Semua
            <svg
              className="w-3.5 h-3.5 stroke-current stroke-2 fill-none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {todayAttendance ? (
          <div className="bg-white rounded-xl p-3 border border-blue-50 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  todayAttendance.status === 'Hadir'
                    ? 'bg-emerald-100 text-emerald-800'
                    : todayAttendance.status === 'Telat'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {todayAttendance.status.slice(0, 1)}
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  Hari Ini ({todayAttendance.status})
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Masuk: {formatTimeHM(todayAttendance.check_in)} | Pulang:{' '}
                  {formatTimeHM(todayAttendance.check_out)}
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                todayAttendance.check_out
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : todayAttendance.check_in
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {todayAttendance.check_out
                ? 'Selesai'
                : todayAttendance.check_in
                ? 'Masuk'
                : todayAttendance.status}
            </span>
          </div>
        ) : (
          <div className="bg-white/60 rounded-xl p-3 border border-dashed border-slate-200 text-center text-xs text-slate-400">
            Belum ada catatan presensi hari ini
          </div>
        )}
      </div>
    </div>
  )
}
