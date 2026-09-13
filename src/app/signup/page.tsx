'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { signUpWithKampusEmail, isValidKampusEmail } from '@/lib/auth'

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    namaLengkap: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const validateForm = (): string | null => {
    if (!formData.namaLengkap.trim()) {
      return 'Nama lengkap harus diisi'
    }
    if (!isValidKampusEmail(formData.email)) {
      return 'Email harus format kampus: 2403310001@students.satyaterrabhinneka.ac.id'
    }
    if (formData.password.length < 8) {
      return 'Password minimal 8 karakter'
    }
    if (formData.password !== formData.passwordConfirm) {
      return 'Password tidak sesuai'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    const result = await signUpWithKampusEmail(
      formData.email,
      formData.password,
      formData.namaLengkap
    )

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#08111f] via-[#0a1428] to-[#06140f] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 p-1 mb-4 shadow-lg shadow-amber-500/30">
            <div className="w-full h-full bg-[#0a1428] rounded-xl flex items-center justify-center">
              <div className="text-2xl">🎓</div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Daftar</h1>
          <p className="text-sm text-slate-400">
            Bergabunglah dengan Suara Kampus
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-950/30 border border-green-900/50 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-200">Akun berhasil dibuat!</p>
              <p className="text-xs text-green-200/70 mt-1">
                Silakan cek email Anda untuk verifikasi. Anda akan dialihkan ke halaman login...
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="namaLengkap" className="block text-xs font-medium text-slate-300 mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  id="namaLengkap"
                  name="namaLengkap"
                  type="text"
                  value={formData.namaLengkap}
                  onChange={handleChange}
                  placeholder="Nama Anda"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-2">
                Email Kampus
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="2403310001@students.satyaterrabhinneka.ac.id"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Email harus: <code className="bg-slate-900/50 px-1 py-0.5 rounded">@students.satyaterrabhinneka.ac.id</code>
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-xs font-medium text-slate-300 mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  placeholder="Masukkan password lagi"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Membuat akun...
                </>
              ) : (
                'Daftar'
              )}
            </button>
          </form>
        )}

        {/* Sign In Link */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Sudah punya akun?{' '}
          <Link
            href="/login"
            className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            Masuk di sini
          </Link>
        </p>

        {/* Info Box */}
        <div className="mt-8 p-4 rounded-lg bg-amber-950/20 border border-amber-900/30">
          <p className="text-xs text-amber-200/80">
            <span className="font-medium">✓ Email kampus wajib</span> untuk mendaftar. Akun Anda akan 
            diperlakukan sebagai mahasiswa dengan akses ke portal aspirasi.
          </p>
        </div>
      </div>
    </div>
  )
}
