"use client"

import React, { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"

export default function NewDonation() {
  const { user } = useAuth()
  const router = useRouter()
  const [donationType, setDonationType] = useState("money")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refs para campos generales
  const donorNameRef = useRef<HTMLInputElement>(null)
  const donorEmailRef = useRef<HTMLInputElement>(null)
  const donationDateRef = useRef<HTMLInputElement>(null)

  // Refs para dinero
  const amountRef = useRef<HTMLInputElement>(null)

  // Refs para insumos
  const suppliesDescriptionRef = useRef<HTMLTextAreaElement>(null)
  const quantityRef = useRef<HTMLInputElement>(null)

  // Check if user has permission to access this page
  if (user && !["finance", "reception"].includes(user.role)) {
    router.push("/dashboard")
    return null
  }

  // Si el usuario es finanzas, solo puede registrar dinero
  const isFinance = user?.role === "finance"
  const isReception = user?.role === "reception"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Construir datos para el backend
      let datos: any = {
        "{fecha_donacion}": donationDateRef.current?.value,
        "{nombre_donante}": donorNameRef.current?.value,
        "{correo_donante}": donorEmailRef.current?.value,
      }
      if (donationType === "money") {
        datos["{monto_donado}"] = amountRef.current?.value
      } else {
        datos["{lista_articulos}"] = suppliesDescriptionRef.current?.value
        datos["cantidad"] = quantityRef.current?.value
      }
      const user_id = user?.user_id || 1
      const res = await fetch("http://localhost:8000/api/crear-donacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datos, user_id }),
      })
      const result = await res.json()
      if (result.status === "success") {
      toast({
        title: "Donación registrada",
        description: "El documento ha sido generado y está pendiente de firma.",
      })
      router.push("/documents")
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
          {/* Solo mostrar la pestaña de insumos si es recepción */}
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
                <div className="space-y-2">
                  <Label htmlFor="donor-email">Correo Electrónico</Label>
                  <Input id="donor-email" type="email" placeholder="correo@ejemplo.com" required ref={donorEmailRef} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="donation-date">Fecha de Donación</Label>
                  <Input id="donation-date" type="date" required ref={donationDateRef} />
                </div>
              </div>

              <TabsContent value="money" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" type="number" min="0" step="0.01" placeholder="0.00" required ref={amountRef} />
                  </div>
                </div>
              </TabsContent>

              {/* Solo mostrar el formulario de insumos si es recepción */}
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                      <Input id="quantity" type="number" min="1" placeholder="1" required ref={quantityRef} />
                  </div>
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
