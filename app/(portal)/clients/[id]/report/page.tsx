import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentQuarter } from '@/lib/calculations'
import ReportForm from '@/components/forms/ReportForm'
import type { ReportFormProps } from '@/components/forms/ReportForm'

type Params = { params: Promise<{ id: string }> }

export default async function ReportEntryPage({ params }: Params) {
  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      accounts: { orderBy: { id: 'asc' } },
      liabilities: { orderBy: { id: 'asc' } },
      reports: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  if (!client) notFound()

  const lastReport = client.reports[0] ?? null

  // Parse last report prefill data
  const lastAccountBalances: Record<string, { balance: number; cashBalance: number | null }> = {}
  const lastLiabilityBalances: Record<string, number> = {}

  if (lastReport) {
    const accBalances: Array<{ accountId: string; balance: number; cashBalance: number | null }> =
      JSON.parse(lastReport.accountBalancesJson)
    for (const entry of accBalances) {
      lastAccountBalances[entry.accountId] = {
        balance: entry.balance,
        cashBalance: entry.cashBalance ?? null,
      }
    }
    const liabBalances: Array<{ liabilityId: string; balance: number }> =
      JSON.parse(lastReport.liabilityBalancesJson)
    for (const entry of liabBalances) {
      lastLiabilityBalances[entry.liabilityId] = entry.balance
    }
  }

  const inflowMonthly = client.monthlySalaryC1 + (client.isMarried ? client.monthlySalaryC2 : 0)

  const displayName = client.isMarried
    ? `${client.c1FirstName} & ${client.c2FirstName} ${client.c1LastName}`
    : `${client.c1FirstName} ${client.c1LastName}`

  const today = new Date().toISOString().split('T')[0]

  const props: ReportFormProps = {
    clientId: client.id,
    displayName,
    quarterLabel: getCurrentQuarter(),
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
      privateReserveBalance: lastReport?.privateReserveBalance ?? null,
      investmentAccountBalance: lastReport?.investmentAccountBalance ?? null,
      trustValue: lastReport ? (lastReport.trustValueThisQuarter || null) : null,
      accountBalances: lastAccountBalances,
      liabilityBalances: lastLiabilityBalances,
    },
  }

  return <ReportForm {...props} />
}
