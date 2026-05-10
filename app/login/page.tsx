'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Invalid password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #E8E3D8', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{ backgroundColor: '#C4622D' }}
            >
              <span className="text-white font-bold text-xl">AW</span>
            </div>
            <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>Client Report Portal</h1>
            <p className="text-sm mt-1" style={{ color: '#6B6560' }}>Windbrook Solutions — Internal Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wide mb-1.5"
                style={{ color: '#6B6560' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition"
                style={{
                  border: '1px solid #E8E3D8',
                  color: '#1A1A1A',
                  backgroundColor: 'white',
                }}
                placeholder="Enter portal password"
              />
            </div>

            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full py-2.5 px-4 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#6B6560' }}>
          Secure access — internal use only
        </p>
      </div>
    </div>
  )
}
