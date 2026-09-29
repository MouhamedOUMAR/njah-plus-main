import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const SIZES: Record<string, number> = { '192': 192, '512': 512 }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: sizeParam } = await params
  const size = SIZES[sizeParam] ?? 192

  return NextResponse.redirect(new URL(`/icon-${size}.png`, _req.url), 308)
}
