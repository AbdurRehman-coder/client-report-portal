import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const accounts = await prisma.account.findMany({ where: { clientId: id } })
  return NextResponse.json(accounts)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const account = await prisma.account.create({ data: { ...body, clientId: id } })
  return NextResponse.json(account, { status: 201 })
}
