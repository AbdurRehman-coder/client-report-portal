import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcAge } from '@/lib/calculations'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      accounts: true,
      liabilities: true,
      reports: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { accounts = [], liabilities = [], ...clientData } = body

    const c1Age = clientData.c1Dob ? calcAge(clientData.c1Dob) : undefined
    const c2Age = clientData.c2Dob ? calcAge(clientData.c2Dob) : undefined

    // Separate existing (have id) from new accounts/liabilities
    const existingAccounts = accounts.filter((a: Record<string, unknown>) => a.id)
    const newAccounts = accounts.filter((a: Record<string, unknown>) => !a.id)
    const existingLiabilities = liabilities.filter((l: Record<string, unknown>) => l.id)
    const newLiabilities = liabilities.filter((l: Record<string, unknown>) => !l.id)

    // Determine which IDs to delete (in DB but not in payload)
    const payloadAccountIds = new Set(existingAccounts.map((a: Record<string, unknown>) => a.id as string))
    const payloadLiabilityIds = new Set(existingLiabilities.map((l: Record<string, unknown>) => l.id as string))

    const [dbAccounts, dbLiabilities] = await Promise.all([
      prisma.account.findMany({ where: { clientId: id }, select: { id: true } }),
      prisma.liability.findMany({ where: { clientId: id }, select: { id: true } }),
    ])

    const accountIdsToDelete = dbAccounts.map(a => a.id).filter(aid => !payloadAccountIds.has(aid))
    const liabilityIdsToDelete = dbLiabilities.map(l => l.id).filter(lid => !payloadLiabilityIds.has(lid))

    const client = await prisma.$transaction(async (tx) => {
      // Delete removed accounts/liabilities
      if (accountIdsToDelete.length) await tx.account.deleteMany({ where: { id: { in: accountIdsToDelete } } })
      if (liabilityIdsToDelete.length) await tx.liability.deleteMany({ where: { id: { in: liabilityIdsToDelete } } })

      // Update existing accounts
      for (const acct of existingAccounts) {
        const { id: acctId, localId: _lid, ...data } = acct as Record<string, unknown>
        await tx.account.update({ where: { id: acctId as string }, data })
      }

      // Update existing liabilities
      for (const liab of existingLiabilities) {
        const { id: liabId, localId: _lid, ...data } = liab as Record<string, unknown>
        await tx.liability.update({ where: { id: liabId as string }, data })
      }

      // Create new accounts/liabilities
      const cleanNewAccounts = newAccounts.map(({ localId: _lid, ...rest }: Record<string, unknown>) => ({ ...rest, clientId: id }))
      const cleanNewLiabilities = newLiabilities.map(({ localId: _lid, ...rest }: Record<string, unknown>) => ({ ...rest, clientId: id }))

      if (cleanNewAccounts.length) await tx.account.createMany({ data: cleanNewAccounts })
      if (cleanNewLiabilities.length) await tx.liability.createMany({ data: cleanNewLiabilities })

      // Update client
      return tx.client.update({
        where: { id },
        data: {
          ...clientData,
          ...(c1Age !== undefined && { c1Age }),
          ...(c2Age !== undefined && { c2Age }),
        },
        include: { accounts: true, liabilities: true },
      })
    })

    return NextResponse.json(client)
  } catch (err) {
    console.error('[PUT /api/clients/[id]]', err)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/clients/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
