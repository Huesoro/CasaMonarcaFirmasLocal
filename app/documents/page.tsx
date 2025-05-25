"use client"

import { useState, useEffect } from "react"
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

// Define el tipo de documento según la base de datos
interface Documento {
  doc_id: number
  title: string
  sharepoint_url: string
  Type: string
  status: string
  user_id: number
  created_at: string
  updated_at: string
}

export default function Documents() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [firmas, setFirmas] = useState<any[]>([])
  const [loadingFirmas, setLoadingFirmas] = useState(false)

  // Cargar documentos según la pestaña
  const fetchDocuments = async (tab = activeTab) => {
    setLoading(true)
    try {
      let docs = []
      if (tab === "pending" && user) {
        const res = await fetch(`http://localhost:8000/api/documentos/pendientes?user_id=${user.user_id}&rol=${user.role}`)
        const data = await res.json()
        docs = data.documentos || []
      } else if (tab === "all") {
        const res = await fetch("http://localhost:8000/api/historial-donaciones")
        const data = await res.json()
        docs = data.donaciones || []
      } else if (user) {
        // Para firmados y rechazados, filtra los documentos pendientes por status
        const res = await fetch(`http://localhost:8000/api/documentos/pendientes?user_id=${user.user_id}&rol=${user.role}`)
        const data = await res.json()
        docs = (data.documentos || []).filter(doc => doc.status === tab)
      }
      setDocuments(docs)
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments(activeTab)
    // eslint-disable-next-line
  }, [activeTab, user])

  // Cargar historial de firmas solo si es admin y hay documento seleccionado
  useEffect(() => {
    if (user?.role === "admin" && selectedDocument) {
      setLoadingFirmas(true)
      fetch(`http://localhost:8000/api/documentos/firmas/${selectedDocument.doc_id}`)
        .then(res => res.json())
        .then(data => setFirmas(data.firmas || []))
        .finally(() => setLoadingFirmas(false))
    } else {
      setFirmas([])
    }
  }, [selectedDocument, user])

  if (!user) {
    return <div>Cargando...</div>
  }

  const filteredDocuments = documents.filter((doc) => {
    if (activeTab === "all") {
      if (user?.role === "finance") return doc.Type === "dinero"
      if (user?.role === "inventory") return doc.Type === "especie"
      return true
    }
    if (user?.role === "finance") return doc.Type === "dinero" && doc.status === activeTab
    if (user?.role === "inventory") return doc.Type === "especie" && doc.status === activeTab
    return doc.status === activeTab
  })

  const handleSignDocument = async (doc: any) => {
    const password = prompt("Introduce tu contraseña de firma:")
    if (!password) return
    setIsSigning(true)
    try {
      const res = await fetch("http://localhost:8000/api/documentos/firmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_id: doc.doc_id,
          user_id: user.user_id,
          rol: user.role,
        }),
      })
      const data = await res.json()
      if (data.status === "success") {
        toast({ title: "Documento firmado", description: "El documento ha sido firmado exitosamente." })
        setIsDialogOpen(false)
        fetchDocuments(activeTab)
      } else {
        toast({ title: "Error", description: data.message || "No se pudo firmar el documento.", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Error de red al firmar el documento.", variant: "destructive" })
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
          {loading ? (
            <div className="text-center py-10">Cargando documentos...</div>
          ) : filteredDocuments.length === 0 ? (
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
                <Card key={doc.doc_id ?? doc.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-medium">{doc.title}</CardTitle>
                      <div>{getStatusIcon(doc.status)}</div>
                    </div>
                    <CardDescription>Creado por: {doc.creador_nombre}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        Fecha: {new Date(doc.created_at ?? doc.date).toLocaleDateString()}
                      </span>
                      <span className="capitalize">Tipo: {doc.Type === "dinero" ? "Dinero" : "Insumos"}</span>
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
                  Creado por usuario ID: {selectedDocument.user_id} el {new Date(selectedDocument.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[60vh] overflow-y-auto rounded-md border p-4">
                {selectedDocument && (
                  (() => {
                    const fileUrl = `/api/documents/download/${selectedDocument.doc_id}`;
                    const isPDF = selectedDocument.sharepoint_url.toLowerCase().endsWith('.pdf');
                    const isDocx = selectedDocument.sharepoint_url.toLowerCase().endsWith('.docx');
                    if (isPDF) {
                      return (
                        <iframe
                          src={fileUrl}
                          title="Vista previa del documento PDF"
                          width="100%"
                          height="500px"
                          style={{ border: 'none' }}
                        />
                      );
                    } else if (isDocx) {
                      // Usar Google Docs Viewer para .docx
                      const googleViewer = `https://docs.google.com/gview?url=${window.location.origin}${fileUrl}&embedded=true`;
                      return (
                        <iframe
                          src={googleViewer}
                          title="Vista previa del documento Word"
                          width="100%"
                          height="500px"
                          style={{ border: 'none' }}
                        />
                      );
                    } else {
                      return <div>No se puede previsualizar este tipo de archivo.</div>;
                    }
                  })()
                )}
              </div>

              <DialogFooter className="flex items-center justify-between sm:justify-between">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (selectedDocument) {
                      window.open(`http://localhost:8000/api/documents/download/${selectedDocument.doc_id}`, "_blank");
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
                {selectedDocument.status === "pending" && (
                  <Button onClick={() => handleSignDocument(selectedDocument)} disabled={isSigning} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {isSigning ? "Firmando..." : "Firmar Documento"}
                  </Button>
                )}
              </DialogFooter>

              {user?.role === "admin" && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Historial de firmas</h3>
                  {loadingFirmas ? (
                    <div>Cargando historial...</div>
                  ) : (
                    <ul className="space-y-2">
                      {firmas.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500">Paso {f.orden}:</span>
                          <span className="font-semibold">{f.nombre || <em>Pendiente</em>}</span>
                          <span className="text-xs">({f.rol})</span>
                          <span className={`text-xs ${f.status === 'firmado' ? 'text-green-600' : f.status === 'pendiente' ? 'text-yellow-600' : 'text-red-600'}`}>{f.status}</span>
                          {f.fecha_firma && <span className="text-xs text-gray-400 ml-2">{new Date(f.fecha_firma).toLocaleString()}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
