import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  calcExcess,
  calcPrivateReserveTarget,
  calcRetirementTotal,
  calcNonRetirementTotal,
  calcGrandTotalNetWorth,
  calcTotalLiabilities,
} from '@/lib/calculations'

export async function POST(req: Request) {
  const body = await req.json()

  const client = await prisma.client.findUnique({
    where: { id: body.clientId },
    include: { accounts: true, liabilities: true },
  })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Server-side canonical values from client profile (never trust client calc)
  const inflowMonthly = client.monthlySalaryC1 + (client.isMarried ? client.monthlySalaryC2 : 0)
  const outflowMonthly = client.monthlyExpenseBudget
  const excessMonthly = calcExcess(inflowMonthly, outflowMonthly)
  const privateReserveTarget = calcPrivateReserveTarget(outflowMonthly, client.insuranceDeductibles)

  // Account balance entries from payload
  const accountBalances: Array<{
    accountId: string
    balance: number
    cashBalance: number | null
    asOfDate: string
  }> = Array.isArray(body.accountBalances) ? body.accountBalances : []

  const getBalance = (accountId: string) =>
    accountBalances.find(b => b.accountId === accountId)?.balance ?? 0

  const c1RetIds = client.accounts
    .filter(a => a.owner === 'client1' && a.category === 'retirement')
    .map(a => a.id)
  const c2RetIds = client.accounts
    .filter(a => a.owner === 'client2' && a.category === 'retirement')
    .map(a => a.id)
  const nonRetIds = client.accounts
    .filter(a => a.category === 'non-retirement')
    .map(a => a.id)

  const retirementTotalC1 = calcRetirementTotal(c1RetIds.map(getBalance))
  const retirementTotalC2 = calcRetirementTotal(c2RetIds.map(getBalance))
  const nonRetirementTotal = calcNonRetirementTotal(nonRetIds.map(getBalance))

  const trustValueThisQuarter =
    typeof body.trustValueThisQuarter === 'number' ? body.trustValueThisQuarter : 0
  const grandTotalNetWorth = calcGrandTotalNetWorth(
    retirementTotalC1,
    retirementTotalC2,
    nonRetirementTotal,
    trustValueThisQuarter
  )

  const liabilityBalances: Array<{ liabilityId: string; balance: number }> = Array.isArray(
    body.liabilityBalances
  )
    ? body.liabilityBalances
    : []
  const totalLiabilities = calcTotalLiabilities(liabilityBalances.map(l => l.balance))

  const report = await prisma.quarterlyReport.create({
    data: {
      clientId: body.clientId,
      reportDate: body.reportDate,
      quarterLabel: body.quarterLabel,
      inflowMonthly,
      outflowMonthly,
      excessMonthly,
      privateReserveBalance: Number(body.privateReserveBalance),
      privateReserveTarget,
      investmentAccountBalance: Number(body.investmentAccountBalance ?? 0),
      trustValueThisQuarter,
      retirementTotalC1,
      retirementTotalC2,
      nonRetirementTotal,
      grandTotalNetWorth,
      totalLiabilities,
      accountBalancesJson: JSON.stringify(accountBalances),
      liabilityBalancesJson: JSON.stringify(liabilityBalances),
    },
  })

  return NextResponse.json({ reportId: report.id }, { status: 201 })
}
