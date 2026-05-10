import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCurrencyShort } from '@/lib/calculations'

type Params = { params: Promise<{ id: string; reportId: string }> }

function DataRow({
  label,
  value,
  accent,
  divider,
}: {
  label: string
  value: string
  accent?: boolean
  divider?: boolean
}) {
  return (
    <>
      {divider && <div className="my-2" style={{ borderTop: '1px solid #E8E3D8' }} />}
      <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F5F0E8' }}>
        <span className="text-sm" style={{ color: '#6B6560' }}>{label}</span>
        <span
          className={`text-sm ${accent ? 'font-bold text-base' : 'font-medium'}`}
          style={{ color: accent ? '#C4622D' : '#1A1A1A' }}
        >
          {value}
        </span>
      </div>
    </>
  )
}

export default async function ReportPreviewPage({ params }: Params) {
  const { id, reportId } = await params

  const report = await prisma.quarterlyReport.findUnique({
    where: { id: reportId },
    include: { client: { include: { liabilities: true } } },
  })
  if (!report || report.clientId !== id) notFound()

  const client = report.client
  const displayName = client.isMarried
    ? `${client.c1FirstName} & ${client.c2FirstName} ${client.c1LastName}`
    : `${client.c1FirstName} ${client.c1LastName}`

  const prFunded = report.privateReserveBalance >= report.privateReserveTarget
  const prDiff = Math.abs(report.privateReserveBalance - report.privateReserveTarget)

  const storedLiabBalances: Array<{ liabilityId: string; balance: number }> = JSON.parse(
    report.liabilityBalancesJson
  )
  const liabsWithBalances = client.liabilities.map(l => ({
    ...l,
    reportBalance: storedLiabBalances.find(b => b.liabilityId === l.id)?.balance ?? l.balance,
  }))

  const pdfUrl = `/api/reports/${reportId}/pdf`

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/clients/${id}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm flex-shrink-0"
            style={{ borderColor: '#E8E3D8', color: '#6B6560', backgroundColor: 'white' }}
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>
              {report.quarterLabel} Report — {displayName}
            </h1>
            <p className="text-sm" style={{ color: '#6B6560' }}>
              Generated {report.reportDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/clients/${id}/report/${reportId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: '#E8E3D8', color: '#1A1A1A', backgroundColor: 'white' }}
          >
            Edit / Revise
          </Link>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
          >
            Download PDF ↓
          </a>
        </div>
      </div>

      {/* ── Two-column summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* SACS card */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E8E3D8' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B6560' }}>
            SACS — Monthly Cashflow
          </h2>

          <DataRow label="Monthly Inflow" value={`${formatCurrencyShort(report.inflowMonthly)}/mo`} />
          <DataRow label="Monthly Outflow" value={`${formatCurrencyShort(report.outflowMonthly)}/mo`} />
          <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F5F0E8' }}>
            <span className="text-sm" style={{ color: '#6B6560' }}>Monthly Excess</span>
            <span className="text-sm font-medium px-2 py-0.5 rounded" style={{ color: '#166534', backgroundColor: '#DCFCE7' }}>
              {formatCurrencyShort(report.excessMonthly)}/mo
            </span>
          </div>

          <DataRow label="Private Reserve (current)" value={formatCurrencyShort(report.privateReserveBalance)} divider />
          <DataRow label="Private Reserve Target" value={formatCurrencyShort(report.privateReserveTarget)} />
          <div className="my-2 px-3 py-2 rounded-lg text-sm font-medium" style={{
            backgroundColor: prFunded ? '#DCFCE7' : '#FEF3C7',
            color: prFunded ? '#166534' : '#92400E',
          }}>
            {prFunded ? '✅' : '⚠️'} {prFunded ? 'Funded' : 'Short'} — {formatCurrencyShort(prDiff)} {prFunded ? 'above' : 'below'} target
          </div>
          <DataRow label="Investment Account (Schwab)" value={formatCurrencyShort(report.investmentAccountBalance)} />

          <div className="mt-3 pt-2" style={{ borderTop: '1px solid #E8E3D8' }}>
            <DataRow label={`${client.c1FirstName} Monthly Salary`} value={`${formatCurrencyShort(client.monthlySalaryC1)}/mo`} />
            {client.isMarried && (
              <DataRow label={`${client.c2FirstName} Monthly Salary`} value={`${formatCurrencyShort(client.monthlySalaryC2)}/mo`} />
            )}
          </div>
        </div>

        {/* TCC card */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E8E3D8' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B6560' }}>
            TCC — Net Worth Breakdown
          </h2>

          {report.retirementTotalC1 > 0 && (
            <DataRow
              label={`${client.c1FirstName} Retirement Total`}
              value={formatCurrencyShort(report.retirementTotalC1)}
            />
          )}
          {client.isMarried && report.retirementTotalC2 > 0 && (
            <DataRow
              label={`${client.c2FirstName} Retirement Total`}
              value={formatCurrencyShort(report.retirementTotalC2)}
            />
          )}
          {report.nonRetirementTotal > 0 && (
            <DataRow label="Non-Retirement Total" value={formatCurrencyShort(report.nonRetirementTotal)} />
          )}
          {client.trustEnabled && report.trustValueThisQuarter > 0 && (
            <DataRow label="Trust Value" value={formatCurrencyShort(report.trustValueThisQuarter)} />
          )}

          <div className="flex items-center justify-between py-3 mt-1" style={{ borderTop: '1.5px solid #E8E3D8' }}>
            <span className="text-base font-semibold" style={{ color: '#1A1A1A' }}>GRAND TOTAL NET WORTH</span>
            <span className="text-xl font-bold" style={{ color: '#C4622D' }}>
              {formatCurrencyShort(report.grandTotalNetWorth)}
            </span>
          </div>

          {/* Liabilities breakdown */}
          {liabsWithBalances.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E8E3D8' }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#6B6560' }}>
                Liabilities (display only)
              </p>
              {liabsWithBalances.map(l => (
                <DataRow
                  key={l.id}
                  label={`${l.liabilityType} (${l.interestRate}%)`}
                  value={formatCurrencyShort(l.reportBalance)}
                />
              ))}
              <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: '1px solid #E8E3D8' }}>
                <span className="text-sm font-medium" style={{ color: '#6B6560' }}>Total Liabilities</span>
                <span className="text-sm font-semibold" style={{ color: '#6B6560' }}>
                  {formatCurrencyShort(report.totalLiabilities)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Download CTA ── */}
      <div
        className="rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E3D8' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Download Client Report PDF</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B6560' }}>
            Includes SACS Page 1 (cashflow diagram), SACS Page 2 (long-term), and TCC (full net worth chart)
          </p>
        </div>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary px-6 py-2.5 rounded-lg text-sm font-medium flex-shrink-0"
        >
          Download PDF ↓
        </a>
      </div>
    </div>
  )
}
