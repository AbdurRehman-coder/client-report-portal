'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrencyShort } from '@/lib/calculations'

type Account = { id: string; category: string; owner: string; accountType: string }
type Liability = { id: string }
type Report = { id: string; quarterLabel: string; reportDate: string }

type ClientRow = {
  id: string
  isMarried: boolean
  c1FirstName: string
  c1LastName: string
  c2FirstName: string | null
  c2LastName: string | null
  monthlySalaryC1: number
  monthlySalaryC2: number
  monthlyExpenseBudget: number
  trustEnabled: boolean
  accounts: Account[]
  liabilities: Liability[]
  reports: Report[]
}

const TD = 'px-4 py-3 text-sm'
const TH = 'px-4 py-3 text-xs font-medium uppercase tracking-wide text-left whitespace-nowrap'

function DeleteModal({
  name,
  reportCount,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string
  reportCount: number
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" style={{ border: '1px solid #E8E3D8' }}>
        <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1A1A' }}>
          Delete {name}?
        </h3>
        <p className="text-sm mb-5" style={{ color: '#6B6560' }}>
          This will permanently delete all their data including{' '}
          <strong>{reportCount} {reportCount === 1 ? 'report' : 'reports'}</strong>.
          This cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50"
            style={{ borderColor: '#E8E3D8', color: '#1A1A1A', backgroundColor: 'white' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: loading ? '#991B1B' : '#DC2626' }}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; reportCount: number } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenId(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = clients.filter((c) => {
    const name = `${c.c1FirstName} ${c.c1LastName} ${c.c2FirstName ?? ''} ${c.c2LastName ?? ''}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    try {
      const res = await fetch(`/api/clients/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setDeleteTarget(null)
      router.refresh()
    } catch {
      alert('Failed to delete client. Please try again.')
    } finally {
      setDeletingId(null)
      setOpenId(null)
    }
  }, [deleteTarget, router])

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          reportCount={deleteTarget.reportCount}
          loading={!!deletingId}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E8E3D8' }}>
        {/* Table header row */}
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: '#E8E3D8' }}>
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>Clients</h2>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#F5F0E8', color: '#6B6560' }}
            >
              {filtered.length}
            </span>
          </div>
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 w-48"
            style={{
              borderColor: '#E8E3D8',
              backgroundColor: '#F5F0E8',
              color: '#1A1A1A',
            }}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center" style={{ color: '#6B6560' }}>
            <p className="text-sm">{search ? 'No clients match your search.' : 'No clients yet. Add your first client.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#F5F0E8', borderBottom: '1px solid #E8E3D8' }}>
                  <th className={TH} style={{ color: '#6B6560' }}>Name</th>
                  <th className={TH} style={{ color: '#6B6560' }}>Status</th>
                  <th className={TH} style={{ color: '#6B6560' }}>Last Report</th>
                  <th className={TH} style={{ color: '#6B6560' }}>Monthly Salary</th>
                  <th className={TH} style={{ color: '#6B6560' }}>Monthly Expenses</th>
                  <th className={TH} style={{ color: '#6B6560' }}>Accounts</th>
                  <th className={TH} style={{ color: '#6B6560' }}>Trust</th>
                  <th className={TH} style={{ color: '#6B6560' }}>Liabilities</th>
                  <th className={TH} style={{ color: '#6B6560' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => {
                  const displayName = client.isMarried
                    ? `${client.c1FirstName} & ${client.c2FirstName} ${client.c1LastName}`
                    : `${client.c1FirstName} ${client.c1LastName}`

                  const lastReport = client.reports[0]
                  const retCount = client.accounts.filter(a => a.category === 'retirement').length
                  const nrCount = client.accounts.filter(a => a.category === 'non-retirement').length
                  const totalAccounts = retCount + nrCount
                  const totalSalary = client.monthlySalaryC1 + client.monthlySalaryC2
                  const isDeleting = deletingId === client.id
                  const isLast = i === filtered.length - 1

                  return (
                    <tr
                      key={client.id}
                      className="transition-colors hover:bg-[#FDFCFA]"
                      style={{ borderBottom: isLast ? 'none' : '1px solid #E8E3D8' }}
                    >
                      {/* Name */}
                      <td className={TD}>
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-medium hover:underline"
                          style={{ color: '#1A1A1A' }}
                        >
                          {displayName}
                        </Link>
                        {client.isMarried && (
                          <div className="text-xs mt-0.5" style={{ color: '#6B6560' }}>
                            {client.c1FirstName} + {client.c2FirstName} {client.c1LastName}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className={TD}>
                        {client.isMarried ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                            style={{ backgroundColor: '#FFF7ED', color: '#C2410C', borderColor: '#FED7AA' }}>
                            Married
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                            style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}>
                            Single
                          </span>
                        )}
                      </td>

                      {/* Last Report */}
                      <td className={TD}>
                        {lastReport ? (
                          <span className="font-medium text-sm" style={{ color: '#1A1A1A' }}>{lastReport.quarterLabel}</span>
                        ) : (
                          <span className="text-xs" style={{ color: '#9CA3AF' }}>No reports yet</span>
                        )}
                      </td>

                      {/* Monthly Salary */}
                      <td className={TD}>
                        <span style={{ color: '#1A1A1A' }}>{formatCurrencyShort(totalSalary)}</span>
                        <span className="text-xs ml-0.5" style={{ color: '#6B6560' }}>/mo</span>
                      </td>

                      {/* Monthly Expenses */}
                      <td className={TD}>
                        <span style={{ color: '#1A1A1A' }}>{formatCurrencyShort(client.monthlyExpenseBudget)}</span>
                        <span className="text-xs ml-0.5" style={{ color: '#6B6560' }}>/mo</span>
                      </td>

                      {/* Accounts */}
                      <td className={TD}>
                        <span className="font-medium" style={{ color: '#1A1A1A' }}>{totalAccounts}</span>
                        <span className="text-xs ml-1" style={{ color: '#6B6560' }}>
                          ({retCount}R / {nrCount}NR)
                        </span>
                      </td>

                      {/* Trust */}
                      <td className={TD}>
                        {client.trustEnabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                            style={{ backgroundColor: '#F0FDF4', color: '#15803D', borderColor: '#BBF7D0' }}>
                            Enabled
                          </span>
                        ) : (
                          <span style={{ color: '#6B6560' }}>—</span>
                        )}
                      </td>

                      {/* Liabilities */}
                      <td className={TD} style={{ color: '#1A1A1A' }}>
                        {client.liabilities.length}
                      </td>

                      {/* Actions */}
                      <td className={TD}>
                        <div className="flex items-center gap-2" ref={openId === client.id ? dropdownRef : undefined}>
                          {/* Generate Report — always visible */}
                          <Link
                            href={`/clients/${client.id}/report`}
                            className="btn-primary inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                          >
                            Generate Report
                          </Link>

                          {/* More dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenId(openId === client.id ? null : client.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border text-sm transition-colors"
                              style={{
                                borderColor: '#E8E3D8',
                                color: '#6B6560',
                                backgroundColor: openId === client.id ? '#F5F0E8' : 'white',
                              }}
                              disabled={isDeleting}
                            >
                              {isDeleting ? <span className="text-xs">…</span> : '⋯'}
                            </button>

                            {openId === client.id && (
                              <div
                                className="absolute right-0 top-8 z-50 w-36 bg-white rounded-xl shadow-lg border py-1"
                                style={{ borderColor: '#E8E3D8' }}
                                ref={dropdownRef}
                              >
                                <Link
                                  href={`/clients/${client.id}`}
                                  onClick={() => setOpenId(null)}
                                  className="flex items-center px-4 py-2 text-sm transition-colors hover:bg-[#F5F0E8]"
                                  style={{ color: '#1A1A1A' }}
                                >
                                  View Profile
                                </Link>
                                <Link
                                  href={`/clients/${client.id}/edit`}
                                  onClick={() => setOpenId(null)}
                                  className="flex items-center px-4 py-2 text-sm transition-colors hover:bg-[#F5F0E8]"
                                  style={{ color: '#1A1A1A' }}
                                >
                                  Edit
                                </Link>
                                <div className="my-1 border-t" style={{ borderColor: '#E8E3D8' }} />
                                <button
                                  onClick={() => {
                                    setOpenId(null)
                                    setDeleteTarget({ id: client.id, name: displayName, reportCount: client.reports.length })
                                  }}
                                  className="w-full flex items-center px-4 py-2 text-sm transition-colors hover:bg-red-50 text-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
