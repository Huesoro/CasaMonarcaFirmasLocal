import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// This is a placeholder for the actual Azure AD authentication callback
// In a real implementation, you would validate the token and extract user information
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/?error=no_token", request.url))
  }

  // In a real implementation, you would validate the token and extract user information
  // For demo purposes, we'll just set a mock user in a cookie

  const mockUser = {
    id: "user123",
    name: "Demo Usuario",
    email: "demo@casamonarca.org",
    role: "finance", // Could be: executive, finance, reception, legal, admin
  }

  // Set user cookie
  cookies().set("user", JSON.stringify(mockUser), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  })

  // Redirect to dashboard
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
