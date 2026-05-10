import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcAge } from '@/lib/calculations'

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      accounts: true,
      liabilities: true,
      reports: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
  return NextResponse.json(clients)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { accounts = [], liabilities = [], ...clientData } = body

    const c1Age = clientData.c1Dob ? calcAge(clientData.c1Dob) : 0
    const c2Age = clientData.c2Dob ? calcAge(clientData.c2Dob) : undefined

    // Strip any id fields from incoming nested data
    const cleanAccounts = accounts.map(({ id: _id, localId: _lid, ...rest }: Record<string, unknown>) => rest)
    const cleanLiabilities = liabilities.map(({ id: _id, localId: _lid, ...rest }: Record<string, unknown>) => rest)

    const client = await prisma.client.create({
      data: {
        ...clientData,
        c1Age,
        ...(c2Age !== undefined && { c2Age }),
        accounts: { create: cleanAccounts },
        liabilities: { create: cleanLiabilities },
      },
      include: { accounts: true, liabilities: true },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (err) {
    console.error('[POST /api/clients]', err)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
