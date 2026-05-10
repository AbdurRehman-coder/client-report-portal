import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ReportForm from '@/components/forms/ReportForm'
import type { ReportFormProps } from '@/components/forms/ReportForm'

type Params = { params: Promise<{ id: string; reportId: string }> }

export default async function EditReportPage({ params }: Params) {
  const { id, reportId } = await params

  const report = await prisma.quarterlyReport.findUnique({
    where: { id: reportId },
    include: {
      client: {
        include: {
          accounts: { orderBy: { id: 'asc' } },
          liabilities: { orderBy: { id: 'asc' } },
        },
      },
    },
  })

  if (!report || report.clientId !== id) notFound()

  const client = report.client

  const displayName = client.isMarried
    ? `${client.c1FirstName} & ${client.c2FirstName} ${client.c1LastName}`
    : `${client.c1FirstName} ${client.c1LastName}`

  // Parse stored balances from this report as prefill
  const storedAccBalances: Array<{ accountId: string; balance: number; cashBalance: number | null }> =
    JSON.parse(report.accountBalancesJson)
  const storedLiabBalances: Array<{ liabilityId: string; balance: number }> =
    JSON.parse(report.liabilityBalancesJson)

  const accountBalances: Record<string, { balance: number; cashBalance: number | null }> = {}
  for (const entry of storedAccBalances) {
    accountBalances[entry.accountId] = { balance: entry.balance, cashBalance: entry.cashBalance ?? null }
  }

  const liabilityBalances: Record<string, number> = {}
  for (const entry of storedLiabBalances) {
    liabilityBalances[entry.liabilityId] = entry.balance
  }

  const inflowMonthly = client.monthlySalaryC1 + (client.isMarried ? client.monthlySalaryC2 : 0)
  const today = new Date().toISOString().split('T')[0]

  const props: ReportFormProps = {
    clientId: client.id,
    displayName,
    quarterLabel: `${report.quarterLabel} (revised)`,
    today,
    inflowMonthly,
    outflowMonthly: client.monthlyExpenseBudget,
    insuranceDeductibles: client.insuranceDeductibles,
    isMarried: client.isMarried,
    c1FirstName: client.c1FirstName,
    c2FirstName: client.c2FirstName ?? null,
    trustEnabled: client.trustEnabled,
    trustPropertyAddress: client.trustPropertyAddress ?? null,
    accounts: client.accounts.map(a => ({
      id: a.id,
      owner: a.owner,
      category: a.category,
      accountType: a.accountType,
      institutionName: a.institutionName ?? null,
      accountNumberLast4: a.accountNumberLast4 ?? null,
    })),
    liabilities: client.liabilities.map(l => ({
      id: l.id,
      liabilityType: l.liabilityType,
      interestRate: l.interestRate,
      balance: l.balance,
    })),
    prefill: {
      privateReserveBalance: report.privateReserveBalance,
      investmentAccountBalance: report.investmentAccountBalance,
      trustValue: report.trustValueThisQuarter || null,
      accountBalances,
      liabilityBalances,
    },
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/clients/${id}/report/${reportId}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm flex-shrink-0"
          style={{ borderColor: '#E8E3D8', color: '#6B6560', backgroundColor: 'white' }}
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>
            Revise Report — {report.quarterLabel}
          </h1>
          <p className="text-sm" style={{ color: '#6B6560' }}>
            Saving will create a new &quot;{report.quarterLabel} (revised)&quot; record. The original is preserved.
          </p>
        </div>
      </div>
      <ReportForm {...props} />
    </div>
  )
}
