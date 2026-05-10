import Link from 'next/link'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#E8E3D8' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#C4622D' }}
            >
              <span className="text-white font-bold text-sm leading-none">AW</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>
              Client Report Portal
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/clients/new"
              className="text-sm font-medium transition-colors"
              style={{ color: '#6B6560' }}
            >
              Add Client
            </Link>
            <a
              href="/api/auth/logout"
              className="text-sm transition-colors"
              style={{ color: '#6B6560' }}
            >
              Logout
            </a>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
