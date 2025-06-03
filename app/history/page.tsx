"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Download, FileText, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function History() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedDonation, setSelectedDonation] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [donations, setDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDonations() {
      setLoading(true)
      try {
        const res = await fetch("/api/historial-donaciones")
        const data = await res.json()
        setDonations(data.donaciones || [])
      } catch (e) {
        setDonations([])
      } finally {
        setLoading(false)
      }
    }
    fetchDonations()
  }, [])

  if (!user) {
    return <div>Cargando...</div>
  }

  // Filtrar donaciones según búsqueda y tipo
  const filteredDonations = donations.filter((donation) => {
    const matchesSearch =
      donation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donation.donor && donation.donor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (donation.items && donation.items.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = typeFilter === "all" || donation.type === typeFilter

    return matchesSearch && matchesType
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
          <CardDescription>Historial completo de donaciones recibidas por Casa Monarca</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, donante o descripción..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo de donación" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="money">Monetaria</SelectItem>
                <SelectItem value="supplies">Insumos</SelectItem>
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
                  <TableHead>Detalles</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Cargando donaciones...
                    </TableCell>
                  </TableRow>
                ) : filteredDonations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron donaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDonations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="font-medium">{donation.title}</TableCell>
                      <TableCell>{donation.donor}</TableCell>
                      <TableCell>{new Date(donation.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={donation.type === "money" ? "default" : "secondary"}>
                          {donation.type === "money" ? "Monetaria" : "Insumos"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {donation.type === "money"
                          ? `$${donation.amount?.toLocaleString()} MXN`
                          : donation.items}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDonation(donation)
                                setIsDialogOpen(true)
                              }}
                            >
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Descargar documento
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Donation Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedDonation && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDonation.title}</DialogTitle>
                <DialogDescription>
                  Donación registrada el {new Date(selectedDonation.date).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[60vh] overflow-y-auto rounded-md border p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Donante</h3>
                      <p className="text-lg">{selectedDonation.donor}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Fecha</h3>
                      <p className="text-lg">{new Date(selectedDonation.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Tipo de Donación</h3>
                      <p className="text-lg">
                        <Badge variant={selectedDonation.type === "money" ? "default" : "secondary"}>
                          {selectedDonation.type === "money" ? "Monetaria" : "Insumos"}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Estado</h3>
                      <p className="text-lg">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Completada
                        </Badge>
                      </p>
                    </div>
                  </div>

                  {selectedDonation.type === "money" ? (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Monto</h3>
                      <p className="text-lg">${selectedDonation.amount?.toLocaleString()} MXN</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Descripción de Insumos</h3>
                      <p className="text-lg">{selectedDonation.items}</p>
                    </div>
                  )}

                  <div className="rounded-md bg-muted p-4">
                    <h3 className="mb-2 font-medium">Documento Firmado</h3>
                    <p className="text-sm text-muted-foreground">
                      Este documento ha sido firmado digitalmente y está almacenado de forma segura en SharePoint. Puede
                      descargar una copia del documento utilizando el botón de descarga.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Descargar Documento
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
