'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  // ponytail: client auth signout -> server action when session cookies managed via middleware
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const navItems = [
    {
      label: 'Beranda',
      href: '/',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      ),
    },
    {
      label: 'Ajukan Izin',
      href: '/izin',
      icon: (
        <svg
          className="w-5 h-5 stroke-current stroke-2 fill-none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      label: 'Riwayat',
      href: '/riwayat',
      icon: (
        <svg
          className="w-5 h-5 stroke-current stroke-2 fill-none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#f4f9fd] text-slate-800 flex flex-col min-h-screen sm:min-h-0 sm:rounded-3xl sm:shadow-lg sm:border sm:border-blue-100 overflow-hidden relative pb-24">
        {/* Top Header */}
        <header className="bg-white px-4 py-3.5 flex items-center justify-between border-b border-blue-50">
          <div className="flex items-center gap-3">
            {/* School Logo */}
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

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="Muat Ulang"
              onClick={() => router.refresh()}
              className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-colors"
            >
              <svg
                className="w-4 h-4 stroke-current stroke-2 fill-none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button
              type="button"
              title="Keluar"
              onClick={handleLogout}
              className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-95 transition-colors"
            >
              <svg
                className="w-4 h-4 stroke-current stroke-2 fill-none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1">{children}</main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed sm:absolute bottom-0 left-0 right-0 bg-white border-t border-blue-100 px-6 py-2 flex items-center justify-around z-20">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
                  active
                    ? 'bg-sky-50 border border-sky-100 text-sky-700 font-bold px-5'
                    : 'text-slate-500 hover:text-slate-700 font-medium px-4'
                }`}
              >
                {item.icon}
                <span className="text-[11px] mt-0.5">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
