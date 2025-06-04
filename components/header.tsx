"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserCircle, Menu, X } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"


export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const navigation = [
    { name: "Inicio", href: "/dashboard" },
    /*{ name: "Donaciones", href: "/donations" },
    { name: "Documentos", href: "/documents" },*/
    { name: "Historial", href: "/history" },
  ]

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center">
            <span className="text-xl font-bold">Casa Monarca</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        {user && (
          <nav className="hidden md:flex md:items-center md:space-x-4 lg:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center">
          {user ? (
            <>
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <UserCircle className="h-6 w-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <span>{user.name}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span className="text-xs text-muted-foreground capitalize">Rol: {user.role}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { logout(); router.push("/") }}>Cerrar sesión</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile menu */}
              <div className="md:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <div className="flex flex-col space-y-4 py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Menu</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                          <X className="h-6 w-6" />
                        </Button>
                      </div>
                      <div className="flex flex-col space-y-3">
                        {navigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="text-sm font-medium transition-colors hover:text-primary"
                            onClick={() => setIsOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex flex-col space-y-2">
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                          <div className="text-xs text-muted-foreground capitalize">Rol: {user.role}</div>
                        </div>
                        <Button
                          variant="ghost"
                          className="mt-4 w-full justify-start px-2"
                          onClick={() => {
                            logout()
                            setIsOpen(false)
                          }}
                        >
                          Cerrar sesión
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/api/auth/login">Iniciar sesión</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
