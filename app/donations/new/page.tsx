"use client"

import React, { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"

export default function NewDonation() {
  const { user } = useAuth()
  const router = useRouter()
  const [donationType, setDonationType] = useState("money")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user && !["finance", "reception"].includes(user.role)) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user) return <div>Cargando...</div>
  if (user && !["finance", "reception"].includes(user.role)) return <div>Redirigiendo...</div>

  const isFinance = user.role === "finance"
  const isReception = user.role === "reception"

  const donorNameRef = useRef<HTMLInputElement>(null)
  const donationDateRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const suppliesDescriptionRef = useRef<HTMLTextAreaElement>(null)
  const quantityRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      let datos: any = {
        "{fecha_donacion}": donationDateRef.current?.value,
        "{nombre_donante}": donorNameRef.current?.value,
      }

      if (donationType === "money") {
        datos["{monto_donado}"] = amountRef.current?.value
      } else {
        datos["{lista_articulos}"] = suppliesDescriptionRef.current?.value
        datos["cantidad"] = quantityRef.current?.value
      }

      const user_id = user.user_id || 1
      const res = await fetch("http://localhost:8000/api/crear-donacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datos, user_id }),
      })

      const result = await res.json()
      if (result.status === "success") {
        toast({
          title: "Documento generado exitosamente",
          description: "El documento ha sido creado y está pendiente de firma.",
        })

        setTimeout(() => {
          router.push("/documents")
        }, 2000)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar la donación. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Registrar Nueva Donación</h1>
        <p className="text-muted-foreground">Complete el formulario para registrar una nueva donación</p>
      </div>

      <Tabs defaultValue="money" onValueChange={setDonationType} value={isFinance ? "money" : donationType}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="money">Donación de Dinero</TabsTrigger>
          {isReception && <TabsTrigger value="supplies">Donación de Insumos</TabsTrigger>}
        </TabsList>

        <form onSubmit={handleSubmit}>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos de la donación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="donor-name">Nombre del Donante</Label>
                  <Input id="donor-name" placeholder="Nombre completo" required ref={donorNameRef} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="donation-date">Fecha de Donación</Label>
                <Input id="donation-date" type="date" required ref={donationDateRef} />
              </div>

              <TabsContent value="money" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input id="amount" type="number" min="0" step="0.01" placeholder="0.00" required ref={amountRef} />
                </div>
              </TabsContent>

              {isReception && (
                <TabsContent value="supplies" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplies-description">Descripción de Insumos</Label>
                    <Textarea
                      id="supplies-description"
                      placeholder="Detalle los insumos donados"
                      className="min-h-[100px]"
                      required
                      ref={suppliesDescriptionRef}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input id="quantity" type="number" min="1" placeholder="1" required ref={quantityRef} />
                  </div>
                </TabsContent>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Procesando..." : "Generar Documento"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Tabs>
    </div>
  )
}





