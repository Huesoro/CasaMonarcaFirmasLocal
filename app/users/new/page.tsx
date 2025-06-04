"use client"

import React, { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NewUser() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [firmaFile, setFirmaFile] = useState<File | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("")

  // Solo admin puede acceder
  if (!user || user.role !== "admin") {
    router.push("/dashboard")
    return null
  }

  const emailRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // 1. Crear usuario
      const res = await fetch("http://localhost:8000/api/crear-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailRef.current?.value,
          nombre: nameRef.current?.value,
          password: passwordRef.current?.value,
          role: selectedRole,
        }),
      })
      const result = await res.json()
      if (result.status === "success") {
        // 2. Subir firma si hay archivo
        if (firmaFile && emailRef.current?.value) {
          const formData = new FormData()
          formData.append("firma", firmaFile)
          formData.append("email", emailRef.current.value)
          const uploadRes = await fetch("http://localhost:8000/api/upload-firma", {
            method: "POST",
            body: formData,
          })
          const uploadResult = await uploadRes.json()
          if (uploadResult.status !== "success") {
            toast({ title: "Usuario creado", description: "No se pudo subir la firma.", variant: "destructive" })
            setIsSubmitting(false)
            return
          }
        }
        toast({ title: "Usuario creado", description: result.message })
        router.push("/users")
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo crear el usuario.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Registrar Nuevo Usuario</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" required ref={emailRef} />
        </div>
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" required ref={nameRef} />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" required ref={passwordRef} />
        </div>
        <div>
          <Label htmlFor="role">Rol</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="finance">Finanzas</SelectItem>
              <SelectItem value="reception">Recepción</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="inventory">Inventario</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="firma">Firma (imagen PNG/JPG)</Label>
          <Input id="firma" type="file" accept="image/*" onChange={e => setFirmaFile(e.target.files?.[0] || null)} />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear Usuario"}
        </Button>
      </form>
    </div>
  )
} 