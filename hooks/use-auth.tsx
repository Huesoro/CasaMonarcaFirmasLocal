"use client"

import { useAuth as useAuthHook } from "@/components/auth-provider"

// Re-export the hook from the auth provider
export const useAuth = useAuthHook
