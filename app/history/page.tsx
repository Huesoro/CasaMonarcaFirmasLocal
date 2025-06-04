"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Filter } from "lucide-react"

function parseFilename(name: string) {
  const baseName = name.replace(".docx", "")
  const parts = baseName.split("_")
  const rawType = parts[3]?.toLowerCase() || "otro"
  const validType = ["monetaria", "insumos"].includes(rawType) ? rawType : null

  return {
    title: parts[0] || "Sin título",
    donor: parts[1] || "Desconocido",
    date: parts[2] || "Sin fecha",
    type: validType,
  }
}

export default function History() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("desc") // NUEVO: orden por fecha
  const [donations, setDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocs() {
      setLoading(true)
      try {
        const res = await fetch("/api/sharepoint/docs")
        const files = await res.json()
        const parsedDocs = files.map((doc: any) => {
          const meta = parseFilename(doc.name)
          return {
            ...meta,
            url: doc.url,
            id: doc.name,
          }
        })
        setDonations(parsedDocs)
      } catch (e) {
        setDonations([])
      } finally {
        setLoading(false)
      }
    }
    fetchDocs()
  }, [])

  if (!user) return <div>Cargando...</div>

  const filteredDonations = donations
    .filter((donation) => {
      if (!["monetaria", "insumos"].includes(donation.type)) return false

      const search = searchTerm.toLowerCase()
      const matchesSearch =
        donation.title.toLowerCase().includes(search) ||
        donation.donor.toLowerCase().includes(search) ||
        donation.type.toLowerCase().includes(search)

      const matchesType = typeFilter === "all" || donation.type === typeFilter

      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return sortOrder === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime()
    })

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Historial de Donaciones</h1>
        <p className="text-muted-foreground">Consulta el registro histórico de todas las donaciones</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Donaciones Registradas</CardTitle>
          <CardDescription>Documentos leídos desde SharePoint/Historial</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Filtro de búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, donante o tipo..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtro de tipo */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo de donación" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="monetaria">Monetaria</SelectItem>
                <SelectItem value="insumos">Insumos</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de orden */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Ordenar por fecha" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Más recientes primero</SelectItem>
                <SelectItem value="asc">Más antiguos primero</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Donante</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Cargando donaciones...
                    </TableCell>
                  </TableRow>
                ) : filteredDonations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No se encontraron donaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDonations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="font-medium">{donation.title}</TableCell>
                      <TableCell>{donation.donor}</TableCell>
                      <TableCell>{donation.date}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{donation.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <a href={donation.url} download className="text-blue-600 underline">
                          Descargar
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}