import { type NextRequest, NextResponse } from "next/server"


export async function GET(request: NextRequest) {
  // Redirigir directamente al dashboard
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
