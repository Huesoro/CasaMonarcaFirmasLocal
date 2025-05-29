"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, DollarSign, History, FileSignature, User } from "lucide-react"

export default function Dashboard() {
  const { user, logout } = useAuth()

  // Define dashboard cards based on user role
  const getDashboardCards = () => {
    const cards = [
      {
        title: "Registrar Donación",
        description: "Crear un nuevo registro de donación",
        icon: <FileText className="h-6 w-6" />,
        href: "/donations/new",
        roles: ["finance", "reception","inventory"],
      },
      {
        title: "Documentos Pendientes",
        description: "Documentos que requieren tu firma",
        icon: <FileSignature className="h-6 w-6" />,
        href: "/documents",
        roles: ["finance", "legal", "executive", "admin","reception","inventory"],
      },
      /*{
        title: "Historial de Donaciones",
        description: "Consulta el registro histórico de donaciones",
        icon: <History className="h-6 w-6" />,
        href: "/history",
        roles: ["finance", "reception", "legal", "executive", "admin"],
      },*/
      {
        title: "Reportes",
        description: "Visualiza reportes y estadísticas",
        icon: <DollarSign className="h-6 w-6" />,
        href: "/reports",
        roles: ["executive", "finance", "admin"],
      },
      {
        title: "Gestión de Usuarios",
        description: "Crear y administrar usuarios del sistema",
        icon: <User className="h-6 w-6" />,
        href: "/users/new",
        roles: ["admin"],
      },
    ]

    if (!user) return []
    return cards.filter((card) => card.roles.includes(user.role))
  }

  if (!user) {
    return <div>Cargando...</div>
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bienvenido, {user.name}</h1>
        <p className="text-muted-foreground">Panel de control de Casa Monarca</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {getDashboardCards().map((card, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">{card.title}</CardTitle>
              <div className="text-primary">{card.icon}</div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.description}</p>
              <Button asChild className="mt-4 w-full">
                <Link href={card.href}>Acceder</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/*<Button onClick={logout} className="mt-4 w-full">Cerrar sesión</Button>*/}
    </div>
  )
}
