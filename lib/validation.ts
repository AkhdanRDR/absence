// ponytail: standalone validator functions -> zod schema if forms grow past 5 fields
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const NISN_REGEX = /^\d{10}$/
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
export const NAME_REGEX = /^[a-zA-Z\s'.`-]{2,}$/

export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Email wajib diisi'
  if (!EMAIL_REGEX.test(trimmed)) return 'Format email tidak valid (contoh: siswa@sekolah.sch.id)'
  return null
}

export function validateNisn(nisn: string): string | null {
  const trimmed = nisn.trim()
  if (!trimmed) return 'NISN wajib diisi'
  if (!/^\d+$/.test(trimmed)) return 'NISN harus berupa angka saja'
  if (trimmed.length !== 10) return 'NISN harus tepat 10 digit angka'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password wajib diisi'
  if (password.length < 8) return 'Password minimal 8 karakter'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password harus kombinasi huruf dan angka'
  }
  return null
}

export function validateFullName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Nama lengkap wajib diisi'
  if (trimmed.length < 2) return 'Nama minimal 2 karakter'
  if (!NAME_REGEX.test(trimmed)) return 'Nama hanya boleh berisi huruf dan spasi'
  return null
}
