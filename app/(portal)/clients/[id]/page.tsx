import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatCurrencyShort, calcAge, calcPrivateReserveTarget } from '@/lib/calculations'

type Params = { params: Promise<{ id: string }> }

const CARD = 'bg-white rounded-xl border p-6'
const CARD_STYLE = { borderColor: '#E8E3D8' }
const LABEL = 'text-xs font-medium uppercase tracking-wide mb-1'
const LABEL_STYLE = { color: '#6B6560' }
const VALUE_STYLE = { color: '#1A1A1A' }

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className={LABEL} style={LABEL_STYLE}>{label}</p>
      <p className="text-sm font-medium" style={VALUE_STYLE}>{value}</p>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide mb-3 mt-5 first:mt-0" style={{ color: '#6B6560' }}>
      {children}
    </h3>
  )
}

export default async function ClientProfilePage({ params }: Params) {
  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      accounts: true,
      liabilities: true,
      reports: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!client) notFound()

  const displayName = client.isMarried
    ? `${client.c1FirstName} & ${client.c2FirstName} ${client.c1LastName}`
    : `${client.c1FirstName} ${client.c1LastName}`

  const c1Age = calcAge(client.c1Dob)
  const c2Age = client.c2Dob ? calcAge(client.c2Dob) : null
  const totalInflow = client.monthlySalaryC1 + client.monthlySalaryC2
  const reserveTarget = calcPrivateReserveTarget(client.monthlyExpenseBudget, client.insuranceDeductibles)

  const c1Retirement = client.accounts.filter(a => a.category === 'retirement' && a.owner === 'client1')
  const c2Retirement = client.accounts.filter(a => a.category === 'retirement' && a.owner === 'client2')
  const nonRetirement = client.accounts.filter(a => a.category === 'non-retirement')

  const ownerLabel = (owner: string) =>
    owner === 'client1' ? client.c1FirstName
    : owner === 'client2' ? (client.c2FirstName ?? 'Client 2')
    : 'Joint'

  return (
    <div className="space-y-6">
      {/* ── Header card ── */}
      <div className={CARD} style={CARD_STYLE}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2" style={VALUE_STYLE}>{displayName}</h1>
            <div className="flex items-center gap-2">
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
              {client.trustEnabled && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                  style={{ backgroundColor: '#F0FDF4', color: '#15803D', borderColor: '#BBF7D0' }}>
                  Trust Enabled
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/clients/${id}/edit`}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ borderColor: '#E8E3D8', color: '#1A1A1A', backgroundColor: 'white' }}
            >
              Edit Profile
            </Link>
            <Link
              href={`/clients/${id}/report`}
              className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
            >
              Generate Report
            </Link>
            <Link
              href="/"
              className="w-9 h-9 flex items-center justify-center rounded-lg border text-sm transition-colors"
              style={{ borderColor: '#E8E3D8', color: '#6B6560', backgroundColor: 'white' }}
              title="Back to dashboard"
            >
              ←
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 1: Household + Financials ── */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: client info */}
        <div className="space-y-4">
          {/* Client 1 */}
          <div className={CARD} style={CARD_STYLE}>
            <SectionHeading>Client 1 — Primary</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" value={`${client.c1FirstName} ${client.c1LastName}`} />
              <Field label="Date of Birth" value={client.c1Dob} />
              <Field label="Age" value={`${c1Age} years old`} />
              <Field label="SSN Last 4" value={`••••${client.c1SsnLast4}`} />
            </div>
          </div>

          {/* Client 2 */}
          {client.isMarried && client.c2FirstName && (
            <div className={CARD} style={CARD_STYLE}>
              <SectionHeading>Client 2 — Spouse</SectionHeading>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" value={`${client.c2FirstName} ${client.c2LastName ?? ''}`} />
                <Field label="Date of Birth" value={client.c2Dob ?? '—'} />
                <Field label="Age" value={c2Age !== null ? `${c2Age} years old` : '—'} />
                <Field label="SSN Last 4" value={client.c2SsnLast4 ? `••••${client.c2SsnLast4}` : '—'} />
              </div>
            </div>
          )}

          {client.reports.length > 0 && (
            <p className="text-xs px-1" style={{ color: '#6B6560' }}>
              Last report: {client.reports[0].quarterLabel} ({client.reports[0].reportDate})
            </p>
          )}
        </div>

        {/* Right: Static Financials */}
        <div className={CARD} style={CARD_STYLE}>
          <SectionHeading>Static Financials (Monthly)</SectionHeading>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F5F0E8' }}>
              <span className="text-sm" style={{ color: '#6B6560' }}>
                {client.c1FirstName}&apos;s Monthly Salary
              </span>
              <span className="text-sm font-medium" style={VALUE_STYLE}>
                {formatCurrencyShort(client.monthlySalaryC1)}/mo
              </span>
            </div>
            {client.isMarried && (
              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F5F0E8' }}>
                <span className="text-sm" style={{ color: '#6B6560' }}>
                  {client.c2FirstName}&apos;s Monthly Salary
                </span>
                <span className="text-sm font-medium" style={VALUE_STYLE}>
                  {formatCurrencyShort(client.monthlySalaryC2)}/mo
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#E8E3D8' }}>
              <span className="text-sm font-semibold" style={VALUE_STYLE}>Total Monthly Inflow</span>
              <span className="text-sm font-bold" style={{ color: '#C4622D' }}>
                {formatCurrencyShort(totalInflow)}/mo
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F5F0E8' }}>
              <span className="text-sm" style={{ color: '#6B6560' }}>Monthly Expense Budget</span>
              <span className="text-sm font-medium" style={VALUE_STYLE}>
                {formatCurrencyShort(client.monthlyExpenseBudget)}/mo
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F5F0E8' }}>
              <span className="text-sm" style={{ color: '#6B6560' }}>Insurance Deductibles</span>
              <span className="text-sm font-medium" style={VALUE_STYLE}>
                {formatCurrency(client.insuranceDeductibles)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 rounded-lg px-3"
              style={{ backgroundColor: '#F5F0E8' }}>
              <div>
                <span className="text-sm font-semibold" style={VALUE_STYLE}>Private Reserve Target</span>
                <p className="text-xs mt-0.5" style={{ color: '#6B6560' }}>
                  6 × {formatCurrencyShort(client.monthlyExpenseBudget)} + {formatCurrencyShort(client.insuranceDeductibles)}
                </p>
              </div>
              <span className="text-sm font-bold" style={{ color: '#2D6A4F' }}>
                {formatCurrencyShort(reserveTarget)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Accounts + Trust ── */}
      <div className="grid grid-cols-2 gap-6">
        {/* Accounts */}
        <div className={CARD} style={CARD_STYLE}>
          <h2 className="font-semibold text-sm mb-4" style={VALUE_STYLE}>Accounts</h2>

          {c1Retirement.length > 0 && (
            <>
              <SectionHeading>Retirement — {client.c1FirstName}</SectionHeading>
              <div className="space-y-2 mb-4">
                {c1Retirement.map(acct => (
                  <div key={acct.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                    style={{ backgroundColor: '#F5F0E8' }}>
                    <div>
                      <p className="text-sm font-medium" style={VALUE_STYLE}>{acct.accountType}</p>
                      <p className="text-xs" style={{ color: '#6B6560' }}>
                        {acct.institutionName}{acct.accountNumberLast4 ? ` ····${acct.accountNumberLast4}` : ''}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ backgroundColor: '#FFF7ED', color: '#C2410C' }}>
                      Retirement
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {client.isMarried && c2Retirement.length > 0 && (
            <>
              <SectionHeading>Retirement — {client.c2FirstName}</SectionHeading>
              <div className="space-y-2 mb-4">
                {c2Retirement.map(acct => (
                  <div key={acct.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                    style={{ backgroundColor: '#F5F0E8' }}>
                    <div>
                      <p className="text-sm font-medium" style={VALUE_STYLE}>{acct.accountType}</p>
                      <p className="text-xs" style={{ color: '#6B6560' }}>
                        {acct.institutionName}{acct.accountNumberLast4 ? ` ····${acct.accountNumberLast4}` : ''}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ backgroundColor: '#FFF7ED', color: '#C2410C' }}>
                      Retirement
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {nonRetirement.length > 0 && (
            <>
              <SectionHeading>Non-Retirement</SectionHeading>
              <div className="space-y-2">
                {nonRetirement.map(acct => (
                  <div key={acct.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                    style={{ backgroundColor: '#F5F0E8' }}>
                    <div>
                      <p className="text-sm font-medium" style={VALUE_STYLE}>{acct.accountType}</p>
                      <p className="text-xs" style={{ color: '#6B6560' }}>
                        {acct.institutionName}{acct.accountNumberLast4 ? ` ····${acct.accountNumberLast4}` : ''}
                        {' · '}{ownerLabel(acct.owner)}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                      Non-Ret.
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {client.accounts.length === 0 && (
            <p className="text-sm" style={{ color: '#6B6560' }}>No accounts added yet.</p>
          )}
        </div>

        {/* Trust */}
        <div className={CARD} style={CARD_STYLE}>
          <h2 className="font-semibold text-sm mb-4" style={VALUE_STYLE}>Trust</h2>
          {client.trustEnabled ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: '#6B6560' }}>Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                  style={{ backgroundColor: '#F0FDF4', color: '#15803D', borderColor: '#BBF7D0' }}>
                  Enabled
                </span>
              </div>
              {client.trustPropertyAddress && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide mb-1" style={LABEL_STYLE}>Property Address</p>
                  <p className="text-sm" style={VALUE_STYLE}>{client.trustPropertyAddress}</p>
                </div>
              )}
              {client.trustPropertyValue != null && (
                <div className="pt-3 border-t" style={{ borderColor: '#F5F0E8' }}>
                  <p className="text-xs font-medium uppercase tracking-wide mb-1" style={LABEL_STYLE}>Current Value</p>
                  <p className="text-xl font-semibold" style={{ color: '#2D6A4F' }}>
                    {formatCurrency(client.trustPropertyValue)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#6B6560' }}>Updated quarterly via Zillow</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24">
              <p className="text-sm" style={{ color: '#6B6560' }}>No trust established</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Liabilities ── */}
      <div className={CARD} style={CARD_STYLE}>
        <h2 className="font-semibold text-sm mb-4" style={VALUE_STYLE}>
          Liabilities
          <span className="ml-2 text-xs font-normal" style={{ color: '#6B6560' }}>
            — displayed separately, not subtracted from net worth
          </span>
        </h2>
        {client.liabilities.length === 0 ? (
          <p className="text-sm" style={{ color: '#6B6560' }}>No liabilities recorded.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E3D8' }}>
                {['Type', 'Interest Rate', 'Current Balance'].map(h => (
                  <th key={h} className="text-left pb-3 text-xs font-medium uppercase tracking-wide"
                    style={{ color: '#6B6560' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {client.liabilities.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: i < client.liabilities.length - 1 ? '1px solid #F5F0E8' : 'none' }}>
                  <td className="py-3 text-sm font-medium" style={VALUE_STYLE}>{l.liabilityType}</td>
                  <td className="py-3 text-sm" style={{ color: '#6B6560' }}>{l.interestRate}%</td>
                  <td className="py-3 text-sm font-semibold" style={VALUE_STYLE}>{formatCurrency(l.balance)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #E8E3D8' }}>
                <td className="pt-3 text-sm font-semibold" style={VALUE_STYLE}>Total</td>
                <td />
                <td className="pt-3 text-sm font-bold" style={VALUE_STYLE}>
                  {formatCurrency(client.liabilities.reduce((s, l) => s + l.balance, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* ── Section 4: Report History ── */}
      <div className={CARD} style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm" style={VALUE_STYLE}>
            Past Reports
            <span className="ml-2 text-xs font-normal" style={{ color: '#6B6560' }}>
              ({client.reports.length})
            </span>
          </h2>
          <Link
            href={`/clients/${id}/report`}
            className="btn-primary px-3 py-1.5 rounded-lg text-xs font-medium"
          >
            + Generate Report
          </Link>
        </div>

        {client.reports.length === 0 ? (
          <div className="text-center py-10 rounded-xl" style={{ backgroundColor: '#F5F0E8' }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>No reports generated yet</p>
            <p className="text-xs mb-4" style={{ color: '#6B6560' }}>
              Create the first quarterly report for this client.
            </p>
            <Link
              href={`/clients/${id}/report`}
              className="btn-primary inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium"
            >
              Generate Report
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E3D8' }}>
                {['Quarter', 'Date Generated', 'Net Worth', 'Download', 'Actions'].map(h => (
                  <th key={h} className="text-left pb-3 text-xs font-medium uppercase tracking-wide"
                    style={{ color: '#6B6560' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {client.reports.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < client.reports.length - 1 ? '1px solid #F5F0E8' : 'none' }}>
                  <td className="py-3 text-sm font-semibold" style={VALUE_STYLE}>{r.quarterLabel}</td>
                  <td className="py-3 text-sm" style={{ color: '#6B6560' }}>{r.reportDate}</td>
                  <td className="py-3 text-sm font-medium" style={VALUE_STYLE}>
                    {formatCurrencyShort((r as unknown as Record<string, number>).grandTotalNetWorth ?? 0)}
                  </td>
                  <td className="py-3">
                    <a
                      href={`/api/reports/${r.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium btn-primary"
                    >
                      Download PDF ↓
                    </a>
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/clients/${id}/report/${r.id}`}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border transition-colors"
                      style={{ borderColor: '#E8E3D8', color: '#1A1A1A', backgroundColor: 'white' }}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
