'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  validateEmail,
  validateFullName,
  validateNisn,
  validatePassword,
} from '@/lib/validation'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [nisn, setNisn] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string
    nisn?: string
    email?: string
    password?: string
  }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ponytail: direct client auth call -> server actions when cookie session sync required
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const nameErr = validateFullName(fullName)
    const nisnErr = validateNisn(nisn)
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)

    if (nameErr || nisnErr || emailErr || passErr) {
      setFieldErrors({
        fullName: nameErr || undefined,
        nisn: nisnErr || undefined,
        email: emailErr || undefined,
        password: passErr || undefined,
      })
      return
    }

    setFieldErrors({})
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          nisn: nisn.trim(),
          role: 'Siswa Reguler',
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/')
      return
    }

    setSuccess('Pendaftaran berhasil. Silakan periksa email atau masuk ke akun Anda.')
    setLoading(false)
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
                Daftar Akun Siswa
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lengkapi data diri untuk akun presensi
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

            {success && (
              <div
                role="status"
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-medium"
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Nama Lengkap
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }))
                  }}
                  placeholder="Nama Lengkap Siswa"
                  required
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    fieldErrors.fullName
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-sky-500'
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="nisn"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  NISN (10 Digit Angka)
                </label>
                <input
                  id="nisn"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={nisn}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setNisn(val)
                    if (fieldErrors.nisn) setFieldErrors((prev) => ({ ...prev, nisn: undefined }))
                  }}
                  placeholder="Contoh: 0012345678"
                  required
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    fieldErrors.nisn
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-sky-500'
                  }`}
                />
                {fieldErrors.nisn && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {fieldErrors.nisn}
                  </p>
                )}
              </div>

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
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  placeholder="siswa@smkn1kepanjen.sch.id"
                  required
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    fieldErrors.email
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-sky-500'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Password (Min. 8 karakter, huruf & angka)
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  placeholder="Minimal 8 karakter"
                  required
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 border text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-sky-500'
                  }`}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Mendaftarkan...' : 'Daftar Akun'}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
              Sudah punya akun?{' '}
              <Link
                href="/login"
                className="font-bold text-sky-600 hover:text-sky-700 underline"
              >
                Masuk di sini
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
