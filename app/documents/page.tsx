"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Download, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Mock data for documents
const mockDocuments = [
  {
    id: "doc-001",
    title: "Donación de Alimentos - Fundación Ayuda",
    type: "supplies",
    date: "2023-05-15",
    status: "pending",
    createdBy: "Juan Pérez",
  },
  {
    id: "doc-002",
    title: "Donación Monetaria - Empresa XYZ",
    type: "money",
    date: "2023-05-10",
    status: "signed",
    createdBy: "María González",
  },
  {
    id: "doc-003",
    title: "Donación de Medicamentos - Farmacia ABC",
    type: "supplies",
    date: "2023-05-05",
    status: "pending",
    createdBy: "Carlos Rodríguez",
  },
  {
    id: "doc-004",
    title: "Donación Monetaria - Donante Anónimo",
    type: "money",
    date: "2023-04-28",
    status: "rejected",
    createdBy: "Ana López",
  },
]

export default function Documents() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSigning, setIsSigning] = useState(false)

  if (!user) {
    return <div>Cargando...</div>
  }

  const filteredDocuments = mockDocuments.filter((doc) => {
    if (activeTab === "all") return true
    return doc.status === activeTab
  })

  const handleSignDocument = async () => {
    setIsSigning(true)

    try {
      // Simulate API call to sign document
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Documento firmado",
        description: "El documento ha sido firmado exitosamente.",
      })

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error al firmar el documento:", error)
      toast({
        title: "Error",
        description: "No se pudo firmar el documento. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSigning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "signed":
        return "Firmado"
      case "pending":
        return "Pendiente"
      case "rejected":
        return "Rechazado"
      default:
        return status
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Documentos</h1>
        <p className="text-muted-foreground">Gestiona los documentos que requieren tu firma</p>
      </div>

      <Tabs defaultValue="pending" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="signed">Firmados</TabsTrigger>
          <TabsTrigger value="rejected">Rechazados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  No hay documentos {activeTab !== "all" ? getStatusText(activeTab) + "s" : ""} para mostrar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-medium">{doc.title}</CardTitle>
                      <div>{getStatusIcon(doc.status)}</div>
                    </div>
                    <CardDescription>Creado por: {doc.createdBy}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Fecha: {new Date(doc.date).toLocaleDateString()}</span>
                      <span className="capitalize">Tipo: {doc.type === "money" ? "Dinero" : "Insumos"}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDocument(doc)
                        setIsDialogOpen(true)
                      }}
                    >
                      Ver documento
                    </Button>
                    {doc.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc)
                          setIsDialogOpen(true)
                        }}
                      >
                        Firmar
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Document Preview Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDocument.title}</DialogTitle>
                <DialogDescription>
                  Creado por {selectedDocument.createdBy} el {new Date(selectedDocument.date).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[60vh] overflow-y-auto rounded-md border p-4">
                {/* Document preview would go here */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Documento de Donación</h2>
                  <p>
                    Por medio del presente documento, se hace constar la recepción de una donación
                    {selectedDocument.type === "money" ? " monetaria " : " de insumos "}
                    por parte de Casa Monarca, con fecha {new Date(selectedDocument.date).toLocaleDateString()}.
                  </p>

                  {selectedDocument.type === "money" ? (
                    <div className="space-y-2">
                      <p>
                        <strong>Tipo de donación:</strong> Monetaria
                      </p>
                      <p>
                        <strong>Monto:</strong> $10,000.00 MXN
                      </p>
                      <p>
                        <strong>Método de pago:</strong> Transferencia bancaria
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p>
                        <strong>Tipo de donación:</strong> Insumos
                      </p>
                      <p>
                        <strong>Descripción:</strong> 50 kg de alimentos no perecederos, 20 cobijas, 10 kits de higiene
                        personal
                      </p>
                      <p>
                        <strong>Valor estimado:</strong> $8,500.00 MXN
                      </p>
                    </div>
                  )}

                  <p>
                    Esta donación será utilizada exclusivamente para los fines establecidos por Casa Monarca, en
                    beneficio de las personas que reciben apoyo de nuestra organización.
                  </p>

                  <div className="mt-8 space-y-4">
                    <div className="border-t pt-4">
                      <p className="text-center">____________________________</p>
                      <p className="text-center">Firma del Donante</p>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-center">____________________________</p>
                      <p className="text-center">Firma del Representante de Casa Monarca</p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between sm:justify-between">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>

                {selectedDocument.status === "pending" && (
                  <Button onClick={handleSignDocument} disabled={isSigning} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {isSigning ? "Firmando..." : "Firmar Documento"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
