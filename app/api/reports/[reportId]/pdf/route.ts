import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePdfFromHtml, mergePdfs } from '@/lib/pdf-generator'
import { getSacsPage1Html } from '@/components/pdf-templates/sacs-page1'
import { getSacsPage2Html } from '@/components/pdf-templates/sacs-page2'
import { getTccHtml } from '@/components/pdf-templates/tcc'
import type { AccountSnapshot, LiabilitySnapshot } from '@/components/pdf-templates/tcc'
import { calcAge } from '@/lib/calculations'

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

  const client = report.client
  const reportDate = report.reportDate

  const displayName = client.isMarried
    ? `${client.c1FirstName} & ${client.c2FirstName} ${client.c1LastName}`
    : `${client.c1FirstName} ${client.c1LastName}`

  // Parse stored JSON balances
  const storedAccBalances: Array<{
    accountId: string
    balance: number
    cashBalance: number | null
    asOfDate: string
  }> = JSON.parse(report.accountBalancesJson)

  const storedLiabBalances: Array<{
    liabilityId: string
    balance: number
  }> = JSON.parse(report.liabilityBalancesJson)

  // Build account snapshots
  function buildAccountSnapshots(filterFn: (a: (typeof client.accounts)[0]) => boolean): AccountSnapshot[] {
    return client.accounts.filter(filterFn).map(acc => {
      const stored = storedAccBalances.find(b => b.accountId === acc.id)
      return {
        accountType: acc.accountType,
        institutionName: acc.institutionName ?? '',
        accountNumberLast4: acc.accountNumberLast4 ?? '',
        balance: stored?.balance ?? 0,
        cashBalance: stored?.cashBalance ?? null,
        asOfDate: stored?.asOfDate ?? reportDate,
        owner: acc.owner,
      }
    })
  }

  const retC1Snaps = buildAccountSnapshots(
    a => a.owner === 'client1' && a.category === 'retirement'
  )
  const retC2Snaps = buildAccountSnapshots(
    a => a.owner === 'client2' && a.category === 'retirement'
  )
  const nonRetSnaps = buildAccountSnapshots(a => a.category === 'non-retirement')

  const liabSnaps: LiabilitySnapshot[] = client.liabilities.map(l => {
    const stored = storedLiabBalances.find(b => b.liabilityId === l.id)
    return {
      liabilityType: l.liabilityType,
      interestRate: l.interestRate,
      balance: stored?.balance ?? l.balance,
    }
  })

  // ── SACS Page 1 data ──────────────────────────────────
  const sacsPage1Html = getSacsPage1Html({
    clientName: displayName,
    reportDate: report.quarterLabel,
    c1Name: client.c1FirstName,
    c2Name: client.isMarried ? (client.c2FirstName ?? null) : null,
    c1MonthlySalary: client.monthlySalaryC1,
    c2MonthlySalary: client.isMarried ? client.monthlySalaryC2 : 0,
    inflowMonthly: report.inflowMonthly,
    outflowMonthly: report.outflowMonthly,
    excessMonthly: report.excessMonthly,
  })

  // ── SACS Page 2 data ──────────────────────────────────
  const sacsPage2Html = getSacsPage2Html({
    clientName: displayName,
    reportDate: report.quarterLabel,
    privateReserveBalance: report.privateReserveBalance,
    privateReserveTarget: report.privateReserveTarget,
    investmentBalance: report.investmentAccountBalance,
    monthlyExpenses: report.outflowMonthly,
    insuranceDeductibles: client.insuranceDeductibles,
  })

  // ── TCC data ──────────────────────────────────────────
  const tccHtml = getTccHtml({
    clientName: displayName,
    reportDate: report.reportDate,
    reportQuarter: report.quarterLabel,
    client1: {
      firstName: client.c1FirstName,
      lastName: client.c1LastName,
      age: calcAge(client.c1Dob),
      dob: client.c1Dob,
      ssnLast4: client.c1SsnLast4,
    },
    client2: client.isMarried && client.c2FirstName && client.c2Dob && client.c2SsnLast4
      ? {
          firstName: client.c2FirstName,
          lastName: client.c2LastName ?? client.c1LastName,
          age: calcAge(client.c2Dob),
          dob: client.c2Dob,
          ssnLast4: client.c2SsnLast4,
        }
      : null,
    retirementAccountsC1: retC1Snaps,
    retirementAccountsC2: retC2Snaps,
    nonRetirementAccounts: nonRetSnaps,
    trust: client.trustEnabled && client.trustPropertyAddress
      ? {
          name: `${client.c1FirstName}${client.isMarried ? ` & ${client.c2FirstName ?? ''}` : ''} Family Trust`,
          address: client.trustPropertyAddress,
          value: report.trustValueThisQuarter,
        }
      : null,
    liabilities: liabSnaps,
    totals: {
      retirementC1: report.retirementTotalC1,
      retirementC2: report.retirementTotalC2,
      nonRetirement: report.nonRetirementTotal,
      trustValue: report.trustValueThisQuarter,
      grandTotal: report.grandTotalNetWorth,
      totalLiabilities: report.totalLiabilities,
    },
  })

  // ── Generate PDFs in parallel ─────────────────────────
  const [pdf1, pdf2, pdf3] = await Promise.all([
    generatePdfFromHtml(sacsPage1Html),
    generatePdfFromHtml(sacsPage2Html),
    generatePdfFromHtml(tccHtml),
  ])

  const merged = await mergePdfs([pdf1, pdf2, pdf3])

  const lastName = client.c1LastName.replace(/[^a-zA-Z0-9]/g, '')
  const safeQuarter = report.quarterLabel.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
  const filename = `AW_Report_${lastName}_${safeQuarter}.pdf`

  return new NextResponse(new Uint8Array(merged), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
