import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const userCookie = cookies().get("user")

  if (!userCookie) {
    return NextResponse.json({ user: null })
  }

  try {
    const user = JSON.parse(userCookie.value)
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Failed to parse user cookie:", error)
    return NextResponse.json({ user: null })
  }
}
