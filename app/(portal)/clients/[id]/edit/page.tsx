import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ClientForm from '@/components/forms/ClientForm'
import type { ClientInitialData } from '@/components/forms/ClientForm'

type Params = { params: Promise<{ id: string }> }

export default async function EditClientPage({ params }: Params) {
  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id },
    include: { accounts: true, liabilities: true },
  })

  if (!client) notFound()

  const initialData: ClientInitialData = {
    id: client.id,
    isMarried: client.isMarried,
    c1FirstName: client.c1FirstName,
    c1LastName: client.c1LastName,
    c1Dob: client.c1Dob,
    c1SsnLast4: client.c1SsnLast4,
    c2FirstName: client.c2FirstName,
    c2LastName: client.c2LastName,
    c2Dob: client.c2Dob,
    c2SsnLast4: client.c2SsnLast4,
    monthlySalaryC1: client.monthlySalaryC1,
    monthlySalaryC2: client.monthlySalaryC2,
    monthlyExpenseBudget: client.monthlyExpenseBudget,
    insuranceDeductibles: client.insuranceDeductibles,
    trustEnabled: client.trustEnabled,
    trustPropertyAddress: client.trustPropertyAddress,
    trustPropertyValue: client.trustPropertyValue,
    accounts: client.accounts.map(a => ({
      id: a.id,
      owner: a.owner,
      category: a.category,
      accountType: a.accountType,
      institutionName: a.institutionName,
      accountNumberLast4: a.accountNumberLast4,
    })),
    liabilities: client.liabilities.map(l => ({
      id: l.id,
      liabilityType: l.liabilityType,
      interestRate: l.interestRate,
      balance: l.balance,
    })),
  }

  const displayName = client.isMarried
    ? `${client.c1FirstName} & ${client.c2FirstName} ${client.c1LastName}`
    : `${client.c1FirstName} ${client.c1LastName}`

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/clients/${id}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition-colors"
          style={{ borderColor: '#E8E3D8', color: '#6B6560', backgroundColor: 'white' }}
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>Edit — {displayName}</h1>
          <p className="text-sm" style={{ color: '#6B6560' }}>Update household profile</p>
        </div>
      </div>

      <ClientForm initialData={initialData} />
    </div>
  )
}
