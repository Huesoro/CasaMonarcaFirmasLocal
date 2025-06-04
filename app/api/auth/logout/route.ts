import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  // Clear user cookie
  cookies().delete("user")

  return NextResponse.json({ success: true })
}
