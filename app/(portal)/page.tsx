export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ClientsTable from '@/components/dashboard/ClientsTable'

function StatCard({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#E8E3D8' }}>
      <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#6B6560' }}>{label}</p>
      <p className="text-3xl font-semibold mb-1" style={{ color: '#1A1A1A' }}>{value}</p>
      <p className="text-xs" style={{ color: '#6B6560' }}>{description}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const [clients, totalReports] = await Promise.all([
    prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        accounts: true,
        liabilities: true,
        reports: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    prisma.quarterlyReport.count(),
  ])

  const totalClients = clients.length
  const missingReports = clients.filter((c) => c.reports.length === 0).length

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1A1A1A' }}>
            AW Client Report Portal
          </h1>
          <p className="text-sm" style={{ color: '#6B6560' }}>
            Anderson Wealth Management — internal reporting dashboard
          </p>
        </div>
        <Link
          href="/clients/new"
          className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Client
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Clients"
          value={totalClients}
          description="Active household files"
        />
        <StatCard
          label="Households"
          value={totalClients}
          description="One file per household"
        />
        <StatCard
          label="Reports Generated"
          value={totalReports}
          description="Quarterly reports total"
        />
        <StatCard
          label="Missing Reports"
          value={missingReports}
          description={missingReports === 0 ? 'All clients have reports' : 'Clients with no reports yet'}
        />
      </div>

      {/* Clients table */}
      <ClientsTable clients={clients} />
    </div>
  )
}
