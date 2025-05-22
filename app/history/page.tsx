"use client"

import { useState } from "react"
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

// Mock data for donation history
const mockDonations = [
  {
    id: "don-001",
    title: "Donación de Alimentos - Fundación Ayuda",
    type: "supplies",
    date: "2023-05-15",
    status: "completed",
    amount: null,
    items: "50 kg de alimentos no perecederos",
    donor: "Fundación Ayuda",
  },
  {
    id: "don-002",
    title: "Donación Monetaria - Empresa XYZ",
    type: "money",
    date: "2023-05-10",
    status: "completed",
    amount: 15000,
    items: null,
    donor: "Empresa XYZ",
  },
  {
    id: "don-003",
    title: "Donación de Medicamentos - Farmacia ABC",
    type: "supplies",
    date: "2023-05-05",
    status: "completed",
    amount: null,
    items: "Medicamentos varios",
    donor: "Farmacia ABC",
  },
  {
    id: "don-004",
    title: "Donación Monetaria - Donante Anónimo",
    type: "money",
    date: "2023-04-28",
    status: "completed",
    amount: 5000,
    items: null,
    donor: "Anónimo",
  },
  {
    id: "don-005",
    title: "Donación de Ropa - Tienda de Ropa XYZ",
    type: "supplies",
    date: "2023-04-20",
    status: "completed",
    amount: null,
    items: "100 prendas de vestir",
    donor: "Tienda de Ropa XYZ",
  },
  {
    id: "don-006",
    title: "Donación Monetaria - Empresa ABC",
    type: "money",
    date: "2023-04-15",
    status: "completed",
    amount: 20000,
    items: null,
    donor: "Empresa ABC",
  },
  {
    id: "don-007",
    title: "Donación de Útiles Escolares - Papelería XYZ",
    type: "supplies",
    date: "2023-04-10",
    status: "completed",
    amount: null,
    items: "Útiles escolares para 50 niños",
    donor: "Papelería XYZ",
  },
  {
    id: "don-008",
    title: "Donación Monetaria - Fundación ABC",
    type: "money",
    date: "2023-04-05",
    status: "completed",
    amount: 10000,
    items: null,
    donor: "Fundación ABC",
  },
]

export default function History() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedDonation, setSelectedDonation] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (!user) {
    return <div>Cargando...</div>
  }

  // Filter donations based on search term and type filter
  const filteredDonations = mockDonations.filter((donation) => {
    const matchesSearch =
      donation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.donor.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                {filteredDonations.length === 0 ? (
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
                        {donation.type === "money" ? `$${donation.amount?.toLocaleString()} MXN` : donation.items}
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
