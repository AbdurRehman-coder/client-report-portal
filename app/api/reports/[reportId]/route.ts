import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params

  const report = await prisma.quarterlyReport.findUnique({
    where: { id: reportId },
    include: { client: { include: { accounts: true, liabilities: true } } },
  })
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const accountBalances = JSON.parse(report.accountBalancesJson) as Array<{
    accountId: string
    balance: number
    cashBalance: number | null
    asOfDate: string
  }>
  const liabilityBalances = JSON.parse(report.liabilityBalancesJson) as Array<{
    liabilityId: string
    balance: number
  }>

  // Enrich account balances with account details
  const enrichedAccountBalances = accountBalances.map(entry => {
    const account = report.client.accounts.find(a => a.id === entry.accountId)
    return {
      ...entry,
      owner: account?.owner ?? null,
      category: account?.category ?? null,
      accountType: account?.accountType ?? null,
      institutionName: account?.institutionName ?? null,
      accountNumberLast4: account?.accountNumberLast4 ?? null,
    }
  })

  // Enrich liability balances with liability details
  const enrichedLiabilityBalances = liabilityBalances.map(entry => {
    const liability = report.client.liabilities.find(l => l.id === entry.liabilityId)
    return {
      ...entry,
      liabilityType: liability?.liabilityType ?? null,
      interestRate: liability?.interestRate ?? null,
    }
  })

  return NextResponse.json({
    ...report,
    accountBalances: enrichedAccountBalances,
    liabilityBalances: enrichedLiabilityBalances,
  })
}
