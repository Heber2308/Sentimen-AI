'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, AlertCircle, Loader } from 'lucide-react'
import { signInWithKampusEmail } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signInWithKampusEmail(formData.email, formData.password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Redirect ke dashboard atau halaman awal
    router.push('/dashboard')
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
          <h1 className="text-3xl font-bold text-white mb-1">Suara Kampus</h1>
          <p className="text-sm text-slate-400">
            Universitas Satya Terra Bhinneka
          </p>
          <p className="text-xs text-slate-500 mt-3">
            Portal Aspirasi Sivitas Akademika
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
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
              Gunakan email kampus: <code className="bg-slate-900/50 px-1.5 py-0.5 rounded">2403310001@students.satyaterrabhinneka.ac.id</code>
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
                placeholder="••••••••"
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
                Masuk...
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/50" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-gradient-to-br from-[#08111f] via-[#0a1428] to-[#06140f] text-slate-500">
              atau
            </span>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-slate-400">
          Belum punya akun?{' '}
          <Link
            href="/signup"
            className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            Daftar di sini
          </Link>
        </p>

        {/* Forgot Password */}
        <p className="text-center text-xs text-slate-500 mt-3">
          <Link
            href="/forgot-password"
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            Lupa password?
          </Link>
        </p>

        {/* Info Box */}
        <div className="mt-8 p-4 rounded-lg bg-amber-950/20 border border-amber-900/30">
          <p className="text-xs text-amber-200/80">
            <span className="font-medium">✓ Email kampus diperlukan</span> untuk mengakses portal aspirasi. 
            Pastikan Anda menggunakan email akademik resmi dari Universitas Satya Terra Bhinneka.
          </p>
        </div>
      </div>
    </div>
  )
}
