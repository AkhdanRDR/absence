'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ponytail: direct client auth call -> server actions when cookie session sync required
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#f4f9fd] text-slate-800 flex flex-col min-h-screen sm:min-h-0 sm:rounded-3xl sm:shadow-lg sm:border sm:border-blue-100 overflow-hidden relative">
        <header className="bg-white px-4 py-3.5 flex items-center justify-between border-b border-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500 border-2 border-amber-400 flex items-center justify-center text-white shadow-sm overflow-hidden">
              <svg
                className="w-6 h-6 text-amber-200"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 12.7L4.16 11.4 12 7.15l7.84 4.25L12 15.7zM6 14.5v3.5c0 2.21 2.69 4 6 4s6-1.79 6-4v-3.5l-6 3.27-6-3.27z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">
                SMK NEGERI 1 KEPANJEN
              </h1>
              <p className="text-[11px] italic text-slate-500 font-medium">
                Lantip, Limpat, Linuwih
              </p>
            </div>
          </div>
        </header>

        <main className="p-4 flex-1 flex flex-col justify-center">
          <section className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Masuk ke Akun
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Presensi Siswa SMK Negeri 1 Kepanjen
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-medium"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="siswa@smkn1kepanjen.sch.id"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
              Belum punya akun?{' '}
              <Link
                href="/register"
                className="font-bold text-sky-600 hover:text-sky-700 underline"
              >
                Daftar sekarang
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
