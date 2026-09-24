import assert from 'node:assert/strict'
import {
  validateEmail,
  validateNisn,
  validatePassword,
  validateFullName,
} from './validation.ts'

// Email checks
assert.equal(validateEmail(''), 'Email wajib diisi')
assert.equal(validateEmail('invalid-email'), 'Format email tidak valid (contoh: siswa@sekolah.sch.id)')
assert.equal(validateEmail('user@'), 'Format email tidak valid (contoh: siswa@sekolah.sch.id)')
assert.equal(validateEmail('user@domain'), 'Format email tidak valid (contoh: siswa@sekolah.sch.id)')
assert.equal(validateEmail('valid.student@domain.sch.id'), null)
assert.equal(validateEmail('student@gmail.com'), null)

// NISN checks
assert.equal(validateNisn(''), 'NISN wajib diisi')
assert.equal(validateNisn('12345'), 'NISN harus tepat 10 digit angka')
assert.equal(validateNisn('123456789a'), 'NISN harus berupa angka saja')
assert.equal(validateNisn('0012345678'), null)

// Password checks
assert.equal(validatePassword(''), 'Password wajib diisi')
assert.equal(validatePassword('short1'), 'Password minimal 8 karakter')
assert.equal(validatePassword('onlyletters'), 'Password harus kombinasi huruf dan angka')
assert.equal(validatePassword('12345678'), 'Password harus kombinasi huruf dan angka')
assert.equal(validatePassword('Passw0rd'), null)

// Full Name checks
assert.equal(validateFullName(''), 'Nama lengkap wajib diisi')
assert.equal(validateFullName('A'), 'Nama minimal 2 karakter')
assert.equal(validateFullName('Budi123'), 'Nama hanya boleh berisi huruf dan spasi')
assert.equal(validateFullName('Ahmad Dahlan'), null)

console.log('All validation assertions passed.')
