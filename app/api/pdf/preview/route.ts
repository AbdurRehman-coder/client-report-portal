import { NextResponse } from 'next/server'

export async function GET() {
  // PDF HTML template preview — implemented in Prompt 4
  return NextResponse.json({ message: 'PDF preview — coming in Prompt 4' })
}
