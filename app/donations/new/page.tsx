"use client"

import type React from "react"

import { useState } from "react"
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

  // Check if user has permission to access this page
  if (user && !["finance", "reception", "admin"].includes(user.role)) {
    router.push("/dashboard")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call to create donation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Donación registrada",
        description: "El documento ha sido generado y está pendiente de firma.",
      })

      router.push("/documents")
    } catch (error) {
      console.error("Error al registrar la donación:", error)
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

      <Tabs defaultValue="money" onValueChange={setDonationType}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="money">Donación de Dinero</TabsTrigger>
          <TabsTrigger value="supplies">Donación de Insumos</TabsTrigger>
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
                  <Input id="donor-name" placeholder="Nombre completo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donor-email">Correo Electrónico</Label>
                  <Input id="donor-email" type="email" placeholder="correo@ejemplo.com" required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="donation-date">Fecha de Donación</Label>
                  <Input id="donation-date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donation-purpose">Propósito de la Donación</Label>
                  <Select required>
                    <SelectTrigger id="donation-purpose">
                      <SelectValue placeholder="Seleccionar propósito" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Apoyo General</SelectItem>
                      <SelectItem value="specific-project">Proyecto Específico</SelectItem>
                      <SelectItem value="emergency">Emergencia</SelectItem>
                      <SelectItem value="campaign">Campaña</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="money" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" type="number" min="0" step="0.01" placeholder="0.00" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select required>
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mxn">Peso Mexicano (MXN)</SelectItem>
                        <SelectItem value="usd">Dólar Estadounidense (USD)</SelectItem>
                        <SelectItem value="eur">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-method">Método de Pago</Label>
                  <RadioGroup defaultValue="transfer" className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="transfer" id="transfer" />
                      <Label htmlFor="transfer">Transferencia Bancaria</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash">Efectivo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="check" id="check" />
                      <Label htmlFor="check">Cheque</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other-payment" />
                      <Label htmlFor="other-payment">Otro</Label>
                    </div>
                  </RadioGroup>
                </div>
              </TabsContent>

              <TabsContent value="supplies" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="supplies-description">Descripción de Insumos</Label>
                  <Textarea
                    id="supplies-description"
                    placeholder="Detalle los insumos donados"
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input id="quantity" type="number" min="1" placeholder="1" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated-value">Valor Estimado</Label>
                    <Input id="estimated-value" type="number" min="0" step="0.01" placeholder="0.00" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Estado de los Insumos</Label>
                  <Select required>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Nuevo</SelectItem>
                      <SelectItem value="used-good">Usado - Buen estado</SelectItem>
                      <SelectItem value="used-fair">Usado - Estado regular</SelectItem>
                      <SelectItem value="refurbished">Reacondicionado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea id="notes" placeholder="Información adicional relevante" className="min-h-[80px]" />
              </div>
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
