'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="md" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hesap Oluştur</h1>
          <p className="text-gray-500 mt-1">Ücretsiz başlayın</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ad Soyad</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2456DB] transition-colors text-sm"
                placeholder="Ahmet Yılmaz"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2456DB] transition-colors text-sm"
                placeholder="ad@sirket.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2456DB] transition-colors text-sm"
                placeholder="En az 6 karakter"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 rounded-lg px-3 py-2 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2456DB] hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 transition-colors text-sm"
            >
              {loading ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-4">
            Hesabınız var mı?{' '}
            <Link href="/login" className="text-[#2456DB] hover:text-blue-700">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
