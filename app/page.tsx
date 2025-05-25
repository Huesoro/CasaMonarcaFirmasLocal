"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("http://localhost:8000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.status === "success") {
      login(data.user)
      router.push("/dashboard")
    } else {
      setError(data.message || "Error al iniciar sesión")
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col items-center justify-center space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Casa Monarca</h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
            Plataforma para la gestión y documentación digital de donaciones
          </p>
        </div>

        <div className="w-full max-w-4xl">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="about">Acerca de</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Iniciar Sesión</CardTitle>
                  <CardDescription>Accede a la plataforma utilizando tu cuenta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                    {error && <div className="text-red-500">{error}</div>}
                    <Button type="submit" size="lg" disabled={loading}>
                      {loading ? "Ingresando..." : "Iniciar sesión"}
                    </Button>
                  </form>
                  {/* Si quieres dejar el login de Microsoft como opción alternativa, puedes dejar el botón abajo */}
                  {/* <div className="flex justify-center">
                    <Button asChild size="lg">
                      <Link href="/api/auth/login">Iniciar sesión con Microsoft</Link>
                    </Button>
                  </div> */}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>Acerca de Casa Monarca</CardTitle>
                  <CardDescription>Nuestra misión y visión</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Casa Monarca es una organización dedicada a proporcionar ayuda y recursos a quienes más lo
                    necesitan. Nuestra plataforma digital permite gestionar de manera eficiente y transparente todas las
                    donaciones recibidas y entregadas, asegurando un proceso documentado y firmado digitalmente.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
