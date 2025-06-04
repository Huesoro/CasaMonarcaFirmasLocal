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
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Casa Monarca.</h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
            Ayuda humanitaria al migrante ABP
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
                  Somos una organización humanitaria que acoge, protege, promueve e integra a las personas migrantes, refugiadas, desplazadas y retornadas y defiende sus derechos humanos. Nuestras visión es dar una respuesta local a un problema global, una respuesta humana a una situación inhumana.
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
